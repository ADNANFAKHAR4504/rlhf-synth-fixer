"""
primary_region.py

Primary region (us-east-1) infrastructure component.
Includes VPC, Aurora primary cluster, Lambda, API Gateway, and S3.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class PrimaryRegionArgs:
    """Arguments for primary region infrastructure."""
    def __init__(
        self,
        environment_suffix: str,
        region: str,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.region = region
        self.tags = tags or {}


class PrimaryRegion(pulumi.ComponentResource):
    """
    Primary region disaster recovery infrastructure.

    Creates all resources needed in the primary region including
    networking, database, compute, and storage layers.
    """

    def __init__(
        self,
        name: str,
        args: PrimaryRegionArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:dr:PrimaryRegion', name, None, opts)

        # Create provider for primary region
        self.provider = aws.Provider(
            f'primary-provider-{args.environment_suffix}',
            region=args.region,
            opts=ResourceOptions(parent=self)
        )

        # VPC and networking
        self._create_vpc(args)

        # Security groups
        self._create_security_groups(args)

        # IAM roles
        self._create_iam_roles(args)

        # Aurora Global Database primary cluster
        self._create_aurora_cluster(args)

        # Lambda functions
        self._create_lambda_functions(args)

        # API Gateway
        self._create_api_gateway(args)

        # S3 bucket with replication
        self._create_s3_bucket(args)

        # SNS topic
        self._create_sns_topic(args)

        self.register_outputs({})

    def _create_vpc(self, args: PrimaryRegionArgs):
        """Create VPC with public and private subnets."""
        self.vpc = aws.ec2.Vpc(
            f'vpc-primary-{args.environment_suffix}',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**args.tags, 'Name': f'vpc-primary-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Private subnets for Aurora
        self.private_subnet_1 = aws.ec2.Subnet(
            f'private-subnet-1-{args.environment_suffix}',
            vpc_id=self.vpc.id,
            cidr_block='10.0.1.0/24',
            availability_zone=f'{args.region}a',
            tags={**args.tags, 'Name': f'private-subnet-1-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.private_subnet_2 = aws.ec2.Subnet(
            f'private-subnet-2-{args.environment_suffix}',
            vpc_id=self.vpc.id,
            cidr_block='10.0.2.0/24',
            availability_zone=f'{args.region}b',
            tags={**args.tags, 'Name': f'private-subnet-2-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f'db-subnet-group-{args.environment_suffix}',
            subnet_ids=[self.private_subnet_1.id, self.private_subnet_2.id],
            tags={**args.tags, 'Name': f'db-subnet-group-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.vpc_id = self.vpc.id

    def _create_security_groups(self, args: PrimaryRegionArgs):
        """Create security groups for resources."""
        # Aurora security group
        self.aurora_sg = aws.ec2.SecurityGroup(
            f'aurora-sg-primary-{args.environment_suffix}',
            vpc_id=self.vpc.id,
            description='Security group for Aurora cluster',
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                from_port=5432,
                to_port=5432,
                protocol='tcp',
                cidr_blocks=['10.0.0.0/16']
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol='-1',
                cidr_blocks=['0.0.0.0/0']
            )],
            tags={**args.tags, 'Name': f'aurora-sg-primary-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Lambda security group
        self.lambda_sg = aws.ec2.SecurityGroup(
            f'lambda-sg-primary-{args.environment_suffix}',
            vpc_id=self.vpc.id,
            description='Security group for Lambda functions',
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol='-1',
                cidr_blocks=['0.0.0.0/0']
            )],
            tags={**args.tags, 'Name': f'lambda-sg-primary-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

    def _create_iam_roles(self, args: PrimaryRegionArgs):
        """Create IAM roles for Lambda and replication."""
        # Lambda execution role
        self.lambda_role = aws.iam.Role(
            f'lambda-role-primary-{args.environment_suffix}',
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'Service': 'lambda.amazonaws.com'},
                    'Action': 'sts:AssumeRole'
                }]
            }),
            tags={**args.tags, 'Name': f'lambda-role-primary-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Attach Lambda basic execution policy
        aws.iam.RolePolicyAttachment(
            f'lambda-basic-execution-{args.environment_suffix}',
            role=self.lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Attach VPC execution policy
        aws.iam.RolePolicyAttachment(
            f'lambda-vpc-execution-{args.environment_suffix}',
            role=self.lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # S3 replication role
        self.replication_role = aws.iam.Role(
            f's3-replication-role-{args.environment_suffix}',
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'Service': 's3.amazonaws.com'},
                    'Action': 'sts:AssumeRole'
                }]
            }),
            tags={**args.tags, 'Name': f's3-replication-role-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.replication_role_arn = self.replication_role.arn

    def _create_aurora_cluster(self, args: PrimaryRegionArgs):
        """Create Aurora Global Database primary cluster."""
        # Global cluster
        self.global_cluster = aws.rds.GlobalCluster(
            f'aurora-global-{args.environment_suffix}',
            global_cluster_identifier=f'aurora-global-{args.environment_suffix}',
            engine='aurora-postgresql',
            engine_version='14.6',
            database_name='payments',
            opts=ResourceOptions(parent=self, provider=self.provider, protect=False)
        )

        # Primary cluster
        self.aurora_cluster = aws.rds.Cluster(
            f'aurora-primary-{args.environment_suffix}',
            cluster_identifier=f'aurora-primary-{args.environment_suffix}',
            engine='aurora-postgresql',
            engine_version='14.6',
            engine_mode='provisioned',
            database_name='payments',
            master_username='dbadmin',
            master_password='TempPassword123!',  # Should use Secrets Manager
            backup_retention_period=7,
            preferred_backup_window='03:00-04:00',
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.aurora_sg.id],
            global_cluster_identifier=self.global_cluster.id,
            skip_final_snapshot=True,
            tags={**args.tags, 'Name': f'aurora-primary-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider, depends_on=[self.global_cluster])
        )

        # Primary cluster instance
        self.aurora_instance = aws.rds.ClusterInstance(
            f'aurora-instance-primary-{args.environment_suffix}',
            identifier=f'aurora-instance-primary-{args.environment_suffix}',
            cluster_identifier=self.aurora_cluster.id,
            instance_class='db.r5.large',
            engine='aurora-postgresql',
            engine_version='14.6',
            publicly_accessible=False,
            tags={**args.tags, 'Name': f'aurora-instance-primary-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.aurora_cluster_arn = self.aurora_cluster.arn
        self.aurora_cluster_endpoint = self.aurora_cluster.endpoint

    def _create_lambda_functions(self, args: PrimaryRegionArgs):
        """Create Lambda functions for payment processing."""
        # Lambda function code
        lambda_code = '''
import json
import os

def handler(event, context):
    """Payment processing Lambda function."""
    print(f"Processing payment request: {json.dumps(event)}")

    # Extract payment details
    body = json.loads(event.get('body', '{}'))
    payment_id = body.get('payment_id', 'unknown')
    amount = body.get('amount', 0)

    # Simulate payment processing
    response = {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Payment processed successfully',
            'payment_id': payment_id,
            'amount': amount,
            'region': os.environ.get('AWS_REGION'),
            'status': 'completed'
        })
    }

    return response
'''

        # Create Lambda function
        self.payment_lambda = aws.lambda_.Function(
            f'payment-processor-primary-{args.environment_suffix}',
            runtime='python3.11',
            role=self.lambda_role.arn,
            handler='index.handler',
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(lambda_code)
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'REGION': args.region,
                    'ENVIRONMENT': args.environment_suffix
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[self.private_subnet_1.id, self.private_subnet_2.id],
                security_group_ids=[self.lambda_sg.id]
            ),
            timeout=30,
            memory_size=256,
            tags={**args.tags, 'Name': f'payment-processor-primary-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.lambda_arn = self.payment_lambda.arn
        self.lambda_invoke_arn = self.payment_lambda.invoke_arn

    def _create_api_gateway(self, args: PrimaryRegionArgs):
        """Create API Gateway REST API."""
        # REST API
        self.api = aws.apigateway.RestApi(
            f'payment-api-primary-{args.environment_suffix}',
            name=f'payment-api-primary-{args.environment_suffix}',
            description='Payment processing API - Primary region',
            tags={**args.tags, 'Name': f'payment-api-primary-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Resource
        self.api_resource = aws.apigateway.Resource(
            f'api-resource-primary-{args.environment_suffix}',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='payment',
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Method
        self.api_method = aws.apigateway.Method(
            f'api-method-primary-{args.environment_suffix}',
            rest_api=self.api.id,
            resource_id=self.api_resource.id,
            http_method='POST',
            authorization='NONE',
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Integration
        self.api_integration = aws.apigateway.Integration(
            f'api-integration-primary-{args.environment_suffix}',
            rest_api=self.api.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method.http_method,
            integration_http_method='POST',
            type='AWS_PROXY',
            uri=self.lambda_invoke_arn,
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Lambda permission
        aws.lambda_.Permission(
            f'api-lambda-permission-primary-{args.environment_suffix}',
            action='lambda:InvokeFunction',
            function=self.payment_lambda.name,
            principal='apigateway.amazonaws.com',
            source_arn=pulumi.Output.concat(self.api.execution_arn, '/*/*'),
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Deployment
        self.api_deployment = aws.apigateway.Deployment(
            f'api-deployment-primary-{args.environment_suffix}',
            rest_api=self.api.id,
            opts=ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[self.api_integration]
            )
        )

        # Stage
        self.api_stage = aws.apigateway.Stage(
            f'api-stage-primary-{args.environment_suffix}',
            deployment=self.api_deployment.id,
            rest_api=self.api.id,
            stage_name='prod',
            opts=ResourceOptions(
                parent=self,
                provider=self.provider
            )
        )

        self.api_endpoint = pulumi.Output.concat(
            'https://',
            self.api.id,
            '.execute-api.',
            args.region,
            '.amazonaws.com/prod/payment'
        )

    def _create_s3_bucket(self, args: PrimaryRegionArgs):
        """Create S3 bucket with versioning and encryption."""
        self.bucket = aws.s3.Bucket(
            f'dr-primary-bucket-{args.environment_suffix}',
            bucket=f'dr-primary-bucket-{args.environment_suffix}',
            tags={**args.tags, 'Name': f'dr-primary-bucket-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider, protect=False)
        )

        # Enable versioning - Using non-deprecated resource
        self.bucket_versioning = aws.s3.BucketVersioning(
            f'bucket-versioning-primary-{args.environment_suffix}',
            bucket=self.bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Enable encryption - Using non-deprecated resource
        # pylint: disable=line-too-long
        self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfiguration(
            f'bucket-encryption-primary-{args.environment_suffix}',
            bucket=self.bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='AES256'
                )
            )],
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.bucket_id = self.bucket.id
        self.bucket_name = self.bucket.bucket
        self.bucket_arn = self.bucket.arn

    def _create_sns_topic(self, args: PrimaryRegionArgs):
        """Create SNS topic for alerts."""
        self.sns_topic = aws.sns.Topic(
            f'dr-alerts-primary-{args.environment_suffix}',
            name=f'dr-alerts-primary-{args.environment_suffix}',
            tags={**args.tags, 'Name': f'dr-alerts-primary-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider, protect=False)
        )

        self.sns_topic_arn = self.sns_topic.arn
