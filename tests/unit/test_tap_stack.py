import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack, TapStackProps  # Adjust path as necessary


class TestTapStack(unittest.TestCase):
    """Unit tests for TapStack"""

    def setUp(self):
        self.app = cdk.App()

    def test_resources_created_with_env_suffix(self):
        env_suffix = "testenv"
        stack = TapStack(self.app, "TapStackTest", props=TapStackProps(environment_suffix=env_suffix))
        template = Template.from_stack(stack)

        # Check S3 Bucket created by nested ComputeStack
        template.resource_count_is("AWS::S3::Bucket", 1)

        # IAM Role for EC2 instances
        template.resource_count_is("AWS::IAM::Role", 1)
        template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"}
                }]
            }
        })

        # VPC created
        template.resource_count_is("AWS::EC2::VPC", 1)

        # Security Group with ingress rule on port 80
        template.resource_count_is("AWS::EC2::SecurityGroup", 1)
        template.has_resource_properties("AWS::EC2::SecurityGroupIngress", {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
        })

        # Auto Scaling Group min=1 max=3
        template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "1",
            "MaxSize": "3",
            "InstanceType": "t3.micro"
        })

        # Load Balancer present
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

    def test_default_environment_suffix(self):
        stack = TapStack(self.app, "TapStackDefault")
        template = Template.from_stack(stack)

        logical_ids = template.to_json()["Resources"].keys()
        matched = any("dev" in logical_id.lower() for logical_id in logical_ids)
        self.assertTrue(matched, "Resources should contain 'dev' suffix by default")


if __name__ == "__main__":
    unittest.main()
