```python
# __main__.py
import pulumi
import pulumi_aws as aws

# Set the AWS region
aws.config.region = "us-west-2"

# Import modules
from modules.dynamodb import create_dynamodb_table
from modules.sns import create_sns_topic
from modules.s3 import create_s3_bucket
from modules.lambda_function import create_lambda_function
from modules.api_gateway import create_api_gateway
from modules.iam import create_lambda_role, create_lambda_policy
from modules.cloudwatch import create_cloudwatch_alarm
from modules.step_functions import create_step_function
from modules.waf import create_waf_acl
from modules.config import setup_aws_config

# Common tags for all resources
tags = {
    "Project": "ServerlessApp"
}

# Create resources
dynamodb_table = create_dynamodb_table(tags)
sns_topic = create_sns_topic(tags)
s3_bucket = create_s3_bucket(tags)

lambda_role = create_lambda_role(dynamodb_table.name, tags)
lambda_policy = create_lambda_policy(lambda_role, dynamodb_table.arn, sns_topic.arn, tags)

lambda_function = create_lambda_function(lambda_role, dynamodb_table.name, sns_topic.arn, tags)
api_gateway = create_api_gateway(lambda_function, tags)
cloudwatch_alarm = create_cloudwatch_alarm(lambda_function.name, sns_topic.arn, tags)
step_function = create_step_function(lambda_function.arn, tags)
waf_acl = create_waf_acl(api_gateway.id, tags)
config = setup_aws_config(tags)

# Export outputs
pulumi.export('api_gateway_url', api_gateway.api_endpoint)
pulumi.export('dynamodb_table_name', dynamodb_table.name)
pulumi.export('sns_topic_arn', sns_topic.arn)
pulumi.export('s3_bucket_name', s3_bucket.id)
pulumi.export('lambda_function_name', lambda_function.name)
pulumi.export('step_function_arn', step_function.arn)
```

Now, let's create the individual modules for each component:

1. DynamoDB Module:

```python
# modules/dynamodb.py
import pulumi_aws as aws

def create_dynamodb_table(tags):
    table = aws.dynamodb.Table("serverless-table",
        attributes=[
            aws.dynamodb.TableAttributeArgs(
                name="id",
                type="S",
            ),
        ],
        hash_key="id",
        billing_mode="PAY_PER_REQUEST",  # On-demand capacity mode
        server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
            enabled=True,  # AWS-managed keys
        ),
        tags=tags,
    )
    return table
```

2. SNS Module:

```python
# modules/sns.py
import pulumi_aws as aws

def create_sns_topic(tags):
    topic = aws.sns.Topic("critical-alerts",
        tags=tags,
    )
    return topic
```

3. S3 Module:

```python
# modules/s3.py
import pulumi_aws as aws

def create_s3_bucket(tags):
    bucket = aws.s3.Bucket("static-assets",
        versioning=aws.s3.BucketVersioningArgs(
            enabled=True,
        ),
        server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
            rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                ),
            ),
        ),
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        tags=tags,
    )
    return bucket
```

4. IAM Module:

```python
# modules/iam.py
import pulumi_aws as aws
import json

def create_lambda_role(dynamodb_table_name, tags):
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
        }]
    })

    role = aws.iam.Role("lambda-role",
        assume_role_policy=assume_role_policy,
        tags=tags,
    )

    # Attach AWS managed policy for Lambda basic execution
    aws.iam.RolePolicyAttachment("lambda-basic-execution",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    )

    # Attach AWS managed policy for X-Ray tracing
    aws.iam.RolePolicyAttachment("lambda-xray",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
    )

    return role

def create_lambda_policy(role, dynamodb_table_arn, sns_topic_arn, tags):
    # Create a custom policy for DynamoDB access with least privileges
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                "Resource": [
                    dynamodb_table_arn,
                    f"{dynamodb_table_arn}/index/*"
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "sns:Publish"
                ],
                "Resource": sns_topic_arn
            }
        ]
    }

    policy = aws.iam.Policy("lambda-custom-policy",
        policy=json.dumps(policy_document),
        tags=tags,
    )

    attachment = aws.iam.RolePolicyAttachment("lambda-custom-policy-attachment",
        role=role.name,
        policy_arn=policy.arn,
    )

    return policy
```

