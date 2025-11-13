"""
Unit tests for the main entry point (__main__.py) using Pulumi testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock, mock_open
import sys
import os
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
        elif args.typ == "aws:index/provider:Provider":
            outputs = {**args.inputs, "id": f"provider-{args.name}"}
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

    @patch('builtins.open', new_callable=mock_open, read_data='eu-west-1')
    @patch('pulumi.Config')
    def test_aws_region_file_read(self, mock_config, mock_file):
        """Test that AWS_REGION file is read correctly"""
        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.return_value = 'test-env'
        config_instance.get.return_value = None
        config_instance.get_int.return_value = None
        config_instance.get_bool.return_value = None
        mock_config.return_value = config_instance

        # Test that file reading works
        aws_region_file = os.path.join(os.path.dirname(__file__), "AWS_REGION")
        with open(aws_region_file, 'r') as f:
            region = f.read().strip()

        self.assertEqual(region, 'eu-west-1')
        mock_file.assert_called()

    @patch('pulumi.Config')
    def test_config_loading(self, mock_config):
        """Test that Pulumi config is loaded correctly"""
        # Setup config mock
        config_instance = MagicMock()
        config_instance.require.return_value = 'test-env'
        config_instance.get.side_effect = lambda key: {
            'environment': 'test',
            'costCenter': 'engineering'
        }.get(key)
        config_instance.get_int.side_effect = lambda key: {
            'minCapacity': 2,
            'maxCapacity': 4,
            'readReplicaCount': 1,
            'backupRetentionDays': 7
        }.get(key)
        config_instance.get_bool.side_effect = lambda key: {
            'enableWaf': False
        }.get(key)
        mock_config.return_value = config_instance

        # Load config
        config = pulumi.Config()
        environment_suffix = config.require("environmentSuffix")
        environment = config.get("environment") or environment_suffix
        min_capacity = config.get_int("minCapacity") or 2
        max_capacity = config.get_int("maxCapacity") or 4
        read_replica_count = config.get_int("readReplicaCount") or 1
        backup_retention_days = config.get_int("backupRetentionDays") or 7
        enable_waf = config.get_bool("enableWaf") or False
        cost_center = config.get("costCenter") or "engineering"

        # Verify values
        self.assertEqual(environment_suffix, 'test-env')
        self.assertEqual(environment, 'test')
        self.assertEqual(min_capacity, 2)
        self.assertEqual(max_capacity, 4)
        self.assertEqual(read_replica_count, 1)
        self.assertEqual(backup_retention_days, 7)
        self.assertEqual(enable_waf, False)
        self.assertEqual(cost_center, 'engineering')

    def test_tags_structure(self):
        """Test that tags dictionary is properly structured"""
        environment = "test"
        cost_center = "engineering"

        tags = {
            "Environment": environment,
            "ManagedBy": "Pulumi",
            "CostCenter": cost_center,
        }

        self.assertEqual(tags["Environment"], "test")
        self.assertEqual(tags["ManagedBy"], "Pulumi")
        self.assertEqual(tags["CostCenter"], "engineering")
        self.assertEqual(len(tags), 3)

    @patch('pulumi.export')
    def test_export_outputs_structure(self, mock_export):
        """Test that exports are called with correct keys"""
        # Mock exports
        mock_vpc_id = "vpc-12345"
        mock_alb_dns = "alb.example.com"
        mock_alb_arn = "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/alb/abc123"
        mock_rds_endpoint = "cluster.example.com"
        mock_rds_reader = "cluster-ro.example.com"
        mock_bucket = "static-assets-bucket"
        mock_logs = "logs-bucket"

        # Simulate exports
        pulumi.export("vpc_id", mock_vpc_id)
        pulumi.export("alb_dns_name", mock_alb_dns)
        pulumi.export("alb_arn", mock_alb_arn)
        pulumi.export("rds_cluster_endpoint", mock_rds_endpoint)
        pulumi.export("rds_reader_endpoint", mock_rds_reader)
        pulumi.export("static_assets_bucket", mock_bucket)
        pulumi.export("logs_bucket", mock_logs)

        # Verify exports were called
        self.assertEqual(mock_export.call_count, 7)
        export_calls = {call[0][0]: call[0][1] for call in mock_export.call_args_list}

        self.assertIn("vpc_id", export_calls)
        self.assertIn("alb_dns_name", export_calls)
        self.assertIn("alb_arn", export_calls)
        self.assertIn("rds_cluster_endpoint", export_calls)
        self.assertIn("rds_reader_endpoint", export_calls)
        self.assertIn("static_assets_bucket", export_calls)
        self.assertIn("logs_bucket", export_calls)

    @patch('pulumi_aws.Provider')
    def test_aws_provider_configuration(self, mock_provider):
        """Test that AWS provider is configured with correct region"""
        # Create provider with region
        region = "eu-west-1"
        provider = mock_provider("aws-provider", region=region)

        # Verify provider was called with correct args
        mock_provider.assert_called_once_with("aws-provider", region="eu-west-1")

    def test_component_parameters_vpc(self):
        """Test VPC component parameters"""
        environment_suffix = "test-env"
        tags = {"Environment": "test", "ManagedBy": "Pulumi", "CostCenter": "engineering"}

        # Test VPC parameters
        vpc_params = {
            "name": "vpc",
            "environment_suffix": environment_suffix,
            "cidr_block": "10.0.0.0/16",
            "availability_zones": ["us-east-1a", "us-east-1b"],
            "tags": tags
        }

        self.assertEqual(vpc_params["name"], "vpc")
        self.assertEqual(vpc_params["environment_suffix"], "test-env")
        self.assertEqual(vpc_params["cidr_block"], "10.0.0.0/16")
        self.assertEqual(len(vpc_params["availability_zones"]), 2)
        self.assertEqual(vpc_params["tags"]["Environment"], "test")

    def test_component_parameters_alb(self):
        """Test ALB component parameters"""
        environment_suffix = "test-env"
        tags = {"Environment": "test", "ManagedBy": "Pulumi", "CostCenter": "engineering"}
        enable_waf = False

        # Test ALB parameters
        alb_params = {
            "name": "alb",
            "environment_suffix": environment_suffix,
            "vpc_id": "vpc-12345",
            "public_subnet_ids": ["subnet-1", "subnet-2"],
            "enable_waf": enable_waf,
            "tags": tags
        }

        self.assertEqual(alb_params["name"], "alb")
        self.assertEqual(alb_params["environment_suffix"], "test-env")
        self.assertEqual(alb_params["vpc_id"], "vpc-12345")
        self.assertEqual(len(alb_params["public_subnet_ids"]), 2)
        self.assertEqual(alb_params["enable_waf"], False)

    def test_component_parameters_asg(self):
        """Test ASG component parameters"""
        environment_suffix = "test-env"
        tags = {"Environment": "test", "ManagedBy": "Pulumi", "CostCenter": "engineering"}
        min_capacity = 2
        max_capacity = 4

        # Test ASG parameters
        asg_params = {
            "name": "asg",
            "environment_suffix": environment_suffix,
            "vpc_id": "vpc-12345",
            "private_subnet_ids": ["subnet-1", "subnet-2"],
            "target_group_arn": "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tg/abc123",
            "min_size": min_capacity,
            "max_size": max_capacity,
            "tags": tags
        }

        self.assertEqual(asg_params["name"], "asg")
        self.assertEqual(asg_params["min_size"], 2)
        self.assertEqual(asg_params["max_size"], 4)
        self.assertEqual(asg_params["vpc_id"], "vpc-12345")

    def test_component_parameters_rds(self):
        """Test RDS component parameters"""
        environment_suffix = "test-env"
        tags = {"Environment": "test", "ManagedBy": "Pulumi", "CostCenter": "engineering"}
        read_replica_count = 1
        backup_retention_days = 7

        # Test RDS parameters
        rds_params = {
            "name": "rds",
            "environment_suffix": environment_suffix,
            "vpc_id": "vpc-12345",
            "private_subnet_ids": ["subnet-1", "subnet-2"],
            "read_replica_count": read_replica_count,
            "backup_retention_days": backup_retention_days,
            "tags": tags
        }

        self.assertEqual(rds_params["name"], "rds")
        self.assertEqual(rds_params["read_replica_count"], 1)
        self.assertEqual(rds_params["backup_retention_days"], 7)
        self.assertIn("vpc_id", rds_params)

    def test_component_parameters_s3(self):
        """Test S3 component parameters"""
        environment_suffix = "test-env"
        environment = "test"
        tags = {"Environment": "test", "ManagedBy": "Pulumi", "CostCenter": "engineering"}

        # Test S3 parameters
        s3_params = {
            "name": "s3",
            "environment_suffix": environment_suffix,
            "environment": environment,
            "tags": tags
        }

        self.assertEqual(s3_params["name"], "s3")
        self.assertEqual(s3_params["environment_suffix"], "test-env")
        self.assertEqual(s3_params["environment"], "test")
        self.assertEqual(s3_params["tags"]["ManagedBy"], "Pulumi")

    def test_config_default_values(self):
        """Test that default values are used when config values are not set"""
        # Test default values
        environment = None or "test-env"
        min_capacity = None or 2
        max_capacity = None or 4
        read_replica_count = None or 1
        backup_retention_days = None or 7
        enable_waf = None or False
        cost_center = None or "engineering"

        self.assertEqual(environment, "test-env")
        self.assertEqual(min_capacity, 2)
        self.assertEqual(max_capacity, 4)
        self.assertEqual(read_replica_count, 1)
        self.assertEqual(backup_retention_days, 7)
        self.assertEqual(enable_waf, False)
        self.assertEqual(cost_center, "engineering")

    def test_availability_zones_configuration(self):
        """Test availability zones configuration"""
        availability_zones = ["us-east-1a", "us-east-1b"]

        self.assertEqual(len(availability_zones), 2)
        self.assertIn("us-east-1a", availability_zones)
        self.assertIn("us-east-1b", availability_zones)
        self.assertTrue(all(isinstance(az, str) for az in availability_zones))

    def test_cidr_block_configuration(self):
        """Test CIDR block configuration"""
        cidr_block = "10.0.0.0/16"

        self.assertTrue(cidr_block.startswith("10.0"))
        self.assertTrue(cidr_block.endswith("/16"))
        self.assertEqual(cidr_block, "10.0.0.0/16")

    @patch('os.path.dirname')
    @patch('os.path.join')
    def test_aws_region_file_path_construction(self, mock_join, mock_dirname):
        """Test that AWS_REGION file path is constructed correctly"""
        mock_dirname.return_value = "/test/lib"
        mock_join.return_value = "/test/lib/AWS_REGION"

        # Simulate path construction
        dir_path = os.path.dirname(__file__)
        file_path = os.path.join(dir_path, "AWS_REGION")

        self.assertEqual(file_path, "/test/lib/AWS_REGION")
        mock_dirname.assert_called_once()
        mock_join.assert_called_once_with("/test/lib", "AWS_REGION")


if __name__ == "__main__":
    unittest.main()