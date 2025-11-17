# Pulumi Python Implementation: Secure AWS Foundation for Financial Services

This implementation provides a production-grade AWS foundation with VPC networking, NAT instances, Systems Manager Parameter Store with KMS encryption, Lambda-based secret rotation, VPC Flow Logs, AWS Config compliance monitoring, and EventBridge event orchestration.

## Architecture Overview

The infrastructure is organized into modular components:
- **NetworkingStack**: VPC, private subnets, NAT instances, route tables, security groups
- **SecurityStack**: KMS keys, Parameter Store parameters, IAM roles
- **MonitoringStack**: VPC Flow Logs, AWS Config, CloudWatch Log Groups
- **AutomationStack**: Lambda functions for secret rotation, EventBridge rules
- **TapStack**: Main orchestrator with stack exports

## File: lib/networking_stack.py

```python
"""
Networking infrastructure module for secure AWS foundation.

This module creates:
- VPC with CIDR 10.0.0.0/16
- 3 private subnets across 3 availability zones
- NAT instances (Amazon Linux 2) in each AZ
- Route tables for outbound internet access
- Security groups for NAT instances
"""

from typing import List, Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class NetworkingStackArgs:
    """Arguments for NetworkingStack component."""

    def __init__(
        self,
        environment_suffix: str,
        vpc_cidr: str = "10.0.0.0/16",
        private_subnet_cidrs: Optional[List[str]] = None,
        region: str = "us-east-2"
    ):
        self.environment_suffix = environment_suffix
        self.vpc_cidr = vpc_cidr
        self.private_subnet_cidrs = private_subnet_cidrs or [
            "10.0.1.0/24",
            "10.0.2.0/24",
            "10.0.3.0/24"
        ]
        self.region = region


class NetworkingStack(pulumi.ComponentResource):
    """
    NetworkingStack component creates VPC infrastructure with private subnets and NAT instances.

    Exports:
        vpc_id: VPC identifier
        private_subnet_ids: List of private subnet IDs
        nat_instance_ips: List of NAT instance Elastic IPs
    """

    def __init__(
        self,
        name: str,
        args: NetworkingStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:networking:NetworkingStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{self.environment_suffix}",
            cidr_block=args.vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"vpc-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "infrastructure-team",
                "CostCenter": "platform"
            },
            opts=ResourceOptions(parent=self)
        )

        # Get availability zones
        azs = aws.get_availability_zones(
            state="available",
            filters=[aws.GetAvailabilityZonesFilterArgs(
                name="region-name",
                values=[args.region]
            )]
        )

        # Create private subnets
        self.private_subnets: List[aws.ec2.Subnet] = []
        for i, cidr in enumerate(args.private_subnet_cidrs):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=azs.names[i],
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"private-subnet-{i+1}-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "Owner": "infrastructure-team",
                    "CostCenter": "platform",
                    "Type": "private"
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            self.private_subnets.append(subnet)

        # Get latest Amazon Linux 2 AMI for NAT instances
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(name="name", values=["amzn2-ami-hvm-*-x86_64-gp2"]),
                aws.ec2.GetAmiFilterArgs(name="state", values=["available"])
            ]
        )

        # Create security group for NAT instances
        self.nat_security_group = aws.ec2.SecurityGroup(
            f"nat-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for NAT instances",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=[args.vpc_cidr],
                    description="Allow all traffic from VPC"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"nat-sg-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "infrastructure-team",
                "CostCenter": "platform"
            },
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create NAT instances and route tables
        self.nat_instances: List[aws.ec2.Instance] = []
        self.nat_eips: List[aws.ec2.Eip] = []
        self.route_tables: List[aws.ec2.RouteTable] = []

        for i, subnet in enumerate(self.private_subnets):
            # Create Elastic IP for NAT instance
            eip = aws.ec2.Eip(
                f"nat-eip-{i+1}-{self.environment_suffix}",
                domain="vpc",
                tags={
                    "Name": f"nat-eip-{i+1}-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "Owner": "infrastructure-team",
                    "CostCenter": "platform"
                },
                opts=ResourceOptions(parent=self.vpc)
            )
            self.nat_eips.append(eip)

            # Create NAT instance
            nat_instance = aws.ec2.Instance(
                f"nat-instance-{i+1}-{self.environment_suffix}",
                instance_type="t3.micro",
                ami=ami.id,
                subnet_id=subnet.id,
                vpc_security_group_ids=[self.nat_security_group.id],
                source_dest_check=False,
                user_data="""#!/bin/bash
echo 1 > /proc/sys/net/ipv4/ip_forward
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
yum install -y iptables-services
service iptables save
""",
                tags={
                    "Name": f"nat-instance-{i+1}-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "Owner": "infrastructure-team",
                    "CostCenter": "platform"
                },
                opts=ResourceOptions(parent=subnet)
            )
            self.nat_instances.append(nat_instance)

            # Associate Elastic IP with NAT instance
            aws.ec2.EipAssociation(
                f"nat-eip-assoc-{i+1}-{self.environment_suffix}",
                instance_id=nat_instance.id,
                allocation_id=eip.id,
                opts=ResourceOptions(parent=nat_instance)
            )

            # Create route table for private subnet
            route_table = aws.ec2.RouteTable(
                f"private-rt-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                routes=[
                    aws.ec2.RouteTableRouteArgs(
                        cidr_block="0.0.0.0/0",
                        instance_id=nat_instance.id
                    )
                ],
                tags={
                    "Name": f"private-rt-{i+1}-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "Owner": "infrastructure-team",
                    "CostCenter": "platform"
                },
                opts=ResourceOptions(parent=nat_instance)
            )
            self.route_tables.append(route_table)

            # Associate route table with subnet
            aws.ec2.RouteTableAssociation(
                f"private-rt-assoc-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(parent=route_table)
            )

        # Register outputs
        self.vpc_id = self.vpc.id
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]
        self.nat_instance_ips = [eip.public_ip for eip in self.nat_eips]

        self.register_outputs({
            "vpc_id": self.vpc_id,
            "private_subnet_ids": self.private_subnet_ids,
            "nat_instance_ips": self.nat_instance_ips
        })
```

