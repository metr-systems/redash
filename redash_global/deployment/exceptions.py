class DeploymentError(Exception):
    pass


class DataSourceError(DeploymentError):
    pass


class AllowedWidgetsQueryError(DeploymentError):
    pass


class ParameterError(DeploymentError):
    pass
