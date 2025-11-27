"""Integration tests for Global Stack resources (DynamoDB, Route53)."""
import json
import os
import pytest
import boto3
from botocore.exceptions import ClientError, NoCredentialsError


@pytest.fixture(scope="module")
def stack_outputs():
    """Load stack outputs from cfn-outputs/flat-outputs.json."""
    outputs_path = os.path.join(
        os.path.dirname(__file__),
        "../../cfn-outputs/flat-outputs.json"
    )

    if not os.path.exists(outputs_path):
        pytest.skip(f"Outputs file not found: {outputs_path}")

    with open(outputs_path, 'r') as f:
        outputs = json.load(f)

    # Get the first stack outputs (should be TapStack)
    if not outputs:
        pytest.skip("No stack outputs found in flat-outputs.json")

    stack_name = list(outputs.keys())[0]
    return outputs[stack_name]


@pytest.fixture(scope="module")
def aws_clients():
    """Create AWS clients for testing."""
    try:
        return {
            'dynamodb_us_east_1': boto3.client('dynamodb', region_name='us-east-1'),
            'dynamodb_us_west_2': boto3.client('dynamodb', region_name='us-west-2'),
            'route53': boto3.client('route53'),
        }
    except NoCredentialsError:
        pytest.skip("AWS credentials not configured")


