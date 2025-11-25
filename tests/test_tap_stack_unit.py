"""
Unit tests for Terraform loan processing application infrastructure.

This test suite validates the Terraform configuration without deploying resources.
Tests cover:
- Configuration syntax and structure
- Resource naming conventions with environment_suffix
- Security group rules
- IAM policies
- S3 bucket configurations
- VPC and subnet configurations
- Resource tagging
"""

import json
import os
import re
import unittest
from pathlib import Path


class TestTerraformConfiguration(unittest.TestCase):
    """Test Terraform configuration structure and syntax."""

    @classmethod
    def setUpClass(cls):
        """Load Terraform configuration files."""
        cls.lib_dir = Path(__file__).parent.parent / "lib"
        cls.tf_files = {}

        # Load all .tf files
        for tf_file in cls.lib_dir.glob("*.tf"):
            with open(tf_file, 'r') as f:
                cls.tf_files[tf_file.name] = f.read()

    def test_all_terraform_files_exist(self):
        """Verify all required Terraform files exist."""
        required_files = [
            'main.tf', 'variables.tf', 'outputs.tf', 'vpc.tf', 'security-groups.tf',
            'iam.tf', 'rds.tf', 's3.tf', 'alb.tf', 'asg.tf', 'cloudfront.tf',
            'waf.tf', 'cloudwatch.tf', 'eventbridge.tf', 'kms.tf'
        ]

        existing_files = list(self.tf_files.keys())

        for required_file in required_files:
            self.assertIn(
                required_file,
                existing_files,
                f"Required file {required_file} not found"
            )

    def test_provider_configuration(self):
        """Verify AWS provider is correctly configured."""
        main_tf = self.tf_files.get('main.tf', '')

        # Check provider block exists
        self.assertIn('provider "aws"', main_tf)

        # Check default tags are configured
        self.assertIn('default_tags', main_tf)
        self.assertIn('EnvironmentSuffix', main_tf)

    def test_required_variables_defined(self):
        """Verify all required variables are defined."""
        variables_tf = self.tf_files.get('variables.tf', '')

        required_variables = [
            'environment_suffix', 'aws_region', 'vpc_cidr', 'availability_zones',
            'db_master_username', 'instance_types', 'min_capacity', 'max_capacity',
            'desired_capacity', 'logs_retention_days', 'documents_retention_days',
            'documents_glacier_days', 'tags'
        ]

        for var in required_variables:
            self.assertIn(
                f'variable "{var}"',
                variables_tf,
                f"Required variable {var} not defined"
            )

    def test_environment_suffix_in_resource_names(self):
        """Verify environment_suffix is used in resource naming."""
        # Resources that must include environment_suffix
        resources_requiring_suffix = [
            ('aws_vpc', 'main'),
            ('aws_s3_bucket', 'logs'),
            ('aws_s3_bucket', 'documents'),
            ('aws_s3_bucket', 'static_assets'),
            ('aws_rds_cluster', 'aurora'),
            ('aws_lb', 'main'),
            ('aws_kms_key', 'main'),
            ('aws_wafv2_web_acl', 'alb'),
        ]

        for resource_type, resource_name in resources_requiring_suffix:
            found = False
            for file_content in self.tf_files.values():
                if f'resource "{resource_type}" "{resource_name}"' in file_content:
                    # Check for environment_suffix variable usage in resource
                    lines_after_resource = file_content.split(
                        f'resource "{resource_type}" "{resource_name}"'
                    )[1].split('}')[0]

                    if 'environment_suffix' in lines_after_resource.lower():
                        found = True
                        break

            self.assertTrue(
                found,
                f"Resource {resource_type}.{resource_name} should use environment_suffix"
            )


