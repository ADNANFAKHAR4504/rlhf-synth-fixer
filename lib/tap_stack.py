"""
IaC – AWS Nova Model Breaking
Pulumi programme that stands up:

• 1 VPC (10.0.0.0/16) in us-east-1
• 2 public & 2 private subnets spread over distinct AZs
• IGW, 1 NAT GW, route-tables
• S3 bucket (encrypted, versioned, public access blocked)
• Least-privilege IAM role & inline policy for Lambda
• Lambda function triggered by S3 “ObjectCreated” events
• CloudWatch LogGroup with 14-day retention
• All resources tagged and exported for automated tests

The file is completely self-contained and idempotent.
"""

import json
import pathlib
import pulumi
import pulumi_aws as aws
from pulumi import Config, ResourceOptions, Output

# --------------------------------------------------------------------------- #
# Global configuration                                                         #
# --------------------------------------------------------------------------- #
PROJECT_TAG = "IaC-AWS-Nova-Model-Breaking"
REGION       = "us-east-1"
STACK        = pulumi.get_stack()          # dev / staging / prod / etc.
cfg          = Config()
stage        = cfg.get("stage") or STACK   # override if desired (pulumi config set stage prod)

common_tags = {
  "Project": PROJECT_TAG,
  "Stage"  : stage,
  "Managed": "pulumi",
}

provider = aws.Provider("provider", region=REGION)

# --------------------------------------------------------------------------- #
# Networking – VPC, subnets, routing                                          #
# --------------------------------------------------------------------------- #
vpc = aws.ec2.Vpc(
  f"vpc-{STACK}",
  cidr_block="10.0.0.0/16",
  enable_dns_hostnames=True,
  enable_dns_support=True,
  tags={**common_tags, "Name": f"vpc-{STACK}"},
  opts=ResourceOptions(provider=provider),
)

# Two distinct AZs
azs = aws.get_availability_zones(state="available", opts=ResourceOptions(provider=provider)).names[:2]

public_subnets  = []
private_subnets = []

for i, az in enumerate(azs):
  public_subnets.append(
    aws.ec2.Subnet(
      f"public-{i}-{STACK}",
      vpc_id=vpc.id,
      cidr_block=f"10.0.{i}.0/24",
      availability_zone=az,
      map_public_ip_on_launch=True,
      tags={**common_tags, "Name": f"public-{i}-{STACK}"},
      opts=ResourceOptions(provider=provider),
    ).id,
  )

  private_subnets.append(
    aws.ec2.Subnet(
      f"private-{i}-{STACK}",
      vpc_id=vpc.id,
      cidr_block=f"10.0.{i+10}.0/24",
      availability_zone=az,
      map_public_ip_on_launch=False,
      tags={**common_tags, "Name": f"private-{i}-{STACK}"},
      opts=ResourceOptions(provider=provider),
    ).id,
  )

# IGW & public route-table
igw = aws.ec2.InternetGateway(
  f"igw-{STACK}",
  vpc_id=vpc.id,
  tags={**common_tags, "Name": f"igw-{STACK}"},
  opts=ResourceOptions(provider=provider),
)

public_rt = aws.ec2.RouteTable(
  f"public-rt-{STACK}",
  vpc_id=vpc.id,
  routes=[aws.ec2.RouteTableRouteArgs(cidr_block="0.0.0.0/0", gateway_id=igw.id)],
  tags={**common_tags, "Name": f"public-rt-{STACK}"},
  opts=ResourceOptions(provider=provider),
)

for subnet_id in public_subnets:
  aws.ec2.RouteTableAssociation(
    f"public-rta-{subnet_id}",
    subnet_id=subnet_id,
    route_table_id=public_rt.id,
    opts=ResourceOptions(provider=provider),
  )

# Single NAT GW (cost-aware) in AZ-0 for both private subnets
eip = aws.ec2.Eip(
  f"nat-eip-{STACK}",
  tags=common_tags,
  opts=ResourceOptions(provider=provider),
)

nat_gw = aws.ec2.NatGateway(
  f"natgw-{STACK}",
  subnet_id=public_subnets[0],
  allocation_id=eip.id,
  tags={**common_tags, "Name": f"natgw-{STACK}"},
  opts=ResourceOptions(provider=provider, depends_on=[igw]),
)

private_rt = aws.ec2.RouteTable(
  f"private-rt-{STACK}",
  vpc_id=vpc.id,
  routes=[aws.ec2.RouteTableRouteArgs(cidr_block="0.0.0.0/0", nat_gateway_id=nat_gw.id)],
  tags={**common_tags, "Name": f"private-rt-{STACK}"},
  opts=ResourceOptions(provider=provider),
)

