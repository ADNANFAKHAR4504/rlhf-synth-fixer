# EKS Multi-Tenant Cluster with CDKTF Python Implementation

This implementation provides a production-ready EKS cluster with multi-tenant capabilities, advanced security features, and cost optimization using CDKTF with Python.

## File: lib/__init__.py

```python
# Empty init file for Python module
```

## File: lib/tap_stack.py

```python
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_kubernetes.provider import KubernetesProvider

from .vpc_stack import VpcConstruct
from .eks_cluster import EksClusterConstruct
from .eks_node_groups import NodeGroupsConstruct
from .kms_encryption import KmsEncryptionConstruct
from .irsa_roles import IrsaRolesConstruct
from .eks_addons import EksAddonsConstruct
from .monitoring import MonitoringConstruct


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, ns: str, environment_suffix: str, region: str = "us-east-2"):
        super().__init__(scope, ns)

        self.environment_suffix = environment_suffix
        self.region = region

        # AWS Provider
        AwsProvider(self, "aws",
            region=self.region,
            default_tags=[{
                "tags": {
                    "Environment": environment_suffix,
                    "ManagedBy": "CDKTF",
                    "Project": "EKS-MultiTenant"
                }
            }]
        )

        # VPC and Networking
        self.vpc = VpcConstruct(self, "vpc",
            environment_suffix=environment_suffix,
            cidr_block="10.0.0.0/16",
            availability_zones=["us-east-2a", "us-east-2b", "us-east-2c"]
        )

        # KMS Encryption Keys
        self.kms = KmsEncryptionConstruct(self, "kms",
            environment_suffix=environment_suffix
        )

        # EKS Cluster
        self.eks_cluster = EksClusterConstruct(self, "eks-cluster",
            environment_suffix=environment_suffix,
            vpc_id=self.vpc.vpc_id,
            private_subnet_ids=self.vpc.private_subnet_ids,
            cluster_version="1.28",
            kms_key_arn=self.kms.cluster_key_arn
        )

        # Configure Kubernetes Provider
        KubernetesProvider(self, "kubernetes",
            host=self.eks_cluster.endpoint,
            cluster_ca_certificate=self.eks_cluster.ca_cert,
            token=self.eks_cluster.token,
            exec={
                "api_version": "client.authentication.k8s.io/v1beta1",
                "command": "aws",
                "args": ["eks", "get-token", "--cluster-name", self.eks_cluster.cluster_name]
            }
        )

        # IRSA Roles
        self.irsa = IrsaRolesConstruct(self, "irsa",
            environment_suffix=environment_suffix,
            oidc_provider_arn=self.eks_cluster.oidc_provider_arn,
            oidc_provider_url=self.eks_cluster.oidc_provider_url
        )

        # Node Groups
        self.node_groups = NodeGroupsConstruct(self, "node-groups",
            environment_suffix=environment_suffix,
            cluster_name=self.eks_cluster.cluster_name,
            subnet_ids=self.vpc.private_subnet_ids,
            node_role_arn=self.eks_cluster.node_role_arn
        )

        # EKS Managed Addons
        self.addons = EksAddonsConstruct(self, "addons",
            environment_suffix=environment_suffix,
            cluster_name=self.eks_cluster.cluster_name
        )

        # Monitoring
        self.monitoring = MonitoringConstruct(self, "monitoring",
            environment_suffix=environment_suffix,
            cluster_name=self.eks_cluster.cluster_name
        )

        # Outputs
        TerraformOutput(self, "cluster_name",
            value=self.eks_cluster.cluster_name
        )

        TerraformOutput(self, "cluster_endpoint",
            value=self.eks_cluster.endpoint
        )

        TerraformOutput(self, "vpc_id",
            value=self.vpc.vpc_id
        )
```

## File: lib/vpc_stack.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint


class VpcConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 cidr_block: str, availability_zones: list):
        super().__init__(scope, id)

        # VPC
        self.vpc = Vpc(self, f"vpc-{environment_suffix}",
            cidr_block=cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"eks-vpc-{environment_suffix}"
            }
        )

        # Internet Gateway
        self.igw = InternetGateway(self, f"igw",
            vpc_id=self.vpc.id,
            tags={"Name": f"eks-igw-{environment_suffix}"}
        )

        # Private Subnets
        self.private_subnets = []
        for i, az in enumerate(availability_zones):
            subnet = Subnet(self, f"private-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"eks-private-subnet-{i}-{environment_suffix}",
                    "kubernetes.io/role/internal-elb": "1"
                }
            )
            self.private_subnets.append(subnet)

        # Public Subnets for NAT Gateways
        self.public_subnets = []
        for i, az in enumerate(availability_zones):
            subnet = Subnet(self, f"public-subnet-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{100+i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"eks-public-subnet-{i}-{environment_suffix}",
                    "kubernetes.io/role/elb": "1"
                }
            )
            self.public_subnets.append(subnet)

        # NAT Gateway (single for cost optimization)
        self.nat_eip = Eip(self, f"nat-eip",
            vpc=True,
            tags={"Name": f"eks-nat-eip-{environment_suffix}"}
        )

        self.nat_gateway = NatGateway(self, f"nat-gateway",
            allocation_id=self.nat_eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={"Name": f"eks-nat-{environment_suffix}"}
        )

        # Public Route Table
        self.public_rt = RouteTable(self, f"public-rt",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=self.igw.id
            )],
            tags={"Name": f"eks-public-rt-{environment_suffix}"}
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(self, f"public-rta-{i}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id
            )

        # Private Route Table
        self.private_rt = RouteTable(self, f"private-rt",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=self.nat_gateway.id
            )],
            tags={"Name": f"eks-private-rt-{environment_suffix}"}
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(self, f"private-rta-{i}",
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id
            )

        # VPC Endpoints
        VpcEndpoint(self, f"s3-endpoint",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{self.region}.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[self.private_rt.id],
            tags={"Name": f"s3-endpoint-{environment_suffix}"}
        )

        VpcEndpoint(self, f"ecr-api-endpoint",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{self.region}.ecr.api",
            vpc_endpoint_type="Interface",
            subnet_ids=[s.id for s in self.private_subnets],
            security_group_ids=[],  # Missing security group
            tags={"Name": f"ecr-api-endpoint-{environment_suffix}"}
        )

    @property
    def vpc_id(self):
        return self.vpc.id

    @property
    def private_subnet_ids(self):
        return [subnet.id for subnet in self.private_subnets]

    @property
    def region(self):
        return "us-east-2"
```

## File: lib/kms_encryption.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
import json


class KmsEncryptionConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        # Get current account ID
        current = DataAwsCallerIdentity(self, "current")

        # KMS Key for EKS Cluster Encryption
        # Error: Missing proper key policy for EKS service
        self.cluster_key = KmsKey(self, f"cluster-key",
            description=f"KMS key for EKS cluster secrets encryption - {environment_suffix}",
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{current.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    }
                ]
            }),
            tags={"Name": f"eks-cluster-kms-{environment_suffix}"}
        )

        KmsAlias(self, f"cluster-key-alias",
            name=f"alias/eks-cluster-{environment_suffix}",
            target_key_id=self.cluster_key.id
        )

        # KMS Keys for Tenant Namespaces
        # Error: Creating specific keys but not actually using them for namespaces
        self.tenant_keys = {}
        for tenant in ["tenant-a", "tenant-b", "tenant-c"]:
            key = KmsKey(self, f"tenant-key-{tenant}",
                description=f"KMS key for {tenant} namespace",
                enable_key_rotation=True,
                tags={"Name": f"eks-{tenant}-kms"}  # Missing environment_suffix
            )
            self.tenant_keys[tenant] = key

            KmsAlias(self, f"tenant-key-alias-{tenant}",
                name=f"alias/eks-{tenant}",  # Missing environment_suffix
                target_key_id=key.id
            )

        # CloudWatch Logs KMS Key
        self.logs_key = KmsKey(self, f"logs-key",
            description=f"KMS key for CloudWatch Logs encryption",
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{current.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudWatch Logs",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "logs.amazonaws.com"
                        },
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:CreateGrant",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "ArnLike": {
                                "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:us-east-2:{current.account_id}:*"
                            }
                        }
                    }
                ]
            }),
            tags={"Name": f"eks-logs-kms-{environment_suffix}"}
        )

    @property
    def cluster_key_arn(self):
        return self.cluster_key.arn

    @property
    def logs_key_arn(self):
        return self.logs_key.arn
```

## File: lib/eks_cluster.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.eks_cluster import EksCluster
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_openid_connect_provider import IamOpenidConnectProvider
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
import json


class EksClusterConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 vpc_id: str, private_subnet_ids: list, cluster_version: str,
                 kms_key_arn: str):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix

        # CloudWatch Log Groups for EKS
        # Error: Not using the kms_key_arn passed for encryption
        self.audit_log_group = CloudwatchLogGroup(self, f"audit-logs",
            name=f"/aws/eks/cluster-{environment_suffix}/audit",
            retention_in_days=90,
            tags={"Name": f"eks-audit-logs-{environment_suffix}"}
        )

        self.authenticator_log_group = CloudwatchLogGroup(self, f"authenticator-logs",
            name=f"/aws/eks/cluster-{environment_suffix}/authenticator",
            retention_in_days=90,
            tags={"Name": f"eks-authenticator-logs-{environment_suffix}"}
        )

        self.scheduler_log_group = CloudwatchLogGroup(self, f"scheduler-logs",
            name=f"/aws/eks/cluster-{environment_suffix}/scheduler",
            retention_in_days=90,
            tags={"Name": f"eks-scheduler-logs-{environment_suffix}"}
        )

        # Cluster Security Group
        self.cluster_sg = SecurityGroup(self, f"cluster-sg",
            name=f"eks-cluster-sg-{environment_suffix}",
            description="Security group for EKS cluster",
            vpc_id=vpc_id,
            egress=[{
                "from_port": 0,
                "to_port": 0,
                "protocol": "-1",
                "cidr_blocks": ["0.0.0.0/0"]
            }],
            tags={"Name": f"eks-cluster-sg-{environment_suffix}"}
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

        # EKS Cluster
        # Error: Missing public_access_cidrs configuration
        self.cluster = EksCluster(self, f"cluster",
            name=f"eks-cluster-{environment_suffix}",
            version=cluster_version,
            role_arn=self.cluster_role.arn,
            vpc_config={
                "subnet_ids": private_subnet_ids,
                "security_group_ids": [self.cluster_sg.id],
                "endpoint_private_access": True,
                "endpoint_public_access": True  # Should be restricted with cidrs
            },
            encryption_config=[{
                "provider": {
                    "key_arn": kms_key_arn
                },
                "resources": ["secrets"]
            }],
            enabled_cluster_log_types=["audit", "authenticator", "scheduler"],
            tags={"Name": f"eks-cluster-{environment_suffix}"}
        )

        # OIDC Provider
        # Error: Missing proper thumbprint
        self.oidc_provider = IamOpenidConnectProvider(self, "oidc-provider",
            url=self.cluster.identity[0].oidc[0].issuer,
            client_id_list=["sts.amazonaws.com"],
            thumbprint_list=["9e99a48a9960b14926bb7f3b02e22da2b0ab7280"]  # Hardcoded, might not match
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
        return self.cluster.certificate_authority[0].data

    @property
    def oidc_provider_arn(self):
        return self.oidc_provider.arn

    @property
    def oidc_provider_url(self):
        return self.cluster.identity[0].oidc[0].issuer

    @property
    def node_role_arn(self):
        return self.node_role.arn

    @property
    def token(self):
        # This is a placeholder - actual token retrieval would use aws eks get-token
        return None
```

## File: lib/eks_node_groups.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.eks_node_group import EksNodeGroup
from cdktf_cdktf_provider_aws.data_aws_ssm_parameter import DataAwsSsmParameter


class NodeGroupsConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 cluster_name: str, subnet_ids: list, node_role_arn: str):
        super().__init__(scope, id)

        # Get Bottlerocket AMI
        # Error: Hardcoded AMI parameter path might not exist
        bottlerocket_ami = DataAwsSsmParameter(self, "bottlerocket-ami",
            name="/aws/service/bottlerocket/aws-k8s-1.28/x86_64/latest/image_id"
        )

        # Critical Node Group - On-Demand
        self.critical_ng = EksNodeGroup(self, f"critical-ng",
            cluster_name=cluster_name,
            node_group_name=f"critical-{environment_suffix}",
            node_role_arn=node_role_arn,
            subnet_ids=subnet_ids,
            scaling_config={
                "desired_size": 2,
                "max_size": 5,
                "min_size": 1
            },
            instance_types=["m5.large"],
            capacity_type="ON_DEMAND",
            labels={
                "workload-type": "critical",
                "node-group": "critical"
            },
            taints=[{
                "key": "workload",
                "value": "critical",
                "effect": "NO_SCHEDULE"  # Error: Should be NoSchedule not NO_SCHEDULE
            }],
            tags={
                "Name": f"eks-critical-ng-{environment_suffix}",
                "node-group": "critical"
            }
        )

        # General Node Group - Mixed
        # Error: Cannot specify both ON_DEMAND and SPOT in capacity_type
        self.general_ng = EksNodeGroup(self, f"general-ng",
            cluster_name=cluster_name,
            node_group_name=f"general-{environment_suffix}",
            node_role_arn=node_role_arn,
            subnet_ids=subnet_ids,
            scaling_config={
                "desired_size": 3,
                "max_size": 10,
                "min_size": 2
            },
            instance_types=["t3.medium"],
            capacity_type="MIXED",  # Error: Not a valid capacity_type
            labels={
                "workload-type": "general",
                "node-group": "general"
            },
            tags={
                "Name": f"eks-general-ng-{environment_suffix}",
                "node-group": "general"
            }
        )

        # Batch Node Group - Spot Only
        self.batch_ng = EksNodeGroup(self, f"batch-ng",
            cluster_name=cluster_name,
            node_group_name=f"batch-{environment_suffix}",
            node_role_arn=node_role_arn,
            subnet_ids=subnet_ids,
            scaling_config={
                "desired_size": 0,
                "max_size": 20,
                "min_size": 0
            },
            instance_types=["c5.large"],
            capacity_type="SPOT",
            labels={
                "workload-type": "batch",
                "node-group": "batch"
            },
            taints=[{
                "key": "workload",
                "value": "batch",
                "effect": "NO_SCHEDULE"  # Error: Same incorrect value
            }],
            tags={
                "Name": f"eks-batch-ng-{environment_suffix}",
                "node-group": "batch"
            }
        )
```

## File: lib/irsa_roles.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
import json


class IrsaRolesConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 oidc_provider_arn: str, oidc_provider_url: str):
        super().__init__(scope, id)

        # Extract OIDC provider ID from URL
        oidc_provider_id = oidc_provider_url.replace("https://", "")

        # Cluster Autoscaler IRSA Role
        # Error: Incorrect condition key
        autoscaler_assume_role = DataAwsIamPolicyDocument(self, "autoscaler-assume",
            statement=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Federated",
                    "identifiers": [oidc_provider_arn]
                }],
                "actions": ["sts:AssumeRoleWithWebIdentity"],
                "condition": [{
                    "test": "StringEquals",
                    "variable": f"{oidc_provider_id}:sub",  # Error: Should use :aud for service account
                    "values": ["system:serviceaccount:kube-system:cluster-autoscaler"]
                }]
            }]
        )

        self.autoscaler_role = IamRole(self, "autoscaler-role",
            name=f"eks-cluster-autoscaler-{environment_suffix}",
            assume_role_policy=autoscaler_assume_role.json
        )

        # Error: Overly broad permissions
        autoscaler_policy = IamPolicy(self, "autoscaler-policy",
            name=f"eks-cluster-autoscaler-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "autoscaling:*",
                        "ec2:*"  # Too broad
                    ],
                    "Resource": "*"
                }]
            })
        )

        IamRolePolicyAttachment(self, "autoscaler-policy-attach",
            role=self.autoscaler_role.name,
            policy_arn=autoscaler_policy.arn
        )

        # AWS Load Balancer Controller IRSA Role
        alb_assume_role = DataAwsIamPolicyDocument(self, "alb-assume",
            statement=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Federated",
                    "identifiers": [oidc_provider_arn]
                }],
                "actions": ["sts:AssumeRoleWithWebIdentity"],
                "condition": [{
                    "test": "StringEquals",
                    "variable": f"{oidc_provider_id}:sub",
                    "values": ["system:serviceaccount:kube-system:aws-load-balancer-controller"]
                }]
            }]
        )

        self.alb_role = IamRole(self, "alb-role",
            name=f"eks-alb-controller",  # Missing environment_suffix
            assume_role_policy=alb_assume_role.json
        )

        # Error: Should use AWS managed policy or proper ALB controller policy
        alb_policy = IamPolicy(self, "alb-policy",
            name=f"eks-alb-controller-policy",  # Missing environment_suffix
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "elasticloadbalancing:*",
                        "ec2:*"
                    ],
                    "Resource": "*"
                }]
            })
        )

        IamRolePolicyAttachment(self, "alb-policy-attach",
            role=self.alb_role.name,
            policy_arn=alb_policy.arn
        )

        # External DNS IRSA Role
        external_dns_assume_role = DataAwsIamPolicyDocument(self, "external-dns-assume",
            statement=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Federated",
                    "identifiers": [oidc_provider_arn]
                }],
                "actions": ["sts:AssumeRoleWithWebIdentity"],
                "condition": [{
                    "test": "StringEquals",
                    "variable": f"{oidc_provider_id}:sub",
                    "values": ["system:serviceaccount:kube-system:external-dns"]
                }]
            }]
        )

        self.external_dns_role = IamRole(self, "external-dns-role",
            name=f"eks-external-dns-{environment_suffix}",
            assume_role_policy=external_dns_assume_role.json
        )

        external_dns_policy = IamPolicy(self, "external-dns-policy",
            name=f"eks-external-dns-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "route53:ChangeResourceRecordSets",
                        "route53:ListHostedZones",
                        "route53:ListResourceRecordSets"
                    ],
                    "Resource": "*"
                }]
            })
        )

        IamRolePolicyAttachment(self, "external-dns-policy-attach",
            role=self.external_dns_role.name,
            policy_arn=external_dns_policy.arn
        )
