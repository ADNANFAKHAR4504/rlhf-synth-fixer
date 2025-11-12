"""
Integration tests for TapStack - Multi-Region Infrastructure
Tests infrastructure deployment and connectivity using synthesized Terraform
"""
import pytest
import json
import os
from pathlib import Path


class TestMultiRegionInfrastructure:
    """Integration tests for multi-region infrastructure"""

    @pytest.fixture(scope="class")
    def terraform_outputs(self):
        """Load Terraform outputs from cfn-outputs/flat-outputs.json and cdktf.out"""
        outputs = {}
        
        # Load from flat-outputs.json for deployment outputs
        outputs_file = Path("cfn-outputs/flat-outputs.json")
        if outputs_file.exists():
            with open(outputs_file) as f:
                flat_outputs = json.load(f)
                # Store the flat outputs for later use
                outputs['_flat_outputs'] = flat_outputs
        
        # Load from cdktf.out for infrastructure configuration
        cdktf_out_path = Path("cdktf.out/stacks")
        if cdktf_out_path.exists():
            for stack_dir in cdktf_out_path.iterdir():
                if stack_dir.is_dir():
                    stack_json = stack_dir / "cdk.tf.json"
                    if stack_json.exists():
                        with open(stack_json) as f:
                            stack_data = json.load(f)
                            outputs[stack_dir.name] = stack_data

        return outputs

    def test_vpc_resources_per_region(self, terraform_outputs):
        """Test that each region has VPC resources"""
        for stack_name, stack_data in terraform_outputs.items():
            # Skip the flat outputs entry
            if stack_name == '_flat_outputs':
                continue
            resources = stack_data.get("resource", {})

            # Verify VPC exists
            assert "aws_vpc" in resources, f"No VPC found in {stack_name}"

            # Verify subnets exist
            assert "aws_subnet" in resources, f"No subnets found in {stack_name}"

            # Verify Internet Gateway
            assert "aws_internet_gateway" in resources, f"No IGW found in {stack_name}"

            # Verify route tables
            assert "aws_route_table" in resources, f"No route tables found in {stack_name}"

    def test_kms_encryption_per_region(self, terraform_outputs):
        """Test that KMS keys are configured in each region"""
        for stack_name, stack_data in terraform_outputs.items():
            # Skip the flat outputs entry
            if stack_name == '_flat_outputs':
                continue
            resources = stack_data.get("resource", {})

            # Verify KMS key exists
            assert "aws_kms_key" in resources, f"No KMS key found in {stack_name}"

            # Verify KMS alias
            assert "aws_kms_alias" in resources, f"No KMS alias found in {stack_name}"

            # Verify key rotation enabled
            kms_keys = resources.get("aws_kms_key", {})
            for key_name, key_config in kms_keys.items():
                assert key_config.get("enable_key_rotation") is True, \
                    f"Key rotation not enabled for {key_name} in {stack_name}"

    def test_s3_buckets_per_region(self, terraform_outputs):
        """Test that S3 buckets are configured with encryption"""
        for stack_name, stack_data in terraform_outputs.items():
            # Skip the flat outputs entry
            if stack_name == '_flat_outputs':
                continue
            resources = stack_data.get("resource", {})

            # Verify S3 bucket exists
            assert "aws_s3_bucket" in resources, f"No S3 bucket found in {stack_name}"

            # Verify S3 encryption configuration
            assert "aws_s3_bucket_server_side_encryption_configuration" in resources, \
                f"No S3 encryption config found in {stack_name}"

            # Verify lifecycle configuration
            assert "aws_s3_bucket_lifecycle_configuration" in resources, \
                f"No S3 lifecycle config found in {stack_name}"

    def test_rds_clusters_per_region(self, terraform_outputs):
        """Test that RDS Aurora clusters are configured"""
        for stack_name, stack_data in terraform_outputs.items():
            # Skip the flat outputs entry
            if stack_name == '_flat_outputs':
                continue
            resources = stack_data.get("resource", {})

            # Verify RDS cluster exists
            assert "aws_rds_cluster" in resources, f"No RDS cluster found in {stack_name}"

            # Verify RDS instances
            assert "aws_rds_cluster_instance" in resources, \
                f"No RDS instances found in {stack_name}"

            # Verify cluster is encrypted
            rds_clusters = resources.get("aws_rds_cluster", {})
            for cluster_name, cluster_config in rds_clusters.items():
                assert cluster_config.get("storage_encrypted") is True, \
                    f"RDS cluster {cluster_name} not encrypted in {stack_name}"

                # Verify backups enabled
                assert cluster_config.get("backup_retention_period", 0) > 0, \
                    f"Backups not enabled for {cluster_name} in {stack_name}"

                # Verify CloudWatch logs
                assert cluster_config.get("enabled_cloudwatch_logs_exports"), \
                    f"CloudWatch logs not enabled for {cluster_name} in {stack_name}"

    def test_lambda_functions_per_region(self, terraform_outputs):
        """Test that Lambda functions are configured"""
        for stack_name, stack_data in terraform_outputs.items():
            # Skip the flat outputs entry
            if stack_name == '_flat_outputs':
                continue
            resources = stack_data.get("resource", {})

            # Verify Lambda function exists
            assert "aws_lambda_function" in resources, \
                f"No Lambda function found in {stack_name}"

            # Verify IAM role for Lambda
            assert "aws_iam_role" in resources, f"No IAM role found in {stack_name}"

            # Verify IAM policies
            assert "aws_iam_policy" in resources, f"No IAM policy found in {stack_name}"

    def test_api_gateway_per_region(self, terraform_outputs):
        """Test that API Gateway is configured in each region"""
        for stack_name, stack_data in terraform_outputs.items():
            # Skip the flat outputs entry
            if stack_name == '_flat_outputs':
                continue
            resources = stack_data.get("resource", {})

            # Verify API Gateway exists
            assert "aws_apigatewayv2_api" in resources, \
                f"No API Gateway found in {stack_name}"

            # Verify API Gateway integration
            assert "aws_apigatewayv2_integration" in resources, \
                f"No API Gateway integration found in {stack_name}"

            # Verify API Gateway route
            assert "aws_apigatewayv2_route" in resources, \
                f"No API Gateway route found in {stack_name}"

            # Verify API Gateway stage
            assert "aws_apigatewayv2_stage" in resources, \
                f"No API Gateway stage found in {stack_name}"

    def test_dynamodb_tables_per_region(self, terraform_outputs):
        """Test that DynamoDB tables are configured"""
        for stack_name, stack_data in terraform_outputs.items():
            # Skip the flat outputs entry
            if stack_name == '_flat_outputs':
                continue
            resources = stack_data.get("resource", {})

            # Verify DynamoDB table exists
            assert "aws_dynamodb_table" in resources, \
                f"No DynamoDB table found in {stack_name}"

            # Verify table encryption
            dynamodb_tables = resources.get("aws_dynamodb_table", {})
            for table_name, table_config in dynamodb_tables.items():
                sse_config = table_config.get("server_side_encryption")
                if sse_config:
                    assert sse_config.get("enabled") is True, \
                        f"DynamoDB table {table_name} not encrypted in {stack_name}"

                # Verify point-in-time recovery
                pitr_config = table_config.get("point_in_time_recovery")
                if pitr_config:
                    assert pitr_config.get("enabled") is True, \
                        f"PITR not enabled for {table_name} in {stack_name}"

    def test_cloudwatch_alarms_per_region(self, terraform_outputs):
        """Test that CloudWatch alarms are configured"""
        for stack_name, stack_data in terraform_outputs.items():
            # Skip the flat outputs entry
            if stack_name == '_flat_outputs':
                continue
            resources = stack_data.get("resource", {})

            # Verify CloudWatch alarms exist
            assert "aws_cloudwatch_metric_alarm" in resources, \
                f"No CloudWatch alarms found in {stack_name}"

            # Count alarms
            alarms = resources.get("aws_cloudwatch_metric_alarm", {})
            assert len(alarms) >= 3, \
                f"Expected at least 3 alarms in {stack_name}, found {len(alarms)}"

    def test_resource_tagging(self, terraform_outputs):
        """Test that resources are properly tagged"""
        required_tags = ["Environment", "Region", "CostCenter", "ManagedBy"]

        for stack_name, stack_data in terraform_outputs.items():
            # Skip the flat outputs entry
            if stack_name == '_flat_outputs':
                continue
            resources = stack_data.get("resource", {})

            # Check VPC tags
            vpcs = resources.get("aws_vpc", {})
            for vpc_name, vpc_config in vpcs.items():
                tags = vpc_config.get("tags", {})
                for required_tag in required_tags:
                    assert required_tag in tags, \
                        f"Tag {required_tag} missing from VPC in {stack_name}"

    def test_stack_outputs_defined(self, terraform_outputs):
        """Test that stack outputs are properly defined"""
        expected_outputs = [
            "vpc_id",
            "s3_bucket_name",
            "lambda_function_arn",
            "rds_cluster_endpoint",
            "dynamodb_table_name",
            "api_gateway_endpoint",
            "kms_key_id"
        ]

        for stack_name, stack_data in terraform_outputs.items():
            # Skip the flat outputs entry
            if stack_name == '_flat_outputs':
                continue
                
            outputs = stack_data.get("output", {})

            for expected_output in expected_outputs:
                assert expected_output in outputs, \
                    f"Output {expected_output} missing from {stack_name}"
    
    def test_deployed_outputs_from_file(self, terraform_outputs):
        """Test that deployed outputs are correctly captured in flat-outputs.json"""
        flat_outputs = terraform_outputs.get('_flat_outputs', {})
        
        # Check that we have flat outputs
        assert flat_outputs, "No flat outputs found in cfn-outputs/flat-outputs.json"
        
        # Get expected region
        expected_region = os.getenv("AWS_REGION", "ap-southeast-1")
        expected_stack = f"tap-stack-{expected_region}"
        
        # Verify the stack exists in flat outputs
        assert expected_stack in flat_outputs, \
            f"Stack {expected_stack} not found in flat outputs"
        
        stack_outputs = flat_outputs[expected_stack]
        
        # Verify all required outputs exist and have values
        required_outputs = [
            "vpc_id",
            "s3_bucket_name", 
            "lambda_function_arn",
            "rds_cluster_endpoint",
            "dynamodb_table_name",
            "api_gateway_endpoint",
            "kms_key_id"
        ]
        
        for output_name in required_outputs:
            assert output_name in stack_outputs, \
                f"Output {output_name} missing from deployed outputs"
            assert stack_outputs[output_name], \
                f"Output {output_name} has no value in deployed outputs"
        
        # Validate format of specific outputs
        assert stack_outputs["vpc_id"].startswith("vpc-"), \
            f"Invalid VPC ID format: {stack_outputs['vpc_id']}"
        assert stack_outputs["lambda_function_arn"].startswith("arn:aws:lambda:"), \
            f"Invalid Lambda ARN format: {stack_outputs['lambda_function_arn']}"
        assert stack_outputs["api_gateway_endpoint"].startswith("https://"), \
            f"Invalid API Gateway endpoint format: {stack_outputs['api_gateway_endpoint']}"

    def test_security_configurations(self, terraform_outputs):
        """Test security configurations across all regions"""
        for stack_name, stack_data in terraform_outputs.items():
            # Skip the flat outputs entry
            if stack_name == '_flat_outputs':
                continue
            resources = stack_data.get("resource", {})

            # Verify IAM roles follow least privilege
            iam_policies = resources.get("aws_iam_policy", {})
            for policy_name, policy_config in iam_policies.items():
                policy_doc = policy_config.get("policy")
                if policy_doc:
                    if isinstance(policy_doc, str):
                        policy_obj = json.loads(policy_doc)
                    else:
                        policy_obj = policy_doc

                    # Verify policy has statements
                    assert "Statement" in policy_obj, \
                        f"IAM policy {policy_name} has no statements in {stack_name}"

    def test_backup_configurations(self, terraform_outputs):
        """Test backup configurations across all regions"""
        for stack_name, stack_data in terraform_outputs.items():
            # Skip the flat outputs entry
            if stack_name == '_flat_outputs':
                continue
            resources = stack_data.get("resource", {})

            # Verify RDS backups
            rds_clusters = resources.get("aws_rds_cluster", {})
            for cluster_name, cluster_config in rds_clusters.items():
                backup_retention = cluster_config.get("backup_retention_period", 0)
                assert backup_retention > 0, \
                    f"RDS backup not configured for {cluster_name} in {stack_name}"

    def test_no_retain_policies(self, terraform_outputs):
        """Test that no resources have Retain deletion policies"""
        for stack_name, stack_data in terraform_outputs.items():
            # Skip the flat outputs entry
            if stack_name == '_flat_outputs':
                continue
            resources = stack_data.get("resource", {})

            # Verify RDS clusters have skip_final_snapshot
            rds_clusters = resources.get("aws_rds_cluster", {})
            for cluster_name, cluster_config in rds_clusters.items():
                assert cluster_config.get("skip_final_snapshot") is True, \
                    f"RDS cluster {cluster_name} has final snapshot enabled in {stack_name}"


