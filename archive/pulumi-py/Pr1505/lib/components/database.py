import json

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
from ..config import InfrastructureConfig, ComponentDependencies


class DatabaseComponent(ComponentResource):
  def __init__(self, name: str, config: InfrastructureConfig,
               dependencies: ComponentDependencies, opts: ResourceOptions = None):
    super().__init__('custom:database:DatabaseComponent', name, None, opts)

    # Create DB subnet group
    self._create_subnet_group(name, config, dependencies.private_subnet_ids)

    # Create parameter group
    self._create_parameter_group(name, config)

    # Create RDS instance
    self._create_rds_instance(name, config, dependencies)

    # Create read replica for read scaling (optional)
    self._create_read_replica(name, config)

    self.register_outputs({
      "db_endpoint": self.db_instance.endpoint,
      "db_port": self.db_instance.port
    })

  def _create_subnet_group(self, name: str, config: InfrastructureConfig, private_subnet_ids: list):
    self.db_subnet_group = aws.rds.SubnetGroup(
      f"{name}-db-subnet-group",
      subnet_ids=private_subnet_ids,
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-db-subnet-group"
      },
      opts=ResourceOptions(parent=self)
    )

  def _create_parameter_group(self, name: str, config: InfrastructureConfig):
    self.db_parameter_group = aws.rds.ParameterGroup(
      f"{name}-db-params",
      family="mysql8.0",
      description=f"Parameter group for {config.app_name}-{config.environment}",
      parameters=[
        {
          "name": "innodb_buffer_pool_size",
          "value": "{DBInstanceClassMemory*3/4}"
        },
        {
          "name": "slow_query_log",
          "value": "1"
        },
        {
          "name": "long_query_time",
          "value": "2"
        }
      ],
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-db-params"
      },
      opts=ResourceOptions(parent=self)
    )

  def _create_rds_instance(self, name: str, config: InfrastructureConfig,
                           dependencies: ComponentDependencies):
    # Generate random password
    db_password = aws.secretsmanager.Secret(
      f"{name}-db-password",
      description=f"Database password for {config.app_name}-{config.environment}",
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-db-password"
      },
      opts=ResourceOptions(parent=self)
    )

    # Get password value
    db_password_version = aws.secretsmanager.SecretVersion(
      f"{name}-db-password-version",
      secret_id=db_password.id,
      secret_string=json.dumps({
        "username": "admin",
        "dbname": f"{config.app_name}_{config.environment}".replace("-", "_")
      }),
      opts=ResourceOptions(parent=self)
    )

    # RDS instance
    self.db_instance = aws.rds.Instance(
      f"{name}-db",
      identifier=f"{config.app_name}-{config.environment}-db".lower(),
      engine="mysql",
      engine_version="8.0",
      instance_class=config.database.instance_class,
      allocated_storage=config.database.allocated_storage,
      max_allocated_storage=config.database.max_allocated_storage,
      storage_type="gp2",
      storage_encrypted=True,

      # Database configuration
      db_name=f"{config.app_name}_{config.environment}".replace("-", "_"),
      username="admin",
      password=db_password_version.secret_string,

      # Network configuration
      vpc_security_group_ids=[dependencies.database_sg_id],
      db_subnet_group_name=self.db_subnet_group.name,
      parameter_group_name=self.db_parameter_group.name,

      # Backup configuration
      backup_retention_period=config.database.backup_retention_period,
      backup_window="03:00-04:00",
      maintenance_window="sun:04:00-sun:05:00",
      auto_minor_version_upgrade=True,

      # Monitoring
      monitoring_interval=60,
      monitoring_role_arn=self._create_monitoring_role().arn,
      enabled_cloudwatch_logs_exports=["error", "general", "slowquery"],

      # Security
      publicly_accessible=False,
      copy_tags_to_snapshot=True,
      deletion_protection=config.database.deletion_protection,

      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-db"
      },
      opts=ResourceOptions(parent=self)
    )

    # Create automated backup lambda function
    self._create_backup_function(name, config, dependencies.backup_bucket_name)

  def _create_monitoring_role(self):
    # IAM role for RDS monitoring
    monitoring_role = aws.iam.Role(
      "rds-monitoring-role",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {"Service": "monitoring.rds.amazonaws.com"}
        }]
      }),
      opts=ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      "rds-monitoring-policy",
      role=monitoring_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
      opts=ResourceOptions(parent=self)
    )

    return monitoring_role

  def _create_read_replica(self, name: str, config: InfrastructureConfig):
    self.read_replica = aws.rds.Instance(
      f"{name}-db-replica",
      identifier=f"{config.app_name}-{config.environment}-db-replica".lower(),
      replicate_source_db=self.db_instance.identifier,
      instance_class="db.t3.micro",
      publicly_accessible=False,
      auto_minor_version_upgrade=True,
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-db-replica".lower()
      },
      opts=ResourceOptions(parent=self)
    )

  def _create_backup_function(self, name: str, config: InfrastructureConfig,
                              backup_bucket_name: pulumi.Output):
    # Lambda function for automated database backups
    backup_lambda_role = aws.iam.Role(
      f"{name}-backup-lambda-role",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {"Service": "lambda.amazonaws.com"}
        }]
      }),
      opts=ResourceOptions(parent=self)
    )

    # Lambda policy for backup operations
    backup_policy = aws.iam.Policy(
      f"{name}-backup-policy",
      policy=backup_bucket_name.apply(lambda bucket: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
          },
          {
            "Effect": "Allow",
            "Action": [
              "rds:CreateDBSnapshot",
              "rds:DescribeDBInstances",
              "rds:DescribeDBSnapshots"
            ],
            "Resource": "*"
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:PutObject",
              "s3:GetObject"
            ],
            "Resource": f"arn:aws:s3:::{bucket}/*"
          }
        ]
      })),
      opts=ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"{name}-backup-lambda-policy",
      role=backup_lambda_role.name,
      policy_arn=backup_policy.arn,
      opts=ResourceOptions(parent=self)
    )

    # Lambda function code
    lambda_code = """
import boto3
import json
import datetime

def lambda_handler(event, context):
    rds = boto3.client('rds')

    # Create snapshot
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
    snapshot_id = f"{event['db_identifier']}-backup-{timestamp}"

    try:
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=event['db_identifier']
        )

        return {
            'statusCode': 200,
            'body': json.dumps(f'Snapshot {snapshot_id} created successfully')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error creating snapshot: {str(e)}')
        }
"""

    backup_lambda = aws.lambda_.Function(
      f"{name}-backup-lambda",
      runtime="python3.9",
      code=pulumi.AssetArchive({
        "lambda_function.py": pulumi.StringAsset(lambda_code)
      }),
      handler="lambda_function.lambda_handler",
      role=backup_lambda_role.arn,
      timeout=300,
      tags={
        **config.tags,
        "Name": f"{config.app_name}-{config.environment}-backup-lambda"
      },
      opts=ResourceOptions(parent=self)
    )

    # EventBridge rule for daily backups
    backup_rule = aws.cloudwatch.EventRule(
      f"{name}-backup-schedule",
      description="Daily database backup",
      schedule_expression="cron(0 2 * * ? *)",  # Daily at 2 AM UTC
      opts=ResourceOptions(parent=self)
    )

    # Lambda permission for EventBridge
    aws.lambda_.Permission(
      f"{name}-backup-lambda-permission",
      statement_id="AllowExecutionFromCloudWatch",
      action="lambda:InvokeFunction",
      function=backup_lambda.name,
      principal="events.amazonaws.com",
      source_arn=backup_rule.arn,
      opts=ResourceOptions(parent=self)
    )

    # EventBridge target
    aws.cloudwatch.EventTarget(
      f"{name}-backup-target",
      rule=backup_rule.name,
      target_id="BackupLambdaTarget",
      arn=backup_lambda.arn,
      input=pulumi.Output.all(self.db_instance.identifier).apply(
        lambda args: json.dumps({"db_identifier": args[0]})
      ),
      opts=ResourceOptions(parent=self)
    )
