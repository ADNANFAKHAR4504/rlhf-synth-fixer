I'll create a comprehensive Pulumi Python program that implements a secure, resilient AWS infrastructure with CI/CD pipeline capabilities. This solution will strictly adhere to all the specified requirements.

## Project Structure

```
corp-aws-infrastructure/
├── __main__.py
├── requirements.txt
├── Pulumi.yaml
├── Pulumi.dev.yaml
├── modules/
│   ├── __init__.py
│   ├── networking.py
│   ├── security.py
│   ├── compute.py
│   ├── database.py
│   ├── storage.py
│   ├── monitoring.py
│   └── cicd.py
├── policies/
│   └── iam_policies.py
└── tests/
    ├── test_infrastructure.py
    └── test_integration.py
```

## Core Infrastructure Implementation

### `__main__.py`
```python
"""
Corporate AWS Infrastructure - Main Pulumi Program
Implements secure, resilient AWS environment with CI/CD pipeline
"""

import pulumi
from pulumi import Config, Output
from typing import Dict, Any
import json

from modules.networking import NetworkingModule
from modules.security import SecurityModule
from modules.compute import ComputeModule
from modules.database import DatabaseModule
from modules.storage import StorageModule
from modules.monitoring import MonitoringModule
from modules.cicd import CICDModule

# Configuration and tags
config = Config()
stack = pulumi.get_stack()

# Common tags applied to all resources
common_tags: Dict[str, str] = {
    "Environment": config.get("environment") or "production",
    "Project": config.get("project") or "corp-infrastructure",
    "Stack": stack,
    "ManagedBy": "pulumi",
    "Owner": config.get("owner") or "platform-team",
    "CostCenter": config.get("cost_center") or "engineering"
}

def main() -> None:
    """
    Main function to orchestrate infrastructure deployment
    """
    
    # 1. Security Foundation (KMS, Parameter Store)
    security = SecurityModule(
        name_prefix="corp",
        tags=common_tags
    )
    
    # 2. Networking Infrastructure
    networking = NetworkingModule(
        name_prefix="corp",
        cidr_block="10.0.0.0/16",
        availability_zones=["us-west-2a", "us-west-2b"],
        tags=common_tags
    )
    
    # 3. Storage Infrastructure
    storage = StorageModule(
        name_prefix="corp",
        kms_key=security.kms_key,
        tags=common_tags
    )
    
    # 4. Database Infrastructure
    database = DatabaseModule(
        name_prefix="corp",
        vpc_id=networking.vpc.id,
        private_subnet_ids=networking.private_subnet_ids,
        kms_key=security.kms_key,
        security_group_id=security.database_security_group.id,
        tags=common_tags
    )
    
    # 5. Monitoring Infrastructure
    monitoring = MonitoringModule(
        name_prefix="corp",
        tags=common_tags
    )
    
    # 6. Compute Infrastructure (EKS)
    compute = ComputeModule(
        name_prefix="corp",
        vpc_id=networking.vpc.id,
        private_subnet_ids=networking.private_subnet_ids,
        public_subnet_ids=networking.public_subnet_ids,
        kms_key=security.kms_key,
        cluster_role_arn=security.eks_cluster_role.arn,
        node_group_role_arn=security.eks_node_group_role.arn,
        alb_security_group_id=security.alb_security_group.id,
        eks_security_group_id=security.eks_security_group.id,
        log_group=monitoring.eks_log_group,
        tags=common_tags
    )
    
    # 7. CI/CD Pipeline
    cicd = CICDModule(
        name_prefix="corp",
        eks_cluster_name=compute.cluster.name,
        artifacts_bucket=storage.artifacts_bucket,
        codebuild_role_arn=security.codebuild_role.arn,
        codepipeline_role_arn=security.codepipeline_role.arn,
        kms_key=security.kms_key,
        tags=common_tags
    )
    
    # Export important outputs
    export_outputs(networking, compute, database, storage, monitoring, cicd)

def export_outputs(networking, compute, database, storage, monitoring, cicd) -> None:
    """Export key infrastructure outputs"""
    
    # Networking outputs
    pulumi.export("vpc_id", networking.vpc.id)
    pulumi.export("public_subnet_ids", networking.public_subnet_ids)
    pulumi.export("private_subnet_ids", networking.private_subnet_ids)
    
    # Compute outputs
    pulumi.export("eks_cluster_name", compute.cluster.name)
    pulumi.export("eks_cluster_endpoint", compute.cluster.endpoint)
    pulumi.export("alb_dns_name", compute.alb.dns_name)
    pulumi.export("alb_zone_id", compute.alb.zone_id)
    
    # Database outputs
    pulumi.export("rds_endpoint", database.instance.endpoint)
    pulumi.export("rds_port", database.instance.port)
    
    # Storage outputs
    pulumi.export("artifacts_bucket_name", storage.artifacts_bucket.bucket)
    pulumi.export("logs_bucket_name", storage.logs_bucket.bucket)
    
    # Monitoring outputs
    pulumi.export("cloudwatch_log_group", monitoring.eks_log_group.name)
    
    # CI/CD outputs
    pulumi.export("codepipeline_name", cicd.pipeline.name)
    pulumi.export("codebuild_project_name", cicd.build_project.name)

if __name__ == "__main__":
    main()
```

