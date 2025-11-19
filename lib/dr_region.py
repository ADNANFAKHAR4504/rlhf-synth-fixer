"""
dr_region.py

Disaster Recovery region (us-east-2) infrastructure component.
Includes VPC, Aurora Global Database secondary cluster, Lambda, API Gateway, and S3.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
import json


class DRRegionArgs:
    """Arguments for DR region infrastructure."""
    def __init__(
        self,
        environment_suffix: str,
        region: str,
        global_cluster_id: Output[str],
        replication_role_arn: Output[str],
        primary_bucket_arn: Output[str],
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.region = region
        self.global_cluster_id = global_cluster_id
        self.replication_role_arn = replication_role_arn
        self.primary_bucket_arn = primary_bucket_arn
        self.tags = tags or {}


class DRRegion(pulumi.ComponentResource):
    """
    Disaster recovery region infrastructure.

    Creates all resources needed in the DR region including
    networking, database secondary, compute, and storage layers.
    """

    def __init__(
        self,
        name: str,
        args: DRRegionArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:dr:DRRegion', name, None, opts)

        # Create provider for DR region
        self.provider = aws.Provider(
            f'dr-provider-{args.environment_suffix}',
            region=args.region,
            opts=ResourceOptions(parent=self)
        )

        # VPC and networking
        self._create_vpc(args)

        # Security groups
        self._create_security_groups(args)

        # IAM roles
        self._create_iam_roles(args)

        # Aurora Global Database secondary cluster
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

    def _create_vpc(self, args: DRRegionArgs):
        """Create VPC with public and private subnets."""
        self.vpc = aws.ec2.Vpc(
            f'vpc-dr-{args.environment_suffix}',
            cidr_block='10.1.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**args.tags, 'Name': f'vpc-dr-{args.environment_suffix}', 'Region': 'us-east-2'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f'igw-dr-{args.environment_suffix}',
            vpc_id=self.vpc.id,
            tags={**args.tags, 'Name': f'igw-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Private subnets for Aurora across 3 AZs
        self.private_subnet_1 = aws.ec2.Subnet(
            f'private-subnet-dr-1-{args.environment_suffix}',
            vpc_id=self.vpc.id,
            cidr_block='10.1.1.0/24',
            availability_zone=f'{args.region}a',
            tags={**args.tags, 'Name': f'private-subnet-dr-1-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.private_subnet_2 = aws.ec2.Subnet(
            f'private-subnet-dr-2-{args.environment_suffix}',
            vpc_id=self.vpc.id,
            cidr_block='10.1.2.0/24',
            availability_zone=f'{args.region}b',
            tags={**args.tags, 'Name': f'private-subnet-dr-2-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.private_subnet_3 = aws.ec2.Subnet(
            f'private-subnet-dr-3-{args.environment_suffix}',
            vpc_id=self.vpc.id,
            cidr_block='10.1.3.0/24',
            availability_zone=f'{args.region}c',
            tags={**args.tags, 'Name': f'private-subnet-dr-3-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Public subnet for NAT
        self.public_subnet = aws.ec2.Subnet(
            f'public-subnet-dr-{args.environment_suffix}',
            vpc_id=self.vpc.id,
            cidr_block='10.1.10.0/24',
            availability_zone=f'{args.region}a',
            map_public_ip_on_launch=True,
            tags={**args.tags, 'Name': f'public-subnet-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # EIP and NAT Gateway
        self.eip = aws.ec2.Eip(
            f'eip-dr-{args.environment_suffix}',
            domain='vpc',
            tags={**args.tags, 'Name': f'eip-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.nat_gateway = aws.ec2.NatGateway(
            f'nat-dr-{args.environment_suffix}',
            allocation_id=self.eip.id,
            subnet_id=self.public_subnet.id,
            tags={**args.tags, 'Name': f'nat-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # Route tables
        self.public_rt = aws.ec2.RouteTable(
            f'public-rt-dr-{args.environment_suffix}',
            vpc_id=self.vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(
                cidr_block='0.0.0.0/0',
                gateway_id=self.igw.id
            )],
            tags={**args.tags, 'Name': f'public-rt-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        aws.ec2.RouteTableAssociation(
            f'public-rta-dr-{args.environment_suffix}',
            subnet_id=self.public_subnet.id,
            route_table_id=self.public_rt.id,
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.private_rt = aws.ec2.RouteTable(
            f'private-rt-dr-{args.environment_suffix}',
            vpc_id=self.vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(
                cidr_block='0.0.0.0/0',
                nat_gateway_id=self.nat_gateway.id
            )],
            tags={**args.tags, 'Name': f'private-rt-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        for idx, subnet in enumerate([self.private_subnet_1, self.private_subnet_2, self.private_subnet_3], 1):
            aws.ec2.RouteTableAssociation(
                f'private-rta-dr-{idx}-{args.environment_suffix}',
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id,
                opts=ResourceOptions(parent=self, provider=self.provider)
            )

        # DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f'db-subnet-group-dr-{args.environment_suffix}',
            subnet_ids=[self.private_subnet_1.id, self.private_subnet_2.id, self.private_subnet_3.id],
            tags={**args.tags, 'Name': f'db-subnet-group-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.vpc_id = self.vpc.id

    def _create_security_groups(self, args: DRRegionArgs):
        """Create security groups for resources."""
        self.aurora_sg = aws.ec2.SecurityGroup(
            f'aurora-sg-dr-{args.environment_suffix}',
            vpc_id=self.vpc.id,
            description='Security group for Aurora cluster',
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                from_port=5432,
                to_port=5432,
                protocol='tcp',
                cidr_blocks=['10.1.0.0/16']
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol='-1',
                cidr_blocks=['0.0.0.0/0']
            )],
            tags={**args.tags, 'Name': f'aurora-sg-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.lambda_sg = aws.ec2.SecurityGroup(
            f'lambda-sg-dr-{args.environment_suffix}',
            vpc_id=self.vpc.id,
            description='Security group for Lambda functions',
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol='-1',
                cidr_blocks=['0.0.0.0/0']
            )],
            tags={**args.tags, 'Name': f'lambda-sg-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

    def _create_iam_roles(self, args: DRRegionArgs):
        """Create IAM roles for Lambda."""
        self.lambda_role = aws.iam.Role(
            f'lambda-role-dr-{args.environment_suffix}',
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {'Service': 'lambda.amazonaws.com'},
                    'Action': 'sts:AssumeRole'
                }]
            }),
            tags={**args.tags, 'Name': f'lambda-role-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        aws.iam.RolePolicyAttachment(
            f'lambda-basic-execution-dr-{args.environment_suffix}',
            role=self.lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        aws.iam.RolePolicyAttachment(
            f'lambda-vpc-execution-dr-{args.environment_suffix}',
            role=self.lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

    def _create_aurora_cluster(self, args: DRRegionArgs):
        """Create Aurora Global Database secondary cluster."""
        self.aurora_cluster = aws.rds.Cluster(
            f'aurora-dr-{args.environment_suffix}',
            cluster_identifier=f'aurora-dr-{args.environment_suffix}',
            engine='aurora-postgresql',
            engine_version='14.6',
            engine_mode='provisioned',
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.aurora_sg.id],
            global_cluster_identifier=args.global_cluster_id,
            skip_final_snapshot=True,
            deletion_protection=False,
            tags={**args.tags, 'Name': f'aurora-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.aurora_instance = aws.rds.ClusterInstance(
            f'aurora-instance-dr-{args.environment_suffix}',
            identifier=f'aurora-instance-dr-{args.environment_suffix}',
            cluster_identifier=self.aurora_cluster.id,
            instance_class='db.r5.large',
            engine='aurora-postgresql',
            engine_version='14.6',
            publicly_accessible=False,
            tags={**args.tags, 'Name': f'aurora-instance-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.aurora_cluster_arn = self.aurora_cluster.arn
        self.aurora_cluster_endpoint = self.aurora_cluster.endpoint

    def _create_lambda_functions(self, args: DRRegionArgs):
        """Create Lambda functions for payment processing."""
        lambda_code = '''
import json
import os

def handler(event, context):
    """Payment validation Lambda function."""
    print(f"Processing payment request: {json.dumps(event)}")

    body = json.loads(event.get('body', '{}'))
    payment_id = body.get('payment_id', 'unknown')
    amount = body.get('amount', 0)

    response = {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Payment validated successfully',
            'payment_id': payment_id,
            'amount': amount,
            'region': os.environ.get('AWS_REGION'),
            'status': 'validated'
        })
    }

    return response
'''

        self.payment_lambda = aws.lambda_.Function(
            f'payment-processor-dr-{args.environment_suffix}',
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
            tags={**args.tags, 'Name': f'payment-processor-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.lambda_arn = self.payment_lambda.arn
        self.lambda_invoke_arn = self.payment_lambda.invoke_arn
        self.lambda_function_name = self.payment_lambda.name

    def _create_api_gateway(self, args: DRRegionArgs):
        """Create API Gateway REST API."""
        self.api = aws.apigateway.RestApi(
            f'payment-api-dr-{args.environment_suffix}',
            name=f'payment-api-dr-{args.environment_suffix}',
            description='Payment processing API - DR region',
            tags={**args.tags, 'Name': f'payment-api-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.api_resource = aws.apigateway.Resource(
            f'api-resource-dr-{args.environment_suffix}',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='payment',
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.api_method = aws.apigateway.Method(
            f'api-method-dr-{args.environment_suffix}',
            rest_api=self.api.id,
            resource_id=self.api_resource.id,
            http_method='POST',
            authorization='NONE',
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.api_integration = aws.apigateway.Integration(
            f'api-integration-dr-{args.environment_suffix}',
            rest_api=self.api.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method.http_method,
            integration_http_method='POST',
            type='AWS_PROXY',
            uri=self.lambda_invoke_arn,
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        aws.lambda_.Permission(
            f'api-lambda-permission-dr-{args.environment_suffix}',
            action='lambda:InvokeFunction',
            function=self.payment_lambda.name,
            principal='apigateway.amazonaws.com',
            source_arn=pulumi.Output.concat(self.api.execution_arn, '/*/*'),
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.api_deployment = aws.apigateway.Deployment(
            f'api-deployment-dr-{args.environment_suffix}',
            rest_api=self.api.id,
            opts=ResourceOptions(parent=self, provider=self.provider, depends_on=[self.api_integration])
        )

        self.api_stage = aws.apigateway.Stage(
            f'api-stage-dr-{args.environment_suffix}',
            deployment=self.api_deployment.id,
            rest_api=self.api.id,
            stage_name='prod',
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.api_endpoint = pulumi.Output.concat(
            'https://',
            self.api.id,
            '.execute-api.',
            args.region,
            '.amazonaws.com/prod/payment'
        )

    def _create_s3_bucket(self, args: DRRegionArgs):
        """Create S3 bucket as replication target."""
        self.bucket = aws.s3.Bucket(
            f'dr-secondary-bucket-{args.environment_suffix}',
            bucket=f'dr-secondary-bucket-{args.environment_suffix}',
            tags={**args.tags, 'Name': f'dr-secondary-bucket-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.bucket_versioning = aws.s3.BucketVersioning(
            f'bucket-versioning-dr-{args.environment_suffix}',
            bucket=self.bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        # pylint: disable=line-too-long
        sse_default = aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm='AES256'
        )
        rule_args = aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=sse_default
        )
        self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfiguration(
            f'bucket-encryption-dr-{args.environment_suffix}',
            bucket=self.bucket.id,
            rules=[rule_args],
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        aws.s3.BucketPublicAccessBlock(
            f'bucket-public-access-block-dr-{args.environment_suffix}',
            bucket=self.bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.bucket_id = self.bucket.id
        self.bucket_name = self.bucket.bucket
        self.bucket_arn = self.bucket.arn

    def _create_sns_topic(self, args: DRRegionArgs):
        """Create SNS topic for alerts."""
        self.sns_topic = aws.sns.Topic(
            f'dr-alerts-dr-{args.environment_suffix}',
            name=f'dr-alerts-dr-{args.environment_suffix}',
            tags={**args.tags, 'Name': f'dr-alerts-dr-{args.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.provider)
        )

        self.sns_topic_arn = self.sns_topic.arn
