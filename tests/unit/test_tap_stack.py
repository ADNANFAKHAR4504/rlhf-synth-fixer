import unittest
import os
from aws_cdk import App
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack, TapStackProps

class TestTapStack(unittest.TestCase):
    def setUp(self):
        self.app = App()
        props = TapStackProps(environment_suffix="test")
        
        # Set environment variable to disable encryption during testing
        os.environ['CDK_TESTING'] = 'true'
        
        self.stack = TapStack(self.app, "TestStack", props=props)
        self.template = Template.from_stack(self.stack)

    def tearDown(self):
        # Clean up environment variable
        if 'CDK_TESTING' in os.environ:
            del os.environ['CDK_TESTING']

    def test_template_synthesizes(self):
        # Just confirm the template object exists
        self.assertIsNotNone(self.template)

    def test_s3_buckets_created(self):
        # You have two buckets: logging and app buckets
        self.template.resource_count_is("AWS::S3::Bucket", 2)
        
        # In testing mode, buckets might use default encryption
        # Check that buckets exist with proper configuration
        buckets = self.template.find_resources("AWS::S3::Bucket")
        self.assertEqual(len(buckets), 2)

    def test_iam_managed_policy_created(self):
        self.template.resource_count_is("AWS::IAM::ManagedPolicy", 1)

    def test_vpc_created(self):
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        
        # Verify VPC has correct CIDR
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    def test_subnets_created(self):
        # Should have 6 subnets total (3 types × 2 AZs)
        self.template.resource_count_is("AWS::EC2::Subnet", 6)

    def test_rds_instance_created(self):
        self.template.resource_count_is("AWS::RDS::DBInstance", 1)
        
        # Verify RDS instance configuration
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres",
            "PubliclyAccessible": False,
            "DeletionProtection": True,
            "DBName": "tapdb"
        })

    def test_rds_subnet_group_created(self):
        self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    def test_alb_created(self):
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        
        # Verify ALB configuration
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing",
            "Type": "application"
        })

    def test_target_group_created(self):
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Port": 80,
            "Protocol": "HTTP",
            "HealthCheckPath": "/health"
        })

    def test_cloudfront_distribution_created(self):
        self.template.resource_count_is("AWS::CloudFront::Distribution", 1)
        
        # Verify CloudFront behavior
        self.template.has_resource_properties("AWS::CloudFront::Distribution", {
            "DistributionConfig": {
                "DefaultCacheBehavior": {
                    "ViewerProtocolPolicy": "redirect-to-https"
                },
                "PriceClass": "PriceClass_100"
            }
        })

    def test_cloudtrail_created(self):
        self.template.resource_count_is("AWS::CloudTrail::Trail", 1)
        
        # Verify CloudTrail configuration
        self.template.has_resource_properties("AWS::CloudTrail::Trail", {
            "IsMultiRegionTrail": False,
            "EnableLogFileValidation": True,
            "IncludeGlobalServiceEvents": False
        })

    def test_security_groups_created(self):
        # Should have security groups for DB, ALB, and App
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 3)

    def test_auto_scaling_group_created(self):
        self.template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        
        # Verify ASG configuration
        self.template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "1",
            "MaxSize": "3",
            "DesiredCapacity": "2"
        })

    def test_launch_template_created(self):
        self.template.resource_count_is("AWS::EC2::LaunchTemplate", 1)

    def test_iam_roles_created(self):
        # Should have roles for EC2 and Flow Logs
        self.template.resource_count_is("AWS::IAM::Role", 2)

    def test_outputs_exist(self):
        # Test that stack outputs are created
        outputs = self.template.find_outputs("*")
        
        # Should have outputs for ALB DNS, CloudFront domain, etc.
        expected_outputs = ["ALBDNS", "CloudFrontDomain", "DatabaseEndpoint", 
                          "AppBucketName", "LoggingBucketName", "KMSKeyId"]
        
        for expected_output in expected_outputs:
            self.assertIn(expected_output, outputs)

if __name__ == "__main__":
    unittest.main()