5. Lambda Function Module:

```python
# modules/lambda_function.py
import pulumi_aws as aws
import pulumi

def create_lambda_function(role, dynamodb_table_name, sns_topic_arn, tags):
    # Lambda function code as an asset
    code = pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda_code"),  # Assuming lambda_code directory contains your Lambda function code
    })

    lambda_function = aws.lambda_.Function("api-handler",
        role=role.arn,
        runtime="python3.11",  # Latest available Python runtime
        handler="main.handler",
        code=code,
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables={
                "DYNAMODB_TABLE": dynamodb_table_name,
                "SNS_TOPIC_ARN": sns_topic_arn,
                "ENVIRONMENT": "production",
            },
        ),
        tracing_config=aws.lambda_.FunctionTracingConfigArgs(
            mode="Active",  # Enable X-Ray tracing
        ),
        tags=tags,
    )

    return lambda_function
```

6. API Gateway Module:

```python
# modules/api_gateway.py
import pulumi_aws as aws

def create_api_gateway(lambda_function, tags):
    # Create a REST API
    rest_api = aws.apigateway.RestApi("api",
        description="Serverless API Gateway",
        endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
            types=["REGIONAL"],
        ),
        tags=tags,
    )

    # Create a resource and method for the API
    resource = aws.apigateway.Resource("api-resource",
        rest_api=rest_api.id,
        parent_id=rest_api.root_resource_id,
        path_part="items",
    )

    method = aws.apigateway.Method("api-method",
        rest_api=rest_api.id,
        resource_id=resource.id,
        http_method="POST",
        authorization="NONE",
        api_key_required=False,
    )

    # Create an integration to connect API Gateway to Lambda
    integration = aws.apigateway.Integration("api-integration",
        rest_api=rest_api.id,
        resource_id=resource.id,
        http_method=method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=lambda_function.invoke_arn,
    )

    # Add a permission for API Gateway to invoke Lambda
    permission = aws.lambda_.Permission("api-lambda-permission",
        action="lambda:InvokeFunction",
        function=lambda_function.name,
        principal="apigateway.amazonaws.com",
        source_arn=method.execution_arn,
    )

    # Deploy the API
    deployment = aws.apigateway.Deployment("api-deployment",
        rest_api=rest_api.id,
        description="Initial deployment",
        stage_name="v1",
        opts=pulumi.ResourceOptions(depends_on=[integration]),
    )

    # Create an API Gateway resource policy to restrict access to specific IP addresses
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": "*",
                "Action": "execute-api:Invoke",
                "Resource": f"arn:aws:execute-api:us-west-2:*:{rest_api.id}/*/*/*"
            },
            {
                "Effect": "Deny",
                "Principal": "*",
                "Action": "execute-api:Invoke",
                "Resource": f"arn:aws:execute-api:us-west-2:*:{rest_api.id}/*/*/*",
                "Condition": {
                    "NotIpAddress": {
                        "aws:SourceIp": [
                            "192.0.2.0/24",  # Example allowed IP range, replace with actual
                            "198.51.100.0/24"  # Another example allowed IP range
                        ]
                    }
                }
            }
        ]
    }

    # Apply the resource policy to the REST API
    rest_api.policy = policy_document

    return rest_api
```

7. CloudWatch Module:

```python
# modules/cloudwatch.py
import pulumi_aws as aws

def create_cloudwatch_alarm(lambda_function_name, sns_topic_arn, tags):
    # Create CloudWatch Alarm for Lambda errors
    alarm = aws.cloudwatch.MetricAlarm("lambda-error-alarm",
        comparison_operator="GreaterThanOrEqualToThreshold",
        evaluation_periods=1,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=300,  # 5 minutes
        statistic="Sum",
        threshold=10,  # Alert when there are 10 or more errors
        alarm_description=f"Alarm when {lambda_function_name} has more than 10 errors in 5 minutes",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "FunctionName": lambda_function_name,
        },
        tags=tags,
    )

    return alarm
```

8. Step Functions Module:

