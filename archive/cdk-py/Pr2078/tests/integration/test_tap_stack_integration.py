#!/usr/bin/env python3
"""
Integration tests for the deployed TapStack infrastructure.

These tests verify the actual deployed resources in AWS using the outputs
from the CloudFormation stack deployment.
"""

import json
import os
import unittest

import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack resources."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures for integration tests."""
        # Load stack outputs
        outputs_file = "cfn-outputs/flat-outputs.json"
        if not os.path.exists(outputs_file):
            raise FileNotFoundError(
                f"Stack outputs file not found: {outputs_file}. "
                "Ensure the stack is deployed and outputs are generated."
            )
        
        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)
        
        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name='us-east-1')
        cls.s3_client = boto3.client('s3', region_name='us-east-1')
        cls.iam_client = boto3.client('iam', region_name='us-east-1')

    def test_vpc_exists(self):
        """Test that the VPC exists and is available."""
        vpc_id = self.outputs.get("VPCId")
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")
        
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpcs = response['Vpcs']
        
        self.assertEqual(len(vpcs), 1, "VPC not found")
        vpc = vpcs[0]
        self.assertEqual(vpc['State'], 'available')
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

    def test_vpc_has_flow_logs(self):
        """Test that VPC has flow logs enabled."""
        vpc_id = self.outputs.get("VPCId")
        
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]},
                {'Name': 'traffic-type', 'Values': ['ALL']}
            ]
        )
        
        flow_logs = response['FlowLogs']
        self.assertGreater(len(flow_logs), 0, "No flow logs found for VPC")
        
        # Verify flow log is active
        for flow_log in flow_logs:
            self.assertIn(flow_log['FlowLogStatus'], ['ACTIVE'])

    def test_security_groups_exist(self):
        """Test that security groups exist and are properly configured."""
        secure_sg_id = self.outputs.get("SecureSecurityGroupId")
        db_sg_id = self.outputs.get("DatabaseSecurityGroupId")
        
        self.assertIsNotNone(secure_sg_id, "Secure SG ID not found")
        self.assertIsNotNone(db_sg_id, "Database SG ID not found")
        
        # Describe security groups
        response = self.ec2_client.describe_security_groups(
            GroupIds=[secure_sg_id, db_sg_id]
        )
        
        sgs = response['SecurityGroups']
        self.assertEqual(len(sgs), 2, "Not all security groups found")
        
        # Check secure SG doesn't allow unrestricted SSH
        for sg in sgs:
            if sg['GroupId'] == secure_sg_id:
                for rule in sg.get('IpPermissions', []):
                    if rule.get('FromPort') == 22 and rule.get('ToPort') == 22:
                        # Check no 0.0.0.0/0 in IP ranges
                        for ip_range in rule.get('IpRanges', []):
                            self.assertNotEqual(
                                ip_range.get('CidrIp'),
                                '0.0.0.0/0',
                                "Security group allows unrestricted SSH"
                            )

    def test_s3_buckets_exist(self):
        """Test that S3 buckets exist and are properly configured."""
        secure_bucket = self.outputs.get("SecureBucketName")
        cloudtrail_bucket = self.outputs.get("CloudTrailBucketName")
        
        self.assertIsNotNone(secure_bucket, "Secure bucket name not found")
        self.assertIsNotNone(cloudtrail_bucket, "CloudTrail bucket name not found")
        
        # Check secure bucket
        try:
            response = self.s3_client.get_bucket_versioning(Bucket=secure_bucket)
            self.assertEqual(response.get('Status'), 'Enabled', "Versioning not enabled")
        except ClientError as e:
            self.fail(f"Failed to get bucket versioning: {e}")
        
        # Check bucket encryption
        try:
            response = self.s3_client.get_bucket_encryption(Bucket=secure_bucket)
            rules = response['ServerSideEncryptionConfiguration']['Rules']
            self.assertGreater(len(rules), 0, "No encryption rules found")
        except ClientError as e:
            self.fail(f"Failed to get bucket encryption: {e}")
        
        # Check public access block
        try:
            response = self.s3_client.get_public_access_block(Bucket=secure_bucket)
            config = response['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'])
            self.assertTrue(config['BlockPublicPolicy'])
            self.assertTrue(config['IgnorePublicAcls'])
            self.assertTrue(config['RestrictPublicBuckets'])
        except ClientError as e:
            self.fail(f"Failed to get public access block: {e}")

    def test_s3_bucket_policy_enforces_ssl(self):
        """Test that S3 bucket policy enforces SSL."""
        secure_bucket = self.outputs.get("SecureBucketName")
        
        try:
            response = self.s3_client.get_bucket_policy(Bucket=secure_bucket)
            policy = json.loads(response['Policy'])
            
            # Check for SSL enforcement statement
            ssl_enforced = False
            for statement in policy.get('Statement', []):
                if (statement.get('Effect') == 'Deny' and 
                    statement.get('Condition', {}).get('Bool', {}).get('aws:SecureTransport') == 'false'):
                    ssl_enforced = True
                    break
            
            self.assertTrue(ssl_enforced, "Bucket policy does not enforce SSL")
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchBucketPolicy':
                self.fail(f"Failed to get bucket policy: {e}")

    def test_iam_mfa_policy_exists(self):
        """Test that MFA enforcement policy exists."""
        policy_arn = self.outputs.get("MFAPolicyArn")
        self.assertIsNotNone(policy_arn, "MFA policy ARN not found")
        
        try:
            # Get policy
            response = self.iam_client.get_policy(PolicyArn=policy_arn)
            policy = response['Policy']
            
            self.assertTrue('MFAEnforcementPolicypr2078' in policy['PolicyName'])
            self.assertIsNotNone(policy['DefaultVersionId'])
            
            # Get policy document
            response = self.iam_client.get_policy_version(
                PolicyArn=policy_arn,
                VersionId=policy['DefaultVersionId']
            )
            
            # Document may already be a dict or a JSON string
            document = response['PolicyVersion']['Document']
            if isinstance(document, str):
                document = json.loads(document)
            
            # Check for MFA enforcement statement
            mfa_enforced = False
            for statement in document.get('Statement', []):
                if (statement.get('Sid') == 'DenyAllExceptUnlessMFAAuthenticated' and
                    statement.get('Effect') == 'Deny'):
                    mfa_enforced = True
                    break
            
            self.assertTrue(mfa_enforced, "MFA enforcement statement not found")
        except ClientError as e:
            self.fail(f"Failed to get IAM policy: {e}")

    def test_vpc_subnets_configuration(self):
        """Test VPC subnets are properly configured."""
        vpc_id = self.outputs.get("VPCId")
        
        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        
        subnets = response['Subnets']
        self.assertGreaterEqual(len(subnets), 4, "Expected at least 4 subnets")
        
        # Check for public and private subnets
        public_subnets = []
        private_subnets = []
        
        for subnet in subnets:
            if subnet.get('MapPublicIpOnLaunch', False):
                public_subnets.append(subnet)
            else:
                private_subnets.append(subnet)
        
        self.assertGreaterEqual(len(public_subnets), 2, "Expected at least 2 public subnets")
        self.assertGreaterEqual(len(private_subnets), 2, "Expected at least 2 private subnets")

    def test_nat_gateways_exist(self):
        """Test that NAT gateways exist for private subnet connectivity."""
        vpc_id = self.outputs.get("VPCId")
        
        response = self.ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )
        
        nat_gateways = response['NatGateways']
        self.assertGreaterEqual(len(nat_gateways), 1, "No NAT gateways found")

    def test_internet_gateway_attached(self):
        """Test that Internet Gateway is attached to VPC."""
        vpc_id = self.outputs.get("VPCId")
        
        response = self.ec2_client.describe_internet_gateways(
            Filters=[
                {'Name': 'attachment.vpc-id', 'Values': [vpc_id]}
            ]
        )
        
        igws = response['InternetGateways']
        self.assertEqual(len(igws), 1, "Internet Gateway not found")
        
        # Check attachment state
        attachments = igws[0].get('Attachments', [])
        self.assertEqual(len(attachments), 1, "IGW not attached")
        self.assertEqual(attachments[0]['State'], 'available')

    def test_database_security_group_rules(self):
        """Test database security group has proper ingress rules."""
        db_sg_id = self.outputs.get("DatabaseSecurityGroupId")
        secure_sg_id = self.outputs.get("SecureSecurityGroupId")
        
        response = self.ec2_client.describe_security_groups(
            GroupIds=[db_sg_id]
        )
        
        sg = response['SecurityGroups'][0]
        
        # Check ingress rules
        mysql_rule_found = False
        for rule in sg.get('IpPermissions', []):
            if rule.get('FromPort') == 3306 and rule.get('ToPort') == 3306:
                # Check it only allows from secure SG
                for user_id_group in rule.get('UserIdGroupPairs', []):
                    if user_id_group.get('GroupId') == secure_sg_id:
                        mysql_rule_found = True
                        break
        
        self.assertTrue(mysql_rule_found, "Database SG doesn't allow MySQL from app SG")

    def test_tags_on_resources(self):
        """Test that resources are properly tagged."""
        vpc_id = self.outputs.get("VPCId")
        
        response = self.ec2_client.describe_tags(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )
        
        tags = {tag['Key']: tag['Value'] for tag in response['Tags']}
        
        # Check required tags
        self.assertIn('Environment', tags)
        self.assertEqual(tags.get('Purpose'), 'SecurityCompliance')
        self.assertEqual(tags.get('SecurityLevel'), 'High')


if __name__ == "__main__":
    unittest.main()
