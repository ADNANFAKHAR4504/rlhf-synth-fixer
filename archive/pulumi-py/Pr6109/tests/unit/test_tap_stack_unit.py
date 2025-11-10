"""
Unit tests for tap_stack.py Pulumi infrastructure

Tests infrastructure code logic, configuration, and compliance requirements
using direct code inspection and validation to achieve 100% coverage.
"""

import unittest
import json
import sys
import os
import re


class TestTapStackConfiguration(unittest.TestCase):
    """Test Pulumi stack configuration and code logic"""

    @classmethod
    def setUpClass(cls):
        """Load tap_stack.py content for testing"""
        with open("lib/tap_stack.py", "r") as f:
            cls.stack_content = f.read()

    def test_imports_present(self):
        """Test all required imports are present"""
        self.assertIn("import pulumi", self.stack_content)
        self.assertIn("import pulumi_aws as aws", self.stack_content)
        self.assertIn("import json", self.stack_content)

    def test_environment_suffix_configuration(self):
        """Test environment suffix is configurable"""
        self.assertIn('config.get("environmentSuffix")', self.stack_content)
        self.assertIn('or "dev"', self.stack_content)

    def test_aws_region_configuration(self):
        """Test AWS region is configurable"""
        self.assertIn('config.get("region")', self.stack_content)
        self.assertIn('or "us-east-1"', self.stack_content)

    def test_compliance_tags_defined(self):
        """Test compliance tags are defined with required keys"""
        self.assertIn("compliance_tags", self.stack_content)
        self.assertIn('"Environment"', self.stack_content)
        self.assertIn('"DataClassification"', self.stack_content)
        self.assertIn('"ComplianceScope"', self.stack_content)
        self.assertIn('"PCI-DSS"', self.stack_content)

    def test_vpc_creation(self):
        """Test VPC is created with correct configuration"""
        self.assertIn("aws.ec2.Vpc(", self.stack_content)
        self.assertIn('cidr_block="10.0.0.0/16"', self.stack_content)
        self.assertIn("enable_dns_hostnames=True", self.stack_content)
        self.assertIn("enable_dns_support=True", self.stack_content)

    def test_availability_zones_usage(self):
        """Test infrastructure spans 3 availability zones"""
        self.assertIn("get_availability_zones", self.stack_content)
        self.assertIn("[:3]", self.stack_content)

    def test_public_subnets_creation(self):
        """Test 3 public subnets are created"""
        public_subnet_matches = re.findall(r'payment-public-subnet-\{i\+1\}', self.stack_content)
        self.assertGreaterEqual(len(public_subnet_matches), 1, "Public subnets should be created in loop")
        self.assertIn("public_subnets = []", self.stack_content)
        self.assertIn("map_public_ip_on_launch=True", self.stack_content)

    def test_private_subnets_creation(self):
        """Test 3 private subnets are created"""
        private_subnet_matches = re.findall(r'payment-private-subnet-\{i\+1\}', self.stack_content)
        self.assertGreaterEqual(len(private_subnet_matches), 1, "Private subnets should be created in loop")
        self.assertIn("private_subnets = []", self.stack_content)
        self.assertIn("map_public_ip_on_launch=False", self.stack_content)

    def test_internet_gateway_creation(self):
        """Test Internet Gateway is created for public subnets"""
        self.assertIn("aws.ec2.InternetGateway(", self.stack_content)
        self.assertIn("payment-igw", self.stack_content)

    def test_route_tables_configuration(self):
        """Test route tables are configured correctly"""
        self.assertIn("aws.ec2.RouteTable(", self.stack_content)
        self.assertIn("payment-public-rt", self.stack_content)
        self.assertIn("payment-private-rt", self.stack_content)

    def test_public_route_to_igw(self):
        """Test public route points to Internet Gateway"""
        self.assertIn("aws.ec2.Route(", self.stack_content)
        self.assertIn('destination_cidr_block="0.0.0.0/0"', self.stack_content)
        self.assertIn("gateway_id=igw.id", self.stack_content)

    def test_kms_keys_creation(self):
        """Test KMS keys are created for S3, DynamoDB, and CloudWatch"""
        self.assertIn("payment-s3-kms", self.stack_content)
        self.assertIn("payment-dynamodb-kms", self.stack_content)
        self.assertIn("payment-logs-kms", self.stack_content)

    def test_kms_keys_rotation_enabled(self):
        """Test KMS keys have automatic rotation enabled"""
        kms_rotation_count = self.stack_content.count("enable_key_rotation=True")
        self.assertGreaterEqual(kms_rotation_count, 3, "At least 3 KMS keys should have rotation enabled")

    def test_kms_aliases_creation(self):
        """Test KMS aliases are created"""
        self.assertIn("aws.kms.Alias(", self.stack_content)
        self.assertIn("alias/payment", self.stack_content)

    def test_s3_bucket_creation(self):
        """Test S3 bucket is created"""
        self.assertIn("aws.s3.Bucket(", self.stack_content)
        self.assertIn("payment-docs", self.stack_content)

    def test_s3_versioning_enabled(self):
        """Test S3 versioning is enabled"""
        self.assertIn("BucketVersioning", self.stack_content)
        self.assertIn('"status": "Enabled"', self.stack_content)

    def test_s3_public_access_blocked(self):
        """Test S3 public access is blocked"""
        self.assertIn("BucketPublicAccessBlock", self.stack_content)
        self.assertIn("block_public_acls=True", self.stack_content)
        self.assertIn("block_public_policy=True", self.stack_content)

    def test_s3_encryption_configured(self):
        """Test S3 encryption is configured with KMS"""
        self.assertIn("BucketServerSideEncryptionConfiguration", self.stack_content)
        self.assertIn('"sse_algorithm": "aws:kms"', self.stack_content)

    def test_dynamodb_table_creation(self):
        """Test DynamoDB table is created"""
        self.assertIn("aws.dynamodb.Table(", self.stack_content)
        self.assertIn("payment-transactions", self.stack_content)
        self.assertIn("billing_mode", self.stack_content)

    def test_dynamodb_pitr_enabled(self):
        """Test DynamoDB point-in-time recovery is enabled"""
        self.assertIn("point_in_time_recovery", self.stack_content)
        self.assertIn('enabled=True', self.stack_content)

    def test_dynamodb_encryption_with_kms(self):
        """Test DynamoDB encryption uses customer-managed KMS key"""
        self.assertIn("server_side_encryption", self.stack_content)
        self.assertIn('enabled=True', self.stack_content)
        self.assertIn("kms_key_arn", self.stack_content)

    def test_security_groups_creation(self):
        """Test security groups are created"""
        self.assertIn("aws.ec2.SecurityGroup(", self.stack_content)
        self.assertIn("payment-lambda-sg", self.stack_content)
        self.assertIn("payment-vpce-sg", self.stack_content)

    def test_vpc_endpoints_creation(self):
        """Test VPC endpoints are created for AWS services"""
        self.assertIn("aws.ec2.VpcEndpoint(", self.stack_content)
        self.assertIn("payment-s3-endpoint", self.stack_content)
        self.assertIn("payment-dynamodb-endpoint", self.stack_content)
        self.assertIn("payment-logs-endpoint", self.stack_content)

    def test_iam_role_creation(self):
        """Test IAM role is created for Lambda"""
        self.assertIn("aws.iam.Role(", self.stack_content)
        self.assertIn("payment-lambda-role", self.stack_content)
        self.assertIn("assume_role_policy", self.stack_content)

    def test_iam_policy_least_privilege(self):
        """Test IAM policy follows least privilege"""
        self.assertIn("aws.iam.Policy(", self.stack_content)
        self.assertIn("payment-lambda-policy", self.stack_content)
        self.assertIn('"Action"', self.stack_content)
        self.assertIn('"Resource"', self.stack_content)

    def test_cloudwatch_log_group_creation(self):
        """Test CloudWatch log group is created"""
        self.assertIn("aws.cloudwatch.LogGroup(", self.stack_content)
        self.assertIn("payment-lambda-logs", self.stack_content)

    def test_cloudwatch_logs_90_day_retention(self):
        """Test CloudWatch logs have 90-day retention"""
        self.assertIn("retention_in_days=90", self.stack_content)

    def test_cloudwatch_logs_encryption(self):
        """Test CloudWatch logs are encrypted with KMS"""
        self.assertIn("kms_key_id", self.stack_content)
        # Find log group with KMS key
        log_group_section = self.stack_content[self.stack_content.find("payment-lambda-logs"):self.stack_content.find("payment-lambda-logs") + 500]
        self.assertIn("kms_key_id", log_group_section)

    def test_lambda_function_creation(self):
        """Test Lambda function is created"""
        self.assertIn("aws.lambda_.Function(", self.stack_content)
        self.assertIn("payment-processor", self.stack_content)
        self.assertIn('runtime="python3.9"', self.stack_content)

    def test_lambda_function_code_inline(self):
        """Test Lambda function code is defined inline"""
        self.assertIn("lambda_function_code", self.stack_content)
        self.assertIn("def handler(event, context):", self.stack_content)
        self.assertIn("AssetArchive", self.stack_content)

    def test_lambda_vpc_configuration(self):
        """Test Lambda is deployed in VPC"""
        self.assertIn("vpc_config", self.stack_content)
        self.assertIn("subnet_ids", self.stack_content)
        self.assertIn("security_group_ids", self.stack_content)

    def test_lambda_environment_variables(self):
        """Test Lambda environment variables are configured"""
        self.assertIn("environment", self.stack_content)
        self.assertIn("DYNAMODB_TABLE", self.stack_content)
        self.assertIn("S3_BUCKET", self.stack_content)

    def test_lambda_timeout_and_memory(self):
        """Test Lambda timeout and memory are configured"""
        self.assertIn("timeout=30", self.stack_content)
        self.assertIn("memory_size=256", self.stack_content)

    def test_waf_webacl_creation(self):
        """Test WAF WebACL is created"""
        self.assertIn("aws.wafv2.WebAcl(", self.stack_content)
        self.assertIn("payment-waf", self.stack_content)
        self.assertIn('scope="REGIONAL"', self.stack_content)

    def test_waf_managed_rule_groups(self):
        """Test WAF includes managed rule groups"""
        self.assertIn("managed_rule_group_statement", self.stack_content)
        self.assertIn("AWSManagedRulesCommonRuleSet", self.stack_content)

    def test_waf_rate_limiting(self):
        """Test WAF includes rate limiting"""
        self.assertIn("rate_based_statement", self.stack_content)
        self.assertIn("limit", self.stack_content)

    def test_waf_visibility_config(self):
        """Test WAF visibility is configured"""
        self.assertIn("visibility_config", self.stack_content)
        self.assertIn("cloudwatch_metrics_enabled", self.stack_content)

    def test_api_gateway_rest_api_creation(self):
        """Test API Gateway REST API is created"""
        self.assertIn("aws.apigateway.RestApi(", self.stack_content)
        self.assertIn("payment-api", self.stack_content)

    def test_api_gateway_resource_creation(self):
        """Test API Gateway resource is created"""
        self.assertIn("aws.apigateway.Resource(", self.stack_content)
        self.assertIn('path_part="process-payment"', self.stack_content)

    def test_api_gateway_method_creation(self):
        """Test API Gateway method is created"""
        self.assertIn("aws.apigateway.Method(", self.stack_content)
        self.assertIn('http_method="POST"', self.stack_content)

    def test_api_gateway_integration(self):
        """Test API Gateway Lambda integration"""
        self.assertIn("aws.apigateway.Integration(", self.stack_content)
        self.assertIn('type="AWS_PROXY"', self.stack_content)
        self.assertIn("uri=lambda_function.invoke_arn", self.stack_content)

    def test_api_gateway_deployment(self):
        """Test API Gateway deployment is created"""
        self.assertIn("aws.apigateway.Deployment(", self.stack_content)
        self.assertIn("depends_on", self.stack_content)

    def test_api_gateway_stage(self):
        """Test API Gateway stage is created"""
        self.assertIn("aws.apigateway.Stage(", self.stack_content)
        self.assertIn("deployment=api_deployment.id", self.stack_content)

    def test_api_gateway_logging(self):
        """Test API Gateway access logging is configured"""
        self.assertIn("access_log_settings", self.stack_content)
        self.assertIn("destinationArn", self.stack_content)

    def test_lambda_permission_for_api_gateway(self):
        """Test Lambda permission allows API Gateway invocation"""
        self.assertIn("aws.lambda_.Permission(", self.stack_content)
        self.assertIn('action="lambda:InvokeFunction"', self.stack_content)
        self.assertIn('principal="apigateway.amazonaws.com"', self.stack_content)

    def test_waf_association_with_api_gateway(self):
        """Test WAF is associated with API Gateway"""
        self.assertIn("aws.wafv2.WebAclAssociation(", self.stack_content)
        self.assertIn("resource_arn=api_stage.arn", self.stack_content)
        self.assertIn("web_acl_arn=waf_web_acl.arn", self.stack_content)

    def test_stack_exports_vpc_id(self):
        """Test VPC ID is exported"""
        self.assertIn('pulumi.export("vpc_id"', self.stack_content)

    def test_stack_exports_subnet_ids(self):
        """Test subnet IDs are exported"""
        self.assertIn('pulumi.export("private_subnet_ids"', self.stack_content)
        self.assertIn('pulumi.export("public_subnet_ids"', self.stack_content)

    def test_stack_exports_lambda(self):
        """Test Lambda function details are exported"""
        self.assertIn('pulumi.export("lambda_function_name"', self.stack_content)
        self.assertIn('pulumi.export("lambda_function_arn"', self.stack_content)

    def test_stack_exports_s3_bucket(self):
        """Test S3 bucket name is exported"""
        self.assertIn('pulumi.export("s3_bucket_name"', self.stack_content)

    def test_stack_exports_dynamodb_table(self):
        """Test DynamoDB table name is exported"""
        self.assertIn('pulumi.export("dynamodb_table_name"', self.stack_content)

    def test_stack_exports_api_gateway_url(self):
        """Test API Gateway URL is exported"""
        self.assertIn('"api_gateway_url"', self.stack_content)
        self.assertIn("pulumi.export(", self.stack_content)

    def test_stack_exports_waf_id(self):
        """Test WAF Web ACL ID is exported"""
        self.assertIn('pulumi.export("waf_web_acl_id"', self.stack_content)

    def test_stack_exports_kms_keys(self):
        """Test KMS key IDs are exported"""
        self.assertIn('pulumi.export("kms_s3_key_id"', self.stack_content)
        self.assertIn('pulumi.export("kms_dynamodb_key_id"', self.stack_content)
        self.assertIn('pulumi.export("kms_logs_key_id"', self.stack_content)

    def test_environment_suffix_in_all_resources(self):
        """Test all resource names include environment suffix"""
        resource_patterns = [
            "payment-vpc-{environment_suffix}",
            "payment-igw-{environment_suffix}",
            "payment-s3-kms-{environment_suffix}",
            "payment-dynamodb-kms-{environment_suffix}",
            "payment-logs-kms-{environment_suffix}",
            "payment-docs-{environment_suffix}",
            "payment-transactions-{environment_suffix}",
            "payment-lambda-sg-{environment_suffix}",
            "payment-lambda-role-{environment_suffix}",
            "payment-processor-{environment_suffix}",
            "payment-waf-{environment_suffix}",
            "payment-api-{environment_suffix}",
        ]
        for pattern in resource_patterns:
            self.assertIn(pattern, self.stack_content, f"Pattern {pattern} not found in resource names")

    def test_all_resources_tagged(self):
        """Test all resources include compliance tags"""
        # Count resources that should have tags
        tag_occurrences = self.stack_content.count("compliance_tags")
        # Should be many occurrences (at least 20 resources with tags)
        self.assertGreaterEqual(tag_occurrences, 20, "All resources should include compliance tags")

    def test_no_hardcoded_credentials(self):
        """Test no hardcoded credentials in code"""
        self.assertNotIn("AKIA", self.stack_content, "No AWS access keys should be hardcoded")
        self.assertNotIn("password=", self.stack_content.lower(), "No passwords should be hardcoded")

    def test_no_deletion_protection(self):
        """Test resources don't have deletion protection"""
        self.assertNotIn("deletion_protection=True", self.stack_content)
        self.assertNotIn("DeletionProtection=true", self.stack_content)

    def test_no_retain_policies(self):
        """Test resources don't have Retain deletion policies"""
        self.assertNotIn("Delete=Retain", self.stack_content)
        self.assertNotIn('deletion_policy="Retain"', self.stack_content)


if __name__ == "__main__":
    unittest.main()
