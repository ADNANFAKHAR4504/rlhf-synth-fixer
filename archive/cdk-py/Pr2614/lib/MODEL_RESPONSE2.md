``````python
"""Complete AWS CDK Infrastructure Migration Project
I'll complete the comprehensive infrastructure build. Let me continue from where I left off and provide the complete solution.
Continuing Serverless Stack (Completed)"""

# stacks/serverless_stack.py (continued)
from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_lambda_event_sources as lambda_event_sources,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_ec2 as ec2,
    aws_logs as logs,
    Duration,
    CfnOutput
)
from constructs import Construct

class ServerlessStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc,
                 s3_bucket: s3.Bucket, dynamodb_table: dynamodb.Table,
                 security_groups: dict, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.lambda_functions = {}
        
        # S3 Event Processing Lambda
        self.lambda_functions['s3_processor'] = _lambda.Function(
            self, "lambda-prod-s3-processor",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('prod-application-data')

def handler(event, context):
    try:
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            event_name = record['eventName']
            
            logger.info(f'Processing {event_name} for file: {key} from bucket: {bucket}')
            
            # Log to DynamoDB
            table.put_item(
                Item={
                    'id': f's3-{key}',
                    'timestamp': int(context.aws_request_id),
                    'type': 's3-event',
                    'bucket': bucket,
                    'key': key,
                    'event': event_name,
                    'created_at': int(context.aws_request_id)
                }
            )
            
        return {
            'statusCode': 200,
            'body': json.dumps('Files processed successfully')
        }
    except Exception as e:
        logger.error(f'Error processing files: {str(e)}')
        raise e
            """),
            timeout=Duration.minutes(5),
            memory_size=512,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[security_groups["lambda"]],
            log_retention=logs.RetentionDays.ONE_WEEK,
            dead_letter_queue_enabled=True,
            retry_attempts=2
        )
        
        # Grant permissions
        s3_bucket.grant_read_write(self.lambda_functions['s3_processor'])
        dynamodb_table.grant_write_data(self.lambda_functions['s3_processor'])
        
        # S3 Event Source
        self.lambda_functions['s3_processor'].add_event_source(
            lambda_event_sources.S3EventSource(
                s3_bucket,
                events=[s3.EventType.OBJECT_CREATED],
                filters=[s3.NotificationKeyFilter(prefix="uploads/")]
            )
        )
        
        # DynamoDB Stream Processing Lambda
        self.lambda_functions['dynamodb_processor'] = _lambda.Function(
            self, "lambda-prod-dynamodb-processor",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import logging
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sns = boto3.client('sns')

def handler(event, context):
    try:
        processed_records = 0
        
        for record in event['Records']:
            event_name = record['eventName']
            
            if event_name in ['INSERT', 'MODIFY', 'REMOVE']:
                logger.info(f'Processing DynamoDB {event_name} event')
                
                # Extract data from the record
                if 'dynamodb' in record:
                    keys = record['dynamodb'].get('Keys', {})
                    logger.info(f'Processing record with keys: {keys}')
                
                processed_records += 1
                
        logger.info(f'Successfully processed {processed_records} records')
        
        return {
            'statusCode': 200,
            'body': json.dumps(f'Processed {processed_records} stream records successfully')
        }
    except Exception as e:
        logger.error(f'Error processing stream records: {str(e)}')
        raise e
            """),
            timeout=Duration.minutes(5),
            memory_size=256,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[security_groups["lambda"]],
            log_retention=logs.RetentionDays.ONE_WEEK,
            dead_letter_queue_enabled=True,
            retry_attempts=2
        )
        
        # DynamoDB Stream Event Source
        self.lambda_functions['dynamodb_processor'].add_event_source(
            lambda_event_sources.DynamoEventSource(
                dynamodb_table,
                starting_position=_lambda.StartingPosition.LATEST,
                batch_size=10,
                max_batching_window=Duration.seconds(5),
                retry_attempts=2
            )
        )
        
        # API Processing Lambda (configurable memory)
        self.lambda_functions['api_processor'] = _lambda.Function(
            self, "lambda-prod-api-processor",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    try:
        memory_size = os.environ.get('AWS_LAMBDA_FUNCTION_MEMORY_SIZE', 'Unknown')
        logger.info(f'Lambda running with {memory_size}MB memory')
        
        # Process API request
        http_method = event.get('httpMethod', 'UNKNOWN')
        path = event.get('path', '/')
        
        logger.info(f'Processing {http_method} request to {path}')
        
        response_body = {
            'message': 'API request processed successfully',
            'method': http_method,
            'path': path,
            'memory': f'{memory_size}MB'
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_body)
        }
    except Exception as e:
        logger.error(f'Error processing API request: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
            """),
            timeout=Duration.seconds(30),
            memory_size=1024,  # Configurable memory
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            security_groups=[security_groups["lambda"]],
            log_retention=logs.RetentionDays.ONE_WEEK
        )
        
        # Outputs
        CfnOutput(
            self, "S3ProcessorFunctionName",
            value=self.lambda_functions['s3_processor'].function_name,
            description="S3 Event Processor Lambda Function Name"
        )
        
        CfnOutput(
            self, "DynamoDBProcessorFunctionName",
            value=self.lambda_functions['dynamodb_processor'].function_name,
            description="DynamoDB Stream Processor Lambda Function Name"
        )

# stacks/monitoring_stack.py
from aws_cdk import (
    Stack,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_ec2 as ec2,
    aws_sns as sns,
    aws_cloudwatch_actions as cw_actions,
    Duration,
    CfnOutput
)
from constructs import Construct
from config.config import InfraConfig

class MonitoringStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc,
                 alb: elbv2.ApplicationLoadBalancer, asg: autoscaling.AutoScalingGroup,
                 rds_instance: rds.DatabaseInstance, dynamodb_table: dynamodb.Table,
                 lambda_functions: dict, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # SNS Topic for alerts
        alert_topic = sns.Topic(
            self, "sns-prod-alerts",
            topic_name="production-alerts",
            display_name="Production Infrastructure Alerts"
        )
        
        # Create CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, "dashboard-prod-main",
            dashboard_name="Production-Infrastructure-Dashboard"
        )
        
        # ALB Monitoring
        self._create_alb_monitoring(alb, alert_topic, dashboard)
        
        # ASG Monitoring
        self._create_asg_monitoring(asg, alert_topic, dashboard)
        
        # RDS Monitoring
        self._create_rds_monitoring(rds_instance, alert_topic, dashboard)
        
        # DynamoDB Monitoring
        self._create_dynamodb_monitoring(dynamodb_table, alert_topic, dashboard)
        
        # Lambda Monitoring
        self._create_lambda_monitoring(lambda_functions, alert_topic, dashboard)
        
        # VPC Monitoring
        self._create_vpc_monitoring(vpc, alert_topic, dashboard)
        
        # Route53 Health Checks and DNS
        self._create_route53_setup(alb)
        
        # Centralized Logging
        self._create_centralized_logging()
        
        # Outputs
        CfnOutput(
            self, "DashboardURL",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={dashboard.dashboard_name}",
            description="CloudWatch Dashboard URL"
        )
        
        CfnOutput(
            self, "AlertTopicArn",
            value=alert_topic.topic_arn,
            description="SNS Alert Topic ARN"
        )
    
    def _create_alb_monitoring(self, alb, alert_topic, dashboard):
        # ALB Target Response Time
        response_time_alarm = cloudwatch.Alarm(
            self, "alarm-alb-response-time",
            alarm_name="ALB-High-Response-Time",
            metric=alb.metric_target_response_time(),
            threshold=1.0,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="ALB response time is too high"
        )
        response_time_alarm.add_alarm_action(cw_actions.SnsAction(alert_topic))
        
        # ALB HTTP 5xx Errors
        error_5xx_alarm = cloudwatch.Alarm(
            self, "alarm-alb-5xx-errors",
            alarm_name="ALB-High-5xx-Errors",
            metric=alb.metric_http_code_target(
                code=elbv2.HttpCodeTarget.TARGET_5XX_COUNT
            ),
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High number of 5xx errors from ALB targets"
        )
        error_5xx_alarm.add_alarm_action(cw_actions.SnsAction(alert_topic))
        
        # Add to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ALB Response Time",
                left=[alb.metric_target_response_time()],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="ALB Request Count",
                left=[alb.metric_request_count()],
                width=12,
                height=6
            )
        )
    
    def _create_asg_monitoring(self, asg, alert_topic, dashboard):
        # CPU Utilization
        cpu_alarm = cloudwatch.Alarm(
            self, "alarm-asg-cpu-high",
            alarm_name="ASG-High-CPU-Utilization",
            metric=asg.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High CPU utilization in Auto Scaling Group"
        )
        cpu_alarm.add_alarm_action(cw_actions.SnsAction(alert_topic))
        
        # Memory Utilization (requires CloudWatch agent)
        memory_metric = cloudwatch.Metric(
            namespace="CWAgent",
            metric_name="mem_used_percent",
            dimensions_map={
                "AutoScalingGroupName": asg.auto_scaling_group_name
            }
        )
        
        memory_alarm = cloudwatch.Alarm(
            self, "alarm-asg-memory-high",
            alarm_name="ASG-High-Memory-Utilization",
            metric=memory_metric,
            threshold=85,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High memory utilization in Auto Scaling Group"
        )
        memory_alarm.add_alarm_action(cw_actions.SnsAction(alert_topic))
        
        # Disk Utilization
        disk_metric = cloudwatch.Metric(
            namespace="CWAgent",
            metric_name="disk_used_percent",
            dimensions_map={
                "AutoScalingGroupName": asg.auto_scaling_group_name,
                "device": "/dev/xvda1",
                "fstype": "xfs",
                "path": "/"
            }
        )
        
        disk_alarm = cloudwatch.Alarm(
            self, "alarm-asg-disk-high",
            alarm_name="ASG-High-Disk-Utilization",
            metric=disk_metric,
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High disk utilization in Auto Scaling Group"
        )
        disk_alarm.add_alarm_action(cw_actions.SnsAction(alert_topic))
        
        # Add to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="ASG CPU Utilization",
                left=[asg.metric_cpu_utilization()],
                width=8,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="ASG Memory Utilization",
                left=[memory_metric],
                width=8,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="ASG Disk Utilization",
                left=[disk_metric],
                width=8,
                height=6
            )
        )
    
    def _create_rds_monitoring(self, rds_instance, alert_topic, dashboard):
        # CPU Utilization
        rds_cpu_alarm = cloudwatch.Alarm(
            self, "alarm-rds-cpu-high",
            alarm_name="RDS-High-CPU-Utilization",
            metric=rds_instance.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High CPU utilization on RDS instance"
        )
        rds_cpu_alarm.add_alarm_action(cw_actions.SnsAction(alert_topic))
        
        # Database Connections
        db_connections_alarm = cloudwatch.Alarm(
            self, "alarm-rds-connections-high",
            alarm_name="RDS-High-Database-Connections",
            metric=rds_instance.metric_database_connections(),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="High number of database connections"
        )
        db_connections_alarm.add_alarm_action(cw_actions.SnsAction(alert_topic))
        
        # Free Storage Space
        free_storage_alarm = cloudwatch.Alarm(
            self, "alarm-rds-storage-low",
            alarm_name="RDS-Low-Free-Storage",
            metric=rds_instance.metric_free_storage_space(),
            threshold=2000000000,  # 2GB in bytes
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
            alarm_description="Low free storage space on RDS instance"
        )
        free_storage_alarm.add_alarm_action(cw_actions.SnsAction(alert_topic))
        
        # Add to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="RDS CPU Utilization",
                left=[rds_instance.metric_cpu_utilization()],
                width=8,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="RDS Database Connections",
                left=[rds_instance.metric_database_connections()],
                width=8,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="RDS Free Storage Space",
                left=[rds_instance.metric_free_storage_space()],
                width=8,
                height=6
            )
        )
    
    def _create_dynamodb_monitoring(self, dynamodb_table, alert_topic, dashboard):
        # Read/Write Throttles
        read_throttle_alarm = cloudwatch.Alarm(
            self, "alarm-dynamodb-read-throttles",
            alarm_name="DynamoDB-Read-Throttles",
            metric=dynamodb_table.metric_user_errors(),
            threshold=0,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="DynamoDB read throttling detected"
        )
        read_throttle_alarm.add_alarm_action(cw_actions.SnsAction(alert_topic))
        
        # Add to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="DynamoDB Consumed Read Capacity",
                left=[dynamodb_table.metric_consumed_read_capacity_units()],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="DynamoDB Consumed Write Capacity",
                left=[dynamodb_table.metric_consumed_write_capacity_units()],
                width=12,
                height=6
            )
        )
    
    def _create_lambda_monitoring(self, lambda_functions, alert_topic, dashboard):
        lambda_widgets = []
        
        for name, function in lambda_functions.items():
            # Error Rate Alarm
            error_alarm = cloudwatch.Alarm(
                self, f"alarm-lambda-{name}-errors",
                alarm_name=f"Lambda-{name}-High-Error-Rate",
                metric=function.metric_errors(),
                threshold=5,
                evaluation_periods=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description=f"High error rate for Lambda function {name}"
            )
            error_alarm.add_alarm_action(cw_actions.SnsAction(alert_topic))
            
            # Duration Alarm
            duration_alarm = cloudwatch.Alarm(
                self, f"alarm-lambda-{name}-duration",
                alarm_name=f"Lambda-{name}-High-Duration",
                metric=function.metric_duration(),
                threshold=Duration.seconds(30).to_milliseconds(),
                evaluation_periods=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                alarm_description=f"High duration for Lambda function {name}"
            )
            duration_alarm.add_alarm_action(cw_actions.SnsAction(alert_topic))
            
            # Add to dashboard
            lambda_widgets.append(
                cloudwatch.GraphWidget(
                    title=f"Lambda {name} - Invocations & Errors",
                    left=[function.metric_invocations()],
                    right=[function.metric_errors()],
                    width=12,
                    height=6
                )
            )
        
        dashboard.add_widgets(*lambda_widgets)
    
    def _create_vpc_monitoring(self, vpc, alert_topic, dashboard):
        # VPC Flow Logs are already created in NetworkStack
        # Add network-related metrics to dashboard
        
        # NAT Gateway metrics
        nat_gateway_metric = cloudwatch.Metric(
            namespace="AWS/NATGateway",
            metric_name="BytesOutToDestination",
            statistic="Sum"
        )
        
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="NAT Gateway Data Transfer",
                left=[nat_gateway_metric],
                width=12,
                height=6
            )
        )
    
    def _create_route53_setup(self, alb):
        # Create hosted zone (assuming domain exists)
        hosted_zone = route53.HostedZone(
            self, "hosted-zone-prod",
            zone_name="example.com",
            comment="Production hosted zone"
        )
        
        # Health check for ALB
        health_check = route53.CfnHealthCheck(
            self, "health-check-alb",
            type="HTTPS",
            resource_path="/health",
            fully_qualified_domain_name=alb.load_balancer_dns_name,
            request_interval=30,
            failure_threshold=3
        )
        
        # A Record pointing to ALB
        route53.ARecord(
            self, "a-record-main",
            zone=hosted_zone,
            target=route53.RecordTarget.from_alias(
                targets.LoadBalancerTarget(alb)
            ),
            record_name="www"
        )
        
        # CNAME Records for subdomains
        for domain in InfraConfig.DOMAINS[1:]:  # Skip main domain
            subdomain = domain.split('.')[0]
            route53.CnameRecord(
                self, f"cname-{subdomain}",
                zone=hosted_zone,
                record_name=subdomain,
                domain_name=alb.load_balancer_dns_name
            )
        
        # Output
        CfnOutput(
            self, "HostedZoneId",
            value=hosted_zone.hosted_zone_id,
            description="Route53 Hosted Zone ID"
        )
    
    def _create_centralized_logging(self):
        # Central log group for application logs
        central_log_group = logs.LogGroup(
            self, "log-group-prod-central",
            log_group_name="/aws/production/application",
            retention=logs.RetentionDays.ONE_MONTH
        )
        
        # Log group for infrastructure logs
        infra_log_group = logs.LogGroup(
            self, "log-group-prod-infrastructure",
            log_group_name="/aws/production/infrastructure",
            retention=logs.RetentionDays.THREE_MONTHS
        )
        
        # Output
        CfnOutput(
            self, "CentralLogGroupName",
            value=central_log_group.log_group_name,
            description="Central Log Group Name"
        )
