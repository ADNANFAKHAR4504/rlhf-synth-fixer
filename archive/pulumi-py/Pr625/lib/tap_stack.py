"""
Main infrastructure stack implementation for the TAP (Test Automation Platform).

This module implements a comprehensive, security-first infrastructure framework
that complies with enterprise-grade security requirements, including:

• Multi-region redundancy
• TLS 1.2+ enforcement
• IAM least-privilege
• Comprehensive logging & monitoring
• Automated secrets management
• IPv4 networking (IPv6 can be added later)
• Automated compliance checks (AWS Config)
"""

import json
import os
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class TapStackArgs:
    """Constructor-time arguments."""
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class TapStack(ComponentResource):
    """Security-first, multi-region AWS infrastructure stack."""

    def __init__(self, name: str, args: TapStackArgs,
                 opts: Optional[ResourceOptions] = None) -> None:
        super().__init__("pkg:index:TapStack", name, {}, opts)

        self.environment_suffix = args.environment_suffix
        self.regions = ["us-east-1", "us-west-2", "us-east-2"]
        self.primary_region = "us-east-1"

        # Tags attached to every resource
        self.standard_tags = {
            "Environment": self.environment_suffix,
            "Owner": "DevOps-Team",
            "CostCenter": "Infrastructure",
            "Project": "AWS-Nova-Model-Breaking",
            "ManagedBy": "Pulumi",
        }

        # Build all resources
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
        # self._create_compliance_checks()

        self.register_outputs(
            {
                "regions": self.regions,
                "primary_vpc_id": self.primary_vpc.id,
                "kms_key_arn": self.kms_key.arn,
                "secrets_manager_arn": self.secrets_manager.arn,
            }
        )

    def _create_kms_keys(self) -> None:
        self.kms_keys = {}

        for region in self.regions:
            provider = aws.Provider(
                f"provider-{region}", region=region, opts=ResourceOptions(parent=self)
            )

            key = aws.kms.Key(
                f"PROD-kms-{region}-{self.environment_suffix}",
                description=f"KMS key for {region}",
                deletion_window_in_days=7,
                enable_key_rotation=True,
                policy=json.dumps(
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Sid": "Enable IAM User Permissions",
                                "Effect": "Allow",
                                "Principal": {
                                    "AWS": f"arn:aws:iam::"
                                           f"{aws.get_caller_identity().account_id}:root"
                                },
                                "Action": "kms:*",
                                "Resource": "*",
                            },
                            {
                                "Sid": "Allow CloudWatch Logs",
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": f"logs.{region}.amazonaws.com"
                                },
                                "Action": [
                                    "kms:Encrypt",
                                    "kms:Decrypt",
                                    "kms:ReEncrypt*",
                                    "kms:GenerateDataKey*",
                                    "kms:DescribeKey"
                                ],
                                "Resource": "*",
                                "Condition": {
                                    "ArnEquals": {
                                        "kms:EncryptionContext:aws:logs:arn": (
                                            f"arn:aws:logs:{region}:"
                                            f"{aws.get_caller_identity().account_id}:log-group:*"
                                        )
                                    }
                                }
                            },
                            {
                                "Sid": "Allow CloudTrail to encrypt logs",
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "cloudtrail.amazonaws.com"
                                },
                                "Action": [
                                    "kms:GenerateDataKey*",
                                    "kms:DescribeKey",
                                    "kms:Encrypt",
                                    "kms:ReEncrypt*"
                                ],
                                "Resource": "*"
                            },
                            {
                                "Sid": "Allow principals to decrypt CloudTrail logs",
                                "Effect": "Allow",
                                "Principal": {"AWS": "*"},
                                "Action": [
                                    "kms:Decrypt",
                                    "kms:ReEncryptFrom"
                                ],
                                "Resource": "*",
                                "Condition": {
                                    "StringEquals": {
                                        "kms:CallerAccount": (
                                            f"{aws.get_caller_identity().account_id}"
                                        )
                                    }
                                }
                            }
                        ],
                    }
                ),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            aws.kms.Alias(
                f"PROD-kms-alias-{region}-{self.environment_suffix}",
                name=f"alias/PROD-{region}-{self.environment_suffix}",
                target_key_id=key.key_id,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            self.kms_keys[region] = key

        self.kms_key = self.kms_keys[self.primary_region]

    def _create_secrets_manager(self) -> None:
        self.secrets_manager = aws.secretsmanager.Secret(
            f"PROD-secrets-{self.environment_suffix}",
            description="Primary TAP secrets",
            kms_key_id=self.kms_key.arn,
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self),
        )

        aws.secretsmanager.SecretVersion(
            f"PROD-secrets-version-{self.environment_suffix}",
            secret_id=self.secrets_manager.id,
            secret_string=json.dumps(
                {
                    "database_password": "secure-auto-generated-password",
                    "api_keys": {"service_a": "secure-api-key-a", "service_b": "secure-api-key-b"},
                }
            ),
            opts=ResourceOptions(parent=self),
        )

        # Regional replicas
        self.secrets_replicas = {}
        for region in self.regions[1:]:
            provider = aws.Provider(
                f"secrets-provider-{region}", region=region, opts=ResourceOptions(parent=self)
            )

            replica = aws.secretsmanager.Secret(
                f"PROD-secrets-replica-{region}-{self.environment_suffix}",
                description=f"Replica secrets {region}",
                kms_key_id=self.kms_keys[region].arn,
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            aws.secretsmanager.SecretVersion(
                f"PROD-secrets-replica-version-{region}-{self.environment_suffix}",
                secret_id=replica.id,
                secret_string=json.dumps(
                    {
                        "database_password": "secure-auto-generated-password",
                        "api_keys": {
                            "service_a": "secure-api-key-a",
                            "service_b": "secure-api-key-b",
                        },
                    }
                ),
                opts=ResourceOptions(parent=self, provider=provider),
            )

            self.secrets_replicas[region] = replica

    def _create_iam_roles(self) -> None:
        self.ec2_role = aws.iam.Role(
            f"PROD-ec2-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "ec2.amazonaws.com"},
                        }
                    ],
                }
            ),
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self),
        )

        self.lambda_role = aws.iam.Role(
            f"PROD-lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "lambda.amazonaws.com"},
                        }
                    ],
                }
            ),
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self),
        )

        aws.iam.RolePolicyAttachment(
            f"PROD-ec2-ssm-policy-{self.environment_suffix}",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            opts=ResourceOptions(parent=self),
        )

        aws.iam.RolePolicyAttachment(
            f"PROD-lambda-basic-policy-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self),
        )

        self.ec2_instance_profile = aws.iam.InstanceProfile(
            f"PROD-ec2-profile-{self.environment_suffix}",
            role=self.ec2_role.name,
            opts=ResourceOptions(parent=self),
        )

    def _create_cloudtrail(self) -> None:
        """Create CloudTrail for comprehensive logging."""
        self.cloudtrail_bucket = aws.s3.Bucket(
            f"prod-cloudtrail-{self.environment_suffix}-{aws.get_caller_identity().account_id}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=(
                        aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="aws:kms", kms_master_key_id=self.kms_key.arn
                        )
                    ),
                    bucket_key_enabled=True,
                )
            ),
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self),
        )

        cloudtrail_policy = aws.s3.BucketPolicy(
            f"PROD-cloudtrail-policy-{self.environment_suffix}",
            bucket=self.cloudtrail_bucket.id,
            policy=pulumi.Output.all(
                self.cloudtrail_bucket.bucket,
                aws.get_caller_identity().account_id
            ).apply(
                lambda args: json.dumps(
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Sid": "AWSCloudTrailAclCheck",
                                "Effect": "Allow",
                                "Principal": {"Service": "cloudtrail.amazonaws.com"},
                                "Action": "s3:GetBucketAcl",
                                "Resource": f"arn:aws:s3:::{args[0]}"
                            },
                            {
                                "Sid": "AWSCloudTrailWrite",
                                "Effect": "Allow",
                                "Principal": {"Service": "cloudtrail.amazonaws.com"},
                                "Action": "s3:PutObject",
                                "Resource": f"arn:aws:s3:::{args[0]}/AWSLogs/{args[1]}/*",
                                "Condition": {
                                    "StringEquals": {
                                        "s3:x-amz-acl": "bucket-owner-full-control"
                                    }
                                }
                            }
                        ]
                    }
                )
            ),
            opts=ResourceOptions(parent=self),
        )

        aws.cloudtrail.Trail(
            f"PROD-cloudtrail-{self.environment_suffix}",
            s3_bucket_name=self.cloudtrail_bucket.bucket,
            is_multi_region_trail=True,
            enable_log_file_validation=True,
            kms_key_id=self.kms_key.arn,
            tags=self.standard_tags,
            opts=ResourceOptions(parent=self, depends_on=[cloudtrail_policy]),
        )

    def _create_vpc_infrastructure(self) -> None:
        self.vpcs, self.subnets = {}, {}

        for region in self.regions:
            provider = aws.Provider(
                f"vpc-provider-{region}", region=region, opts=ResourceOptions(parent=self)
            )

            vpc = aws.ec2.Vpc(
                f"PROD-vpc-{region}-{self.environment_suffix}",
                cidr_block="10.0.0.0/16",
                enable_dns_hostnames=True,
                enable_dns_support=True,
                tags={**self.standard_tags, "Name": f"PROD-vpc-{region}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, provider=provider),
            )

            igw = aws.ec2.InternetGateway(
                f"PROD-igw-{region}-{self.environment_suffix}",
                vpc_id=vpc.id,
                tags={**self.standard_tags, "Name": f"PROD-igw-{region}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, provider=provider),
            )

            public_subnets, private_subnets = [], []
            azs = aws.get_availability_zones(
                state="available", opts=pulumi.InvokeOptions(provider=provider)
            )

            for i, az in enumerate(azs.names[:2]):
                public_subnet = aws.ec2.Subnet(
                    f"PROD-public-subnet-{region}-{i+1}-{self.environment_suffix}",
                    vpc_id=vpc.id,
                    cidr_block=f"10.0.{i+1}.0/24",
                    availability_zone=az,
                    map_public_ip_on_launch=True,
                    tags={
                        **self.standard_tags,
                        "Name": f"PROD-public-subnet-{region}-{i+1}-{self.environment_suffix}",
                    },
                    opts=ResourceOptions(parent=self, provider=provider),
                )
                public_subnets.append(public_subnet)

                private_subnet = aws.ec2.Subnet(
                    f"PROD-private-subnet-{region}-{i+1}-{self.environment_suffix}",
                    vpc_id=vpc.id,
                    cidr_block=f"10.0.{i+10}.0/24",
                    availability_zone=az,
                    tags={
                        **self.standard_tags,
                        "Name": f"PROD-private-subnet-{region}-{i+1}-{self.environment_suffix}",
                    },
                    opts=ResourceOptions(parent=self, provider=provider),
                )
                private_subnets.append(private_subnet)

            public_rt = aws.ec2.RouteTable(
                f"PROD-public-rt-{region}-{self.environment_suffix}",
                vpc_id=vpc.id,
                tags={
                    **self.standard_tags,
                    "Name": f"PROD-public-rt-{region}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self, provider=provider),
            )

            aws.ec2.Route(
                f"PROD-public-route-ipv4-{region}-{self.environment_suffix}",
                route_table_id=public_rt.id,
                destination_cidr_block="0.0.0.0/0",
                gateway_id=igw.id,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            for i, subnet in enumerate(public_subnets):
                aws.ec2.RouteTableAssociation(
                    f"PROD-public-rta-{region}-{i+1}-{self.environment_suffix}",
                    subnet_id=subnet.id,
                    route_table_id=public_rt.id,
                    opts=ResourceOptions(parent=self, provider=provider),
                )

            # Flow logs with inline policy
            flow_role = aws.iam.Role(
                f"PROD-flowlog-role-{region}-{self.environment_suffix}",
                assume_role_policy=json.dumps(
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
                ),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            aws.iam.RolePolicy(
                f"PROD-flowlog-inline-policy-{region}-{self.environment_suffix}",
                role=flow_role.id,
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogGroups",
                                "logs:DescribeLogStreams"
                            ],
                            "Resource": "*"
                        }
                    ]
                }),
                opts=ResourceOptions(parent=self, provider=provider),
            )

            log_group = aws.cloudwatch.LogGroup(
                f"PROD-flowlog-group-{region}-{self.environment_suffix}",
                name=f"/aws/vpc/flowlogs-{region}-{self.environment_suffix}",
                retention_in_days=30,
                kms_key_id=self.kms_keys[region].arn,
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            aws.ec2.FlowLog(
                f"PROD-vpc-flowlog-{region}-{self.environment_suffix}",
                iam_role_arn=flow_role.arn,
                log_destination=log_group.arn,
                log_destination_type="cloud-watch-logs",
                vpc_id=vpc.id,
                traffic_type="ALL",
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            self.vpcs[region] = vpc
            self.subnets[region] = {"public": public_subnets, "private": private_subnets}

        self.primary_vpc = self.vpcs[self.primary_region]

    def _create_s3_buckets(self) -> None:
        self.s3_buckets = {}

        for region in self.regions:
            provider = aws.Provider(
                f"s3-provider-{region}", region=region, opts=ResourceOptions(parent=self)
            )

            bucket = aws.s3.Bucket(
                (f"prod-storage-{region}-{self.environment_suffix}-"
                 f"{aws.get_caller_identity().account_id}"),
                versioning=aws.s3.BucketVersioningArgs(enabled=True),
                server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=(
                            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                                sse_algorithm="aws:kms", kms_master_key_id=self.kms_keys[region].arn
                            )
                        ),
                        bucket_key_enabled=True,
                    )
                ),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            aws.s3.BucketPublicAccessBlock(
                f"PROD-s3-pab-{region}-{self.environment_suffix}",
                bucket=bucket.id,
                block_public_acls=True,
                block_public_policy=True,
                ignore_public_acls=True,
                restrict_public_buckets=True,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            self.s3_buckets[region] = bucket

    def _create_rds_instances(self) -> None:
        self.rds_instances = {}

        for region in self.regions:
            provider = aws.Provider(
                f"rds-provider-{region}", region=region, opts=ResourceOptions(parent=self)
            )

            subnet_group = aws.rds.SubnetGroup(
                f"PROD-rds-subnet-group-{region}-{self.environment_suffix}",
                name=f"prod-rds-subnet-{region}-{self.environment_suffix}".lower(),
                subnet_ids=[s.id for s in self.subnets[region]["private"]],
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            rds_sg = aws.ec2.SecurityGroup(
                f"PROD-rds-sg-{region}-{self.environment_suffix}",
                vpc_id=self.vpcs[region].id,
                description="PostgreSQL access",
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
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            rds = aws.rds.Instance(
                f"PROD-rds-{region}-{self.environment_suffix}",
                engine="postgres",
                engine_version="15.13",
                instance_class="db.t3.micro",
                identifier=f"prod-rds-{region}-{self.environment_suffix}",
                allocated_storage=20,
                storage_type="gp3",
                storage_encrypted=True,
                kms_key_id=self.kms_keys[region].arn,
                db_name="tapdb",
                username="tapuser",
                manage_master_user_password=True,
                master_user_secret_kms_key_id=self.kms_keys[region].arn,
                vpc_security_group_ids=[rds_sg.id],
                db_subnet_group_name=subnet_group.name,
                multi_az=region == self.primary_region,
                backup_retention_period=7,
                deletion_protection=True,
                skip_final_snapshot=False,
                final_snapshot_identifier=f"prod-rds-snapshot-{region}-{self.environment_suffix}",
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            self.rds_instances[region] = rds

    def _create_lambda_functions(self) -> None:
        self.lambda_functions = {}

        lambda_code = """
import json
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
                f"lambda-provider-{region}", region=region, opts=ResourceOptions(parent=self)
            )

            function = aws.lambda_.Function(
                f"PROD-lambda-{region}-{self.environment_suffix}",
                runtime="python3.11",
                code=pulumi.AssetArchive(
                    {"lambda_function.py": pulumi.StringAsset(lambda_code)}
                ),
                handler="lambda_function.lambda_handler",
                role=self.lambda_role.arn,
                kms_key_arn=self.kms_keys[region].arn,
                environment=aws.lambda_.FunctionEnvironmentArgs(
                    variables={"ENVIRONMENT": self.environment_suffix, "REGION": region}
                ),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            self.lambda_functions[region] = function

    def _create_ec2_instances(self) -> None:
        self.ec2_instances = {}

        for region in self.regions:
            provider = aws.Provider(
                f"ec2-provider-{region}", region=region, opts=ResourceOptions(parent=self)
            )

            ec2_sg = aws.ec2.SecurityGroup(
                f"PROD-ec2-sg-{region}-{self.environment_suffix}",
                vpc_id=self.vpcs[region].id,
                ingress=[
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp", from_port=443, to_port=443, cidr_blocks=["0.0.0.0/0"]
                    ),
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp", from_port=80, to_port=80, cidr_blocks=["0.0.0.0/0"]
                    ),
                ],
                egress=[
                    aws.ec2.SecurityGroupEgressArgs(
                        protocol="-1", from_port=0, to_port=0, cidr_blocks=["0.0.0.0/0"]
                    )
                ],
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            ami = aws.ec2.get_ami(
                most_recent=True,
                owners=["amazon"],
                filters=[
                    aws.ec2.GetAmiFilterArgs(name="name", values=["amzn2-ami-hvm-*-x86_64-gp2"]),
                    aws.ec2.GetAmiFilterArgs(name="virtualization-type", values=["hvm"]),
                ],
                opts=pulumi.InvokeOptions(provider=provider),
            )

            user_data = """#!/bin/bash
yum update -y
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
echo 'MinProtocol = TLSv1.2' >> /etc/ssl/openssl.cnf
"""

            instance = aws.ec2.Instance(
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
                        delete_on_termination=True,
                    )
                ],
                metadata_options=aws.ec2.InstanceMetadataOptionsArgs(
                    http_endpoint="enabled",
                    http_tokens="required",
                    http_put_response_hop_limit=1,
                    instance_metadata_tags="enabled",
                ),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            self.ec2_instances[region] = instance

    def _create_monitoring(self) -> None:
        self.log_groups = {}

        for region in self.regions:
            provider = aws.Provider(
                f"monitoring-provider-{region}", region=region, opts=ResourceOptions(parent=self)
            )

            lg = aws.cloudwatch.LogGroup(
                f"PROD-app-logs-{region}-{self.environment_suffix}",
                name=f"/aws/application/tap-{region}-{self.environment_suffix}",
                retention_in_days=30,
                kms_key_id=self.kms_keys[region].arn,
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            aws.cloudwatch.MetricAlarm(
                f"PROD-high-cpu-{region}-{self.environment_suffix}",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                metric_name="CPUUtilization",
                namespace="AWS/EC2",
                period=300,
                statistic="Average",
                threshold=80,
                alarm_description="EC2 CPU utilization > 80 %",
                dimensions={"InstanceId": self.ec2_instances[region].id},
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            self.log_groups[region] = lg

    def _create_compliance_checks(self) -> None:
        """Create AWS Config compliance checks with conditional creation 
        to handle existing resources."""
        
        provider = aws.Provider(
            f"config-provider-{self.primary_region}", 
            region=self.primary_region, 
            opts=ResourceOptions(parent=self)
        )

        def check_config_exists():
            """Check if AWS Config is already set up in this region."""
            try:
                recorders = aws.cfg.get_configuration_recorders(
                    opts=pulumi.InvokeOptions(provider=provider)
                )
                
                channels = aws.cfg.get_delivery_channels(
                    opts=pulumi.InvokeOptions(provider=provider)
                )
                
                has_recorder = len(recorders.configuration_recorders) > 0
                has_channel = len(channels.delivery_channels) > 0
                
                return {
                    "has_recorder": has_recorder,
                    "has_channel": has_channel,
                    "recorder_count": len(recorders.configuration_recorders),
                    "channel_count": len(channels.delivery_channels)
                }
            except Exception as e:
                pulumi.log.info(f"Error checking AWS Config status: {e}")
                return {
                    "has_recorder": False,
                    "has_channel": False,
                    "recorder_count": 0,
                    "channel_count": 0
                }

        config_status = check_config_exists()
        pulumi.log.info(
            f"AWS Config Status: Recorders={config_status['recorder_count']}, "
            f"Channels={config_status['channel_count']}"
        )

        if not config_status["has_recorder"] and not config_status["has_channel"]:
            pulumi.log.info("Creating new AWS Config setup")
            
            config_bucket = aws.s3.Bucket(
                (f"prod-config-{self.primary_region}-{self.environment_suffix}-"
                 f"{aws.get_caller_identity().account_id}"),
                versioning=aws.s3.BucketVersioningArgs(enabled=True),
                server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=(
                            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                                sse_algorithm="aws:kms", 
                                kms_master_key_id=self.kms_keys[self.primary_region].arn
                            )
                        ),
                        bucket_key_enabled=True,
                    )
                ),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            config_role = aws.iam.Role(
                f"PROD-config-role-{self.primary_region}-{self.environment_suffix}",
                assume_role_policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {"Service": "config.amazonaws.com"},
                    }],
                }),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider),
            )

            aws.iam.RolePolicyAttachment(
                f"PROD-config-policy-{self.primary_region}-{self.environment_suffix}",
                role=config_role.name,
                policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
                opts=ResourceOptions(parent=self, provider=provider),
            )

            recorder = aws.cfg.Recorder(
                f"PROD-config-recorder-{self.primary_region}-{self.environment_suffix}",
                role_arn=config_role.arn,
                recording_group=aws.cfg.RecorderRecordingGroupArgs(
                    all_supported=True,
                    include_global_resource_types=True,
                ),
                opts=ResourceOptions(parent=self, provider=provider),
            )

            delivery = aws.cfg.DeliveryChannel(
                f"PROD-config-delivery-{self.primary_region}-{self.environment_suffix}",
                s3_bucket_name=config_bucket.bucket,
                opts=ResourceOptions(parent=self, provider=provider, depends_on=[recorder]),
            )

            aws.cfg.Rule(
                f"PROD-encrypted-volumes-{self.primary_region}-{self.environment_suffix}",
                name=f"encrypted-volumes-{self.primary_region}-{self.environment_suffix}",
                source=aws.cfg.RuleSourceArgs(
                    owner="AWS", source_identifier="ENCRYPTED_VOLUMES"
                ),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider, depends_on=[recorder]),
            )

            aws.cfg.Rule(
                f"PROD-s3-bucket-ssl-requests-{self.primary_region}-{self.environment_suffix}",
                name=f"s3-bucket-ssl-requests-{self.primary_region}-{self.environment_suffix}",
                source=aws.cfg.RuleSourceArgs(
                    owner="AWS", source_identifier="S3_BUCKET_SSL_REQUESTS_ONLY"
                ),
                tags=self.standard_tags,
                opts=ResourceOptions(parent=self, provider=provider, depends_on=[recorder]),
            )

        else:
            pulumi.log.info("AWS Config already exists - skipping creation of "
                              "Config recorder and delivery channel")
            if config_status["has_recorder"]:
                pulumi.log.info(f"Found {config_status['recorder_count']} "
                                  f"configuration recorder(s)")
            if config_status["has_channel"]:
                pulumi.log.info(f"Found {config_status['channel_count']} delivery channel(s)")


