"""Main TAP Stack orchestrating all EKS infrastructure."""

from cdktf import TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.vpc_stack import VpcStack
from lib.kms_stack import KmsStack
from lib.iam_stack import IamStack
from lib.security_group_stack import SecurityGroupStack
from lib.logging_stack import LoggingStack
from lib.eks_cluster_stack import EksClusterStack
from lib.node_group_stack import NodeGroupStack
from lib.addons_stack import AddonsStack


class TapStack(TerraformStack):
    """CDKTF Python stack for production EKS infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with EKS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Create VPC infrastructure
        vpc_stack = VpcStack(
            self,
            f"vpc-{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # Create KMS keys
        kms_stack = KmsStack(
            self,
            f"kms-{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # Create IAM roles
        iam_stack = IamStack(
            self,
            f"iam-{environment_suffix}",
            environment_suffix=environment_suffix,
            eks_key_arn=kms_stack.eks_key.arn
        )

        # Create security groups
        sg_stack = SecurityGroupStack(
            self,
            f"security-groups-{environment_suffix}",
            environment_suffix=environment_suffix,
            vpc_id=vpc_stack.vpc.id
        )

        # Create logging infrastructure
        logging_stack = LoggingStack(
            self,
            f"logging-{environment_suffix}",
            environment_suffix=environment_suffix
        )

        # Get all subnet IDs
        all_subnet_ids = [s.id for s in vpc_stack.private_subnets + vpc_stack.public_subnets]

        # Create EKS cluster
        eks_cluster = EksClusterStack(
            self,
            f"eks-cluster-{environment_suffix}",
            environment_suffix=environment_suffix,
            cluster_role_arn=iam_stack.cluster_role.arn,
            eks_key_arn=kms_stack.eks_key.arn,
            subnet_ids=all_subnet_ids,
            cluster_sg_id=sg_stack.cluster_sg.id,
            log_group_name=logging_stack.log_group.name
        )

        # Create node groups
        private_subnet_ids = [s.id for s in vpc_stack.private_subnets]
        node_groups = NodeGroupStack(
            self,
            f"node-groups-{environment_suffix}",
            environment_suffix=environment_suffix,
            cluster_name=eks_cluster.cluster.name,
            node_role_arn=iam_stack.node_role.arn,
            subnet_ids=private_subnet_ids,
            node_sg_id=sg_stack.node_sg.id,
            ebs_key_arn=kms_stack.ebs_key.arn,
            cluster_dependency=eks_cluster.cluster
        )

        # Install add-ons
        addons = AddonsStack(
            self,
            f"addons-{environment_suffix}",
            environment_suffix=environment_suffix,
            cluster_name=eks_cluster.cluster.name,
            node_groups_dependency=node_groups
        )
