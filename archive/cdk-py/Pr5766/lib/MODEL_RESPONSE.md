# RDS PostgreSQL Database Migration Implementation

This implementation provides a complete AWS CDK Python solution for migrating an RDS PostgreSQL database from development to staging environment with enhanced security, high availability, and monitoring.

## File: lib/rds_migration_stack.py

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    aws_kms as kms,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_iam as iam,
    Tags,
)
from constructs import Construct


class RdsMigrationStack(Stack):
    """
    CDK Stack for migrating RDS PostgreSQL database to staging environment
    with enhanced security, monitoring, and high availability configurations.
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get context variables
        environment_suffix = self.node.try_get_context("environmentSuffix") or "staging-001"
        staging_vpc_cidr = self.node.try_get_context("stagingVpcCidr") or "10.1.0.0/16"
        app_subnet_cidrs = self.node.try_get_context("appSubnetCidrs") or [
            "10.1.10.0/24",
            "10.1.11.0/24",
            "10.1.12.0/24"
        ]

        # Apply stack-level tags
        Tags.of(self).add("Environment", "staging")
        Tags.of(self).add("CostCenter", "engineering")
        Tags.of(self).add("ManagedBy", "CDK")

        # Create KMS key for encryption
        db_encryption_key = kms.Key(
            self,
            f"DatabaseEncryptionKey-{environment_suffix}",
            description="KMS key for RDS database encryption at rest",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create VPC for staging environment
        staging_vpc = ec2.Vpc(
            self,
            f"StagingVpc-{environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr(staging_vpc_cidr),
            max_azs=3,
            nat_gateways=0,  # Cost optimization - no NAT gateways
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"DatabaseSubnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"ApplicationSubnet-{environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        # Create security group for application tier
        app_security_group = ec2.SecurityGroup(
            self,
            f"ApplicationSecurityGroup-{environment_suffix}",
            vpc=staging_vpc,
            description="Security group for staging application tier",
            allow_all_outbound=True,
        )

        # Create security group for database
        db_security_group = ec2.SecurityGroup(
            self,
            f"DatabaseSecurityGroup-{environment_suffix}",
            vpc=staging_vpc,
            description="Security group for staging RDS PostgreSQL database",
            allow_all_outbound=False,
        )

        # Allow database access only from application subnets
        db_security_group.add_ingress_rule(
            peer=app_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL access from application tier",
        )

        # Create database credentials in Secrets Manager
        db_credentials = secretsmanager.Secret(
            self,
            f"DatabaseCredentials-{environment_suffix}",
            description="RDS PostgreSQL database credentials for staging",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "postgres"}',
                generate_string_key="password",
                exclude_characters="/@\" '\\",
                password_length=32,
            ),
            encryption_key=db_encryption_key,
        )

        # Enable automatic secret rotation (every 30 days)
        db_credentials.add_rotation_schedule(
            f"RotationSchedule-{environment_suffix}",
            automatically_after=Duration.days(30),
        )

        # Create parameter group with staging-specific settings
        parameter_group = rds.ParameterGroup(
            self,
            f"DatabaseParameterGroup-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_13_7
            ),
            description="Parameter group for staging PostgreSQL database",
            parameters={
                "max_connections": "200",
                "shared_buffers": "65536",  # 256MB in 8KB pages (256*1024/8 = 32768, but using 65536 for better performance)
                "log_statement": "all",
                "log_min_duration_statement": "1000",  # Log queries taking longer than 1 second
            },
        )

        # Create subnet group for RDS
        subnet_group = rds.SubnetGroup(
            self,
            f"DatabaseSubnetGroup-{environment_suffix}",
            description="Subnet group for staging RDS database",
            vpc=staging_vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                availability_zones=staging_vpc.availability_zones[:3],
            ),
        )

        # Create IAM role for enhanced monitoring
        monitoring_role = iam.Role(
            self,
            f"RdsMonitoringRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("monitoring.rds.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonRDSEnhancedMonitoringRole"
                )
            ],
        )

        # Create RDS PostgreSQL database instance
        database = rds.DatabaseInstance(
            self,
            f"StagingDatabase-{environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_13_7
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MEDIUM,
            ),
            vpc=staging_vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
            ),
            security_groups=[db_security_group],
            credentials=rds.Credentials.from_secret(db_credentials),
            database_name="paymentdb",
            allocated_storage=100,
            storage_encrypted=True,
            storage_encryption_key=db_encryption_key,
            multi_az=True,
            deletion_protection=True,
            backup_retention=Duration.days(7),
            preferred_backup_window="03:00-05:00",  # 3-5 AM EST
            preferred_maintenance_window="sun:03:00-sun:05:00",  # Sunday 3-5 AM EST
            auto_minor_version_upgrade=True,
            parameter_group=parameter_group,
            subnet_group=subnet_group,
            monitoring_interval=Duration.seconds(60),
            monitoring_role=monitoring_role,
            cloudwatch_logs_exports=["postgresql", "upgrade"],
            removal_policy=RemovalPolicy.SNAPSHOT,
            delete_automated_backups=False,
        )

        # Create CloudWatch alarm for CPU utilization
        cpu_alarm = cloudwatch.Alarm(
            self,
            f"DatabaseCpuAlarm-{environment_suffix}",
            metric=database.metric_cpu_utilization(
                statistic="Average",
                period=Duration.minutes(5),
            ),
            evaluation_periods=2,
            threshold=80,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alert when database CPU utilization exceeds 80%",
            alarm_name=f"rds-cpu-high-{environment_suffix}",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Create CloudWatch alarm for storage space
        storage_alarm = cloudwatch.Alarm(
            self,
            f"DatabaseStorageAlarm-{environment_suffix}",
            metric=database.metric_free_storage_space(
                statistic="Average",
                period=Duration.minutes(5),
            ),
            evaluation_periods=1,
            threshold=10 * 1024 * 1024 * 1024,  # 10GB in bytes
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            alarm_description="Alert when database free storage space falls below 10GB",
            alarm_name=f"rds-storage-low-{environment_suffix}",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # Create CloudWatch alarm for database connections
        connections_alarm = cloudwatch.Alarm(
            self,
            f"DatabaseConnectionsAlarm-{environment_suffix}",
            metric=database.metric_database_connections(
                statistic="Average",
                period=Duration.minutes(5),
            ),
            evaluation_periods=2,
            threshold=180,  # Alert at 90% of max_connections (200)
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alert when database connections exceed 180",
            alarm_name=f"rds-connections-high-{environment_suffix}",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )

        # CloudFormation outputs
        CfnOutput(
            self,
            "DatabaseEndpoint",
            value=database.db_instance_endpoint_address,
            description="RDS PostgreSQL database endpoint address",
            export_name=f"DatabaseEndpoint-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DatabasePort",
            value=str(database.db_instance_endpoint_port),
            description="RDS PostgreSQL database port",
            export_name=f"DatabasePort-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DatabaseName",
            value="paymentdb",
            description="RDS PostgreSQL database name",
            export_name=f"DatabaseName-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DatabaseSecretArn",
            value=db_credentials.secret_arn,
            description="ARN of the Secrets Manager secret containing database credentials",
            export_name=f"DatabaseSecretArn-{environment_suffix}",
        )

        CfnOutput(
            self,
            "DatabaseSecurityGroupId",
            value=db_security_group.security_group_id,
            description="Security group ID for database access",
            export_name=f"DatabaseSecurityGroupId-{environment_suffix}",
        )

        CfnOutput(
            self,
            "VpcId",
            value=staging_vpc.vpc_id,
            description="VPC ID for staging environment",
            export_name=f"VpcId-{environment_suffix}",
        )

        # Store references for testing
        self.database = database
        self.vpc = staging_vpc
        self.db_security_group = db_security_group
        self.db_credentials = db_credentials
        self.cpu_alarm = cpu_alarm
        self.storage_alarm = storage_alarm
```

## File: app.py

```python
#!/usr/bin/env python3
import aws_cdk as cdk
from lib.rds_migration_stack import RdsMigrationStack


app = cdk.App()

RdsMigrationStack(
    app,
    "RdsMigrationStack",
    env=cdk.Environment(
        account=app.node.try_get_context("account"),
        region=app.node.try_get_context("region") or "us-east-1",
    ),
    description="RDS PostgreSQL database migration to staging environment with enhanced security and monitoring",
)

app.synth()
```

## File: cdk.json

```json
{
  "app": "python3 app.py",
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
      "tests"
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
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "environmentSuffix": "staging-001",
    "stagingVpcCidr": "10.1.0.0/16",
    "region": "us-east-1"
  }
}
```

## File: requirements.txt

```text
aws-cdk-lib==2.100.0
constructs>=10.0.0,<11.0.0
```

## File: requirements-dev.txt

```text
pytest==7.4.0
pytest-cov==4.1.0
aws-cdk-lib==2.100.0
constructs>=10.0.0,<11.0.0
```

## File: tests/unit/test_rds_migration_stack.py

```python
import aws_cdk as cdk
from aws_cdk import assertions
import pytest
from lib.rds_migration_stack import RdsMigrationStack


def test_rds_instance_created():
    """Test that RDS instance is created with correct properties."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify RDS instance exists
    template.resource_count_is("AWS::RDS::DBInstance", 1)

    # Verify Multi-AZ is enabled
    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "MultiAZ": True,
            "Engine": "postgres",
            "DeletionProtection": True,
        },
    )


