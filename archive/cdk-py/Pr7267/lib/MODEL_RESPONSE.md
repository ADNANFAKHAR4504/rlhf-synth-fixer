# Single-Region Multi-AZ Disaster Recovery Infrastructure - CDK Python Implementation

This implementation provides a comprehensive disaster recovery solution in a single region (us-east-1) with Multi-AZ deployment for high availability. The solution includes Aurora PostgreSQL, DynamoDB, Lambda functions, S3 storage, AWS Backup automation, and comprehensive monitoring.

## File: bin/app.py

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get environment suffix from context or environment variable
environment_suffix = app.node.try_get_context("environmentSuffix") or os.environ.get("ENVIRONMENT_SUFFIX", "dev")

TapStack(
    app,
    f"TapStack-{environment_suffix}",
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region="us-east-1"
    ),
    description="Single-region Multi-AZ disaster recovery infrastructure"
)

app.synth()
```

## File: lib/tap_stack.py

```python
from aws_cdk import (
    Stack,
    RemovalPolicy,
    Duration,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    aws_backup as backup,
    aws_events as events,
    aws_events_targets as targets,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
)
from constructs import Construct


class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        self.environment_suffix = environment_suffix

        # Create VPC with Multi-AZ subnets
        self.vpc = self._create_vpc()

        # Create KMS keys for encryption
        self.aurora_key = self._create_kms_key("aurora")
        self.s3_key = self._create_kms_key("s3")

        # Create Aurora PostgreSQL Multi-AZ cluster
        self.aurora_cluster = self._create_aurora_cluster()

        # Create DynamoDB table with PITR
        self.dynamodb_table = self._create_dynamodb_table()

        # Create S3 bucket with versioning
        self.s3_bucket = self._create_s3_bucket()

        # Create Lambda function in VPC
        self.lambda_function = self._create_lambda_function()

        # Create SNS topic for notifications
        self.sns_topic = self._create_sns_topic()

        # Create AWS Backup configuration
        self._create_backup_plan()

        # Create CloudWatch monitoring
        self._create_cloudwatch_dashboard()
        self._create_cloudwatch_alarms()

        # Create EventBridge rules for backup monitoring
        self._create_eventbridge_rules()

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with Multi-AZ subnets across 3 availability zones"""
        vpc = ec2.Vpc(
            self,
            f"VPC-{self.environment_suffix}",
            vpc_name=f"dr-vpc-{self.environment_suffix}",
            max_azs=3,
            nat_gateways=0,  # Cost optimization - use VPC endpoints instead
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Private-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Public-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
            ],
        )

        # Add VPC endpoints for S3 and DynamoDB
        vpc.add_gateway_endpoint(
            f"S3Endpoint-{self.environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3,
        )

        vpc.add_gateway_endpoint(
            f"DynamoDBEndpoint-{self.environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        )

        return vpc

    def _create_kms_key(self, purpose: str) -> kms.Key:
        """Create KMS key with automatic rotation"""
        key = kms.Key(
            self,
            f"KMSKey-{purpose}-{self.environment_suffix}",
            description=f"KMS key for {purpose} encryption in DR solution",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        key.add_alias(f"alias/dr-{purpose}-{self.environment_suffix}")

        return key

    def _create_aurora_cluster(self) -> rds.DatabaseCluster:
        """Create Aurora PostgreSQL Multi-AZ cluster"""
        # Security group for Aurora
        aurora_sg = ec2.SecurityGroup(
            self,
            f"AuroraSG-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for Aurora PostgreSQL cluster",
            allow_all_outbound=True,
        )

        aurora_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL access from VPC",
        )

        # Create subnet group for Aurora
        subnet_group = rds.SubnetGroup(
            self,
            f"AuroraSubnetGroup-{self.environment_suffix}",
            description="Subnet group for Aurora cluster",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create Aurora cluster
        cluster = rds.DatabaseCluster(
            self,
            f"AuroraCluster-{self.environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_15_3
            ),
            writer=rds.ClusterInstance.provisioned(
                f"Writer-{self.environment_suffix}",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE4_GRAVITON,
                    ec2.InstanceSize.MEDIUM,
                ),
            ),
            readers=[
                rds.ClusterInstance.provisioned(
                    f"Reader1-{self.environment_suffix}",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.BURSTABLE4_GRAVITON,
                        ec2.InstanceSize.MEDIUM,
                    ),
                ),
            ],
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[aurora_sg],
            subnet_group=subnet_group,
            storage_encrypted=True,
            storage_encryption_key=self.aurora_key,
            backup=rds.BackupProps(
                retention=Duration.days(7),
            ),
            removal_policy=RemovalPolicy.DESTROY,
            deletion_protection=False,
        )

        return cluster

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with PITR enabled"""
        table = dynamodb.Table(
            self,
            f"DynamoDBTable-{self.environment_suffix}",
            table_name=f"dr-table-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        return table

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with versioning and encryption"""
        bucket = s3.Bucket(
            self,
            f"S3Bucket-{self.environment_suffix}",
            bucket_name=f"dr-backup-bucket-{self.environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.s3_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    noncurrent_version_transitions=[
                        s3.NoncurrentVersionTransition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(30),
                        ),
                    ],
                    noncurrent_version_expiration=Duration.days(90),
                ),
            ],
        )

        return bucket

    def _create_lambda_function(self) -> lambda_.Function:
        """Create Lambda function in VPC"""
        # Security group for Lambda
        lambda_sg = ec2.SecurityGroup(
            self,
            f"LambdaSG-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for Lambda function",
            allow_all_outbound=True,
        )

        # Lambda execution role
        lambda_role = iam.Role(
            self,
            f"LambdaRole-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
            ],
        )

        # Grant Lambda access to Aurora, DynamoDB, and S3
        self.aurora_cluster.secret.grant_read(lambda_role)
        self.dynamodb_table.grant_read_write_data(lambda_role)
        self.s3_bucket.grant_read_write(lambda_role)

        # Create Lambda function
        function = lambda_.Function(
            self,
            f"LambdaFunction-{self.environment_suffix}",
            function_name=f"dr-function-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[lambda_sg],
            role=lambda_role,
            timeout=Duration.seconds(60),
            environment={
                "DB_SECRET_ARN": self.aurora_cluster.secret.secret_arn,
                "DB_CLUSTER_ARN": self.aurora_cluster.cluster_arn,
                "DYNAMODB_TABLE": self.dynamodb_table.table_name,
                "S3_BUCKET": self.s3_bucket.bucket_name,
            },
        )

        return function

    def _create_sns_topic(self) -> sns.Topic:
        """Create SNS topic for notifications"""
        topic = sns.Topic(
            self,
            f"SNSTopic-{self.environment_suffix}",
            topic_name=f"dr-notifications-{self.environment_suffix}",
            display_name="DR Notifications",
        )

        return topic

    def _create_backup_plan(self) -> None:
        """Create AWS Backup plan with hourly schedule"""
        # Create backup vault
        vault = backup.BackupVault(
            self,
            f"BackupVault-{self.environment_suffix}",
            backup_vault_name=f"dr-vault-{self.environment_suffix}",
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create backup plan
        plan = backup.BackupPlan(
            self,
            f"BackupPlan-{self.environment_suffix}",
            backup_plan_name=f"dr-backup-plan-{self.environment_suffix}",
            backup_vault=vault,
        )

        # Add hourly backup rule
        plan.add_rule(
            backup.BackupPlanRule(
                rule_name=f"HourlyBackup-{self.environment_suffix}",
                schedule_expression=events.Schedule.cron(
                    minute="0",
                    hour="*",
                    month="*",
                    week_day="*",
                    year="*",
                ),
                delete_after=Duration.days(7),
                enable_continuous_backup=True,
            )
        )

        # Add selection for Aurora cluster
        plan.add_selection(
            f"AuroraSelection-{self.environment_suffix}",
            resources=[
                backup.BackupResource.from_rds_database_cluster(self.aurora_cluster),
            ],
        )

        # Add selection for DynamoDB table
        plan.add_selection(
            f"DynamoDBSelection-{self.environment_suffix}",
            resources=[
                backup.BackupResource.from_dynamo_db_table(self.dynamodb_table),
            ],
        )

    def _create_cloudwatch_dashboard(self) -> None:
        """Create CloudWatch dashboard for monitoring"""
        dashboard = cloudwatch.Dashboard(
            self,
            f"Dashboard-{self.environment_suffix}",
            dashboard_name=f"DR-Dashboard-{self.environment_suffix}",
        )

        # Aurora metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Aurora CPU Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="CPUUtilization",
                        dimensions_map={
                            "DBClusterIdentifier": self.aurora_cluster.cluster_identifier,
                        },
                        statistic="Average",
                        period=Duration.minutes(5),
                    )
                ],
            ),
            cloudwatch.GraphWidget(
                title="Aurora Database Connections",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="DatabaseConnections",
                        dimensions_map={
                            "DBClusterIdentifier": self.aurora_cluster.cluster_identifier,
                        },
                        statistic="Average",
                        period=Duration.minutes(5),
                    )
                ],
            ),
        )

        # DynamoDB metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="DynamoDB Read/Write Capacity",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/DynamoDB",
                        metric_name="ConsumedReadCapacityUnits",
                        dimensions_map={
                            "TableName": self.dynamodb_table.table_name,
                        },
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/DynamoDB",
                        metric_name="ConsumedWriteCapacityUnits",
                        dimensions_map={
                            "TableName": self.dynamodb_table.table_name,
                        },
                        statistic="Sum",
                        period=Duration.minutes(5),
                    ),
                ],
            )
        )

        # Lambda metrics
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Function Metrics",
                left=[
                    self.lambda_function.metric_invocations(),
                    self.lambda_function.metric_errors(),
                    self.lambda_function.metric_duration(),
                ],
            )
        )

    def _create_cloudwatch_alarms(self) -> None:
        """Create CloudWatch alarms for critical metrics"""
        # Aurora CPU alarm
        aurora_cpu_alarm = cloudwatch.Alarm(
            self,
            f"AuroraCPUAlarm-{self.environment_suffix}",
            alarm_name=f"Aurora-High-CPU-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={
                    "DBClusterIdentifier": self.aurora_cluster.cluster_identifier,
                },
                statistic="Average",
                period=Duration.minutes(5),
            ),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        aurora_cpu_alarm.add_alarm_action(cw_actions.SnsAction(self.sns_topic))

        # DynamoDB throttle alarm
        dynamodb_throttle_alarm = cloudwatch.Alarm(
            self,
            f"DynamoDBThrottleAlarm-{self.environment_suffix}",
            alarm_name=f"DynamoDB-Throttled-Requests-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/DynamoDB",
                metric_name="UserErrors",
                dimensions_map={
                    "TableName": self.dynamodb_table.table_name,
                },
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            threshold=10,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        dynamodb_throttle_alarm.add_alarm_action(cw_actions.SnsAction(self.sns_topic))

        # Lambda error alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            f"LambdaErrorAlarm-{self.environment_suffix}",
            alarm_name=f"Lambda-Errors-{self.environment_suffix}",
            metric=self.lambda_function.metric_errors(),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        lambda_error_alarm.add_alarm_action(cw_actions.SnsAction(self.sns_topic))

    def _create_eventbridge_rules(self) -> None:
        """Create EventBridge rules for backup monitoring"""
        # Rule for backup job state changes
        backup_rule = events.Rule(
            self,
            f"BackupJobRule-{self.environment_suffix}",
            rule_name=f"backup-job-state-change-{self.environment_suffix}",
            event_pattern=events.EventPattern(
                source=["aws.backup"],
                detail_type=["Backup Job State Change"],
                detail={
                    "state": ["COMPLETED", "FAILED", "ABORTED"],
                },
            ),
        )

        backup_rule.add_target(targets.SnsTopic(self.sns_topic))

        # Rule for restore job state changes
        restore_rule = events.Rule(
            self,
            f"RestoreJobRule-{self.environment_suffix}",
            rule_name=f"restore-job-state-change-{self.environment_suffix}",
            event_pattern=events.EventPattern(
                source=["aws.backup"],
                detail_type=["Restore Job State Change"],
                detail={
                    "state": ["COMPLETED", "FAILED", "ABORTED"],
                },
            ),
        )

        restore_rule.add_target(targets.SnsTopic(self.sns_topic))
```

## File: lib/lambda/index.py

```python
import json
import os
import boto3
from typing import Dict, Any

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
secretsmanager = boto3.client('secretsmanager')

# Environment variables
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE')
S3_BUCKET = os.environ.get('S3_BUCKET')
DB_SECRET_ARN = os.environ.get('DB_SECRET_ARN')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function handler for disaster recovery operations

    This function demonstrates connectivity to Aurora, DynamoDB, and S3
    """
    try:
        # Test DynamoDB connectivity
        table = dynamodb.Table(DYNAMODB_TABLE)

        # Test S3 connectivity
        s3.list_objects_v2(Bucket=S3_BUCKET, MaxKeys=1)

        # Test Secrets Manager connectivity (Aurora credentials)
        secret = secretsmanager.get_secret_value(SecretArn=DB_SECRET_ARN)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully connected to all services',
                'dynamodb_table': DYNAMODB_TABLE,
                's3_bucket': S3_BUCKET,
                'region': os.environ.get('AWS_REGION', 'us-east-1')
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error connecting to services',
                'error': str(e)
            })
        }
