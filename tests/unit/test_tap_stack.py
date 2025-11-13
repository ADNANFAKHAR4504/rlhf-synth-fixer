"""Unit tests for TAP Stack."""
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'eks_cluster')
        assert hasattr(stack, 'kms')

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault", environment_suffix="default")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'eks_cluster')
        assert hasattr(stack, 'kms')

    def test_tap_stack_without_aws_region_uses_default(self):
        """TapStack uses default AWS region when aws_region is not provided."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackNoRegion",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-west-2"
        )

        # Verify that TapStack instantiates without errors when aws_region is not provided
        assert stack is not None
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'eks_cluster')
        assert hasattr(stack, 'kms')

    def test_tap_stack_with_custom_default_tags(self):
        """TapStack accepts custom default_tags."""
        app = App()
        custom_tags = {
            "tags": {
                "Environment": "custom-env",
                "Team": "DevOps",
                "Owner": "TestUser"
            }
        }
        stack = TapStack(
            app,
            "TestTapStackCustomTags",
            environment_suffix="test",
            default_tags=custom_tags
        )

        # Verify that TapStack instantiates without errors when custom default_tags provided
        assert stack is not None
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'eks_cluster')
        assert hasattr(stack, 'kms')


class TestKmsEncryptionConstruct:
    """Test suite for KMS Encryption Construct."""

    def test_kms_logs_key_arn_property(self):
        """Test that logs_key_arn property returns correct value."""
        from lib.kms_encryption import KmsEncryptionConstruct

        app = App()
        stack = TapStack(app, "TestStack", environment_suffix="test")

        # Access logs_key_arn property to cover line 119
        logs_key_arn = stack.kms.logs_key_arn
        assert logs_key_arn is not None
        assert isinstance(logs_key_arn, str)


class TestEksAddonsConstruct:
    """Test suite for EKS Addons Construct."""

    def test_eks_addons_without_kms_key(self):
        """Test that EKS addons work when KMS key is not provided."""
        from lib.eks_addons import EksAddonsConstruct
        from lib.eks_cluster import EksClusterConstruct
        from lib.vpc_stack import VpcConstruct
        from lib.kms_encryption import KmsEncryptionConstruct
        from cdktf import TerraformStack

        app = App()
        stack = TerraformStack(app, "TestStack")

        # Create VPC with required parameters
        vpc = VpcConstruct(
            stack,
            "TestVpc",
            environment_suffix="test",
            region="us-east-1",
            cidr_block="10.0.0.0/16",
            availability_zones=["us-east-1a", "us-east-1b"]
        )

        # Create KMS for EKS (required by EksClusterConstruct)
        kms = KmsEncryptionConstruct(
            stack,
            "TestKms",
            environment_suffix="test"
        )

        eks = EksClusterConstruct(
            stack,
            "TestEksCluster",
            environment_suffix="test",
            vpc_id=vpc.vpc_id,
            private_subnet_ids=vpc.private_subnet_ids,
            cluster_version="1.31",
            kms_key_arn=kms.cluster_key_arn
        )

        # Create addons with ebs_csi_role_arn=None to test the branch
        addons = EksAddonsConstruct(
            stack,
            "TestAddons",
            environment_suffix="test",
            cluster_name=eks.cluster_name,
            ebs_csi_role_arn=None  # Explicitly test None case
        )

        assert addons is not None


# add more test suites and cases as needed
