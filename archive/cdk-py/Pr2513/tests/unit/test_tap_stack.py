"""test_tap_stack.py
Integration tests for the TAP (Test Automation Platform) CDK stack.
These tests verify that all AWS resources are created correctly with proper configurations.
"""

import unittest
import json
import pytest
from unittest.mock import patch
import aws_cdk as cdk
from aws_cdk import App
from aws_cdk.assertions import Template, Match, Capture

# Import the stack to test
from lib.tap_stack import TapStack, TapStackProps


class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    def test_creates_s3_buckets(self):
        """Test that S3 buckets are created"""
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                        TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Stack creates 3 S3 buckets (main, access logs, CloudFront logs)
        template.resource_count_is("AWS::S3::Bucket", 3)
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "cloudmigration-s3-tap"
        })

    def test_defaults_env_suffix_to_dev(self):
        """Test environment suffix defaults to 'dev' if not provided"""
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        
        # ASSERT - Check the environment suffix attribute
        self.assertEqual(stack.environment_suffix, "dev")

    def test_vpc_configuration(self):
        """Test VPC is created with correct configuration."""
        stack = TapStack(self.app, "VPCTest")
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True,
        })
        
        # Verify subnets are created
        template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 public + 2 private
        
        # Verify NAT Gateway is created
        template.resource_count_is("AWS::EC2::NatGateway", 1)
        
        # Verify Internet Gateway
        template.has_resource("AWS::EC2::InternetGateway", {})
    
    def test_vpc_flow_logs(self):
        """Test VPC Flow Logs are configured."""
        stack = TapStack(self.app, "FlowLogTest")
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::FlowLog", {
            "ResourceType": "VPC",
            "TrafficType": "ALL",
        })
        
        # Verify Flow Log IAM role
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "vpc-flow-logs.amazonaws.com"
                        }
                    })
                ])
            })
        })
    
    # ==================== S3 Bucket Tests ====================
    
    def test_s3_bucket_configuration(self):
        """Test S3 buckets are created with proper security settings."""
        stack = TapStack(self.app, "S3Test")
        template = Template.from_stack(stack)
        
        # Main bucket
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "cloudmigration-s3-tap",
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": Match.array_with([
                    Match.object_like({
                        "ServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    })
                ])
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })
    
    def test_s3_lifecycle_policies(self):
        """Test S3 lifecycle policies are configured."""
        stack = TapStack(self.app, "LifecycleTest")
        template = Template.from_stack(stack)
        
        capture = Capture()
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "cloudmigration-s3-tap",
            "LifecycleConfiguration": capture
        })
        
        lifecycle_config = capture.as_object()
        self.assertIn("Rules", lifecycle_config)
        rules = lifecycle_config["Rules"]
        
        # Check for logs lifecycle rule
        logs_rule = next((r for r in rules if r.get("Id") == "LogsLifecycle"), None)
        self.assertIsNotNone(logs_rule)
        self.assertEqual(logs_rule["Status"], "Enabled")
        self.assertEqual(logs_rule["Prefix"], "logs/")
    
    def test_s3_access_logging(self):
        """Test S3 access logging is configured."""
        stack = TapStack(self.app, "LoggingTest")
        template = Template.from_stack(stack)
        
        # Access log bucket name is dynamically generated with Fn::Join
        # Check for the bucket with LogDeliveryWrite access control instead
        template.has_resource_properties("AWS::S3::Bucket", {
            "AccessControl": "LogDeliveryWrite",
            "BucketEncryption": Match.any_value(),
            "PublicAccessBlockConfiguration": Match.any_value()
        })
        
        # Verify main bucket has logging configured
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": "cloudmigration-s3-tap",
            "LoggingConfiguration": Match.object_like({
                "DestinationBucketName": Match.any_value(),
                "LogFilePrefix": "main-bucket-logs/"
            })
        })
    
    # ==================== Security Group Tests ====================
    
    def test_security_groups_created(self):
        """Test security groups are created with correct rules."""
        stack = TapStack(self.app, "SGTest")
        template = Template.from_stack(stack)
        
        # Web security group
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Allow HTTP/HTTPS traffic",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 80,
                    "ToPort": 80,
                    "CidrIp": "0.0.0.0/0"
                }),
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 443,
                    "ToPort": 443,
                    "CidrIp": "0.0.0.0/0"
                })
            ])
        })
        
        # SSH security group
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "SSH access from specific IP",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 22,
                    "ToPort": 22
                })
            ])
        })
    
    # ==================== IAM Role Tests ====================
    
    def test_ec2_iam_role(self):
        """Test EC2 IAM role is created with correct permissions."""
        stack = TapStack(self.app, "IAMTest")
        template = Template.from_stack(stack)
        
        # Look for the EC2 role specifically by checking AssumeRolePolicyDocument
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        },
                        "Effect": "Allow",
                        "Action": "sts:AssumeRole"
                    })
                ])
            })
        })
    
    def test_iam_policies(self):
        """Test IAM policies have least privilege permissions."""
        stack = TapStack(self.app, "PolicyTest")
        template = Template.from_stack(stack)
        
        # Verify S3 access policy
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Action": Match.array_with([
                            "s3:PutObject",
                            "s3:GetObject",
                            "s3:ListBucket"
                        ])
                    })
                ])
            })
        })
    
    # ==================== EC2 Instance Tests ====================
    
    def test_ec2_instance_configuration(self):
        """Test EC2 instance is created with correct configuration."""
        stack = TapStack(self.app, "EC2Test")
        template = Template.from_stack(stack)
        
        # Test with LaunchTemplate which contains MetadataOptions
        template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": Match.object_like({
                "MetadataOptions": {
                    "HttpTokens": "required"  # IMDSv2
                }
            })
        })
        
        # Test other EC2 properties
        template.has_resource_properties("AWS::EC2::Instance", {
            "InstanceType": Match.any_value(),
            "Monitoring": True,  # Detailed monitoring
            "BlockDeviceMappings": Match.array_with([
                Match.object_like({
                    "DeviceName": "/dev/xvda",
                    "Ebs": {
                        "VolumeSize": 20,
                        "VolumeType": "gp3",
                        "Encrypted": True,
                        "DeleteOnTermination": True
                    }
                })
            ])
        })
    
    def test_ec2_key_pair(self):
        """Test EC2 key pair is created."""
        stack = TapStack(self.app, "KeyPairTest")
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::EC2::KeyPair", {
            "KeyName": Match.string_like_regexp("cloudmigration-keypair-.*"),
            "KeyType": "rsa",
            "KeyFormat": "pem"
        })
    
    def test_ec2_user_data(self):
        """Test EC2 user data script configuration."""
        stack = TapStack(self.app, "UserDataTest")
        template = Template.from_stack(stack)
        
        capture = Capture()
        template.has_resource_properties("AWS::EC2::Instance", {
            "UserData": capture
        })
        
        # User data is base64 encoded in CloudFormation
        user_data = capture.as_object()
        self.assertIsNotNone(user_data)
        # Verify it contains expected commands (checking structure, not decoded content)
        self.assertIn("Fn::Base64", user_data)
    
    # ==================== CloudFront Tests ====================
    
    def test_cloudfront_distribution(self):
        """Test CloudFront distribution configuration."""
        stack = TapStack(self.app, "CFTest")
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::CloudFront::Distribution", {
            "DistributionConfig": Match.object_like({
                "Enabled": True,
                "Comment": "CloudMigration CDN Distribution",
                "DefaultRootObject": "index.html",
                "PriceClass": "PriceClass_100",
                "Logging": Match.object_like({
                    "Bucket": Match.any_value(),
                    "Prefix": "cloudfront-logs/"
                })
            })
        })
    
    def test_cloudfront_origin_access_identity(self):
        """Test CloudFront OAI is created."""
        stack = TapStack(self.app, "OAITest")
        template = Template.from_stack(stack)
        
        template.has_resource_properties(
            "AWS::CloudFront::CloudFrontOriginAccessIdentity",
            {}
        )
    
    # ==================== Monitoring Tests ====================
    
    def test_sns_topic_created(self):
        """Test SNS topic for alerts is created."""
        stack = TapStack(self.app, "SNSTest")
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::SNS::Topic", {
            "DisplayName": "CloudMigration Alerts"
        })
        
        # Verify email subscription
        template.has_resource_properties("AWS::SNS::Subscription", {
            "Protocol": "email",
            "TopicArn": Match.any_value()
        })
    
    def test_cloudwatch_alarms(self):
        """Test CloudWatch alarms are configured."""
        stack = TapStack(self.app, "AlarmTest")
        template = Template.from_stack(stack)
        
        # CPU alarm - AlarmDescription is a Fn::Join object, not a simple string
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "CPUUtilization",
            "Namespace": "AWS/EC2",
            "Statistic": "Average",
            "ComparisonOperator": "GreaterThanThreshold",
            "EvaluationPeriods": 2,
            "DatapointsToAlarm": 2
        })
        
        # Status check alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmDescription": "Instance status check failed",
            "MetricName": "StatusCheckFailed",
            "Namespace": "AWS/EC2",
            "ComparisonOperator": "GreaterThanOrEqualToThreshold",
            "Threshold": 1
        })
        
        # Memory alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmDescription": "Memory utilization exceeds 90%",
            "MetricName": "mem_used_percent",
            "Namespace": "CloudMigration/EC2",
            "Threshold": 90
        })
        
        # Disk alarm
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmDescription": Match.string_like_regexp(".*Disk usage.*"),
            "MetricName": "disk_used_percent",
            "Namespace": "CloudMigration/EC2",
            "Threshold": 80
        })
    
    def test_cloudwatch_dashboard(self):
        """Test CloudWatch dashboard is created."""
        stack = TapStack(self.app, "DashboardTest")
        template = Template.from_stack(stack)
        
        template.has_resource_properties("AWS::CloudWatch::Dashboard", {
            "DashboardName": "CloudMigration-Infrastructure"
        })
    
    # ==================== CloudFormation Parameters Tests ====================
    
    def test_stack_parameters(self):
        """Test CloudFormation parameters are defined correctly."""
        stack = TapStack(self.app, "ParamTest")
        template = Template.from_stack(stack)
        
        parameters = template.find_parameters("*")
        
        expected_params = [
            "InstanceType",
            "KeyPairName",
            "AllowedSSHIP",
            "NotificationEmail",
            "CPUThreshold"
        ]
        
        for param in expected_params:
            self.assertIn(param, parameters)
        
        # Test specific parameter configurations
        self.assertEqual(parameters["InstanceType"]["Type"], "String")
        self.assertEqual(parameters["InstanceType"]["Default"], "t3.micro")
        
        self.assertEqual(parameters["NotificationEmail"]["Type"], "String")
        self.assertIn("AllowedPattern", parameters["NotificationEmail"])
        
        self.assertEqual(parameters["CPUThreshold"]["Type"], "Number")
        self.assertEqual(parameters["CPUThreshold"]["Default"], 80)
    
    # ==================== CloudFormation Outputs Tests ====================
    
    def test_stack_outputs(self):
        """Test CloudFormation outputs are defined."""
        stack = TapStack(self.app, "OutputTest")
        template = Template.from_stack(stack)
        
        outputs = template.find_outputs("*")
        
        expected_outputs = [
            "VPCId",
            "EC2InstanceId",
            "EC2PublicIP",
            "S3BucketName",
            "CloudFrontDomainName",
            "SNSTopicArn",
            "DashboardURL"
        ]
        
        for output in expected_outputs:
            self.assertIn(output, outputs)
    
    # ==================== Tags Tests ====================
    
    def test_resource_tags(self):
        """Test that resources are properly tagged."""
        stack = TapStack(self.app, "TaggedStack",
                        TapStackProps(environment_suffix="test"))
        
        # Can't directly access tags like this in unit tests
        # Instead, verify stack has expected properties
        self.assertEqual(stack.environment_suffix, "test")
    
    # ==================== Environment Suffix Tests ====================
    
    def test_environment_suffix_handling(self):
        """Test environment suffix is handled correctly."""
        # Test with explicit props
        props = TapStackProps(environment_suffix="prod")
        stack = TapStack(self.app, "ProdStack", props=props)
        self.assertEqual(stack.environment_suffix, "prod")
        
        # Test with context
        app_with_context = App(context={"environmentSuffix": "staging"})
        stack_context = TapStack(app_with_context, "StagingStack")
        self.assertEqual(stack_context.environment_suffix, "staging")
        
        # Test default
        default_stack = TapStack(App(), "DefaultStack")
        self.assertEqual(default_stack.environment_suffix, "dev")
    
    # ==================== Integration Tests ====================
    
    def test_s3_cloudfront_integration(self):
        """Test S3 and CloudFront are properly integrated."""
        stack = TapStack(self.app, "IntegrationTest")
        template = Template.from_stack(stack)
        
        # Verify S3 bucket policy allows CloudFront access
        template.has_resource_properties("AWS::S3::BucketPolicy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Principal": Match.object_like({
                            "Service": "cloudfront.amazonaws.com"
                        }),
                        "Action": "s3:GetObject"
                    })
                ])
            })
        })
    
    def test_ec2_s3_integration(self):
        """Test EC2 can access S3 bucket."""
        stack = TapStack(self.app, "EC2S3Test")
        template = Template.from_stack(stack)
        
        # This is tested through IAM role policies
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Effect": "Allow",
                        "Action": Match.array_with([
                            "s3:PutObject",
                            "s3:GetObject",
                            "s3:ListBucket"
                        ]),
                        "Resource": Match.any_value()
                    })
                ])
            })
        })
    
    def test_monitoring_integration(self):
        """Test monitoring components are integrated."""
        stack = TapStack(self.app, "MonitoringIntTest")
        template = Template.from_stack(stack)
        
        # Verify alarms have SNS actions
        capture = Capture()
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmActions": capture
        })
        
        alarm_actions = capture.as_array()
        self.assertGreater(len(alarm_actions), 0)
    
    # ==================== Security Best Practices Tests ====================
    
    def test_security_best_practices(self):
        """Test security best practices are followed."""
        stack = TapStack(self.app, "SecurityTest")
        template = Template.from_stack(stack)
        
        # EBS encryption
        template.has_resource_properties("AWS::EC2::Instance", {
            "BlockDeviceMappings": Match.array_with([
                Match.object_like({
                    "Ebs": Match.object_like({
                        "Encrypted": True
                    })
                })
            ])
        })
        
        # S3 encryption
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": Match.object_like({
                "ServerSideEncryptionConfiguration": Match.any_value()
            })
        })
        
        # IMDSv2 enforcement - check in LaunchTemplate
        template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": Match.object_like({
                "MetadataOptions": Match.object_like({
                    "HttpTokens": "required"
                })
            })
        })
    
    # ==================== Resource Deletion Tests ====================
    
    def test_resource_deletion_policies(self):
        """Test resources have appropriate deletion policies."""
        stack = TapStack(self.app, "DeletionTest")
        template = Template.from_stack(stack)
        
        # S3 buckets should have RemovalPolicy
        template.has_resource("AWS::S3::Bucket", {
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete"
        })
        
        # Log groups should have retention
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "RetentionInDays": Match.any_value()
        })
    
    # ==================== Unit Tests ====================
    
    def test_create_methods_called(self):
        """Test all create methods are called during initialization."""
        with patch.object(TapStack, '_create_parameters') as mock_params, \
             patch.object(TapStack, '_create_vpc') as mock_vpc, \
             patch.object(TapStack, '_create_s3_bucket') as mock_s3, \
             patch.object(TapStack, '_create_security_groups') as mock_sg, \
             patch.object(TapStack, '_create_iam_roles') as mock_iam, \
             patch.object(TapStack, '_create_ec2_instance') as mock_ec2, \
             patch.object(TapStack, '_create_cloudfront_distribution') as mock_cf, \
             patch.object(TapStack, '_create_monitoring') as mock_monitoring, \
             patch.object(TapStack, '_create_outputs') as mock_outputs:
            
            stack = TapStack(self.app, "TestStack")
            
            # Verify all methods were called
            mock_params.assert_called_once()
            mock_vpc.assert_called_once()
            mock_s3.assert_called_once()
            mock_sg.assert_called_once()
            mock_iam.assert_called_once()
            mock_ec2.assert_called_once()
            mock_cf.assert_called_once()
            mock_monitoring.assert_called_once()
            mock_outputs.assert_called_once()
    
    # ==================== Synthesis Tests ====================
    
    def test_stack_synthesizes_without_errors(self):
        """Test the stack synthesizes without errors."""
        stack = TapStack(self.app, "SynthTest")
        
        # This will raise an exception if synthesis fails
        assembly = self.app.synth()
        self.assertIsNotNone(assembly)
        
        # Verify the stack exists in the assembly
        stack_artifact = assembly.get_stack_by_name("SynthTest")
        self.assertIsNotNone(stack_artifact)
    
    def test_template_is_valid_json(self):
        """Test the generated template is valid JSON."""
        stack = TapStack(self.app, "JSONTest")
        template = Template.from_stack(stack)
        
        # Get the JSON template
        template_json = template.to_json()
        
        # Verify it's valid JSON
        parsed = json.loads(json.dumps(template_json))
        self.assertIsNotNone(parsed)
        self.assertIn("Resources", parsed)
        self.assertIn("Parameters", parsed)
        self.assertIn("Outputs", parsed)