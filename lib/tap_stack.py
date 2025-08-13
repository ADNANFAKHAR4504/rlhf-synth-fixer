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
        state="available").names[:2]

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
            tags={**self.tags, "Name": f"{self.name_prefix}-public-{i + 1}"},
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
            tags={**self.tags, "Name": f"{self.name_prefix}-private-{i + 1}"},
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
  Create security groups for web (ALB and EKS nodes), database, and ALB itself.
  """

  web_sg = aws.ec2.SecurityGroup(
      "corp-web-sg",
      vpc_id=vpc.id,
      description="Allow HTTP and HTTPS inbound",
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
      tags={**tags, "Name": "corp-web-sg"},
      opts=ResourceOptions(provider=provider)
  )

  db_sg = aws.ec2.SecurityGroup(
      "corp-db-sg",
      vpc_id=vpc.id,
      description="Allow Postgres inbound from web_sg",
      ingress=[
          aws.ec2.SecurityGroupIngressArgs(
              protocol="tcp", from_port=5432, to_port=5432, security_groups=[web_sg.id]
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

  eks_sg = aws.ec2.SecurityGroup(
      "corp-eks-sg",
      vpc_id=vpc.id,
      description="EKS worker nodes security group",
      ingress=[
          aws.ec2.SecurityGroupIngressArgs(
              protocol="-1", from_port=0, to_port=0, self=True
          ),
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
      tags={**tags, "Name": "corp-eks-sg"},
      opts=ResourceOptions(provider=provider)
  )

  alb_sg = aws.ec2.SecurityGroup(
      "corp-alb-sg",
      vpc_id=vpc.id,
      description="Security group for Application Load Balancer",
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

  return {
      "web_sg": web_sg,
      "db_sg": db_sg,
      "eks_sg": eks_sg,
      "alb_sg": alb_sg,
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
      key_id=kms_key.id,
      tags={**tags, "Name": "corp-db-password-param"},
      opts=ResourceOptions(provider=provider)
  )

  rds_instance = aws.rds.Instance(
      "corp-rds-instance",
      engine="postgres",
      engine_version="13.7",
      instance_class="db.t3.medium",
      allocated_storage=20,
      db_subnet_group_name=subnet_group.name,
      vpc_security_group_ids=[db_sg.id],
      multi_az=True,
      publicly_accessible=False,
      storage_encrypted=True,
      kms_key_id=kms_key.id,
      username="adminuser",
      password=db_password.result,
      backup_retention_period=7,
      skip_final_snapshot=True,
      tags={**tags, "Name": "corp-rds-instance"},
      opts=ResourceOptions(provider=provider)
  )
  return rds_instance


def create_eks_cluster(
    private_subnet_ids: List[str],
    eks_sg: aws.ec2.SecurityGroup,
    tags: Dict[str, str],
    provider: aws.Provider,
) -> aws.eks.Cluster:
  """
  Create an EKS cluster with IAM role, configured with private subnets and network settings.
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
  aws.iam.RolePolicyAttachment(
      "corp-eks-service-policy-attachment",
      role=eks_role.name,
      policy_arn="arn:aws:iam::aws:policy/AmazonEKSServicePolicy",
      opts=ResourceOptions(provider=provider)
  )

  cluster = aws.eks.Cluster(
      "corp-eks-cluster",
      role_arn=eks_role.arn,
      vpc_config=aws.eks.ClusterVpcConfigArgs(
          subnet_ids=private_subnet_ids,
          security_group_ids=[eks_sg.id],
          endpoint_public_access=True,
          endpoint_private_access=True,
      ),
      tags={**tags, "Name": "corp-eks-cluster"},
      opts=ResourceOptions(provider=provider)
  )
  return cluster


