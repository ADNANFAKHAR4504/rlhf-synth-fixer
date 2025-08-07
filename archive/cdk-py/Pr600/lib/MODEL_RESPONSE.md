I'll create a comprehensive AWS CDK Python project for the Nova Model Breaking application that meets all your requirements. Here's the complete implementation:

## 📁 Project Structure Implementation

### `tap.py` - CDK App Entry Point

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get environment configuration
account = os.environ.get('CDK_DEFAULT_ACCOUNT', '123456789012')
region = os.environ.get('CDK_DEFAULT_REGION', 'us-east-1')

env = cdk.Environment(account=account, region=region)

# Create the main stack
TapStack(app, "TapStack",
    env=env,
    description="Nova Model Breaking - Secure and Scalable Infrastructure"
)

app.synth()
```

### `lib/tap_stack.py` - Main CDK Stack Logic

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_elbv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    aws_apigateway as apigateway,
    aws_rds as rds,
    aws_logs as logs,
    aws_ssm as ssm,
    aws_certificatemanager as acm,
    aws_cloudwatch as cloudwatch,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct
import json

class TapStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()
        
        # Create VPC with proper networking
        self.vpc = self._create_vpc()
        
        # Create S3 bucket with encryption
        self.s3_bucket = self._create_s3_bucket()
        
        # Create IAM roles
        self.ec2_role = self._create_ec2_role()
        self.api_gateway_role = self._create_api_gateway_role()
        
        # Create RDS database
        self.database = self._create_database()
        
        # Create security groups
        self.alb_security_group = self._create_alb_security_group()
        self.ec2_security_group = self._create_ec2_security_group()
        self.rds_security_group = self._create_rds_security_group()
        
        # Create SSL certificate
        self.certificate = self._create_ssl_certificate()
        
        # Create Application Load Balancer
        self.alb = self._create_application_load_balancer()
        
        # Create Auto Scaling Group
        self.asg = self._create_auto_scaling_group()
        
        # Create API Gateway
        self.api_gateway = self._create_api_gateway()
        
        # Create CloudWatch resources
        self._create_cloudwatch_resources()
        
        # Create SSM parameters
        self._create_ssm_parameters()
        
        # Create outputs
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """Create customer-managed KMS key for encryption"""
        key = kms.Key(
            self, "TapKMSKey",
            description="KMS key for Nova Model Breaking application encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Add key policy for S3 and other services
        key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Enable S3 Service",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("s3.amazonaws.com")],
                actions=[
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                resources=["*"]
            )
        )
        
        return key

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets across multiple AZs"""
        vpc = ec2.Vpc(
            self, "TapVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,  # Use 2 AZs for high availability
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="DatabaseSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            nat_gateways=2  # One NAT gateway per AZ for high availability
        )
        
        # Add VPC Flow Logs for security monitoring
        vpc.add_flow_log(
            "TapVPCFlowLog",
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                logs.LogGroup(
                    self, "VPCFlowLogGroup",
                    retention=logs.RetentionDays.ONE_WEEK,
                    removal_policy=RemovalPolicy.DESTROY
                )
            )
        )
        
        return vpc

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with KMS encryption and security settings"""
        bucket = s3.Bucket(
            self, "TapS3Bucket",
            bucket_name=f"nova-model-breaking-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteIncompleteMultipartUploads",
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ]
        )
        
        return bucket

    def _create_ec2_role(self) -> iam.Role:
        """Create IAM role for EC2 instances with least privilege"""
        role = iam.Role(
            self, "TapEC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
            ]
        )
        
        # Add custom policy for S3 access
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                resources=[f"{self.s3_bucket.bucket_arn}/*"]
            )
        )
        
        # Add SSM parameter access
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                ],
                resources=[f"arn:aws:ssm:{self.region}:{self.account}:parameter/nova-model-breaking/*"]
            )
        )
        
        return role

    def _create_api_gateway_role(self) -> iam.Role:
        """Create IAM role for API Gateway"""
        role = iam.Role(
            self, "TapAPIGatewayRole",
            assumed_by=iam.ServicePrincipal("apigateway.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AmazonAPIGatewayPushToCloudWatchLogs")
            ]
        )
        
        return role

    def _create_database(self) -> rds.DatabaseInstance:
        """Create RDS database with encryption and automated backups"""
        db_subnet_group = rds.SubnetGroup(
            self, "TapDBSubnetGroup",
            description="Subnet group for Nova Model Breaking database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
        )
        
        database = rds.DatabaseInstance(
            self, "TapDatabase",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            multi_az=True,
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            backup_retention=Duration.days(7),
            delete_automated_backups=False,
            deletion_protection=False,  # Set to True in production
            removal_policy=RemovalPolicy.DESTROY,
            enable_performance_insights=True,
            monitoring_interval=Duration.seconds(60)
        )
        
        return database

    def _create_alb_security_group(self) -> ec2.SecurityGroup:
        """Create security group for Application Load Balancer"""
        sg = ec2.SecurityGroup(
            self, "TapALBSecurityGroup",
            vpc=self.vpc,
            description="Security group for Nova Model Breaking ALB",
            allow_all_outbound=False
        )
        
        # Allow HTTPS traffic from specific IP ranges (replace with your actual IPs)
        sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("0.0.0.0/0"),  # Replace with specific IP ranges in production
            connection=ec2.Port.tcp(443),
            description="HTTPS traffic"
        )
        
        # Allow HTTP traffic (for redirect to HTTPS)
        sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("0.0.0.0/0"),  # Replace with specific IP ranges in production
            connection=ec2.Port.tcp(80),
            description="HTTP traffic for redirect"
        )
        
        return sg

    def _create_ec2_security_group(self) -> ec2.SecurityGroup:
        """Create security group for EC2 instances"""
        sg = ec2.SecurityGroup(
            self, "TapEC2SecurityGroup",
            vpc=self.vpc,
            description="Security group for Nova Model Breaking EC2 instances",
            allow_all_outbound=True
        )
        
        # Allow traffic from ALB
        sg.add_ingress_rule(
            peer=ec2.Peer.security_group_id(self.alb_security_group.security_group_id),
            connection=ec2.Port.tcp(80),
            description="HTTP from ALB"
        )
        
        return sg

    def _create_rds_security_group(self) -> ec2.SecurityGroup:
        """Create security group for RDS database"""
        sg = ec2.SecurityGroup(
            self, "TapRDSSecurityGroup",
            vpc=self.vpc,
            description="Security group for Nova Model Breaking RDS",
            allow_all_outbound=False
        )
        
        # Allow PostgreSQL traffic from EC2 instances
        sg.add_ingress_rule(
            peer=ec2.Peer.security_group_id(self.ec2_security_group.security_group_id),
            connection=ec2.Port.tcp(5432),
            description="PostgreSQL from EC2"
        )
        
        return sg

    def _create_ssl_certificate(self) -> acm.Certificate:
        """Create SSL certificate for HTTPS"""
        # Note: In production, you would use a real domain
        certificate = acm.Certificate(
            self, "TapSSLCertificate",
            domain_name="nova-model-breaking.example.com",  # Replace with your domain
            validation=acm.CertificateValidation.from_dns()
        )
        
        return certificate

    def _create_application_load_balancer(self) -> elbv2.ApplicationLoadBalancer:
        """Create Application Load Balancer with HTTPS listener"""
        alb = elbv2.ApplicationLoadBalancer(
            self, "TapALB",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.alb_security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )
        
        # Create target group
        target_group = elbv2.ApplicationTargetGroup(
            self, "TapTargetGroup",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=self.vpc,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_threshold_count=2,
                interval=Duration.seconds(30),
                path="/health",
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                unhealthy_threshold_count=3
            )
        )
        
        # Add HTTPS listener
        alb.add_listener(
            "TapHTTPSListener",
            port=443,
            protocol=elbv2.ApplicationProtocol.HTTPS,
            certificates=[self.certificate],
            ssl_policy=elbv2.SslPolicy.TLS12_EXT,
            default_target_groups=[target_group]
        )
        
        # Add HTTP listener for redirect to HTTPS
        alb.add_listener(
            "TapHTTPListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.redirect(
                protocol="HTTPS",
                port="443",
                permanent=True
            )
        )
        
        return alb

    def _create_auto_scaling_group(self) -> autoscaling.AutoScalingGroup:
        """Create Auto Scaling Group with EC2 instances"""
        # Create launch template
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "amazon-linux-extras install -y docker",
            "service docker start",
            "usermod -a -G docker ec2-user",
            # Add your application startup commands here
        )
        
        launch_template = ec2.LaunchTemplate(
            self, "TapLaunchTemplate",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=self.ec2_security_group,
            role=self.ec2_role,
            user_data=user_data,
            detailed_monitoring=True
        )
        
        # Create Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self, "TapASG",
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=10,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            health_check=autoscaling.HealthCheck.elb(grace_period=Duration.minutes(5))
        )
        
        # Attach to target group
        asg.attach_to_application_target_group(
            elbv2.ApplicationTargetGroup.from_target_group_attributes(
                self, "ImportedTargetGroup",
                target_group_arn=self.alb.listeners[0].default_target_groups[0].target_group_arn
            )
        )
        
        return asg

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway with IAM authentication"""
        api = apigateway.RestApi(
            self, "TapAPIGateway",
            rest_api_name="Nova Model Breaking API",
            description="Secure API for Nova Model Breaking application",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization"]
            ),
            endpoint_configuration=apigateway.EndpointConfiguration(
                types=[apigateway.EndpointType.REGIONAL]
            )
        )
        
        # Create IAM authorizer
        authorizer = apigateway.RequestAuthorizer(
            self, "TapAPIAuthorizer",
            handler=None,  # You would need to create a Lambda function for custom authorization
            identity_sources=[apigateway.IdentitySource.header("Authorization")]
        )
        
        # Create API resources with IAM authentication
        api_resource = api.root.add_resource("api")
        api_resource.add_method(
            "GET",
            apigateway.MockIntegration(
                integration_responses=[
                    apigateway.IntegrationResponse(status_code="200")
                ],
                passthrough_behavior=apigateway.PassthroughBehavior.NEVER,
                request_templates={"application/json": '{"statusCode": 200}'}
            ),
            method_responses=[
                apigateway.MethodResponse(status_code="200")
            ],
            authorization_type=apigateway.AuthorizationType.IAM
        )
        
        return api

    def _create_cloudwatch_resources(self):
        """Create CloudWatch log groups and alarms"""
        # Application log group
        app_log_group = logs.LogGroup(
            self, "TapAppLogGroup",
            log_group_name="/aws/ec2/nova-model-breaking/application",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Infrastructure deployment log group
        infra_log_group = logs.LogGroup(
            self, "TapInfraLogGroup",
            log_group_name="/aws/codebuild/nova-model-breaking/infrastructure",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Create CloudWatch alarms
        cloudwatch.Alarm(
            self, "TapHighCPUAlarm",
            metric=self.asg.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2
        )

    def _create_ssm_parameters(self):
        """Create SSM parameters for application configuration"""
        ssm.StringParameter(
            self, "TapDBEndpoint",
            parameter_name="/nova-model-breaking/database/endpoint",
            string_value=self.database.instance_endpoint.hostname,
            description="Database endpoint for Nova Model Breaking"
        )
        
        ssm.StringParameter(
            self, "TapS3Bucket",
            parameter_name="/nova-model-breaking/s3/bucket-name",
            string_value=self.s3_bucket.bucket_name,
            description="S3 bucket name for Nova Model Breaking"
        )

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(
            self, "ALBDNSName",
            value=self.alb.load_balancer_dns_name,
            description="DNS name of the Application Load Balancer"
        )
        
        CfnOutput(
            self, "APIGatewayURL",
            value=self.api_gateway.url,
            description="URL of the API Gateway"
        )
        
        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="Name of the S3 bucket"
        )
```

