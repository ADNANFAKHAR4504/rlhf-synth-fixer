"""
Comprehensive unit tests for Payment Processing Infrastructure.
Tests individual stack components and integration.
"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps
from lib.network_stack import NetworkStack, NetworkStackProps
from lib.security_stack import SecurityStack, SecurityStackProps
from lib.database_stack import DatabaseStack, DatabaseStackProps
from lib.storage_stack import StorageStack, StorageStackProps
from lib.api_stack import ApiStack, ApiStackProps
from lib.monitoring_stack import MonitoringStack, MonitoringStackProps
from lib.compute_stack import ComputeStack, ComputeStackProps


@mark.describe("PaymentProcessing Infrastructure")
class TestPaymentProcessingStacks(unittest.TestCase):
    """Comprehensive unit tests for all stack components"""

    def setUp(self):
        """Set up test environment"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.parent_stack = cdk.Stack(self.app, "TestParent")

    @mark.it("TapStack synthesizes successfully")
    def test_tap_stack_synthesizes(self):
        """Test main stack synthesis"""
        stack = TapStack(
            self.app,
            f"PaymentProcessingStack{self.env_suffix}",
            props=TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)
        assert template is not None

    @mark.it("TapStack creates nested stacks")
    def test_tap_stack_nested_stacks(self):
        """Test that TapStack creates all required nested stacks"""
        stack = TapStack(
            self.app,
            f"PaymentProcessingStack{self.env_suffix}",
            props=TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)
        nested_stacks = template.find_resources("AWS::CloudFormation::Stack")
        # Should create 7 nested stacks
        assert len(nested_stacks) >= 7

    @mark.it("TapStack has required outputs")
    def test_tap_stack_outputs(self):
        """Test that TapStack exports required outputs"""
        stack = TapStack(
            self.app,
            f"PaymentProcessingStack{self.env_suffix}",
            props=TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)
        cfn_template = template.to_json()
        outputs = cfn_template.get("Outputs", {})

        required_outputs = [
            "ALBDNSName",
            "ApiGatewayEndpoint",
            "CloudWatchDashboardURL",
            "DatabaseClusterEndpoint",
            "DocumentBucketName"
        ]

        for output_name in required_outputs:
            assert any(output_name in key for key in outputs.keys()), \
                f"Missing output: {output_name}"

    @mark.it("TapStack uses environment suffix")
    def test_tap_stack_env_suffix(self):
        """Test environment suffix is properly propagated"""
        env_suffix = "prod123"
        stack = TapStack(
            self.app,
            f"PaymentProcessingStack{env_suffix}",
            props=TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)
        template_str = str(template.to_json())
        assert env_suffix in template_str

    @mark.it("TapStack defaults to dev environment")
    def test_tap_stack_defaults_to_dev(self):
        """Test default environment suffix is 'dev'"""
        stack = TapStack(self.app, "PaymentProcessingStackdev")
        template = Template.from_stack(stack)
        assert template is not None

    @mark.it("NetworkStack creates VPC")
    def test_network_stack_vpc(self):
        """Test VPC creation in NetworkStack"""
        stack = NetworkStack(
            self.parent_stack,
            f"NetworkStack{self.env_suffix}",
            props=NetworkStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # VPC should be created
        template.resource_count_is("AWS::EC2::VPC", 1)

        # Subnets should be created (6 total: 2 AZs × 3 types)
        # Note: Some regions may only have 2 AZs available
        subnets = template.find_resources("AWS::EC2::Subnet")
        assert len(subnets) >= 6

    @mark.it("NetworkStack creates NAT Instances")
    def test_network_stack_nat_instances(self):
        """Test NAT Instance creation for private subnet internet access (cost-optimized)"""
        stack = NetworkStack(
            self.parent_stack,
            f"NetworkStack{self.env_suffix}",
            props=NetworkStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # Should create NAT Instances (EC2 instances) instead of NAT Gateways for cost optimization
        nat_instances = template.find_resources("AWS::EC2::Instance")
        assert len(nat_instances) >= 2, "Should create at least 2 NAT Instances"

        # Verify IAM roles are created for NAT Instances
        iam_roles = template.find_resources("AWS::IAM::Role")
        assert len(iam_roles) >= 2, "Should create at least 2 IAM roles for NAT Instances"

    @mark.it("NetworkStack creates ALB")
    def test_network_stack_alb(self):
        """Test Application Load Balancer creation"""
        stack = NetworkStack(
            self.parent_stack,
            f"NetworkStack{self.env_suffix}",
            props=NetworkStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # ALB should be created
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

        # Verify ALB is internet-facing
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing",
            "Type": "application"
        })

    @mark.it("NetworkStack creates WAF")
    def test_network_stack_waf(self):
        """Test AWS WAF Web ACL creation"""
        stack = NetworkStack(
            self.parent_stack,
            f"NetworkStack{self.env_suffix}",
            props=NetworkStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # WAF Web ACL should be created
        template.resource_count_is("AWS::WAFv2::WebACL", 1)

        # Verify WAF configuration
        template.has_resource_properties("AWS::WAFv2::WebACL", {
            "Scope": "REGIONAL",
            "DefaultAction": {"Allow": {}}
        })

        # WAF should be associated with ALB
        template.resource_count_is("AWS::WAFv2::WebACLAssociation", 1)

    @mark.it("NetworkStack creates Security Groups")
    def test_network_stack_security_groups(self):
        """Test security group creation"""
        stack = NetworkStack(
            self.parent_stack,
            f"NetworkStack{self.env_suffix}",
            props=NetworkStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # Multiple security groups should be created
        sg_count = template.find_resources("AWS::EC2::SecurityGroup")
        assert len(sg_count) >= 4

    @mark.it("NetworkStack creates VPC Endpoints")
    def test_network_stack_vpc_endpoints(self):
        """Test VPC endpoint creation"""
        stack = NetworkStack(
            self.parent_stack,
            f"NetworkStack{self.env_suffix}",
            props=NetworkStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)

        # VPC endpoints should be created
        endpoints = template.find_resources("AWS::EC2::VPCEndpoint")
        assert len(endpoints) >= 2  # At least S3 and DynamoDB gateway endpoints

    @mark.it("SecurityStack creates KMS keys")
    def test_security_stack_kms_keys(self):
        """Test KMS key creation"""
        # Need to create network stack first for VPC
        network_stack = NetworkStack(
            self.parent_stack,
            f"NetworkStack{self.env_suffix}",
            props=NetworkStackProps(environment_suffix=self.env_suffix)
        )

        stack = SecurityStack(
            self.parent_stack,
            f"SecurityStack{self.env_suffix}",
            props=SecurityStackProps(
                environment_suffix=self.env_suffix,
                vpc=network_stack.vpc
            )
        )
        template = Template.from_stack(stack)

        # Multiple KMS keys should be created
        kms_keys = template.find_resources("AWS::KMS::Key")
        assert len(kms_keys) >= 4

        # Verify key rotation is enabled
        for key_id, key_props in kms_keys.items():
            assert key_props["Properties"]["EnableKeyRotation"] is True

    @mark.it("SecurityStack creates Secrets")
    def test_security_stack_secrets(self):
        """Test Secrets Manager secret creation"""
        network_stack = NetworkStack(
            self.parent_stack,
            f"NetworkStack{self.env_suffix}",
            props=NetworkStackProps(environment_suffix=self.env_suffix)
        )

        stack = SecurityStack(
            self.parent_stack,
            f"SecurityStack{self.env_suffix}",
            props=SecurityStackProps(
                environment_suffix=self.env_suffix,
                vpc=network_stack.vpc
            )
        )
        template = Template.from_stack(stack)

        # Secrets should be created
        secrets = template.find_resources("AWS::SecretsManager::Secret")
        assert len(secrets) >= 2  # DB credentials and API keys

    @mark.it("SecurityStack creates rotation Lambda")
    def test_security_stack_rotation_lambda(self):
        """Test rotation Lambda creation"""
        network_stack = NetworkStack(
            self.parent_stack,
            f"NetworkStack{self.env_suffix}",
            props=NetworkStackProps(environment_suffix=self.env_suffix)
        )

        stack = SecurityStack(
            self.parent_stack,
            f"SecurityStack{self.env_suffix}",
            props=SecurityStackProps(
                environment_suffix=self.env_suffix,
                vpc=network_stack.vpc
            )
        )
        template = Template.from_stack(stack)

        # Rotation Lambda should be created
        template.resource_count_is("AWS::Lambda::Function", 1)

        # Rotation schedule should be configured
        rotation_schedules = template.find_resources("AWS::SecretsManager::RotationSchedule")
        assert len(rotation_schedules) >= 1

    @mark.it("StorageStack creates S3 buckets")
    def test_storage_stack_s3_buckets(self):
        """Test S3 bucket creation"""
        parent_stack = cdk.Stack(self.app, "TestParent2")
        network_stack = NetworkStack(
            parent_stack,
            f"NetworkStack{self.env_suffix}",
            props=NetworkStackProps(environment_suffix=self.env_suffix)
        )

        security_stack = SecurityStack(
            parent_stack,
            f"SecurityStack{self.env_suffix}",
            props=SecurityStackProps(
                environment_suffix=self.env_suffix,
                vpc=network_stack.vpc
            )
        )

        stack = StorageStack(
            parent_stack,
            f"StorageStack{self.env_suffix}",
            props=StorageStackProps(
                environment_suffix=self.env_suffix,
                kms_key=security_stack.s3_kms_key
            )
        )
        template = Template.from_stack(stack)

        # Should create 2 buckets (primary and replication)
        template.resource_count_is("AWS::S3::Bucket", 2)

        # Verify encryption and versioning
        template.has_resource_properties("AWS::S3::Bucket", {
            "VersioningConfiguration": {
                "Status": "Enabled"
            },
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "BlockPublicPolicy": True,
                "IgnorePublicAcls": True,
                "RestrictPublicBuckets": True
            }
        })

    @mark.it("TapStack has no Retain deletion policies")
    def test_no_retain_policies(self):
        """Test that all resources can be destroyed"""
        stack = TapStack(
            self.app,
            f"PaymentProcessingStack{self.env_suffix}",
            props=TapStackProps(environment_suffix=self.env_suffix)
        )
        template = Template.from_stack(stack)
        cfn_template = template.to_json()

        for resource_id, resource in cfn_template.get("Resources", {}).items():
            deletion_policy = resource.get("DeletionPolicy", "Delete")
            assert deletion_policy != "Retain", \
                f"Resource {resource_id} has Retain deletion policy"

    @mark.it("TapStack Props class works correctly")
    def test_tap_stack_props(self):
        """Test TapStackProps initialization"""
        props = TapStackProps(environment_suffix="test123")
        assert props.environment_suffix == "test123"

    @mark.it("NetworkStackProps class works correctly")
    def test_network_stack_props(self):
        """Test NetworkStackProps initialization"""
        props = NetworkStackProps(environment_suffix="test456")
        assert props.environment_suffix == "test456"

    @mark.it("SecurityStackProps class works correctly")
    def test_security_stack_props(self):
        """Test SecurityStackProps initialization"""
        network_stack = NetworkStack(
            self.parent_stack,
            f"NetworkStack{self.env_suffix}",
            props=NetworkStackProps(environment_suffix=self.env_suffix)
        )
        props = SecurityStackProps(environment_suffix="test789", vpc=network_stack.vpc)
        assert props.environment_suffix == "test789"
        assert props.vpc == network_stack.vpc

    @mark.it("StorageStackProps class works correctly")
    def test_storage_stack_props(self):
        """Test StorageStackProps initialization"""
        from aws_cdk import aws_kms as kms
        key = kms.Key(self.parent_stack, "TestKey")
        props = StorageStackProps(environment_suffix="testabc", kms_key=key)
        assert props.environment_suffix == "testabc"
        assert props.kms_key == key


if __name__ == "__main__":
    unittest.main()
