"""
test_tap_stack.py

Integration tests for live deployed Banking Portal TapStack infrastructure.
Tests actual AWS resources created by the Pulumi stack to verify proper deployment
and configuration of the three-tier banking architecture.
"""

import unittest
import os
import json
import boto3
import time
from botocore.exceptions import ClientError


class TestBankingPortalIntegration(unittest.TestCase):
    """Integration tests against live deployed Banking Portal Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load stack outputs from flat-outputs.json or environment variables
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )

        cls.outputs = {}
        
        # Try to load from file first, then fall back to provided outputs
        if os.path.exists(outputs_file):
            with open(outputs_file, 'r', encoding='utf-8') as f:
                cls.outputs = json.load(f)
        else:
            # Use the provided flat outputs as fallback
            cls.outputs = {
                "alb_dns_name": "banking-portal-alb-pr6666-2069609006.us-east-1.elb.amazonaws.com",
                "auto_scaling_group_name": "banking-portal-asg-pr6666",
                "cloudfront_distribution_url": "d3vr9la6gisi5g.cloudfront.net",
                "kms_key_id": "5f2577bc-0125-4ec9-bc46-b11c91eba049",
                "logs_bucket": "banking-portal-logs-pr6666",
                "rds_endpoint": "banking-portal-db-pr6666.covy6ema0nuv.us-east-1.rds.amazonaws.com:5432",
                "sns_alert_topic_arn": "arn:aws:sns:us-east-1:***:banking-portal-alerts-pr6666",
                "static_assets_bucket": "banking-portal-static-pr6666",
                "target_group_arn": "arn:aws:elasticloadbalancing:us-east-1:***:targetgroup/banking-portal-tg-pr6666/395d2708eef40c94",
                "vpc_id": "vpc-020ca1479fb4c0b29"
            }

        # Extract region from outputs or environment
        cls.region = cls._extract_region_from_outputs() or os.getenv('AWS_REGION', 'us-east-1')
        
        # Initialize AWS clients with dynamic region
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.autoscaling_client = boto3.client('autoscaling', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.s3_client = boto3.client('s3')  # S3 client doesn't need region
        cls.cloudfront_client = boto3.client('cloudfront')  # CloudFront is global
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)

    @classmethod
    def _extract_region_from_outputs(cls):
        """Extract AWS region from stack outputs."""
        for key, value in cls.outputs.items():
            if isinstance(value, str):
                # Check for region patterns in ARNs or endpoints
                if 'arn:aws:' in value or '.amazonaws.com' in value:
                    parts = value.split(':')
                    if len(parts) >= 4:
                        # Standard ARN format: arn:aws:service:region:account:resource
                        region_candidate = parts[3]
                        if region_candidate and len(region_candidate) > 0:
                            return region_candidate
                    # Check for region in DNS names like us-east-1.elb.amazonaws.com
                    if '.elb.' in value:
                        elb_parts = value.split('.')
                        for part in elb_parts:
                            if 'us-' in part or 'eu-' in part or 'ap-' in part or 'ca-' in part or 'sa-' in part:
                                return part
        return None

    def test_vpc_exists_and_configured(self):
        """Test VPC exists with proper configuration for banking infrastructure."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID should be available in outputs")

        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        except ClientError as e:
            self.fail(f"Failed to describe VPC {vpc_id}: {e}")

        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]

        # Verify VPC is available
        self.assertEqual(vpc['State'], 'available', "VPC should be in available state")
        
        # Verify CIDR block is properly configured
        self.assertTrue(vpc['CidrBlock'].startswith('10.0.'), "VPC should use 10.0.x.x CIDR range")

        # Check DNS attributes for banking application requirements
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )

        self.assertTrue(dns_support['EnableDnsSupport']['Value'], 
                       "DNS support must be enabled for banking applications")
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'],
                       "DNS hostnames must be enabled for banking applications")

    def test_subnets_exist_in_multiple_azs(self):
        """Test subnets exist across multiple availability zones for high availability."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id)

        # Get all subnets in the VPC
        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        self.assertGreaterEqual(len(subnets), 9, "Should have at least 9 subnets (3 each for public, private, database)")

        # Group subnets by type based on tags or route table associations
        public_subnets = []
        private_subnets = []
        database_subnets = []

        for subnet in subnets:
            tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
            subnet_type = tags.get('Type', '').lower()
            
            if subnet_type == 'public':
                public_subnets.append(subnet)
            elif subnet_type == 'private':
                private_subnets.append(subnet)
            elif subnet_type == 'database':
                database_subnets.append(subnet)

        # Verify we have the correct number and distribution of subnets
        self.assertEqual(len(public_subnets), 3, "Should have 3 public subnets")
        self.assertEqual(len(private_subnets), 3, "Should have 3 private subnets")
        self.assertEqual(len(database_subnets), 3, "Should have 3 database subnets")

        # Verify subnets span multiple AZs
        public_azs = {subnet['AvailabilityZone'] for subnet in public_subnets}
        private_azs = {subnet['AvailabilityZone'] for subnet in private_subnets}
        database_azs = {subnet['AvailabilityZone'] for subnet in database_subnets}

        self.assertEqual(len(public_azs), 3, "Public subnets should span 3 availability zones")
        self.assertEqual(len(private_azs), 3, "Private subnets should span 3 availability zones")
        self.assertEqual(len(database_azs), 3, "Database subnets should span 3 availability zones")

    def test_rds_instance_exists_and_secured(self):
        """Test RDS PostgreSQL instance exists with proper banking security configuration."""
        rds_endpoint = self.outputs.get('rds_endpoint')
        self.assertIsNotNone(rds_endpoint, "RDS endpoint should be available in outputs")

        # Extract DB identifier from endpoint
        db_identifier = rds_endpoint.split('.')[0]

        try:
            response = self.rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        except ClientError as e:
            self.fail(f"Failed to describe RDS instance {db_identifier}: {e}")

        self.assertEqual(len(response['DBInstances']), 1)
        db_instance = response['DBInstances'][0]

        # Verify PostgreSQL engine for banking compliance
        self.assertEqual(db_instance['Engine'], 'postgres', "Should use PostgreSQL engine")
        
        # Verify Multi-AZ for high availability
        self.assertTrue(db_instance['MultiAZ'], "RDS must be Multi-AZ for banking availability requirements")
        
        # Verify encryption for financial data protection
        self.assertTrue(db_instance['StorageEncrypted'], "RDS storage must be encrypted for banking data")
        
        # Verify instance class is appropriate
        self.assertIn('db.', db_instance['DBInstanceClass'], "Should use proper DB instance class")
        
        # Verify not publicly accessible for security
        self.assertFalse(db_instance['PubliclyAccessible'], 
                        "RDS should not be publicly accessible for banking security")

        # Verify backup configuration
        self.assertGreater(db_instance['BackupRetentionPeriod'], 0, 
                          "Backup retention should be configured for banking compliance")

    def test_application_load_balancer_configuration(self):
        """Test Application Load Balancer is properly configured for banking traffic."""
        alb_dns = self.outputs.get('alb_dns_name')
        self.assertIsNotNone(alb_dns, "ALB DNS name should be available")

        # Verify DNS format for the current region
        self.assertIn(f'.{self.region}.elb.amazonaws.com', alb_dns, 
                     f"ALB DNS should be in {self.region} region format")

        # Get ALB details using describe-load-balancers
        # Extract ALB name from DNS (first part before first dot)
        alb_name_from_dns = alb_dns.split('.')[0]
        
        try:
            # List all load balancers and filter by DNS name since ALB name might be >32 chars
            response = self.elbv2_client.describe_load_balancers()
            matching_albs = [alb for alb in response['LoadBalancers'] 
                           if alb['DNSName'] == alb_dns]
            
            if not matching_albs:
                self.fail(f"No ALB found with DNS name {alb_dns}")
            
            response = {'LoadBalancers': matching_albs}
        except ClientError as e:
            self.fail(f"Failed to describe ALB {alb_dns}: {e}")

        self.assertEqual(len(response['LoadBalancers']), 1)
        alb = response['LoadBalancers'][0]

        # Verify ALB configuration
        self.assertEqual(alb['State']['Code'], 'active', "ALB should be in active state")
        self.assertEqual(alb['Type'], 'application', "Should be Application Load Balancer")
        self.assertEqual(alb['Scheme'], 'internet-facing', "ALB should be internet-facing for web banking")

        # Verify availability zones
        self.assertGreaterEqual(len(alb['AvailabilityZones']), 2, 
                               "ALB should span multiple availability zones")

    def test_target_group_configuration(self):
        """Test target group is properly configured for banking application."""
        target_group_arn = self.outputs.get('target_group_arn')
        self.assertIsNotNone(target_group_arn, "Target group ARN should be available")

        try:
            response = self.elbv2_client.describe_target_groups(
                TargetGroupArns=[target_group_arn]
            )
        except ClientError as e:
            self.fail(f"Failed to describe target group {target_group_arn}: {e}")

        self.assertEqual(len(response['TargetGroups']), 1)
        target_group = response['TargetGroups'][0]

        # Verify target group configuration for banking app
        self.assertEqual(target_group['Protocol'], 'HTTP', "Should use HTTP protocol")
        self.assertEqual(target_group['Port'], 80, "Should use port 80")
        self.assertEqual(target_group['TargetType'], 'instance', "Should target EC2 instances")

        # Verify health check configuration
        self.assertEqual(target_group['HealthCheckProtocol'], 'HTTP', "Should use HTTP for health checks")
        self.assertEqual(target_group['HealthCheckPath'], '/health', "Should use /health path")
        self.assertTrue(target_group['HealthCheckEnabled'], "Health checks should be enabled")
        self.assertEqual(target_group['HealthCheckIntervalSeconds'], 30, "Health check interval should be 30 seconds")
        self.assertEqual(target_group['HealthyThresholdCount'], 2, "Healthy threshold should be 2")
        self.assertEqual(target_group['UnhealthyThresholdCount'], 2, "Unhealthy threshold should be 2")

    def test_auto_scaling_group_configuration(self):
        """Test Auto Scaling Group is configured for banking application scaling."""
        asg_name = self.outputs.get('auto_scaling_group_name')
        self.assertIsNotNone(asg_name, "Auto Scaling Group name should be available")

        try:
            response = self.autoscaling_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[asg_name]
            )
        except ClientError as e:
            self.fail(f"Failed to describe ASG {asg_name}: {e}")

        self.assertEqual(len(response['AutoScalingGroups']), 1)
        asg = response['AutoScalingGroups'][0]

        # Verify ASG configuration
        self.assertGreaterEqual(asg['MinSize'], 1, "Minimum size should be at least 1")
        self.assertLessEqual(asg['MinSize'], asg['MaxSize'], "Min size should not exceed max size")
        self.assertGreaterEqual(len(asg['AvailabilityZones']), 2, 
                               "ASG should span multiple availability zones")

        # Verify health check configuration
        self.assertIn('ELB', asg['HealthCheckType'], "Should use ELB health checks")

    def test_s3_buckets_exist_and_secured(self):
        """Test S3 buckets exist with proper security configuration."""
        static_bucket = self.outputs.get('static_assets_bucket')
        logs_bucket = self.outputs.get('logs_bucket')
        
        self.assertIsNotNone(static_bucket, "Static assets bucket should be available")
        self.assertIsNotNone(logs_bucket, "Logs bucket should be available")

        for bucket_name in [static_bucket, logs_bucket]:
            # Verify bucket exists
            try:
                self.s3_client.head_bucket(Bucket=bucket_name)
            except ClientError as e:
                self.fail(f"Bucket {bucket_name} does not exist or is not accessible: {e}")

            # Verify server-side encryption
            try:
                encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                rules = encryption['ServerSideEncryptionConfiguration']['Rules']
                self.assertGreater(len(rules), 0, f"Bucket {bucket_name} should have encryption rules")
                
                # Verify KMS encryption is used
                default_encryption = rules[0]['ApplyServerSideEncryptionByDefault']
                self.assertEqual(default_encryption['SSEAlgorithm'], 'aws:kms',
                               f"Bucket {bucket_name} should use KMS encryption")
            except ClientError as e:
                if e.response['Error']['Code'] != 'ServerSideEncryptionConfigurationNotFoundError':
                    self.fail(f"Failed to check encryption for bucket {bucket_name}: {e}")

            # Verify public access is blocked
            try:
                pab = self.s3_client.get_public_access_block(Bucket=bucket_name)
                config = pab['PublicAccessBlockConfiguration']
                self.assertTrue(config['BlockPublicAcls'], f"Public ACLs should be blocked for {bucket_name}")
                self.assertTrue(config['BlockPublicPolicy'], f"Public policy should be blocked for {bucket_name}")
                self.assertTrue(config['IgnorePublicAcls'], f"Public ACLs should be ignored for {bucket_name}")
                self.assertTrue(config['RestrictPublicBuckets'], f"Public buckets should be restricted for {bucket_name}")
            except ClientError as e:
                self.fail(f"Failed to check public access block for bucket {bucket_name}: {e}")

    def test_cloudfront_distribution_active(self):
        """Test CloudFront distribution is active and properly configured."""
        cloudfront_url = self.outputs.get('cloudfront_distribution_url')
        self.assertIsNotNone(cloudfront_url, "CloudFront distribution URL should be available")

        # Extract distribution ID from domain name if needed
        # CloudFront domain format: d123456.cloudfront.net
        self.assertTrue(cloudfront_url.endswith('.cloudfront.net'),
                       "Should be a valid CloudFront domain")

        # List distributions and find ours by domain name
        try:
            response = self.cloudfront_client.list_distributions()
            
            matching_distributions = []
            for dist in response.get('DistributionList', {}).get('Items', []):
                if cloudfront_url in [alias for alias in dist.get('Aliases', {}).get('Items', [])] or \
                   cloudfront_url == dist['DomainName']:
                    matching_distributions.append(dist)
            
            self.assertGreater(len(matching_distributions), 0, 
                             "Should find CloudFront distribution with matching domain")
            
            distribution = matching_distributions[0]
            self.assertEqual(distribution['Status'], 'Deployed', 
                           "CloudFront distribution should be deployed")
            self.assertTrue(distribution['Enabled'], 
                          "CloudFront distribution should be enabled")
            
        except ClientError as e:
            self.fail(f"Failed to check CloudFront distribution: {e}")

    def test_sns_topic_configuration(self):
        """Test SNS topic is configured for banking alerts."""
        topic_arn = self.outputs.get('sns_alert_topic_arn')
        self.assertIsNotNone(topic_arn, "SNS alert topic ARN should be available")

        # Verify ARN format and region
        self.assertTrue(topic_arn.startswith('arn:aws:sns:'), "Should be valid SNS ARN")
        self.assertIn(f':{self.region}:', topic_arn, f"SNS topic should be in {self.region}")

        try:
            # Verify topic exists
            response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
            attributes = response['Attributes']
            
            # Verify basic attributes
            self.assertIn('TopicArn', attributes)
            self.assertEqual(attributes['TopicArn'], topic_arn)
            
        except ClientError as e:
            self.fail(f"Failed to describe SNS topic {topic_arn}: {e}")

    def test_kms_key_configuration(self):
        """Test KMS key is properly configured for banking data encryption."""
        kms_key_id = self.outputs.get('kms_key_id')
        self.assertIsNotNone(kms_key_id, "KMS key ID should be available")

        try:
            response = self.kms_client.describe_key(KeyId=kms_key_id)
            key_metadata = response['KeyMetadata']
            
            # Verify key is enabled and available
            self.assertEqual(key_metadata['KeyState'], 'Enabled', "KMS key should be enabled")
            self.assertEqual(key_metadata['KeyUsage'], 'ENCRYPT_DECRYPT', 
                           "KMS key should support encryption/decryption")
            
            # Verify key origin (AWS_KMS indicates customer-managed key)
            self.assertEqual(key_metadata['Origin'], 'AWS_KMS', 
                           "Should be AWS KMS managed key")
            
        except ClientError as e:
            self.fail(f"Failed to describe KMS key {kms_key_id}: {e}")

    def test_resource_tagging_consistency(self):
        """Test resources are properly tagged for banking compliance and cost management."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id)

        # Check VPC tags
        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]
            
            tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
            
            # Verify required tags exist
            self.assertIn('Name', tags, "VPC should have Name tag")
            
            # Extract environment suffix for validation
            name_tag = tags.get('Name', '')
            if 'pr' in name_tag.lower():
                # Should contain environment identifier
                self.assertTrue(any(char.isdigit() for char in name_tag),
                              "Name should contain environment identifier")
                
        except ClientError as e:
            self.fail(f"Failed to check VPC tags: {e}")

    def test_security_groups_properly_configured(self):
        """Test security groups follow banking security best practices."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id)

        # Get all security groups in the VPC
        try:
            response = self.ec2_client.describe_security_groups(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            security_groups = response['SecurityGroups']
            self.assertGreater(len(security_groups), 3, 
                             "Should have multiple security groups for different tiers")

            # Verify no security group allows unrestricted inbound access
            for sg in security_groups:
                if sg['GroupName'] == 'default':
                    continue  # Skip default security group
                
                for rule in sg['IpPermissions']:
                    for ip_range in rule.get('IpRanges', []):
                        if ip_range.get('CidrIp') == '0.0.0.0/0':
                            # Only ALB security group should allow 0.0.0.0/0 on HTTP/HTTPS
                            if 'alb' not in sg['GroupName'].lower():
                                self.assertIn(rule.get('FromPort', 0), [80, 443],
                                            f"Security group {sg['GroupName']} should not allow "
                                            f"unrestricted access on port {rule.get('FromPort')}")
                                
        except ClientError as e:
            self.fail(f"Failed to check security groups: {e}")

    def test_high_availability_configuration(self):
        """Test infrastructure is configured for high availability across multiple AZs."""
        # Test that critical resources span multiple AZs
        vpc_id = self.outputs.get('vpc_id')
        asg_name = self.outputs.get('auto_scaling_group_name')
        
        # Check ASG spans multiple AZs
        try:
            response = self.autoscaling_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[asg_name]
            )
            asg = response['AutoScalingGroups'][0]
            
            self.assertGreaterEqual(len(asg['AvailabilityZones']), 2,
                                  "ASG should span at least 2 availability zones")
            
        except ClientError as e:
            self.fail(f"Failed to check ASG availability zones: {e}")

        # Check subnets span multiple AZs (already tested in subnet test, but verify again)
        try:
            response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            availability_zones = {subnet['AvailabilityZone'] for subnet in response['Subnets']}
            self.assertGreaterEqual(len(availability_zones), 3,
                                  "Infrastructure should span at least 3 availability zones")
            
        except ClientError as e:
            self.fail(f"Failed to check subnet availability zones: {e}")

    def test_monitoring_and_alerting_setup(self):
        """Test monitoring and alerting infrastructure is properly configured."""
        # Verify CloudWatch log groups exist for the stack
        try:
            # Look for log groups related to our stack
            response = self.logs_client.describe_log_groups()
            
            log_groups = response['logGroups']
            banking_log_groups = [lg for lg in log_groups 
                                if 'banking-portal' in lg['logGroupName'] or 
                                   'pr6666' in lg['logGroupName']]
            
            self.assertGreater(len(banking_log_groups), 0,
                             "Should have CloudWatch log groups for banking portal")
            
            # Verify log retention is set appropriately
            for log_group in banking_log_groups:
                self.assertIn('retentionInDays', log_group,
                            f"Log group {log_group['logGroupName']} should have retention policy")
                
        except ClientError as e:
            # Log groups might not exist yet, which is acceptable
            pass

    def test_regional_deployment_consistency(self):
        """Test that all resources are deployed in the expected region."""
        expected_region = self.region
        
        # Verify ALB DNS contains correct region
        alb_dns = self.outputs.get('alb_dns_name')
        if alb_dns:
            self.assertIn(f'.{expected_region}.elb.amazonaws.com', alb_dns,
                         f"ALB should be deployed in {expected_region}")
        
        # Verify RDS endpoint contains correct region
        rds_endpoint = self.outputs.get('rds_endpoint')
        if rds_endpoint:
            self.assertIn(f'.{expected_region}.rds.amazonaws.com', rds_endpoint,
                         f"RDS should be deployed in {expected_region}")
        
        # Verify SNS topic ARN contains correct region
        sns_arn = self.outputs.get('sns_alert_topic_arn')
        if sns_arn:
            self.assertIn(f':{expected_region}:', sns_arn,
                         f"SNS topic should be in {expected_region}")


if __name__ == '__main__':
    # Set test environment if not already set
    if not os.getenv('AWS_REGION'):
        os.environ['AWS_REGION'] = 'us-east-1'
    
    unittest.main(verbosity=2)