class TestIAMConfiguration(unittest.TestCase):
    """Test IAM roles, policies, and permissions."""

    @classmethod
    def setUpClass(cls):
        """Load IAM configuration."""
        cls.iam_tf = (Path(__file__).parent.parent / "lib" / "iam.tf").read_text()

    def test_ec2_iam_role_exists(self):
        """Verify EC2 IAM role is defined."""
        self.assertIn('resource "aws_iam_role" "ec2"', self.iam_tf)
        self.assertIn('ec2.amazonaws.com', self.iam_tf)

    def test_ec2_role_name_length_valid(self):
        """Verify IAM role name_prefix is within AWS limits."""
        # AWS IAM role name limit: 38 characters for name_prefix
        # With environment_suffix = "synthz4a8u2v3" (13 chars)

        role_patterns = [
            r'name_prefix\s*=\s*"([^"]+)\$\{var\.environment_suffix\}-"',
        ]

        for pattern in role_patterns:
            matches = re.findall(pattern, self.iam_tf)
            for match in matches:
                # Calculate max length: prefix + 13 (env suffix) + 1 (dash) = should be <= 38
                max_length = len(match) + 13 + 1
                self.assertLessEqual(
                    max_length,
                    38,
                    f"IAM role name_prefix '{match}' with environment_suffix exceeds 38 character limit"
                )

    def test_ec2_policy_permissions(self):
        """Verify EC2 IAM policy has required permissions."""
        required_permissions = [
            's3:GetObject',
            's3:PutObject',
            'logs:CreateLogGroup',
            'logs:PutLogEvents',
            'rds-db:connect',
            'cloudwatch:PutMetricData',
            'kms:Decrypt',
            'kms:Encrypt'
        ]

        for permission in required_permissions:
            self.assertIn(
                permission,
                self.iam_tf,
                f"EC2 IAM policy missing {permission} permission"
            )

    def test_instance_profile_exists(self):
        """Verify EC2 instance profile is created."""
        self.assertIn('resource "aws_iam_instance_profile" "ec2"', self.iam_tf)


class TestVPCConfiguration(unittest.TestCase):
    """Test VPC, subnets, and networking configuration."""

    @classmethod
    def setUpClass(cls):
        """Load VPC configuration."""
        cls.vpc_tf = (Path(__file__).parent.parent / "lib" / "vpc.tf").read_text()

    def test_vpc_exists(self):
        """Verify VPC resource is defined."""
        self.assertIn('resource "aws_vpc" "main"', self.vpc_tf)

    def test_vpc_dns_enabled(self):
        """Verify VPC DNS is enabled."""
        self.assertIn('enable_dns_hostnames = true', self.vpc_tf)
        self.assertIn('enable_dns_support   = true', self.vpc_tf)

    def test_internet_gateway_exists(self):
        """Verify Internet Gateway is created."""
        self.assertIn('resource "aws_internet_gateway" "main"', self.vpc_tf)

    def test_public_subnets_count(self):
        """Verify 3 public subnets are created."""
        public_subnet_count = self.vpc_tf.count('resource "aws_subnet" "public"')
        self.assertEqual(public_subnet_count, 1, "Should have 1 public subnet resource block")
        self.assertIn('count                   = 3', self.vpc_tf)

    def test_private_subnets_count(self):
        """Verify 3 private subnets are created."""
        private_subnet_count = self.vpc_tf.count('resource "aws_subnet" "private"')
        self.assertEqual(private_subnet_count, 1, "Should have 1 private subnet resource block")
        self.assertIn('count             = 3', self.vpc_tf)

    def test_nat_gateway_exists(self):
        """Verify NAT Gateway is created."""
        self.assertIn('resource "aws_nat_gateway" "main"', self.vpc_tf)
        self.assertIn('resource "aws_eip" "nat"', self.vpc_tf)

    def test_route_tables_exist(self):
        """Verify public and private route tables are created."""
        self.assertIn('resource "aws_route_table" "public"', self.vpc_tf)
        self.assertIn('resource "aws_route_table" "private"', self.vpc_tf)


