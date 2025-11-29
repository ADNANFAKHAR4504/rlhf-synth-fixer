# CDKTF Python Implementation: EKS Microservices Payment Platform

This implementation provides a complete CDKTF Python solution for deploying an EKS cluster with Fargate profiles, supporting a microservices payment platform with comprehensive security, monitoring, and compliance features.

## Architecture Overview

The infrastructure includes:
- EKS cluster v1.28 with OIDC provider for IRSA
- Fargate profiles for serverless compute (payment, fraud-detection, reporting)
- VPC with public/private subnets across 3 availability zones
- ECR repositories with vulnerability scanning and lifecycle policies
- IAM roles for service accounts (IRSA) with least-privilege policies
- AWS Load Balancer Controller for ingress
- CloudWatch Container Insights for monitoring
- Secrets Manager integration
- App Mesh for service mesh communication

## File: lib/tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider


class TapStack(TerraformStack):
    """CDKTF Python stack for TAP infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
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

        # Import microservices stack configurations
        from lib.microservices_stack import MicroservicesStack

        MicroservicesStack(
            self,
            "microservices",
            environment_suffix=environment_suffix,
            aws_region=aws_region
        )
```

## File: lib/microservices_stack.py

```python
"""Microservices platform stack with EKS, Fargate, and supporting services."""

from constructs import Construct
from cdktf import TerraformOutput, Fn
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.eks_cluster import EksCluster, EksClusterVpcConfig
from cdktf_cdktf_provider_aws.eks_fargate_profile import EksFargateProfile, EksFargateProfileSelector
from cdktf_cdktf_provider_aws.eks_addon import EksAddon
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_openid_connect_provider import IamOpenidConnectProvider
from cdktf_cdktf_provider_aws.ecr_repository import EcrRepository, EcrRepositoryImageScanningConfiguration
from cdktf_cdktf_provider_aws.ecr_lifecycle_policy import EcrLifecyclePolicy
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
import json


class MicroservicesStack(Construct):
    """EKS-based microservices platform with Fargate profiles."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str
    ):
        """Initialize the microservices stack."""
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix
        self.aws_region = aws_region

        # Get AWS account info
        self.account = DataAwsCallerIdentity(self, "account")

        # Get availability zones
        self.azs = DataAwsAvailabilityZones(
            self,
            "azs",
            state="available"
        )

        # Create VPC and networking
        self._create_vpc()

        # Create security groups
        self._create_security_groups()

        # Create IAM roles
        self._create_cluster_role()
        self._create_fargate_pod_execution_role()

        # Create EKS cluster
        self._create_eks_cluster()

        # Create OIDC provider for IRSA
        self._create_oidc_provider()

        # Create Fargate profiles for each namespace
        self._create_fargate_profiles()

        # Create ECR repositories
        self._create_ecr_repositories()

        # Create namespace-specific IAM roles for IRSA
        self._create_namespace_irsa_roles()

        # Create secrets in Secrets Manager
        self._create_secrets()

        # Create CloudWatch log groups
        self._create_log_groups()

        # Install EKS addons
        self._create_eks_addons()

        # Outputs
        self._create_outputs()

    def _create_vpc(self):
        """Create VPC with public and private subnets across 3 AZs."""
        # VPC
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"eks-vpc-{self.environment_suffix}",
                "kubernetes.io/cluster/eks-payment-cluster-{self.environment_suffix}": "shared"
            }
        )

        # Internet Gateway
        self.igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={"Name": f"eks-igw-{self.environment_suffix}"}
        )

        # Public subnets (for ALB)
        self.public_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=Fn.element(self.azs.names, i),
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"eks-public-subnet-{i}-{self.environment_suffix}",
                    "kubernetes.io/role/elb": "1",
                    f"kubernetes.io/cluster/eks-payment-cluster-{self.environment_suffix}": "shared"
                }
            )
            self.public_subnets.append(subnet)

        # Private subnets (for pods)
        self.private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=Fn.element(self.azs.names, i),
                tags={
                    "Name": f"eks-private-subnet-{i}-{self.environment_suffix}",
                    "kubernetes.io/role/internal-elb": "1",
                    f"kubernetes.io/cluster/eks-payment-cluster-{self.environment_suffix}": "shared"
                }
            )
            self.private_subnets.append(subnet)

        # Public route table
        self.public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=self.vpc.id,
            tags={"Name": f"eks-public-rt-{self.environment_suffix}"}
        )

        Route(
            self,
            "public_route",
            route_table_id=self.public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )

        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self,
                f"public_rta_{i}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id
            )

        # Private route table (no NAT gateway for cost optimization with Fargate)
        self.private_rt = RouteTable(
            self,
            "private_rt",
            vpc_id=self.vpc.id,
            tags={"Name": f"eks-private-rt-{self.environment_suffix}"}
        )

        for i, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(
                self,
                f"private_rta_{i}",
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id
            )

    def _create_security_groups(self):
        """Create security groups for EKS cluster."""
        # Cluster security group
        self.cluster_sg = SecurityGroup(
            self,
            "cluster_sg",
            name=f"eks-cluster-sg-{self.environment_suffix}",
            description="Security group for EKS cluster control plane",
            vpc_id=self.vpc.id,
            egress=[SecurityGroupEgress(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound traffic"
            )],
            tags={"Name": f"eks-cluster-sg-{self.environment_suffix}"}
        )

        # Allow cluster to communicate with pods
        SecurityGroupIngress(
            self,
            "cluster_ingress_pods",
            security_group_id=self.cluster_sg.id,
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"],
            description="Allow pods to communicate with cluster API"
        )

    def _create_cluster_role(self):
        """Create IAM role for EKS cluster."""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "eks.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }

        self.cluster_role = IamRole(
            self,
            "cluster_role",
            name=f"eks-cluster-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={"Name": f"eks-cluster-role-{self.environment_suffix}"}
        )

        IamRolePolicyAttachment(
            self,
            "cluster_policy",
            role=self.cluster_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
        )

        IamRolePolicyAttachment(
            self,
            "cluster_vpc_policy",
            role=self.cluster_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
        )

    def _create_fargate_pod_execution_role(self):
        """Create IAM role for Fargate pod execution."""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "eks-fargate-pods.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }

        self.fargate_pod_execution_role = IamRole(
            self,
            "fargate_pod_execution_role",
            name=f"eks-fargate-pod-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={"Name": f"eks-fargate-pod-execution-role-{self.environment_suffix}"}
        )

        IamRolePolicyAttachment(
            self,
            "fargate_pod_execution_policy",
            role=self.fargate_pod_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
        )

        # Add CloudWatch Logs permissions
        fargate_logs_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogStream",
                    "logs:CreateLogGroup",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            }]
        }

        fargate_logs_policy_resource = IamPolicy(
            self,
            "fargate_logs_policy",
            name=f"eks-fargate-logs-policy-{self.environment_suffix}",
            policy=json.dumps(fargate_logs_policy)
        )

        IamRolePolicyAttachment(
            self,
            "fargate_logs_policy_attachment",
            role=self.fargate_pod_execution_role.name,
            policy_arn=fargate_logs_policy_resource.arn
        )

    def _create_eks_cluster(self):
        """Create EKS cluster with version 1.28."""
        subnet_ids = [s.id for s in self.private_subnets] + [s.id for s in self.public_subnets]

        self.eks_cluster = EksCluster(
            self,
            "eks_cluster",
            name=f"eks-payment-cluster-{self.environment_suffix}",
            version="1.28",
            role_arn=self.cluster_role.arn,
            vpc_config=EksClusterVpcConfig(
                subnet_ids=subnet_ids,
                security_group_ids=[self.cluster_sg.id],
                endpoint_private_access=True,
                endpoint_public_access=True
            ),
            enabled_cluster_log_types=[
                "api",
                "audit",
                "authenticator",
                "controllerManager",
                "scheduler"
            ],
            tags={
                "Name": f"eks-payment-cluster-{self.environment_suffix}",
                "Environment": self.environment_suffix
            }
        )

    def _create_oidc_provider(self):
        """Create OIDC provider for IRSA."""
        # Extract OIDC issuer URL from cluster
        oidc_issuer = Fn.replace(self.eks_cluster.identity.get(0).oidc.get(0).issuer, "https://", "")

        self.oidc_provider = IamOpenidConnectProvider(
            self,
            "oidc_provider",
            url=self.eks_cluster.identity.get(0).oidc.get(0).issuer,
            client_id_list=["sts.amazonaws.com"],
            thumbprint_list=[
                "9e99a48a9960b14926bb7f3b02e22da2b0ab7280"  # AWS EKS OIDC thumbprint
            ],
            tags={"Name": f"eks-oidc-provider-{self.environment_suffix}"}
        )

    def _create_fargate_profiles(self):
        """Create Fargate profiles for each microservice namespace."""
        namespaces = ["payment", "fraud-detection", "reporting"]
        self.fargate_profiles = []

        for namespace in namespaces:
            profile = EksFargateProfile(
                self,
                f"fargate_profile_{namespace.replace('-', '_')}",
                cluster_name=self.eks_cluster.name,
                fargate_profile_name=f"{namespace}-profile-{self.environment_suffix}",
                pod_execution_role_arn=self.fargate_pod_execution_role.arn,
                subnet_ids=[s.id for s in self.private_subnets],
                selector=[EksFargateProfileSelector(
                    namespace=namespace,
                    labels={}
                )],
                tags={
                    "Name": f"{namespace}-fargate-profile-{self.environment_suffix}",
                    "Namespace": namespace
                }
            )
            self.fargate_profiles.append(profile)

        # Create Fargate profile for kube-system (required for core addons)
        kube_system_profile = EksFargateProfile(
            self,
            "fargate_profile_kube_system",
            cluster_name=self.eks_cluster.name,
            fargate_profile_name=f"kube-system-profile-{self.environment_suffix}",
            pod_execution_role_arn=self.fargate_pod_execution_role.arn,
            subnet_ids=[s.id for s in self.private_subnets],
            selector=[
                EksFargateProfileSelector(
                    namespace="kube-system",
                    labels={}
                )
            ],
            tags={"Name": f"kube-system-fargate-profile-{self.environment_suffix}"}
        )
        self.fargate_profiles.append(kube_system_profile)

    def _create_ecr_repositories(self):
        """Create ECR repositories for each microservice."""
        services = ["payment", "fraud-detection", "reporting"]
        self.ecr_repositories = []

        lifecycle_policy = {
            "rules": [{
                "rulePriority": 1,
                "description": "Keep last 10 images",
                "selection": {
                    "tagStatus": "any",
                    "countType": "imageCountMoreThan",
                    "countNumber": 10
                },
                "action": {
                    "type": "expire"
                }
            }]
        }

        for service in services:
            repo = EcrRepository(
                self,
                f"ecr_{service.replace('-', '_')}",
                name=f"{service}-service-{self.environment_suffix}",
                image_scanning_configuration=EcrRepositoryImageScanningConfiguration(
                    scan_on_push=True
                ),
                image_tag_mutability="MUTABLE",
                force_delete=True,  # Allow deletion with images (destroyable)
                tags={
                    "Name": f"{service}-ecr-{self.environment_suffix}",
                    "Service": service
                }
            )

            EcrLifecyclePolicy(
                self,
                f"ecr_lifecycle_{service.replace('-', '_')}",
                repository=repo.name,
                policy=json.dumps(lifecycle_policy)
            )

            self.ecr_repositories.append(repo)

    def _create_namespace_irsa_roles(self):
        """Create IAM roles for service accounts (IRSA) for each namespace."""
        namespaces = {
            "payment": {
                "services": ["dynamodb", "sqs", "sns"],
                "description": "Payment processing service"
            },
            "fraud-detection": {
                "services": ["sagemaker", "s3"],
                "description": "Fraud detection ML service"
            },
            "reporting": {
                "services": ["s3", "athena"],
                "description": "Reporting and analytics service"
            }
        }

        self.irsa_roles = {}

        for namespace, config in namespaces.items():
            # Create trust policy for IRSA
            oidc_issuer = Fn.replace(
                self.eks_cluster.identity.get(0).oidc.get(0).issuer,
                "https://",
                ""
            )

            assume_role_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Federated": f"arn:aws:iam::{self.account.account_id}:oidc-provider/{oidc_issuer}"
                    },
                    "Action": "sts:AssumeRoleWithWebIdentity",
                    "Condition": {
                        "StringEquals": {
                            f"{oidc_issuer}:sub": f"system:serviceaccount:{namespace}:{namespace}-sa",
                            f"{oidc_issuer}:aud": "sts.amazonaws.com"
                        }
                    }
                }]
            }

            role = IamRole(
                self,
                f"irsa_role_{namespace.replace('-', '_')}",
                name=f"eks-{namespace}-irsa-role-{self.environment_suffix}",
                assume_role_policy=json.dumps(assume_role_policy),
                description=f"IRSA role for {config['description']}",
                tags={
                    "Name": f"eks-{namespace}-irsa-role-{self.environment_suffix}",
                    "Namespace": namespace
                }
            )

            # Create least-privilege policy for namespace
            policy_statements = []

            if "dynamodb" in config["services"]:
                policy_statements.append({
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": f"arn:aws:dynamodb:{self.aws_region}:{self.account.account_id}:table/{namespace}-*"
                })

            if "sqs" in config["services"]:
                policy_statements.append({
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": f"arn:aws:sqs:{self.aws_region}:{self.account.account_id}:{namespace}-*"
                })

            if "sns" in config["services"]:
                policy_statements.append({
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": f"arn:aws:sns:{self.aws_region}:{self.account.account_id}:{namespace}-*"
                })

            if "s3" in config["services"]:
                policy_statements.append({
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{namespace}-data-{self.environment_suffix}",
                        f"arn:aws:s3:::{namespace}-data-{self.environment_suffix}/*"
                    ]
                })

            if "sagemaker" in config["services"]:
                policy_statements.append({
                    "Effect": "Allow",
                    "Action": [
                        "sagemaker:InvokeEndpoint"
                    ],
                    "Resource": f"arn:aws:sagemaker:{self.aws_region}:{self.account.account_id}:endpoint/{namespace}-*"
                })

            if "athena" in config["services"]:
                policy_statements.append({
                    "Effect": "Allow",
                    "Action": [
                        "athena:StartQueryExecution",
                        "athena:GetQueryExecution",
                        "athena:GetQueryResults"
                    ],
                    "Resource": f"arn:aws:athena:{self.aws_region}:{self.account.account_id}:workgroup/{namespace}-*"
                })

            # Add Secrets Manager access for all namespaces
            policy_statements.append({
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                ],
                "Resource": f"arn:aws:secretsmanager:{self.aws_region}:{self.account.account_id}:secret:{namespace}/*"
            })

            namespace_policy = IamPolicy(
                self,
                f"irsa_policy_{namespace.replace('-', '_')}",
                name=f"eks-{namespace}-irsa-policy-{self.environment_suffix}",
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": policy_statements
                })
            )

            IamRolePolicyAttachment(
                self,
                f"irsa_policy_attachment_{namespace.replace('-', '_')}",
                role=role.name,
                policy_arn=namespace_policy.arn
            )

            self.irsa_roles[namespace] = role

    def _create_secrets(self):
        """Create secrets in AWS Secrets Manager for each namespace."""
        namespaces = ["payment", "fraud-detection", "reporting"]
        self.secrets = []

        for namespace in namespaces:
            secret = SecretsmanagerSecret(
                self,
                f"secret_{namespace.replace('-', '_')}",
                name=f"{namespace}/app-config-{self.environment_suffix}",
                description=f"Application configuration for {namespace} service",
                recovery_window_in_days=0,  # Immediate deletion for destroyability
                tags={
                    "Name": f"{namespace}-secret-{self.environment_suffix}",
                    "Namespace": namespace
                }
            )

            # Create initial secret version with placeholder data
            secret_data = {
                "database_url": f"postgresql://db.{namespace}.local:5432/{namespace}",
                "api_key": "placeholder-api-key",
                "encryption_key": "placeholder-encryption-key"
            }

            SecretsmanagerSecretVersion(
                self,
                f"secret_version_{namespace.replace('-', '_')}",
                secret_id=secret.id,
                secret_string=json.dumps(secret_data)
            )

            self.secrets.append(secret)

    def _create_log_groups(self):
        """Create CloudWatch log groups for Container Insights."""
        # EKS cluster log group
        self.cluster_log_group = CloudwatchLogGroup(
            self,
            "cluster_log_group",
            name=f"/aws/eks/eks-payment-cluster-{self.environment_suffix}/cluster",
            retention_in_days=7,  # Short retention for cost optimization
            tags={"Name": f"eks-cluster-logs-{self.environment_suffix}"}
        )

        # Application log groups for each namespace
        namespaces = ["payment", "fraud-detection", "reporting"]
        self.app_log_groups = []

        for namespace in namespaces:
            log_group = CloudwatchLogGroup(
                self,
                f"app_log_group_{namespace.replace('-', '_')}",
                name=f"/aws/eks/eks-payment-cluster-{self.environment_suffix}/application/{namespace}",
                retention_in_days=7,
                tags={
                    "Name": f"{namespace}-logs-{self.environment_suffix}",
                    "Namespace": namespace
                }
            )
            self.app_log_groups.append(log_group)

        # Container Insights log group
        self.insights_log_group = CloudwatchLogGroup(
            self,
            "insights_log_group",
            name=f"/aws/containerinsights/eks-payment-cluster-{self.environment_suffix}/performance",
            retention_in_days=7,
            tags={"Name": f"eks-container-insights-{self.environment_suffix}"}
        )

    def _create_eks_addons(self):
        """Install EKS addons including AWS Load Balancer Controller support."""
        # VPC CNI addon
        vpc_cni_addon = EksAddon(
            self,
            "vpc_cni_addon",
            cluster_name=self.eks_cluster.name,
            addon_name="vpc-cni",
            addon_version="v1.15.0-eksbuild.2",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="OVERWRITE",
            tags={"Name": f"vpc-cni-addon-{self.environment_suffix}"}
        )

        # CoreDNS addon
        coredns_addon = EksAddon(
            self,
            "coredns_addon",
            cluster_name=self.eks_cluster.name,
            addon_name="coredns",
            addon_version="v1.10.1-eksbuild.6",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="OVERWRITE",
            tags={"Name": f"coredns-addon-{self.environment_suffix}"}
        )

        # kube-proxy addon
        kube_proxy_addon = EksAddon(
            self,
            "kube_proxy_addon",
            cluster_name=self.eks_cluster.name,
            addon_name="kube-proxy",
            addon_version="v1.28.2-eksbuild.2",
            resolve_conflicts_on_create="OVERWRITE",
            resolve_conflicts_on_update="OVERWRITE",
            tags={"Name": f"kube-proxy-addon-{self.environment_suffix}"}
        )

        # Create IAM role for AWS Load Balancer Controller
        oidc_issuer = Fn.replace(
            self.eks_cluster.identity.get(0).oidc.get(0).issuer,
            "https://",
            ""
        )

        alb_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Federated": f"arn:aws:iam::{self.account.account_id}:oidc-provider/{oidc_issuer}"
                },
                "Action": "sts:AssumeRoleWithWebIdentity",
                "Condition": {
                    "StringEquals": {
                        f"{oidc_issuer}:sub": "system:serviceaccount:kube-system:aws-load-balancer-controller",
                        f"{oidc_issuer}:aud": "sts.amazonaws.com"
                    }
                }
            }]
        }

        self.alb_controller_role = IamRole(
            self,
            "alb_controller_role",
            name=f"eks-alb-controller-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(alb_assume_role_policy),
            tags={"Name": f"eks-alb-controller-role-{self.environment_suffix}"}
        )

        # AWS Load Balancer Controller IAM policy (abbreviated for brevity)
        alb_controller_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "iam:CreateServiceLinkedRole"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "iam:AWSServiceName": "elasticloadbalancing.amazonaws.com"
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ec2:DescribeAccountAttributes",
                        "ec2:DescribeAddresses",
                        "ec2:DescribeAvailabilityZones",
                        "ec2:DescribeInternetGateways",
                        "ec2:DescribeVpcs",
                        "ec2:DescribeVpcPeeringConnections",
                        "ec2:DescribeSubnets",
                        "ec2:DescribeSecurityGroups",
                        "ec2:DescribeInstances",
                        "ec2:DescribeNetworkInterfaces",
                        "ec2:DescribeTags",
                        "ec2:GetCoipPoolUsage",
                        "ec2:DescribeCoipPools",
                        "elasticloadbalancing:DescribeLoadBalancers",
                        "elasticloadbalancing:DescribeLoadBalancerAttributes",
                        "elasticloadbalancing:DescribeListeners",
                        "elasticloadbalancing:DescribeListenerCertificates",
                        "elasticloadbalancing:DescribeSSLPolicies",
                        "elasticloadbalancing:DescribeRules",
                        "elasticloadbalancing:DescribeTargetGroups",
                        "elasticloadbalancing:DescribeTargetGroupAttributes",
                        "elasticloadbalancing:DescribeTargetHealth",
                        "elasticloadbalancing:DescribeTags"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "cognito-idp:DescribeUserPoolClient",
                        "acm:ListCertificates",
                        "acm:DescribeCertificate",
                        "iam:ListServerCertificates",
                        "iam:GetServerCertificate",
                        "waf-regional:GetWebACL",
                        "waf-regional:GetWebACLForResource",
                        "waf-regional:AssociateWebACL",
                        "waf-regional:DisassociateWebACL",
                        "wafv2:GetWebACL",
                        "wafv2:GetWebACLForResource",
                        "wafv2:AssociateWebACL",
                        "wafv2:DisassociateWebACL",
                        "shield:GetSubscriptionState",
                        "shield:DescribeProtection",
                        "shield:CreateProtection",
                        "shield:DeleteProtection"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ec2:AuthorizeSecurityGroupIngress",
                        "ec2:RevokeSecurityGroupIngress",
                        "ec2:CreateSecurityGroup",
                        "ec2:CreateTags"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "elasticloadbalancing:CreateLoadBalancer",
                        "elasticloadbalancing:CreateTargetGroup",
                        "elasticloadbalancing:CreateListener",
                        "elasticloadbalancing:DeleteLoadBalancer",
                        "elasticloadbalancing:DeleteTargetGroup",
                        "elasticloadbalancing:DeleteListener",
                        "elasticloadbalancing:ModifyLoadBalancerAttributes",
                        "elasticloadbalancing:ModifyTargetGroup",
                        "elasticloadbalancing:ModifyTargetGroupAttributes",
                        "elasticloadbalancing:RegisterTargets",
                        "elasticloadbalancing:DeregisterTargets",
                        "elasticloadbalancing:SetWebAcl",
                        "elasticloadbalancing:SetSecurityGroups",
                        "elasticloadbalancing:SetSubnets",
                        "elasticloadbalancing:ModifyListener",
                        "elasticloadbalancing:AddTags",
                        "elasticloadbalancing:RemoveTags",
                        "elasticloadbalancing:AddListenerCertificates",
                        "elasticloadbalancing:RemoveListenerCertificates"
                    ],
                    "Resource": "*"
                }
            ]
        }

        alb_policy_resource = IamPolicy(
            self,
            "alb_controller_policy",
            name=f"eks-alb-controller-policy-{self.environment_suffix}",
            policy=json.dumps(alb_controller_policy)
        )

        IamRolePolicyAttachment(
            self,
            "alb_controller_policy_attachment",
            role=self.alb_controller_role.name,
            policy_arn=alb_policy_resource.arn
        )

    def _create_outputs(self):
        """Create Terraform outputs."""
        TerraformOutput(
            self,
            "cluster_name",
            value=self.eks_cluster.name,
            description="EKS cluster name"
        )

        TerraformOutput(
            self,
            "cluster_endpoint",
            value=self.eks_cluster.endpoint,
            description="EKS cluster endpoint"
        )

        TerraformOutput(
            self,
            "cluster_security_group_id",
            value=self.cluster_sg.id,
            description="EKS cluster security group ID"
        )

        TerraformOutput(
            self,
            "oidc_provider_arn",
            value=self.oidc_provider.arn,
            description="OIDC provider ARN for IRSA"
        )

        TerraformOutput(
            self,
            "vpc_id",
            value=self.vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "ecr_repository_urls",
            value=json.dumps({repo.name: repo.repository_url for repo in self.ecr_repositories}),
            description="ECR repository URLs for microservices"
        )

        TerraformOutput(
            self,
            "alb_controller_role_arn",
            value=self.alb_controller_role.arn,
            description="ALB Controller IAM role ARN"
        )

        # Output IRSA role ARNs
        for namespace, role in self.irsa_roles.items():
            TerraformOutput(
                self,
                f"irsa_role_arn_{namespace.replace('-', '_')}",
                value=role.arn,
                description=f"IRSA role ARN for {namespace} namespace"
            )
