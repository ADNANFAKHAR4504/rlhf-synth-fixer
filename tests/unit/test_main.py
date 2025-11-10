"""
Unit tests for the main entry point (__main__.py) using Pulumi testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock
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

    def setUp(self):
        """Set up test configuration"""
        # Mock Pulumi configuration
        import os
        os.environ['PULUMI_CONFIG'] = '{}'
        
    @pulumi.runtime.test
    @patch('pulumi.Config.require')
    @patch('pulumi.Config.require_int')
    @patch('pulumi.Config.get_bool')
    def test_stack_creates_vpc_component(self, mock_get_bool, mock_require_int, mock_require):
        """Test that VPC component is created with correct configuration"""
        # Set up mock return values
        mock_require.side_effect = lambda key: {
            'environmentSuffix': 'test-123',
            'environment': 'test',
            'costCenter': 'test-cc'
        }.get(key, 'default')
        mock_require_int.return_value = 1
        mock_get_bool.return_value = False
        
        import sys
        import importlib.util
        spec = importlib.util.spec_from_file_location("__main__", "__main__.py")
        main_module = importlib.util.module_from_spec(spec)
        sys.modules['__main__'] = main_module
        spec.loader.exec_module(main_module)

        # VPC component should be created
        self.assertIsNotNone(main_module.vpc)
        self.assertIsNotNone(main_module.vpc.vpc_id)

    @pulumi.runtime.test
    @patch('pulumi.Config.require')
    @patch('pulumi.Config.require_int')
    @patch('pulumi.Config.get_bool')
    def test_stack_creates_alb_component(self, mock_get_bool, mock_require_int, mock_require):
        """Test that ALB component is created"""
        # Set up mock return values
        mock_require.side_effect = lambda key: {
            'environmentSuffix': 'test-123',
            'environment': 'test',
            'costCenter': 'test-cc'
        }.get(key, 'default')
        mock_require_int.return_value = 1
        mock_get_bool.return_value = False
        
        import sys
        import importlib.util
        spec = importlib.util.spec_from_file_location("__main__", "__main__.py")
        main_module = importlib.util.module_from_spec(spec)
        sys.modules['__main__'] = main_module
        spec.loader.exec_module(main_module)

        self.assertIsNotNone(main_module.alb)
        self.assertIsNotNone(main_module.alb.alb_arn)
        self.assertIsNotNone(main_module.alb.alb_dns_name)

    @pulumi.runtime.test
    @patch('pulumi.Config.require')
    @patch('pulumi.Config.require_int')
    @patch('pulumi.Config.get_bool')
    def test_stack_creates_asg_component(self, mock_get_bool, mock_require_int, mock_require):
        """Test that ASG component is created"""
        # Set up mock return values
        mock_require.side_effect = lambda key: {
            'environmentSuffix': 'test-123',
            'environment': 'test',
            'costCenter': 'test-cc'
        }.get(key, 'default')
        mock_require_int.return_value = 1
        mock_get_bool.return_value = False
        
        import sys
        import importlib.util
        spec = importlib.util.spec_from_file_location("__main__", "__main__.py")
        main_module = importlib.util.module_from_spec(spec)
        sys.modules['__main__'] = main_module
        spec.loader.exec_module(main_module)

        self.assertIsNotNone(main_module.asg)
        self.assertIsNotNone(main_module.asg.asg_name)

    @pulumi.runtime.test
    @patch('pulumi.Config.require')
    @patch('pulumi.Config.require_int')
    @patch('pulumi.Config.get_bool')
    def test_stack_creates_rds_component(self, mock_get_bool, mock_require_int, mock_require):
        """Test that RDS component is created"""
        # Set up mock return values
        mock_require.side_effect = lambda key: {
            'environmentSuffix': 'test-123',
            'environment': 'test',
            'costCenter': 'test-cc'
        }.get(key, 'default')
        mock_require_int.return_value = 1
        mock_get_bool.return_value = False
        
        import sys
        import importlib.util
        spec = importlib.util.spec_from_file_location("__main__", "__main__.py")
        main_module = importlib.util.module_from_spec(spec)
        sys.modules['__main__'] = main_module
        spec.loader.exec_module(main_module)

        self.assertIsNotNone(main_module.rds)
        self.assertIsNotNone(main_module.rds.cluster_endpoint)
        self.assertIsNotNone(main_module.rds.reader_endpoint)

    @pulumi.runtime.test
    @patch('pulumi.Config.require')
    @patch('pulumi.Config.require_int')
    @patch('pulumi.Config.get_bool')
    def test_stack_creates_s3_component(self, mock_get_bool, mock_require_int, mock_require):
        """Test that S3 component is created"""
        # Set up mock return values
        mock_require.side_effect = lambda key: {
            'environmentSuffix': 'test-123',
            'environment': 'test',
            'costCenter': 'test-cc'
        }.get(key, 'default')
        mock_require_int.return_value = 1
        mock_get_bool.return_value = False
        
        import sys
        import importlib.util
        spec = importlib.util.spec_from_file_location("__main__", "__main__.py")
        main_module = importlib.util.module_from_spec(spec)
        sys.modules['__main__'] = main_module
        spec.loader.exec_module(main_module)

        self.assertIsNotNone(main_module.s3)
        self.assertIsNotNone(main_module.s3.static_assets_bucket)
        self.assertIsNotNone(main_module.s3.logs_bucket)

    @pulumi.runtime.test
    @patch('pulumi.Config.require')
    @patch('pulumi.Config.require_int')
    @patch('pulumi.Config.get_bool')
    def test_stack_exports_outputs(self, mock_get_bool, mock_require_int, mock_require):
        """Test that stack exports required outputs"""
        # Set up mock return values
        mock_require.side_effect = lambda key: {
            'environmentSuffix': 'test-123',
            'environment': 'test',
            'costCenter': 'test-cc'
        }.get(key, 'default')
        mock_require_int.return_value = 1
        mock_get_bool.return_value = False
        
        import sys
        import importlib.util
        spec = importlib.util.spec_from_file_location("__main__", "__main__.py")
        main_module = importlib.util.module_from_spec(spec)
        sys.modules['__main__'] = main_module
        spec.loader.exec_module(main_module)

        # Check that main variables are accessible
        self.assertIsNotNone(main_module.vpc)
        self.assertIsNotNone(main_module.alb)
        self.assertIsNotNone(main_module.rds)
        self.assertIsNotNone(main_module.s3)


if __name__ == "__main__":
    unittest.main()
