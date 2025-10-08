# Form Builder Service Infrastructure Implementation

Here's the complete CDKTF Python implementation for the form builder service:

## File: lib/tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_lifecycle_configuration import S3BucketLifecycleConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import S3BucketServerSideEncryptionConfiguration
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.api_gateway_api_key import ApiGatewayApiKey
from cdktf_cdktf_provider_aws.api_gateway_usage_plan import ApiGatewayUsagePlan
from cdktf_cdktf_provider_aws.api_gateway_usage_plan_key import ApiGatewayUsagePlanKey
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.ses_email_identity import SesEmailIdentity
from cdktf_cdktf_provider_aws.ses_template import SesTemplate
from cdktf_cdktf_provider_aws.sfn_state_machine import SfnStateMachine
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
import json
import os
from cdktf import Fn


class TapStack(TerraformStack):
    """CDKTF Python stack for TAP infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Create S3 bucket for file attachments
        attachments_bucket = S3Bucket(
            self,
            "form_attachments_bucket",
            bucket=f"form-attachments-{environment_suffix}-{construct_id}",
            force_destroy=True
        )

        # Enable versioning on S3 bucket
        S3BucketVersioning(
            self,
            "attachments_versioning",
            bucket=attachments_bucket.id,
            versioning_configuration={"status": "Enabled", "mfa_delete": "Disabled"}
        )

        # Configure server-side encryption
        S3BucketServerSideEncryptionConfiguration(
            self,
            "attachments_encryption",
            bucket=attachments_bucket.id,
            rule=[{
                "apply_server_side_encryption_by_default": {
                    "sse_algorithm": "AES256"
                }
            }]
        )

        # Add lifecycle configuration
        S3BucketLifecycleConfiguration(
            self,
            "attachments_lifecycle",
            bucket=attachments_bucket.id,
            rule=[{
                "id": "archive_old_attachments",
                "status": "Enabled",
                "transition": [{
                    "days": 90,
                    "storage_class": "GLACIER"
                }]
            }]
        )

        # Create DynamoDB table for form responses
        form_responses_table = DynamodbTable(
            self,
            "form_responses_table",
            name=f"form-responses-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="submission_id",
            range_key="timestamp",
            point_in_time_recovery={"enabled": True},
            attribute=[
                {
                    "name": "submission_id",
                    "type": "S"
                },
                {
                    "name": "timestamp",
                    "type": "N"
                },
                {
                    "name": "email",
                    "type": "S"
                }
            ],
            global_secondary_index=[{
                "name": "EmailIndex",
                "hash_key": "email",
                "projection_type": "ALL"
            }]
        )

        # Create IAM role for Lambda functions
        lambda_assume_role_policy = DataAwsIamPolicyDocument(
            self,
            "lambda_assume_role_policy",
            statement=[{
                "actions": ["sts:AssumeRole"],
                "principals": [{
                    "type": "Service",
                    "identifiers": ["lambda.amazonaws.com"]
                }]
            }]
        )

        lambda_role = IamRole(
            self,
            "lambda_execution_role",
            name=f"form-lambda-role-{environment_suffix}",
            assume_role_policy=lambda_assume_role_policy.json
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_basic_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Create custom policy for Lambda
        lambda_policy_document = DataAwsIamPolicyDocument(
            self,
            "lambda_policy_doc",
            statement=[
                {
                    "actions": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "resources": [form_responses_table.arn, f"{form_responses_table.arn}/*"]
                },
                {
                    "actions": [
                        "s3:PutObject",
                        "s3:GetObject",
                        "s3:DeleteObject"
                    ],
                    "resources": [f"{attachments_bucket.arn}/*"]
                },
                {
                    "actions": ["s3:ListBucket"],
                    "resources": [attachments_bucket.arn]
                },
                {
                    "actions": [
                        "ses:SendEmail",
                        "ses:SendTemplatedEmail"
                    ],
                    "resources": ["*"]
                },
                {
                    "actions": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "resources": ["*"]
                }
            ]
        )

        lambda_policy = IamPolicy(
            self,
            "lambda_policy",
            name=f"form-lambda-policy-{environment_suffix}",
            policy=lambda_policy_document.json
        )

        IamRolePolicyAttachment(
            self,
            "lambda_custom_policy_attachment",
            role=lambda_role.name,
            policy_arn=lambda_policy.arn
        )

        # Create CloudWatch Log Group for Lambda
        lambda_log_group = CloudwatchLogGroup(
            self,
            "lambda_log_group",
            name=f"/aws/lambda/form-validator-{environment_suffix}",
            retention_in_days=7
        )

        # Package Lambda function code
        lambda_code_path = os.path.join(os.path.dirname(__file__), "lambda_validation.zip")

        # Create Lambda function for form validation
        validation_lambda = LambdaFunction(
            self,
            "form_validation_lambda",
            function_name=f"form-validator-{environment_suffix}",
            role=lambda_role.arn,
            handler="lambda_validation.handler",
            runtime="python3.11",
            timeout=30,
            memory_size=256,
            filename=lambda_code_path,
            environment={
                "variables": {
                    "DYNAMODB_TABLE": form_responses_table.name,
                    "S3_BUCKET": attachments_bucket.id,
                    "SENDER_EMAIL": f"noreply-{environment_suffix}@example.com"
                }
            },
            depends_on=[lambda_log_group]
        )

        # Create API Gateway REST API
        api = ApiGatewayRestApi(
            self,
            "form_api",
            name=f"form-api-{environment_suffix}",
            description="Form submission API",
            endpoint_configuration={"types": ["REGIONAL"]}
        )

        # Create /submit resource
        submit_resource = ApiGatewayResource(
            self,
            "submit_resource",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="submit"
        )

        # Create POST method
        submit_method = ApiGatewayMethod(
            self,
            "submit_method",
            rest_api_id=api.id,
            resource_id=submit_resource.id,
            http_method="POST",
            authorization="NONE",
            api_key_required=True
        )

        # Create Lambda integration
        ApiGatewayIntegration(
            self,
            "lambda_integration",
            rest_api_id=api.id,
            resource_id=submit_resource.id,
            http_method=submit_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=validation_lambda.invoke_arn
        )

        # Add Lambda permission for API Gateway
        LambdaPermission(
            self,
            "api_gateway_lambda_permission",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=validation_lambda.function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*"
        )

        # Create OPTIONS method for CORS
        options_method = ApiGatewayMethod(
            self,
            "options_method",
            rest_api_id=api.id,
            resource_id=submit_resource.id,
            http_method="OPTIONS",
            authorization="NONE"
        )

        # Mock integration for OPTIONS
        ApiGatewayIntegration(
            self,
            "options_integration",
            rest_api_id=api.id,
            resource_id=submit_resource.id,
            http_method=options_method.http_method,
            type="MOCK",
            request_templates={
                "application/json": '{"statusCode": 200}'
            },
            integration_responses=[{
                "status_code": "200",
                "response_parameters": {
                    "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                    "method.response.header.Access-Control-Allow-Methods": "'POST,OPTIONS'",
                    "method.response.header.Access-Control-Allow-Origin": "'*'"
                }
            }]
        )

        # Create deployment
        deployment = ApiGatewayDeployment(
            self,
            "api_deployment",
            rest_api_id=api.id,
            depends_on=[submit_method, options_method]
        )

        # Create stage
        ApiGatewayStage(
            self,
            "api_stage",
            stage_name="prod",
            rest_api_id=api.id,
            deployment_id=deployment.id
        )

        # Create API key
        api_key = ApiGatewayApiKey(
            self,
            "api_key",
            name=f"form-api-key-{environment_suffix}",
            description="API key for form submission"
        )

        # Create usage plan
        usage_plan = ApiGatewayUsagePlan(
            self,
            "usage_plan",
            name=f"form-api-usage-plan-{environment_suffix}",
            api_stages=[{
                "api_id": api.id,
                "stage": "prod"
            }],
            throttle_settings={
                "rate_limit": 500,
                "burst_limit": 1000
            }
        )

        # Link API key to usage plan
        ApiGatewayUsagePlanKey(
            self,
            "usage_plan_key",
            key_id=api_key.id,
            key_type="API_KEY",
            usage_plan_id=usage_plan.id
        )

        # Create SES email identity
        SesEmailIdentity(
            self,
            "sender_email",
            email=f"noreply-{environment_suffix}@example.com"
        )

        # Create SES email template
        SesTemplate(
            self,
            "confirmation_template",
            name=f"form-confirmation-{environment_suffix}",
            subject="Form Submission Confirmation",
            html="<html><body><h1>Thank you for your submission</h1><p>We have received your form submission with ID: {{submission_id}}</p></body></html>",
            text="Thank you for your submission. We have received your form submission with ID: {{submission_id}}"
        )

        # Create IAM role for Step Functions
        sfn_assume_role_policy = DataAwsIamPolicyDocument(
            self,
            "sfn_assume_role_policy",
            statement=[{
                "actions": ["sts:AssumeRole"],
                "principals": [{
                    "type": "Service",
                    "identifiers": ["states.amazonaws.com"]
                }]
            }]
        )

        sfn_role = IamRole(
            self,
            "sfn_execution_role",
            name=f"form-sfn-role-{environment_suffix}",
            assume_role_policy=sfn_assume_role_policy.json
        )

        # Create policy for Step Functions
        sfn_policy_document = DataAwsIamPolicyDocument(
            self,
            "sfn_policy_doc",
            statement=[
                {
                    "actions": ["lambda:InvokeFunction"],
                    "resources": ["*"]
                },
                {
                    "actions": [
                        "ses:SendEmail",
                        "ses:SendTemplatedEmail"
                    ],
                    "resources": ["*"]
                },
                {
                    "actions": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "resources": ["*"]
                }
            ]
        )

        sfn_policy = IamPolicy(
            self,
            "sfn_policy",
            name=f"form-sfn-policy-{environment_suffix}",
            policy=sfn_policy_document.json
        )

        IamRolePolicyAttachment(
            self,
            "sfn_policy_attachment",
            role=sfn_role.name,
            policy_arn=sfn_policy.arn
        )

        # Create CloudWatch Log Group for Step Functions
        sfn_log_group = CloudwatchLogGroup(
            self,
            "sfn_log_group",
            name=f"/aws/states/form-processor-{environment_suffix}",
            retention_in_days=7
        )

        # Package Step Functions Lambda code
        sfn_lambda_code_path = os.path.join(os.path.dirname(__file__), "lambda_workflow.zip")

        # Create Lambda function for Step Functions workflow
        workflow_lambda = LambdaFunction(
            self,
            "workflow_lambda",
            function_name=f"form-workflow-{environment_suffix}",
            role=lambda_role.arn,
            handler="lambda_workflow.handler",
            runtime="python3.11",
            timeout=60,
            memory_size=256,
            filename=sfn_lambda_code_path,
            environment={
                "variables": {
                    "S3_BUCKET": attachments_bucket.id
                }
            }
        )

        # Define Step Functions state machine definition
        state_machine_definition = {
            "Comment": "Form processing workflow",
            "StartAt": "ValidateForm",
            "States": {
                "ValidateForm": {
                    "Type": "Task",
                    "Resource": validation_lambda.arn,
                    "Next": "CheckFormType",
                    "Retry": [{
                        "ErrorEquals": ["States.TaskFailed"],
                        "IntervalSeconds": 2,
                        "MaxAttempts": 3,
                        "BackoffRate": 2
                    }],
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "HandleError"
                    }]
                },
                "CheckFormType": {
                    "Type": "Choice",
                    "Choices": [
                        {
                            "Variable": "$.formType",
                            "StringEquals": "contact",
                            "Next": "ProcessContactForm"
                        },
                        {
                            "Variable": "$.formType",
                            "StringEquals": "support",
                            "Next": "ProcessSupportForm"
                        }
                    ],
                    "Default": "ProcessGeneralForm"
                },
                "ProcessContactForm": {
                    "Type": "Task",
                    "Resource": workflow_lambda.arn,
                    "Parameters": {
                        "action": "process_contact",
                        "data.$": "$"
                    },
                    "Next": "SendEmail"
                },
                "ProcessSupportForm": {
                    "Type": "Task",
                    "Resource": workflow_lambda.arn,
                    "Parameters": {
                        "action": "process_support",
                        "data.$": "$"
                    },
                    "Next": "SendEmail"
                },
                "ProcessGeneralForm": {
                    "Type": "Task",
                    "Resource": workflow_lambda.arn,
                    "Parameters": {
                        "action": "process_general",
                        "data.$": "$"
                    },
                    "Next": "SendEmail"
                },
                "SendEmail": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::aws-sdk:ses:sendTemplatedEmail",
                    "Parameters": {
                        "Source": f"noreply-{environment_suffix}@example.com",
                        "Destination": {
                            "ToAddresses.$": "States.Array($.email)"
                        },
                        "Template": f"form-confirmation-{environment_suffix}",
                        "TemplateData.$": "States.JsonToString($)"
                    },
                    "End": true
                },
                "HandleError": {
                    "Type": "Fail",
                    "Error": "FormProcessingError",
                    "Cause": "Error processing form submission"
                }
            }
        }

        # Create Step Functions state machine
        state_machine = SfnStateMachine(
            self,
            "form_processor_state_machine",
            name=f"form-processor-{environment_suffix}",
            role_arn=sfn_role.arn,
            definition=json.dumps(state_machine_definition),
            logging_configuration={
                "level": "ALL",
                "include_execution_data": True,
                "destinations": [{
                    "cloud_watch_logs_log_group": {
                        "log_group_arn": f"{sfn_log_group.arn}:*"
                    }
                }]
            }
        )

        # Create CloudWatch metric alarms
        CloudwatchMetricAlarm(
            self,
            "lambda_error_alarm",
            alarm_name=f"form-lambda-errors-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Alarm when Lambda errors exceed threshold",
            dimensions={
                "FunctionName": validation_lambda.function_name
            }
        )

        # Create CloudWatch Dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Total Invocations"}],
                            [".", "Errors", {"stat": "Sum", "label": "Total Errors"}],
                            [".", "Duration", {"stat": "Average", "label": "Avg Duration"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "Lambda Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "UserErrors", {"stat": "Sum"}],
                            [".", "SystemErrors", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws_region,
                        "title": "DynamoDB Errors"
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            "form_metrics_dashboard",
            dashboard_name=f"form-metrics-{environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )

        # Outputs
        TerraformOutput(
            self,
            "api_endpoint",
            value=f"https://{api.id}.execute-api.{aws_region}.amazonaws.com/prod/submit"
        )

        TerraformOutput(
            self,
            "api_key_id",
            value=api_key.id
        )

        TerraformOutput(
            self,
            "dynamodb_table",
            value=form_responses_table.name
        )

        TerraformOutput(
            self,
            "s3_bucket",
            value=attachments_bucket.id
        )

        TerraformOutput(
            self,
            "state_machine_arn",
            value=state_machine.arn
        )
```

## File: lib/lambda_validation.py

```python
import json
import os
import re
import uuid
import time
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']
SENDER_EMAIL = os.environ['SENDER_EMAIL']

def handler(event, context):
    """
    Lambda function to validate form submissions.
    """
    try:
        # Parse request body
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event

        # Validate required fields
        required_fields = ['email', 'name', 'message']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({
                        'error': f'Missing required field: {field}'
                    })
                }

        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, body['email']):
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': 'Invalid email format'
                })
            }

        # Validate message length
        if len(body['message']) > 5000:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': 'Message too long (max 5000 characters)'
                })
            }

        # Generate submission ID
        submission_id = str(uuid.uuid4())
        timestamp = int(time.time())

        # Process file attachment if present
        attachment_url = None
        if 'attachment' in body:
            # Validate file size (max 10MB)
            attachment_data = body['attachment']
            if 'size' in attachment_data and attachment_data['size'] > 10485760:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({
                        'error': 'File too large (max 10MB)'
                    })
                }

            # Generate presigned URL for file upload
            file_key = f"attachments/{submission_id}/{attachment_data.get('filename', 'file')}"
            attachment_url = s3.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': S3_BUCKET,
                    'Key': file_key
                },
                ExpiresIn=3600  # 1 hour
            )

        # Store form data in DynamoDB
        table = dynamodb.Table(DYNAMODB_TABLE)
        form_data = {
            'submission_id': submission_id,
            'timestamp': timestamp,
            'email': body['email'],
            'name': body['name'],
            'message': body['message'],
            'form_type': body.get('form_type', 'general'),
            'created_at': datetime.utcnow().isoformat(),
            'status': 'pending'
        }

        if attachment_url:
            form_data['attachment_key'] = file_key

        table.put_item(Item=form_data)

        # Log metrics
        print(json.dumps({
            'metric': 'form_submission',
            'submission_id': submission_id,
            'form_type': form_data['form_type'],
            'has_attachment': bool(attachment_url)
        }))

        # Return success response
        response = {
            'submission_id': submission_id,
            'status': 'accepted',
            'message': 'Form submitted successfully'
        }

        if attachment_url:
            response['upload_url'] = attachment_url

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(response)
        }

    except Exception as e:
        print(f"Error processing form: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal server error'
            })
        }
```

## File: lib/lambda_workflow.py

```python
import json
import os
import boto3
from datetime import datetime, timedelta

s3 = boto3.client('s3')
S3_BUCKET = os.environ['S3_BUCKET']

def handler(event, context):
    """
    Lambda function for Step Functions workflow tasks.
    """
    try:
        action = event.get('action', 'process_general')
        data = event.get('data', {})

        if action == 'process_contact':
            return process_contact_form(data)
        elif action == 'process_support':
            return process_support_form(data)
        elif action == 'generate_presigned_url':
            return generate_presigned_url(data)
        else:
            return process_general_form(data)

    except Exception as e:
        print(f"Error in workflow: {str(e)}")
        raise

def process_contact_form(data):
    """Process contact form submissions."""
    # Add priority flag for contact forms
    data['priority'] = 'high'
    data['department'] = 'sales'

    # Generate ticket number
    data['ticket_number'] = f"CONTACT-{data.get('submission_id', 'unknown')[:8]}"

    # Set follow-up deadline
    follow_up_date = datetime.utcnow() + timedelta(days=1)
    data['follow_up_by'] = follow_up_date.isoformat()

    print(f"Processed contact form: {data['ticket_number']}")
    return data

def process_support_form(data):
    """Process support form submissions."""
    # Categorize support request
    message = data.get('message', '').lower()
    if 'urgent' in message or 'critical' in message:
        data['priority'] = 'urgent'
        data['sla_hours'] = 4
    else:
        data['priority'] = 'normal'
        data['sla_hours'] = 24

    data['department'] = 'support'
    data['ticket_number'] = f"SUPPORT-{data.get('submission_id', 'unknown')[:8]}"

    # Set resolution deadline
    resolution_date = datetime.utcnow() + timedelta(hours=data['sla_hours'])
    data['resolve_by'] = resolution_date.isoformat()

    print(f"Processed support form: {data['ticket_number']} (Priority: {data['priority']})")
    return data

def process_general_form(data):
    """Process general form submissions."""
    data['priority'] = 'normal'
    data['department'] = 'general'
    data['ticket_number'] = f"GENERAL-{data.get('submission_id', 'unknown')[:8]}"

    # Set standard follow-up
    follow_up_date = datetime.utcnow() + timedelta(days=3)
    data['follow_up_by'] = follow_up_date.isoformat()

    print(f"Processed general form: {data['ticket_number']}")
    return data

def generate_presigned_url(data):
    """Generate presigned URL for file downloads."""
    file_key = data.get('file_key')

    if not file_key:
        raise ValueError("File key is required")

    # Generate presigned URL for download
    presigned_url = s3.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': S3_BUCKET,
            'Key': file_key
        },
        ExpiresIn=3600  # 1 hour
    )

    data['download_url'] = presigned_url
    data['url_expires_at'] = (datetime.utcnow() + timedelta(hours=1)).isoformat()

    return data
```

## File: lib/create_lambda_packages.py

```python
#!/usr/bin/env python3
"""
Script to create Lambda deployment packages.
"""
import os
import zipfile

def create_lambda_package(source_file, output_file):
    """Create a ZIP file for Lambda deployment."""
    with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(source_file, os.path.basename(source_file))
    print(f"Created Lambda package: {output_file}")

def main():
    """Create Lambda deployment packages."""
    lib_dir = os.path.dirname(os.path.abspath(__file__))

    # Create validation Lambda package
    create_lambda_package(
        os.path.join(lib_dir, 'lambda_validation.py'),
        os.path.join(lib_dir, 'lambda_validation.zip')
    )

    # Create workflow Lambda package
    create_lambda_package(
        os.path.join(lib_dir, 'lambda_workflow.py'),
        os.path.join(lib_dir, 'lambda_workflow.zip')
    )

if __name__ == '__main__':
    main()
```