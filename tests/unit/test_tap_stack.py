import unittest
from unittest.mock import patch, MagicMock
import pulumi
import pulumi_aws as aws
from lib.tap_stack import (
  TapStackArgs,
  SecureVPC,
  create_kms_key,
  create_security_groups,
  create_compute_resources,
  create_api_gateway,
  create_api_gateway_cloudwatch_role,
  create_monitoring,
  TapStack,
)



# ---- TapStackArgs tests ----
class TestTapStackArgs(unittest.TestCase):
  def test_default_values(self):
    args = TapStackArgs()
    self.assertEqual(args.environment_suffix, "dev")
    self.assertEqual(args.tags, {"Environment": "Production"})

  def test_custom_values(self):
    args = TapStackArgs(environment_suffix="prod", tags={"Project": "Nova"})
    self.assertEqual(args.environment_suffix, "prod")
    self.assertEqual(args.tags["Project"], "Nova")
    self.assertEqual(args.tags["Environment"], "Production")

# ---- SecureVPC tests ----
class TestSecureVPC(unittest.TestCase):
  @patch("pulumi_aws.get_region")
  @patch("pulumi_aws.get_availability_zones")
  @patch("pulumi_aws.ec2.Vpc")
  @patch("pulumi_aws.ec2.InternetGateway")
  @patch("pulumi_aws.ec2.Subnet")
  @patch("pulumi_aws.ec2.Eip")
  @patch("pulumi_aws.ec2.NatGateway")
  @patch("pulumi_aws.ec2.RouteTable")
  @patch("pulumi_aws.ec2.Route")
  @patch("pulumi_aws.ec2.RouteTableAssociation")
  @patch("pulumi_aws.ec2.NetworkAcl")
  @patch("pulumi_aws.ec2.NetworkAclRule")
  @patch("pulumi_aws.ec2.NetworkAclAssociation")
  @patch("pulumi_aws.iam.Role")
  @patch("pulumi_aws.iam.RolePolicyAttachment")
  @patch("pulumi_aws.ec2.FlowLog")
  @patch("pulumi_aws.cloudwatch.LogGroup")
  def test_secure_vpc_creation(self, mock_lg, mock_fl, mock_rpa, mock_role, mock_nacl_assoc, mock_nacl_rule, mock_nacl, mock_rta, mock_route, mock_rt, mock_nat, mock_eip, mock_subnet, mock_igw, mock_vpc, mock_az, mock_region):
    mock_region.return_value.name = "us-east-1"
    mock_az.return_value.names = ["us-east-1a", "us-east-1b"]
    mock_vpc.return_value.id = "vpc-123"
    mock_vpc.return_value.cidr_block = "10.0.0.0/16"
    tags = {"Environment": "Production"}
    vpc = SecureVPC("test", "10.0.0.0/16", tags)
    self.assertEqual(vpc.name_prefix, "test")
    self.assertEqual(vpc.vpc_cidr, "10.0.0.0/16")
    self.assertEqual(vpc.tags, tags)
    self.assertEqual(vpc.region, "us-east-1")
    self.assertEqual(len(vpc.availability_zones), 2)

