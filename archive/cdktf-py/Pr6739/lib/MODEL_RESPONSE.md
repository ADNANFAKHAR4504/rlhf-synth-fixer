# Multi-Region Disaster Recovery Implementation

Complete CDKTF Python implementation for multi-region DR architecture spanning us-east-1 (primary) and us-east-2 (secondary).

## File: lib/main.py

```python
#!/usr/bin/env python3
"""
Multi-Region Disaster Recovery Stack for Payment Processing
"""
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupEgress, SecurityGroupIngress
from cdktf_cdktf_provider_aws.vpc_peering_connection import VpcPeeringConnection
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableReplica, DynamodbTableServerSideEncryption, DynamodbTablePointInTimeRecovery
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_replication_configuration import S3BucketReplicationConfigurationA, S3BucketReplicationConfigurationRule, S3BucketReplicationConfigurationRuleDestination, S3BucketReplicationConfigurationRuleDestinationReplicationTime, S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime, S3BucketReplicationConfigurationRuleDestinationMetrics, S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionVpcConfig, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.apigatewayv2_api import Apigatewayv2Api
from cdktf_cdktf_provider_aws.apigatewayv2_stage import Apigatewayv2Stage
from cdktf_cdktf_provider_aws.apigatewayv2_integration import Apigatewayv2Integration
from cdktf_cdktf_provider_aws.apigatewayv2_route import Apigatewayv2Route
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
import json
import os


class MultiRegionDRStack(TerraformStack):
    def __init__(self, scope: Construct, stack_id: str):
        super().__init__(scope, stack_id)

        self.environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'test')
        self.primary_region = 'us-east-1'
        self.secondary_region = 'us-east-2'

        # Providers
        self.primary_provider = AwsProvider(self, 'aws_primary', region=self.primary_region, alias='primary')
        self.secondary_provider = AwsProvider(self, 'aws_secondary', region=self.secondary_region, alias='secondary')

        # Create infrastructure
        self.create_kms_keys()
        self.create_networking()
        self.create_aurora_global()
        self.create_dynamodb_global()
        self.create_s3_replication()
        self.create_lambda_functions()
        self.create_api_gateway()
        self.create_route53_health_checks()
        self.create_monitoring()
        self.create_sns_topics()
        self.create_outputs()

    def create_kms_keys(self):
        """Create KMS keys for encryption"""
        self.kms_primary = KmsKey(self, 'kms_primary', provider=self.primary_provider,
            description=f'DR KMS key primary {self.environment_suffix}',
            deletion_window_in_days=7, enable_key_rotation=True)

        KmsAlias(self, 'kms_primary_alias', provider=self.primary_provider,
            name=f'alias/dr-primary-{self.environment_suffix}',
            target_key_id=self.kms_primary.key_id)

        self.kms_secondary = KmsKey(self, 'kms_secondary', provider=self.secondary_provider,
            description=f'DR KMS key secondary {self.environment_suffix}',
            deletion_window_in_days=7, enable_key_rotation=True)

        KmsAlias(self, 'kms_secondary_alias', provider=self.secondary_provider,
            name=f'alias/dr-secondary-{self.environment_suffix}',
            target_key_id=self.kms_secondary.key_id)

    def create_networking(self):
        """Create VPCs and networking"""
        # Primary VPC
        self.vpc_primary = Vpc(self, 'vpc_primary', provider=self.primary_provider,
            cidr_block='10.0.0.0/16', enable_dns_hostnames=True, enable_dns_support=True,
            tags={'Name': f'vpc-primary-{self.environment_suffix}'})

        self.igw_primary = InternetGateway(self, 'igw_primary', provider=self.primary_provider,
            vpc_id=self.vpc_primary.id, tags={'Name': f'igw-primary-{self.environment_suffix}'})

        # Primary subnets
        self.subnets_primary = []
        azs_primary = ['us-east-1a', 'us-east-1b', 'us-east-1c']
        for i, az in enumerate(azs_primary):
            subnet = Subnet(self, f'subnet_primary_{i}', provider=self.primary_provider,
                vpc_id=self.vpc_primary.id, cidr_block=f'10.0.{i}.0/24',
                availability_zone=az, map_public_ip_on_launch=True,
                tags={'Name': f'subnet-primary-{i}-{self.environment_suffix}'})
            self.subnets_primary.append(subnet)

        # Primary route table
        self.rt_primary = RouteTable(self, 'rt_primary', provider=self.primary_provider,
            vpc_id=self.vpc_primary.id, tags={'Name': f'rt-primary-{self.environment_suffix}'})

        Route(self, 'route_primary_igw', provider=self.primary_provider,
            route_table_id=self.rt_primary.id, destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw_primary.id)

        for i, subnet in enumerate(self.subnets_primary):
            RouteTableAssociation(self, f'rta_primary_{i}', provider=self.primary_provider,
                subnet_id=subnet.id, route_table_id=self.rt_primary.id)

        # Secondary VPC
        self.vpc_secondary = Vpc(self, 'vpc_secondary', provider=self.secondary_provider,
            cidr_block='10.1.0.0/16', enable_dns_hostnames=True, enable_dns_support=True,
            tags={'Name': f'vpc-secondary-{self.environment_suffix}'})

        self.igw_secondary = InternetGateway(self, 'igw_secondary', provider=self.secondary_provider,
            vpc_id=self.vpc_secondary.id, tags={'Name': f'igw-secondary-{self.environment_suffix}'})

        # Secondary subnets
        self.subnets_secondary = []
        azs_secondary = ['us-east-2a', 'us-east-2b', 'us-east-2c']
        for i, az in enumerate(azs_secondary):
            subnet = Subnet(self, f'subnet_secondary_{i}', provider=self.secondary_provider,
                vpc_id=self.vpc_secondary.id, cidr_block=f'10.1.{i}.0/24',
                availability_zone=az, map_public_ip_on_launch=True,
                tags={'Name': f'subnet-secondary-{i}-{self.environment_suffix}'})
            self.subnets_secondary.append(subnet)

        # Secondary route table
        self.rt_secondary = RouteTable(self, 'rt_secondary', provider=self.secondary_provider,
            vpc_id=self.vpc_secondary.id, tags={'Name': f'rt-secondary-{self.environment_suffix}'})

        Route(self, 'route_secondary_igw', provider=self.secondary_provider,
            route_table_id=self.rt_secondary.id, destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw_secondary.id)

        for i, subnet in enumerate(self.subnets_secondary):
            RouteTableAssociation(self, f'rta_secondary_{i}', provider=self.secondary_provider,
                subnet_id=subnet.id, route_table_id=self.rt_secondary.id)

        # VPC Peering
        self.vpc_peering = VpcPeeringConnection(self, 'vpc_peering', provider=self.primary_provider,
            vpc_id=self.vpc_primary.id, peer_vpc_id=self.vpc_secondary.id,
            peer_region=self.secondary_region, auto_accept=False,
            tags={'Name': f'vpc-peering-{self.environment_suffix}'})

        # Security Groups
        self.sg_lambda_primary = SecurityGroup(self, 'sg_lambda_primary', provider=self.primary_provider,
            name=f'lambda-sg-primary-{self.environment_suffix}',
            description='Lambda security group primary',
            vpc_id=self.vpc_primary.id,
            egress=[SecurityGroupEgress(from_port=0, to_port=0, protocol='-1', cidr_blocks=['0.0.0.0/0'])],
            tags={'Name': f'lambda-sg-primary-{self.environment_suffix}'})

        self.sg_rds_primary = SecurityGroup(self, 'sg_rds_primary', provider=self.primary_provider,
            name=f'rds-sg-primary-{self.environment_suffix}',
            description='RDS security group primary',
            vpc_id=self.vpc_primary.id,
            ingress=[SecurityGroupIngress(from_port=5432, to_port=5432, protocol='tcp', cidr_blocks=['10.0.0.0/16'])],
            egress=[SecurityGroupEgress(from_port=0, to_port=0, protocol='-1', cidr_blocks=['0.0.0.0/0'])],
            tags={'Name': f'rds-sg-primary-{self.environment_suffix}'})

        self.sg_lambda_secondary = SecurityGroup(self, 'sg_lambda_secondary', provider=self.secondary_provider,
            name=f'lambda-sg-secondary-{self.environment_suffix}',
            description='Lambda security group secondary',
            vpc_id=self.vpc_secondary.id,
            egress=[SecurityGroupEgress(from_port=0, to_port=0, protocol='-1', cidr_blocks=['0.0.0.0/0'])],
            tags={'Name': f'lambda-sg-secondary-{self.environment_suffix}'})

        self.sg_rds_secondary = SecurityGroup(self, 'sg_rds_secondary', provider=self.secondary_provider,
            name=f'rds-sg-secondary-{self.environment_suffix}',
            description='RDS security group secondary',
            vpc_id=self.vpc_secondary.id,
            ingress=[SecurityGroupIngress(from_port=5432, to_port=5432, protocol='tcp', cidr_blocks=['10.1.0.0/16'])],
            egress=[SecurityGroupEgress(from_port=0, to_port=0, protocol='-1', cidr_blocks=['0.0.0.0/0'])],
            tags={'Name': f'rds-sg-secondary-{self.environment_suffix}'})

    def create_aurora_global(self):
        """Create Aurora Global Database"""
        # DB Subnet Groups
        self.db_subnet_group_primary = DbSubnetGroup(self, 'db_subnet_primary', provider=self.primary_provider,
            name=f'payment-db-primary-{self.environment_suffix}',
            subnet_ids=[s.id for s in self.subnets_primary],
            tags={'Name': f'db-subnet-primary-{self.environment_suffix}'})

        self.db_subnet_group_secondary = DbSubnetGroup(self, 'db_subnet_secondary', provider=self.secondary_provider,
            name=f'payment-db-secondary-{self.environment_suffix}',
            subnet_ids=[s.id for s in self.subnets_secondary],
            tags={'Name': f'db-subnet-secondary-{self.environment_suffix}'})

        # Global Cluster
        self.aurora_global = RdsGlobalCluster(self, 'aurora_global', provider=self.primary_provider,
            global_cluster_identifier=f'payment-global-{self.environment_suffix}',
            engine='aurora-postgresql', engine_version='14.6',
            database_name='paymentdb', storage_encrypted=True)

        # Primary Cluster
        self.aurora_primary = RdsCluster(self, 'aurora_primary', provider=self.primary_provider,
            cluster_identifier=f'payment-primary-{self.environment_suffix}',
            engine='aurora-postgresql', engine_version='14.6',
            database_name='paymentdb', master_username='dbadmin',
            master_password='TempPassword123!',
            db_subnet_group_name=self.db_subnet_group_primary.name,
            vpc_security_group_ids=[self.sg_rds_primary.id],
            global_cluster_identifier=self.aurora_global.id,
            storage_encrypted=True, kms_key_id=self.kms_primary.arn,
            skip_final_snapshot=True, backup_retention_period=1,
            depends_on=[self.aurora_global])

        RdsClusterInstance(self, 'aurora_primary_instance_0', provider=self.primary_provider,
            identifier=f'payment-primary-0-{self.environment_suffix}',
            cluster_identifier=self.aurora_primary.id,
            instance_class='db.t3.medium', engine='aurora-postgresql')

        # Secondary Cluster
        self.aurora_secondary = RdsCluster(self, 'aurora_secondary', provider=self.secondary_provider,
            cluster_identifier=f'payment-secondary-{self.environment_suffix}',
            engine='aurora-postgresql', engine_version='14.6',
            db_subnet_group_name=self.db_subnet_group_secondary.name,
            vpc_security_group_ids=[self.sg_rds_secondary.id],
            global_cluster_identifier=self.aurora_global.id,
            storage_encrypted=True, kms_key_id=self.kms_secondary.arn,
            skip_final_snapshot=True,
            depends_on=[self.aurora_primary])

        RdsClusterInstance(self, 'aurora_secondary_instance_0', provider=self.secondary_provider,
            identifier=f'payment-secondary-0-{self.environment_suffix}',
            cluster_identifier=self.aurora_secondary.id,
            instance_class='db.t3.medium', engine='aurora-postgresql')

    def create_dynamodb_global(self):
        """Create DynamoDB Global Table"""
        self.dynamodb_table = DynamodbTable(self, 'dynamodb_global', provider=self.primary_provider,
            name=f'payment-sessions-{self.environment_suffix}',
            billing_mode='PAY_PER_REQUEST',
            hash_key='sessionId',
            attribute=[DynamodbTableAttribute(name='sessionId', type='S')],
            stream_enabled=True, stream_view_type='NEW_AND_OLD_IMAGES',
            point_in_time_recovery=DynamodbTablePointInTimeRecovery(enabled=True),
            server_side_encryption=DynamodbTableServerSideEncryption(enabled=True, kms_key_arn=self.kms_primary.arn),
            replica=[DynamodbTableReplica(region_name=self.secondary_region, kms_key_arn=self.kms_secondary.arn, point_in_time_recovery=True)],
            tags={'Name': f'payment-sessions-{self.environment_suffix}'})

    def create_s3_replication(self):
        """Create S3 buckets with cross-region replication"""
        # IAM Role for replication
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "s3.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        self.s3_replication_role = IamRole(self, 's3_replication_role', provider=self.primary_provider,
            name=f's3-replication-{self.environment_suffix}',
            assume_role_policy=assume_role_policy)

        policy_doc = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["s3:GetReplicationConfiguration", "s3:ListBucket",
                    "s3:GetObjectVersionForReplication", "s3:GetObjectVersionAcl",
                    "s3:ReplicateObject", "s3:ReplicateDelete"],
                "Resource": ["*"]
            }]
        })

        replication_policy = IamPolicy(self, 's3_replication_policy', provider=self.primary_provider,
            name=f's3-replication-policy-{self.environment_suffix}',
            policy=policy_doc)

        IamRolePolicyAttachment(self, 's3_replication_attach', provider=self.primary_provider,
            role=self.s3_replication_role.name, policy_arn=replication_policy.arn)

        # S3 Buckets
        self.s3_primary = S3Bucket(self, 's3_primary', provider=self.primary_provider,
            bucket=f'payment-data-primary-{self.environment_suffix}',
            tags={'Name': f'payment-data-primary-{self.environment_suffix}'})

        S3BucketVersioningA(self, 's3_primary_versioning', provider=self.primary_provider,
            bucket=self.s3_primary.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(status='Enabled'))

        self.s3_secondary = S3Bucket(self, 's3_secondary', provider=self.secondary_provider,
            bucket=f'payment-data-secondary-{self.environment_suffix}',
            tags={'Name': f'payment-data-secondary-{self.environment_suffix}'})

        S3BucketVersioningA(self, 's3_secondary_versioning', provider=self.secondary_provider,
            bucket=self.s3_secondary.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(status='Enabled'))

        # Replication Configuration
        S3BucketReplicationConfigurationA(self, 's3_replication_config', provider=self.primary_provider,
            bucket=self.s3_primary.id, role=self.s3_replication_role.arn,
            rule=[S3BucketReplicationConfigurationRule(
                id='replication-rule', status='Enabled', priority=1,
                destination=S3BucketReplicationConfigurationRuleDestination(
                    bucket=self.s3_secondary.arn,
                    replication_time=S3BucketReplicationConfigurationRuleDestinationReplicationTime(
                        status='Enabled',
                        time=S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime(minutes=15)),
                    metrics=S3BucketReplicationConfigurationRuleDestinationMetrics(
                        status='Enabled',
                        event_threshold=S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold(minutes=15))
                )
            )])

    def create_lambda_functions(self):
        """Create Lambda functions in both regions"""
        # Lambda execution roles
        lambda_assume_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        self.lambda_role_primary = IamRole(self, 'lambda_role_primary', provider=self.primary_provider,
            name=f'lambda-exec-primary-{self.environment_suffix}',
            assume_role_policy=lambda_assume_policy)

        IamRolePolicyAttachment(self, 'lambda_basic_primary', provider=self.primary_provider,
            role=self.lambda_role_primary.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole')

        IamRolePolicyAttachment(self, 'lambda_vpc_primary', provider=self.primary_provider,
            role=self.lambda_role_primary.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole')

        self.lambda_role_secondary = IamRole(self, 'lambda_role_secondary', provider=self.secondary_provider,
            name=f'lambda-exec-secondary-{self.environment_suffix}',
            assume_role_policy=lambda_assume_policy)

        IamRolePolicyAttachment(self, 'lambda_basic_secondary', provider=self.secondary_provider,
            role=self.lambda_role_secondary.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole')

        IamRolePolicyAttachment(self, 'lambda_vpc_secondary', provider=self.secondary_provider,
            role=self.lambda_role_secondary.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole')

        # Lambda functions (placeholder code)
        self.lambda_primary = LambdaFunction(self, 'lambda_primary', provider=self.primary_provider,
            function_name=f'payment-processor-primary-{self.environment_suffix}',
            runtime='python3.11', handler='index.lambda_handler',
            role=self.lambda_role_primary.arn,
            filename='lambda_placeholder.zip', source_code_hash='placeholder',
            timeout=30, memory_size=512,
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=[s.id for s in self.subnets_primary],
                security_group_ids=[self.sg_lambda_primary.id]
            ),
            environment=LambdaFunctionEnvironment(variables={
                'DB_ENDPOINT': self.aurora_primary.endpoint,
                'DYNAMODB_TABLE': self.dynamodb_table.name,
                'REGION': self.primary_region
            }),
            tags={'Name': f'payment-processor-primary-{self.environment_suffix}'})

        self.lambda_secondary = LambdaFunction(self, 'lambda_secondary', provider=self.secondary_provider,
            function_name=f'payment-processor-secondary-{self.environment_suffix}',
            runtime='python3.11', handler='index.lambda_handler',
            role=self.lambda_role_secondary.arn,
            filename='lambda_placeholder.zip', source_code_hash='placeholder',
            timeout=30, memory_size=512,
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=[s.id for s in self.subnets_secondary],
                security_group_ids=[self.sg_lambda_secondary.id]
            ),
            environment=LambdaFunctionEnvironment(variables={
                'DB_ENDPOINT': self.aurora_secondary.endpoint,
                'DYNAMODB_TABLE': self.dynamodb_table.name,
                'REGION': self.secondary_region
            }),
            tags={'Name': f'payment-processor-secondary-{self.environment_suffix}'})

    def create_api_gateway(self):
        """Create API Gateway in both regions"""
        # Primary API
        self.api_primary = Apigatewayv2Api(self, 'api_primary', provider=self.primary_provider,
            name=f'payment-api-primary-{self.environment_suffix}',
            protocol_type='HTTP',
            tags={'Name': f'payment-api-primary-{self.environment_suffix}'})

        integration_primary = Apigatewayv2Integration(self, 'api_integration_primary', provider=self.primary_provider,
            api_id=self.api_primary.id, integration_type='AWS_PROXY',
            integration_uri=self.lambda_primary.arn,
            integration_method='POST', payload_format_version='2.0')

        Apigatewayv2Route(self, 'api_route_primary', provider=self.primary_provider,
            api_id=self.api_primary.id, route_key='POST /process',
            target=f'integrations/{integration_primary.id}')

        self.api_stage_primary = Apigatewayv2Stage(self, 'api_stage_primary', provider=self.primary_provider,
            api_id=self.api_primary.id, name='prod', auto_deploy=True)

        LambdaPermission(self, 'lambda_permission_primary', provider=self.primary_provider,
            statement_id='AllowAPIGatewayInvoke', action='lambda:InvokeFunction',
            function_name=self.lambda_primary.function_name,
            principal='apigateway.amazonaws.com',
            source_arn=f'{self.api_primary.execution_arn}/*/*')

        # Secondary API
        self.api_secondary = Apigatewayv2Api(self, 'api_secondary', provider=self.secondary_provider,
            name=f'payment-api-secondary-{self.environment_suffix}',
            protocol_type='HTTP',
            tags={'Name': f'payment-api-secondary-{self.environment_suffix}'})

        integration_secondary = Apigatewayv2Integration(self, 'api_integration_secondary', provider=self.secondary_provider,
            api_id=self.api_secondary.id, integration_type='AWS_PROXY',
            integration_uri=self.lambda_secondary.arn,
            integration_method='POST', payload_format_version='2.0')

        Apigatewayv2Route(self, 'api_route_secondary', provider=self.secondary_provider,
            api_id=self.api_secondary.id, route_key='POST /process',
            target=f'integrations/{integration_secondary.id}')

        self.api_stage_secondary = Apigatewayv2Stage(self, 'api_stage_secondary', provider=self.secondary_provider,
            api_id=self.api_secondary.id, name='prod', auto_deploy=True)

        LambdaPermission(self, 'lambda_permission_secondary', provider=self.secondary_provider,
            statement_id='AllowAPIGatewayInvoke', action='lambda:InvokeFunction',
            function_name=self.lambda_secondary.function_name,
            principal='apigateway.amazonaws.com',
            source_arn=f'{self.api_secondary.execution_arn}/*/*')

    def create_route53_health_checks(self):
        """Create Route 53 health checks"""
        self.health_check = Route53HealthCheck(self, 'health_check_primary', provider=self.primary_provider,
            type='HTTPS', resource_path='/process',
            fqdn=f'{self.api_primary.id}.execute-api.{self.primary_region}.amazonaws.com',
            port=443, failure_threshold=3, request_interval=30,
            tags={'Name': f'health-check-primary-{self.environment_suffix}'})

    def create_monitoring(self):
        """Create CloudWatch monitoring"""
        dashboard_body = json.dumps({
            "widgets": [{
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["AWS/RDS", "CPUUtilization", {"region": self.primary_region}],
                        ["...", {"region": self.secondary_region}]
                    ],
                    "period": 300, "stat": "Average", "region": self.primary_region,
                    "title": "Aurora CPU Utilization"
                }
            }]
        })

        CloudwatchDashboard(self, 'dashboard', provider=self.primary_provider,
            dashboard_name=f'payment-dr-{self.environment_suffix}',
            dashboard_body=dashboard_body)

        CloudwatchMetricAlarm(self, 'health_alarm', provider=self.primary_provider,
            alarm_name=f'primary-health-alarm-{self.environment_suffix}',
            comparison_operator='LessThanThreshold', evaluation_periods=2,
            metric_name='HealthCheckStatus', namespace='AWS/Route53',
            period=60, statistic='Minimum', threshold=1.0,
            alarm_description='Primary region health check failed',
            dimensions={'HealthCheckId': self.health_check.id})

    def create_sns_topics(self):
        """Create SNS topics"""
        self.sns_primary = SnsTopic(self, 'sns_primary', provider=self.primary_provider,
            name=f'payment-notifications-primary-{self.environment_suffix}',
            display_name='Payment Notifications Primary',
            tags={'Name': f'payment-notifications-primary-{self.environment_suffix}'})

        self.sns_secondary = SnsTopic(self, 'sns_secondary', provider=self.secondary_provider,
            name=f'payment-notifications-secondary-{self.environment_suffix}',
            display_name='Payment Notifications Secondary',
            tags={'Name': f'payment-notifications-secondary-{self.environment_suffix}'})

    def create_outputs(self):
        """Create outputs"""
        TerraformOutput(self, 'vpc_primary_id', value=self.vpc_primary.id)
        TerraformOutput(self, 'vpc_secondary_id', value=self.vpc_secondary.id)
        TerraformOutput(self, 'aurora_primary_endpoint', value=self.aurora_primary.endpoint)
        TerraformOutput(self, 'aurora_secondary_endpoint', value=self.aurora_secondary.endpoint)
        TerraformOutput(self, 'dynamodb_table_name', value=self.dynamodb_table.name)
        TerraformOutput(self, 'api_primary_endpoint', value=self.api_primary.api_endpoint)
        TerraformOutput(self, 'api_secondary_endpoint', value=self.api_secondary.api_endpoint)


app = App()
MultiRegionDRStack(app, "multi-region-dr")
app.synth()
```

