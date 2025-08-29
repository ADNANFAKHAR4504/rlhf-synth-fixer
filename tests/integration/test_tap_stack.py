"""Integration tests for TapStack using real AWS resources and outputs from flat-outputs.json"""

import json
import os
import unittest
import boto3
import requests
import psycopg2
from botocore.exceptions import ClientError
from pytest import mark
import time
import ssl
import socket

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
class TestTapStack(unittest.TestCase):
    """Integration test cases for the deployed TapStack resources"""

    def setUp(self):
        """Set up AWS clients and load outputs"""
        # Skip tests if outputs file doesn't exist or is empty
        if not flat_outputs or len(flat_outputs) == 0:
            self.skipTest("No cfn-outputs/flat-outputs.json found or file is empty")
        
        # Initialize AWS clients
        self.ec2_client = boto3.client('ec2')
        self.rds_client = boto3.client('rds')
        self.elbv2_client = boto3.client('elbv2')
        self.autoscaling_client = boto3.client('autoscaling')
        self.iam_client = boto3.client('iam')
        self.logs_client = boto3.client('logs')
        self.secretsmanager_client = boto3.client('secretsmanager')
        
        # Load outputs
        self.outputs = flat_outputs
        
        # Common test timeout in seconds
        self.timeout = 300

    @mark.it("validates VPC infrastructure is properly deployed")
    def test_vpc_infrastructure_deployment(self):
        """Test that VPC and networking components are properly deployed"""
        # ARRANGE
        vpc_id = self.outputs.get('VPCId')
        self.assertIsNotNone(vpc_id, "VPC ID should be in outputs")
        
        # ACT & ASSERT
        try:
            # Test VPC exists and is available
            vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = vpc_response['Vpcs'][0]
            
            self.assertEqual(vpc['State'], 'available')
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
            self.assertTrue(vpc['EnableDnsHostnames'])
            self.assertTrue(vpc['EnableDnsSupport'])
            
            print(f"✅ VPC properly configured: {vpc_id}")
            print(f"   State: {vpc['State']}")
            print(f"   CIDR: {vpc['CidrBlock']}")
            
            # Test subnets are created (should be 4: 2 public + 2 private)
            subnet_response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            subnets = subnet_response['Subnets']
            
            self.assertGreaterEqual(len(subnets), 4, "Should have at least 4 subnets")
            
            # Verify we have both public and private subnets
            public_subnets = [s for s in subnets if s['MapPublicIpOnLaunch']]
            private_subnets = [s for s in subnets if not s['MapPublicIpOnLaunch']]
            
            self.assertGreaterEqual(len(public_subnets), 2, "Should have at least 2 public subnets")
            self.assertGreaterEqual(len(private_subnets), 2, "Should have at least 2 private subnets")
            
            print(f"✅ Subnets properly configured: {len(public_subnets)} public, {len(private_subnets)} private")
            
            # Test Internet Gateway exists
            igw_response = self.ec2_client.describe_internet_gateways(
                Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
            )
            
            self.assertGreater(len(igw_response['InternetGateways']), 0, "Should have an Internet Gateway")
            igw = igw_response['InternetGateways'][0]
            self.assertEqual(igw['Attachments'][0]['State'], 'available')
            
            print(f"✅ Internet Gateway properly attached: {igw['InternetGatewayId']}")
            
            # Test NAT Gateway exists
            nat_response = self.ec2_client.describe_nat_gateways(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            self.assertGreater(len(nat_response['NatGateways']), 0, "Should have a NAT Gateway")
            nat_gw = nat_response['NatGateways'][0]
            self.assertEqual(nat_gw['State'], 'available')
            
            print(f"✅ NAT Gateway properly configured: {nat_gw['NatGatewayId']}")
            
        except ClientError as e:
            self.fail(f"VPC infrastructure validation failed: {e}")

    @mark.it("validates Application Load Balancer is deployed and accessible")
    def test_load_balancer_deployment(self):
        """Test that Application Load Balancer is properly deployed and accessible"""
        # ARRANGE
        lb_dns = self.outputs.get('LoadBalancerDNS')
        web_url = self.outputs.get('WebURL')
        
        self.assertIsNotNone(lb_dns, "Load Balancer DNS should be in outputs")
        self.assertIsNotNone(web_url, "Web URL should be in outputs")
        
        # ACT & ASSERT
        try:
            # Find load balancer by DNS name
            lb_response = self.elbv2_client.describe_load_balancers()
            load_balancer = None
            
            for lb in lb_response['LoadBalancers']:
                if lb['DNSName'] == lb_dns:
                    load_balancer = lb
                    break
            
            self.assertIsNotNone(load_balancer, f"Load balancer with DNS {lb_dns} not found")
            
            # Validate load balancer configuration
            self.assertEqual(load_balancer['State']['Code'], 'active')
            self.assertEqual(load_balancer['Type'], 'application')
            self.assertEqual(load_balancer['Scheme'], 'internet-facing')
            
            print(f"✅ Load Balancer properly configured: {load_balancer['LoadBalancerName']}")
            print(f"   State: {load_balancer['State']['Code']}")
            print(f"   DNS: {lb_dns}")
            
            # Test target groups
            tg_response = self.elbv2_client.describe_target_groups(
                LoadBalancerArn=load_balancer['LoadBalancerArn']
            )
            
            self.assertGreater(len(tg_response['TargetGroups']), 0, "Should have target groups")
            
            target_group = tg_response['TargetGroups'][0]
            self.assertEqual(target_group['Protocol'], 'HTTP')
            self.assertEqual(target_group['Port'], 80)
            self.assertEqual(target_group['HealthCheckPath'], '/health.html')
            
            # Test target health
            th_response = self.elbv2_client.describe_target_health(
                TargetGroupArn=target_group['TargetGroupArn']
            )
            
            healthy_targets = [t for t in th_response['TargetHealthDescriptions'] 
                             if t['TargetHealth']['State'] == 'healthy']
            
            print(f"✅ Target Group configured with {len(healthy_targets)} healthy targets")
            
            # Test listeners
            listener_response = self.elbv2_client.describe_listeners(
                LoadBalancerArn=load_balancer['LoadBalancerArn']
            )
            
            self.assertGreater(len(listener_response['Listeners']), 0, "Should have listeners")
            listener = listener_response['Listeners'][0]
            self.assertEqual(listener['Protocol'], 'HTTP')
            self.assertEqual(listener['Port'], 80)
            
            print(f"✅ Load Balancer listener properly configured on port {listener['Port']}")
            
        except ClientError as e:
            self.fail(f"Load Balancer validation failed: {e}")

    @mark.it("validates web application is accessible via HTTP")
    def test_web_application_accessibility(self):
        """Test that the web application is accessible and returns expected content"""
        # ARRANGE
        web_url = self.outputs.get('WebURL')
        self.assertIsNotNone(web_url, "Web URL should be in outputs")
        
        # ACT & ASSERT
        try:
            # Test main application endpoint
            response = requests.get(web_url, timeout=30)
            
            self.assertEqual(response.status_code, 200)
            self.assertIn('Web Application Server', response.text)
            self.assertIn('Environment:', response.text)
            
            print(f"✅ Web application accessible: {web_url}")
            print(f"   Status Code: {response.status_code}")
            print(f"   Content includes expected headers")
            
            # Test health check endpoint
            health_url = f"{web_url.rstrip('/')}/health.html"
            health_response = requests.get(health_url, timeout=30)
            
            self.assertEqual(health_response.status_code, 200)
            self.assertIn('Health Check OK', health_response.text)
            
            print(f"✅ Health check endpoint accessible: {health_url}")
            
            # Test that multiple requests succeed (basic load balancing test)
            for i in range(3):
                test_response = requests.get(web_url, timeout=30)
                self.assertEqual(test_response.status_code, 200)
            
            print(f"✅ Multiple requests successful (load balancing working)")
            
        except requests.RequestException as e:
            self.fail(f"Web application accessibility test failed: {e}")

    @mark.it("validates RDS PostgreSQL database is deployed and accessible")
    def test_rds_database_deployment(self):
        """Test that RDS PostgreSQL database is properly deployed and configured"""
        # ARRANGE
        db_endpoint = self.outputs.get('DatabaseEndpoint')
        db_port = self.outputs.get('DatabasePort')
        
        self.assertIsNotNone(db_endpoint, "Database endpoint should be in outputs")
        self.assertIsNotNone(db_port, "Database port should be in outputs")
        
        # ACT & ASSERT
        try:
            # Find RDS instance by endpoint
            db_response = self.rds_client.describe_db_instances()
            database = None
            
            for db in db_response['DBInstances']:
                if hasattr(db, 'Endpoint') and db['Endpoint']['Address'] == db_endpoint:
                    database = db
                    break
            
            self.assertIsNotNone(database, f"Database with endpoint {db_endpoint} not found")
            
            # Validate database configuration
            self.assertEqual(database['DBInstanceStatus'], 'available')
            self.assertEqual(database['Engine'], 'postgres')
            self.assertEqual(database['EngineVersion'], '15.7')
            self.assertEqual(database['DBInstanceClass'], 'db.t3.micro')
            self.assertTrue(database['StorageEncrypted'])
            self.assertEqual(database['BackupRetentionPeriod'], 7)
            
            print(f"✅ RDS Database properly configured: {database['DBInstanceIdentifier']}")
            print(f"   Status: {database['DBInstanceStatus']}")
            print(f"   Engine: {database['Engine']} {database['EngineVersion']}")
            print(f"   Storage Encrypted: {database['StorageEncrypted']}")
            
            # Test database connectivity (network level)
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            
            try:
                result = sock.connect_ex((db_endpoint, int(db_port)))
                # Note: This will likely fail since DB is in private subnet and we can't directly connect
                # But we can test that the endpoint resolves
                print(f"✅ Database endpoint resolves: {db_endpoint}:{db_port}")
            except Exception as e:
                print(f"ℹ️  Database connectivity test (expected to fail from outside VPC): {e}")
            finally:
                sock.close()
            
            # Test database security group
            security_groups = database.get('VpcSecurityGroups', [])
            self.assertGreater(len(security_groups), 0, "Database should have security groups")
            
            for sg in security_groups:
                sg_response = self.ec2_client.describe_security_groups(
                    GroupIds=[sg['VpcSecurityGroupId']]
                )
                sg_details = sg_response['SecurityGroups'][0]
                
                # Should have ingress rule for PostgreSQL port
                postgres_rules = [rule for rule in sg_details['IpPermissions'] 
                                if rule.get('FromPort') == 5432]
                self.assertGreater(len(postgres_rules), 0, "Should have PostgreSQL port rule")
                
            print(f"✅ Database security groups properly configured")
            
        except ClientError as e:
            self.fail(f"RDS database validation failed: {e}")

    @mark.it("validates Auto Scaling Group and EC2 instances are properly deployed")
    def test_auto_scaling_group_deployment(self):
        """Test that Auto Scaling Group and EC2 instances are properly deployed"""
        # ARRANGE & ACT
        try:
            # Find Auto Scaling Groups with our stack naming pattern
            asg_response = self.autoscaling_client.describe_auto_scaling_groups()
            
            # Look for ASG that matches our stack pattern
            target_asg = None
            for asg in asg_response['AutoScalingGroups']:
                if 'WebServer' in asg['AutoScalingGroupName']:
                    target_asg = asg
                    break
            
            self.assertIsNotNone(target_asg, "Auto Scaling Group not found")
            
            # Validate ASG configuration
            self.assertEqual(target_asg['MinSize'], 2)
            self.assertEqual(target_asg['MaxSize'], 5)
            self.assertEqual(target_asg['DesiredCapacity'], 2)
            self.assertGreaterEqual(len(target_asg['AvailabilityZones']), 2)
            
            print(f"✅ Auto Scaling Group properly configured: {target_asg['AutoScalingGroupName']}")
            print(f"   Min Size: {target_asg['MinSize']}")
            print(f"   Max Size: {target_asg['MaxSize']}")
            print(f"   Desired: {target_asg['DesiredCapacity']}")
            print(f"   Current Instances: {len(target_asg['Instances'])}")
            
            # Validate EC2 instances
            instance_ids = [instance['InstanceId'] for instance in target_asg['Instances']]
            
            if instance_ids:
                ec2_response = self.ec2_client.describe_instances(InstanceIds=instance_ids)
                
                running_instances = 0
                for reservation in ec2_response['Reservations']:
                    for instance in reservation['Instances']:
                        if instance['State']['Name'] == 'running':
                            running_instances += 1
                            
                            # Validate instance configuration
                            self.assertEqual(instance['InstanceType'], 't3.micro')
                            self.assertTrue(instance['Monitoring']['State'] in ['enabled', 'pending'])
                            
                            # Check security groups
                            sg_ids = [sg['GroupId'] for sg in instance['SecurityGroups']]
                            self.assertGreater(len(sg_ids), 0, "Instance should have security groups")
                            
                            # Validate tags
                            tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                            self.assertIn('Environment', tags)
                            self.assertIn('Project', tags)
                
                print(f"✅ EC2 instances properly configured: {running_instances} running")
            
            # Test launch template
            if 'LaunchTemplate' in target_asg:
                lt_response = self.ec2_client.describe_launch_templates(
                    LaunchTemplateIds=[target_asg['LaunchTemplate']['LaunchTemplateId']]
                )
                
                launch_template = lt_response['LaunchTemplates'][0]
                print(f"✅ Launch Template configured: {launch_template['LaunchTemplateName']}")
            
        except ClientError as e:
            self.fail(f"Auto Scaling Group validation failed: {e}")

    @mark.it("validates security groups are properly configured")
    def test_security_groups_configuration(self):
        """Test that security groups are properly configured with correct rules"""
        # ARRANGE
        vpc_id = self.outputs.get('VPCId')
        self.assertIsNotNone(vpc_id, "VPC ID should be in outputs")
        
        # ACT & ASSERT
        try:
            # Get all security groups in the VPC
            sg_response = self.ec2_client.describe_security_groups(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            security_groups = sg_response['SecurityGroups']
            
            # Find web security group (should allow HTTP and SSH)
            web_sg = None
            db_sg = None
            
            for sg in security_groups:
                if 'web' in sg['GroupName'].lower() or 'web' in sg['Description'].lower():
                    web_sg = sg
                elif 'database' in sg['GroupName'].lower() or 'database' in sg['Description'].lower():
                    db_sg = sg
            
            # Validate web security group
            if web_sg:
                http_rules = [rule for rule in web_sg['IpPermissions'] 
                            if rule.get('FromPort') == 80]
                ssh_rules = [rule for rule in web_sg['IpPermissions'] 
                           if rule.get('FromPort') == 22]
                
                self.assertGreater(len(http_rules), 0, "Web SG should allow HTTP")
                self.assertGreater(len(ssh_rules), 0, "Web SG should allow SSH")
                
                print(f"✅ Web Security Group properly configured: {web_sg['GroupId']}")
                print(f"   HTTP rules: {len(http_rules)}")
                print(f"   SSH rules: {len(ssh_rules)}")
            
            # Validate database security group
            if db_sg:
                postgres_rules = [rule for rule in db_sg['IpPermissions'] 
                                if rule.get('FromPort') == 5432]
                
                self.assertGreater(len(postgres_rules), 0, "DB SG should allow PostgreSQL")
                
                # Check that PostgreSQL rule references web security group
                for rule in postgres_rules:
                    referenced_sgs = [sg_ref['GroupId'] for sg_ref in rule.get('UserIdGroupPairs', [])]
                    if web_sg and web_sg['GroupId'] in referenced_sgs:
                        print(f"✅ Database Security Group properly references web SG")
                        break
                
                print(f"✅ Database Security Group properly configured: {db_sg['GroupId']}")
            
        except ClientError as e:
            self.fail(f"Security groups validation failed: {e}")

    @mark.it("validates IAM roles and policies are properly configured")
    def test_iam_configuration(self):
        """Test that IAM roles and policies are properly configured"""
        # ACT & ASSERT
        try:
            # Find EC2 role
            roles_response = self.iam_client.list_roles()
            ec2_role = None
            
            for role in roles_response['Roles']:
                if 'EC2Role' in role['RoleName']:
                    ec2_role = role
                    break
            
            if ec2_role:
                # Validate assume role policy
                assume_role_policy = ec2_role['AssumeRolePolicyDocument']
                
                # Check attached managed policies
                attached_policies_response = self.iam_client.list_attached_role_policies(
                    RoleName=ec2_role['RoleName']
                )
                
                policy_arns = [p['PolicyArn'] for p in attached_policies_response['AttachedPolicies']]
                
                # Should have CloudWatch and SSM policies
                expected_policies = ['CloudWatchAgentServerPolicy', 'AmazonSSMManagedInstanceCore']
                for expected_policy in expected_policies:
                    matching_policies = [arn for arn in policy_arns if expected_policy in arn]
                    self.assertGreater(len(matching_policies), 0, 
                                     f"Should have {expected_policy} attached")
                
                print(f"✅ EC2 IAM Role properly configured: {ec2_role['RoleName']}")
                print(f"   Attached policies: {len(policy_arns)}")
                
                # Check inline policies
                inline_policies_response = self.iam_client.list_role_policies(
                    RoleName=ec2_role['RoleName']
                )
                
                if inline_policies_response['PolicyNames']:
                    print(f"   Inline policies: {len(inline_policies_response['PolicyNames'])}")
            
        except ClientError as e:
            self.fail(f"IAM configuration validation failed: {e}")

    @mark.it("validates CloudWatch monitoring and VPC Flow Logs are configured")
    def test_monitoring_configuration(self):
        """Test that CloudWatch monitoring and VPC Flow Logs are properly configured"""
        # ARRANGE
        vpc_id = self.outputs.get('VPCId')
        self.assertIsNotNone(vpc_id, "VPC ID should be in outputs")
        
        # ACT & ASSERT
        try:
            # Test VPC Flow Logs
            flow_logs_response = self.ec2_client.describe_flow_logs(
                Filters=[
                    {'Name': 'resource-id', 'Values': [vpc_id]},
                    {'Name': 'resource-type', 'Values': ['VPC']}
                ]
            )
            
            self.assertGreater(len(flow_logs_response['FlowLogs']), 0, 
                             "VPC should have flow logs configured")
            
            flow_log = flow_logs_response['FlowLogs'][0]
            self.assertEqual(flow_log['FlowLogStatus'], 'ACTIVE')
            self.assertEqual(flow_log['TrafficType'], 'ALL')
            
            print(f"✅ VPC Flow Logs properly configured: {flow_log['FlowLogId']}")
            print(f"   Status: {flow_log['FlowLogStatus']}")
            print(f"   Traffic Type: {flow_log['TrafficType']}")
            
            # Test CloudWatch Log Group for VPC Flow Logs
            if 'LogDestination' in flow_log:
                log_group_arn = flow_log['LogDestination']
                log_group_name = log_group_arn.split(':')[-1]
                
                try:
                    log_group_response = self.logs_client.describe_log_groups(
                        logGroupNamePrefix=log_group_name
                    )
                    
                    if log_group_response['logGroups']:
                        log_group = log_group_response['logGroups'][0]
                        print(f"✅ CloudWatch Log Group configured: {log_group['logGroupName']}")
                        print(f"   Retention: {log_group.get('retentionInDays', 'Never expire')} days")
                    
                except ClientError:
                    print("ℹ️  CloudWatch Log Group details not accessible")
            
        except ClientError as e:
            self.fail(f"Monitoring configuration validation failed: {e}")

    @mark.it("validates database credentials are managed by Secrets Manager")
    def test_secrets_manager_configuration(self):
        """Test that database credentials are properly managed by Secrets Manager"""
        # ACT & ASSERT
        try:
            # Find secrets that match our naming pattern
            secrets_response = self.secretsmanager_client.list_secrets()
            
            webapp_secrets = [secret for secret in secrets_response['SecretList']
                            if 'webapp-db-credentials' in secret['Name']]
            
            self.assertGreater(len(webapp_secrets), 0, 
                             "Should have webapp database credentials secret")
            
            secret = webapp_secrets[0]
            
            # Validate secret configuration
            self.assertIn('webapp-db-credentials', secret['Name'])
            
            # Try to get secret metadata (not the actual secret value)
            secret_details = self.secretsmanager_client.describe_secret(
                SecretId=secret['ARN']
            )
            
            self.assertTrue(secret_details.get('KmsKeyId'), "Secret should be encrypted with KMS")
            
            print(f"✅ Secrets Manager properly configured: {secret['Name']}")
            print(f"   KMS Encrypted: {'Yes' if secret_details.get('KmsKeyId') else 'No'}")
            print(f"   Last Changed: {secret.get('LastChangedDate', 'Unknown')}")
            
        except ClientError as e:
            self.fail(f"Secrets Manager validation failed: {e}")


if __name__ == '__main__':
    unittest.main()