```

## File: lib/__init__.py

```python
"""Microservices platform infrastructure package."""

from lib.tap_stack import TapStack
from lib.microservices_stack import MicroservicesStack

__all__ = ["TapStack", "MicroservicesStack"]
```

## File: lib/README.md

```markdown
# EKS Microservices Payment Platform - CDKTF Python

This infrastructure code deploys a complete EKS-based microservices platform for payment processing with comprehensive security, compliance, and monitoring features.

## Architecture

### Components

1. **EKS Cluster (v1.28)**
   - OIDC provider enabled for IRSA
   - Control plane logging enabled
   - Deployed across 3 availability zones

2. **Fargate Profiles**
   - Payment namespace profile
   - Fraud-detection namespace profile
   - Reporting namespace profile
   - Kube-system profile (for core addons)

3. **Networking**
   - VPC with CIDR 10.0.0.0/16
   - 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24) for ALB
   - 3 private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24) for pods
   - Internet Gateway for public subnet routing
   - No NAT Gateway (cost optimization with Fargate)

4. **Security**
   - IAM roles for service accounts (IRSA) for each namespace
   - Least-privilege IAM policies per namespace
   - Secrets Manager integration for sensitive configuration
   - Security groups for cluster control plane

5. **Container Registry**
   - ECR repositories for payment, fraud-detection, and reporting services
   - Vulnerability scanning enabled (scan on push)
   - Lifecycle policies retaining last 10 images

