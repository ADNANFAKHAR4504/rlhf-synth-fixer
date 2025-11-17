"""Main Pulumi stack for multi-environment infrastructure deployment."""
import json
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output
from typing import Dict, List, Optional


class PaymentEnvironment(ComponentResource):
    """
    Reusable ComponentResource that encapsulates all infrastructure for a single environment.
    This ensures consistency across development, staging, and production environments.
    """

    def __init__(
        self,
        name: str,
        environment: str,
        config: Dict,
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize the PaymentEnvironment component.

        Args:
            name: Component name
            environment: Environment name (dev/staging/prod)
            config: Configuration dictionary containing environment-specific values
            opts: Pulumi resource options
        """
        super().__init__("custom:infrastructure:PaymentEnvironment", name, None, opts)

        # Store configuration
        self.environment = environment
        self.config = config
        self.region = config["region"]
        self.cidr_block = config["cidr_block"]
        self.instance_type = config["instance_type"]
        self.backup_retention = config["backup_retention"]
        self.environment_suffix = config["environment_suffix"]

        # Common tags for all resources
        self.tags = {
            "Environment": environment,
            "ManagedBy": "Pulumi",
            "Project": "PaymentSystem"
        }

        # Create VPC infrastructure
        self._create_vpc()

        # Create security groups
        self._create_security_groups()

        # Create database secrets
        self._create_secrets()

        # Create RDS Aurora cluster
        self._create_database()

        # Create Lambda function
        self._create_lambda()

        # Create S3 bucket
        self._create_s3_bucket()

        # Register outputs
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "rds_endpoint": self.rds_cluster.endpoint,
            "s3_bucket_name": self.s3_bucket.bucket,
            "lambda_function_arn": self.lambda_function.arn
        })

    def _create_vpc(self):
        """Create VPC with multi-AZ subnets and NAT gateways."""
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{self.environment_suffix}",
            cidr_block=self.cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, "Name": f"vpc-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Get availability zones
        azs = aws.get_availability_zones(state="available")
        self.availability_zones = azs.names[:3]  # Use first 3 AZs

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"igw-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create public and private subnets in each AZ
        self.public_subnets = []
        self.private_subnets = []
        self.nat_gateways = []
        self.eips = []

        for i, az in enumerate(self.availability_zones):
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"public-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"{self.cidr_block.rsplit('.', 2)[0]}.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**self.tags, "Name": f"public-subnet-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"private-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"{self.cidr_block.rsplit('.', 2)[0]}.{i+10}.0/24",
                availability_zone=az,
                tags={**self.tags, "Name": f"private-subnet-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(private_subnet)

            # Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"nat-eip-{i}-{self.environment_suffix}",
                domain="vpc",
                tags={**self.tags, "Name": f"nat-eip-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )
            self.eips.append(eip)

            # NAT Gateway in public subnet
            nat_gateway = aws.ec2.NatGateway(
                f"nat-gateway-{i}-{self.environment_suffix}",
                subnet_id=public_subnet.id,
                allocation_id=eip.id,
                tags={**self.tags, "Name": f"nat-gateway-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self, depends_on=[self.igw])
            )
            self.nat_gateways.append(nat_gateway)

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, "Name": f"public-rt-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Public route to internet gateway
        aws.ec2.Route(
            f"public-route-{self.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Create private route tables (one per AZ for NAT Gateway)
        for i, nat_gateway in enumerate(self.nat_gateways):
            private_route_table = aws.ec2.RouteTable(
                f"private-rt-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={**self.tags, "Name": f"private-rt-{i}-{self.environment_suffix}"},
                opts=ResourceOptions(parent=self)
            )

            # Private route to NAT gateway
            aws.ec2.Route(
                f"private-route-{i}-{self.environment_suffix}",
                route_table_id=private_route_table.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id,
                opts=ResourceOptions(parent=self)
            )

            # Associate private subnet with private route table
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i}-{self.environment_suffix}",
                subnet_id=self.private_subnets[i].id,
                route_table_id=private_route_table.id,
                opts=ResourceOptions(parent=self)
            )

    def _create_security_groups(self):
        """Create security groups for HTTPS and PostgreSQL traffic within VPC."""
        # Security group for Lambda functions
        self.lambda_sg = aws.ec2.SecurityGroup(
            f"lambda-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Lambda functions",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=[self.cidr_block],
                    description="HTTPS within VPC"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**self.tags, "Name": f"lambda-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Security group for RDS
        self.rds_sg = aws.ec2.SecurityGroup(
            f"rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS Aurora cluster",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=[self.cidr_block],
                    description="PostgreSQL within VPC"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**self.tags, "Name": f"rds-sg-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

    def _create_secrets(self):
        """Create AWS Secrets Manager secret for database password with rotation."""
        # Generate random password
        import random
        import string

        password = ''.join(
            random.choices(string.ascii_letters + string.digits, k=32)
        )

        # Create secret
        self.db_secret = aws.secretsmanager.Secret(
            f"db-password-{self.environment_suffix}",
            name=f"payment-db-password-{self.environment_suffix}",
            description=f"Database password for {self.environment} environment",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Store secret value
        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"db-password-version-{self.environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=json.dumps({
                "username": "paymentadmin",
                "password": password
            }),
            opts=ResourceOptions(parent=self)
        )

        # Note: Secret rotation commented out as it requires a dedicated rotation Lambda function
        # In production, implement a proper rotation Lambda and uncomment this section
        # self.db_secret_rotation = aws.secretsmanager.SecretRotation(
        #     f"db-password-rotation-{self.environment_suffix}",
        #     secret_id=self.db_secret.id,
        #     rotation_lambda_arn=self._get_rotation_lambda_arn(),
        #     rotation_rules=aws.secretsmanager.SecretRotationRotationRulesArgs(
        #         automatically_after_days=30
        #     ),
        #     opts=ResourceOptions(parent=self, depends_on=[self.db_secret_version])
        # )

    def _get_rotation_lambda_arn(self) -> str:
        """
        Get the ARN for the Secrets Manager rotation Lambda function.
        In a real implementation, this would be a Lambda function that rotates the secret.
        For this example, we'll use a placeholder.
        """
        # This would typically be a Lambda function ARN created separately
        # For demo purposes, we'll use a placeholder
        return f"arn:aws:lambda:{self.region}:123456789012:function:SecretsManagerRotation"

    def _create_database(self):
        """Create RDS Aurora PostgreSQL cluster."""
        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"db-subnet-group-{self.environment_suffix.lower()}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={**self.tags, "Name": f"db-subnet-group-{self.environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Create RDS Aurora cluster
        self.rds_cluster = aws.rds.Cluster(
            f"aurora-cluster-{self.environment_suffix}",
            cluster_identifier=f"payment-cluster-{self.environment_suffix.lower()}",
            engine=aws.rds.EngineType.AURORA_POSTGRESQL,
            engine_version="15.6",
            database_name="paymentdb",
            master_username="paymentadmin",
            master_password=self.db_secret_version.secret_string.apply(
                lambda s: json.loads(s)["password"]
            ),
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            backup_retention_period=self.backup_retention,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,  # For testing; should be False in production
            tags=self.tags,
            opts=ResourceOptions(parent=self, depends_on=[self.db_secret_version])
        )

        # Create cluster instances
        for i in range(2):  # Create 2 instances for HA
            aws.rds.ClusterInstance(
                f"aurora-instance-{i}-{self.environment_suffix}",
                identifier=f"payment-instance-{i}-{self.environment_suffix.lower()}",
                cluster_identifier=self.rds_cluster.id,
                instance_class=self.instance_type,
                engine=aws.rds.EngineType.AURORA_POSTGRESQL,
                engine_version="15.6",
                publicly_accessible=False,
                tags=self.tags,
                opts=ResourceOptions(parent=self)
            )

    def _create_lambda(self):
        """Create Lambda function for payment validation."""
        # Create IAM role for Lambda
        lambda_role = aws.iam.Role(
            f"lambda-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"lambda-basic-policy-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Attach VPC execution policy
        aws.iam.RolePolicyAttachment(
            f"lambda-vpc-policy-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Create policy for Secrets Manager access
        secrets_policy = aws.iam.Policy(
            f"lambda-secrets-policy-{self.environment_suffix}",
            policy=self.db_secret.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue"
                    ],
                    "Resource": arn
                }]
            })),
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"lambda-secrets-policy-attachment-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn=secrets_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # Lambda function code
        lambda_code = """
import json
import os

def handler(event, context):
    # Payment validation logic
    payment_data = json.loads(event.get('body', '{}'))

    # Validate payment
    if 'amount' not in payment_data or 'currency' not in payment_data:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid payment data'})
        }

    # Perform validation
    is_valid = payment_data['amount'] > 0

    return {
        'statusCode': 200,
        'body': json.dumps({
            'valid': is_valid,
            'message': 'Payment validated successfully'
        })
    }
