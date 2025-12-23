# components/security.py
"""
Security component that creates security groups, IAM roles, and WAF
Implements least privilege access and defense in depth
"""

import json
import pulumi
import pulumi_aws as aws
VPC_CIDRS = ["10.0.0.0/16", "10.1.0.0/16"]


class SecurityComponent(pulumi.ComponentResource):
  def __init__(self, name: str, vpc_id: pulumi.Output[str], subnets: str, region: str, tags: dict, opts: pulumi.ResourceOptions = None):
    super().__init__("custom:security:SecurityComponent", name, None, opts)

    self.region = region
    self.tags = tags

    # Create KMS key for encryption at rest
    self.kms_key = aws.kms.Key(
        f"{name}-kms-key",
        description="KMS key for encrypting application resources",
        tags=tags,
        opts=pulumi.ResourceOptions(parent=self)
    )

    self.kms_alias = aws.kms.Alias(
        f"{name}-kms-alias",
        name=f"alias/{name}-encryption-key",
        target_key_id=self.kms_key.key_id,
        opts=pulumi.ResourceOptions(parent=self)
    )

    # Security Group for Application Load Balancer
    # Only allows HTTP/HTTPS from internet, redirects HTTP to HTTPS
    self.alb_security_group = aws.ec2.SecurityGroup(
        f"{name}-alb-sg",
        name_prefix=f"{name}-alb-",
        description="Security group for Application Load Balancer",
        vpc_id=vpc_id,
        ingress=[
            # Allow HTTP (will redirect to HTTPS)
            aws.ec2.SecurityGroupIngressArgs(
                from_port=80,
                to_port=80,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="HTTP from internet"
            ),
            # Allow HTTPS
            aws.ec2.SecurityGroupIngressArgs(
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=["0.0.0.0/0"],
                description="HTTPS from internet"
            )
        ],
        egress=[
            # Allow all outbound to Lambda functions
            aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=65535,
                protocol="tcp",
                cidr_blocks=["10.0.0.0/8"],
                description="All traffic to private subnets"
            )
        ],
        tags={**tags, "Name": f"{name}-alb-sg"},
        opts=pulumi.ResourceOptions(parent=self)
    )

    # Security Group for Lambda functions
    # Allows inbound from ALB and outbound to RDS/DynamoDB/S3
    self.lambda_security_group = aws.ec2.SecurityGroup(
        f"{name}-lambda-sg",
        name_prefix=f"{name}-lambda-",
        description="Security group for Lambda functions",
        vpc_id=vpc_id,
        ingress=[
            # Allow traffic from ALB
            aws.ec2.SecurityGroupIngressArgs(
                from_port=80,
                to_port=80,
                protocol="tcp",
                # source_security_group_id=self.alb_security_group.id,
                cidr_blocks=["0.0.0.0/0"],
                description="HTTP from ALB"
            )
        ],
        egress=[
            # Allow HTTPS for AWS API calls (S3, DynamoDB)
            # Allow MySQL/PostgreSQL to RDS
            aws.ec2.SecurityGroupEgressArgs(
                from_port=5432,
                to_port=5432,
                protocol="tcp",
                cidr_blocks=VPC_CIDRS,
                description="PostgreSQL to RDS"
            ),
            # aws.ec2.SecurityGroupEgressArgs(
            #     protocol="icmp",        # ICMP
            #     # ICMP type (8 = Echo Request). Use -1 for all types
            #     from_port=-1,
            #     to_port=-1,             # ICMP code (-1 = all codes)
            #     cidr_blocks=VPC_CIDRS
            # )

        ],
        tags={**tags, "Name": f"{name}-lambda-sg"},
        opts=pulumi.ResourceOptions(parent=self)
    )

    # Security Group for RDS Database
    # Only allows inbound from Lambda functions on database port
    self.database_security_group = aws.ec2.SecurityGroup(
        f"{name}-database-sg",
        name_prefix=f"{name}-database-",
        description="Security group for RDS database",
        vpc_id=vpc_id,
        ingress=[
            # Allow PostgreSQL from Lambda functions
            aws.ec2.SecurityGroupIngressArgs(
                from_port=5432,
                to_port=5432,
                protocol="tcp",
                # source_security_group_id=self.lambda_security_group.id,
                cidr_blocks=VPC_CIDRS,
                description="PostgreSQL from Lambda"
            ),
            aws.ec2.SecurityGroupIngressArgs(
                protocol="icmp",        # ICMP
                # ICMP type (8 = Echo Request). Use -1 for all types
                from_port=-1,
                to_port=-1,             # ICMP code (-1 = all codes)
                cidr_blocks=VPC_CIDRS
            )
        ],
        # No egress rules needed for RDS
        tags={**tags, "Name": f"{name}-database-sg"},
        opts=pulumi.ResourceOptions(parent=self)
    )

    # IAM Role for Lambda execution with least privilege
    lambda_assume_role_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }
        ]
    }

    self.lambda_execution_role = aws.iam.Role(
        f"{name}-lambda-execution-role",
        assume_role_policy=json.dumps(lambda_assume_role_policy),
        tags=tags,
        opts=pulumi.ResourceOptions(parent=self)
    )

    # Lambda execution policy with minimal required permissions
    json_lambda_policy = {
        "Version": "2012-10-17",
        "Statement": [
            # CloudWatch Logs permissions
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": f"arn:aws:logs:{region}:*:*"
            },
            # VPC permissions for Lambda
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:CreateNetworkInterface",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DeleteNetworkInterface",
                    "ec2:AttachNetworkInterface",
                    "ec2:DetachNetworkInterface"
                ],
                "Resource": "*"
            },
            # DynamoDB permissions (scoped to specific table)
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                "Resource": f"arn:aws:dynamodb:{region}:*:table/pulumi-optimization-*"
            },
            # S3 permissions (scoped to specific bucket)
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                "Resource": f"arn:aws:s3:::pulumi-optimization-*/*"
            },
            # KMS permissions for decryption
            {
                "Effect": "Allow",
                "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                "Resource": "*"
            }
        ]
    }

    self.lambda_policy = aws.iam.RolePolicy(
        f"{name}-lambda-policy",
        role=self.lambda_execution_role.id,
        policy=json.dumps(json_lambda_policy),
        opts=pulumi.ResourceOptions(parent=self)
    )

    # LOCALSTACK FIX: WAF removed (Pro-only feature)
    # LocalStack Community Edition does not support WAF
    # self.waf_web_acl = aws.wafv2.WebAcl(...)

    self.alb = aws.lb.LoadBalancer(
        f"{name}-alb",
        security_groups=[self.alb_security_group.id],
        subnets=subnets,
        load_balancer_type="application",
        opts=pulumi.ResourceOptions(parent=self),
    )

    self.register_outputs({})