class TestSecurityGroups(unittest.TestCase):
    """Test security group configurations."""

    @classmethod
    def setUpClass(cls):
        """Load security groups configuration."""
        cls.sg_tf = (Path(__file__).parent.parent / "lib" / "security-groups.tf").read_text()

    def test_alb_security_group_exists(self):
        """Verify ALB security group is created."""
        self.assertIn('resource "aws_security_group" "alb"', self.sg_tf)

    def test_alb_allows_https(self):
        """Verify ALB security group allows HTTPS."""
        alb_sg_section = self.sg_tf.split('resource "aws_security_group" "alb"')[1].split('resource')[0]
        self.assertIn('from_port   = 443', alb_sg_section)
        self.assertIn('to_port     = 443', alb_sg_section)

    def test_alb_allows_http(self):
        """Verify ALB security group allows HTTP."""
        alb_sg_section = self.sg_tf.split('resource "aws_security_group" "alb"')[1].split('resource')[0]
        self.assertIn('from_port   = 80', alb_sg_section)
        self.assertIn('to_port     = 80', alb_sg_section)

    def test_ec2_security_group_exists(self):
        """Verify EC2 security group is created."""
        self.assertIn('resource "aws_security_group" "ec2"', self.sg_tf)

    def test_ec2_allows_traffic_from_alb_only(self):
        """Verify EC2 security group only allows traffic from ALB."""
        ec2_sg_section = self.sg_tf.split('resource "aws_security_group" "ec2"')[1].split('resource')[0]
        self.assertIn('security_groups = [aws_security_group.alb.id]', ec2_sg_section)
        # Should NOT allow traffic from 0.0.0.0/0
        self.assertNotIn('cidr_blocks = ["0.0.0.0/0"]', ec2_sg_section.split('ingress')[1].split('egress')[0])

    def test_aurora_security_group_exists(self):
        """Verify Aurora security group is created."""
        self.assertIn('resource "aws_security_group" "aurora"', self.sg_tf)

    def test_aurora_allows_postgresql_from_ec2(self):
        """Verify Aurora security group allows PostgreSQL from EC2."""
        aurora_sg_section = self.sg_tf.split('resource "aws_security_group" "aurora"')[1]
        self.assertIn('from_port       = 5432', aurora_sg_section)
        self.assertIn('to_port         = 5432', aurora_sg_section)
        self.assertIn('security_groups = [aws_security_group.ec2.id]', aurora_sg_section)


class TestRDSConfiguration(unittest.TestCase):
    """Test RDS Aurora configuration."""

    @classmethod
    def setUpClass(cls):
        """Load RDS configuration."""
        cls.rds_tf = (Path(__file__).parent.parent / "lib" / "rds.tf").read_text()

    def test_aurora_cluster_exists(self):
        """Verify Aurora cluster is defined."""
        self.assertIn('resource "aws_rds_cluster" "aurora"', self.rds_tf)

    def test_aurora_engine_postgresql(self):
        """Verify Aurora uses PostgreSQL engine."""
        self.assertIn('engine             = "aurora-postgresql"', self.rds_tf)
        self.assertIn('engine_mode        = "provisioned"', self.rds_tf)

    def test_aurora_serverless_v2_scaling(self):
        """Verify Aurora Serverless v2 scaling is configured."""
        self.assertIn('serverlessv2_scaling_configuration', self.rds_tf)
        self.assertIn('max_capacity = 1.0', self.rds_tf)
        self.assertIn('min_capacity = 0.5', self.rds_tf)

    def test_aurora_encryption_enabled(self):
        """Verify Aurora encryption is enabled."""
        self.assertIn('storage_encrypted = true', self.rds_tf)
        self.assertIn('kms_key_id        = aws_kms_key.main.arn', self.rds_tf)

    def test_aurora_iam_auth_enabled(self):
        """Verify IAM database authentication is enabled."""
        self.assertIn('iam_database_authentication_enabled = true', self.rds_tf)

    def test_aurora_backup_configured(self):
        """Verify Aurora backup is configured."""
        self.assertIn('backup_retention_period', self.rds_tf)
        self.assertRegex(self.rds_tf, r'backup_retention_period\s*=\s*\d+')

    def test_aurora_deletion_protection_disabled(self):
        """Verify deletion protection is disabled for testing."""
        self.assertIn('deletion_protection = false', self.rds_tf)

    def test_aurora_skip_final_snapshot(self):
        """Verify skip_final_snapshot is enabled for testing."""
        self.assertIn('skip_final_snapshot = true', self.rds_tf)

    def test_db_subnet_group_exists(self):
        """Verify DB subnet group is created."""
        self.assertIn('resource "aws_db_subnet_group" "aurora"', self.rds_tf)
        self.assertIn('subnet_ids  = aws_subnet.private[*].id', self.rds_tf)