```python
# modules/step_functions.py
import pulumi_aws as aws
import json

def create_step_function(lambda_arn, tags):
    # Create a simple Step Function that invokes the Lambda function
    definition = {
        "Comment": "A simple workflow that invokes a Lambda function",
        "StartAt": "InvokeLambda",
        "States": {
            "InvokeLambda": {
                "Type": "Task",
                "Resource": lambda_arn,
                "End": True
            }
        }
    }

    # Create the IAM role for Step Functions
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "states.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    })

    role = aws.iam.Role("step-function-role",
        assume_role_policy=assume_role_policy,
        tags=tags,
    )

    # Attach the necessary policy for Step Functions to invoke Lambda
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": lambda_arn
        }]
    }

    policy = aws.iam.Policy("step-function-policy",
        policy=json.dumps(policy_document),
        tags=tags,
    )

    attachment = aws.iam.RolePolicyAttachment("step-function-policy-attachment",
        role=role.name,
        policy_arn=policy.arn,
    )

    # Create the Step Function
    step_function = aws.sfn.StateMachine("workflow",
        role_arn=role.arn,
        definition=json.dumps(definition),
        tags=tags,
    )

    return step_function
```

9. AWS WAF Module:

```python
# modules/waf.py
import pulumi_aws as aws

def create_waf_acl(api_gateway_id, tags):
    # Create a WAF WebACL
    web_acl = aws.wafv2.WebAcl("api-waf",
        scope="REGIONAL",
        default_action=aws.wafv2.WebAclDefaultActionArgs(
            allow=aws.wafv2.WebAclDefaultActionAllowArgs(),
        ),
        visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
            cloud_watch_metrics_enabled=True,
            metric_name="ApiWafAcl",
            sampled_requests_enabled=True,
        ),
        rules=[
            aws.wafv2.WebAclRuleArgs(
                name="RateLimit",
                priority=1,
                action=aws.wafv2.WebAclRuleActionArgs(
                    block=aws.wafv2.WebAclRuleActionBlockArgs(),
                ),
                statement=aws.wafv2.WebAclRuleStatementArgs(
                    rate_based_statement=aws.wafv2.WebAclRuleStatementRateBasedStatementArgs(
                        limit=1000,  # Limit to 1000 requests per 5 minutes per IP
                        aggregate_key_type="IP",
                    ),
                ),
                visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                    cloud_watch_metrics_enabled=True,
                    metric_name="RateLimit",
                    sampled_requests_enabled=True,
                ),
            ),
            aws.wafv2.WebAclRuleArgs(
                name="AWSManagedRulesCommonRuleSet",
                priority=2,
                statement=aws.wafv2.WebAclRuleStatementArgs(
                    managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                        name="AWSManagedRulesCommonRuleSet",
                        vendor_name="AWS",
                    ),
                ),
                override_action=aws.wafv2.WebAclRuleOverrideActionArgs(
                    none=aws.wafv2.WebAclRuleOverrideActionNoneArgs(),
                ),
                visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                    cloud_watch_metrics_enabled=True,
                    metric_name="AWSManagedRulesCommonRuleSet",
                    sampled_requests_enabled=True,
                ),
            ),
        ],
        tags=tags,
    )

    # Associate the WAF WebACL with the API Gateway stage
    association = aws.wafv2.WebAclAssociation("api-waf-association",
        resource_arn=f"arn:aws:apigateway:us-west-2::/restapis/{api_gateway_id}/stages/v1",
        web_acl_arn=web_acl.arn,
    )

    return web_acl
```

10. AWS Config Module:

```python
# modules/config.py
import pulumi_aws as aws

def setup_aws_config(tags):
    # Create an IAM role for AWS Config
    assume_role_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "config.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
        }]
    }

    role = aws.iam.Role("config-role",
        assume_role_policy=assume_role_policy,
        tags=tags,
    )

    # Attach AWS managed policy for AWS Config
    aws.iam.RolePolicyAttachment("config-policy-attachment",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
    )

    # Create a delivery channel for AWS Config
    s3_bucket = aws.s3.Bucket("config-bucket",
        tags=tags,
        acl="private",
        server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
            rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                ),
            ),
        ),
    )

    # Create an AWS Config configuration recorder
    recorder = aws.config.ConfigurationRecorder("config-recorder",
        role_arn=role.arn,
        recording_group=aws.config.ConfigurationRecorderRecordingGroupArgs(
            all_supported=True,
            include_global_resource_types=True,
        ),
    )

    # Create a delivery channel
    delivery_channel = aws.config.DeliveryChannel("config-delivery-channel",
        s3_bucket_name=s3_bucket.id,
    )

    # Create a AWS Config rule to ensure IAM roles have specific permissions
    config_rule = aws.config.Rule("iam-role-rule",
        source=aws.config.RuleSourceArgs(
            owner="AWS",
            source_identifier="IAM_ROLE_MANAGED_POLICY_CHECK",
        ),
        input_parameters="""
        {
            "policyARNs": "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole,arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        }
        """,
        depends_on=[delivery_channel],
        tags=tags,
    )

    return config_rule
```

