```hcl

# ============================================================================
# ROUTE53 CONFIGURATION
# ============================================================================

# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  provider = aws.us_east_1
  name     = local.route53_zone_name
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-route53-zone-slmr"
  })
}

# Route53 Health Check - Primary
resource "aws_route53_health_check" "primary" {
  provider          = aws.us_east_1
  fqdn              = aws_rds_cluster.primary.endpoint
  port              = local.db_port
  type              = "TCP"
  failure_threshold = "3"
  request_interval  = "30"
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-healthcheck-primary-slmr"
  })
}

# Route53 Health Check - Secondary
resource "aws_route53_health_check" "secondary" {
  provider          = aws.us_east_1
  fqdn              = aws_rds_cluster.secondary.endpoint
  port              = local.db_port
  type              = "TCP"
  failure_threshold = "3"
  request_interval  = "30"
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-healthcheck-secondary-slmr"
  })
}

# Route53 Record - Primary Database (Weighted)
resource "aws_route53_record" "db_primary" {
  provider = aws.us_east_1
  zone_id  = aws_route53_zone.main.zone_id
  name     = "db.${local.route53_zone_name}"
  type     = "CNAME"
  ttl      = "60"
  
  weighted_routing_policy {
    weight = 100
  }
  
  set_identifier = "Primary"
  records        = [aws_rds_cluster.primary.endpoint]
  health_check_id = aws_route53_health_check.primary.id
}

# Route53 Record - Secondary Database (Weighted)
resource "aws_route53_record" "db_secondary" {
  provider = aws.us_east_1
  zone_id  = aws_route53_zone.main.zone_id
  name     = "db.${local.route53_zone_name}"
  type     = "CNAME"
  ttl      = "60"
  
  weighted_routing_policy {
    weight = 0
  }
  
  set_identifier = "Secondary"
  records        = [aws_rds_cluster.secondary.endpoint]
  health_check_id = aws_route53_health_check.secondary.id
}

# ============================================================================
# DMS CONFIGURATION
# ============================================================================

# DMS Replication Subnet Group
resource "aws_dms_replication_subnet_group" "main" {
  provider                             = aws.us_east_1
  replication_subnet_group_id          = "${var.environment}-dms-subnet-group-slmr"
  replication_subnet_group_description = "DMS subnet group for RDS migration"
  subnet_ids                            = aws_subnet.primary_private[*].id
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-dms-subnet-group-slmr"
  })
}

# DMS Replication Instance
resource "aws_dms_replication_instance" "main" {
  provider                     = aws.us_east_1
  replication_instance_id      = local.dms_replication_instance
  replication_instance_class   = "dms.c5.xlarge"
  allocated_storage            = 100
  vpc_security_group_ids       = [aws_security_group.dms.id]
  replication_subnet_group_id  = aws_dms_replication_subnet_group.main.id
  multi_az                     = true
  publicly_accessible          = false
  auto_minor_version_upgrade   = true
  apply_immediately            = true
  
  tags = merge(local.common_tags, {
    Name = local.dms_replication_instance
  })
}

# DMS Source Endpoint
resource "aws_dms_endpoint" "source" {
  provider                = aws.us_east_1
  endpoint_id             = "${var.environment}-dms-source-endpoint-slmr"
  endpoint_type           = "source"
  engine_name             = "aurora-postgresql"
  server_name             = aws_rds_cluster.primary.endpoint
  port                    = local.db_port
  database_name           = local.db_name
  username                = "dbadmin"
  password                = random_password.aurora_master.result
  ssl_mode                = "require"
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-dms-source-endpoint-slmr"
  })
}

# DMS Target Endpoint
resource "aws_dms_endpoint" "target" {
  provider                = aws.us_east_1
  endpoint_id             = "${var.environment}-dms-target-endpoint-slmr"
  endpoint_type           = "target"
  engine_name             = "aurora-postgresql"
  server_name             = aws_rds_cluster.secondary.endpoint
  port                    = local.db_port
  database_name           = local.db_name
  username                = "dbadmin"
  password                = random_password.aurora_master.result
  ssl_mode                = "require"
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-dms-target-endpoint-slmr"
  })
}

# DMS Replication Task
resource "aws_dms_replication_task" "main" {
  provider                  = aws.us_east_1
  migration_type            = "full-load-and-cdc"
  replication_instance_arn  = aws_dms_replication_instance.main.replication_instance_arn
  replication_task_id       = "${var.environment}-dms-task-slmr"
  source_endpoint_arn       = aws_dms_endpoint.source.endpoint_arn
  target_endpoint_arn       = aws_dms_endpoint.target.endpoint_arn
  table_mappings           = jsonencode({
    rules = [
      {
        rule-type = "selection"
        rule-id   = "1"
        rule-name = "1"
        object-locator = {
          schema-name = "%"
          table-name  = "%"
        }
        rule-action = "include"
      }
    ]
  })
  
  replication_task_settings = jsonencode({
    TargetMetadata = {
      FullLobMode = false
      LobChunkSize = 64
      LobMaxSize = 32
    }
    FullLoadSettings = {
      MaxFullLoadSubTasks = 8
      TransactionConsistencyTimeout = 600
      CommitRate = 10000
    }
    Logging = {
      EnableLogging = true
      LogComponents = [
        {
          Id = "SOURCE_CAPTURE"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        },
        {
          Id = "TARGET_APPLY"
          Severity = "LOGGER_SEVERITY_DEFAULT"
        }
      ]
    }
    ControlTablesSettings = {
      ControlSchema = "dms_control"
      HistoryTimeslotInMinutes = 5
      HistoryTableEnabled = true
      SuspendedTablesTableEnabled = true
      StatusTableEnabled = true
    }
    ChangeProcessingTuning = {
      BatchApplyEnabled = true
      BatchApplyTimeoutMin = 1
      BatchApplyTimeoutMax = 30
      BatchApplyMemoryLimit = 500
      BatchSplitSize = 0
      MinTransactionSize = 1000
      CommitTimeout = 1
      MemoryLimitTotal = 1024
      MemoryKeepTime = 60
      StatementCacheSize = 50
    }
  })
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-dms-task-slmr"
  })
}

# ============================================================================
# SNS TOPIC FOR ALARMS
# ============================================================================

# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  provider = aws.us_east_1
  name     = local.alarm_topic_name
  
  tags = merge(local.common_tags, {
    Name = local.alarm_topic_name
  })
}

# SNS Topic Subscription (Email)
resource "aws_sns_topic_subscription" "alarm_email" {
  provider  = aws.us_east_1
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = "ops-team@company.com"
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

# CloudWatch Alarm - Primary CPU Utilization
resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  provider            = aws.us_east_1
  alarm_name          = "${var.environment}-aurora-primary-cpu-slmr"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors Aurora primary cluster CPU utilization"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-aurora-primary-cpu-alarm-slmr"
  })
}

# CloudWatch Alarm - Primary Database Connections
resource "aws_cloudwatch_metric_alarm" "primary_connections" {
  provider            = aws.us_east_1
  alarm_name          = "${var.environment}-aurora-primary-connections-slmr"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "800"
  alarm_description   = "This metric monitors Aurora primary database connections"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-aurora-primary-connections-alarm-slmr"
  })
}

# CloudWatch Alarm - Replication Lag
resource "aws_cloudwatch_metric_alarm" "replication_lag" {
  provider            = aws.us_east_1
  alarm_name          = "${var.environment}-aurora-replication-lag-slmr"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "AuroraGlobalDBReplicationLag"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Maximum"
  threshold           = "1000"
  alarm_description   = "Alert when replication lag exceeds 1 second"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "breaching"
  
  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.primary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-aurora-replication-lag-alarm-slmr"
  })
}

# CloudWatch Alarm - DMS Task Failed
resource "aws_cloudwatch_metric_alarm" "dms_task_failed" {
  provider            = aws.us_east_1
  alarm_name          = "${var.environment}-dms-task-failed-slmr"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FullLoadThroughputRowsTarget"
  namespace           = "AWS/DMS"
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert when DMS task fails"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "breaching"
  
  dimensions = {
    ReplicationInstanceIdentifier = aws_dms_replication_instance.main.replication_instance_id
    ReplicationTaskIdentifier     = aws_dms_replication_task.main.replication_task_id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-dms-task-failed-alarm-slmr"
  })
}

# ============================================================================
# LAMBDA FUNCTION FOR FAILOVER ORCHESTRATION (INLINE CODE)
# ============================================================================

# ============================================================================
# LAMBDA INLINE CODE (Archive Files)
# ============================================================================

data "archive_file" "failover_orchestrator_code" {
  type        = "zip"
  output_path = "/tmp/failover_orchestrator.zip"

  source {
    content = <<-EOT
import boto3
import json
import os
import time
from datetime import datetime

def lambda_handler(event, context):
    """
    Orchestrates Aurora Global Database failover with zero downtime.
    Handles both planned and unplanned failover scenarios.
    """
    rds_primary = boto3.client('rds', region_name=os.environ['PRIMARY_REGION'])
    rds_secondary = boto3.client('rds', region_name=os.environ['SECONDARY_REGION'])
    route53 = boto3.client('route53')
    sns = boto3.client('sns')
    cloudwatch = boto3.client('cloudwatch')
    global_cluster_id = os.environ['GLOBAL_CLUSTER_ID']
    zone_id = os.environ['ROUTE53_ZONE_ID']
    sns_topic = os.environ['SNS_TOPIC_ARN']
    db_endpoint = os.environ['DB_ENDPOINT_NAME']

    try:
        print(f"Starting failover orchestration at {datetime.utcnow()}")

        global_cluster = rds_primary.describe_global_clusters(
            GlobalClusterIdentifier=global_cluster_id
        )['GlobalClusters'][0]
        current_primary = None
        current_secondary = None
        for member in global_cluster['GlobalClusterMembers']:
            if member['IsWriter']:
                current_primary = member['DBClusterArn']
            else:
                current_secondary = member['DBClusterArn']

        print(f"Current primary: {current_primary}")
        print(f"Current secondary: {current_secondary}")

        # Step 2: Check replication lag before failover
        lag_metric = cloudwatch.get_metric_statistics(
            Namespace='AWS/RDS',
            MetricName='AuroraGlobalDBReplicationLag',
            Dimensions=[
                {'Name': 'DBClusterIdentifier', 'Value': global_cluster_id}
            ],
            StartTime=datetime.utcnow().replace(second=0, microsecond=0),
            EndTime=datetime.utcnow(),
            Period=60,
            Statistics=['Maximum']
        )
        if lag_metric['Datapoints']:
            max_lag = max([dp['Maximum'] for dp in lag_metric['Datapoints']])
            if max_lag > 1000:
                message = f"Warning: Replication lag is {max_lag}ms. Proceeding with caution."
                print(message)
                sns.publish(TopicArn=sns_topic, Subject="Failover Warning", Message=message)

        print("Initiating global cluster failover...")
        if os.environ['PRIMARY_REGION'] in current_primary:
            target_region = os.environ['SECONDARY_REGION']
            new_primary_cluster = current_secondary.split(':')[-1]
        else:
            target_region = os.environ['PRIMARY_REGION']
            new_primary_cluster = current_primary.split(':')[-1]

        response = rds_primary.failover_global_cluster(
            GlobalClusterIdentifier=global_cluster_id,
            TargetDbClusterIdentifier=new_primary_cluster
        )

        print(f"Failover initiated: {response}")
        max_wait_time = 300
        start_time = time.time()
        failover_complete = False
        while not failover_complete and (time.time() - start_time) < max_wait_time:
            time.sleep(10)
            cluster_status = rds_primary.describe_global_clusters(
                GlobalClusterIdentifier=global_cluster_id
            )['GlobalClusters'][0]
            if cluster_status['Status'] == 'available':
                for member in cluster_status['GlobalClusterMembers']:
                    if member['IsWriter'] and member['DBClusterArn'] == current_secondary:
                        failover_complete = True
                        break
            print(f"Waiting for failover... Status: {cluster_status['Status']}")

        if not failover_complete:
            raise Exception("Failover did not complete within expected time")

        print("Updating Route53 DNS records...")
        new_primary_info = rds_secondary.describe_db_clusters(
            DBClusterIdentifier=new_primary_cluster
        )['DBClusters'][0]
        new_endpoint = new_primary_info['Endpoint']

        change_batch = {
            'Changes': [
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': db_endpoint,
                        'Type': 'CNAME',
                        'SetIdentifier': 'Primary',
                        'Weight': 100,
                        'TTL': 60,
                        'ResourceRecords': [{'Value': new_endpoint}]
                    }
                }
            ]
        }
        route53_response = route53.change_resource_record_sets(
            HostedZoneId=zone_id,
            ChangeBatch=change_batch
        )
        print(f"Route53 update: {route53_response}")

        completion_message = f'''
        Aurora Global Database Failover Completed Successfully

        Time: {datetime.utcnow()}
        New Primary Region: {target_region}
        New Primary Endpoint: {new_endpoint}
        Total Duration: {int(time.time() - start_time)} seconds

        Action Required:
        1. Verify application connectivity
        2. Check replication status
        3. Update any hardcoded endpoints
        '''
        sns.publish(
            TopicArn=sns_topic,
            Subject="Aurora Failover Completed",
            Message=completion_message
        )
        cloudwatch.put_metric_data(
            Namespace='CustomApp/Database',
            MetricData=[
                {
                    'MetricName': 'FailoverDuration',
                    'Value': int(time.time() - start_time),
                    'Unit': 'Seconds',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'FailoverSuccess',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Failover completed successfully',
                'new_primary': new_endpoint,
                'duration_seconds': int(time.time() - start_time)
            })
        }

    except Exception as e:
        error_message = f"Failover failed: {str(e)}"
        print(error_message)
        sns.publish(
            TopicArn=sns_topic,
            Subject="Aurora Failover Failed",
            Message=error_message
        )
        cloudwatch.put_metric_data(
            Namespace='CustomApp/Database',
            MetricData=[
                {
                    'MetricName': 'FailoverSuccess',
                    'Value': 0,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
        raise e
EOT
    filename = "index.py"
  }
}

# Lambda Function - Failover Orchestrator
resource "aws_lambda_function" "failover_orchestrator" {
  function_name = local.lambda_function_name
  role          = aws_iam_role.lambda_failover.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.11"
  timeout       = 300
  memory_size   = 512

  filename         = data.archive_file.failover_orchestrator_code.output_path
  source_code_hash = data.archive_file.failover_orchestrator_code.output_base64sha256

  environment {
    variables = {
      GLOBAL_CLUSTER_ID = aws_rds_global_cluster.aurora_global.id
      PRIMARY_REGION    = var.primary_region
      SECONDARY_REGION  = var.secondary_region
      ROUTE53_ZONE_ID   = aws_route53_zone.main.zone_id
      SNS_TOPIC_ARN     = aws_sns_topic.alarms.arn
      DB_ENDPOINT_NAME  = "db.${local.route53_zone_name}"
    }
  }

  tags = merge(local.common_tags, {
    Name = local.lambda_function_name
    Type = "Failover Orchestrator"
  })
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_failover" {
  provider              = aws.us_east_1
  name                  = "/aws/lambda/${local.lambda_function_name}"
  retention_in_days     = 30
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-lambda-logs-slmr"
  })
}

# EventBridge Rule for Scheduled Failover Tests
resource "aws_cloudwatch_event_rule" "failover_test" {
  provider            = aws.us_east_1
  name                = "${var.environment}-failover-test-schedule-slmr"
  description         = "Trigger failover test monthly"
  schedule_expression = "cron(0 2 1 * ? *)"  # First day of each month at 2 AM UTC
  is_enabled          = false  # Disabled by default, enable for testing
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-failover-test-rule-slmr"
  })
}

# EventBridge Rule Target
resource "aws_cloudwatch_event_target" "lambda_failover" {
  provider  = aws.us_east_1
  rule      = aws_cloudwatch_event_rule.failover_test.name
  target_id = "LambdaFailoverTarget"
  arn       = aws_lambda_function.failover_orchestrator.arn
}

# Lambda Permission for EventBridge
resource "aws_lambda_permission" "allow_eventbridge" {
  provider      = aws.us_east_1
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover_orchestrator.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.failover_test.arn
}

# ============================================================================
# PARAMETER STORE FOR CONFIGURATION
# ============================================================================

# Store database configuration in Parameter Store
resource "aws_ssm_parameter" "db_endpoint_primary" {
  provider    = aws.us_east_1
  name        = "/${var.environment}/database/primary/endpoint"
  description = "Primary database endpoint"
  type        = "String"
  value       = aws_rds_cluster.primary.endpoint
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-param-db-endpoint-primary-slmr"
  })
}

resource "aws_ssm_parameter" "db_endpoint_secondary" {
  provider    = aws.us_west_2
  name        = "/${var.environment}/database/secondary/endpoint"
  description = "Secondary database endpoint"
  type        = "String"
  value       = aws_rds_cluster.secondary.endpoint
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-param-db-endpoint-secondary-slmr"
  })
}

resource "aws_ssm_parameter" "db_password" {
  provider    = aws.us_east_1
  name        = "/${var.environment}/database/master/password"
  description = "Master database password"
  type        = "SecureString"
  value       = random_password.aurora_master.result
  
  tags = merge(local.common_tags, {
    Name = "${var.environment}-param-db-password-slmr"
  })
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "vpc_primary_id" {
  description = "Primary VPC ID"
  value       = aws_vpc.primary.id
}

output "vpc_secondary_id" {
  description = "Secondary VPC ID"
  value       = aws_vpc.secondary.id
}

output "vpc_peering_connection_id" {
  description = "VPC Peering Connection ID"
  value       = aws_vpc_peering_connection.primary_to_secondary.id
}

output "aurora_global_cluster_id" {
  description = "Aurora Global Cluster ID"
  value       = aws_rds_global_cluster.aurora_global.id
}

output "aurora_primary_cluster_endpoint" {
  description = "Aurora Primary Cluster Endpoint"
  value       = aws_rds_cluster.primary.endpoint
}

output "aurora_primary_reader_endpoint" {
  description = "Aurora Primary Reader Endpoint"
  value       = aws_rds_cluster.primary.reader_endpoint
}

output "aurora_secondary_cluster_endpoint" {
  description = "Aurora Secondary Cluster Endpoint"
  value       = aws_rds_cluster.secondary.endpoint
}

output "aurora_secondary_reader_endpoint" {
  description = "Aurora Secondary Reader Endpoint"
  value       = aws_rds_cluster.secondary.reader_endpoint
}

output "route53_zone_id" {
  description = "Route53 Hosted Zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name_servers" {
  description = "Route53 Zone Name Servers"
  value       = aws_route53_zone.main.name_servers
}

output "route53_db_endpoint" {
  description = "Route53 Database Endpoint"
  value       = "db.${local.route53_zone_name}"
}

output "s3_bucket_primary_id" {
  description = "Primary S3 Backup Bucket ID"
  value       = aws_s3_bucket.backup_primary.id
}

output "s3_bucket_secondary_id" {
  description = "Secondary S3 Backup Bucket ID"
  value       = aws_s3_bucket.backup_secondary.id
}

output "dms_replication_instance_id" {
  description = "DMS Replication Instance ID"
  value       = aws_dms_replication_instance.main.replication_instance_id
}

output "dms_replication_task_id" {
  description = "DMS Replication Task ID"
  value       = aws_dms_replication_task.main.replication_task_id
}

output "lambda_function_arn" {
  description = "Lambda Failover Function ARN"
  value       = aws_lambda_function.failover_orchestrator.arn
}

output "lambda_function_name" {
  description = "Lambda Failover Function Name"
  value       = aws_lambda_function.failover_orchestrator.function_name
}

output "sns_topic_arn" {
  description = "SNS Topic ARN for Alarms"
  value       = aws_sns_topic.alarms.arn
}

output "kms_key_primary_id" {
  description = "Primary KMS Key ID"
  value       = aws_kms_key.aurora_primary.id
}

output "kms_key_secondary_id" {
  description = "Secondary KMS Key ID"
  value       = aws_kms_key.aurora_secondary.id
}

output "nat_gateway_primary_id" {
  description = "Primary NAT Gateway ID"
  value       = aws_nat_gateway.primary.id
}

output "nat_gateway_secondary_id" {
  description = "Secondary NAT Gateway ID"
  value       = aws_nat_gateway.secondary.id
}

output "primary_private_subnet_ids" {
  description = "Primary Private Subnet IDs"
  value       = aws_subnet.primary_private[*].id
}

output "secondary_private_subnet_ids" {
  description = "Secondary Private Subnet IDs"
  value       = aws_subnet.secondary_private[*].id
}

output "db_subnet_group_primary_name" {
  description = "Primary DB Subnet Group Name"
  value       = aws_db_subnet_group.primary.name
}

output "db_subnet_group_secondary_name" {
  description = "Secondary DB Subnet Group Name"
  value       = aws_db_subnet_group.secondary.name
}

output "security_group_aurora_primary_id" {
  description = "Primary Aurora Security Group ID"
  value       = aws_security_group.aurora_primary.id
}

output "security_group_aurora_secondary_id" {
  description = "Secondary Aurora Security Group ID"
  value       = aws_security_group.aurora_secondary.id
}

output "security_group_dms_id" {
  description = "DMS Security Group ID"
  value       = aws_security_group.dms.id
}

output "cloudwatch_alarm_primary_cpu_name" {
  description = "Primary CPU Alarm Name"
  value       = aws_cloudwatch_metric_alarm.primary_cpu.alarm_name
}

output "cloudwatch_alarm_replication_lag_name" {
  description = "Replication Lag Alarm Name"
  value       = aws_cloudwatch_metric_alarm.replication_lag.alarm_name
}

output "parameter_store_db_endpoint_primary" {
  description = "Parameter Store Key for Primary DB Endpoint"
  value       = aws_ssm_parameter.db_endpoint_primary.name
}

output "parameter_store_db_endpoint_secondary" {
  description = "Parameter Store Key for Secondary DB Endpoint"
  value       = aws_ssm_parameter.db_endpoint_secondary.name
}
output "aws_primary_region"{
  description = "aws primary region"
  value       = var.primary_region
}

output "aws_secondary_region"{
  description = "aws secondary region"
  value       = var.secondary_region
}

```

```

# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  alias  = "us_east_1"
  region = var.primary_region
}

provider "aws" {
  alias  = "us_west_2"
  region = var.secondary_region
}

```