def create_eks_node_group(
    cluster: aws.eks.Cluster,
    subnets: List[aws.ec2.Subnet],
    tags: Dict[str, str],
    provider: aws.Provider,
) -> aws.eks.NodeGroup:
  """
  Create EKS worker node group with IAM role and autoscaling configuration.
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
  policies = [
      "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
      "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
      "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
  ]
  for i, pol_arn in enumerate(policies):
    aws.iam.RolePolicyAttachment(
        f"corp-eks-node-policy-attachment-{i}",
        role=node_role.name,
        policy_arn=pol_arn,
        opts=ResourceOptions(provider=provider)
    )

  node_group = aws.eks.NodeGroup(
      "corp-eks-node-group",
      cluster_name=cluster.name,
      node_role_arn=node_role.arn,
      subnet_ids=[s.id for s in subnets],
      instance_types=["t3.medium"],
      scaling_config=aws.eks.NodeGroupScalingConfigArgs(
          desired_size=2, min_size=1, max_size=3
      ),
      # Note: SSH key access is optional and should be configured based on security requirements
      # remote_access=aws.eks.NodeGroupRemoteAccessArgs(
      #     ec2_ssh_key="your-ec2-key",  # Replace with actual key name if needed
      #     source_security_group_ids=[eks_sg.id],
      # ),
      tags={**tags, "Name": "corp-eks-node-group"},
      opts=ResourceOptions(provider=provider)
  )
  return node_group


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
          interval=30,
          timeout=5,
          healthy_threshold=5,
          unhealthy_threshold=2,
          matcher="200-399",
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

  aws.iam.RolePolicyAttachment(
      "codepipeline-access",
      role=pipeline_role.name,
      policy_arn="arn:aws:iam::aws:policy/AWSCodePipelineFullAccess",
      opts=ResourceOptions(provider=provider)
  )

  aws.iam.RolePolicyAttachment(
      "codebuild-access",
      role=pipeline_role.name,
      policy_arn="arn:aws:iam::aws:policy/AWSCodeBuildDeveloperAccess",
      opts=ResourceOptions(provider=provider)
  )

  artifact_bucket = aws.s3.Bucket(
      "corp-codepipeline-artifact-bucket",
      acl="private",
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
      key_id=kms_key.id,
      tags={**tags, "Name": "corp-github-token-param"},
      opts=ResourceOptions(provider=provider)
  )

  github_token = github_token_param.value

  pipeline = aws.codepipeline.Pipeline(
      "corp-codepipeline",
      role_arn=pipeline_role.arn,
      artifact_store=aws.codepipeline.PipelineArtifactStoreArgs(
          location=artifact_bucket.bucket,
          type="S3",
          encryption_key=aws.codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
              id=kms_key.id, type="KMS"
          ),
      ),
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
                  "category": "Deploy",
                  "owner": "AWS",
                  "provider": "ECS",
                  "input_artifacts": [build_output],
                  "version": "1",
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
      policy_arn="arn:aws:iam::aws:policy/AWSLambdaBasicExecutionRole",
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
      runtime="python3.9",
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
    eks_sg = sgs["eks_sg"]
    alb_sg = sgs["alb_sg"]

    rds_instance = create_rds(
        subnets=vpc_module.private_subnets,
        db_sg=db_sg,
        kms_key=kms_key,
        tags=tags,
        db_password_param_name=f"/{prefix}/{
            args.environment_suffix}/dbPassword",
        provider=provider,
    )

    eks_cluster = create_eks_cluster(
        private_subnet_ids=[s.id for s in vpc_module.private_subnets],
        eks_sg=eks_sg,
        tags=tags,
        provider=provider
    )
    eks_node_group = create_eks_node_group(
        eks_cluster, vpc_module.private_subnets, tags, provider
    )

    alb, target_group, _ = create_alb(
        vpc_module.public_subnets, alb_sg, tags, provider)

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
    pulumi.export("codepipeline_name", pipeline.name)
    pulumi.export("health_lambda_name", health_lambda.name)
    pulumi.export("health_lambda_arn", health_lambda.arn)

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