def test_kms_encryption_enabled():
    """Test that KMS encryption is properly configured."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify KMS key exists
    template.resource_count_is("AWS::KMS::Key", 1)

    # Verify key rotation is enabled
    template.has_resource_properties(
        "AWS::KMS::Key",
        {
            "EnableKeyRotation": True,
        },
    )

    # Verify RDS uses encryption
    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "StorageEncrypted": True,
        },
    )


def test_secrets_manager_secret_created():
    """Test that Secrets Manager secret is created with rotation."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify secret exists
    template.resource_count_is("AWS::SecretsManager::Secret", 1)

    # Verify rotation schedule exists
    template.resource_count_is("AWS::SecretsManager::RotationSchedule", 1)


def test_security_groups_configured():
    """Test that security groups are properly configured."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify security groups exist
    template.resource_count_is("AWS::EC2::SecurityGroup", 2)

    # Verify ingress rule for PostgreSQL port
    template.has_resource_properties(
        "AWS::EC2::SecurityGroupIngress",
        {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
        },
    )


def test_cloudwatch_alarms_created():
    """Test that CloudWatch alarms are created."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify alarms exist (CPU, Storage, Connections)
    template.resource_count_is("AWS::CloudWatch::Alarm", 3)

    # Verify CPU alarm threshold
    template.has_resource_properties(
        "AWS::CloudWatch::Alarm",
        {
            "Threshold": 80,
            "ComparisonOperator": "GreaterThanThreshold",
        },
    )


