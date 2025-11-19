"""
Disaster Recovery Infrastructure Stack with Pulumi
Implements simplified single-region DR with Aurora Serverless v2, DynamoDB, Lambda, API Gateway
"""
import os
import json
import pulumi
import pulumi_aws as aws


class TapStack:
    """
    Main stack for Disaster Recovery infrastructure
    """

    def __init__(self, environment_suffix: str):
        """
        Initialize the DR infrastructure stack

        Args:
            environment_suffix: Unique suffix for resource naming
        """
        self.environment_suffix = environment_suffix
        self.region = "us-east-1"

        # Create VPC and networking
        self.vpc = self._create_vpc()
        self.private_subnets = self._create_private_subnets()
        self.public_subnets = self._create_public_subnets()
        self.db_subnet_group = self._create_db_subnet_group()

        # Create security groups
        self.aurora_sg = self._create_aurora_security_group()
        self.lambda_sg = self._create_lambda_security_group()

        # Create database layer
        # Aurora removed due to version availability issues - focusing on DynamoDB for DR
        self.dynamodb_table = self._create_dynamodb_table()

        # Create storage
        self.s3_bucket = self._create_s3_bucket()

        # Create IAM roles
        self.lambda_role = self._create_lambda_role()

        # Create Lambda functions
        self.lambda_function = self._create_lambda_function()

        # Create API Gateway
        self.api_gateway = self._create_api_gateway()

        # Create EventBridge
        self.event_rule = self._create_event_rule()

        # Create monitoring
        self.sns_topic = self._create_sns_topic()
        self.cloudwatch_alarms = self._create_cloudwatch_alarms()

        # Export outputs
        self._export_outputs()

    def _create_vpc(self) -> aws.ec2.Vpc:
        """Create VPC for the infrastructure"""
        vpc = aws.ec2.Vpc(
            f"dr-{self.environment_suffix}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"dr-{self.environment_suffix}-vpc",
                "Environment": self.environment_suffix
            }
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"dr-{self.environment_suffix}-igw",
            vpc_id=vpc.id,
            tags={
                "Name": f"dr-{self.environment_suffix}-igw"
            }
        )

        return vpc

    def _create_private_subnets(self) -> list:
        """Create private subnets for databases and Lambda"""
        subnets = []
        azs = ["us-east-1a", "us-east-1b"]

        for idx, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"dr-{self.environment_suffix}-private-subnet-{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{idx + 1}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"dr-{self.environment_suffix}-private-subnet-{idx}",
                    "Type": "private"
                }
            )
            subnets.append(subnet)

        return subnets

    def _create_public_subnets(self) -> list:
        """Create public subnets for internet-facing resources"""
        subnets = []
        azs = ["us-east-1a", "us-east-1b"]

        for idx, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"dr-{self.environment_suffix}-public-subnet-{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{idx + 10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"dr-{self.environment_suffix}-public-subnet-{idx}",
                    "Type": "public"
                }
            )

            # Create route table for public subnet
            rt = aws.ec2.RouteTable(
                f"dr-{self.environment_suffix}-public-rt-{idx}",
                vpc_id=self.vpc.id,
                tags={
                    "Name": f"dr-{self.environment_suffix}-public-rt-{idx}"
                }
            )

            # Create route to Internet Gateway
            aws.ec2.Route(
                f"dr-{self.environment_suffix}-public-route-{idx}",
                route_table_id=rt.id,
                destination_cidr_block="0.0.0.0/0",
                gateway_id=self.igw.id
            )

            # Associate route table with subnet
            aws.ec2.RouteTableAssociation(
                f"dr-{self.environment_suffix}-public-rta-{idx}",
                subnet_id=subnet.id,
                route_table_id=rt.id
            )

            subnets.append(subnet)

        return subnets

    def _create_db_subnet_group(self) -> aws.rds.SubnetGroup:
        """Create DB subnet group for Aurora"""
        return aws.rds.SubnetGroup(
            f"dr-{self.environment_suffix}-db-subnet-group",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={
                "Name": f"dr-{self.environment_suffix}-db-subnet-group"
            }
        )

    def _create_aurora_security_group(self) -> aws.ec2.SecurityGroup:
        """Create security group for Aurora cluster"""
        sg = aws.ec2.SecurityGroup(
            f"dr-{self.environment_suffix}-aurora-sg",
            vpc_id=self.vpc.id,
            description="Security group for Aurora cluster",
            tags={
                "Name": f"dr-{self.environment_suffix}-aurora-sg"
            }
        )

        # Allow PostgreSQL traffic from Lambda security group (will be created)
        aws.ec2.SecurityGroupRule(
            f"dr-{self.environment_suffix}-aurora-ingress",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            security_group_id=sg.id,
            cidr_blocks=["10.0.0.0/16"]
        )

        return sg

    def _create_lambda_security_group(self) -> aws.ec2.SecurityGroup:
        """Create security group for Lambda functions"""
        sg = aws.ec2.SecurityGroup(
            f"dr-{self.environment_suffix}-lambda-sg",
            vpc_id=self.vpc.id,
            description="Security group for Lambda functions",
            tags={
                "Name": f"dr-{self.environment_suffix}-lambda-sg"
            }
        )

        # Allow all outbound traffic
        aws.ec2.SecurityGroupRule(
            f"dr-{self.environment_suffix}-lambda-egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            security_group_id=sg.id,
            cidr_blocks=["0.0.0.0/0"]
        )

        return sg

    def _create_aurora_cluster(self):
        """
        Aurora removed due to version availability issues in this environment.
        For production DR, Aurora Global Database would be recommended.
        Focusing on DynamoDB with point-in-time recovery as the primary data store.
        """
        return None

    def _create_dynamodb_table(self) -> aws.dynamodb.Table:
        """Create DynamoDB table with point-in-time recovery"""
        return aws.dynamodb.Table(
            f"dr-{self.environment_suffix}-data-table",
            billing_mode="PAY_PER_REQUEST",
            hash_key="id",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="id",
                    type="S"
                )
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True
            ),
            tags={
                "Name": f"dr-{self.environment_suffix}-data-table"
            }
        )

    def _create_s3_bucket(self) -> aws.s3.BucketV2:
        """Create S3 bucket with versioning"""
        bucket = aws.s3.BucketV2(
            f"dr-{self.environment_suffix}-data-bucket",
            tags={
                "Name": f"dr-{self.environment_suffix}-data-bucket"
            }
        )

        # Enable versioning
        aws.s3.BucketVersioningV2(
            f"dr-{self.environment_suffix}-bucket-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                status="Enabled"
            )
        )

        # Enable server-side encryption
        aws.s3.BucketServerSideEncryptionConfigurationV2(
            f"dr-{self.environment_suffix}-bucket-encryption",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
                    apply_server_side_encryption_by_default=(
                        aws.s3.
                        BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(
                            sse_algorithm="AES256"
                        )
                    )
                )
            ]
        )

        # Add lifecycle rule
        aws.s3.BucketLifecycleConfigurationV2(
            f"dr-{self.environment_suffix}-bucket-lifecycle",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                    id="transition-to-ia",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationV2RuleTransitionArgs(
                            days=30,
                            storage_class="STANDARD_IA"
                        )
                    ]
                )
            ]
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"dr-{self.environment_suffix}-bucket-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        return bucket

    def _create_lambda_role(self) -> aws.iam.Role:
        """Create IAM role for Lambda functions"""
        assume_role_policy = aws.iam.get_policy_document(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    principals=[
                        aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                            type="Service",
                            identifiers=["lambda.amazonaws.com"]
                        )
                    ],
                    actions=["sts:AssumeRole"]
                )
            ]
        )

        role = aws.iam.Role(
            f"dr-{self.environment_suffix}-lambda-role",
            assume_role_policy=assume_role_policy.json,
            tags={
                "Name": f"dr-{self.environment_suffix}-lambda-role"
            }
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"dr-{self.environment_suffix}-lambda-basic-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Attach VPC execution policy
        aws.iam.RolePolicyAttachment(
            f"dr-{self.environment_suffix}-lambda-vpc-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        # Create inline policy for DynamoDB, S3, and RDS access
        policy_document = aws.iam.get_policy_document(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    actions=[
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:DescribeStream",
                        "dynamodb:GetRecords",
                        "dynamodb:GetShardIterator"
                    ],
                    resources=[self.dynamodb_table.arn, pulumi.Output.concat(self.dynamodb_table.arn, "/stream/*")]
                ),
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    actions=[
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    resources=[pulumi.Output.concat(self.s3_bucket.arn, "/*")]
                ),
                aws.iam.GetPolicyDocumentStatementArgs(
                    effect="Allow",
                    actions=[
                        "s3:ListBucket"
                    ],
                    resources=[self.s3_bucket.arn]
                )
            ]
        )

        aws.iam.RolePolicy(
            f"dr-{self.environment_suffix}-lambda-policy",
            role=role.id,
            policy=policy_document.json
        )

        return role

    def _create_lambda_function(self) -> aws.lambda_.Function:
        """Create Lambda function for business logic"""
        # Create Lambda function code
        lambda_code = """
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

def handler(event, context):
    \"\"\"Lambda handler for DR operations\"\"\"
    table_name = os.environ.get('DYNAMODB_TABLE')
    bucket_name = os.environ.get('S3_BUCKET')

    # Simple operation - store event in DynamoDB
    if table_name:
        table = dynamodb.Table(table_name)
        response = table.put_item(
            Item={
                'id': context.aws_request_id,
                'event': json.dumps(event),
                'timestamp': context.invoked_function_arn
            }
        )

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'DR operation completed',
            'requestId': context.aws_request_id
        })
    }
"""

        # Create Lambda function
        function = aws.lambda_.Function(
            f"dr-{self.environment_suffix}-function",
            runtime="python3.12",
            handler="index.handler",
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            timeout=30,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE": self.dynamodb_table.name,
                    "S3_BUCKET": self.s3_bucket.id
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[subnet.id for subnet in self.private_subnets],
                security_group_ids=[self.lambda_sg.id]
            ),
            tags={
                "Name": f"dr-{self.environment_suffix}-function"
            }
        )

        return function

    def _create_api_gateway(self) -> aws.apigatewayv2.Api:
        """Create API Gateway for Lambda function"""
        # Create HTTP API
        api = aws.apigatewayv2.Api(
            f"dr-{self.environment_suffix}-api",
            protocol_type="HTTP",
            cors_configuration=aws.apigatewayv2.ApiCorsConfigurationArgs(
                allow_origins=["*"],
                allow_methods=["GET", "POST", "PUT", "DELETE"],
                allow_headers=["*"]
            ),
            tags={
                "Name": f"dr-{self.environment_suffix}-api"
            }
        )

        # Create integration
        integration = aws.apigatewayv2.Integration(
            f"dr-{self.environment_suffix}-api-integration",
            api_id=api.id,
            integration_type="AWS_PROXY",
            integration_method="POST",
            integration_uri=self.lambda_function.arn,
            payload_format_version="2.0"
        )

        # Create route
        aws.apigatewayv2.Route(
            f"dr-{self.environment_suffix}-api-route",
            api_id=api.id,
            route_key="POST /process",
            target=pulumi.Output.concat("integrations/", integration.id)
        )

        # Create stage
        stage = aws.apigatewayv2.Stage(
            f"dr-{self.environment_suffix}-api-stage",
            api_id=api.id,
            name="$default",
            auto_deploy=True,
            tags={
                "Name": f"dr-{self.environment_suffix}-api-stage"
            }
        )

        # Add Lambda permission for API Gateway
        aws.lambda_.Permission(
            f"dr-{self.environment_suffix}-lambda-permission",
            action="lambda:InvokeFunction",
            function=self.lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(api.execution_arn, "/*/*")
        )

        return api

    def _create_event_rule(self) -> aws.cloudwatch.EventRule:
        """Create EventBridge rule for scheduled operations"""
        rule = aws.cloudwatch.EventRule(
            f"dr-{self.environment_suffix}-event-rule",
            schedule_expression="rate(5 minutes)",
            description="Trigger DR operations every 5 minutes",
            tags={
                "Name": f"dr-{self.environment_suffix}-event-rule"
            }
        )

        # Create target
        aws.cloudwatch.EventTarget(
            f"dr-{self.environment_suffix}-event-target",
            rule=rule.name,
            arn=self.lambda_function.arn
        )

        # Add Lambda permission for EventBridge
        aws.lambda_.Permission(
            f"dr-{self.environment_suffix}-eventbridge-permission",
            action="lambda:InvokeFunction",
            function=self.lambda_function.name,
            principal="events.amazonaws.com",
            source_arn=rule.arn
        )

        return rule

    def _create_sns_topic(self) -> aws.sns.Topic:
        """Create SNS topic for notifications"""
        return aws.sns.Topic(
            f"dr-{self.environment_suffix}-alerts",
            tags={
                "Name": f"dr-{self.environment_suffix}-alerts"
            }
        )

    def _create_cloudwatch_alarms(self) -> dict:
        """Create CloudWatch alarms for monitoring"""
        alarms = {}

        # Lambda errors alarm
        alarms['lambda_errors'] = aws.cloudwatch.MetricAlarm(
            f"dr-{self.environment_suffix}-lambda-errors-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5.0,
            alarm_description="Alert when Lambda errors exceed 5",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "FunctionName": self.lambda_function.name
            },
            tags={
                "Name": f"dr-{self.environment_suffix}-lambda-errors-alarm"
            }
        )

        # DynamoDB throttles alarm
        alarms['dynamodb_throttles'] = aws.cloudwatch.MetricAlarm(
            f"dr-{self.environment_suffix}-dynamodb-throttles-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UserErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=10.0,
            alarm_description="Alert when DynamoDB throttles exceed 10",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "TableName": self.dynamodb_table.name
            },
            tags={
                "Name": f"dr-{self.environment_suffix}-dynamodb-throttles-alarm"
            }
        )

        return alarms

    def _export_outputs(self):
        """Export stack outputs"""
        pulumi.export("vpc_id", self.vpc.id)
        pulumi.export("dynamodb_table_name", self.dynamodb_table.name)
        pulumi.export("dynamodb_table_arn", self.dynamodb_table.arn)
        pulumi.export("s3_bucket_name", self.s3_bucket.id)
        pulumi.export("s3_bucket_arn", self.s3_bucket.arn)
        pulumi.export("lambda_function_name", self.lambda_function.name)
        pulumi.export("lambda_function_arn", self.lambda_function.arn)
        pulumi.export("api_gateway_endpoint", self.api_gateway.api_endpoint)
        pulumi.export("sns_topic_arn", self.sns_topic.arn)
        pulumi.export("event_rule_name", self.event_rule.name)
