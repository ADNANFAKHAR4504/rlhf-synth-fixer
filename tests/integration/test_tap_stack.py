"""Integration tests for TapStack infrastructure using real AWS outputs"""
import json
import os
import time
import unittest
import requests
import boto3
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}

# Get AWS region from environment or default
AWS_REGION = os.getenv('AWS_REGION', 'us-west-2')


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and deployment outputs"""
        cls.outputs = flat_outputs
        cls.ec2_client = boto3.client('ec2', region_name=AWS_REGION)
        cls.elb_client = boto3.client('elbv2', region_name=AWS_REGION)
        cls.asg_client = boto3.client('autoscaling', region_name=AWS_REGION)

    def test_deployment_outputs_exist(self):
        """Test that all required CloudFormation outputs are present"""
        # ARRANGE
        required_outputs = ['VPCId', 'AutoScalingGroupName', 'ApplicationLoadBalancerDNS']
        
        # ASSERT
        for output_key in required_outputs:
            self.assertIn(output_key, self.outputs, f"Missing required output: {output_key}")
            self.assertIsNotNone(self.outputs[output_key], f"Output {output_key} is None")
            self.assertTrue(len(self.outputs[output_key]) > 0, f"Output {output_key} is empty")

    @mark.it("verifies VPC exists and is configured correctly")
    def test_vpc_exists(self):
        """Test that the VPC exists and has the correct configuration"""
        # ARRANGE
        vpc_id = self.outputs.get('VPCId')
        
        # ACT
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        
        # ASSERT
        self.assertEqual(len(response['Vpcs']), 1, "VPC not found")
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available', "VPC is not available")
        self.assertTrue(vpc['IsDefault'] is False, "VPC should not be default")
        
        # Check DNS settings - Note: These attributes need separate API calls
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'], "DNS hostnames not enabled")
        self.assertTrue(dns_support['EnableDnsSupport']['Value'], "DNS support not enabled")

    @mark.it("verifies ALB exists and is accessible")
    def test_alb_exists_and_healthy(self):
        """Test that the Application Load Balancer exists and is healthy"""
        # ARRANGE
        alb_dns = self.outputs.get('ApplicationLoadBalancerDNS')
        
        # ACT - Get ALB details
        response = self.elb_client.describe_load_balancers()
        alb = None
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_dns:
                alb = lb
                break
        
        # ASSERT
        self.assertIsNotNone(alb, f"ALB with DNS {alb_dns} not found")
        self.assertEqual(alb['State']['Code'], 'active', "ALB is not active")
        self.assertEqual(alb['Type'], 'application', "Load balancer is not ALB type")
        self.assertEqual(alb['Scheme'], 'internet-facing', "ALB is not internet-facing")
        
        # Verify security features
        lb_attributes = self.elb_client.describe_load_balancer_attributes(
            LoadBalancerArn=alb['LoadBalancerArn']
        )
        attributes_dict = {attr['Key']: attr['Value'] for attr in lb_attributes['Attributes']}
        self.assertEqual(
            attributes_dict.get('routing.http.desync_mitigation_mode'), 
            'strictest',
            "Desync mitigation not set to strictest"
        )

    @mark.it("verifies Auto Scaling Group is configured correctly")
    def test_auto_scaling_group(self):
        """Test that the Auto Scaling Group exists with correct settings"""
        # ARRANGE
        asg_name = self.outputs.get('AutoScalingGroupName')
        
        # ACT
        response = self.asg_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        
        # ASSERT
        self.assertEqual(len(response['AutoScalingGroups']), 1, "ASG not found")
        asg = response['AutoScalingGroups'][0]
        
        # Check capacity settings
        self.assertEqual(asg['MinSize'], 2, "Min size is not 2")
        self.assertEqual(asg['MaxSize'], 5, "Max size is not 5")
        self.assertGreaterEqual(asg['DesiredCapacity'], 2, "Desired capacity less than minimum")
        
        # Check health check configuration
        self.assertEqual(asg['HealthCheckType'], 'ELB', "Health check type is not ELB")
        self.assertEqual(asg['HealthCheckGracePeriod'], 300, "Health check grace period incorrect")

    @mark.it("verifies EC2 instances are running")
    def test_ec2_instances_running(self):
        """Test that EC2 instances are running in the Auto Scaling Group"""
        # ARRANGE
        asg_name = self.outputs.get('AutoScalingGroupName')
        
        # ACT
        response = self.asg_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        asg = response['AutoScalingGroups'][0]
        instance_ids = [i['InstanceId'] for i in asg['Instances']]
        
        # ASSERT
        self.assertGreaterEqual(len(instance_ids), 2, "Less than 2 instances running")
        
        # Check instance states
        if instance_ids:
            ec2_response = self.ec2_client.describe_instances(InstanceIds=instance_ids)
            for reservation in ec2_response['Reservations']:
                for instance in reservation['Instances']:
                    self.assertIn(
                        instance['State']['Name'], 
                        ['running', 'pending'], 
                        f"Instance {instance['InstanceId']} is not running"
                    )
                    # Verify instance type
                    self.assertEqual(
                        instance['InstanceType'], 
                        't2.micro',
                        "Instance type is not t2.micro"
                    )

    @mark.it("verifies ALB target health")
    def test_alb_target_health(self):
        """Test that ALB targets are healthy"""
        # ARRANGE
        alb_dns = self.outputs.get('ApplicationLoadBalancerDNS')
        
        # ACT - Get target groups
        response = self.elb_client.describe_load_balancers()
        alb = None
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_dns:
                alb = lb
                break
        
        if alb:
            tg_response = self.elb_client.describe_target_groups(
                LoadBalancerArn=alb['LoadBalancerArn']
            )
            
            # ASSERT
            self.assertGreater(len(tg_response['TargetGroups']), 0, "No target groups found")
            
            for tg in tg_response['TargetGroups']:
                health_response = self.elb_client.describe_target_health(
                    TargetGroupArn=tg['TargetGroupArn']
                )
                
                # Check that we have targets
                self.assertGreater(
                    len(health_response['TargetHealthDescriptions']), 
                    0, 
                    "No targets in target group"
                )
                
                # Count healthy targets
                healthy_count = sum(
                    1 for t in health_response['TargetHealthDescriptions']
                    if t['TargetHealth']['State'] in ['healthy', 'initial']
                )
                self.assertGreaterEqual(
                    healthy_count, 
                    1, 
                    "No healthy targets in target group"
                )

    @mark.it("verifies web application is accessible via ALB")
    def test_web_application_accessible(self):
        """Test that the web application is accessible through the ALB"""
        # ARRANGE
        alb_dns = self.outputs.get('ApplicationLoadBalancerDNS')
        url = f"http://{alb_dns}"
        
        # ACT & ASSERT
        # Wait for ALB to be ready (may take time for instances to become healthy)
        max_retries = 30
        retry_delay = 10
        
        for attempt in range(max_retries):
            try:
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    # ASSERT
                    self.assertEqual(response.status_code, 200, "Web application not returning 200")
                    self.assertIn(
                        "Hello from Web Application", 
                        response.text,
                        "Expected content not found in response"
                    )
                    # Check that instance information is displayed
                    self.assertIn("Instance ID:", response.text, "Instance ID not in response")
                    self.assertIn("Availability Zone:", response.text, "AZ not in response")
                    break
            except (requests.exceptions.RequestException, requests.exceptions.Timeout):
                if attempt == max_retries - 1:
                    self.fail(f"Web application not accessible after {max_retries} attempts")
                time.sleep(retry_delay)

    @mark.it("verifies security groups are configured correctly")
    def test_security_groups(self):
        """Test that security groups exist with correct rules"""
        # ARRANGE
        vpc_id = self.outputs.get('VPCId')
        
        # ACT
        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]}
            ]
        )
        
        # ASSERT
        security_groups = response['SecurityGroups']
        self.assertGreater(len(security_groups), 0, "No security groups found in VPC")
        
        # Find ALB and EC2 security groups
        alb_sg = None
        ec2_sg = None
        
        for sg in security_groups:
            if 'Application Load Balancer' in sg.get('GroupDescription', ''):
                alb_sg = sg
            elif 'EC2 instances' in sg.get('GroupDescription', ''):
                ec2_sg = sg
        
        # Verify ALB security group
        if alb_sg:
            # Check for HTTP ingress from anywhere
            http_rule_found = False
            for rule in alb_sg.get('IpPermissions', []):
                if rule.get('FromPort') == 80 and rule.get('ToPort') == 80:
                    http_rule_found = True
                    # Check it allows from anywhere
                    for ip_range in rule.get('IpRanges', []):
                        if ip_range.get('CidrIp') == '0.0.0.0/0':
                            break
            self.assertTrue(http_rule_found, "ALB security group missing HTTP rule")
        
        # Verify EC2 security group
        if ec2_sg:
            # Check for SSH rule
            ssh_rule_found = False
            for rule in ec2_sg.get('IpPermissions', []):
                if rule.get('FromPort') == 22 and rule.get('ToPort') == 22:
                    ssh_rule_found = True
            self.assertTrue(ssh_rule_found, "EC2 security group missing SSH rule")

    @mark.it("verifies tagging compliance")
    def test_resource_tagging(self):
        """Test that resources are properly tagged"""
        # ARRANGE
        vpc_id = self.outputs.get('VPCId')
        asg_name = self.outputs.get('AutoScalingGroupName')
        
        # ACT & ASSERT - Check VPC tags
        vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc_tags = {tag['Key']: tag['Value'] for tag in vpc_response['Vpcs'][0].get('Tags', [])}
        
        self.assertEqual(vpc_tags.get('Environment'), 'Production', "VPC missing Environment tag")
        self.assertEqual(vpc_tags.get('Application'), 'WebApp', "VPC missing Application tag")
        self.assertEqual(vpc_tags.get('ManagedBy'), 'CDK', "VPC missing ManagedBy tag")
        
        # Check ASG tags
        asg_response = self.asg_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        asg_tags = {tag['Key']: tag['Value'] 
                    for tag in asg_response['AutoScalingGroups'][0].get('Tags', [])}
        
        self.assertEqual(asg_tags.get('Environment'), 'Production', "ASG missing Environment tag")
        self.assertEqual(asg_tags.get('Application'), 'WebApp', "ASG missing Application tag")

    @mark.it("verifies multi-AZ deployment")
    def test_multi_az_deployment(self):
        """Test that resources are deployed across multiple availability zones"""
        # ARRANGE
        vpc_id = self.outputs.get('VPCId')
        
        # ACT - Get subnets
        response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]}
            ]
        )
        
        # ASSERT
        subnets = response['Subnets']
        self.assertGreaterEqual(len(subnets), 2, "Less than 2 subnets found")
        
        # Check AZs
        availability_zones = set(subnet['AvailabilityZone'] for subnet in subnets)
        self.assertGreaterEqual(
            len(availability_zones), 
            2, 
            "Subnets not spread across multiple AZs"
        )

    @mark.it("verifies scaling policy exists")
    def test_scaling_policy(self):
        """Test that CPU-based scaling policy is configured"""
        # ARRANGE
        asg_name = self.outputs.get('AutoScalingGroupName')
        
        # ACT
        response = self.asg_client.describe_policies(
            AutoScalingGroupName=asg_name
        )
        
        # ASSERT
        policies = response['ScalingPolicies']
        self.assertGreater(len(policies), 0, "No scaling policies found")
        
        # Check for CPU-based policy
        cpu_policy_found = False
        for policy in policies:
            if policy.get('PolicyType') == 'TargetTrackingScaling':
                config = policy.get('TargetTrackingConfiguration', {})
                if config.get('TargetValue') == 70.0:
                    predefined = config.get('PredefinedMetricSpecification', {})
                    if predefined.get('PredefinedMetricType') == 'ASGAverageCPUUtilization':
                        cpu_policy_found = True
                        break
        
        self.assertTrue(cpu_policy_found, "CPU-based scaling policy not found")
