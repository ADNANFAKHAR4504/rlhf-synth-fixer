"""Integration tests for deployed TapStack infrastructure"""

import json
import os
import time
import unittest

import boto3
import requests
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
    """Integration test cases for the deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and get outputs from deployment"""
        cls.region = os.environ.get('AWS_REGION', 'us-west-2')
        
        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.autoscaling_client = boto3.client('autoscaling', region_name=cls.region)
        cls.secretsmanager_client = boto3.client('secretsmanager', region_name=cls.region)
        
        # Get outputs from deployment
        cls.load_balancer_url = None
        cls.load_balancer_dns = None
        cls.secrets_arn = None
        
        for key, value in flat_outputs.items():
            if 'LoadBalancerURL' in key:
                cls.load_balancer_url = value
            elif 'LoadBalancerDNS' in key:
                cls.load_balancer_dns = value
            elif 'SecretsManagerArn' in key:
                cls.secrets_arn = value

    @mark.it("verifies deployment outputs exist")
    def test_deployment_outputs_exist(self):
        """Test that all required deployment outputs are present"""
        # ASSERT - Check outputs exist
        self.assertIsNotNone(self.load_balancer_url, "LoadBalancer URL output is missing")
        self.assertIsNotNone(self.load_balancer_dns, "LoadBalancer DNS output is missing")
        self.assertIsNotNone(self.secrets_arn, "Secrets Manager ARN output is missing")
        
        # Verify URL format
        self.assertTrue(self.load_balancer_url.startswith('http://'), 
                       "LoadBalancer URL should start with http://")
        self.assertIn('.elb.amazonaws.com', self.load_balancer_dns,
                     "LoadBalancer DNS should be an ELB endpoint")

    @mark.it("verifies Application Load Balancer is accessible")
    def test_alb_is_accessible(self):
        """Test that the Application Load Balancer is accessible from internet"""
        if not self.load_balancer_url:
            self.skipTest("LoadBalancer URL not available")
        
        # Wait for ALB to be fully available (health checks may take time)
        max_retries = 30
        retry_delay = 10
        
        for attempt in range(max_retries):
            try:
                # ARRANGE & ACT - Make HTTP request to ALB
                response = requests.get(self.load_balancer_url, timeout=10)
                
                # ASSERT - Check response
                if response.status_code == 200:
                    self.assertEqual(response.status_code, 200)
                    # Check for expected content from EC2 instances
                    self.assertIn('Healthy Web Application Instance', response.text,
                                 "Expected web application response not found")
                    return  # Test passed
                    
            except (requests.ConnectionError, requests.Timeout):
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    continue
                else:
                    self.fail(f"ALB not accessible after {max_retries * retry_delay} seconds")
        
        self.fail("ALB did not return expected response")

    @mark.it("verifies Auto Scaling Group is functioning")
    def test_auto_scaling_group_functioning(self):
        """Test that Auto Scaling Group has healthy instances"""
        # Get all Auto Scaling Groups
        response = self.autoscaling_client.describe_auto_scaling_groups()
        
        # Find our ASG (should contain environment suffix)
        target_asg = None
        for asg in response['AutoScalingGroups']:
            if 'synthtrainr180cdkpy' in asg['AutoScalingGroupName'] or 'WebAppASG' in asg['AutoScalingGroupName']:
                target_asg = asg
                break
        
        # ASSERT - ASG exists
        self.assertIsNotNone(target_asg, "Auto Scaling Group not found")
        
        # Check ASG configuration
        self.assertGreaterEqual(target_asg['MinSize'], 2, 
                               "ASG MinSize should be at least 2")
        self.assertLessEqual(target_asg['MaxSize'], 10,
                            "ASG MaxSize should be reasonable")
        
        # Check for healthy instances
        self.assertGreaterEqual(len(target_asg['Instances']), 2,
                               "ASG should have at least 2 instances")
        
        # Verify instances are in service
        healthy_instances = [i for i in target_asg['Instances'] 
                            if i['HealthStatus'] == 'Healthy' and 
                            i['LifecycleState'] == 'InService']
        self.assertGreaterEqual(len(healthy_instances), 2,
                               "ASG should have at least 2 healthy instances in service")
        
        # Check instances are in different AZs for high availability
        availability_zones = set(i['AvailabilityZone'] for i in healthy_instances)
        self.assertGreaterEqual(len(availability_zones), 2,
                               "Instances should be distributed across multiple AZs")

    @mark.it("verifies Target Group has healthy targets")
    def test_target_group_has_healthy_targets(self):
        """Test that the ALB target group has healthy EC2 instances"""
        if not self.load_balancer_dns:
            self.skipTest("LoadBalancer DNS not available")
        
        # Get Load Balancer details
        response = self.elbv2_client.describe_load_balancers()
        
        # Find our ALB
        target_alb = None
        for lb in response['LoadBalancers']:
            if self.load_balancer_dns in lb['DNSName']:
                target_alb = lb
                break
        
        self.assertIsNotNone(target_alb, "Application Load Balancer not found")
        
        # Get target groups for this ALB
        tg_response = self.elbv2_client.describe_target_groups(
            LoadBalancerArn=target_alb['LoadBalancerArn']
        )
        
        self.assertGreater(len(tg_response['TargetGroups']), 0,
                          "No target groups found for ALB")
        
        # Check health of targets in each target group
        for tg in tg_response['TargetGroups']:
            health_response = self.elbv2_client.describe_target_health(
                TargetGroupArn=tg['TargetGroupArn']
            )
            
            # Check for healthy targets
            healthy_targets = [t for t in health_response['TargetHealthDescriptions']
                              if t['TargetHealth']['State'] == 'healthy']
            
            self.assertGreaterEqual(len(healthy_targets), 2,
                                   f"Target group {tg['TargetGroupName']} should have at least 2 healthy targets")

    @mark.it("verifies Secrets Manager secret exists and is accessible")
    def test_secrets_manager_secret_exists(self):
        """Test that the Secrets Manager secret exists and contains expected data"""
        if not self.secrets_arn:
            self.skipTest("Secrets Manager ARN not available")
        
        try:
            # Get secret value
            response = self.secretsmanager_client.get_secret_value(
                SecretId=self.secrets_arn
            )
            
            # ASSERT - Secret exists and has value
            self.assertIn('SecretString', response,
                         "Secret should contain SecretString")
            
            # Parse secret value
            secret_data = json.loads(response['SecretString'])
            
            # Check for expected keys
            self.assertIn('username', secret_data,
                         "Secret should contain 'username' field")
            self.assertEqual(secret_data['username'], 'admin',
                            "Username should be 'admin'")
            self.assertIn('password', secret_data,
                         "Secret should contain 'password' field")
            self.assertTrue(len(secret_data['password']) > 8,
                           "Password should be generated and have reasonable length")
            
        except Exception as e:
            self.fail(f"Failed to retrieve secret: {str(e)}")

    @mark.it("verifies security groups are properly configured")
    def test_security_groups_configured(self):
        """Test that security groups are properly configured for ALB and EC2"""
        # Get all security groups
        response = self.ec2_client.describe_security_groups()
        
        # Find ALB and EC2 security groups by their CloudFormation tags or names
        alb_sg = None
        ec2_sg = None
        
        for sg in response['SecurityGroups']:
            # Look for tags or name patterns
            tags = {tag['Key']: tag['Value'] for tag in sg.get('Tags', [])}
            logical_id = tags.get('aws:cloudformation:logical-id', '')
            group_name = sg.get('GroupName', '')
            
            # Check for ALB security group
            if 'ALBSecurityGroup' in logical_id or 'ALBSecurityGroup' in group_name:
                alb_sg = sg
            # Check for EC2 security group
            elif 'EC2SecurityGroup' in logical_id or 'EC2SecurityGroup' in group_name:
                ec2_sg = sg
        
        # ASSERT - Security groups exist
        self.assertIsNotNone(alb_sg, "ALB Security Group not found")
        self.assertIsNotNone(ec2_sg, "EC2 Security Group not found")
        
        # Check ALB security group allows HTTP/HTTPS from internet
        http_rule_found = False
        https_rule_found = False
        
        for rule in alb_sg.get('IpPermissions', []):
            if rule.get('FromPort') == 80 and rule.get('ToPort') == 80:
                # Check if it allows from anywhere
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        http_rule_found = True
            elif rule.get('FromPort') == 443 and rule.get('ToPort') == 443:
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        https_rule_found = True
        
        self.assertTrue(http_rule_found, "ALB should allow HTTP from internet")
        self.assertTrue(https_rule_found, "ALB should allow HTTPS from internet")
        
        # Check EC2 security group allows traffic from ALB
        alb_to_ec2_rule_found = False
        for rule in ec2_sg.get('IpPermissions', []):
            if rule.get('FromPort') == 80 and rule.get('ToPort') == 80:
                # Check if it allows from ALB security group
                for user_id_group in rule.get('UserIdGroupPairs', []):
                    if user_id_group.get('GroupId') == alb_sg['GroupId']:
                        alb_to_ec2_rule_found = True
        
        self.assertTrue(alb_to_ec2_rule_found, 
                       "EC2 Security Group should allow HTTP traffic from ALB")

    @mark.it("verifies VPC and subnet configuration")
    def test_vpc_and_subnet_configuration(self):
        """Test that VPC is properly configured with public and private subnets"""
        # Get all VPCs
        response = self.ec2_client.describe_vpcs()
        
        # Find our VPC (should have our tag or name pattern)
        target_vpc = None
        for vpc in response['Vpcs']:
            for tag in vpc.get('Tags', []):
                if tag.get('Key') == 'Name' and 'WebAppVPC' in tag.get('Value', ''):
                    target_vpc = vpc
                    break
        
        if not target_vpc:
            # If not found by tags, try to find by CIDR (10.0.0.0/16 is our default)
            for vpc in response['Vpcs']:
                if vpc.get('CidrBlock') == '10.0.0.0/16':
                    target_vpc = vpc
                    break
        
        self.assertIsNotNone(target_vpc, "VPC not found")
        
        # Get subnets for this VPC
        subnet_response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [target_vpc['VpcId']]}]
        )
        
        # Categorize subnets
        public_subnets = []
        private_subnets = []
        
        for subnet in subnet_response['Subnets']:
            # Check if subnet has route to internet gateway (public) or NAT (private)
            route_table_response = self.ec2_client.describe_route_tables(
                Filters=[
                    {'Name': 'association.subnet-id', 'Values': [subnet['SubnetId']]}
                ]
            )
            
            is_public = False
            if route_table_response['RouteTables']:
                for route in route_table_response['RouteTables'][0].get('Routes', []):
                    if route.get('GatewayId', '').startswith('igw-'):
                        is_public = True
                        break
            
            if is_public:
                public_subnets.append(subnet)
            else:
                private_subnets.append(subnet)
        
        # ASSERT - Check subnet configuration
        self.assertGreaterEqual(len(public_subnets), 2,
                               "Should have at least 2 public subnets")
        self.assertGreaterEqual(len(private_subnets), 2,
                               "Should have at least 2 private subnets")
        
        # Check subnets are in different AZs
        public_azs = set(s['AvailabilityZone'] for s in public_subnets)
        private_azs = set(s['AvailabilityZone'] for s in private_subnets)
        
        self.assertGreaterEqual(len(public_azs), 2,
                               "Public subnets should span multiple AZs")
        self.assertGreaterEqual(len(private_azs), 2,
                               "Private subnets should span multiple AZs")

    @mark.it("verifies all 6 requirements are met in deployed infrastructure")
    def test_all_requirements_met(self):
        """Integration test to verify all 6 original requirements are satisfied"""
        
        # Requirement 1: Auto Scaling Group across multiple AZs
        asg_response = self.autoscaling_client.describe_auto_scaling_groups()
        target_asg = None
        for asg in asg_response['AutoScalingGroups']:
            if 'WebAppASG' in asg['AutoScalingGroupName']:
                target_asg = asg
                break
        
        self.assertIsNotNone(target_asg, "Requirement 1: Auto Scaling Group must exist")
        availability_zones = set(i['AvailabilityZone'] for i in target_asg.get('Instances', []))
        self.assertGreaterEqual(len(availability_zones), 2,
                               "Requirement 1: ASG must span at least 2 AZs")
        
        # Requirement 2: Internet-facing Application Load Balancer
        elb_response = self.elbv2_client.describe_load_balancers()
        internet_facing_alb = False
        for lb in elb_response['LoadBalancers']:
            if lb['Scheme'] == 'internet-facing' and lb['Type'] == 'application':
                internet_facing_alb = True
                break
        self.assertTrue(internet_facing_alb,
                       "Requirement 2: Internet-facing ALB must exist")
        
        # Requirement 3: Health checks configured
        if target_asg:
            self.assertEqual(target_asg['HealthCheckType'], 'ELB',
                            "Requirement 3: ASG should use ELB health checks")
            self.assertGreater(target_asg['HealthCheckGracePeriod'], 0,
                              "Requirement 3: Health check grace period should be configured")
        
        # Requirement 4: HTTP/HTTPS traffic allowed from internet
        sg_response = self.ec2_client.describe_security_groups()
        http_allowed = False
        https_allowed = False
        for sg in sg_response['SecurityGroups']:
            if 'ALBSecurityGroup' in sg.get('GroupName', ''):
                for rule in sg.get('IpPermissions', []):
                    if rule.get('FromPort') == 80 and '0.0.0.0/0' in str(rule):
                        http_allowed = True
                    if rule.get('FromPort') == 443 and '0.0.0.0/0' in str(rule):
                        https_allowed = True
        
        self.assertTrue(http_allowed and https_allowed,
                       "Requirement 4: HTTP and HTTPS must be allowed from internet")
        
        # Requirement 5: Secure configuration using Secrets Manager
        self.assertIsNotNone(self.secrets_arn,
                            "Requirement 5: Secrets Manager must be configured")
        
        # Requirement 6: Infrastructure outputs (ALB URL)
        self.assertIsNotNone(self.load_balancer_url,
                            "Requirement 6: LoadBalancer URL must be in outputs")
        self.assertTrue(self.load_balancer_url.startswith('http://'),
                       "Requirement 6: LoadBalancer URL must be accessible")