### `modules/networking.py`
```python
"""
Networking Module - VPC, Subnets, Gateways, Route Tables
"""

import pulumi
import pulumi_aws as aws
from typing import List, Dict, Any
from pulumi import Output

class NetworkingModule:
    """
    Creates secure networking infrastructure with multi-AZ deployment
    """
    
    def __init__(
        self,
        name_prefix: str,
        cidr_block: str,
        availability_zones: List[str],
        tags: Dict[str, Any]
    ):
        self.name_prefix = name_prefix
        self.cidr_block = cidr_block
        self.availability_zones = availability_zones
        self.tags = tags
        
        # Create networking components
        self._create_vpc()
        self._create_subnets()
        self._create_gateways()
        self._create_route_tables()
        
    def _create_vpc(self) -> None:
        """Create VPC with DNS support"""
        self.vpc = aws.ec2.Vpc(
            f"{self.name_prefix}-vpc",
            cidr_block=self.cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-vpc"
            }
        )
        
    def _create_subnets(self) -> None:
        """Create public and private subnets across AZs"""
        self.public_subnets = []
        self.private_subnets = []
        
        for i, az in enumerate(self.availability_zones):
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"{self.name_prefix}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.tags,
                    "Name": f"{self.name_prefix}-public-subnet-{i+1}",
                    "Type": "public",
                    "kubernetes.io/role/elb": "1"
                }
            )
            self.public_subnets.append(public_subnet)
            
            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"{self.name_prefix}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    **self.tags,
                    "Name": f"{self.name_prefix}-private-subnet-{i+1}",
                    "Type": "private",
                    "kubernetes.io/role/internal-elb": "1"
                }
            )
            self.private_subnets.append(private_subnet)
            
    def _create_gateways(self) -> None:
        """Create Internet Gateway and NAT Gateway"""
        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"{self.name_prefix}-igw",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-igw"
            }
        )
        
        # Elastic IP for NAT Gateway
        self.nat_eip = aws.ec2.Eip(
            f"{self.name_prefix}-nat-eip",
            domain="vpc",
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-nat-eip"
            }
        )
        
        # NAT Gateway in first public subnet
        self.nat_gateway = aws.ec2.NatGateway(
            f"{self.name_prefix}-nat-gateway",
            allocation_id=self.nat_eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-nat-gateway"
            }
        )
        
    def _create_route_tables(self) -> None:
        """Create and configure route tables"""
        # Public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"{self.name_prefix}-public-rt",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-public-rt"
            }
        )
        
        # Public route to Internet Gateway
        aws.ec2.Route(
            f"{self.name_prefix}-public-route",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.name_prefix}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id
            )
            
        # Private route table
        self.private_route_table = aws.ec2.RouteTable(
            f"{self.name_prefix}-private-rt",
            vpc_id=self.vpc.id,
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-private-rt"
            }
        )
        
        # Private route to NAT Gateway
        aws.ec2.Route(
            f"{self.name_prefix}-private-route",
            route_table_id=self.private_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=self.nat_gateway.id
        )
        
        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.name_prefix}-private-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id
            )
    
    @property
    def public_subnet_ids(self) -> Output[List[str]]:
        """Return list of public subnet IDs"""
        return Output.all(*[subnet.id for subnet in self.public_subnets])
    
    @property
    def private_subnet_ids(self) -> Output[List[str]]:
        """Return list of private subnet IDs"""
        return Output.all(*[subnet.id for subnet in self.private_subnets])
```

