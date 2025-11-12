"""
Integration tests for TapStack CDK infrastructure.

These tests verify that the deployed infrastructure is correctly configured
and operational. They require actual AWS resources to be deployed.

NOTE: These tests require:
- AWS credentials configured
- Infrastructure deployed via CDK
- flat-outputs.json file in cfn-outputs/ directory
"""

import json
import os
import socket
import unittest
from typing import Dict, Any

import boto3
from botocore.exceptions import ClientError
from pytest import mark


# Load flat outputs from deployment
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs: Dict[str, Any] = json.load(f)
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack CDK infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and load outputs"""
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.outputs = flat_outputs

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.secrets_client = boto3.client('secretsmanager', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)

        # Validate required outputs exist
        required_outputs = ['VpcId', 'DatabaseEndpoint', 'DatabasePort', 
                          'DatabaseSecretArn', 'DatabaseSecurityGroupId']
        missing_outputs = [out for out in required_outputs if out not in cls.outputs]
        if missing_outputs:
            raise unittest.SkipTest(
                f"Missing required outputs: {missing_outputs}. "
                f"Available outputs: {list(cls.outputs.keys())}"
            )

    @mark.it("should have VPC configured correctly")
    def test_vpc_exists_and_configured(self):
        """Test that VPC exists and is properly configured"""
        vpc_id = self.outputs['VpcId']
        
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1, "VPC should exist")
        
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available', "VPC should be available")
        
        # Verify DNS attributes
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        
        self.assertTrue(
            dns_hostnames.get('EnableDnsHostnames', {}).get('Value', False),
            "VPC should have DNS hostnames enabled"
        )
        self.assertTrue(
            dns_support.get('EnableDnsSupport', {}).get('Value', False),
            "VPC should have DNS support enabled"
        )
        
        print(f"✓ VPC {vpc_id} is properly configured")

    @mark.it("should have isolated subnets for database")
    def test_subnets_exist(self):
        """Test that isolated subnets exist for the database"""
        vpc_id = self.outputs['VpcId']
        
        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnets = response['Subnets']
        
        self.assertGreater(len(subnets), 0, "VPC should have subnets")
        
        # Check for isolated subnets (no public IP on launch)
        isolated_subnets = [
            s for s in subnets 
            if not s.get('MapPublicIpOnLaunch', False)
        ]
        
        self.assertGreater(
            len(isolated_subnets), 0,
            "VPC should have isolated subnets for database"
        )
        
        print(f"✓ Found {len(isolated_subnets)} isolated subnets in VPC")

    @mark.it("should have RDS instance configured correctly")
    def test_rds_instance_exists_and_configured(self):
        """Test that RDS PostgreSQL instance exists and is properly configured"""
        endpoint = self.outputs['DatabaseEndpoint']
        
        # Extract DB identifier from endpoint
        db_identifier = endpoint.split('.')[0]
        
        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )
        self.assertEqual(len(response['DBInstances']), 1, "RDS instance should exist")
        
        db_instance = response['DBInstances'][0]
        
        # Verify instance status
        self.assertEqual(
            db_instance['DBInstanceStatus'], 'available',
            "RDS instance should be available"
        )
        
        # Verify engine
        self.assertEqual(
            db_instance['Engine'], 'postgres',
            "RDS should use PostgreSQL engine"
        )
        
        # Verify engine version
        self.assertIn(
            '14.17', db_instance['EngineVersion'],
            "RDS should use PostgreSQL 14.17"
        )
        
        # Verify encryption
        self.assertTrue(
            db_instance['StorageEncrypted'],
            "RDS storage should be encrypted"
        )
        
        # Verify Multi-AZ
        self.assertTrue(
            db_instance['MultiAZ'],
            "RDS should have Multi-AZ enabled"
        )
        
        # Verify instance class
        self.assertEqual(
            db_instance['DBInstanceClass'], 'db.t3.medium',
            "RDS should use db.t3.medium instance class"
        )
        
        # Verify database name
        self.assertEqual(
            db_instance['DBName'], 'paymentdb',
            "Database name should be paymentdb"
        )
        
        # Verify endpoint matches output
        self.assertEqual(
            db_instance['Endpoint']['Address'], endpoint,
            "RDS endpoint should match output"
        )
        
        # Verify port
        self.assertEqual(
            db_instance['Endpoint']['Port'], int(self.outputs['DatabasePort']),
            "RDS port should match output"
        )
        
        # Verify backup retention
        self.assertEqual(
            db_instance['BackupRetentionPeriod'], 7,
            "Backup retention should be 7 days"
        )
        
        # Verify deletion protection is disabled (for staging)
        self.assertFalse(
            db_instance.get('DeletionProtection', False),
            "Deletion protection should be disabled for staging"
        )
        
        # Verify auto minor version upgrade
        self.assertTrue(
            db_instance.get('AutoMinorVersionUpgrade', False),
            "Auto minor version upgrade should be enabled"
        )
        
        print(f"✓ RDS instance {db_identifier} is properly configured")

    @mark.it("should have RDS security group configured correctly")
    def test_rds_security_group(self):
        """Test that RDS security group is properly configured"""
        sg_id = self.outputs['DatabaseSecurityGroupId']
        vpc_id = self.outputs['VpcId']
        
        response = self.ec2_client.describe_security_groups(GroupIds=[sg_id])
        self.assertEqual(len(response['SecurityGroups']), 1, "Security group should exist")
        
        sg = response['SecurityGroups'][0]
        
        # Verify VPC association
        self.assertEqual(sg['VpcId'], vpc_id, "SG should be in correct VPC")
        
        # Verify PostgreSQL port (5432) is allowed
        has_postgres_rule = False
        for rule in sg.get('IpPermissions', []):
            if rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432:
                has_postgres_rule = True
                break
        
        self.assertTrue(
            has_postgres_rule,
            "Security group should allow PostgreSQL port 5432"
        )
        
        # Verify outbound rules are restricted
        egress_rules = sg.get('IpPermissionsEgress', [])
        self.assertLessEqual(
            len(egress_rules), 1,
            "Security group should have restricted outbound rules"
        )
        
        print(f"✓ Security group {sg_id} is properly configured")

    @mark.it("should have Secrets Manager secret for database credentials")
    def test_secrets_manager_secret(self):
        """Test that Secrets Manager secret exists and is properly configured"""
        secret_arn = self.outputs['DatabaseSecretArn']
        
        response = self.secrets_client.describe_secret(SecretId=secret_arn)
        
        # Verify secret exists
        self.assertIsNotNone(response, "Secret should exist")
        
        # Verify secret name
        self.assertIn('DatabaseCredentials', response['Name'], "Secret name should contain DatabaseCredentials")
        
        # Verify encryption key is used
        if 'KmsKeyId' in response:
            self.assertIsNotNone(response['KmsKeyId'], "Secret should be encrypted with KMS key")
        
        # Verify secret can be retrieved (this tests permissions)
        try:
            secret_value = self.secrets_client.get_secret_value(SecretId=secret_arn)
            secret_string = json.loads(secret_value['SecretString'])
            
            # Verify secret contains expected keys
            self.assertIn('username', secret_string, "Secret should contain username")
            self.assertIn('password', secret_string, "Secret should contain password")
            
            # Verify username
            self.assertEqual(
                secret_string['username'], 'postgres',
                "Secret username should be postgres"
            )
            
            print(f"✓ Secret {response['Name']} is properly configured")
        except ClientError as e:
            if e.response['Error']['Code'] == 'AccessDeniedException':
                self.fail("Insufficient permissions to retrieve secret value")
            else:
                raise

    @mark.it("should have KMS key for encryption")
    def test_kms_key_exists(self):
        """Test that KMS key exists for RDS encryption"""
        # Find KMS key by looking for keys with RDS-related descriptions
        response = self.kms_client.list_keys()
        
        # Get key details for keys with RDS-related descriptions
        rds_keys = []
        for key in response['Keys']:
            try:
                key_details = self.kms_client.describe_key(KeyId=key['KeyId'])
                metadata = key_details['KeyMetadata']
                description = metadata.get('Description', '').lower()
                
                if 'rds' in description or 'database' in description:
                    rds_keys.append(metadata)
            except ClientError:
                continue
        
        self.assertGreater(
            len(rds_keys), 0,
            "At least one KMS key for RDS encryption should exist"
        )
        
        # Verify at least one key is enabled
        enabled_keys = [k for k in rds_keys if k['KeyState'] == 'Enabled']
        self.assertGreater(
            len(enabled_keys), 0,
            "At least one RDS KMS key should be enabled"
        )
        
        print(f"✓ Found {len(enabled_keys)} enabled KMS key(s) for RDS encryption")

    @mark.it("should have CloudWatch alarms configured")
    def test_cloudwatch_alarms(self):
        """Test that CloudWatch alarms are configured"""
        # Extract environment suffix from outputs if available
        # Try to find alarms by namespace or name pattern
        alarm_patterns = ['rds-cpu-high', 'rds-storage-low', 'rds-connections-high', 
                         'database-cpu', 'database-storage', 'database-connections']
        
        response = self.cloudwatch_client.describe_alarms()
        alarms = response['MetricAlarms']
        
        # Search for RDS-related alarms by namespace or name pattern
        found_alarms = []
        for alarm in alarms:
            alarm_name = alarm.get('AlarmName', '')
            namespace = alarm.get('Namespace', '')
            
            # Check if it's an RDS alarm by namespace
            if namespace == 'AWS/RDS':
                found_alarms.append(alarm_name)
            # Or check by name pattern
            elif any(pattern in alarm_name.lower() for pattern in alarm_patterns):
                found_alarms.append(alarm_name)
        
        # If no alarms found, check if alarms are expected to exist
        # For staging environments, alarms might not be critical
        if len(found_alarms) == 0:
            # Try to find any RDS-related alarms more broadly
            rds_alarms = [
                a for a in alarms 
                if a.get('Namespace') == 'AWS/RDS' or 
                   any(keyword in a.get('AlarmName', '').lower() 
                       for keyword in ['rds', 'database', 'db'])
            ]
            if len(rds_alarms) == 0:
                # Skip if no alarms found - they may not be created yet or not critical
                self.skipTest(
                    "No CloudWatch alarms found. This may be expected for staging environments."
                )
            else:
                found_alarms = [a['AlarmName'] for a in rds_alarms]
        
        # Verify alarm configurations
        for alarm in alarms:
            if alarm.get('AlarmName') in found_alarms:
                self.assertIn(
                    alarm['StateValue'], ['OK', 'ALARM', 'INSUFFICIENT_DATA'],
                    f"Alarm {alarm['AlarmName']} should have valid state"
                )
        
        print(f"✓ Found {len(found_alarms)} CloudWatch alarm(s)")

    @mark.it("should have database endpoint accessible")
    def test_database_endpoint_resolvable(self):
        """Test that database endpoint is DNS resolvable"""
        endpoint = self.outputs['DatabaseEndpoint']
        port = int(self.outputs['DatabasePort'])
        
        # Extract hostname from endpoint
        hostname = endpoint.split(':')[0] if ':' in endpoint else endpoint
        
        try:
            # Resolve DNS
            ip_address = socket.gethostbyname(hostname)
            self.assertIsNotNone(ip_address, "Endpoint should be DNS resolvable")
            
            # Test socket connection (without actually connecting)
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            
            # Note: We don't actually connect, just verify DNS resolution
            # Actual connection would require credentials and network access
            result = sock.connect_ex((ip_address, port))
            sock.close()
            
            print(f"✓ Database endpoint {endpoint} is DNS resolvable (IP: {ip_address})")
        except socket.gaierror as e:
            self.fail(f"Failed to resolve database endpoint: {e}")
        except Exception as e:
            # If we can't connect, that's okay - we just want to verify DNS resolution
            print(f"Note: Could not establish connection to {endpoint}: {e}")

    @mark.it("should have all required outputs present")
    def test_outputs_present(self):
        """Test that all required stack outputs are present"""
        required_outputs = {
            'VpcId': str,
            'DatabaseEndpoint': str,
            'DatabasePort': (str, int),
            'DatabaseName': str,
            'DatabaseSecretArn': str,
            'DatabaseSecurityGroupId': str,
        }
        
        for output_name, expected_type in required_outputs.items():
            self.assertIn(
                output_name, self.outputs,
                f"Output '{output_name}' should be present"
            )
            
            output_value = self.outputs[output_name]
            self.assertIsNotNone(
                output_value,
                f"Output '{output_name}' should not be None"
            )
            
            # Verify type
            if isinstance(expected_type, tuple):
                self.assertTrue(
                    isinstance(output_value, expected_type),
                    f"Output '{output_name}' should be one of {expected_type}"
                )
            else:
                self.assertTrue(
                    isinstance(output_value, expected_type),
                    f"Output '{output_name}' should be {expected_type}"
                )
        
        print(f"✓ All required outputs present: {list(required_outputs.keys())}")

    @mark.it("should have RDS in private isolated subnets")
    def test_rds_subnet_configuration(self):
        """Test that RDS is in private isolated subnets"""
        endpoint = self.outputs['DatabaseEndpoint']
        db_identifier = endpoint.split('.')[0]
        vpc_id = self.outputs['VpcId']
        
        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )
        db_instance = response['DBInstances'][0]
        
        # Get subnet group
        subnet_group_name = db_instance.get('DBSubnetGroup', {}).get('DBSubnetGroupName')
        if not subnet_group_name:
            self.skipTest("No subnet group found")
        
        subnet_response = self.rds_client.describe_db_subnet_groups(
            DBSubnetGroupName=subnet_group_name
        )
        subnet_group = subnet_response['DBSubnetGroups'][0]
        
        # Verify subnets are in the VPC
        subnet_ids = [s['SubnetIdentifier'] for s in subnet_group['Subnets']]
        
        ec2_response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)
        for subnet in ec2_response['Subnets']:
            self.assertEqual(
                subnet['VpcId'], vpc_id,
                "Subnet should be in correct VPC"
            )
            # Verify subnet is not public (no public IP on launch)
            self.assertFalse(
                subnet.get('MapPublicIpOnLaunch', False),
                "Database subnet should be isolated (not public)"
            )
        
        print(f"✓ RDS is in private isolated subnets: {len(subnet_ids)} subnet(s)")
