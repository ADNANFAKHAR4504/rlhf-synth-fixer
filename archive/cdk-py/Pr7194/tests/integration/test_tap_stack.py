"""
Integration tests for TapStack - Testing live AWS resources
Tests verify that deployed infrastructure matches expected configuration.
"""
import json
import os
import unittest

import boto3
from pytest import mark

# Read flat outputs from file
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

with open(flat_outputs_path, 'r', encoding='utf-8') as f:
    flat_outputs = json.load(f)

# Get environment variables
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
region = os.environ.get('AWS_REGION', 'us-east-1')

# Initialize AWS clients
rds_client = boto3.client('rds', region_name=region)
ec2_client = boto3.client('ec2', region_name=region)
secretsmanager_client = boto3.client('secretsmanager', region_name=region)
sns_client = boto3.client('sns', region_name=region)
cloudwatch_client = boto3.client('cloudwatch', region_name=region)

# Extract outputs from flat-outputs.json using dynamic key lookup
db_endpoint = None
db_port = None
vpc_id = None
secret_arn = None

for key, value in flat_outputs.items():
    if 'DatabaseEndpoint' in key:
        db_endpoint = value
    elif 'DatabasePort' in key:
        db_port = value
    elif 'VpcId' in key and 'DatabaseStack' in key:
        vpc_id = value
    elif 'DatabaseSecretArn' in key:
        secret_arn = value

