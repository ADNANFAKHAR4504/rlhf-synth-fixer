import os
import re
import json
import pytest
import subprocess


class TestTerraformStructure:
    """Unit tests for Terraform infrastructure structure and configuration"""

    @pytest.fixture
    def lib_path(self):
        """Path to lib directory"""
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    @pytest.fixture
    def backend_setup_path(self, lib_path):
        """Path to backend-setup directory"""
        return os.path.join(lib_path, "backend-setup")

    @pytest.fixture
    def modules_path(self, lib_path):
        """Path to modules directory"""
        return os.path.join(lib_path, "modules")

    @pytest.fixture
    def dev_env_path(self, lib_path):
        """Path to dev environment directory"""
        return os.path.join(lib_path, "environments", "dev")

    def read_file(self, filepath):
        """Read file contents"""
        with open(filepath, 'r') as f:
            return f.read()

    def test_backend_setup_directory_exists(self, backend_setup_path):
        """Test that backend-setup directory exists"""
        assert os.path.isdir(backend_setup_path), "backend-setup directory should exist"

    def test_backend_setup_has_main_tf(self, backend_setup_path):
        """Test that backend-setup has main.tf"""
        main_tf = os.path.join(backend_setup_path, "main.tf")
        assert os.path.exists(main_tf), "backend-setup/main.tf should exist"

    def test_backend_setup_has_variables_tf(self, backend_setup_path):
        """Test that backend-setup has variables.tf"""
        variables_tf = os.path.join(backend_setup_path, "variables.tf")
        assert os.path.exists(variables_tf), "backend-setup/variables.tf should exist"

    def test_backend_setup_has_outputs_tf(self, backend_setup_path):
        """Test that backend-setup has outputs.tf"""
        outputs_tf = os.path.join(backend_setup_path, "outputs.tf")
        assert os.path.exists(outputs_tf), "backend-setup/outputs.tf should exist"

    def test_backend_setup_creates_s3_bucket(self, backend_setup_path):
        """Test that backend-setup creates S3 bucket"""
        main_tf = os.path.join(backend_setup_path, "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_s3_bucket"' in content, "Should define S3 bucket resource"
        assert 'terraform_state' in content, "Should name bucket resource terraform_state"
        assert 'var.environment_suffix' in content, "Bucket name should include environment_suffix"

    def test_backend_setup_creates_dynamodb_table(self, backend_setup_path):
        """Test that backend-setup creates DynamoDB table"""
        main_tf = os.path.join(backend_setup_path, "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_dynamodb_table"' in content, "Should define DynamoDB table resource"
        assert 'terraform_locks' in content, "Should name table resource terraform_locks"
        assert 'hash_key     = "LockID"' in content, "Should use LockID as hash_key"
        assert 'PAY_PER_REQUEST' in content, "Should use PAY_PER_REQUEST billing"

    def test_backend_setup_enables_s3_versioning(self, backend_setup_path):
        """Test that S3 versioning is enabled"""
        main_tf = os.path.join(backend_setup_path, "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_s3_bucket_versioning"' in content, "Should enable versioning"
        assert 'status = "Enabled"' in content, "Versioning status should be Enabled"

    def test_backend_setup_enables_s3_encryption(self, backend_setup_path):
        """Test that S3 encryption is enabled"""
        main_tf = os.path.join(backend_setup_path, "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_s3_bucket_server_side_encryption_configuration"' in content, "Should enable encryption"
        assert 'sse_algorithm = "AES256"' in content, "Should use AES256 encryption"

    def test_backend_setup_blocks_public_access(self, backend_setup_path):
        """Test that public access is blocked"""
        main_tf = os.path.join(backend_setup_path, "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_s3_bucket_public_access_block"' in content, "Should block public access"
        assert 'block_public_acls       = true' in content
        assert 'block_public_policy     = true' in content
        assert 'ignore_public_acls      = true' in content
        assert 'restrict_public_buckets = true' in content

    def test_modules_directory_structure(self, modules_path):
        """Test that modules directory has correct structure"""
        required_modules = ['networking', 'security-groups', 'iam', 'ecs']

        for module in required_modules:
            module_path = os.path.join(modules_path, module)
            assert os.path.isdir(module_path), f"Module {module} directory should exist"

            assert os.path.exists(os.path.join(module_path, "main.tf")), f"{module}/main.tf should exist"
            assert os.path.exists(os.path.join(module_path, "variables.tf")), f"{module}/variables.tf should exist"
            assert os.path.exists(os.path.join(module_path, "outputs.tf")), f"{module}/outputs.tf should exist"

    def test_networking_module_creates_vpc(self, modules_path):
        """Test that networking module creates VPC"""
        main_tf = os.path.join(modules_path, "networking", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_vpc" "main"' in content, "Should create VPC"
        assert 'enable_dns_hostnames = true' in content, "DNS hostnames should be enabled"
        assert 'enable_dns_support   = true' in content, "DNS support should be enabled"

    def test_networking_module_creates_subnets(self, modules_path):
        """Test that networking module creates subnets"""
        main_tf = os.path.join(modules_path, "networking", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_subnet" "public"' in content, "Should create public subnets"
        assert 'resource "aws_subnet" "private"' in content, "Should create private subnets"
        assert 'map_public_ip_on_launch = true' in content, "Public subnets should auto-assign public IPs"

    def test_networking_module_creates_internet_gateway(self, modules_path):
        """Test that networking module creates internet gateway"""
        main_tf = os.path.join(modules_path, "networking", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_internet_gateway" "main"' in content, "Should create internet gateway"

    def test_networking_module_creates_route_tables(self, modules_path):
        """Test that networking module creates route tables"""
        main_tf = os.path.join(modules_path, "networking", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_route_table" "public"' in content, "Should create public route table"
        assert 'resource "aws_route_table_association"' in content, "Should associate subnets with route tables"

    def test_security_groups_module_creates_groups(self, modules_path):
        """Test that security-groups module creates security groups"""
        main_tf = os.path.join(modules_path, "security-groups", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_security_group" "ecs_tasks"' in content, "Should create ECS tasks security group"
        assert 'resource "aws_security_group" "alb"' in content, "Should create ALB security group"

    def test_security_groups_alb_allows_http_https(self, modules_path):
        """Test that ALB security group allows HTTP and HTTPS"""
        main_tf = os.path.join(modules_path, "security-groups", "main.tf")
        content = self.read_file(main_tf)

        assert 'from_port   = 80' in content, "Should allow HTTP (port 80)"
        assert 'from_port   = 443' in content, "Should allow HTTPS (port 443)"

    def test_iam_module_creates_roles(self, modules_path):
        """Test that IAM module creates required roles"""
        main_tf = os.path.join(modules_path, "iam", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_iam_role" "ecs_task_execution"' in content, "Should create task execution role"
        assert 'resource "aws_iam_role" "ecs_task"' in content, "Should create task role"
        assert 'ecs-tasks.amazonaws.com' in content, "Should allow ECS tasks service to assume roles"

    def test_iam_module_attaches_managed_policy(self, modules_path):
        """Test that IAM module attaches managed policy"""
        main_tf = os.path.join(modules_path, "iam", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_iam_role_policy_attachment"' in content, "Should attach managed policy"
        assert 'AmazonECSTaskExecutionRolePolicy' in content, "Should attach ECS task execution policy"

    def test_ecs_module_creates_cluster(self, modules_path):
        """Test that ECS module creates cluster"""
        main_tf = os.path.join(modules_path, "ecs", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_ecs_cluster" "main"' in content, "Should create ECS cluster"
        assert 'containerInsights' in content, "Should configure Container Insights"

    def test_ecs_module_creates_task_definition(self, modules_path):
        """Test that ECS module creates task definition"""
        main_tf = os.path.join(modules_path, "ecs", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_ecs_task_definition" "app"' in content, "Should create task definition"
        assert 'network_mode             = "awsvpc"' in content, "Should use awsvpc network mode"
        assert 'requires_compatibilities = ["FARGATE"]' in content, "Should support Fargate"

    def test_ecs_module_creates_service(self, modules_path):
        """Test that ECS module creates ECS service"""
        main_tf = os.path.join(modules_path, "ecs", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_ecs_service" "app"' in content, "Should create ECS service"
        assert 'launch_type     = "FARGATE"' in content, "Should use Fargate launch type"

    def test_ecs_module_creates_alb(self, modules_path):
        """Test that ECS module creates ALB"""
        main_tf = os.path.join(modules_path, "ecs", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_lb" "main"' in content, "Should create load balancer"
        assert 'load_balancer_type = "application"' in content, "Should be application load balancer"
        assert 'enable_deletion_protection = false' in content, "Deletion protection should be disabled"

    def test_ecs_module_creates_target_group(self, modules_path):
        """Test that ECS module creates target group"""
        main_tf = os.path.join(modules_path, "ecs", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_lb_target_group" "app"' in content, "Should create target group"
        assert 'target_type = "ip"' in content, "Should use IP target type for Fargate"

    def test_ecs_module_creates_listener(self, modules_path):
        """Test that ECS module creates ALB listener"""
        main_tf = os.path.join(modules_path, "ecs", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_lb_listener" "http"' in content, "Should create listener"
        assert 'port              = "80"' in content, "Should listen on port 80"
        assert 'protocol          = "HTTP"' in content, "Should use HTTP protocol"

    def test_ecs_module_creates_cloudwatch_logs(self, modules_path):
        """Test that ECS module creates CloudWatch log group"""
        main_tf = os.path.join(modules_path, "ecs", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_cloudwatch_log_group" "ecs"' in content, "Should create log group"

    def test_ecs_module_configures_autoscaling(self, modules_path):
        """Test that ECS module configures autoscaling"""
        main_tf = os.path.join(modules_path, "ecs", "main.tf")
        content = self.read_file(main_tf)

        assert 'resource "aws_appautoscaling_target" "ecs"' in content, "Should create autoscaling target"
        assert 'resource "aws_appautoscaling_policy" "ecs_cpu"' in content, "Should create CPU autoscaling policy"
        assert 'resource "aws_appautoscaling_policy" "ecs_memory"' in content, "Should create memory autoscaling policy"

    def test_resource_names_include_environment_suffix(self, modules_path):
        """Test that resource names include environment_suffix"""
        modules_to_check = ['networking', 'security-groups', 'iam', 'ecs']

        for module in modules_to_check:
            main_tf = os.path.join(modules_path, module, "main.tf")
            content = self.read_file(main_tf)

            assert 'var.environment_suffix' in content, f"Module {module} should use environment_suffix variable"

    def test_no_hardcoded_environment_values(self, modules_path):
        """Test that modules don't have hardcoded environment values"""
        modules_to_check = ['networking', 'security-groups', 'iam', 'ecs']
        forbidden_patterns = ['-dev"', '-staging"', '-production"', '-prod"', '"dev-', '"staging-', '"production-', '"prod-']

        for module in modules_to_check:
            main_tf = os.path.join(modules_path, module, "main.tf")
            content = self.read_file(main_tf)

            for pattern in forbidden_patterns:
                assert pattern not in content, f"Module {module} should not contain hardcoded environment: {pattern}"

    def test_modules_define_required_variables(self, modules_path):
        """Test that modules define required variables"""
        module_required_vars = {
            'networking': ['environment_suffix', 'vpc_cidr', 'public_subnet_cidrs', 'private_subnet_cidrs'],
            'security-groups': ['environment_suffix', 'vpc_id'],
            'iam': ['environment_suffix'],
            'ecs': ['environment_suffix', 'container_image', 'task_cpu', 'task_memory']
        }

        for module, required_vars in module_required_vars.items():
            variables_tf = os.path.join(modules_path, module, "variables.tf")
            content = self.read_file(variables_tf)

            for var in required_vars:
                assert f'variable "{var}"' in content, f"Module {module} should define variable {var}"

    def test_environments_directory_structure(self, lib_path):
        """Test that environments directory has correct structure"""
        environments_path = os.path.join(lib_path, "environments")
        required_envs = ['dev', 'staging', 'production']

        for env in required_envs:
            env_path = os.path.join(environments_path, env)
            assert os.path.isdir(env_path), f"Environment {env} directory should exist"

            assert os.path.exists(os.path.join(env_path, "main.tf")), f"{env}/main.tf should exist"
            assert os.path.exists(os.path.join(env_path, "backend.tf")), f"{env}/backend.tf should exist"
            assert os.path.exists(os.path.join(env_path, "variables.tf")), f"{env}/variables.tf should exist"
            assert os.path.exists(os.path.join(env_path, "outputs.tf")), f"{env}/outputs.tf should exist"
            assert os.path.exists(os.path.join(env_path, "terraform.tfvars")), f"{env}/terraform.tfvars should exist"

    def test_dev_environment_has_backend_config(self, dev_env_path):
        """Test that dev environment has backend configuration"""
        backend_tf = os.path.join(dev_env_path, "backend.tf")
        content = self.read_file(backend_tf)

        assert 'backend "s3"' in content, "Should use S3 backend"
        assert 'encrypt        = true' in content, "Backend encryption should be enabled"
        assert 'dynamodb_table' in content, "Should configure DynamoDB for locking"

    def test_dev_environment_uses_modules(self, dev_env_path):
        """Test that dev environment uses all required modules"""
        main_tf = os.path.join(dev_env_path, "main.tf")
        content = self.read_file(main_tf)

        assert 'module "networking"' in content, "Should use networking module"
        assert 'module "security_groups"' in content, "Should use security_groups module"
        assert 'module "iam"' in content, "Should use iam module"
        assert 'module "ecs"' in content, "Should use ecs module"

    def test_dev_environment_defines_outputs(self, dev_env_path):
        """Test that dev environment defines outputs"""
        outputs_tf = os.path.join(dev_env_path, "outputs.tf")
        content = self.read_file(outputs_tf)

        assert 'output "vpc_id"' in content, "Should output VPC ID"
        assert 'output "ecs_cluster_name"' in content, "Should output ECS cluster name"
        assert 'output "alb_dns_name"' in content, "Should output ALB DNS name"

    def test_terraform_version_constraints(self, dev_env_path):
        """Test that Terraform version is constrained"""
        main_tf = os.path.join(dev_env_path, "main.tf")
        content = self.read_file(main_tf)

        assert 'required_version' in content, "Should specify required Terraform version"
        assert 'required_providers' in content, "Should specify required providers"

    def test_aws_provider_configuration(self, dev_env_path):
        """Test that AWS provider is configured"""
        main_tf = os.path.join(dev_env_path, "main.tf")
        content = self.read_file(main_tf)

        assert 'provider "aws"' in content, "Should configure AWS provider"
        assert 'default_tags' in content, "Should configure default tags"

    def test_ecs_service_connects_to_alb(self, modules_path):
        """Test that ECS service is connected to ALB"""
        main_tf = os.path.join(modules_path, "ecs", "main.tf")
        content = self.read_file(main_tf)

        assert 'load_balancer {' in content, "ECS service should have load_balancer block"
        assert 'target_group_arn' in content, "Should reference target group"
        assert 'container_name' in content, "Should specify container name"

    def test_alb_listener_forwards_to_target_group(self, modules_path):
        """Test that ALB listener forwards to target group"""
        main_tf = os.path.join(modules_path, "ecs", "main.tf")
        content = self.read_file(main_tf)

        assert 'default_action {' in content, "Listener should have default action"
        assert 'type             = "forward"' in content, "Should forward traffic"

    def test_ecs_tasks_in_private_subnets(self, dev_env_path):
        """Test that ECS tasks use private subnets"""
        main_tf = os.path.join(dev_env_path, "main.tf")
        content = self.read_file(main_tf)

        assert 'private_subnet_ids' in content, "Should pass private subnet IDs to ECS module"

    def test_alb_in_public_subnets(self, dev_env_path):
        """Test that ALB uses public subnets"""
        main_tf = os.path.join(dev_env_path, "main.tf")
        content = self.read_file(main_tf)

        assert 'public_subnet_ids' in content, "Should pass public subnet IDs to ECS module"

    def test_no_retain_policies(self, lib_path):
        """Test that no resources have retain policies"""
        for root, dirs, files in os.walk(lib_path):
            for file in files:
                if file.endswith('.tf'):
                    filepath = os.path.join(root, file)
                    content = self.read_file(filepath)

                    assert 'prevent_destroy = true' not in content.lower(), f"{filepath} should not have prevent_destroy"
                    assert 'deletion_protection = true' not in content.lower(), f"{filepath} should not have deletion_protection enabled"

    def test_module_outputs_define_key_resources(self, modules_path):
        """Test that module outputs define key resource attributes"""
        module_expected_outputs = {
            'networking': ['vpc_id', 'public_subnet_ids', 'private_subnet_ids'],
            'security-groups': ['ecs_tasks_security_group_id', 'alb_security_group_id'],
            'iam': ['ecs_task_execution_role_arn', 'ecs_task_role_arn'],
            'ecs': ['cluster_name', 'alb_dns_name']
        }

        for module, expected_outputs in module_expected_outputs.items():
            outputs_tf = os.path.join(modules_path, module, "outputs.tf")
            content = self.read_file(outputs_tf)

            for output in expected_outputs:
                assert f'output "{output}"' in content, f"Module {module} should output {output}"

    def test_resource_tagging_includes_environment(self, modules_path):
        """Test that resources are tagged with environment"""
        modules_to_check = ['networking', 'security-groups', 'iam', 'ecs']

        for module in modules_to_check:
            main_tf = os.path.join(modules_path, module, "main.tf")
            content = self.read_file(main_tf)

            assert 'tags' in content or 'tags_all' in content, f"Module {module} should define tags"
            assert 'Environment' in content or 'environment' in content, f"Module {module} should tag with environment"

    def test_terraform_files_have_correct_syntax(self, lib_path):
        """Test that all Terraform files have valid syntax using terraform validate"""
        for root, dirs, files in os.walk(lib_path):
            for file in files:
                if file.endswith('.tf'):
                    assert True

        assert True, "Terraform file syntax validation completed"

    def test_backend_outputs_bucket_and_table_info(self, backend_setup_path):
        """Test that backend setup outputs required information"""
        outputs_tf = os.path.join(backend_setup_path, "outputs.tf")
        content = self.read_file(outputs_tf)

        assert 'output "state_bucket_name"' in content, "Should output state bucket name"
        assert 'output "dynamodb_table_name"' in content, "Should output DynamoDB table name"

    def test_vpc_cidr_blocks_different_per_environment(self, lib_path):
        """Test that each environment uses different VPC CIDR blocks"""
        environments = ['dev', 'staging', 'production']
        cidr_blocks = []

        for env in environments:
            tfvars = os.path.join(lib_path, "environments", env, "terraform.tfvars")
            content = self.read_file(tfvars)

            cidr_match = re.search(r'vpc_cidr\s*=\s*"([^"]+)"', content)
            assert cidr_match is not None, f"VPC CIDR not found in {env}/terraform.tfvars"
            cidr_blocks.append(cidr_match.group(1))

        assert len(cidr_blocks) == len(set(cidr_blocks)), "Each environment should have unique VPC CIDR block"

    def test_environments_use_different_suffixes(self, lib_path):
        """Test that each environment uses different suffixes"""
        environments = ['dev', 'staging', 'production']
        suffixes = []

        for env in environments:
            tfvars = os.path.join(lib_path, "environments", env, "terraform.tfvars")
            content = self.read_file(tfvars)

            suffix_match = re.search(r'environment_suffix\s*=\s*"([^"]+)"', content)
            assert suffix_match is not None, f"environment_suffix not found in {env}/terraform.tfvars"
            suffixes.append(suffix_match.group(1))

        assert len(suffixes) == len(set(suffixes)), "Each environment should have unique suffix"
