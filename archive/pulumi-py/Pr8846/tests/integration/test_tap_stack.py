import pytest
import boto3
import json
import subprocess
from botocore.exceptions import ClientError


class TapStackIntegrationTests:
    def __init__(self, stack_name: str = "TapStackpr449"):
        self.stack_name = stack_name
        self.aws_region = "us-east-1"
        self.boto_session = boto3.Session(region_name=self.aws_region)
        self.stack_outputs = self._load_stack_outputs()

    def _load_stack_outputs(self):
        try:
            result = subprocess.run(
                ["pulumi", "stack", "output", "--json", "--stack", self.stack_name],
                check=True,
                capture_output=True,
                text=True,
            )
            return json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            print("Failed to get Pulumi outputs:", e.stderr)
            return {}

    def test_s3_bucket_encrypted(self):
        bucket_name = self.stack_outputs.get("s3_bucket_name")
        if not bucket_name:
            pytest.skip("S3 bucket not found in outputs")

        s3 = self.boto_session.client("s3")
        try:
            enc = s3.get_bucket_encryption(Bucket=bucket_name)
            rules = enc["ServerSideEncryptionConfiguration"]["Rules"]
            assert any(
                rule["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"] == "AES256"
                for rule in rules
            )
            print(f"S3 bucket '{bucket_name}' has server-side encryption enabled")
        except ClientError as e:
            if (
                e.response["Error"]["Code"]
                == "ServerSideEncryptionConfigurationNotFoundError"
            ):
                pytest.fail(f"S3 bucket {bucket_name} does not have encryption enabled")
            raise

    def test_dynamodb_table_pitr_enabled(self):
        table_name = self.stack_outputs.get("dynamodb_table_name")
        if not table_name:
            pytest.skip("DynamoDB table name not found in outputs")

        dynamodb = self.boto_session.client("dynamodb")
        try:
            pitr = dynamodb.describe_continuous_backups(TableName=table_name)
            status = (
                pitr["ContinuousBackupsDescription"]["PointInTimeRecoveryDescription"][
                    "PointInTimeRecoveryStatus"
                ]
            )
            assert status == "ENABLED"
            print(f"PITR is enabled for DynamoDB table '{table_name}'")
        except ClientError as e:
            pytest.fail(f"Failed to check PITR for table {table_name}: {e}")

    def test_lambda_function_exists(self):
        lambda_name = self.stack_outputs.get("lambda_function_name")
        if not lambda_name:
            pytest.skip("Lambda function name not found in outputs")

        lambda_client = self.boto_session.client("lambda")
        try:
            response = lambda_client.get_function(FunctionName=lambda_name)
            assert response["Configuration"]["FunctionName"] == lambda_name
            print(f"Lambda function '{lambda_name}' exists")
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                pytest.fail(f"Lambda function {lambda_name} not found")
            raise

    def test_cloudwatch_alarms_for_ec2(self):
        ec2_ids = self.stack_outputs.get("ec2_instance_ids", [])
        if not ec2_ids:
            pytest.skip("EC2 instance IDs not found in outputs")

        cloudwatch = self.boto_session.client("cloudwatch")
        alarms = cloudwatch.describe_alarms()
        found = 0
        for alarm in alarms["MetricAlarms"]:
            for instance_id in ec2_ids:
                if instance_id in alarm.get("Dimensions", [{}])[0].get("Value", ""):
                    found += 1

        assert found >= len(ec2_ids), "Not all EC2 instances have alarms configured"
        print(f"Found CloudWatch alarms for {found} EC2 instances")


# Runner
def test_all_resources_deployed():
    tester = TapStackIntegrationTests()
    tester.test_s3_bucket_encrypted()
    tester.test_dynamodb_table_pitr_enabled()
    tester.test_lambda_function_exists()
    tester.test_cloudwatch_alarms_for_ec2()