Finally, let's create a sample Lambda function code directory structure for reference:

```
lambda_code/
    main.py
    requirements.txt
```

```python
# lambda_code/main.py
import json
import os
import boto3
import logging
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Enable X-Ray tracing for AWS SDK calls
patch_all()

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

# Initialize SNS client
sns = boto3.client('sns')
sns_topic_arn = os.environ['SNS_TOPIC_ARN']

@xray_recorder.capture('handler')
def handler(event, context):
    """
    Lambda handler function that processes API Gateway requests.
    """
    try:
        logger.info("Event received: %s", json.dumps(event))

        # Extract data from the event
        body = json.loads(event.get('body', '{}'))
        item_id = body.get('id')

        if not item_id:
            logger.error("Missing required parameter 'id'")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': "Missing required parameter 'id'"})
            }

        # Example operation: Put the item in DynamoDB
        item = {
            'id': item_id,
            'data': body.get('data', ''),
            'timestamp': str(datetime.datetime.now())
        }

        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Item created successfully', 'id': item_id})
        }

    except Exception as e:
        error_message = str(e)
        logger.error("Error: %s", error_message)

        # Publish error to SNS topic
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject='Lambda Function Error',
            Message=f'Error in Lambda function: {error_message}'
        )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal Server Error'})
        }
```

```
# lambda_code/requirements.txt
boto3==1.28.0
aws-xray-sdk==2.12.0
```

Now let's create a Pulumi.yaml file to define the project:

```yaml
# Pulumi.yaml
name: serverless-app
runtime: python
description: A secure, modular, and scalable serverless infrastructure
```

## Main Orchestration File

```python
# __main__.py
import pulumi
import pulumi_aws as aws

# Set the AWS region
aws.config.region = "us-west-2"

# Import modules
from modules.dynamodb import create_dynamodb_table
from modules.sns import create_sns_topic
from modules.s3 import create_s3_bucket
from modules.lambda_function import create_lambda_function
from modules.api_gateway import create_api_gateway
from modules.iam import create_lambda_role, create_lambda_policy
from modules.cloudwatch import create_cloudwatch_alarm
from modules.step_functions import create_step_function
from modules.waf import create_waf_acl
from modules.config import setup_aws_config

# Common tags for all resources
tags = {
    "Project": "ServerlessApp"
}

# Create resources
dynamodb_table = create_dynamodb_table(tags)
sns_topic = create_sns_topic(tags)
s3_bucket = create_s3_bucket(tags)

lambda_role = create_lambda_role(dynamodb_table.name, tags)
lambda_policy = create_lambda_policy(lambda_role, dynamodb_table.arn, sns_topic.arn, tags)

lambda_function = create_lambda_function(lambda_role, dynamodb_table.name, sns_topic.arn, tags)
api_gateway = create_api_gateway(lambda_function, tags)
cloudwatch_alarm = create_cloudwatch_alarm(lambda_function.name, sns_topic.arn, tags)
step_function = create_step_function(lambda_function.arn, tags)
waf_acl = create_waf_acl(api_gateway.id, tags)
config = setup_aws_config(tags)

# Export outputs
pulumi.export('api_gateway_url', api_gateway.api_endpoint)
pulumi.export('dynamodb_table_name', dynamodb_table.name)
pulumi.export('sns_topic_arn', sns_topic.arn)
pulumi.export('s3_bucket_name', s3_bucket.id)
pulumi.export('lambda_function_name', lambda_function.name)
pulumi.export('step_function_arn', step_function.arn)
```

## Module Implementations

### DynamoDB Module