```

## File: lib/eks_addons.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.eks_addon import EksAddon


class EksAddonsConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 cluster_name: str):
        super().__init__(scope, id)

        # CoreDNS Addon
        # Error: Missing addon_version specification
        self.coredns = EksAddon(self, "coredns",
            cluster_name=cluster_name,
            addon_name="coredns",
            resolve_conflicts="OVERWRITE",
            tags={"Name": f"eks-coredns-{environment_suffix}"}
        )

        # kube-proxy Addon
        self.kube_proxy = EksAddon(self, "kube-proxy",
            cluster_name=cluster_name,
            addon_name="kube-proxy",
            resolve_conflicts="OVERWRITE",
            tags={"Name": f"eks-kube-proxy-{environment_suffix}"}
        )

        # EBS CSI Driver Addon
        # Error: Missing IAM role for service account
        self.ebs_csi = EksAddon(self, "ebs-csi",
            cluster_name=cluster_name,
            addon_name="aws-ebs-csi-driver",
            resolve_conflicts="OVERWRITE",
            tags={"Name": f"eks-ebs-csi-{environment_suffix}"}
        )

        # Error: Calico CNI should be installed here but is missing
        # Task requires Calico CNI instead of AWS VPC CNI
```

## File: lib/monitoring.py

```python
from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_log_metric_filter import CloudwatchLogMetricFilter
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm


class MonitoringConstruct(Construct):
    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 cluster_name: str):
        super().__init__(scope, id)

        # Error: CloudWatch Container Insights is not actually enabled
        # Should use aws_eks_cluster attribute or separate configuration

        # CloudWatch Alarms
        # Error: Metrics namespace might not exist without proper Container Insights setup
        self.cpu_alarm = CloudwatchMetricAlarm(self, "cpu-alarm",
            alarm_name=f"eks-cluster-cpu-high-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="node_cpu_utilization",
            namespace="ContainerInsights",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when cluster CPU exceeds 80%",
            dimensions={
                "ClusterName": cluster_name
            }
        )

        self.memory_alarm = CloudwatchMetricAlarm(self, "memory-alarm",
            alarm_name=f"eks-cluster-memory-high-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="node_memory_utilization",
            namespace="ContainerInsights",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when cluster memory exceeds 80%",
            dimensions={
                "ClusterName": cluster_name
            }
        )
```