## File: lib/security_stack.py

```python
"""
Security infrastructure module for KMS encryption and Parameter Store.

This module creates:
- KMS key for Parameter Store encryption
- Systems Manager Parameter Store parameters (SecureString)
- IAM roles for Lambda execution
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class SecurityStackArgs:
    """Arguments for SecurityStack component."""

    def __init__(
        self,
        environment_suffix: str,
        parameter_names: Optional[list] = None
    ):
        self.environment_suffix = environment_suffix
        self.parameter_names = parameter_names or [
            "trading-api-key-1",
            "trading-api-key-2",
            "trading-api-secret"
        ]


class SecurityStack(pulumi.ComponentResource):
    """
    SecurityStack component creates KMS keys and Parameter Store parameters.

    Exports:
        kms_key_id: KMS key identifier
        parameter_arns: List of Parameter Store ARNs
    """

    def __init__(
        self,
        name: str,
        args: SecurityStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:security:SecurityStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Create KMS key for Parameter Store encryption
        self.kms_key = aws.kms.Key(
            f"parameter-store-kms-{self.environment_suffix}",
            description=f"KMS key for Parameter Store encryption - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={
                "Name": f"parameter-store-kms-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "security-team",
                "CostCenter": "security"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create KMS key alias
        aws.kms.Alias(
            f"parameter-store-kms-alias-{self.environment_suffix}",
            name=f"alias/parameter-store-{self.environment_suffix}",
            target_key_id=self.kms_key.id,
            opts=ResourceOptions(parent=self.kms_key)
        )

        # Create Parameter Store parameters
        self.parameters = []
        for param_name in args.parameter_names:
            parameter = aws.ssm.Parameter(
                f"{param_name}-{self.environment_suffix}",
                name=f"/{self.environment_suffix}/{param_name}",
                type="SecureString",
                value="initial-placeholder-value",  # Will be rotated by Lambda
                key_id=self.kms_key.id,
                description=f"SecureString parameter for {param_name}",
                tags={
                    "Name": f"{param_name}-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "Owner": "security-team",
                    "CostCenter": "security"
                },
                opts=ResourceOptions(parent=self.kms_key)
            )
            self.parameters.append(parameter)

        # Create IAM role for Lambda rotation function
        lambda_assume_role = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                actions=["sts:AssumeRole"],
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type="Service",
                    identifiers=["lambda.amazonaws.com"]
                )]
            )]
        )

        self.lambda_role = aws.iam.Role(
            f"lambda-rotation-role-{self.environment_suffix}",
            name=f"lambda-rotation-role-{self.environment_suffix}",
            assume_role_policy=lambda_assume_role.json,
            tags={
                "Name": f"lambda-rotation-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "security-team",
                "CostCenter": "security"
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach managed policies to Lambda role
        aws.iam.RolePolicyAttachment(
            f"lambda-basic-execution-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self.lambda_role)
        )

        # Create inline policy for SSM and KMS access
        lambda_policy = aws.iam.RolePolicy(
            f"lambda-rotation-policy-{self.environment_suffix}",
            role=self.lambda_role.id,
            policy=pulumi.Output.all(self.kms_key.arn).apply(
                lambda args: pulumi.Output.json_dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "ssm:GetParameter",
                                "ssm:PutParameter",
                                "ssm:DescribeParameters"
                            ],
                            "Resource": f"arn:aws:ssm:*:*:parameter/{self.environment_suffix}/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:Encrypt",
                                "kms:GenerateDataKey"
                            ],
                            "Resource": args[0]
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self.lambda_role)
        )

        # Register outputs
        self.kms_key_id = self.kms_key.id
        self.kms_key_arn = self.kms_key.arn
        self.parameter_arns = [param.arn for param in self.parameters]
        self.lambda_role_arn = self.lambda_role.arn

        self.register_outputs({
            "kms_key_id": self.kms_key_id,
            "kms_key_arn": self.kms_key_arn,
            "parameter_arns": self.parameter_arns,
            "lambda_role_arn": self.lambda_role_arn
        })
```