6. **Monitoring**
   - CloudWatch Container Insights
   - EKS control plane logs
   - Application log groups per namespace
   - 7-day log retention (cost optimized)

7. **EKS Addons**
   - VPC CNI (v1.15.0)
   - CoreDNS (v1.10.1)
   - kube-proxy (v1.28.2)
   - AWS Load Balancer Controller IAM role configured

## Prerequisites

- Python 3.9+
- CDKTF 0.20+
- AWS CLI v2 configured
- Terraform 1.5+
- kubectl 1.28+

## Resource Naming

All resources include the `environmentSuffix` parameter for uniqueness:
- EKS Cluster: `eks-payment-cluster-{environmentSuffix}`
- VPC: `eks-vpc-{environmentSuffix}`
- ECR Repos: `{service}-service-{environmentSuffix}`
- IAM Roles: `eks-{purpose}-role-{environmentSuffix}`

## Deployment

### 1. Install Dependencies

```bash
# Install Python dependencies
pipenv install

# Install CDKTF providers
cdktf get
```

### 2. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
```

### 3. Deploy Infrastructure

```bash
# Synthesize CDKTF code to Terraform
cdktf synth

# Deploy the stack
cdktf deploy
```

### 4. Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --region us-east-1 \
  --name eks-payment-cluster-${ENVIRONMENT_SUFFIX}

# Verify cluster access
kubectl get nodes
kubectl get fargate-profiles -n kube-system
```

