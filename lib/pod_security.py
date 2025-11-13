from constructs import Construct
from cdktf_cdktf_provider_kubernetes.namespace_v1 import NamespaceV1


class PodSecurityConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # Create namespaces with pod security standards
        # Tenant namespaces with restricted policy
        self.tenant_namespaces = []
        for tenant in ["tenant-a", "tenant-b", "tenant-c"]:
            ns = NamespaceV1(self, f"tenant-ns-{tenant}",
                metadata={
                    "name": f"{tenant}-{environment_suffix}",
                    "labels": {
                        "pod-security.kubernetes.io/enforce": "restricted",
                        "pod-security.kubernetes.io/audit": "restricted",
                        "pod-security.kubernetes.io/warn": "restricted",
                        "tenant": tenant
                    }
                }
            )
            self.tenant_namespaces.append(ns)

        # System namespaces with baseline policy
        self.system_namespaces = []
        for system_ns in ["monitoring", "logging"]:
            ns = NamespaceV1(self, f"system-ns-{system_ns}",
                metadata={
                    "name": f"{system_ns}-{environment_suffix}",
                    "labels": {
                        "pod-security.kubernetes.io/enforce": "baseline",
                        "pod-security.kubernetes.io/audit": "baseline",
                        "pod-security.kubernetes.io/warn": "baseline",
                        "type": "system"
                    }
                }
            )
            self.system_namespaces.append(ns)