# Extract DB instance identifier from endpoint
db_instance_identifier = f"db-{environment_suffix}"


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the TapStack CDK stack - testing live resources"""

    @mark.it("verifies RDS instance exists and is available")
    def test_rds_instance_exists_and_available(self):
        """Test that RDS instance exists and is in available state"""
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_identifier
        )

        instances = response['DBInstances']
        self.assertEqual(len(instances), 1)

        instance = instances[0]
        self.assertEqual(instance['DBInstanceIdentifier'], db_instance_identifier)
        self.assertEqual(instance['DBInstanceStatus'], 'available')

    @mark.it("verifies RDS instance uses correct instance class")
    def test_rds_instance_class(self):
        """Test that RDS instance uses db.r6g.large as required"""
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_identifier
        )

        instance = response['DBInstances'][0]
        self.assertEqual(instance['DBInstanceClass'], 'db.r6g.large')

    @mark.it("verifies RDS instance has Multi-AZ enabled")
    def test_rds_multi_az_enabled(self):
        """Test that RDS instance has Multi-AZ deployment"""
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_identifier
        )

        instance = response['DBInstances'][0]
        self.assertTrue(instance['MultiAZ'])

    @mark.it("verifies RDS instance uses PostgreSQL engine")
    def test_rds_postgres_engine(self):
        """Test that RDS instance uses PostgreSQL engine"""
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_identifier
        )

        instance = response['DBInstances'][0]
        self.assertEqual(instance['Engine'], 'postgres')
        self.assertTrue(instance['EngineVersion'].startswith('15'))

    @mark.it("verifies RDS instance has storage encryption enabled")
    def test_rds_storage_encrypted(self):
        """Test that RDS instance has storage encryption enabled"""
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_identifier
        )

        instance = response['DBInstances'][0]
        self.assertTrue(instance['StorageEncrypted'])

    @mark.it("verifies RDS instance has 7-day backup retention")
    def test_rds_backup_retention(self):
        """Test that RDS instance has 7-day backup retention"""
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_identifier
        )

        instance = response['DBInstances'][0]
        self.assertEqual(instance['BackupRetentionPeriod'], 7)

    @mark.it("verifies RDS instance has deletion protection disabled")
    def test_rds_deletion_protection_disabled(self):
        """Test that RDS instance has deletion protection disabled for testing"""
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_identifier
        )

        instance = response['DBInstances'][0]
        self.assertFalse(instance['DeletionProtection'])

    @mark.it("verifies RDS instance exports PostgreSQL logs to CloudWatch")
    def test_rds_cloudwatch_logs_export(self):
        """Test that RDS instance exports PostgreSQL logs"""
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_identifier
        )

        instance = response['DBInstances'][0]
        enabled_logs = instance.get('EnabledCloudwatchLogsExports', [])
        self.assertIn('postgresql', enabled_logs)

    @mark.it("verifies VPC exists")
    def test_vpc_exists(self):
        """Test that VPC exists and is available"""
        response = ec2_client.describe_vpcs(
            VpcIds=[vpc_id]
        )

        vpcs = response['Vpcs']
        self.assertEqual(len(vpcs), 1)
        self.assertEqual(vpcs[0]['State'], 'available')

    @mark.it("verifies VPC has correct CIDR block")
    def test_vpc_cidr_block(self):
        """Test that VPC has correct CIDR configuration"""
        response = ec2_client.describe_vpcs(
            VpcIds=[vpc_id]
        )

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

    @mark.it("verifies security group exists for database")
    def test_security_group_exists(self):
        """Test that security group exists for database"""
        response = ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'group-name', 'Values': [f'db-sg-{environment_suffix}']}
            ]
        )

        security_groups = response['SecurityGroups']
        self.assertEqual(len(security_groups), 1)

        sg = security_groups[0]
        self.assertIn('PostgreSQL', sg['Description'])

    @mark.it("verifies security group allows PostgreSQL port 5432")
    def test_security_group_allows_postgres(self):
        """Test that security group allows inbound PostgreSQL traffic"""
        response = ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'group-name', 'Values': [f'db-sg-{environment_suffix}']}
            ]
        )

        sg = response['SecurityGroups'][0]
        ingress_rules = sg['IpPermissions']

        postgres_rule_found = False
        for rule in ingress_rules:
            if rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432:
                postgres_rule_found = True
                break

        self.assertTrue(postgres_rule_found)

    @mark.it("verifies Secrets Manager secret exists")
    def test_secrets_manager_secret_exists(self):
        """Test that database credentials secret exists"""
        response = secretsmanager_client.describe_secret(
            SecretId=secret_arn
        )

        self.assertIsNotNone(response['ARN'])
        self.assertIn(f'db-credentials-{environment_suffix}', response['Name'])

    @mark.it("verifies Secrets Manager secret contains required keys")
    def test_secrets_manager_secret_structure(self):
        """Test that secret has username and password keys"""
        response = secretsmanager_client.get_secret_value(
            SecretId=secret_arn
        )

        secret_value = json.loads(response['SecretString'])
        self.assertIn('username', secret_value)
        self.assertIn('password', secret_value)
        self.assertEqual(secret_value['username'], 'dbadmin')

    @mark.it("verifies NAT Gateway exists in VPC")
    def test_nat_gateway_exists(self):
        """Test that NAT Gateway exists for private subnet connectivity"""
        response = ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )

        nat_gateways = response['NatGateways']
        self.assertGreaterEqual(len(nat_gateways), 1)

    @mark.it("verifies private subnets exist")
    def test_private_subnets_exist(self):
        """Test that private subnets exist in VPC"""
        response = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'tag:Name', 'Values': [f'*private-{environment_suffix}*']}
            ]
        )

        subnets = response['Subnets']
        self.assertGreaterEqual(len(subnets), 2)

    @mark.it("verifies public subnets exist")
    def test_public_subnets_exist(self):
        """Test that public subnets exist in VPC"""
        response = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'tag:Name', 'Values': [f'*public-{environment_suffix}*']}
            ]
        )

        subnets = response['Subnets']
        self.assertGreaterEqual(len(subnets), 2)

    @mark.it("verifies CloudWatch CPU alarm exists")
    def test_cloudwatch_cpu_alarm_exists(self):
        """Test that CloudWatch CPU utilization alarm exists"""
        response = cloudwatch_client.describe_alarms(
            AlarmNames=[f'db-cpu-alarm-{environment_suffix}']
        )

        alarms = response['MetricAlarms']
        self.assertEqual(len(alarms), 1)

        alarm = alarms[0]
        self.assertEqual(alarm['MetricName'], 'CPUUtilization')
        self.assertEqual(alarm['Namespace'], 'AWS/RDS')
        self.assertEqual(alarm['Threshold'], 80.0)

    @mark.it("verifies CloudWatch storage alarm exists")
    def test_cloudwatch_storage_alarm_exists(self):
        """Test that CloudWatch storage space alarm exists"""
        response = cloudwatch_client.describe_alarms(
            AlarmNames=[f'db-storage-alarm-{environment_suffix}']
        )

        alarms = response['MetricAlarms']
        self.assertEqual(len(alarms), 1)

        alarm = alarms[0]
        self.assertEqual(alarm['MetricName'], 'FreeStorageSpace')
        self.assertEqual(alarm['Namespace'], 'AWS/RDS')
        self.assertEqual(alarm['Threshold'], 10 * 1024 * 1024 * 1024)

    @mark.it("verifies SNS topic exists for alarms")
    def test_sns_topic_exists(self):
        """Test that SNS topic exists for alarm notifications"""
        response = sns_client.list_topics()

        topic_arns = [t['TopicArn'] for t in response['Topics']]
        expected_topic_name = f'db-alarm-topic-{environment_suffix}'

        matching_topics = [arn for arn in topic_arns if expected_topic_name in arn]
        self.assertGreaterEqual(len(matching_topics), 1)

    @mark.it("verifies database endpoint matches expected format")
    def test_database_endpoint_format(self):
        """Test that database endpoint matches expected format"""
        self.assertIsNotNone(db_endpoint)
        self.assertIn(f'db-{environment_suffix}', db_endpoint)
        self.assertIn('.rds.amazonaws.com', db_endpoint)

    @mark.it("verifies database port is 5432")
    def test_database_port(self):
        """Test that database port is PostgreSQL default"""
        self.assertEqual(db_port, '5432')

    @mark.it("verifies RDS parameter group has audit logging enabled")
    def test_rds_parameter_group_audit_logging(self):
        """Test that parameter group has log_statement=all"""
        response = rds_client.describe_db_instances(
            DBInstanceIdentifier=db_instance_identifier
        )

        instance = response['DBInstances'][0]
        param_groups = instance['DBParameterGroups']
        self.assertGreaterEqual(len(param_groups), 1)

        param_group_name = param_groups[0]['DBParameterGroupName']

        # Use paginator to get all parameters
        paginator = rds_client.get_paginator('describe_db_parameters')
        log_statement_param = None

        for page in paginator.paginate(DBParameterGroupName=param_group_name):
            for param in page['Parameters']:
                if param['ParameterName'] == 'log_statement':
                    log_statement_param = param
                    break
            if log_statement_param:
                break

        self.assertIsNotNone(log_statement_param)
        self.assertEqual(log_statement_param.get('ParameterValue'), 'all')

    @mark.it("verifies RDS subnet group exists")
    def test_rds_subnet_group_exists(self):
        """Test that DB subnet group exists"""
        response = rds_client.describe_db_subnet_groups(
            DBSubnetGroupName=f'subnet-group-{environment_suffix}'
        )

        subnet_groups = response['DBSubnetGroups']
        self.assertEqual(len(subnet_groups), 1)
        self.assertEqual(subnet_groups[0]['DBSubnetGroupName'], f'subnet-group-{environment_suffix}')