### `modules/security.py`
```python
"""
Security Module - IAM, KMS, Security Groups, Parameter Store
"""

import pulumi
import pulumi_aws as aws
import json
from typing import Dict, Any
from policies.iam_policies import IAMPolicies

class SecurityModule:
    """
    Creates comprehensive security infrastructure with least privilege access
    """
    
    def __init__(self, name_prefix: str, tags: Dict[str, Any]):
        self.name_prefix = name_prefix
        self.tags = tags
        self.policies = IAMPolicies()
        
        # Create security components
        self._create_kms_key()
        self._create_parameter_store()
        self._create_iam_roles()
        self._create_security_groups()
        
    def _create_kms_key(self) -> None:
        """Create KMS key for encryption"""
        self.kms_key = aws.kms.Key(
            f"{self.name_prefix}-kms-key",
            description=f"KMS key for {self.name_prefix} infrastructure encryption",
            deletion_window_in_days=7,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {"AWS": f"arn:aws:iam::{aws.get_caller_identity().account_id}:root"},
                        "Action": "kms:*",
                        "Resource": "*"
                    }
                ]
            }),
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-kms-key"
            }
        )
        
        self.kms_alias = aws.kms.Alias(
            f"{self.name_prefix}-kms-alias",
            name=f"alias/{self.name_prefix}-encryption-key",
            target_key_id=self.kms_key.key_id
        )
        
    def _create_parameter_store(self) -> None:
        """Create Parameter Store parameters for secrets"""
        # Database password
        self.db_password_param = aws.ssm.Parameter(
            f"{self.name_prefix}-db-password",
            name=f"/{self.name_prefix}/database/password",
            type="SecureString",
            value="TempPassword123!",  # Should be updated after deployment
            key_id=self.kms_key.arn,
            description="Database master password",
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-db-password"
            }
        )
        
        # GitHub token for CI/CD
        self.github_token_param = aws.ssm.Parameter(
            f"{self.name_prefix}-github-token",
            name=f"/{self.name_prefix}/cicd/github-token",
            type="SecureString",
            value="placeholder-token",  # Should be updated after deployment
            key_id=self.kms_key.arn,
            description="GitHub personal access token for CI/CD",
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-github-token"
            }
        )
        
    def _create_iam_roles(self) -> None:
        """Create IAM roles with least privilege policies"""
        
        # EKS Cluster Role
        self.eks_cluster_role = aws.iam.Role(
            f"{self.name_prefix}-eks-cluster-role",
            assume_role_policy=json.dumps(self.policies.eks_cluster_assume_role_policy()),
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-eks-cluster-role"
            }
        )
        
        # Attach required policies to EKS cluster role
        aws.iam.RolePolicyAttachment(
            f"{self.name_prefix}-eks-cluster-policy",
            role=self.eks_cluster_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
        )
        
        # EKS Node Group Role
        self.eks_node_group_role = aws.iam.Role(
            f"{self.name_prefix}-eks-node-group-role",
            assume_role_policy=json.dumps(self.policies.ec2_assume_role_policy()),
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-eks-node-group-role"
            }
        )
        
        # Attach required policies to EKS node group role
        for policy_arn in [
            "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
            "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
            "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
        ]:
            aws.iam.RolePolicyAttachment(
                f"{self.name_prefix}-eks-node-{policy_arn.split('/')[-1]}",
                role=self.eks_node_group_role.name,
                policy_arn=policy_arn
            )
            
        # CodeBuild Role
        self.codebuild_role = aws.iam.Role(
            f"{self.name_prefix}-codebuild-role",
            assume_role_policy=json.dumps(self.policies.codebuild_assume_role_policy()),
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-codebuild-role"
            }
        )
        
        # CodeBuild policy
        self.codebuild_policy = aws.iam.RolePolicy(
            f"{self.name_prefix}-codebuild-policy",
            role=self.codebuild_role.id,
            policy=self.kms_key.arn.apply(
                lambda arn: json.dumps(self.policies.codebuild_policy(arn))
            )
        )
        
        # CodePipeline Role
        self.codepipeline_role = aws.iam.Role(
            f"{self.name_prefix}-codepipeline-role",
            assume_role_policy=json.dumps(self.policies.codepipeline_assume_role_policy()),
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-codepipeline-role"
            }
        )
        
        # CodePipeline policy
        self.codepipeline_policy = aws.iam.RolePolicy(
            f"{self.name_prefix}-codepipeline-policy",
            role=self.codepipeline_role.id,
            policy=self.kms_key.arn.apply(
                lambda arn: json.dumps(self.policies.codepipeline_policy(arn))
            )
        )
        
    def _create_security_groups(self) -> None:
        """Create security groups with restrictive rules"""
        # Note: VPC ID will be set when this module is instantiated
        self.vpc_id = None
        
    def create_security_groups_with_vpc(self, vpc_id: str) -> None:
        """Create security groups after VPC is available"""
        
        # ALB Security Group - allows HTTP/HTTPS from internet
        self.alb_security_group = aws.ec2.SecurityGroup(
            f"{self.name_prefix}-alb-sg",
            name=f"{self.name_prefix}-alb-sg",
            description="Security group for Application Load Balancer",
            vpc_id=vpc_id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from internet"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from internet"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic"
                )
            ],
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-alb-sg"
            }
        )
        
        # EKS Security Group - allows traffic from ALB
        self.eks_security_group = aws.ec2.SecurityGroup(
            f"{self.name_prefix}-eks-sg",
            name=f"{self.name_prefix}-eks-sg",
            description="Security group for EKS cluster",
            vpc_id=vpc_id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    security_groups=[self.alb_security_group.id],
                    description="HTTP from ALB"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    security_groups=[self.alb_security_group.id],
                    description="HTTPS from ALB"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="All outbound traffic"
                )
            ],
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-eks-sg"
            }
        )
        
        # Database Security Group - allows traffic from EKS only
        self.database_security_group = aws.ec2.SecurityGroup(
            f"{self.name_prefix}-db-sg",
            name=f"{self.name_prefix}-db-sg",
            description="Security group for RDS database",
            vpc_id=vpc_id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[self.eks_security_group.id],
                    description="PostgreSQL from EKS"
                )
            ],
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-db-sg"
            }
        )
```

