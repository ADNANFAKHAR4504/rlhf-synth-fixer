I'll help you create a comprehensive AWS CDK setup in Python that meets all your requirements. Let me break this down into a well-structured, secure, and scalable solution.

## Project Structure

First, let's set up the project structure:

```
aws-cdk-infrastructure/
├── app.py
├── requirements.txt
├── cdk.json
└── infrastructure/
    ├── __init__.py
    ├── vpc_stack.py
    ├── storage_stack.py
    ├── compute_stack.py
    ├── api_stack.py
    └── monitoring_stack.py
```

## 1. Requirements and Configuration Files

**requirements.txt**
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
boto3>=1.26.0
```

**cdk.json**
```json
{
  "app": "python app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/*.pyc"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"]
  }
}
```

## 2. Main Application Entry Point

**app.py**
```python
#!/usr/bin/env python3
import aws_cdk as cdk
from infrastructure.vpc_stack import VpcStack
from infrastructure.storage_stack import StorageStack
from infrastructure.compute_stack import ComputeStack
from infrastructure.api_stack import ApiStack
from infrastructure.monitoring_stack import MonitoringStack

app = cdk.App()

# Common tags for all resources
common_tags = {
    "Environment": "Production",
    "Project": "SecureCloudInfrastructure",
    "ManagedBy": "CDK"
}

# VPC Stack - Foundation
vpc_stack = VpcStack(
    app, "VpcStack",
    env=cdk.Environment(region="us-west-2"),
    tags=common_tags
)

# Storage Stack - S3, DynamoDB, Parameter Store
storage_stack = StorageStack(
    app, "StorageStack",
    vpc=vpc_stack.vpc,
    env=cdk.Environment(region="us-west-2"),
    tags=common_tags
)

# Compute Stack - EC2, RDS, ALB
compute_stack = ComputeStack(
    app, "ComputeStack",
    vpc=vpc_stack.vpc,
    env=cdk.Environment(region="us-west-2"),
    tags=common_tags
)

# API Stack - Lambda, API Gateway
api_stack = ApiStack(
    app, "ApiStack",
    vpc=vpc_stack.vpc,
    dynamodb_table=storage_stack.dynamodb_table,
    s3_bucket=storage_stack.s3_bucket,
    env=cdk.Environment(region="us-west-2"),
    tags=common_tags
)

# Monitoring Stack - CloudWatch, SNS
monitoring_stack = MonitoringStack(
    app, "MonitoringStack",
    lambda_function=api_stack.lambda_function,
    dynamodb_table=storage_stack.dynamodb_table,
    s3_bucket=storage_stack.s3_bucket,
    rds_instance=compute_stack.rds_instance,
    env=cdk.Environment(region="us-west-2"),
    tags=common_tags
)

app.synth()
```

## 3. VPC Stack

**infrastructure/vpc_stack.py**
```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_logs as logs,
    CfnOutput
)
from constructs import Construct

class VpcStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create VPC with public and private subnets
        self.vpc = ec2.Vpc(
            self, "ProductionVpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            nat_gateways=1,
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # VPC Flow Logs for security monitoring
        vpc_flow_log_group = logs.LogGroup(
            self, "VpcFlowLogGroup",
            retention=logs.RetentionDays.ONE_MONTH
        )
        
        vpc_flow_log_role = ec2.FlowLogResourceType.from_network_interface_id(
            self.vpc.vpc_id
        )
        
        self.vpc.add_flow_log(
            "VpcFlowLog",
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                vpc_flow_log_group
            )
        )
        
        # Security Group for ALB
        self.alb_security_group = ec2.SecurityGroup(
            self, "AlbSecurityGroup",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=False
        )
        
        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic"
        )
        
        self.alb_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic"
        )
        
        # Security Group for EC2 instances
        self.ec2_security_group = ec2.SecurityGroup(
            self, "Ec2SecurityGroup",
            vpc=self.vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True
        )
        
        self.ec2_security_group.add_ingress_rule(
            self.alb_security_group,
            ec2.Port.tcp(80),
            "Allow traffic from ALB"
        )
        
        # Security Group for RDS
        self.rds_security_group = ec2.SecurityGroup(
            self, "RdsSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS instance",
            allow_all_outbound=False
        )
        
        self.rds_security_group.add_ingress_rule(
            self.ec2_security_group,
            ec2.Port.tcp(3306),
            "Allow MySQL access from EC2"
        )
        
        # Output VPC ID
        CfnOutput(
            self, "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )
```

## 4. Storage Stack

**infrastructure/storage_stack.py**
```python
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_ssm as ssm,
    aws_kms as kms,
    aws_iam as iam,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct

class StorageStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # KMS Key for encryption
        self.kms_key = kms.Key(
            self, "StorageKmsKey",
            description="KMS key for storage encryption",
            enable_key_rotation=True
        )
        
        # S3 Bucket with encryption and versioning
        self.s3_bucket = s3.Bucket(
            self, "DataBucket",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            server_access_logs_prefix="access-logs/",
            enforce_ssl=True
        )
        
        # DynamoDB Table with encryption
        self.dynamodb_table = dynamodb.Table(
            self, "DataTable",
            table_name="ProductionDataTable",
            partition_key=dynamodb.Attribute(
                name="pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="sk",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.RETAIN
        )
        
        # Parameter Store parameters for sensitive configuration
        self.db_password_parameter = ssm.StringParameter(
            self, "DbPasswordParameter",
            parameter_name="/production/database/password",
            string_value="ChangeMe123!",  # In production, use AWS Secrets Manager
            type=ssm.ParameterType.SECURE_STRING
        )
        
        self.api_key_parameter = ssm.StringParameter(
            self, "ApiKeyParameter",
            parameter_name="/production/api/key",
            string_value="your-api-key-here",
            type=ssm.ParameterType.SECURE_STRING
        )
        
        # IAM Role for Lambda to access storage resources
        self.lambda_execution_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )
        
        # Inline policy for Lambda role - principle of least privilege
        lambda_policy = iam.Policy(
            self, "LambdaStoragePolicy",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    resources=[self.dynamodb_table.table_arn]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    resources=[f"{self.s3_bucket.bucket_arn}/*"]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "ssm:GetParameter",
                        "ssm:GetParameters"
                    ],
                    resources=[
                        self.db_password_parameter.parameter_arn,
                        self.api_key_parameter.parameter_arn
                    ]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    resources=[self.kms_key.key_arn]
                )
            ]
        )
        
        self.lambda_execution_role.attach_inline_policy(lambda_policy)
        
        # Outputs
        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 Bucket Name"
        )
        
        CfnOutput(
            self, "DynamoDbTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB Table Name"
        )
```

## 5. Compute Stack

**infrastructure/compute_stack.py**
```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
    aws_logs as logs,
    CfnOutput
)
from constructs import Construct

class ComputeStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # IAM Role for EC2 instances
        ec2_role = iam.Role(
            self, "Ec2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "CloudWatchAgentServerPolicy"
                )
            ]
        )
        
        # Inline policy for EC2 instances
        ec2_policy = iam.Policy(
            self, "Ec2InstancePolicy",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "ssm:GetParameter",
                        "ssm:GetParameters"
                    ],
                    resources=["arn:aws:ssm:us-west-2:*:parameter/production/*"]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    resources=["*"]
                )
            ]
        )
        
        ec2_role.attach_inline_policy(ec2_policy)
        
        # Instance Profile
        instance_profile = iam.CfnInstanceProfile(
            self, "Ec2InstanceProfile",
            roles=[ec2_role.role_name]
        )
        
        # User Data script for EC2 instances
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Hello from Production Server</h1>' > /var/www/html/index.html",
            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm"
        )
        
        # Launch Template for Auto Scaling Group
        launch_template = ec2.LaunchTemplate(
            self, "WebServerLaunchTemplate",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=vpc.ec2_security_group,
            user_data=user_data,
            role=ec2_role
        )
        
        # Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self, "ApplicationLoadBalancer",
            vpc=vpc,
            internet_facing=True,
            security_group=vpc.alb_security_group
        )
        
        # Target Group
        target_group = elbv2.ApplicationTargetGroup(
            self, "WebServerTargetGroup",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                interval_duration_seconds=30,
                path="/",
                timeout_duration_seconds=10
            )
        )
        
        # ALB Listener
        self.alb.add_listener(
            "AlbListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )
        
        # Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self, "WebServerAutoScalingGroup",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=6,
            desired_capacity=2,
            target_groups=[target_group]
        )
        
        # RDS Subnet Group
        db_subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )
        
        # RDS Instance
        self.rds_instance = rds.DatabaseInstance(
            self, "ProductionDatabase",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            vpc=vpc,
            subnet_group=db_subnet_group,
            security_groups=[vpc.rds_security_group],
            database_name="productiondb",
            credentials=rds.Credentials.from_generated_secret(
                "admin",
                secret_name="rds-credentials"
            ),
            backup_retention_days=7,
            delete_automated_backups=False,
            deletion_protection=True,
            enable_performance_insights=True,
            monitoring_interval_seconds=60,
            cloudwatch_logs_exports=["error", "general", "slowquery"]
        )
        
        # CloudWatch Log Group for ALB
        alb_log_group = logs.LogGroup(
            self, "AlbLogGroup",
            retention=logs.RetentionDays.ONE_MONTH
        )
        
        # Outputs
        CfnOutput(
            self, "LoadBalancerDns",
            value=self.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name"
        )
        
        CfnOutput(
            self, "RdsEndpoint",
            value=self.rds_instance.instance_endpoint.hostname,
            description="RDS Instance Endpoint"
        )