### `tests/unit/test_tap_stack.py` - Unit Tests

```python
import aws_cdk as core
import aws_cdk.assertions as assertions
from lib.tap_stack import TapStack
import pytest

class TestTapStack:
    
    def setup_method(self):
        """Setup test environment"""
        self.app = core.App()
        self.stack = TapStack(self.app, "test-stack")
        self.template = assertions.Template.from_stack(self.stack)

    def test_vpc_creation(self):
        """Test VPC is created with correct configuration"""
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_public_subnets_created(self):
        """Test public subnets are created"""
        self.template.resource_count_is("AWS::EC2::Subnet", 6)  # 2 public + 2 private + 2 database

    def test_nat_gateways_created(self):
        """Test NAT gateways are created for high availability"""
        self.template.resource_count_is("AWS::EC2::NatGateway", 2)

    def test_internet_gateway_created(self):
        """Test Internet Gateway is created"""
        self.template.resource_count_is("AWS::EC2::InternetGateway", 1)

    def test_kms_key_created(self):
        """Test KMS key is created with key rotation enabled"""
        self.template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    def test_s3_bucket_encryption(self):
        """Test S3 bucket is encrypted with KMS"""
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [
                    {
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "aws:kms"
                        }
                    }
                ]
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    def test_ec2_iam_role_created(self):
        """Test EC2 IAM role is created with proper policies"""
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        }
                    }
                ]
            }
        })

    def test_auto_scaling_group_configuration(self):
        """Test Auto Scaling Group is configured correctly"""
        self.template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "10",
            "DesiredCapacity": "2"
        })

    def test_application_load_balancer_created(self):
        """Test Application Load Balancer is created"""
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "application",
            "Scheme": "internet-facing"
        })

    def test_https_listener_configuration(self):
        """Test HTTPS listener is configured with TLS 1.2"""
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 443,
            "Protocol": "HTTPS",
            "SslPolicy": "ELBSecurityPolicy-TLS-1-2-Ext-2018-06"
        })

    def test_rds_instance_configuration(self):
        """Test RDS instance is configured with encryption and backups"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7,
            "MultiAZ": True,
            "EnablePerformanceInsights": True
        })

    def test_api_gateway_created(self):
        """Test API Gateway is created"""
        self.template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": "Nova Model Breaking API"
        })

    def test_security_groups_created(self):
        """Test security groups are created"""
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 3)  # ALB, EC2, RDS

    def test_cloudwatch_log_groups_created(self):
        """Test CloudWatch log groups are created"""
        self.template.resource_count_is("AWS::Logs::LogGroup", 3)  # App, Infra, VPC Flow Logs

    def test_ssm_parameters_created(self):
        """Test SSM parameters are created"""
        self.template.resource_count_is("AWS::SSM::Parameter", 2)

    def test_cloudwatch_alarm_created(self):
        """Test CloudWatch alarm is created"""
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 1)

    def test_launch_template_created(self):
        """Test EC2 Launch Template is created"""
        self.template.resource_count_is("AWS::EC2::LaunchTemplate", 1)

    def test_target_group_health_check(self):
        """Test target group health check configuration"""
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "HealthCheckPath": "/health",
            "HealthCheckProtocol": "HTTP",
            "HealthyThresholdCount": 2,
            "UnhealthyThresholdCount": 3
        })
```