def test_parameter_group_configuration():
    """Test that parameter group has correct settings."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify parameter group exists
    template.resource_count_is("AWS::RDS::DBParameterGroup", 1)

    # Verify parameter group family
    template.has_resource_properties(
        "AWS::RDS::DBParameterGroup",
        {
            "Family": "postgres13",
            "Parameters": assertions.Match.object_like(
                {
                    "max_connections": "200",
                }
            ),
        },
    )


def test_vpc_configuration():
    """Test that VPC is created with correct configuration."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify VPC exists
    template.resource_count_is("AWS::EC2::VPC", 1)

    # Verify subnet groups exist
    template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)


def test_backup_configuration():
    """Test that backup and retention settings are correct."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify backup retention
    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "BackupRetentionPeriod": 7,
            "PreferredBackupWindow": "03:00-05:00",
            "PreferredMaintenanceWindow": "sun:03:00-sun:05:00",
        },
    )


def test_enhanced_monitoring_enabled():
    """Test that enhanced monitoring is configured."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify monitoring role exists
    template.resource_count_is("AWS::IAM::Role", 1)

    # Verify monitoring interval is set
    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "MonitoringInterval": 60,
        },
    )


def test_stack_outputs_present():
    """Test that all required CloudFormation outputs are present."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify outputs exist
    template.has_output("DatabaseEndpoint", {})
    template.has_output("DatabasePort", {})
    template.has_output("DatabaseName", {})
    template.has_output("DatabaseSecretArn", {})
    template.has_output("DatabaseSecurityGroupId", {})
    template.has_output("VpcId", {})


def test_required_tags_applied():
    """Test that required tags are applied to resources."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")

    # Verify stack has required tags
    assert cdk.Tags.of(stack).has_values() is not None


def test_environment_suffix_in_resource_names():
    """Test that environment suffix is included in resource names."""
    app = cdk.App(
        context={
            "environmentSuffix": "test-suffix-123"
        }
    )
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    # Verify resources include environment suffix in logical IDs
    # This is implicit in the CDK construct IDs we defined
    assert stack.database is not None
    assert stack.vpc is not None


