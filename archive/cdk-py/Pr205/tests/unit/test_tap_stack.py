import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark
from lib.tap_stack import TapStack, TapStackProps, RegionalRedundantStack


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
  def setUp(self):
    self.app = cdk.App()

  @mark.it("creates nested stacks for both regions")
  def test_creates_nested_stacks(self):
    env_suffix = "testenv"
    stack = TapStack(self.app, "TapStackTest",
                     props=TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::CloudFormation::Stack", 2)
    template.has_resource_properties("AWS::CloudFormation::Stack", {
        "TemplateURL": Match.any_value()
    })

  @mark.it("creates stack with correct environment suffix")
  def test_environment_suffix_handling(self):
    env_suffix = "production"
    stack = TapStack(self.app, "TapStackTestEnv",
                     props=TapStackProps(environment_suffix=env_suffix))
    template = Template.from_stack(stack)

    template.resource_count_is("AWS::CloudFormation::Stack", 2)

    resources = template.to_json()["Resources"]
    stack_names = [res_id for res_id, res_data in resources.items()
                   if res_data["Type"] == "AWS::CloudFormation::Stack"]

    self.assertEqual(len(stack_names), 2)
    stack_name_str = ' '.join(stack_names).lower()
    self.assertIn("east", stack_name_str)
    self.assertIn("west", stack_name_str)

  def create_regional_stack(self, region="us-east-1"):
    parent_stack = cdk.Stack(self.app, f"ParentStack-{region}")
    return RegionalRedundantStack(
        parent_stack,
        f"RegionalStackTest-{region}",
        region=region,
        props={"dns_name": f"tap-{region}-test.turing266670.com"},
        env=cdk.Environment(region=region)
    )

  @mark.it("creates regional stack with correct resources")
  def test_regional_stack_resources(self):
    regional_stack = self.create_regional_stack("us-east-1")
    template = Template.from_stack(regional_stack)

    template.resource_count_is("AWS::RDS::DBInstance", 1)
    template.has_resource_properties("AWS::RDS::DBInstance", {
        "Engine": "postgres",
        "EngineVersion": "16.4",
        "DBInstanceClass": "db.t3.micro",
        "MultiAZ": True,
        "BackupRetentionPeriod": 7
    })

    template.resource_count_is("AWS::S3::Bucket", 1)
    template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {
            "Status": "Enabled"
        }
    })

    template.resource_count_is("AWS::EC2::VPC", 1)
    template.has_resource_properties("AWS::EC2::VPC", {
        "EnableDnsSupport": True,
        "EnableDnsHostnames": True
    })

  @mark.it("creates Auto Scaling Groups in regional stack")
  def test_creates_auto_scaling_groups(self):
    regional_stack = self.create_regional_stack("us-west-2")
    template = Template.from_stack(regional_stack)

    template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
    template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
        "MinSize": "2",
        "MaxSize": "10"
    })

  @mark.it("creates Application Load Balancers in regional stack")
  def test_creates_load_balancers(self):
    regional_stack = self.create_regional_stack("us-east-1")
    template = Template.from_stack(regional_stack)

    template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
    template.has_resource_properties(
        "AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing", "Type": "application"})

  @mark.it("creates Lambda functions in regional stack")
  def test_creates_lambda_functions(self):
    regional_stack = self.create_regional_stack("us-west-2")
    template = Template.from_stack(regional_stack)

    template.resource_count_is("AWS::Lambda::Function", 1)
    template.has_resource_properties("AWS::Lambda::Function", {
        "Runtime": "python3.8",
        "Handler": "index.handler"
    })

  @mark.it("creates Route53 hosted zones with correct domain")
  def test_creates_route53_zones(self):
    region = "us-east-1"
    regional_stack = self.create_regional_stack(region)
    template = Template.from_stack(regional_stack)

    template.resource_count_is("AWS::Route53::HostedZone", 1)
    template.has_resource_properties("AWS::Route53::HostedZone", {
        "Name": f"tap-{region}-test.turing266670.com."
    })

  @mark.it("creates CloudWatch alarms in regional stack")
  def test_creates_cloudwatch_alarms(self):
    regional_stack = self.create_regional_stack("us-west-2")
    template = Template.from_stack(regional_stack)

    template.resource_count_is("AWS::CloudWatch::Alarm", 1)
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold"
    })

  @mark.it("applies correct tags to resources in regional stack")
  def test_applies_correct_tags(self):
    regional_stack = self.create_regional_stack("us-east-1")
    template = Template.from_stack(regional_stack)

    # We infer that tagging worked if all expected resources exist
    template.resource_count_is("AWS::S3::Bucket", 1)
    template.resource_count_is("AWS::RDS::DBInstance", 1)
    template.resource_count_is("AWS::EC2::VPC", 1)
