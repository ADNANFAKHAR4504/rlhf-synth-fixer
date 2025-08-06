import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from pytest import mark

# Load outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')
if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}

@mark.describe("TapStack Resource Existence Tests")
class TestTapStackResourceExistence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.outputs = flat_outputs
        region = os.environ.get("AWS_DEFAULT_REGION", "us-west-2")
        try:
            cls.s3 = boto3.client("s3", region_name=region)
            cls.dynamodb = boto3.client("dynamodb", region_name=region)
            cls.sns = boto3.client("sns", region_name=region)
            cls.lambda_client = boto3.client("lambda", region_name=region)
            cls.ec2 = boto3.client("ec2", region_name=region)
        except NoCredentialsError:
            cls.skipTest("AWS credentials not configured")

    def skip_if_output_missing(self, key):
        if key not in self.outputs or not self.outputs[key]:
            self.skipTest(f"Output '{key}' not found in flat-outputs.json")

    @mark.it("S3 bucket exists")
    def test_s3_bucket_exists(self):
        self.skip_if_output_missing("S3BucketOutput")
        bucket_name = self.outputs["S3BucketOutput"]
        try:
            self.s3.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            self.fail(f"S3 bucket does not exist: {e}")

    @mark.it("DynamoDB table exists")
    def test_dynamodb_table_exists(self):
        self.skip_if_output_missing("DDBTableOutput")
        table_name = self.outputs["DDBTableOutput"]
        try:
            self.dynamodb.describe_table(TableName=table_name)
        except ClientError as e:
            self.fail(f"DynamoDB table does not exist: {e}")

    @mark.it("SNS topic exists")
    def test_sns_topic_exists(self):
        self.skip_if_output_missing("SNSTopicOutput")
        topic_arn = self.outputs["SNSTopicOutput"]
        try:
            self.sns.get_topic_attributes(TopicArn=topic_arn)
        except ClientError as e:
            self.fail(f"SNS topic does not exist: {e}")

    @mark.it("Lambda function exists")
    def test_lambda_function_exists(self):
        self.skip_if_output_missing("LambdaFunctionOutput")
        lambda_name = self.outputs["LambdaFunctionOutput"]
        try:
            self.lambda_client.get_function(FunctionName=lambda_name)
        except ClientError as e:
            self.fail(f"Lambda function does not exist: {e}")

    @mark.it("VPC exists")
    def test_vpc_exists(self):
        self.skip_if_output_missing("VpcIdOutput")
        vpc_id = self.outputs["VpcIdOutput"]
        try:
            resp = self.ec2.describe_vpcs(VpcIds=[vpc_id])
            vpcs = resp.get("Vpcs", [])
            self.assertTrue(len(vpcs) > 0, f"VPC {vpc_id} does not exist")
        except ClientError as e:
            self.fail(f"VPC does not exist: {e}")

    @mark.it("Public subnets exist")
    def test_public_subnets_exist(self):
        self.skip_if_output_missing("PublicSubnetIdsOutput")
        subnet_ids = self.outputs["PublicSubnetIdsOutput"].split(",")
        try:
            resp = self.ec2.describe_subnets(SubnetIds=subnet_ids)
            subnets = resp.get("Subnets", [])
            self.assertEqual(len(subnets), len(subnet_ids), "Some public subnets do not exist")
        except ClientError as e:
            self.fail(f"Public subnets do not exist: {e}")

    @mark.it("Private subnets exist")
    def test_private_subnets_exist(self):
        self.skip_if_output_missing("PrivateSubnetIdsOutput")
        subnet_ids = self.outputs["PrivateSubnetIdsOutput"].split(",")
        try:
            resp = self.ec2.describe_subnets(SubnetIds=subnet_ids)
            subnets = resp.get("Subnets", [])
            self.assertEqual(len(subnets), len(subnet_ids), "Some private subnets do not exist")
        except ClientError as e:
            self.fail(f"Private subnets do not exist: {e}")

if __name__ == "__main__":
    unittest.main()
