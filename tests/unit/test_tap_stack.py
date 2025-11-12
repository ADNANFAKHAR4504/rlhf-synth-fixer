"""Comprehensive unit tests for TAP Stack - EKS Fargate Infrastructure."""
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestStackInstantiation:
    """Test suite for Stack Instantiation."""

    def test_tap_stack_instantiates_with_default_values(self):
        """Test that TapStack instantiates successfully with default values."""
        app = App()
        stack = TapStack(app, "TestStack")

        # Verify stack instantiates
        assert stack is not None

        # Get synthesized output
        synth = Testing.synth(stack)
        assert synth is not None

    def test_tap_stack_instantiates_with_custom_props(self):
        """Test that TapStack instantiates successfully with custom properties."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1",
            state_bucket="test-bucket",
            state_bucket_region="us-west-2",
            default_tags={"tags": {"Environment": "test"}}
        )

        # Verify stack instantiates
        assert stack is not None

        # Get synthesized output
        synth = Testing.synth(stack)
        assert synth is not None


class TestVPCResources:
    """Test suite for VPC Resources."""

    def test_vpc_configuration(self):
        """Test VPC is created with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify VPC exists
        assert "aws_vpc" in resources
        vpc_resources = resources["aws_vpc"]

        # Find the VPC resource
        vpc_key = list(vpc_resources.keys())[0]
        vpc = vpc_resources[vpc_key]

        # Verify VPC configuration
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True
        assert "tags" in vpc
        assert "test" in vpc["tags"]["Name"]

    def test_internet_gateway_configuration(self):
        """Test Internet Gateway is created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify IGW exists
        assert "aws_internet_gateway" in resources

    def test_private_subnets_created(self):
        """Test that 3 private subnets are created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify subnets exist
        assert "aws_subnet" in resources
        subnets = resources["aws_subnet"]

        # Count private subnets
        private_subnets = [k for k in subnets.keys() if "private" in k]
        assert len(private_subnets) == 3

        # Verify first private subnet configuration
        first_private = subnets[private_subnets[0]]
        assert first_private["cidr_block"] == "10.0.1.0/24"
        assert first_private["map_public_ip_on_launch"] is False

    def test_public_subnets_created(self):
        """Test that 3 public subnets are created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify subnets exist
        assert "aws_subnet" in resources
        subnets = resources["aws_subnet"]

        # Count public subnets
        public_subnets = [k for k in subnets.keys() if "public" in k]
        assert len(public_subnets) == 3

        # Verify first public subnet configuration
        first_public = subnets[public_subnets[0]]
        assert first_public["cidr_block"] == "10.0.10.0/24"
        assert first_public["map_public_ip_on_launch"] is True

    def test_nat_gateways_created(self):
        """Test that 3 NAT Gateways are created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify NAT Gateways exist
        assert "aws_nat_gateway" in resources
        nat_gateways = resources["aws_nat_gateway"]
        assert len(nat_gateways) == 3

    def test_elastic_ips_created(self):
        """Test that 3 Elastic IPs are created for NAT Gateways."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify EIPs exist
        assert "aws_eip" in resources
        eips = resources["aws_eip"]
        assert len(eips) == 3

        # Verify EIP configuration
        first_eip_key = list(eips.keys())[0]
        assert eips[first_eip_key]["domain"] == "vpc"

    def test_route_tables_configured(self):
        """Test that route tables are created and configured."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify route tables exist
        assert "aws_route_table" in resources
        route_tables = resources["aws_route_table"]

        # Should have 1 public + 3 private = 4 route tables
        assert len(route_tables) >= 4

    def test_route_table_associations_created(self):
        """Test that route table associations are created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify route table associations exist
        assert "aws_route_table_association" in resources
        associations = resources["aws_route_table_association"]

        # Should have 3 public + 3 private = 6 associations
        assert len(associations) == 6


class TestSecurityResources:
    """Test suite for Security Resources."""

    def test_kms_key_created(self):
        """Test KMS key is created with proper configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify KMS key exists
        assert "aws_kms_key" in resources
        kms_keys = resources["aws_kms_key"]

        # Verify KMS configuration
        kms_key_id = list(kms_keys.keys())[0]
        kms_key = kms_keys[kms_key_id]
        assert kms_key["enable_key_rotation"] is True
        assert "policy" in kms_key

    def test_kms_alias_created(self):
        """Test KMS alias is created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify KMS alias exists
        assert "aws_kms_alias" in resources
        aliases = resources["aws_kms_alias"]

        # Verify alias name
        alias_key = list(aliases.keys())[0]
        assert "alias/eks-cluster-test" == aliases[alias_key]["name"]

    def test_security_group_created(self):
        """Test security group is created for EKS cluster."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify security group exists
        assert "aws_security_group" in resources
        security_groups = resources["aws_security_group"]

        # Verify security group configuration
        sg_key = list(security_groups.keys())[0]
        sg = security_groups[sg_key]
        assert "EKS cluster security group" in sg["description"]
        assert "egress" in sg