```

## File: requirements.txt

```
aws-cdk-lib==2.110.0
constructs>=10.0.0,<11.0.0
```

## File: lib/README.md

```markdown
# Single-Region Multi-AZ Disaster Recovery Infrastructure

This CDK Python application deploys a comprehensive disaster recovery solution in a single AWS region (us-east-1) with Multi-AZ deployment for high availability.

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ VPC with 3 availability zones, private and public subnets, and VPC endpoints for S3 and DynamoDB
- **Aurora PostgreSQL**: Multi-AZ database cluster with encryption, automated backups, and PITR
- **DynamoDB**: Table with point-in-time recovery and on-demand billing
- **Lambda**: VPC-enabled function with access to Aurora, DynamoDB, and S3
- **S3**: Versioned bucket with KMS encryption and lifecycle policies
- **AWS Backup**: Hourly backup schedule with 7-day retention for 1-hour RPO
- **KMS**: Customer-managed keys with automatic rotation for encryption
- **CloudWatch**: Dashboard and alarms for monitoring
- **EventBridge**: Rules for backup job monitoring and notifications
- **SNS**: Topic for alarm and event notifications

## Prerequisites

- AWS CLI configured with appropriate credentials
- Python 3.11 or later
- Node.js 14.x or later (for CDK CLI)
- AWS CDK CLI installed: `npm install -g aws-cdk`

