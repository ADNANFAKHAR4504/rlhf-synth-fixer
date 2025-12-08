import json
import os

from cdktf import TerraformOutput, TerraformStack
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import \
    CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.data_aws_caller_identity import \
    DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion
from cdktf_cdktf_provider_aws.dynamodb_table import (
    DynamodbTable, DynamodbTableAttribute, DynamodbTablePointInTimeRecovery,
    DynamodbTableReplica, DynamodbTableServerSideEncryption)
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.lambda_function import (
    LambdaFunction, LambdaFunctionEnvironment)
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.route53_record import (
    Route53Record, Route53RecordWeightedRoutingPolicy)
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import \
    RouteTableAssociation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_replication_configuration import (
    S3BucketReplicationConfigurationA, S3BucketReplicationConfigurationRule,
    S3BucketReplicationConfigurationRuleDestination,
    S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration,
    S3BucketReplicationConfigurationRuleSourceSelectionCriteria,
    S3BucketReplicationConfigurationRuleSourceSelectionCriteriaSseKmsEncryptedObjects)
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA)
from cdktf_cdktf_provider_aws.s3_bucket_versioning import (
    S3BucketVersioningA, S3BucketVersioningVersioningConfiguration)
from cdktf_cdktf_provider_aws.security_group import (SecurityGroup,
                                                     SecurityGroupEgress,
                                                     SecurityGroupIngress)
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import \
    SnsTopicSubscription
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.vpc_peering_connection import \
    VpcPeeringConnection
from cdktf_cdktf_provider_aws.vpc_peering_connection_accepter import \
    VpcPeeringConnectionAccepterA
