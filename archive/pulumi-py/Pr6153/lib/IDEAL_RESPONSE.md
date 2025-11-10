# Multi-Environment Payment Processing Infrastructure - Corrected Implementation

This is the ideal implementation after fixing all bugs found in the MODEL_RESPONSE.

## Summary of Fixes

All intentional bugs have been corrected:

1. Fixed CIDR calculation for subnet creation
2. Implemented secure random password generation
3. Added IAM authorization to API Gateway
4. Fixed deprecated Pulumi AWS provider parameters
5. Corrected import statements for Pulumi project structure

## File: /lib/tap_stack.py

```py
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import s3  # example import for any AWS resource

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.

    Note:
        - DO NOT create resources directly here unless they are truly global.
        - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Example usage of suffix and tags
        # You would replace this with instantiation of imported components like DynamoDBStack

        # s3.Bucket(f"tap-bucket-{self.environment_suffix}",
        #           tags=self.tags,
        #           opts=ResourceOptions(parent=self))

        # self.table = dynamodb_stack.table if you instantiate one

        # Register outputs if needed
        self.register_outputs({})

```

## File: /lib/compute.py

```py
"""Compute infrastructure components including Lambda and API Gateway."""
from typing import Dict, List, Optional
import json
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output, FileArchive


class ComputeStack(ComponentResource):
    """ComponentResource for compute infrastructure."""

    def __init__(
        self,
        name: str,
        environment: str,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        lambda_security_group_id: Output[str],
        dynamodb_table_name: Output[str],
        dynamodb_table_arn: Output[str],
        rds_endpoint: Output[str],
        tags: Dict[str, str],
        opts: Optional[ResourceOptions] = None,
    ):
        super().__init__("custom:compute:ComputeStack", name, {}, opts)

        # Create IAM role for Lambda
        self.lambda_role = aws.iam.Role(
            f"lambda-role-{environment}-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                }],
            }),
            tags=tags,
            opts=ResourceOptions(parent=self),
        )

        # Attach basic Lambda execution policy
        self.lambda_basic_policy_attachment = aws.iam.RolePolicyAttachment(
            f"lambda-basic-{environment}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=self),
        )

        # Create inline policy for DynamoDB access
        self.lambda_dynamodb_policy = aws.iam.RolePolicy(
            f"lambda-dynamodb-{environment}",
            role=self.lambda_role.id,
            policy=dynamodb_table_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:UpdateItem",
                    ],
                    "Resource": arn,
                }],
            })),
            opts=ResourceOptions(parent=self),
        )

        # Create CloudWatch Log Group for Lambda
        self.lambda_log_group = aws.cloudwatch.LogGroup(
            f"lambda-logs-{environment}-{environment_suffix}",
            name=f"/aws/lambda/payment-processor-{environment}-{environment_suffix}",
            retention_in_days=7,
            tags=tags,
            opts=ResourceOptions(parent=self),
        )

        # Create Lambda function
        self.lambda_function = aws.lambda_.Function(
            f"payment-processor-{environment}-{environment_suffix}",
            name=f"payment-processor-{environment}-{environment_suffix}",
            runtime="python3.11",
            handler="payment_processor.handler",
            role=self.lambda_role.arn,
            code=FileArchive("./lambda"),
            timeout=30,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": environment,
                    "DYNAMODB_TABLE": dynamodb_table_name,
                    "RDS_ENDPOINT": rds_endpoint,
                },
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=private_subnet_ids,
                security_group_ids=[lambda_security_group_id],
            ),
            tags=tags,
            opts=ResourceOptions(parent=self, depends_on=[self.lambda_log_group]),
        )

        # Create API Gateway REST API
        self.api = aws.apigateway.RestApi(
            f"payment-api-{environment}-{environment_suffix}",
            name=f"payment-api-{environment}-{environment_suffix}",
            description=f"Payment processing API for {environment}",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL",
            ),
            tags=tags,
            opts=ResourceOptions(parent=self),
        )

        # Create API Gateway resource
        self.api_resource = aws.apigateway.Resource(
            f"payment-resource-{environment}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="payments",
            opts=ResourceOptions(parent=self),
        )

        # Create API Gateway method with IAM authorization
        self.api_method = aws.apigateway.Method(
            f"payment-method-{environment}",
            rest_api=self.api.id,
            resource_id=self.api_resource.id,
            http_method="POST",
            authorization="AWS_IAM",
            opts=ResourceOptions(parent=self),
        )

        # Create Lambda integration
        self.api_integration = aws.apigateway.Integration(
            f"payment-integration-{environment}",
            rest_api=self.api.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_function.invoke_arn,
            opts=ResourceOptions(parent=self),
        )

        # Grant API Gateway permission to invoke Lambda
        self.lambda_permission = aws.lambda_.Permission(
            f"api-lambda-permission-{environment}",
            action="lambda:InvokeFunction",
            function=self.lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=self.api.execution_arn.apply(lambda arn: f"{arn}/*/*"),
            opts=ResourceOptions(parent=self),
        )

        # Create API Gateway deployment
        self.api_deployment = aws.apigateway.Deployment(
            f"payment-deployment-{environment}",
            rest_api=self.api.id,
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.api_integration],
            ),
        )

        # Create API Gateway stage
        self.api_stage = aws.apigateway.Stage(
            f"payment-stage-{environment}",
            rest_api=self.api.id,
            deployment=self.api_deployment.id,
            stage_name=environment,
            tags=tags,
            opts=ResourceOptions(parent=self),
        )

        # Create CloudWatch Log Group for API Gateway
        self.api_log_group = aws.cloudwatch.LogGroup(
            f"api-logs-{environment}-{environment_suffix}",
            name=f"/aws/apigateway/payment-api-{environment}",
            retention_in_days=7,
            tags=tags,
            opts=ResourceOptions(parent=self),
        )

        # Expose outputs
        self.api_gateway_url = self.api_stage.invoke_url.apply(
            lambda url: f"{url}/payments"
        )
        self.lambda_function_name = self.lambda_function.name

        self.register_outputs({
            "api_gateway_url": self.api_gateway_url,
            "lambda_function_name": self.lambda_function_name,
        })

```

