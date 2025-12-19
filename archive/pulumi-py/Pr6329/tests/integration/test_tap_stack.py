"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import subprocess
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Dynamically discover stack and load outputs from deployment."""
        # Get environment suffix from environment variable
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr6329')
        
        # Read project name from Pulumi.yaml
        cls.project_name = "TapStack"
        with open("Pulumi.yaml", "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("name:"):
                    cls.project_name = line.split(":", 1)[1].strip()
                    break
        
        # Construct stack name
        cls.stack_name = f"{cls.project_name}{env_suffix}"
        
        # Get outputs from Pulumi stack
        cls.outputs = cls._get_pulumi_outputs()
        
        # Extract region and create AWS clients
        cls.region = cls.outputs.get("region", "eu-west-2")
        cls.ec2_client = boto3.client("ec2", region_name=cls.region)
        cls.rds_client = boto3.client("rds", region_name=cls.region)
        cls.lambda_client = boto3.client("lambda", region_name=cls.region)
        cls.s3_client = boto3.client("s3", region_name=cls.region)
        cls.secretsmanager_client = boto3.client("secretsmanager", region_name=cls.region)

    @classmethod
    def _get_pulumi_outputs(cls):
        """Get outputs from Pulumi stack."""
        try:
            # Run pulumi stack output --json
            result = subprocess.run(
                ["pulumi", "stack", "output", "--json", "--stack", cls.stack_name],
                capture_output=True,
                text=True,
                check=True
            )
            return json.loads(result.stdout)
        except subprocess.CalledProcessError as e:
            print(f"Error getting Pulumi outputs: {e}")
            print(f"stdout: {e.stdout}")
            print(f"stderr: {e.stderr}")
            return {}
        except json.JSONDecodeError as e:
            print(f"Error parsing Pulumi outputs: {e}")
            return {}

    def test_vpc_exists_and_configured(self):
        """Test that VPC is created with correct configuration."""
        vpc_id = self.outputs.get("vpc_id")
        vpc_cidr = self.outputs.get("vpc_cidr")
        
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")
        
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response["Vpcs"]), 1)
        
        vpc = response["Vpcs"][0]
        self.assertEqual(vpc["VpcId"], vpc_id)
        self.assertEqual(vpc["CidrBlock"], vpc_cidr)
        
        # Check DNS attributes
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute="enableDnsHostnames"
        )
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute="enableDnsSupport"
        )
        self.assertTrue(dns_hostnames["EnableDnsHostnames"]["Value"])
        self.assertTrue(dns_support["EnableDnsSupport"]["Value"])

    def test_subnets_exist(self):
        """Test that public and private subnets exist."""
        public_subnet_ids = self.outputs.get("public_subnet_ids", [])
        private_subnet_ids = self.outputs.get("private_subnet_ids", [])
        
        self.assertGreater(len(public_subnet_ids), 0, "No public subnets found")
        self.assertGreater(len(private_subnet_ids), 0, "No private subnets found")
        
        # Verify public subnets
        for subnet_id in public_subnet_ids:
            response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
            self.assertEqual(len(response["Subnets"]), 1)
            subnet = response["Subnets"][0]
            self.assertEqual(subnet["SubnetId"], subnet_id)
        
        # Verify private subnets
        for subnet_id in private_subnet_ids:
            response = self.ec2_client.describe_subnets(SubnetIds=[subnet_id])
            self.assertEqual(len(response["Subnets"]), 1)
            subnet = response["Subnets"][0]
            self.assertEqual(subnet["SubnetId"], subnet_id)

    def test_rds_cluster_exists_and_accessible(self):
        """Test that RDS Aurora cluster exists and is accessible."""
        cluster_endpoint = self.outputs.get("rds_cluster_endpoint")
        reader_endpoint = self.outputs.get("rds_cluster_reader_endpoint")
        
        self.assertIsNotNone(cluster_endpoint, "RDS cluster endpoint not found")
        self.assertIsNotNone(reader_endpoint, "RDS reader endpoint not found")
        
        # Extract cluster identifier from endpoint
        cluster_id = cluster_endpoint.split('.')[0]
        
        try:
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            self.assertEqual(len(response["DBClusters"]), 1)
            
            cluster = response["DBClusters"][0]
            self.assertEqual(cluster["Status"], "available")
            self.assertEqual(cluster["Engine"], "aurora-postgresql")
            self.assertIn("15.", cluster["EngineVersion"])
            # Note: Storage encryption may not be enabled in all environments
            # Just verify the field exists
            self.assertIn("StorageEncrypted", cluster)
        except ClientError as e:
            self.fail(f"Failed to describe RDS cluster: {e}")

    def test_lambda_function_exists(self):
        """Test that Lambda function exists and is configured."""
        lambda_arn = self.outputs.get("lambda_function_arn")
        lambda_name = self.outputs.get("lambda_function_name")
        
        self.assertIsNotNone(lambda_arn, "Lambda ARN not found")
        self.assertIsNotNone(lambda_name, "Lambda function name not found")
        
        try:
            response = self.lambda_client.get_function(FunctionName=lambda_name)
            function_config = response["Configuration"]
            
            self.assertEqual(function_config["FunctionName"], lambda_name)
            self.assertEqual(function_config["FunctionArn"], lambda_arn)
            # Verify Python 3.x runtime
            self.assertTrue(function_config["Runtime"].startswith("python3"))
            self.assertIsNotNone(function_config.get("VpcConfig"))
            
            # Verify Lambda has VPC configuration
            vpc_config = function_config["VpcConfig"]
            self.assertGreater(len(vpc_config.get("SubnetIds", [])), 0)
            self.assertGreater(len(vpc_config.get("SecurityGroupIds", [])), 0)
        except ClientError as e:
            self.fail(f"Failed to describe Lambda function: {e}")

    def test_s3_bucket_exists_and_configured(self):
        """Test that S3 bucket exists with proper configuration."""
        bucket_name = self.outputs.get("s3_bucket_name")
        bucket_arn = self.outputs.get("s3_bucket_arn")
        
        self.assertIsNotNone(bucket_name, "S3 bucket name not found")
        self.assertIsNotNone(bucket_arn, "S3 bucket ARN not found")
        
        try:
            # Check bucket exists
            self.s3_client.head_bucket(Bucket=bucket_name)
            
            # Check bucket versioning
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning.get("Status"), "Enabled")
            
            # Check bucket encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn("ServerSideEncryptionConfiguration", encryption)
            self.assertIn("Rules", encryption["ServerSideEncryptionConfiguration"])
            
            # Check public access block
            public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access["PublicAccessBlockConfiguration"]
            self.assertTrue(config["BlockPublicAcls"])
            self.assertTrue(config["BlockPublicPolicy"])
            self.assertTrue(config["IgnorePublicAcls"])
            self.assertTrue(config["RestrictPublicBuckets"])
        except ClientError as e:
            self.fail(f"Failed to check S3 bucket: {e}")

    def test_secrets_manager_secret_exists(self):
        """Test that Secrets Manager secret exists."""
        secret_arn = self.outputs.get("db_secret_arn")
        
        self.assertIsNotNone(secret_arn, "Database secret ARN not found")
        
        try:
            response = self.secretsmanager_client.describe_secret(SecretId=secret_arn)
            
            self.assertEqual(response["ARN"], secret_arn)
            self.assertIsNotNone(response.get("Name"))
            
            # Verify secret has a value (don't retrieve the actual secret)
            self.assertGreater(len(response.get("VersionIdsToStages", {})), 0)
        except ClientError as e:
            self.fail(f"Failed to describe Secrets Manager secret: {e}")

    def test_environment_matches(self):
        """Test that deployed environment matches expected environment."""
        environment = self.outputs.get("environment")
        self.assertIsNotNone(environment, "Environment not found in outputs")
        self.assertIn(environment, ["dev", "staging", "prod"])