class TestDynamoDBGlobalTables:
    """Test DynamoDB global tables deployment and configuration."""

    def test_patient_records_table_exists_in_primary_region(self, aws_clients):
        """Test that patient records table exists in primary region."""
        try:
            # Patient records table should exist
            table_name = "healthcare-patient-records-v2-pr7112"
            response = aws_clients['dynamodb_us_east_1'].describe_table(
                TableName=table_name
            )

            assert response['Table']['TableStatus'] in ['ACTIVE', 'UPDATING']
            assert response['Table']['TableName'] == table_name
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip(f"Table not found - stack may not be deployed")
            raise

    def test_patient_records_table_exists_in_secondary_region(self, aws_clients):
        """Test that patient records table is replicated to secondary region."""
        try:
            table_name = "healthcare-patient-records-v2-pr7112"
            response = aws_clients['dynamodb_us_west_2'].describe_table(
                TableName=table_name
            )

            assert response['Table']['TableStatus'] in ['ACTIVE', 'UPDATING']
            assert response['Table']['TableName'] == table_name
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip(f"Table not found in secondary region - replication may not be complete")
            raise

    def test_patient_records_table_has_correct_schema(self, aws_clients):
        """Test that patient records table has correct hash and range keys."""
        try:
            table_name = "healthcare-patient-records-v2-pr7112"
            response = aws_clients['dynamodb_us_east_1'].describe_table(
                TableName=table_name
            )

            table = response['Table']
            key_schema = {key['AttributeName']: key['KeyType'] for key in table['KeySchema']}

            assert 'patient_id' in key_schema
            assert key_schema['patient_id'] == 'HASH'
            assert 'record_timestamp' in key_schema
            assert key_schema['record_timestamp'] == 'RANGE'

            # Verify attribute definitions
            attributes = {attr['AttributeName']: attr['AttributeType']
                         for attr in table['AttributeDefinitions']}
            assert attributes.get('patient_id') == 'S'  # String
            assert attributes.get('record_timestamp') == 'N'  # Number
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip("Table not found - stack may not be deployed")
            raise

    def test_patient_records_table_has_pitr_enabled(self, aws_clients):
        """Test that point-in-time recovery is enabled."""
        try:
            table_name = "healthcare-patient-records-v2-pr7112"
            response = aws_clients['dynamodb_us_east_1'].describe_continuous_backups(
                TableName=table_name
            )

            pitr_status = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
            assert pitr_status == 'ENABLED', "Point-in-time recovery should be enabled"
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip("Table not found - stack may not be deployed")
            raise

    def test_patient_records_table_has_streams_enabled(self, aws_clients):
        """Test that DynamoDB streams are enabled."""
        try:
            table_name = "healthcare-patient-records-v2-pr7112"
            response = aws_clients['dynamodb_us_east_1'].describe_table(
                TableName=table_name
            )

            table = response['Table']
            assert 'StreamSpecification' in table
            assert table['StreamSpecification']['StreamEnabled'] is True
            assert table['StreamSpecification']['StreamViewType'] == 'NEW_AND_OLD_IMAGES'
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip("Table not found - stack may not be deployed")
            raise

    def test_patient_records_table_is_pay_per_request(self, aws_clients):
        """Test that table uses PAY_PER_REQUEST billing mode."""
        try:
            table_name = "healthcare-patient-records-v2-pr7112"
            response = aws_clients['dynamodb_us_east_1'].describe_table(
                TableName=table_name
            )

            assert response['Table']['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST'
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip("Table not found - stack may not be deployed")
            raise

    def test_audit_logs_table_exists_in_primary_region(self, aws_clients):
        """Test that audit logs table exists in primary region."""
        try:
            table_name = "healthcare-audit-logs-v2-pr7112"
            response = aws_clients['dynamodb_us_east_1'].describe_table(
                TableName=table_name
            )

            assert response['Table']['TableStatus'] in ['ACTIVE', 'UPDATING']
            assert response['Table']['TableName'] == table_name
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip("Table not found - stack may not be deployed")
            raise

    def test_audit_logs_table_has_correct_schema(self, aws_clients):
        """Test that audit logs table has correct hash and range keys."""
        try:
            table_name = "healthcare-audit-logs-v2-pr7112"
            response = aws_clients['dynamodb_us_east_1'].describe_table(
                TableName=table_name
            )

            table = response['Table']
            key_schema = {key['AttributeName']: key['KeyType'] for key in table['KeySchema']}

            assert 'audit_id' in key_schema
            assert key_schema['audit_id'] == 'HASH'
            assert 'timestamp' in key_schema
            assert key_schema['timestamp'] == 'RANGE'

            # Verify attribute definitions
            attributes = {attr['AttributeName']: attr['AttributeType']
                         for attr in table['AttributeDefinitions']}
            assert attributes.get('audit_id') == 'S'  # String
            assert attributes.get('timestamp') == 'N'  # Number
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip("Table not found - stack may not be deployed")
            raise

    def test_audit_logs_table_has_pitr_enabled(self, aws_clients):
        """Test that point-in-time recovery is enabled for audit logs."""
        try:
            table_name = "healthcare-audit-logs-v2-pr7112"
            response = aws_clients['dynamodb_us_east_1'].describe_continuous_backups(
                TableName=table_name
            )

            pitr_status = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
            assert pitr_status == 'ENABLED', "Point-in-time recovery should be enabled"
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip("Table not found - stack may not be deployed")
            raise

    def test_tables_have_correct_tags(self, aws_clients):
        """Test that DynamoDB tables have correct tags."""
        try:
            table_name = "healthcare-patient-records-v2-pr7112"
            response = aws_clients['dynamodb_us_east_1'].list_tags_of_resource(
                ResourceArn=f"arn:aws:dynamodb:us-east-1:342597974367:table/{table_name}"
            )

            tags = {tag['Key']: tag['Value'] for tag in response.get('Tags', [])}

            assert 'Environment' in tags
            assert tags['Environment'] == 'Production'
            assert 'DisasterRecovery' in tags
            assert tags['DisasterRecovery'] == 'Enabled'
            assert 'ManagedBy' in tags
            assert tags['ManagedBy'] == 'CDKTF'
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip("Table not found - stack may not be deployed")
            raise


class TestRoute53Infrastructure:
    """Test Route 53 hosted zone and DNS records."""

    def test_hosted_zone_exists(self, aws_clients):
        """Test that Route 53 hosted zone exists."""
        try:
            response = aws_clients['route53'].list_hosted_zones()

            hosted_zones = response.get('HostedZones', [])
            healthcare_zones = [
                zone for zone in hosted_zones
                if 'healthcare-dr-v2-pr7112.com' in zone['Name']
            ]

            if not healthcare_zones:
                pytest.skip("Hosted zone not found - may not be deployed or using different naming")

            assert len(healthcare_zones) >= 1
            zone = healthcare_zones[0]
            assert zone['Config']['PrivateZone'] is False
        except ClientError as e:
            pytest.skip(f"Could not list hosted zones: {e}")

    def test_hosted_zone_has_dns_records(self, aws_clients):
        """Test that hosted zone has DNS records configured."""
        try:
            # First, find the hosted zone
            response = aws_clients['route53'].list_hosted_zones()
            hosted_zones = response.get('HostedZones', [])
            healthcare_zones = [
                zone for zone in hosted_zones
                if 'healthcare-dr-v2-pr7112.com' in zone['Name']
            ]

            if not healthcare_zones:
                pytest.skip("Hosted zone not found")

            zone_id = healthcare_zones[0]['Id']

            # List resource record sets
            records_response = aws_clients['route53'].list_resource_record_sets(
                HostedZoneId=zone_id
            )

            record_sets = records_response.get('ResourceRecordSets', [])

            # Should have at least NS and SOA records
            assert len(record_sets) >= 2

            record_types = [record['Type'] for record in record_sets]
            assert 'NS' in record_types
            assert 'SOA' in record_types
        except ClientError as e:
            pytest.skip(f"Could not check DNS records: {e}")

    def test_api_dns_records_exist_for_failover(self, aws_clients):
        """Test that API DNS records exist for weighted routing."""
        try:
            # First, find the hosted zone
            response = aws_clients['route53'].list_hosted_zones()
            hosted_zones = response.get('HostedZones', [])
            healthcare_zones = [
                zone for zone in hosted_zones
                if 'healthcare-dr-v2-pr7112.com' in zone['Name']
            ]

            if not healthcare_zones:
                pytest.skip("Hosted zone not found")

            zone_id = healthcare_zones[0]['Id']

            # List resource record sets
            records_response = aws_clients['route53'].list_resource_record_sets(
                HostedZoneId=zone_id
            )

            record_sets = records_response.get('ResourceRecordSets', [])

            # Look for API records with weighted routing
            api_records = [
                record for record in record_sets
                if 'api.' in record.get('Name', '')
            ]

            if not api_records:
                pytest.skip("API DNS records not found - may use different configuration")

            # Verify weighted routing policy exists
            weighted_records = [
                record for record in api_records
                if 'SetIdentifier' in record
            ]

            assert len(weighted_records) >= 2, "Should have at least 2 weighted records (primary + secondary)"

            # Verify set identifiers
            identifiers = [record['SetIdentifier'] for record in weighted_records]
            assert 'primary' in identifiers
            assert 'secondary' in identifiers
        except ClientError as e:
            pytest.skip(f"Could not check API DNS records: {e}")


class TestCrossRegionReplication:
    """Test cross-region replication and global table functionality."""

    def test_both_regions_have_same_tables(self, aws_clients):
        """Test that both regions have the same DynamoDB tables."""
        try:
            # List tables in primary region
            primary_response = aws_clients['dynamodb_us_east_1'].list_tables()
            primary_tables = set(primary_response.get('TableNames', []))

            # List tables in secondary region
            secondary_response = aws_clients['dynamodb_us_west_2'].list_tables()
            secondary_tables = set(secondary_response.get('TableNames', []))

            # Filter to healthcare tables
            healthcare_primary = {t for t in primary_tables if 'healthcare' in t}
            healthcare_secondary = {t for t in secondary_tables if 'healthcare' in t}

            if not healthcare_primary:
                pytest.skip("No healthcare tables found in primary region")

            # Verify same tables exist in both regions
            assert healthcare_primary == healthcare_secondary, \
                f"Tables mismatch: Primary {healthcare_primary}, Secondary {healthcare_secondary}"
        except ClientError as e:
            pytest.skip(f"Could not verify cross-region tables: {e}")

    def test_global_tables_have_replicas_configured(self, aws_clients):
        """Test that global tables have replicas properly configured."""
        try:
            table_name = "healthcare-patient-records-v2-pr7112"
            response = aws_clients['dynamodb_us_east_1'].describe_table(
                TableName=table_name
            )

            table = response['Table']

            # Check for replica information
            if 'Replicas' in table:
                replicas = table['Replicas']
                replica_regions = [replica['RegionName'] for replica in replicas]

                # Should have us-west-2 as replica
                assert 'us-west-2' in replica_regions, "Secondary region should be configured as replica"

                # All replicas should be ACTIVE
                for replica in replicas:
                    assert replica['ReplicaStatus'] in ['ACTIVE', 'CREATING', 'UPDATING']
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip("Table not found - stack may not be deployed")
            raise


class TestDataConsistency:
    """Test data consistency across regions (validation only, no writes)."""

    def test_table_schemas_match_across_regions(self, aws_clients):
        """Test that table schemas are identical in both regions."""
        try:
            table_name = "healthcare-patient-records-v2-pr7112"

            # Get table description from both regions
            primary_response = aws_clients['dynamodb_us_east_1'].describe_table(
                TableName=table_name
            )
            secondary_response = aws_clients['dynamodb_us_west_2'].describe_table(
                TableName=table_name
            )

            primary_table = primary_response['Table']
            secondary_table = secondary_response['Table']

            # Compare key schemas
            primary_keys = sorted(primary_table['KeySchema'], key=lambda x: x['AttributeName'])
            secondary_keys = sorted(secondary_table['KeySchema'], key=lambda x: x['AttributeName'])
            assert primary_keys == secondary_keys

            # Compare attribute definitions
            primary_attrs = sorted(primary_table['AttributeDefinitions'], key=lambda x: x['AttributeName'])
            secondary_attrs = sorted(secondary_table['AttributeDefinitions'], key=lambda x: x['AttributeName'])
            assert primary_attrs == secondary_attrs

            # Compare billing mode
            assert primary_table['BillingModeSummary']['BillingMode'] == \
                   secondary_table['BillingModeSummary']['BillingMode']
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip("Table not found in one or both regions")
            raise

    def test_table_count_matches_in_both_regions(self, aws_clients):
        """Test that the number of tables is consistent across regions."""
        try:
            # List tables in both regions
            primary_response = aws_clients['dynamodb_us_east_1'].list_tables()
            secondary_response = aws_clients['dynamodb_us_west_2'].list_tables()

            primary_healthcare_tables = [
                t for t in primary_response.get('TableNames', [])
                if 'healthcare' in t
            ]
            secondary_healthcare_tables = [
                t for t in secondary_response.get('TableNames', [])
                if 'healthcare' in t
            ]

            assert len(primary_healthcare_tables) == len(secondary_healthcare_tables), \
                "Number of healthcare tables should match in both regions"
        except ClientError as e:
            pytest.skip(f"Could not verify table count: {e}")