## File: /lib/network.py

```py
"""Network infrastructure components for payment processing system."""
from typing import Dict, List, Optional
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output


class NetworkStack(ComponentResource):
    """ComponentResource for VPC and networking infrastructure."""

    def __init__(
        self,
        name: str,
        vpc_cidr: str,
        environment: str,
        tags: Dict[str, str],
        opts: Optional[ResourceOptions] = None,
    ):
        super().__init__("custom:network:NetworkStack", name, {}, opts)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{environment}",
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"payment-vpc-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create public subnets (2 AZs)
        # Parse VPC CIDR to get base network (e.g., "10.0" from "10.0.0.0/16")
        vpc_base = ".".join(vpc_cidr.split("/")[0].split(".")[:2])

        self.public_subnets: List[aws.ec2.Subnet] = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{environment}-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"{vpc_base}.{i}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**tags, "Name": f"payment-public-{environment}-{i}", "Type": "Public"},
                opts=ResourceOptions(parent=self),
            )
            self.public_subnets.append(subnet)

        # Create private subnets (2 AZs)
        self.private_subnets: List[aws.ec2.Subnet] = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{environment}-{i}",
                vpc_id=self.vpc.id,
                cidr_block=f"{vpc_base}.{i+10}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=False,
                tags={**tags, "Name": f"payment-private-{environment}-{i}", "Type": "Private"},
                opts=ResourceOptions(parent=self),
            )
            self.private_subnets.append(subnet)

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{environment}",
            vpc_id=self.vpc.id,
            tags={**tags, "Name": f"payment-igw-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Create Elastic IP for NAT Gateway
        self.eip = aws.ec2.Eip(
            f"nat-eip-{environment}",
            domain="vpc",
            tags={**tags, "Name": f"payment-nat-eip-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Create NAT Gateway in first public subnet
        self.nat_gateway = aws.ec2.NatGateway(
            f"nat-{environment}",
            allocation_id=self.eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={**tags, "Name": f"payment-nat-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Create public route table
        self.public_rt = aws.ec2.RouteTable(
            f"public-rt-{environment}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id,
                )
            ],
            tags={**tags, "Name": f"payment-public-rt-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{environment}-{i}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self),
            )

        # Create private route table
        self.private_rt = aws.ec2.RouteTable(
            f"private-rt-{environment}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=self.nat_gateway.id,
                )
            ],
            tags={**tags, "Name": f"payment-private-rt-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{environment}-{i}",
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id,
                opts=ResourceOptions(parent=self),
            )

        # Create security group for Lambda functions
        self.lambda_sg = aws.ec2.SecurityGroup(
            f"lambda-sg-{environment}",
            vpc_id=self.vpc.id,
            description="Security group for Lambda functions",
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**tags, "Name": f"payment-lambda-sg-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Create security group for RDS
        self.db_sg = aws.ec2.SecurityGroup(
            f"db-sg-{environment}",
            vpc_id=self.vpc.id,
            description="Security group for RDS database",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self.lambda_sg.id],
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
            tags={**tags, "Name": f"payment-db-sg-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Expose outputs
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [s.id for s in self.public_subnets]
        self.private_subnet_ids = [s.id for s in self.private_subnets]
        self.lambda_security_group_id = self.lambda_sg.id
        self.db_security_group_id = self.db_sg.id

        self.register_outputs({
            "vpc_id": self.vpc_id,
            "public_subnet_ids": self.public_subnet_ids,
            "private_subnet_ids": self.private_subnet_ids,
            "lambda_security_group_id": self.lambda_security_group_id,
            "db_security_group_id": self.db_security_group_id,
        })

```