for subnet_id in private_subnets:
  aws.ec2.RouteTableAssociation(
    f"private-rta-{subnet_id}",
    subnet_id=subnet_id,
    route_table_id=private_rt.id,
    opts=ResourceOptions(provider=provider),
  )

# --------------------------------------------------------------------------- #
# S3 bucket – encrypted, versioned, private                                   #
# --------------------------------------------------------------------------- #
bucket = aws.s3.Bucket(
  f"data-bucket-{STACK}",
  versioning=aws.s3.BucketVersioningArgs(enabled=True),
  server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
    rules=[
      aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
        apply_server_side_encryption_by_default=
        aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
          sse_algorithm="AES256"
        )
      )
    ]
  ),
  tags={**common_tags, "Name": f"data-bucket-{STACK}"},
  opts=ResourceOptions(provider=provider),
)

aws.s3.BucketPublicAccessBlock(
  f"public-block-{STACK}",
  bucket=bucket.id,
  block_public_acls=True,
  block_public_policy=True,
  ignore_public_acls=True,
  restrict_public_buckets=True,
  opts=ResourceOptions(provider=provider),
)

# --------------------------------------------------------------------------- #
# IAM – least-privilege role for Lambda                                       #
# --------------------------------------------------------------------------- #
lambda_role = aws.iam.Role(
  f"lambda-role-{STACK}",
  assume_role_policy=json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole",
    }],
  }),
  tags=common_tags,
  opts=ResourceOptions(provider=provider),
)

# Basic execution + explicit read-only access to this bucket
aws.iam.RolePolicyAttachment(
  f"lambda-basic-{STACK}",
  role=lambda_role.name,
  policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
  opts=ResourceOptions(provider=provider),
)

aws.iam.RolePolicy(
  f"lambda-s3-policy-{STACK}",
  role=lambda_role.id,
  policy=bucket.id.apply(
    lambda b: json.dumps({
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Action": ["s3:GetObject", "s3:GetObjectTagging"],
        "Resource": f"arn:aws:s3:::{b}/*",
      }]
    })
  ),
  opts=ResourceOptions(provider=provider),
)

# --------------------------------------------------------------------------- #
# Lambda function & CloudWatch logging                                        #
# --------------------------------------------------------------------------- #
code_path = pathlib.Path(__file__).parent / "lambda"
zip_asset = pulumi.AssetArchive({".": pulumi.FileArchive(str(code_path))})

lambda_func = aws.lambda_.Function(
  f"processor-{STACK}",
  runtime="python3.9",
  role=lambda_role.arn,
  handler="index.handler",
  code=zip_asset,
  environment=aws.lambda_.FunctionEnvironmentArgs(variables={
    "STAGE": stage,
    "BUCKET": bucket.id,
  }),
  timeout=30,
  memory_size=128,
  opts=ResourceOptions(provider=provider),
)

log_group = aws.cloudwatch.LogGroup(
  f"/aws/lambda/{lambda_func.name}",
  retention_in_days=14,
  tags=common_tags,
  opts=ResourceOptions(provider=provider),
)

# --------------------------------------------------------------------------- #
# S3 → Lambda event notifications                                             #
# --------------------------------------------------------------------------- #
aws.lambda_.Permission(
  f"allow-s3-{STACK}",
  action="lambda:InvokeFunction",
  function=lambda_func.name,
  principal="s3.amazonaws.com",
  source_arn=bucket.arn,
  opts=ResourceOptions(provider=provider),
)

aws.s3.BucketNotification(
  f"bucket-notif-{STACK}",
  bucket=bucket.id,
  lambda_functions=[aws.s3.BucketNotificationLambdaFunctionArgs(
    lambda_function_arn=lambda_func.arn,
    events=["s3:ObjectCreated:*"],
  )],
  opts=ResourceOptions(provider=provider, depends_on=[lambda_func]),
)

# --------------------------------------------------------------------------- #
# Stack outputs                                                               #
# --------------------------------------------------------------------------- #
pulumi.export("vpcId",              vpc.id)
pulumi.export("publicSubnetIds",    Output.all(*public_subnets))
pulumi.export("privateSubnetIds",   Output.all(*private_subnets))
pulumi.export("bucketName",         bucket.bucket)
pulumi.export("lambdaName",         lambda_func.name)
pulumi.export("lambdaRoleArn",      lambda_role.arn)
