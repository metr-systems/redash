class DeploymentError(Exception):
    pass


class DeploymentErrorGroup(DeploymentError):
    def __init__(self, message, errors):
        super().__init__(message)
        self.errors = errors