class TestS3Configuration(unittest.TestCase):
    """Test S3 bucket configurations."""

    @classmethod
    def setUpClass(cls):
        """Load S3 configuration."""
        cls.s3_tf = (Path(__file__).parent.parent / "lib" / "s3.tf").read_text()

    def test_logs_bucket_exists(self):
        """Verify logs S3 bucket is created."""
        self.assertIn('resource "aws_s3_bucket" "logs"', self.s3_tf)

    def test_documents_bucket_exists(self):
        """Verify documents S3 bucket is created."""
        self.assertIn('resource "aws_s3_bucket" "documents"', self.s3_tf)

    def test_static_assets_bucket_exists(self):
        """Verify static assets S3 bucket is created."""
        self.assertIn('resource "aws_s3_bucket" "static_assets"', self.s3_tf)

    def test_s3_encryption_enabled(self):
        """Verify S3 buckets have encryption enabled."""
        encryption_configs = self.s3_tf.count('aws_s3_bucket_server_side_encryption_configuration')
        self.assertGreaterEqual(encryption_configs, 3, "All 3 buckets should have encryption")

        # Verify KMS encryption
        self.assertIn('sse_algorithm     = "aws:kms"', self.s3_tf)
        self.assertIn('kms_master_key_id = aws_kms_key.main.arn', self.s3_tf)

    def test_s3_versioning_enabled(self):
        """Verify S3 buckets have versioning enabled."""
        versioning_configs = self.s3_tf.count('aws_s3_bucket_versioning')
        self.assertGreaterEqual(versioning_configs, 2, "At least 2 buckets should have versioning")

    def test_s3_public_access_blocked(self):
        """Verify S3 buckets block public access."""
        public_access_blocks = self.s3_tf.count('aws_s3_bucket_public_access_block')
        self.assertGreaterEqual(public_access_blocks, 3, "All 3 buckets should block public access")

        self.assertIn('block_public_acls       = true', self.s3_tf)
        self.assertIn('block_public_policy     = true', self.s3_tf)
        self.assertIn('ignore_public_acls      = true', self.s3_tf)
        self.assertIn('restrict_public_buckets = true', self.s3_tf)

    def test_logs_lifecycle_policy(self):
        """Verify logs bucket has lifecycle policy."""
        logs_lifecycle = 'resource "aws_s3_bucket_lifecycle_configuration" "logs"'
        self.assertIn(logs_lifecycle, self.s3_tf)
        self.assertIn('expire-old-logs', self.s3_tf)

    def test_documents_lifecycle_policy(self):
        """Verify documents bucket has lifecycle policy with Glacier transition."""
        docs_lifecycle = 'resource "aws_s3_bucket_lifecycle_configuration" "documents"'
        self.assertIn(docs_lifecycle, self.s3_tf)
        self.assertIn('transition-to-glacier', self.s3_tf)
        self.assertIn('storage_class = "GLACIER"', self.s3_tf)


class TestALBConfiguration(unittest.TestCase):
    """Test Application Load Balancer configuration."""

    @classmethod
    def setUpClass(cls):
        """Load ALB configuration."""
        cls.alb_tf = (Path(__file__).parent.parent / "lib" / "alb.tf").read_text()

    def test_alb_exists(self):
        """Verify Application Load Balancer is created."""
        self.assertIn('resource "aws_lb" "main"', self.alb_tf)

    def test_alb_type_application(self):
        """Verify ALB type is application."""
        self.assertIn('load_balancer_type = "application"', self.alb_tf)

    def test_alb_deletion_protection_disabled(self):
        """Verify deletion protection is disabled for testing."""
        self.assertIn('enable_deletion_protection = false', self.alb_tf)

    def test_alb_target_groups_exist(self):
        """Verify ALB target groups are created."""
        self.assertIn('resource "aws_lb_target_group" "app"', self.alb_tf)
        self.assertIn('resource "aws_lb_target_group" "api"', self.alb_tf)

    def test_alb_health_checks_configured(self):
        """Verify health checks are configured."""
        health_checks = self.alb_tf.count('health_check')
        self.assertGreaterEqual(health_checks, 2, "Both target groups should have health checks")

    def test_alb_listener_exists(self):
        """Verify ALB listener is created."""
        self.assertIn('resource "aws_lb_listener" "http"', self.alb_tf)

    def test_alb_path_routing_configured(self):
        """Verify path-based routing is configured."""
        self.assertIn('resource "aws_lb_listener_rule" "api"', self.alb_tf)
        self.assertIn('path_pattern', self.alb_tf)
        self.assertIn('/api/*', self.alb_tf)


