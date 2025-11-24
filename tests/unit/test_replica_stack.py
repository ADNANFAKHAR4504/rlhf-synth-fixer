"""
Unit tests for ReplicaStack
Tests the cross-region read replica infrastructure.
"""
import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.replica_stack import ReplicaStack, ReplicaStackProps


@mark.describe("ReplicaStack")
class TestReplicaStack(unittest.TestCase):
    """Test cases for the ReplicaStack"""

    def setUp(self):
        """Set up a fresh CDK app and stack for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"
        self.source_db_arn = "arn:aws:rds:us-east-1:123456789012:db:primary-db-test"
        self.stack = ReplicaStack(
            self.app,
            "TestReplicaStack",
            ReplicaStackProps(
                environment_suffix=self.env_suffix,
                source_db_arn=self.source_db_arn
            ),
            env=cdk.Environment(account="123456789012", region="eu-west-1")
        )
        self.template = Template.from_stack(self.stack)

    @mark.it("creates VPC in replica region")
    def test_creates_replica_vpc(self):
        """Test that VPC is created in replica region"""
        self.template.resource_count_is("AWS::EC2::VPC", 1)
        self.template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.1.0.0/16"
        })

    @mark.it("creates security group for replica database")
    def test_creates_replica_security_group(self):
        """Test that security group is created for replica"""
        self.template.resource_count_is("AWS::EC2::SecurityGroup", 1)
        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": Match.string_like_regexp(".*replica.*")
        })

    @mark.it("creates subnet group for replica")
    def test_creates_replica_subnet_group(self):
        """Test that DB subnet group is created for replica"""
        self.template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    @mark.it("creates read replica with correct source")
    def test_creates_read_replica(self):
        """Test that read replica is created referencing source DB"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "SourceDBInstanceIdentifier": self.source_db_arn,
            "DBInstanceClass": "db.r6g.large"
        })

    @mark.it("enables independent backups on replica")
    def test_enables_replica_backups(self):
        """Test that replica has independent backups enabled"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "BackupRetentionPeriod": 7
        })

    @mark.it("enables storage encryption on replica")
    def test_enables_replica_encryption(self):
        """Test that replica has storage encryption enabled"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "StorageEncrypted": True
        })

    @mark.it("disables deletion protection on replica")
    def test_disables_replica_deletion_protection(self):
        """Test that replica has deletion protection disabled"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "DeletionProtection": False
        })

    @mark.it("enables CloudWatch logs export on replica")
    def test_enables_replica_cloudwatch_logs(self):
        """Test that replica exports logs to CloudWatch"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "EnableCloudwatchLogsExports": ["postgresql"]
        })

    @mark.it("includes environment suffix in replica resource names")
    def test_includes_env_suffix_in_replica_names(self):
        """Test that replica resources include environment suffix"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "DBInstanceIdentifier": f"replica-db-{self.env_suffix}"
        })

        self.template.has_resource_properties("AWS::RDS::DBSubnetGroup", {
            "DBSubnetGroupName": f"replica-subnet-group-{self.env_suffix}"
        })

        self.template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupName": f"replica-db-sg-{self.env_suffix}"
        })

    @mark.it("outputs replica database endpoint")
    def test_outputs_replica_endpoint(self):
        """Test that replica endpoint is exported"""
        self.template.has_output("ReplicaDatabaseEndpoint", {})

    @mark.it("outputs replica database identifier")
    def test_outputs_replica_identifier(self):
        """Test that replica identifier is exported"""
        self.template.has_output("ReplicaDatabaseIdentifier", {})

    @mark.it("outputs replica VPC ID")
    def test_outputs_replica_vpc_id(self):
        """Test that replica VPC ID is exported"""
        self.template.has_output("ReplicaVpcId", {})

    @mark.it("creates NAT Gateway in replica VPC")
    def test_creates_replica_nat_gateway(self):
        """Test that NAT Gateway is created in replica VPC"""
        self.template.resource_count_is("AWS::EC2::NatGateway", 1)

    @mark.it("creates private subnets in replica VPC")
    def test_creates_replica_private_subnets(self):
        """Test that private subnets are created in replica VPC"""
        self.template.resource_count_is("AWS::EC2::Subnet", 6)

    @mark.it("tags replica resources appropriately")
    def test_tags_replica_resources(self):
        """Test that replica resources have appropriate tags"""
        self.template.has_resource_properties("AWS::RDS::DBInstance", {
            "Tags": Match.array_with([
                Match.object_like({
                    "Key": "Name",
                    "Value": f"replica-db-{self.env_suffix}"
                })
            ])
        })
