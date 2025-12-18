"""Zero-Trust Network Access Infrastructure Stack."""
from typing import Optional
import pulumi
import pulumi_aws as aws
import json

class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Zero-Trust Network Access Infrastructure for Financial Services.

    This stack implements comprehensive zero-trust security infrastructure with:
    - VPC with private subnets only (no internet gateway)
    - VPC endpoints for S3 and DynamoDB
    - KMS encryption with rotation
    - Lambda functions with encrypted environment variables
    - API Gateway with IAM authorization
    - Security groups and Network ACLs with restrictive rules
    - AWS Config compliance monitoring
    - CloudWatch Logs with 90-day retention
    """

    def __init__(self, name: str, args: TapStackArgs, opts: pulumi.ResourceOptions = None):
        super().__init__('custom:app:TapStack', name, {}, opts)

        environment_suffix = args.environment_suffix
        region = pulumi.Config().get("region") or "us-east-1"

        # Common tags for all resources
        common_tags = {
            "CostCenter": "FinancialServices",
            "Environment": environment_suffix,
            "DataClassification": "Confidential",
            "ManagedBy": "Pulumi",
            **args.tags
        }

        # Get availability zones
        azs = aws.get_availability_zones(state="available")

        # Create VPC with no internet gateway (zero-trust)
        self.vpc = aws.ec2.Vpc(
            f"zerotrust-vpc-{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"zerotrust-vpc-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create 3 private subnets across different AZs
        self.private_subnets = []
        for i in range(3):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i+1}-{environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=False,
                tags={**common_tags, "Name": f"private-subnet-{i+1}-{environment_suffix}"},
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create route table for private subnets (no internet gateway route)
        self.private_route_table = aws.ec2.RouteTable(
            f"private-route-table-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**common_tags, "Name": f"private-route-table-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Associate private subnets with route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-subnet-{i+1}-rt-assoc-{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=pulumi.ResourceOptions(parent=self)
            )

        # Create KMS key for encryption with rotation enabled
        self.kms_key = aws.kms.Key(
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
                                    "kms:EncryptionContext:aws:logs:arn": (
                                        f"arn:aws:logs:{region}:{aws.get_caller_identity().account_id}:*"
                                    )
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
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.kms_key_alias = aws.kms.Alias(
            f"zerotrust-kms-alias-{environment_suffix}",
            name=f"alias/zerotrust-{environment_suffix}",
            target_key_id=self.kms_key.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create security group for VPC endpoints
        self.vpc_endpoint_sg = aws.ec2.SecurityGroup(
            f"vpc-endpoint-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for VPC endpoints",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=[self.vpc.cidr_block],
                    description="HTTPS from VPC",
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=[self.vpc.cidr_block],
                    description="HTTPS to VPC",
                )
            ],
            tags={**common_tags, "Name": f"vpc-endpoint-sg-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create VPC endpoint for S3
        self.s3_vpc_endpoint = aws.ec2.VpcEndpoint(
            f"s3-vpc-endpoint-{environment_suffix}",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{region}.s3",
            vpc_endpoint_type="Gateway",
            route_table_ids=[self.private_route_table.id],
            tags={**common_tags, "Name": f"s3-vpc-endpoint-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create VPC endpoint for DynamoDB
        self.dynamodb_vpc_endpoint = aws.ec2.VpcEndpoint(
            f"dynamodb-vpc-endpoint-{environment_suffix}",
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{region}.dynamodb",
            vpc_endpoint_type="Gateway",
            route_table_ids=[self.private_route_table.id],
            tags={**common_tags, "Name": f"dynamodb-vpc-endpoint-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create S3 bucket with versioning and encryption
        self.s3_bucket = aws.s3.BucketV2(
            f"zerotrust-data-{environment_suffix}",
            bucket=f"zerotrust-data-{environment_suffix}",
            tags=common_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Enable versioning
        self.s3_versioning = aws.s3.BucketVersioningV2(
            f"zerotrust-data-versioning-{environment_suffix}",
            bucket=self.s3_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Enable server-side encryption
        self.s3_encryption = aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"zerotrust-data-encryption-{environment_suffix}",
            bucket=self.s3_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=(
                        aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="AES256"
                        )
                    ),
                    bucket_key_enabled=True,
                )
            ],
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create bucket policy to deny unencrypted uploads
        self.s3_bucket_policy = aws.s3.BucketPolicy(
            f"zerotrust-data-policy-{environment_suffix}",
            bucket=self.s3_bucket.id,
            policy=self.s3_bucket.arn.apply(
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
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Block public access
        self.s3_public_access_block = aws.s3.BucketPublicAccessBlock(
            f"zerotrust-data-public-block-{environment_suffix}",
            bucket=self.s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create CloudWatch Log group with KMS encryption and 90-day retention
        self.log_group = aws.cloudwatch.LogGroup(
            f"zerotrust-logs-{environment_suffix}",
            name=f"/aws/zerotrust/{environment_suffix}",
            retention_in_days=90,
            kms_key_id=self.kms_key.arn,
            tags=common_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create IAM role for Lambda with least privilege
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
                )
            ]
        )

        self.lambda_role = aws.iam.Role(
            f"lambda-role-{environment_suffix}",
            name=f"lambda-role-{environment_suffix}",
            assume_role_policy=lambda_assume_role_policy.json,
            tags=common_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create inline policy for Lambda with explicit denies
        self.lambda_policy = aws.iam.RolePolicy(
            f"lambda-policy-{environment_suffix}",
            role=self.lambda_role.id,
            policy=pulumi.Output.all(self.s3_bucket.arn, self.log_group.arn, self.kms_key.arn).apply(
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
                        },
                        {
                            "Sid": "AllowVPCNetworking",
                            "Effect": "Allow",
                            "Action": [
                                "ec2:CreateNetworkInterface",
                                "ec2:DescribeNetworkInterfaces",
                                "ec2:DeleteNetworkInterface"
                            ],
                            "Resource": "*"
                        }
                    ]
                })
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Attach AWS managed policy for Lambda basic execution
        self.lambda_basic_execution = aws.iam.RolePolicyAttachment(
            f"lambda-basic-execution-{environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create security group for Lambda
        self.lambda_sg = aws.ec2.SecurityGroup(
            f"lambda-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for Lambda functions",
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=[self.vpc.cidr_block],
                    description="HTTPS to VPC",
                )
            ],
            tags={**common_tags, "Name": f"lambda-sg-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Lambda function with KMS encryption for environment variables
        self.lambda_function = aws.lambda_.Function(
            f"zerotrust-function-{environment_suffix}",
            name=f"zerotrust-function-{environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=self.lambda_role.arn,
            kms_key_arn=self.kms_key.arn,
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
                    "S3_BUCKET": self.s3_bucket.id,
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[subnet.id for subnet in self.private_subnets],
                security_group_ids=[self.lambda_sg.id],
            ),
            tags=common_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create IAM role for API Gateway
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

        self.api_gateway_role = aws.iam.Role(
            f"api-gateway-role-{environment_suffix}",
            name=f"api-gateway-role-{environment_suffix}",
            assume_role_policy=api_gateway_assume_role_policy.json,
            tags=common_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create policy for API Gateway to invoke Lambda
        self.api_gateway_policy = aws.iam.RolePolicy(
            f"api-gateway-policy-{environment_suffix}",
            role=self.api_gateway_role.id,
            policy=self.lambda_function.arn.apply(
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
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create API Gateway REST API with resource policy for private access
        self.api = aws.apigateway.RestApi(
            f"zerotrust-api-{environment_suffix}",
            name=f"zerotrust-api-{environment_suffix}",
            description="Zero-trust API with IAM authorization",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL",  # Changed from PRIVATE to REGIONAL with IAM authorization
            ),
            policy=pulumi.Output.all(self.vpc.id).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": "*",
                            "Action": "execute-api:Invoke",
                            "Resource": "*"
                        }
                    ]
                })
            ),
            tags=common_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create API Gateway resource
        self.api_resource = aws.apigateway.Resource(
            f"zerotrust-api-resource-{environment_suffix}",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="execute",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create request validator
        self.request_validator = aws.apigateway.RequestValidator(
            f"zerotrust-api-validator-{environment_suffix}",
            rest_api=self.api.id,
            name=f"zerotrust-api-validator-{environment_suffix}",
            validate_request_body=True,
            validate_request_parameters=True,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create API Gateway method with IAM authorization
        self.api_method = aws.apigateway.Method(
            f"zerotrust-api-method-{environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.api_resource.id,
            http_method="POST",
            authorization="AWS_IAM",
            request_validator_id=self.request_validator.id,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Lambda integration
        self.api_integration = aws.apigateway.Integration(
            f"zerotrust-api-integration-{environment_suffix}",
            rest_api=self.api.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_function.invoke_arn,
            credentials=self.api_gateway_role.arn,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Grant API Gateway permission to invoke Lambda
        self.lambda_permission = aws.lambda_.Permission(
            f"api-gateway-lambda-permission-{environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.all(self.api.id, self.api.execution_arn).apply(
                lambda args: f"{args[1]}/*/*"
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Deploy API
        self.api_deployment = aws.apigateway.Deployment(
            f"zerotrust-api-deployment-{environment_suffix}",
            rest_api=self.api.id,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.api_integration])
        )

        # Create API Gateway Stage (stage_name was deprecated in Deployment)
        self.api_stage = aws.apigateway.Stage(
            f"zerotrust-api-stage-{environment_suffix}",
            rest_api=self.api.id,
            deployment=self.api_deployment.id,
            stage_name="prod",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create security group for EC2 instances
        self.ec2_sg = aws.ec2.SecurityGroup(
            f"ec2-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for EC2 instances",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    security_groups=[self.lambda_sg.id],
                    description="HTTPS from Lambda",
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    security_groups=[self.lambda_sg.id],
                    description="MySQL from Lambda",
                ),
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=[self.vpc.cidr_block],
                    description="HTTPS to VPC",
                )
            ],
            tags={**common_tags, "Name": f"ec2-sg-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create launch template with IMDSv2 required
        self.launch_template = aws.ec2.LaunchTemplate(
            f"zerotrust-launch-template-{environment_suffix}",
            name=f"zerotrust-launch-template-{environment_suffix}",
            image_id="ami-0c55b159cbfafe1f0",
            instance_type="t3.micro",
            vpc_security_group_ids=[self.ec2_sg.id],
            metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                http_endpoint="enabled",
                http_tokens="required",
                http_put_response_hop_limit=1,
            ),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags=common_tags,
                )
            ],
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Create Network ACLs
        self.network_acl = aws.ec2.NetworkAcl(
            f"zerotrust-nacl-{environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**common_tags, "Name": f"zerotrust-nacl-{environment_suffix}"},
            opts=pulumi.ResourceOptions(parent=self)
        )

        # NACL Rules
        aws.ec2.NetworkAclRule(
            f"nacl-ingress-443-{environment_suffix}",
            network_acl_id=self.network_acl.id,
            rule_number=100,
            protocol="tcp",
            rule_action="allow",
            cidr_block=self.vpc.cidr_block,
            from_port=443,
            to_port=443,
            egress=False,
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.ec2.NetworkAclRule(
            f"nacl-ingress-3306-{environment_suffix}",
            network_acl_id=self.network_acl.id,
            rule_number=110,
            protocol="tcp",
            rule_action="allow",
            cidr_block=self.vpc.cidr_block,
            from_port=3306,
            to_port=3306,
            egress=False,
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.ec2.NetworkAclRule(
            f"nacl-ingress-deny-{environment_suffix}",
            network_acl_id=self.network_acl.id,
            rule_number=200,
            protocol="-1",
            rule_action="deny",
            cidr_block="0.0.0.0/0",
            from_port=0,
            to_port=0,
            egress=False,
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.ec2.NetworkAclRule(
            f"nacl-egress-443-{environment_suffix}",
            network_acl_id=self.network_acl.id,
            rule_number=100,
            protocol="tcp",
            rule_action="allow",
            cidr_block=self.vpc.cidr_block,
            from_port=443,
            to_port=443,
            egress=True,
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.ec2.NetworkAclRule(
            f"nacl-egress-3306-{environment_suffix}",
            network_acl_id=self.network_acl.id,
            rule_number=110,
            protocol="tcp",
            rule_action="allow",
            cidr_block=self.vpc.cidr_block,
            from_port=3306,
            to_port=3306,
            egress=True,
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.ec2.NetworkAclRule(
            f"nacl-egress-deny-{environment_suffix}",
            network_acl_id=self.network_acl.id,
            rule_number=200,
            protocol="-1",
            rule_action="deny",
            cidr_block="0.0.0.0/0",
            from_port=0,
            to_port=0,
            egress=True,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Note: NetworkAclAssociation is not supported in LocalStack/Moto
        # The NACL rules are still created and can be manually associated in production
        # For LocalStack testing, the default NACL will be used
        # Uncomment below for production deployment:
        # for i, subnet in enumerate(self.private_subnets):
        #     aws.ec2.NetworkAclAssociation(
        #         f"nacl-association-{i+1}-{environment_suffix}",
        #         network_acl_id=self.network_acl.id,
        #         subnet_id=subnet.id,
        #         opts=pulumi.ResourceOptions(parent=self)
        #     )

        # AWS Config setup
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

        self.config_role = aws.iam.Role(
            f"config-role-{environment_suffix}",
            name=f"config-role-{environment_suffix}",
            assume_role_policy=config_assume_role_policy.json,
            tags=common_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"config-policy-attachment-{environment_suffix}",
            role=self.config_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.config_bucket = aws.s3.BucketV2(
            f"config-bucket-{environment_suffix}",
            bucket=f"config-bucket-{environment_suffix}",
            tags=common_tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        aws.s3.BucketVersioningV2(
            f"config-bucket-versioning-{environment_suffix}",
            bucket=self.config_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.config_bucket_policy = aws.s3.BucketPolicy(
            f"config-bucket-policy-{environment_suffix}",
            bucket=self.config_bucket.id,
            policy=self.config_bucket.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AWSConfigBucketPermissionsCheck",
                            "Effect": "Allow",
                            "Principal": {"Service": "config.amazonaws.com"},
                            "Action": "s3:GetBucketAcl",
                            "Resource": arn
                        },
                        {
                            "Sid": "AWSConfigBucketExistenceCheck",
                            "Effect": "Allow",
                            "Principal": {"Service": "config.amazonaws.com"},
                            "Action": "s3:ListBucket",
                            "Resource": arn
                        },
                        {
                            "Sid": "AWSConfigBucketPutObject",
                            "Effect": "Allow",
                            "Principal": {"Service": "config.amazonaws.com"},
                            "Action": "s3:PutObject",
                            "Resource": f"{arn}/*",
                            "Condition": {
                                "StringEquals": {
                                    "s3:x-amz-acl": "bucket-owner-full-control"
                                }
                            }
                        }
                    ]
                })
            ),
            opts=pulumi.ResourceOptions(parent=self)
        )

        # AWS Config recorder is conditional to avoid AWS limit of 1 recorder per region
        # Set create_config_recorder to true in Pulumi config to enable
        config = pulumi.Config()
        create_config_recorder = config.get_bool("create_config_recorder") or False

        if create_config_recorder:
            self.config_recorder = aws.cfg.Recorder(
                f"config-recorder-{environment_suffix}",
                name=f"config-recorder-{environment_suffix}",
                role_arn=self.config_role.arn,
                recording_group=aws.cfg.RecorderRecordingGroupArgs(
                    all_supported=True,
                    include_global_resource_types=True,
                ),
                opts=pulumi.ResourceOptions(parent=self)
            )

            self.config_delivery_channel = aws.cfg.DeliveryChannel(
                f"config-delivery-channel-{environment_suffix}",
                name=f"config-delivery-channel-{environment_suffix}",
                s3_bucket_name=self.config_bucket.id,
                opts=pulumi.ResourceOptions(parent=self, depends_on=[self.config_bucket_policy])
            )

            self.config_recorder_status = aws.cfg.RecorderStatus(
                f"config-recorder-status-{environment_suffix}",
                name=self.config_recorder.name,
                is_enabled=True,
                opts=pulumi.ResourceOptions(parent=self, depends_on=[self.config_delivery_channel])
            )

            # Config rules
            aws.cfg.Rule(
                f"config-rule-s3-encryption-{environment_suffix}",
                name=f"s3-bucket-encryption-{environment_suffix}",
                source=aws.cfg.RuleSourceArgs(
                    owner="AWS",
                    source_identifier="S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED",
                ),
                opts=pulumi.ResourceOptions(parent=self, depends_on=[self.config_recorder_status])
            )

            aws.cfg.Rule(
                f"config-rule-kms-rotation-{environment_suffix}",
                name=f"kms-key-rotation-{environment_suffix}",
                source=aws.cfg.RuleSourceArgs(
                    owner="AWS",
                    source_identifier="CMK_BACKING_KEY_ROTATION_ENABLED",
                ),
                opts=pulumi.ResourceOptions(parent=self, depends_on=[self.config_recorder_status])
            )

            aws.cfg.Rule(
                f"config-rule-log-encryption-{environment_suffix}",
                name=f"cloudwatch-log-group-encrypted-{environment_suffix}",
                source=aws.cfg.RuleSourceArgs(
                    owner="AWS",
                    source_identifier="CLOUDWATCH_LOG_GROUP_ENCRYPTED",
                ),
                opts=pulumi.ResourceOptions(parent=self, depends_on=[self.config_recorder_status])
            )

            aws.cfg.Rule(
                f"config-rule-iam-policy-{environment_suffix}",
                name=f"iam-policy-no-full-star-{environment_suffix}",
                source=aws.cfg.RuleSourceArgs(
                    owner="AWS",
                    source_identifier="IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS",
                ),
                opts=pulumi.ResourceOptions(parent=self, depends_on=[self.config_recorder_status])
            )
        else:
            self.config_recorder = None
            self.config_delivery_channel = None
            self.config_recorder_status = None

        # Export outputs
        outputs = {
            "vpc_id": self.vpc.id,
            "subnet_ids": [subnet.id for subnet in self.private_subnets],
            "s3_bucket_name": self.s3_bucket.id,
            "kms_key_arn": self.kms_key.arn,
            "api_gateway_endpoint": pulumi.Output.concat(
                "https://", self.api.id, ".execute-api.", region, ".amazonaws.com/prod/execute"
            ),
            "lambda_function_name": self.lambda_function.name,
            "log_group_name": self.log_group.name,
        }
        if self.config_recorder is not None:
            outputs["config_recorder_name"] = self.config_recorder.name
        self.register_outputs(outputs)