```python
# modules/dynamodb.py
import pulumi_aws as aws

def create_dynamodb_table(tags):
    table = aws.dynamodb.Table("serverless-table",
        attributes=[
            aws.dynamodb.TableAttributeArgs(
                name="id",
                type="S",
            ),
        ],
        hash_key="id",
        billing_mode="PAY_PER_REQUEST",  # On-demand capacity mode
        server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
            enabled=True,  # AWS-managed keys
        ),
        tags=tags,
    )
    return table
```

### SNS Module

```python
# modules/sns.py
import pulumi_aws as aws

def create_sns_topic(tags):
    topic = aws.sns.Topic("critical-alerts",
        tags=tags,
    )
    return topic
```

### S3 Module

```python
# modules/s3.py
import pulumi_aws as aws

def create_s3_bucket(tags):
    bucket = aws.s3.Bucket("static-assets",
        versioning=aws.s3.BucketVersioningArgs(
            enabled=True,
        ),
        server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
            rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                ),
            ),
        ),
        # Block all public access
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        tags=tags,
    )
    return bucket
```

### IAM Module

```python
# modules/iam.py
import pulumi_aws as aws
import json

def create_lambda_role(dynamodb_table_name, tags):
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
        }]
    })

    role = aws.iam.Role("lambda-role",
        assume_role_policy=assume_role_policy,
        tags=tags,
    )

    # Attach AWS managed policy for Lambda basic execution
    aws.iam.RolePolicyAttachment("lambda-basic-execution",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    )

    # Attach AWS managed policy for X-Ray tracing
    aws.iam.RolePolicyAttachment("lambda-xray",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
    )

    return role

def create_lambda_policy(role, dynamodb_table_arn, sns_topic_arn, tags):
    # Create a custom policy for DynamoDB access with least privileges
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                "Resource": [
                    dynamodb_table_arn,
                    f"{dynamodb_table_arn}/index/*"
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "sns:Publish"
                ],
                "Resource": sns_topic_arn
            }
        ]
    }

    policy = aws.iam.Policy("lambda-custom-policy",
        policy=json.dumps(policy_document),
        tags=tags,
    )

    attachment = aws.iam.RolePolicyAttachment("lambda-custom-policy-attachment",
        role=role.name,
        policy_arn=policy.arn,
    )

    return policy
```

### Lambda Function Module

```python
# modules/lambda_function.py
import pulumi_aws as aws
import pulumi

def create_lambda_function(role, dynamodb_table_name, sns_topic_arn, tags):
    # Lambda function code as an asset
    code = pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda_code"),
    })

    lambda_function = aws.lambda_.Function("api-handler",
        role=role.arn,
        runtime="python3.11",  # Latest available Python runtime
        handler="main.handler",
        code=code,
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables={
                "DYNAMODB_TABLE": dynamodb_table_name,
                "SNS_TOPIC_ARN": sns_topic_arn,
                "ENVIRONMENT": "production",
            },
        ),
        tracing_config=aws.lambda_.FunctionTracingConfigArgs(
            mode="Active",  # Enable X-Ray tracing
        ),
        tags=tags,
    )

    return lambda_function
```

### API Gateway Module

