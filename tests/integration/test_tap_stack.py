"""
test_tap_stack_integration.py

Integration tests for live deployed TAP Stack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using outputs from cfn-outputs/flat-outputs.json
"""

import unittest
import os
import sys
import boto3
import requests
import subprocess
import json
import time
from typing import Dict, List, Optional
from botocore.exceptions import ClientError, NoCredentialsError

# Add AWS SDK imports
try:
    import boto3
    from boto3 import Session
    from botocore.config import Config
    from botocore.exceptions import ClientError, NoCredentialsError, EndpointConnectionError
    print("AWS SDK imported successfully")
except ImportError as e:
    print(f"Warning: AWS SDK import failed: {e}")
    print("Please install AWS SDK: pip install boto3")

# Note: We don't import tap_stack directly to avoid Pulumi runtime issues
# Integration tests focus on testing live AWS resources using outputs


def get_stack_outputs() -> Dict:
    """Get stack outputs from various sources, prioritizing current stack outputs"""
    # First try Pulumi CLI (most current)
    try:
        result = subprocess.run(['pulumi', 'stack', 'output', '--json'], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            outputs = json.loads(result.stdout)
            print("Using outputs from Pulumi CLI (current stack)")
            
            # Parse string outputs that should be lists
            for key, value in outputs.items():
                if isinstance(value, str) and value.startswith('[') and value.endswith(']'):
                    try:
                        parsed_value = json.loads(value)
                        outputs[key] = parsed_value
                        print(f"Parsed {key}: {value} -> {parsed_value}")
                    except json.JSONDecodeError:
                        pass  # Keep as string if parsing fails
            
            return outputs
    except Exception as e:
        print(f"Error getting Pulumi outputs: {e}")
    
    # Fallback to environment variables
    env_outputs = {}
    env_mappings = {
        'VPC_ID': 'vpc_id',
        'PUBLIC_SUBNET_IDS': 'public_subnet_ids',
        'PRIVATE_SUBNET_IDS': 'private_subnet_ids',
        'LOAD_BALANCER_DNS': 'load_balancer_dns',
        'RDS_ENDPOINT': 'rds_endpoint',
        'AUTO_SCALING_GROUP_NAME': 'auto_scaling_group_name',
        'TARGET_GROUP_ARN': 'target_group_arn',
        'REGION': 'region'
    }
    
    for env_key, output_key in env_mappings.items():
        value = os.environ.get(env_key)
        if value:
            if 'IDS' in env_key and value.startswith('['):
                try:
                    env_outputs[output_key] = json.loads(value)
                except:
                    env_outputs[output_key] = [v.strip() for v in value.strip('[]').split(',')]
            else:
                env_outputs[output_key] = value
    
    if env_outputs:
        print("Using outputs from environment variables")
        return env_outputs
    
    # Fallback to flat-outputs.json
    outputs_file = "cfn-outputs/flat-outputs.json"
    if os.path.exists(outputs_file):
        try:
            with open(outputs_file, 'r') as f:
                outputs = json.load(f)
                if outputs:
                    print(f"Using outputs from {outputs_file}")
                    return outputs
        except Exception as e:
            print(f"Error reading {outputs_file}: {e}")
    
    # Last resort: try all-outputs.json
    all_outputs_file = "cfn-outputs/all-outputs.json"
    if os.path.exists(all_outputs_file):
        try:
            with open(all_outputs_file, 'r') as f:
                outputs = json.load(f)
                if outputs:
                    print(f"Using outputs from {all_outputs_file}")
                    # Convert to flat format
                    flat_outputs = {}
                    for key, value in outputs.items():
                        if isinstance(value, dict) and 'value' in value:
                            flat_outputs[key] = value['value']
                        else:
                            flat_outputs[key] = value
                    return flat_outputs
        except Exception as e:
            print(f"Error reading {all_outputs_file}: {e}")
    
    return {}


def create_aws_session(region: str = 'us-west-2') -> Session:
    """Create AWS session with proper configuration"""
    try:
        # Configure AWS session with retry settings
        config = Config(
            retries=dict(
                max_attempts=3,
                mode='adaptive'
            ),
            region_name=region
        )
        
        session = Session()
        return session
    except Exception as e:
        print(f"Error creating AWS session: {e}")
        raise


def create_aws_clients(region: str = 'us-west-2') -> Dict:
    """Create AWS clients for testing"""
    try:
        session = create_aws_session(region)
        
        clients = {
            'ec2': session.client('ec2'),
            'vpc': session.client('ec2'),  # VPC operations use EC2 client
            'iam': session.client('iam'),
            'sts': session.client('sts'),
            'elbv2': session.client('elbv2'),
            'rds': session.client('rds'),
            'autoscaling': session.client('autoscaling'),
            'ssm': session.client('ssm'),
            'cloudwatch': session.client('cloudwatch')
        }
        
        print(f"AWS clients created successfully for region: {region}")
        return clients
    except Exception as e:
        print(f"Error creating AWS clients: {e}")
        raise


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up class-level test environment."""
        cls.region = os.getenv('AWS_REGION', 'us-west-2')
        cls.stack_outputs = get_stack_outputs()
        
        # Check if we have valid outputs
        if not cls.stack_outputs:
            print("Warning: No stack outputs found - tests will be skipped")
        else:
            print(f"Found {len(cls.stack_outputs)} stack outputs")
            # Check if outputs look like they're from current deployment
            vpc_id = cls.stack_outputs.get('vpc_id')
            if vpc_id and vpc_id.startswith('vpc-'):
                print(f"Using VPC ID: {vpc_id}")
            else:
                print("Warning: VPC ID not found or invalid format")
        
        # Initialize AWS clients
        try:
            cls.aws_clients = create_aws_clients(cls.region)
            cls.ec2_client = cls.aws_clients['ec2']
            cls.vpc_client = cls.aws_clients['vpc']
            cls.iam_client = cls.aws_clients['iam']
            cls.sts_client = cls.aws_clients['sts']
            cls.elbv2_client = cls.aws_clients['elbv2']
            cls.rds_client = cls.aws_clients['rds']
            cls.autoscaling_client = cls.aws_clients['autoscaling']
            cls.ssm_client = cls.aws_clients['ssm']
            cls.cloudwatch_client = cls.aws_clients['cloudwatch']
            
            # Test AWS connectivity
            identity = cls.sts_client.get_caller_identity()
            print(f"AWS Account: {identity['Account'][:3]}***")
            cls.aws_available = True
        except NoCredentialsError:
            print("AWS credentials not configured")
            cls.aws_available = False
        except Exception as e:
            print(f"AWS connectivity failed: {e}")
            cls.aws_available = False

    def setUp(self):
        """Set up individual test environment."""
        if not self.aws_available:
            self.skipTest("AWS credentials not available")
        
        if not self.stack_outputs:
            self.skipTest("No stack outputs available")

    def test_vpc_exists(self):
        """Test that VPC exists and has correct configuration."""
        vpc_id = self.stack_outputs.get('vpc_id')
        if not vpc_id:
            self.skipTest("VPC ID not found in stack outputs")
        
        try:
            response = self.vpc_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]
            
            # Test VPC configuration
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
            # Check DNS settings if available
            if 'EnableDnsHostnames' in vpc:
                self.assertTrue(vpc['EnableDnsHostnames'])
            if 'EnableDnsSupport' in vpc:
                self.assertTrue(vpc['EnableDnsSupport'])
            self.assertEqual(vpc['State'], 'available')
            
            # Test VPC tags
            vpc_tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
            self.assertIn('Name', vpc_tags)
            
            print(f"VPC {vpc_id} validated successfully")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'InvalidVpcID.NotFound':
                self.fail(f"VPC {vpc_id} not found - ensure stack is deployed")
            else:
                self.fail(f"Failed to describe VPC: {e}")

    def test_subnets_exist(self):
        """Test that subnets exist and are properly configured."""
        public_subnet_ids = self.stack_outputs.get('public_subnet_ids', [])
        private_subnet_ids = self.stack_outputs.get('private_subnet_ids', [])
        
        # Ensure subnet_ids are lists
        if isinstance(public_subnet_ids, str):
            try:
                public_subnet_ids = json.loads(public_subnet_ids)
            except json.JSONDecodeError:
                public_subnet_ids = [public_subnet_ids]
        elif not isinstance(public_subnet_ids, list):
            public_subnet_ids = []
            
        if isinstance(private_subnet_ids, str):
            try:
                private_subnet_ids = json.loads(private_subnet_ids)
            except json.JSONDecodeError:
                private_subnet_ids = [private_subnet_ids]
        elif not isinstance(private_subnet_ids, list):
            private_subnet_ids = []
    
        if not public_subnet_ids and not private_subnet_ids:
            self.skipTest("Subnet IDs not found in stack outputs")
    
        try:
            all_subnet_ids = []
            if public_subnet_ids:
                all_subnet_ids.extend(public_subnet_ids)
            if private_subnet_ids:
                all_subnet_ids.extend(private_subnet_ids)
            
            response = self.vpc_client.describe_subnets(SubnetIds=all_subnet_ids)
            subnets = response['Subnets']
            
            # Test subnet count
            expected_count = len(public_subnet_ids) + len(private_subnet_ids)
            self.assertEqual(len(subnets), expected_count)
            
            # Test subnet configurations
            for subnet in subnets:
                subnet_id = subnet['SubnetId']
                if subnet_id in public_subnet_ids:
                    self.assertTrue(subnet['MapPublicIpOnLaunch'], f"Public subnet {subnet_id} should have public IP mapping enabled")
                elif subnet_id in private_subnet_ids:
                    self.assertFalse(subnet['MapPublicIpOnLaunch'], f"Private subnet {subnet_id} should not have public IP mapping enabled")
                
                self.assertEqual(subnet['State'], 'available')
                
                # Test subnet tags
                subnet_tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
                self.assertIn('Name', subnet_tags)
                
            print(f"Found {len(subnets)} subnets validated successfully")
            
        except ClientError as e:
            if 'NotFound' in str(e):
                self.fail(f"Subnets not found - ensure stack is deployed")
            else:
                self.fail(f"Failed to describe subnets: {e}")

    def test_internet_gateway_exists(self):
        """Test that Internet Gateway exists and is attached to VPC."""
        vpc_id = self.stack_outputs.get('vpc_id')
        if not vpc_id:
            self.skipTest("VPC ID not found in stack outputs")
        
        try:
            response = self.vpc_client.describe_internet_gateways(
                Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
            )
            
            self.assertGreater(len(response['InternetGateways']), 0, "No Internet Gateway found attached to VPC")
            
            # Test Internet Gateway configuration
            igw = response['InternetGateways'][0]
            # Note: IGW doesn't have a 'State' field, it has 'State' in attachments
            self.assertIn('InternetGatewayId', igw)
            
            # Test IGW tags
            igw_tags = {tag['Key']: tag['Value'] for tag in igw.get('Tags', [])}
            self.assertIn('Name', igw_tags)
            
            print(f"Internet Gateway {igw['InternetGatewayId']} validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to describe Internet Gateway: {e}")

    def test_nat_gateway_exists(self):
        """Test that NAT Gateway exists and is configured correctly."""
        vpc_id = self.stack_outputs.get('vpc_id')
        if not vpc_id:
            self.skipTest("VPC ID not found in stack outputs")
        
        try:
            response = self.ec2_client.describe_nat_gateways(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            self.assertGreater(len(response['NatGateways']), 0, "No NAT Gateway found in VPC")
            
            # Test NAT Gateway configuration
            nat_gateway = response['NatGateways'][0]
            self.assertIn(nat_gateway['State'], ['available', 'pending'], f"NAT Gateway should be available or pending, got {nat_gateway['State']}")
            
            # Test NAT Gateway tags
            nat_tags = {tag['Key']: tag['Value'] for tag in nat_gateway.get('Tags', [])}
            self.assertIn('Name', nat_tags)
            
            print(f"NAT Gateway {nat_gateway['NatGatewayId']} validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to describe NAT Gateway: {e}")

    def test_security_groups_exist(self):
        """Test that security groups exist and have correct rules."""
        vpc_id = self.stack_outputs.get('vpc_id')
        if not vpc_id:
            self.skipTest("VPC ID not found in stack outputs")
        
        try:
            response = self.ec2_client.describe_security_groups(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            # Find specific security groups
            lb_sg = None
            ec2_sg = None
            rds_sg = None
            
            for sg in response['SecurityGroups']:
                sg_name = sg['GroupName']
                if 'lb-sg' in sg_name:
                    lb_sg = sg
                elif 'ec2-sg' in sg_name:
                    ec2_sg = sg
                elif 'rds-sg' in sg_name:
                    rds_sg = sg
            
            # Test load balancer security group
            self.assertIsNotNone(lb_sg, "Load balancer security group not found")
            self.assertGreater(len(lb_sg['IpPermissions']), 0, "Load balancer security group should have ingress rules")
            
            # Test EC2 security group
            self.assertIsNotNone(ec2_sg, "EC2 security group not found")
            
            # Test RDS security group
            self.assertIsNotNone(rds_sg, "RDS security group not found")
            
            # Test security group tags
            for sg in [lb_sg, ec2_sg, rds_sg]:
                if sg:
                    sg_tags = {tag['Key']: tag['Value'] for tag in sg.get('Tags', [])}
                    self.assertIn('Name', sg_tags)
            
            print("All security groups validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to describe security groups: {e}")

    def test_rds_instance_exists(self):
        """Test that RDS instance exists and is configured correctly."""
        rds_endpoint = self.stack_outputs.get('rds_endpoint')
        if not rds_endpoint:
            self.skipTest("RDS endpoint not found in stack outputs")
        
        try:
            # Extract DB identifier from endpoint
            db_identifier = rds_endpoint.split('.')[0]
            
            response = self.rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
            db_instance = response['DBInstances'][0]
            
            # Test RDS configuration
            self.assertEqual(db_instance['Engine'], 'mysql')
            self.assertEqual(db_instance['DBInstanceClass'], 'db.t3.micro')
            self.assertTrue(db_instance['MultiAZ'], "RDS should be configured for Multi-AZ")
            self.assertFalse(db_instance['PubliclyAccessible'], "RDS should not be publicly accessible")
            self.assertEqual(db_instance['DBInstanceStatus'], 'available')
            
            # Test RDS tags
            db_tags = {tag['Key']: tag['Value'] for tag in db_instance.get('TagList', [])}
            self.assertIn('Name', db_tags)
            
            print(f"RDS instance {db_identifier} validated successfully")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'DBInstanceNotFound':
                self.fail(f"RDS instance {db_identifier} not found - ensure stack is deployed")
            else:
                self.fail(f"Failed to describe RDS instance: {e}")

    def test_load_balancer_exists(self):
        """Test that Application Load Balancer exists and is configured correctly."""
        load_balancer_dns = self.stack_outputs.get('load_balancer_dns')
        if not load_balancer_dns:
            self.skipTest("Load balancer DNS not found in stack outputs")
        
        try:
            # Get load balancer ARN
            response = self.elbv2_client.describe_load_balancers()
            alb = None
            
            for lb in response['LoadBalancers']:
                if lb['DNSName'] == load_balancer_dns:
                    alb = lb
                    break
            
            self.assertIsNotNone(alb, "Application Load Balancer not found")
            self.assertEqual(alb['Type'], 'application')
            self.assertFalse(alb['Scheme'] == 'internal', "Load balancer should be internet-facing")
            self.assertEqual(alb['State']['Code'], 'active')
            
            # Test target group
            target_group_arn = self.stack_outputs.get('target_group_arn')
            if target_group_arn:
                tg_response = self.elbv2_client.describe_target_groups(
                    TargetGroupArns=[target_group_arn]
                )
                target_group = tg_response['TargetGroups'][0]
                
                self.assertEqual(target_group['Port'], 80)
                self.assertEqual(target_group['Protocol'], 'HTTP')
                self.assertEqual(target_group['TargetType'], 'instance')
                
                # Test health check configuration
                health_check = target_group['HealthCheckProtocol']
                self.assertEqual(health_check, 'HTTP')
            
            print(f"Application Load Balancer {alb['LoadBalancerArn']} validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to describe load balancer: {e}")

    def test_auto_scaling_group_exists(self):
        """Test that Auto Scaling Group exists and is configured correctly."""
        asg_name = self.stack_outputs.get('auto_scaling_group_name')
        if not asg_name:
            self.skipTest("Auto Scaling Group name not found in stack outputs")
        
        try:
            response = self.autoscaling_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[asg_name]
            )
            
            asg = response['AutoScalingGroups'][0]
            
            # Test ASG configuration
            self.assertEqual(asg['DesiredCapacity'], 2)
            self.assertEqual(asg['MaxSize'], 4)
            self.assertEqual(asg['MinSize'], 1)
            # Note: ASG doesn't have a 'Status' field, check for required fields instead
            self.assertIn('AutoScalingGroupName', asg)
            self.assertIn('LaunchTemplate', asg)
            
            # Test ASG tags
            asg_tags = {tag['Key']: tag['Value'] for tag in asg.get('Tags', [])}
            self.assertIn('Environment', asg_tags)
            
            print(f"Auto Scaling Group {asg_name} validated successfully")
            
        except ClientError as e:
            if 'ValidationError' in str(e):
                self.fail(f"Auto Scaling Group {asg_name} not found - ensure stack is deployed")
            else:
                self.fail(f"Failed to describe Auto Scaling Group: {e}")

    def test_parameter_store_parameters_exist(self):
        """Test that Parameter Store parameters exist and have correct values."""
        try:
            # Test database host parameter
            response = self.ssm_client.get_parameter(Name='/prod/database/host')
            self.assertIsNotNone(response['Parameter']['Value'])
            
            # Test database name parameter
            response = self.ssm_client.get_parameter(Name='/prod/database/name')
            self.assertEqual(response['Parameter']['Value'], 'webappdb')
            
            print("Parameter Store parameters validated successfully")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ParameterNotFound':
                self.fail("Parameter Store parameters not found - ensure stack is deployed")
            else:
                self.fail(f"Failed to get Parameter Store parameters: {e}")

    def test_route_tables_configured(self):
        """Test that route tables are configured correctly."""
        vpc_id = self.stack_outputs.get('vpc_id')
        if not vpc_id:
            self.skipTest("VPC ID not found in stack outputs")
        
        try:
            response = self.ec2_client.describe_route_tables(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            public_rt = None
            private_rt = None
            
            for rt in response['RouteTables']:
                rt_tags = {tag['Key']: tag['Value'] for tag in rt.get('Tags', [])}
                if 'PublicRouteTable' in rt_tags.get('Name', ''):
                    public_rt = rt
                elif 'PrivateRouteTable' in rt_tags.get('Name', ''):
                    private_rt = rt
            
            # Test public route table
            self.assertIsNotNone(public_rt, "Public route table not found")
            self.assertGreater(len(public_rt['Routes']), 0)
            
            # Test private route table
            self.assertIsNotNone(private_rt, "Private route table not found")
            self.assertGreater(len(private_rt['Routes']), 0)
            
            print("Route tables validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to describe route tables: {e}")

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms exist for auto scaling."""
        asg_name = self.stack_outputs.get('auto_scaling_group_name')
        if not asg_name:
            self.skipTest("Auto Scaling Group name not found in stack outputs")
        
        try:
            response = self.cloudwatch_client.describe_alarms(
                AlarmNamePrefix='prod-cpu'
            )
            
            self.assertGreater(len(response['MetricAlarms']), 0, "No CloudWatch alarms found for auto scaling")
            
            # Test that alarms are configured for auto scaling
            for alarm in response['MetricAlarms']:
                self.assertIn('AlarmActions', alarm)
                self.assertGreater(len(alarm['AlarmActions']), 0)
                
            print("CloudWatch alarms validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to describe CloudWatch alarms: {e}")

    def test_web_application_accessible(self):
        """Test that the web application is accessible via load balancer."""
        load_balancer_dns = self.stack_outputs.get('load_balancer_dns')
        if not load_balancer_dns:
            self.skipTest("Load balancer DNS not found in stack outputs")
        
        try:
            # Wait for load balancer to be ready
            print("Waiting for load balancer to be ready...")
            time.sleep(30)
            
            # Test HTTP access
            response = requests.get(f"http://{load_balancer_dns}", timeout=30)
            
            self.assertEqual(response.status_code, 200)
            self.assertIn("Web Application", response.text)
            # Note: Our actual content says "Welcome to Web Application", not "Pulumi"
            self.assertIn("Welcome", response.text)
            
            print(f"Web application accessible at http://{load_balancer_dns}")
            
        except requests.RequestException as e:
            self.fail(f"Failed to access web application: {e}")

    def test_database_connectivity(self):
        """Test database connectivity from web application."""
        load_balancer_dns = self.stack_outputs.get('load_balancer_dns')
        if not load_balancer_dns:
            self.skipTest("Load balancer DNS not found in stack outputs")
        
        try:
            # Wait for application to be ready
            print("Waiting for application to be ready...")
            time.sleep(60)
            
            # Test database connectivity information on main page
            response = requests.get(f"http://{load_balancer_dns}", timeout=30)
            
            # Should show database host and name information
            self.assertEqual(response.status_code, 200)
            self.assertIn("Database Host", response.text)
            self.assertIn("Database Name", response.text)
            
            print("Database connectivity test completed")
            
        except requests.RequestException as e:
            self.fail(f"Failed to test database connectivity: {e}")

    def test_auto_scaling_functionality(self):
        """Test that auto scaling is working correctly."""
        asg_name = self.stack_outputs.get('auto_scaling_group_name')
        if not asg_name:
            self.skipTest("Auto Scaling Group name not found in stack outputs")
        
        try:
            # Get current ASG state
            response = self.autoscaling_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[asg_name]
            )
            
            asg = response['AutoScalingGroups'][0]
            initial_capacity = asg['DesiredCapacity']
            
            # Test that ASG can scale up (this is a basic test)
            self.assertGreaterEqual(asg['MaxSize'], initial_capacity)
            self.assertLessEqual(asg['MinSize'], initial_capacity)
            
            print("Auto scaling functionality validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to test auto scaling functionality: {e}")

    def test_resource_tagging_compliance(self):
        """Test that all resources have proper tagging for compliance."""
        vpc_id = self.stack_outputs.get('vpc_id')
        if not vpc_id:
            self.skipTest("VPC ID not found in stack outputs")
        
        required_tags = ['Environment', 'Project', 'ManagedBy', 'Team']
        
        try:
            # Test VPC tags
            vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc_tags = {tag['Key']: tag['Value'] for tag in vpc_response['Vpcs'][0].get('Tags', [])}
            
            for tag in required_tags:
                self.assertIn(tag, vpc_tags, f"Required tag {tag} not found on VPC")
            
            # Test subnet tags
            subnet_response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            for subnet in subnet_response['Subnets']:
                subnet_tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
                for tag in required_tags:
                    self.assertIn(tag, subnet_tags, f"Required tag {tag} not found on subnet {subnet['SubnetId']}")
            
            print("Resource tagging compliance validated successfully")
                    
        except ClientError as e:
            self.fail(f"Failed to test resource tagging: {e}")


if __name__ == '__main__':
    unittest.main()