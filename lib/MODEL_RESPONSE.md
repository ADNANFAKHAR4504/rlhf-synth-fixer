# Zero-Trust Network Access Infrastructure - Pulumi Python Implementation

This implementation creates a comprehensive zero-trust security infrastructure for financial services microservices with PCI DSS compliance requirements.

## File: lib/tap_stack.py

```python
"""Zero-Trust Network Access Infrastructure Stack."""
import pulumi
import pulumi_aws as aws
import json

# Get configuration
config = pulumi.Config()
environment_suffix = config.require("environment_suffix")
region = config.get("region") or "us-east-1"

# Common tags for all resources
common_tags = {
    "CostCenter": "FinancialServices",
    "Environment": environment_suffix,
    "DataClassification": "Confidential",
    "ManagedBy": "Pulumi",
}

# Get availability zones
azs = aws.get_availability_zones(state="available")

# Create VPC with no internet gateway (zero-trust)
vpc = aws.ec2.Vpc(
    f"zerotrust-vpc-{environment_suffix}",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**common_tags, "Name": f"zerotrust-vpc-{environment_suffix}"},
)

# Create 3 private subnets across different AZs
private_subnets = []
for i in range(3):
    subnet = aws.ec2.Subnet(
        f"private-subnet-{i+1}-{environment_suffix}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=azs.names[i],
        map_public_ip_on_launch=False,
        tags={**common_tags, "Name": f"private-subnet-{i+1}-{environment_suffix}"},
    )
    private_subnets.append(subnet)

# Create route table for private subnets (no internet gateway route)
private_route_table = aws.ec2.RouteTable(
    f"private-route-table-{environment_suffix}",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"private-route-table-{environment_suffix}"},
)

# Associate private subnets with route table
for i, subnet in enumerate(private_subnets):
    aws.ec2.RouteTableAssociation(
        f"private-subnet-{i+1}-rt-assoc-{environment_suffix}",
        subnet_id=subnet.id,
        route_table_id=private_route_table.id,
    )

# Create KMS key for encryption with rotation enabled
kms_key = aws.kms.Key(
    f"zerotrust-kms-key-{environment_suffix}",
    description=f"KMS key for zero-trust infrastructure - {environment_suffix}",
    enable_key_rotation=True,
    deletion_window_in_days=10,
    policy=pulumi.Output.all().apply(
        lambda _: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{aws.get_caller_identity().account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow CloudWatch Logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": f"logs.{region}.amazonaws.com"
                    },
                    "Action": [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:CreateGrant",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "ArnLike": {
                            "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{region}:{aws.get_caller_identity().account_id}:*"
                        }
                    }
                },
                {
                    "Sid": "Allow Lambda",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*"
                }
            ]
        })
    ),
    tags=common_tags,
)

kms_key_alias = aws.kms.Alias(
    f"zerotrust-kms-alias-{environment_suffix}",
    name=f"alias/zerotrust-{environment_suffix}",
    target_key_id=kms_key.id,
)

# Create security group for VPC endpoints
vpc_endpoint_sg = aws.ec2.SecurityGroup(
    f"vpc-endpoint-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for VPC endpoints",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=443,
            to_port=443,
            cidr_blocks=[vpc.cidr_block],
            description="HTTPS from VPC",
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="tcp",
            from_port=443,
            to_port=443,
            cidr_blocks=[vpc.cidr_block],
            description="HTTPS to VPC",
        )
    ],
    tags={**common_tags, "Name": f"vpc-endpoint-sg-{environment_suffix}"},
)

# Create VPC endpoint for S3
s3_vpc_endpoint = aws.ec2.VpcEndpoint(
    f"s3-vpc-endpoint-{environment_suffix}",
    vpc_id=vpc.id,
    service_name=f"com.amazonaws.{region}.s3",
    vpc_endpoint_type="Gateway",
    route_table_ids=[private_route_table.id],
    tags={**common_tags, "Name": f"s3-vpc-endpoint-{environment_suffix}"},
)

# Create VPC endpoint for DynamoDB
dynamodb_vpc_endpoint = aws.ec2.VpcEndpoint(
    f"dynamodb-vpc-endpoint-{environment_suffix}",
    vpc_id=vpc.id,
    service_name=f"com.amazonaws.{region}.dynamodb",
    vpc_endpoint_type="Gateway",
    route_table_ids=[private_route_table.id],
    tags={**common_tags, "Name": f"dynamodb-vpc-endpoint-{environment_suffix}"},
)

# Create S3 bucket with versioning and encryption
s3_bucket = aws.s3.BucketV2(
    f"zerotrust-data-{environment_suffix}",
    bucket=f"zerotrust-data-{environment_suffix}",
    tags=common_tags,
)

# Enable versioning
s3_versioning = aws.s3.BucketVersioningV2(
    f"zerotrust-data-versioning-{environment_suffix}",
    bucket=s3_bucket.id,
    versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
    ),
)

# Enable server-side encryption
s3_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
    f"zerotrust-data-encryption-{environment_suffix}",
    bucket=s3_bucket.id,
    rules=[
        aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            ),
            bucket_key_enabled=True,
        )
    ],
)

# Create bucket policy to deny unencrypted uploads
s3_bucket_policy = aws.s3.BucketPolicy(
    f"zerotrust-data-policy-{environment_suffix}",
    bucket=s3_bucket.id,
    policy=s3_bucket.arn.apply(
        lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "DenyUnencryptedObjectUploads",
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:PutObject",
                    "Resource": f"{arn}/*",
                    "Condition": {
                        "StringNotEquals": {
                            "s3:x-amz-server-side-encryption": "AES256"
                        }
                    }
                },
                {
                    "Sid": "DenyInsecureTransport",
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:*",
                    "Resource": [arn, f"{arn}/*"],
                    "Condition": {
                        "Bool": {
                            "aws:SecureTransport": "false"
                        }
                    }
                }
            ]
        })
    ),
)

# Block public access
s3_public_access_block = aws.s3.BucketPublicAccessBlock(
    f"zerotrust-data-public-block-{environment_suffix}",
    bucket=s3_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True,
)

# Create CloudWatch Log group with KMS encryption and 90-day retention
log_group = aws.cloudwatch.LogGroup(
    f"zerotrust-logs-{environment_suffix}",
    name=f"/aws/zerotrust/{environment_suffix}",
    retention_in_days=90,
    kms_key_id=kms_key.arn,
    tags=common_tags,
)

# Create IAM role for Lambda with least privilege and explicit denies
lambda_assume_role_policy = aws.iam.get_policy_document(
    statements=[
        aws.iam.GetPolicyDocumentStatementArgs(
            effect="Allow",
            principals=[
                aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type="Service",
                    identifiers=["lambda.amazonaws.com"],
                )
            ],
            actions=["sts:AssumeRole"],
            conditions=[
                aws.iam.GetPolicyDocumentStatementConditionArgs(
                    test="IpAddress",
                    variable="aws:SourceIp",
                    values=["10.0.0.0/16"],  # Only from VPC CIDR
                )
            ],
        )
    ]
)

lambda_role = aws.iam.Role(
    f"lambda-role-{environment_suffix}",
    name=f"lambda-role-{environment_suffix}",
    assume_role_policy=lambda_assume_role_policy.json,
    tags=common_tags,
)

# Create inline policy for Lambda with explicit denies
lambda_policy = aws.iam.RolePolicy(
    f"lambda-policy-{environment_suffix}",
    role=lambda_role.id,
    policy=pulumi.Output.all(s3_bucket.arn, log_group.arn, kms_key.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowS3Read",
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        args[0],
                        f"{args[0]}/*"
                    ]
                },
                {
                    "Sid": "AllowCloudWatchLogs",
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"{args[1]}:*"
                },
                {
                    "Sid": "AllowKMSDecrypt",
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:DescribeKey"
                    ],
                    "Resource": args[2]
                },
                {
                    "Sid": "DenyS3Write",
                    "Effect": "Deny",
                    "Action": [
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:DeleteBucket"
                    ],
                    "Resource": "*"
                },
                {
                    "Sid": "DenyIAMModifications",
                    "Effect": "Deny",
                    "Action": [
                        "iam:*"
                    ],
                    "Resource": "*"
                }
            ]
        })
    ),
)

# Attach AWS managed policy for Lambda basic execution
lambda_basic_execution = aws.iam.RolePolicyAttachment(
    f"lambda-basic-execution-{environment_suffix}",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
)

# Create security group for Lambda
lambda_sg = aws.ec2.SecurityGroup(
    f"lambda-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for Lambda functions",
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="tcp",
            from_port=443,
            to_port=443,
            cidr_blocks=[vpc.cidr_block],
            description="HTTPS to VPC",
        )
    ],
    tags={**common_tags, "Name": f"lambda-sg-{environment_suffix}"},
)

# Create Lambda function with KMS encryption for environment variables
lambda_function = aws.lambda_.Function(
    f"zerotrust-function-{environment_suffix}",
    name=f"zerotrust-function-{environment_suffix}",
    runtime="python3.11",
    handler="index.handler",
    role=lambda_role.arn,
    kms_key_arn=kms_key.arn,
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import json

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Zero-trust function executed successfully'})
    }
""")
    }),
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "ENVIRONMENT": environment_suffix,
            "S3_BUCKET": s3_bucket.id,
        }
    ),
    vpc_config=aws.lambda_.FunctionVpcConfigArgs(
        subnet_ids=[subnet.id for subnet in private_subnets],
        security_group_ids=[lambda_sg.id],
    ),
    tags=common_tags,
)

# Create IAM role for API Gateway with least privilege
api_gateway_assume_role_policy = aws.iam.get_policy_document(
    statements=[
        aws.iam.GetPolicyDocumentStatementArgs(
            effect="Allow",
            principals=[
                aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type="Service",
                    identifiers=["apigateway.amazonaws.com"],
                )
            ],
            actions=["sts:AssumeRole"],
        )
    ]
)

api_gateway_role = aws.iam.Role(
    f"api-gateway-role-{environment_suffix}",
    name=f"api-gateway-role-{environment_suffix}",
    assume_role_policy=api_gateway_assume_role_policy.json,
    tags=common_tags,
)

# Create policy for API Gateway to invoke Lambda
api_gateway_policy = aws.iam.RolePolicy(
    f"api-gateway-policy-{environment_suffix}",
    role=api_gateway_role.id,
    policy=lambda_function.arn.apply(
        lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowLambdaInvoke",
                    "Effect": "Allow",
                    "Action": "lambda:InvokeFunction",
                    "Resource": arn
                },
                {
                    "Sid": "DenyOtherActions",
                    "Effect": "Deny",
                    "Action": [
                        "lambda:CreateFunction",
                        "lambda:DeleteFunction",
                        "lambda:UpdateFunctionCode"
                    ],
                    "Resource": "*"
                }
            ]
        })
    ),
)

# Create API Gateway REST API
api = aws.apigateway.RestApi(
    f"zerotrust-api-{environment_suffix}",
    name=f"zerotrust-api-{environment_suffix}",
    description="Zero-trust API with IAM authorization",
    endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
        types="PRIVATE",
    ),
    tags=common_tags,
)

# Create API Gateway resource
api_resource = aws.apigateway.Resource(
    f"zerotrust-api-resource-{environment_suffix}",
    rest_api=api.id,
    parent_id=api.root_resource_id,
    path_part="execute",
)

# Create request validator
request_validator = aws.apigateway.RequestValidator(
    f"zerotrust-api-validator-{environment_suffix}",
    rest_api=api.id,
    name=f"zerotrust-api-validator-{environment_suffix}",
    validate_request_body=True,
    validate_request_parameters=True,
)

# Create API Gateway method with IAM authorization
api_method = aws.apigateway.Method(
    f"zerotrust-api-method-{environment_suffix}",
    rest_api=api.id,
    resource_id=api_resource.id,
    http_method="POST",
    authorization="AWS_IAM",
    request_validator_id=request_validator.id,
)

# Create Lambda integration
api_integration = aws.apigateway.Integration(
    f"zerotrust-api-integration-{environment_suffix}",
    rest_api=api.id,
    resource_id=api_resource.id,
    http_method=api_method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=lambda_function.invoke_arn,
    credentials=api_gateway_role.arn,
)

# Grant API Gateway permission to invoke Lambda
lambda_permission = aws.lambda_.Permission(
    f"api-gateway-lambda-permission-{environment_suffix}",
    action="lambda:InvokeFunction",
    function=lambda_function.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.all(api.id, api.execution_arn).apply(
        lambda args: f"{args[1]}/*/*"
    ),
)

# Deploy API
api_deployment = aws.apigateway.Deployment(
    f"zerotrust-api-deployment-{environment_suffix}",
    rest_api=api.id,
    stage_name="prod",
    opts=pulumi.ResourceOptions(depends_on=[api_integration]),
)

# Create security group for EC2 instances with IMDSv2
ec2_sg = aws.ec2.SecurityGroup(
    f"ec2-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for EC2 instances",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=443,
            to_port=443,
            security_groups=[lambda_sg.id],
            description="HTTPS from Lambda",
        ),
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=3306,
            to_port=3306,
            security_groups=[lambda_sg.id],
            description="MySQL from Lambda",
        ),
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="tcp",
            from_port=443,
            to_port=443,
            cidr_blocks=[vpc.cidr_block],
            description="HTTPS to VPC",
        )
    ],
    tags={**common_tags, "Name": f"ec2-sg-{environment_suffix}"},
)

# Create launch template with IMDSv2 required
launch_template = aws.ec2.LaunchTemplate(
    f"zerotrust-launch-template-{environment_suffix}",
    name=f"zerotrust-launch-template-{environment_suffix}",
    image_id="ami-0c55b159cbfafe1f0",  # Amazon Linux 2 (update to latest)
    instance_type="t3.micro",
    vpc_security_group_ids=[ec2_sg.id],
    metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
        http_endpoint="enabled",
        http_tokens="required",  # IMDSv2 required
        http_put_response_hop_limit=1,
    ),
    tag_specifications=[
        aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags=common_tags,
        )
    ],
)

# Create Network ACLs for additional subnet-level security
network_acl = aws.ec2.NetworkAcl(
    f"zerotrust-nacl-{environment_suffix}",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"zerotrust-nacl-{environment_suffix}"},
)

# Allow HTTPS inbound (port 443)
nacl_ingress_443 = aws.ec2.NetworkAclRule(
    f"nacl-ingress-443-{environment_suffix}",
    network_acl_id=network_acl.id,
    rule_number=100,
    protocol="tcp",
    rule_action="allow",
    cidr_block=vpc.cidr_block,
    from_port=443,
    to_port=443,
    egress=False,
)

# Allow MySQL inbound (port 3306)
nacl_ingress_3306 = aws.ec2.NetworkAclRule(
    f"nacl-ingress-3306-{environment_suffix}",
    network_acl_id=network_acl.id,
    rule_number=110,
    protocol="tcp",
    rule_action="allow",
    cidr_block=vpc.cidr_block,
    from_port=3306,
    to_port=3306,
    egress=False,
)

# Explicitly deny all other inbound traffic
nacl_ingress_deny = aws.ec2.NetworkAclRule(
    f"nacl-ingress-deny-{environment_suffix}",
    network_acl_id=network_acl.id,
    rule_number=200,
    protocol="-1",
    rule_action="deny",
    cidr_block="0.0.0.0/0",
    from_port=0,
    to_port=0,
    egress=False,
)

# Allow HTTPS outbound
nacl_egress_443 = aws.ec2.NetworkAclRule(
    f"nacl-egress-443-{environment_suffix}",
    network_acl_id=network_acl.id,
    rule_number=100,
    protocol="tcp",
    rule_action="allow",
    cidr_block=vpc.cidr_block,
    from_port=443,
    to_port=443,
    egress=True,
)

# Allow MySQL outbound
nacl_egress_3306 = aws.ec2.NetworkAclRule(
    f"nacl-egress-3306-{environment_suffix}",
    network_acl_id=network_acl.id,
    rule_number=110,
    protocol="tcp",
    rule_action="allow",
    cidr_block=vpc.cidr_block,
    from_port=3306,
    to_port=3306,
    egress=True,
)

# Explicitly deny all other outbound traffic
nacl_egress_deny = aws.ec2.NetworkAclRule(
    f"nacl-egress-deny-{environment_suffix}",
    network_acl_id=network_acl.id,
    rule_number=200,
    protocol="-1",
    rule_action="deny",
    cidr_block="0.0.0.0/0",
    from_port=0,
    to_port=0,
    egress=True,
)

# Associate NACLs with private subnets
for i, subnet in enumerate(private_subnets):
    aws.ec2.NetworkAclAssociation(
        f"nacl-association-{i+1}-{environment_suffix}",
        network_acl_id=network_acl.id,
        subnet_id=subnet.id,
    )

# Create IAM role for AWS Config
config_assume_role_policy = aws.iam.get_policy_document(
    statements=[
        aws.iam.GetPolicyDocumentStatementArgs(
            effect="Allow",
            principals=[
                aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type="Service",
                    identifiers=["config.amazonaws.com"],
                )
            ],
            actions=["sts:AssumeRole"],
        )
    ]
)

config_role = aws.iam.Role(
    f"config-role-{environment_suffix}",
    name=f"config-role-{environment_suffix}",
    assume_role_policy=config_assume_role_policy.json,
    tags=common_tags,
)

# Attach AWS managed policy for AWS Config
config_policy_attachment = aws.iam.RolePolicyAttachment(
    f"config-policy-attachment-{environment_suffix}",
    role=config_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
)

# Create S3 bucket for AWS Config
config_bucket = aws.s3.BucketV2(
    f"config-bucket-{environment_suffix}",
    bucket=f"config-bucket-{environment_suffix}",
    tags=common_tags,
)

# Enable versioning for Config bucket
config_bucket_versioning = aws.s3.BucketVersioningV2(
    f"config-bucket-versioning-{environment_suffix}",
    bucket=config_bucket.id,
    versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
    ),
)

# Create bucket policy for AWS Config
config_bucket_policy = aws.s3.BucketPolicy(
    f"config-bucket-policy-{environment_suffix}",
    bucket=config_bucket.id,
    policy=pulumi.Output.all(config_bucket.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AWSConfigBucketPermissionsCheck",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    },
                    "Action": "s3:GetBucketAcl",
                    "Resource": args[0]
                },
                {
                    "Sid": "AWSConfigBucketExistenceCheck",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    },
                    "Action": "s3:ListBucket",
                    "Resource": args[0]
                },
                {
                    "Sid": "AWSConfigBucketPutObject",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "config.amazonaws.com"
                    },
                    "Action": "s3:PutObject",
                    "Resource": f"{args[0]}/*",
                    "Condition": {
                        "StringEquals": {
                            "s3:x-amz-acl": "bucket-owner-full-control"
                        }
                    }
                }
            ]
        })
    ),
)

# Create AWS Config recorder
config_recorder = aws.cfg.Recorder(
    f"config-recorder-{environment_suffix}",
    name=f"config-recorder-{environment_suffix}",
    role_arn=config_role.arn,
    recording_group=aws.cfg.RecorderRecordingGroupArgs(
        all_supported=True,
        include_global_resource_types=True,
    ),
)

# Create AWS Config delivery channel
config_delivery_channel = aws.cfg.DeliveryChannel(
    f"config-delivery-channel-{environment_suffix}",
    name=f"config-delivery-channel-{environment_suffix}",
    s3_bucket_name=config_bucket.id,
    opts=pulumi.ResourceOptions(depends_on=[config_bucket_policy]),
)

# Start AWS Config recorder
config_recorder_status = aws.cfg.RecorderStatus(
    f"config-recorder-status-{environment_suffix}",
    name=config_recorder.name,
    is_enabled=True,
    opts=pulumi.ResourceOptions(depends_on=[config_delivery_channel]),
)

# Create AWS Config rule for S3 bucket encryption
config_rule_s3_encryption = aws.cfg.Rule(
    f"config-rule-s3-encryption-{environment_suffix}",
    name=f"s3-bucket-encryption-{environment_suffix}",
    source=aws.cfg.RuleSourceArgs(
        owner="AWS",
        source_identifier="S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED",
    ),
    opts=pulumi.ResourceOptions(depends_on=[config_recorder_status]),
)

# Create AWS Config rule for KMS key rotation
config_rule_kms_rotation = aws.cfg.Rule(
    f"config-rule-kms-rotation-{environment_suffix}",
    name=f"kms-key-rotation-{environment_suffix}",
    source=aws.cfg.RuleSourceArgs(
        owner="AWS",
        source_identifier="CMK_BACKING_KEY_ROTATION_ENABLED",
    ),
    opts=pulumi.ResourceOptions(depends_on=[config_recorder_status]),
)

# Create AWS Config rule for CloudWatch Log group encryption
config_rule_log_encryption = aws.cfg.Rule(
    f"config-rule-log-encryption-{environment_suffix}",
    name=f"cloudwatch-log-group-encrypted-{environment_suffix}",
    source=aws.cfg.RuleSourceArgs(
        owner="AWS",
        source_identifier="CLOUDWATCH_LOG_GROUP_ENCRYPTED",
    ),
    opts=pulumi.ResourceOptions(depends_on=[config_recorder_status]),
)

# Create AWS Config rule for IAM policy restrictions
config_rule_iam_policy = aws.cfg.Rule(
    f"config-rule-iam-policy-{environment_suffix}",
    name=f"iam-policy-no-full-star-{environment_suffix}",
    source=aws.cfg.RuleSourceArgs(
        owner="AWS",
        source_identifier="IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS",
    ),
    opts=pulumi.ResourceOptions(depends_on=[config_recorder_status]),
)

# Export outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("subnet_ids", [subnet.id for subnet in private_subnets])
pulumi.export("s3_bucket_name", s3_bucket.id)
pulumi.export("kms_key_arn", kms_key.arn)
pulumi.export("api_gateway_endpoint", pulumi.Output.concat(
    "https://", api.id, ".execute-api.", region, ".amazonaws.com/prod/execute"
))
pulumi.export("lambda_function_name", lambda_function.name)
pulumi.export("log_group_name", log_group.name)
pulumi.export("config_recorder_name", config_recorder.name)
```

