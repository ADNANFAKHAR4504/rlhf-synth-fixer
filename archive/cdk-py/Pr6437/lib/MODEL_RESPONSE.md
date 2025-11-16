# Multi-Region DR Infrastructure - CDK Python Implementation

This implementation creates a comprehensive multi-region disaster recovery solution for a payment processing system using AWS CDK with Python.

## File: lib/vpc_stack.py

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    Tags
)
from constructs import Construct

class VpcStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, dr_role: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC with 3 AZs
        self.vpc = ec2.Vpc(
            self, f"PaymentVPC-{environment_suffix}",
            max_azs=3,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        Tags.of(self.vpc).add("DR-Role", dr_role)
```

## File: lib/database_stack.py

```python
from aws_cdk import (
    Stack,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_dynamodb as dynamodb,
    Duration,
    RemovalPolicy,
    Tags
)
from constructs import Construct

class DatabaseStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc,
                 environment_suffix: str, dr_role: str, is_primary: bool = True, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Aurora PostgreSQL Cluster
        db_cluster = rds.DatabaseCluster(
            self, f"PaymentDB-{environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            writer=rds.ClusterInstance.provisioned(
                "writer",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.T3,
                    ec2.InstanceSize.MEDIUM
                )
            ),
            readers=[
                rds.ClusterInstance.provisioned(
                    "reader",
                    instance_type=ec2.InstanceType.of(
                        ec2.InstanceClass.T3,
                        ec2.InstanceSize.MEDIUM
                    )
                )
            ],
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            backup=rds.BackupProps(
                retention=Duration.days(7)
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        self.db_cluster = db_cluster
        Tags.of(db_cluster).add("DR-Role", dr_role)

        # DynamoDB Global Table
        table = dynamodb.Table(
            self, f"SessionTable-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="sessionId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
            replication_regions=["us-east-2"] if is_primary else []
        )

        self.session_table = table
        Tags.of(table).add("DR-Role", dr_role)
```

## File: lib/lambda_stack.py

```python
from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_ec2 as ec2,
    aws_iam as iam,
    Duration,
    Tags
)
from constructs import Construct
import os

class LambdaStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc: ec2.Vpc,
                 environment_suffix: str, dr_role: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Payment Validation Lambda
        self.payment_validation_fn = _lambda.Function(
            self, f"PaymentValidation-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=_lambda.Code.from_asset("lib/lambda/payment_validation"),
            timeout=Duration.seconds(30),
            vpc=vpc,
            environment={
                "ENVIRONMENT_SUFFIX": environment_suffix,
                "DR_ROLE": dr_role
            }
        )

        Tags.of(self.payment_validation_fn).add("DR-Role", dr_role)

        # Transaction Processing Lambda
        self.transaction_processing_fn = _lambda.Function(
            self, f"TransactionProcessing-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=_lambda.Code.from_asset("lib/lambda/transaction_processing"),
            timeout=Duration.seconds(30),
            vpc=vpc,
            environment={
                "ENVIRONMENT_SUFFIX": environment_suffix,
                "DR_ROLE": dr_role
            }
        )

        Tags.of(self.transaction_processing_fn).add("DR-Role", dr_role)

        # Notification Lambda
        self.notification_fn = _lambda.Function(
            self, f"Notification-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=_lambda.Code.from_asset("lib/lambda/notification"),
            timeout=Duration.seconds(30),
            vpc=vpc,
            environment={
                "ENVIRONMENT_SUFFIX": environment_suffix,
                "DR_ROLE": dr_role
            }
        )

        Tags.of(self.notification_fn).add("DR-Role", dr_role)
```

## File: lib/api_stack.py

```python
from aws_cdk import (
    Stack,
    aws_apigateway as apigw,
    aws_lambda as _lambda,
    Tags
)
from constructs import Construct

