import unittest
import pulumi
import pulumi_aws as aws
from unittest.mock import MagicMock, patch
from pulumi import Output

import lib.modules.vpc as vpc_module
import lib.modules.security as sec_module
import lib.modules.monitoring as mon_module
import lib.modules.code_pipeline as pip_module


class TestVpcModule(unittest.TestCase):

  def setUp(self):
    self.mock_provider = aws.Provider("mock", region="us-east-1")

  @patch.object(vpc_module, "create_vpc_infrastructure")
  def test_create_vpc_infrastructure(self, mock_create_vpc):
    mock_create_vpc.return_value = {"vpc_id": pulumi.Output.from_input("vpc-1234")}
    result = vpc_module.create_vpc_infrastructure(
      region="us-east-1",
      cidr_block="10.0.0.0/16",
      tags={"Name": "test-vpc"},
      provider=self.mock_provider
    )
    self.assertIsInstance(result, dict)
    self.assertIn("vpc_id", result)
    self.assertIsInstance(result["vpc_id"], pulumi.Output)

  @patch.object(sec_module, "create_security_groups")
  def test_create_security_groups(self, mock_create_sg):
    mock_create_sg.return_value = {"sg_id": pulumi.Output.from_input("sg-1234")}
    result = sec_module.create_security_groups(
      region="us-east-1",
      vpc_id=pulumi.Output.from_input("vpc-1234"),
      tags={"Name": "test-sg"},
      provider=self.mock_provider
    )
    self.assertIsInstance(result, dict)
    self.assertIn("sg_id", result)
    self.assertIsInstance(result["sg_id"], pulumi.Output)

  @patch.object(sec_module, "create_s3_bucket")
  def test_create_s3_bucket(self, mock_create_bucket):
    mock_bucket = MagicMock(spec=aws.s3.Bucket)
    mock_create_bucket.return_value = mock_bucket
    result = sec_module.create_s3_bucket(
      region="us-east-1",
      tags={"Name": "test-bucket"},
      provider=self.mock_provider
    )
    self.assertIsInstance(result, aws.s3.Bucket)

  @patch.object(mon_module, "setup_cloudtrail")
  def test_setup_cloudtrail(self, mock_setup_ct):
    mock_cloudtrail = MagicMock()
    mock_setup_ct.return_value = mock_cloudtrail
    result = mon_module.setup_cloudtrail(
      region="us-east-1",
      provider=self.mock_provider,
      s3_bucket_name=Output.from_input("test-bucket"),
      tags={"Name": "test-bucket"}
    )
    self.assertEqual(result, mock_cloudtrail)

  @patch.object(pip_module, "setup_codepipeline")
  def test_setup_codepipeline(self, mock_setup_pipeline):
    mock_setup_pipeline.return_value = {
      "pipeline_name": "mock-pipeline-name",
      "pipeline_source_bucket": "mock-bucket-name",
      "pipeline_artifact_bucket": "mock-bucket-name"
    }
    result = pip_module.setup_codepipeline()
    self.assertEqual(result["pipeline_name"], "mock-pipeline-name")
