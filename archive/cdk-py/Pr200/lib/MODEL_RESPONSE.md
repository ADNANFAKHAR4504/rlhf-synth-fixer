Here's the complete AWS CDK Python codebase to meet your requirements:

**app.py**
```python
#!/usr/bin/env python3
import aws_cdk as cdk
from serverless_app.serverless_app_stack import ServerlessAppStack

app = cdk.App()
ServerlessAppStack(app, "ServerlessAppStack", env={'region': 'us-west-2'})
app.synth()
```

**cdk.json**
```json
{
  "app": "python3 app.py",
  "context": {
    "aws-cdk-lib/config": {
      "enableLookups": true
    }
  }
}
```

**requirements.txt**
```
aws-cdk-lib==2.x
constructs>=10.0.0,<11.0.0
```

**serverless_app/serverless_app_stack.py**
```python
from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_apigatewayv2 as apigw,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_stepfunctions as sfn,
    aws_iam as iam,
    RemovalPolicy
)
from constructs import Construct

class ServerlessAppStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # S3 Bucket
        bucket = s3.Bucket(self, "orders-prod-bucket",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            versioned=False
        )

        # DynamoDB Table
        table = dynamodb.Table(self, "orders-prod-table",
            partition_key=dynamodb.Attribute(
                name="request_id", type=dynamodb.AttributeType.STRING
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Step Functions State Machine
        state_machine = sfn.StateMachine(self, "orders-prod-statemachine",
            definition=sfn.Pass(self, "PassState", result=sfn.Result.from_string("Success"))
        )

        # Lambda Execution Role
        lambda_role = iam.Role(self, "orders-prod-lambda-role",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )
        
        # Add permissions
        bucket.grant_read_write(lambda_role)
        table.grant_write_data(lambda_role)
        state_machine.grant_start_execution(lambda_role)

        # Lambda Function
        lambda_function = _lambda.Function(self, "orders-prod-lambda",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="lambda_handler.handler",
            code=_lambda.Code.from_asset("lambda"),
            role=lambda_role,
            environment={
                "BUCKET_NAME": bucket.bucket_name,
                "TABLE_NAME": table.table_name,
                "STATE_MACHINE_ARN": state_machine.state_machine_arn
            }
        )

        # HTTP API
        http_api = apigw.HttpApi(self, "orders-prod-api",
            cors_preflight=apigw.CorsPreflightOptions(
                allow_methods=[apigw.CorsHttpMethod.POST],
                allow_origins=["*"]
            )
        )

        # Integration
        integration = apigw_integrations.HttpLambdaIntegration(
            "LambdaIntegration", handler=lambda_function
        )

        # Route
        http_api.add_routes(
            path="/process",
            methods=[apigw.HttpMethod.POST],
            integration=integration
        )

        # Tagging
        for resource in [bucket, table, state_machine, lambda_function, http_api]:
            cdk.Tags.of(resource).add("Environment", "Production")
```

**lambda/lambda_handler.py**
```python
import json
import boto3
import os
from datetime import datetime

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
step_functions = boto3.client('stepfunctions')

BUCKET_NAME = os.environ['BUCKET_NAME']
TABLE_NAME = os.environ['TABLE_NAME']
STATE_MACHINE_ARN = os.environ['STATE_MACHINE_ARN']

def handler(event, context):
    payload = json.loads(event['body'])
    
    # Store in S3
    s3_key = f"requests/{context.aws_request_id}.json"
    s3_client.put_object(Bucket=BUCKET_NAME, Key=s3_key, Body=json.dumps(payload))
    
    # Log to DynamoDB
    table = dynamodb.Table(TABLE_NAME)
    table.put_item(Item={
        'request_id': context.aws_request_id,
        'timestamp': datetime.utcnow().isoformat(),
        's3_key': s3_key,
        'status': 'PROCESSED',
        'step_function_execution_arn': ''
    })
    
    # Start Step Function
    response = step_functions.start_execution(
        stateMachineArn=STATE_MACHINE_ARN,
        input=json.dumps(payload)
    )
    
    # Update DynamoDB with execution ARN
    table.update_item(
        Key={'request_id': context.aws_request_id},
        UpdateExpression='SET step_function_execution_arn = :val',
        ExpressionAttributeValues={':val': response['executionArn']}
    )
    
    return {'statusCode': 200, 'body': 'Request processed'}
```

**Directory Structure:**
```
project-root/
├── app.py
├── cdk.json
├── requirements.txt
├── serverless_app/
│   └── serverless_app_stack.py
└── lambda/
    └── lambda_handler.py
```

**Deployment:**
1. Install dependencies: `pip install -r requirements.txt`
2. Bootstrap CDK: `cdk bootstrap aws://ACCOUNT_ID/us-west-2`
3. Deploy: `cdk deploy`

This setup creates a secure serverless infrastructure with proper IAM roles, resource tagging, and follows best practices for production deployments.