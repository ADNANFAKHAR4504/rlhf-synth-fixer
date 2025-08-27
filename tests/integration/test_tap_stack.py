import unittest
import json
from cdktf import App, Testing
from lib.tap_stack import TapStack

class TestTapStackIntegration(unittest.TestCase):

    def setUp(self):
        """Synthesizes the stack and loads the JSON output before each test."""
        app = App()
        stack = TapStack(app, "test-integration-stack")
        synthesized = Testing.synth(stack)
        self.resources = json.loads(synthesized)["resource"]

    def test_alb_should_be_in_public_subnets(self):
        """Verifies the ALB is internet-facing and in public subnets."""
        alb = self.resources["aws_lb"]["appAlb"]
        subnets = alb["subnets"]
        
        self.assertIn("${aws_subnet.publicSubnetA.id}", subnets)
        self.assertIn("${aws_subnet.publicSubnetB.id}", subnets)
        self.assertFalse(alb["internal"])

    def test_asg_should_be_in_private_subnets(self):
        """Verifies the Auto Scaling Group is in private subnets."""
        asg = self.resources["aws_autoscaling_group"]["asg"]
        subnet_identifiers = asg["vpc_zone_identifier"]

        self.assertIn("${aws_subnet.privateSubnetA.id}", subnet_identifiers)
        self.assertIn("${aws_subnet.privateSubnetB.id}", subnet_identifiers)

    def test_app_sg_should_only_allow_traffic_from_alb(self):
        """Verifies the App Security Group only allows ingress from the ALB."""
        app_sg = self.resources["aws_security_group"]["appSg"]
        ingress_rule = app_sg["ingress"][0]

        self.assertEqual(ingress_rule["from_port"], 80)
        self.assertIn("${aws_security_group.albSg.id}", ingress_rule["security_groups"])

    def test_db_sg_should_only_allow_traffic_from_app(self):
        """Verifies the DB Security Group only allows ingress from the App SG."""
        db_sg = self.resources["aws_security_group"]["dbSg"]
        ingress_rule = db_sg["ingress"][0]

        self.assertEqual(ingress_rule["from_port"], 5432)
        self.assertIn("${aws_security_group.appSg.id}", ingress_rule["security_groups"])

    def test_asg_should_use_launch_template_with_iam_profile(self):
        """Verifies the ASG uses the correct Launch Template and IAM Profile."""
        asg = self.resources["aws_autoscaling_group"]["asg"]
        # FIX: Access the launch_template as a single object, not a list
        asg_lt_config = asg["launch_template"]

        lt = self.resources["aws_launch_template"]["launchTemplate"]
        # FIX: Access the iam_instance_profile as a single object, not a list
        lt_iam_profile = lt["iam_instance_profile"]

        self.assertEqual(asg_lt_config["id"], "${aws_launch_template.launchTemplate.id}")
        self.assertEqual(lt_iam_profile["name"], "${aws_iam_instance_profile.instanceProfile.name}")

if __name__ == '__main__':
    unittest.main()
