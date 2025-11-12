import unittest

import pulumi

from lib.compute import ComputeStack
from lib.network import NetworkStack
from lib.payment_stack import PaymentProcessingStack
from lib.storage import StorageStack
from lib.tap_stack import TapStack, TapStackArgs


class PulumiMocks(pulumi.runtime.Mocks):
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs.copy()
        if "name" in outputs:
            outputs["name"] = outputs["name"]
        if "id" not in outputs:
            outputs["id"] = f"{args.name}_id"
        return [args.name + "_id", outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == 'aws:index/getAvailabilityZones:getAvailabilityZones':
            return {
                'names': ['us-east-1a', 'us-east-1b', 'us-east-1c'],
                'zoneIds': ['use1-az1', 'use1-az2', 'use1-az3'],
            }
        return {}

class TestTapStack(unittest.TestCase):
    """Integration tests for TapStack infrastructure."""
    
    def setUp(self):
        # Set up Pulumi test environment for each test
        pulumi.runtime.set_mocks(PulumiMocks())
    
    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test the creation of TapStack with all components."""
        # Create TapStack arguments
        args = TapStackArgs(
            environment_suffix='test',
            tags={
                'Environment': 'test',
                'Project': 'tap-test'
            }
        )
        
        # Create TapStack instance
        stack = TapStack('test-stack', args)
        
        def check_stack(outputs):
            self.assertEqual(stack.environment_suffix, 'test')
            self.assertEqual(stack.tags['Environment'], 'test')
            return True
        
        return pulumi.Output.all().apply(check_stack)

    @pulumi.runtime.test
    def test_network_integration(self):
        """Test Network infrastructure creation and configuration."""
        network = NetworkStack(
            name='test-network',
            vpc_cidr='10.0.0.0/16',
            environment='test',
            tags={'Environment': 'test'}
        )
        
        def check_network(outputs):
            self.assertIsNotNone(network.vpc)
            self.assertIsNotNone(network.public_subnets)
            self.assertEqual(len(network.public_subnets), 2)
            self.assertIsNotNone(network.private_subnets)
            self.assertEqual(len(network.private_subnets), 2)
            return True
        
        return pulumi.Output.all().apply(check_network)

    @pulumi.runtime.test
    def test_storage_integration(self):
        """Test Storage infrastructure creation and configuration."""
        # First create network for dependencies
        network = NetworkStack(
            name='test-network',
            vpc_cidr='10.0.0.0/16',
            environment='test',
            tags={'Environment': 'test'}
        )
        
        storage = StorageStack(
            name='test-storage',
            environment='test',
            environment_suffix='test',
            vpc_id=network.vpc.id,
            private_subnet_ids=[subnet.id for subnet in network.private_subnets],
            db_security_group_id=network.vpc.default_security_group_id,
            enable_multi_az=False,
            db_instance_class='db.t3.micro',
            dynamodb_read_capacity=5,
            dynamodb_write_capacity=5,
            log_retention_days=7,
            tags={'Environment': 'test'}
        )
        
        def check_storage(outputs):
            self.assertIsNotNone(storage.dynamodb_table)
            self.assertIsNotNone(storage.db_password)
            self.assertIsNotNone(storage.rds_instance)
            return True
        
        return pulumi.Output.all().apply(check_storage)

    @pulumi.runtime.test
    def test_compute_integration(self):
        """Test Compute infrastructure creation and configuration."""
        # Create dependencies first
        network = NetworkStack(
            name='test-network',
            vpc_cidr='10.0.0.0/16',
            environment='test',
            tags={'Environment': 'test'}
        )
        
        storage = StorageStack(
            name='test-storage',
            environment='test',
            environment_suffix='test',
            vpc_id=network.vpc.id,
            private_subnet_ids=[subnet.id for subnet in network.private_subnets],
            db_security_group_id=network.vpc.default_security_group_id,
            enable_multi_az=False,
            db_instance_class='db.t3.micro',
            dynamodb_read_capacity=5,
            dynamodb_write_capacity=5,
            log_retention_days=7,
            tags={'Environment': 'test'}
        )
        
        compute = ComputeStack(
            name='test-compute',
            environment='test',
            environment_suffix='test',
            vpc_id=network.vpc.id,
            private_subnet_ids=[subnet.id for subnet in network.private_subnets],
            lambda_security_group_id=network.vpc.default_security_group_id,
            dynamodb_table_name=storage.dynamodb_table.name,
            dynamodb_table_arn=storage.dynamodb_table.arn,
            rds_endpoint=storage.rds_instance.endpoint,
            tags={'Environment': 'test'}
        )
        
        def check_compute(outputs):
            self.assertIsNotNone(compute.lambda_function)
            self.assertIsNotNone(compute.lambda_role)
            self.assertIsNotNone(compute.lambda_log_group)
            return True
        
        return pulumi.Output.all().apply(check_compute)

    @pulumi.runtime.test
    def test_payment_processing_integration(self):
        """Test payment processing infrastructure creation."""
        payment_stack = PaymentProcessingStack(
            name='test-payment',
            environment='test',
            environment_suffix='test',
            vpc_cidr='10.0.0.0/16',
            region='us-east-1',
            cost_center='TEST123',
            enable_multi_az=False,
            db_instance_class='db.t3.micro',
            dynamodb_read_capacity=5,
            dynamodb_write_capacity=5,
            log_retention_days=7
        )
        
        def check_payment_stack(outputs):
            # Validate network outputs
            self.assertIsNotNone(payment_stack.vpc_id)
            self.assertIsNotNone(payment_stack.public_subnet_ids)
            self.assertIsNotNone(payment_stack.private_subnet_ids)
            
            # Validate compute outputs 
            self.assertIsNotNone(payment_stack.api_gateway_url)
            self.assertIsNotNone(payment_stack.lambda_function_name)
            
            # Validate storage outputs
            self.assertIsNotNone(payment_stack.dynamodb_table_name)
            self.assertIsNotNone(payment_stack.rds_endpoint)
            self.assertIsNotNone(payment_stack.audit_bucket_name)
            
            # Validate common tags
            self.assertEqual(payment_stack.common_tags['Environment'], 'test')
            self.assertEqual(payment_stack.common_tags['CostCenter'], 'TEST123')
            self.assertEqual(payment_stack.common_tags['Project'], 'PaymentProcessing')
            
            return True
        
        return pulumi.Output.all().apply(check_payment_stack)

if __name__ == '__main__':
    unittest.main()