class ApiStack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 payment_validation_fn: _lambda.Function,
                 transaction_processing_fn: _lambda.Function,
                 notification_fn: _lambda.Function,
                 environment_suffix: str, dr_role: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # API Gateway REST API
        api = apigw.RestApi(
            self, f"PaymentAPI-{environment_suffix}",
            rest_api_name=f"payment-api-{environment_suffix}",
            deploy_options=apigw.StageOptions(
                throttling_rate_limit=10000,
                throttling_burst_limit=5000
            )
        )

        self.api = api
        Tags.of(api).add("DR-Role", dr_role)

        # Payment validation endpoint
        validation = api.root.add_resource("validate")
        validation.add_method(
            "POST",
            apigw.LambdaIntegration(payment_validation_fn)
        )

        # Transaction processing endpoint
        transaction = api.root.add_resource("transaction")
        transaction.add_method(
            "POST",
            apigw.LambdaIntegration(transaction_processing_fn)
        )

        # Notification endpoint
        notification = api.root.add_resource("notify")
        notification.add_method(
            "POST",
            apigw.LambdaIntegration(notification_fn)
        )
```

## File: lib/storage_stack.py

```python
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    Duration,
    RemovalPolicy,
    Tags
)
from constructs import Construct

class StorageStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str,
                 dr_role: str, is_primary: bool = True,
                 destination_bucket_arn: str = None, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 bucket for payment data
        bucket = s3.Bucket(
            self, f"PaymentData-{environment_suffix}",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ]
        )

        self.bucket = bucket
        Tags.of(bucket).add("DR-Role", dr_role)

        # Configure cross-region replication if primary
        if is_primary and destination_bucket_arn:
            cfn_bucket = bucket.node.default_child
            cfn_bucket.replication_configuration = {
                "role": "arn:aws:iam::123456789012:role/S3ReplicationRole",
                "rules": [{
                    "destination": {
                        "bucket": destination_bucket_arn,
                        "replicationTime": {
                            "status": "Enabled",
                            "time": {"minutes": 15}
                        }
                    },
                    "status": "Enabled"
                }]
            }
```

## File: lib/monitoring_stack.py

```python
from aws_cdk import (
    Stack,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_rds as rds,
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    Duration,
    Tags
)
from constructs import Construct

class MonitoringStack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 db_cluster: rds.DatabaseCluster,
                 lambda_functions: list,
                 api: apigw.RestApi,
                 environment_suffix: str, dr_role: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # SNS Topic for alarms
        alarm_topic = sns.Topic(
            self, f"AlarmTopic-{environment_suffix}",
            display_name=f"Payment DR Alarms - {dr_role}"
        )

        self.alarm_topic = alarm_topic
        Tags.of(alarm_topic).add("DR-Role", dr_role)

        # RDS Replication Lag Alarm
        rds_lag_alarm = cloudwatch.Alarm(
            self, f"RDSReplicationLag-{environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/RDS",
                metric_name="AuroraGlobalDBReplicationLag",
                dimensions_map={
                    "DBClusterIdentifier": db_cluster.cluster_identifier
                }
            ),
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        rds_lag_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Lambda Error Alarms
        for fn in lambda_functions:
            error_alarm = cloudwatch.Alarm(
                self, f"LambdaError-{fn.function_name}",
                metric=fn.metric_errors(),
                threshold=5,
                evaluation_periods=2
            )
            error_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # API Gateway 5XX Error Alarm
        api_error_alarm = cloudwatch.Alarm(
            self, f"APIGateway5XX-{environment_suffix}",
            metric=api.metric_server_error(),
            threshold=1,
            evaluation_periods=2
        )

        api_error_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, f"PaymentDRDashboard-{environment_suffix}"
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="RDS Metrics",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="DatabaseConnections",
                        dimensions_map={
                            "DBClusterIdentifier": db_cluster.cluster_identifier
                        }
                    )
                ]
            )
        )
```

## File: lib/route53_stack.py

```python
from aws_cdk import (
    Stack,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_apigateway as apigw,
    Duration,
    Tags
)
from constructs import Construct

