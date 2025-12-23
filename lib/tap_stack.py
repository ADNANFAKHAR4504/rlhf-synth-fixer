"""
TapStack - AWS Infrastructure for Test Automation Platform
"""

import json

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, InvokeOptions


class TapStackArgs:
  def __init__(self, environment_suffix: str, tags: dict = None):
    self.environment_suffix = environment_suffix
    self.tags = tags or {}


class TapStack(ComponentResource):  # pylint: disable=too-many-instance-attributes
  def __init__(self, name: str, args: TapStackArgs, opts: ResourceOptions = None):
    super().__init__("custom:TapStack", name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.region = "us-east-1"
    self.common_tags = {
      **args.tags,
      "Project": "TapStack",
      "Stage": self.environment_suffix,
      "Managed": "pulumi",
    }

    self.provider = aws.Provider(
      f"TapStack-provider-{self.environment_suffix}",
      region=self.region,
      opts=ResourceOptions(parent=self)
    )

    # Initialize route tables that will be defined in _create_route_tables()
    self.public_rt = None
    self.private_rt = None

    self._create_networking()
    self._create_storage()
    self._create_compute()
    self._create_monitoring()

    self.register_outputs({
      "vpcId": self.vpc_id,
      "publicSubnetIds": self.public_subnet_ids,
      "privateSubnetIds": self.private_subnet_ids,
      "bucketName": self.bucket_name,
      "lambdaName": self.lambda_name,
    })

  def _create_networking(self):
    self.vpc = aws.ec2.Vpc(
      f"TapStack-vpc-{self.environment_suffix}",
      cidr_block="10.0.0.0/16",
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={
        **self.common_tags,
        "Name": f"TapStack-vpc-{self.environment_suffix}"
      },
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

    azs = aws.get_availability_zones(
      state="available",
      opts=InvokeOptions(provider=self.provider)
    ).names[:2]

    self.public_subnets = []
    for i, az in enumerate(azs):
      subnet = aws.ec2.Subnet(
        f"TapStack-public-{i}-{self.environment_suffix}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={
          **self.common_tags,
          "Name": f"TapStack-public-{i}-{self.environment_suffix}"
        },
        opts=ResourceOptions(provider=self.provider, parent=self)
      )
      self.public_subnets.append(subnet)

    self.private_subnets = []
    for i, az in enumerate(azs):
      subnet = aws.ec2.Subnet(
        f"TapStack-private-{i}-{self.environment_suffix}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i + 10}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=False,
        tags={
          **self.common_tags,
          "Name": f"TapStack-private-{i}-{self.environment_suffix}"
        },
        opts=ResourceOptions(provider=self.provider, parent=self)
      )
      self.private_subnets.append(subnet)

    self.igw = aws.ec2.InternetGateway(
      f"TapStack-igw-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      tags={
        **self.common_tags,
        "Name": f"TapStack-igw-{self.environment_suffix}"
      },
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

    self.eip = aws.ec2.Eip(
      f"TapStack-nat-eip-{self.environment_suffix}",
      tags=self.common_tags,
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

    self.nat_gw = aws.ec2.NatGateway(
      f"TapStack-natgw-{self.environment_suffix}",
      subnet_id=self.public_subnets[0].id,
      allocation_id=self.eip.id,
      tags={
        **self.common_tags,
        "Name": f"TapStack-natgw-{self.environment_suffix}"
      },
      opts=ResourceOptions(
        provider=self.provider,
        parent=self,
        depends_on=[self.igw]
      )
    )

    self._create_route_tables()

  def _create_route_tables(self):
    self.public_rt = aws.ec2.RouteTable(
      f"TapStack-public-rt-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      routes=[aws.ec2.RouteTableRouteArgs(
        cidr_block="0.0.0.0/0",
        gateway_id=self.igw.id
      )],
      tags={
        **self.common_tags,
        "Name": f"TapStack-public-rt-{self.environment_suffix}"
      },
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

    self.private_rt = aws.ec2.RouteTable(
      f"TapStack-private-rt-{self.environment_suffix}",
      vpc_id=self.vpc.id,
      routes=[aws.ec2.RouteTableRouteArgs(
        cidr_block="0.0.0.0/0",
        nat_gateway_id=self.nat_gw.id
      )],
      tags={
        **self.common_tags,
        "Name": f"TapStack-private-rt-{self.environment_suffix}"
      },
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
        f"TapStack-public-rta-{i}-{self.environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=self.public_rt.id,
        opts=ResourceOptions(provider=self.provider, parent=self)
      )

    for i, subnet in enumerate(self.private_subnets):
      aws.ec2.RouteTableAssociation(
        f"TapStack-private-rta-{i}-{self.environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=self.private_rt.id,
        opts=ResourceOptions(provider=self.provider, parent=self)
      )

  def _create_storage(self):
    """
    Create S3 bucket with security configurations and bucket notification to
    trigger Lambda.
    """
    bucket_name = f"tapstack-{self.environment_suffix}-bucket".lower()

    # Create bucket WITHOUT inline versioning/encryption (modern AWS provider pattern)
    self.s3_bucket = aws.s3.Bucket(
      f"TapStack-bucket-{self.environment_suffix}",
      bucket=bucket_name,
      force_destroy=True,
      tags=self.common_tags,
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

    # Create separate versioning resource (non-V2 version for LocalStack compatibility)
    self.bucket_versioning = aws.s3.BucketVersioning(
      f"TapStack-bucket-versioning-{self.environment_suffix}",
      bucket=self.s3_bucket.id,
      versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
        status="Enabled"
      ),
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

    # Create separate encryption resource (non-V2 version for LocalStack compatibility)
    self.bucket_encryption = aws.s3.BucketServerSideEncryptionConfiguration(
      f"TapStack-bucket-encryption-{self.environment_suffix}",
      bucket=self.s3_bucket.id,
      rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
          sse_algorithm="AES256"
        )
      )],
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

    # Block all public access to the bucket
    aws.s3.BucketPublicAccessBlock(
      f"TapStack-bucket-public-access-{self.environment_suffix}",
      bucket=self.s3_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

  def _create_compute(self):
    self.lambda_role = aws.iam.Role(
      f"TapStack-lambda-role-{self.environment_suffix}",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "lambda.amazonaws.com"},
          "Action": "sts:AssumeRole",
        }],
      }),
      tags=self.common_tags,
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"TapStack-lambda-basic-{self.environment_suffix}",
      role=self.lambda_role.name,
      policy_arn=(
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
      ),
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

    aws.iam.RolePolicy(
      f"TapStack-lambda-s3-policy-{self.environment_suffix}",
      role=self.lambda_role.id,
      policy=self.s3_bucket.id.apply(
        lambda b: json.dumps({
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Allow",
            "Action": ["s3:GetObject", "s3:GetObjectTagging"],
            "Resource": f"arn:aws:s3:::{b}/*",
          }]
        })
      ),
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

    lambda_code = """
import json
import boto3
import os
import logging
from urllib.parse import unquote_plus

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    try:
        stage = os.environ.get('STAGE', 'unknown')
        bucket_env = os.environ.get('BUCKET', 'unknown')

        logger.info(f"Processing S3 event in {stage} environment")

        s3_client = boto3.client('s3')

        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = unquote_plus(record['s3']['object']['key'])

            logger.info(f"Processing file: {key} from bucket: {bucket}")

            try:
                response = s3_client.head_object(Bucket=bucket, Key=key)
                file_size = response['ContentLength']
                last_modified = response['LastModified']

                logger.info(f"File details - Size: {file_size} bytes, Modified: {last_modified}")

            except Exception as e:
                logger.error(f"Error processing file {key}: {str(e)}")

        return {
            'statusCode': 200,
            'body': json.dumps('Files processed successfully')
        }

    except Exception as e:
        logger.error(f"Lambda execution error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
"""

    self.lambda_function = aws.lambda_.Function(
      f"TapStack-processor-{self.environment_suffix}",
      runtime="python3.9",
      role=self.lambda_role.arn,
      handler="index.handler",
      code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset(lambda_code)
      }),
      environment=aws.lambda_.FunctionEnvironmentArgs(variables={
        "STAGE": self.environment_suffix,
        "BUCKET": self.s3_bucket.bucket,
      }),
      timeout=30,
      memory_size=128,
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

    aws.lambda_.Permission(
      f"TapStack-allow-s3-{self.environment_suffix}",
      action="lambda:InvokeFunction",
      function=self.lambda_function.name,
      principal="s3.amazonaws.com",
      source_arn=self.s3_bucket.arn,
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

    aws.s3.BucketNotification(
      f"TapStack-bucket-notif-{self.environment_suffix}",
      bucket=self.s3_bucket.id,
      lambda_functions=[aws.s3.BucketNotificationLambdaFunctionArgs(
        lambda_function_arn=self.lambda_function.arn,
        events=["s3:ObjectCreated:*"],
      )],
      opts=ResourceOptions(
        provider=self.provider,
        parent=self,
        depends_on=[self.lambda_function]
      )
    )

  def _create_monitoring(self):
    self.log_group = aws.cloudwatch.LogGroup(
      f"TapStack-lambda-logs-{self.environment_suffix}",
      name=self.lambda_function.name.apply(
        lambda name: f"/aws/lambda/{name}"
      ),
      retention_in_days=14,
      tags=self.common_tags,
      opts=ResourceOptions(provider=self.provider, parent=self)
    )

  @property
  def vpc_id(self):
    return self.vpc.id

  @property
  def public_subnet_ids(self):
    return [subnet.id for subnet in self.public_subnets]

  @property
  def private_subnet_ids(self):
    return [subnet.id for subnet in self.private_subnets]

  @property
  def bucket_name(self):
    return self.s3_bucket.bucket

  @property
  def lambda_name(self):
    return self.lambda_function.name