## File: lib/monitoring_stack.py

```python
"""
Monitoring infrastructure module for logging and compliance.

This module creates:
- S3 buckets for VPC Flow Logs and AWS Config
- VPC Flow Logs capturing all traffic
- AWS Config recorder and delivery channel
- Custom Config Rules for EBS encryption and S3 public access
- CloudWatch Log Groups
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class MonitoringStackArgs:
    """Arguments for MonitoringStack component."""

    def __init__(
        self,
        environment_suffix: str,
        vpc_id: Output[str],
        region: str = "us-east-2"
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.region = region


class MonitoringStack(pulumi.ComponentResource):
    """
    MonitoringStack component creates logging and compliance monitoring resources.

    Exports:
        flow_logs_bucket: S3 bucket for VPC Flow Logs
        config_bucket: S3 bucket for AWS Config
        log_group_name: CloudWatch Log Group name
    """

    def __init__(
        self,
        name: str,
        args: MonitoringStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:monitoring:MonitoringStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Create S3 bucket for VPC Flow Logs
        self.flow_logs_bucket = aws.s3.Bucket(
            f"vpc-flow-logs-{self.environment_suffix}",
            bucket=f"vpc-flow-logs-{self.environment_suffix}",
            acl="private",
            force_destroy=True,
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    expiration=aws.s3.BucketLifecycleRuleExpirationArgs(days=90)
                )
            ],
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            tags={
                "Name": f"vpc-flow-logs-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "monitoring-team",
                "CostCenter": "monitoring"
            },
            opts=ResourceOptions(parent=self)
        )

        # Block public access for Flow Logs bucket
        aws.s3.BucketPublicAccessBlock(
            f"flow-logs-bucket-block-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.flow_logs_bucket)
        )

        # Create bucket policy for VPC Flow Logs
        flow_logs_bucket_policy = aws.s3.BucketPolicy(
            f"flow-logs-bucket-policy-{self.environment_suffix}",
            bucket=self.flow_logs_bucket.id,
            policy=pulumi.Output.all(self.flow_logs_bucket.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AWSLogDeliveryWrite",
                            "Effect": "Allow",
                            "Principal": {"Service": "delivery.logs.amazonaws.com"},
                            "Action": "s3:PutObject",
                            "Resource": f"{args[0]}/*",
                            "Condition": {
                                "StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}
                            }
                        },
                        {
                            "Sid": "AWSLogDeliveryAclCheck",
                            "Effect": "Allow",
                            "Principal": {"Service": "delivery.logs.amazonaws.com"},
                            "Action": "s3:GetBucketAcl",
                            "Resource": args[0]
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self.flow_logs_bucket)
        )

        # Create VPC Flow Logs
        self.flow_log = aws.ec2.FlowLog(
            f"vpc-flow-log-{self.environment_suffix}",
            vpc_id=args.vpc_id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=self.flow_logs_bucket.arn,
            tags={
                "Name": f"vpc-flow-log-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "monitoring-team",
                "CostCenter": "monitoring"
            },
            opts=ResourceOptions(parent=self.flow_logs_bucket, depends_on=[flow_logs_bucket_policy])
        )

        # Create S3 bucket for AWS Config
        self.config_bucket = aws.s3.Bucket(
            f"aws-config-{self.environment_suffix}",
            bucket=f"aws-config-{self.environment_suffix}",
            acl="private",
            force_destroy=True,
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            tags={
                "Name": f"aws-config-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "compliance-team",
                "CostCenter": "compliance"
            },
            opts=ResourceOptions(parent=self)
        )

        # Block public access for Config bucket
        aws.s3.BucketPublicAccessBlock(
            f"config-bucket-block-{self.environment_suffix}",
            bucket=self.config_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.config_bucket)
        )

        # Create IAM role for AWS Config
        config_assume_role = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                actions=["sts:AssumeRole"],
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type="Service",
                    identifiers=["config.amazonaws.com"]
                )]
            )]
        )

        self.config_role = aws.iam.Role(
            f"aws-config-role-{self.environment_suffix}",
            name=f"aws-config-role-{self.environment_suffix}",
            assume_role_policy=config_assume_role.json,
            tags={
                "Name": f"aws-config-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "compliance-team",
                "CostCenter": "compliance"
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS Config managed policy
        aws.iam.RolePolicyAttachment(
            f"config-policy-attach-{self.environment_suffix}",
            role=self.config_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
            opts=ResourceOptions(parent=self.config_role)
        )

        # Create inline policy for Config S3 access
        config_s3_policy = aws.iam.RolePolicy(
            f"config-s3-policy-{self.environment_suffix}",
            role=self.config_role.id,
            policy=pulumi.Output.all(self.config_bucket.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": ["s3:GetBucketVersioning", "s3:PutObject", "s3:GetObject"],
                            "Resource": [args[0], f"{args[0]}/*"]
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self.config_role)
        )

        # Create AWS Config recorder
        self.config_recorder = aws.cfg.Recorder(
            f"config-recorder-{self.environment_suffix}",
            name=f"config-recorder-{self.environment_suffix}",
            role_arn=self.config_role.arn,
            recording_group=aws.cfg.RecorderRecordingGroupArgs(
                all_supported=True,
                include_global_resource_types=True
            ),
            opts=ResourceOptions(parent=self.config_role, depends_on=[config_s3_policy])
        )

        # Create AWS Config delivery channel
        self.delivery_channel = aws.cfg.DeliveryChannel(
            f"config-delivery-{self.environment_suffix}",
            name=f"config-delivery-{self.environment_suffix}",
            s3_bucket_name=self.config_bucket.bucket,
            depends_on_=[self.config_recorder],
            opts=ResourceOptions(parent=self.config_recorder)
        )

        # Start Config recorder
        self.recorder_status = aws.cfg.RecorderStatus(
            f"config-recorder-status-{self.environment_suffix}",
            name=self.config_recorder.name,
            is_enabled=True,
            depends_on_=[self.delivery_channel],
            opts=ResourceOptions(parent=self.delivery_channel)
        )

        # Create Config Rule for encrypted EBS volumes
        self.ebs_encryption_rule = aws.cfg.Rule(
            f"ebs-encryption-rule-{self.environment_suffix}",
            name=f"ebs-encryption-rule-{self.environment_suffix}",
            description="Check that EBS volumes are encrypted",
            source=aws.cfg.RuleSourceArgs(
                owner="AWS",
                source_identifier="ENCRYPTED_VOLUMES"
            ),
            depends_on_=[self.recorder_status],
            tags={
                "Name": f"ebs-encryption-rule-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "compliance-team",
                "CostCenter": "compliance"
            },
            opts=ResourceOptions(parent=self.config_recorder)
        )

        # Create Config Rule for public S3 buckets
        self.s3_public_read_rule = aws.cfg.Rule(
            f"s3-public-read-rule-{self.environment_suffix}",
            name=f"s3-public-read-rule-{self.environment_suffix}",
            description="Check that S3 buckets do not allow public read access",
            source=aws.cfg.RuleSourceArgs(
                owner="AWS",
                source_identifier="S3_BUCKET_PUBLIC_READ_PROHIBITED"
            ),
            depends_on_=[self.recorder_status],
            tags={
                "Name": f"s3-public-read-rule-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "compliance-team",
                "CostCenter": "compliance"
            },
            opts=ResourceOptions(parent=self.config_recorder)
        )

        # Create CloudWatch Log Group for EventBridge
        self.log_group = aws.cloudwatch.LogGroup(
            f"eventbridge-logs-{self.environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"eventbridge-logs-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "monitoring-team",
                "CostCenter": "monitoring"
            },
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.flow_logs_bucket_name = self.flow_logs_bucket.bucket
        self.config_bucket_name = self.config_bucket.bucket
        self.log_group_name = self.log_group.name

        self.register_outputs({
            "flow_logs_bucket_name": self.flow_logs_bucket_name,
            "config_bucket_name": self.config_bucket_name,
            "log_group_name": self.log_group_name
        })
```

