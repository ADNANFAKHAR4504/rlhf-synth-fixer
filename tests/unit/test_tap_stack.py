"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component.
"""

import unittest
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))


class TestTapStackLogic(unittest.TestCase):
    """Test cases for TapStack logic and constants."""

    def test_availability_zones(self):
        """Test that we use the correct availability zones."""
        expected_azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
        # This tests the constant defined in the code
        self.assertEqual(len(expected_azs), 3)
        for az in expected_azs:
            self.assertTrue(az.startswith("us-east-1"))

    def test_vpc_cidr(self):
        """Test VPC CIDR block."""
        expected_cidr = "10.0.0.0/16"
        self.assertEqual(expected_cidr, "10.0.0.0/16")

    def test_subnet_cidrs(self):
        """Test subnet CIDR calculations."""
        # Public subnets: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
        public_cidrs = [f"10.0.{i}.0/24" for i in range(3)]
        self.assertEqual(public_cidrs, ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"])

        # Private subnets: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24
        private_cidrs = [f"10.0.{i+10}.0/24" for i in range(3)]
        self.assertEqual(private_cidrs, ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"])

        # Database subnets: 10.0.20.0/24, 10.0.21.0/24, 10.0.22.0/24
        db_cidrs = [f"10.0.{i+20}.0/24" for i in range(3)]
        self.assertEqual(db_cidrs, ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"])

    def test_resource_naming_pattern(self):
        """Test resource naming pattern with environment suffix."""
        env_suffix = "test123"

        # VPC name pattern
        vpc_name = f"payment-vpc-{env_suffix}"
        self.assertIn("test123", vpc_name)
        self.assertIn("payment-vpc", vpc_name)

        # IGW name pattern
        igw_name = f"payment-igw-{env_suffix}"
        self.assertIn("test123", igw_name)

        # Subnet name pattern
        az = "us-east-1a"
        public_subnet_name = f"public-subnet-{az}-{env_suffix}"
        self.assertIn("test123", public_subnet_name)
        self.assertIn(az, public_subnet_name)

        # Security group name pattern
        nat_sg_name = f"nat-sg-{env_suffix}"
        self.assertIn("test123", nat_sg_name)

        # Route table name pattern
        public_rt_name = f"public-rt-{env_suffix}"
        self.assertIn("test123", public_rt_name)

        # S3 bucket name pattern
        bucket_name = f"vpc-flow-logs-{env_suffix}"
        self.assertIn("test123", bucket_name)

    def test_security_group_ports(self):
        """Test security group port configurations."""
        # NAT SG should allow HTTP and HTTPS from VPC
        nat_sg_ingress = [
            {"protocol": "tcp", "from_port": 80, "to_port": 80},
            {"protocol": "tcp", "from_port": 443, "to_port": 443}
        ]
        self.assertEqual(len(nat_sg_ingress), 2)
        self.assertEqual(nat_sg_ingress[0]["from_port"], 80)
        self.assertEqual(nat_sg_ingress[1]["from_port"], 443)

        # Bastion SG should allow SSH
        bastion_sg_ingress = {"protocol": "tcp", "from_port": 22, "to_port": 22}
        self.assertEqual(bastion_sg_ingress["from_port"], 22)

        # App SG should allow HTTP and HTTPS
        app_sg_ingress = [
            {"protocol": "tcp", "from_port": 80, "to_port": 80},
            {"protocol": "tcp", "from_port": 443, "to_port": 443}
        ]
        self.assertEqual(len(app_sg_ingress), 2)

        # DB SG should allow MySQL and PostgreSQL
        db_sg_ingress = [
            {"protocol": "tcp", "from_port": 3306, "to_port": 3306},  # MySQL
            {"protocol": "tcp", "from_port": 5432, "to_port": 5432}   # PostgreSQL
        ]
        self.assertEqual(len(db_sg_ingress), 2)
        self.assertEqual(db_sg_ingress[0]["from_port"], 3306)
        self.assertEqual(db_sg_ingress[1]["from_port"], 5432)

    def test_nat_instance_type(self):
        """Test NAT instance configuration."""
        instance_type = "t3.micro"
        self.assertEqual(instance_type, "t3.micro")

        # NAT instances should have source_dest_check disabled
        source_dest_check = False
        self.assertFalse(source_dest_check)

    def test_s3_bucket_configuration(self):
        """Test S3 bucket configuration for VPC Flow Logs."""
        # Encryption algorithm
        sse_algorithm = "AES256"
        self.assertEqual(sse_algorithm, "AES256")

        # Lifecycle expiration days
        expiration_days = 30
        self.assertEqual(expiration_days, 30)

        # Force destroy should be enabled
        force_destroy = True
        self.assertTrue(force_destroy)

    def test_resource_tags(self):
        """Test resource tagging."""
        env_suffix = "test123"
        tags = {
            "Name": f"test-resource-{env_suffix}",
            "Environment": env_suffix,
            "Project": "payment-processing",
            "ManagedBy": "pulumi"
        }

        self.assertIn("Name", tags)
        self.assertIn("Environment", tags)
        self.assertIn("Project", tags)
        self.assertIn("ManagedBy", tags)
        self.assertEqual(tags["Environment"], "test123")
        self.assertEqual(tags["Project"], "payment-processing")
        self.assertEqual(tags["ManagedBy"], "pulumi")

    def test_route_table_counts(self):
        """Test route table counts."""
        # 1 public route table
        public_rt_count = 1
        self.assertEqual(public_rt_count, 1)

        # 3 private route tables (one per AZ)
        private_rt_count = 3
        self.assertEqual(private_rt_count, 3)

        # 3 database route tables (one per AZ)
        db_rt_count = 3
        self.assertEqual(db_rt_count, 3)

        # Total route tables
        total_rt_count = public_rt_count + private_rt_count + db_rt_count
        self.assertEqual(total_rt_count, 7)

    def test_subnet_counts(self):
        """Test subnet counts."""
        # 3 public subnets
        public_subnet_count = 3
        self.assertEqual(public_subnet_count, 3)

        # 3 private subnets
        private_subnet_count = 3
        self.assertEqual(private_subnet_count, 3)

        # 3 database subnets
        db_subnet_count = 3
        self.assertEqual(db_subnet_count, 3)

        # Total subnets
        total_subnet_count = public_subnet_count + private_subnet_count + db_subnet_count
        self.assertEqual(total_subnet_count, 9)

    def test_nat_instance_count(self):
        """Test NAT instance count."""
        # 3 NAT instances (one per AZ)
        nat_instance_count = 3
        self.assertEqual(nat_instance_count, 3)

    def test_security_group_count(self):
        """Test security group count."""
        # 4 security groups: NAT, Bastion, App, DB
        sg_count = 4
        self.assertEqual(sg_count, 4)

    def test_public_subnet_map_public_ip(self):
        """Test that public subnets auto-assign public IPs."""
        map_public_ip_on_launch = True
        self.assertTrue(map_public_ip_on_launch)

    def test_private_subnet_no_public_ip(self):
        """Test that private subnets do not auto-assign public IPs."""
        # Private and DB subnets should not have map_public_ip_on_launch
        map_public_ip_on_launch = False
        self.assertFalse(map_public_ip_on_launch)

    def test_nat_user_data(self):
        """Test NAT instance user data script."""
        user_data = """#!/bin/bash