```

## 6. API Stack

**infrastructure/api_stack.py**
```python
from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_logs as logs,
    Duration,
    CfnOutput
)
from constructs import Construct

class ApiStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc, dynamodb_table, s3_bucket, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Lambda function for data processing
        self.lambda_function = _lambda.Function(
            self, "DataProcessorFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    # Initialize AWS clients
    dynamodb = boto3.resource('dynamodb')
    s3 = boto3.client('s3')
    ssm = boto3.client('ssm')
    
    # Get environment variables
    table_name = os.environ['DYNAMODB_TABLE']
    bucket_name = os.environ['S3_BUCKET']
    
    try:
        # Process the incoming data
        body = json.loads(event.get('body', '{}'))
        
        # Store data in DynamoDB
        table = dynamodb.Table(table_name)
        timestamp = datetime.now().isoformat()
        
        item = {
            'pk': f"data#{timestamp}",
            'sk': 'processed',
            'data': body,
            'timestamp': timestamp,
            'processed': True
        }
        
        table.put_item(Item=item)
        
        # Store raw data in S3
        s3_key = f"processed-data/{timestamp}.json"
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=json.dumps(body),
            ContentType='application/json'
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Data processed successfully',
                'timestamp': timestamp,
                's3_key': s3_key
            })
        }
        
    except Exception as e:
        print(f"Error processing data: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
            """),
            timeout=Duration.seconds(30),
            environment={
                'DYNAMODB_TABLE': dynamodb_table.table_name,
                'S3_BUCKET': s3_bucket.bucket_name
            },
            role=dynamodb_table.node.scope.lambda_execution_role,
            vpc=vpc,
            vpc_subnets=vpc.select_subnets(
                subnet_type=vpc.SubnetType.PRIVATE_WITH_EGRESS
            )
        )
        
        # CloudWatch Log Group for Lambda
        lambda_log_group = logs.LogGroup(
            self, "LambdaLogGroup",
            log_group_name=f"/aws/lambda/{self.lambda_function.function_name}",
            retention=logs.RetentionDays.ONE_MONTH
        )
        
        # API Gateway
        self.api = apigateway.RestApi(
            self, "DataProcessorApi",
            rest_api_name="Data Processor API",
            description="API for processing incoming data streams",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
            ),
            cloud_watch_role=True
        )
        
        # API Gateway CloudWatch Log Group
        api_log_group = logs.LogGroup(
            self, "ApiGatewayLogGroup",
            retention=logs.RetentionDays.ONE_MONTH
        )
        
        # Configure API Gateway logging
        self.api.deployment_stage.add_property_override(
            "AccessLogSetting",
            {
                "DestinationArn": api_log_group.log_group_arn,
                "Format": json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "caller": "$context.identity.caller",
                    "user": "$context.identity.user",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "resourcePath": "$context.resourcePath",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength"
                })
            }
        )
        
        # Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.lambda_function,
            request_templates={"application/json": '{ "statusCode": "200" }'}
        )
        
        # API Resources and Methods
        process_resource = self.api.root.add_resource("process")
        process_resource.add_method("POST", lambda_integration)
        
        # Health check endpoint
        health_resource = self.api.root.add_resource("health")
        health_integration = apigateway.MockIntegration(
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_templates={
                        "application/json": '{"status": "healthy", "timestamp": "$context.requestTime"}'
                    }
                )
            ],
            request_templates={
                "application/json": '{"statusCode": 200}'
            }
        )
        
        health_resource.add_method(
            "GET",
            health_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_models={
                        "application/json": apigateway.Model.EMPTY_MODEL
                    }
                )
            ]
        )
        
        # Outputs
        CfnOutput(
            self, "ApiGatewayUrl",
            value=self.api.url,
            description="API Gateway URL"
        )
        
        CfnOutput(
            self, "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Lambda Function Name"
        )
```

## 7. Monitoring Stack

**infrastructure/monitoring_stack.py**
```python
from aws_cdk import (
    Stack,
    aws_sns as sns,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_iam as iam,
    aws_events as events,
    aws_events_targets as targets,
    CfnOutput
)
from constructs import Construct
import json

class MonitoringStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, lambda_function, dynamodb_table, s3_bucket, rds_instance, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # SNS Topic for notifications
        self.notification_topic = sns.Topic(
            self, "ConfigurationChangesTopic",
            topic_name="configuration-changes-notifications",
            display_name="Configuration Changes Notifications"
        )
        
        # CloudWatch Alarms
        
        # Lambda Error Rate Alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self, "LambdaErrorAlarm",
            metric=lambda_function.metric_errors(),
            threshold=5,
            evaluation_periods=2,
            alarm_description="Lambda function error rate is too high"
        )
        lambda_error_alarm.add_alarm_action(
            cw_actions.SnsAction(self.notification_topic)
        )
        
        # Lambda Duration Alarm
        lambda_duration_alarm = cloudwatch.Alarm(
            self, "LambdaDurationAlarm",
            metric=lambda_function.metric_duration(),
            threshold=25000,  # 25 seconds
            evaluation_periods=2,
            alarm_description="Lambda function duration is too high"
        )
        lambda_duration_alarm.add_alarm_action(
            cw_actions.SnsAction(self.notification_topic)
        )
        
        # DynamoDB Throttle Alarm
        dynamodb_throttle_alarm = cloudwatch.Alarm(
            self, "DynamoDbThrottleAlarm",
            metric=dynamodb_table.metric("ThrottledRequests"),
            threshold=0,
            evaluation_periods=1,
            alarm_description="DynamoDB requests are being throttled"
        )
        dynamodb_throttle_alarm.add_alarm_action(
            cw_actions.SnsAction(self.notification_topic)
        )
        
        # RDS CPU Utilization Alarm
        rds_cpu_alarm = cloudwatch.Alarm(
            self, "RdsCpuAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="CPUUtilization",
                dimensions_map={
                    "DBInstanceIdentifier": rds_instance.instance_identifier
                }
            ),
            threshold=80,
            evaluation_periods=2,
            alarm_description="RDS CPU utilization is too high"
        )
        rds_cpu_alarm.add_alarm_action(
            cw_actions.SnsAction(self.notification_topic)
        )
        
        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, "ProductionDashboard",
            dashboard_name="Production-Infrastructure-Dashboard"
        )
        
        # Add widgets to dashboard
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Metrics",
                left=[
                    lambda_function.metric_invocations(),
                    lambda_function.metric_errors(),
                    lambda_function.metric_duration()
                ],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="DynamoDB Metrics",
                left=[
                    dynamodb_table.metric("ConsumedReadCapacityUnits"),
                    dynamodb_table.metric("ConsumedWriteCapacityUnits")
                ],
                width=12
            )
        )
        
        # EventBridge Rule for Configuration Changes
        config_change_rule = events.Rule(
            self, "ConfigurationChangeRule",
            event_pattern=events.EventPattern(
                source=["aws.config"],
                detail_type=["Config Configuration Item Change"],
                detail={
                    "configurationItemStatus": ["ResourceDiscovered", "OK", "ResourceDeleted"]
                }
            ),
            description="Capture configuration changes for resources"
        )
        
        # Add SNS topic as target for configuration changes
        config_change_rule.add_target(
            targets.SnsTopic(
                self.notification_topic,
                message=events.RuleTargetInput.from_text(
                    "Configuration change detected: " + 
                    events.EventField.from_path("$.detail.resourceType") + 
                    " - " + 
                    events.EventField.from_path("$.detail.resourceId")
                )
            )
        )
        
        # Custom CloudWatch Metrics
        custom_metric_namespace = "Production/Infrastructure"
        
        # Create a custom metric filter for application logs
        log_metric_filter = cloudwatch.MetricFilter(
            self, "ApplicationErrorMetricFilter",
            log_group=lambda_function.log_group,
            metric_namespace=custom_metric_namespace,
            metric_name="ApplicationErrors",
            filter_pattern=cloudwatch.FilterPattern.literal("[timestamp, request_id, ERROR, ...]"),
            metric_value="1"
        )
        
        # Outputs
        CfnOutput(
            self, "SnsTopicArn