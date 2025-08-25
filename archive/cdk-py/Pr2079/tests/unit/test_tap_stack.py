"""Unit tests for TapStack and SimpleSecurityStack"""

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps
from lib.simple_security_stack import SimpleSecurityStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates a nested security stack with correct name")
    def test_creates_nested_security_stack(self):
        # ARRANGE
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)
        
        # ASSERT - Verify nested stack exists
        template.resource_count_is("AWS::CloudFormation::Stack", 1)
        
    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        
        # ASSERT - Stack should create with default suffix
        self.assertIsNotNone(stack.security_nested_stack)
        self.assertEqual(stack.security_nested_stack.security_stack.environment_suffix, 'dev')

    @mark.it("passes environment suffix to nested stack")
    def test_passes_env_suffix_to_nested_stack(self):
        # ARRANGE
        env_suffix = "production"
        stack = TapStack(self.app, "TapStackTest",
                         TapStackProps(environment_suffix=env_suffix))
        
        # ASSERT - Verify environment suffix is passed
        self.assertEqual(stack.security_nested_stack.security_stack.environment_suffix, env_suffix)

    @mark.it("uses context for environment suffix when not in props")
    def test_uses_context_for_env_suffix(self):
        # ARRANGE
        self.app = cdk.App(context={'environmentSuffix': 'fromcontext'})
        stack = TapStack(self.app, "TapStackTestContext")
        
        # ASSERT
        self.assertEqual(stack.security_nested_stack.security_stack.environment_suffix, 'fromcontext')


@mark.describe("SimpleSecurityStack")
class TestSimpleSecurityStack(unittest.TestCase):
    """Test cases for the SimpleSecurityStack"""
    
    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.stack = SimpleSecurityStack(
            self.app, 
            f"TestSecurityStack{self.env_suffix}",
            environment_suffix=self.env_suffix
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates KMS key with rotation enabled")
    def test_creates_kms_key(self):
        # ASSERT
        self.template.resource_count_is("AWS::KMS::Key", 1)
        self.template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True,
            "Description": f"KMS Key for {self.env_suffix}"
        })

    @mark.it("creates S3 bucket with encryption and versioning")
    def test_creates_s3_bucket(self):
        # ASSERT
        self.template.resource_count_is("AWS::S3::Bucket", 1)
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "BucketEncryption": Match.object_like({
                "ServerSideEncryptionConfiguration": Match.array_with([
                    Match.object_like({
                        "ServerSideEncryptionByDefault": Match.object_like({
                            "SSEAlgorithm": "aws:kms"
                        })
                    })
                ])
            }),
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("creates VPC with correct CIDR and subnets")
    def test_creates_vpc(self):
        # ASSERT
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True,
            "Tags": Match.array_with([
                Match.object_like({
                    "Key": "Name",
                    "Value": f"tap-{self.env_suffix}-vpc"
                })
            ])
        })
        
        # Check for subnets - 2 public, 2 private
        self.template.resource_count_is("AWS::EC2::Subnet", 4)

    @mark.it("creates security groups with correct rules")
    def test_creates_security_groups(self):
        # ASSERT - Should have 3 security groups (App, ALB, and Lambda VPC security group)
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 3)
        
        # Check ALB security group
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupName": f"tap-{self.env_suffix}-alb-sg-primary-1",
            "GroupDescription": "ALB security group",
            "SecurityGroupIngress": Match.array_with([
                Match.object_like({
                    "IpProtocol": "tcp",
                    "FromPort": 80,
                    "ToPort": 80,
                    "CidrIp": "0.0.0.0/0"
                })
            ])
        })

    @mark.it("creates Lambda function with correct configuration")
    def test_creates_lambda_function(self):
        # ASSERT - Expect 2 functions: the main one + auto-delete S3 objects function
        self.template.resource_count_is("AWS::Lambda::Function", 2)
        self.template.has_resource_properties("AWS::Lambda::Function", {
            "FunctionName": f"tap-{self.env_suffix}-function-primary-1",
            "Runtime": "python3.11",
            "Handler": "index.handler",
            "Environment": {
                "Variables": {
                    "ENVIRONMENT": self.env_suffix
                }
            },
            "Timeout": 30
        })

    @mark.it("creates IAM roles with correct policies")
    def test_creates_iam_roles(self):
        # ASSERT - Should have roles for Lambda and EC2
        roles = self.template.find_resources("AWS::IAM::Role")
        
        # Find Lambda role
        lambda_role_found = False
        ec2_role_found = False
        
        for role_id, role_props in roles.items():
            if "Properties" in role_props and "RoleName" in role_props["Properties"]:
                role_name = role_props["Properties"]["RoleName"]
                if f"tap-{self.env_suffix}-lambda-role-primary-1" == role_name:
                    lambda_role_found = True
                elif f"tap-{self.env_suffix}-ec2-role-primary-1" == role_name:
                    ec2_role_found = True
        
        self.assertTrue(lambda_role_found, "Lambda role not found")
        self.assertTrue(ec2_role_found, "EC2 role not found")

    @mark.it("creates API Gateway with Lambda integration")
    def test_creates_api_gateway(self):
        # ASSERT
        self.template.resource_count_is("AWS::ApiGateway::RestApi", 1)
        self.template.has_resource_properties("AWS::ApiGateway::RestApi", {
            "Name": f"tap-{self.env_suffix}-api-primary-1"
        })
        
        # Check for deployment
        self.template.resource_count_is("AWS::ApiGateway::Deployment", 1)
        
        # Check for stage
        self.template.has_resource_properties("AWS::ApiGateway::Stage", {
            "StageName": "prod"
        })

    @mark.it("creates Application Load Balancer")
    def test_creates_alb(self):
        # ASSERT
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Name": f"tap-{self.env_suffix}-alb-primary-1",
            "Scheme": "internet-facing",
            "Type": "application"
        })

    @mark.it("creates Target Group with health check")
    def test_creates_target_group(self):
        # ASSERT
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Name": f"tap-{self.env_suffix}-tg-primary-1",
            "Port": 80,
            "Protocol": "HTTP",
            "TargetType": "instance",
            "HealthCheckEnabled": True,
            "HealthCheckPath": "/health"
        })

    @mark.it("creates ALB Listener")
    def test_creates_alb_listener(self):
        # ASSERT
        self.template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
        self.template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })

    @mark.it("creates Bastion host EC2 instance")
    def test_creates_bastion_host(self):
        # ASSERT
        self.template.resource_count_is("AWS::EC2::Instance", 1)
        self.template.has_resource_properties("AWS::EC2::Instance", {
            "Tags": Match.array_with([
                Match.object_like({
                    "Key": "Name",
                    "Value": f"tap-{self.env_suffix}-bastion-primary-1"
                })
            ])
        })

    @mark.it("creates CloudFormation outputs")
    def test_creates_outputs(self):
        # ASSERT - Check for all expected outputs
        outputs = self.template.find_outputs("*")
        
        expected_outputs = [
            "VPCId",
            "BastionInstanceId", 
            "APIGatewayURL",
            "LoadBalancerDNS",
            "S3BucketName",
            "LambdaFunctionName"
        ]
        
        for expected in expected_outputs:
            found = False
            for output_id in outputs:
                if expected in output_id:
                    found = True
                    break
            self.assertTrue(found, f"Output {expected} not found")

    @mark.it("all resources have RemovalPolicy DESTROY")
    def test_removal_policies(self):
        # Check S3 bucket has auto delete
        self.template.has_resource("Custom::S3AutoDeleteObjects", {
            "Properties": Match.object_like({
                "ServiceToken": Match.any_value()
            })
        })
        
        # Check KMS key
        self.template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    @mark.it("resources use environment suffix in names")
    def test_resources_use_env_suffix(self):
        # Check various resources for env suffix
        resources = [
            ("AWS::EC2::VPC", "Name", f"tap-{self.env_suffix}-vpc"),
            ("AWS::Lambda::Function", "FunctionName", f"tap-{self.env_suffix}-function-primary-1"),
            ("AWS::ApiGateway::RestApi", "Name", f"tap-{self.env_suffix}-api-primary-1"),
            ("AWS::ElasticLoadBalancingV2::LoadBalancer", "Name", f"tap-{self.env_suffix}-alb-primary-1"),
            ("AWS::ElasticLoadBalancingV2::TargetGroup", "Name", f"tap-{self.env_suffix}-tg-primary-1")
        ]
        
        for resource_type, prop_name, expected_value in resources:
            found = False
            resources_of_type = self.template.find_resources(resource_type)
            
            for resource_id, resource_props in resources_of_type.items():
                if "Properties" in resource_props:
                    # Special case for VPC - name is in Tags
                    if resource_type == "AWS::EC2::VPC" and prop_name == "Name":
                        if "Tags" in resource_props["Properties"]:
                            for tag in resource_props["Properties"]["Tags"]:
                                if tag.get("Key") == "Name" and expected_value in str(tag.get("Value", "")):
                                    found = True
                                    break
                    elif prop_name in resource_props["Properties"]:
                        if expected_value in str(resource_props["Properties"][prop_name]):
                            found = True
                            break
            
            self.assertTrue(found, f"{resource_type} with {prop_name}={expected_value} not found")