## File: lib/__init__.py

```python
"""Zero-Trust Infrastructure Package."""
```

## File: lib/README.md

```markdown
# Zero-Trust Network Access Infrastructure

This Pulumi Python program implements a comprehensive zero-trust security infrastructure for financial services microservices with PCI DSS compliance requirements.

## Architecture Overview

The infrastructure creates:

- **Network Isolation**: VPC with 3 private subnets across availability zones, no internet gateway
- **VPC Endpoints**: Private connectivity to S3 and DynamoDB
- **Encryption**: KMS key with rotation, S3 SSE-S3, CloudWatch Logs encryption
- **Compute**: Lambda functions with KMS-encrypted environment variables
- **API Layer**: API Gateway with AWS_IAM authorization and request validation
- **Access Control**: IAM roles with least privilege and explicit denies
- **Network Security**: Security groups and Network ACLs with restrictive rules
- **Compliance**: AWS Config rules monitoring encryption and access policies
- **Logging**: CloudWatch Logs with 90-day retention and encryption

## Prerequisites

- Python 3.9 or later
- Pulumi CLI 3.x or later
- AWS CLI v2 configured with appropriate credentials
- AWS account with permissions to create VPC, EC2, S3, Lambda, API Gateway, IAM, KMS, CloudWatch, and AWS Config resources

## Configuration

Set the required configuration:

```bash
pulumi config set environment_suffix <your-unique-suffix>
pulumi config set region us-east-1  # optional, defaults to us-east-1
```

## Deployment

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Initialize Pulumi stack:
   ```bash
   pulumi stack init dev
   ```

3. Set configuration:
   ```bash
   pulumi config set environment_suffix dev001
   ```

4. Preview changes:
   ```bash
   pulumi preview
   ```

5. Deploy infrastructure:
   ```bash
   pulumi up
   ```

## Outputs

The stack exports:

- `vpc_id`: VPC identifier
- `subnet_ids`: List of private subnet identifiers
- `s3_bucket_name`: Name of the encrypted S3 bucket
- `kms_key_arn`: ARN of the KMS encryption key
- `api_gateway_endpoint`: URL of the API Gateway endpoint
- `lambda_function_name`: Name of the Lambda function
- `log_group_name`: Name of the CloudWatch Log group
- `config_recorder_name`: Name of the AWS Config recorder

## Security Features

### Network Security
- Private subnets only (no internet gateway)
- VPC endpoints for AWS service access
- Security groups with no 0.0.0.0/0 rules
- Network ACLs allowing only ports 443 and 3306

### Encryption
- KMS key with automatic rotation enabled
- S3 buckets with SSE-S3 encryption
- CloudWatch Logs encrypted with KMS
- Lambda environment variables encrypted with KMS

### Access Control
- IAM roles following principle of least privilege
- Explicit deny policies for unauthorized actions
- Assume role policies restricted by source IP
- API Gateway with AWS_IAM authorization

### Compliance
- AWS Config rules for encryption monitoring
- AWS Config rules for IAM policy compliance
- CloudWatch Logs with 90-day retention
- All resources tagged with CostCenter, Environment, DataClassification

### Instance Metadata Service
- EC2 launch template configured for IMDSv2 only
- HttpTokens set to 'required'

## Testing

Run unit tests:
```bash
pytest tests/ -v
```

Run tests with coverage:
```bash
pytest tests/ --cov=lib --cov-report=html --cov-report=term
```

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

## Compliance Notes

This infrastructure is designed to support PCI DSS compliance requirements:

- **Requirement 1**: Network segmentation through VPC and security groups
- **Requirement 2**: No default credentials, IMDSv2 required
- **Requirement 3**: Encryption at rest for all data storage
- **Requirement 4**: Encryption in transit (HTTPS only)
- **Requirement 8**: IAM with least privilege access
- **Requirement 10**: CloudWatch Logs with 90-day retention
- **Requirement 11**: AWS Config continuous monitoring

## Troubleshooting

### Lambda Function Not Executing
- Verify security groups allow necessary traffic
- Check CloudWatch Logs for errors
- Ensure IAM role has required permissions

### API Gateway Authorization Failing
- Verify AWS_IAM authorization is properly configured
- Check request signing with AWS Signature Version 4
- Ensure caller has appropriate IAM permissions

### AWS Config Not Recording
- Verify Config recorder is enabled
- Check S3 bucket policy allows Config access
- Ensure Config delivery channel is configured

## License

Proprietary - Financial Services Company
```
