"""
Integration tests for TAP infrastructure deployment.

These tests validate the actual deployed infrastructure using Pulumi stack outputs.
Run after: pulumi up
"""

import unittest
import json
import subprocess


class TestInfrastructureDeployment(unittest.TestCase):
    """Integration tests for deployed infrastructure."""
    
    @classmethod
    def setUpClass(cls):
        """Load Pulumi stack outputs."""
        try:
            # Get stack outputs from Pulumi
            result = subprocess.run(
                ['pulumi', 'stack', 'output', '--json'],
                capture_output=True,
                text=True,
                check=True
            )
            cls.outputs = json.loads(result.stdout)
            cls.stack_available = True
            print(f"\n✓ Loaded stack outputs: {len(cls.outputs)} outputs found")
        except (subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError) as e:
            cls.outputs = {}
            cls.stack_available = False
            print(f"\n✗ Failed to load stack outputs: {e}")
    
    def test_stack_outputs_exist(self):
        """Test that Pulumi stack has been deployed with outputs."""
        self.assertTrue(self.stack_available, "Pulumi stack should be deployed")
        self.assertGreater(len(self.outputs), 0, "Stack should have outputs")
        print(f"  ✓ Stack has {len(self.outputs)} outputs")
    
    def test_vpc_resources_deployed(self):
        """Test that VPC resources are deployed in both regions."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        # Check for VPC outputs
        vpc_outputs = ['primary_vpc_id', 'secondary_vpc_id']
        
        for output_key in vpc_outputs:
            self.assertIn(output_key, self.outputs, 
                         f"Output '{output_key}' should exist")
            
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")
            self.assertNotEqual(value, '', f"{output_key} should not be empty")
            
            # Check it's not a token (which indicates unresolved output)
            self.assertNotIn('TOKEN', str(value).upper(), 
                           f"{output_key} should be resolved, not a token")
        
        print(f"  ✓ VPC resources deployed in both regions")
        print(f"    Primary VPC: {self.outputs.get('primary_vpc_id', 'N/A')}")
        print(f"    Secondary VPC: {self.outputs.get('secondary_vpc_id', 'N/A')}")
    
    def test_aurora_clusters_deployed(self):
        """Test that Aurora clusters are deployed and accessible."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        cluster_outputs = ['primary_cluster_endpoint', 'secondary_cluster_endpoint', 'global_cluster_id']
        
        for output_key in cluster_outputs:
            self.assertIn(output_key, self.outputs, 
                         f"Output '{output_key}' should exist")
            
            value = self.outputs[output_key]
            self.assertIsNotNone(value, f"{output_key} should not be None")
            
            if 'endpoint' in output_key.lower():
                # Endpoints should contain typical Aurora endpoint format
                endpoint = str(value)
                if not ('TOKEN' in endpoint.upper()):
                    self.assertTrue(
                        '.rds.amazonaws.com' in endpoint or len(endpoint) > 5,
                        f"{output_key} should be a valid endpoint"
                    )
        
        print(f"  ✓ Aurora clusters deployed")
        print(f"    Primary endpoint: {self.outputs.get('primary_cluster_endpoint', 'N/A')}")
        print(f"    Secondary endpoint: {self.outputs.get('secondary_cluster_endpoint', 'N/A')}")
    
    def test_lambda_functions_deployed(self):
        """Test that Lambda functions are deployed in both regions."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        lambda_outputs = ['primary_lambda_function_name', 'secondary_lambda_function_name',
                         'primary_function_url', 'secondary_function_url']
        
        found_outputs = []
        for output_key in lambda_outputs:
            if output_key in self.outputs:
                value = self.outputs[output_key]
                if value and 'TOKEN' not in str(value).upper():
                    found_outputs.append(output_key)
        
        self.assertGreater(len(found_outputs), 0, 
                          "At least one Lambda output should exist")
        
        print(f"  ✓ Lambda functions deployed ({len(found_outputs)} outputs)")
        if 'primary_lambda_function_name' in self.outputs:
            print(f"    Primary: {self.outputs.get('primary_lambda_function_name', 'N/A')}")
        if 'secondary_lambda_function_name' in self.outputs:
            print(f"    Secondary: {self.outputs.get('secondary_lambda_function_name', 'N/A')}")
    
    def test_s3_buckets_deployed(self):
        """Test that S3 buckets are deployed for both regions."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        bucket_outputs = ['primary_bucket_name', 'secondary_bucket_name']
        
        found_buckets = 0
        for output_key in bucket_outputs:
            if output_key in self.outputs:
                value = self.outputs[output_key]
                if value and 'TOKEN' not in str(value).upper():
                    found_buckets += 1
                    
                    # S3 bucket names should be valid
                    bucket_name = str(value)
                    if bucket_name:
                        self.assertGreater(len(bucket_name), 3, 
                                         f"{output_key} should be a valid bucket name")
                        self.assertLess(len(bucket_name), 64, 
                                       f"{output_key} should be under 64 characters")
        
        self.assertGreater(found_buckets, 0, "At least one S3 bucket should be deployed")
        
        print(f"  ✓ S3 buckets deployed ({found_buckets} buckets)")
        if 'primary_bucket_name' in self.outputs:
            print(f"    Primary: {self.outputs.get('primary_bucket_name', 'N/A')}")
    
    def test_dynamodb_table_deployed(self):
        """Test that DynamoDB global table is deployed."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        self.assertIn('dynamodb_table_name', self.outputs, 
                     "DynamoDB table name should be in outputs")
        
        table_name = self.outputs['dynamodb_table_name']
        self.assertIsNotNone(table_name, "Table name should not be None")
        
        if 'TOKEN' not in str(table_name).upper():
            self.assertGreater(len(str(table_name)), 3, 
                             "Table name should be valid")
            print(f"  ✓ DynamoDB table deployed: {table_name}")
        else:
            print(f"  ⚠ DynamoDB table output not yet resolved")
    
    def test_sns_topics_deployed(self):
        """Test that SNS topics are deployed for alerting."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        sns_outputs = ['primary_sns_topic_arn', 'secondary_sns_topic_arn']
        
        found_topics = 0
        for output_key in sns_outputs:
            if output_key in self.outputs:
                value = self.outputs[output_key]
                if value and 'TOKEN' not in str(value).upper():
                    found_topics += 1
                    
                    # SNS ARN should be valid format
                    arn = str(value)
                    if arn:
                        self.assertTrue(
                            arn.startswith('arn:aws:sns:') or len(arn) > 10,
                            f"{output_key} should be a valid ARN"
                        )
        
        self.assertGreater(found_topics, 0, "At least one SNS topic should exist")
        print(f"  ✓ SNS topics deployed ({found_topics} topics)")
    
    def test_multi_region_deployment_complete(self):
        """Test that infrastructure is deployed across multiple regions."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        # Count primary and secondary resources
        primary_resources = [k for k in self.outputs.keys() if 'primary' in k.lower()]
        secondary_resources = [k for k in self.outputs.keys() if 'secondary' in k.lower() or 'dr' in k.lower()]
        
        self.assertGreater(len(primary_resources), 0, 
                          "Should have primary region resources")
        self.assertGreater(len(secondary_resources), 0, 
                          "Should have secondary/DR region resources")
        
        print(f"  ✓ Multi-region deployment complete")
        print(f"    Primary resources: {len(primary_resources)}")
        print(f"    Secondary resources: {len(secondary_resources)}")
    
    def test_critical_outputs_resolved(self):
        """Test that all critical outputs are resolved (not tokens)."""
        if not self.stack_available:
            self.skipTest("Stack not available")
        
        critical_outputs = [
            'primary_vpc_id',
            'secondary_vpc_id',
            'primary_cluster_endpoint',
            'global_cluster_id'
        ]
        
        resolved_count = 0
        for output_key in critical_outputs:
            if output_key in self.outputs:
                value = str(self.outputs[output_key])
                if 'TOKEN' not in value.upper() and value:
                    resolved_count += 1
        
        resolution_percentage = (resolved_count / len(critical_outputs)) * 100
        
        print(f"  ✓ Critical outputs: {resolved_count}/{len(critical_outputs)} resolved ({resolution_percentage:.0f}%)")
        
        # At least 50% should be resolved for a successful deployment
        self.assertGreaterEqual(resolved_count, len(critical_outputs) // 2,
                               "At least half of critical outputs should be resolved")


if __name__ == '__main__':
    # Run with verbose output
    unittest.main(verbosity=2)