```python
# modules/api_gateway.py
import pulumi_aws as aws
import pulumi
import json

def create_api_gateway(lambda_function, tags):
    # Create a REST API
    rest_api = aws.apigateway.RestApi("api",
        description="Serverless API Gateway",
        endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
            types=["REGIONAL"],
        ),
        tags=tags,
    )

    # Create a resource and method for the API
    resource = aws.apigateway.Resource("api-resource",
        rest_api=rest_api.id,
        parent_id=rest_api.root_resource_id,
        path_part="items",
    )

    method = aws.apigateway.Method("api-method",
        rest_api=rest_api.id,
        resource_id=resource.id,
        http_method="POST",
        authorization="NONE",
        api_key_required=False,
    )

    # Create an integration to connect API Gateway to Lambda
    integration = aws.apigateway.Integration("api-integration",
        rest_api=rest_api.id,
        resource_id=resource.id,
        http_method=method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=lambda_function.invoke_arn,
    )

    # Add a permission for API Gateway to invoke Lambda
    permission = aws.lambda_.Permission("api-lambda-permission",
        action="lambda:InvokeFunction",
        function=lambda_function.name,
        principal="apigateway.amazonaws.com",
        source_arn=method.execution_arn,
    )

    # Deploy the API
    deployment = aws.apigateway.Deployment("api-deployment",
        rest_api=rest_api.id,
        description="Initial deployment",
        stage_name="v1",
        opts=pulumi.ResourceOptions(depends_on=[integration]),
    )

    # Create an API Gateway resource policy to restrict access to specific IP addresses
    policy_document = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": "*",
                "Action": "execute-api:Invoke",
                "Resource": f"arn:aws:execute-api:us-west-2:*:{rest_api.id}/*/*/*"
            },
            {
                "Effect": "Deny",
                "Principal": "*",
                "Action": "execute-api:Invoke",
                "Resource": f"arn:aws:execute-api:us-west-2:*:{rest_api.id}/*/*/*",
                "Condition": {
                    "NotIpAddress": {
                        "aws:SourceIp": [
                            "192.0.2.0/24",  # Example allowed IP range
                            "198.51.100.0/24"  # Another example allowed IP range
                        ]
                    }
                }
            }
        ]
    })

    # Apply the resource policy to the REST API
    policy_update = aws.apigateway.RestApiPolicy("api-policy",
        rest_api_id=rest_api.id,
        policy=policy_document
    )

    return rest_api
```

### CloudWatch Module

```python
# modules/cloudwatch.py
import pulumi_aws as aws

def create_cloudwatch_alarm(lambda_function_name, sns_topic_arn, tags):
    # Create CloudWatch Alarm for Lambda errors
    alarm = aws.cloudwatch.MetricAlarm("lambda-error-alarm",
        comparison_operator="GreaterThanOrEqualToThreshold",
        evaluation_periods=1,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=300,  # 5 minutes
        statistic="Sum",
        threshold=10,  # Alert when there are 10 or more errors
        alarm_description=f"Alarm when {lambda_function_name} has more than 10 errors in 5 minutes",
        alarm_actions=[sns_topic_arn],
        dimensions={
            "FunctionName": lambda_function_name,
        },
        tags=tags,
    )

    return alarm
```

### Step Functions Module

```python
# modules/step_functions.py
import pulumi_aws as aws
import json

def create_step_function(lambda_arn, tags):
    # Create a simple Step Function that invokes the Lambda function
    definition = {
        "Comment": "A simple workflow that invokes a Lambda function",
        "StartAt": "InvokeLambda",
        "States": {
            "InvokeLambda": {
                "Type": "Task",
                "Resource": lambda_arn,
                "End": True
            }
        }
    }

    # Create the IAM role for Step Functions
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "states.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    })

    role = aws.iam.Role("step-function-role",
        assume_role_policy=assume_role_policy,
        tags=tags,
    )

    # Attach the necessary policy for Step Functions to invoke Lambda
    policy_document = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": lambda_arn
        }]
    }

    policy = aws.iam.Policy("step-function-policy",
        policy=json.dumps(policy_document),
        tags=tags,
    )

    attachment = aws.iam.RolePolicyAttachment("step-function-policy-attachment",
        role=role.name,
        policy_arn=policy.arn,
    )

    # Create the Step Function
    step_function = aws.sfn.StateMachine("workflow",
        role_arn=role.arn,
        definition=json.dumps(definition),
        tags=tags,
    )

    return step_function
```

### WAF Module