class TestAutoScalingConfiguration(unittest.TestCase):
    """Test Auto Scaling Group configuration."""

    @classmethod
    def setUpClass(cls):
        """Load ASG configuration."""
        cls.asg_tf = (Path(__file__).parent.parent / "lib" / "asg.tf").read_text()

    def test_launch_template_exists(self):
        """Verify launch template is created."""
        self.assertIn('resource "aws_launch_template" "main"', self.asg_tf)

    def test_launch_template_uses_latest_ami(self):
        """Verify launch template uses Amazon Linux 2023 AMI."""
        self.assertIn('image_id      = data.aws_ami.amazon_linux_2023.id', self.asg_tf)

    def test_launch_template_ebs_encrypted(self):
        """Verify EBS volumes are encrypted."""
        self.assertIn('encrypted             = true', self.asg_tf)
        self.assertIn('kms_key_id            = aws_kms_key.main.arn', self.asg_tf)

    def test_launch_template_imdsv2_enforced(self):
        """Verify IMDSv2 is enforced."""
        self.assertIn('http_tokens                 = "required"', self.asg_tf)

    def test_asg_exists(self):
        """Verify Auto Scaling Group is created."""
        self.assertIn('resource "aws_autoscaling_group" "main"', self.asg_tf)

    def test_asg_mixed_instances_policy(self):
        """Verify mixed instances policy is configured."""
        self.assertIn('mixed_instances_policy', self.asg_tf)

    def test_asg_spot_instances_configured(self):
        """Verify spot instances are configured (20% minimum)."""
        self.assertIn('on_demand_percentage_above_base_capacity = 80', self.asg_tf)

    def test_asg_scaling_policies_exist(self):
        """Verify CPU and memory scaling policies exist."""
        self.assertIn('resource "aws_autoscaling_policy" "cpu"', self.asg_tf)
        self.assertIn('resource "aws_autoscaling_policy" "memory"', self.asg_tf)

    def test_asg_target_tracking_configured(self):
        """Verify target tracking scaling is configured."""
        self.assertIn('policy_type            = "TargetTrackingScaling"', self.asg_tf)
        self.assertIn('target_value', self.asg_tf)


class TestCloudFrontConfiguration(unittest.TestCase):
    """Test CloudFront distribution configuration."""

    @classmethod
    def setUpClass(cls):
        """Load CloudFront configuration."""
        cls.cf_tf = (Path(__file__).parent.parent / "lib" / "cloudfront.tf").read_text()

    def test_cloudfront_distribution_exists(self):
        """Verify CloudFront distribution is created."""
        self.assertIn('resource "aws_cloudfront_distribution" "static_assets"', self.cf_tf)

    def test_cloudfront_s3_origin(self):
        """Verify CloudFront uses S3 as origin."""
        self.assertIn('domain_name              = aws_s3_bucket.static_assets.bucket_regional_domain_name', self.cf_tf)

    def test_cloudfront_oac_configured(self):
        """Verify Origin Access Control is configured."""
        self.assertIn('origin_access_control_id', self.cf_tf)

    def test_cloudfront_https_redirect(self):
        """Verify CloudFront redirects HTTP to HTTPS."""
        self.assertIn('viewer_protocol_policy = "redirect-to-https"', self.cf_tf)

    def test_cloudfront_tls_version(self):
        """Verify CloudFront uses TLS 1.2 minimum."""
        self.assertIn('minimum_protocol_version       = "TLSv1.2_2021"', self.cf_tf)


class TestWAFConfiguration(unittest.TestCase):
    """Test WAF configuration."""

    @classmethod
    def setUpClass(cls):
        """Load WAF configuration."""
        cls.waf_tf = (Path(__file__).parent.parent / "lib" / "waf.tf").read_text()

    def test_waf_web_acl_exists(self):
        """Verify WAF Web ACL is created."""
        self.assertIn('resource "aws_wafv2_web_acl" "alb"', self.waf_tf)

    def test_waf_sql_injection_rule(self):
        """Verify WAF has SQL injection protection."""
        self.assertIn('AWSManagedRulesSQLiRuleSet', self.waf_tf)

    def test_waf_xss_rule(self):
        """Verify WAF has XSS protection."""
        self.assertIn('AWSManagedRulesKnownBadInputsRuleSet', self.waf_tf)

    def test_waf_common_rule_set(self):
        """Verify WAF has common rule set."""
        self.assertIn('AWSManagedRulesCommonRuleSet', self.waf_tf)

    def test_waf_associated_with_alb(self):
        """Verify WAF is associated with ALB."""
        self.assertIn('resource "aws_wafv2_web_acl_association" "alb"', self.waf_tf)
        self.assertIn('resource_arn = aws_lb.main.arn', self.waf_tf)


