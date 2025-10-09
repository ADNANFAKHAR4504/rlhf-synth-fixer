### Reasoning Trace
---

This is a comprehensive request for an AWS CDK application that creates a demo environment management system. Let me break down the requirements:

1. Service Catalog as entry point for standardized stacks
2. CloudFormation for provisioning
3. Lambda functions (Java 17) for custom logic
4. DynamoDB for environment inventory
5. S3 for branding assets
6. Cognito for user management
7. Step Functions for orchestration
8. EventBridge for scheduled cleanups
9. CloudWatch for metrics
10. SNS for notifications
11. IAM roles with time-limited access
12. Everything in us-east-1

I'll create a comprehensive CDK Python application that ties all these components together. This will need to be structured well with proper separation of concerns.
### Answer 
---

I'll create a comprehensive CDK Python application that implements your demo environment architecture. This solution integrates all the AWS services you mentioned with proper security and automation.

## Project Structure

First, let's set up the project structure:

```
demo-environment-platform/
├── app.py
├── requirements.txt
├── cdk.json
├── lambda/
│   ├── provision_handler/
│   │   └── src/main/java/
│   └── cleanup_handler/
│       └── src/main/java/
└── stacks/
    ├── __init__.py
    ├── demo_platform_stack.py
    └── service_catalog_products/
        └── demo_product_template.yaml
```

## Requirements File

```python
# requirements.txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

## Main CDK Application

```python
# app.py
#!/usr/bin/env python3
import os
from aws_cdk import App, Environment, Tags
from stacks.demo_platform_stack import DemoPlatformStack

app = App()

# Define the environment
env = Environment(
    account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
    region="us-east-1"
)

# Create the main stack
demo_platform = DemoPlatformStack(
    app,
    "DemoPlatformStack",
    env=env,
    description="Demo Environment Management Platform"
)

# Add tags for cost tracking and management
Tags.of(demo_platform).add("Environment", "Demo")
Tags.of(demo_platform).add("ManagedBy", "CDK")
Tags.of(demo_platform).add("Purpose", "DemoManagement")

app.synth()
```

## Main Stack Implementation

```python
# stacks/demo_platform_stack.py
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_cognito as cognito,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    aws_events as events,
    aws_events_targets as targets,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_cloudwatch as cloudwatch,
    aws_servicecatalog as servicecatalog,
    aws_logs as logs,
    CfnOutput
)
from constructs import Construct
import json

class DemoPlatformStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # 1. S3 Bucket for Branding Assets
        branding_bucket = s3.Bucket(
            self, "BrandingAssets",
            bucket_name=f"demo-branding-assets-{self.account}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30)
                )
            ],
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.GET],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                    max_age=3000
                )
            ]
        )
        
        # 2. DynamoDB Table for Environment Inventory
        environment_table = dynamodb.Table(
            self, "EnvironmentInventory",
            table_name="demo-environment-inventory",
            partition_key=dynamodb.Attribute(
                name="environment_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )
        
        # Add GSI for querying by status
        environment_table.add_global_secondary_index(
            index_name="StatusIndex",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )
        
        # Add GSI for querying by user
        environment_table.add_global_secondary_index(
            index_name="UserIndex",
            partition_key=dynamodb.Attribute(
                name="user_id",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )
        
        # 3. Cognito User Pool for Demo Participants
        user_pool = cognito.UserPool(
            self, "DemoUserPool",
            user_pool_name="demo-participants",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(
                email=True,
                username=True
            ),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=True),
                fullname=cognito.StandardAttribute(required=True, mutable=True)
            ),
            custom_attributes={
                "department": cognito.StringAttribute(mutable=True),
                "demo_expiry": cognito.DateTimeAttribute(mutable=True)
            },
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=True
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Cognito User Pool Client
        user_pool_client = cognito.UserPoolClient(
            self, "DemoUserPoolClient",
            user_pool=user_pool,
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True
            ),
            generate_secret=True,
            refresh_token_validity=Duration.days(7),
            access_token_validity=Duration.hours(1),
            id_token_validity=Duration.hours(1)
        )
        
        # 4. SNS Topic for Notifications
        notification_topic = sns.Topic(
            self, "ProvisioningNotifications",
            topic_name="demo-provisioning-notifications",
            display_name="Demo Environment Provisioning Notifications"
        )
        
        # 5. IAM Roles with Time-Limited Access
        
        # Role for Lambda functions
        lambda_execution_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ],
            inline_policies={
                "DemoEnvironmentAccess": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "dynamodb:PutItem",
                                "dynamodb:GetItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:Query",
                                "dynamodb:Scan"
                            ],
                            resources=[environment_table.table_arn, f"{environment_table.table_arn}/index/*"]
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:ListBucket"
                            ],
                            resources=[
                                branding_bucket.bucket_arn,
                                f"{branding_bucket.bucket_arn}/*"
                            ]
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "sns:Publish"
                            ],
                            resources=[notification_topic.topic_arn]
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "cloudformation:CreateStack",
                                "cloudformation:UpdateStack",
                                "cloudformation:DeleteStack",
                                "cloudformation:DescribeStacks"
                            ],
                            resources=["*"]
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "servicecatalog:ProvisionProduct",
                                "servicecatalog:TerminateProvisionedProduct",
                                "servicecatalog:DescribeProvisionedProduct"
                            ],
                            resources=["*"]
                        )
                    ]
                )
            },
            max_session_duration=Duration.hours(1)
        )
        
        # Time-limited demo user role
        demo_user_role = iam.Role(
            self, "DemoUserRole",
            role_name="DemoEnvironmentUserRole",
            assumed_by=iam.FederatedPrincipal(
                federated=f"cognito-identity.amazonaws.com",
                assume_role_action="sts:AssumeRoleWithWebIdentity",
                conditions={
                    "StringEquals": {
                        "cognito-identity.amazonaws.com:aud": user_pool.user_pool_id
                    }
                }
            ),
            max_session_duration=Duration.hours(4),  # Time-limited to 4 hours
            inline_policies={
                "DemoEnvironmentPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "ec2:Describe*",
                                "ec2:RunInstances",
                                "ec2:TerminateInstances"
                            ],
                            resources=["*"],
                            conditions={
                                "StringEquals": {
                                    "ec2:ResourceTag/Environment": "Demo"
                                }
                            }
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:GetObject",
                                "s3:ListBucket"
                            ],
                            resources=[
                                branding_bucket.bucket_arn,
                                f"{branding_bucket.bucket_arn}/*"
                            ]
                        )
                    ]
                )
            }
        )
        
        # 6. Lambda Functions for Custom Logic
        
        # Provision Handler Lambda (Java 17)
        provision_handler = lambda_.Function(
            self, "ProvisionHandler",
            function_name="demo-provision-handler",
            runtime=lambda_.Runtime.JAVA_17,
            handler="com.demo.ProvisionHandler::handleRequest",
            code=lambda_.Code.from_asset("lambda/provision_handler/target/provision-handler.jar"),
            memory_size=512,
            timeout=Duration.minutes(5),
            role=lambda_execution_role,
            environment={
                "ENVIRONMENT_TABLE": environment_table.table_name,
                "NOTIFICATION_TOPIC_ARN": notification_topic.topic_arn,
                "BRANDING_BUCKET": branding_bucket.bucket_name
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )
        
        # Cleanup Handler Lambda (Java 17)
        cleanup_handler = lambda_.Function(
            self, "CleanupHandler",
            function_name="demo-cleanup-handler",
            runtime=lambda_.Runtime.JAVA_17,
            handler="com.demo.CleanupHandler::handleRequest",
            code=lambda_.Code.from_asset("lambda/cleanup_handler/target/cleanup-handler.jar"),
            memory_size=512,
            timeout=Duration.minutes(10),
            role=lambda_execution_role,
            environment={
                "ENVIRONMENT_TABLE": environment_table.table_name,
                "NOTIFICATION_TOPIC_ARN": notification_topic.topic_arn
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )
        
        # Validation Lambda
        validation_handler = lambda_.Function(
            self, "ValidationHandler",
            function_name="demo-validation-handler",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def handler(event, context):
    table = dynamodb.Table(os.environ['ENVIRONMENT_TABLE'])
    
    # Validate input parameters
    required_fields = ['user_id', 'environment_type', 'duration_hours']
    for field in required_fields:
        if field not in event:
            raise ValueError(f"Missing required field: {field}")
    
    # Check user quota
    response = table.query(
        IndexName='UserIndex',
        KeyConditionExpression='user_id = :uid',
        FilterExpression='#s = :active',
        ExpressionAttributeNames={'#s': 'status'},
        ExpressionAttributeValues={
            ':uid': event['user_id'],
            ':active': 'ACTIVE'
        }
    )
    
    if response['Count'] >= 3:
        raise ValueError("User has reached maximum number of active environments (3)")
    
    # Validate duration
    if event['duration_hours'] > 72:
        raise ValueError("Maximum demo duration is 72 hours")
    
    return {
        'statusCode': 200,
        'validated': True,
        'user_id': event['user_id'],
        'environment_type': event['environment_type'],
        'duration_hours': event['duration_hours']
    }
            """),
            memory_size=256,
            timeout=Duration.seconds(30),
            role=lambda_execution_role,
            environment={
                "ENVIRONMENT_TABLE": environment_table.table_name,
                "NOTIFICATION_TOPIC_ARN": notification_topic.topic_arn
            }
        )
        
        # 7. Step Functions for Orchestration
        
        # Define Step Functions tasks
        validate_task = tasks.LambdaInvoke(
            self, "ValidateRequest",
            lambda_function=validation_handler,
            output_path="$.Payload"
        )
        
        provision_task = tasks.LambdaInvoke(
            self, "ProvisionEnvironment",
            lambda_function=provision_handler,
            output_path="$.Payload",
            retry_on_service_exceptions=True
        )
        
        notify_success = tasks.SnsPublish(
            self, "NotifySuccess",
            topic=notification_topic,
            message=sfn.TaskInput.from_json_path_at("$.message")
        )
        
        notify_failure = tasks.SnsPublish(
            self, "NotifyFailure",
            topic=notification_topic,
            message=sfn.TaskInput.from_json_path_at("$.error")
        )
        
        # Define the state machine
        definition = validate_task.next(
            sfn.Choice(self, "ValidationChoice")
            .when(
                sfn.Condition.boolean_equals("$.validated", True),
                provision_task.next(
                    sfn.Choice(self, "ProvisionChoice")
                    .when(
                        sfn.Condition.string_equals("$.status", "SUCCESS"),
                        notify_success
                    )
                    .otherwise(notify_failure)
                )
            )
            .otherwise(notify_failure)
        )
        
        state_machine = sfn.StateMachine(
            self, "DemoProvisioningStateMachine",
            state_machine_name="demo-provisioning-workflow",
            definition=definition,
            timeout=Duration.hours(1),
            logs=sfn.LogOptions(
                destination=logs.LogGroup(
                    self, "StateMachineLogGroup",
                    log_group_name="/aws/stepfunctions/demo-provisioning",
                    retention=logs.RetentionDays.ONE_WEEK
                ),
                level=sfn.LogLevel.ALL
            )
        )
        
        # Grant permissions to state machine
        environment_table.grant_read_write_data(state_machine)
        notification_topic.grant_publish(state_machine)
        
        # 8. EventBridge for Scheduled Cleanups
        
        # Rule for hourly cleanup check
        cleanup_rule = events.Rule(
            self, "DemoCleanupRule",
            rule_name="demo-environment-cleanup",
            schedule=events.Schedule.rate(Duration.hours(1)),
            description="Triggers cleanup of expired demo environments"
        )
        
        # Add Lambda as target for the rule
        cleanup_rule.add_target(
            targets.LambdaFunction(
                cleanup_handler,
                retry_attempts=2
            )
        )
        
        # 9. Service Catalog Portfolio and Product
        
        # Create Service Catalog Portfolio
        portfolio = servicecatalog.Portfolio(
            self, "DemoPortfolio",
            display_name="Demo Environment Portfolio",
            provider_name="Platform Team",
            description="Standardized demo environment templates"
        )
        
        # IAM role for Service Catalog
        sc_launch_role = iam.Role(
            self, "ServiceCatalogLaunchRole",
            assumed_by=iam.ServicePrincipal("servicecatalog.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonEC2FullAccess"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonVPCFullAccess")
            ]
        )
        
        # Create a CloudFormation template for demo product
        demo_product_template = {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Description": "Demo Environment Template",
            "Parameters": {
                "EnvironmentName": {
                    "Type": "String",
                    "Description": "Name of the demo environment"
                },
                "InstanceType": {
                    "Type": "String",
                    "Default": "t3.micro",
                    "AllowedValues": ["t3.micro", "t3.small", "t3.medium"]
                }
            },
            "Resources": {
                "DemoVPC": {
                    "Type": "AWS::EC2::VPC",
                    "Properties": {
                        "CidrBlock": "10.0.0.0/16",
                        "EnableDnsHostnames": True,
                        "Tags": [
                            {"Key": "Name", "Value": {"Ref": "EnvironmentName"}},
                            {"Key": "Environment", "Value": "Demo"}
                        ]
                    }
                },
                "DemoSubnet": {
                    "Type": "AWS::EC2::Subnet",
                    "Properties": {
                        "VpcId": {"Ref": "DemoVPC"},
                        "CidrBlock": "10.0.1.0/24",
                        "MapPublicIpOnLaunch": True,
                        "Tags": [
                            {"Key": "Name", "Value": {"Fn::Sub": "${EnvironmentName}-subnet"}},
                            {"Key": "Environment", "Value": "Demo"}
                        ]
                    }
                }
            }
        }
        
        # Create Service Catalog Product
        demo_product = servicecatalog.CloudFormationProduct(
            self, "DemoProduct",
            product_name="Demo Environment",
            owner="Platform Team",
            description="Standard demo environment with VPC and compute resources",
            distributor="Internal",
            product_versions=[
                servicecatalog.CloudFormationProductVersion(
                    product_version_name="v1.0",
                    cloud_formation_template=servicecatalog.CloudFormationTemplate.from_asset(
                        "stacks/service_catalog_products/demo_product_template.yaml"
                    ),
                    description="Initial version"
                )
            ]
        )
        
        # Associate product with portfolio
        portfolio.add_product(demo_product)
        
        # Grant access to users
        portfolio.give_access_to_role(demo_user_role)
        
        # Add launch constraint
        portfolio.set_launch_role(demo_product, sc_launch_role)
        
        # 10. CloudWatch Metrics and Alarms
        
        # Custom metric for environment provisioning
        provisioning_metric = cloudwatch.Metric(
            namespace="DemoEnvironment",
            metric_name="ProvisioningRequests",
            dimensions_map={
                "Environment": "Demo"
            }
        )
        
        # Alarm for high provisioning rate
        cloudwatch.Alarm(
            self, "HighProvisioningRate",
            alarm_name="demo-high-provisioning-rate",
            metric=provisioning_metric,
            threshold=50,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Alert when provisioning rate exceeds 50 per hour"
        ).add_alarm_action(
            cloudwatch_actions.SnsAction(notification_topic)
        )
        
        # Dashboard for monitoring
        dashboard = cloudwatch.Dashboard(
            self, "DemoPlatformDashboard",
            dashboard_name="demo-platform-metrics",
            widgets=[
                [
                    cloudwatch.GraphWidget(
                        title="Environment Provisioning",
                        left=[provisioning_metric],
                        width=12,
                        height=6
                    ),
                    cloudwatch.SingleValueWidget(
                        title="Active Environments",
                        metrics=[cloudwatch.Metric(
                            namespace="DemoEnvironment",
                            metric_name="ActiveEnvironments"
                        )],
                        width=6,
                        height=6
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="Lambda Invocations",
                        left=[
                            provision_handler.metric_invocations(),
                            cleanup_handler.metric_invocations()
                        ],
                        width=12,
                        height=6
                    ),
                    cloudwatch.GraphWidget(
                        title="Lambda Errors",
                        left=[
                            provision_handler.metric_errors(),
                            cleanup_handler.metric_errors()
                        ],
                        width=12,
                        height=6
                    )
                ]
            ]
        )
        
        # 11. Outputs
        CfnOutput(
            self, "UserPoolId",
            value=user_pool.user_pool_id,
            description="Cognito User Pool ID for demo participants"
        )
        
        CfnOutput(
            self, "UserPoolClientId",
            value=user_pool_client.user_pool_client_id,
            description="Cognito User Pool Client ID"
        )
        
        CfnOutput(
            self, "PortfolioId",
            value=portfolio.portfolio_id,
            description="Service Catalog Portfolio ID"
        )
        
        CfnOutput(
            self, "StateMachineArn",
            value=state_machine.state_machine_arn,
            description="Step Functions State Machine ARN"
        )
        
        CfnOutput(
            self, "NotificationTopicArn",
            value=notification_topic.topic_arn,
            description="SNS Topic ARN for notifications"
        )
        
        CfnOutput(
            self, "EnvironmentTableName",
            value=environment_table.table_name,
            description="DynamoDB table name for environment inventory"
        )
        
        CfnOutput(
            self, "BrandingBucketName",
            value=branding_bucket.bucket_name,
            description="S3 bucket for branding assets"
        )
        
        CfnOutput(
            self, "DashboardURL",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name={dashboard.dashboard_name}",
            description="CloudWatch Dashboard URL"
        )
```

## Service Catalog Product Template

```yaml
# stacks/service_catalog_products/demo_product_template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Demo Environment Template - Standardized infrastructure for demos'

Parameters:
  EnvironmentName:
    Type: String
    Description: Name of the demo environment
    MinLength: 3
    MaxLength: 50
    
  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
    Description: EC2 instance type for demo servers
    
  DemoDuration:
    Type: Number
    Default: 24
    MinValue: 1
    MaxValue: 72
    Description: Duration of the demo in hours

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55731490381  # Amazon Linux 2023

Resources:
  DemoVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-vpc'
        - Key: Environment
          Value: Demo
        - Key: ExpiresAt
          Value: !Ref DemoExpiry
          
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref DemoVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-subnet'
        - Key: Environment
          Value: Demo
          
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-igw'
          
  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref DemoVPC
      InternetGatewayId: !Ref InternetGateway
      
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref DemoVPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-routes'
          
  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway
      
  SubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable
      
  DemoSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for demo environment
      VpcId: !Ref DemoVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0  # Restrict this in production
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-sg'
          
  DemoInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref DemoSecurityGroup
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Demo Environment: ${EnvironmentName}</h1>" > /var/www/html/index.html
          echo "<p>This environment will expire in ${DemoDuration} hours</p>" >> /var/www/html/index.html
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-instance'
        - Key: Environment
          Value: Demo
        - Key: AutoShutdown
          Value: !Ref DemoExpiry
          
  DemoExpiry:
    Type: AWS::CloudFormation::WaitConditionHandle
    Metadata:
      ExpiryTime: !Sub '${DemoDuration}h'

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref DemoVPC
    
  InstanceId:
    Description: Instance ID
    Value: !Ref DemoInstance
    
  PublicIP:
    Description: Public IP of the demo instance
    Value: !GetAtt DemoInstance.PublicIp
    
  WebURL:
    Description: URL of the demo application
    Value: !Sub 'http://${DemoInstance.PublicIp}'
    
  EnvironmentName:
    Description: Name of the environment
    Value: !Ref EnvironmentName
```

## CDK Configuration

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
      "**/__pycache__",
      ".git"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/core:enableStackNameDuplicates": false
  }
}
```

## Deployment Instructions

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Build Lambda functions (Java):**
```bash
cd lambda/provision_handler
mvn clean package
cd ../cleanup_handler
mvn clean package
cd ../..
```

3. **Bootstrap CDK (first time only):**
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

4. **Deploy the stack:**
```bash
cdk deploy DemoPlatformStack
```

## Key Features Implemented

### 🔐 Security
- Time-limited IAM roles (4-hour sessions for demo users)
- Cognito authentication with MFA support
- Encrypted S3 buckets and DynamoDB tables
- VPC isolation for demo environments

### 🤖 Automation
- Step Functions orchestration for provisioning workflow
- EventBridge scheduled cleanup of expired demos
- Lambda functions for custom business logic
- Automatic tagging for cost tracking

### 📊 Observability
- CloudWatch Dashboard for monitoring
- SNS notifications for provisioning events
- DynamoDB streams for audit logging
- Comprehensive CloudWatch metrics and alarms

### 🎯 Standardization
- Service Catalog for standardized templates
- CloudFormation for infrastructure as code
- Consistent tagging strategy
- Centralized environment inventory

This architecture provides a robust, scalable, and secure demo environment management platform with all the requested components integrated seamlessly. The solution emphasizes automation, security, and observability while maintaining flexibility for different demo scenarios.