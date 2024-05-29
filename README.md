# Metr Redash

<p align="center">
  <img title="Redash" src='client/app/assets/images/redash_icon_small.png'/>
</p>

This is a fork we've done to be able to customize redash as our needs and to be able to quickly
fix redash bugs when using multi organizations.

### Branches and tags

To keep our updates isolated from redash's ones, we are defining the `metr-main` branch as the one
to mirror production and to organize the tags. The `main` branch should keep up to date with redash
new releases. The way tags are being named is:

`v{redash-version}-metr-r{revision-number}`

Where the `redash-version` should only change if we update our branch with a new version that should
be present in the `main` one. The `revision-number` is used to control our own updates on top of the
current redash version and should start on 0 (we're Pythonistas, after all). So, for example, the tag
`v10.1.0-metr-r1` uses redash 10.1.0 and it's metr's second revision with changes.

### Publishing new images

This repository counts on the `publish_docker_images.sh` to update our docker images repository with a
new version of this redash fork.

# Redash

[![Documentation](https://img.shields.io/badge/docs-redash.io/help-brightgreen.svg)](https://redash.io/help/)
[![GitHub Build](https://github.com/getredash/redash/actions/workflows/ci.yml/badge.svg)](https://github.com/getredash/redash/actions)

Redash is designed to enable anyone, regardless of the level of technical sophistication, to harness the power of data big and small. SQL users leverage Redash to explore, query, visualize, and share data from any data sources. Their work in turn enables anybody in their organization to use the data. Every day, millions of users at thousands of organizations around the world use Redash to develop insights and make data-driven decisions.

Redash features:

1. **Browser-based**: Everything in your browser, with a shareable URL.
2. **Ease-of-use**: Become immediately productive with data without the need to master complex software.
3. **Query editor**: Quickly compose SQL and NoSQL queries with a schema browser and auto-complete.
4. **Visualization and dashboards**: Create [beautiful visualizations](https://redash.io/help/user-guide/visualizations/visualization-types) with drag and drop, and combine them into a single dashboard.
5. **Sharing**: Collaborate easily by sharing visualizations and their associated queries, enabling peer review of reports and queries.
6. **Schedule refreshes**: Automatically update your charts and dashboards at regular intervals you define.
7. **Alerts**: Define conditions and be alerted instantly when your data changes.
8. **REST API**: Everything that can be done in the UI is also available through REST API.
9. **Broad support for data sources**: Extensible data source API with native support for a long list of common databases and platforms.

<img src="https://raw.githubusercontent.com/getredash/website/8e820cd02c73a8ddf4f946a9d293c54fd3fb08b9/website/_assets/images/redash-anim.gif" width="80%"/>

## Getting Started

* [Setting up Redash instance](https://redash.io/help/open-source/setup) (includes links to ready-made AWS/GCE images).
* [Documentation](https://redash.io/help/).

## Supported Data Sources

Redash supports more than 35 SQL and NoSQL [data sources](https://redash.io/help/data-sources/supported-data-sources). It can also be extended to support more. Below is a list of built-in sources:

- Amazon Athena
- Amazon CloudWatch / Insights
- Amazon DynamoDB
- Amazon Redshift
- ArangoDB
- Axibase Time Series Database
- Apache Cassandra
- ClickHouse
- CockroachDB
- Couchbase
- CSV
- Databricks
- DB2 by IBM
- Dgraph
- Apache Drill
- Apache Druid
- e6data
- Eccenca Corporate Memory
- Elasticsearch
- Exasol
- Microsoft Excel
- Firebolt
- Databend
- Google Analytics
- Google BigQuery
- Google Spreadsheets
- Graphite
- Greenplum
- Apache Hive
- Apache Impala
- InfluxDB
- InfluxDBv2
- IBM Netezza Performance Server
- JIRA (JQL)
- JSON
- Apache Kylin
- OmniSciDB (Formerly MapD)
- MariaDB
- MemSQL
- Microsoft Azure Data Warehouse / Synapse
- Microsoft Azure SQL Database
- Microsoft Azure Data Explorer / Kusto
- Microsoft SQL Server
- MongoDB
- MySQL
- Oracle
- Apache Phoenix
- Apache Pinot
- PostgreSQL
- Presto
- Prometheus
- Python
- Qubole
- Rockset
- RisingWave
- Salesforce
- ScyllaDB
- Shell Scripts
- Snowflake
- SPARQL
- SQLite
- TiDB
- Tinybird
- TreasureData
- Trino
- Uptycs
- Vertica
- Yandex AppMetrrica
- Yandex Metrica

## Getting Help

* Issues: https://github.com/getredash/redash/issues
* Discussion Forum: https://github.com/getredash/redash/discussions/
* Development Discussion: https://discord.gg/tN5MdmfGBp

## Reporting Bugs and Contributing Code

* Want to report a bug or request a feature? Please open [an issue](https://github.com/getredash/redash/issues/new).
* Want to help us build **_Redash_**? Fork the project, edit in a [dev environment](https://github.com/getredash/redash/wiki/Local-development-setup) and make a pull request. We need all the help we can get!

## Security

Please email security@redash.io to report any security vulnerabilities. We will acknowledge receipt of your vulnerability and strive to send you regular updates about our progress. If you're curious about the status of your disclosure please feel free to email us again. If you want to encrypt your disclosure email, you can use [this PGP key](https://keybase.io/arikfr/key.asc).

## License

BSD-2-Clause.
