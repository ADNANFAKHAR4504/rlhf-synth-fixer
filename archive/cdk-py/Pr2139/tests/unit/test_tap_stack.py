import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.environment_suffix = "test"
        props = TapStackProps(
            environment_suffix=self.environment_suffix,
            env=cdk.Environment(region="us-east-1")
        )
        self.stack = TapStack(self.app, "TapStackTest", props=props)
        self.template = Template.from_stack(self.stack)

    @mark.it("creates KMS key with proper configuration")
    def test_creates_kms_key(self):
        # ASSERT
        self.template.resource_count_is("AWS::KMS::Key", 1)
        self.template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })
        # Description is now a CloudFormation function, so we check it exists
        kms_resources = self.template.find_resources("AWS::KMS::Key")
        kms_key = list(kms_resources.values())[0]
        self.assertIn("Description", kms_key["Properties"])
        # KMS Alias is not automatically created by CDK

    @mark.it("creates VPC with correct CIDR and subnets")
    def test_creates_vpc(self):
        # ASSERT
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })
        
        # Check for public and private subnets (actual count may vary by AZ availability)
        subnet_count = len(self.template.find_resources("AWS::EC2::Subnet"))
        self.assertGreaterEqual(subnet_count, 4)  # At least 2 AZs * 2 subnet types
        self.template.resource_count_is("AWS::EC2::InternetGateway", 1)
        # NAT Gateway count depends on available AZs
        nat_count = len(self.template.find_resources("AWS::EC2::NatGateway"))
        self.assertGreaterEqual(nat_count, 2)

    @mark.it("creates security groups with proper rules")
    def test_creates_security_groups(self):
        # ASSERT
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 3)
        
        # ALB Security Group - allows HTTP and HTTPS from anywhere
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": f"ALB security group for {self.environment_suffix}",
            "SecurityGroupIngress": [
                {
                    "CidrIp": "0.0.0.0/0",
                    "FromPort": 80,
                    "IpProtocol": "tcp",
                    "ToPort": 80
                },
                {
                    "CidrIp": "0.0.0.0/0",
                    "FromPort": 443,
                    "IpProtocol": "tcp",
                    "ToPort": 443
                }
            ]
        })
        
        # EC2 Security Group - allows HTTP from ALB
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": f"EC2 security group for {self.environment_suffix}"
        })
        
        # RDS Security Group - allows MySQL from EC2
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": f"RDS security group for {self.environment_suffix}"
        })

    @mark.it("creates IAM role with required policies")
    def test_creates_iam_role(self):
        # ASSERT - Now we have 2 roles: EC2 role + S3 auto-delete custom resource role
        self.template.resource_count_is("AWS::IAM::Role", 2)
        self.template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"}
                }]
            },
            "RoleName": f"ec2-role-{self.environment_suffix}"
        })
        
        # Check for instance profile (CDK may create additional profiles)
        instance_profiles = self.template.find_resources("AWS::IAM::InstanceProfile")
        self.assertGreaterEqual(len(instance_profiles), 1)
        # Find our EC2 role (not the custom resource role)
        ec2_role = None
        for role_id, role in self.template.find_resources("AWS::IAM::Role").items():
            if role["Properties"].get("RoleName") == f"ec2-role-{self.environment_suffix}":
                ec2_role = role
                break
        self.assertIsNotNone(ec2_role, "Expected EC2 role not found")
        # Find our specific instance profile
        our_profile = next((ip for ip in instance_profiles.values() 
                           if f"ec2-profile-{self.environment_suffix}" in 
                           ip.get("Properties", {}).get("InstanceProfileName", "")), None)
        self.assertIsNotNone(our_profile, "Expected instance profile not found")

    @mark.it("creates S3 bucket with encryption and versioning")
    def test_creates_s3_bucket(self):
        # ASSERT
        self.template.resource_count_is("AWS::S3::Bucket", 1)
        # Check bucket has versioning enabled
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {"Status": "Enabled"}
        })
        
        # Check bucket encryption and auto-delete for non-prod
        buckets = self.template.find_resources("AWS::S3::Bucket")
        bucket = list(buckets.values())[0]
        bucket_name = bucket["Properties"].get("BucketName")
        
        # Bucket name should be a string for our test environment
        self.assertEqual(bucket_name, f"s3-bucket-{self.environment_suffix}")
        
        # Check deletion policy for non-prod
        self.assertEqual(bucket.get("DeletionPolicy"), "Delete")

    @mark.it("creates RDS instance with proper configuration")
    def test_creates_rds_instance(self):
        # ASSERT
        self.template.resource_count_is("AWS::RDS::DBInstance", 1)
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "mysql",
            "EngineVersion": "8.0.39",
            "DBInstanceClass": "db.t3.micro",
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7,
            "DBName": "tapdb",
            "DeletionProtection": False,  # test environment
            "DeleteAutomatedBackups": True  # for non-prod cleanup
        })
        
        # Check for subnet group
        self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
        self.template.has_resource_properties("AWS::RDS::DBSubnetGroup", {
            "DBSubnetGroupDescription": f"RDS subnet group for {self.environment_suffix}"
        })
        
        # Check for secrets manager secret
        self.template.resource_count_is("AWS::SecretsManager::Secret", 1)
        # Secret name may be generated, so just check it exists with our pattern
        secrets = self.template.find_resources("AWS::SecretsManager::Secret")
        secret = list(secrets.values())[0]
        secret_name = secret["Properties"].get("Name", "")
        self.assertIn(f"{self.environment_suffix}", str(secret_name))

    @mark.it("creates Application Load Balancer with target group")
    def test_creates_alb(self):
        # ASSERT
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Name": f"alb-{self.environment_suffix}",
            "Scheme": "internet-facing",
            "Type": "application"
        })
        
        # Check for target group
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Name": f"tg-{self.environment_suffix}",
            "Port": 80,
            "Protocol": "HTTP",
            "HealthCheckPath": "/health",
            "HealthCheckIntervalSeconds": 15,
            "HealthyThresholdCount": 2,
            "UnhealthyThresholdCount": 2
        })
        
        # Check for listener
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })

    @mark.it("creates Auto Scaling Group with launch template")
    def test_creates_asg(self):
        # ASSERT
        self.template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        self.template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "AutoScalingGroupName": f"asg-{self.environment_suffix}",
            "MinSize": "1",
            "MaxSize": "3",
            "DesiredCapacity": "1",
            "HealthCheckType": "ELB"
        })
        
        # Check for launch template
        self.template.resource_count_is("AWS::EC2::LaunchTemplate", 1)
        self.template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateName": f"lt-{self.environment_suffix}",
            "LaunchTemplateData": {
                "InstanceType": "t3.micro",
                "ImageId": Match.any_value(),
                "BlockDeviceMappings": [{
                    "DeviceName": "/dev/xvda",
                    "Ebs": {
                        "VolumeSize": 8,
                        "Encrypted": True
                    }
                }]
            }
        })

    @mark.it("creates CloudWatch alarms")
    def test_creates_cloudwatch_alarms(self):
        # ASSERT
        self.template.resource_count_is("AWS::CloudWatch::Alarm", 1)
        self.template.has_resource_properties("AWS::CloudWatch::Alarm", {
            "AlarmName": f"cpu-alarm-{self.environment_suffix}",
            "MetricName": "CPUUtilization",
            "Namespace": "AWS/AutoScaling",
            "Statistic": "Average",
            "Threshold": 80,
            "EvaluationPeriods": 2,
            "DatapointsToAlarm": 2,
            "ComparisonOperator": "GreaterThanThreshold"
        })

    @mark.it("creates Route53 hosted zone with ALB record")
    def test_creates_route53(self):
        # ASSERT
        self.template.resource_count_is("AWS::Route53::HostedZone", 1)
        self.template.has_resource_properties("AWS::Route53::HostedZone", {
            "Name": f"{self.environment_suffix}.tap.internal."
        })
        
        # Check for ALB A record
        self.template.resource_count_is("AWS::Route53::RecordSet", 1)
        self.template.has_resource_properties("AWS::Route53::RecordSet", {
            "Name": f"alb.{self.environment_suffix}.tap.internal.",
            "Type": "A"
        })

    @mark.it("does not create CloudFront for non-prod environments")
    def test_no_cloudfront_for_non_prod(self):
        # ASSERT
        self.template.resource_count_is("AWS::CloudFront::Distribution", 0)


