"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import json
import os
import boto3


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    def setUp(self):
        """Set up integration test with live stack."""
        # Load deployment outputs
        outputs_file = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )
        with open(outputs_file, 'r', encoding='utf-8') as f:
            self.outputs = json.load(f)

        # Initialize AWS clients
        self.region = os.getenv('AWS_REGION', 'us-east-1')
        self.ec2 = boto3.client('ec2', region_name=self.region)
        self.elbv2 = boto3.client('elbv2', region_name=self.region)
        self.rds = boto3.client('rds', region_name=self.region)
        self.s3 = boto3.client('s3', region_name=self.region)
        self.sns = boto3.client('sns', region_name=self.region)
        self.asg = boto3.client('autoscaling', region_name=self.region)
        self.cloudwatch = boto3.client('cloudwatch', region_name=self.region)

    def test_vpc_exists(self):
        """Test VPC was created successfully."""
        vpc_id = self.outputs['vpc_id']
        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['VpcId'], vpc_id)
        # Check VPC DNS attributes
        dns_support = self.ec2.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        dns_hostnames = self.ec2.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])

    def test_subnets_exist(self):
        """Test subnets were created in multiple AZs."""
        vpc_id = self.outputs['vpc_id']
        response = self.ec2.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnets = response['Subnets']
        # Should have 4 subnets (2 public, 2 private)
        self.assertGreaterEqual(len(subnets), 4)
        # Verify subnets span multiple AZs
        azs = set(s['AvailabilityZone'] for s in subnets)
        self.assertGreaterEqual(len(azs), 2)

    def test_alb_exists_and_healthy(self):
        """Test ALB exists and is accessible."""
        alb_dns = self.outputs['alb_dns_name']
        # Describe ALBs containing the DNS name
        response = self.elbv2.describe_load_balancers()
        alb = next((lb for lb in response['LoadBalancers']
                   if lb['DNSName'] == alb_dns), None)
        self.assertIsNotNone(alb, "ALB not found")
        self.assertEqual(alb['State']['Code'], 'active')
        self.assertEqual(alb['Scheme'], 'internet-facing')
        self.assertEqual(alb['Type'], 'application')

    def test_alb_target_group(self):
        """Test ALB target group is configured correctly."""
        alb_dns = self.outputs['alb_dns_name']
        response = self.elbv2.describe_load_balancers()
        alb = next((lb for lb in response['LoadBalancers']
                   if lb['DNSName'] == alb_dns), None)

        # Get target groups for this ALB
        tg_response = self.elbv2.describe_target_groups(
            LoadBalancerArn=alb['LoadBalancerArn']
        )
        self.assertGreater(len(tg_response['TargetGroups']), 0)
        target_group = tg_response['TargetGroups'][0]
        self.assertEqual(target_group['Protocol'], 'HTTP')
        self.assertEqual(target_group['Port'], 80)

    def test_rds_instance_exists(self):
        """Test RDS instance was created successfully."""
        rds_endpoint = self.outputs['rds_endpoint']
        # Extract instance identifier from endpoint
        db_identifier = rds_endpoint.split('.')[0]
        response = self.rds.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )
        self.assertEqual(len(response['DBInstances']), 1)
        db = response['DBInstances'][0]
        self.assertEqual(db['DBInstanceStatus'], 'available')
        self.assertEqual(db['Engine'], 'mysql')
        self.assertTrue(db['StorageEncrypted'])

    def test_s3_buckets_exist(self):
        """Test S3 buckets were created with proper configuration."""
        bucket_name = self.outputs['static_assets_bucket']
        # Check bucket exists
        response = self.s3.head_bucket(Bucket=bucket_name)
        self.assertIn('ResponseMetadata', response)
        # Check encryption
        encryption = self.s3.get_bucket_encryption(Bucket=bucket_name)
        self.assertIn('ServerSideEncryptionConfiguration', encryption)
        # Check public access block
        public_access = self.s3.get_public_access_block(Bucket=bucket_name)
        self.assertTrue(
            public_access['PublicAccessBlockConfiguration']['BlockPublicAcls']
        )

    def test_sns_topic_exists(self):
        """Test SNS topic for alarms was created."""
        topic_arn = self.outputs['sns_topic_arn']
        response = self.sns.get_topic_attributes(TopicArn=topic_arn)
        self.assertIn('Attributes', response)
        self.assertEqual(response['Attributes']['TopicArn'], topic_arn)

    def test_auto_scaling_group_exists(self):
        """Test Auto Scaling Group was created and is running."""
        # Find ASG by tags or name pattern
        response = self.asg.describe_auto_scaling_groups()
        asgs = [asg for asg in response['AutoScalingGroups']
                if 'synth101000880' in asg['AutoScalingGroupName']]
        self.assertGreater(len(asgs), 0, "Auto Scaling Group not found")
        asg = asgs[0]
        self.assertGreaterEqual(asg['MinSize'], 1)
        self.assertGreaterEqual(asg['MaxSize'], asg['MinSize'])

    def test_cloudwatch_alarms_exist(self):
        """Test CloudWatch alarms were created."""
        response = self.cloudwatch.describe_alarms(
            AlarmNamePrefix='alb-'
        )
        alb_alarms = [a for a in response['MetricAlarms']
                     if 'synth101000880' in a['AlarmName']]
        # Should have at least ALB response time, error rate, and unhealthy targets
        self.assertGreaterEqual(len(alb_alarms), 3)

    def test_nat_gateway_exists(self):
        """Test NAT Gateway exists for private subnet internet access."""
        vpc_id = self.outputs['vpc_id']
        response = self.ec2.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )
        self.assertGreater(len(response['NatGateways']), 0)

    def test_internet_gateway_exists(self):
        """Test Internet Gateway is attached to VPC."""
        vpc_id = self.outputs['vpc_id']
        response = self.ec2.describe_internet_gateways(
            Filters=[
                {'Name': 'attachment.vpc-id', 'Values': [vpc_id]}
            ]
        )
        self.assertEqual(len(response['InternetGateways']), 1)


if __name__ == '__main__':
    unittest.main()