"""

        # Create Lambda function
        self.lambda_function = aws.lambda_.Function(
            f"payment-validator-{self.environment_suffix}",
            name=f"payment-validator-{self.environment_suffix}",
            runtime=aws.lambda_.Runtime.PYTHON3D9,
            role=lambda_role.arn,
            handler="index.handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            memory_size=512,  # Consistent 512MB across all environments
            timeout=30,
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[subnet.id for subnet in self.private_subnets],
                security_group_ids=[self.lambda_sg.id]
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": self.environment,
                    "DB_SECRET_ARN": self.db_secret.arn
                }
            ),
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

    def _create_s3_bucket(self):
        """Create S3 bucket with lifecycle policies for transaction logs."""
        import random
        import string
        # Generate a random suffix to ensure bucket name uniqueness
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        # Create S3 bucket
        self.s3_bucket = aws.s3.Bucket(
            f"transaction-logs-{self.environment_suffix}",
            bucket=f"payment-transaction-logs-{self.environment_suffix.lower()}-{random_suffix}",
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Configure bucket versioning
        aws.s3.BucketVersioningV2(
            f"bucket-versioning-{self.environment_suffix}",
            bucket=self.s3_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Configure lifecycle policy (90-day archival)
        aws.s3.BucketLifecycleConfigurationV2(
            f"bucket-lifecycle-{self.environment_suffix}",
            bucket=self.s3_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="archive-old-logs",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                            days=90,
                            storage_class="GLACIER"
                        )
                    ]
                )
            ],
            opts=ResourceOptions(parent=self)
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"bucket-public-access-block-{self.environment_suffix}",
            bucket=self.s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )

        # Enable encryption
        # pylint: disable=line-too-long
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"bucket-encryption-{self.environment_suffix}",
            bucket=self.s3_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ],
            opts=ResourceOptions(parent=self)
        )


class TapStack:
    """Main stack orchestrating multi-environment deployment."""

    def __init__(self):
        """Initialize the TapStack with environment configuration."""
        # Get Pulumi configuration
        config = pulumi.Config()
        stack_name = pulumi.get_stack()

        # Environment-specific configuration
        environment_configs = {
            "dev": {
                "region": "eu-west-2",
                "cidr_block": "10.0.0.0/16",
                "instance_type": "db.t3.medium",
                "backup_retention": 7,
                "environment_suffix": f"dev-{stack_name}"
            },
            "staging": {
                "region": "us-west-2",
                "cidr_block": "10.1.0.0/16",
                "instance_type": "db.r5.large",
                "backup_retention": 14,
                "environment_suffix": f"staging-{stack_name}"
            },
            "prod": {
                "region": "us-east-1",
                "cidr_block": "10.2.0.0/16",
                "instance_type": "db.r5.xlarge",
                "backup_retention": 30,
                "environment_suffix": f"prod-{stack_name}"
            }
        }

        # Get environment from stack config or default to dev
        environment = config.get("environment") or "dev"

        # Get configuration for this environment
        env_config = environment_configs.get(environment, environment_configs["dev"])

        # Create the environment infrastructure
        self.payment_env = PaymentEnvironment(
            f"payment-env-{environment}",
            environment,
            env_config
        )

        # Export stack outputs
        pulumi.export("environment", environment)
        pulumi.export("region", env_config["region"])
        pulumi.export("vpc_id", self.payment_env.vpc.id)
        pulumi.export("vpc_cidr", self.payment_env.vpc.cidr_block)
        pulumi.export("public_subnet_ids", [subnet.id for subnet in self.payment_env.public_subnets])
        pulumi.export("private_subnet_ids", [subnet.id for subnet in self.payment_env.private_subnets])
        pulumi.export("rds_cluster_endpoint", self.payment_env.rds_cluster.endpoint)
        pulumi.export("rds_cluster_reader_endpoint", self.payment_env.rds_cluster.reader_endpoint)
        pulumi.export("lambda_function_arn", self.payment_env.lambda_function.arn)
        pulumi.export("lambda_function_name", self.payment_env.lambda_function.name)
        pulumi.export("s3_bucket_name", self.payment_env.s3_bucket.bucket)
        pulumi.export("s3_bucket_arn", self.payment_env.s3_bucket.arn)
        pulumi.export("db_secret_arn", self.payment_env.db_secret.arn)