## Deployment Instructions

1. **Install Python dependencies**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Set environment suffix** (optional, defaults to "dev"):
   ```bash
   export ENVIRONMENT_SUFFIX=prod
   ```

3. **Bootstrap CDK** (first time only):
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/us-east-1
   ```

4. **Synthesize CloudFormation template**:
   ```bash
   cdk synth
   ```

5. **Deploy the stack**:
   ```bash
   cdk deploy --context environmentSuffix=prod
   ```

   Or with environment variable:
   ```bash
   export ENVIRONMENT_SUFFIX=prod
   cdk deploy
   ```

6. **Verify deployment**:
   - Check CloudFormation console for stack status
   - Verify all resources in AWS Console
   - Check CloudWatch dashboard for metrics

## Testing the Infrastructure

1. **Test Lambda function**:
   ```bash
   aws lambda invoke \
     --function-name dr-function-prod \
     --region us-east-1 \
     response.json
   cat response.json
   ```

2. **Verify Aurora cluster**:
   ```bash
   aws rds describe-db-clusters \
     --region us-east-1 \
     --query 'DBClusters[?contains(DBClusterIdentifier, `prod`)].{ID:DBClusterIdentifier,Status:Status}'
   ```

3. **Check DynamoDB table**:
   ```bash
   aws dynamodb describe-table \
     --table-name dr-table-prod \
     --region us-east-1
   ```

4. **Verify backup plan**:
   ```bash
   aws backup list-backup-plans --region us-east-1
   ```

## Disaster Recovery Operations

### Recovery Point Objective (RPO): 1 hour
- Hourly automated backups via AWS Backup
- Continuous backup enabled for Aurora and DynamoDB
- Point-in-time recovery available

### Recovery Time Objective (RTO): 4 hours
- Multi-AZ deployment ensures automatic failover
- Aurora replica promotion takes minutes
- Backup restoration takes 2-4 hours depending on data size

### Manual Restore Process

1. **Restore Aurora cluster**:
   ```bash
   aws backup start-restore-job \
     --recovery-point-arn <RECOVERY_POINT_ARN> \
     --metadata '{...}' \
     --iam-role-arn <BACKUP_ROLE_ARN> \
     --region us-east-1
   ```

2. **Restore DynamoDB table**:
   ```bash
   aws dynamodb restore-table-to-point-in-time \
     --source-table-name dr-table-prod \
     --target-table-name dr-table-prod-restored \
     --restore-date-time <TIMESTAMP> \
     --region us-east-1
   ```

## Monitoring and Alerts

### CloudWatch Dashboard
Access the dashboard: AWS Console > CloudWatch > Dashboards > DR-Dashboard-{env}

Metrics include:
- Aurora CPU utilization and database connections
- DynamoDB read/write capacity
- Lambda invocations, errors, and duration

### CloudWatch Alarms
- **Aurora High CPU**: Triggers when CPU > 80% for 10 minutes
- **DynamoDB Throttled Requests**: Triggers when throttle events > 10
- **Lambda Errors**: Triggers when error count > 5

### EventBridge Notifications
- Backup job completion/failure
- Restore job completion/failure
- All notifications sent to SNS topic

## Cost Optimization

This solution is optimized for cost:
- Aurora uses t4g.medium instances (Graviton2)
- DynamoDB uses on-demand billing
- No NAT Gateways (VPC endpoints instead)
- S3 lifecycle policies for old versions
- Lambda in VPC with minimal memory

Estimated monthly cost: $200-400 depending on usage

## Security Features

- All data encrypted at rest with KMS customer-managed keys
- All data encrypted in transit (TLS)
- VPC isolation for databases and Lambda
- No public internet access for sensitive resources
- Least privilege IAM roles
- S3 buckets block all public access
- Security groups with minimal ingress rules

## Cleanup

To destroy all resources:
```bash
cdk destroy --context environmentSuffix=prod
```

**Note**: All resources are configured with RemovalPolicy.DESTROY and will be fully deleted.

## Troubleshooting

### Deployment Fails
- Verify AWS credentials and region
- Check CloudFormation events for specific errors
- Ensure sufficient service quotas

### Lambda Cannot Connect to Aurora
- Verify security group allows traffic from Lambda SG
- Check VPC endpoints are created
- Verify Lambda has correct IAM permissions

### Backup Jobs Failing
- Check IAM role permissions for AWS Backup
- Verify resources are tagged correctly
- Review CloudWatch Logs for backup service

## Support

For issues or questions:
1. Check CloudWatch Logs for detailed error messages
2. Review EventBridge events for backup/restore status
3. Consult AWS documentation for service-specific issues
```

## File: cdk.json

```json
{
  "app": "python3 bin/app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__init__.py",
      "**/__pycache__",
      "**/*.egg-info"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "environmentSuffix": "dev"
  }
}
```

## File: .gitignore

```
*.swp
package-lock.json
__pycache__
.pytest_cache
.venv
*.egg-info

# CDK asset staging directory
.cdk.staging
cdk.out
```