class TestCloudWatchConfiguration(unittest.TestCase):
    """Test CloudWatch configuration."""

    @classmethod
    def setUpClass(cls):
        """Load CloudWatch configuration."""
        cls.cw_tf = (Path(__file__).parent.parent / "lib" / "cloudwatch.tf").read_text()

    def test_cloudwatch_log_group_exists(self):
        """Verify CloudWatch log group is created."""
        self.assertIn('resource "aws_cloudwatch_log_group" "application"', self.cw_tf)

    def test_cloudwatch_log_group_encrypted(self):
        """Verify CloudWatch logs are encrypted."""
        self.assertIn('kms_key_id        = aws_kms_key.main.arn', self.cw_tf)

    def test_cloudwatch_alarms_exist(self):
        """Verify CloudWatch alarms are created."""
        alarms = ['high_cpu', 'unhealthy_targets', 'aurora_cpu', 'aurora_connections']
        for alarm in alarms:
            self.assertIn(f'resource "aws_cloudwatch_metric_alarm" "{alarm}"', self.cw_tf)


class TestEventBridgeConfiguration(unittest.TestCase):
    """Test EventBridge configuration."""

    @classmethod
    def setUpClass(cls):
        """Load EventBridge configuration."""
        cls.eb_tf = (Path(__file__).parent.parent / "lib" / "eventbridge.tf").read_text()

    def test_nightly_batch_rule_exists(self):
        """Verify nightly batch processing rule exists."""
        self.assertIn('resource "aws_cloudwatch_event_rule" "nightly_batch"', self.eb_tf)

    def test_nightly_batch_schedule(self):
        """Verify nightly batch has cron schedule."""
        self.assertIn('schedule_expression', self.eb_tf)
        self.assertIn('cron(', self.eb_tf)

    def test_business_hours_rule_exists(self):
        """Verify business hours monitoring rule exists."""
        self.assertIn('resource "aws_cloudwatch_event_rule" "business_hours_monitor"', self.eb_tf)


class TestKMSConfiguration(unittest.TestCase):
    """Test KMS configuration."""

    @classmethod
    def setUpClass(cls):
        """Load KMS configuration."""
        cls.kms_tf = (Path(__file__).parent.parent / "lib" / "kms.tf").read_text()

    def test_kms_key_exists(self):
        """Verify KMS key is created."""
        self.assertIn('resource "aws_kms_key" "main"', self.kms_tf)

    def test_kms_key_rotation_enabled(self):
        """Verify KMS key rotation is enabled."""
        self.assertIn('enable_key_rotation     = true', self.kms_tf)

    def test_kms_alias_exists(self):
        """Verify KMS alias is created."""
        self.assertIn('resource "aws_kms_alias" "main"', self.kms_tf)


class TestOutputsConfiguration(unittest.TestCase):
    """Test outputs configuration."""

    @classmethod
    def setUpClass(cls):
        """Load outputs configuration."""
        cls.outputs_tf = (Path(__file__).parent.parent / "lib" / "outputs.tf").read_text()

    def test_vpc_outputs_exist(self):
        """Verify VPC outputs are defined."""
        self.assertIn('output "vpc_id"', self.outputs_tf)
        self.assertIn('output "public_subnet_ids"', self.outputs_tf)
        self.assertIn('output "private_subnet_ids"', self.outputs_tf)

    def test_alb_outputs_exist(self):
        """Verify ALB outputs are defined."""
        self.assertIn('output "alb_dns_name"', self.outputs_tf)
        self.assertIn('output "alb_arn"', self.outputs_tf)

    def test_aurora_outputs_exist(self):
        """Verify Aurora outputs are defined."""
        self.assertIn('output "aurora_cluster_endpoint"', self.outputs_tf)
        self.assertIn('output "aurora_database_name"', self.outputs_tf)

    def test_s3_outputs_exist(self):
        """Verify S3 outputs are defined."""
        self.assertIn('output "logs_bucket_id"', self.outputs_tf)
        self.assertIn('output "documents_bucket_id"', self.outputs_tf)
        self.assertIn('output "static_assets_bucket_id"', self.outputs_tf)

    def test_environment_suffix_output_exists(self):
        """Verify environment_suffix is output."""
        self.assertIn('output "environment_suffix"', self.outputs_tf)


if __name__ == '__main__':
    unittest.main()
