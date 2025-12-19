# Multi-Region DR Infrastructure - Initial Implementation

## File: lib/tap_stack.py

```python
"""
Multi-Region Disaster Recovery Stack for Payment Processing
"""

from typing import Optional, Dict, Any
import json

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

class TapStackArgs:
    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        primary_region: str = "us-east-1",
        dr_region: str = "us-east-2"
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.primary_region = primary_region
        self.dr_region = dr_region


class TapStack(pulumi.ComponentResource):
    """
    Multi-region disaster recovery infrastructure.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.primary_region = args.primary_region
        self.dr_region = args.dr_region

        # Common tags
        self.common_tags = {
            "Environment": self.environment_suffix,
            "ManagedBy": "Pulumi"
        }

        # Create SNS topics
        self.primary_sns_topic = aws.sns.Topic(
            f"payment-notifications-{self.environment_suffix}",
            display_name="Payment Notifications",
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for Lambda
        self.lambda_role = self._create_lambda_role()

        # Create Aurora cluster
        self.aurora_cluster = self._create_aurora_cluster()

        # Create DynamoDB table
        self.dynamodb_table = self._create_dynamodb_table()

        # Create S3 bucket
        self.s3_bucket = self._create_s3_bucket()

        # Create Lambda function
        self.lambda_function = self._create_lambda()

        # Create API Gateway
        self.api_gateway = self._create_api_gateway()

        # Register outputs
        self.register_outputs({
            "aurora_endpoint": self.aurora_cluster.endpoint,
            "dynamodb_table_name": self.dynamodb_table.name,
            "s3_bucket": self.s3_bucket.id,
            "api_endpoint": self.api_gateway.id
        })

    def _create_lambda_role(self) -> aws.iam.Role:
        """Create Lambda execution role"""
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        role = aws.iam.Role(
            f"lambda-role-{self.environment_suffix}",
            assume_role_policy=assume_role_policy,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"lambda-basic-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=role)
        )

        return role

    def _create_aurora_cluster(self) -> aws.rds.Cluster:
        """Create Aurora cluster"""
        cluster = aws.rds.Cluster(
            f"payment-cluster-{self.environment_suffix}",
            cluster_identifier=f"payment-cluster-{self.environment_suffix}",
            engine="aurora-postgresql",
            engine_version="13.7",
            database_name="payments",
            master_username="admin",
            master_password="ChangeMe123!",
            skip_final_snapshot=True,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        aws.rds.ClusterInstance(
            f"payment-instance-{self.environment_suffix}",
            identifier=f"payment-instance-{self.environment_suffix}",
            cluster_identifier=cluster.id,
            instance_class="db.r6g.large",
            engine="aurora-postgresql",
            tags=self.common_tags,
            opts=ResourceOptions(parent=cluster)
        )

        return cluster

    def _create_dynamodb_table(self) -> aws.dynamodb.Table:
        """Create DynamoDB table"""
        table = aws.dynamodb.Table(
            f"transactions-{self.environment_suffix}",
            name=f"transactions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transactionId",
            attributes=[
                {"name": "transactionId", "type": "S"}
            ],
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        return table

    def _create_s3_bucket(self) -> aws.s3.Bucket:
        """Create S3 bucket"""
        bucket = aws.s3.Bucket(
            f"audit-logs-{self.environment_suffix}",
            bucket=f"audit-logs-{self.environment_suffix}",
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        return bucket

    def _create_lambda(self) -> aws.lambda_.Function:
        """Create Lambda function"""
        lambda_code = pulumi.AssetArchive({
            "index.py": pulumi.StringAsset("""
import json

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Payment validated'})
    }
""")
        })

        function = aws.lambda_.Function(
            f"payment-validator-{self.environment_suffix}",
            name=f"payment-validator-{self.environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=self.lambda_role.arn,
            code=lambda_code,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        return function

    def _create_api_gateway(self) -> aws.apigateway.RestApi:
        """Create API Gateway"""
        api = aws.apigateway.RestApi(
            f"payment-api-{self.environment_suffix}",
            name=f"payment-api-{self.environment_suffix}",
            description="Payment Processing API",
            tags=self.common_tags,
            opts=ResourceOptions(parent=self)
        )

        return api
```

## File: requirements.txt

```txt
pulumi>=3.0.0
pulumi-aws>=6.0.0
```
