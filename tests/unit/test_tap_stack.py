"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking.
"""

import unittest
from unittest.mock import MagicMock, patch

from moto import mock_aws

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""

    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()

        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.tags, {})
        self.assertIsNone(args.secret_arn)
        self.assertIsNone(args.hosted_zone_id)
        self.assertEqual(args.domain_name, 'db-dev.example.com')

    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Environment': 'test', 'Project': 'tap'}
        args = TapStackArgs(
            environment_suffix='prod',
            tags=custom_tags,
            secret_arn='arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret',
            hosted_zone_id='Z123456789',
            domain_name='db.prod.example.com'
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.tags, custom_tags)
        self.assertEqual(args.secret_arn, 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret')
        self.assertEqual(args.hosted_zone_id, 'Z123456789')
        self.assertEqual(args.domain_name, 'db.prod.example.com')

    def test_tap_stack_args_domain_name_default_with_suffix(self):
        """Test that domain_name defaults correctly with environment suffix."""
        args = TapStackArgs(environment_suffix='staging')
        self.assertEqual(args.domain_name, 'db-staging.example.com')


# Mock functions for Pulumi testing
def mock_aws_resources(resource_type, name, inputs):
    """Mock AWS resource creation for testing."""
    if resource_type == "aws:rds/cluster:Cluster":
        return {
            "cluster_identifier": inputs.get("cluster_identifier", name),
            "endpoint": f"{name}.cluster-random.us-east-1.rds.amazonaws.com",
            "reader_endpoint": f"{name}.cluster-ro-random.us-east-1.rds.amazonaws.com",
            "arn": f"arn:aws:rds:us-east-1:123456789012:cluster:{name}",
            "id": name
        }
    elif resource_type == "aws:rds/clusterInstance:ClusterInstance":
        return {
            "identifier": inputs.get("identifier", name),
            "id": name
        }
    elif resource_type == "aws:rds/globalCluster:GlobalCluster":
        return {
            "id": inputs.get("global_cluster_identifier", name),
            "global_cluster_identifier": inputs.get("global_cluster_identifier", name)
        }
    elif resource_type == "aws:kms/key:Key":
        return {
            "arn": f"arn:aws:kms:us-east-1:123456789012:key/{name}",
            "id": name
        }
    elif resource_type == "aws:kms/alias:Alias":
        return {
            "id": name
        }
    elif resource_type == "aws:ec2/vpc:Vpc":
        return {
            "id": f"vpc-{name}",
            "cidr_block": inputs.get("cidr_block", "10.0.0.0/16")
        }
    elif resource_type == "aws:ec2/subnet:Subnet":
        return {
            "id": f"subnet-{name}",
            "cidr_block": inputs.get("cidr_block", "10.0.0.0/24")
        }
    elif resource_type == "aws:ec2/internetGateway:InternetGateway":
        return {
            "id": f"igw-{name}"
        }
    elif resource_type == "aws:ec2/routeTable:RouteTable":
        return {
            "id": f"rt-{name}"
        }
    elif resource_type == "aws:ec2/routeTableAssociation:RouteTableAssociation":
        return {
            "id": f"rta-{name}"
        }
    elif resource_type == "aws:rds/subnetGroup:SubnetGroup":
        return {
            "name": inputs.get("name", name),
            "id": name
        }
    elif resource_type == "aws:ec2/securityGroup:SecurityGroup":
        return {
            "id": f"sg-{name}",
            "name": inputs.get("name", name)
        }
    elif resource_type == "aws:route53/healthCheck:HealthCheck":
        return {
            "id": f"health-{name}"
        }
    elif resource_type == "aws:cloudwatch/metricAlarm:MetricAlarm":
        return {
            "id": f"alarm-{name}",
            "name": inputs.get("name", name)
        }
    elif resource_type == "aws:route53/record:Record":
        return {
            "id": f"record-{name}"
        }
class TestTapStack(unittest.TestCase):
    """Test cases for TapStack Pulumi component."""

    def test_tap_stack_args_assignment(self):
        """Test that TapStackArgs are properly assigned to TapStack instance."""
        args = TapStackArgs(environment_suffix='test', tags={'key': 'value'})
        # We can't fully instantiate TapStack without Pulumi context,
        # but we can test that the args would be assigned correctly
        self.assertEqual(args.environment_suffix, 'test')
        self.assertEqual(args.tags, {'key': 'value'})

    def test_tap_stack_has_required_methods(self):
        """Test that TapStack class has all required private methods."""
        # Check that all private methods exist
        required_methods = [
            '_create_kms_key',
            '_create_vpc',
            '_create_subnet_group',
            '_create_security_group',
            '_get_db_password',
            '_create_cloudwatch_alarms',
            '_create_route53_records'
        ]

        for method_name in required_methods:
            self.assertTrue(hasattr(TapStack, method_name),
                          f"TapStack is missing required method: {method_name}")
            method = getattr(TapStack, method_name)
            self.assertTrue(callable(method),
                          f"TapStack.{method_name} is not callable")

    def test_tap_stack_method_signatures(self):
        """Test that private methods have correct signatures."""
        import inspect

        # Check _create_kms_key signature
        sig = inspect.signature(TapStack._create_kms_key)
        params = list(sig.parameters.keys())
        self.assertEqual(len(params), 3, "_create_kms_key should have 3 parameters: self, region_name, provider")
        self.assertIn('region_name', params)
        self.assertIn('provider', params)

        # Check _create_vpc signature
        sig = inspect.signature(TapStack._create_vpc)
        params = list(sig.parameters.keys())
        self.assertEqual(len(params), 3, "_create_vpc should have 3 parameters: self, region_name, provider")

        # Check _create_security_group signature
        sig = inspect.signature(TapStack._create_security_group)
        params = list(sig.parameters.keys())
        self.assertEqual(len(params), 4, "_create_security_group should have 4 parameters: self, region_name, vpc, provider")

        # Check _get_db_password signature
        sig = inspect.signature(TapStack._get_db_password)
        params = list(sig.parameters.keys())
        self.assertEqual(len(params), 2, "_get_db_password should have 2 parameters: self, secret_arn")

        # Check _create_cloudwatch_alarms signature
        sig = inspect.signature(TapStack._create_cloudwatch_alarms)
        params = list(sig.parameters.keys())
        self.assertEqual(len(params), 1, "_create_cloudwatch_alarms should have 1 parameter: self")

        # Check _create_route53_records signature
        sig = inspect.signature(TapStack._create_route53_records)
        params = list(sig.parameters.keys())
        self.assertEqual(len(params), 3, "_create_route53_records should have 3 parameters: self, hosted_zone_id, domain_name")

    def test_tap_stack_outputs_registration(self):
        """Test that TapStack registers the correct outputs."""
        # Since we can't instantiate TapStack without Pulumi context,
        # we verify that the register_outputs call would include the right keys
        expected_outputs = [
            "primary_cluster_endpoint",
            "primary_cluster_reader_endpoint",
            "secondary_cluster_endpoint",
            "secondary_cluster_reader_endpoint",
            "global_cluster_id",
            "primary_cluster_arn",
            "secondary_cluster_arn"
        ]

        # Check that the register_outputs call in __init__ includes these keys
        # by examining the source code
        import inspect
        source = inspect.getsource(TapStack.__init__)
        for output in expected_outputs:
            self.assertIn(output, source,
                        f"Expected output '{output}' not found in TapStack.__init__")

    def test_tap_stack_dependencies(self):
        """Test that TapStack sets up proper resource dependencies."""
        # Verify that the __init__ method creates resources in dependency order
        import inspect
        source = inspect.getsource(TapStack.__init__)

        # Check that providers are created first
        provider_creation = source.find("self.primary_provider = aws.Provider")
        kms_creation = source.find("self.primary_kms_key = self._create_kms_key")

        self.assertLess(provider_creation, kms_creation,
                       "Providers should be created before KMS keys")

        # Check that global cluster is created before regional clusters
        global_cluster_creation = source.find("self.global_cluster = aws.rds.GlobalCluster")
        primary_cluster_creation = source.find("self.primary_cluster = aws.rds.Cluster")

        self.assertLess(global_cluster_creation, primary_cluster_creation,
                       "Global cluster should be created before regional clusters")

    def test_tap_stack_conditional_route53_creation(self):
        """Test that Route53 records are only created when hosted_zone_id is provided."""
        import inspect
        source = inspect.getsource(TapStack.__init__)

        # Check that Route53 creation is conditional
        route53_call = "if args.hosted_zone_id:"
        self.assertIn(route53_call, source,
                     "Route53 record creation should be conditional on hosted_zone_id")

        route53_method_call = "self._create_route53_records(args.hosted_zone_id, args.domain_name)"
        self.assertIn(route53_method_call, source,
                     "Route53 method should be called with correct parameters")

    def test_tap_stack_environment_suffix_usage(self):
        """Test that environment_suffix is used consistently in resource names."""
        import inspect
        source = inspect.getsource(TapStack.__init__)

        # Check that environment_suffix appears in multiple resource names
        suffix_usage_count = source.count("self.environment_suffix")
        self.assertGreater(suffix_usage_count, 5,
                          "environment_suffix should be used in multiple resource names")

    def test_tap_stack_tags_assignment(self):
        """Test that tags are properly assigned and used."""
        import inspect
        source = inspect.getsource(TapStack.__init__)

        # Check that tags are assigned to self
        self.assertIn("self.tags = args.tags", source,
                     "Tags should be assigned to self.tags")

        # Tags are stored but not directly used in resource creation in this implementation
        # This is acceptable for the current design

    @patch('lib.tap_stack.pulumi.ComponentResource.__init__')
    @patch('lib.tap_stack.aws.Provider')
    @patch('lib.tap_stack.aws.rds.GlobalCluster')
    @patch('lib.tap_stack.aws.rds.Cluster')
    @patch('lib.tap_stack.aws.rds.ClusterInstance')
    @patch('lib.tap_stack.aws.route53.HealthCheck')
    def test_tap_stack_init_method_execution(self, mock_health_check, mock_cluster_instance,
                                           mock_cluster, mock_global_cluster, mock_provider,
                                           mock_component_init):
        """Test that TapStack __init__ method executes without errors with mocked resources."""
        from unittest.mock import MagicMock

        # Mock ComponentResource init
        mock_component_init.return_value = None

        # Mock providers
        mock_primary_provider = MagicMock()
        mock_secondary_provider = MagicMock()
        mock_provider.side_effect = [mock_primary_provider, mock_secondary_provider]

        # Mock global cluster
        mock_global_cluster_instance = MagicMock()
        mock_global_cluster_instance.id = "global-cluster-123"
        mock_global_cluster.return_value = mock_global_cluster_instance

        # Mock clusters with proper attributes but avoid depends_on validation
        mock_primary_cluster = MagicMock()
        mock_primary_cluster.id = "primary-cluster-123"
        mock_primary_cluster.endpoint = "primary.endpoint.com"
        mock_primary_cluster.reader_endpoint = "primary-ro.endpoint.com"
        mock_primary_cluster.arn = "arn:aws:rds:us-east-1:123456789012:cluster:primary"

        mock_secondary_cluster = MagicMock()
        mock_secondary_cluster.id = "secondary-cluster-123"
        mock_secondary_cluster.endpoint = "secondary.endpoint.com"
        mock_secondary_cluster.reader_endpoint = "secondary-ro.endpoint.com"
        mock_secondary_cluster.arn = "arn:aws:rds:us-west-2:123456789012:cluster:secondary"

        mock_cluster.side_effect = [mock_primary_cluster, mock_secondary_cluster]

        # Mock cluster instances
        mock_primary_instance = MagicMock()
        mock_secondary_instance = MagicMock()
        mock_cluster_instance.side_effect = [mock_primary_instance, mock_secondary_instance]

        # Mock health check
        mock_health_check_instance = MagicMock()
        mock_health_check.return_value = mock_health_check_instance

        # Mock ResourceOptions to avoid depends_on validation
        with patch('lib.tap_stack.ResourceOptions') as mock_resource_options_class:
            mock_resource_options_instance = MagicMock()
            mock_resource_options_class.return_value = mock_resource_options_instance

            # Mock private methods
            with patch.object(TapStack, '_create_kms_key') as mock_create_kms, \
                 patch.object(TapStack, '_create_vpc') as mock_create_vpc, \
                 patch.object(TapStack, '_create_subnet_group') as mock_create_subnet_group, \
                 patch.object(TapStack, '_create_security_group') as mock_create_sg, \
                 patch.object(TapStack, '_get_db_password') as mock_get_password, \
                 patch.object(TapStack, '_create_cloudwatch_alarms') as mock_create_alarms, \
                 patch.object(TapStack, 'register_outputs') as mock_register_outputs:

                # Setup mock returns
                mock_kms_key = MagicMock()
                mock_kms_key.arn = "arn:aws:kms:us-east-1:123456789012:key/test-key"
                mock_create_kms.return_value = mock_kms_key

                mock_vpc_result = {
                    "vpc": MagicMock(),
                    "subnets": [MagicMock()],
                    "route_table": MagicMock()
                }
                mock_create_vpc.return_value = mock_vpc_result

                mock_subnet_group = MagicMock()
                mock_subnet_group.name = "test-subnet-group"
                mock_create_subnet_group.return_value = mock_subnet_group

                mock_sg = MagicMock()
                mock_sg.id = "sg-12345"
                mock_create_sg.return_value = mock_sg

                mock_get_password.return_value = "test-password"

                # Create TapStack instance
                args = TapStackArgs()
                stack = TapStack("test-stack", args)

                # Verify ComponentResource was initialized
                mock_component_init.assert_called_once()

                # Verify providers were created
                self.assertEqual(mock_provider.call_count, 2)

                # Verify KMS keys were created
                self.assertEqual(mock_create_kms.call_count, 2)

                # Verify VPCs were created
                self.assertEqual(mock_create_vpc.call_count, 2)

                # Verify subnet groups were created
                self.assertEqual(mock_create_subnet_group.call_count, 2)

                # Verify security groups were created
                self.assertEqual(mock_create_sg.call_count, 2)

                # Verify global cluster was created
                mock_global_cluster.assert_called_once()

                # Verify clusters were created
                self.assertEqual(mock_cluster.call_count, 2)

                # Verify cluster instances were created
                self.assertEqual(mock_cluster_instance.call_count, 2)

                # Verify health checks were created (TCP + calculated)
                self.assertEqual(mock_health_check.call_count, 2)

                # Verify CloudWatch alarms were created
                mock_create_alarms.assert_called_once()

                # Verify outputs were registered
                mock_register_outputs.assert_called_once()

    @patch('lib.tap_stack.aws.kms.Key')
    @patch('lib.tap_stack.aws.kms.Alias')
    @patch('lib.tap_stack.pulumi.ResourceOptions')
    def test_create_kms_key_method_full(self, mock_resource_options, mock_alias, mock_key):
        """Test the _create_kms_key method with full mocking."""
        from unittest.mock import MagicMock

        # Mock the KMS key and alias
        mock_key_instance = MagicMock()
        mock_key_instance.arn = "arn:aws:kms:us-east-1:123456789012:key/test-key"
        mock_key.return_value = mock_key_instance

        mock_alias_instance = MagicMock()
        mock_alias.return_value = mock_alias_instance

        mock_resource_options_instance = MagicMock()
        mock_resource_options.return_value = mock_resource_options_instance

        # Create a minimal stack instance
        stack = object.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack._transformations = []  # Add required attribute

        # Mock provider
        mock_provider = MagicMock()

        # Call the method
        result = stack._create_kms_key("test-region", mock_provider)

        # Verify the key was created and returned
        self.assertEqual(result, mock_key_instance)
        mock_key.assert_called_once()
        mock_alias.assert_called_once()

    @patch('lib.tap_stack.aws.ec2.Vpc')
    @patch('lib.tap_stack.aws.ec2.Subnet')
    @patch('lib.tap_stack.aws.ec2.InternetGateway')
    @patch('lib.tap_stack.aws.ec2.RouteTable')
    @patch('lib.tap_stack.aws.ec2.RouteTableAssociation')
    @patch('lib.tap_stack.aws.get_availability_zones')
    @patch('lib.tap_stack.pulumi.ResourceOptions')
    @patch('lib.tap_stack.pulumi.InvokeOptions')
    def test_create_vpc_method_full(self, mock_invoke_options, mock_resource_options,
                                  mock_get_az, mock_route_assoc, mock_route_table,
                                  mock_igw, mock_subnet, mock_vpc):
        """Test the _create_vpc method with full mocking."""
        from unittest.mock import MagicMock

        # Mock availability zones
        mock_az_result = MagicMock()
        mock_az_result.names = ["us-east-1a", "us-east-1b", "us-east-1c"]
        mock_get_az.return_value = mock_az_result

        # Mock VPC
        mock_vpc_instance = MagicMock()
        mock_vpc_instance.id = "vpc-12345"
        mock_vpc.return_value = mock_vpc_instance

        # Mock subnets
        mock_subnet_instance = MagicMock()
        mock_subnet_instance.id = "subnet-12345"
        mock_subnet.return_value = mock_subnet_instance

        # Mock other components
        mock_igw_instance = MagicMock()
        mock_igw.return_value = mock_igw_instance

        mock_route_table_instance = MagicMock()
        mock_route_table.return_value = mock_route_table_instance

        mock_route_assoc_instance = MagicMock()
        mock_route_assoc.return_value = mock_route_assoc_instance

        mock_resource_options_instance = MagicMock()
        mock_resource_options.return_value = mock_resource_options_instance

        mock_invoke_options_instance = MagicMock()
        mock_invoke_options.return_value = mock_invoke_options_instance

        # Create a minimal stack instance
        stack = object.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack._transformations = []

        # Mock provider
        mock_provider = MagicMock()

        # Call the method
        result = stack._create_vpc("test-region", mock_provider)

        # Verify the result structure
        self.assertIn('vpc', result)
        self.assertIn('subnets', result)
        self.assertIn('route_table', result)
        self.assertEqual(result['vpc'], mock_vpc_instance)
        self.assertEqual(len(result['subnets']), 3)  # 3 subnets for 3 AZs

        # Verify calls
        mock_vpc.assert_called_once()
        self.assertEqual(mock_subnet.call_count, 3)  # 3 subnets
        mock_igw.assert_called_once()
        mock_route_table.assert_called_once()
        self.assertEqual(mock_route_assoc.call_count, 3)  # 3 associations

    @patch('lib.tap_stack.aws.rds.SubnetGroup')
    @patch('lib.tap_stack.pulumi.ResourceOptions')
    def test_create_subnet_group_method(self, mock_resource_options, mock_subnet_group):
        """Test the _create_subnet_group method."""
        from unittest.mock import MagicMock

        mock_sg_instance = MagicMock()
        mock_sg_instance.name = "test-subnet-group"
        mock_subnet_group.return_value = mock_sg_instance

        mock_resource_options_instance = MagicMock()
        mock_resource_options.return_value = mock_resource_options_instance

        # Create a minimal stack instance
        stack = object.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack._transformations = []

        # Mock provider and subnets
        mock_provider = MagicMock()
        mock_subnets = [MagicMock(), MagicMock()]

        # Call the method
        result = stack._create_subnet_group("test-region", mock_subnets, mock_provider)

        # Verify result
        self.assertEqual(result, mock_sg_instance)
        mock_subnet_group.assert_called_once()

    @patch('lib.tap_stack.aws.ec2.SecurityGroup')
    @patch('lib.tap_stack.aws.ec2.SecurityGroupIngressArgs')
    @patch('lib.tap_stack.aws.ec2.SecurityGroupEgressArgs')
    @patch('lib.tap_stack.pulumi.ResourceOptions')
    def test_create_security_group_method_full(self, mock_resource_options,
                                             mock_egress_args, mock_ingress_args, mock_sg):
        """Test the _create_security_group method with full mocking."""
        from unittest.mock import MagicMock

        mock_sg_instance = MagicMock()
        mock_sg_instance.id = "sg-12345"
        mock_sg_instance.name = "test-sg"
        mock_sg.return_value = mock_sg_instance

        mock_resource_options_instance = MagicMock()
        mock_resource_options.return_value = mock_resource_options_instance

        mock_ingress_args_instance = MagicMock()
        mock_ingress_args.return_value = mock_ingress_args_instance

        mock_egress_args_instance = MagicMock()
        mock_egress_args.return_value = mock_egress_args_instance

        # Create a minimal stack instance
        stack = object.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack._transformations = []

        # Mock provider and VPC
        mock_provider = MagicMock()
        mock_vpc = MagicMock()
        mock_vpc.id = "vpc-12345"

        # Call the method
        result = stack._create_security_group("test-region", mock_vpc, mock_provider)

        # Verify result
        self.assertEqual(result, mock_sg_instance)
        mock_sg.assert_called_once()

    @patch('lib.tap_stack.aws.secretsmanager.get_secret_version')
    @patch('lib.tap_stack.pulumi.Output.secret')
    def test_get_db_password_with_secret(self, mock_output_secret, mock_get_secret):
        """Test _get_db_password method with secret ARN."""
        from unittest.mock import MagicMock

        # Mock secret retrieval
        mock_secret_result = MagicMock()
        mock_secret_result.secret_string = "secret-password"
        mock_get_secret.return_value = mock_secret_result

        mock_output_instance = MagicMock()
        mock_output_secret.return_value = mock_output_instance

        # Create a minimal stack instance
        stack = object.__new__(TapStack)

        # Call the method with secret ARN
        result = stack._get_db_password("arn:aws:secretsmanager:us-east-1:123456789012:secret:test")

        # Verify result
        self.assertEqual(result, mock_output_instance)
        mock_get_secret.assert_called_once_with(secret_id="arn:aws:secretsmanager:us-east-1:123456789012:secret:test")
        mock_output_secret.assert_called_once_with("secret-password")

    @patch('lib.tap_stack.pulumi.Output.secret')
    def test_get_db_password_without_secret(self, mock_output_secret):
        """Test _get_db_password method without secret ARN."""
        from unittest.mock import MagicMock

        mock_output_instance = MagicMock()
        mock_output_secret.return_value = mock_output_instance

        # Create a minimal stack instance
        stack = object.__new__(TapStack)

        # Call the method without secret ARN
        result = stack._get_db_password(None)

        # Verify result
        self.assertEqual(result, mock_output_instance)
        mock_output_secret.assert_called_once_with("ChangeMe123!")

    @patch('lib.tap_stack.aws.cloudwatch.MetricAlarm')
    @patch('lib.tap_stack.pulumi.ResourceOptions')
    def test_create_cloudwatch_alarms_method_full(self, mock_resource_options, mock_alarm):
        """Test the _create_cloudwatch_alarms method with full mocking."""
        from unittest.mock import MagicMock

        mock_alarm_instance = MagicMock()
        mock_alarm.return_value = mock_alarm_instance

        mock_resource_options_instance = MagicMock()
        mock_resource_options.return_value = mock_resource_options_instance

        # Create a minimal stack instance
        stack = object.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack._transformations = []

        # Mock clusters and providers
        mock_primary_cluster = MagicMock()
        mock_primary_cluster.cluster_identifier = "primary-cluster"
        stack.primary_cluster = mock_primary_cluster

        mock_secondary_cluster = MagicMock()
        mock_secondary_cluster.cluster_identifier = "secondary-cluster"
        stack.secondary_cluster = mock_secondary_cluster

        mock_primary_provider = MagicMock()
        stack.primary_provider = mock_primary_provider

        mock_secondary_provider = MagicMock()
        stack.secondary_provider = mock_secondary_provider

        # Call the method
        stack._create_cloudwatch_alarms()

        # Verify alarms were created (should be 3 alarms total)
        self.assertEqual(mock_alarm.call_count, 3)

    @patch('lib.tap_stack.aws.route53.Record')
    @patch('lib.tap_stack.aws.route53.RecordFailoverRoutingPolicyArgs')
    @patch('lib.tap_stack.pulumi.ResourceOptions')
    def test_create_route53_records_method_full(self, mock_resource_options,
                                              mock_failover_args, mock_record):
        """Test the _create_route53_records method with full mocking."""
        from unittest.mock import MagicMock

        mock_record_instance = MagicMock()
        mock_record.return_value = mock_record_instance

        mock_failover_args_instance = MagicMock()
        mock_failover_args.return_value = mock_failover_args_instance

        mock_resource_options_instance = MagicMock()
        mock_resource_options.return_value = mock_resource_options_instance

        # Create a minimal stack instance
        stack = object.__new__(TapStack)
        stack.environment_suffix = 'test'
        stack._transformations = []

        # Mock clusters and health check
        mock_primary_cluster = MagicMock()
        mock_primary_cluster.endpoint = "primary.endpoint.com"
        mock_primary_cluster.reader_endpoint = "primary-ro.endpoint.com"

        mock_secondary_cluster = MagicMock()
        mock_secondary_cluster.endpoint = "secondary.endpoint.com"
        mock_secondary_cluster.reader_endpoint = "secondary-ro.endpoint.com"

        mock_health_check = MagicMock()
        mock_health_check.id = "health-check-123"

        stack.primary_cluster = mock_primary_cluster
        stack.secondary_cluster = mock_secondary_cluster
        stack.primary_health_check = mock_health_check

        # Call the method
        stack._create_route53_records("Z123456789", "test.example.com")

        # Verify records were created (should be 2 records)
        self.assertEqual(mock_record.call_count, 2)


if __name__ == '__main__':
    unittest.main()