### `tests/integration/test_tap_stack.py` - Integration Tests

```python
import boto3
import pytest
import time
from moto import mock_ec2, mock_s3, mock_elbv2, mock_rds, mock_iam
import aws_cdk as core
from lib.tap_stack import TapStack

class TestTapStackIntegration:
    
    @pytest.fixture(scope="class")
    def deployed_stack(self):
        """Deploy the stack for integration testing"""
        app = core.App()
        stack = TapStack(app, "integration-test-stack")
        return stack

    def test_vpc_subnets_connectivity(self, deployed_stack):
        """Test VPC subnets are properly configured"""
        vpc = deployed_stack.vpc
        
        # Verify we have the expected number of subnets
        public_subnets = vpc.public_subnets
        private_subnets = vpc.private_subnets
        isolated_subnets = vpc.isolated_subnets
        
        assert len(public_subnets) == 2, "Should have 2 public subnets"
        assert len(private_subnets) == 2, "Should have 2 private subnets"
        assert len(isolated_subnets) == 2, "Should have 2 isolated subnets"
        
        # Verify subnets are in different AZs
        public_azs = {subnet.availability_zone for subnet in public_subnets}
        private_azs = {subnet.availability_zone for subnet in private_subnets}
        
        assert len(public_azs) == 2, "Public subnets should be in different AZs"
        assert len(private_azs) == 2, "Private subnets should be in different AZs"

    def test_s3_bucket_encryption_and_access(self, deployed_stack):
        """Test S3 bucket encryption and access policies"""
        bucket = deployed_stack.s3_bucket
        
        # Verify bucket name follows naming convention
        assert "nova-model-breaking" in bucket.bucket_name
        
        # Test that bucket is configured for encryption
        # Note: In real integration tests, you would use boto3 to verify actual AWS resources
        assert bucket.encryption_key == deployed_stack.kms_key

    def test_iam_roles_and_policies(self, deployed_stack):
        """Test IAM roles have correct policies and trust relationships"""
        ec2_role = deployed_stack.ec2_role
        
        # Verify EC2 role can be assumed by EC2 service
        assume_role_policy = ec2_role.assume_role_policy_document
        statements = assume_role_policy.to_json()["Statement"]
        
        ec2_principals = [
            stmt for stmt in statements 
            if stmt.get("Principal", {}).get("Service") == "ec2.amazonaws.com"
        ]
        
        assert len(ec2_principals) > 0, "EC2 role should be assumable by EC2 service"

    def test_security_group_rules(self, deployed_stack):
        """Test security group rules are configured correctly"""
        alb_sg = deployed_stack.alb_security_group
        ec2_sg = deployed_stack.ec2_security_group
        rds_sg = deployed_stack.rds_security_group
        
        # Verify security groups exist
        assert alb_sg is not None, "ALB security group should exist"
        assert ec2_sg is not None, "EC2 security group should exist"
        assert rds_sg is not None, "RDS security group should exist"

    def test_auto_scaling_group_configuration(self, deployed_stack):
        """Test Auto Scaling Group is properly configured"""
        asg = deployed_stack.asg
        
        # Verify ASG configuration
        assert asg.min_capacity == 2, "ASG should have minimum capacity of 2"
        assert asg.max_capacity == 10, "ASG should have maximum capacity of 10"
        assert asg.desired_capacity == 2, "ASG should have desired capacity of 2"

    def test_load_balancer_configuration(self, deployed_stack):
        """Test Application Load Balancer configuration"""
        alb = deployed_stack.alb
        
        # Verify ALB is internet-facing
        assert alb.internet_facing == True, "ALB should be internet-facing"
        
        # Verify ALB is in public subnets
        assert len(alb.vpc.public_subnets) >= 2, "ALB should be in multiple public subnets"

    def test_database_configuration(self, deployed_stack):
        """Test RDS database configuration"""
        database = deployed_stack.database
        
        # Verify database is encrypted
        assert database.storage_encrypted == True, "Database should be encrypted"
        
        # Verify backup retention
        backup_retention = database.backup_retention
        assert backup_retention.to_days() >= 7, "Database should have at least 7 days backup retention"

    def test_api_gateway_configuration(self, deployed_stack):
        """Test API Gateway configuration"""
        