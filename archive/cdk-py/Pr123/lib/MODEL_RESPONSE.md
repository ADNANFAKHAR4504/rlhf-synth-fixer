To build a reusable and secure infrastructure stack using AWS CDK in Python, we'll create a stack that includes an AWS Lambda function with encrypted environment variables. We'll use AWS KMS for encryption and ensure that all resources are tagged appropriately.

Here's the complete code:

from aws_cdk import (
    aws_lambda as _lambda,
    aws_kms as kms,
    aws_ec2 as ec2,
    core
)

class SecureInfrastructureStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Define the KMS Key for encrypting environment variables
        encryption_key = kms.Key(
            self, "LambdaEnvVarsEncryptionKey",
            description="KMS key for encrypting Lambda environment variables",
            enable_key_rotation=True,
            removal_policy=core.RemovalPolicy.DESTROY  # Ensure the key is deleted when the stack is destroyed
        )

        # Define the Lambda function with encrypted environment variables
        lambda_function = _lambda.Function(
            self, "SecureLambdaFunction",
            runtime=_lambda.Runtime.PYTHON_3_8,
            handler="lambda_function.handler",
            code=_lambda.Code.from_asset("lambda"),  # Assuming the Lambda code is in the 'lambda' directory
            environment={
                "SECRET_KEY": encryption_key.encrypt("my-secret-value")
            },
            environment_encryption=_lambda.EnvironmentEncryption.KMS,
            kms_key=encryption_key,
            timeout=core.Duration.seconds(10),
            vpc=ec2.Vpc.from_lookup(self, "DefaultVPC", is_default=True),  # Use the default VPC
        )

        # Apply security best practices for Lambda
        lambda_function.add_to_role_policy(
            statement=aws_iam.PolicyStatement(
                actions=["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                resources=["arn:aws:logs:*:*:*"]
            )
        )

        # Tag all resources
        core.Tags.of(self).add("Environment", "Production")
        core.Tags.of(self).add("Team", "DevOps")

app = core.App()
SecureInfrastructureStack(app, "SecureInfrastructureStack", env={'region': 'us-west-2'})
app.synth()
Explanation:
KMS Key: We create a KMS key to encrypt sensitive environment variables.
Lambda Function: We define a Lambda function that uses the KMS key to encrypt its environment variables.
Security Best Practices: We add a policy to the Lambda's execution role to allow it to write logs to CloudWatch.
Tagging: We tag all resources with the required tags.
Directory Structure:
secure-infrastructure/
├── app.py
├── secure_infrastructure/
│   ├── __init__.py
│   └── secure_infrastructure_stack.py
└── lambda/
    └── lambda_function.py
Lambda Function Code (lambda/lambda_function.py):
def handler(event, context):
    import os
    secret_key = os.environ['SECRET_KEY']
    print(f"The secret key is: {secret_key}")
Deployment:
Ensure you have AWS CDK and the necessary AWS CLI configured.
Run the following commands:
cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
cdk deploy
This setup ensures that sensitive data is encrypted using AWS KMS, and all resources are properly tagged and follow security best practices. The Lambda function is configured to use the default VPC in the us-west-2 region.