## File: /lib/payment_stack.py

```py
"""Main ComponentResource for payment processing infrastructure."""
import datetime
from typing import Optional

import pulumi
from pulumi import ComponentResource, ResourceOptions

from lib.compute import ComputeStack
from lib.network import NetworkStack
from lib.storage import StorageStack


class PaymentProcessingStack(ComponentResource):
    """ComponentResource that encapsulates the complete payment processing infrastructure."""

    def __init__(
        self,
        name: str,
        environment: str,
        environment_suffix: str,
        vpc_cidr: str,
        region: str,
        cost_center: str,
        enable_multi_az: bool = False,
        db_instance_class: str = "db.t3.micro",
        dynamodb_read_capacity: int = 5,
        dynamodb_write_capacity: int = 5,
        log_retention_days: int = 7,
        opts: Optional[ResourceOptions] = None,
    ):
        super().__init__("custom:infrastructure:PaymentProcessingStack", name, {}, opts)

        # Common tags for all resources
        self.common_tags = {
            "Environment": environment,
            "CostCenter": cost_center,
            "DeploymentTimestamp": datetime.datetime.now().isoformat(),
            "ManagedBy": "Pulumi",
            "Project": "PaymentProcessing",
        }

        # Create network infrastructure
        self.network = NetworkStack(
            name=f"network-{environment}-{environment_suffix}",
            vpc_cidr=vpc_cidr,
            environment=environment,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self),
        )

        # Create storage infrastructure
        self.storage = StorageStack(
            name=f"storage-{environment}-{environment_suffix}",
            environment=environment,
            environment_suffix=environment_suffix,
            vpc_id=self.network.vpc_id,
            private_subnet_ids=self.network.private_subnet_ids,
            db_security_group_id=self.network.db_security_group_id,
            enable_multi_az=enable_multi_az,
            db_instance_class=db_instance_class,
            dynamodb_read_capacity=dynamodb_read_capacity,
            dynamodb_write_capacity=dynamodb_write_capacity,
            log_retention_days=log_retention_days,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self),
        )

        # Create compute infrastructure
        self.compute = ComputeStack(
            name=f"compute-{environment}-{environment_suffix}",
            environment=environment,
            environment_suffix=environment_suffix,
            vpc_id=self.network.vpc_id,
            private_subnet_ids=self.network.private_subnet_ids,
            lambda_security_group_id=self.network.lambda_security_group_id,
            dynamodb_table_name=self.storage.dynamodb_table_name,
            dynamodb_table_arn=self.storage.dynamodb_table_arn,
            rds_endpoint=self.storage.rds_endpoint,
            tags=self.common_tags,
            opts=ResourceOptions(parent=self),
        )

        # Expose outputs
        self.vpc_id = self.network.vpc_id
        self.public_subnet_ids = self.network.public_subnet_ids
        self.private_subnet_ids = self.network.private_subnet_ids
        self.api_gateway_url = self.compute.api_gateway_url
        self.dynamodb_table_name = self.storage.dynamodb_table_name
        self.rds_endpoint = self.storage.rds_endpoint
        self.audit_bucket_name = self.storage.audit_bucket_name
        self.lambda_function_name = self.compute.lambda_function_name

        self.register_outputs({
            "vpc_id": self.vpc_id,
            "public_subnet_ids": self.public_subnet_ids,
            "private_subnet_ids": self.private_subnet_ids,
            "api_gateway_url": self.api_gateway_url,
            "dynamodb_table_name": self.dynamodb_table_name,
            "rds_endpoint": self.rds_endpoint,
            "audit_bucket_name": self.audit_bucket_name,
            "lambda_function_name": self.lambda_function_name,
        })

```