### `policies/iam_policies.py`
```python
"""
IAM Policies - Centralized policy definitions following least privilege
"""

from typing import Dict, Any, List
import pulumi_aws as aws

class IAMPolicies:
    """
    Centralized IAM policy definitions with least privilege access
    """
    
    def eks_cluster_assume_role_policy(self) -> Dict[str, Any]:
        """EKS cluster service assume role policy"""
        return {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "eks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
    
    def ec2_assume_role_policy(self) -> Dict[str, Any]:
        """EC2 service assume role policy"""
        return {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
    
    def codebuild_assume_role_policy(self) -> Dict[str, Any]:
        """CodeBuild service assume role policy"""
        return {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "codebuild.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
    
    def codepipeline_assume_role_policy(self) -> Dict[str, Any]:
        """CodePipeline service assume role policy"""
        return {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "codepipeline.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
    
    def codebuild_policy(self, kms_key_arn: str) -> Dict[str, Any]:
        """CodeBuild service policy with minimal required permissions"""
        account_id = aws.get_caller_identity().account_id
        return {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:us-west-2:{account_id}:log-group:/aws/codebuild/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::corp-artifacts-*/*",
                        f"arn:aws:s3:::corp-logs-*/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": kms_key_arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "eks:DescribeCluster"
                    ],
                    "Resource": f"arn:aws:eks:us-west-2:{account_id}:cluster/corp-*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ssm:GetParameter",
                        "ssm:GetParameters"
                    ],
                    "Resource": f"arn:aws:ssm:us-west-2:{account_id}:parameter/corp/*"
                }
            ]
        }
    
    def codepipeline_policy(self, kms_key_arn: str) -> Dict[str, Any]:
        """CodePipeline service policy with minimal required permissions"""
        account_id = aws.get_caller_identity().account_id
        return {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:GetBucketVersioning"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::corp-artifacts-*",
                        f"arn:aws:s3:::corp-artifacts-*/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "codebuild:BatchGetBuilds",
                        "codebuild:StartBuild"
                    ],
                    "Resource": f"arn:aws:codebuild:us-west-2:{account_id}:project/corp-*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": kms_key_arn
                }
            ]
        }
```