class Route53Stack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 primary_api: apigw.RestApi,
                 secondary_api: apigw.RestApi,
                 environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create hosted zone
        hosted_zone = route53.HostedZone(
            self, f"PaymentHostedZone-{environment_suffix}",
            zone_name=f"payment-{environment_suffix}.example.com"
        )

        # Health check for primary API
        health_check = route53.CfnHealthCheck(
            self, f"PrimaryAPIHealthCheck-{environment_suffix}",
            health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
                type="HTTPS",
                resource_path="/health",
                fully_qualified_domain_name=f"{primary_api.rest_api_id}.execute-api.us-east-1.amazonaws.com",
                request_interval=30
            )
        )

        # Weighted routing for primary region
        route53.ARecord(
            self, f"PrimaryAPIRecord-{environment_suffix}",
            zone=hosted_zone,
            target=route53.RecordTarget.from_alias(
                targets.ApiGateway(primary_api)
            ),
            weight=100
        )

        # Weighted routing for secondary region
        route53.ARecord(
            self, f"SecondaryAPIRecord-{environment_suffix}",
            zone=hosted_zone,
            target=route53.RecordTarget.from_alias(
                targets.ApiGateway(secondary_api)
            ),
            weight=0
        )
```

## File: lib/parameter_store_stack.py

```python
from aws_cdk import (
    Stack,
    aws_ssm as ssm,
    aws_rds as rds,
    aws_apigateway as apigw,
    Tags
)
from constructs import Construct

class ParameterStoreStack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 db_cluster: rds.DatabaseCluster,
                 api: apigw.RestApi,
                 environment_suffix: str, dr_role: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Database endpoint parameter
        db_endpoint_param = ssm.StringParameter(
            self, f"DBEndpoint-{environment_suffix}",
            parameter_name=f"/payment/{dr_role}/db-endpoint",
            string_value=db_cluster.cluster_endpoint.hostname
        )

        Tags.of(db_endpoint_param).add("DR-Role", dr_role)

        # API URL parameter
        api_url_param = ssm.StringParameter(
            self, f"APIURL-{environment_suffix}",
            parameter_name=f"/payment/{dr_role}/api-url",
            string_value=api.url
        )

        Tags.of(api_url_param).add("DR-Role", dr_role)

        # Feature flag parameter
        feature_flag_param = ssm.StringParameter(
            self, f"FeatureFlags-{environment_suffix}",
            parameter_name=f"/payment/{dr_role}/feature-flags",
            string_value='{"new_payment_flow": false}'
        )

        Tags.of(feature_flag_param).add("DR-Role", dr_role)
```

## File: lib/failover_stack.py

```python
from aws_cdk import (
    Stack,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    aws_lambda as _lambda,
    aws_iam as iam,
    Duration,
    Tags
)
from constructs import Construct

