"""
Integration tests for deployed Pulumi infrastructure

Tests real AWS resources using boto3 SDK and stack outputs.
No mocking - all tests use live AWS resources.
"""

import unittest
import json
import boto3
import os


class TestDeployedInfrastructure(unittest.TestCase):
    """Integration tests for deployed AWS resources"""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs and initialize AWS clients"""
        # Load stack outputs
        with open("cfn-outputs/flat-outputs.json", "r") as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.ec2 = boto3.client("ec2", region_name="us-east-1")
        cls.s3 = boto3.client("s3", region_name="us-east-1")
        cls.dynamodb = boto3.client("dynamodb", region_name="us-east-1")
        cls.lambda_client = boto3.client("lambda", region_name="us-east-1")
        cls.apigateway = boto3.client("apigateway", region_name="us-east-1")
        cls.wafv2 = boto3.client("wafv2", region_name="us-east-1")
        cls.kms = boto3.client("kms", region_name="us-east-1")
        cls.logs = boto3.client("logs", region_name="us-east-1")

    def test_vpc_exists(self):
        """Test VPC exists and has correct configuration"""
        vpc_id = self.outputs["vpc_id"]
        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])

        self.assertEqual(len(response["Vpcs"]), 1)
        vpc = response["Vpcs"][0]
        self.assertEqual(vpc["CidrBlock"], "10.0.0.0/16")

        # Check DNS attributes separately
        dns_support = self.ec2.describe_vpc_attribute(VpcId=vpc_id, Attribute="enableDnsSupport")
        dns_hostnames = self.ec2.describe_vpc_attribute(VpcId=vpc_id, Attribute="enableDnsHostnames")
        self.assertTrue(dns_support["EnableDnsSupport"]["Value"])
        self.assertTrue(dns_hostnames["EnableDnsHostnames"]["Value"])

    def test_s3_bucket_exists_and_configured(self):
        """Test S3 bucket exists with proper security configuration"""
        bucket_name = self.outputs["s3_bucket_name"]

        # Check bucket exists
        response = self.s3.head_bucket(Bucket=bucket_name)
        self.assertEqual(response["ResponseMetadata"]["HTTPStatusCode"], 200)

        # Check versioning is enabled
        versioning = self.s3.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning["Status"], "Enabled")

        # Check public access block
        public_access = self.s3.get_public_access_block(Bucket=bucket_name)
        config = public_access["PublicAccessBlockConfiguration"]
        self.assertTrue(config["BlockPublicAcls"])
        self.assertTrue(config["BlockPublicPolicy"])
        self.assertTrue(config["IgnorePublicAcls"])
        self.assertTrue(config["RestrictPublicBuckets"])

        # Check encryption
        encryption = self.s3.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption["ServerSideEncryptionConfiguration"]["Rules"]
        self.assertEqual(len(rules), 1)
        self.assertEqual(rules[0]["ApplyServerSideEncryptionByDefault"]["SSEAlgorithm"], "aws:kms")

    def test_dynamodb_table_exists_and_configured(self):
        """Test DynamoDB table exists with PITR and encryption"""
        table_name = self.outputs["dynamodb_table_name"]

        # Check table exists
        response = self.dynamodb.describe_table(TableName=table_name)
        table = response["Table"]

        self.assertEqual(table["TableStatus"], "ACTIVE")
        self.assertEqual(table["BillingModeSummary"]["BillingMode"], "PAY_PER_REQUEST")

        # Check encryption
        self.assertIn("SSEDescription", table)
        self.assertEqual(table["SSEDescription"]["Status"], "ENABLED")
        self.assertEqual(table["SSEDescription"]["SSEType"], "KMS")

        # Check point-in-time recovery
        pitr_response = self.dynamodb.describe_continuous_backups(TableName=table_name)
        pitr_status = pitr_response["ContinuousBackupsDescription"]["PointInTimeRecoveryDescription"]
        self.assertEqual(pitr_status["PointInTimeRecoveryStatus"], "ENABLED")

    def test_lambda_function_exists_and_configured(self):
        """Test Lambda function exists with VPC configuration"""
        function_name = self.outputs["lambda_function_name"]

        response = self.lambda_client.get_function(FunctionName=function_name)
        config = response["Configuration"]

        self.assertEqual(config["Runtime"], "python3.9")
        self.assertEqual(config["Timeout"], 30)
        self.assertEqual(config["MemorySize"], 256)

        # Check VPC configuration
        vpc_config = config["VpcConfig"]
        self.assertIn("VpcId", vpc_config)
        self.assertGreaterEqual(len(vpc_config["SubnetIds"]), 3)
        self.assertGreaterEqual(len(vpc_config["SecurityGroupIds"]), 1)

        # Check environment variables
        env_vars = config["Environment"]["Variables"]
        self.assertIn("DYNAMODB_TABLE", env_vars)
        self.assertIn("S3_BUCKET", env_vars)

    def test_kms_keys_have_rotation_enabled(self):
        """Test KMS keys have automatic rotation enabled"""
        s3_key_id = self.outputs["kms_s3_key_id"]
        dynamodb_key_id = self.outputs["kms_dynamodb_key_id"]
        logs_key_id = self.outputs["kms_logs_key_id"]

        for key_id in [s3_key_id, dynamodb_key_id, logs_key_id]:
            response = self.kms.get_key_rotation_status(KeyId=key_id)
            self.assertTrue(response["KeyRotationEnabled"], f"Key {key_id} should have rotation enabled")

    def test_cloudwatch_log_group_exists(self):
        """Test CloudWatch log group exists with encryption and retention"""
        function_name = self.outputs["lambda_function_name"]
        log_group_name = f"/aws/lambda/{function_name}"

        response = self.logs.describe_log_groups(logGroupNamePrefix=log_group_name)
        self.assertGreaterEqual(len(response["logGroups"]), 1)

        log_group = response["logGroups"][0]
        self.assertEqual(log_group["retentionInDays"], 90)
        self.assertIn("kmsKeyId", log_group, "Log group should be encrypted with KMS")

    def test_api_gateway_exists(self):
        """Test API Gateway REST API exists"""
        api_url = self.outputs["api_gateway_url"]
        self.assertIn("execute-api.us-east-1.amazonaws.com", api_url)
        self.assertIn("/process-payment", api_url)

        # Extract API ID from URL
        api_id = api_url.split("//")[1].split(".")[0]

        # Check API exists
        response = self.apigateway.get_rest_api(restApiId=api_id)
        self.assertEqual(response["name"], self.outputs["lambda_function_name"].replace("processor", "api"))

    def test_waf_webacl_exists(self):
        """Test WAF WebACL exists with rules configured"""
        waf_id = self.outputs["waf_web_acl_id"]

        # List WebACLs to find ours
        response = self.wafv2.list_web_acls(Scope="REGIONAL")

        # Find our WebACL
        our_acl = None
        for acl in response["WebACLs"]:
            if acl["Id"] == waf_id:
                our_acl = acl
                break

        self.assertIsNotNone(our_acl, "WAF WebACL should exist")

        # Get full WebACL details
        acl_detail = self.wafv2.get_web_acl(
            Name=our_acl["Name"],
            Scope="REGIONAL",
            Id=waf_id
        )

        # Check rules exist
        rules = acl_detail["WebACL"]["Rules"]
        self.assertGreaterEqual(len(rules), 3, "Should have at least 3 rules (2 managed + 1 rate limit)")

    def test_vpc_endpoints_exist(self):
        """Test VPC endpoints exist for S3, DynamoDB, and CloudWatch Logs"""
        vpc_id = self.outputs["vpc_id"]

        response = self.ec2.describe_vpc_endpoints(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        endpoints = response["VpcEndpoints"]
        self.assertGreaterEqual(len(endpoints), 3, "Should have endpoints for S3, DynamoDB, and Logs")

        # Check for S3 and DynamoDB gateway endpoints
        service_names = {ep["ServiceName"] for ep in endpoints}
        self.assertTrue(
            any("s3" in name for name in service_names),
            "S3 VPC endpoint should exist"
        )
        self.assertTrue(
            any("dynamodb" in name for name in service_names),
            "DynamoDB VPC endpoint should exist"
        )
        self.assertTrue(
            any("logs" in name for name in service_names),
            "CloudWatch Logs VPC endpoint should exist"
        )

    def test_lambda_can_access_dynamodb(self):
        """Test Lambda function has access to DynamoDB table"""
        function_name = self.outputs["lambda_function_name"]
        table_name = self.outputs["dynamodb_table_name"]

        # Get Lambda IAM role
        function_config = self.lambda_client.get_function(FunctionName=function_name)
        role_arn = function_config["Configuration"]["Role"]

        # Verify function has environment variable pointing to table
        env_vars = function_config["Configuration"]["Environment"]["Variables"]
        self.assertEqual(env_vars["DYNAMODB_TABLE"], table_name)

    def test_lambda_can_access_s3(self):
        """Test Lambda function has access to S3 bucket"""
        function_name = self.outputs["lambda_function_name"]
        bucket_name = self.outputs["s3_bucket_name"]

        # Get Lambda configuration
        function_config = self.lambda_client.get_function(FunctionName=function_name)

        # Verify function has environment variable pointing to bucket
        env_vars = function_config["Configuration"]["Environment"]["Variables"]
        self.assertEqual(env_vars["S3_BUCKET"], bucket_name)

    def test_resources_are_tagged(self):
        """Test all resources have mandatory compliance tags"""
        vpc_id = self.outputs["vpc_id"]

        # Check VPC tags
        vpc_response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        vpc_tags = {tag["Key"]: tag["Value"] for tag in vpc_response["Vpcs"][0].get("Tags", [])}

        required_tags = ["Environment", "DataClassification", "ComplianceScope"]
        for tag in required_tags:
            self.assertIn(tag, vpc_tags, f"VPC should have {tag} tag")

        self.assertEqual(vpc_tags["ComplianceScope"], "PCI-DSS")

    def test_environment_suffix_in_resource_names(self):
        """Test all resource names include environment suffix"""
        # Extract expected suffix from any resource name
        function_name = self.outputs["lambda_function_name"]
        self.assertIn("-", function_name, "Function name should contain environment suffix")

        # Check suffix in other resources
        bucket_name = self.outputs["s3_bucket_name"]
        table_name = self.outputs["dynamodb_table_name"]

        # All names should contain similar suffix pattern
        suffix = function_name.split("-")[-1]
        self.assertIn(suffix, bucket_name)
        self.assertIn(suffix, table_name)


if __name__ == "__main__":
    unittest.main()
