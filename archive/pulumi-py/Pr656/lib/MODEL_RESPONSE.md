import pulumi
import pulumi_aws as aws
import json

class SecureEnvironment:
    """
    A secure AWS environment class that provisions a complete multi-tier architecture
    with security best practices enforced by default.
    """
    
    def __init__(self, environment_name: str):
        self.environment_name = environment_name
        self.name_prefix = f"{environment_name}"
        
        # Create all resources for this environment
        self._create_kms_key()
        self._create_vpc_and_networking()
        self._create_iam_roles()
        self._create_s3_bucket()
        self._create_secrets_manager()
        self._create_waf_and_alb()
        self._create_config_rules()
        self._create_cloudtrail()
        self._create_monitoring_and_alerting()
        self._enable_ebs_encryption()
    
    def _create_kms_key(self):
        """Create a customer-managed KMS key for this environment"""
        self.kms_key = aws.kms.Key(
            f"{self.name_prefix}-kms-key",
            description=f"KMS key for {self.environment_name} environment",
            deletion_window_in_days=7,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {"AWS": f"arn:aws:iam::{aws.get_caller_identity().account_id}:root"},
                        "Action": "kms:*",
                        "Resource": "*"
                    }
                ]
            }),
            tags={"Environment": self.environment_name}
        )
        
        self.kms_key_alias = aws.kms.Alias(
            f"{self.name_prefix}-kms-key-alias",
            name=f"alias/{self.name_prefix}-key",
            target_key_id=self.kms_key.key_id
        )
    
    def _create_vpc_and_networking(self):
        """Create VPC with public, private, and database subnets"""
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"{self.name_prefix}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"{self.name_prefix}-vpc", "Environment": self.environment_name}
        )
        
        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"{self.name_prefix}-igw",
            vpc_id=self.vpc.id,
            tags={"Name": f"{self.name_prefix}-igw", "Environment": self.environment_name}
        )
        
        # Create subnets
        self.public_subnet = aws.ec2.Subnet(
            f"{self.name_prefix}-public-subnet",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="us-west-1a",
            map_public_ip_on_launch=True,
            tags={"Name": f"{self.name_prefix}-public-subnet", "Environment": self.environment_name}
        )
        
        self.private_subnet = aws.ec2.Subnet(
            f"{self.name_prefix}-private-subnet",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="us-west-1a",
            tags={"Name": f"{self.name_prefix}-private-subnet", "Environment": self.environment_name}
        )
        
        self.database_subnet_1 = aws.ec2.Subnet(
            f"{self.name_prefix}-db-subnet-1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.3.0/24",
            availability_zone="us-west-1a",
            tags={"Name": f"{self.name_prefix}-db-subnet-1", "Environment": self.environment_name}
        )
        
        self.database_subnet_2 = aws.ec2.Subnet(
            f"{self.name_prefix}-db-subnet-2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.4.0/24",
            availability_zone="us-west-1c",
            tags={"Name": f"{self.name_prefix}-db-subnet-2", "Environment": self.environment_name}
        )
        
        # Create NAT Gateway
        self.nat_eip = aws.ec2.Eip(
            f"{self.name_prefix}-nat-eip",
            domain="vpc",
            tags={"Name": f"{self.name_prefix}-nat-eip", "Environment": self.environment_name}
        )
        
        self.nat_gateway = aws.ec2.NatGateway(
            f"{self.name_prefix}-nat-gateway",
            allocation_id=self.nat_eip.id,
            subnet_id=self.public_subnet.id,
            tags={"Name": f"{self.name_prefix}-nat-gateway", "Environment": self.environment_name}
        )
        
        # Create route tables
        self.public_route_table = aws.ec2.RouteTable(
            f"{self.name_prefix}-public-rt",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={"Name": f"{self.name_prefix}-public-rt", "Environment": self.environment_name}
        )
        
        self.private_route_table = aws.ec2.RouteTable(
            f"{self.name_prefix}-private-rt",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=self.nat_gateway.id
                )
            ],
            tags={"Name": f"{self.name_prefix}-private-rt", "Environment": self.environment_name}
        )
        
        # Associate route tables with subnets
        aws.ec2.RouteTableAssociation(
            f"{self.name_prefix}-public-rta",
            subnet_id=self.public_subnet.id,
            route_table_id=self.public_route_table.id
        )
        
        aws.ec2.RouteTableAssociation(
            f"{self.name_prefix}-private-rta",
            subnet_id=self.private_subnet.id,
            route_table_id=self.private_route_table.id
        )
        
        # Create VPC Flow Logs
        self.flow_logs_log_group = aws.cloudwatch.LogGroup(
            f"{self.name_prefix}-vpc-flow-logs",
            name=f"/aws/vpc/flowlogs/{self.name_prefix}",
            retention_in_days=365,
            tags={"Environment": self.environment_name}
        )
        
        self.flow_logs_role = aws.iam.Role(
            f"{self.name_prefix}-flow-logs-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "vpc-flow-logs.amazonaws.com"}
                }]
            })
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.name_prefix}-flow-logs-policy",
            role=self.flow_logs_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/VPCFlowLogsDeliveryRolePolicy"
        )
        
        self.vpc_flow_log = aws.ec2.FlowLog(
            f"{self.name_prefix}-vpc-flow-log",
            iam_role_arn=self.flow_logs_role.arn,
            log_destination=self.flow_logs_log_group.arn,
            resource_id=self.vpc.id,
            resource_type="VPC",
            traffic_type="ALL",
            tags={"Environment": self.environment_name}
        )
    
    def _create_iam_roles(self):
        """Create least-privilege IAM roles for EC2 instances"""
        self.ec2_role = aws.iam.Role(
            f"{self.name_prefix}-ec2-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"}
                }]
            }),
            tags={"Environment": self.environment_name}
        )
        
        # Create custom policy for EC2 instances
        self.ec2_policy = aws.iam.Policy(
            f"{self.name_prefix}-ec2-policy",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": f"arn:aws:secretsmanager:us-west-1:{aws.get_caller_identity().account_id}:secret:{self.name_prefix}-db-credentials-*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": self.kms_key.arn
                    }
                ]
            })
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.name_prefix}-ec2-policy-attachment",
            role=self.ec2_role.name,
            policy_arn=self.ec2_policy.arn
        )
        
        self.ec2_instance_profile = aws.iam.InstanceProfile(
            f"{self.name_prefix}-ec2-instance-profile",
            role=self.ec2_role.name
        )
    
    def _create_s3_bucket(self):
        """Create S3 bucket with encryption and security configurations"""
        self.s3_bucket = aws.s3.Bucket(
            f"{self.name_prefix}-app-data-bucket",
            bucket=f"{self.name_prefix}-app-data-{aws.get_caller_identity().account_id}",
            tags={"Environment": self.environment_name}
        )
        
        # Configure server-side encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            f"{self.name_prefix}-bucket-encryption",
            bucket=self.s3_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.kms_key.arn
                    ),
                    bucket_key_enabled=True
                )
            ]
        )
        
        # Block public access
        aws.s3.BucketPublicAccessBlock(
            f"{self.name_prefix}-bucket-pab",
            bucket=self.s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
        
        # Enable versioning
        aws.s3.BucketVersioning(
            f"{self.name_prefix}-bucket-versioning",
            bucket=self.s3_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            )
        )
    
    def _create_secrets_manager(self):
        """Create Secrets Manager secret with automatic rotation"""
        self.db_secret = aws.secretsmanager.Secret(
            f"{self.name_prefix}-db-credentials",
            name=f"{self.name_prefix}-db-credentials",
            description=f"Database credentials for {self.environment_name} environment",
            kms_key_id=self.kms_key.arn,
            tags={"Environment": self.environment_name}
        )
        
        # Create initial secret version
        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"{self.name_prefix}-db-secret-version",
            secret_id=self.db_secret.id,
            secret_string=json.dumps({
                "username": "admin",
                "password": "ChangeMe123!",
                "engine": "mysql",
                "host": "localhost",
                "port": 3306,
                "dbname": f"{self.environment_name}db"
            })
        )
        
        # Configure automatic rotation (30 days)
        aws.secretsmanager.SecretRotation(
            f"{self.name_prefix}-db-secret-rotation",
            secret_id=self.db_secret.id,
            rotation_rules=aws.secretsmanager.SecretRotationRotationRulesArgs(
                automatically_after_days=30
            )
        )
    
    def _create_waf_and_alb(self):
        """Create WAF and Application Load Balancer with HTTPS"""
        # Create WAF Web ACL
        self.waf_web_acl = aws.wafv2.WebAcl(
            f"{self.name_prefix}-web-acl",
            scope="REGIONAL",
            default_action=aws.wafv2.WebAclDefaultActionArgs(allow={}),
            rules=[
                aws.wafv2.WebAclRuleArgs(
                    name="AWS-AWSManagedRulesCommonRuleSet",
                    priority=1,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name="AWSManagedRulesCommonRuleSet",
                            vendor_name="AWS"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="CommonRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                ),
                aws.wafv2.WebAclRuleArgs(
                    name="AWS-AWSManagedRulesSQLiRuleSet",
                    priority=2,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name="AWSManagedRulesSQLiRuleSet",
                            vendor_name="AWS"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="SQLiRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name=f"{self.name_prefix}WebAcl",
                sampled_requests_enabled=True
            ),
            tags={"Environment": self.environment_name}
        )
        
        # Create security group for ALB
        self.alb_security_group = aws.ec2.SecurityGroup(
            f"{self.name_prefix}-alb-sg",
            name=f"{self.name_prefix}-alb-sg",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={"Environment": self.environment_name}
        )
        
        # Create Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"{self.name_prefix}-alb",
            name=f"{self.name_prefix}-alb",
            load_balancer_type="application",
            subnets=[self.public_subnet.id, self.database_subnet_2.id],  # Using two AZs
            security_groups=[self.alb_security_group.id],
            tags={"Environment": self.environment_name}
        )
        
        # Associate WAF with ALB
        aws.wafv2.WebAclAssociation(
            f"{self.name_prefix}-waf-alb-association",
            resource_arn=self.alb.arn,
            web_acl_arn=self.waf_web_acl.arn
        )
        
        # Create target group
        self.target_group = aws.lb.TargetGroup(
            f"{self.name_prefix}-tg",
            name=f"{self.name_prefix}-tg",
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                path="/health",
                protocol="HTTP"
            ),
            tags={"Environment": self.environment_name}
        )
        
        # Create HTTPS listener (requires certificate)
        # Note: In production, you would create/import an SSL certificate
        self.https_listener = aws.lb.Listener(
            f"{self.name_prefix}-https-listener",
            load_balancer_arn=self.alb.arn,
            port="443",
            protocol="HTTPS",
            ssl_policy="ELBSecurityPolicy-TLS-1-2-2017-01",
            certificate_arn="arn:aws:acm:us-west-1:123456789012:certificate/12345678-1234-1234-1234-123456789012",  # Replace with actual certificate
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.target_group.arn
                )
            ]
        )
    
    def _create_config_rules(self):
        """Create AWS Config rules for compliance monitoring"""
        # Enable Config Configuration Recorder
        self.config_bucket = aws.s3.Bucket(
            f"{self.name_prefix}-config-bucket",
            bucket=f"{self.name_prefix}-config-{aws.get_caller_identity().account_id}",
            force_destroy=True,
            tags={"Environment": self.environment_name}
        )
        
        # Config service role
        self.config_role = aws.iam.Role(
            f"{self.name_prefix}-config-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "config.amazonaws.com"}
                }]
            })
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.name_prefix}-config-role-policy",
            role=self.config_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/ConfigRole"
        )
        
        # Config delivery channel
        self.config_delivery_channel = aws.cfg.DeliveryChannel(
            f"{self.name_prefix}-config-delivery-channel",
            name=f"{self.name_prefix}-config-delivery-channel",
            s3_bucket_name=self.config_bucket.bucket
        )
        
        # Config configuration recorder
        self.config_recorder = aws.cfg.ConfigurationRecorder(
            f"{self.name_prefix}-config-recorder",
            name=f"{self.name_prefix}-config-recorder",
            role_arn=self.config_role.arn,
            recording_group=aws.cfg.ConfigurationRecorderRecordingGroupArgs(
                all_supported=True,
                include_global_resource_types=True
            )
        )
        
        # Config rules
        self.s3_encryption_rule = aws.cfg.ConfigRule(
            f"{self.name_prefix}-s3-encryption-rule",
            name=f"{self.name_prefix}-s3-bucket-server-side-encryption-enabled",
            source=aws.cfg.ConfigRuleSourceArgs(
                owner="AWS",
                source_identifier="S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
            ),
            depends_on=[self.config_recorder]
        )
        
        self.ebs_encryption_rule = aws.cfg.ConfigRule(
            f"{self.name_prefix}-ebs-encryption-rule",
            name=f"{self.name_prefix}-ec2-volume-inuse-check",
            source=aws.cfg.ConfigRuleSourceArgs(
                owner="AWS",
                source_identifier="EC2_VOLUME_INUSE_CHECK"
            ),
            depends_on=[self.config_recorder]
        )
    
    def _create_cloudtrail(self):
        """Create CloudTrail for audit logging"""
        self.cloudtrail_bucket = aws.s3.Bucket(
            f"{self.name_prefix}-cloudtrail-bucket",
            bucket=f"{self.name_prefix}-cloudtrail-{aws.get_caller_identity().account_id}",
            force_destroy=True,
            tags={"Environment": self.environment_name}
        )
        
        # CloudTrail bucket policy
        self.cloudtrail_bucket_policy = aws.s3.BucketPolicy(
            f"{self.name_prefix}-cloudtrail-bucket-policy",
            bucket=self.cloudtrail_bucket.id,
            policy=self.cloudtrail_bucket.arn.apply(
                lambda arn: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "AWSCloudTrailAclCheck",
                            "Effect": "Allow",
                            "Principal": {"Service": "cloudtrail.amazonaws.com"},
                            "Action": "s3:GetBucketAcl",
                            "Resource": arn
                        },
                        {
                            "Sid": "AWSCloudTrailWrite",
                            "Effect": "Allow",
                            "Principal": {"Service": "cloudtrail.amazonaws.com"},
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
            )
        )
        
        # CloudTrail log group
        self.cloudtrail_log_group = aws.cloudwatch.LogGroup(
            f"{self.name_prefix}-cloudtrail-log-group",
            name=f"/aws/cloudtrail/{self.name_prefix}",
            retention_in_days=365,
            tags={"Environment": self.environment_name}
        )
        
        # CloudTrail
        self.cloudtrail = aws.cloudtrail.Trail(
            f"{self.name_prefix}-cloudtrail",
            name=f"{self.name_prefix}-cloudtrail",
            s3_bucket_name=self.cloudtrail_bucket.bucket,
            cloud_watch_logs_group_arn=self.cloudtrail_log_group.arn,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_logging=True,
            tags={"Environment": self.environment_name},
            opts=pulumi.ResourceOptions(depends_on=[self.cloudtrail_bucket_policy])
        )
    
    def _create_monitoring_and_alerting(self):
        """Create monitoring and alerting infrastructure"""
        # SNS topic for security notifications
        self.security_notifications_topic = aws.sns.Topic(
            f"{self.name_prefix}-security-notifications",
            name=f"{self.name_prefix}-security-notifications",
            tags={"Environment": self.environment_name}
        )
        
        # Lambda function for automated response
        self.security_response_lambda_role = aws.iam.Role(
            f"{self.name_prefix}-security-lambda-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"}
                }]
            })
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.name_prefix}-lambda-basic-execution",
            role=self.security_response_lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )
        
        # Lambda policy for SNS publishing
        self.lambda_sns_policy = aws.iam.Policy(
            f"{self.name_prefix}-lambda-sns-policy",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["sns:Publish"],
                    "Resource": self.security_notifications_topic.arn
                }]
            })
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.name_prefix}-lambda-sns-policy-attachment",
            role=self.security_response_lambda_role.name,
            policy_arn=self.lambda_sns_policy.arn
        )
        
        # Security response Lambda function
        self.security_response_lambda = aws.lambda_.Function(
            f"{self.name_prefix}-security-response",
            name=f"{self.name_prefix}-security-response",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "lambda_function.py": pulumi.StringAsset("""
import boto3
import json
import os

def lambda_handler(event, context):
    sns = boto3.client('sns')
    topic_arn = os.environ['SNS_TOPIC_ARN']
    
    message = {
        'alert': 'Root user login detected',
        'timestamp': context.aws_request_id,
        'environment': os.environ['ENVIRONMENT']
    }
    
    sns.publish(
        TopicArn=topic_arn,
        Message=json.dumps(message),
        Subject=f"Security Alert - {os.environ['ENVIRONMENT']}"
    )
    
    return {'statusCode': 200, 'body': 'Alert sent'}
""")
            }),
            handler="lambda_function.lambda_handler",
            role=self.security_response_lambda_role.arn,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "SNS_TOPIC_ARN": self.security_notifications_topic.arn,
                    "ENVIRONMENT": self.environment_name
                }
            ),
            tags={"Environment": self.environment_name}
        )
        
        # CloudWatch alarm for root user login
        self.root_login_alarm = aws.cloudwatch.MetricAlarm(
            f"{self.name_prefix}-root-login-alarm",
            name=f"{self.name_prefix}-root-login-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods="1",
            metric_name="RootUserLoginCount",
            namespace="CustomMetrics",
            period="300",
            statistic="Sum",
            threshold="0",
            alarm_description="Alarm when root user logs in",
            alarm_actions=[self.security_response_lambda.arn],
            tags={"Environment": self.environment_name}
        )
        
        # Lambda permission for CloudWatch
        aws.lambda_.Permission(
            f"{self.name_prefix}-lambda-cloudwatch-permission",
            action="lambda:InvokeFunction",
            function=self.security_response_lambda.name,
            principal="lambda.alarms.cloudwatch.amazonaws.com",
            source_arn=self.root_login_alarm.arn
        )
    
    def _enable_ebs_encryption(self):
        """Enable EBS encryption by default"""
        self.ebs_encryption_by_default = aws.ebs.EncryptionByDefault(
            f"{self.name_prefix}-ebs-encryption-default",
            enabled=True
        )
        
        # Set default KMS key for EBS encryption
        self.ebs_default_kms_key = aws.ebs.DefaultKmsKey(
            f"{self.name_prefix}-ebs-default-kms-key",
            key_arn=self.kms_key.arn
        )

# Main program - Create staging and production environments
if __name__ == "__main__":
    # Set AWS region
    pulumi.Config().require("aws:region")
    
    # Create staging environment
    staging_env = SecureEnvironment("staging")
    
    # Create production environment  
    production_env = SecureEnvironment("production")
    
    # Export important outputs
    pulumi.export("staging_vpc_id", staging_env.vpc.id)
    pulumi.export("staging_kms_key_id", staging_env.kms_key.id)
    pulumi.export("staging_s3_bucket", staging_env.s3_bucket.bucket)
    pulumi.export("staging_alb_dns", staging_env.alb.dns_name)
    
    pulumi.export("production_vpc_id", production_env.vpc.id)
    pulumi.export("production_kms_key_id", production_env.kms_key.id)
    pulumi.export("production_s3_bucket", production_env.s3_bucket.bucket)
    pulumi.export("production_alb_dns", production_env.alb.dns_name)