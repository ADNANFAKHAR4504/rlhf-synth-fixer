from constructs import Construct


class PodSecurityConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # Pod Security Standards Configuration
        # Note: Pod Security Standards are configured at the cluster level via EKS
        # and can be applied to namespaces using kubectl after cluster creation

        # Store configuration for reference
        self.tenant_config = {
            "tenants": ["tenant-a", "tenant-b", "tenant-c"],
            "policy": "restricted",
            "environment_suffix": environment_suffix
        }

        self.system_config = {
            "namespaces": ["monitoring", "logging"],
            "policy": "baseline",
            "environment_suffix": environment_suffix
        }