from constructs import Construct


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, ns: str, environment_suffix: str,
                 state_bucket: str = None, state_bucket_region: str = None,
                 aws_region: str = None, default_tags: dict = None):
        super().__init__(scope, ns)

        self.environment_suffix = environment_suffix
        self.primary_region = aws_region or "us-east-1"
        self.secondary_region = "us-west-2"

        # Common tags - merge default_tags if provided
        self.common_tags = {
            "Environment": "Production",
            "DisasterRecovery": "Enabled"
        }
        if default_tags and "tags" in default_tags:
            self.common_tags.update(default_tags["tags"])

        # Primary region provider
        self.primary_provider = AwsProvider(
            self,
            "aws_primary",
            region=self.primary_region,
            alias="primary"
        )

        # Secondary region provider
        self.secondary_provider = AwsProvider(
            self,
            "aws_secondary",
            region=self.secondary_region,
            alias="secondary"
        )

        # Get account information
        self.account = DataAwsCallerIdentity(self, "account", provider=self.primary_provider)

        # Create KMS keys
        self.primary_kms_key = self._create_kms_key("primary", self.primary_provider)
        self.secondary_kms_key = self._create_kms_key("secondary", self.secondary_provider)

        # Create VPCs and networking
        self.primary_vpc = self._create_vpc("primary", self.primary_provider)
        self.secondary_vpc = self._create_vpc("secondary", self.secondary_provider)

        # Create VPC peering
        self.vpc_peering = self._create_vpc_peering()

        # Create security groups
        self.primary_sg = self._create_security_group("primary", self.primary_vpc, self.primary_provider)
        self.secondary_sg = self._create_security_group("secondary", self.secondary_vpc, self.secondary_provider)

        # Create S3 buckets with replication
        self.primary_bucket = self._create_s3_bucket("primary", self.primary_kms_key, self.primary_provider)
        self.secondary_bucket = self._create_s3_bucket("secondary", self.secondary_kms_key, self.secondary_provider)
        self._setup_s3_replication()

        # Create DynamoDB global tables
        self.patient_records_table = self._create_dynamodb_global_table(
            "patient-records",
            self.primary_kms_key,
            self.secondary_kms_key
        )
        self.audit_logs_table = self._create_dynamodb_global_table(
            "audit-logs",
            self.primary_kms_key,
            self.secondary_kms_key
        )

        # Create IAM roles for Lambda
        self.primary_lambda_role = self._create_lambda_role("primary", self.primary_provider)
        self.secondary_lambda_role = self._create_lambda_role("secondary", self.secondary_provider)

        # Create Lambda functions
        self.primary_lambda = self._create_lambda_function(
            "primary", self.primary_lambda_role, self.primary_sg,
            self.primary_vpc, self.primary_provider
        )
        self.secondary_lambda = self._create_lambda_function(
            "secondary", self.secondary_lambda_role, self.secondary_sg,
            self.secondary_vpc, self.secondary_provider
        )

        # Create SNS topics
        self.primary_sns = self._create_sns_topic("primary", self.primary_provider)
        self.secondary_sns = self._create_sns_topic("secondary", self.secondary_provider)

        # Create Route 53 health checks and records
        self.primary_health_check = self._create_health_check(
            "primary", self.primary_lambda, self.primary_provider
        )
        self.secondary_health_check = self._create_health_check(
            "secondary", self.secondary_lambda, self.secondary_provider
        )
        self._create_route53_records()

        # Create CloudWatch dashboards and alarms
        self._create_cloudwatch_dashboards()
        self._create_cloudwatch_alarms()

        # Outputs
        self._create_outputs()

    def _create_kms_key(self, region_name: str, provider: AwsProvider) -> KmsKey:
        """Create KMS key with annual rotation"""
        key = KmsKey(
            self,
            f"kms-key-{region_name}-{self.environment_suffix}",
            description=f"KMS key for disaster recovery {region_name} region {self.environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            tags={**self.common_tags, "Region": region_name},
            provider=provider
        )

        # Use environment suffix for alias uniqueness
        KmsAlias(
            self,
            f"kms-alias-{region_name}-{self.environment_suffix}",
            name=(f"alias/dr-healthcare-{region_name}-{self.environment_suffix}"),
            target_key_id=key.key_id,
            provider=provider
        )

        return key

    def _create_vpc(self, region_name: str, provider: AwsProvider) -> Vpc:
        """Create VPC for the region"""
        vpc = Vpc(
            self,
            f"vpc-{region_name}-{self.environment_suffix}",
            cidr_block="10.0.0.0/16" if region_name == "primary" else "10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": f"dr-vpc-{region_name}-{self.environment_suffix}"},
            provider=provider
        )

        # Create subnets
        for i in range(2):
            region = (self.primary_region if region_name == 'primary'
                     else self.secondary_region)
            az_suffix = 'a' if i == 0 else 'b'
            Subnet(
                self,
                f"subnet-{region_name}-{i}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.{'0' if region_name == 'primary' else '1'}.{i}.0/24",
                availability_zone=f"{region}{az_suffix}",
                tags={**self.common_tags,
                      "Name": f"dr-subnet-{region_name}-{i}-{self.environment_suffix}"},
                provider=provider
            )

        return vpc

    def _create_vpc_peering(self) -> VpcPeeringConnection:
        """Create VPC peering connection between regions"""
        peering = VpcPeeringConnection(
            self,
            f"vpc-peering-{self.environment_suffix}",
            vpc_id=self.primary_vpc.id,
            peer_vpc_id=self.secondary_vpc.id,
            peer_region=self.secondary_region,
            auto_accept=False,
            tags={**self.common_tags, "Name": f"dr-peering-{self.environment_suffix}"},
            provider=self.primary_provider
        )

        # Accept peering in secondary region
        VpcPeeringConnectionAccepterA(
            self,
            f"vpc-peering-accepter-{self.environment_suffix}",
            vpc_peering_connection_id=peering.id,
            auto_accept=True,
            tags={**self.common_tags, "Name": f"dr-peering-accepter-{self.environment_suffix}"},
            provider=self.secondary_provider
        )

        return peering

    def _create_security_group(self, region_name: str, vpc: Vpc, provider: AwsProvider) -> SecurityGroup:
        """Create security group for Lambda functions"""
        sg = SecurityGroup(
            self,
            f"sg-lambda-{region_name}-{self.environment_suffix}",
            name=f"dr-lambda-sg-{region_name}-{self.environment_suffix}",
            description=f"Security group for Lambda functions in {region_name}",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/8"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.common_tags, "Name": f"dr-lambda-sg-{region_name}-{self.environment_suffix}"},
            provider=provider
        )

        return sg

    def _create_s3_bucket(self, region_name: str, kms_key: KmsKey, provider: AwsProvider) -> S3Bucket:
        """Create S3 bucket with encryption"""
        # S3 bucket names must be globally unique, so include account id
        bucket_name = (f"dr-healthcare-{region_name}-{self.environment_suffix}-"
                       f"{self.account.account_id}")

        bucket = S3Bucket(
            self,
            f"s3-bucket-{region_name}-{self.environment_suffix}",
            bucket=bucket_name,
            tags={**self.common_tags, "Region": region_name},
            provider=provider
        )

        # Enable versioning
        S3BucketVersioningA(
            self,
            f"s3-versioning-{region_name}-{self.environment_suffix}",
            bucket=bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            ),
            provider=provider
        )

        # Configure encryption
        S3BucketServerSideEncryptionConfigurationA(
            self,
            f"s3-encryption-{region_name}-{self.environment_suffix}",
            bucket=bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=(
                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                            sse_algorithm="aws:kms",
                            kms_master_key_id=kms_key.arn
                        )
                    ),
                    bucket_key_enabled=True
                )
            ],
            provider=provider
        )

        return bucket

    def _setup_s3_replication(self):
        """Setup S3 cross-region replication"""
        # Create replication role
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "s3.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        replication_role = IamRole(
            self,
            f"s3-replication-role-{self.environment_suffix}",
            name=(f"dr-s3-replication-role-{self.environment_suffix}"),
            assume_role_policy=json.dumps(assume_role_policy),
            tags=self.common_tags,
            provider=self.primary_provider
        )

        # Create replication policy
        replication_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetReplicationConfiguration",
                        "s3:ListBucket"
                    ],
                    "Resource": [self.primary_bucket.arn]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObjectVersionForReplication",
                        "s3:GetObjectVersionAcl"
                    ],
                    "Resource": [f"{self.primary_bucket.arn}/*"]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ReplicateObject",
                        "s3:ReplicateDelete"
                    ],
                    "Resource": [f"{self.secondary_bucket.arn}/*"]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt"
                    ],
                    "Resource": [self.primary_kms_key.arn]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Encrypt"
                    ],
                    "Resource": [self.secondary_kms_key.arn]
                }
            ]
        }

        IamRolePolicy(
            self,
            f"s3-replication-policy-{self.environment_suffix}",
            name=(f"dr-s3-replication-policy-{self.environment_suffix}"),
            role=replication_role.id,
            policy=json.dumps(replication_policy),
            provider=self.primary_provider
        )

        # Configure replication
        S3BucketReplicationConfigurationA(
            self,
            f"s3-replication-config-{self.environment_suffix}",
            bucket=self.primary_bucket.id,
            role=replication_role.arn,
            rule=[
                S3BucketReplicationConfigurationRule(
                    id="replicate-all",
                    status="Enabled",
                    priority=1,
                    delete_marker_replication={"status": "Enabled"},
                    destination=S3BucketReplicationConfigurationRuleDestination(
                        bucket=self.secondary_bucket.arn,
                        storage_class="STANDARD",
                        encryption_configuration=S3BucketReplicationConfigurationRuleDestinationEncryptionConfiguration(
                            replica_kms_key_id=self.secondary_kms_key.arn
                        )
                    ),
                    source_selection_criteria=(
                        S3BucketReplicationConfigurationRuleSourceSelectionCriteria(
                            sse_kms_encrypted_objects=(
                                S3BucketReplicationConfigurationRuleSourceSelectionCriteriaSseKmsEncryptedObjects(
                                    status="Enabled"
                                )
                            )
                        )
                    ),
                    filter={}
                )
            ],
            provider=self.primary_provider
        )

    def _create_dynamodb_global_table(
        self, table_name: str, primary_kms: KmsKey, secondary_kms: KmsKey
    ) -> DynamodbTable:
        """Create DynamoDB global table"""
        # Use a simpler naming without the full account ID to avoid conflicts
        # The environment_suffix should be unique enough
        table = DynamodbTable(
            self,
            f"dynamodb-{table_name}-{self.environment_suffix}",
            name=(f"dr-{table_name}-{self.environment_suffix}"),
            billing_mode="PAY_PER_REQUEST",
            hash_key="id",
            attribute=[
                DynamodbTableAttribute(name="id", type="S")
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(
                enabled=True
            ),
            server_side_encryption=DynamodbTableServerSideEncryption(
                enabled=True,
                kms_key_arn=primary_kms.arn
            ),
            replica=[
                DynamodbTableReplica(
                    region_name=self.secondary_region,
                    kms_key_arn=secondary_kms.arn,
                    point_in_time_recovery=True
                )
            ],
            tags=self.common_tags,
            provider=self.primary_provider
        )

        return table

    def _create_lambda_role(self, region_name: str, provider: AwsProvider) -> IamRole:
        """Create IAM role for Lambda functions"""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        role = IamRole(
            self,
            f"lambda-role-{region_name}-{self.environment_suffix}",
            name=(f"dr-lambda-role-{region_name}-{self.environment_suffix}"),
            assume_role_policy=json.dumps(assume_role_policy),
            tags=self.common_tags,
            provider=provider
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            f"lambda-basic-execution-{region_name}-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=provider
        )

        # Create custom policy for DynamoDB and S3 access
        lambda_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": [
                        f"arn:aws:dynamodb:*:{self.account.account_id}:table/dr-*-{self.environment_suffix}"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::dr-healthcare-*-{self.environment_suffix}",
                        f"arn:aws:s3:::dr-healthcare-*-{self.environment_suffix}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": ["*"]
                }
            ]
        }

        policy = IamPolicy(
            self,
            f"lambda-policy-{region_name}-{self.environment_suffix}",
            name=(f"dr-lambda-policy-{region_name}-{self.environment_suffix}"),
            policy=json.dumps(lambda_policy),
            tags=self.common_tags,
            provider=provider
        )

        IamRolePolicyAttachment(
            self,
            f"lambda-custom-policy-{region_name}-{self.environment_suffix}",
            role=role.name,
            policy_arn=policy.arn,
            provider=provider
        )

        return role

    def _create_lambda_function(
        self, region_name: str, role: IamRole, sg: SecurityGroup,
        vpc: Vpc, provider: AwsProvider
    ) -> LambdaFunction:
        """Create Lambda function"""
        import tempfile
        import zipfile

        # Create Lambda function code directory
        lambda_code = """
import json
import boto3
import os

def handler(event, context):
    '''Health check Lambda function for disaster recovery'''

    # Check DynamoDB connectivity
    try:
        dynamodb = boto3.client('dynamodb')
        response = dynamodb.list_tables()

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'healthy',
                'region': os.environ.get('AWS_REGION'),
                'message': 'All systems operational'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e)
            })
        }
"""

        # Write Lambda function code
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")
        os.makedirs(lambda_dir, exist_ok=True)

        lambda_file = os.path.join(lambda_dir, f"health_check_{region_name}.py")
        with open(lambda_file, "w", encoding="utf-8") as f:
            f.write(lambda_code)

        # Create zip file for Lambda deployment
        zip_file = os.path.join(lambda_dir, f"health_check_{region_name}.zip")
        with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(lambda_file, arcname="health_check.py")

        function = LambdaFunction(
            self,
            f"lambda-{region_name}-{self.environment_suffix}",
            function_name=(f"dr-health-check-{region_name}-{self.environment_suffix}"),
            role=role.arn,
            handler="health_check.handler",
            runtime="python3.11",
            memory_size=3072,
            timeout=30,
            filename=zip_file,
            source_code_hash="${filebase64sha256(\"" + zip_file + "\")}",
            environment=LambdaFunctionEnvironment(
                variables={
                    "ENVIRONMENT": "production",
                    "REGION": self.primary_region if region_name == "primary" else self.secondary_region
                }
            ),
            tags={**self.common_tags, "Region": region_name},
            provider=provider
        )

        return function

    def _create_sns_topic(self, region_name: str, provider: AwsProvider) -> SnsTopic:
        """Create SNS topic for alerts"""
        topic = SnsTopic(
            self,
            f"sns-topic-{region_name}-{self.environment_suffix}",
            name=(f"dr-alerts-{region_name}-{self.environment_suffix}"),
            tags=self.common_tags,
            provider=provider
        )

        return topic

    def _create_health_check(
        self, region_name: str, lambda_function: LambdaFunction,
        provider: AwsProvider
    ) -> Route53HealthCheck:
        """Create Route 53 health check"""
        # Note: In production, you would use the Lambda function URL or API Gateway endpoint
        # CALCULATED health checks do not support failure_threshold parameter
        health_check = Route53HealthCheck(
            self,
            f"health-check-{region_name}-{self.environment_suffix}",
            type="CALCULATED",
            child_health_threshold=1,
            child_healthchecks=[],  # Would reference actual endpoint checks
            insufficient_data_health_status="Unhealthy",
            measure_latency=True,
            tags={**self.common_tags, "Region": region_name},
            provider=provider
        )

        return health_check

    def _create_route53_records(self):
        """Create Route 53 weighted routing records"""
        # Create hosted zone (in production, this would be an existing zone)
        # Use a valid test domain pattern instead of reserved example.com
        zone = Route53Zone(
            self,
            f"hosted-zone-{self.environment_suffix}",
            name=f"dr-healthcare-{self.environment_suffix}.testing.local",
            tags=self.common_tags,
            provider=self.primary_provider
        )

        # Primary region record (70% weight)
        Route53Record(
            self,
            f"route53-primary-{self.environment_suffix}",
            zone_id=zone.zone_id,
            name=f"api.dr-healthcare-{self.environment_suffix}.testing.local",
            type="A",
            ttl=60,
            records=["127.0.0.1"],  # Would be actual endpoint IP
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=70
            ),
            set_identifier=f"primary-{self.environment_suffix}",
            health_check_id=self.primary_health_check.id,
            provider=self.primary_provider
        )

        # Secondary region record (30% weight)
        Route53Record(
            self,
            f"route53-secondary-{self.environment_suffix}",
            zone_id=zone.zone_id,
            name=f"api.dr-healthcare-{self.environment_suffix}.testing.local",
            type="A",
            ttl=60,
            records=["127.0.0.2"],  # Would be actual endpoint IP
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=30
            ),
            set_identifier=f"secondary-{self.environment_suffix}",
            health_check_id=self.secondary_health_check.id,
            provider=self.secondary_provider
        )

    def _create_cloudwatch_dashboards(self):
        """Create CloudWatch dashboards for monitoring"""
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "ReplicationLatency", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": self.primary_region,
                        "title": "DynamoDB Replication Lag",
                        "yAxis": {
                            "left": {
                                "min": 0
                            }
                        }
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Route53", "HealthCheckStatus", {"stat": "Average"}]
                        ],
                        "period": 60,
                        "stat": "Average",
                        "region": self.primary_region,
                        "title": "Health Check Status"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
                            [".", "Errors", {"stat": "Sum"}],
                            [".", "Duration", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": self.primary_region,
                        "title": "Lambda Metrics"
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            f"dashboard-{self.environment_suffix}",
            dashboard_name=f"dr-healthcare-{self.environment_suffix}",
            dashboard_body=json.dumps(dashboard_body),
            provider=self.primary_provider
        )

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms"""
        # Alarm for health check failures
        CloudwatchMetricAlarm(
            self,
            f"alarm-health-check-primary-{self.environment_suffix}",
            alarm_name=f"dr-health-check-failure-primary-{self.environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=3,
            metric_name="HealthCheckStatus",
            namespace="AWS/Route53",
            period=60,
            statistic="Minimum",
            threshold=1,
            alarm_description="Alert when primary region health check fails",
            alarm_actions=[self.primary_sns.arn],
            dimensions={
                "HealthCheckId": self.primary_health_check.id
            },
            tags=self.common_tags,
            provider=self.primary_provider
        )

        CloudwatchMetricAlarm(
            self,
            f"alarm-health-check-secondary-{self.environment_suffix}",
            alarm_name=f"dr-health-check-failure-secondary-{self.environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=3,
            metric_name="HealthCheckStatus",
            namespace="AWS/Route53",
            period=60,
            statistic="Minimum",
            threshold=1,
            alarm_description="Alert when secondary region health check fails",
            alarm_actions=[self.secondary_sns.arn],
            dimensions={
                "HealthCheckId": self.secondary_health_check.id
            },
            tags=self.common_tags,
            provider=self.secondary_provider
        )

        # Alarm for DynamoDB replication lag
        CloudwatchMetricAlarm(
            self,
            f"alarm-replication-lag-{self.environment_suffix}",
            alarm_name=f"dr-replication-lag-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ReplicationLatency",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Average",
            threshold=60000,  # 60 seconds in milliseconds
            alarm_description="Alert when DynamoDB replication lag exceeds 1 minute",
            alarm_actions=[self.primary_sns.arn],
            tags=self.common_tags,
            provider=self.primary_provider
        )

    def _create_outputs(self):
        """Create Terraform outputs"""
        TerraformOutput(
            self,
            "primary_kms_key_id",
            value=self.primary_kms_key.key_id,
            description="Primary region KMS key ID"
        )

        TerraformOutput(
            self,
            "secondary_kms_key_id",
            value=self.secondary_kms_key.key_id,
            description="Secondary region KMS key ID"
        )

        TerraformOutput(
            self,
            "primary_bucket_name",
            value=self.primary_bucket.bucket,
            description="Primary S3 bucket name"
        )

        TerraformOutput(
            self,
            "secondary_bucket_name",
            value=self.secondary_bucket.bucket,
            description="Secondary S3 bucket name"
        )

        TerraformOutput(
            self,
            "patient_records_table_name",
            value=self.patient_records_table.name,
            description="Patient records DynamoDB table name"
        )

        TerraformOutput(
            self,
            "audit_logs_table_name",
            value=self.audit_logs_table.name,
            description="Audit logs DynamoDB table name"
        )

        TerraformOutput(
            self,
            "primary_lambda_function_name",
            value=self.primary_lambda.function_name,
            description="Primary Lambda function name"
        )

        TerraformOutput(
            self,
            "secondary_lambda_function_name",
            value=self.secondary_lambda.function_name,
            description="Secondary Lambda function name"
        )

        TerraformOutput(
            self,
            "primary_sns_topic_arn",
            value=self.primary_sns.arn,
            description="Primary SNS topic ARN"
        )

        TerraformOutput(
            self,
            "secondary_sns_topic_arn",
            value=self.secondary_sns.arn,
            description="Secondary SNS topic ARN"
        )