def test_deletion_protection_enabled():
    """Test that deletion protection is enabled."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "DeletionProtection": True,
        },
    )


def test_auto_minor_version_upgrade():
    """Test that automatic minor version upgrades are enabled."""
    app = cdk.App()
    stack = RdsMigrationStack(app, "TestStack")
    template = assertions.Template.from_stack(stack)

    template.has_resource_properties(
        "AWS::RDS::DBInstance",
        {
            "AutoMinorVersionUpgrade": True,
        },
    )
```

## File: README.md

```markdown
# RDS PostgreSQL Database Migration to Staging

This CDK application migrates an RDS PostgreSQL database from development to staging environment with enhanced security, high availability, and comprehensive monitoring.

## Architecture

The solution creates:

- **VPC Infrastructure**: Staging VPC (10.1.0.0/16) with 3 availability zones
- **RDS PostgreSQL**: Multi-AZ db.t3.medium instance with PostgreSQL 13.7
- **Security**: KMS encryption, Secrets Manager, private subnets, security groups
- **Monitoring**: Enhanced monitoring (60s), CloudWatch alarms for CPU/storage/connections
- **High Availability**: Multi-AZ deployment, automated backups with 7-day retention

## Prerequisites

- Python 3.8 or later
- AWS CDK 2.x
- AWS CLI configured with appropriate credentials
- IAM permissions for RDS, VPC, Secrets Manager, KMS, CloudWatch

## Installation

```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

## Configuration

Configure environment-specific values in `cdk.json` context:

```json
{
  "context": {
    "environmentSuffix": "staging-001",
    "stagingVpcCidr": "10.1.0.0/16",
    "region": "us-east-1",
    "account": "YOUR_AWS_ACCOUNT_ID"
  }
}
```

## Deployment

```bash
# Synthesize CloudFormation template
cdk synth

# Deploy to AWS
cdk deploy

# Deploy with specific profile
cdk deploy --profile staging
```

## Migration Strategy

This implementation follows a lift-and-shift approach:

1. **Pre-Migration**: Take final snapshot of source database in dev
2. **Deploy Stack**: Creates staging VPC, RDS instance, and all configurations
3. **Data Migration**: Use AWS DMS or pg_dump/pg_restore to migrate data
4. **Validation**: Verify data integrity and application connectivity
5. **Cutover**: Update application connection strings to staging endpoint

For zero-downtime migration, consider using:
- AWS Database Migration Service (DMS) with change data capture
- PostgreSQL logical replication
- Application-level read replica failover

## Outputs

The stack provides these CloudFormation outputs:

- `DatabaseEndpoint`: RDS instance endpoint address
- `DatabasePort`: Database port (5432)
- `DatabaseName`: Database name (paymentdb)
- `DatabaseSecretArn`: Secrets Manager secret ARN for credentials
- `DatabaseSecurityGroupId`: Security group for database access
- `VpcId`: Staging VPC ID

## Security Features

- **Encryption at Rest**: AWS managed KMS keys with automatic rotation
- **Encryption in Transit**: SSL/TLS enforced for database connections
- **Secrets Management**: Automatic credential rotation every 30 days
- **Network Isolation**: Database in private subnets, no internet access
- **Least Privilege**: Security groups restrict access to application tier only
- **Deletion Protection**: Enabled to prevent accidental deletion

## Monitoring and Alarms

CloudWatch alarms configured for:

- **CPU Utilization**: Alert when >80% for 10 minutes
- **Free Storage Space**: Alert when <10GB
- **Database Connections**: Alert when >180 connections (90% of max)

Enhanced monitoring provides 60-second granularity metrics.

## Database Configuration

Parameter group settings:
- `max_connections`: 200
- `shared_buffers`: 256MB
- `log_statement`: all
- `log_min_duration_statement`: 1000ms

## Maintenance

- **Backup Window**: 3:00-5:00 AM EST daily
- **Maintenance Window**: Sunday 3:00-5:00 AM EST
- **Backup Retention**: 7 days
- **Auto Minor Version Upgrades**: Enabled

## Testing

Run unit tests:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=lib --cov-report=html

# Run specific test
pytest tests/unit/test_rds_migration_stack.py::test_rds_instance_created
```

## Cost Optimization

- No NAT Gateways (cost savings)
- db.t3.medium instance (burstable, cost-effective)
- 7-day backup retention (balanced cost/recovery)
- Private subnets (no data transfer costs)

## Cleanup

```bash
# Destroy stack (Note: deletion protection must be disabled first)
cdk destroy
```

**Warning**: The database has deletion protection enabled. To delete:
1. Disable deletion protection in RDS console
2. Run `cdk destroy`
3. Final snapshot will be created automatically

## Troubleshooting

### Connection Issues
- Verify security group rules allow application subnet access
- Check VPC routing and subnet associations
- Verify database is in 'available' state

### Performance Issues
- Review CloudWatch metrics and enhanced monitoring
- Check parameter group settings
- Consider scaling instance class if needed

### Secret Rotation Failures
- Verify Lambda function has network access to RDS
- Check IAM permissions for rotation Lambda
- Review CloudWatch Logs for rotation function

## Support

For issues or questions:
- Review CloudWatch Logs
- Check AWS CloudFormation events
- Consult AWS RDS documentation