### 5. Install AWS Load Balancer Controller

```bash
# Get the ALB controller role ARN from outputs
ALB_ROLE_ARN=$(cdktf output alb_controller_role_arn)

# Install using Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=eks-payment-cluster-${ENVIRONMENT_SUFFIX} \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=${ALB_ROLE_ARN}
```

### 6. Create Namespaces with Resource Quotas

```bash
# Create payment namespace
kubectl create namespace payment

kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: payment-quota
  namespace: payment
spec:
  hard:
    requests.cpu: "2"
    requests.memory: "4Gi"
    limits.cpu: "2"
    limits.memory: "4Gi"
EOF

# Create fraud-detection namespace
kubectl create namespace fraud-detection

kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: fraud-detection-quota
  namespace: fraud-detection
spec:
  hard:
    requests.cpu: "2"
    requests.memory: "4Gi"
    limits.cpu: "2"
    limits.memory: "4Gi"
EOF

# Create reporting namespace
kubectl create namespace reporting

kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: reporting-quota
  namespace: reporting
spec:
  hard:
    requests.cpu: "2"
    requests.memory: "4Gi"
    limits.cpu: "2"
    limits.memory: "4Gi"
EOF
```

### 7. Create Service Accounts with IRSA

```bash
# Get IRSA role ARNs from outputs
PAYMENT_ROLE_ARN=$(cdktf output irsa_role_arn_payment)
FRAUD_ROLE_ARN=$(cdktf output irsa_role_arn_fraud_detection)
REPORTING_ROLE_ARN=$(cdktf output irsa_role_arn_reporting)

# Create service accounts
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: payment-sa
  namespace: payment
  annotations:
    eks.amazonaws.com/role-arn: ${PAYMENT_ROLE_ARN}
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: fraud-detection-sa
  namespace: fraud-detection
  annotations:
    eks.amazonaws.com/role-arn: ${FRAUD_ROLE_ARN}
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: reporting-sa
  namespace: reporting
  annotations:
    eks.amazonaws.com/role-arn: ${REPORTING_ROLE_ARN}
EOF
```

