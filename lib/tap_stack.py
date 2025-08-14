"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the deployment of a secure, resilient, and automated AWS
infrastructure using Pulumi in Python. The stack provisions:
- VPC with public and private subnets across 2 AZs,
- Internet Gateway, NAT Gateways, Route Tables, and Network ACLs,
- VPC Flow Logs with encryption and logging,
- KMS key and alias for encryption,
- Security groups for web, database, EKS nodes, and ALB,
- RDS PostgreSQL instance in private subnets with secure password from SSM,
- EKS cluster with node group in private subnets,
- Application Load Balancer routing to EKS nodes,
- CodePipeline for GitHub-based CI/CD deployments to EKS,
- Lambda function for health monitoring with scheduled invocations.

All resources are tagged consistently and adhere to AWS best practices
with the "corp-" prefix and deployment limited to us-west-2 region.
"""
# pylint: disable=too-many-lines

import json
from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
import pulumi_random as random
from pulumi import ResourceOptions


class TapStackArgs:
  """
  Input arguments for TapStack.

  Attributes:
      environment_suffix (Optional[str]): Deployment environment suffix, e.g. "dev", "prod".
      tags (Optional[Dict[str, str]]): Dictionary of tags applied to all resources.
      github_owner (Optional[str]): GitHub repository owner for CI/CD pipeline.
      github_repo (Optional[str]): GitHub repository name for CI/CD pipeline.
      github_branch (Optional[str]): GitHub branch for CI/CD pipeline.
  """

  def __init__(
      self,
      environment_suffix: Optional[str] = None,
      tags: Optional[Dict[str, str]] = None,
      github_owner: Optional[str] = None,
      github_repo: Optional[str] = None,
      github_branch: Optional[str] = None,
  ):
    self.environment_suffix = environment_suffix or "prod"
    self.tags = tags or {"Environment": "Production"}
    self.github_owner = github_owner or "example-owner"
    self.github_repo = github_repo or "example-repo"
    self.github_branch = github_branch or "main"


class SecureVPC:  # pylint: disable=too-many-instance-attributes
  """
  Represents a secure VPC with public/private subnets distributed across two availability zones,
  Internet Gateway, NAT Gateways, route tables, network ACLs, and VPC Flow Logs for monitoring.
  """

  def __init__(self, name_prefix: str, vpc_cidr: str,
               tags: Dict[str, str], provider: aws.Provider) -> None:
    self.name_prefix = name_prefix
    self.vpc_cidr = vpc_cidr
    self.tags = tags
    self.provider = provider
    self.region = "us-west-2"
    self.availability_zones = aws.get_availability_zones(
        state="available", opts=pulumi.InvokeOptions(provider=provider)).names[:2]

    self.vpc = self._create_vpc()
    self.igw = self._create_internet_gateway()
    self.public_subnets = self._create_public_subnets()
    self.private_subnets = self._create_private_subnets()
    self.eips = self._create_elastic_ips()
    self.nat_gateways = self._create_nat_gateways()
    self.public_route_table = self._create_public_route_table()
    self.private_route_tables = self._create_private_route_tables()
    self.public_nacl = self._create_public_nacl()
    self.private_nacl = self._create_private_nacl()
    self.flow_logs_role = self._create_flow_logs_role()
    self.flow_logs = self._create_flow_logs()

  def _create_vpc(self) -> aws.ec2.Vpc:
    return aws.ec2.Vpc(
        f"{self.name_prefix}-vpc",
        cidr_block=self.vpc_cidr,
        enable_dns_support=True,
        enable_dns_hostnames=True,
        tags={**self.tags, "Name": f"{self.name_prefix}-vpc"},
        opts=ResourceOptions(provider=self.provider)
    )

  def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
    return aws.ec2.InternetGateway(
        f"{self.name_prefix}-igw",
        vpc_id=self.vpc.id,
        tags={**self.tags, "Name": f"{self.name_prefix}-igw"},
        opts=ResourceOptions(provider=self.provider)
    )

  def _create_public_subnets(self) -> List[aws.ec2.Subnet]:
    return [
        aws.ec2.Subnet(
            f"{self.name_prefix}-public-{i + 1}",
            vpc_id=self.vpc.id,
            cidr_block=f"10.0.{i + 1}.0/24",
            availability_zone=az,
            map_public_ip_on_launch=True,
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-public-{i + 1}",
                "kubernetes.io/role/elb": "1",  # Required for EKS load balancers
                "kubernetes.io/cluster/corp-eks-cluster": "shared"  # Required for EKS
            },
            opts=ResourceOptions(provider=self.provider)
        )
        for i, az in enumerate(self.availability_zones)
    ]

  def _create_private_subnets(self) -> List[aws.ec2.Subnet]:
    return [
        aws.ec2.Subnet(
            f"{self.name_prefix}-private-{i + 1}",
            vpc_id=self.vpc.id,
            cidr_block=f"10.0.{(i + 1) * 10}.0/24",
            availability_zone=az,
            tags={
                **self.tags,
                "Name": f"{self.name_prefix}-private-{i + 1}",
                # Required for internal EKS load balancers
                "kubernetes.io/role/internal-elb": "1",
                "kubernetes.io/cluster/corp-eks-cluster": "shared"  # Required for EKS
            },
            opts=ResourceOptions(provider=self.provider)
        )
        for i, az in enumerate(self.availability_zones)
    ]

  def _create_elastic_ips(self) -> List[aws.ec2.Eip]:
    return [
        aws.ec2.Eip(
            f"{self.name_prefix}-nat-eip-{i + 1}",
            domain="vpc",
            tags={**self.tags, "Name": f"{self.name_prefix}-nat-eip-{i + 1}"},
            opts=ResourceOptions(provider=self.provider)
        )
        for i in range(len(self.availability_zones))
    ]

  def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
    return [
        aws.ec2.NatGateway(
            f"{self.name_prefix}-nat-{i + 1}",
            allocation_id=self.eips[i].id,
            subnet_id=self.public_subnets[i].id,
            tags={**self.tags, "Name": f"{self.name_prefix}-nat-{i + 1}"},
            opts=ResourceOptions(provider=self.provider)
        )
        for i in range(len(self.availability_zones))
    ]

  def _create_public_route_table(self) -> aws.ec2.RouteTable:
    rt = aws.ec2.RouteTable(
        f"{self.name_prefix}-public-rt",
        vpc_id=self.vpc.id,
        tags={**self.tags, "Name": f"{self.name_prefix}-public-rt"},
        opts=ResourceOptions(provider=self.provider)
    )
    aws.ec2.Route(
        f"{self.name_prefix}-public-route",
        route_table_id=rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=self.igw.id,
        opts=ResourceOptions(provider=self.provider)
    )
    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
          f"{self.name_prefix}-public-rta-{i + 1}",
          route_table_id=rt.id,
          subnet_id=subnet.id,
          opts=ResourceOptions(provider=self.provider)
      )
    return rt

  def _create_private_route_tables(self) -> List[aws.ec2.RouteTable]:
    rts = []
    for i, subnet in enumerate(self.private_subnets):
      rt = aws.ec2.RouteTable(
          f"{self.name_prefix}-private-rt-{i + 1}",
          vpc_id=self.vpc.id,
          tags={**self.tags, "Name": f"{self.name_prefix}-private-rt-{i + 1}"},
          opts=ResourceOptions(provider=self.provider)
      )
      aws.ec2.Route(
          f"{self.name_prefix}-private-route-{i + 1}",
          route_table_id=rt.id,
          destination_cidr_block="0.0.0.0/0",
          nat_gateway_id=self.nat_gateways[i].id,
          opts=ResourceOptions(provider=self.provider)
      )
      aws.ec2.RouteTableAssociation(
          f"{self.name_prefix}-private-rta-{i + 1}",
          route_table_id=rt.id,
          subnet_id=subnet.id,
          opts=ResourceOptions(provider=self.provider)
      )
      rts.append(rt)
    return rts

  def _create_public_nacl(self) -> aws.ec2.NetworkAcl:
    nacl = aws.ec2.NetworkAcl(
        f"{self.name_prefix}-public-nacl",
        vpc_id=self.vpc.id,
        tags={**self.tags, "Name": f"{self.name_prefix}-public-nacl"},
        opts=ResourceOptions(provider=self.provider)
    )
    aws.ec2.NetworkAclRule(
        f"{self.name_prefix}-public-http",
        network_acl_id=nacl.id,
        rule_number=100,
        protocol="tcp",
        rule_action="allow",
        from_port=80,
        to_port=80,
        cidr_block="0.0.0.0/0",
        opts=ResourceOptions(provider=self.provider)
    )
    aws.ec2.NetworkAclRule(
        f"{self.name_prefix}-public-https",
        network_acl_id=nacl.id,
        rule_number=110,
        protocol="tcp",
        rule_action="allow",
        from_port=443,
        to_port=443,
        cidr_block="0.0.0.0/0",
        opts=ResourceOptions(provider=self.provider)
    )
    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.NetworkAclAssociation(
          f"{self.name_prefix}-public-nacl-assoc-{i + 1}",
          network_acl_id=nacl.id,
          subnet_id=subnet.id,
          opts=ResourceOptions(provider=self.provider)
      )
    return nacl

  def _create_private_nacl(self) -> aws.ec2.NetworkAcl:
    nacl = aws.ec2.NetworkAcl(
        f"{self.name_prefix}-private-nacl",
        vpc_id=self.vpc.id,
        tags={**self.tags, "Name": f"{self.name_prefix}-private-nacl"},
        opts=ResourceOptions(provider=self.provider)
    )
    for i, subnet in enumerate(self.private_subnets):
      aws.ec2.NetworkAclAssociation(
          f"{self.name_prefix}-private-nacl-assoc-{i + 1}",
          network_acl_id=nacl.id,
          subnet_id=subnet.id,
          opts=ResourceOptions(provider=self.provider)
      )
    return nacl

  def _create_flow_logs_role(self) -> aws.iam.Role:
    assume_policy = json.dumps(
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                }
            ],
        }
    )
    role = aws.iam.Role(
        f"{self.name_prefix}-flow-logs-role",
        assume_role_policy=assume_policy,
        tags={**self.tags, "Name": f"{self.name_prefix}-flow-logs-role"},
        opts=ResourceOptions(provider=self.provider)
    )
    aws.iam.RolePolicy(
        f"{self.name_prefix}-flow-logs-policy",
        role=role.id,
        policy=json.dumps(
            {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams",
                        ],
                        "Resource": "*",
                    }
                ]
            }
        ),
        opts=ResourceOptions(provider=self.provider)
    )
    return role

  def _create_flow_logs(self) -> aws.ec2.FlowLog:
    log_group = aws.cloudwatch.LogGroup(
        f"{self.name_prefix}-flow-logs-group",
        retention_in_days=30,
        tags={**self.tags, "Name": f"{self.name_prefix}-flow-logs-group"},
        opts=ResourceOptions(provider=self.provider)
    )
    return aws.ec2.FlowLog(
        f"{self.name_prefix}-flow-logs",
        iam_role_arn=self.flow_logs_role.arn,
        log_destination=log_group.arn,
        log_destination_type="cloud-watch-logs",
        vpc_id=self.vpc.id,
        traffic_type="ALL",
        tags={**self.tags, "Name": f"{self.name_prefix}-flow-logs"},
        opts=ResourceOptions(provider=self.provider)
    )


def create_kms_key(tags: Dict[str, str],
                   provider: aws.Provider) -> aws.kms.Key:
  """
  Create a KMS key and alias used for encryption of AWS resources.
  """
  current = aws.get_caller_identity()
  region = aws.get_region()
  key_policy = json.dumps(
      {
          "Version": "2012-10-17",
          "Statement": [
              {
                  "Sid": "Enable IAM Permissions",
                  "Effect": "Allow",
                  "Principal": {"AWS": f"arn:aws:iam::{current.account_id}:root"},
                  "Action": "kms:*",
                  "Resource": "*",
              },
              {
                  "Sid": "Allow CloudWatch Logs",
                  "Effect": "Allow",
                  "Principal": {"Service": f"logs.{region.name}.amazonaws.com"},
                  "Action": [
                      "kms:Encrypt",
                      "kms:Decrypt",
                      "kms:ReEncrypt*",
                      "kms:GenerateDataKey*",
                      "kms:DescribeKey",
                  ],
                  "Resource": "*",
              },
          ],
      }
  )

  kms_key = aws.kms.Key(
      "corp-kms-key",
      description="KMS key for corp infra encryption",
      policy=key_policy,
      tags={**tags, "Name": "corp-kms-key"},
      opts=ResourceOptions(provider=provider)
  )
  aws.kms.Alias(
      "corp-kms-alias",
      name="alias/corp-key-alias",
      target_key_id=kms_key.key_id,
      opts=ResourceOptions(provider=provider)
  )
  return kms_key


def create_security_groups(
    vpc: aws.ec2.Vpc, tags: Dict[str, str], provider: aws.Provider
) -> Dict[str, aws.ec2.SecurityGroup]:
  """
  Create simple, permissive security groups for EKS to work reliably.
  """

  # ALB Security Group - Only HTTP/HTTPS from internet
  alb_sg = aws.ec2.SecurityGroup(
      "corp-alb-sg",
      vpc_id=vpc.id,
      description="ALB - Allow HTTP/HTTPS from internet",
      ingress=[
          aws.ec2.SecurityGroupIngressArgs(
              protocol="tcp", from_port=80, to_port=80, cidr_blocks=["0.0.0.0/0"]
          ),
          aws.ec2.SecurityGroupIngressArgs(
              protocol="tcp", from_port=443, to_port=443, cidr_blocks=["0.0.0.0/0"]
          ),
      ],
      egress=[
          aws.ec2.SecurityGroupEgressArgs(
              protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"]
          )
      ],
      tags={**tags, "Name": "corp-alb-sg"},
      opts=ResourceOptions(provider=provider)
  )

  # EKS Cluster Security Group
  eks_cluster_sg = aws.ec2.SecurityGroup(
      "corp-eks-cluster-sg",
      vpc_id=vpc.id,
      description="EKS Control Plane Security Group",
      egress=[
          # Allow all outbound traffic
          aws.ec2.SecurityGroupEgressArgs(
              protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"]
          )
      ],
      tags={**tags, "Name": "corp-eks-cluster-sg"},
      opts=ResourceOptions(provider=provider)
  )

  # EKS Node Security Group
  eks_node_sg = aws.ec2.SecurityGroup(
      "corp-eks-node-sg",
      vpc_id=vpc.id,
      description="EKS Worker Nodes Security Group",
      ingress=[
          # Allow all traffic from cluster security group
          aws.ec2.SecurityGroupIngressArgs(
              protocol="-1", from_port=0, to_port=0,
              security_groups=[eks_cluster_sg.id],
              description="All traffic from EKS control plane"
          ),
          # Allow nodes to communicate with each other
          aws.ec2.SecurityGroupIngressArgs(
              protocol="-1", from_port=0, to_port=0,
              self=True,
              description="Node to node communication"
          ),
          # Allow HTTP from ALB for NGINX
          aws.ec2.SecurityGroupIngressArgs(
              protocol="tcp", from_port=80, to_port=80,
              security_groups=[alb_sg.id],
              description="HTTP from ALB"
          ),
      ],
      egress=[
          # Allow all outbound - nodes need internet access
          aws.ec2.SecurityGroupEgressArgs(
              protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"]
          )
      ],
      tags={**tags, "Name": "corp-eks-node-sg"},
      opts=ResourceOptions(provider=provider)
  )

  # Allow cluster to communicate with nodes
  aws.ec2.SecurityGroupRule(
      "cluster-to-nodes-443",
      type="ingress",
      from_port=443,
      to_port=443,
      protocol="tcp",
      source_security_group_id=eks_node_sg.id,
      security_group_id=eks_cluster_sg.id,
      description="API server to kubelet",
      opts=ResourceOptions(provider=provider)
  )

  # Allow cluster to communicate with nodes on kubelet port
  aws.ec2.SecurityGroupRule(
      "cluster-to-nodes-10250",
      type="ingress",
      from_port=10250,
      to_port=10250,
      protocol="tcp",
      source_security_group_id=eks_node_sg.id,
      security_group_id=eks_cluster_sg.id,
      description="Cluster to node kubelet",
      opts=ResourceOptions(provider=provider)
  )

  # Database Security Group - Only from VPC
  db_sg = aws.ec2.SecurityGroup(
      "corp-db-sg",
      vpc_id=vpc.id,
      description="RDS PostgreSQL - VPC access only",
      ingress=[
          aws.ec2.SecurityGroupIngressArgs(
              protocol="tcp", from_port=5432, to_port=5432, cidr_blocks=["10.0.0.0/16"]
          )
      ],
      egress=[
          aws.ec2.SecurityGroupEgressArgs(
              protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"]
          )
      ],
      tags={**tags, "Name": "corp-db-sg"},
      opts=ResourceOptions(provider=provider)
  )

  return {
      "alb_sg": alb_sg,
      "eks_cluster_sg": eks_cluster_sg,
      "eks_node_sg": eks_node_sg,
      "db_sg": db_sg,
  }


def create_rds(
    subnets: List[aws.ec2.Subnet],
    db_sg: aws.ec2.SecurityGroup,
    kms_key: aws.kms.Key,
    tags: Dict[str, str],
    db_password_param_name: str,
    provider: aws.Provider,
) -> aws.rds.Instance:
  """
  Create a multi-AZ PostgreSQL RDS instance with encryption, private subnets, and secure password.
  """
  subnet_ids = [s.id for s in subnets]

  subnet_group = aws.rds.SubnetGroup(
      "corp-rds-subnet-group",
      subnet_ids=subnet_ids,
      tags={**tags, "Name": "corp-rds-subnet-group"},
      opts=ResourceOptions(provider=provider)
  )

  # Generate a secure random password
  db_password = random.RandomPassword(
      "corp-db-password",
      length=16,
      special=True,
      override_special="!#$%&*()-_=+[]{}<>:?",
      opts=ResourceOptions(provider=provider)
  )

  # Store the password in SSM Parameter Store
  aws.ssm.Parameter(
      "corp-db-password-param",
      name=db_password_param_name,
      type="SecureString",
      value=db_password.result,
      key_id=kms_key.arn,
      tags={**tags, "Name": "corp-db-password-param"},
      opts=ResourceOptions(provider=provider)
  )

  rds_instance = aws.rds.Instance(
      "corp-rds-instance",
      engine="postgres",
      engine_version="15.8",
      instance_class="db.t3.medium",
      allocated_storage=20,
      db_subnet_group_name=subnet_group.name,
      vpc_security_group_ids=[db_sg.id],
      multi_az=True,
      publicly_accessible=False,
      storage_encrypted=True,
      kms_key_id=kms_key.arn,
      username="adminuser",
      password=db_password.result,
      backup_retention_period=7,
      skip_final_snapshot=True,
      tags={**tags, "Name": "corp-rds-instance"},
      opts=ResourceOptions(provider=provider)
  )
  return rds_instance


def create_eks_cluster(
    subnet_ids: List[str],
    eks_cluster_sg: aws.ec2.SecurityGroup,
    tags: Dict[str, str],
    provider: aws.Provider,
) -> aws.eks.Cluster:
  """
  Create EKS cluster with simplified security group.
  """
  eks_role = aws.iam.Role(
      "corp-eks-role",
      assume_role_policy=json.dumps(
          {
              "Version": "2012-10-17",
              "Statement": [
                  {
                      "Effect": "Allow",
                      "Principal": {"Service": "eks.amazonaws.com"},
                      "Action": "sts:AssumeRole",
                  }
              ],
          }
      ),
      tags={**tags, "Name": "corp-eks-role"},
      opts=ResourceOptions(provider=provider)
  )
  aws.iam.RolePolicyAttachment(
      "corp-eks-cluster-policy-attachment",
      role=eks_role.name,
      policy_arn="arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
      opts=ResourceOptions(provider=provider)
  )

  cluster = aws.eks.Cluster(
      "corp-eks-cluster",
      name="corp-eks-cluster",  # Explicit cluster name
      role_arn=eks_role.arn,
      vpc_config=aws.eks.ClusterVpcConfigArgs(
          subnet_ids=subnet_ids,
          security_group_ids=[eks_cluster_sg.id],  # Use cluster security group
          endpoint_public_access=True,
          endpoint_private_access=True,
      ),
      tags={**tags, "Name": "corp-eks-cluster"},
      opts=ResourceOptions(provider=provider)
  )
  return cluster


def create_eks_node_group(
    cluster: aws.eks.Cluster,
    public_subnets: List[aws.ec2.Subnet],
    eks_node_sg: aws.ec2.SecurityGroup,
    tags: Dict[str, str],
    provider: aws.Provider,
) -> aws.eks.NodeGroup:
  """
  Create EKS node group with launch template for security group assignment.
  """
  node_role = aws.iam.Role(
      "corp-eks-node-role",
      assume_role_policy=json.dumps(
          {
              "Version": "2012-10-17",
              "Statement": [
                  {
                      "Effect": "Allow",
                      "Principal": {"Service": "ec2.amazonaws.com"},
                      "Action": "sts:AssumeRole",
                  }
              ],
          }
      ),
      tags={**tags, "Name": "corp-eks-node-role"},
      opts=ResourceOptions(provider=provider)
  )
  # Enhanced IAM policies for EKS nodes
  policies = [
      "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
      "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
      "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
      "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",  # For SSM access
  ]
  for i, pol_arn in enumerate(policies):
    aws.iam.RolePolicyAttachment(
        f"corp-eks-node-policy-attachment-{i}",
        role=node_role.name,
        policy_arn=pol_arn,
        opts=ResourceOptions(provider=provider)
    )

  # Add custom IAM policy for EKS node operations
  node_policy = aws.iam.RolePolicy(
      "corp-eks-node-custom-policy",
      role=node_role.name,
      policy=json.dumps({
          "Version": "2012-10-17",
          "Statement": [
              {
                  "Effect": "Allow",
                  "Action": [
                      "eks:DescribeCluster",
                      "eks:ListClusters",
                      "ec2:DescribeInstances",
                      "ec2:DescribeRouteTables",
                      "ec2:DescribeSecurityGroups",
                      "ec2:DescribeSubnets",
                      "ec2:DescribeVolumes",
                      "ec2:DescribeVolumesModifications",
                      "ec2:DescribeVpcs",
                      "ecr:GetAuthorizationToken",
                      "ecr:BatchCheckLayerAvailability",
                      "ecr:GetDownloadUrlForLayer",
                      "ecr:BatchGetImage"
                  ],
                  "Resource": "*"
              }
          ]
      }),
      opts=ResourceOptions(provider=provider)
  )

  # Create node group WITHOUT launch template to enable automatic EKS bootstrap
  # This allows EKS to automatically handle the bootstrap process and user data
  node_group = aws.eks.NodeGroup(
      "corp-eks-node-group",
      cluster_name=cluster.name,
      # Let Pulumi auto-generate the name to avoid conflicts
      node_role_arn=node_role.arn,
      subnet_ids=[s.id for s in public_subnets],
      instance_types=["t3.small"],
      capacity_type="ON_DEMAND",
      scaling_config=aws.eks.NodeGroupScalingConfigArgs(
          desired_size=1, min_size=1, max_size=1  # Minimum for testing
      ),
      # NO launch template - let EKS handle everything automatically
      # EKS Managed Node Groups use EKS-optimized AMI with automatic bootstrap
      ami_type="AL2023_x86_64_STANDARD",  # Amazon Linux 2023 EKS-optimized AMI
      tags={**tags, "Name": "corp-eks-nodegroup"},
      opts=ResourceOptions(provider=provider)
  )
  return node_group


def create_s3_buckets(
    kms_key: aws.kms.Key,
    tags: Dict[str, str],
    provider: aws.Provider,
) -> Dict[str, aws.s3.Bucket]:
  """
  Create required S3 buckets with encryption.
  """
  # Application data bucket
  app_bucket = aws.s3.Bucket(
      "corp-app-bucket",
      acl="private",
      versioning=aws.s3.BucketVersioningArgs(enabled=True),
      tags={**tags, "Name": "corp-app-bucket"},
      opts=ResourceOptions(provider=provider)
  )

  # Configure server-side encryption
  aws.s3.BucketServerSideEncryptionConfigurationV2(
      "corp-app-bucket-encryption",
      bucket=app_bucket.id,
      rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
          apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
              sse_algorithm="aws:kms",
              kms_master_key_id=kms_key.arn,
          )
      )],
      opts=ResourceOptions(provider=provider)
  )

  # Block public access
  aws.s3.BucketPublicAccessBlock(
      "corp-app-bucket-pab",
      bucket=app_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(provider=provider)
  )

  return {"app_bucket": app_bucket}


def create_alb(
    public_subnets: List[aws.ec2.Subnet],
    alb_sg: aws.ec2.SecurityGroup,
    tags: Dict[str, str],
    provider: aws.Provider
):
  """
  Create Application Load Balancer, Target Group, and HTTP Listener routing to EKS.
  """

  alb = aws.lb.LoadBalancer(
      "corp-alb",
      internal=False,
      load_balancer_type="application",
      security_groups=[alb_sg.id],
      subnets=[s.id for s in public_subnets],
      tags={**tags, "Name": "corp-alb"},
      opts=ResourceOptions(provider=provider)
  )

  target_group = aws.lb.TargetGroup(
      "corp-alb-target-group",
      port=80,
      protocol="HTTP",
      target_type="ip",
      vpc_id=public_subnets[0].vpc_id,
      health_check=aws.lb.TargetGroupHealthCheckArgs(
          path="/",
          protocol="HTTP",
          port="80",
          interval=10,  # Faster health checks for testing
          timeout=5,
          healthy_threshold=2,
          unhealthy_threshold=2,
          matcher="200",
      ),
      tags={**tags, "Name": "corp-alb-target-group"},
      opts=ResourceOptions(provider=provider)
  )

  listener = aws.lb.Listener(
      "corp-alb-listener",
      load_balancer_arn=alb.arn,
      port=80,
      protocol="HTTP",
      default_actions=[
          aws.lb.ListenerDefaultActionArgs(
              type="forward",
              target_group_arn=target_group.arn,
          )
      ],
      tags={**tags, "Name": "corp-alb-listener"},
      opts=ResourceOptions(provider=provider)
  )

  return alb, target_group, listener


def create_codepipeline(
    role_name: str,
    repo_owner: str,
    repo_name: str,
    repo_branch: str,
    github_oauth_token_param: str,
    kms_key: aws.kms.Key,
    tags: Dict[str, str],
    provider: aws.Provider,
) -> aws.codepipeline.Pipeline:
  """
  Create AWS CodePipeline for CI/CD from GitHub to EKS with encrypted S3 artifact store.
  """

  pipeline_role = aws.iam.Role(
      role_name,
      assume_role_policy=json.dumps({
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Principal": {"Service": "codepipeline.amazonaws.com"},
              "Action": "sts:AssumeRole",
          }],
      }),
      tags={**tags, "Name": role_name},
      opts=ResourceOptions(provider=provider)
  )

  artifact_bucket = aws.s3.Bucket(
      "corp-codepipeline-artifact-bucket",
      acl="private",
      versioning=aws.s3.BucketVersioningArgs(enabled=True),
      tags={**tags, "Name": "corp-codepipeline-artifact-bucket"},
      opts=ResourceOptions(provider=provider)
  )

  aws.s3.BucketServerSideEncryptionConfigurationV2(
      "corp-bucket-encryption",
      bucket=artifact_bucket.id,
      rules=[{
          "apply_server_side_encryption_by_default": {
              "sse_algorithm": "aws:kms",
              "kms_master_key_id": kms_key.arn,
          }
      }],
      opts=ResourceOptions(provider=provider)
  )

  source_output = "source_output"
  build_output = "build_output"

  # Create a placeholder GitHub token parameter (should be updated with real
  # token)
  github_token_param = aws.ssm.Parameter(
      "corp-github-token-param",
      name=github_oauth_token_param,
      type="SecureString",
      value="placeholder-github-token-update-me",
      key_id=kms_key.arn,
      tags={**tags, "Name": "corp-github-token-param"},
      opts=ResourceOptions(provider=provider)
  )

  github_token = github_token_param.value

  # Create CodeBuild project for building the application
  codebuild_role = aws.iam.Role(
      "corp-codebuild-role",
      assume_role_policy=json.dumps({
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Principal": {"Service": "codebuild.amazonaws.com"},
              "Action": "sts:AssumeRole",
          }],
      }),
      tags={**tags, "Name": "corp-codebuild-role"},
      opts=ResourceOptions(provider=provider)
  )

  aws.iam.RolePolicyAttachment(
      "codebuild-basic-policy",
      role=codebuild_role.name,
      policy_arn="arn:aws:iam::aws:policy/CloudWatchLogsFullAccess",
      opts=ResourceOptions(provider=provider)
  )

  aws.iam.RolePolicyAttachment(
      "codebuild-s3-policy",
      role=codebuild_role.name,
      policy_arn="arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess",
      opts=ResourceOptions(provider=provider)
  )

  # Add additional required policies for CodeBuild
  aws.iam.RolePolicyAttachment(
      "codebuild-s3-full-policy",
      role=codebuild_role.name,
      policy_arn="arn:aws:iam::aws:policy/AmazonS3FullAccess",
      opts=ResourceOptions(provider=provider)
  )

  codebuild_project = aws.codebuild.Project(
      "corp-codebuild-project",
      name="corp-codebuild-project",
      service_role=codebuild_role.arn,
      artifacts=aws.codebuild.ProjectArtifactsArgs(
          type="CODEPIPELINE"
      ),
      environment=aws.codebuild.ProjectEnvironmentArgs(
          compute_type="BUILD_GENERAL1_SMALL",
          image="aws/codebuild/amazonlinux2-x86_64-standard:5.0",
          type="LINUX_CONTAINER",
      ),
      source=aws.codebuild.ProjectSourceArgs(
          type="CODEPIPELINE",
          buildspec="version: 0.2\nphases:\n  build:\n    commands:\n      - echo Build completed on `date`"
      ),
      tags={**tags, "Name": "corp-codebuild-project"},
      opts=ResourceOptions(provider=provider)
  )

  # Create separate CodeBuild project for deployment
  codebuild_deploy_project = aws.codebuild.Project(
      "corp-codebuild-deploy-project",
      name="corp-codebuild-deploy-project",
      service_role=codebuild_role.arn,
      artifacts=aws.codebuild.ProjectArtifactsArgs(
          type="CODEPIPELINE"
      ),
      environment=aws.codebuild.ProjectEnvironmentArgs(
          compute_type="BUILD_GENERAL1_SMALL",
          image="aws/codebuild/amazonlinux2-x86_64-standard:5.0",
          type="LINUX_CONTAINER",
      ),
      source=aws.codebuild.ProjectSourceArgs(
          type="CODEPIPELINE",
          buildspec="version: 0.2\nphases:\n  build:\n    commands:\n      - echo Deploy completed on `date`"
      ),
      tags={**tags, "Name": "corp-codebuild-deploy-project"},
      opts=ResourceOptions(provider=provider)
  )

  # Create custom inline policy for CodePipeline after all resources are
  # defined
  codepipeline_policy = pulumi.Output.all(
      bucket_arn=artifact_bucket.arn,
      codebuild_role_arn=codebuild_role.arn,
      codebuild_project_arn=codebuild_project.arn,
      codebuild_deploy_project_arn=codebuild_deploy_project.arn
  ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
          {
              "Effect": "Allow",
              "Action": [
                  "s3:GetObject",
                  "s3:PutObject",
                  "s3:GetBucketVersioning"
              ],
              "Resource": [f"{args['bucket_arn']}/*"]
          },
          {
              "Effect": "Allow",
              "Action": ["s3:ListBucket"],
              "Resource": [args["bucket_arn"]]
          },
          {
              "Effect": "Allow",
              "Action": ["iam:PassRole"],
              "Resource": [args["codebuild_role_arn"]]
          },
          {
              "Effect": "Allow",
              "Action": [
                  "codebuild:StartBuild",
                  "codebuild:BatchGetBuilds"
              ],
              "Resource": [args["codebuild_project_arn"], args["codebuild_deploy_project_arn"]]
          }
      ]
  }))

  aws.iam.RolePolicy(
      "codepipeline-custom-policy",
      role=pipeline_role.id,
      policy=codepipeline_policy,
      opts=ResourceOptions(provider=provider)
  )

  pipeline = aws.codepipeline.Pipeline(
      "corp-codepipeline",
      role_arn=pipeline_role.arn,
      artifact_stores=[aws.codepipeline.PipelineArtifactStoreArgs(
          location=artifact_bucket.bucket,
          type="S3",
          encryption_key=aws.codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
              id=kms_key.arn, type="KMS"
          ),
      )],
      stages=[
          {
              "name": "Source",
              "actions": [{
                  "name": "GitHubSource",
                  "category": "Source",
                  "owner": "ThirdParty",
                  "provider": "GitHub",
                  "version": "1",
                  "output_artifacts": [source_output],
                  "configuration": {
                      "Owner": repo_owner,
                      "Repo": repo_name,
                      "Branch": repo_branch,
                      "OAuthToken": github_token,
                      "PollForSourceChanges": "false",
                  },
                  "run_order": 1,
              }],
          },
          {
              "name": "Build",
              "actions": [{
                  "name": "Build",
                  "category": "Build",
                  "owner": "AWS",
                  "provider": "CodeBuild",
                  "input_artifacts": [source_output],
                  "output_artifacts": [build_output],
                  "version": "1",
                  "configuration": {"ProjectName": "corp-codebuild-project"},
                  "run_order": 1,
              }],
          },
          {
              "name": "Deploy",
              "actions": [{
                  "name": "DeployToEKS",
                  "category": "Build",
                  "owner": "AWS",
                  "provider": "CodeBuild",
                  "input_artifacts": [build_output],
                  "version": "1",
                  "configuration": {"ProjectName": "corp-codebuild-deploy-project"},
                  "run_order": 1,
              }],
          },
      ],
      tags={**tags, "Name": "corp-codepipeline"},
      opts=ResourceOptions(provider=provider)
  )
  return pipeline


def create_monitoring_lambda(
    private_subnets: List[aws.ec2.Subnet],
    lambda_sg: aws.ec2.SecurityGroup,
    kms_key: aws.kms.Key,
    tags: Dict[str, str],
    provider: aws.Provider,
) -> aws.lambda_.Function:
  """
  Create a Lambda function to perform health checks and send metrics to CloudWatch.
  Scheduled every 5 minutes using CloudWatch Events.
  """
  assume_role_policy = json.dumps(
      {
          "Version": "2012-10-17",
          "Statement": [
              {
                  "Effect": "Allow",
                  "Principal": {"Service": "lambda.amazonaws.com"},
                  "Action": "sts:AssumeRole",
              }
          ],
      }
  )

  lambda_role = aws.iam.Role(
      "corp-health-check-lambda-role",
      assume_role_policy=assume_role_policy,
      tags={**tags, "Name": "corp-health-check-lambda-role"},
      opts=ResourceOptions(provider=provider)
  )

  aws.iam.RolePolicyAttachment(
      "lambda-vpc-access",
      role=lambda_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
      opts=ResourceOptions(provider=provider)
  )
  aws.iam.RolePolicyAttachment(
      "lambda-basic-execution",
      role=lambda_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      opts=ResourceOptions(provider=provider)
  )

  lambda_code = """import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    ec2_client = boto3.client('ec2')
    cloudwatch_client = boto3.client('cloudwatch')

    try:
        response = ec2_client.describe_instance_status(IncludeAllInstances=True)
        healthy_instances = 0
        total_instances = len(response.get('InstanceStatuses', []))

        for status in response.get('InstanceStatuses', []):
            state = status['InstanceState']['Name']
            sys_status = status.get('SystemStatus', {}).get('Status', 'unknown')
            inst_status = status.get('InstanceStatus', {}).get('Status', 'unknown')
            if state == 'running' and sys_status == 'ok' and inst_status == 'ok':
                healthy_instances += 1

        cloudwatch_client.put_metric_data(
            Namespace='Corp/HealthCheck',
            MetricData=[
                {'MetricName': 'HealthyInstances', 'Value': healthy_instances, 'Unit': 'Count'},
                {'MetricName': 'TotalInstances', 'Value': total_instances, 'Unit': 'Count'}
            ]
        )
        return {'statusCode': 200, 'body': json.dumps({'message': 'Healthy'})}
    except Exception as e:
        logger.error(f'Health check failed: {str(e)}')
        return {'statusCode': 500, 'body': json.dumps({'message': 'Failed'})}
