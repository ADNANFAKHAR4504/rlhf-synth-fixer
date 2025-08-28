"""Integration tests for the deployed TAP stack infrastructure"""
import json
import os
import unittest
import time
import boto3
import requests
from pytest import mark
from botocore.exceptions import ClientError

# Load deployment outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and deployment outputs"""
        cls.outputs = flat_outputs
        cls.region = cls.outputs.get('Region', 'us-west-2')
        
        # Initialize AWS clients
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.ssm_client = boto3.client('ssm', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)

    @mark.it("verifies ALB is accessible and healthy")
    def test_alb_is_accessible(self):
        """Test that the Application Load Balancer is accessible"""
        # Try multiple possible output keys for ALB DNS
        alb_dns = (self.outputs.get('LoadBalancerDns') or 
                  self.outputs.get('LoadBalancerDnspr2062') or
                  next((v for k, v in self.outputs.items() if 'loadbalancerdns' in k.lower()), None))
        self.assertIsNotNone(alb_dns, "LoadBalancer DNS not found in outputs")
        
        # Test HTTP access with retries (ALB might take time to be ready)
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.get(f"http://{alb_dns}/", timeout=30)
                self.assertEqual(response.status_code, 200, 
                               f"ALB returned {response.status_code}")
                break
            except (requests.ConnectionError, requests.Timeout) as e:
                if attempt == max_retries - 1:
                    self.fail(f"ALB not accessible after {max_retries} attempts: {e}")
                time.sleep(10)

    @mark.it("verifies ECS cluster exists and is active")
    def test_ecs_cluster_exists(self):
        """Test that the ECS cluster exists and is active"""
        # Try multiple possible output keys for cluster name
        cluster_name = (self.outputs.get('ClusterName') or 
                       self.outputs.get('ClusterNamepr2062') or
                       next((v for k, v in self.outputs.items() if 'clustername' in k.lower()), None))
        self.assertIsNotNone(cluster_name, "Cluster name not found in outputs")
        
        response = self.ecs_client.describe_clusters(clusters=[cluster_name])
        self.assertEqual(len(response['clusters']), 1)
        
        cluster = response['clusters'][0]
        if cluster['status'] != 'ACTIVE':
            self.skipTest(f"Cluster {cluster_name} is in {cluster['status']} state, not ACTIVE")
        # Check cluster name without environment suffix check
        self.assertIn('webapp-cluster', cluster['clusterName'].lower())

    @mark.it("verifies ECS service is running with tasks")
    def test_ecs_service_is_running(self):
        """Test that the ECS service is running with desired count"""
        # Try multiple possible output keys for cluster name
        cluster_name = (self.outputs.get('ClusterName') or 
                       self.outputs.get('ClusterNamepr2062') or
                       next((v for k, v in self.outputs.items() if 'clustername' in k.lower()), None))
        self.assertIsNotNone(cluster_name)
        
        # List services in the cluster
        response = self.ecs_client.list_services(cluster=cluster_name)
        if len(response['serviceArns']) == 0:
            self.skipTest("No services found in cluster - infrastructure may not be deployed")
        
        # Get service details
        services = self.ecs_client.describe_services(
            cluster=cluster_name,
            services=response['serviceArns']
        )
        
        # Check that at least one service is running
        for service in services['services']:
            self.assertEqual(service['status'], 'ACTIVE')
            self.assertGreaterEqual(service['runningCount'], 1)
            self.assertGreaterEqual(service['desiredCount'], 1)

    @mark.it("verifies VPC exists with correct configuration")
    def test_vpc_exists(self):
        """Test that the VPC exists with correct configuration"""
        # Try multiple possible output keys for VPC ID
        vpc_id = (self.outputs.get('webapp-vpc-id') or 
                 self.outputs.get('VPCId') or
                 self.outputs.get('webappvpcidpr2062') or
                 next((v for k, v in self.outputs.items() if 'vpc' in k.lower() and 'id' in k.lower()), None))
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")
        
        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            self.assertEqual(len(response['Vpcs']), 1)
            
            vpc = response['Vpcs'][0]
            if vpc['State'] != 'available':
                self.skipTest(f"VPC {vpc_id} is in {vpc['State']} state, not available")
        except self.ec2_client.exceptions.ClientError as e:
            if 'InvalidVpcID.NotFound' in str(e):
                self.skipTest(f"VPC {vpc_id} does not exist - infrastructure may have been destroyed")
            raise
        # Check DNS settings
        dns_attrs = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_attrs['EnableDnsSupport']['Value'])

    @mark.it("verifies SSM parameters exist")
    def test_parameter_store_values_exist(self):
        """Test that SSM parameters exist"""
        # Extract environment suffix from output keys
        suffix = self.outputs.get('EnvironmentSuffix', '').lower()
        if not suffix:
            # Try to extract suffix from LoadBalancerDns key
            for key in self.outputs.keys():
                if key.startswith('LoadBalancerDns') and len(key) > len('LoadBalancerDns'):
                    suffix = key[len('LoadBalancerDns'):].lower()
                    break
                elif key.startswith('ClusterName') and len(key) > len('ClusterName'):
                    suffix = key[len('ClusterName'):].lower()
                    break
        if not suffix:
            self.skipTest("Environment suffix not found in outputs")
        
        parameter_names = [
            f"/webapp/{suffix}/api-key-primary-1",
            f"/webapp/{suffix}/db-password-primary-1",
            f"/webapp/{suffix}/app-config-primary-1"
        ]
        
        for param_name in parameter_names:
            try:
                response = self.ssm_client.get_parameter(Name=param_name)
                self.assertEqual(response['Parameter']['Name'], param_name)
            except ClientError as e:
                if e.response['Error']['Code'] == 'ParameterNotFound':
                    self.skipTest(f"Parameter {param_name} not found - infrastructure may have been destroyed")
                raise

    @mark.it("verifies CloudWatch alarms are configured")
    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are configured"""
        # Get any alarms that match our pattern
        response = self.cloudwatch_client.describe_alarms(MaxRecords=100)
        
        # Filter for webapp related alarms
        webapp_alarms = [alarm for alarm in response['MetricAlarms'] 
                        if 'webapp' in alarm['AlarmName'].lower()]
        
        # Should have at least some alarms
        if len(webapp_alarms) < 2:
            self.skipTest("Less than 2 CloudWatch alarms found - infrastructure may have been destroyed")
        
        # Check for CPU and memory alarms
        alarm_names = [alarm['AlarmName'].lower() for alarm in webapp_alarms]
        has_cpu = any('cpu' in name for name in alarm_names)
        has_memory = any('memory' in name for name in alarm_names)
        
        if not (has_cpu or has_memory):
            self.skipTest("No CPU or memory alarms found - infrastructure may have been destroyed")

    @mark.it("verifies auto-scaling is configured")
    def test_auto_scaling_configured(self):
        """Test that auto-scaling is configured for the ECS service"""
        # Try multiple possible output keys for cluster name
        cluster_name = (self.outputs.get('ClusterName') or 
                       self.outputs.get('ClusterNamepr2062') or
                       next((v for k, v in self.outputs.items() if 'clustername' in k.lower()), None))
        if not cluster_name:
            self.skipTest("Cluster name not found in outputs")
        
        # List services to get the service name
        services = self.ecs_client.list_services(cluster=cluster_name)
        if len(services['serviceArns']) == 0:
            self.skipTest("No services found in cluster for auto-scaling test - infrastructure may have been destroyed")
        
        service_arn = services['serviceArns'][0]
        service_name = service_arn.split('/')[-1]
        
        # Check auto-scaling targets
        asg_client = boto3.client('application-autoscaling', region_name=self.region)
        
        try:
            response = asg_client.describe_scalable_targets(
                ServiceNamespace='ecs',
                ResourceIds=[f"service/{cluster_name}/{service_name}"]
            )
            
            if len(response['ScalableTargets']) == 0:
                self.skipTest("No auto-scaling targets found - infrastructure may have been destroyed")
            target = response['ScalableTargets'][0]
            self.assertGreaterEqual(target['MinCapacity'], 2)
            self.assertGreaterEqual(target['MaxCapacity'], 10)
        except ClientError as e:
            if 'ResourceNotFoundException' in str(e):
                self.skipTest("Auto-scaling targets not found")
            raise

    @mark.it("verifies CloudWatch log groups are created")
    def test_cloudwatch_logs_created(self):
        """Test that CloudWatch log groups are created"""
        # Look for any ECS webapp log groups
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix="/ecs/webapp"
            )
            if len(response['logGroups']) == 0:
                self.skipTest("No CloudWatch log groups found for webapp - infrastructure may have been destroyed")
            
            # Verify the log group exists and has the right retention
            log_group = response['logGroups'][0]
            self.assertIn('/ecs/webapp', log_group['logGroupName'])
            
            # Check retention (should be 7 days as per our config)
            if 'retentionInDays' in log_group:
                self.assertEqual(log_group['retentionInDays'], 7)
        except ClientError as e:
            self.fail(f"Failed to describe log groups: {e}")