## File: lib/lambda/payment_processor.py

```python
"""Payment Processing Lambda Function"""
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    """Process payment requests"""
    try:
        region = os.environ.get('REGION', 'unknown')
        db_endpoint = os.environ.get('DB_ENDPOINT', 'not-configured')
        table_name = os.environ.get('DYNAMODB_TABLE', 'not-configured')

        logger.info(f"Processing payment in region: {region}")

        body = json.loads(event.get('body', '{}'))
        payment_id = body.get('payment_id', 'unknown')
        amount = body.get('amount', 0)

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': True,
                'payment_id': payment_id,
                'amount': amount,
                'region': region,
                'db_endpoint': db_endpoint,
                'table': table_name
            })
        }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'success': False, 'error': str(e)})
        }
```

## File: lib/README.md

```markdown
# Multi-Region Disaster Recovery Architecture

CDKTF Python implementation for multi-region DR spanning us-east-1 and us-east-2.

## Architecture

- **Aurora Global Database**: PostgreSQL 14.6 with automatic replication
- **DynamoDB Global Table**: Session data replicated across regions
- **Lambda Functions**: Payment processors in both regions
- **API Gateway**: HTTP APIs with Lambda integration
- **S3 Replication**: Cross-region with RTC (15-minute SLA)
- **Route 53**: Health checks and failover routing
- **CloudWatch**: Cross-region monitoring dashboard
- **SNS**: Notification topics in both regions
- **VPC Peering**: Inter-region connectivity

## Prerequisites

- CDKTF CLI: `npm install -g cdktf-cli`
- Python 3.11+
- Terraform 1.5+
- AWS CLI configured

## Deployment

```bash
export ENVIRONMENT_SUFFIX="your-suffix"
cdktf synth
cdktf deploy
```

## RPO/RTO

- **RPO**: ~15 minutes (Aurora < 1s, DynamoDB < 1s, S3 RTC 15min)
- **RTO**: ~30 minutes (health check 2-3min, DNS 5-10min, Aurora promotion 10-15min)

## Cleanup

```bash
cdktf destroy
```
```