# ---- Helper function tests ----
class TestHelpers(unittest.TestCase):
  @patch("pulumi_aws.get_caller_identity")
  @patch("pulumi_aws.kms.Key")
  @patch("pulumi_aws.kms.Alias")
  def test_create_kms_key(self, mock_alias, mock_key, mock_identity):
    mock_identity.return_value.account_id = "123456789012"
    mock_key.return_value.id = "kms-123"
    mock_key.return_value.arn = "arn:kms"
    tags = {"Environment": "Production"}
    key = create_kms_key(tags)
    self.assertEqual(key.id, "kms-123")
    self.assertEqual(key.arn, "arn:kms")

  @patch("pulumi_aws.ec2.SecurityGroup")
  def test_create_security_groups(self, mock_sg):
    mock_sg.return_value.id = "sg-123"
    vpc = MagicMock()
    vpc.id = "vpc-123"
    tags = {"Environment": "Production"}
    sgs = create_security_groups(vpc, tags)
    self.assertIn("web_sg", sgs)
    self.assertIn("lambda_sg", sgs)

  @patch("pulumi_aws.ec2.get_ami")
  @patch("pulumi_aws.iam.Role")
  @patch("pulumi_aws.iam.RolePolicyAttachment")
  @patch("pulumi_aws.iam.InstanceProfile")
  @patch("pulumi_aws.ec2.Instance")
  def test_create_compute_resources(self, mock_instance, mock_profile, mock_rpa, mock_role, mock_ami):
    mock_ami.return_value.id = "ami-123"
    mock_instance.return_value.id = "i-123"
    mock_instance.return_value.public_ip = "1.2.3.4"
    mock_instance.return_value.private_ip = "10.0.0.1"
    mock_instance.return_value.instance_type = "t3.micro"
    mock_role.return_value.name = "role-1"
    mock_profile.return_value.name = "profile-1"
    subnets = [MagicMock(id="subnet-1"), MagicMock(id="subnet-2")]
    sg = MagicMock(id="sg-123")
    kms = MagicMock(arn="arn:kms")
    tags = {"Environment": "Production"}
    result = create_compute_resources(subnets, sg, kms, tags)
    self.assertEqual(len(result["instances"]), 2)
    self.assertEqual(len(result["roles"]), 2)
    self.assertEqual(len(result["instance_profiles"]), 2)

  @patch("pulumi_aws.cloudwatch.LogGroup")
  @patch("pulumi_aws.apigateway.RestApi")
  @patch("pulumi_aws.apigateway.Resource")
  @patch("pulumi_aws.apigateway.Method")
  @patch("pulumi_aws.apigateway.Integration")
  @patch("pulumi_aws.apigateway.MethodResponse")
  @patch("pulumi_aws.apigateway.IntegrationResponse")
  @patch("pulumi_aws.apigateway.Deployment")
  @patch("pulumi_aws.apigateway.Stage")
  @patch("lib.tap_stack.create_api_gateway_cloudwatch_role")
  @patch("pulumi_aws.apigateway.Account")
  def test_create_api_gateway(self, mock_account, mock_role, mock_stage, mock_deploy, mock_integration_resp, mock_method_resp, mock_integration, mock_method, mock_resource, mock_api, mock_lg):
    mock_api.return_value.id = "api-123"
    mock_api.return_value.root_resource_id = "root-123"
    mock_lg.return_value.arn = "arn:log"
    mock_stage.return_value.stage_name = "prod"
    mock_role.return_value.arn = "arn:role"
    tags = {"Environment": "Production"}
    kms = MagicMock(arn="arn:kms")
    result = create_api_gateway(kms, tags)
    self.assertIn("api", result)
    self.assertIn("api_url", result)
    self.assertIn("log_group", result)
    self.assertIn("stage", result)
    self.assertIn("account_role", result)

  @patch("pulumi_aws.iam.Role")
  @patch("pulumi_aws.iam.RolePolicyAttachment")
  def test_create_api_gateway_cloudwatch_role(self, mock_rpa, mock_role):
    mock_role.return_value.arn = "arn:role"
    mock_role.return_value.name = "role-name"
    tags = {"Environment": "Production"}
    role = create_api_gateway_cloudwatch_role(tags)
    self.assertEqual(role.arn, "arn:role")

  @patch("pulumi_aws.cloudwatch.LogGroup")
  @patch("pulumi_aws.iam.Role")
  @patch("pulumi_aws.iam.RolePolicyAttachment")
  @patch("pulumi_aws.iam.RolePolicy")
  @patch("pulumi_aws.lambda_.Function")
  @patch("pulumi_aws.cloudwatch.EventRule")
  @patch("pulumi_aws.cloudwatch.EventTarget")
  @patch("pulumi_aws.lambda_.Permission")
  def test_create_monitoring(self, mock_perm, mock_target, mock_rule, mock_func, mock_policy, mock_rpa, mock_role, mock_lg):
    mock_func.return_value.name = "lambda-name"
    mock_func.return_value.arn = "arn:lambda"
    mock_lg.return_value.name = "log-group"
    mock_rule.return_value.name = "rule-name"
    mock_role.return_value.name = "role-name"
    subnets = [MagicMock(id="subnet-1"), MagicMock(id="subnet-2")]
    sg = MagicMock(id="sg-123")
    instances = [MagicMock(id="i-1"), MagicMock(id="i-2")]
    kms = MagicMock(arn="arn:kms")
    tags = {"Environment": "Production"}
    result = create_monitoring(subnets, sg, instances, kms, tags)
    self.assertIn("lambda_function", result)
    self.assertIn("log_group", result)
    self.assertIn("schedule_rule", result)
    self.assertIn("role", result)