```python
# modules/waf.py
import pulumi_aws as aws

def create_waf_acl(api_gateway_id, tags):
    # Create a WAF WebACL
    web_acl = aws.wafv2.WebAcl("api-waf",
        scope="REGIONAL",
        default_action=aws.wafv2.WebAclDefaultActionArgs(
            allow=aws.wafv2.WebAclDefaultActionAllowArgs(),
        ),
        visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
            cloud_watch_metrics_enabled=True,
            metric_name="ApiWafAcl",
            sampled_requests_enabled=True,
        ),
        rules=[
            aws.wafv2.WebAclRuleArgs(
                name="RateLimit",
                priority=1,
                action=aws.wafv2.WebAclRuleActionArgs(
                    block=aws.wafv2.WebAclRuleActionBlockArgs(),
                ),
                statement=aws.wafv2.WebAclRuleStatementArgs(
                    rate_based_statement=aws.wafv2.WebAclRuleStatementRateBasedStatementArgs(
                        limit=1000,  # Limit to 1000 requests per 5 minutes per IP
                        aggregate_key_type="IP",
                    ),
                ),
                visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                    cloud_watch_metrics_enabled=True,
                    metric_name="RateLimit",
                    sampled_requests_enabled=True,
                ),
            ),
            aws.wafv2.WebAclRuleArgs(
                name="AWSManagedRulesCommonRuleSet",
                priority=2,
                statement=aws.wafv2.WebAclRuleStatementArgs(
                    managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                        name="AWSManagedRulesCommonRuleSet",
                        vendor_name="AWS",
                    ),
                ),
                override_action=aws.wafv2.WebAclRuleOverrideActionArgs(
                    none=aws.wafv2.WebAclRuleOverrideActionNoneArgs(),
                ),
                visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                    cloud_watch_metrics_enabled=True,
                    metric_name="AWSManagedRulesCommonRuleSet",
                    sampled_requests_enabled=True,
                ),
            ),
        ],
        tags=tags,
    )

    # Associate the WAF WebACL with the API Gateway stage
    association = aws.wafv2.WebAclAssociation("api-waf-association",
        resource_arn=f"arn:aws:apigateway:us-west-2::/restapis/{api_gateway_id}/stages/v1",
        web_acl_arn=web_acl.arn,
    )

    return web_acl
```

### AWS Config Module

```python
# modules/config.py
import pulumi_aws as aws
import json

def setup_aws_config(tags):
    # Create an IAM role for AWS Config
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "config.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
        }]
    })

    role = aws.iam.Role("config-role",
        assume_role_policy=assume_role_policy,
        tags=tags,
    )

    # Attach AWS managed policy for AWS Config
    aws.iam.RolePolicyAttachment("config-policy-attachment",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
    )

    # Create a delivery channel for AWS Config
    s3_bucket = aws.s3.Bucket("config-bucket",
        tags=tags,
        acl="private",
        server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
            rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                ),
            ),
        ),
    )

    # Create an AWS Config configuration recorder
    recorder = aws.config.ConfigurationRecorder("config-recorder",
        role_arn=role.arn,
        recording_group=aws.config.ConfigurationRecorderRecordingGroupArgs(
            all_supported=True,
            include_global_resource_types=True,
        ),
    )

    # Create a delivery channel
    delivery_channel = aws.config.DeliveryChannel("config-delivery-channel",
        s3_bucket_name=s3_bucket.id,
    )

    # Create an AWS Config rule to ensure IAM roles have specific permissions
    config_rule = aws.config.Rule("iam-role-rule",
        source=aws.config.RuleSourceArgs(
            owner="AWS",
            source_identifier="IAM_ROLE_MANAGED_POLICY_CHECK",
        ),
        input_parameters="""
        {
            "policyARNs": "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole,arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        }
        """,
        depends_on=[delivery_channel],
        tags=tags,
    )

    return config_rule
```

## Lambda Function Implementation

```python
# lambda_code/main.py
import json
import os
import boto3
import logging
import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Enable X-Ray tracing for AWS SDK calls
patch_all()

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

# Initialize SNS client
sns = boto3.client('sns')
sns_topic_arn = os.environ['SNS_TOPIC_ARN']

@xray_recorder.capture('handler')
def handler(event, context):
    """
    Lambda handler function that processes API Gateway requests.
    """
    try:
        logger.info("Event received: %s", json.dumps(event))

        # Extract data from the event
        body = json.loads(event.get('body', '{}'))
        item_id = body.get('id')

        if not item_id:
            logger.error("Missing required parameter 'id'")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': "Missing required parameter 'id'"})
            }

        # Example operation: Put the item in DynamoDB
        item = {
            'id': item_id,
            'data': body.get('data', ''),
            'timestamp': str(datetime.datetime.now())
        }

        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Item created successfully', 'id': item_id})
        }

    except Exception as e:
        error_message = str(e)
        logger.error("Error: %s", error_message)

        # Publish error to SNS topic
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject='Lambda Function Error',
            Message=f'Error in Lambda function: {error_message}'
        )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal Server Error'})
        }
```

## Project Configuration

```yaml
# Pulumi.yaml
name: serverless-app
runtime: python
description: A secure, modular, and scalable serverless infrastructure
```
