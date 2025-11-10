"""
Unit tests for the main entry point (__main__.py) using Pulumi testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import pulumi


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource calls for testing"""
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {**args.inputs, "id": "vpc-12345", "cidr_block": args.inputs.get("cidr_block", "10.0.0.0/16")}
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {**args.inputs, "id": f"subnet-{args.name}", "availability_zone": args.inputs.get("availability_zone", "us-east-1a")}
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {**args.inputs, "id": f"sg-{args.name}"}
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs = {**args.inputs, "id": f"lb-{args.name}", "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/{args.name}/abc123", "dns_name": f"{args.name}.elb.amazonaws.com"}
        elif args.typ == "aws:lb/targetGroup:TargetGroup":
            outputs = {**args.inputs, "id": f"tg-{args.name}", "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/{args.name}/abc123"}
        elif args.typ == "aws:rds/cluster:Cluster":
            outputs = {**args.inputs, "id": f"cluster-{args.name}", "endpoint": f"{args.name}.cluster-xyz.us-east-1.rds.amazonaws.com", "reader_endpoint": f"{args.name}.cluster-ro-xyz.us-east-1.rds.amazonaws.com"}
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {**args.inputs, "id": args.inputs.get("bucket", f"bucket-{args.name}"), "bucket": args.inputs.get("bucket", f"bucket-{args.name}")}
        elif args.typ == "aws:ec2/eip:Eip":
            outputs = {**args.inputs, "id": f"eip-{args.name}", "public_ip": "1.2.3.4"}
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs = {**args.inputs, "id": f"igw-{args.name}"}
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs = {**args.inputs, "id": f"nat-{args.name}"}
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs = {**args.inputs, "id": f"rt-{args.name}"}
        elif args.typ == "aws:iam/role:Role":
            outputs = {**args.inputs, "id": f"role-{args.name}", "arn": f"arn:aws:iam::123456789012:role/{args.name}", "name": args.name}
        elif args.typ == "aws:iam/instanceProfile:InstanceProfile":
            outputs = {**args.inputs, "id": f"profile-{args.name}", "arn": f"arn:aws:iam::123456789012:instance-profile/{args.name}"}
        elif args.typ == "aws:ec2/launchTemplate:LaunchTemplate":
            outputs = {**args.inputs, "id": f"lt-{args.name}"}
        elif args.typ == "aws:autoscaling/group:Group":
            outputs = {**args.inputs, "id": f"asg-{args.name}", "name": args.name}
        elif args.typ == "aws:rds/subnetGroup:SubnetGroup":
            outputs = {**args.inputs, "id": f"subnet-group-{args.name}", "name": args.name}
        elif args.typ == "aws:rds/clusterInstance:ClusterInstance":
            outputs = {**args.inputs, "id": f"db-instance-{args.name}"}
        elif args.typ == "aws:secretsmanager/secret:Secret":
            outputs = {**args.inputs, "id": f"secret-{args.name}", "arn": f"arn:aws:secretsmanager:us-east-1:123456789012:secret:{args.name}"}
        else:
            outputs = {**args.inputs, "id": f"{args.typ}-{args.name}"}
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:ec2/getAmi:getAmi":
            return {"id": "ami-12345", "architecture": "x86_64"}
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestMainStack(unittest.TestCase):
    """Test cases for main entry point"""

    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    def test_stack_creates_vpc_component(self, mock_config, mock_export, mock_get_azs):
        """Test that VPC component is created with correct configuration"""
        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.return_value = 'test-env'
        config_instance.get.side_effect = lambda key: {
            'instanceType': 't3.micro',
            'dbInstanceClass': 'db.t3.micro',
            'dbUsername': 'admin',
            'environmentName': 'test'
        }.get(key)
        config_instance.require_secret.return_value = 'password123'
        mock_config.return_value = config_instance

        # Mock get_availability_zones
        mock_get_azs.return_value = Mock(names=['us-east-1a', 'us-east-1b'])

        # Import main module
        import sys
        # Remove from sys.modules to force reimport
        modules_to_remove = [m for m in sys.modules if m == 'lib.__main__']
        for m in modules_to_remove:
            del sys.modules[m]

        import lib.__main__

        # VPC component should be created
        self.assertTrue(hasattr(lib.__main__, 'vpc'))

    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    def test_stack_creates_alb_component(self, mock_config, mock_export, mock_get_azs):
        """Test that ALB component is created"""
        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.return_value = 'test-env'
        config_instance.get.side_effect = lambda key: {
            'instanceType': 't3.micro',
            'dbInstanceClass': 'db.t3.micro',
            'dbUsername': 'admin',
            'environmentName': 'test'
        }.get(key)
        config_instance.require_secret.return_value = 'password123'
        mock_config.return_value = config_instance

        # Mock get_availability_zones
        mock_get_azs.return_value = Mock(names=['us-east-1a', 'us-east-1b'])

        # Import main module
        import sys
        modules_to_remove = [m for m in sys.modules if m == 'lib.__main__']
        for m in modules_to_remove:
            del sys.modules[m]

        import lib.__main__

        self.assertTrue(hasattr(lib.__main__, 'alb'))

    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    def test_stack_creates_asg_component(self, mock_config, mock_export, mock_get_azs):
        """Test that ASG component is created"""
        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.return_value = 'test-env'
        config_instance.get.side_effect = lambda key: {
            'instanceType': 't3.micro',
            'dbInstanceClass': 'db.t3.micro',
            'dbUsername': 'admin',
            'environmentName': 'test'
        }.get(key)
        config_instance.require_secret.return_value = 'password123'
        mock_config.return_value = config_instance

        # Import main module
        import sys
        modules_to_remove = [m for m in sys.modules if m == 'lib.__main__']
        for m in modules_to_remove:
            del sys.modules[m]

        # Mock get_availability_zones
        mock_get_azs.return_value = Mock(names=['us-east-1a', 'us-east-1b'])

        import lib.__main__

        self.assertTrue(hasattr(lib.__main__, 'asg'))

    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    def test_stack_creates_rds_component(self, mock_config, mock_export, mock_get_azs):
        """Test that RDS component is created"""
        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.return_value = 'test-env'
        config_instance.get.side_effect = lambda key: {
            'instanceType': 't3.micro',
            'dbInstanceClass': 'db.t3.micro',
            'dbUsername': 'admin',
            'environmentName': 'test'
        }.get(key)
        config_instance.require_secret.return_value = 'password123'
        mock_config.return_value = config_instance

        # Import main module
        import sys
        modules_to_remove = [m for m in sys.modules if m == 'lib.__main__']
        for m in modules_to_remove:
            del sys.modules[m]

        # Mock get_availability_zones
        mock_get_azs.return_value = Mock(names=['us-east-1a', 'us-east-1b'])

        import lib.__main__

        self.assertTrue(hasattr(lib.__main__, 'rds'))

    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    def test_stack_creates_s3_component(self, mock_config, mock_export, mock_get_azs):
        """Test that S3 component is created"""
        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.return_value = 'test-env'
        config_instance.get.side_effect = lambda key: {
            'instanceType': 't3.micro',
            'dbInstanceClass': 'db.t3.micro',
            'dbUsername': 'admin',
            'environmentName': 'test'
        }.get(key)
        config_instance.require_secret.return_value = 'password123'
        mock_config.return_value = config_instance

        # Import main module
        import sys
        modules_to_remove = [m for m in sys.modules if m == 'lib.__main__']
        for m in modules_to_remove:
            del sys.modules[m]

        # Mock get_availability_zones
        mock_get_azs.return_value = Mock(names=['us-east-1a', 'us-east-1b'])

        import lib.__main__

        self.assertTrue(hasattr(lib.__main__, 's3'))

    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    def test_stack_exports_outputs(self, mock_config, mock_export, mock_get_azs):
        """Test that stack exports required outputs"""
        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.return_value = 'test-env'
        config_instance.get.side_effect = lambda key: {
            'instanceType': 't3.micro',
            'dbInstanceClass': 'db.t3.micro',
            'dbUsername': 'admin',
            'environmentName': 'test'
        }.get(key)
        config_instance.require_secret.return_value = 'password123'
        mock_config.return_value = config_instance

        # Import main module
        import sys
        modules_to_remove = [m for m in sys.modules if m == 'lib.__main__']
        for m in modules_to_remove:
            del sys.modules[m]

        # Mock get_availability_zones
        mock_get_azs.return_value = Mock(names=['us-east-1a', 'us-east-1b'])

        import lib.__main__

        # Verify exports were called
        self.assertTrue(mock_export.called)
        export_calls = [call[0][0] for call in mock_export.call_args_list]
        expected_exports = [
            'vpc_id', 'alb_arn', 'alb_dns_name',
            'rds_cluster_endpoint', 'rds_reader_endpoint',
            'static_assets_bucket', 'logs_bucket'
        ]
        for expected in expected_exports:
            self.assertIn(expected, export_calls)


if __name__ == "__main__":
    unittest.main()
