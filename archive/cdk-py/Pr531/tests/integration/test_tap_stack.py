import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError, NoCredentialsError

class TestTapStackIntegration(unittest.TestCase):
  """Integration tests for deployed TapStack resources using cfn-outputs/flat-outputs.json"""

  @classmethod
  def setUpClass(cls):
    # Load outputs
    base_dir = os.path.dirname(os.path.abspath(__file__))
    flat_outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')
    if os.path.exists(flat_outputs_path):
      with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        cls.outputs = json.load(f)
    else:
      cls.outputs = {}

    # Set up AWS clients
    region = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
    cls.s3 = boto3.client("s3", region_name=region)
    cls.dynamodb = boto3.client("dynamodb", region_name=region)
    cls.sns = boto3.client("sns", region_name=region)
    cls.lambda_client = boto3.client("lambda", region_name=region)
    cls.apigw = boto3.client("apigateway", region_name=region)
    cls.ec2 = boto3.client("ec2", region_name=region)

  def skip_if_output_missing(self, key):
    if key not in self.outputs or not self.outputs[key]:
      self.skipTest(f"Output '{key}' not found in flat-outputs.json")

  def test_s3_bucket_exists_and_encrypted(self):
    self.skip_if_output_missing("S3BucketOutput")
    bucket_name = self.outputs["S3BucketOutput"]
    try:
      resp = self.s3.get_bucket_encryption(Bucket=bucket_name)
      rules = resp["ServerSideEncryptionConfiguration"]["Rules"]
      algo = rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"]
      self.assertEqual(algo, "AES256")
    except ClientError as e:
      self.fail(f"S3 bucket encryption check failed: {e}")

  def test_dynamodb_table_exists(self):
    self.skip_if_output_missing("DDBTableOutput")
    table_name = self.outputs["DDBTableOutput"]
    try:
      resp = self.dynamodb.describe_table(TableName=table_name)
      self.assertEqual(resp["Table"]["TableName"], table_name)
    except ClientError as e:
      self.fail(f"DynamoDB table check failed: {e}")

  def test_sns_topic_exists(self):
    self.skip_if_output_missing("SNSTopicOutput")
    topic_arn = self.outputs["SNSTopicOutput"]
    try:
      resp = self.sns.get_topic_attributes(TopicArn=topic_arn)
      self.assertEqual(resp["Attributes"]["TopicArn"], topic_arn)
    except ClientError as e:
      self.fail(f"SNS topic check failed: {e}")

  def test_lambda_function_exists(self):
    self.skip_if_output_missing("LambdaFunctionOutput")
    lambda_name = self.outputs["LambdaFunctionOutput"]
    try:
      resp = self.lambda_client.get_function(FunctionName=lambda_name)
      self.assertEqual(resp["Configuration"]["FunctionName"], lambda_name)
      self.assertEqual(resp["Configuration"]["State"], "Active")
    except ClientError as e:
      self.fail(f"Lambda function check failed: {e}")

  def test_api_gateway_exists(self):
    self.skip_if_output_missing("ApiGatewayOutput")
    api_url = self.outputs["ApiGatewayOutput"]
    try:
      restapi_id = api_url.split("//")[1].split(".")[0]
      resp = self.apigw.get_rest_api(restApiId=restapi_id)
      self.assertEqual(resp["id"], restapi_id)
    except Exception as e:
      self.fail(f"API Gateway check failed: {e}")

  def test_vpc_exists(self):
    self.skip_if_output_missing("VpcIdOutput")
    vpc_id = self.outputs["VpcIdOutput"]
    try:
      resp = self.ec2.describe_vpcs(VpcIds=[vpc_id])
      self.assertEqual(resp["Vpcs"][0]["VpcId"], vpc_id)
    except ClientError as e:
      self.fail(f"VPC check failed: {e}")

  def test_public_subnet_ids_exist(self):
    self.skip_if_output_missing("PublicSubnetIdsOutput")
    subnet_ids = self.outputs["PublicSubnetIdsOutput"].split(",")
    try:
      resp = self.ec2.describe_subnets(SubnetIds=subnet_ids)
      self.assertEqual(len(resp["Subnets"]), len(subnet_ids))
    except ClientError as e:
      self.fail(f"Public subnet check failed: {e}")

  def test_private_subnet_ids_exist(self):
    self.skip_if_output_missing("PrivateSubnetIdsOutput")
    subnet_ids = self.outputs["PrivateSubnetIdsOutput"].split(",")
    try:
      resp = self.ec2.describe_subnets(SubnetIds=subnet_ids)
      self.assertEqual(len(resp["Subnets"]), len(subnet_ids))
    except ClientError as e:
      self.fail(f"Private subnet check failed: {e}")

if __name__ == "__main__":
  unittest.main()