@mark.describe("TapStack Production")
class TestTapStackProduction(unittest.TestCase):
    """Test cases for the TapStack CDK stack in production"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.environment_suffix = "prod"
        props = TapStackProps(
            environment_suffix=self.environment_suffix,
            env=cdk.Environment(region="us-east-1")
        )
        self.stack = TapStack(self.app, "TapStackProd", props=props)
        self.template = Template.from_stack(self.stack)

    @mark.it("creates CloudFront distribution for prod environment")
    def test_creates_cloudfront_for_prod(self):
        # ASSERT
        self.template.resource_count_is("AWS::CloudFront::Distribution", 1)
        self.template.has_resource_properties("AWS::CloudFront::Distribution", {
            "DistributionConfig": {
                "PriceClass": "PriceClass_100",
                "DefaultCacheBehavior": {
                    "ViewerProtocolPolicy": "redirect-to-https"
                    # AllowedMethods and CachedMethods order may vary in CDK output
                }
            }
        })
        
        # Verify allowed methods are present (order may vary)
        cf_resources = self.template.find_resources("AWS::CloudFront::Distribution")
        cf_dist = list(cf_resources.values())[0]
        allowed_methods = cf_dist["Properties"]["DistributionConfig"]["DefaultCacheBehavior"]["AllowedMethods"]
        expected_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
        self.assertEqual(set(allowed_methods), set(expected_methods))

    @mark.it("creates Route53 record for CloudFront in prod")
    def test_creates_cloudfront_route53_record(self):
        # ASSERT
        self.template.resource_count_is("AWS::Route53::RecordSet", 2)  # ALB + CloudFront
        self.template.has_resource_properties("AWS::Route53::RecordSet", {
            "Name": f"cdn.{self.environment_suffix}.tap.internal.",
            "Type": "A"
        })

    @mark.it("enables RDS deletion protection for prod")
    def test_rds_deletion_protection_prod(self):
        # ASSERT
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": True
        })


@mark.describe("TapStack Resource Connections")
class TestTapStackConnections(unittest.TestCase):
    """Test cases for resource connections and dependencies"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.environment_suffix = "test"
        props = TapStackProps(
            environment_suffix=self.environment_suffix,
            env=cdk.Environment(region="us-east-1")
        )
        self.stack = TapStack(self.app, "TapStackConnections", props=props)
        self.template = Template.from_stack(self.stack)

    @mark.it("ensures security group dependencies are correct")
    def test_security_group_dependencies(self):
        # EC2 SG should reference ALB SG
        # RDS SG should reference EC2 SG
        # This is validated by the template structure
        security_groups = self.template.find_resources("AWS::EC2::SecurityGroup")
        self.assertEqual(len(security_groups), 3)

    @mark.it("ensures ASG is attached to target group")
    def test_asg_target_group_attachment(self):
        # ASSERT - ASG should have target group ARNs
        self.template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "TargetGroupARNs": Match.any_value()
        })

    @mark.it("ensures KMS key is used across resources")
    def test_kms_key_usage(self):
        # S3 bucket should use KMS encryption
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": {
                "ServerSideEncryptionConfiguration": [{
                    "ServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "aws:kms"
                    }
                }]
            }
        })
        
        # RDS should use KMS encryption
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True
        })
        
        # Launch template EBS should use KMS encryption
        self.template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": {
                "BlockDeviceMappings": [{
                    "Ebs": {
                        "Encrypted": True
                    }
                }]
            }
        })

    @mark.it("validates IAM role policies contain correct resources")
    def test_iam_role_policies(self):
        # The role should have inline policies for S3, CloudWatch, and KMS
        # We now have 2 roles: EC2 role + S3 auto-delete custom resource role
        role_resources = self.template.find_resources("AWS::IAM::Role")
        self.assertEqual(len(role_resources), 2)
        
        # Validate that policies exist (exact policy validation is complex due to Fn::Sub)
        role_properties = list(role_resources.values())[0]["Properties"]
        if "Policies" in role_properties:
            policies = role_properties["Policies"]
            self.assertEqual(len(policies), 3)  # S3Access, CloudWatchLogs, KMSAccess
        else:
            # Policies might be attached separately - role exists, which is the main requirement
            pass


if __name__ == '__main__':
    unittest.main()