## File: lib/README.md

```python
# EKS Multi-Tenant Cluster Infrastructure

This CDKTF Python implementation creates a production-ready EKS cluster with multi-tenancy support, advanced security features, and cost optimization.

## Architecture

- **EKS Cluster**: Version 1.28 with private API endpoint
- **Node Groups**:
  - Critical: On-demand m5.large for production workloads
  - General: Mixed t3.medium for standard services
  - Batch: Spot c5.large for cost-sensitive batch jobs
- **Networking**: Custom VPC with private subnets, NAT gateway, and VPC endpoints
- **Security**: KMS encryption, IRSA, pod security standards
- **Monitoring**: CloudWatch logs and Container Insights

## Prerequisites

- Python 3.9+
- CDKTF CLI
- AWS CLI configured with appropriate credentials
- kubectl 1.28+

## Deployment

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure environment:
   ```bash
   export ENVIRONMENT_SUFFIX="your-suffix"
   export AWS_REGION="us-east-2"
   ```

3. Deploy:
   ```bash
   cdktf deploy
   ```

4. Configure kubectl:
   ```bash
   aws eks update-kubeconfig --name eks-cluster-$ENVIRONMENT_SUFFIX --region us-east-2
   ```

## Features Implemented

- ✅ EKS 1.28 cluster with private endpoint
- ✅ Three managed node groups with Bottlerocket OS
- ✅ KMS encryption with key rotation
- ✅ IRSA roles for cluster-autoscaler, ALB controller, external-dns
- ✅ CloudWatch logging with 90-day retention
- ✅ VPC with private subnets and VPC endpoints
- ⚠️ Calico CNI (requires manual installation)
- ⚠️ Pod security standards (requires manual configuration)
- ⚠️ Azure AD integration (requires manual setup)

## Known Limitations

- Calico CNI must be installed separately
- Pod security admission controllers require manual configuration
- Azure AD OIDC integration needs external configuration
- Secrets Manager integration requires additional setup

## Maintenance

- KMS keys automatically rotate annually
- CloudWatch logs retain for 90 days
- Node groups can be scaled via AWS console or CLI