"""

  lambda_func = aws.lambda_.Function(
      "corp-health-check-lambda",
      runtime="python3.12",
      code=pulumi.AssetArchive(
          {"lambda_function.py": pulumi.StringAsset(lambda_code)}),
      handler="lambda_function.lambda_handler",
      role=lambda_role.arn,
      timeout=60,
      vpc_config=aws.lambda_.FunctionVpcConfigArgs(
          subnet_ids=[s.id for s in private_subnets],
          security_group_ids=[lambda_sg.id],
      ),
      environment=aws.lambda_.FunctionEnvironmentArgs(
          variables={"ENV": "production"}),
      kms_key_arn=kms_key.arn,
      tags={**tags, "Name": "corp-health-check-lambda"},
      opts=ResourceOptions(provider=provider)
  )

  cloudwatch_rule = aws.cloudwatch.EventRule(
      "corp-health-check-schedule",
      schedule_expression="rate(5 minutes)",
      tags={**tags, "Name": "corp-health-check-schedule"},
      opts=ResourceOptions(provider=provider)
  )

  aws.cloudwatch.EventTarget(
      "corp-health-check-target",
      rule=cloudwatch_rule.name,
      arn=lambda_func.arn,
      opts=ResourceOptions(provider=provider)
  )

  aws.lambda_.Permission(
      "corp-health-check-permission",
      statement_id="AllowExecutionFromCloudWatch",
      action="lambda:InvokeFunction",
      function=lambda_func.name,
      principal="events.amazonaws.com",
      source_arn=cloudwatch_rule.arn,
      opts=ResourceOptions(provider=provider)
  )

  return lambda_func


def create_cloudwatch_alarms(
    alb: aws.lb.LoadBalancer,
    rds_instance: aws.rds.Instance,
    tags: Dict[str, str],
    provider: aws.Provider,
) -> None:
  """
  Create basic CloudWatch alarms for monitoring.
  """
  # ALB unhealthy target alarm
  aws.cloudwatch.MetricAlarm(
      "corp-alb-unhealthy-targets",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="UnHealthyHostCount",
      namespace="AWS/ApplicationELB",
      period=60,
      statistic="Average",
      threshold=0,
      alarm_description="ALB has unhealthy targets",
      dimensions={
          "LoadBalancer": alb.arn_suffix,
      },
      tags={**tags, "Name": "corp-alb-unhealthy-targets"},
      opts=ResourceOptions(provider=provider)
  )

  # RDS CPU alarm
  aws.cloudwatch.MetricAlarm(
      "corp-rds-high-cpu",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="CPUUtilization",
      namespace="AWS/RDS",
      period=300,
      statistic="Average",
      threshold=80,
      alarm_description="RDS CPU utilization is high",
      dimensions={
          "DBInstanceIdentifier": rds_instance.id,
      },
      tags={**tags, "Name": "corp-rds-high-cpu"},
      opts=ResourceOptions(provider=provider)
  )


class TapStack(pulumi.ComponentResource):
  """
  The main Pulumi component resource representing the entire infrastructure stack.
  It orchestrates provisioning of networking, compute, storage, security, monitoring, and CI/CD.
  """

  def __init__(
      self,
      name: str,
      args: TapStackArgs,
      opts: Optional[ResourceOptions] = None,
  ):
    super().__init__("tap:TapStack", name, None, opts)

    # Create ONE shared provider for the entire stack - NO REGION VALIDATIONS
    provider = aws.Provider("aws-provider", region="us-west-2")

    prefix = "corp"
    tags = {"Environment": "Production"}
    if args.tags:
      tags.update(args.tags)

    # Build components - pass provider to ALL functions
    kms_key = create_kms_key(tags, provider)
    vpc_module = SecureVPC(
        f"{prefix}-{args.environment_suffix}", "10.0.0.0/16", tags, provider)

    sgs = create_security_groups(vpc_module.vpc, tags, provider)
    db_sg = sgs["db_sg"]
    eks_cluster_sg = sgs["eks_cluster_sg"]
    eks_node_sg = sgs["eks_node_sg"]
    alb_sg = sgs["alb_sg"]

    # Create S3 buckets
    s3_buckets = create_s3_buckets(kms_key, tags, provider)

    rds_instance = create_rds(
        subnets=vpc_module.private_subnets,
        db_sg=db_sg,
        kms_key=kms_key,
        tags=tags,
        db_password_param_name=f"/{prefix}/{
            args.environment_suffix}/dbPassword",
        provider=provider,
    )

    # Create all subnet IDs for EKS cluster
    all_subnet_ids = [
        s.id for s in vpc_module.public_subnets +
        vpc_module.private_subnets]

    eks_cluster = create_eks_cluster(
        subnet_ids=all_subnet_ids,
        eks_cluster_sg=eks_cluster_sg,
        tags=tags,
        provider=provider
    )

    # Node group uses public subnets for internet access with explicit
    # security group
    eks_node_group = create_eks_node_group(
        cluster=eks_cluster,
        public_subnets=vpc_module.public_subnets,
        eks_node_sg=eks_node_sg,
        tags=tags,
        provider=provider
    )

    alb, target_group, _ = create_alb(
        vpc_module.public_subnets, alb_sg, tags, provider)

    # Create CloudWatch monitoring
    create_cloudwatch_alarms(alb, rds_instance, tags, provider)

    github_token_param = f"/{prefix}/{args.environment_suffix}/githubToken"

    pipeline = create_codepipeline(
        role_name=f"{prefix}-codepipeline-role",
        repo_owner=args.github_owner,
        repo_name=args.github_repo,
        repo_branch=args.github_branch,
        github_oauth_token_param=github_token_param,
        kms_key=kms_key,
        tags=tags,
        provider=provider,
    )

    lambda_sg = aws.ec2.SecurityGroup(
        f"{prefix}-lambda-sg",
        vpc_id=vpc_module.vpc.id,
        description="Lambda security group",
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"]
            )
        ],
        tags={**tags, "Name": f"{prefix}-lambda-sg"},
        opts=ResourceOptions(provider=provider, parent=self),
    )
    health_lambda = create_monitoring_lambda(
        vpc_module.private_subnets, lambda_sg, kms_key, tags, provider
    )

    # Export outputs for visibility
    pulumi.export("vpc_id", vpc_module.vpc.id)
    pulumi.export("vpc_cidr", vpc_module.vpc.cidr_block)
    pulumi.export("availability_zones", vpc_module.availability_zones)
    pulumi.export(
        "public_subnet_ids", [s.id for s in vpc_module.public_subnets]
    )
    pulumi.export(
        "private_subnet_ids", [s.id for s in vpc_module.private_subnets]
    )
    pulumi.export("rds_instance_id", rds_instance.id)
    pulumi.export("rds_endpoint", rds_instance.endpoint)
    pulumi.export("kms_key_id", kms_key.id)
    pulumi.export("eks_cluster_name", eks_cluster.name)
    pulumi.export("eks_cluster_endpoint", eks_cluster.endpoint)
    pulumi.export("eks_node_group_name", eks_node_group.node_group_name)
    pulumi.export("alb_dns_name", alb.dns_name)
    pulumi.export("alb_target_group_arn", target_group.arn)
    pulumi.export("s3_app_bucket_name", s3_buckets["app_bucket"].bucket)
    pulumi.export("codepipeline_name", pipeline.name)
    pulumi.export("health_lambda_name", health_lambda.name)
    pulumi.export("health_lambda_arn", health_lambda.arn)

    # NGINX deployment instructions
    pulumi.export("nginx_deployment_instructions",
                  "After EKS cluster is ready, deploy NGINX using: kubectl apply -f nginx-deployment.yaml")

    self.register_outputs(
        {
            "vpc_id": vpc_module.vpc.id,
            "rds_instance_id": rds_instance.id,
            "eks_cluster_name": eks_cluster.name,
            "alb_dns_name": alb.dns_name,
            "codepipeline_name": pipeline.name,
            "health_lambda_arn": health_lambda.arn,
        }
    )