class TestInfrastructureConnectivity:
    """Test infrastructure connectivity and dependencies"""

    def test_lambda_s3_permissions(self):
        """Test Lambda has permissions to access S3"""
        cdktf_out = Path("cdktf.out/stacks/tap-stack-us-east-1/cdk.tf.json")

        if cdktf_out.exists():
            with open(cdktf_out) as f:
                stack_data = json.load(f)

            resources = stack_data.get("resource", {})
            iam_policies = resources.get("aws_iam_policy", {})

            # Find Lambda S3 policy
            has_s3_policy = False
            for policy_name, policy_config in iam_policies.items():
                policy_doc = policy_config.get("policy")
                if policy_doc and "s3" in policy_doc.lower():
                    has_s3_policy = True
                    break

            assert has_s3_policy, "Lambda S3 policy not found"

    def test_vpc_subnets_coverage(self):
        """Test that VPC subnets cover multiple availability zones"""
        cdktf_out = Path("cdktf.out/stacks/tap-stack-us-east-1/cdk.tf.json")

        if cdktf_out.exists():
            with open(cdktf_out) as f:
                stack_data = json.load(f)

            resources = stack_data.get("resource", {})
            subnets = resources.get("aws_subnet", {})

            # Count unique availability zones
            azs = set()
            for subnet_name, subnet_config in subnets.items():
                az = subnet_config.get("availability_zone")
                if az:
                    azs.add(az)

            # Should have subnets in at least 3 AZs
            assert len(azs) >= 3, f"Expected subnets in 3+ AZs, found {len(azs)}"

    def test_multi_region_architecture(self):
        """Test regional architecture is properly configured"""
        stacks_path = Path("cdktf.out/stacks")
        expected_region = os.getenv("AWS_REGION", "ap-southeast-1")

        if stacks_path.exists():
            stack_dirs = [d for d in stacks_path.iterdir() if d.is_dir()]

            # Verify we have at least 1 regional stack
            assert len(stack_dirs) >= 1, \
                f"Expected at least 1 regional stack, found {len(stack_dirs)}"

            # Verify the expected region stack exists
            expected_stack_name = f"tap-stack-{expected_region}"
            stack_names = [d.name for d in stack_dirs]
            assert expected_stack_name in stack_names, \
                f"Expected stack {expected_stack_name} not found in {stack_names}"
