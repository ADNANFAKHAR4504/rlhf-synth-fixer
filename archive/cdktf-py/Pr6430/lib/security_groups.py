from constructs import Construct
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule


class SecurityGroups(Construct):
    def __init__(self, scope: Construct, id: str, *,  # pylint: disable=redefined-builtin,too-many-positional-arguments
                 environment_suffix: str, vpc_id: str, vpc_cidr: str):
        super().__init__(scope, id)

        # EKS Cluster Security Group
        self.cluster_sg = SecurityGroup(self, "eks_cluster_sg",
            name=f"eks-cluster-sg-{environment_suffix}",
            description="Security group for EKS cluster control plane",
            vpc_id=vpc_id,
            tags={
                "Name": f"eks-cluster-sg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Allow HTTPS ingress from VPC CIDR
        SecurityGroupRule(self, "cluster_ingress_443",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=[vpc_cidr],
            security_group_id=self.cluster_sg.id,
            description="Allow HTTPS from VPC"
        )

        # Allow all egress
        SecurityGroupRule(self, "cluster_egress_all",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.cluster_sg.id,
            description="Allow all outbound traffic"
        )

    @property
    def cluster_security_group_id(self) -> str:
        return self.cluster_sg.id
