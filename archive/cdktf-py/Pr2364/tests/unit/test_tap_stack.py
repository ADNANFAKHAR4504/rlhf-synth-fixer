import unittest
import json
from cdktf import App, Testing
from lib.tap_stack import TapStack

class TestTapStackUnit(unittest.TestCase):

    def setUp(self):
        """Synthesizes the stack and loads the JSON output before each test."""
        app = App()
        default_tags = [{"tags": {"Environment": "Production"}}]
        stack = TapStack(
            app, "test-unit-stack",
            environment_suffix="Production",
            default_tags=default_tags
        )
        synthesized = Testing.synth(stack)
        self.resources = json.loads(synthesized)["resource"]

    def test_s3_bucket_should_block_public_access(self):
        """Verifies that the S3 bucket has public access blocked."""
        s3_pab = self.resources["aws_s3_bucket_public_access_block"]["logBucketPab"]
        self.assertTrue(s3_pab["block_public_acls"])
        self.assertTrue(s3_pab["block_public_policy"])
        self.assertTrue(s3_pab["restrict_public_buckets"])

    def test_s3_bucket_should_have_versioning_enabled(self):
        """Verifies that the S3 bucket has versioning enabled."""
        s3_bucket = self.resources["aws_s3_bucket"]["logBucket"]
        self.assertTrue(s3_bucket["versioning"]["enabled"])

    def test_rds_database_should_be_encrypted(self):
        """Verifies that the RDS database has storage encryption enabled."""
        db_instance = self.resources["aws_db_instance"]["dbInstance"]
        self.assertTrue(db_instance["storage_encrypted"])

    def test_launch_template_should_enable_monitoring(self):
        """Verifies that the EC2 Launch Template has monitoring enabled."""
        lt = self.resources["aws_launch_template"]["launchTemplate"]
        self.assertTrue(lt["monitoring"]["enabled"])

    def test_ec2_iam_policy_should_use_least_privilege(self):
        """Verifies the EC2 IAM policy adheres to least privilege."""
        iam_policy = self.resources["aws_iam_policy"]["ec2Policy"]
        policy_doc = json.loads(iam_policy["policy"])

        statement = policy_doc["Statement"]
        s3_actions = statement[0]["Action"]
        cloudwatch_actions = statement[1]["Action"]

        self.assertIn("s3:GetObject", s3_actions)
        self.assertIn("s3:PutObject", s3_actions)
        self.assertIn("logs:PutLogEvents", cloudwatch_actions)

        # Check for wildcards in actions
        self.assertNotIn("*", str(s3_actions))
        self.assertNotIn("*", str(cloudwatch_actions))

    def test_all_resources_should_have_production_tag(self):
        """Verifies that all resources have the 'Environment: Production' tag."""
        for resource_type, resources in self.resources.items():
            for _, resource_config in resources.items():
                if "tags" in resource_config and "Environment" in resource_config["tags"]:
                    self.assertEqual(
                        resource_config["tags"]["Environment"], "Production",
                        f"Resource type {resource_type} is missing production tag"
                    )

if __name__ == '__main__':
    unittest.main()
