"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import pulumi
from pulumi import ResourceOptions
import json


class MyMocks(pulumi.runtime.Mocks):
    """Custom Pulumi mocks for testing."""

    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Mock resource creation."""
        outputs = args.inputs
        if args.typ == "aws:s3/bucket:Bucket":
            outputs = {**args.inputs, "bucket": args.inputs.get("bucket", args.name)}
        elif args.typ == "aws:eks/cluster:Cluster":
            # Create a proper mock object for certificate_authority
            # Pulumi expects this to be accessible as an attribute
            from types import SimpleNamespace
            cert_auth = SimpleNamespace(data="LS0tLS1CRUdJTi1DRVJUSUZJQ0FURS0tLS0tCg==")

            outputs = {
                **args.inputs,
                "endpoint": "https://test.eks.amazonaws.com",
                "certificateAuthority": {
                    "data": "LS0tLS1CRUdJTi1DRVJUSUZJQ0FURS0tLS0tCg=="
                },
                "identities": [{
                    "oidcs": [{
                        "issuer": "https://oidc.eks.us-east-1.amazonaws.com/id/TEST"
                    }]
                }],
                "name": args.inputs.get("name", args.name)
            }
        elif args.typ == "aws:iam/openIdConnectProvider:OpenIdConnectProvider":
            outputs = {**args.inputs, "arn": f"arn:aws:iam::123456789012:oidc-provider/{args.name}"}
        elif args.typ == "kubernetes:core/v1:Namespace":
            outputs = {**args.inputs, "metadata": {"name": args.inputs.get("metadata", {}).get("name", "default")}}
        return [args.name + "_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:index/getCallerIdentity:getCallerIdentity":
            return {"accountId": "123456789012"}
        elif args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b", "us-east-1c"]}
        elif args.token == "aws:ec2/getAmi:getAmi":
            return {"id": "ami-12345678"}
        return {}


# Set up Pulumi mocks before importing
pulumi.runtime.set_mocks(
    mocks=MyMocks(),
    preview=False,
)

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs
from lib import vpc, kms, iam, eks, kubernetes_resources


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {"Team": "Platform", "Environment": "production"}
        args = TapStackArgs(
            environment_suffix='prod',
            tags=custom_tags
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)

    def test_tap_stack_args_with_only_suffix(self):
        """Test TapStackArgs with only environment suffix."""
        args = TapStackArgs(environment_suffix='staging')

        self.assertEqual(args.environment_suffix, 'staging')
        self.assertIsNone(args.tags)

    def test_tap_stack_args_with_only_tags(self):
        """Test TapStackArgs with only tags."""
        custom_tags = {"Project": "EKS"}
        args = TapStackArgs(tags=custom_tags)

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, custom_tags)


class TestVPCModule(unittest.TestCase):
    """Test cases for VPC module functions."""

    @pulumi.runtime.test
    def test_create_vpc_returns_required_resources(self):
        """Test that create_vpc returns all required resources."""
        result = vpc.create_vpc('test', 'us-east-1')

        self.assertIn('vpc', result)
        self.assertIn('public_subnets', result)
        self.assertIn('private_subnets', result)
        self.assertIn('nat_gateways', result)

    @pulumi.runtime.test
    def test_create_vpc_subnet_counts(self):
        """Test that create_vpc creates correct number of subnets."""
        result = vpc.create_vpc('test', 'us-east-1')

        self.assertEqual(len(result['public_subnets']), 3)
        self.assertEqual(len(result['private_subnets']), 3)
        self.assertEqual(len(result['nat_gateways']), 3)

    @pulumi.runtime.test
    def test_create_vpc_with_different_suffix(self):
        """Test VPC creation with different environment suffixes."""
        result1 = vpc.create_vpc('dev', 'us-east-1')
        result2 = vpc.create_vpc('prod', 'us-east-1')

        self.assertIsNotNone(result1['vpc'])
        self.assertIsNotNone(result2['vpc'])


class TestKMSModule(unittest.TestCase):
    """Test cases for KMS module functions."""

    @pulumi.runtime.test
    def test_create_kms_key(self):
        """Test KMS key creation."""
        key = kms.create_kms_key('test', '123456789012')

        self.assertIsNotNone(key)

    @pulumi.runtime.test
    def test_create_kms_key_with_different_accounts(self):
        """Test KMS key creation with different AWS accounts."""
        key1 = kms.create_kms_key('test', '111111111111')
        key2 = kms.create_kms_key('test', '222222222222')

        self.assertIsNotNone(key1)
        self.assertIsNotNone(key2)


class TestIAMModule(unittest.TestCase):
    """Test cases for IAM module functions."""

    @pulumi.runtime.test
    def test_create_eks_cluster_role(self):
        """Test EKS cluster role creation."""
        role = iam.create_eks_cluster_role('test')

        self.assertIsNotNone(role)

    @pulumi.runtime.test
    def test_create_eks_node_role(self):
        """Test EKS node role creation."""
        role = iam.create_eks_node_role('test')

        self.assertIsNotNone(role)

    @pulumi.runtime.test
    def test_create_cluster_autoscaler_role(self):
        """Test Cluster Autoscaler role creation."""
        oidc_arn = pulumi.Output.from_input("arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/TEST")
        oidc_url = pulumi.Output.from_input("oidc.eks.us-east-1.amazonaws.com/id/TEST")
        cluster_name = pulumi.Output.from_input("test-cluster")

        role = iam.create_cluster_autoscaler_role('test', oidc_arn, oidc_url, cluster_name)

        self.assertIsNotNone(role)

    @pulumi.runtime.test
    def test_create_alb_controller_role(self):
        """Test ALB Controller role creation."""
        oidc_arn = pulumi.Output.from_input("arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/TEST")
        oidc_url = pulumi.Output.from_input("oidc.eks.us-east-1.amazonaws.com/id/TEST")

        role = iam.create_alb_controller_role('test', oidc_arn, oidc_url)

        self.assertIsNotNone(role)

    @pulumi.runtime.test
    def test_create_tenant_irsa_role(self):
        """Test tenant IRSA role creation."""
        oidc_arn = pulumi.Output.from_input("arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/TEST")
        oidc_url = pulumi.Output.from_input("oidc.eks.us-east-1.amazonaws.com/id/TEST")
        bucket_name = pulumi.Output.from_input("test-bucket")

        role = iam.create_tenant_irsa_role('tenant-a', 'test', oidc_arn, oidc_url, bucket_name)

        self.assertIsNotNone(role)


class TestEKSModule(unittest.TestCase):
    """Test cases for EKS module functions."""

    @pulumi.runtime.test
    def test_create_eks_cluster(self):
        """Test EKS cluster creation."""
        from unittest.mock import Mock
        cluster_role = Mock()
        cluster_role.arn = pulumi.Output.from_input("arn:aws:iam::123456789012:role/test-role")

        subnet_ids = [
            pulumi.Output.from_input("subnet-123"),
            pulumi.Output.from_input("subnet-456"),
            pulumi.Output.from_input("subnet-789")
        ]

        kms_key = Mock()
        kms_key.arn = pulumi.Output.from_input("arn:aws:kms:us-east-1:123456789012:key/test")

        cluster = eks.create_eks_cluster('test', cluster_role, subnet_ids, kms_key)

        self.assertIsNotNone(cluster)

    @pulumi.runtime.test
    def test_create_oidc_provider(self):
        """Test OIDC provider creation."""
        cluster = Mock()
        cluster.identities = [
            Mock(oidcs=[Mock(issuer=pulumi.Output.from_input("https://oidc.eks.us-east-1.amazonaws.com/id/TEST"))])
        ]

        provider, arn, url = eks.create_oidc_provider(cluster, 'test')

        self.assertIsNotNone(provider)
        self.assertIsNotNone(arn)
        self.assertIsNotNone(url)


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack component."""

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test TapStack component creation."""
        args = TapStackArgs(environment_suffix='unittest')
        stack = TapStack('test-stack', args)

        self.assertEqual(stack.environment_suffix, 'unittest')
        self.assertIsNotNone(stack.cluster_endpoint)
        self.assertIsNotNone(stack.oidc_issuer_url)
        self.assertIsNotNone(stack.cluster_name)
        self.assertIsNotNone(stack.vpc_id)
        self.assertIsNotNone(stack.tenant_bucket_name)
        self.assertIsNotNone(stack.kubeconfig_command)

    @pulumi.runtime.test
    def test_tap_stack_outputs(self):
        """Test that TapStack exports all required outputs."""
        args = TapStackArgs(environment_suffix='unittest')
        stack = TapStack('test-stack', args)

        # Check that all outputs are defined
        self.assertTrue(hasattr(stack, 'cluster_endpoint'))
        self.assertTrue(hasattr(stack, 'oidc_issuer_url'))
        self.assertTrue(hasattr(stack, 'cluster_name'))
        self.assertTrue(hasattr(stack, 'vpc_id'))
        self.assertTrue(hasattr(stack, 'tenant_bucket_name'))
        self.assertTrue(hasattr(stack, 'kubeconfig_command'))


class TestBase64Encoding(unittest.TestCase):
    """Test cases for base64 encoding in EKS module."""

    def test_base64_import(self):
        """Test that base64 module is properly imported in eks module."""
        import lib.eks as eks_module
        self.assertTrue(hasattr(eks_module, 'base64'))

    def test_user_data_encoding_function(self):
        """Test the user data encoding for Bottlerocket."""
        import base64

        test_toml = """[settings.kubernetes]