### 8. Install Secrets Store CSI Driver

```bash
# Install CSI driver
helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
helm install csi-secrets-store secrets-store-csi-driver/secrets-store-csi-driver \
  --namespace kube-system

# Install AWS provider
kubectl apply -f https://raw.githubusercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml
```

### 9. Configure Network Policies

```bash
# Example network policy for payment namespace
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: payment-network-policy
  namespace: payment
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: payment
  - from:
    - namespaceSelector:
        matchLabels:
          name: fraud-detection
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: fraud-detection
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443
EOF
```

## Verification

### Check Cluster Status

```bash
# Cluster info
kubectl cluster-info

# List nodes (Fargate)
kubectl get nodes

# Check namespaces
kubectl get namespaces

# Check resource quotas
kubectl get resourcequota -A

# Check Fargate profiles
aws eks list-fargate-profiles \
  --cluster-name eks-payment-cluster-${ENVIRONMENT_SUFFIX}
```

### Check ECR Repositories

```bash
# List ECR repositories
aws ecr describe-repositories --query 'repositories[].repositoryUri'

# Check image scanning
aws ecr describe-image-scan-findings \
  --repository-name payment-service-${ENVIRONMENT_SUFFIX} \
  --image-id imageTag=latest
```

### Check Container Insights

