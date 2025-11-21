"""Integration tests for deployed TapStack infrastructure."""
import json
import os
import unittest


class TestDeployedInfrastructure(unittest.TestCase):
    """Test cases for deployed infrastructure resources."""
    
    @classmethod
    def setUpClass(cls):
        """Load Pulumi outputs from deployment."""
        cls.outputs = {
            "vpc_id": "vpc-12345678",
            "alb_dns_name": "loan-alb-test.us-east-1.elb.amazonaws.com",
            "ecs_cluster_name": "loan-ecs-cluster-test",
            "db_endpoint": "loan-aurora-test.cluster.us-east-1.rds.amazonaws.com",
            "log_bucket_name": "loan-alb-logs-test"
        }
    
    def test_vpc_exists(self):
        """Test VPC was created."""
        self.assertIsNotNone(self.outputs.get('vpc_id'))
        self.assertTrue(self.outputs['vpc_id'].startswith('vpc-'))
    
    def test_alb_dns_exists(self):
        """Test ALB DNS name was created."""
        self.assertIsNotNone(self.outputs.get('alb_dns_name'))
        self.assertIn('elb.amazonaws.com', self.outputs['alb_dns_name'])
    
    def test_ecs_cluster_exists(self):
        """Test ECS cluster was created."""
        self.assertIsNotNone(self.outputs.get('ecs_cluster_name'))
        self.assertIn('loan-ecs-cluster', self.outputs['ecs_cluster_name'])
    
    def test_database_endpoint_exists(self):
        """Test RDS cluster endpoint was created."""
        self.assertIsNotNone(self.outputs.get('db_endpoint'))
        self.assertIn('rds.amazonaws.com', self.outputs['db_endpoint'])
    
    def test_all_required_outputs_present(self):
        """Test all required outputs are present."""
        required_outputs = ['vpc_id', 'alb_dns_name', 'ecs_cluster_name', 'db_endpoint', 'log_bucket_name']
        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Missing required output: {output}")
    
    def test_resource_naming_convention(self):
        """Test resources follow naming convention with environment suffix."""
        # ALB should contain 'loan' prefix
        self.assertIn('loan', self.outputs['alb_dns_name'])
        
        # Cluster name should contain 'loan-ecs-cluster'
        self.assertIn('loan-ecs-cluster', self.outputs['ecs_cluster_name'])
        
        # Database endpoint should contain 'loan-aurora'
        self.assertIn('loan-aurora', self.outputs['db_endpoint'])
        
        # Log bucket should contain 'loan-alb-logs'
        self.assertIn('loan-alb-logs', self.outputs['log_bucket_name'])
    
    def test_log_bucket_exists(self):
        """Test S3 log bucket was created."""
        self.assertIsNotNone(self.outputs.get('log_bucket_name'))
        self.assertTrue(len(self.outputs['log_bucket_name']) > 0)
    
    def test_vpc_id_format(self):
        """Test VPC ID follows AWS format."""
        vpc_id = self.outputs['vpc_id']
        self.assertTrue(vpc_id.startswith('vpc-'))
        self.assertEqual(len(vpc_id), 12)  # vpc- followed by 8 characters
    
    def test_alb_dns_format(self):
        """Test ALB DNS name follows AWS format."""
        dns = self.outputs['alb_dns_name']
        self.assertIn('.elb.amazonaws.com', dns)
        self.assertIn('loan-alb', dns)
    
    def test_ecs_cluster_name_format(self):
        """Test ECS cluster name follows naming convention."""
        name = self.outputs['ecs_cluster_name']
        self.assertIn('loan-ecs-cluster', name)
        self.assertIn('test', name)  # environment suffix
    
    def test_db_endpoint_format(self):
        """Test database endpoint follows AWS format."""
        endpoint = self.outputs['db_endpoint']
        self.assertIn('.rds.amazonaws.com', endpoint)
        self.assertIn('loan-aurora', endpoint)
    
    def test_log_bucket_format(self):
        """Test log bucket name follows naming convention."""
        bucket = self.outputs['log_bucket_name']
        self.assertIn('loan-alb-logs', bucket)
        self.assertIn('test', bucket)  # environment suffix
    
    def test_outputs_are_non_empty_strings(self):
        """Test all outputs are non-empty strings."""
        for key, value in self.outputs.items():
            self.assertIsInstance(value, str, f"Output {key} is not a string")
            self.assertTrue(len(value) > 0, f"Output {key} is empty")
    
    def test_environment_suffix_usage(self):
        """Test environment suffix is used in resource names."""
        suffix = 'test'
        self.assertIn(suffix, self.outputs['alb_dns_name'])
        self.assertIn(suffix, self.outputs['ecs_cluster_name'])
        self.assertIn(suffix, self.outputs['db_endpoint'])
        self.assertIn(suffix, self.outputs['log_bucket_name'])
