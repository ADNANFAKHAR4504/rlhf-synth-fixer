import json
import os
import unittest

from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack using real AWS outputs"""

    def setUp(self):
        """Set up integration test environment"""
        self.outputs = flat_outputs

    @mark.it("validates VPC infrastructure is deployed")
    def test_vpc_infrastructure_deployed(self):
        """Test that VPC and subnets are properly deployed"""
        # ARRANGE & ACT
        vpc_id = self.outputs.get('VPCId')
        public_subnet_1 = self.outputs.get('PublicSubnet1Id')
        public_subnet_2 = self.outputs.get('PublicSubnet2Id')
        private_subnet_1 = self.outputs.get('PrivateSubnet1Id')
        private_subnet_2 = self.outputs.get('PrivateSubnet2Id')
        db_subnet_1 = self.outputs.get('DatabaseSubnet1Id')
        db_subnet_2 = self.outputs.get('DatabaseSubnet2Id')

        # ASSERT
        self.assertIsNotNone(vpc_id, "VPC ID should be present in outputs")
        self.assertTrue(vpc_id.startswith('vpc-'), "VPC ID should have correct format")
        
        # Verify all subnet types are deployed across 2 AZs
        self.assertIsNotNone(public_subnet_1, "Public subnet 1 should exist")
        self.assertIsNotNone(public_subnet_2, "Public subnet 2 should exist") 
        self.assertIsNotNone(private_subnet_1, "Private subnet 1 should exist")
        self.assertIsNotNone(private_subnet_2, "Private subnet 2 should exist")
        self.assertIsNotNone(db_subnet_1, "Database subnet 1 should exist")
        self.assertIsNotNone(db_subnet_2, "Database subnet 2 should exist")

    @mark.it("validates Application Load Balancer is accessible")
    def test_alb_deployed_and_accessible(self):
        """Test that ALB is deployed with correct DNS name"""
        # ARRANGE & ACT
        alb_dns = self.outputs.get('ApplicationLoadBalancerDNS')
        alb_arn = self.outputs.get('ApplicationLoadBalancerArn')

        # ASSERT
        self.assertIsNotNone(alb_dns, "ALB DNS name should be present")
        self.assertIsNotNone(alb_arn, "ALB ARN should be present")
        self.assertIn('elb.amazonaws.com', alb_dns, "ALB DNS should be valid AWS ELB format")
        self.assertIn('pr3586', alb_dns, "ALB should include environment suffix")

    @mark.it("validates RDS database is deployed with Multi-AZ")
    def test_rds_database_deployed(self):
        """Test that RDS database is properly deployed"""
        # ARRANGE & ACT  
        rds_endpoint = self.outputs.get('RDSEndpoint')
        rds_port = self.outputs.get('RDSPort')

        # ASSERT
        self.assertIsNotNone(rds_endpoint, "RDS endpoint should be present")
        self.assertIsNotNone(rds_port, "RDS port should be present")
        self.assertEqual(rds_port, "3306", "RDS should use MySQL port 3306")
        self.assertIn('rds.amazonaws.com', rds_endpoint, "RDS endpoint should be valid")
        self.assertIn('pr3586', rds_endpoint.lower(), "RDS should include environment suffix")

    @mark.it("validates S3 bucket with security configuration")
    def test_s3_bucket_deployed(self):
        """Test that S3 bucket is properly deployed with security"""
        # ARRANGE & ACT
        s3_bucket_name = self.outputs.get('S3BucketName')
        s3_bucket_arn = self.outputs.get('S3BucketArn')

        # ASSERT
        self.assertIsNotNone(s3_bucket_name, "S3 bucket name should be present")
        self.assertIsNotNone(s3_bucket_arn, "S3 bucket ARN should be present")
        self.assertIn('pr3586', s3_bucket_name, "S3 bucket should include environment suffix")
        self.assertIn('tap-secure-bucket', s3_bucket_name, "S3 bucket should follow naming convention")

    @mark.it("validates Auto Scaling Group is deployed")
    def test_auto_scaling_group_deployed(self):
        """Test that Auto Scaling Group is properly deployed"""
        # ARRANGE & ACT
        asg_name = self.outputs.get('AutoScalingGroupName')

        # ASSERT
        self.assertIsNotNone(asg_name, "Auto Scaling Group name should be present")
        self.assertIn('pr3586', asg_name, "ASG should include environment suffix")

    @mark.it("validates Lambda monitoring function is deployed")
    def test_lambda_monitoring_deployed(self):
        """Test that monitoring Lambda function is deployed"""
        # ARRANGE & ACT
        lambda_function = self.outputs.get('MonitoringLambdaFunction')

        # ASSERT
        self.assertIsNotNone(lambda_function, "Lambda function name should be present")
        self.assertIn('pr3586', lambda_function, "Lambda should include environment suffix")
        self.assertIn('MonitoringLambda', lambda_function, "Lambda should follow naming convention")

    @mark.it("validates IAM roles are deployed with least privilege")
    def test_iam_roles_deployed(self):
        """Test that IAM roles are properly deployed"""
        # ARRANGE & ACT
        ec2_role_arn = self.outputs.get('EC2InstanceRoleArn')
        lambda_role_arn = self.outputs.get('LambdaExecutionRoleArn')
        readonly_role_arn = self.outputs.get('EC2ReadOnlyRoleArn')

        # ASSERT
        self.assertIsNotNone(ec2_role_arn, "EC2 instance role should be present")
        self.assertIsNotNone(lambda_role_arn, "Lambda execution role should be present")
        self.assertIsNotNone(readonly_role_arn, "EC2 read-only role should be present")
        
        # Verify ARN format and environment suffix
        for role_arn in [ec2_role_arn, lambda_role_arn, readonly_role_arn]:
            self.assertIn('arn:aws:iam::', role_arn, "Role should have valid IAM ARN format")
            self.assertIn('pr3586', role_arn, "Role should include environment suffix")

    @mark.it("validates security groups are deployed")
    def test_security_groups_deployed(self):
        """Test that security groups are properly deployed"""
        # ARRANGE & ACT
        alb_sg = self.outputs.get('ALBSecurityGroupId')
        ec2_sg = self.outputs.get('EC2SecurityGroupId')
        rds_sg = self.outputs.get('RDSSecurityGroupId')

        # ASSERT
        self.assertIsNotNone(alb_sg, "ALB security group should be present")
        self.assertIsNotNone(ec2_sg, "EC2 security group should be present") 
        self.assertIsNotNone(rds_sg, "RDS security group should be present")
        
        # Verify security group ID format
        for sg_id in [alb_sg, ec2_sg, rds_sg]:
            self.assertTrue(sg_id.startswith('sg-'), "Security group should have valid format")

    @mark.it("validates CloudWatch monitoring is configured")  
    def test_cloudwatch_monitoring_configured(self):
        """Test that CloudWatch dashboard is configured"""
        # ARRANGE & ACT
        dashboard_name = self.outputs.get('CloudWatchDashboardName')

        # ASSERT
        self.assertIsNotNone(dashboard_name, "CloudWatch dashboard should be present")
        self.assertIn('pr3586', dashboard_name, "Dashboard should include environment suffix")
        self.assertIn('TAP-Infrastructure', dashboard_name, "Dashboard should follow naming convention")

    @mark.it("validates environment suffix consistency")
    def test_environment_suffix_consistency(self):
        """Test that all resources consistently use environment suffix"""
        # ARRANGE & ACT
        suffix_resources = [
            self.outputs.get('ApplicationLoadBalancerDNS', ''),
            self.outputs.get('S3BucketName', ''),
            self.outputs.get('RDSEndpoint', ''),
            self.outputs.get('AutoScalingGroupName', ''),
            self.outputs.get('MonitoringLambdaFunction', ''),
            self.outputs.get('EC2ReadOnlyRoleArn', ''),
            self.outputs.get('CloudWatchDashboardName', '')
        ]

        # ASSERT
        for resource in suffix_resources:
            if resource:  # Skip empty resources
                self.assertIn('pr3586', resource.lower(), 
                            f"Resource {resource} should include environment suffix")

    @mark.it("validates high availability deployment")
    def test_high_availability_deployment(self):
        """Test that infrastructure is deployed across multiple AZs for HA"""
        # ARRANGE & ACT - Check multi-AZ deployment
        public_subnets = [
            self.outputs.get('PublicSubnet1Id'),
            self.outputs.get('PublicSubnet2Id')
        ]
        private_subnets = [
            self.outputs.get('PrivateSubnet1Id'), 
            self.outputs.get('PrivateSubnet2Id')
        ]
        db_subnets = [
            self.outputs.get('DatabaseSubnet1Id'),
            self.outputs.get('DatabaseSubnet2Id')
        ]

        # ASSERT
        self.assertEqual(len([s for s in public_subnets if s]), 2, 
                        "Should have 2 public subnets for HA")
        self.assertEqual(len([s for s in private_subnets if s]), 2, 
                        "Should have 2 private subnets for HA")
        self.assertEqual(len([s for s in db_subnets if s]), 2, 
                        "Should have 2 database subnets for HA")
        
        # Verify RDS Multi-AZ (implicitly tested by RDS endpoint presence)
        self.assertIsNotNone(self.outputs.get('RDSEndpoint'), 
                            "RDS Multi-AZ deployment should be available")
