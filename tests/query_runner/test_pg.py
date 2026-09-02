import os
from base64 import b64encode
from unittest import TestCase
from unittest.mock import Mock, patch

import psycopg2
from rq.exceptions import ShutDownImminentException

from redash import settings
from redash.query_runner.pg import PostgreSQL, build_schema

HANDSHAKE_FAILURE = "could not send SSL negotiation packet: Resource temporarily unavailable"
AUTHENTICATION_FAILURE = 'FATAL:  password authentication failed for user "redash"'


class TestBuildSchema(TestCase):
    def test_handles_dups_between_public_and_other_schemas(self):
        results = {
            "rows": [
                {
                    "table_schema": "public",
                    "table_name": "main.users",
                    "column_name": "id",
                },
                {"table_schema": "main", "table_name": "users", "column_name": "id"},
                {"table_schema": "main", "table_name": "users", "column_name": "name"},
            ]
        }

        schema = {}

        build_schema(results, schema)

        self.assertIn("main.users", schema.keys())
        self.assertListEqual(schema["main.users"]["columns"], ["id", "name"])
        self.assertIn('public."main.users"', schema.keys())
        self.assertListEqual(schema['public."main.users"']["columns"], ["id"])

    def test_build_schema_with_data_types(self):
        results = {
            "rows": [
                {"table_schema": "main", "table_name": "users", "column_name": "id", "data_type": "integer"},
                {"table_schema": "main", "table_name": "users", "column_name": "name", "data_type": "varchar"},
            ]
        }

        schema = {}

        build_schema(results, schema)

        self.assertListEqual(
            schema["main.users"]["columns"], [{"name": "id", "type": "integer"}, {"name": "name", "type": "varchar"}]
        )


class TestOpenConnection(TestCase):
    def setUp(self):
        self.runner = PostgreSQL({"dbname": "tests"})
        sleep = patch("redash.query_runner.pg.time.sleep")
        sleep.start()
        self.addCleanup(sleep.stop)

    def test_returns_a_connection_that_opened_on_the_second_attempt(self):
        connections = [Mock(name="first"), Mock(name="second")]
        waits = [psycopg2.OperationalError(HANDSHAKE_FAILURE), None]

        with patch("redash.query_runner.pg.psycopg2.connect", side_effect=connections):
            with patch("redash.query_runner.pg._wait", side_effect=waits):
                connection = self.runner._open_connection()

        self.assertIs(connection, connections[1])

    def test_discards_the_connection_that_failed_to_open(self):
        connections = [Mock(name="first"), Mock(name="second")]
        waits = [psycopg2.OperationalError(HANDSHAKE_FAILURE), None]

        with patch("redash.query_runner.pg.psycopg2.connect", side_effect=connections):
            with patch("redash.query_runner.pg._wait", side_effect=waits):
                self.runner._open_connection()

        connections[0].close.assert_called_once_with()

    def test_reports_the_original_error_once_the_attempts_are_spent(self):
        error = psycopg2.OperationalError(AUTHENTICATION_FAILURE)

        with patch.object(settings, "PG_CONNECTION_ATTEMPTS", 3):
            with patch("redash.query_runner.pg.psycopg2.connect", return_value=Mock()) as connect:
                with patch("redash.query_runner.pg._wait", side_effect=error):
                    with self.assertRaises(psycopg2.OperationalError) as raised:
                        self.runner._open_connection()

        self.assertEqual(3, connect.call_count)
        self.assertIn("password authentication failed", str(raised.exception))

    def test_removes_the_certificate_files_of_every_failed_attempt(self):
        runner = PostgreSQL({"dbname": "tests", "sslcertFile": b64encode(b"a cert").decode()})
        written = []

        def fail_handshake(connection, timeout=None):
            written.append(runner.ssl_config["sslcert"])
            raise psycopg2.OperationalError(HANDSHAKE_FAILURE)

        with patch("redash.query_runner.pg.psycopg2.connect", return_value=Mock()):
            with patch("redash.query_runner.pg._wait", side_effect=fail_handshake):
                with self.assertRaises(psycopg2.OperationalError):
                    runner._open_connection()

        self.assertEqual(settings.PG_CONNECTION_ATTEMPTS, len(written))
        self.assertEqual([], [path for path in written if os.path.exists(path)])

    def test_abandons_the_handshake_when_the_worker_is_shutting_down(self):
        with patch.object(settings, "PG_CONNECTION_ATTEMPTS", 3):
            with patch("redash.query_runner.pg.psycopg2.connect", return_value=Mock()) as connect:
                with patch(
                    "redash.query_runner.pg._wait",
                    side_effect=ShutDownImminentException("shut down imminent", {}),
                ):
                    with self.assertRaises(ShutDownImminentException):
                        self.runner._open_connection()

        self.assertEqual(1, connect.call_count)
