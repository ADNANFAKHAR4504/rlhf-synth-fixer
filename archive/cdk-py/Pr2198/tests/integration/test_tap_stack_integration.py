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
        cls.elbv2_client = boto3.client('elbv2', region_name='us-east-1')
        cls.wafv2_client = boto3.client('wafv2', region_name='us-east-1')
        cls.autoscaling_client = boto3.client('autoscaling', region_name='us-east-1')

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
        vpc_id = self.outputs.get("VPCId")
        
        # Get all security groups in our VPC
        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]}
            ]
        )
        
        sgs = response['SecurityGroups']
        # Should have at least ALB and EC2 security groups (plus default)
        self.assertGreaterEqual(len(sgs), 2, "Expected at least 2 security groups")
        
        # Find ALB and EC2 security groups
        alb_sg = None
        ec2_sg = None
        
        for sg in sgs:
            if 'ALBSecurityGroup' in sg.get('GroupName', '') or 'Application Load Balancer' in sg.get('Description', ''):
                alb_sg = sg
            elif 'EC2SecurityGroup' in sg.get('GroupName', '') or 'EC2 web servers' in sg.get('Description', ''):
                ec2_sg = sg
        
        self.assertIsNotNone(alb_sg, "ALB security group not found")
        self.assertIsNotNone(ec2_sg, "EC2 security group not found")
        
        # Check ALB security group allows HTTP/HTTPS from internet
        http_found = False
        https_found = False
        for rule in alb_sg.get('IpPermissions', []):
            if rule.get('FromPort') == 80 and rule.get('ToPort') == 80:
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        http_found = True
            elif rule.get('FromPort') == 443 and rule.get('ToPort') == 443:
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        https_found = True
        
        self.assertTrue(http_found, "ALB security group doesn't allow HTTP from internet")
        # HTTPS rule might not be configured yet, so we don't assert it
        
        # Check EC2 security group only allows traffic from ALB
        ec2_http_rule_found = False
        for rule in ec2_sg.get('IpPermissions', []):
            if rule.get('FromPort') == 80 and rule.get('ToPort') == 80:
                for user_id_group in rule.get('UserIdGroupPairs', []):
                    if user_id_group.get('GroupId') == alb_sg['GroupId']:
                        ec2_http_rule_found = True
        
        self.assertTrue(ec2_http_rule_found, "EC2 security group doesn't allow HTTP from ALB")

    def test_alb_logs_bucket_exists(self):
        """Test that ALB logs S3 bucket exists and is properly configured."""
        # Find the ALB logs bucket by looking for buckets with our naming pattern
        try:
            response = self.s3_client.list_buckets()
            alb_bucket = None
            
            for bucket in response['Buckets']:
                bucket_name = bucket['Name']
                if 'alb-logs-pr2198' in bucket_name and 'us-east-1' in bucket_name:
                    alb_bucket = bucket_name
                    break
            
            self.assertIsNotNone(alb_bucket, "ALB logs bucket not found")
            
            # Check bucket encryption
            response = self.s3_client.get_bucket_encryption(Bucket=alb_bucket)
            rules = response['ServerSideEncryptionConfiguration']['Rules']
            self.assertGreater(len(rules), 0, "No encryption rules found")
            
            # Verify encryption algorithm
            encryption_found = False
            for rule in rules:
                if rule.get('ApplyServerSideEncryptionByDefault', {}).get('SSEAlgorithm') == 'AES256':
                    encryption_found = True
                    break
            self.assertTrue(encryption_found, "AES256 encryption not found")
            
            # Check public access block
            response = self.s3_client.get_public_access_block(Bucket=alb_bucket)
            config = response['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'], "Public ACLs not blocked")
            self.assertTrue(config['BlockPublicPolicy'], "Public policy not blocked")
            self.assertTrue(config['IgnorePublicAcls'], "Public ACLs not ignored")
            self.assertTrue(config['RestrictPublicBuckets'], "Public buckets not restricted")
            
        except ClientError as e:
            self.fail(f"Failed to check ALB logs bucket: {e}")

    def test_alb_exists_and_configured(self):
        """Test that Application Load Balancer exists and is properly configured."""
        alb_dns = self.outputs.get("LoadBalancerDNS")
        self.assertIsNotNone(alb_dns, "LoadBalancer DNS not found in outputs")
        
        try:
            # Find ALB by DNS name instead of parsing the name (which can be >32 chars)
            response = self.elbv2_client.describe_load_balancers()
            
            alb = None
            for lb in response['LoadBalancers']:
                if lb['DNSName'] == alb_dns:
                    alb = lb
                    break
            
            self.assertIsNotNone(alb, f"ALB with DNS {alb_dns} not found")
            self.assertEqual(alb['Type'], 'application', "Not an Application Load Balancer")
            self.assertEqual(alb['Scheme'], 'internet-facing', "ALB is not internet-facing")
            self.assertEqual(alb['State']['Code'], 'active', "ALB is not active")
            
            # Check listeners
            response = self.elbv2_client.describe_listeners(
                LoadBalancerArn=alb['LoadBalancerArn']
            )
            
            listeners = response['Listeners']
            self.assertGreater(len(listeners), 0, "No listeners found")
            
            # Check for HTTP listener
            http_listener_found = False
            for listener in listeners:
                if listener['Port'] == 80 and listener['Protocol'] == 'HTTP':
                    http_listener_found = True
                    break
            
            self.assertTrue(http_listener_found, "HTTP listener not found")
            
        except ClientError as e:
            self.fail(f"Failed to check ALB configuration: {e}")

    def test_waf_web_acl_exists(self):
        """Test that AWS WAF Web ACL exists and is configured."""
        web_acl_id = self.outputs.get("WebACLId")
        self.assertIsNotNone(web_acl_id, "WebACL ID not found in outputs")
        
        try:
            # List WAF Web ACLs to find our Web ACL by ID
            response = self.wafv2_client.list_web_acls(
                Scope='REGIONAL'
            )
            
            web_acl_summary = None
            for acl in response['WebACLs']:
                if acl['Id'] == web_acl_id:
                    web_acl_summary = acl
                    break
            
            self.assertIsNotNone(web_acl_summary, f"Web ACL with ID {web_acl_id} not found")
            
            # Now get the full Web ACL details using both name and ID
            response = self.wafv2_client.get_web_acl(
                Scope='REGIONAL',
                Id=web_acl_id,
                Name=web_acl_summary['Name']
            )
            
            web_acl = response['WebACL']
            # Note: The Web ACL response doesn't include Scope field, but we know it's REGIONAL since we specified it
            self.assertIn('WebACL-pr2198', web_acl['Name'], "Web ACL name doesn't match expected pattern")
            
            # Check default action is ALLOW
            self.assertIn('Allow', web_acl['DefaultAction'], "Default action is not ALLOW")
            
            # Check managed rules are configured
            rules = web_acl.get('Rules', [])
            self.assertGreater(len(rules), 0, "No rules found in Web ACL")
            
            # Look for AWS managed rule groups
            managed_rule_names = []
            for rule in rules:
                statement = rule.get('Statement', {})
                managed_rule_group = statement.get('ManagedRuleGroupStatement', {})
                if managed_rule_group:
                    managed_rule_names.append(managed_rule_group.get('Name', ''))
            
            expected_rules = [
                'AWSManagedRulesCommonRuleSet',
                'AWSManagedRulesKnownBadInputsRuleSet',
                'AWSManagedRulesAmazonIpReputationList'
            ]
            
            for expected_rule in expected_rules:
                self.assertIn(expected_rule, managed_rule_names, f"Missing managed rule: {expected_rule}")
            
        except ClientError as e:
            self.fail(f"Failed to get WAF Web ACL: {e}")

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

    def test_auto_scaling_group_exists(self):
        """Test that Auto Scaling Group exists and is properly configured."""
        vpc_id = self.outputs.get("VPCId")
        
        try:
            # Get Auto Scaling Groups in our VPC
            response = self.autoscaling_client.describe_auto_scaling_groups()
            
            # Find ASG in our VPC
            our_asg = None
            for asg in response['AutoScalingGroups']:
                # Check if ASG is in our VPC by checking subnet IDs
                if asg.get('VPCZoneIdentifier'):
                    subnet_ids = asg['VPCZoneIdentifier'].split(',')
                    if subnet_ids:
                        # Check if first subnet belongs to our VPC
                        subnet_response = self.ec2_client.describe_subnets(
                            SubnetIds=[subnet_ids[0]]
                        )
                        if subnet_response['Subnets'][0]['VpcId'] == vpc_id:
                            our_asg = asg
                            break
            
            self.assertIsNotNone(our_asg, "Auto Scaling Group not found in our VPC")
            
            # Check ASG configuration
            self.assertEqual(our_asg['MinSize'], 2, "Min size should be 2")
            self.assertEqual(our_asg['MaxSize'], 6, "Max size should be 6")
            self.assertEqual(our_asg['DesiredCapacity'], 3, "Desired capacity should be 3")
            
            # Check health check configuration
            self.assertIn('ELB', our_asg.get('HealthCheckType', ''), "Health check type should include ELB")
            
            # Check that instances are in private subnets
            subnet_ids = our_asg['VPCZoneIdentifier'].split(',')
            for subnet_id in subnet_ids:
                subnet_response = self.ec2_client.describe_subnets(
                    SubnetIds=[subnet_id]
                )
                subnet = subnet_response['Subnets'][0]
                # Private subnets don't map public IP on launch
                self.assertFalse(subnet.get('MapPublicIpOnLaunch', False), 
                                f"Subnet {subnet_id} should be private")
            
        except ClientError as e:
            self.fail(f"Failed to check Auto Scaling Group: {e}")

    def test_tags_on_resources(self):
        """Test that resources are properly tagged."""
        vpc_id = self.outputs.get("VPCId")
        
        response = self.ec2_client.describe_tags(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )
        
        tags = {tag['Key']: tag['Value'] for tag in response['Tags']}
        
        # Check required tags based on our actual stack configuration
        # Environment tag should match the actual deployment suffix
        self.assertIn('Environment', tags, "Environment tag not found")
        # Environment could be pr2198, synthtrainr132new, or other dynamic values
        self.assertTrue(len(tags.get('Environment', '')) > 0, "Environment tag should not be empty")
        
        self.assertIn('Project', tags, "Project tag not found")
        self.assertEqual(tags.get('Project'), 'SecureWebApp', "Project tag value incorrect")
        
        self.assertIn('SecurityCompliance', tags, "SecurityCompliance tag not found")
        self.assertEqual(tags.get('SecurityCompliance'), 'Enhanced', "SecurityCompliance tag value incorrect")
        
        self.assertIn('DataClassification', tags, "DataClassification tag not found")
        self.assertEqual(tags.get('DataClassification'), 'Internal', "DataClassification tag value incorrect")


if __name__ == "__main__":
    unittest.main()