### `modules/compute.py`
```python
"""
Compute Module - EKS Cluster, Node Groups, Application Load Balancer
"""

import pulumi
import pulumi_aws as aws
import pulumi_kubernetes as k8s
from typing import Dict, Any, List
from pulumi import Output

class ComputeModule:
    """
    Creates EKS cluster with auto-scaling and Application Load Balancer
    """
    
    def __init__(
        self,
        name_prefix: str,
        vpc_id: Output[str],
        private_subnet_ids: Output[List[str]],
        public_subnet_ids: Output[List[str]],
        kms_key: aws.kms.Key,
        cluster_role_arn: Output[str],
        node_group_role_arn: Output[str],
        alb_security_group_id: Output[str],
        eks_security_group_id: Output[str],
        log_group: aws.cloudwatch.LogGroup,
        tags: Dict[str, Any]
    ):
        self.name_prefix = name_prefix
        self.vpc_id = vpc_id
        self.private_subnet_ids = private_subnet_ids
        self.public_subnet_ids = public_subnet_ids
        self.kms_key = kms_key
        self.cluster_role_arn = cluster_role_arn
        self.node_group_role_arn = node_group_role_arn
        self.alb_security_group_id = alb_security_group_id
        self.eks_security_group_id = eks_security_group_id
        self.log_group = log_group
        self.tags = tags
        
        # Create compute components
        self._create_eks_cluster()
        self._create_node_group()
        self._create_alb()
        self._deploy_nginx()
        
    def _create_eks_cluster(self) -> None:
        """Create EKS cluster with encryption and logging"""
        self.cluster = aws.eks.Cluster(
            f"{self.name_prefix}-eks-cluster",
            name=f"{self.name_prefix}-eks-cluster",
            role_arn=self.cluster_role_arn,
            version="1.27",
            vpc_config=aws.eks.ClusterVpcConfigArgs(
                subnet_ids=Output.all(
                    self.private_subnet_ids,
                    self.public_subnet_ids
                ).apply(lambda subnets: subnets[0] + subnets[1]),
                security_group_ids=[self.eks_security_group_id],
                endpoint_private_access=True,
                endpoint_public_access=True,
                public_access_cidrs=["0.0.0.0/0"]
            ),
            encryption_config=aws.eks.ClusterEncryptionConfigArgs(
                provider=aws.eks.ClusterEncryptionConfigProviderArgs(
                    key_arn=self.kms_key.arn
                ),
                resources=["secrets"]
            ),
            enabled_cluster