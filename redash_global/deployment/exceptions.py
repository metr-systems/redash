class DeploymentError(Exception):
    pass


class DeploymentErrorGroup(DeploymentError):
    def __init__(self, message, errors):
        super().__init__(message)
        self.errors = errors


class DataSourceError(DeploymentError):
    pass


class AllowedWidgetsQueryError(DeploymentError):
    pass


class ParameterError(DeploymentError):
    pass