class TestIAMResources:
    """Test suite for IAM Resources."""

    def test_eks_cluster_role_created(self):
        """Test EKS cluster IAM role is created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify IAM role exists
        assert "aws_iam_role" in resources
        roles = resources["aws_iam_role"]

        # Find EKS cluster role
        cluster_role = None
        for key, role in roles.items():
            if "eks-cluster-role" in key:
                cluster_role = role
                break

        assert cluster_role is not None
        assert "assume_role_policy" in cluster_role

    def test_fargate_execution_roles_created(self):
        """Test Fargate execution roles are created for prod and dev."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify IAM roles exist
        assert "aws_iam_role" in resources
        roles = resources["aws_iam_role"]

        # Find Fargate roles
        fargate_roles = [k for k in roles.keys() if "fargate" in k]
        assert len(fargate_roles) >= 2  # At least prod and dev roles

    def test_iam_role_policy_attachments_created(self):
        """Test IAM role policy attachments are created."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify policy attachments exist
        assert "aws_iam_role_policy_attachment" in resources
        attachments = resources["aws_iam_role_policy_attachment"]

        # Should have multiple attachments (cluster policies + Fargate policies)
        assert len(attachments) >= 4

    def test_oidc_provider_created(self):
        """Test OIDC provider is created for IRSA."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify OIDC provider exists
        assert "aws_iam_openid_connect_provider" in resources
        oidc_providers = resources["aws_iam_openid_connect_provider"]

        # Verify OIDC configuration
        oidc_key = list(oidc_providers.keys())[0]
        oidc = oidc_providers[oidc_key]
        assert "client_id_list" in oidc
        assert "sts.amazonaws.com" in oidc["client_id_list"]


