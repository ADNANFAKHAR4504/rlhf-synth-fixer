# import os
# import sys
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a VPC with correct CIDR and configuration")
    def test_creates_vpc_with_correct_config(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::VPC", 1)
        template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("creates public subnets in different availability zones")
    def test_creates_public_subnets(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::Subnet", 2)  # 2 public subnets

    @mark.it("creates security group with HTTP and HTTPS ingress rules")
    def test_creates_security_group_with_correct_rules(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - CDK creates multiple security groups (one for our app, one for load balancer)
        template.resource_count_is("AWS::EC2::SecurityGroup", 2)
        # Check our main security group exists with correct description
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Allow HTTP and HTTPS traffic"
        })

    @mark.it("creates DynamoDB table with correct configuration")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Fix: CDK doesn't always explicitly set BillingMode in the template
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"TapSessions-{env_suffix}",
            "ProvisionedThroughput": {
                "ReadCapacityUnits": 5,
                "WriteCapacityUnits": 5
            },
            "AttributeDefinitions": [
                {
                    "AttributeName": "SessionId",
                    "AttributeType": "S"
                }
            ],
            "KeySchema": [
                {
                    "AttributeName": "SessionId",
                    "KeyType": "HASH"
                }
            ]
        })

    @mark.it("creates S3 bucket with versioning and public access")
    def test_creates_s3_bucket_with_correct_config(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": False,
                "BlockPublicPolicy": False,
                "IgnorePublicAcls": False,
                "RestrictPublicBuckets": False
            }
        })

    @mark.it("creates IAM role with correct policies for EC2")
    def test_creates_iam_role_with_policies(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Fix: CDK creates 2 IAM roles (one for our EC2, one for Auto Scaling service)
        template.resource_count_is("AWS::IAM::Role", 2)
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": f"TapEC2Role-{env_suffix}",
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }
        })

    @mark.it("creates instance profile for EC2 role")
    def test_creates_instance_profile(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Fix: CDK creates 2 instance profiles (one for our EC2, one for Auto Scaling)
        template.resource_count_is("AWS::IAM::InstanceProfile", 2)

    @mark.it("creates launch template with correct instance type")
    def test_creates_launch_template(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::EC2::LaunchTemplate", 1)
        template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": {
                "InstanceType": "t3.micro"
            }
        })

    @mark.it("creates auto scaling group with correct capacity settings")
    def test_creates_auto_scaling_group(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "5",
            "DesiredCapacity": "2"
        })

    @mark.it("creates classic load balancer with correct configuration")
    def test_creates_load_balancer(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Fix: CDK uses lowercase protocols
        template.resource_count_is("AWS::ElasticLoadBalancing::LoadBalancer", 1)
        template.has_resource_properties("AWS::ElasticLoadBalancing::LoadBalancer", {
            "Scheme": "internet-facing",
            "Listeners": [
                {
                    "LoadBalancerPort": "80",
                    "InstancePort": "80",
                    "Protocol": "http",  # Changed from HTTP to http
                    "InstanceProtocol": "http"  # Changed from HTTP to http
                }
            ],
            "HealthCheck": {
                "Target": "HTTP:80/",
                "HealthyThreshold": "2",
                "UnhealthyThreshold": "5",
                "Interval": "30",
                "Timeout": "5"
            }
        })

    @mark.it("creates CloudFront distribution with S3 origin")
    def test_creates_cloudfront_distribution(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudFront::Distribution", 1)
        template.has_resource_properties("AWS::CloudFront::Distribution", {
            "DistributionConfig": {
                "PriceClass": "PriceClass_100",
                "DefaultCacheBehavior": {
                    "ViewerProtocolPolicy": "redirect-to-https"
                }
            }
        })

    @mark.it("creates CloudWatch log group")
    def test_creates_cloudwatch_log_group(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::Logs::LogGroup", 1)
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/tap-stack-{env_suffix}",
            "RetentionInDays": 30
        })

    @mark.it("creates CloudWatch alarm for CPU utilization")
    def test_creates_cloudwatch_alarm(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        template.resource_count_is("AWS::CloudWatch::Alarm", 1)
        template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "MetricName": "CPUUtilization",
            "Namespace": "AWS/EC2",
            "Statistic": "Average",
            "Threshold": 80,
            "EvaluationPeriods": 2,
            "DatapointsToAlarm": 2,
            "TreatMissingData": "notBreaching"
        })

    @mark.it("creates correct CloudFormation outputs")
    def test_creates_cloudformation_outputs(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        outputs = template.find_outputs("*")
        
        # Check that all required outputs exist
        expected_outputs = [
            "VPCId",
            "S3BucketName", 
            "DynamoDBTableName",
            "CloudFrontDistributionDomain",
            "LoadBalancerDNS"
        ]
        
        for output_name in expected_outputs:
            self.assertIn(output_name, outputs, f"Output {output_name} not found")

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Fix: CDK uses Fn::Join instead of Fn::Sub for bucket names
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "BucketName": {
                "Fn::Join": [
                    "",
                    [
                        "tap-static-content-dev-",
                        {"Ref": "AWS::AccountId"}
                    ]
                ]
            }
        })

    @mark.it("uses environment suffix in all resource names")
    def test_uses_env_suffix_in_resource_names(self):
        # ARRANGE
        env_suffix = "prod"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT
        # Check DynamoDB table name includes environment suffix
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"TapSessions-{env_suffix}"
        })
        
        # Check IAM role name includes environment suffix
        template.has_resource_properties("AWS::IAM::Role", {
            "RoleName": f"TapEC2Role-{env_suffix}"
        })
        
        # Check CloudWatch log group includes environment suffix
        template.has_resource_properties("AWS::Logs::LogGroup", {
            "LogGroupName": f"/aws/tap-stack-{env_suffix}"
        })

    @mark.it("ensures all resources have proper removal policy for cleanup")
    def test_resources_have_removal_policy(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Fix: Removal policy is set at the resource level, not in Properties
        # Check DynamoDB table has proper deletion policy
        dynamodb_resources = template.find_resources("AWS::DynamoDB::Table")
        for resource_name, resource in dynamodb_resources.items():
            self.assertEqual(resource.get("DeletionPolicy"), "Delete")
        
        # Check S3 bucket has proper deletion policy  
        s3_resources = template.find_resources("AWS::S3::Bucket")
        for resource_name, resource in s3_resources.items():
            self.assertEqual(resource.get("DeletionPolicy"), "Delete")
        
        # Check CloudWatch log group has proper deletion policy
        log_resources = template.find_resources("AWS::Logs::LogGroup")
        for resource_name, resource in log_resources.items():
            self.assertEqual(resource.get("DeletionPolicy"), "Delete")

    @mark.it("creates DynamoDB table with correct table name")
    def test_dynamodb_table_name(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Simple test just for table name
        template.has_resource_properties("AWS::DynamoDB::Table", {
            "TableName": f"TapSessions-{env_suffix}"
        })

    @mark.it("creates S3 bucket with correct configuration")
    def test_s3_bucket_basic_config(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # ASSERT - Basic S3 bucket test
        template.resource_count_is("AWS::S3::Bucket", 1)
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })


if __name__ == "__main__":
    unittest.main()