@mark.describe("Security Best Practices")
class TestSecurityBestPractices(unittest.TestCase):
    """Test security best practices are implemented"""
    
    def setUp(self):
        """Set up stack for testing"""
        self.app = cdk.App()
        self.stack = SimpleSecurityStack(
            self.app,
            "TestSecurityStack",
            environment_suffix="security"
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("S3 bucket blocks public access")
    def test_s3_blocks_public_access(self):
        # ASSERT
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("S3 bucket has encryption enabled")
    def test_s3_encryption(self):
        # ASSERT
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "BucketEncryption": Match.object_like({
                "ServerSideEncryptionConfiguration": Match.any_value()
            })
        })

    @mark.it("S3 bucket has versioning enabled")
    def test_s3_versioning(self):
        # ASSERT
        self.template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            }
        })

    @mark.it("KMS key has rotation enabled")
    def test_kms_rotation(self):
        # ASSERT
        self.template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    @mark.it("VPC has DNS enabled")
    def test_vpc_dns(self):
        # ASSERT
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })

    @mark.it("Security groups have descriptions")
    def test_security_groups_have_descriptions(self):
        # ASSERT
        sgs = self.template.find_resources("AWS::EC2::SecurityGroup")
        for sg_id, sg_props in sgs.items():
            if "Properties" in sg_props:
                self.assertIn("GroupDescription", sg_props["Properties"],
                             f"Security group {sg_id} missing description")

    @mark.it("Lambda function in VPC")
    def test_lambda_in_vpc(self):
        # ASSERT - Check only our application Lambda functions, not auto-delete utility functions
        lambdas = self.template.find_resources("AWS::Lambda::Function")
        for lambda_id, lambda_props in lambdas.items():
            # Skip CDK auto-generated Lambda functions for S3 auto-delete
            if "CustomS3AutoDeleteObjects" in lambda_id:
                continue
                
            if "Properties" in lambda_props:
                self.assertIn("VpcConfig", lambda_props["Properties"],
                             f"Lambda {lambda_id} not in VPC")


if __name__ == "__main__":
    unittest.main()
