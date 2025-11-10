"""
compute.py

Lambda function infrastructure for payment processing.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import List, Optional
import json
from .config import get_default_egress_rules


class ComputeStack(pulumi.ComponentResource):
    """
    Creates Lambda function infrastructure for payment processing.
    """

    def __init__(
        self,
        name: str,
        *,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        db_secret_arn: Output[str],
        dynamodb_table_name: Output[str],
        reserved_concurrency: Optional[int],
        environment_suffix: str,
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:compute:ComputeStack', name, None, opts)

        # Create security group for Lambda
        self.lambda_sg = aws.ec2.SecurityGroup(
            f'lambda-sg-{environment_suffix}',
            vpc_id=vpc_id,
            description=f'Security group for Lambda functions - {environment_suffix}',
            egress=get_default_egress_rules(),
            tags={**tags, 'Name': f'lambda-sg-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for Lambda
        self.lambda_role = aws.iam.Role(
            f'lambda-role-{environment_suffix}',
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Action': 'sts:AssumeRole',
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'lambda.amazonaws.com'
                    }
                }]
            }),
            tags={**tags, 'Name': f'lambda-role-{environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f'lambda-basic-execution-{environment_suffix}',
            role=self.lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=ResourceOptions(parent=self)
        )

        # Attach VPC execution policy
        aws.iam.RolePolicyAttachment(
            f'lambda-vpc-execution-{environment_suffix}',
            role=self.lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
            opts=ResourceOptions(parent=self)
        )

        # Create inline policy for Secrets Manager and DynamoDB access
        lambda_policy = pulumi.Output.all(db_secret_arn, dynamodb_table_name).apply(
            lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'secretsmanager:GetSecretValue'
                        ],
                        'Resource': args[0]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'dynamodb:GetItem',
                            'dynamodb:PutItem',
                            'dynamodb:UpdateItem',
                            'dynamodb:Query'
                        ],
                        'Resource': f'arn:aws:dynamodb:us-east-1:*:table/{args[1]}'
                    }
                ]
            })
        )

        aws.iam.RolePolicy(
            f'lambda-policy-{environment_suffix}',
            role=self.lambda_role.id,
            policy=lambda_policy,
            opts=ResourceOptions(parent=self)
        )

        # Create Lambda function
        lambda_args = {
            'name': f'payment-processor-{environment_suffix}',
            'runtime': 'python3.11',
            'role': self.lambda_role.arn,
            'handler': 'index.handler',
            'code': pulumi.FileArchive('./lib/lambda'),
            'timeout': 30,
            'memory_size': 512,
            'environment': aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'DB_SECRET_ARN': db_secret_arn,
                    'DYNAMODB_TABLE': dynamodb_table_name,
                    'ENVIRONMENT': environment_suffix
                }
            ),
            'vpc_config': aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=private_subnet_ids,
                security_group_ids=[self.lambda_sg.id]
            ),
            'tags': {**tags, 'Name': f'payment-processor-{environment_suffix}'},
        }

        # Add reserved concurrency if specified
        if reserved_concurrency:
            lambda_args['reserved_concurrent_executions'] = reserved_concurrency

        self.lambda_function = aws.lambda_.Function(
            f'lambda-function-{environment_suffix}',
            **lambda_args,
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_role])
        )

        # Expose outputs
        self.lambda_function_arn = self.lambda_function.arn
        self.lambda_function_name = self.lambda_function.name

        self.register_outputs({
            'lambda_function_arn': self.lambda_function_arn,
            'lambda_function_name': self.lambda_function_name
        })
