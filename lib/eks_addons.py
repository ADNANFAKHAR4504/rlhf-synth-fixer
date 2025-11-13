from constructs import Construct
from cdktf_cdktf_provider_aws.eks_addon import EksAddon
from cdktf_cdktf_provider_kubernetes.manifest import Manifest


class EksAddonsConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 cluster_name: str, ebs_csi_role_arn: str = None):
        super().__init__(scope, id)

        # CoreDNS Addon
        self.coredns = EksAddon(self, "coredns",
            cluster_name=cluster_name,
            addon_name="coredns",
            addon_version="v1.10.1-eksbuild.7",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="OVERWRITE",
            tags={"Name": f"eks-coredns-{environment_suffix}"}
        )

        # kube-proxy Addon
        self.kube_proxy = EksAddon(self, "kube-proxy",
            cluster_name=cluster_name,
            addon_name="kube-proxy",
            addon_version="v1.28.6-eksbuild.2",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="OVERWRITE",
            tags={"Name": f"eks-kube-proxy-{environment_suffix}"}
        )

        # EBS CSI Driver Addon with IRSA role
        ebs_addon_config = {
            "cluster_name": cluster_name,
            "addon_name": "aws-ebs-csi-driver",
            "addon_version": "v1.28.0-eksbuild.1",
            "resolve_conflicts_on_create": "OVERWRITE",
            "resolve_conflicts_on_update": "OVERWRITE",
            "tags": {"Name": f"eks-ebs-csi-{environment_suffix}"}
        }

        if ebs_csi_role_arn:
            ebs_addon_config["service_account_role_arn"] = ebs_csi_role_arn

        self.ebs_csi = EksAddon(self, "ebs-csi", **ebs_addon_config)

        # Calico CNI Installation (via manifest)
        # Note: Calico requires cluster to be ready, installed as Kubernetes manifest
        self.calico_operator = Manifest(self, "calico-operator",
            manifest={
                "apiVersion": "v1",
                "kind": "Namespace",
                "metadata": {
                    "name": "tigera-operator"
                }
            }
        )