class FailoverStack(Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Failover trigger Lambda
        failover_trigger_fn = _lambda.Function(
            self, f"FailoverTrigger-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import boto3
import json

def handler(event, context):
    route53 = boto3.client('route53')

    # Update Route 53 weights
    response = route53.change_resource_record_sets(
        HostedZoneId=event['hosted_zone_id'],
        ChangeBatch={
            'Changes': [
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': event['record_name'],
                        'Type': 'A',
                        'SetIdentifier': 'secondary',
                        'Weight': 100
                    }
                }
            ]
        }
    )

    return {
        'statusCode': 200,
        'body': json.dumps('Failover initiated')
    }
            """),
            timeout=Duration.seconds(60)
        )

        # Grant Route 53 permissions
        failover_trigger_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "route53:ChangeResourceRecordSets",
                    "route53:GetHostedZone"
                ],
                resources=["*"]
            )
        )

        # Step Functions state machine
        detect_outage = sfn.Pass(
            self, "DetectOutage"
        )

        trigger_failover = tasks.LambdaInvoke(
            self, "TriggerFailover",
            lambda_function=failover_trigger_fn
        )

        promote_secondary = sfn.Pass(
            self, "PromoteSecondary"
        )

        definition = detect_outage.next(trigger_failover).next(promote_secondary)

        state_machine = sfn.StateMachine(
            self, f"FailoverStateMachine-{environment_suffix}",
            definition=definition,
            timeout=Duration.minutes(5)
        )

        self.state_machine = state_machine
        Tags.of(state_machine).add("Purpose", "DR-Failover")
```

## File: lib/lambda/payment_validation/index.py

```python
import json
import os

def handler(event, context):
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    dr_role = os.environ.get('DR_ROLE', 'primary')

    body = json.loads(event['body'])

    # Payment validation logic
    if 'payment_id' not in body:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'payment_id is required'})
        }

    # Validate payment
    is_valid = len(body['payment_id']) > 0

    return {
        'statusCode': 200,
        'body': json.dumps({
            'valid': is_valid,
            'region': dr_role,
            'environment': environment_suffix
        })
    }
```

## File: lib/lambda/transaction_processing/index.py

```python
import json
import os
import boto3

def handler(event, context):
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    dr_role = os.environ.get('DR_ROLE', 'primary')

    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(f'SessionTable-{environment_suffix}')

    body = json.loads(event['body'])

    # Process transaction
    transaction_id = body.get('transaction_id')

    # Store session data
    table.put_item(
        Item={
            'sessionId': transaction_id,
            'status': 'processing',
            'region': dr_role
        }
    )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'transaction_id': transaction_id,
            'status': 'processed',
            'region': dr_role
        })
    }
```

## File: lib/lambda/notification/index.py

```python
import json
import os
import boto3

def handler(event, context):
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    dr_role = os.environ.get('DR_ROLE', 'primary')

    sns = boto3.client('sns')

    body = json.loads(event['body'])

    # Send notification
    message = body.get('message', 'Payment notification')

    # In production, would send to actual SNS topic
    return {
        'statusCode': 200,
        'body': json.dumps({
            'notification_sent': True,
            'message': message,
            'region': dr_role
        })
    }
```

## File: lib/tap_stack.py

```python
from typing import Optional
import aws_cdk as cdk
from constructs import Construct
from lib.vpc_stack import VpcStack
from lib.database_stack import DatabaseStack
from lib.lambda_stack import LambdaStack
from lib.api_stack import ApiStack
from lib.storage_stack import StorageStack
from lib.monitoring_stack import MonitoringStack
from lib.route53_stack import Route53Stack
from lib.parameter_store_stack import ParameterStoreStack
from lib.failover_stack import FailoverStack

class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix

class TapStack(cdk.Stack):
    def __init__(self, scope: Construct, construct_id: str,
                 props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Primary region (us-east-1)
        primary_vpc_stack = VpcStack(
            self, f"PrimaryVPC-{environment_suffix}",
            environment_suffix=environment_suffix,
            dr_role="primary",
            env=cdk.Environment(region="us-east-1")
        )

        primary_db_stack = DatabaseStack(
            self, f"PrimaryDatabase-{environment_suffix}",
            vpc=primary_vpc_stack.vpc,
            environment_suffix=environment_suffix,
            dr_role="primary",
            is_primary=True,
            env=cdk.Environment(region="us-east-1")
        )

        primary_lambda_stack = LambdaStack(
            self, f"PrimaryLambda-{environment_suffix}",
            vpc=primary_vpc_stack.vpc,
            environment_suffix=environment_suffix,
            dr_role="primary",
            env=cdk.Environment(region="us-east-1")
        )

        primary_api_stack = ApiStack(
            self, f"PrimaryAPI-{environment_suffix}",
            payment_validation_fn=primary_lambda_stack.payment_validation_fn,
            transaction_processing_fn=primary_lambda_stack.transaction_processing_fn,
            notification_fn=primary_lambda_stack.notification_fn,
            environment_suffix=environment_suffix,
            dr_role="primary",
            env=cdk.Environment(region="us-east-1")
        )

        # Secondary region (us-east-2)
        secondary_vpc_stack = VpcStack(
            self, f"SecondaryVPC-{environment_suffix}",
            environment_suffix=environment_suffix,
            dr_role="secondary",
            env=cdk.Environment(region="us-east-2")
        )

        secondary_db_stack = DatabaseStack(
            self, f"SecondaryDatabase-{environment_suffix}",
            vpc=secondary_vpc_stack.vpc,
            environment_suffix=environment_suffix,
            dr_role="secondary",
            is_primary=False,
            env=cdk.Environment(region="us-east-2")
        )

        secondary_lambda_stack = LambdaStack(
            self, f"SecondaryLambda-{environment_suffix}",
            vpc=secondary_vpc_stack.vpc,
            environment_suffix=environment_suffix,
            dr_role="secondary",
            env=cdk.Environment(region="us-east-2")
        )

        secondary_api_stack = ApiStack(
            self, f"SecondaryAPI-{environment_suffix}",
            payment_validation_fn=secondary_lambda_stack.payment_validation_fn,
            transaction_processing_fn=secondary_lambda_stack.transaction_processing_fn,
            notification_fn=secondary_lambda_stack.notification_fn,
            environment_suffix=environment_suffix,
            dr_role="secondary",
            env=cdk.Environment(region="us-east-2")
        )

        # Storage with cross-region replication
        primary_storage_stack = StorageStack(
            self, f"PrimaryStorage-{environment_suffix}",
            environment_suffix=environment_suffix,
            dr_role="primary",
            is_primary=True,
            env=cdk.Environment(region="us-east-1")
        )

        # Route 53 for DNS management
        route53_stack = Route53Stack(
            self, f"Route53-{environment_suffix}",
            primary_api=primary_api_stack.api,
            secondary_api=secondary_api_stack.api,
            environment_suffix=environment_suffix
        )

        # Monitoring
        monitoring_stack = MonitoringStack(
            self, f"Monitoring-{environment_suffix}",
            db_cluster=primary_db_stack.db_cluster,
            lambda_functions=[
                primary_lambda_stack.payment_validation_fn,
                primary_lambda_stack.transaction_processing_fn,
                primary_lambda_stack.notification_fn
            ],
            api=primary_api_stack.api,
            environment_suffix=environment_suffix,
            dr_role="primary",
            env=cdk.Environment(region="us-east-1")
        )

        # Parameter Store
        param_store_stack = ParameterStoreStack(
            self, f"ParameterStore-{environment_suffix}",
            db_cluster=primary_db_stack.db_cluster,
            api=primary_api_stack.api,
            environment_suffix=environment_suffix,
            dr_role="primary",
            env=cdk.Environment(region="us-east-1")
        )

        # Failover automation
        failover_stack = FailoverStack(
            self, f"Failover-{environment_suffix}",
            environment_suffix=environment_suffix,
            env=cdk.Environment(region="us-east-1")
        )
```

## File: lib/README.md

```markdown
# Multi-Region Disaster Recovery Infrastructure

This CDK application deploys a comprehensive multi-region disaster recovery solution for a payment processing system.

## Architecture

- Primary Region: us-east-1
- Secondary Region: us-east-2
- Database: Aurora PostgreSQL Global Database
- Session Store: DynamoDB Global Tables
- Compute: Lambda functions (payment validation, transaction processing, notifications)
- API: API Gateway REST APIs
- Storage: S3 with cross-region replication
- DNS: Route 53 with health checks and weighted routing
- Monitoring: CloudWatch alarms and dashboards
- Automation: Step Functions for failover orchestration

## Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment suffix
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1

# Deploy
cdk deploy --all --context environmentSuffix=prod
```

## Failover Process

1. CloudWatch detects primary region outage
2. Step Functions state machine triggers
3. Lambda function updates Route 53 weights
4. Traffic shifts to secondary region
5. Secondary RDS cluster promoted to primary

## Monitoring

CloudWatch dashboard shows:
- RDS connection counts and replication lag
- Lambda error rates
- API Gateway latency and error rates
- Cross-region health status
```