## File: lib/automation_stack.py

```python
"""
Automation infrastructure module for Lambda and EventBridge.

This module creates:
- Lambda functions for Parameter Store secret rotation
- EventBridge custom event bus
- EventBridge rules for scheduled rotation and event forwarding
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class AutomationStackArgs:
    """Arguments for AutomationStack component."""

    def __init__(
        self,
        environment_suffix: str,
        lambda_role_arn: Output[str],
        log_group_arn: Output[str],
        kms_key_id: Output[str]
    ):
        self.environment_suffix = environment_suffix
        self.lambda_role_arn = lambda_role_arn
        self.log_group_arn = log_group_arn
        self.kms_key_id = kms_key_id


class AutomationStack(pulumi.ComponentResource):
    """
    AutomationStack component creates Lambda functions and EventBridge configuration.

    Exports:
        lambda_function_arn: Lambda function ARN
        event_bus_name: EventBridge event bus name
    """

    def __init__(
        self,
        name: str,
        args: AutomationStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:automation:AutomationStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Lambda function code for secret rotation
        lambda_code = """
import json
import boto3
import os
from datetime import datetime
import secrets
import string

ssm = boto3.client('ssm')

def generate_secret(length=32):
    \"\"\"Generate a random secret string.\"\"\"
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def handler(event, context):
    \"\"\"Rotate Parameter Store values.\"\"\"
    environment_suffix = os.environ['ENVIRONMENT_SUFFIX']

    # List of parameters to rotate
    parameter_names = [
        f'/{environment_suffix}/trading-api-key-1',
        f'/{environment_suffix}/trading-api-key-2',
        f'/{environment_suffix}/trading-api-secret'
    ]

    results = []

    for param_name in parameter_names:
        try:
            # Generate new secret value
            new_value = generate_secret()

            # Update parameter
            ssm.put_parameter(
                Name=param_name,
                Value=new_value,
                Type='SecureString',
                Overwrite=True
            )

            results.append({
                'parameter': param_name,
                'status': 'rotated',
                'timestamp': datetime.utcnow().isoformat()
            })

            print(f'Successfully rotated {param_name}')

        except Exception as e:
            results.append({
                'parameter': param_name,
                'status': 'failed',
                'error': str(e)
            })
            print(f'Failed to rotate {param_name}: {str(e)}')

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Secret rotation completed',
            'results': results
        })
    }
"""

        # Create Lambda function for secret rotation
        self.rotation_function = aws.lambda_.Function(
            f"secret-rotation-{self.environment_suffix}",
            name=f"secret-rotation-{self.environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=args.lambda_role_arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            ),
            timeout=30,
            tags={
                "Name": f"secret-rotation-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "automation-team",
                "CostCenter": "automation"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create EventBridge custom event bus
        self.event_bus = aws.cloudwatch.EventBus(
            f"app-events-{self.environment_suffix}",
            name=f"app-events-{self.environment_suffix}",
            tags={
                "Name": f"app-events-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "application-team",
                "CostCenter": "application"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create EventBridge rule for scheduled rotation (every 30 days)
        self.rotation_rule = aws.cloudwatch.EventRule(
            f"rotation-schedule-{self.environment_suffix}",
            name=f"rotation-schedule-{self.environment_suffix}",
            description="Trigger secret rotation every 30 days",
            schedule_expression="rate(30 days)",
            tags={
                "Name": f"rotation-schedule-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "automation-team",
                "CostCenter": "automation"
            },
            opts=ResourceOptions(parent=self.rotation_function)
        )

        # Create EventBridge target for Lambda
        self.rotation_target = aws.cloudwatch.EventTarget(
            f"rotation-target-{self.environment_suffix}",
            rule=self.rotation_rule.name,
            arn=self.rotation_function.arn,
            opts=ResourceOptions(parent=self.rotation_rule)
        )

        # Grant EventBridge permission to invoke Lambda
        self.lambda_permission = aws.lambda_.Permission(
            f"rotation-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.rotation_function.name,
            principal="events.amazonaws.com",
            source_arn=self.rotation_rule.arn,
            opts=ResourceOptions(parent=self.rotation_target)
        )

        # Create IAM role for EventBridge to write to CloudWatch Logs
        eventbridge_log_assume_role = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                actions=["sts:AssumeRole"],
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type="Service",
                    identifiers=["events.amazonaws.com"]
                )]
            )]
        )

        self.eventbridge_log_role = aws.iam.Role(
            f"eventbridge-log-role-{self.environment_suffix}",
            name=f"eventbridge-log-role-{self.environment_suffix}",
            assume_role_policy=eventbridge_log_assume_role.json,
            tags={
                "Name": f"eventbridge-log-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "monitoring-team",
                "CostCenter": "monitoring"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create inline policy for CloudWatch Logs access
        eventbridge_log_policy = aws.iam.RolePolicy(
            f"eventbridge-log-policy-{self.environment_suffix}",
            role=self.eventbridge_log_role.id,
            policy=args.log_group_arn.apply(
                lambda log_arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            "Resource": log_arn
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self.eventbridge_log_role)
        )

        # Create EventBridge rule to forward custom bus events to CloudWatch Logs
        self.log_forwarding_rule = aws.cloudwatch.EventRule(
            f"log-forwarding-{self.environment_suffix}",
            name=f"log-forwarding-{self.environment_suffix}",
            description="Forward application events to CloudWatch Logs",
            event_bus_name=self.event_bus.name,
            event_pattern=json.dumps({
                "source": [{"prefix": ""}]  # Match all events
            }),
            tags={
                "Name": f"log-forwarding-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "monitoring-team",
                "CostCenter": "monitoring"
            },
            opts=ResourceOptions(parent=self.event_bus)
        )

        # Create EventBridge target for CloudWatch Logs
        self.log_target = aws.cloudwatch.EventTarget(
            f"log-target-{self.environment_suffix}",
            rule=self.log_forwarding_rule.name,
            event_bus_name=self.event_bus.name,
            arn=args.log_group_arn,
            role_arn=self.eventbridge_log_role.arn,
            opts=ResourceOptions(parent=self.log_forwarding_rule, depends_on=[eventbridge_log_policy])
        )

        # Register outputs
        self.lambda_function_arn = self.rotation_function.arn
        self.event_bus_name = self.event_bus.name

        self.register_outputs({
            "lambda_function_arn": self.lambda_function_arn,
            "event_bus_name": self.event_bus_name
        })
```