# ---- TapStack orchestration test ----
class TestTapStack(unittest.TestCase):
  @patch("pulumi.Config")
  @patch("pulumi_aws.get_region")
  @patch("lib.tap_stack.create_kms_key")
  @patch("lib.tap_stack.SecureVPC")
  @patch("lib.tap_stack.create_security_groups")
  @patch("lib.tap_stack.create_compute_resources")
  @patch("lib.tap_stack.create_api_gateway")
  @patch("lib.tap_stack.create_monitoring")
  def test_tap_stack_init(self, mock_monitoring, mock_api, mock_compute, mock_sgs, mock_vpc, mock_kms, mock_region, mock_config):
    mock_config.return_value.get.return_value = "us-east-1"
    mock_region.return_value.name = "us-east-1"
    mock_kms.return_value.id = "kms-123"
    mock_kms.return_value.arn = "arn:kms"
    mock_vpc.return_value.vpc.id = "vpc-123"
    mock_vpc.return_value.vpc.cidr_block = "10.0.0.0/16"
    mock_vpc.return_value.availability_zones = ["us-east-1a", "us-east-1b"]
    mock_vpc.return_value.igw.id = "igw-123"
    mock_vpc.return_value.public_subnets = [MagicMock(id="subnet-1"), MagicMock(id="subnet-2")]
    mock_vpc.return_value.private_subnets = [MagicMock(id="subnet-3"), MagicMock(id="subnet-4")]
    mock_vpc.return_value.public_rt.id = "rt-1"
    mock_vpc.return_value.private_rts = [MagicMock(id="rt-2"), MagicMock(id="rt-3")]
    mock_vpc.return_value.nat_gateways = [MagicMock(id="nat-1"), MagicMock(id="nat-2")]
    mock_vpc.return_value.eips = [MagicMock(id="eip-1"), MagicMock(id="eip-2")]
    mock_vpc.return_value.public_nacl.id = "nacl-1"
    mock_vpc.return_value.private_nacl.id = "nacl-2"
    mock_vpc.return_value.flow_logs.id = "fl-1"
    mock_vpc.return_value.flow_logs_role.arn = "arn:role"
    mock_sgs.return_value = {"web_sg": MagicMock(id="sg-1"), "lambda_sg": MagicMock(id="sg-2")}
    mock_compute.return_value = {
      "instances": [MagicMock(id="i-1", public_ip="1.2.3.4", private_ip="10.0.0.1", instance_type="t3.micro"), MagicMock(id="i-2", public_ip="1.2.3.5", private_ip="10.0.0.2", instance_type="t3.micro")],
      "roles": [MagicMock(name="role-1"), MagicMock(name="role-2")],
      "instance_profiles": [MagicMock(name="profile-1"), MagicMock(name="profile-2")],
    }
    mock_api.return_value = {
      "api": MagicMock(id="api-123"),
      "api_url": "https://api-123.execute-api.us-east-1.amazonaws.com/prod",
      "log_group": MagicMock(name="api-log-group"),
      "stage": MagicMock(stage_name="prod"),
      "account_role": MagicMock(arn="arn:role"),
    }
    mock_monitoring.return_value = {
      "lambda_function": MagicMock(name="lambda-name", arn="arn:lambda"),
      "log_group": MagicMock(name="lambda-log-group"),
      "schedule_rule": MagicMock(name="rule-name"),
      "role": MagicMock(name="role-name"),
    }
    args = TapStackArgs()
    stack = TapStack("test-stack", args)
    self.assertIsInstance(stack, TapStack)

if __name__ == "__main__":
  unittest.main()