class TestEKSResources:
    """Test suite for EKS Resources."""

    def test_eks_cluster_created(self):
        """Test EKS cluster is created with proper configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify EKS cluster exists
        assert "aws_eks_cluster" in resources
        clusters = resources["aws_eks_cluster"]

        # Verify cluster configuration
        cluster_key = list(clusters.keys())[0]
        cluster = clusters[cluster_key]
        assert cluster["version"] == "1.29"
        assert "vpc_config" in cluster
        assert cluster["vpc_config"]["endpoint_private_access"] is True

    def test_eks_cluster_logging_enabled(self):
        """Test EKS cluster has all logging enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify cluster logging
        clusters = resources["aws_eks_cluster"]
        cluster_key = list(clusters.keys())[0]
        cluster = clusters[cluster_key]

        # Verify all log types are enabled
        log_types = cluster["enabled_cluster_log_types"]
        expected_logs = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
        for log_type in expected_logs:
            assert log_type in log_types

    def test_fargate_profiles_created(self):
        """Test Fargate profiles are created for system, prod, and dev."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify Fargate profiles exist
        assert "aws_eks_fargate_profile" in resources
        profiles = resources["aws_eks_fargate_profile"]

        # Should have 3 profiles: system, prod, dev
        assert len(profiles) == 3

    def test_fargate_profile_selectors_configured(self):
        """Test Fargate profile selectors are properly configured."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify profile selectors
        profiles = resources["aws_eks_fargate_profile"]

        # Find system profile
        system_profile = None
        for key, profile in profiles.items():
            if "system" in key:
                system_profile = profile
                break

        assert system_profile is not None
        assert "selector" in system_profile
        assert system_profile["selector"][0]["namespace"] == "kube-system"

    def test_eks_addons_installed(self):
        """Test EKS addons are installed (VPC CNI, CoreDNS, kube-proxy)."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify addons exist
        assert "aws_eks_addon" in resources
        addons = resources["aws_eks_addon"]

        # Should have 3 addons
        assert len(addons) == 3

        # Verify addon names
        addon_names = [addon["addon_name"] for addon in addons.values()]
        assert "vpc-cni" in addon_names
        assert "coredns" in addon_names
        assert "kube-proxy" in addon_names

    def test_vpc_cni_addon_configuration(self):
        """Test VPC CNI addon has proper configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Find VPC CNI addon
        addons = resources["aws_eks_addon"]
        vpc_cni_addon = None
        for addon in addons.values():
            if addon["addon_name"] == "vpc-cni":
                vpc_cni_addon = addon
                break

        assert vpc_cni_addon is not None
        assert "configuration_values" in vpc_cni_addon

        # Verify configuration
        config = json.loads(vpc_cni_addon["configuration_values"])
        assert "env" in config
        assert config["env"]["ENABLE_POD_ENI"] == "true"

    def test_coredns_addon_dependencies(self):
        """Test CoreDNS addon has dependency on Fargate profile."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Find CoreDNS addon
        addons = resources["aws_eks_addon"]
        coredns_addon = None
        for addon in addons.values():
            if addon["addon_name"] == "coredns":
                coredns_addon = addon
                break

        assert coredns_addon is not None
        assert "depends_on" in coredns_addon


class TestLoggingResources:
    """Test suite for Logging Resources."""

    def test_cloudwatch_log_group_created(self):
        """Test CloudWatch log group is created for EKS."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify log group exists
        assert "aws_cloudwatch_log_group" in resources
        log_groups = resources["aws_cloudwatch_log_group"]

        # Verify log group configuration
        lg_key = list(log_groups.keys())[0]
        log_group = log_groups[lg_key]
        assert "/aws/eks" in log_group["name"]
        assert log_group["retention_in_days"] == 7


class TestOutputs:
    """Test suite for Stack Outputs."""

    def test_outputs_defined(self):
        """Test that all required outputs are defined."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        outputs = json.loads(synth)["output"]

        # Verify required outputs exist
        assert "vpc_id" in outputs
        assert "eks_cluster_name" in outputs
        assert "eks_cluster_endpoint" in outputs
        assert "eks_cluster_version" in outputs
        assert "fargate_profile_prod_id" in outputs
        assert "fargate_profile_dev_id" in outputs
        assert "oidc_provider_arn" in outputs

    def test_output_descriptions(self):
        """Test that outputs have descriptions."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        outputs = json.loads(synth)["output"]

        # Verify outputs have descriptions
        for output_name, output_config in outputs.items():
            assert "description" in output_config


