CDK Prompt (Python) — Serverless Infrastructure
You are designing an AWS CDK (Python) application with the following requirements:

Requirements:
AWS Lambda Function

Written in Python

Runs in a serverless manner using AWS Lambda

Should handle at least 1000 concurrent executions

Must have CloudWatch logging enabled

Region

All resources must be deployed in the us-east-1 region

Secure Environment Variables

Store function environment variables securely using AWS Systems Manager (SSM) Parameter Store

The Lambda must read these values securely during runtime

Monitoring

Enable CloudWatch logs for the Lambda function to track performance and errors

Naming Convention

Resource names must follow the pattern: projectname-resource-type
(e.g., tap-lambda-function, tap-ssm-parameter)

Folder Structure:
graphql
Copy
Edit
.
├── tap.py                   # CDK app entrypoint (like app.py)
└── lib/
    └── tap_stack.py        # Stack definition
CDK Output Expectations:
Full implementation in Python CDK (v2)

Reusable and readable structure

Stack defined in lib/tap_stack.py, instantiated in tap.py

Uses aws_cdk.aws_lambda, aws_cdk.aws_ssm, and aws_cdk.aws_logs modules

Automatically sets Lambda concurrency to at least 1000

Includes SSM Parameter resource creation and grants secure access to Lambda

CloudWatch logs enabled with at least 1-week retention
