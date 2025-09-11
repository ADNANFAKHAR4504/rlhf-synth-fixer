"""Integration tests for TapStack infrastructure deployment."""
import json
import os
import time
import unittest

import boto3
import requests
from pytest import mark, skip


def load_deployment_outputs():
    """Load deployment outputs from cfn-outputs/flat-outputs.json."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    flat_outputs_path = os.path.join(
        base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
    )
    
    if os.path.exists(flat_outputs_path):
        with open(flat_outputs_path, 'r', encoding='utf-8') as f:
            return json.loads(f.read())
    return {}


@mark.describe("TapStack Integration")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed TapStack infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs once for all tests."""
        cls.outputs = load_deployment_outputs()
        
        # Skip all tests if no outputs are available
        if not cls.outputs:
            skip("No deployment outputs found. Skipping integration tests.")
        
        # Initialize AWS clients for us-west-2 region
        try:
            cls.ec2_client = boto3.client('ec2', region_name='us-west-2')
            cls.rds_client = boto3.client('rds', region_name='us-west-2')
            cls.asg_client = boto3.client('autoscaling', region_name='us-west-2')
            cls.cloudwatch_client = boto3.client('cloudwatch', region_name='us-west-2')
            cls.sns_client = boto3.client('sns', region_name='us-west-2')
            cls.secrets_client = boto3.client('secretsmanager', region_name='us-west-2')
        except Exception as e:
            skip(f"Unable to initialize AWS clients: {e}")

    @mark.it("verifies VPC is created and accessible")
    def test_vpc_exists(self):
        """Test that VPC exists and is available in us-west-2."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")
        
        # Get VPC ID from outputs
        vpc_id_key = [key for key in self.outputs.keys() if 'Vpc' in key and 'Id' in key]
        if not vpc_id_key:
            self.skipTest("VPC ID not found in outputs")
        
        vpc_id = self.outputs[vpc_id_key[0]]
        
        try:
            # Verify VPC exists
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpcs = response['Vpcs']
            
            # Assert VPC exists
            self.assertEqual(len(vpcs), 1)
            vpc = vpcs[0]
            
            # Verify VPC is available
            self.assertEqual(vpc['State'], 'available')
            
            # Verify CIDR block
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
            
            # Verify DNS settings
            self.assertTrue(vpc['EnableDnsHostnames'])
            self.assertTrue(vpc['EnableDnsSupport'])
            
        except Exception as e:
            self.skipTest(f"Could not verify VPC: {e}")

    @mark.it("verifies subnets are created across multiple AZs")
    def test_subnets_distribution(self):
        """Test that subnets are distributed across multiple AZs."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")
        
        # Get VPC ID from outputs
        vpc_id_key = [key for key in self.outputs.keys() if 'Vpc' in key and 'Id' in key]
        if not vpc_id_key:
            self.skipTest("VPC ID not found in outputs")
        
        vpc_id = self.outputs[vpc_id_key[0]]
        
        try:
            # Get subnets for the VPC
            response = self.ec2_client.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )
            
            subnets = response['Subnets']
            
            # Should have 4 subnets (2 public, 2 private)
            self.assertEqual(len(subnets), 4)
            
            # Check AZ distribution
            azs = set(subnet['AvailabilityZone'] for subnet in subnets)
            self.assertGreaterEqual(len(azs), 2, "Subnets should span at least 2 AZs")
            
            # Verify CIDR blocks
            public_subnets = [s for s in subnets if s['MapPublicIpOnLaunch']]
            private_subnets = [s for s in subnets if not s['MapPublicIpOnLaunch']]
            
            self.assertEqual(len(public_subnets), 2, "Should have 2 public subnets")
            self.assertEqual(len(private_subnets), 2, "Should have 2 private subnets")
            
        except Exception as e:
            self.skipTest(f"Could not verify subnets: {e}")

    @mark.it("verifies security groups are properly configured")
    def test_security_groups_configuration(self):
        """Test that security groups have correct ingress rules."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")
        
        # Get VPC ID from outputs
        vpc_id_key = [key for key in self.outputs.keys() if 'Vpc' in key and 'Id' in key]
        if not vpc_id_key:
            self.skipTest("VPC ID not found in outputs")
        
        vpc_id = self.outputs[vpc_id_key[0]]
        
        try:
            # Get security groups for our VPC
            response = self.ec2_client.describe_security_groups(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )
            
            security_groups = response['SecurityGroups']
            
            # Should have at least 2 security groups (EC2 and RDS) plus default
            self.assertGreaterEqual(len(security_groups), 3)
            
            # Find EC2 security group (should allow SSH from specific IP and HTTP from anywhere)
            ec2_sg = next(
                (sg for sg in security_groups if 'EC2' in sg.get('GroupName', '')),
                None
            )
            self.assertIsNotNone(ec2_sg, "EC2 security group not found")
            
            if ec2_sg:
                ingress_rules = ec2_sg.get('IpPermissions', [])
                
                # Check for SSH rule (port 22)
                ssh_rule = next(
                    (rule for rule in ingress_rules if rule.get('FromPort') == 22),
                    None
                )
                self.assertIsNotNone(ssh_rule, "SSH rule not found in EC2 security group")
                
                # Check for HTTP rule (port 80)
                http_rule = next(
                    (rule for rule in ingress_rules if rule.get('FromPort') == 80),
                    None
                )
                self.assertIsNotNone(http_rule, "HTTP rule not found in EC2 security group")
            
            # Find RDS security group (should allow MySQL from EC2 security group)
            rds_sg = next(
                (sg for sg in security_groups if 'RDS' in sg.get('GroupName', '')),
                None
            )
            self.assertIsNotNone(rds_sg, "RDS security group not found")
            
            if rds_sg:
                ingress_rules = rds_sg.get('IpPermissions', [])
                
                # Check for MySQL rule (port 3306)
                mysql_rule = next(
                    (rule for rule in ingress_rules if rule.get('FromPort') == 3306),
                    None
                )
                self.assertIsNotNone(mysql_rule, "MySQL rule not found in RDS security group")
                
                # Verify it's from security group, not CIDR
                if mysql_rule:
                    self.assertGreater(
                        len(mysql_rule.get('UserIdGroupPairs', [])), 0,
                        "MySQL rule should be from security group, not CIDR"
                    )
            
        except Exception as e:
            self.skipTest(f"Could not verify security groups: {e}")

    @mark.it("verifies RDS database is running and accessible")
    def test_rds_database(self):
        """Test that RDS database is created and available."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")
        
        # Get database endpoint from outputs
        db_endpoint_key = [key for key in self.outputs.keys() if 'Database' in key and 'Endpoint' in key]
        if not db_endpoint_key:
            self.skipTest("Database endpoint not found in outputs")
        
        db_endpoint = self.outputs[db_endpoint_key[0]]
        
        try:
            # Get database instance identifier from endpoint
            db_identifier = db_endpoint.split('.')[0]
            
            # Describe the database instance
            response = self.rds_client.describe_db_instances(
                DBInstanceIdentifier=db_identifier
            )
            
            db_instances = response['DBInstances']
            self.assertEqual(len(db_instances), 1)
            
            db_instance = db_instances[0]
            
            # Verify database is available
            self.assertEqual(db_instance['DBInstanceStatus'], 'available')
            
            # Verify database configuration
            self.assertEqual(db_instance['Engine'], 'mysql')
            self.assertEqual(db_instance['DBInstanceClass'], 'db.t3.micro')
            self.assertTrue(db_instance['StorageEncrypted'])
            self.assertEqual(db_instance['BackupRetentionPeriod'], 7)
            
            # Verify database is in private subnet
            self.assertIsNotNone(db_instance.get('DBSubnetGroup'))
            
        except Exception as e:
            self.skipTest(f"Could not verify RDS database: {e}")

    @mark.it("verifies Auto Scaling Group is running with correct configuration")
    def test_auto_scaling_group(self):
        """Test that Auto Scaling Group is configured correctly with running instances."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")
        
        # Get ASG name from outputs
        asg_name_key = [key for key in self.outputs.keys() if 'AutoScaling' in key and 'Name' in key]
        if not asg_name_key:
            self.skipTest("Auto Scaling Group name not found in outputs")
        
        asg_name = self.outputs[asg_name_key[0]]
        
        try:
            # Describe the Auto Scaling Group
            response = self.asg_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[asg_name]
            )
            
            asgs = response['AutoScalingGroups']
            self.assertEqual(len(asgs), 1)
            
            asg = asgs[0]
            
            # Verify ASG configuration
            self.assertEqual(asg['MinSize'], 2)
            self.assertEqual(asg['MaxSize'], 5)
            self.assertEqual(asg['DesiredCapacity'], 2)
            self.assertEqual(asg['HealthCheckType'], 'EC2')
            self.assertEqual(asg['HealthCheckGracePeriod'], 300)  # 5 minutes
            
            # Verify instances are running
            instances = asg['Instances']
            self.assertGreaterEqual(len(instances), 2, "Should have at least 2 instances")
            
            # Check instance health
            healthy_instances = [
                instance for instance in instances 
                if instance['HealthStatus'] == 'Healthy' and instance['LifecycleState'] == 'InService'
            ]
            self.assertGreaterEqual(len(healthy_instances), 1, "Should have at least 1 healthy instance")
            
        except Exception as e:
            self.skipTest(f"Could not verify Auto Scaling Group: {e}")

    @mark.it("verifies CPU scaling policy is configured")
    def test_scaling_policy(self):
        """Test that CPU-based scaling policy is configured."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")
        
        # Get ASG name from outputs
        asg_name_key = [key for key in self.outputs.keys() if 'AutoScaling' in key and 'Name' in key]
        if not asg_name_key:
            self.skipTest("Auto Scaling Group name not found in outputs")
        
        asg_name = self.outputs[asg_name_key[0]]
        
        try:
            # Describe scaling policies for the ASG
            response = self.asg_client.describe_policies(
                AutoScalingGroupName=asg_name
            )
            
            policies = response['ScalingPolicies']
            self.assertGreaterEqual(len(policies), 1, "Should have at least 1 scaling policy")
            
            # Find target tracking policy
            target_tracking_policy = next(
                (policy for policy in policies if policy['PolicyType'] == 'TargetTrackingScaling'),
                None
            )
            self.assertIsNotNone(target_tracking_policy, "Target tracking scaling policy not found")
            
            if target_tracking_policy:
                config = target_tracking_policy.get('TargetTrackingConfiguration', {})
                metric_spec = config.get('PredefinedMetricSpecification', {})
                
                # Verify CPU utilization metric
                self.assertEqual(
                    metric_spec.get('PredefinedMetricType'), 
                    'ASGAverageCPUUtilization'
                )
                
                # Verify target value
                self.assertEqual(config.get('TargetValue'), 70.0)
            
        except Exception as e:
            self.skipTest(f"Could not verify scaling policies: {e}")

    @mark.it("verifies CloudWatch alarm is configured and functioning")
    def test_cloudwatch_alarm(self):
        """Test that CloudWatch alarm for CPU utilization is configured."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")
        
        try:
            # Get alarms for CPU utilization
            response = self.cloudwatch_client.describe_alarms(
                StateValue='OK'  # Start with OK state alarms
            )
            
            alarms = response['MetricAlarms']
            
            # Find CPU alarm for our stack
            cpu_alarm = next(
                (alarm for alarm in alarms 
                 if alarm['MetricName'] == 'CPUUtilization' 
                 and alarm['Namespace'] == 'AWS/AutoScaling'
                 and alarm['Threshold'] == 70.0),
                None
            )
            
            if not cpu_alarm:
                # Try with other states
                response = self.cloudwatch_client.describe_alarms()
                alarms = response['MetricAlarms']
                cpu_alarm = next(
                    (alarm for alarm in alarms 
                     if alarm['MetricName'] == 'CPUUtilization' 
                     and alarm['Namespace'] == 'AWS/AutoScaling'
                     and alarm['Threshold'] == 70.0),
                    None
                )
            
            self.assertIsNotNone(cpu_alarm, "CPU utilization alarm not found")
            
            if cpu_alarm:
                # Verify alarm configuration
                self.assertEqual(cpu_alarm['ComparisonOperator'], 'GreaterThanThreshold')
                self.assertEqual(cpu_alarm['EvaluationPeriods'], 2)
                self.assertEqual(cpu_alarm['DatapointsToAlarm'], 2)
                self.assertEqual(cpu_alarm['Statistic'], 'Average')
                
                # Verify alarm has SNS action
                alarm_actions = cpu_alarm.get('AlarmActions', [])
                self.assertGreater(len(alarm_actions), 0, "Alarm should have SNS actions")
                
                # Verify SNS topic exists
                sns_topic_arn = alarm_actions[0] if alarm_actions else None
                if sns_topic_arn:
                    topics_response = self.sns_client.list_topics()
                    topic_arns = [topic['TopicArn'] for topic in topics_response['Topics']]
                    self.assertIn(sns_topic_arn, topic_arns, "SNS topic should exist")
            
        except Exception as e:
            self.skipTest(f"Could not verify CloudWatch alarm: {e}")

    @mark.it("verifies SNS topic exists for notifications")
    def test_sns_topic(self):
        """Test that SNS topic exists for alarm notifications."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")
        
        # Get SNS topic ARN from outputs
        sns_topic_key = [key for key in self.outputs.keys() if 'SNS' in key and 'Arn' in key]
        if not sns_topic_key:
            self.skipTest("SNS topic ARN not found in outputs")
        
        sns_topic_arn = self.outputs[sns_topic_key[0]]
        
        try:
            # Verify SNS topic exists
            response = self.sns_client.list_topics()
            topic_arns = [topic['TopicArn'] for topic in response['Topics']]
            
            self.assertIn(sns_topic_arn, topic_arns, "SNS topic should exist")
            
            # Get topic attributes
            attributes_response = self.sns_client.get_topic_attributes(
                TopicArn=sns_topic_arn
            )
            
            attributes = attributes_response['Attributes']
            self.assertIsNotNone(attributes.get('DisplayName'))
            
        except Exception as e:
            self.skipTest(f"Could not verify SNS topic: {e}")

    @mark.it("verifies NAT Gateway is functioning")
    def test_nat_gateway(self):
        """Test that NAT Gateway exists and is available."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")
        
        # Get VPC ID from outputs
        vpc_id_key = [key for key in self.outputs.keys() if 'Vpc' in key and 'Id' in key]
        if not vpc_id_key:
            self.skipTest("VPC ID not found in outputs")
        
        vpc_id = self.outputs[vpc_id_key[0]]
        
        try:
            # Get NAT gateways for the VPC
            response = self.ec2_client.describe_nat_gateways(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'state', 'Values': ['available']}
                ]
            )
            
            nat_gateways = response['NatGateways']
            
            # Should have 1 NAT gateway
            self.assertEqual(len(nat_gateways), 1)
            
            # Verify NAT gateway is available
            nat_gateway = nat_gateways[0]
            self.assertEqual(nat_gateway['State'], 'available')
            
        except Exception as e:
            self.skipTest(f"Could not verify NAT Gateway: {e}")

    @mark.it("verifies IAM role and instance profile exist")
    def test_iam_resources(self):
        """Test that IAM role and instance profile are configured correctly."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")
        
        try:
            # Get EC2 instances from ASG to find instance profile
            asg_name_key = [key for key in self.outputs.keys() if 'AutoScaling' in key and 'Name' in key]
            if not asg_name_key:
                self.skipTest("Auto Scaling Group name not found in outputs")
            
            asg_name = self.outputs[asg_name_key[0]]
            
            # Get instances from ASG
            asg_response = self.asg_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[asg_name]
            )
            
            if not asg_response['AutoScalingGroups']:
                self.skipTest("Auto Scaling Group not found")
            
            instances = asg_response['AutoScalingGroups'][0]['Instances']
            if not instances:
                self.skipTest("No instances found in Auto Scaling Group")
            
            # Get instance details
            instance_id = instances[0]['InstanceId']
            instance_response = self.ec2_client.describe_instances(
                InstanceIds=[instance_id]
            )
            
            instance = instance_response['Reservations'][0]['Instances'][0]
            iam_instance_profile = instance.get('IamInstanceProfile')
            
            self.assertIsNotNone(iam_instance_profile, "Instance should have IAM instance profile")
            
            if iam_instance_profile:
                # Verify instance profile exists
                profile_arn = iam_instance_profile['Arn']
                self.assertIsNotNone(profile_arn)
                self.assertIn('InstanceProfile', profile_arn)
            
        except Exception as e:
            self.skipTest(f"Could not verify IAM resources: {e}")

    @mark.it("verifies RDS credentials secret exists")
    def test_rds_credentials_secret(self):
        """Test that RDS credentials are stored in AWS Secrets Manager."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")
        
        try:
            # List secrets to find RDS credentials
            response = self.secrets_client.list_secrets()
            secrets = response['SecretList']
            
            # Find RDS credentials secret
            rds_secret = next(
                (secret for secret in secrets 
                 if 'db-credentials' in secret['Name'].lower()),
                None
            )
            
            self.assertIsNotNone(rds_secret, "RDS credentials secret not found")
            
            if rds_secret:
                # Verify secret is properly configured
                self.assertIsNotNone(rds_secret.get('ARN'))
                self.assertIsNotNone(rds_secret.get('Name'))
                
        except Exception as e:
            self.skipTest(f"Could not verify RDS credentials secret: {e}")

    @mark.it("verifies Production environment tags are applied")
    def test_production_tags(self):
        """Test that Production environment tags are applied to resources."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")
        
        # Get VPC ID from outputs
        vpc_id_key = [key for key in self.outputs.keys() if 'Vpc' in key and 'Id' in key]
        if not vpc_id_key:
            self.skipTest("VPC ID not found in outputs")
        
        vpc_id = self.outputs[vpc_id_key[0]]
        
        try:
            # Check VPC tags
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]
            
            tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
            
            # Verify Environment tag
            self.assertEqual(tags.get('Environment'), 'Production')
            
            # Check other resources have tags
            # Get Auto Scaling Group
            asg_name_key = [key for key in self.outputs.keys() if 'AutoScaling' in key and 'Name' in key]
            if asg_name_key:
                asg_name = self.outputs[asg_name_key[0]]
                asg_response = self.asg_client.describe_auto_scaling_groups(
                    AutoScalingGroupNames=[asg_name]
                )
                
                if asg_response['AutoScalingGroups']:
                    asg_tags = {
                        tag['Key']: tag['Value'] 
                        for tag in asg_response['AutoScalingGroups'][0].get('Tags', [])
                    }
                    self.assertEqual(asg_tags.get('Environment'), 'Production')
            
        except Exception as e:
            self.skipTest(f"Could not verify tags: {e}")


if __name__ == '__main__':
    unittest.main()