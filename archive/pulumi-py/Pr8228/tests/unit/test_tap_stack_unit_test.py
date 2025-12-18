"""Unit tests for transaction processing Pulumi infrastructure code."""
import unittest
import json
import ast
import os


class TestTapStackUnitTest(unittest.TestCase):
    """Unit tests for the Pulumi stack code structure and configuration."""

    @classmethod
    def setUpClass(cls):
        """Set up test environment."""
        cls.main_file_path = os.path.join(
            os.path.dirname(__file__), '..', '..', 'lib', '__main__.py'
        )
        with open(cls.main_file_path, 'r', encoding='utf-8') as f:
            cls.code_content = f.read()
        cls.tree = ast.parse(cls.code_content)

    def test_imports_are_correct(self):
        """Test that required imports are present."""
        self.assertIn("import pulumi", self.code_content)
        self.assertIn("import pulumi_aws as aws", self.code_content)
        self.assertIn("import boto3", self.code_content)

    def test_config_variables_exist(self):
        """Test that configuration variables are defined."""
        self.assertIn("config = pulumi.Config()", self.code_content)
        self.assertIn("environment_suffix", self.code_content)
        self.assertIn("region", self.code_content)

    def test_vpc_is_defined(self):
        """Test that VPC resource is defined."""
        self.assertIn("aws.ec2.Vpc(", self.code_content)
        self.assertIn("10.0.0.0/16", self.code_content)
        self.assertIn("enable_dns_hostnames=True", self.code_content)

    def test_subnets_are_defined(self):
        """Test that public and private subnets are defined."""
        self.assertIn("public_subnets = []", self.code_content)
        self.assertIn("private_subnets = []", self.code_content)
        self.assertIn("aws.ec2.Subnet(", self.code_content)

    def test_internet_gateway_exists(self):
        """Test that Internet Gateway is defined."""
        self.assertIn("aws.ec2.InternetGateway(", self.code_content)

    def test_nat_gateway_exists(self):
        """Test that NAT Gateway is defined."""
        self.assertIn("aws.ec2.NatGateway(", self.code_content)
        self.assertIn("aws.ec2.Eip(", self.code_content)

    def test_route_tables_exist(self):
        """Test that route tables are defined."""
        self.assertIn("aws.ec2.RouteTable(", self.code_content)
        self.assertIn("aws.ec2.Route(", self.code_content)
        self.assertIn("aws.ec2.RouteTableAssociation(", self.code_content)

    def test_security_groups_exist(self):
        """Test that security groups are defined."""
        self.assertIn("alb_sg = aws.ec2.SecurityGroup(", self.code_content)
        self.assertIn("ecs_sg = aws.ec2.SecurityGroup(", self.code_content)
        self.assertIn("rds_sg = aws.ec2.SecurityGroup(", self.code_content)

    def test_alb_security_group_rules(self):
        """Test that ALB security group has correct rules."""
        self.assertIn("from_port=80", self.code_content)
        self.assertIn("from_port=443", self.code_content)

    def test_rds_security_group_rules(self):
        """Test that RDS security group allows PostgreSQL."""
        self.assertIn("from_port=5432", self.code_content)
        self.assertIn("to_port=5432", self.code_content)

    def test_s3_buckets_exist(self):
        """Test that S3 buckets are defined."""
        self.assertIn("app_logs_bucket = aws.s3.Bucket(", self.code_content)
        self.assertIn("transaction_data_bucket = aws.s3.Bucket(", self.code_content)

    def test_s3_encryption_configured(self):
        """Test that S3 encryption is configured."""
        self.assertIn("BucketServerSideEncryptionConfigurationV2", self.code_content)
        self.assertIn("AES256", self.code_content)

    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch log groups are defined."""
        self.assertIn("aws.cloudwatch.LogGroup(", self.code_content)
        self.assertIn("retention_in_days=30", self.code_content)

    def test_iam_roles_exist(self):
        """Test that IAM roles are defined."""
        self.assertIn("ecs_task_execution_role = aws.iam.Role(", self.code_content)
        self.assertIn("ecs_task_role = aws.iam.Role(", self.code_content)
        self.assertIn("ecs-tasks.amazonaws.com", self.code_content)

    def test_iam_policy_permissions(self):
        """Test that IAM policies have correct permissions."""
        self.assertIn("s3:PutObject", self.code_content)
        self.assertIn("s3:GetObject", self.code_content)
        self.assertIn("s3:ListBucket", self.code_content)

    def test_rds_cluster_exists(self):
        """Test that RDS Aurora cluster is defined."""
        self.assertIn("aurora_cluster = aws.rds.Cluster(", self.code_content)
        self.assertIn("aurora-postgresql", self.code_content)
        self.assertIn("skip_final_snapshot=True", self.code_content)

    def test_rds_instances_exist(self):
        """Test that RDS writer and reader instances are defined."""
        self.assertIn("aurora_writer = aws.rds.ClusterInstance(", self.code_content)
        self.assertIn("aurora_reader = aws.rds.ClusterInstance(", self.code_content)
        self.assertIn("db.t4g.medium", self.code_content)

    def test_rds_in_private_subnets(self):
        """Test that RDS uses private subnets."""
        self.assertIn("db_subnet_group = aws.rds.SubnetGroup(", self.code_content)
        self.assertIn("publicly_accessible=False", self.code_content)

    def test_alb_exists(self):
        """Test that Application Load Balancer is defined."""
        self.assertIn("alb = aws.lb.LoadBalancer(", self.code_content)
        self.assertIn("load_balancer_type=\"application\"", self.code_content)

    def test_target_group_exists(self):
        """Test that target group is defined."""
        self.assertIn("alb_target_group = aws.lb.TargetGroup(", self.code_content)
        self.assertIn("target_type=\"ip\"", self.code_content)
        self.assertIn("health_check", self.code_content)

    def test_alb_listener_exists(self):
        """Test that ALB listener is defined."""
        self.assertIn("alb_listener = aws.lb.Listener(", self.code_content)
        self.assertIn("port=80", self.code_content)

    def test_ecs_cluster_exists(self):
        """Test that ECS cluster is defined."""
        self.assertIn("ecs_cluster = aws.ecs.Cluster(", self.code_content)

    def test_environment_suffix_used_in_naming(self):
        """Test that environment_suffix is used in resource naming."""
        suffix_usages = self.code_content.count("environment_suffix")
        self.assertGreater(suffix_usages, 30,
                          "environment_suffix should be used in most resource names")

    def test_stack_exports_exist(self):
        """Test that stack outputs are exported."""
        self.assertIn("pulumi.export(\"vpc_id\"", self.code_content)
        self.assertIn("pulumi.export(\"alb_dns_name\"", self.code_content)
        self.assertIn("pulumi.export(\"rds_endpoint\"", self.code_content)
        self.assertIn("pulumi.export(\"app_logs_bucket\"", self.code_content)
        self.assertIn("pulumi.export(\"transaction_data_bucket\"", self.code_content)

    def test_aws_account_id_retrieved(self):
        """Test that AWS account ID is retrieved for unique naming."""
        self.assertIn("boto3.client('sts')", self.code_content)
        self.assertIn("get_caller_identity", self.code_content)

    def test_no_hardcoded_environments(self):
        """Test that no hardcoded environment names exist."""
        self.assertNotIn('"prod"', self.code_content)
        self.assertNotIn('"dev"', self.code_content,
                        "Should not have hardcoded 'dev' in resource names (config is OK)")
        self.assertNotIn('"staging"', self.code_content)

    def test_azs_configured(self):
        """Test that availability zones are configured."""
        self.assertIn("azs = [", self.code_content)
        self.assertIn('f"{region}a"', self.code_content)
        self.assertIn('f"{region}b"', self.code_content)

    def test_backup_retention_configured(self):
        """Test that backup retention is configured."""
        self.assertIn("backup_retention_period=1", self.code_content)

    def test_cloudwatch_logs_exported(self):
        """Test that CloudWatch logs are exported."""
        self.assertIn("enabled_cloudwatch_logs_exports", self.code_content)

    def test_bucket_names_globally_unique(self):
        """Test that S3 bucket names include account ID for uniqueness."""
        self.assertIn("bucket_suffix", self.code_content)
        self.assertIn("aws_account_id", self.code_content)

    def test_all_resources_tagged(self):
        """Test that resources have tags."""
        tag_count = self.code_content.count("tags={")
        self.assertGreater(tag_count, 20,
                          "Most resources should have tags")
        self.assertIn('"Environment": environment_suffix', self.code_content)

    def test_rds_engine_version_specified(self):
        """Test that RDS engine version is specified."""
        self.assertIn('engine_version=', self.code_content)
        self.assertIn('"15.', self.code_content)

    def test_master_password_from_config(self):
        """Test that master password comes from config or environment."""
        self.assertIn('config.get_secret("db_password")', self.code_content)

    def test_vpc_cidr_matches_requirement(self):
        """Test that VPC CIDR matches the requirement."""
        self.assertIn('"10.0.0.0/16"', self.code_content)

    def test_health_check_configured(self):
        """Test that ALB target group has health check."""
        self.assertIn('path="/health"', self.code_content)
        self.assertIn('healthy_threshold=', self.code_content)

    def test_file_has_docstring(self):
        """Test that the main file has a docstring."""
        self.assertIn('"""', self.code_content)

    def test_typing_imported(self):
        """Test that typing is imported for type hints."""
        self.assertIn("from typing import", self.code_content)

    def test_exports_all_required_outputs(self):
        """Test that all required outputs are exported."""
        required_exports = [
            "vpc_id",
            "alb_dns_name",
            "rds_endpoint",
            "rds_reader_endpoint",
            "app_logs_bucket",
            "transaction_data_bucket",
            "ecs_cluster_name",
            "ecs_task_role_arn",
            "ecs_task_execution_role_arn"
        ]
        for export in required_exports:
            self.assertIn(f'pulumi.export("{export}"', self.code_content,
                         f"Missing export: {export}")


if __name__ == "__main__":
    unittest.main()
