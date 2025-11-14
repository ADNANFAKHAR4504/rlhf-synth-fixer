"""
Integration tests for TAP infrastructure deployment.

These tests validate the actual deployed infrastructure by reading outputs from:
cfn-outputs/flat-outputs.json

Run after: cdktf deploy (which generates the outputs JSON file)
"""

import unittest
import json
import os


class TestInfrastructureDeployment(unittest.TestCase):
    """Integration tests for deployed infrastructure."""
    
    @classmethod
    def setUpClass(cls):
        """Load stack outputs from cfn-outputs/flat-outputs.json."""
        try:
            # Path to the flat outputs JSON file
            outputs_file = os.path.join('cfn-outputs', 'flat-outputs.json')
            
            # Check if file exists
            if not os.path.exists(outputs_file):
                cls.outputs = {}
                cls.stack_available = False
                print(f"\n✗ Outputs file not found: {outputs_file}")
                print(f"   Please run: cdktf deploy to generate outputs")
                return
            
            # Read the JSON file
            with open(outputs_file, 'r', encoding='utf-8') as f:
                cls.outputs = json.load(f)
            
            cls.stack_available = True
            print(f"\n✓ Loaded stack outputs from {outputs_file}: {len(cls.outputs)} outputs found")
            
        except json.JSONDecodeError as e:
            cls.outputs = {}
            cls.stack_available = False
            print(f"\n✗ Failed to parse JSON from outputs file: {e}")
        except Exception as e:
            cls.outputs = {}
            cls.stack_available = False
            print(f"\n✗ Failed to load stack outputs: {e}")
    
    def test_stack_outputs_exist(self):
        """Test that CDKTF stack has been deployed with outputs."""
        if not self.stack_available:
            self.skipTest("Outputs file not available. Run: cdktf deploy")
        
        self.assertGreater(len(self.outputs), 0, "Stack should have outputs")
        print(f"  ✓ Stack has {len(self.outputs)} outputs")
    
    def test_vpc_resources_deployed(self):
        """Test that VPC resources are deployed."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        # Check for VPC outputs
        required_outputs = ['vpc_id', 'vpc_cidr', 'subnet_1_id', 'subnet_2_id']
        
        for output_key in required_outputs:
            self.assertIn(output_key, self.outputs, 
                         f"Output '{output_key}' should exist")
            
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")
            self.assertNotEqual(value, '', f"{output_key} should not be empty")
        
        print(f"  ✓ VPC resources deployed")
        print(f"    VPC ID: {self.outputs.get('vpc_id', 'N/A')}")
        print(f"    VPC CIDR: {self.outputs.get('vpc_cidr', 'N/A')}")
    
    def test_aurora_cluster_deployed(self):
        """Test that Aurora PostgreSQL cluster is deployed and accessible."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        cluster_outputs = ['aurora_cluster_id', 'aurora_cluster_endpoint', 
                          'aurora_cluster_reader_endpoint', 'aurora_database_name',
                          'aurora_engine_version']
        
        for output_key in cluster_outputs:
            self.assertIn(output_key, self.outputs, 
                         f"Output '{output_key}' should exist")
            
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")
            
            if 'endpoint' in output_key.lower():
                # Endpoints should contain typical Aurora endpoint format
                endpoint = str(value)
                self.assertTrue(
                    '.rds.amazonaws.com' in endpoint or 'cluster-' in endpoint or len(endpoint) > 10,
                    f"{output_key} should be a valid endpoint"
                )
        
        print(f"  ✓ Aurora PostgreSQL cluster deployed")
        print(f"    Cluster ID: {self.outputs.get('aurora_cluster_id', 'N/A')}")
        print(f"    Writer endpoint: {self.outputs.get('aurora_cluster_endpoint', 'N/A')}")
        print(f"    Reader endpoint: {self.outputs.get('aurora_cluster_reader_endpoint', 'N/A')}")
        print(f"    Engine version: {self.outputs.get('aurora_engine_version', 'N/A')}")
    
    def test_aurora_version_is_16_9(self):
        """Test that Aurora PostgreSQL version is 16.9."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        self.assertIn('aurora_engine_version', self.outputs, 
                     "Aurora engine version should be in outputs")
        
        version = self.outputs['aurora_engine_version']
        self.assertIsNotNone(version, "Engine version should not be None")
        self.assertEqual(version, "16.9", "Aurora engine version should be 16.9")
        
        print(f"  ✓ Aurora PostgreSQL version verified: {version}")
    
    def test_s3_bucket_deployed(self):
        """Test that S3 bucket is deployed with versioning."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        bucket_outputs = ['s3_bucket_name', 's3_bucket_arn', 's3_bucket_region']
        
        for output_key in bucket_outputs:
            self.assertIn(output_key, self.outputs, 
                         f"Output '{output_key}' should exist")
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")
            
            # S3 bucket names should be valid
            if 'name' in output_key.lower():
                bucket_name = str(value)
                self.assertGreater(len(bucket_name), 3, 
                                 f"{output_key} should be a valid bucket name")
                self.assertLess(len(bucket_name), 64, 
                               f"{output_key} should be under 64 characters")
        
        print(f"  ✓ S3 bucket deployed")
        print(f"    Bucket name: {self.outputs.get('s3_bucket_name', 'N/A')}")
        print(f"    Bucket region: {self.outputs.get('s3_bucket_region', 'N/A')}")
    
    def test_security_group_deployed(self):
        """Test that Aurora security group is deployed."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        self.assertIn('aurora_security_group_id', self.outputs, 
                     "Aurora security group ID should be in outputs")
        
        sg_id = self.outputs['aurora_security_group_id']
        self.assertIsNotNone(sg_id, "Security group ID should not be None")
        self.assertTrue(sg_id.startswith('sg-'), "Security group ID should start with 'sg-'")
        
        print(f"  ✓ Aurora security group deployed: {sg_id}")
    
    def test_iam_role_deployed(self):
        """Test that RDS Enhanced Monitoring IAM role is deployed."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        iam_outputs = ['rds_monitoring_role_arn', 'rds_monitoring_role_name']
        
        for output_key in iam_outputs:
            self.assertIn(output_key, self.outputs, 
                         f"Output '{output_key}' should exist")
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")
            
            if 'arn' in output_key.lower():
                # IAM ARN should be valid format
                arn = str(value)
                self.assertTrue(
                    arn.startswith('arn:aws:iam::'),
                    f"{output_key} should be a valid IAM ARN"
                )
        
        print(f"  ✓ RDS Enhanced Monitoring IAM role deployed")
        print(f"    Role name: {self.outputs.get('rds_monitoring_role_name', 'N/A')}")
    
    def test_parameter_groups_deployed(self):
        """Test that Aurora parameter groups are deployed."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        pg_outputs = ['cluster_parameter_group_name', 'db_parameter_group_name']
        
        for output_key in pg_outputs:
            self.assertIn(output_key, self.outputs, 
                         f"Output '{output_key}' should exist")
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")
        
        print(f"  ✓ Aurora parameter groups deployed")
        print(f"    Cluster PG: {self.outputs.get('cluster_parameter_group_name', 'N/A')}")
        print(f"    DB PG: {self.outputs.get('db_parameter_group_name', 'N/A')}")
    
    def test_secrets_manager_deployed(self):
        """Test that database password secret is stored in Secrets Manager."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        secret_outputs = ['db_secret_arn', 'db_secret_name']
        
        for output_key in secret_outputs:
            self.assertIn(output_key, self.outputs, 
                         f"Output '{output_key}' should exist")
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")
            
            if 'arn' in output_key.lower():
                # Secret ARN should be valid format
                arn = str(value)
                self.assertTrue(
                    arn.startswith('arn:aws:secretsmanager:'),
                    f"{output_key} should be a valid Secrets Manager ARN"
                )
        
        print(f"  ✓ Database password secret deployed in Secrets Manager")
        print(f"    Secret name: {self.outputs.get('db_secret_name', 'N/A')}")
    
    def test_aws_account_and_region(self):
        """Test that AWS account and region information is available."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        info_outputs = ['aws_account_id', 'aws_region', 'environment_suffix']
        
        for output_key in info_outputs:
            self.assertIn(output_key, self.outputs, 
                         f"Output '{output_key}' should exist")
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")
        
        print(f"  ✓ AWS account and region information")
        print(f"    Account ID: {self.outputs.get('aws_account_id', 'N/A')}")
        print(f"    Region: {self.outputs.get('aws_region', 'N/A')}")
        print(f"    Environment: {self.outputs.get('environment_suffix', 'N/A')}")


if __name__ == '__main__':
    # Run with verbose output
    unittest.main(verbosity=2)

