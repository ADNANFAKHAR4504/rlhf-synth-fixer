#tap_stack.py
"""
Main infrastructure stack implementation for the TAP (Test Automation Platform).

This module implements a comprehensive, security-first infrastructure framework
that complies with enterprise-grade security requirements including multi-region
redundancy, TLS enforcement, IAM least privilege, comprehensive logging, and
automated compliance checks.
"""

import json
from typing import Any, Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, Output, ResourceOptions


class TapStackArgs:
    """Arguments for the TapStack component."""
    
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class TapStack(ComponentResource):
    """
    Main infrastructure stack implementing security-first cloud architecture.
    
    Features:
    - Multi-region redundancy
    - TLS 1.2+ enforcement
    - IAM least privilege
    - Comprehensive logging and monitoring
    - Automated secrets management
    - IPv6/dual-stack networking
    - Automated compliance checks
    """
    
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__("pkg:index:TapStack", name, {}, opts)
        
        self.environment_suffix = args.environment_suffix
        self.regions = ["us-east-1", "us-west-2", "ap-south-1"]
        self.primary_region = "us-east-1"
        
        # Standard tags for all resources
        self.standard_tags = {
            "Environment": self.environment_suffix,
            "Owner": "DevOps-Team",
            "CostCenter": "Infrastructure",
            "Project": "AWS-Nova-Model-Breaking",
            "ManagedBy": "Pulumi"
        }
        
        # Create infrastructure components
        self._create_kms_keys()
        self._create_secrets_manager()
        self._create_iam_roles()
        self._create_cloudtrail()
        self._create_vpc_infrastructure()
        self._create_s3_buckets()
        self._create_rds_instances()
        self._create_lambda_functions()
        self._create_ec2_instances()
        self._create_monitoring()
        self._create_compliance_checks()
        
        # Register outputs
        self.register_outputs({
            "primary_vpc_id": self.primary_vpc.id,
            "kms_key_arn": self.kms_key.arn,
            "secrets_manager_arn": self.secrets_manager.arn
        })
    
    def _create_kms_keys(self):
        """Create KMS keys for encryption across regions."""
        self.kms_keys = {}
        
        for region in self.regions:
            provider = aws.Provider(
                f"provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            key = aws.kms.Key(
                f"PROD-kms-{region}-{self.environment_suffix}",
                description=f"KMS key for {region} region encryption",
                deletion_window_in_days=7,
                enable_key_rotation=True,
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
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            aws.kms.Alias(
                f"PROD-kms-alias-{region}-{self.environment_suffix}",
                name=f"alias/PROD-{region}-{self.environment_suffix}",
                target_key_id=key.key_id,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            self.kms_keys[region] = key
        
        # Primary region KMS key for easy reference
        self.kms_key = self.kms_keys[self.primary_region]
    
    def _create_secrets_manager(self):
        """Create AWS Secrets Manager for automated secrets management."""
        self.secrets_manager = aws.secretsmanager.Secret(
            f"PROD-secrets-{self.environment_suffix}",
            description="Automated secrets management for TAP infrastructure",
            kms_key_id=self.kms_key.arn,
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Create replica secrets in other regions separately
        self.secrets_replicas = {}
        for region in self.regions[1:]:  # Exclude primary region
            provider = aws.Provider(
                f"secrets-provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            replica_secret = aws.secretsmanager.Secret(
                f"PROD-secrets-replica-{region}-{self.environment_suffix}",
                description=f"Replica of secrets for {region} region",
                kms_key_id=self.kms_keys[region].arn,
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Store replica secrets version
            aws.secretsmanager.SecretVersion(
                f"PROD-secrets-replica-version-{region}-{self.environment_suffix}",
                secret_id=replica_secret.id,
                secret_string=json.dumps({
                    "database_password": "secure-auto-generated-password",
                    "api_keys": {
                        "service_a": "secure-api-key-a",
                        "service_b": "secure-api-key-b"
                    }
                }),
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            self.secrets_replicas[region] = replica_secret
        
        # Store primary secrets version
        aws.secretsmanager.SecretVersion(
            f"PROD-secrets-version-{self.environment_suffix}",
            secret_id=self.secrets_manager.id,
            secret_string=json.dumps({
                "database_password": "secure-auto-generated-password",
                "api_keys": {
                    "service_a": "secure-api-key-a",
                    "service_b": "secure-api-key-b"
                }
            }),
            opts=ResourceOptions(parent=self)
        )

    
    def _create_iam_roles(self):
        """Create IAM roles following least privilege principles."""
        # EC2 Instance Role
        self.ec2_role = aws.iam.Role(
            f"PROD-ec2-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {"Service": "ec2.amazonaws.com"}
                    }
                ]
            }),
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Lambda Execution Role
        self.lambda_role = aws.iam.Role(
            f"PROD-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"}
                    }
                ]
            }),
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self)
        )
        
        # Attach minimal required policies
        aws.iam.RolePolicyAttachment(
            f"PROD-ec2-ssm-policy-{self.environment_suffix}",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            opts=ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"PROD-lambda-basic-policy-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )
        
        # Instance Profile for EC2
        self.ec2_instance_profile = aws.iam.InstanceProfile(
            f"PROD-ec2-profile-{self.environment_suffix}",
            role=self.ec2_role.name,
            opts=ResourceOptions(parent=self)
        )
    
    def _create_cloudtrail(self):
        """Create CloudTrail for comprehensive logging."""
        # S3 bucket for CloudTrail logs
        self.cloudtrail_bucket = aws.s3.Bucket(
            f"prod-cloudtrail-{self.environment_suffix}-{aws.get_caller_identity().account_id}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.kms_key.arn
                    ),
                    bucket_key_enabled=True
                )
            ),
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self)
        )
        
        # CloudTrail bucket policy
        cloudtrail_policy = aws.s3.BucketPolicy(
            f"PROD-cloudtrail-policy-{self.environment_suffix}",
            bucket=self.cloudtrail_bucket.id,
            policy=Output.all(self.cloudtrail_bucket.arn, aws.get_caller_identity().account_id).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AWSCloudTrailAclCheck",
                            "Effect": "Allow",
                            "Principal": {"Service": "cloudtrail.amazonaws.com"},
                            "Action": "s3:GetBucketAcl",
                            "Resource": args[0]
                        },
                        {
                            "Sid": "AWSCloudTrailWrite",
                            "Effect": "Allow",
                            "Principal": {"Service": "cloudtrail.amazonaws.com"},
                            "Action": "s3:PutObject",
                            "Resource": f"{args[0]}/*",
                            "Condition": {
                                "StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}
                            }
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self)
        )
        
        # CloudTrail
        self.cloudtrail = aws.cloudtrail.Trail(
            f"PROD-cloudtrail-{self.environment_suffix}",
            s3_bucket_name=self.cloudtrail_bucket.id,
            is_multi_region_trail=True,
            enable_log_file_validation=True,
            kms_key_id=self.kms_key.arn,
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self, depends_on=[cloudtrail_policy])
        )
    
    def _create_vpc_infrastructure(self):
        """Create VPC infrastructure with IPv6 and dual-stack support."""
        self.vpcs = {}
        self.subnets = {}
        
        for region in self.regions:
            provider = aws.Provider(
                f"vpc-provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            # VPC with IPv6 support
            vpc = aws.ec2.Vpc(
                f"PROD-vpc-{region}-{self.environment_suffix}",
                cidr_block="10.0.0.0/16",
                assign_generated_ipv6_cidr_block=True,
                enable_dns_hostnames=True,
                enable_dns_support=True,
                tags={**self.standard_tags, "Name": f"PROD-vpc-{region}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Internet Gateway
            igw = aws.ec2.InternetGateway(
                f"PROD-igw-{region}-{self.environment_suffix}",
                vpc_id=vpc.id,
                tags={**self.standard_tags, "Name": f"PROD-igw-{region}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Public subnets with dual-stack
            public_subnets = []
            private_subnets = []
            
            azs = aws.get_availability_zones(state="available", opts=pulumi.InvokeOptions(provider=provider))
            
            for i, az in enumerate(azs.names[:2]):  # Use first 2 AZs
                # Public subnet
                public_subnet = aws.ec2.Subnet(
                    f"PROD-public-subnet-{region}-{i+1}-{self.environment_suffix}",
                    vpc_id=vpc.id,
                    cidr_block=f"10.0.{i+1}.0/24",
                    ipv6_cidr_block=Output.all(vpc.ipv6_cidr_block).apply(
                        lambda cidr: f"{cidr[0][:-2]}{i+1:02x}::/64"
                    ),
                    availability_zone=az,
                    map_public_ip_on_launch=True,
                    assign_ipv6_address_on_creation=True,
                    tags={**self.standard_tags, "Name": f"PROD-public-subnet-{region}-{i+1}-{self.environment_suffix}"},
                    opts=ResourceOptions(parent=self, provider=provider)
                )
                public_subnets.append(public_subnet)
                
                # Private subnet
                private_subnet = aws.ec2.Subnet(
                    f"PROD-private-subnet-{region}-{i+1}-{self.environment_suffix}",
                    vpc_id=vpc.id,
                    cidr_block=f"10.0.{i+10}.0/24",
                    ipv6_cidr_block=Output.all(vpc.ipv6_cidr_block).apply(
                        lambda cidr: f"{cidr[0][:-2]}{i+10:02x}::/64"
                    ),
                    availability_zone=az,
                    assign_ipv6_address_on_creation=True,
                    tags={**self.standard_tags, "Name": f"PROD-private-subnet-{region}-{i+1}-{self.environment_suffix}"},
                    opts=ResourceOptions(parent=self, provider=provider)
                )
                private_subnets.append(private_subnet)
            
            # Route table for public subnets
            public_rt = aws.ec2.RouteTable(
                f"PROD-public-rt-{region}-{self.environment_suffix}",
                vpc_id=vpc.id,
                tags={**self.standard_tags, "Name": f"PROD-public-rt-{region}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Routes for IPv4 and IPv6
            aws.ec2.Route(
                f"PROD-public-route-ipv4-{region}-{self.environment_suffix}",
                route_table_id=public_rt.id,
                destination_cidr_block="0.0.0.0/0",
                gateway_id=igw.id,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            aws.ec2.Route(
                f"PROD-public-route-ipv6-{region}-{self.environment_suffix}",
                route_table_id=public_rt.id,
                destination_ipv6_cidr_block="::/0",
                gateway_id=igw.id,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Associate public subnets with route table
            for i, subnet in enumerate(public_subnets):
                aws.ec2.RouteTableAssociation(
                    f"PROD-public-rta-{region}-{i+1}-{self.environment_suffix}",
                    subnet_id=subnet.id,
                    route_table_id=public_rt.id,
                    opts=ResourceOptions(parent=self, provider=provider)
                )
            
            # VPC Flow Logs
            flow_log_role = aws.iam.Role(
                f"PROD-flowlog-role-{region}-{self.environment_suffix}",
                assume_role_policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "vpc-flow-logs.amazonaws.com"}
                        }
                    ]
                }),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )

            aws.iam.RolePolicyAttachment(
                f"PROD-flowlog-policy-{region}-{self.environment_suffix}",
                role=flow_log_role.name,
                policy_arn="arn:aws:iam::aws:policy/service-role/VPCFlowLogsDeliveryRolePolicy",
                opts=ResourceOptions(parent=self, provider=provider)
            )

            log_group = aws.cloudwatch.LogGroup(
                f"PROD-flowlog-group-{region}-{self.environment_suffix}",
                name=f"/aws/vpc/flowlogs-{region}-{self.environment_suffix}",
                retention_in_days=30,
                kms_key_id=self.kms_keys[region].arn,
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )

            aws.ec2.FlowLog(
                f"PROD-vpc-flowlog-{region}-{self.environment_suffix}",
                iam_role_arn=flow_log_role.arn,
                log_destination=log_group.arn,
                log_destination_type="cloud-watch-logs",
                vpc_id=vpc.id,  # Correct parameter name
                traffic_type="ALL",
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )

            
            self.vpcs[region] = vpc
            self.subnets[region] = {
                "public": public_subnets,
                "private": private_subnets
            }
        
        # Primary VPC reference
        self.primary_vpc = self.vpcs[self.primary_region]
    
    def _create_s3_buckets(self):
        """Create S3 buckets with encryption and versioning."""
        self.s3_buckets = {}
        
        for region in self.regions:
            provider = aws.Provider(
                f"s3-provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            bucket = aws.s3.Bucket(
                f"prod-storage-{region}-{self.environment_suffix}-{aws.get_caller_identity().account_id}",
                versioning=aws.s3.BucketVersioningArgs(enabled=True),
                server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="aws:kms",
                            kms_master_key_id=self.kms_keys[region].arn
                        ),
                        bucket_key_enabled=True
                    )
                ),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Block public access
            aws.s3.BucketPublicAccessBlock(
                f"PROD-s3-pab-{region}-{self.environment_suffix}",
                bucket=bucket.id,
                block_public_acls=True,
                block_public_policy=True,
                ignore_public_acls=True,
                restrict_public_buckets=True,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            self.s3_buckets[region] = bucket
    
    def _create_rds_instances(self):
        """Create RDS instances with encryption and multi-AZ."""
        self.rds_instances = {}
        
        # RDS subnet groups
        for region in self.regions:
            provider = aws.Provider(
                f"rds-provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            subnet_group = aws.rds.SubnetGroup(
                f"PROD-rds-subnet-group-{region}-{self.environment_suffix}",
                name=f"prod-rds-subnet-group-{region}-{self.environment_suffix}",
                subnet_ids=[subnet.id for subnet in self.subnets[region]["private"]],
                tags={
                    **self.standard_tags,
                    "Name": f"PROD-rds-subnet-group-{region}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self, provider=provider)
            )

            
            # Security group for RDS
            rds_sg = aws.ec2.SecurityGroup(
                f"PROD-rds-sg-{region}-{self.environment_suffix}",
                vpc_id=self.vpcs[region].id,
                description="Security group for RDS instances",
                ingress=[
                    aws.ec2.SecurityGroupIngressArgs(
                        from_port=5432,
                        to_port=5432,
                        protocol="tcp",
                        cidr_blocks=["10.0.0.0/16"]
                    )
                ],
                egress=[
                    aws.ec2.SecurityGroupEgressArgs(
                        from_port=0,
                        to_port=0,
                        protocol="-1",
                        cidr_blocks=["0.0.0.0/0"]
                    )
                ],
                tags={**self.standard_tags, "Name": f"PROD-rds-sg-{region}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # RDS instance
            rds_instance = aws.rds.Instance(
                f"PROD-rds-{region}-{self.environment_suffix}",
                identifier=f"prod-rds-{region}-{self.environment_suffix}",
                engine="postgres",
                engine_version="15.4",
                instance_class="db.t3.micro",
                allocated_storage=20,
                storage_encrypted=True,
                kms_key_id=self.kms_keys[region].arn,
                db_name="tapdb",
                username="tapuser",
                manage_master_user_password=True,
                master_user_secret_kms_key_id=self.kms_keys[region].arn,
                vpc_security_group_ids=[rds_sg.id],
                db_subnet_group_name=subnet_group.name,
                multi_az=True if region == self.primary_region else False,
                storage_type="gp3",
                backup_retention_period=7,
                backup_window="03:00-04:00",
                maintenance_window="sun:04:00-sun:05:00",
                deletion_protection=True,
                skip_final_snapshot=False,
                final_snapshot_identifier=f"prod-rds-final-snapshot-{region}-{self.environment_suffix}",
                tags={**self.standard_tags, "Name": f"PROD-rds-{region}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            self.rds_instances[region] = rds_instance
    
    def _create_lambda_functions(self):
        """Create Lambda functions with proper IAM roles."""
        self.lambda_functions = {}
        
        lambda_code = """
import json
import boto3

def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Hello from secure Lambda!',
            'environment': event.get('environment', 'unknown')
        })
    }
"""
        
        for region in self.regions:
            provider = aws.Provider(
                f"lambda-provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            lambda_function = aws.lambda_.Function(
                f"PROD-lambda-{region}-{self.environment_suffix}",
                runtime="python3.11",
                code=pulumi.AssetArchive({
                    "lambda_function.py": pulumi.StringAsset(lambda_code)
                }),
                handler="lambda_function.lambda_handler",
                role=self.lambda_role.arn,
                kms_key_arn=self.kms_keys[region].arn,
                environment=aws.lambda_.FunctionEnvironmentArgs(
                    variables={
                        "ENVIRONMENT": self.environment_suffix,
                        "REGION": region
                    }
                ),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            self.lambda_functions[region] = lambda_function
    
    def _create_ec2_instances(self):
        """Create EC2 instances with proper security configuration."""
        self.ec2_instances = {}
        
        for region in self.regions:
            provider = aws.Provider(
                f"ec2-provider-{region}",
                region=region,
                opts=ResourceOptions(parent=self)
            )
            
            # Security group for EC2
            ec2_sg = aws.ec2.SecurityGroup(
                f"PROD-ec2-sg-{region}-{self.environment_suffix}",
                vpc_id=self.vpcs[region].id,
                description="Security group for EC2 instances",
                ingress=[
                    aws.ec2.SecurityGroupIngressArgs(
                        from_port=443,
                        to_port=443,
                        protocol="tcp",
                        cidr_blocks=["0.0.0.0/0"]
                    ),
                    aws.ec2.SecurityGroupIngressArgs(
                        from_port=80,
                        to_port=80,
                        protocol="tcp",
                        cidr_blocks=["0.0.0.0/0"]
                    )
                ],
                egress=[
                    aws.ec2.SecurityGroupEgressArgs(
                        from_port=0,
                        to_port=0,
                        protocol="-1",
                        cidr_blocks=["0.0.0.0/0"]
                    )
                ],
                tags={**self.standard_tags, "Name": f"PROD-ec2-sg-{region}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            # Get latest Amazon Linux 2 AMI
            ami = aws.ec2.get_ami(
                most_recent=True,
                owners=["amazon"],
                filters=[
                    aws.ec2.GetAmiFilterArgs(name="name", values=["amzn2-ami-hvm-*-x86_64-gp2"]),
                    aws.ec2.GetAmiFilterArgs(name="virtualization-type", values=["hvm"])
                ],
                opts=pulumi.InvokeOptions(provider=provider)
            )
            
            # User data script
            user_data = """#!/bin/bash
yum update -y
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Configure TLS 1.2 minimum
echo 'MinProtocol = TLSv1.2' >> /etc/ssl/openssl.cnf
"""
            
            # EC2 instance
            ec2_instance = aws.ec2.Instance(
                f"PROD-ec2-{region}-{self.environment_suffix}",
                instance_type="t3.micro",
                ami=ami.id,
                subnet_id=self.subnets[region]["public"][0].id,
                vpc_security_group_ids=[ec2_sg.id],
                iam_instance_profile=self.ec2_instance_profile.name,
                user_data=user_data,
                ebs_block_devices=[
                    aws.ec2.InstanceEbsBlockDeviceArgs(
                        device_name="/dev/xvda",
                        volume_type="gp3",
                        volume_size=20,
                        encrypted=True,
                        kms_key_id=self.kms_keys[region].arn,
                        delete_on_termination=True
                    )
                ],
                metadata_options=aws.ec2.InstanceMetadataOptionsArgs(
                    http_endpoint="enabled",
                    http_tokens="required",
                    http_put_response_hop_limit=1,
                    instance_metadata_tags="enabled"
                ),
                tags={**self.standard_tags, "Name": f"PROD-ec2-{region}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, provider=provider)
            )
            
            self.ec2_instances[region] = ec2_instance
    
    def _create_monitoring(self):
      """Create CloudWatch monitoring and alarms."""
      # CloudWatch Log Groups
      self.log_groups = {}
      
      for region in self.regions:
          provider = aws.Provider(
              f"monitoring-provider-{region}",
              region=region,
              opts=ResourceOptions(parent=self)
          )
          
          log_group = aws.cloudwatch.LogGroup(
              f"PROD-app-logs-{region}-{self.environment_suffix}",
              name=f"/aws/application/tap-{region}-{self.environment_suffix}",
              retention_in_days=30,
              kms_key_id=self.kms_keys[region].arn,
              tags=self.standard_tags,
              opts=ResourceOptions(parent=self, provider=provider)
          )
          
          # CloudWatch Alarms - FIXED: Removed alarm_name parameter
          aws.cloudwatch.MetricAlarm(
              f"PROD-high-cpu-{region}-{self.environment_suffix}",
              comparison_operator="GreaterThanThreshold",
              evaluation_periods=2,
              metric_name="CPUUtilization",
              namespace="AWS/EC2",
              period=300,
              statistic="Average",
              threshold=80,
              alarm_description="This metric monitors ec2 cpu utilization",
              dimensions={
                  "InstanceId": self.ec2_instances[region].id
              },
              tags=self.standard_tags,
              opts=ResourceOptions(parent=self, provider=provider)
          )
          
          self.log_groups[region] = log_group

    
    def _create_compliance_checks(self):
      """Create AWS Config for automated compliance checks."""
      for region in self.regions:
          provider = aws.Provider(
              f"config-provider-{region}",
              region=region,
              opts=ResourceOptions(parent=self)
          )
          
          # Config delivery channel S3 bucket
          config_bucket = aws.s3.Bucket(
              f"prod-config-{region}-{self.environment_suffix}-{aws.get_caller_identity().account_id}",
              versioning=aws.s3.BucketVersioningArgs(enabled=True),
              server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                  rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                      apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                          sse_algorithm="aws:kms",
                          kms_master_key_id=self.kms_keys[region].arn
                      ),
                      bucket_key_enabled=True
                  )
              ),
              tags=self.standard_tags,
              opts=ResourceOptions(parent=self, provider=provider)
          )
          
          # Config service role
          config_role = aws.iam.Role(
              f"PROD-config-role-{region}-{self.environment_suffix}",
              assume_role_policy=json.dumps({
                  "Version": "2012-10-17",
                  "Statement": [
                      {
                          "Action": "sts:AssumeRole",
                          "Effect": "Allow",
                          "Principal": {"Service": "config.amazonaws.com"}
                      }
                  ]
              }),
              tags=self.standard_tags,
              opts=ResourceOptions(parent=self, provider=provider)
          )
          
          aws.iam.RolePolicyAttachment(
              f"PROD-config-policy-{region}-{self.environment_suffix}",
              role=config_role.name,
              policy_arn="arn:aws:iam::aws:policy/service-role/ConfigRole",
              opts=ResourceOptions(parent=self, provider=provider)
          )
          
          # Config delivery channel - FIXED: aws.config instead of aws.cfg
          config_delivery_channel = aws.config.DeliveryChannel(
              f"PROD-config-delivery-{region}-{self.environment_suffix}",
              s3_bucket_name=config_bucket.bucket,
              opts=ResourceOptions(parent=self, provider=provider)
          )
          
          # Config configuration recorder - FIXED: aws.config instead of aws.cfg
          config_recorder = aws.config.ConfigurationRecorder(
              f"PROD-config-recorder-{region}-{self.environment_suffix}",
              role_arn=config_role.arn,
              recording_group=aws.config.ConfigurationRecorderRecordingGroupArgs(
                  all_supported=True,
                  include_global_resource_types=True if region == self.primary_region else False
              ),
              opts=ResourceOptions(parent=self, provider=provider, depends_on=[config_delivery_channel])
          )
          
          # Config rules for compliance checks - FIXED: aws.config instead of aws.cfg
          aws.config.ConfigRule(
              f"PROD-encrypted-volumes-{region}-{self.environment_suffix}",
              name=f"encrypted-volumes-{region}-{self.environment_suffix}",
              source=aws.config.ConfigRuleSourceArgs(
                  owner="AWS",
                  source_identifier="ENCRYPTED_VOLUMES"
              ),
              tags=self.standard_tags,
              opts=ResourceOptions(parent=self, provider=provider, depends_on=[config_recorder])
          )
          
          aws.config.ConfigRule(
              f"PROD-s3-bucket-ssl-requests-{region}-{self.environment_suffix}",
              name=f"s3-bucket-ssl-requests-{region}-{self.environment_suffix}",
              source=aws.config.ConfigRuleSourceArgs(
                  owner="AWS",
                  source_identifier="S3_BUCKET_SSL_REQUESTS_ONLY"
              ),
              tags=self.standard_tags,
              opts=ResourceOptions(parent=self, provider=provider, depends_on=[config_recorder])
          )
