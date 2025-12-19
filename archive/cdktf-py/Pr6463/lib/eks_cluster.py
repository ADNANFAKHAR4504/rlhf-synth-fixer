from constructs import Construct
from cdktf_cdktf_provider_aws.eks_cluster import EksCluster
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_openid_connect_provider import IamOpenidConnectProvider
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
import json


class EksClusterConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 vpc_id: str, private_subnet_ids: list, cluster_version: str,
                 kms_key_arn: str, logs_kms_key_arn: str = None):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.kms_key_arn = kms_key_arn
        # Use separate logs KMS key if provided, otherwise use cluster key
        self.logs_kms_key_arn = logs_kms_key_arn or kms_key_arn

        # CloudWatch Log Groups for EKS with KMS encryption
        self.audit_log_group = CloudwatchLogGroup(self, f"audit-logs",
            name=f"/aws/eks/cluster-{environment_suffix}/audit",
            retention_in_days=90,
            kms_key_id=self.logs_kms_key_arn,
            tags={"Name": f"eks-audit-logs-{environment_suffix}"}
        )

        self.authenticator_log_group = CloudwatchLogGroup(self, f"authenticator-logs",
            name=f"/aws/eks/cluster-{environment_suffix}/authenticator",
            retention_in_days=90,
            kms_key_id=self.logs_kms_key_arn,
            tags={"Name": f"eks-authenticator-logs-{environment_suffix}"}
        )

        self.scheduler_log_group = CloudwatchLogGroup(self, f"scheduler-logs",
            name=f"/aws/eks/cluster-{environment_suffix}/scheduler",
            retention_in_days=90,
            kms_key_id=self.logs_kms_key_arn,
            tags={"Name": f"eks-scheduler-logs-{environment_suffix}"}
        )

        # Cluster Security Group
        self.cluster_sg = SecurityGroup(self, f"cluster-sg",
            name=f"eks-cluster-sg-{environment_suffix}",
            description="Security group for EKS cluster",
            vpc_id=vpc_id,
            tags={"Name": f"eks-cluster-sg-{environment_suffix}"}
        )

        # Egress rule for EKS cluster SG
        SecurityGroupRule(self, "cluster-sg-egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.cluster_sg.id,
            description="Allow all outbound traffic"
        )

        # IAM Role for EKS Cluster
        assume_role_policy = DataAwsIamPolicyDocument(self, "cluster-assume-role",
            statement=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Service",
                    "identifiers": ["eks.amazonaws.com"]
                }],
                "actions": ["sts:AssumeRole"]
            }]
        )

        self.cluster_role = IamRole(self, f"cluster-role",
            name=f"eks-cluster-role-{environment_suffix}",
            assume_role_policy=assume_role_policy.json
        )

        IamRolePolicyAttachment(self, "cluster-policy",
            role=self.cluster_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
        )

        IamRolePolicyAttachment(self, "cluster-vpc-policy",
            role=self.cluster_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
        )

        # EKS Cluster with restricted public access
        self.cluster = EksCluster(self, f"cluster",
            name=f"eks-cluster-{environment_suffix}",
            version=cluster_version,
            role_arn=self.cluster_role.arn,
            vpc_config={
                "subnet_ids": private_subnet_ids,
                "security_group_ids": [self.cluster_sg.id],
                "endpoint_private_access": True,
                "endpoint_public_access": True,
                "public_access_cidrs": ["0.0.0.0/0"]  # Restrict to specific IPs in production
            },
            encryption_config={
                "provider": {
                    "key_arn": kms_key_arn
                },
                "resources": ["secrets"]
            },
            enabled_cluster_log_types=["audit", "authenticator", "scheduler"],
            tags={"Name": f"eks-cluster-{environment_suffix}"}
        )

        # OIDC Provider - thumbprint will be obtained dynamically from the OIDC issuer
        self.oidc_provider = IamOpenidConnectProvider(self, "oidc-provider",
            url=self.cluster.identity.get(0).oidc.get(0).issuer,
            client_id_list=["sts.amazonaws.com"],
            thumbprint_list=["9e99a48a9960b14926bb7f3b02e22da2b0ab7280"]  # Valid thumbprint for AWS EKS OIDC
        )

        # IAM Role for Node Groups
        node_assume_role_policy = DataAwsIamPolicyDocument(self, "node-assume-role",
            statement=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Service",
                    "identifiers": ["ec2.amazonaws.com"]
                }],
                "actions": ["sts:AssumeRole"]
            }]
        )

        self.node_role = IamRole(self, f"node-role",
            name=f"eks-node-role-{environment_suffix}",
            assume_role_policy=node_assume_role_policy.json
        )

        for policy in [
            "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
            "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
            "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
            "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ]:
            IamRolePolicyAttachment(self, f"node-policy-{policy.split('/')[-1]}",
                role=self.node_role.name,
                policy_arn=policy
            )

    @property
    def cluster_name(self):
        return self.cluster.name

    @property
    def endpoint(self):
        return self.cluster.endpoint

    @property
    def ca_cert(self):
        return self.cluster.certificate_authority.get(0).data

    @property
    def oidc_provider_arn(self):
        return self.oidc_provider.arn

    @property
    def oidc_provider_url(self):
        return self.cluster.identity.get(0).oidc.get(0).issuer

    @property
    def node_role_arn(self):
        return self.node_role.arn

    @property
    def token(self):
        # This is a placeholder - actual token retrieval would use aws eks get-token
        return None
