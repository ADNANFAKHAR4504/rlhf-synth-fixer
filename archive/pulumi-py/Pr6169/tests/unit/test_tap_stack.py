"""
test_tap_stack.py

Pure unit tests for the TapStack Pulumi component using mocking only.
No integration tests - only isolated unit tests with mocks.
"""

import unittest
from unittest.mock import Mock, MagicMock, patch, call
import json
import pulumi

# Set test mode before importing stack
pulumi.runtime.set_mocks(
    mocks=Mock(),
    preview=False
)

from lib.tap_stack import TapStack, TapStackArgs


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resources."""
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resources with predictable IDs and outputs."""
        outputs = args.inputs
        
        # Add resource-specific outputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {**args.inputs, "id": "vpc-mock123"}
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs = {**args.inputs, "id": "igw-mock123"}
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {**args.inputs, "id": f"subnet-mock-{args.name}"}
        elif args.typ == "aws:ec2/eip:Eip":
            outputs = {**args.inputs, "id": f"eip-mock-{args.name}", "allocation_id": f"eipalloc-mock-{args.name}"}
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs = {**args.inputs, "id": f"nat-mock-{args.name}"}
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs = {**args.inputs, "id": f"rt-mock-{args.name}"}
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {**args.inputs, "id": f"sg-mock-{args.name}"}
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {**args.inputs, "id": args.inputs.get("bucket", f"bucket-mock-{args.name}"), 
                      "arn": f"arn:aws:s3:::mock-bucket-{args.name}"}
        elif args.typ == "aws:ecr/repository:Repository":
            outputs = {**args.inputs, "id": f"repo-mock-{args.name}", 
                      "repository_url": f"123456789012.dkr.ecr.us-east-1.amazonaws.com/mock-{args.name}"}
        elif args.typ == "aws:ecs/cluster:Cluster":
            outputs = {**args.inputs, "id": f"cluster-mock-{args.name}", 
                      "arn": f"arn:aws:ecs:us-east-1:123456789012:cluster/mock-{args.name}"}
        elif args.typ == "aws:iam/role:Role":
            outputs = {**args.inputs, "id": f"role-mock-{args.name}", 
                      "arn": f"arn:aws:iam::123456789012:role/mock-{args.name}"}
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {**args.inputs, "id": args.inputs.get("name", f"log-mock-{args.name}"), 
                      "arn": f"arn:aws:logs:us-east-1:123456789012:log-group:mock-{args.name}"}
        elif args.typ == "random:index/randomPassword:RandomPassword":
            outputs = {**args.inputs, "result": "MockSecurePassword123!@#"}
        elif args.typ == "aws:rds/subnetGroup:SubnetGroup":
            outputs = {**args.inputs, "id": f"subnet-group-mock-{args.name}"}
        elif args.typ == "aws:rds/instance:Instance":
            outputs = {**args.inputs, "id": f"db-mock-{args.name}", 
                      "endpoint": "mock-db.region.rds.amazonaws.com:5432",
                      "username": args.inputs.get("username", "dbadmin")}
        elif args.typ == "aws:secretsmanager/secret:Secret":
            outputs = {**args.inputs, "id": f"secret-mock-{args.name}", 
                      "arn": f"arn:aws:secretsmanager:us-east-1:123456789012:secret:mock-{args.name}"}
        elif args.typ == "aws:ssm/parameter:Parameter":
            outputs = {**args.inputs, "id": args.inputs.get("name", f"param-mock-{args.name}"), 
                      "arn": f"arn:aws:ssm:us-east-1:123456789012:parameter/mock-{args.name}"}
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs = {**args.inputs, "id": f"alb-mock-{args.name}", 
                      "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/mock-{args.name}",
                      "dns_name": f"mock-alb-{args.name}.us-east-1.elb.amazonaws.com"}
        elif args.typ == "aws:lb/targetGroup:TargetGroup":
            outputs = {**args.inputs, "id": f"tg-mock-{args.name}", 
                      "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/mock-{args.name}"}
        elif args.typ == "aws:ecs/taskDefinition:TaskDefinition":
            outputs = {**args.inputs, "id": f"task-mock-{args.name}", 
                      "arn": f"arn:aws:ecs:us-east-1:123456789012:task-definition/mock-{args.name}:1"}
        elif args.typ == "aws:kms/key:Key":
            outputs = {**args.inputs, "id": f"key-mock-{args.name}", 
                      "key_id": f"key-id-mock-{args.name}",
                      "arn": f"arn:aws:kms:us-east-1:123456789012:key/mock-{args.name}"}
        else:
            outputs = {**args.inputs, "id": f"mock-{args.typ}-{args.name}"}
        
        return [f"{args.typ}-{args.name}", outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        """Handle function calls."""
        return {}


# Set mocks before running tests
pulumi.runtime.set_mocks(MyMocks())


class TestTapStackArgs(unittest.TestCase):
    """Unit tests for TapStackArgs dataclass."""
    
    def test_tap_stack_args_creation_with_valid_suffix(self):
        """Test TapStackArgs creation with valid environment suffix."""
        args = TapStackArgs(environment_suffix="test")
        self.assertEqual(args.environment_suffix, "test")
    
    def test_tap_stack_args_with_dev_environment(self):
        """Test TapStackArgs with dev environment."""
        args = TapStackArgs(environment_suffix="dev")
        self.assertEqual(args.environment_suffix, "dev")
    
    def test_tap_stack_args_with_prod_environment(self):
        """Test TapStackArgs with prod environment."""
        args = TapStackArgs(environment_suffix="prod")
        self.assertEqual(args.environment_suffix, "prod")
    
    def test_tap_stack_args_with_staging_environment(self):
        """Test TapStackArgs with staging environment."""
        args = TapStackArgs(environment_suffix="staging")
        self.assertEqual(args.environment_suffix, "staging")
    
    def test_tap_stack_args_with_pr_environment(self):
        """Test TapStackArgs with PR environment suffix."""
        args = TapStackArgs(environment_suffix="pr6169")
        self.assertEqual(args.environment_suffix, "pr6169")


class TestTapStackInitialization(unittest.TestCase):
    """Unit tests for TapStack initialization."""
    
    @pulumi.runtime.test
    def test_stack_name_assignment(self):
        """Test that stack name is correctly assigned."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("my-test-stack", args)
            self.assertEqual(stack.name, "my-test-stack")
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_env_suffix_assignment(self):
        """Test that environment suffix is correctly assigned."""
        args = TapStackArgs(environment_suffix="test-env")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertEqual(stack.env_suffix, "test-env")
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_common_tags_structure(self):
        """Test that common tags have correct structure."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIn("Environment", stack.common_tags)
            self.assertIn("Project", stack.common_tags)
            self.assertIn("CostCenter", stack.common_tags)
            self.assertIn("ManagedBy", stack.common_tags)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_common_tags_values(self):
        """Test that common tags have correct values."""
        args = TapStackArgs(environment_suffix="prod")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertEqual(stack.common_tags["Environment"], "prod")
            self.assertEqual(stack.common_tags["Project"], "LoanProcessing")
            self.assertEqual(stack.common_tags["CostCenter"], "FinancialServices")
            self.assertEqual(stack.common_tags["ManagedBy"], "Pulumi")
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestCreateKMSKey(unittest.TestCase):
    """Unit tests for _create_kms_key method."""
    
    @pulumi.runtime.test
    def test_kms_key_exists(self):
        """Test that KMS key is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.kms_key)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_kms_key_alias_exists(self):
        """Test that KMS key alias is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.kms_key_alias)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestCreateVPC(unittest.TestCase):
    """Unit tests for _create_vpc method."""
    
    @pulumi.runtime.test
    def test_vpc_exists(self):
        """Test that VPC is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.vpc)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_internet_gateway_exists(self):
        """Test that Internet Gateway is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.igw)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_availability_zones_us_east_1(self):
        """Test that availability zones are set to us-east-1."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            expected = ["us-east-1a", "us-east-1b", "us-east-1c"]
            self.assertEqual(stack.availability_zones, expected)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_public_subnets_count(self):
        """Test that 3 public subnets are created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertEqual(len(stack.public_subnets), 3)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_private_subnets_count(self):
        """Test that 3 private subnets are created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertEqual(len(stack.private_subnets), 3)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_nat_gateways_count(self):
        """Test that 3 NAT gateways are created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertEqual(len(stack.nat_gateways), 3)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_eips_count(self):
        """Test that 3 Elastic IPs are created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertEqual(len(stack.eips), 3)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_public_route_table_exists(self):
        """Test that public route table is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.public_route_table)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_private_route_tables_count(self):
        """Test that 3 private route tables are created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertEqual(len(stack.private_route_tables), 3)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestCreateSecurityGroups(unittest.TestCase):
    """Unit tests for _create_security_groups method."""
    
    @pulumi.runtime.test
    def test_alb_security_group_exists(self):
        """Test that ALB security group is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.alb_security_group)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_ecs_security_group_exists(self):
        """Test that ECS security group is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.ecs_security_group)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_rds_security_group_exists(self):
        """Test that RDS security group is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.rds_security_group)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestCreateS3ALBLogsBucket(unittest.TestCase):
    """Unit tests for _create_s3_alb_logs_bucket method."""
    
    @pulumi.runtime.test
    def test_alb_logs_bucket_exists(self):
        """Test that ALB logs bucket is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.alb_logs_bucket)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestCreateECRRepository(unittest.TestCase):
    """Unit tests for _create_ecr_repository method."""
    
    @pulumi.runtime.test
    def test_ecr_repository_exists(self):
        """Test that ECR repository is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.ecr_repository)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestCreateECSCluster(unittest.TestCase):
    """Unit tests for _create_ecs_cluster method."""
    
    @pulumi.runtime.test
    def test_ecs_cluster_exists(self):
        """Test that ECS cluster is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.ecs_cluster)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestCreateIAMRoles(unittest.TestCase):
    """Unit tests for _create_iam_roles method."""
    
    @pulumi.runtime.test
    def test_ecs_task_execution_role_exists(self):
        """Test that ECS task execution role is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.ecs_task_execution_role)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_ecs_task_role_exists(self):
        """Test that ECS task role is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.ecs_task_role)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestCreateCloudWatchLogs(unittest.TestCase):
    """Unit tests for _create_cloudwatch_logs method."""
    
    @pulumi.runtime.test
    def test_ecs_log_group_exists(self):
        """Test that ECS log group is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.ecs_log_group)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestCreateRDSDatabase(unittest.TestCase):
    """Unit tests for _create_rds_database method."""
    
    @pulumi.runtime.test
    def test_db_password_generated(self):
        """Test that database password is generated."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.db_password)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_db_subnet_group_exists(self):
        """Test that DB subnet group is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.db_subnet_group)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_rds_instance_exists(self):
        """Test that RDS instance is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.rds_instance)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestCreateSecretsManager(unittest.TestCase):
    """Unit tests for _create_secrets_manager method."""
    
    @pulumi.runtime.test
    def test_db_secret_exists(self):
        """Test that database secret is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.db_secret)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_db_secret_version_exists(self):
        """Test that database secret version is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.db_secret_version)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestCreateParameterStore(unittest.TestCase):
    """Unit tests for _create_parameter_store method."""
    
    @pulumi.runtime.test
    def test_app_config_param_exists(self):
        """Test that app config parameter is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.app_config_param)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestCreateALB(unittest.TestCase):
    """Unit tests for _create_alb method."""
    
    @pulumi.runtime.test
    def test_alb_exists(self):
        """Test that Application Load Balancer is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.alb)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_target_group_exists(self):
        """Test that target group is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.target_group)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_alb_listener_exists(self):
        """Test that ALB listener is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.alb_listener)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestCreateECSTaskAndService(unittest.TestCase):
    """Unit tests for _create_ecs_task_and_service method."""
    
    @pulumi.runtime.test
    def test_task_definition_exists(self):
        """Test that ECS task definition is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.task_definition)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_ecs_service_exists(self):
        """Test that ECS service is created."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertIsNotNone(stack.ecs_service)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestExportOutputs(unittest.TestCase):
    """Unit tests for _export_outputs method."""
    
    @pulumi.runtime.test
    def test_export_outputs_called(self):
        """Test that export outputs method is called during initialization."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            # If stack is created successfully, _export_outputs was called
            self.assertIsNotNone(stack)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestEnvironmentVariations(unittest.TestCase):
    """Unit tests for different environment configurations."""
    
    @pulumi.runtime.test
    def test_dev_environment_suffix(self):
        """Test stack with dev environment."""
        args = TapStackArgs(environment_suffix="dev")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertEqual(stack.env_suffix, "dev")
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_staging_environment_suffix(self):
        """Test stack with staging environment."""
        args = TapStackArgs(environment_suffix="staging")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertEqual(stack.env_suffix, "staging")
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_prod_environment_suffix(self):
        """Test stack with prod environment."""
        args = TapStackArgs(environment_suffix="prod")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertEqual(stack.env_suffix, "prod")
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_pr_environment_suffix(self):
        """Test stack with PR environment."""
        args = TapStackArgs(environment_suffix="pr6169")
        
        def verify(resources):
            stack = TapStack("stack", args)
            self.assertEqual(stack.env_suffix, "pr6169")
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


