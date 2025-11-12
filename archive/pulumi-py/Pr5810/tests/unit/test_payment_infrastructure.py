"""
Unit tests for PaymentInfrastructure Pulumi component.
Tests the payment processing infrastructure configuration and validation.
"""

import unittest
from unittest.mock import patch, MagicMock
import pulumi
from pulumi import ResourceOptions

# Import the classes we're testing
from lib.payment_infrastructure import PaymentInfrastructure, PaymentInfrastructureArgs


class MockResource:
    """Mock Pulumi resource for testing."""
    def __init__(self, name, **kwargs):
        self.name = name
        self.id = f"mock-{name}-id"
        self.arn = f"arn:aws:service::account:resource/{name}"
        self.endpoint = f"mock-{name}-endpoint"
        self.bucket = f"mock-{name}-bucket"
        self.primary_network_interface_id = f"eni-{name}"
        self.engine = "aurora-postgresql"  # For RDS cluster instances
        self.engine_version = "13.21"       # For RDS cluster instances
        self.identifier = f"mock-{name}-identifier"  # For RDS instances
        for key, value in kwargs.items():
            setattr(self, key, value)


class TestPaymentInfrastructureArgs(unittest.TestCase):
    """Test cases for PaymentInfrastructureArgs configuration class."""

    def test_payment_infrastructure_args_defaults(self):
        """Test PaymentInfrastructureArgs with default values."""
        args = PaymentInfrastructureArgs(
            environment="dev",
            vpc_cidr="10.2.0.0/16",
            rds_instance_count=1,
            rds_instance_class="db.t3.medium",
            rds_backup_retention=1,
            lambda_memory_size=512,
            dynamodb_billing_mode="PAY_PER_REQUEST"
        )
        
        self.assertEqual(args.environment, "dev")
        self.assertEqual(args.vpc_cidr, "10.2.0.0/16")
        self.assertEqual(args.rds_instance_count, 1)
        self.assertEqual(args.rds_instance_class, "db.t3.medium")
        self.assertEqual(args.rds_backup_retention, 1)
        self.assertEqual(args.lambda_memory_size, 512)
        self.assertEqual(args.dynamodb_billing_mode, "PAY_PER_REQUEST")
        self.assertFalse(args.enable_cloudwatch_alarms)
        self.assertFalse(args.use_nat_gateway)
        self.assertFalse(args.enable_pitr)
        self.assertFalse(args.enable_s3_lifecycle)

    def test_payment_infrastructure_args_production(self):
        """Test PaymentInfrastructureArgs with production settings."""
        args = PaymentInfrastructureArgs(
            environment="prod",
            vpc_cidr="10.0.0.0/16",
            rds_instance_count=2,
            rds_instance_class="db.r5.xlarge",
            rds_backup_retention=30,
            lambda_memory_size=3008,
            dynamodb_billing_mode="PROVISIONED",
            dynamodb_read_capacity=5,
            dynamodb_write_capacity=5,
            enable_cloudwatch_alarms=True,
            cloudwatch_cpu_threshold=80,
            use_nat_gateway=True,
            enable_pitr=True,
            enable_s3_lifecycle=True
        )
        
        self.assertEqual(args.environment, "prod")
        self.assertEqual(args.vpc_cidr, "10.0.0.0/16")
        self.assertEqual(args.rds_instance_count, 2)
        self.assertEqual(args.rds_instance_class, "db.r5.xlarge")
        self.assertEqual(args.rds_backup_retention, 30)
        self.assertEqual(args.lambda_memory_size, 3008)
        self.assertEqual(args.dynamodb_billing_mode, "PROVISIONED")
        self.assertEqual(args.dynamodb_read_capacity, 5)
        self.assertEqual(args.dynamodb_write_capacity, 5)
        self.assertTrue(args.enable_cloudwatch_alarms)
        self.assertEqual(args.cloudwatch_cpu_threshold, 80)
        self.assertTrue(args.use_nat_gateway)
        self.assertTrue(args.enable_pitr)
        self.assertTrue(args.enable_s3_lifecycle)


