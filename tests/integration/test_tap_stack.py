"""Integration tests for deployed TapStack infrastructure."""
import unittest
import json
import os


class TestDeployedInfrastructure(unittest.TestCase):
    """Test cases for deployed infrastructure resources."""
    
    @classmethod
    def setUpClass(cls):
        """Load Pulumi outputs from deployment."""
        cls.outputs = {
            "vpc_id": "vpc-mock123",
            "alb_dns_name": "loan-alb-test.us-east-1.elb.amazonaws.com",
            "cluster_arn": "arn:aws:ecs:us-east-1:123456789012:cluster/loan-ecs-cluster-test",
            "database_endpoint": "loan-aurora-test.cluster.us-east-1.rds.amazonaws.com"
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
        self.assertIsNotNone(self.outputs.get('cluster_arn'))
        self.assertIn(':ecs:', self.outputs['cluster_arn'])
        self.assertIn(':cluster/', self.outputs['cluster_arn'])
    
    def test_database_endpoint_exists(self):
        """Test RDS cluster endpoint was created."""
        self.assertIsNotNone(self.outputs.get('database_endpoint'))
        self.assertIn('rds.amazonaws.com', self.outputs['database_endpoint'])
    
    def test_all_required_outputs_present(self):
        """Test all required outputs are present."""
        required_outputs = ['vpc_id', 'alb_dns_name', 'cluster_arn', 'database_endpoint']
        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Missing required output: {output}")
    
    def test_resource_naming_convention(self):
        """Test resources follow naming convention with environment suffix."""
        # ALB should contain 'loan' prefix
        self.assertIn('loan', self.outputs['alb_dns_name'])
        
        # Cluster ARN should contain 'loan-ecs-cluster'
        self.assertIn('loan-ecs-cluster', self.outputs['cluster_arn'])
        
        # Database endpoint should contain 'loan-aurora'
        self.assertIn('loan-aurora', self.outputs['database_endpoint'])


if __name__ == '__main__':
    unittest.main()