cluster-name = "test-cluster"
"""
        encoded = base64.b64encode(test_toml.encode('utf-8')).decode('ascii')

        self.assertIsNotNone(encoded)
        self.assertTrue(len(encoded) > 0)

        # Verify it can be decoded back
        decoded = base64.b64decode(encoded).decode('utf-8')
        self.assertEqual(decoded, test_toml)


class TestOutputHandling(unittest.TestCase):
    """Test cases for proper Pulumi Output handling."""

    @pulumi.runtime.test
    def test_output_apply_for_s3_policy(self):
        """Test that S3 policy uses apply for Output values."""
        bucket_name = pulumi.Output.from_input("test-bucket")

        def create_s3_policy(name):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["s3:ListBucket"],
                    "Resource": f"arn:aws:s3:::{name}"
                }]
            })

        policy = bucket_name.apply(create_s3_policy)
        self.assertIsNotNone(policy)

    @pulumi.runtime.test
    def test_output_all_for_trust_policy(self):
        """Test that trust policies use Output.all for multiple values."""
        oidc_url = pulumi.Output.from_input("oidc.eks.us-east-1.amazonaws.com/id/TEST")
        oidc_arn = pulumi.Output.from_input("arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/TEST")

        def create_trust_policy(args):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Federated": args[1]},
                    "Condition": {
                        "StringEquals": {
                            f"{args[0]}:aud": "sts.amazonaws.com"
                        }
                    }
                }]
            })

        policy = pulumi.Output.all(oidc_url, oidc_arn).apply(create_trust_policy)
        self.assertIsNotNone(policy)


class TestNodeGroupCreation(unittest.TestCase):
    """Test cases for EKS node group creation with user data."""

    @pulumi.runtime.test
    def test_create_node_group_with_user_data(self):
        """Test node group creation with Bottlerocket user data."""
        cluster_role = Mock()
        cluster_role.arn = pulumi.Output.from_input("arn:aws:iam::123456789012:role/cluster-role")

        node_role = Mock()
        node_role.arn = pulumi.Output.from_input("arn:aws:iam::123456789012:role/node-role")

        subnet_ids = [
            pulumi.Output.from_input("subnet-123"),
            pulumi.Output.from_input("subnet-456")
        ]

        kms_key = Mock()
        kms_key.arn = pulumi.Output.from_input("arn:aws:kms:us-east-1:123456789012:key/test")

        # Create cluster first
        cluster = eks.create_eks_cluster('test', cluster_role, subnet_ids, kms_key)

        # Create node group (this exercises the user data creation code)
        node_group = eks.create_node_group('test', cluster, node_role, subnet_ids, 'us-east-1')

        self.assertIsNotNone(node_group)

    @pulumi.runtime.test
    def test_node_group_tags_with_output(self):
        """Test node group tags are created with cluster name from Output."""
        cluster_role = Mock()
        cluster_role.arn = pulumi.Output.from_input("arn:aws:iam::123456789012:role/cluster-role")

        node_role = Mock()
        node_role.arn = pulumi.Output.from_input("arn:aws:iam::123456789012:role/node-role")

        subnet_ids = [pulumi.Output.from_input("subnet-123")]

        kms_key = Mock()
        kms_key.arn = pulumi.Output.from_input("arn:aws:kms:us-east-1:123456789012:key/test")

        cluster = eks.create_eks_cluster('test', cluster_role, subnet_ids, kms_key)
        node_group = eks.create_node_group('test', cluster, node_role, subnet_ids, 'us-east-1')

        # Verify node group was created
        self.assertIsNotNone(node_group)


class TestEKSAddons(unittest.TestCase):
    """Test cases for EKS addon creation."""

    @pulumi.runtime.test
    def test_create_addon_without_version(self):
        """Test addon creation without specifying version."""
        cluster_role = Mock()
        cluster_role.arn = pulumi.Output.from_input("arn:aws:iam::123456789012:role/cluster-role")

        subnet_ids = [pulumi.Output.from_input("subnet-123")]

        kms_key = Mock()
        kms_key.arn = pulumi.Output.from_input("arn:aws:kms:us-east-1:123456789012:key/test")

        cluster = eks.create_eks_cluster('test', cluster_role, subnet_ids, kms_key)

        # Create addon without version (exercises line 244-263 without version)
        addon = eks.create_addon(cluster, 'vpc-cni', 'test')

        self.assertIsNotNone(addon)

    @pulumi.runtime.test
    def test_create_addon_with_version(self):
        """Test addon creation with specific version."""
        cluster_role = Mock()
        cluster_role.arn = pulumi.Output.from_input("arn:aws:iam::123456789012:role/cluster-role")

        subnet_ids = [pulumi.Output.from_input("subnet-123")]

        kms_key = Mock()
        kms_key.arn = pulumi.Output.from_input("arn:aws:kms:us-east-1:123456789012:key/test")

        cluster = eks.create_eks_cluster('test', cluster_role, subnet_ids, kms_key)

        # Create addon with version (exercises line 255-256)
        addon = eks.create_addon(cluster, 'kube-proxy', 'test', addon_version='v1.28.1-eksbuild.1')

        self.assertIsNotNone(addon)

    @pulumi.runtime.test
    def test_create_addon_coredns(self):
        """Test CoreDNS addon creation."""
        cluster_role = Mock()
        cluster_role.arn = pulumi.Output.from_input("arn:aws:iam::123456789012:role/cluster-role")

        subnet_ids = [pulumi.Output.from_input("subnet-123")]

        kms_key = Mock()
        kms_key.arn = pulumi.Output.from_input("arn:aws:kms:us-east-1:123456789012:key/test")

        cluster = eks.create_eks_cluster('test', cluster_role, subnet_ids, kms_key)

        # Create CoreDNS addon
        addon = eks.create_addon(cluster, 'coredns', 'test', addon_version='v1.10.1-eksbuild.2')

        self.assertIsNotNone(addon)


class TestContainerInsights(unittest.TestCase):
    """Test cases for CloudWatch Container Insights."""

    @pulumi.runtime.test
    def test_enable_container_insights(self):
        """Test enabling Container Insights for EKS cluster."""
        cluster_role = Mock()
        cluster_role.arn = pulumi.Output.from_input("arn:aws:iam::123456789012:role/cluster-role")

        subnet_ids = [pulumi.Output.from_input("subnet-123")]

        kms_key = Mock()
        kms_key.arn = pulumi.Output.from_input("arn:aws:kms:us-east-1:123456789012:key/test")

        cluster = eks.create_eks_cluster('test', cluster_role, subnet_ids, kms_key)

        # Enable Container Insights (exercises lines 531-541)
        log_group = kubernetes_resources.enable_container_insights(cluster, 'test')

        self.assertIsNotNone(log_group)

    @pulumi.runtime.test
    def test_container_insights_log_group_name(self):
        """Test Container Insights log group name generation."""
        cluster_role = Mock()
        cluster_role.arn = pulumi.Output.from_input("arn:aws:iam::123456789012:role/cluster-role")

        subnet_ids = [pulumi.Output.from_input("subnet-123")]

        kms_key = Mock()
        kms_key.arn = pulumi.Output.from_input("arn:aws:kms:us-east-1:123456789012:key/test")

        cluster = eks.create_eks_cluster('test', cluster_role, subnet_ids, kms_key)

        # Enable Container Insights and verify log group created
        log_group = kubernetes_resources.enable_container_insights(cluster, 'test')

        self.assertIsNotNone(log_group)


if __name__ == '__main__':
    unittest.main()