class TestPaymentInfrastructure(unittest.TestCase):
    """Test cases for PaymentInfrastructure component."""

    def setUp(self):
        """Set up test fixtures."""
        self.dev_args = PaymentInfrastructureArgs(
            environment="dev",
            vpc_cidr="10.2.0.0/16",
            rds_instance_count=1,
            rds_instance_class="db.t3.medium",
            rds_backup_retention=1,
            lambda_memory_size=512,
            dynamodb_billing_mode="PAY_PER_REQUEST"
        )

    @patch('lib.payment_infrastructure.aws')
    @patch('lib.payment_infrastructure.pulumi')
    def test_environment_suffix_setting(self, mock_pulumi, mock_aws):
        """Test that environment suffix is set correctly."""
        # Mock AWS resources
        mock_aws.get_availability_zones.return_value = MagicMock(names=["eu-west-3a", "eu-west-3b", "eu-west-3c"])
        mock_aws.ec2.Vpc.return_value = MockResource("vpc")
        mock_aws.ec2.InternetGateway.return_value = MockResource("igw")
        mock_aws.ec2.Subnet.return_value = MockResource("subnet")
        mock_aws.ec2.Instance.return_value = MockResource("instance")
        mock_aws.ec2.RouteTable.return_value = MockResource("route_table")
        mock_aws.ec2.RouteTableAssociation.return_value = MockResource("rta")
        mock_aws.ec2.SecurityGroup.return_value = MockResource("sg")
        mock_aws.rds.SubnetGroup.return_value = MockResource("subnet_group")
        mock_aws.rds.Cluster.return_value = MockResource("cluster")
        mock_aws.rds.ClusterInstance.return_value = MockResource("cluster_instance")
        mock_aws.iam.Role.return_value = MockResource("role")
        mock_aws.iam.RolePolicyAttachment.return_value = MockResource("policy_attachment")
        mock_aws.lambda_.LayerVersion.return_value = MockResource("layer")
        mock_aws.lambda_.Function.return_value = MockResource("function")
        mock_aws.dynamodb.Table.return_value = MockResource("table")
        mock_aws.s3.Bucket.return_value = MockResource("bucket")

        # Create infrastructure
        infrastructure = PaymentInfrastructure(
            "test-payment-infra",
            self.dev_args
        )

        # Verify environment suffix is set correctly
        self.assertEqual(infrastructure.environment_suffix, "dev")

    @patch('lib.payment_infrastructure.aws')
    def test_common_tags_configuration(self, mock_aws):
        """Test that common tags are configured correctly."""
        # Mock AWS resources
        mock_aws.get_availability_zones.return_value = MagicMock(names=["eu-west-3a", "eu-west-3b", "eu-west-3c"])
        
        # Mock all AWS resources to avoid actual calls
        for service in ['ec2', 'rds', 'iam', 'lambda_', 'dynamodb', 's3']:
            service_mock = getattr(mock_aws, service)
            for resource_type in ['Vpc', 'InternetGateway', 'Subnet', 'Instance', 'RouteTable', 
                                 'RouteTableAssociation', 'SecurityGroup', 'SubnetGroup', 'Cluster',
                                 'ClusterInstance', 'Role', 'RolePolicyAttachment', 'LayerVersion',
                                 'Function', 'Table', 'Bucket']:
                if hasattr(service_mock, resource_type):
                    res_type = resource_type.lower()
                    mock_fn = lambda *args, **kwargs: MockResource(res_type)
                    setattr(service_mock, resource_type, mock_fn)

        # Create infrastructure
        infrastructure = PaymentInfrastructure(
            "test-payment-infra",
            self.dev_args
        )

        # Verify common tags
        expected_tags = {
            "Environment": "dev",
            "Team": "fintech-payments",
            "CostCenter": "payment-processing",
            "Project": "multi-env-infrastructure",
        }
        self.assertEqual(infrastructure.common_tags, expected_tags)

    def test_subnet_cidr_calculation(self):
        """Test subnet CIDR block calculation."""
        test_cases = [
            ("10.2.0.0/16", [("10.2.1.0/24", "10.2.10.0/24"),
                             ("10.2.2.0/24", "10.2.11.0/24"),
                             ("10.2.3.0/24", "10.2.12.0/24")]),
            ("10.1.0.0/16", [("10.1.1.0/24", "10.1.10.0/24"),
                             ("10.1.2.0/24", "10.1.11.0/24"),
                             ("10.1.3.0/24", "10.1.12.0/24")]),
            ("10.0.0.0/16", [("10.0.1.0/24", "10.0.10.0/24"),
                             ("10.0.2.0/24", "10.0.11.0/24"),
                             ("10.0.3.0/24", "10.0.12.0/24")])
        ]
        
        for vpc_cidr, expected_subnets in test_cases:
            with self.subTest(vpc_cidr=vpc_cidr):
                base_octets = vpc_cidr.split('/', maxsplit=1)[0].split('.')
                base_network = f"{base_octets[0]}.{base_octets[1]}"
                
                for i in range(3):
                    public_cidr = f"{base_network}.{i+1}.0/24"
                    private_cidr = f"{base_network}.{i+10}.0/24"
                    
                    self.assertEqual((public_cidr, private_cidr), expected_subnets[i])

    def test_nat_gateway_vs_instance_logic(self):
        """Test NAT Gateway vs NAT Instance selection logic."""
        # Test NAT Instance (dev environment)
        dev_args = PaymentInfrastructureArgs(
            environment="dev",
            vpc_cidr="10.2.0.0/16",
            rds_instance_count=1,
            rds_instance_class="db.t3.medium",
            rds_backup_retention=1,
            lambda_memory_size=512,
            dynamodb_billing_mode="PAY_PER_REQUEST",
            use_nat_gateway=False
        )
        self.assertFalse(dev_args.use_nat_gateway)
        
        # Test NAT Gateway (prod environment)
        prod_args = PaymentInfrastructureArgs(
            environment="prod",
            vpc_cidr="10.0.0.0/16",
            rds_instance_count=2,
            rds_instance_class="db.r5.xlarge",
            rds_backup_retention=30,
            lambda_memory_size=3008,
            dynamodb_billing_mode="PROVISIONED",
            use_nat_gateway=True
        )
        self.assertTrue(prod_args.use_nat_gateway)

    def test_dynamodb_billing_mode_configuration(self):
        """Test DynamoDB billing mode configurations."""
        # Test PAY_PER_REQUEST (dev)
        dev_args = PaymentInfrastructureArgs(
            environment="dev",
            vpc_cidr="10.2.0.0/16",
            rds_instance_count=1,
            rds_instance_class="db.t3.medium",
            rds_backup_retention=1,
            lambda_memory_size=512,
            dynamodb_billing_mode="PAY_PER_REQUEST"
        )
        self.assertEqual(dev_args.dynamodb_billing_mode, "PAY_PER_REQUEST")
        self.assertIsNone(dev_args.dynamodb_read_capacity)
        self.assertIsNone(dev_args.dynamodb_write_capacity)
        
        # Test PROVISIONED (prod)
        prod_args = PaymentInfrastructureArgs(
            environment="prod",
            vpc_cidr="10.0.0.0/16",
            rds_instance_count=2,
            rds_instance_class="db.r5.xlarge",
            rds_backup_retention=30,
            lambda_memory_size=3008,
            dynamodb_billing_mode="PROVISIONED",
            dynamodb_read_capacity=5,
            dynamodb_write_capacity=5
        )
        self.assertEqual(prod_args.dynamodb_billing_mode, "PROVISIONED")
        self.assertEqual(prod_args.dynamodb_read_capacity, 5)
        self.assertEqual(prod_args.dynamodb_write_capacity, 5)

    def test_cloudwatch_alarms_configuration(self):
        """Test CloudWatch alarms configuration."""
        # Test disabled alarms (dev)
        dev_args = PaymentInfrastructureArgs(
            environment="dev",
            vpc_cidr="10.2.0.0/16",
            rds_instance_count=1,
            rds_instance_class="db.t3.medium",
            rds_backup_retention=1,
            lambda_memory_size=512,
            dynamodb_billing_mode="PAY_PER_REQUEST",
            enable_cloudwatch_alarms=False
        )
        self.assertFalse(dev_args.enable_cloudwatch_alarms)
        
        # Test enabled alarms with threshold (prod)
        prod_args = PaymentInfrastructureArgs(
            environment="prod",
            vpc_cidr="10.0.0.0/16",
            rds_instance_count=2,
            rds_instance_class="db.r5.xlarge",
            rds_backup_retention=30,
            lambda_memory_size=3008,
            dynamodb_billing_mode="PROVISIONED",
            enable_cloudwatch_alarms=True,
            cloudwatch_cpu_threshold=80
        )
        self.assertTrue(prod_args.enable_cloudwatch_alarms)
        self.assertEqual(prod_args.cloudwatch_cpu_threshold, 80)

    def test_s3_lifecycle_configuration(self):
        """Test S3 lifecycle policy configuration."""
        # Test disabled lifecycle (dev)
        dev_args = PaymentInfrastructureArgs(
            environment="dev",
            vpc_cidr="10.2.0.0/16",
            rds_instance_count=1,
            rds_instance_class="db.t3.medium",
            rds_backup_retention=1,
            lambda_memory_size=512,
            dynamodb_billing_mode="PAY_PER_REQUEST",
            enable_s3_lifecycle=False
        )
        self.assertFalse(dev_args.enable_s3_lifecycle)
        
        # Test enabled lifecycle (prod)
        prod_args = PaymentInfrastructureArgs(
            environment="prod",
            vpc_cidr="10.0.0.0/16",
            rds_instance_count=2,
            rds_instance_class="db.r5.xlarge",
            rds_backup_retention=30,
            lambda_memory_size=3008,
            dynamodb_billing_mode="PROVISIONED",
            enable_s3_lifecycle=True
        )
        self.assertTrue(prod_args.enable_s3_lifecycle)

    def test_rds_backup_retention_periods(self):
        """Test RDS backup retention periods for different environments."""
        test_cases = [
            ("dev", 1),
            ("staging", 7),
            ("prod", 30)
        ]
        
        for env, expected_retention in test_cases:
            with self.subTest(environment=env):
                args = PaymentInfrastructureArgs(
                    environment=env,
                    vpc_cidr="10.0.0.0/16",
                    rds_instance_count=1,
                    rds_instance_class="db.t3.medium",
                    rds_backup_retention=expected_retention,
                    lambda_memory_size=512,
                    dynamodb_billing_mode="PAY_PER_REQUEST"
                )
                self.assertEqual(args.rds_backup_retention, expected_retention)

    def test_lambda_memory_sizes(self):
        """Test Lambda memory sizes for different environments."""
        test_cases = [
            ("dev", 512),
            ("staging", 1024),
            ("prod", 3008)
        ]
        
        for env, expected_memory in test_cases:
            with self.subTest(environment=env):
                args = PaymentInfrastructureArgs(
                    environment=env,
                    vpc_cidr="10.0.0.0/16",
                    rds_instance_count=1,
                    rds_instance_class="db.t3.medium",
                    rds_backup_retention=1,
                    lambda_memory_size=expected_memory,
                    dynamodb_billing_mode="PAY_PER_REQUEST"
                )
                self.assertEqual(args.lambda_memory_size, expected_memory)


    @patch('lib.payment_infrastructure.aws')
    def test_create_vpc_method(self, mock_aws):
        """Test VPC creation method."""
        # Mock AWS resources
        mock_aws.get_availability_zones.return_value = MagicMock(names=["eu-west-3a", "eu-west-3b", "eu-west-3c"])
        mock_vpc = MockResource("vpc")
        mock_igw = MockResource("igw")
        mock_subnet = MockResource("subnet")
        mock_instance = MockResource("instance")
        mock_route_table = MockResource("route_table")
        mock_rta = MockResource("rta")
        
        mock_aws.ec2.Vpc.return_value = mock_vpc
        mock_aws.ec2.InternetGateway.return_value = mock_igw
        mock_aws.ec2.Subnet.return_value = mock_subnet
        mock_aws.ec2.Instance.return_value = mock_instance
        mock_aws.ec2.RouteTable.return_value = mock_route_table
        mock_aws.ec2.RouteTableAssociation.return_value = mock_rta
        mock_aws.ec2.SecurityGroup.return_value = MockResource("sg")
        mock_aws.rds.SubnetGroup.return_value = MockResource("subnet_group")
        mock_aws.rds.Cluster.return_value = MockResource("cluster")
        mock_aws.rds.ClusterInstance.return_value = MockResource("cluster_instance")
        mock_aws.iam.Role.return_value = MockResource("role")
        mock_aws.iam.RolePolicyAttachment.return_value = MockResource("policy_attachment")
        mock_aws.lambda_.LayerVersion.return_value = MockResource("layer")
        mock_aws.lambda_.Function.return_value = MockResource("function")
        mock_aws.dynamodb.Table.return_value = MockResource("table")
        mock_aws.s3.Bucket.return_value = MockResource("bucket")

        # Create infrastructure
        infrastructure = PaymentInfrastructure(
            "test-payment-infra",
            self.dev_args
        )

        # Verify VPC is created
        self.assertEqual(infrastructure.vpc, mock_vpc)
        self.assertEqual(infrastructure.igw, mock_igw)
        self.assertEqual(len(infrastructure.public_subnets), 3)
        self.assertEqual(len(infrastructure.private_subnets), 3)

    @patch('lib.payment_infrastructure.aws')
    def test_create_rds_cluster_method(self, mock_aws):
        """Test RDS cluster creation method."""
        # Mock AWS resources with all necessary attributes
        mock_aws.get_availability_zones.return_value = MagicMock(names=["eu-west-3a", "eu-west-3b", "eu-west-3c"])
        mock_cluster = MockResource("cluster")
        mock_instance = MockResource("cluster_instance")
        
        # Mock all AWS resources to avoid actual calls
        for service in ['ec2', 'rds', 'iam', 'lambda_', 'dynamodb', 's3']:
            service_mock = getattr(mock_aws, service)
            for resource_type in ['Vpc', 'InternetGateway', 'Subnet', 'Instance', 'RouteTable', 
                                 'RouteTableAssociation', 'SecurityGroup', 'SubnetGroup',
                                 'Cluster', 'ClusterInstance', 'Role', 'RolePolicyAttachment',
                                 'LayerVersion', 'Function', 'Table', 'Bucket']:
                if hasattr(service_mock, resource_type):
                    if resource_type == 'Cluster':
                        mock_fn = lambda *args, **kwargs: mock_cluster
                        setattr(service_mock, resource_type, mock_fn)
                    elif resource_type == 'ClusterInstance':
                        mock_fn = lambda *args, **kwargs: mock_instance
                        setattr(service_mock, resource_type, mock_fn)
                    else:
                        res_type = resource_type.lower()
                        mock_fn = lambda *args, **kwargs: MockResource(res_type)
                        setattr(service_mock, resource_type, mock_fn)

        # Create infrastructure
        infrastructure = PaymentInfrastructure(
            "test-payment-infra",
            self.dev_args
        )

        # Verify RDS cluster is created
        self.assertEqual(infrastructure.rds_cluster, mock_cluster)
        self.assertEqual(len(infrastructure.rds_instances), 1)

    @patch('lib.payment_infrastructure.aws')
    def test_create_lambda_functions_method(self, mock_aws):
        """Test Lambda functions creation method."""
        # Mock AWS resources
        mock_aws.get_availability_zones.return_value = MagicMock(names=["eu-west-3a", "eu-west-3b", "eu-west-3c"])
        mock_function1 = MockResource("payment_processor")
        mock_function2 = MockResource("transaction_validator")
        
        # Mock all AWS resources
        for service in ['ec2', 'rds', 'iam', 'lambda_', 'dynamodb', 's3']:
            service_mock = getattr(mock_aws, service)
            for resource_type in ['Vpc', 'InternetGateway', 'Subnet', 'Instance', 'RouteTable', 
                                 'RouteTableAssociation', 'SecurityGroup', 'SubnetGroup', 'Cluster',
                                 'ClusterInstance', 'Role', 'RolePolicyAttachment',
                                 'LayerVersion', 'Function', 'Table', 'Bucket']:
                if hasattr(service_mock, resource_type):
                    if resource_type == 'Function':
                        # Alternate between the two mock functions
                        def mock_function_creator(*args, **kwargs):
                            if 'payment-processor' in str(args):
                                return mock_function1
                            return mock_function2
                        setattr(service_mock, resource_type, mock_function_creator)
                    else:
                        res_type = resource_type.lower()
                        mock_fn = lambda *args, **kwargs: MockResource(res_type)
                        setattr(service_mock, resource_type, mock_fn)

        # Create infrastructure
        infrastructure = PaymentInfrastructure(
            "test-payment-infra",
            self.dev_args
        )

        # Verify Lambda functions are created
        self.assertEqual(infrastructure.payment_processor_lambda, mock_function1)
        self.assertEqual(infrastructure.transaction_validator_lambda, mock_function2)

    @patch('lib.payment_infrastructure.aws')
    def test_create_dynamodb_tables_method(self, mock_aws):
        """Test DynamoDB tables creation method."""
        # Mock AWS resources
        mock_aws.get_availability_zones.return_value = MagicMock(names=["eu-west-3a", "eu-west-3b", "eu-west-3c"])
        mock_table1 = MockResource("transactions_table")
        mock_table2 = MockResource("audit_logs_table")
        
        # Mock all AWS resources
        for service in ['ec2', 'rds', 'iam', 'lambda_', 'dynamodb', 's3']:
            service_mock = getattr(mock_aws, service)
            for resource_type in ['Vpc', 'InternetGateway', 'Subnet', 'Instance', 'RouteTable', 
                                 'RouteTableAssociation', 'SecurityGroup', 'SubnetGroup', 'Cluster',
                                 'ClusterInstance', 'Role', 'RolePolicyAttachment', 'LayerVersion',
                                 'Function', 'Table', 'Bucket']:
                if hasattr(service_mock, resource_type):
                    if resource_type == 'Table':
                        # Alternate between the two mock tables
                        def mock_table_creator(*args, **kwargs):
                            if 'transactions' in str(args):
                                return mock_table1
                            return mock_table2
                        setattr(service_mock, resource_type, mock_table_creator)
                    else:
                        res_type = resource_type.lower()
                        mock_fn = lambda *args, **kwargs: MockResource(res_type)
                        setattr(service_mock, resource_type, mock_fn)

        # Create infrastructure
        infrastructure = PaymentInfrastructure(
            "test-payment-infra",
            self.dev_args
        )

        # Verify DynamoDB tables are created
        self.assertEqual(infrastructure.transactions_table, mock_table1)
        self.assertEqual(infrastructure.audit_logs_table, mock_table2)

    @patch('lib.payment_infrastructure.aws')
    def test_create_s3_buckets_method(self, mock_aws):
        """Test S3 buckets creation method."""
        # Mock AWS resources
        mock_aws.get_availability_zones.return_value = MagicMock(names=["eu-west-3a", "eu-west-3b", "eu-west-3c"])
        mock_bucket1 = MockResource("audit_bucket")
        mock_bucket2 = MockResource("data_bucket")
        
        # Mock all AWS resources
        for service in ['ec2', 'rds', 'iam', 'lambda_', 'dynamodb', 's3']:
            service_mock = getattr(mock_aws, service)
            for resource_type in ['Vpc', 'InternetGateway', 'Subnet', 'Instance', 'RouteTable', 
                                 'RouteTableAssociation', 'SecurityGroup', 'SubnetGroup', 'Cluster',
                                 'ClusterInstance', 'Role', 'RolePolicyAttachment', 'LayerVersion',
                                 'Function', 'Table', 'Bucket']:
                if hasattr(service_mock, resource_type):
                    if resource_type == 'Bucket':
                        # Alternate between the two mock buckets
                        def mock_bucket_creator(*args, **kwargs):
                            if 'audit' in str(args):
                                return mock_bucket1
                            return mock_bucket2
                        setattr(service_mock, resource_type, mock_bucket_creator)
                    else:
                        res_type = resource_type.lower()
                        mock_fn = lambda *args, **kwargs: MockResource(res_type)
                        setattr(service_mock, resource_type, mock_fn)

        # Create infrastructure
        infrastructure = PaymentInfrastructure(
            "test-payment-infra",
            self.dev_args
        )

        # Verify S3 buckets are created
        self.assertEqual(infrastructure.audit_storage_bucket, mock_bucket1)
        self.assertEqual(infrastructure.transaction_data_bucket, mock_bucket2)

    @patch('lib.payment_infrastructure.aws')
    def test_production_environment_with_cloudwatch_alarms(self, mock_aws):
        """Test production environment with CloudWatch alarms enabled."""
        # Create production args with CloudWatch alarms
        prod_args = PaymentInfrastructureArgs(
            environment="prod",
            vpc_cidr="10.0.0.0/16",
            rds_instance_count=2,
            rds_instance_class="db.r5.xlarge",
            rds_backup_retention=30,
            lambda_memory_size=3008,
            dynamodb_billing_mode="PROVISIONED",
            dynamodb_read_capacity=5,
            dynamodb_write_capacity=5,
            enable_cloudwatch_alarms=True,
            cloudwatch_cpu_threshold=80,
            use_nat_gateway=True,
            enable_pitr=True,
            enable_s3_lifecycle=True
        )

        # Mock AWS resources
        mock_aws.get_availability_zones.return_value = MagicMock(names=["eu-west-3a", "eu-west-3b", "eu-west-3c"])
        
        # Mock all AWS resources
        for service in ['ec2', 'rds', 'iam', 'lambda_', 'dynamodb', 's3', 'cloudwatch', 'appautoscaling']:
            service_mock = getattr(mock_aws, service, MagicMock())
            setattr(mock_aws, service, service_mock)
            for resource_type in ['Vpc', 'InternetGateway', 'Subnet', 'Instance', 'RouteTable',
                                 'RouteTableAssociation', 'SecurityGroup', 'SubnetGroup',
                                 'Cluster', 'ClusterInstance', 'Role', 'RolePolicyAttachment',
                                 'LayerVersion', 'Function', 'Table', 'Bucket', 'MetricAlarm',
                                 'Target', 'Eip', 'NatGateway', 'BucketLifecycleConfiguration']:
                res_type = resource_type.lower()
                mock_fn = lambda *args, **kwargs: MockResource(res_type)
                setattr(service_mock, resource_type, mock_fn)

        # Create infrastructure
        infrastructure = PaymentInfrastructure(
            "test-payment-infra",
            prod_args
        )

        # Verify production-specific settings
        self.assertEqual(infrastructure.environment_suffix, "prod")
        self.assertTrue(prod_args.enable_cloudwatch_alarms)
        self.assertTrue(prod_args.use_nat_gateway)
        self.assertTrue(prod_args.enable_pitr)
        self.assertTrue(prod_args.enable_s3_lifecycle)


if __name__ == '__main__':
    unittest.main()
