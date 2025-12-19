from constructs import Construct
from cdktf_cdktf_provider_aws.eks_addon import EksAddon


class EksAddons(Construct):
    def __init__(self, scope: Construct, id: str, *, cluster_name: str):  # pylint: disable=redefined-builtin
        super().__init__(scope, id)

        # VPC CNI Add-on
        self.vpc_cni = EksAddon(self, "vpc_cni",
            cluster_name=cluster_name,
            addon_name="vpc-cni",
            addon_version="v1.20.4-eksbuild.1",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="PRESERVE",
            tags={
                "Name": "vpc-cni-addon",
                "ManagedBy": "CDKTF"
            }
        )

        # CoreDNS Add-on
        self.coredns = EksAddon(self, "coredns",
            cluster_name=cluster_name,
            addon_name="coredns",
            addon_version="v1.11.1-eksbuild.4",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="PRESERVE",
            tags={
                "Name": "coredns-addon",
                "ManagedBy": "CDKTF"
            }
        )

        # kube-proxy Add-on
        self.kube_proxy = EksAddon(self, "kube_proxy",
            cluster_name=cluster_name,
            addon_name="kube-proxy",
            addon_version="v1.29.0-eksbuild.1",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="PRESERVE",
            tags={
                "Name": "kube-proxy-addon",
                "ManagedBy": "CDKTF"
            }
        )
