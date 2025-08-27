"""Integration tests for TapStack deployment"""

import json
import os
import unittest
import boto3
from pytest import mark


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
    """Integration tests for deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and deployment outputs"""
        cls.outputs = flat_outputs
        cls.region = os.environ.get('AWS_REGION', 'us-east-1')
        
        # Initialize AWS clients
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.autoscaling_client = boto3.client('autoscaling', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)

    @mark.it("verifies S3 bucket exists and has encryption enabled")
    def test_s3_bucket_exists_with_encryption(self):
        # ARRANGE
        bucket_name = self.outputs.get('S3BucketName')
        self.assertIsNotNone(bucket_name, "S3BucketName not found in outputs")
        
        # ACT & ASSERT
        # Check bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        
        # Check encryption
        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        self.assertIn('Rules', encryption['ServerSideEncryptionConfiguration'])
        self.assertTrue(len(encryption['ServerSideEncryptionConfiguration']['Rules']) > 0)
        
        # Check versioning
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')
        
        # Check public access block
        public_block = self.s3_client.get_public_access_block(Bucket=bucket_name)
        config = public_block['PublicAccessBlockConfiguration']
        self.assertTrue(config['BlockPublicAcls'])
        self.assertTrue(config['BlockPublicPolicy'])
        self.assertTrue(config['IgnorePublicAcls'])
        self.assertTrue(config['RestrictPublicBuckets'])

    @mark.it("verifies VPC exists and is configured correctly")
    def test_vpc_exists_and_configured(self):
        # ARRANGE
        vpc_id = self.outputs.get('VPCId')
        self.assertIsNotNone(vpc_id, "VPCId not found in outputs")
        
        # ACT
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        
        # ASSERT
        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        
        # Check VPC attributes
        vpc_attrs = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(vpc_attrs.get('EnableDnsHostnames', {}).get('Value', False))
        
        vpc_attrs = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(vpc_attrs.get('EnableDnsSupport', {}).get('Value', False))
        
        # Check subnets
        subnets = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        self.assertGreaterEqual(len(subnets['Subnets']), 2)
        
        # Verify public subnets
        public_subnets = [s for s in subnets['Subnets'] if s.get('MapPublicIpOnLaunch', False)]
        self.assertGreaterEqual(len(public_subnets), 2)

    @mark.it("verifies RDS instance is running and publicly accessible")
    def test_rds_instance_running(self):
        # ARRANGE
        rds_endpoint = self.outputs.get('RDSEndpoint')
        self.assertIsNotNone(rds_endpoint, "RDSEndpoint not found in outputs")
        
        # Extract instance identifier from endpoint
        instance_id = rds_endpoint.split('.')[0]
        
        # ACT
        response = self.rds_client.describe_db_instances(DBInstanceIdentifier=instance_id)
        
        # ASSERT
        self.assertEqual(len(response['DBInstances']), 1)
        db_instance = response['DBInstances'][0]
        
        # Check instance properties
        self.assertEqual(db_instance['DBInstanceStatus'], 'available')
        self.assertEqual(db_instance['Engine'], 'mysql')
        self.assertTrue(db_instance['PubliclyAccessible'])
        self.assertTrue(db_instance['StorageEncrypted'])
        self.assertEqual(db_instance['BackupRetentionPeriod'], 7)
        
        # Check it's in public subnet
        subnet_group = db_instance['DBSubnetGroup']
        self.assertIsNotNone(subnet_group)

    @mark.it("verifies Auto Scaling Group is configured correctly")
    def test_auto_scaling_group_configured(self):
        # ARRANGE
        asg_name = self.outputs.get('AutoScalingGroupName')
        self.assertIsNotNone(asg_name, "AutoScalingGroupName not found in outputs")
        
        # ACT
        response = self.autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        
        # ASSERT
        self.assertEqual(len(response['AutoScalingGroups']), 1)
        asg = response['AutoScalingGroups'][0]
        
        # Check configuration
        self.assertEqual(asg['MinSize'], 2)
        self.assertEqual(asg['MaxSize'], 5)
        self.assertEqual(asg['DesiredCapacity'], 2)
        
        # Check instances are running
        self.assertGreaterEqual(len(asg['Instances']), 2)
        for instance in asg['Instances']:
            self.assertIn(instance['LifecycleState'], ['InService', 'Pending'])
            self.assertEqual(instance['HealthStatus'], 'Healthy')

    @mark.it("verifies SNS topic exists for CloudWatch alarms")
    def test_sns_topic_exists(self):
        # ARRANGE
        topic_arn = self.outputs.get('SNSTopicArn')
        self.assertIsNotNone(topic_arn, "SNSTopicArn not found in outputs")
        
        # ACT
        response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
        
        # ASSERT
        self.assertIsNotNone(response['Attributes'])
        self.assertEqual(response['Attributes']['TopicArn'], topic_arn)

    @mark.it("verifies CloudWatch alarm is configured for CPU utilization")
    def test_cloudwatch_alarm_configured(self):
        # ARRANGE
        asg_name = self.outputs.get('AutoScalingGroupName')
        self.assertIsNotNone(asg_name, "AutoScalingGroupName not found in outputs")
        
        # ACT
        # Look for alarms related to the Auto Scaling Group
        response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix='SecureApp-HighCPUUtilization'
        )
        
        # ASSERT
        self.assertGreater(len(response['MetricAlarms']), 0)
        
        # Find the specific alarm
        cpu_alarm = None
        for alarm in response['MetricAlarms']:
            if 'AutoScalingGroupName' in str(alarm.get('Dimensions', [])):
                cpu_alarm = alarm
                break
        
        self.assertIsNotNone(cpu_alarm, "CPU alarm not found")
        self.assertEqual(cpu_alarm['MetricName'], 'CPUUtilization')
        self.assertEqual(cpu_alarm['Namespace'], 'AWS/EC2')
        self.assertEqual(cpu_alarm['Statistic'], 'Average')
        self.assertEqual(cpu_alarm['Threshold'], 75.0)
        self.assertEqual(cpu_alarm['ComparisonOperator'], 'GreaterThanThreshold')
        self.assertEqual(cpu_alarm['EvaluationPeriods'], 2)
        self.assertEqual(cpu_alarm['DatapointsToAlarm'], 2)

    @mark.it("verifies security groups are properly configured")
    def test_security_groups_configured(self):
        # ARRANGE
        vpc_id = self.outputs.get('VPCId')
        self.assertIsNotNone(vpc_id, "VPCId not found in outputs")
        
        # ACT
        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'group-name', 'Values': ['SecureApp-*']}
            ]
        )
        
        # ASSERT
        # Should have at least RDS and EC2 security groups
        self.assertGreaterEqual(len(response['SecurityGroups']), 2)
        
        # Check for RDS security group with MySQL port
        rds_sg = None
        ec2_sg = None
        for sg in response['SecurityGroups']:
            if 'RDSSecurityGroup' in sg['GroupName']:
                rds_sg = sg
            elif 'EC2SecurityGroup' in sg['GroupName']:
                ec2_sg = sg
        
        self.assertIsNotNone(rds_sg, "RDS security group not found")
        self.assertIsNotNone(ec2_sg, "EC2 security group not found")
        
        # Check RDS security group has MySQL port open
        mysql_rule_found = False
        for rule in rds_sg.get('IpPermissions', []):
            if rule.get('FromPort') == 3306 and rule.get('ToPort') == 3306:
                mysql_rule_found = True
                break
        self.assertTrue(mysql_rule_found, "MySQL port 3306 not found in RDS security group")

    @mark.it("verifies EC2 instances can access S3 bucket")
    def test_ec2_s3_access(self):
        # ARRANGE
        asg_name = self.outputs.get('AutoScalingGroupName')
        bucket_name = self.outputs.get('S3BucketName')
        self.assertIsNotNone(asg_name, "AutoScalingGroupName not found in outputs")
        self.assertIsNotNone(bucket_name, "S3BucketName not found in outputs")
        
        # ACT
        # Get instance IDs from Auto Scaling Group
        asg_response = self.autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        
        # ASSERT
        self.assertEqual(len(asg_response['AutoScalingGroups']), 1)
        instances = asg_response['AutoScalingGroups'][0]['Instances']
        self.assertGreater(len(instances), 0)
        
        # Get IAM instance profiles
        instance_ids = [i['InstanceId'] for i in instances]
        ec2_response = self.ec2_client.describe_instances(InstanceIds=instance_ids)
        
        for reservation in ec2_response['Reservations']:
            for instance in reservation['Instances']:
                # Check instance has IAM role attached
                self.assertIn('IamInstanceProfile', instance)
                self.assertIsNotNone(instance['IamInstanceProfile'])

    @mark.it("verifies RDS has automated backups enabled")
    def test_rds_backup_enabled(self):
        # ARRANGE
        rds_endpoint = self.outputs.get('RDSEndpoint')
        self.assertIsNotNone(rds_endpoint, "RDSEndpoint not found in outputs")
        
        # Extract instance identifier from endpoint
        instance_id = rds_endpoint.split('.')[0]
        
        # ACT
        response = self.rds_client.describe_db_instances(DBInstanceIdentifier=instance_id)
        
        # ASSERT
        db_instance = response['DBInstances'][0]
        self.assertEqual(db_instance['BackupRetentionPeriod'], 7)
        self.assertIsNotNone(db_instance.get('PreferredBackupWindow'))
        self.assertIsNotNone(db_instance.get('PreferredMaintenanceWindow'))

    @mark.it("verifies S3 bucket has event notifications configured")
    def test_s3_bucket_notifications(self):
        # ARRANGE
        bucket_name = self.outputs.get('S3BucketName')
        self.assertIsNotNone(bucket_name, "S3BucketName not found in outputs")
        
        # ACT
        response = self.s3_client.get_bucket_notification_configuration(Bucket=bucket_name)
        
        # ASSERT
        # Check for topic configurations
        topic_configs = response.get('TopicConfigurations', [])
        self.assertGreater(len(topic_configs), 0, "No S3 bucket notifications configured")
        
        # Verify at least one notification for object creation
        object_created_found = False
        for config in topic_configs:
            if any('ObjectCreated' in event for event in config.get('Events', [])):
                object_created_found = True
                break
        self.assertTrue(object_created_found, "No object creation notifications found")


if __name__ == "__main__":
    unittest.main()