"""
secrets_stack.py

Secrets Manager infrastructure with automated rotation for database credentials.
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional, List


class SecretsStack(pulumi.ComponentResource):
    """
    Manages database secrets with automatic 30-day rotation using Lambda.
    """

    def __init__(
        self,
        name: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        tags: Optional[dict] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:secrets:SecretsStack', name, None, opts)

        self.tags = tags or {}
        self.vpc_id = vpc_id
        self.private_subnet_ids = private_subnet_ids
        child_opts = ResourceOptions(parent=self)

        # Create security group for Lambda rotation function
        self.lambda_sg = aws.ec2.SecurityGroup(
            f'{name}-lambda-rotation-sg',
            vpc_id=vpc_id,
            description='Security group for secret rotation Lambda',
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol='-1',
                cidr_blocks=['0.0.0.0/0']
            )],
            tags={**self.tags, 'Name': f'{name}-lambda-rotation-sg'},
            opts=child_opts
        )

        # Create IAM role for Lambda rotation function
        lambda_assume_role = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                effect='Allow',
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type='Service',
                    identifiers=['lambda.amazonaws.com']
                )],
                actions=['sts:AssumeRole']
            )]
        )

        self.lambda_role = aws.iam.Role(
            f'{name}-lambda-rotation-role',
            assume_role_policy=lambda_assume_role.json,
            tags=self.tags,
            opts=child_opts
        )

        # Attach policies to Lambda role
        aws.iam.RolePolicyAttachment(
            f'{name}-lambda-vpc-execution',
            role=self.lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
            opts=child_opts
        )

        # Create custom policy for Secrets Manager
        secrets_policy = aws.iam.Policy(
            f'{name}-lambda-secrets-policy',
            policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'secretsmanager:DescribeSecret',
                            'secretsmanager:GetSecretValue',
                            'secretsmanager:PutSecretValue',
                            'secretsmanager:UpdateSecretVersionStage'
                        ],
                        'Resource': '*'
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'secretsmanager:GetRandomPassword'
                        ],
                        'Resource': '*'
                    }
                ]
            }),
            opts=child_opts
        )

        aws.iam.RolePolicyAttachment(
            f'{name}-lambda-secrets-attach',
            role=self.lambda_role.name,
            policy_arn=secrets_policy.arn,
            opts=child_opts
        )

        # Create Lambda function for rotation
        self.rotation_lambda = aws.lambda_.Function(
            f'{name}-rotation-lambda',
            runtime='python3.11',
            handler='rotation_handler.lambda_handler',
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive('./lib/lambda')
            }),
            timeout=30,
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=private_subnet_ids,
                security_group_ids=[self.lambda_sg.id]
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'EXCLUDE_CHARACTERS': '/@"\'\\'
                }
            ),
            tags=self.tags,
            opts=child_opts
        )

        # Allow Secrets Manager to invoke Lambda
        aws.lambda_.Permission(
            f'{name}-lambda-invoke-permission',
            action='lambda:InvokeFunction',
            function=self.rotation_lambda.name,
            principal='secretsmanager.amazonaws.com',
            opts=child_opts
        )

        # Create initial secret
        initial_secret = {
            'username': 'globecart_admin',
            'password': 'ChangeMe123!',
            'engine': 'postgres',
            'port': 5432
        }

        self.db_secret = aws.secretsmanager.Secret(
            f'{name}-db-credentials',
            description='RDS Aurora PostgreSQL credentials for GlobeCart',
            tags=self.tags,
            opts=child_opts
        )

        # Configure rotation after secret creation
        self.secret_rotation = aws.secretsmanager.SecretRotation(
            f'{name}-rotation',
            secret_id=self.db_secret.id,
            rotation_lambda_arn=self.rotation_lambda.arn,
            rotation_rules=aws.secretsmanager.SecretRotationRotationRulesArgs(
                automatically_after_days=30
            ),
            opts=child_opts
        )

        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f'{name}-db-credentials-version',
            secret_id=self.db_secret.id,
            secret_string=Output.secret(json.dumps(initial_secret)),
            opts=child_opts
        )

        self.db_secret_arn = self.db_secret.arn
        self.rotation_lambda_sg_id = self.lambda_sg.id

        self.register_outputs({
            'db_secret_arn': self.db_secret_arn,
            'rotation_lambda_arn': self.rotation_lambda.arn,
        })

    def attach_to_rds(self, cluster_arn: Output[str], cluster_id: Output[str]):
        """
        Updates the Lambda function and secret with RDS connection information.
        """
        # Store RDS details for future use
        self.rds_cluster_arn = cluster_arn
        self.rds_cluster_id = cluster_id
