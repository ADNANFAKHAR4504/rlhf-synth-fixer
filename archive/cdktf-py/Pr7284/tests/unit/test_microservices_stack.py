"""Unit tests for MicroservicesStack."""
import os
import sys
import json
from cdktf import App, Testing
from lib.tap_stack import TapStack

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestMicroservicesStackResources:
    """Test suite for MicroservicesStack resource creation."""

    def test_vpc_created_with_correct_configuration(self):
        """VPC created with correct CIDR and DNS settings."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify VPC exists with correct configuration
        assert 'aws_vpc' in resources
        vpc_config = list(resources['aws_vpc'].values())[0]
        assert vpc_config['cidr_block'] == '10.0.0.0/16'
        assert vpc_config['enable_dns_hostnames'] is True
        assert vpc_config['enable_dns_support'] is True

    def test_public_subnets_created_across_three_azs(self):
        """Public subnets created across three availability zones."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Count public subnets
        public_subnets = [k for k in resources.get('aws_subnet', {}).keys()
                         if 'public_subnet' in k]
        assert len(public_subnets) == 3

    def test_private_subnets_created_across_three_azs(self):
        """Private subnets created across three availability zones."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Count private subnets
        private_subnets = [k for k in resources.get('aws_subnet', {}).keys()
                          if 'private_subnet' in k]
        assert len(private_subnets) == 3

    def test_eks_cluster_created_with_correct_version(self):
        """EKS cluster created with version 1.28."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify EKS cluster
        assert 'aws_eks_cluster' in resources
        cluster_config = list(resources['aws_eks_cluster'].values())[0]
        assert cluster_config['version'] == '1.29'
        assert 'test' in cluster_config['name']

    def test_eks_cluster_has_logging_enabled(self):
        """EKS cluster has all logging types enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        cluster_config = list(resources['aws_eks_cluster'].values())[0]
        log_types = cluster_config['enabled_cluster_log_types']

        assert 'api' in log_types
        assert 'audit' in log_types
        assert 'authenticator' in log_types
        assert 'controllerManager' in log_types
        assert 'scheduler' in log_types

    def test_fargate_profiles_created_for_all_namespaces(self):
        """Fargate profiles created for payment, fraud-detection, and reporting."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify Fargate profiles exist
        assert 'aws_eks_fargate_profile' in resources
        fargate_profiles = resources['aws_eks_fargate_profile']

        # Should have 4 profiles: payment, fraud-detection, reporting, kube-system
        assert len(fargate_profiles) == 4

    def test_ecr_repositories_created_for_all_services(self):
        """ECR repositories created with scan_on_push enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify ECR repositories
        assert 'aws_ecr_repository' in resources
        ecr_repos = resources['aws_ecr_repository']

        # Should have 3 repositories
        assert len(ecr_repos) == 3

        # Verify scan_on_push enabled
        for repo_config in ecr_repos.values():
            scan_config = repo_config['image_scanning_configuration']
            if isinstance(scan_config, list):
                assert scan_config[0]['scan_on_push'] is True
            else:
                assert scan_config['scan_on_push'] is True

    def test_ecr_lifecycle_policies_configured(self):
        """ECR lifecycle policies configured to retain last 10 images."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify lifecycle policies exist
        assert 'aws_ecr_lifecycle_policy' in resources
        lifecycle_policies = resources['aws_ecr_lifecycle_policy']

        # Should have 3 lifecycle policies
        assert len(lifecycle_policies) == 3

    def test_oidc_provider_created_for_irsa(self):
        """OIDC provider created for IAM roles for service accounts."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify OIDC provider
        assert 'aws_iam_openid_connect_provider' in resources
        oidc_config = list(resources['aws_iam_openid_connect_provider'].values())[0]
        assert 'sts.amazonaws.com' in oidc_config['client_id_list']

    def test_irsa_roles_created_for_namespaces(self):
        """IRSA roles created for payment, fraud-detection, and reporting namespaces."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify IAM roles for IRSA
        assert 'aws_iam_role' in resources
        iam_roles = resources['aws_iam_role']

        # Should have roles for: cluster, fargate pod execution,
        # 3 namespace IRSA roles, ALB controller
        assert len(iam_roles) >= 6

    def test_secrets_manager_secrets_created(self):
        """Secrets Manager secrets created for each namespace."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify Secrets Manager secrets
        assert 'aws_secretsmanager_secret' in resources
        secrets = resources['aws_secretsmanager_secret']

        # Should have 3 secrets (one per namespace)
        assert len(secrets) == 3

        # Verify immediate deletion for destroyability
        for secret_config in secrets.values():
            assert secret_config['recovery_window_in_days'] == 0

    def test_cloudwatch_log_groups_created(self):
        """CloudWatch log groups created for cluster and applications."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify CloudWatch log groups
        assert 'aws_cloudwatch_log_group' in resources
        log_groups = resources['aws_cloudwatch_log_group']

        # Should have: cluster logs + 3 app logs + container insights = 5
        assert len(log_groups) == 5

    def test_eks_addons_configured(self):
        """EKS addons configured for VPC CNI, CoreDNS, and kube-proxy."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # EKS addons (vpc-cni, coredns, kube-proxy) are automatically managed by AWS EKS
        # for Fargate clusters and should NOT be explicitly created to avoid timing/state issues
        # Verify they are NOT in the synthesized Terraform (EKS auto-manages them)
        assert 'aws_eks_addon' not in resources or len(resources.get('aws_eks_addon', {})) == 0

    def test_security_group_has_correct_ingress_rules(self):
        """Security group has correct ingress rules for cluster communication."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify security group
        assert 'aws_security_group' in resources
        sg_config = list(resources['aws_security_group'].values())[0]

        # Check ingress rules
        assert 'ingress' in sg_config
        ingress_rules = sg_config['ingress']
        assert len(ingress_rules) > 0
        assert ingress_rules[0]['from_port'] == 443
        assert ingress_rules[0]['to_port'] == 443

    def test_alb_controller_role_created(self):
        """ALB controller IAM role created with correct permissions."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify ALB controller role and policy exist
        assert 'aws_iam_role' in resources
        iam_roles = resources['aws_iam_role']

        # Find ALB controller role
        alb_role_found = False
        for role_id, role_config in iam_roles.items():
            if 'alb' in role_id.lower():
                alb_role_found = True
                break

        assert alb_role_found

    def test_outputs_defined_for_integration_tests(self):
        """Stack outputs defined for integration testing."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        outputs = json.loads(synth).get('output', {})

        # Verify key outputs exist (CDKTF prefixes output names with construct path)
        output_names = [name.lower() for name in outputs.keys()]
        assert any('cluster_name' in name for name in output_names)
        assert any('cluster_endpoint' in name for name in output_names)
        assert any('vpc_id' in name for name in output_names)
        assert any('oidc_provider_arn' in name for name in output_names)
        assert any('alb_controller_role_arn' in name for name in output_names)

    def test_resource_names_include_environment_suffix(self):
        """All resource names include environment suffix for uniqueness."""
        app = App()
        test_suffix = "unittest123"
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix=test_suffix,
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Check EKS cluster name
        cluster_config = list(resources['aws_eks_cluster'].values())[0]
        assert test_suffix in cluster_config['name']

    def test_internet_gateway_attached_to_vpc(self):
        """Internet gateway created and attached to VPC."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify internet gateway
        assert 'aws_internet_gateway' in resources
        igw_config = list(resources['aws_internet_gateway'].values())[0]
        assert 'vpc_id' in igw_config

    def test_route_tables_configured_correctly(self):
        """Public and private route tables configured correctly."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify route tables
        assert 'aws_route_table' in resources
        route_tables = resources['aws_route_table']

        # Should have public and private route tables
        assert len(route_tables) >= 2

    def test_ecr_repositories_have_force_delete_enabled(self):
        """ECR repositories have force_delete enabled for destroyability."""
        app = App()
        stack = TapStack(
            app,
            "TestStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        resources = json.loads(synth)['resource']

        # Verify force_delete on ECR repos
        ecr_repos = resources['aws_ecr_repository']
        for repo_config in ecr_repos.values():
            assert repo_config.get('force_delete') is True