## File: lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of networking, security, monitoring, and
automation components for a secure AWS foundation.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions

from .networking_stack import NetworkingStack, NetworkingStackArgs
from .security_stack import SecurityStack, SecurityStackArgs
from .monitoring_stack import MonitoringStack, MonitoringStackArgs
from .automation_stack import AutomationStack, AutomationStackArgs


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
        region (str): AWS region for deployment (default: us-east-2).
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        region: str = "us-east-2"
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.region = region


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of:
    - NetworkingStack: VPC, subnets, NAT instances, route tables
    - SecurityStack: KMS keys, Parameter Store, IAM roles
    - MonitoringStack: VPC Flow Logs, AWS Config, CloudWatch Logs
    - AutomationStack: Lambda functions, EventBridge rules

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags
        self.region = args.region

        # Create networking infrastructure
        self.networking = NetworkingStack(
            "networking",
            NetworkingStackArgs(
                environment_suffix=self.environment_suffix,
                region=self.region
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create security infrastructure
        self.security = SecurityStack(
            "security",
            SecurityStackArgs(
                environment_suffix=self.environment_suffix
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create monitoring infrastructure
        self.monitoring = MonitoringStack(
            "monitoring",
            MonitoringStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=self.networking.vpc_id,
                region=self.region
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.networking])
        )

        # Create automation infrastructure
        self.automation = AutomationStack(
            "automation",
            AutomationStackArgs(
                environment_suffix=self.environment_suffix,
                lambda_role_arn=self.security.lambda_role_arn,
                log_group_arn=self.monitoring.log_group.arn,
                kms_key_id=self.security.kms_key_id
            ),
            opts=ResourceOptions(parent=self, depends_on=[self.security, self.monitoring])
        )

        # Register stack outputs for cross-stack references
        self.register_outputs({
            # Networking outputs
            "vpc_id": self.networking.vpc_id,
            "private_subnet_ids": self.networking.private_subnet_ids,
            "nat_instance_ips": self.networking.nat_instance_ips,

            # Security outputs
            "kms_key_id": self.security.kms_key_id,
            "kms_key_arn": self.security.kms_key_arn,
            "parameter_arns": self.security.parameter_arns,

            # Monitoring outputs
            "flow_logs_bucket_name": self.monitoring.flow_logs_bucket_name,
            "config_bucket_name": self.monitoring.config_bucket_name,
            "log_group_name": self.monitoring.log_group_name,

            # Automation outputs
            "lambda_function_arn": self.automation.lambda_function_arn,
            "event_bus_name": self.automation.event_bus_name
        })
```

## File: lib/__init__.py

```python
"""
Pulumi infrastructure library for secure AWS foundation.

This package contains modular components for:
- Networking: VPC, subnets, NAT instances
- Security: KMS, Parameter Store, IAM
- Monitoring: VPC Flow Logs, AWS Config, CloudWatch
- Automation: Lambda functions, EventBridge
"""

from .tap_stack import TapStack, TapStackArgs
from .networking_stack import NetworkingStack, NetworkingStackArgs
from .security_stack import SecurityStack, SecurityStackArgs
from .monitoring_stack import MonitoringStack, MonitoringStackArgs
from .automation_stack import AutomationStack, AutomationStackArgs

__all__ = [
    "TapStack",
    "TapStackArgs",
    "NetworkingStack",
    "NetworkingStackArgs",
    "SecurityStack",
    "SecurityStackArgs",
    "MonitoringStack",
    "MonitoringStackArgs",
    "AutomationStack",
    "AutomationStackArgs"
]
```

## Implementation Notes

### Architecture Decisions

1. **NAT Instances vs NAT Gateways**: Using NAT instances for cost optimization as requested. Each instance is configured with IP forwarding and iptables masquerading.

2. **Parameter Store vs Secrets Manager**: Using Systems Manager Parameter Store with SecureString type and KMS encryption as specified in requirements.

3. **EventBridge for Automation**: All event-driven workflows use EventBridge (not CloudWatch Events), including the 30-day rotation schedule.

4. **Modular Component Design**: Each logical grouping (networking, security, monitoring, automation) is a separate Pulumi ComponentResource for better organization and reusability.

5. **Explicit Dependencies**: Using Pulumi's `depends_on` and `parent` ResourceOptions to create explicit dependency chains between resources.

### Resource Tagging

All resources include the required tagging schema:
- **Environment**: Uses environmentSuffix variable
- **Owner**: Team responsible for the resource
- **CostCenter**: Cost allocation category

### Security Considerations

1. **Encryption**: KMS encryption for Parameter Store, S3 server-side encryption for buckets
2. **IAM Least Privilege**: Each role has minimal permissions required for its function
3. **Network Isolation**: Private subnets only, no public-facing infrastructure
4. **Public Access Blocking**: All S3 buckets have public access blocks enabled

### Compliance Features

1. **VPC Flow Logs**: Capturing ALL traffic with 90-day lifecycle policy
2. **AWS Config**: Recorder enabled with delivery to S3
3. **Custom Config Rules**:
   - Encrypted EBS volumes check
   - Public S3 bucket access check

### Automation

1. **Secret Rotation**: Lambda function generates new secrets and updates Parameter Store
2. **Scheduled Execution**: EventBridge rule triggers rotation every 30 days
3. **Event Forwarding**: Custom EventBridge bus forwards application events to CloudWatch Logs

### Destroyability

- All resources configured without retention policies
- S3 buckets have `force_destroy=True` for complete cleanup
- No DeletionPolicy: Retain on any resource

### Stack Exports

The following outputs are exported for cross-stack references:
- VPC ID
- Private subnet IDs (list of 3)
- NAT instance Elastic IPs (list of 3)
- KMS key ID and ARN
- Parameter Store ARNs
- S3 bucket names
- CloudWatch Log Group name
- Lambda function ARN
- EventBridge bus name