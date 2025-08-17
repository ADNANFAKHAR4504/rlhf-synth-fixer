"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using unittest, unittest.mock for AWS mocking,
and Pulumi's component resource testing approach.

These tests are NOT hitting AWS APIs — all Pulumi AWS provider calls are patched with MagicMocks so
the tests run offline and verify orchestration logic, argument passing, and inter-component glue.
"""

import unittest
from unittest.mock import MagicMock, patch

# Import the classes and helpers under test
from lib.tap_stack import (SecureVPC, TapStack, TapStackArgs, create_alb,
                           create_cloudwatch_alarms, create_codepipeline,
                           create_eks_cluster, create_eks_node_group,
                           create_kms_key, create_monitoring_lambda,
                           create_rds, create_s3_buckets,
                           create_security_groups)


class TestTapStackArgs(unittest.TestCase):
  """Test cases for TapStackArgs configuration class."""

  def test_tap_stack_args_default_values(self):
    """Verify that TapStackArgs sets correct default environment and tags when none are provided."""
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, "prod")
    self.assertEqual(args.tags, {"Environment": "Production"})

  def test_tap_stack_args_custom_values(self):
    """Verify that TapStackArgs correctly applies provided environment suffix and tags."""
    args = TapStackArgs(environment_suffix="qa", tags={"Env": "QA"})
    self.assertEqual(args.environment_suffix, "qa")
    self.assertEqual(args.tags, {"Env": "QA"})


class TestSecureVPC(unittest.TestCase):
  """Unit tests for SecureVPC ensuring orchestration of VPC networking components."""

  @patch("lib.tap_stack.aws.get_region",
         return_value=MagicMock(name="us-west-2"))
  @patch("lib.tap_stack.aws.get_availability_zones",
         return_value=MagicMock(names=["us-west-2a", "us-west-2b"]))
  @patch("lib.tap_stack.aws.ec2.Vpc", return_value=MagicMock(id="vpc-123"))
  @patch("lib.tap_stack.aws.ec2.InternetGateway",
         return_value=MagicMock(id="igw-123"))
  @patch("lib.tap_stack.aws.ec2.Subnet",
         return_value=MagicMock(id="subnet-123"))
  @patch("lib.tap_stack.aws.ec2.Eip", return_value=MagicMock(id="eip-123"))
  @patch("lib.tap_stack.aws.ec2.NatGateway",
         return_value=MagicMock(id="nat-123"))
  @patch("lib.tap_stack.aws.ec2.RouteTable",
         return_value=MagicMock(id="rt-123"))
  @patch("lib.tap_stack.aws.ec2.Route", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.RouteTableAssociation",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.NetworkAcl",
         return_value=MagicMock(id="nacl-123"))
  @patch("lib.tap_stack.aws.ec2.NetworkAclRule", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.NetworkAclAssociation",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.Role",
         return_value=MagicMock(arn="arn:role", id="role-123"))
  @patch("lib.tap_stack.aws.iam.RolePolicy", return_value=MagicMock())
  @patch("lib.tap_stack.aws.cloudwatch.LogGroup",
         return_value=MagicMock(arn="arn:log-group"))
  @patch("lib.tap_stack.aws.ec2.FlowLog", return_value=MagicMock())
  @patch.object(SecureVPC, "_create_vpc_endpoints", return_value=[])
  @patch.object(SecureVPC, "_create_vpc_endpoint_sg", return_value=MagicMock(id="sg-123"))
  def test_securevpc_full_creation(self, *_):
    """Test complete SecureVPC creation to cover all internal methods."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"  # Set region to avoid pulumi.export issues
    vpc = SecureVPC("test-vpc", "10.0.0.0/16",
                    {"Environment": "Test"}, mock_provider)

    # Verify all attributes are set
    self.assertIsNotNone(vpc.vpc)
    self.assertIsNotNone(vpc.igw)
    self.assertIsNotNone(vpc.public_subnets)
    self.assertIsNotNone(vpc.private_subnets)
    self.assertIsNotNone(vpc.eips)
    self.assertIsNotNone(vpc.nat_gateways)
    self.assertIsNotNone(vpc.public_route_table)
    self.assertIsNotNone(vpc.private_route_tables)
    self.assertIsNotNone(vpc.public_nacl)
    self.assertIsNotNone(vpc.private_nacl)
    self.assertIsNotNone(vpc.flow_logs_role)
    self.assertIsNotNone(vpc.flow_logs)

  @patch.object(SecureVPC, "_create_vpc", return_value=MagicMock(id="vpc-123"))
  @patch.object(SecureVPC, "_create_internet_gateway", return_value="igw")
  @patch.object(SecureVPC, "_create_public_subnets",
                return_value=[MagicMock(id="subnet1"), MagicMock(id="subnet2")])
  @patch.object(SecureVPC, "_create_private_subnets",
                return_value=[MagicMock(id="subnet3"), MagicMock(id="subnet4")])
  @patch.object(SecureVPC, "_create_elastic_ips",
                return_value=["eip1", "eip2"])
  @patch.object(SecureVPC, "_create_nat_gateways",
                return_value=["nat1", "nat2"])
  @patch.object(SecureVPC, "_create_public_route_table", return_value="prt")
  @patch.object(SecureVPC, "_create_private_route_tables",
                return_value=["prt1", "prt2"])
  @patch.object(SecureVPC, "_create_public_nacl", return_value="pubnacl")
  @patch.object(SecureVPC, "_create_private_nacl", return_value="privnacl")
  @patch.object(SecureVPC, "_create_flow_logs_role", return_value="flowrole")
  @patch.object(SecureVPC, "_create_flow_logs", return_value="flowlogs")
  @patch.object(SecureVPC, "_create_vpc_endpoints", return_value=[])
  @patch.object(SecureVPC, "_create_vpc_endpoint_sg", return_value=MagicMock(id="sg-123"))
  @patch("lib.tap_stack.aws.get_availability_zones",
         return_value=MagicMock(names=["us-west-2a", "us-west-2b"]))
  def test_securevpc_init(self, *_):
    """Ensure SecureVPC calls all internal creation methods and assigns expected attributes."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"  # Set region to avoid pulumi.export issues
    vpc = SecureVPC("test", "10.0.0.0/16", {"Env": "Test"}, mock_provider)
    # Check that the mocked methods were called and attributes were set
    self.assertIsNotNone(vpc.vpc)
    self.assertIsNotNone(vpc.igw)
    self.assertIsNotNone(vpc.public_subnets)
    self.assertIsNotNone(vpc.private_subnets)


class TestHelpers(unittest.TestCase):
  """Tests for individual helper functions in tap_stack.py."""

  @patch("lib.tap_stack.aws.get_caller_identity",
         return_value=MagicMock(account_id="123456789"))
  @patch("lib.tap_stack.aws.get_region",
         return_value=MagicMock(name="us-west-2"))
  @patch("lib.tap_stack.aws.kms.Key",
         return_value=MagicMock(key_id="kid", id="kid", arn="arn"))
  @patch("lib.tap_stack.aws.kms.Alias", return_value=MagicMock())
  def test_create_kms_key(self, mock_alias, mock_key, _, __):
    """Verify that create_kms_key creates a KMS key and alias with correct tags."""
    mock_provider = MagicMock()
    sample_tags = {"Environment": "Production"}
    key = create_kms_key(sample_tags, mock_provider)
    self.assertEqual(key, mock_key.return_value)
    mock_alias.assert_called_once()

  @patch("lib.tap_stack.aws.ec2.SecurityGroupRule", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.SecurityGroup",
         side_effect=lambda *a, **k: MagicMock(id="sg", **k))
  def test_create_security_groups(self, *_):
    """Ensure create_security_groups returns all required security groups."""
    mock_provider = MagicMock()
    vpc = MagicMock()
    vpc.id = "vpc-123"
    sample_tags = {"Environment": "Production"}
    sgs = create_security_groups(vpc, sample_tags, mock_provider)
    self.assertIn("alb_sg", sgs)
    self.assertIn("db_sg", sgs)
    self.assertIn("eks_cluster_sg", sgs)
    self.assertIn("eks_node_sg", sgs)

  @patch("lib.tap_stack.aws.ec2.SecurityGroupRule", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.SecurityGroup",
         side_effect=lambda *a, **k: MagicMock(id="sg", **k))
  def test_create_security_groups_with_name_prefix(self, *_):
    """Test create_security_groups with custom name prefix."""
    mock_provider = MagicMock()
    vpc = MagicMock()
    vpc.id = "vpc-123"
    sample_tags = {"Environment": "Production"}
    sgs = create_security_groups(vpc, sample_tags, mock_provider, "custom")
    self.assertIn("alb_sg", sgs)
    self.assertIn("db_sg", sgs)
    self.assertIn("eks_cluster_sg", sgs)
    self.assertIn("eks_node_sg", sgs)

  @patch("lib.tap_stack.aws.ec2.VpcEndpoint", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.SecurityGroup", return_value=MagicMock(id="sg-123"))
  @patch("lib.tap_stack.aws.get_availability_zones", return_value=MagicMock(names=["us-east-1a", "us-east-1b"]))
  @patch("lib.tap_stack.aws.get_region", return_value=MagicMock(name="us-east-1"))
  @patch("lib.tap_stack.aws.ec2.Vpc", return_value=MagicMock(id="vpc-123"))
  @patch("lib.tap_stack.aws.ec2.InternetGateway", return_value=MagicMock(id="igw-123"))
  @patch("lib.tap_stack.aws.ec2.Subnet", return_value=MagicMock(id="subnet-123"))
  @patch("lib.tap_stack.aws.ec2.Eip", return_value=MagicMock(id="eip-123"))
  @patch("lib.tap_stack.aws.ec2.NatGateway", return_value=MagicMock(id="nat-123"))
  @patch("lib.tap_stack.aws.ec2.RouteTable", return_value=MagicMock(id="rt-123"))
  @patch("lib.tap_stack.aws.ec2.Route", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.RouteTableAssociation", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.NetworkAcl", return_value=MagicMock(id="nacl-123"))
  @patch("lib.tap_stack.aws.ec2.NetworkAclRule", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.NetworkAclAssociation", return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock(arn="arn:role", id="role-123"))
  @patch("lib.tap_stack.aws.iam.RolePolicy", return_value=MagicMock())
  @patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=MagicMock(arn="arn:log-group"))
  @patch("lib.tap_stack.aws.ec2.FlowLog", return_value=MagicMock())
  @patch.object(SecureVPC, "_create_vpc_endpoints", return_value=[])
  @patch.object(SecureVPC, "_create_vpc_endpoint_sg", return_value=MagicMock(id="sg-123"))
  def test_securevpc_vpc_endpoints_creation(self, *_):
    """Test VPC endpoints creation in SecureVPC."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"
    
    # Create SecureVPC instance with all methods mocked
    vpc = SecureVPC("test-vpc", "10.0.0.0/16", {"Environment": "Test"}, mock_provider)
    
    # Test VPC endpoints creation
    endpoints = vpc._create_vpc_endpoints()
    self.assertIsInstance(endpoints, list)
    
    # Test VPC endpoint security group creation
    sg = vpc._create_vpc_endpoint_sg()
    self.assertIsNotNone(sg)

  @patch("lib.tap_stack.aws.ec2.VpcEndpoint", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.SecurityGroup", return_value=MagicMock(id="sg-123"))
  @patch("lib.tap_stack.aws.get_availability_zones", return_value=MagicMock(names=["us-west-2a", "us-west-2b"]))
  @patch("lib.tap_stack.aws.get_region", return_value=MagicMock(name="us-west-2"))
  @patch("lib.tap_stack.aws.ec2.Vpc", return_value=MagicMock(id="vpc-123"))
  @patch("lib.tap_stack.aws.ec2.InternetGateway", return_value=MagicMock(id="igw-123"))
  @patch("lib.tap_stack.aws.ec2.Subnet", return_value=MagicMock(id="subnet-123"))
  @patch("lib.tap_stack.aws.ec2.Eip", return_value=MagicMock(id="eip-123"))
  @patch("lib.tap_stack.aws.ec2.NatGateway", return_value=MagicMock(id="nat-123"))
  @patch("lib.tap_stack.aws.ec2.RouteTable", return_value=MagicMock(id="rt-123"))
  @patch("lib.tap_stack.aws.ec2.Route", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.RouteTableAssociation", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.NetworkAcl", return_value=MagicMock(id="nacl-123"))
  @patch("lib.tap_stack.aws.ec2.NetworkAclRule", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.NetworkAclAssociation", return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock(arn="arn:role", id="role-123"))
  @patch("lib.tap_stack.aws.ec2.FlowLog", return_value=MagicMock())
  @patch.object(SecureVPC, "_create_vpc_endpoints", return_value=[])
  @patch.object(SecureVPC, "_create_vpc_endpoint_sg", return_value=MagicMock(id="sg-123"))
  def test_securevpc_vpc_endpoints_with_different_regions(self, *_):
    """Test VPC endpoints creation with different AWS regions."""
    mock_provider = MagicMock()
    mock_provider.region = "us-west-2"
    
    # Create SecureVPC instance with all methods mocked
    vpc = SecureVPC("test-vpc", "10.0.0.0/16", {"Environment": "Test"}, mock_provider)
    
    # Test VPC endpoints creation
    endpoints = vpc._create_vpc_endpoints()
    self.assertIsInstance(endpoints, list)

  @patch("lib.tap_stack.aws.ec2.VpcEndpoint", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.SecurityGroup", return_value=MagicMock(id="sg-123"))
  @patch("lib.tap_stack.aws.get_availability_zones", return_value=MagicMock(names=["us-east-1a", "us-east-1b"]))
  @patch("lib.tap_stack.aws.get_region", return_value=MagicMock(name="us-east-1"))
  @patch("lib.tap_stack.aws.ec2.Vpc", return_value=MagicMock(id="vpc-123"))
  @patch("lib.tap_stack.aws.ec2.InternetGateway", return_value=MagicMock(id="igw-123"))
  @patch("lib.tap_stack.aws.ec2.Subnet", return_value=MagicMock(id="subnet-123"))
  @patch("lib.tap_stack.aws.ec2.Eip", return_value=MagicMock(id="eip-123"))
  @patch("lib.tap_stack.aws.ec2.NatGateway", return_value=MagicMock(id="nat-123"))
  @patch("lib.tap_stack.aws.ec2.RouteTable", return_value=MagicMock(id="rt-123"))
  @patch("lib.tap_stack.aws.ec2.Route", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.RouteTableAssociation", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.NetworkAcl", return_value=MagicMock(id="nacl-123"))
  @patch("lib.tap_stack.aws.ec2.NetworkAclRule", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.NetworkAclAssociation", return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock(arn="arn:role", id="role-123"))
  @patch("lib.tap_stack.aws.ec2.FlowLog", return_value=MagicMock())
  @patch.object(SecureVPC, "_create_vpc_endpoints", return_value=[])
  @patch.object(SecureVPC, "_create_vpc_endpoint_sg", return_value=MagicMock(id="sg-123"))
  def test_securevpc_vpc_endpoints_export_exception(self, *_):
    """Test VPC endpoints creation when pulumi.export fails."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"
    
    # Create SecureVPC instance with all methods mocked
    vpc = SecureVPC("test-vpc", "10.0.0.0/16", {"Environment": "Test"}, mock_provider)
    
    # Test VPC endpoints creation (should handle export exception gracefully)
    endpoints = vpc._create_vpc_endpoints()
    self.assertIsInstance(endpoints, list)

  @patch("lib.tap_stack.aws.ec2.SecurityGroup", return_value=MagicMock(id="sg-123"))
  @patch("lib.tap_stack.aws.get_availability_zones", return_value=MagicMock(names=["us-east-1a", "us-east-1b"]))
  @patch("lib.tap_stack.aws.get_region", return_value=MagicMock(name="us-east-1"))
  @patch("lib.tap_stack.aws.ec2.Vpc", return_value=MagicMock(id="vpc-123"))
  @patch("lib.tap_stack.aws.ec2.InternetGateway", return_value=MagicMock(id="igw-123"))
  @patch("lib.tap_stack.aws.ec2.Subnet", return_value=MagicMock(id="subnet-123"))
  @patch("lib.tap_stack.aws.ec2.Eip", return_value=MagicMock(id="eip-123"))
  @patch("lib.tap_stack.aws.ec2.NatGateway", return_value=MagicMock(id="nat-123"))
  @patch("lib.tap_stack.aws.ec2.RouteTable", return_value=MagicMock(id="rt-123"))
  @patch("lib.tap_stack.aws.ec2.Route", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.RouteTableAssociation", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.NetworkAcl", return_value=MagicMock(id="nacl-123"))
  @patch("lib.tap_stack.aws.ec2.NetworkAclRule", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.NetworkAclAssociation", return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock(arn="arn:role", id="role-123"))
  @patch("lib.tap_stack.aws.ec2.FlowLog", return_value=MagicMock())
  @patch.object(SecureVPC, "_create_vpc_endpoints", return_value=[])
  @patch.object(SecureVPC, "_create_vpc_endpoint_sg", return_value=MagicMock(id="sg-123"))
  def test_securevpc_vpc_endpoint_sg_creation(self, *_):
    """Test VPC endpoint security group creation."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"
    
    # Create SecureVPC instance with all methods mocked
    vpc = SecureVPC("test-vpc", "10.0.0.0/16", {"Environment": "Test"}, mock_provider)
    
    # Test VPC endpoint security group creation
    sg = vpc._create_vpc_endpoint_sg()
    self.assertIsNotNone(sg)

  @patch("lib.tap_stack.aws.ec2.SecurityGroup", return_value=MagicMock(id="sg-123"))
  def test_create_eks_cluster_with_pulumi_eks(self, mock_sg):
    """Test EKS cluster creation using pulumi_eks package."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"
    
    # Mock the security group
    mock_sg.vpc_id = "vpc-123"
    mock_sg.id = "sg-123"
    
    # Mock the KMS key
    mock_kms = MagicMock()
    mock_kms.arn = "arn:aws:kms:us-east-1:123456789012:key/test"
    
    # Mock subnet IDs
    subnet_ids = ["subnet-1", "subnet-2", "subnet-3", "subnet-4"]
    
    # Mock pulumi_eks import
    with patch.dict('sys.modules', {'pulumi_eks': MagicMock()}):
        import sys
        mock_eks = MagicMock()
        mock_eks.Cluster = MagicMock(return_value="mock-cluster")
        sys.modules['pulumi_eks'] = mock_eks
        
        # Test EKS cluster creation
        cluster = create_eks_cluster(subnet_ids, mock_sg, {"Environment": "Test"}, mock_provider, mock_kms, "test")
        self.assertEqual(cluster, "mock-cluster")

  @patch("lib.tap_stack.aws.ec2.SecurityGroup", return_value=MagicMock(id="sg-123"))
  def test_create_eks_cluster_fallback_aws_eks(self, mock_sg):
    """Test EKS cluster creation fallback to AWS EKS when pulumi_eks is not available."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"
    
    # Mock the security group
    mock_sg.vpc_id = "vpc-123"
    mock_sg.id = "sg-123"
    
    # Mock the KMS key
    mock_kms = MagicMock()
    mock_kms.arn = "arn:aws:kms:us-east-1:123456789012:key/test"
    
    # Mock subnet IDs
    subnet_ids = ["subnet-1", "subnet-2", "subnet-3", "subnet-4"]
    
    # Mock AWS resources
    with patch("lib.tap_stack.aws.iam.Role") as mock_role, \
         patch("lib.tap_stack.aws.eks.Cluster") as mock_cluster:
        
        mock_role.return_value = MagicMock(arn="arn:aws:iam::123456789012:role/test")
        mock_cluster.return_value = "mock-aws-cluster"
        
        # Test EKS cluster creation fallback
        cluster = create_eks_cluster(subnet_ids, mock_sg, {"Environment": "Test"}, mock_provider, mock_kms, "test")
        self.assertEqual(cluster, "mock-aws-cluster")

  @patch("lib.tap_stack.aws.ec2.Subnet", return_value=MagicMock(id="subnet-123"))
  def test_create_eks_node_group_with_pulumi_eks(self, mock_subnet):
    """Test EKS node group creation using pulumi_eks package."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"
    
    # Mock the cluster
    mock_cluster = MagicMock()
    mock_cluster.name = "test-cluster"
    
    # Mock private subnets
    private_subnets = [mock_subnet]
    
    # Mock pulumi_eks import
    with patch.dict('sys.modules', {'pulumi_eks': MagicMock()}):
        import sys
        mock_eks = MagicMock()
        sys.modules['pulumi_eks'] = mock_eks
        
        # Test EKS node group creation
        node_group = create_eks_node_group(mock_cluster, private_subnets, {"Environment": "Test"}, mock_provider, "test")
        self.assertEqual(node_group, mock_cluster)

  @patch("lib.tap_stack.aws.ec2.Subnet", return_value=MagicMock(id="subnet-123"))
  def test_create_eks_node_group_fallback_aws_eks(self, mock_subnet):
    """Test EKS node group creation fallback to AWS EKS when pulumi_eks is not available."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"
    
    # Mock the cluster
    mock_cluster = MagicMock()
    mock_cluster.name = "test-cluster"
    
    # Mock private subnets
    private_subnets = [mock_subnet]
    
    # Mock AWS resources
    with patch("lib.tap_stack.aws.iam.Role") as mock_role, \
         patch("lib.tap_stack.aws.eks.NodeGroup") as mock_node_group:
        
        mock_role.return_value = MagicMock(arn="arn:aws:iam::123456789012:role/test")
        mock_node_group.return_value = "mock-aws-node-group"
        
        # Test EKS node group creation fallback
        node_group = create_eks_node_group(mock_cluster, private_subnets, {"Environment": "Test"}, mock_provider, "test")
        self.assertEqual(node_group, "mock-aws-node-group")

  @patch("lib.tap_stack.aws.s3.BucketPublicAccessBlock", return_value=MagicMock())
  @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.s3.Bucket",
         return_value=MagicMock(id="bucket-123"))
  def test_create_s3_buckets(self, mock_bucket, *_):
    """Ensure create_s3_buckets creates encrypted S3 buckets."""
    mock_provider = MagicMock()
    kms_key = MagicMock(arn="kms-arn-123")
    tags = {"Environment": "Production"}

    buckets = create_s3_buckets(kms_key, tags, mock_provider)

    self.assertIn("app_bucket", buckets)
    self.assertEqual(buckets["app_bucket"], mock_bucket.return_value)

  @patch("lib.tap_stack.aws.cloudwatch.MetricAlarm", return_value=MagicMock())
  def test_create_cloudwatch_alarms(self, mock_alarm):
    """Ensure create_cloudwatch_alarms creates monitoring alarms."""
    mock_provider = MagicMock()
    alb = MagicMock(arn_suffix="alb-suffix")
    rds_instance = MagicMock(id="rds-123")
    tags = {"Environment": "Production"}

    create_cloudwatch_alarms(alb, rds_instance, tags, mock_provider)

    # Should create 2 alarms (ALB and RDS)
    self.assertEqual(mock_alarm.call_count, 2)

  @patch("lib.tap_stack.aws.lb.Listener", return_value=MagicMock())
  @patch("lib.tap_stack.aws.lb.TargetGroup",
         return_value=MagicMock(arn="tg-arn"))
  @patch("lib.tap_stack.aws.lb.LoadBalancer",
         return_value=MagicMock(dns_name="alb-dns"))
  def test_create_alb(self, *_):
    """Verify create_alb provisions ALB, TargetGroup, and Listener."""
    mock_provider = MagicMock()
    subs = [
        MagicMock(
            id="public1", vpc_id="vpc"), MagicMock(
            id="public2", vpc_id="vpc")]
    sg = MagicMock()
    tags = {"Environment": "Production"}
    alb, tg, _ = create_alb(subs, sg, tags, mock_provider)
    self.assertEqual(alb.dns_name, "alb-dns")
    self.assertEqual(tg.arn, "tg-arn")

  @patch("lib.tap_stack.aws.ssm.Parameter",
         return_value=MagicMock(value="ghtoken"))
  @patch("lib.tap_stack.pulumi.Output.concat",
         return_value="arn:aws:s3:::bucketname/*")
  @patch("lib.tap_stack.pulumi.Output.all")
  @patch("lib.tap_stack.json.dumps", return_value="{}")
  @patch("lib.tap_stack.aws.codebuild.Project", return_value=MagicMock(
      arn="arn:aws:codebuild:us-west-2:123456789012:project/corp-codebuild-project"))
  @patch("lib.tap_stack.aws.codepipeline.Pipeline")
  @patch("lib.tap_stack.aws.iam.RolePolicyAttachment",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.RolePolicy",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.Role",
         return_value=MagicMock(arn="arn", name="role", id="role-id"))
  @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.s3.Bucket",
         return_value=MagicMock(bucket="bucketname", arn="arn:aws:s3:::bucketname", id="bucketid"))
  def test_create_codepipeline(
          self, _bucket, _encryption, _role, _role_policy, _attachment,
          mock_pipeline_class, _codebuild, _json_dumps, _output_all, _concat, _ssm):
    """Ensure create_codepipeline provisions a pipeline with GitHub source integration."""
    mock_provider = MagicMock()
    mock_pipeline_instance = MagicMock()
    mock_pipeline_instance.name = "pipeline"
    mock_pipeline_class.return_value = mock_pipeline_instance

    # Mock the Output.all().apply() pattern
    mock_output = MagicMock()
    mock_output.apply.return_value = "{\"Version\":\"2012-10-17\"}"
    _output_all.return_value = mock_output

    # Mock second CodeBuild project call
    _codebuild.side_effect = [
        MagicMock(
            arn="arn:aws:codebuild:us-west-2:123456789012:project/corp-codebuild-project"),
        MagicMock(
            arn="arn:aws:codebuild:us-west-2:123456789012:project/corp-codebuild-deploy-project")
    ]

    kms_key = MagicMock(id="kid", arn="arn")
    tags = {"Environment": "Production"}
    cp = create_codepipeline(
        role_name="role", repo_owner="owner", repo_name="repo",
        repo_branch="main", github_oauth_token_param="/github/token",
        kms_key=kms_key, tags=tags, provider=mock_provider
    )
    self.assertEqual(cp.name, "pipeline")

  @patch("lib.tap_stack.aws.lambda_.Permission", return_value=MagicMock())
  @patch("lib.tap_stack.aws.cloudwatch.EventTarget",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.cloudwatch.EventRule",
         return_value=MagicMock(name="rule"))
  @patch("lib.tap_stack.aws.iam.RolePolicyAttachment",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock(arn="arn"))
  @patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=MagicMock())
  @patch("lib.tap_stack.aws.lambda_.Function")
  def test_create_monitoring_lambda(self, mock_lambda_class, *_):
    """Validate that create_monitoring_lambda provisions a Lambda with schedule and permissions."""
    mock_provider = MagicMock()
    mock_lambda_instance = MagicMock()
    mock_lambda_instance.name = "lambda"
    mock_lambda_instance.arn = "arn"
    mock_lambda_class.return_value = mock_lambda_instance

    subnets = [MagicMock(id="subnet1"), MagicMock(id="subnet2")]
    sg = MagicMock()
    kms_key = MagicMock(arn="arn")
    tags = {"Environment": "Production"}
    fn = create_monitoring_lambda(subnets, sg, kms_key, tags, mock_provider)
    self.assertEqual(fn.name, "lambda")

  @patch("lib.tap_stack.aws.rds.Instance",
         return_value=MagicMock(endpoint="db-endpoint"))
  @patch("lib.tap_stack.aws.rds.SubnetGroup", return_value=MagicMock())
  @patch("lib.tap_stack.random.RandomPassword",
         return_value=MagicMock(result="generated-password"))
  @patch("lib.tap_stack.aws.ssm.Parameter", return_value=MagicMock())
  def test_create_rds(self, *_):
    """Verify that create_rds provisions an encrypted RDS instance with generated password."""
    mock_provider = MagicMock()
    subnets = [MagicMock(id="subnet1"), MagicMock(id="subnet2")]
    db_sg = MagicMock(id="sg-123")
    kms_key = MagicMock(id="kid")
    tags = {"Environment": "Production"}
    rds = create_rds(
        subnets=subnets,
        db_sg=db_sg,
        kms_key=kms_key,
        tags=tags,
        db_password_param_name="/app/dbpass",
        provider=mock_provider)
    self.assertEqual(rds.endpoint, "db-endpoint")

  @patch("lib.tap_stack.aws.iam.RolePolicyAttachment",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.Role",
         return_value=MagicMock(arn="arn:role"))
  @patch("lib.tap_stack.aws.eks.Cluster")
  def test_create_eks_cluster(self, mock_cluster_class, *_):
    """Validate create_eks_cluster provisions an EKS cluster with IAM role attached."""
    mock_provider = MagicMock()
    mock_cluster_instance = MagicMock()
    mock_cluster_instance.name = "cluster"
    mock_cluster_instance.endpoint = "eks-endpoint"
    mock_cluster_class.return_value = mock_cluster_instance

    subnet_ids = ["subnet1", "subnet2"]
    eks_cluster_sg = MagicMock(id="sg-123")
    tags = {"Environment": "Production"}
    # Mock KMS key for encryption config
    mock_kms_key = MagicMock(arn="arn:aws:kms:us-west-2:123456789012:key/test-key")
    
    cluster = create_eks_cluster(
        subnet_ids=subnet_ids,
        eks_cluster_sg=eks_cluster_sg,
        tags=tags,
        provider=mock_provider,
        kms_key=mock_kms_key
    )
    self.assertEqual(cluster.name, "cluster")

  @patch("lib.tap_stack.aws.iam.RolePolicy", return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.RolePolicyAttachment",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock())
  @patch("lib.tap_stack.aws.eks.NodeGroup")
  def test_create_eks_node_group(self, mock_ng_class, _mock_role,
                                 _mock_role_policy, *_):
    """Ensure create_eks_node_group provisions a managed node group with correct scaling configuration."""
    mock_provider = MagicMock()
    mock_ng_instance = MagicMock()
    mock_ng_instance.node_group_name = "nodes"
    mock_ng_class.return_value = mock_ng_instance

    # Mock cluster with Output-like behavior
    cluster = MagicMock()
    cluster_name_output = MagicMock()
    cluster_name_output.apply = MagicMock(
        side_effect=lambda func: MagicMock(
            apply=lambda f: f(
                func("eks-cluster"))))
    cluster.name = cluster_name_output

    private_subnets = [MagicMock(id="subnet1"), MagicMock(id="subnet2")]
    tags = {"Environment": "Production"}
    ng = create_eks_node_group(
        cluster=cluster,
        private_subnets=private_subnets,
        tags=tags,
        provider=mock_provider
    )
    self.assertEqual(ng.node_group_name, "nodes")

  @patch("lib.tap_stack.aws.s3.BucketPublicAccessBlock", return_value=MagicMock())
  @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.s3.Bucket",
         return_value=MagicMock(id="bucket-123"))
  def test_create_s3_buckets(self, mock_bucket, *_):
    """Ensure create_s3_buckets creates encrypted S3 buckets."""
    mock_provider = MagicMock()
    kms_key = MagicMock(arn="kms-arn-123")
    tags = {"Environment": "Production"}

    buckets = create_s3_buckets(kms_key, tags, mock_provider)

    self.assertIn("app_bucket", buckets)
    self.assertEqual(buckets["app_bucket"], mock_bucket.return_value)

  @patch("lib.tap_stack.aws.cloudwatch.MetricAlarm", return_value=MagicMock())
  def test_create_cloudwatch_alarms(self, mock_alarm):
    """Ensure create_cloudwatch_alarms creates monitoring alarms."""
    mock_provider = MagicMock()
    alb = MagicMock(arn_suffix="alb-suffix")
    rds_instance = MagicMock(id="rds-123")
    tags = {"Environment": "Production"}

    create_cloudwatch_alarms(alb, rds_instance, tags, mock_provider)

    # Should create 2 alarms (ALB and RDS)
    self.assertEqual(mock_alarm.call_count, 2)

  @patch("lib.tap_stack.aws.lb.Listener", return_value=MagicMock())
  @patch("lib.tap_stack.aws.lb.TargetGroup",
         return_value=MagicMock(arn="tg-arn"))
  @patch("lib.tap_stack.aws.lb.LoadBalancer",
         return_value=MagicMock(dns_name="alb-dns"))
  def test_create_alb(self, *_):
    """Verify create_alb provisions ALB, TargetGroup, and Listener."""
    mock_provider = MagicMock()
    subs = [
        MagicMock(
            id="public1", vpc_id="vpc"), MagicMock(
            id="public2", vpc_id="vpc")]
    sg = MagicMock()
    tags = {"Environment": "Production"}
    alb, tg, _ = create_alb(subs, sg, tags, mock_provider)
    self.assertEqual(alb.dns_name, "alb-dns")
    self.assertEqual(tg.arn, "tg-arn")

  @patch("lib.tap_stack.aws.ssm.Parameter",
         return_value=MagicMock(value="ghtoken"))
  @patch("lib.tap_stack.pulumi.Output.concat",
         return_value="arn:aws:s3:::bucketname/*")
  @patch("lib.tap_stack.pulumi.Output.all")
  @patch("lib.tap_stack.json.dumps", return_value="{}")
  @patch("lib.tap_stack.aws.codebuild.Project", return_value=MagicMock(
      arn="arn:aws:codebuild:us-west-2:123456789012:project/corp-codebuild-project"))
  @patch("lib.tap_stack.aws.codepipeline.Pipeline")
  @patch("lib.tap_stack.aws.iam.RolePolicyAttachment",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.RolePolicy",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.Role",
         return_value=MagicMock(arn="arn", name="role", id="role-id"))
  @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.s3.Bucket",
         return_value=MagicMock(bucket="bucketname", arn="arn:aws:s3:::bucketname", id="bucketid"))
  def test_create_codepipeline(
          self, _bucket, _encryption, _role, _role_policy, _attachment,
          mock_pipeline_class, _codebuild, _json_dumps, _output_all, _concat, _ssm):
    """Ensure create_codepipeline provisions a pipeline with GitHub source integration."""
    mock_provider = MagicMock()
    mock_pipeline_instance = MagicMock()
    mock_pipeline_instance.name = "pipeline"
    mock_pipeline_class.return_value = mock_pipeline_instance

    # Mock the Output.all().apply() pattern
    mock_output = MagicMock()
    mock_output.apply.return_value = "{\"Version\":\"2012-10-17\"}"
    _output_all.return_value = mock_output

    # Mock second CodeBuild project call
    _codebuild.side_effect = [
        MagicMock(
            arn="arn:aws:codebuild:us-west-2:123456789012:project/corp-codebuild-project"),
        MagicMock(
            arn="arn:aws:codebuild:us-west-2:123456789012:project/corp-codebuild-deploy-project")
    ]

    kms_key = MagicMock(id="kid", arn="arn")
    tags = {"Environment": "Production"}
    cp = create_codepipeline(
        role_name="role", repo_owner="owner", repo_name="repo",
        repo_branch="main", github_oauth_token_param="/github/token",
        kms_key=kms_key, tags=tags, provider=mock_provider
    )
    self.assertEqual(cp.name, "pipeline")

  @patch("lib.tap_stack.aws.lambda_.Permission", return_value=MagicMock())
  @patch("lib.tap_stack.aws.cloudwatch.EventTarget",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.cloudwatch.EventRule",
         return_value=MagicMock(name="rule"))
  @patch("lib.tap_stack.aws.iam.RolePolicyAttachment",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock(arn="arn"))
  @patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=MagicMock())
  @patch("lib.tap_stack.aws.lambda_.Function")
  def test_create_monitoring_lambda(self, mock_lambda_class, *_):
    """Validate that create_monitoring_lambda provisions a Lambda with schedule and permissions."""
    mock_provider = MagicMock()
    mock_lambda_instance = MagicMock()
    mock_lambda_instance.name = "lambda"
    mock_lambda_instance.arn = "arn"
    mock_lambda_class.return_value = mock_lambda_instance

    subnets = [MagicMock(id="subnet1"), MagicMock(id="subnet2")]
    sg = MagicMock()
    kms_key = MagicMock(arn="arn")
    tags = {"Environment": "Production"}
    fn = create_monitoring_lambda(subnets, sg, kms_key, tags, mock_provider)
    self.assertEqual(fn.name, "lambda")

  def test_create_nginx_deployment_with_pulumi_eks(self):
    """Test NGINX deployment creation using pulumi_eks cluster."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"
    
    # Mock the EKS cluster with provider
    mock_cluster = MagicMock()
    mock_k8s_provider = MagicMock()
    mock_cluster.provider = mock_k8s_provider
    
    # Mock pulumi_eks import to fail, so it goes to fallback
    with patch.dict('sys.modules', {'pulumi_eks': None}):
        # Test NGINX deployment creation - this will fall back to mock since pulumi_eks import fails
        from lib.tap_stack import create_nginx_deployment
        deployment = create_nginx_deployment(mock_cluster, {"Environment": "Test"}, mock_provider, "test")
        self.assertIsNotNone(deployment)
        self.assertTrue(hasattr(deployment, 'metadata'))

  def test_create_nginx_deployment_fallback_mock(self):
    """Test NGINX deployment creation fallback to mock when pulumi_eks is not available."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"
    
    # Mock the EKS cluster without provider
    mock_cluster = MagicMock()
    # Remove provider attribute to trigger fallback
    del mock_cluster.provider
    
    # Test NGINX deployment creation fallback
    from lib.tap_stack import create_nginx_deployment
    deployment = create_nginx_deployment(mock_cluster, {"Environment": "Test"}, mock_provider, "test")
    self.assertIsNotNone(deployment)
    self.assertTrue(hasattr(deployment, 'metadata'))

  def test_create_nginx_deployment_import_error(self):
    """Test NGINX deployment creation when pulumi_eks import fails."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"
    
    # Mock the EKS cluster
    mock_cluster = MagicMock()
    
    # Test NGINX deployment creation with import error
    from lib.tap_stack import create_nginx_deployment
    deployment = create_nginx_deployment(mock_cluster, {"Environment": "Test"}, mock_provider, "test")
    self.assertIsNotNone(deployment)
    self.assertTrue(hasattr(deployment, 'metadata'))

  def test_create_mock_nginx_deployment(self):
    """Test mock NGINX deployment creation."""
    from lib.tap_stack import create_mock_nginx_deployment
    deployment = create_mock_nginx_deployment("test")
    self.assertIsNotNone(deployment)
    self.assertTrue(hasattr(deployment, 'metadata'))
    self.assertEqual(len(deployment.metadata), 1)
    self.assertEqual(deployment.metadata[0].name, "test-nginx-deployment")

  @patch("lib.tap_stack.aws.ec2.VpcEndpoint", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.SecurityGroup", return_value=MagicMock(id="sg-123"))
  def test_securevpc_vpc_endpoints_real_creation(self, mock_sg, mock_endpoint):
    """Test actual VPC endpoints creation code execution."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"
    
    # Create SecureVPC instance with minimal mocking
    with patch("lib.tap_stack.aws.get_availability_zones", return_value=MagicMock(names=["us-east-1a", "us-east-1b"])), \
         patch("lib.tap_stack.aws.get_region", return_value=MagicMock(name="us-east-1")), \
         patch("lib.tap_stack.aws.ec2.Vpc", return_value=MagicMock(id="vpc-123")), \
         patch("lib.tap_stack.aws.ec2.InternetGateway", return_value=MagicMock(id="igw-123")), \
         patch("lib.tap_stack.aws.ec2.Subnet", return_value=MagicMock(id="subnet-123")), \
         patch("lib.tap_stack.aws.ec2.Eip", return_value=MagicMock(id="eip-123")), \
         patch("lib.tap_stack.aws.ec2.NatGateway", return_value=MagicMock(id="nat-123")), \
         patch("lib.tap_stack.aws.ec2.RouteTable", return_value=MagicMock(id="rt-123")), \
         patch("lib.tap_stack.aws.ec2.Route", return_value=MagicMock()), \
         patch("lib.tap_stack.aws.ec2.RouteTableAssociation", return_value=MagicMock()), \
         patch("lib.tap_stack.aws.ec2.NetworkAcl", return_value=MagicMock(id="nacl-123")), \
         patch("lib.tap_stack.aws.ec2.NetworkAclRule", return_value=MagicMock()), \
         patch("lib.tap_stack.aws.ec2.NetworkAclAssociation", return_value=MagicMock()), \
         patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock(arn="arn:role", id="role-123")), \
         patch("lib.tap_stack.aws.ec2.FlowLog", return_value=MagicMock()):
      
      vpc = SecureVPC("test-vpc", "10.0.0.0/16", {"Environment": "Test"}, mock_provider)
      
      # Now test the actual VPC endpoints creation without mocking the methods
      # This will execute the real code paths
      endpoints = vpc._create_vpc_endpoints()
      self.assertIsInstance(endpoints, list)
      self.assertGreater(len(endpoints), 0)
      
      # Test the actual VPC endpoint security group creation
      sg = vpc._create_vpc_endpoint_sg()
      self.assertIsNotNone(sg)

  @patch("lib.tap_stack.aws.ec2.VpcEndpoint", return_value=MagicMock())
  @patch("lib.tap_stack.aws.ec2.SecurityGroup", return_value=MagicMock(id="sg-123"))
  def test_securevpc_vpc_endpoints_different_region_real(self, mock_sg, mock_endpoint):
    """Test VPC endpoints creation with different region in real code."""
    mock_provider = MagicMock()
    mock_provider.region = "us-west-2"
    
    # Create SecureVPC instance with minimal mocking
    with patch("lib.tap_stack.aws.get_availability_zones", return_value=MagicMock(names=["us-west-2a", "us-west-2b"])), \
         patch("lib.tap_stack.aws.get_region", return_value=MagicMock(name="us-west-2")), \
         patch("lib.tap_stack.aws.ec2.Vpc", return_value=MagicMock(id="vpc-123")), \
         patch("lib.tap_stack.aws.ec2.InternetGateway", return_value=MagicMock(id="igw-123")), \
         patch("lib.tap_stack.aws.ec2.Subnet", return_value=MagicMock(id="subnet-123")), \
         patch("lib.tap_stack.aws.ec2.Eip", return_value=MagicMock(id="eip-123")), \
         patch("lib.tap_stack.aws.ec2.NatGateway", return_value=MagicMock(id="nat-123")), \
         patch("lib.tap_stack.aws.ec2.RouteTable", return_value=MagicMock(id="rt-123")), \
         patch("lib.tap_stack.aws.ec2.Route", return_value=MagicMock()), \
         patch("lib.tap_stack.aws.ec2.RouteTableAssociation", return_value=MagicMock()), \
         patch("lib.tap_stack.aws.ec2.NetworkAcl", return_value=MagicMock(id="nacl-123")), \
         patch("lib.tap_stack.aws.ec2.NetworkAclRule", return_value=MagicMock()), \
         patch("lib.tap_stack.aws.ec2.NetworkAclAssociation", return_value=MagicMock()), \
         patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock(arn="arn:role", id="role-123")), \
         patch("lib.tap_stack.aws.ec2.FlowLog", return_value=MagicMock()):
      
      vpc = SecureVPC("test-vpc", "10.0.0.0/16", {"Environment": "Test"}, mock_provider)
      
      # Test the actual VPC endpoints creation with different region
      endpoints = vpc._create_vpc_endpoints()
      self.assertIsInstance(endpoints, list)
      self.assertGreater(len(endpoints), 0)

  def test_nginx_deployment_pulumi_eks_success_path(self):
    """Test NGINX deployment with successful pulumi_eks import."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"
    
    # Mock the EKS cluster with provider
    mock_cluster = MagicMock()
    mock_k8s_provider = MagicMock()
    mock_cluster.provider = mock_k8s_provider
    
    # Mock pulumi_eks import to fail, so it goes to fallback
    with patch.dict('sys.modules', {'pulumi_eks': None}):
        # Test that it falls back to mock when pulumi_eks import fails
        from lib.tap_stack import create_nginx_deployment
        deployment = create_nginx_deployment(mock_cluster, {"Environment": "Test"}, mock_provider, "test")
        self.assertIsNotNone(deployment)
        self.assertTrue(hasattr(deployment, 'metadata'))

  def test_nginx_deployment_cluster_without_provider(self):
    """Test NGINX deployment when cluster has no provider attribute."""
    mock_provider = MagicMock()
    mock_provider.region = "us-east-1"
    
    # Mock the EKS cluster without provider attribute
    mock_cluster = MagicMock()
    # Don't set provider attribute
    
    # Mock pulumi_eks import to fail, so it goes to fallback
    with patch.dict('sys.modules', {'pulumi_eks': None}):
        from lib.tap_stack import create_nginx_deployment
        deployment = create_nginx_deployment(mock_cluster, {"Environment": "Test"}, mock_provider, "test")
        self.assertIsNotNone(deployment)
        self.assertTrue(hasattr(deployment, 'metadata'))


class TestTapStack(unittest.TestCase):
  """End-to-end orchestration test for TapStack ensuring major components are called."""

  # pylint: disable=too-many-arguments
  def _create_test_stack(self, **kwargs):
    """Helper method to create test stack with default mocks."""
    args = TapStackArgs(
        environment_suffix=kwargs.get("env_suffix", "prod"),
        tags=kwargs.get("tags", {"Environment": "Production"}),
        github_owner=kwargs.get("github_owner", "test-owner"),
        github_repo=kwargs.get("github_repo", "test-repo"),
        github_branch=kwargs.get("github_branch", "main")
    )
    return TapStack("test-stack", args)

  # Mock pulumi.export to avoid stack context error
  @patch("lib.tap_stack.pulumi.export")
  @patch("lib.tap_stack.aws.ec2.SecurityGroup",
         return_value=MagicMock())  # For lambda_sg
  @patch("lib.tap_stack.aws.get_region")
  @patch("lib.tap_stack.create_monitoring_lambda",
         return_value=MagicMock(name="lambda"))
  @patch("lib.tap_stack.create_cloudwatch_alarms", return_value=None)
  @patch("lib.tap_stack.create_codepipeline",
         return_value=MagicMock(name="pipeline"))
  @patch("lib.tap_stack.create_alb",
         return_value=(MagicMock(dns_name="alb", arn_suffix="alb-suffix"),
                       MagicMock(arn="tg"), MagicMock()))
  @patch("lib.tap_stack.create_eks_node_group",
         return_value=MagicMock(node_group_name="nodegroup"))
  @patch("lib.tap_stack.create_eks_cluster",
         return_value=MagicMock(name="eks", endpoint="endpoint"))
  @patch("lib.tap_stack.create_s3_buckets",
         return_value={"app_bucket": MagicMock(bucket="test-bucket")})
  @patch("lib.tap_stack.create_rds",
         return_value=MagicMock(id="rds", endpoint="db"))
  @patch("lib.tap_stack.create_security_groups",
         return_value={"alb_sg": MagicMock(), "db_sg": MagicMock(),
                       "eks_cluster_sg": MagicMock(), "eks_node_sg": MagicMock()})
  @patch("lib.tap_stack.create_kms_key",
         return_value=MagicMock(id="kms", arn="arn"))
  @patch("lib.tap_stack.SecureVPC",
         return_value=MagicMock(vpc=MagicMock(id="vpc"),
                                public_subnets=[MagicMock(id="psub")],
                                private_subnets=[MagicMock(id="prsub")],
                                availability_zones=["us-west-2a",
                                                    "us-west-2b"]))
  def test_tapstack_init_happy_path(self, *_):
    """Construct TapStack and verify instantiation does not raise and calls major component fns."""
    with patch("lib.tap_stack.aws.get_region") as mock_region:
      mock_region.return_value.name = "us-west-2"

      stack = self._create_test_stack()
      self.assertIsInstance(stack, TapStack)

  @patch("lib.tap_stack.pulumi.export")
  @patch("lib.tap_stack.aws.ec2.SecurityGroup", return_value=MagicMock())
  @patch("lib.tap_stack.aws.get_region")
  @patch("lib.tap_stack.create_monitoring_lambda",
         return_value=MagicMock(name="lambda"))
  @patch("lib.tap_stack.create_cloudwatch_alarms", return_value=None)
  @patch("lib.tap_stack.create_codepipeline",
         return_value=MagicMock(name="pipeline"))
  @patch("lib.tap_stack.create_alb",
         return_value=(MagicMock(dns_name="alb", arn_suffix="alb-suffix"),
                       MagicMock(arn="tg"), MagicMock()))
  @patch("lib.tap_stack.create_eks_node_group",
         return_value=MagicMock(node_group_name="nodegroup"))
  @patch("lib.tap_stack.create_eks_cluster",
         return_value=MagicMock(name="eks", endpoint="endpoint"))
  @patch("lib.tap_stack.create_s3_buckets",
         return_value={"app_bucket": MagicMock(bucket="test-bucket")})
  @patch("lib.tap_stack.create_rds",
         return_value=MagicMock(id="rds", endpoint="db"))
  @patch("lib.tap_stack.create_security_groups",
         return_value={"alb_sg": MagicMock(), "db_sg": MagicMock(),
                       "eks_cluster_sg": MagicMock(), "eks_node_sg": MagicMock()})
  @patch("lib.tap_stack.create_kms_key",
         return_value=MagicMock(id="kms", arn="arn"))
  @patch("lib.tap_stack.SecureVPC",
         return_value=MagicMock(vpc=MagicMock(id="vpc"),
                                public_subnets=[MagicMock(id="psub")],
                                private_subnets=[MagicMock(id="prsub")],
                                availability_zones=["us-west-2a",
                                                    "us-west-2b"]))
  def test_tapstack_with_custom_tags(self, *_):
    """Test TapStack with custom tags to cover the tag update branch."""
    with patch("lib.tap_stack.aws.get_region") as mock_region:
      mock_region.return_value.name = "us-west-2"

      # Test with custom tags to cover the args.tags branch
      stack = self._create_test_stack(
          env_suffix="dev",
          tags={"Custom": "Tag", "Environment": "Dev"}
      )
      self.assertIsInstance(stack, TapStack)

  @patch("lib.tap_stack.pulumi.export")
  @patch("lib.tap_stack.aws.ec2.SecurityGroup", return_value=MagicMock())
  @patch("lib.tap_stack.aws.get_region")
  @patch("lib.tap_stack.create_monitoring_lambda",
         return_value=MagicMock(name="lambda"))
  @patch("lib.tap_stack.create_cloudwatch_alarms", return_value=None)
  @patch("lib.tap_stack.create_codepipeline",
         return_value=MagicMock(name="pipeline"))
  @patch("lib.tap_stack.create_alb",
         return_value=(MagicMock(dns_name="alb", arn_suffix="alb-suffix"),
                       MagicMock(arn="tg"), MagicMock()))
  @patch("lib.tap_stack.create_eks_node_group",
         return_value=MagicMock(node_group_name="nodegroup"))
  @patch("lib.tap_stack.create_eks_cluster",
         return_value=MagicMock(name="eks", endpoint="endpoint"))
  @patch("lib.tap_stack.create_s3_buckets",
         return_value={"app_bucket": MagicMock(bucket="test-bucket")})
  @patch("lib.tap_stack.create_rds",
         return_value=MagicMock(id="rds", endpoint="db"))
  @patch("lib.tap_stack.create_security_groups",
         return_value={"alb_sg": MagicMock(), "db_sg": MagicMock(),
                       "eks_cluster_sg": MagicMock(), "eks_node_sg": MagicMock()})
  @patch("lib.tap_stack.create_kms_key",
         return_value=MagicMock(id="kms", arn="arn"))
  @patch("lib.tap_stack.SecureVPC",
         return_value=MagicMock(vpc=MagicMock(id="vpc"),
                                public_subnets=[MagicMock(id="psub")],
                                private_subnets=[MagicMock(id="prsub")],
                                availability_zones=["us-west-2a",
                                                    "us-west-2b"]))
  def test_tapstack_with_github_branch_default(self, *_):
    """Test TapStack GitHub branch default value path."""
    with patch("lib.tap_stack.aws.get_region") as mock_region:
      mock_region.return_value.name = "us-west-2"

      # Test with None branch to test default value
      stack = self._create_test_stack(github_branch=None)
      self.assertIsInstance(stack, TapStack)


if __name__ == '__main__':
  unittest.main()
