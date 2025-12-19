"""
Unit tests for the Payment Processing Infrastructure Migration (__main__.py)
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import pulumi
import json


class MyMocks(pulumi.runtime.Mocks):
    """Mock Pulumi resource calls for testing"""
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        outputs = args.inputs
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {**args.inputs, "id": f"vpc-{args.name}"}
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {**args.inputs, "id": f"subnet-{args.name}"}
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs = {**args.inputs, "id": f"igw-{args.name}"}
        elif args.typ == "aws:ec2/eip:Eip":
            outputs = {**args.inputs, "id": f"eip-{args.name}", "allocation_id": f"eipalloc-{args.name}"}
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs = {**args.inputs, "id": f"nat-{args.name}"}
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs = {**args.inputs, "id": f"rt-{args.name}"}
        elif args.typ == "aws:ec2/route:Route":
            outputs = {**args.inputs, "id": f"route-{args.name}"}
        elif args.typ == "aws:ec2/routeTableAssociation:RouteTableAssociation":
            outputs = {**args.inputs, "id": f"rta-{args.name}"}
        elif args.typ == "aws:kms/key:Key":
            outputs = {**args.inputs, "id": f"kms-{args.name}", "arn": f"arn:aws:kms:us-east-1:123456789012:key/{args.name}"}
        elif args.typ == "aws:kms/alias:Alias":
            outputs = {**args.inputs, "id": f"alias/{args.name}"}
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {**args.inputs, "id": f"sg-{args.name}"}
        elif args.typ == "aws:ec2/securityGroupRule:SecurityGroupRule":
            outputs = {**args.inputs, "id": f"sgr-{args.name}"}
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {**args.inputs, "id": f"bucket-{args.name}", "bucket": f"bucket-{args.name}", "arn": f"arn:aws:s3:::{args.name}"}
        elif args.typ == "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock":
            outputs = {**args.inputs, "id": f"bpab-{args.name}"}
        elif args.typ == "aws:iam/role:Role":
            outputs = {**args.inputs, "id": f"role-{args.name}", "arn": f"arn:aws:iam::123456789012:role/{args.name}", "name": args.name}
        elif args.typ == "aws:iam/policy:Policy":
            outputs = {**args.inputs, "id": f"policy-{args.name}", "arn": f"arn:aws:iam::123456789012:policy/{args.name}"}
        elif args.typ == "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
            outputs = {**args.inputs, "id": f"rpa-{args.name}"}
        elif args.typ == "aws:iam/instanceProfile:InstanceProfile":
            outputs = {**args.inputs, "id": f"ip-{args.name}", "arn": f"arn:aws:iam::123456789012:instance-profile/{args.name}"}
        elif args.typ == "aws:ec2/launchTemplate:LaunchTemplate":
            outputs = {**args.inputs, "id": f"lt-{args.name}"}
        elif args.typ == "aws:lb/targetGroup:TargetGroup":
            outputs = {**args.inputs, "id": f"tg-{args.name}", "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/{args.name}/abc123"}
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs = {**args.inputs, "id": f"lb-{args.name}", "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/{args.name}/abc123", "dns_name": f"{args.name}.elb.amazonaws.com"}
        elif args.typ == "aws:lb/listener:Listener":
            outputs = {**args.inputs, "id": f"listener-{args.name}", "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/{args.name}"}
        elif args.typ == "aws:autoscaling/group:Group":
            outputs = {**args.inputs, "id": f"asg-{args.name}", "name": args.name}
        elif args.typ == "aws:rds/subnetGroup:SubnetGroup":
            outputs = {**args.inputs, "id": f"dbsg-{args.name}", "name": args.name}
        elif args.typ == "aws:rds/instance:Instance":
            outputs = {**args.inputs, "id": f"db-{args.name}", "endpoint": f"{args.name}.cluster-xyz.us-east-1.rds.amazonaws.com:3306", "address": f"{args.name}.cluster-xyz.us-east-1.rds.amazonaws.com"}
        else:
            outputs = {**args.inputs, "id": f"{args.typ}-{args.name}"}
        return [args.name, outputs]

    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {"names": ["us-east-1a", "us-east-1b", "us-east-1c"], "state": "available"}
        elif args.token == "aws:ec2/getAmi:getAmi":
            return {"id": "ami-12345678", "name": "amzn2-ami-hvm-2.0.20211001.1-x86_64-gp2"}
        return {}


pulumi.runtime.set_mocks(MyMocks())


class TestPaymentInfrastructure(unittest.TestCase):
    """Test cases for Payment Processing Infrastructure"""

    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi_aws.ec2.get_ami')
    @patch('os.environ.get')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    def test_infrastructure_deployment(self, mock_config, mock_export, mock_env_get, mock_get_ami, mock_get_azs):
        """Test that all infrastructure components are created"""
        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.side_effect = lambda key: {
            'environmentSuffix': 'test',
            'dbUsername': 'admin'
        }.get(key, 'default')
        config_instance.get.side_effect = lambda key: {
            'instanceType': 't3.micro',
            'dbInstanceClass': 'db.t3.micro',
            'environmentName': 'test'
        }.get(key)
        mock_config.return_value = config_instance

        # Mock environment variable for password
        mock_env_get.return_value = None

        # Mock get_availability_zones
        mock_get_azs.return_value = Mock(names=['us-east-1a', 'us-east-1b'])

        # Mock get_ami
        mock_get_ami.return_value = Mock(id='ami-12345')

        # Import main module
        import sys
        modules_to_remove = [m for m in sys.modules if m == 'lib.__main__']
        for m in modules_to_remove:
            del sys.modules[m]

        import lib.__main__ as main_module

        # Verify VPC was created
        self.assertIsNotNone(main_module.vpc)

        # Verify subnets were created
        self.assertIsNotNone(main_module.public_subnet_1)
        self.assertIsNotNone(main_module.public_subnet_2)
        self.assertIsNotNone(main_module.private_subnet_1)
        self.assertIsNotNone(main_module.private_subnet_2)

        # Verify networking components
        self.assertIsNotNone(main_module.igw)
        self.assertIsNotNone(main_module.nat_gateway)
        self.assertIsNotNone(main_module.eip_1)

        # Verify security groups
        self.assertIsNotNone(main_module.alb_sg)
        self.assertIsNotNone(main_module.ec2_sg)
        self.assertIsNotNone(main_module.rds_sg)

        # Verify S3 buckets
        self.assertIsNotNone(main_module.logs_bucket)
        self.assertIsNotNone(main_module.static_bucket)

        # Verify RDS components
        self.assertIsNotNone(main_module.kms_key)
        self.assertIsNotNone(main_module.rds_instance)

        # Verify load balancer
        self.assertIsNotNone(main_module.alb)
        self.assertIsNotNone(main_module.target_group)

        # Verify auto scaling
        self.assertIsNotNone(main_module.asg)
        self.assertIsNotNone(main_module.launch_template)

    @patch('os.environ.get')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    def test_exports_are_created(self, mock_config, mock_export, mock_env_get):
        """Test that all required outputs are exported"""
        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.side_effect = lambda key: {
            'environmentSuffix': 'test',
            'dbUsername': 'admin'
        }.get(key, 'default')
        config_instance.get.side_effect = lambda key: {
            'instanceType': 't3.micro',
            'dbInstanceClass': 'db.t3.micro',
            'environmentName': 'test'
        }.get(key)
        mock_config.return_value = config_instance

        # Mock environment variable for password
        mock_env_get.return_value = "TestPassword123!"

        # Import main module
        import sys
        modules_to_remove = [m for m in sys.modules if m == 'lib.__main__']
        for m in modules_to_remove:
            del sys.modules[m]

        import lib.__main__

        # Verify exports were called
        self.assertTrue(mock_export.called)
        export_calls = [call[0][0] for call in mock_export.call_args_list]
        expected_exports = [
            'vpc_id', 'alb_dns_name', 'alb_arn',
            'rds_endpoint', 'rds_address',
            'logs_bucket_name', 'static_bucket_name',
            'asg_name', 'target_group_arn'
        ]
        for expected in expected_exports:
            self.assertIn(expected, export_calls, f"Export '{expected}' not found")

    @patch('os.environ.get')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    def test_password_from_environment(self, mock_config, mock_export, mock_env_get):
        """Test that password is taken from environment variable when available"""
        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.side_effect = lambda key: {
            'environmentSuffix': 'test',
            'dbUsername': 'admin'
        }.get(key, 'default')
        config_instance.get.return_value = None
        mock_config.return_value = config_instance

        # Set environment variable for password
        test_password = "EnvironmentPassword123!"
        mock_env_get.return_value = test_password

        # Import main module
        import sys
        modules_to_remove = [m for m in sys.modules if m == 'lib.__main__']
        for m in modules_to_remove:
            del sys.modules[m]

        import lib.__main__ as main_module

        # Verify password was set from environment
        self.assertEqual(main_module.db_password, test_password)

    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi_aws.ec2.get_ami')
    @patch('os.environ.get')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    def test_password_generation_fallback(self, mock_config, mock_export, mock_env_get, mock_get_ami, mock_get_azs):
        """Test that password is generated based on suffix when env var not set"""
        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.side_effect = lambda key: {
            'environmentSuffix': 'prod',
            'dbUsername': 'admin'
        }.get(key, 'default')
        config_instance.get.return_value = None
        mock_config.return_value = config_instance

        # No environment variable for password
        mock_env_get.return_value = None

        # Mock get_availability_zones
        mock_get_azs.return_value = Mock(names=['us-east-1a', 'us-east-1b'])

        # Mock get_ami
        mock_get_ami.return_value = Mock(id='ami-12345')

        # Import main module
        import sys
        modules_to_remove = [m for m in sys.modules if m == 'lib.__main__']
        for m in modules_to_remove:
            del sys.modules[m]

        import lib.__main__ as main_module

        # Verify password was generated based on suffix
        expected_password = "DbPass-prod-2024!"
        self.assertEqual(main_module.db_password, expected_password)

    @patch('pulumi_aws.get_availability_zones')
    @patch('pulumi_aws.ec2.get_ami')
    @patch('os.environ.get')
    @patch('pulumi.export')
    @patch('pulumi.Config')
    def test_tags_are_applied(self, mock_config, mock_export, mock_env_get, mock_get_ami, mock_get_azs):
        """Test that common tags are properly configured"""
        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.side_effect = lambda key: {
            'environmentSuffix': 'staging',
            'dbUsername': 'admin'
        }.get(key, 'default')
        config_instance.get.side_effect = lambda key: {
            'environmentName': 'staging'
        }.get(key)
        mock_config.return_value = config_instance

        mock_env_get.return_value = None

        # Mock get_availability_zones
        mock_get_azs.return_value = Mock(names=['us-east-1a', 'us-east-1b'])

        # Mock get_ami
        mock_get_ami.return_value = Mock(id='ami-12345')

        # Import main module
        import sys
        modules_to_remove = [m for m in sys.modules if m == 'lib.__main__']
        for m in modules_to_remove:
            del sys.modules[m]

        import lib.__main__ as main_module

        # Verify tags structure
        self.assertIn('Environment', main_module.common_tags)
        self.assertIn('CostCenter', main_module.common_tags)
        self.assertIn('MigrationPhase', main_module.common_tags)
        self.assertIn('ManagedBy', main_module.common_tags)
        self.assertEqual(main_module.common_tags['Environment'], 'staging')
        self.assertEqual(main_module.common_tags['CostCenter'], 'payment-processing')


if __name__ == "__main__":
    unittest.main()