## File: /lib/storage.py

```py
"""Storage infrastructure components including DynamoDB, RDS, and S3."""
from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
import pulumi_random as random
from pulumi import ComponentResource, Output, ResourceOptions


class StorageStack(ComponentResource):
    """ComponentResource for data storage infrastructure."""

    def __init__(
        self,
        name: str,
        environment: str,
        environment_suffix: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        db_security_group_id: Output[str],
        enable_multi_az: bool,
        db_instance_class: str,
        dynamodb_read_capacity: int,
        dynamodb_write_capacity: int,
        log_retention_days: int,
        tags: Dict[str, str],
        opts: Optional[ResourceOptions] = None,
    ):
        super().__init__("custom:storage:StorageStack", name, {}, opts)

        # Create DynamoDB table for transactions
        self.dynamodb_table = aws.dynamodb.Table(
            f"transactions-{environment}-{environment_suffix}",
            name=f"transactions-{environment}-{environment_suffix}",
            billing_mode="PROVISIONED",
            hash_key="transactionId",
            range_key="timestamp",
            read_capacity=dynamodb_read_capacity,
            write_capacity=dynamodb_write_capacity,
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="transactionId", type="S"),
                aws.dynamodb.TableAttributeArgs(name="timestamp", type="N"),
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True,
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
            ),
            tags={**tags, "Name": f"transactions-{environment}"},
            opts=ResourceOptions(parent=self),
        )
        self.db_password = random.RandomPassword(
            f"db-password-{environment}-{environment_suffix}",
            length=16,
            special=True,
            override_special="!#$%&*()-_=+[]{}<>:?",
            opts=ResourceOptions(parent=self),
        )

        # Store database password in Parameter Store
        self.db_password_param = aws.ssm.Parameter(
            f"db-password-param-{environment}-{environment_suffix}",
            name=f"/payment/{environment}/db-password",
            type="SecureString",
            value=self.db_password.result,
            description=f"RDS password for {environment} environment",
            tags=tags,
            opts=ResourceOptions(parent=self),
        )

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{environment}",
            subnet_ids=private_subnet_ids,
            tags={**tags, "Name": f"payment-db-subnet-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Create RDS PostgreSQL instance
        self.rds_instance = aws.rds.Instance(
            f"postgres-{environment}-{environment_suffix}",
            identifier=f"payment-db-{environment}-{environment_suffix}",
            engine="postgres",
            engine_version="14.7",
            instance_class=db_instance_class,
            allocated_storage=20,
            storage_type="gp3",
            db_name="payments",
            username="dbadmin",
            password=self.db_password.result,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[db_security_group_id],
            multi_az=enable_multi_az,
            publicly_accessible=False,
            skip_final_snapshot=True,  # OK for dev/staging, should be False for production
            backup_retention_period=7 if enable_multi_az else 1,
            storage_encrypted=True,
            tags={**tags, "Name": f"payment-db-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Create S3 bucket for audit logs
        self.audit_bucket = aws.s3.Bucket(
            f"audit-logs-{environment}-{environment_suffix}",
            bucket=f"payment-audit-{environment}-{environment_suffix}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=(
                aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=(
                            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                                sse_algorithm="AES256",
                            )
                        ),
                    ),
                )
            ),
            lifecycle_rules=[
                aws.s3.BucketLifecycleRuleArgs(
                    enabled=True,
                    id="delete-old-logs",
                    expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                        days=log_retention_days,
                    ),
                )
            ],
            tags={**tags, "Name": f"payment-audit-{environment}"},
            opts=ResourceOptions(parent=self),
        )

        # Block public access to S3 bucket
        self.bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"audit-bucket-block-{environment}",
            bucket=self.audit_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self),
        )

        # Expose outputs
        self.dynamodb_table_name = self.dynamodb_table.name
        self.dynamodb_table_arn = self.dynamodb_table.arn
        self.rds_endpoint = self.rds_instance.endpoint
        self.audit_bucket_name = self.audit_bucket.bucket

        self.register_outputs({
            "dynamodb_table_name": self.dynamodb_table_name,
            "dynamodb_table_arn": self.dynamodb_table_arn,
            "rds_endpoint": self.rds_endpoint,
            "audit_bucket_name": self.audit_bucket.bucket,
        })

```
