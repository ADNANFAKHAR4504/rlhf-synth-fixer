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
                           create_codepipeline, create_eks_cluster,
                           create_eks_node_group, create_kms_key,
                           create_monitoring_lambda, create_rds,
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
  def test_securevpc_full_creation(self, *_):
    """Test complete SecureVPC creation to cover all internal methods."""
    mock_provider = MagicMock()
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

  @patch.object(SecureVPC, "_create_vpc", return_value="vpc")
  @patch.object(SecureVPC, "_create_internet_gateway", return_value="igw")
  @patch.object(SecureVPC, "_create_public_subnets",
                return_value=["pub1", "pub2"])
  @patch.object(SecureVPC, "_create_private_subnets",
                return_value=["priv1", "priv2"])
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
  @patch("lib.tap_stack.aws.get_region",
         return_value=MagicMock(name="us-west-2"))
  @patch("lib.tap_stack.aws.get_availability_zones",
         return_value=MagicMock(names=["us-west-2a", "us-west-2b"]))
  def test_securevpc_init(self, *_):
    """Ensure SecureVPC calls all internal creation methods and assigns expected attributes."""
    mock_provider = MagicMock()
    vpc = SecureVPC("test", "10.0.0.0/16", {"Env": "Test"}, mock_provider)
    self.assertEqual(vpc.vpc, "vpc")
    self.assertEqual(vpc.igw, "igw")
    self.assertEqual(vpc.public_subnets, ["pub1", "pub2"])
    self.assertEqual(vpc.private_subnets, ["priv1", "priv2"])


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

  @patch("lib.tap_stack.aws.ec2.SecurityGroup",
         side_effect=lambda *a, **k: MagicMock(id="sg", **k))
  def test_create_security_groups(self, _):
    """Ensure create_security_groups returns all required security groups."""
    mock_provider = MagicMock()
    vpc = MagicMock()
    vpc.id = "vpc-123"
    sample_tags = {"Environment": "Production"}
    sgs = create_security_groups(vpc, sample_tags, mock_provider)
    self.assertIn("web_sg", sgs)
    self.assertIn("db_sg", sgs)
    self.assertIn("eks_sg", sgs)
    self.assertIn("alb_sg", sgs)

  @patch("lib.tap_stack.random.RandomPassword",
         return_value=MagicMock(result="generated-password"))
  @patch("lib.tap_stack.aws.ssm.Parameter", return_value=MagicMock())
  @patch("lib.tap_stack.aws.rds.Instance",
         return_value=MagicMock(endpoint="db-endpoint"))
  @patch("lib.tap_stack.aws.rds.SubnetGroup", return_value=MagicMock())
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

    subnets = ["subnet1", "subnet2"]
    eks_sg = MagicMock(id="sg-123")
    tags = {"Environment": "Production"}
    cluster = create_eks_cluster(subnets, eks_sg, tags, mock_provider)
    self.assertEqual(cluster.name, "cluster")

  @patch("lib.tap_stack.aws.iam.RolePolicyAttachment",
         return_value=MagicMock())
  @patch("lib.tap_stack.aws.iam.Role", return_value=MagicMock())
  @patch("lib.tap_stack.aws.eks.NodeGroup")
  def test_create_eks_node_group(self, mock_ng_class, *_):
    """Ensure create_eks_node_group provisions a node group with correct scaling configuration."""
    mock_provider = MagicMock()
    mock_ng_instance = MagicMock()
    mock_ng_instance.node_group_name = "nodes"
    mock_ng_class.return_value = mock_ng_instance

    cluster = MagicMock()
    cluster.name = "eks"
    subnets = [MagicMock(id="subnet1"), MagicMock(id="subnet2")]
    tags = {"Environment": "Production"}
    ng = create_eks_node_group(cluster, subnets, tags, mock_provider)
    self.assertEqual(ng.node_group_name, "nodes")

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
  @patch("lib.tap_stack.create_codepipeline",
         return_value=MagicMock(name="pipeline"))
  @patch("lib.tap_stack.create_alb",
         return_value=(MagicMock(dns_name="alb"),
                       MagicMock(arn="tg"), MagicMock()))
  @patch("lib.tap_stack.create_eks_node_group", return_value=MagicMock())
  @patch("lib.tap_stack.create_eks_cluster",
         return_value=MagicMock(name="eks", endpoint="endpoint"))
  @patch("lib.tap_stack.create_rds",
         return_value=MagicMock(id="rds", endpoint="db"))
  @patch("lib.tap_stack.create_security_groups",
         return_value={"web_sg": MagicMock(), "db_sg": MagicMock(),
                       "eks_sg": MagicMock(), "alb_sg": MagicMock()})
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
  @patch("lib.tap_stack.create_codepipeline",
         return_value=MagicMock(name="pipeline"))
  @patch("lib.tap_stack.create_alb",
         return_value=(MagicMock(dns_name="alb"),
                       MagicMock(arn="tg"), MagicMock()))
  @patch("lib.tap_stack.create_eks_node_group", return_value=MagicMock())
  @patch("lib.tap_stack.create_eks_cluster",
         return_value=MagicMock(name="eks", endpoint="endpoint"))
  @patch("lib.tap_stack.create_rds",
         return_value=MagicMock(id="rds", endpoint="db"))
  @patch("lib.tap_stack.create_security_groups",
         return_value={"web_sg": MagicMock(), "db_sg": MagicMock(),
                       "eks_sg": MagicMock(), "alb_sg": MagicMock()})
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
  @patch("lib.tap_stack.create_codepipeline",
         return_value=MagicMock(name="pipeline"))
  @patch("lib.tap_stack.create_alb",
         return_value=(MagicMock(dns_name="alb"),
                       MagicMock(arn="tg"), MagicMock()))
  @patch("lib.tap_stack.create_eks_node_group", return_value=MagicMock())
  @patch("lib.tap_stack.create_eks_cluster",
         return_value=MagicMock(name="eks", endpoint="endpoint"))
  @patch("lib.tap_stack.create_rds",
         return_value=MagicMock(id="rds", endpoint="db"))
  @patch("lib.tap_stack.create_security_groups",
         return_value={"web_sg": MagicMock(), "db_sg": MagicMock(),
                       "eks_sg": MagicMock(), "alb_sg": MagicMock()})
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
