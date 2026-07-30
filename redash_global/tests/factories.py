from redash_global.models import SubDashboardAssignment
from tests.factories import Factory as RedashFactory
from tests.factories import ModelFactory

sub_dashboard_assignment_factory = ModelFactory(SubDashboardAssignment)


class Factory(RedashFactory):
    """The main suite's factory, extended with the Redash Global models.

    Subclassing keeps the Redash Global models out of ``tests/factories.py``, so
    the main suite stays unaware of this app.
    """

    def create_sub_dashboard_assignment(self, **kwargs):
        args = {"organization_id": self.org.id}
        args.update(kwargs)
        return sub_dashboard_assignment_factory.create(**args)