class TestBackendConfiguration:
    """Test suite for Backend Configuration."""

    def test_s3_backend_configured(self):
        """Test S3 backend is configured properly."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1",
            state_bucket="test-bucket",
            state_bucket_region="us-west-2"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        terraform_config = json.loads(synth)["terraform"]

        # Verify backend configuration
        assert "backend" in terraform_config
        assert "s3" in terraform_config["backend"]

        backend = terraform_config["backend"]["s3"]
        assert backend["bucket"] == "test-bucket"
        assert backend["region"] == "us-west-2"
        assert backend["encrypt"] is True
        assert "test" in backend["key"]


class TestProviderConfiguration:
    """Test suite for Provider Configuration."""

    def test_aws_provider_configured(self):
        """Test AWS provider is configured with correct region."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        providers = json.loads(synth)["provider"]

        # Verify AWS provider configuration
        assert "aws" in providers
        aws_config = providers["aws"][0]
        assert aws_config["region"] == "ap-southeast-1"

    def test_aws_provider_default_tags(self):
        """Test AWS provider has default tags configured."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1",
            default_tags={"tags": {"Environment": "test", "Managed": "CDKTF"}}
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        providers = json.loads(synth)["provider"]

        # Verify default tags
        aws_config = providers["aws"][0]
        assert "default_tags" in aws_config


class TestResourceNaming:
    """Test suite for Resource Naming Conventions."""

    def test_resources_include_environment_suffix(self):
        """Test that all resources include environment suffix in their names."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="testenv",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Check that key resources have environment suffix in tags/names
        if "aws_vpc" in resources:
            vpc = list(resources["aws_vpc"].values())[0]
            assert "testenv" in vpc["tags"]["Name"]

        if "aws_eks_cluster" in resources:
            cluster = list(resources["aws_eks_cluster"].values())[0]
            assert "testenv" in cluster["name"]

    def test_fargate_profiles_naming(self):
        """Test Fargate profiles have correct naming convention."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="testenv",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Verify Fargate profile names
        profiles = resources["aws_eks_fargate_profile"]
        for profile in profiles.values():
            assert "testenv" in profile["fargate_profile_name"]


class TestDataSources:
    """Test suite for Data Sources."""

    def test_caller_identity_data_source(self):
        """Test that AWS caller identity data source is used."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        data_sources = json.loads(synth)["data"]

        # Verify caller identity data source exists
        assert "aws_caller_identity" in data_sources


class TestAvailabilityZones:
    """Test suite for Availability Zone Configuration."""

    def test_resources_span_three_azs(self):
        """Test that resources are created across 3 availability zones."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="ap-southeast-1"
        )

        # Synthesize stack
        synth = Testing.synth(stack)
        resources = json.loads(synth)["resource"]

        # Count subnets per type
        subnets = resources["aws_subnet"]
        private_subnets = [k for k in subnets.keys() if "private" in k]
        public_subnets = [k for k in subnets.keys() if "public" in k]

        # Should have 3 of each
        assert len(private_subnets) == 3
        assert len(public_subnets) == 3

        # Verify AZs are different
        private_azs = set()
        for subnet_key in private_subnets:
            subnet = subnets[subnet_key]
            private_azs.add(subnet["availability_zone"])

        assert len(private_azs) == 3


class TestErrorHandling:
    """Test suite for Error Handling and Edge Cases."""

    def test_stack_with_empty_suffix(self):
        """Test stack handles empty environment suffix gracefully."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="",
            aws_region="ap-southeast-1"
        )

        # Should still instantiate
        assert stack is not None

    def test_stack_with_minimal_config(self):
        """Test stack with only required configuration."""
        app = App()
        stack = TapStack(app, "MinimalStack")

        # Synthesize should succeed
        synth = Testing.synth(stack)
        assert synth is not None

    def test_stack_with_all_optional_params(self):
        """Test stack with all optional parameters provided."""
        app = App()
        stack = TapStack(
            app,
            "FullStack",
            environment_suffix="full",
            aws_region="us-west-2",
            state_bucket="custom-bucket",
            state_bucket_region="us-east-1",
            default_tags={"tags": {"Project": "Test", "Owner": "QA"}}
        )

        # Synthesize should succeed
        synth = Testing.synth(stack)
        assert synth is not None