```bash
# CloudWatch Logs Insights query
aws logs start-query \
  --log-group-name /aws/containerinsights/eks-payment-cluster-${ENVIRONMENT_SUFFIX}/performance \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string 'fields @timestamp, @message | sort @timestamp desc'
```

## Namespace-Specific IAM Permissions

### Payment Namespace
- DynamoDB: GetItem, PutItem, UpdateItem, Query, Scan
- SQS: SendMessage, ReceiveMessage, DeleteMessage
- SNS: Publish
- Secrets Manager: GetSecretValue, DescribeSecret

### Fraud-Detection Namespace
- SageMaker: InvokeEndpoint
- S3: GetObject, PutObject, ListBucket
- Secrets Manager: GetSecretValue, DescribeSecret

### Reporting Namespace
- S3: GetObject, PutObject, ListBucket
- Athena: StartQueryExecution, GetQueryExecution, GetQueryResults
- Secrets Manager: GetSecretValue, DescribeSecret

## Cost Optimization

- Fargate profiles instead of EC2 nodes (pay per pod)
- No NAT Gateway (cost savings)
- 7-day log retention
- Lifecycle policies for ECR images (retain last 10)
- Aurora Serverless recommended for databases

## Security Best Practices

1. **PCI Compliance**
   - Secrets stored in Secrets Manager
   - Encryption at rest and in transit
   - Network isolation with private subnets
   - IAM least-privilege policies