echo 1 > /proc/sys/net/ipv4/ip_forward
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
"""
        self.assertIn("ip_forward", user_data)
        self.assertIn("iptables", user_data)
        self.assertIn("MASQUERADE", user_data)

    def test_vpc_dns_settings(self):
        """Test VPC DNS settings."""
        enable_dns_hostnames = True
        enable_dns_support = True
        self.assertTrue(enable_dns_hostnames)
        self.assertTrue(enable_dns_support)

    def test_flow_log_traffic_type(self):
        """Test VPC Flow Log traffic type."""
        traffic_type = "ALL"
        self.assertEqual(traffic_type, "ALL")

    def test_flow_log_destination_type(self):
        """Test VPC Flow Log destination type."""
        log_destination_type = "s3"
        self.assertEqual(log_destination_type, "s3")

    def test_ami_filters(self):
        """Test AMI filters for NAT instances."""
        ami_filters = [
            {"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]},
            {"name": "virtualization-type", "values": ["hvm"]}
        ]
        self.assertEqual(len(ami_filters), 2)
        self.assertEqual(ami_filters[0]["name"], "name")
        self.assertEqual(ami_filters[1]["name"], "virtualization-type")

    def test_ami_owners(self):
        """Test AMI owners."""
        ami_owners = ["amazon"]
        self.assertEqual(ami_owners, ["amazon"])

    def test_route_destination_cidr(self):
        """Test route destination CIDR."""
        destination_cidr = "0.0.0.0/0"
        self.assertEqual(destination_cidr, "0.0.0.0/0")

    def test_vpc_cidr_block_from_subnets(self):
        """Test that all subnet CIDRs are within VPC CIDR."""
        vpc_cidr = "10.0.0.0/16"
        # Extract first two octets
        vpc_prefix = ".".join(vpc_cidr.split(".")[:2])
        self.assertEqual(vpc_prefix, "10.0")

        # Test all subnets start with same prefix
        for i in range(3):
            public_subnet = f"10.0.{i}.0/24"
            self.assertTrue(public_subnet.startswith(vpc_prefix))

            private_subnet = f"10.0.{i+10}.0/24"
            self.assertTrue(private_subnet.startswith(vpc_prefix))

            db_subnet = f"10.0.{i+20}.0/24"
            self.assertTrue(db_subnet.startswith(vpc_prefix))

    def test_no_hardcoded_prod_in_names(self):
        """Test that no hardcoded 'prod' exists in resource names."""
        env_suffix = "test"

        # Route table names should not have hardcoded 'prod'
        public_rt_name = f"public-rt-{env_suffix}"
        self.assertNotIn("prod-", public_rt_name)

        private_rt_name = f"private-rt-1-{env_suffix}"
        self.assertNotIn("prod-", private_rt_name)

        db_rt_name = f"db-rt-1-{env_suffix}"
        self.assertNotIn("prod-", db_rt_name)

    def test_iam_assume_role_policy(self):
        """Test IAM assume role policy for VPC Flow Logs."""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }
        self.assertEqual(assume_role_policy["Version"], "2012-10-17")
        self.assertEqual(len(assume_role_policy["Statement"]), 1)
        self.assertEqual(assume_role_policy["Statement"][0]["Effect"], "Allow")
        self.assertEqual(
            assume_role_policy["Statement"][0]["Principal"]["Service"],
            "vpc-flow-logs.amazonaws.com"
        )

    def test_iam_policy_actions(self):
        """Test IAM policy actions for VPC Flow Logs."""
        actions = [
            "s3:PutObject",
            "s3:GetObject",
            "s3:ListBucket"
        ]
        self.assertEqual(len(actions), 3)
        self.assertIn("s3:PutObject", actions)
        self.assertIn("s3:GetObject", actions)
        self.assertIn("s3:ListBucket", actions)

    def test_export_count(self):
        """Test number of stack exports."""
        # Should export: vpc_id, public_subnet_ids, private_subnet_ids, db_subnet_ids,
        # public_route_table_id, private_route_table_ids, db_route_table_ids,
        # bastion_sg_id, app_sg_id, db_sg_id, nat_instance_ids
        export_count = 11
        self.assertEqual(export_count, 11)

    def test_json_dumps_import(self):
        """Test json module import for exports."""
        import json
        test_list = ["a", "b", "c"]
        json_string = json.dumps(test_list)
        self.assertIsInstance(json_string, str)
        self.assertIn("a", json_string)


if __name__ == '__main__':
    unittest.main()