class TestStackComponentsCreation(unittest.TestCase):
    """Unit tests to verify all stack components are created."""
    
    @pulumi.runtime.test
    def test_all_vpc_components_exist(self):
        """Test all VPC-related components exist."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            # VPC components
            self.assertIsNotNone(stack.vpc)
            self.assertIsNotNone(stack.igw)
            self.assertEqual(len(stack.public_subnets), 3)
            self.assertEqual(len(stack.private_subnets), 3)
            self.assertEqual(len(stack.nat_gateways), 3)
            self.assertEqual(len(stack.eips), 3)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_all_security_components_exist(self):
        """Test all security-related components exist."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            # Security components
            self.assertIsNotNone(stack.alb_security_group)
            self.assertIsNotNone(stack.ecs_security_group)
            self.assertIsNotNone(stack.rds_security_group)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_all_compute_components_exist(self):
        """Test all compute-related components exist."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            # Compute components
            self.assertIsNotNone(stack.ecs_cluster)
            self.assertIsNotNone(stack.task_definition)
            self.assertIsNotNone(stack.ecs_service)
            self.assertIsNotNone(stack.ecr_repository)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_all_database_components_exist(self):
        """Test all database-related components exist."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            # Database components
            self.assertIsNotNone(stack.db_password)
            self.assertIsNotNone(stack.db_subnet_group)
            self.assertIsNotNone(stack.rds_instance)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_all_storage_components_exist(self):
        """Test all storage-related components exist."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            # Storage components
            self.assertIsNotNone(stack.alb_logs_bucket)
            self.assertIsNotNone(stack.db_secret)
            self.assertIsNotNone(stack.app_config_param)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_all_networking_components_exist(self):
        """Test all networking/load balancer components exist."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            # Networking components
            self.assertIsNotNone(stack.alb)
            self.assertIsNotNone(stack.target_group)
            self.assertIsNotNone(stack.alb_listener)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_all_iam_components_exist(self):
        """Test all IAM-related components exist."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            # IAM components
            self.assertIsNotNone(stack.ecs_task_execution_role)
            self.assertIsNotNone(stack.ecs_task_role)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_all_encryption_components_exist(self):
        """Test all encryption-related components exist."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            # Encryption components
            self.assertIsNotNone(stack.kms_key)
            self.assertIsNotNone(stack.kms_key_alias)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))
    
    @pulumi.runtime.test
    def test_all_monitoring_components_exist(self):
        """Test all monitoring-related components exist."""
        args = TapStackArgs(environment_suffix="test")
        
        def verify(resources):
            stack = TapStack("stack", args)
            # Monitoring components
            self.assertIsNotNone(stack.ecs_log_group)
        
        return pulumi.Output.from_input({}).apply(lambda _: verify(None))


if __name__ == "__main__":
    # Run tests with verbose output
    unittest.main(verbosity=2)