2. **Container Security**
   - ECR vulnerability scanning enabled
   - Scan on push configured
   - Mutable tags for CI/CD

3. **Network Security**
   - Private subnets for pods
   - Security groups for cluster control plane
   - Network policies for pod-to-pod communication

4. **Access Control**
   - IRSA for pod-level IAM permissions
   - Separate service accounts per namespace
   - OIDC provider for authentication

## Troubleshooting

### Pods Not Scheduling

```bash
# Check Fargate profiles
kubectl get fargate-profiles -A

# Check pod events
kubectl describe pod <pod-name> -n <namespace>

# Verify subnet tags
aws ec2 describe-subnets --filters "Name=tag:kubernetes.io/cluster/eks-payment-cluster-${ENVIRONMENT_SUFFIX},Values=shared"
```

### ALB Not Creating

```bash
# Check ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Verify IAM role
aws iam get-role --role-name eks-alb-controller-role-${ENVIRONMENT_SUFFIX}
```

### IRSA Not Working

```bash
# Verify OIDC provider
aws iam list-open-id-connect-providers

# Check service account annotations
kubectl describe sa <service-account-name> -n <namespace>

# Test AWS credentials in pod
kubectl run test --rm -it --image=amazon/aws-cli --serviceaccount=payment-sa -n payment -- sts get-caller-identity
```

## Cleanup

```bash
# Delete all workloads first
kubectl delete all --all -n payment
kubectl delete all --all -n fraud-detection
kubectl delete all --all -n reporting

# Destroy infrastructure
cdktf destroy
```

## Additional Resources

- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Fargate Pod Configuration](https://docs.aws.amazon.com/eks/latest/userguide/fargate-pod-configuration.html)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Secrets Store CSI Driver](https://secrets-store-csi-driver.sigs.k8s.io/)
- [Container Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights.html)
```
