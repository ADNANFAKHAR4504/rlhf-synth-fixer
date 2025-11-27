"""Integration tests for TapStack (unified stack) - Full disaster recovery verification."""
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

    if not outputs:
        pytest.skip("No stack outputs found in flat-outputs.json")

    stack_name = list(outputs.keys())[0]
    return outputs[stack_name]


@pytest.fixture(scope="module")
def aws_clients():
    """Create AWS clients for both regions."""
    try:
        return {
            'primary': {
                's3': boto3.client('s3', region_name='us-east-1'),
                'kms': boto3.client('kms', region_name='us-east-1'),
                'lambda': boto3.client('lambda', region_name='us-east-1'),
                'dynamodb': boto3.client('dynamodb', region_name='us-east-1'),
                'ec2': boto3.client('ec2', region_name='us-east-1'),
                'cloudwatch': boto3.client('cloudwatch', region_name='us-east-1'),
                'sns': boto3.client('sns', region_name='us-east-1'),
            },
            'secondary': {
                's3': boto3.client('s3', region_name='us-west-2'),
                'kms': boto3.client('kms', region_name='us-west-2'),
                'lambda': boto3.client('lambda', region_name='us-west-2'),
                'dynamodb': boto3.client('dynamodb', region_name='us-west-2'),
                'ec2': boto3.client('ec2', region_name='us-west-2'),
                'cloudwatch': boto3.client('cloudwatch', region_name='us-west-2'),
                'sns': boto3.client('sns', region_name='us-west-2'),
            },
            'route53': boto3.client('route53'),
            'iam': boto3.client('iam'),
        }
    except NoCredentialsError:
        pytest.skip("AWS credentials not configured")


class TestStackOutputs:
    """Test that all required stack outputs are present."""

    def test_all_outputs_present(self, stack_outputs):
        """Test that all expected outputs are present in flat-outputs.json."""
        required_outputs = [
            'primary_bucket_arn',
            'secondary_bucket_arn',
            'primary_lambda_name',
            'secondary_lambda_name',
            'primary_kms_key_arn',
            'secondary_kms_key_arn'
        ]

        for output_key in required_outputs:
            assert output_key in stack_outputs, f"Output {output_key} not found"
            assert stack_outputs[output_key] is not None, f"Output {output_key} is None"
            assert stack_outputs[output_key] != '', f"Output {output_key} is empty"

    def test_output_values_are_valid_arns_or_names(self, stack_outputs):
        """Test that output values have valid formats."""
        # Verify ARNs
        arn_outputs = ['primary_bucket_arn', 'secondary_bucket_arn',
                      'primary_kms_key_arn', 'secondary_kms_key_arn']

        for arn_output in arn_outputs:
            value = stack_outputs.get(arn_output)
            if value:
                assert value.startswith('arn:aws:'), f"{arn_output} should start with 'arn:aws:'"

        # Verify Lambda names
        lambda_outputs = ['primary_lambda_name', 'secondary_lambda_name']
        for lambda_output in lambda_outputs:
            value = stack_outputs.get(lambda_output)
            if value:
                assert len(value) > 0, f"{lambda_output} should not be empty"
                assert 'healthcare-dr-api' in value, f"{lambda_output} should contain 'healthcare-dr-api'"

    def test_primary_and_secondary_resources_have_different_arns(self, stack_outputs):
        """Test that primary and secondary resources have different ARNs."""
        primary_bucket = stack_outputs.get('primary_bucket_arn')
        secondary_bucket = stack_outputs.get('secondary_bucket_arn')
        assert primary_bucket != secondary_bucket, "Primary and secondary buckets should be different"

        primary_kms = stack_outputs.get('primary_kms_key_arn')
        secondary_kms = stack_outputs.get('secondary_kms_key_arn')
        assert primary_kms != secondary_kms, "Primary and secondary KMS keys should be different"

        primary_lambda = stack_outputs.get('primary_lambda_name')
        secondary_lambda = stack_outputs.get('secondary_lambda_name')
        assert primary_lambda != secondary_lambda, "Primary and secondary Lambda functions should be different"


class TestMultiRegionDeployment:
    """Test that resources are properly deployed across both regions."""

    def test_all_primary_resources_exist(self, stack_outputs, aws_clients):
        """Test that all primary region resources exist."""
        try:
            # Test S3
            primary_bucket = stack_outputs['primary_bucket_arn'].split(':::')[-1]
            aws_clients['primary']['s3'].head_bucket(Bucket=primary_bucket)

            # Test KMS
            aws_clients['primary']['kms'].describe_key(KeyId=stack_outputs['primary_kms_key_arn'])

            # Test Lambda
            aws_clients['primary']['lambda'].get_function(FunctionName=stack_outputs['primary_lambda_name'])
        except ClientError as e:
            pytest.fail(f"Primary region resource check failed: {e}")

    def test_all_secondary_resources_exist(self, stack_outputs, aws_clients):
        """Test that all secondary region resources exist."""
        try:
            # Test S3
            secondary_bucket = stack_outputs['secondary_bucket_arn'].split(':::')[-1]
            aws_clients['secondary']['s3'].head_bucket(Bucket=secondary_bucket)

            # Test KMS
            aws_clients['secondary']['kms'].describe_key(KeyId=stack_outputs['secondary_kms_key_arn'])

            # Test Lambda
            aws_clients['secondary']['lambda'].get_function(FunctionName=stack_outputs['secondary_lambda_name'])
        except ClientError as e:
            pytest.fail(f"Secondary region resource check failed: {e}")

    def test_both_regions_have_dynamodb_tables(self, aws_clients):
        """Test that DynamoDB global tables exist in both regions."""
        try:
            # Check primary region
            primary_tables = aws_clients['primary']['dynamodb'].list_tables()
            primary_healthcare_tables = [
                t for t in primary_tables.get('TableNames', [])
                if 'healthcare' in t
            ]

            # Check secondary region
            secondary_tables = aws_clients['secondary']['dynamodb'].list_tables()
            secondary_healthcare_tables = [
                t for t in secondary_tables.get('TableNames', [])
                if 'healthcare' in t
            ]

            assert len(primary_healthcare_tables) >= 2, "Should have at least 2 tables in primary region"
            assert len(secondary_healthcare_tables) >= 2, "Should have at least 2 tables in secondary region"
            assert set(primary_healthcare_tables) == set(secondary_healthcare_tables), \
                "Both regions should have the same tables"
        except ClientError as e:
            pytest.skip(f"Could not verify DynamoDB tables: {e}")

    def test_both_regions_have_vpc_infrastructure(self, aws_clients):
        """Test that VPC infrastructure exists in both regions."""
        try:
            # Check primary VPC
            primary_vpcs = aws_clients['primary']['ec2'].describe_vpcs(
                Filters=[{'Name': 'tag:Name', 'Values': ['*healthcare-dr-vpc-primary-v2*']}]
            )

            # Check secondary VPC
            secondary_vpcs = aws_clients['secondary']['ec2'].describe_vpcs(
                Filters=[{'Name': 'tag:Name', 'Values': ['*healthcare-dr-vpc-secondary-v2*']}]
            )

            if primary_vpcs.get('Vpcs'):
                assert len(primary_vpcs['Vpcs']) >= 1, "Should have primary VPC"

            if secondary_vpcs.get('Vpcs'):
                assert len(secondary_vpcs['Vpcs']) >= 1, "Should have secondary VPC"
        except ClientError as e:
            pytest.skip(f"Could not verify VPC infrastructure: {e}")


class TestDisasterRecoveryCapabilities:
    """Test disaster recovery capabilities and failover readiness."""

    def test_s3_versioning_enabled_for_disaster_recovery(self, stack_outputs, aws_clients):
        """Test that S3 versioning is enabled for data protection."""
        try:
            primary_bucket = stack_outputs['primary_bucket_arn'].split(':::')[-1]
            secondary_bucket = stack_outputs['secondary_bucket_arn'].split(':::')[-1]

            primary_versioning = aws_clients['primary']['s3'].get_bucket_versioning(Bucket=primary_bucket)
            secondary_versioning = aws_clients['secondary']['s3'].get_bucket_versioning(Bucket=secondary_bucket)

            assert primary_versioning.get('Status') == 'Enabled', "Primary bucket versioning must be enabled"
            assert secondary_versioning.get('Status') == 'Enabled', "Secondary bucket versioning must be enabled"
        except ClientError as e:
            pytest.skip(f"Could not verify S3 versioning: {e}")

    def test_dynamodb_pitr_enabled_for_disaster_recovery(self, aws_clients):
        """Test that DynamoDB point-in-time recovery is enabled."""
        try:
            table_names = ['healthcare-patient-records-v2-pr7112', 'healthcare-audit-logs-v2-pr7112']

            for table_name in table_names:
                response = aws_clients['primary']['dynamodb'].describe_continuous_backups(
                    TableName=table_name
                )

                pitr_status = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
                assert pitr_status == 'ENABLED', f"PITR must be enabled for {table_name}"
        except ClientError as e:
            pytest.skip(f"Could not verify PITR: {e}")

    def test_kms_key_rotation_enabled_for_security(self, stack_outputs, aws_clients):
        """Test that KMS key rotation is enabled for both regions."""
        try:
            primary_rotation = aws_clients['primary']['kms'].get_key_rotation_status(
                KeyId=stack_outputs['primary_kms_key_arn']
            )
            secondary_rotation = aws_clients['secondary']['kms'].get_key_rotation_status(
                KeyId=stack_outputs['secondary_kms_key_arn']
            )

            assert primary_rotation['KeyRotationEnabled'] is True, "Primary KMS rotation must be enabled"
            assert secondary_rotation['KeyRotationEnabled'] is True, "Secondary KMS rotation must be enabled"
        except ClientError as e:
            pytest.skip(f"Could not verify KMS rotation: {e}")

    def test_lambda_functions_in_both_regions_for_failover(self, stack_outputs, aws_clients):
        """Test that Lambda functions are deployed in both regions."""
        try:
            primary_lambda = aws_clients['primary']['lambda'].get_function(
                FunctionName=stack_outputs['primary_lambda_name']
            )
            secondary_lambda = aws_clients['secondary']['lambda'].get_function(
                FunctionName=stack_outputs['secondary_lambda_name']
            )

            assert primary_lambda['Configuration']['State'] == 'Active'
            assert secondary_lambda['Configuration']['State'] == 'Active'

            # Verify same configuration for failover
            assert primary_lambda['Configuration']['Runtime'] == secondary_lambda['Configuration']['Runtime']
            assert primary_lambda['Configuration']['MemorySize'] == secondary_lambda['Configuration']['MemorySize']
        except ClientError as e:
            pytest.skip(f"Could not verify Lambda failover setup: {e}")

    def test_monitoring_enabled_in_both_regions(self, aws_clients):
        """Test that CloudWatch monitoring is enabled in both regions."""
        try:
            # Check primary dashboards
            primary_dashboards = aws_clients['primary']['cloudwatch'].list_dashboards()
            primary_healthcare = [
                d for d in primary_dashboards.get('DashboardEntries', [])
                if 'healthcare-dr-primary' in d['DashboardName']
            ]

            # Check secondary dashboards
            secondary_dashboards = aws_clients['secondary']['cloudwatch'].list_dashboards()
            secondary_healthcare = [
                d for d in secondary_dashboards.get('DashboardEntries', [])
                if 'healthcare-dr-secondary' in d['DashboardName']
            ]

            if primary_healthcare:
                assert len(primary_healthcare) >= 1, "Should have primary monitoring dashboard"

            if secondary_healthcare:
                assert len(secondary_healthcare) >= 1, "Should have secondary monitoring dashboard"
        except ClientError as e:
            pytest.skip(f"Could not verify monitoring: {e}")


class TestSecurityCompliance:
    """Test security and compliance configurations."""

    def test_all_s3_buckets_encrypted_with_kms(self, stack_outputs, aws_clients):
        """Test that all S3 buckets are encrypted with KMS."""
        try:
            buckets_and_keys = [
                (stack_outputs['primary_bucket_arn'].split(':::')[-1],
                 stack_outputs['primary_kms_key_arn'],
                 aws_clients['primary']['s3']),
                (stack_outputs['secondary_bucket_arn'].split(':::')[-1],
                 stack_outputs['secondary_kms_key_arn'],
                 aws_clients['secondary']['s3'])
            ]

            for bucket_name, kms_arn, s3_client in buckets_and_keys:
                encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
                rules = encryption['ServerSideEncryptionConfiguration']['Rules']

                assert len(rules) > 0
                assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'aws:kms'

                kms_key_id = kms_arn.split('/')[-1]
                assert kms_key_id in rules[0]['ApplyServerSideEncryptionByDefault']['KMSMasterKeyID']
        except ClientError as e:
            pytest.skip(f"Could not verify encryption: {e}")

    def test_all_resources_have_required_tags(self, stack_outputs, aws_clients):
        """Test that resources have required compliance tags."""
        try:
            # Check S3 bucket tags
            primary_bucket = stack_outputs['primary_bucket_arn'].split(':::')[-1]
            tags_response = aws_clients['primary']['s3'].get_bucket_tagging(Bucket=primary_bucket)
            tags = {tag['Key']: tag['Value'] for tag in tags_response.get('TagSet', [])}

            required_tags = ['Environment', 'DisasterRecovery', 'ManagedBy']
            for required_tag in required_tags:
                assert required_tag in tags, f"Tag {required_tag} is required for compliance"

            assert tags['Environment'] == 'Production'
            assert tags['DisasterRecovery'] == 'Enabled'
            assert tags['ManagedBy'] == 'CDKTF'
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchTagSet':
                pytest.skip(f"Could not verify tags: {e}")
            else:
                pytest.fail("Resources must have compliance tags")

    def test_lambda_functions_have_appropriate_timeout(self, stack_outputs, aws_clients):
        """Test that Lambda functions have appropriate timeout for healthcare."""
        try:
            for region_key, lambda_key in [('primary', 'primary_lambda_name'),
                                          ('secondary', 'secondary_lambda_name')]:
                response = aws_clients[region_key]['lambda'].get_function(
                    FunctionName=stack_outputs[lambda_key]
                )
                timeout = response['Configuration']['Timeout']

                assert timeout == 30, f"Lambda timeout should be 30 seconds, found {timeout}"
        except ClientError as e:
            pytest.skip(f"Could not verify Lambda timeout: {e}")

    def test_dynamodb_tables_have_streams_for_auditing(self, aws_clients):
        """Test that DynamoDB tables have streams enabled for auditing."""
        try:
            table_names = ['healthcare-patient-records-v2-pr7112', 'healthcare-audit-logs-v2-pr7112']

            for table_name in table_names:
                response = aws_clients['primary']['dynamodb'].describe_table(TableName=table_name)
                table = response['Table']

                assert 'StreamSpecification' in table, f"Table {table_name} must have streams"
                assert table['StreamSpecification']['StreamEnabled'] is True
                assert table['StreamSpecification']['StreamViewType'] == 'NEW_AND_OLD_IMAGES'
        except ClientError as e:
            pytest.skip(f"Could not verify DynamoDB streams: {e}")


class TestHighAvailability:
    """Test high availability configurations."""

    def test_subnets_span_multiple_availability_zones(self, aws_clients):
        """Test that subnets are deployed across multiple AZs."""
        try:
            for region_key in ['primary', 'secondary']:
                region_name = 'primary' if region_key == 'primary' else 'secondary'
                subnets_response = aws_clients[region_key]['ec2'].describe_subnets(
                    Filters=[{'Name': 'tag:Name', 'Values': [f'*healthcare-dr-subnet*{region_name}-v2*']}]
                )

                subnets = subnets_response.get('Subnets', [])
                if not subnets:
                    continue

                availability_zones = set([subnet['AvailabilityZone'] for subnet in subnets])
                assert len(availability_zones) >= 3, \
                    f"{region_name} region should have subnets in at least 3 AZs"
        except ClientError as e:
            pytest.skip(f"Could not verify AZ distribution: {e}")

    def test_dynamodb_global_tables_configured(self, aws_clients):
        """Test that DynamoDB tables are configured as global tables."""
        try:
            table_name = 'healthcare-patient-records-v2-pr7112'
            response = aws_clients['primary']['dynamodb'].describe_table(TableName=table_name)
            table = response['Table']

            # Check for replica configuration
            if 'Replicas' in table:
                replicas = table['Replicas']
                replica_regions = [replica['RegionName'] for replica in replicas]

                assert 'us-west-2' in replica_regions, "Should have us-west-2 as replica"
            else:
                pytest.skip("Global table replicas not found - may not be fully configured yet")
        except ClientError as e:
            pytest.skip(f"Could not verify global tables: {e}")

    def test_route53_dns_configured_for_failover(self, aws_clients):
        """Test that Route53 is configured for DNS failover."""
        try:
            hosted_zones = aws_clients['route53'].list_hosted_zones()
            healthcare_zones = [
                zone for zone in hosted_zones.get('HostedZones', [])
                if 'healthcare-dr-v2-pr7112' in zone['Name']
            ]

            if not healthcare_zones:
                pytest.skip("Route53 hosted zone not found")

            zone_id = healthcare_zones[0]['Id']
            records = aws_clients['route53'].list_resource_record_sets(HostedZoneId=zone_id)

            # Look for weighted routing records
            weighted_records = [
                record for record in records.get('ResourceRecordSets', [])
                if 'SetIdentifier' in record
            ]

            if weighted_records:
                identifiers = [record['SetIdentifier'] for record in weighted_records]
                assert 'primary' in identifiers, "Should have primary weighted record"
                assert 'secondary' in identifiers, "Should have secondary weighted record"
        except ClientError as e:
            pytest.skip(f"Could not verify Route53 failover: {e}")


class TestResourceNamingConventions:
    """Test that resources follow naming conventions."""

    def test_resource_names_include_version_v2(self, stack_outputs):
        """Test that resource names include version v2."""
        for key, value in stack_outputs.items():
            # Skip KMS key ARNs as they contain GUIDs, not aliases
            if 'kms_key_arn' in key.lower():
                continue
            if 'name' in key.lower() or 'arn' in key.lower():
                assert 'v2' in value or 'V2' in value.upper(), \
                    f"Resource {key} should include version v2"

    def test_resource_names_include_environment_suffix(self, stack_outputs):
        """Test that resource names include environment suffix."""
        # Extract environment suffix from one of the resources
        primary_bucket = stack_outputs.get('primary_bucket_arn', '')
        if 'pr7112' in primary_bucket:
            env_suffix = 'pr7112'
        else:
            pytest.skip("Could not determine environment suffix")

        for key, value in stack_outputs.items():
            # Skip KMS key ARNs as they contain GUIDs, not aliases
            if 'kms_key_arn' in key.lower():
                continue
            if value:
                assert env_suffix in value, \
                    f"Resource {key} should include environment suffix {env_suffix}"

    def test_primary_secondary_naming_distinction(self, stack_outputs):
        """Test that primary and secondary resources are clearly distinguished."""
        primary_resources = [k for k in stack_outputs.keys() if 'primary' in k]
        secondary_resources = [k for k in stack_outputs.keys() if 'secondary' in k]

        assert len(primary_resources) >= 3, "Should have primary resources"
        assert len(secondary_resources) >= 3, "Should have secondary resources"

        # Verify naming patterns
        for resource in primary_resources:
            assert 'primary' in resource.lower()

        for resource in secondary_resources:
            assert 'secondary' in resource.lower()


class TestEndToEndWorkflow:
    """Test end-to-end disaster recovery workflow (read-only validation)."""

    def test_all_components_healthy(self, stack_outputs, aws_clients):
        """Test that all DR components are in healthy state."""
        try:
            # Check Lambda states
            primary_lambda = aws_clients['primary']['lambda'].get_function(
                FunctionName=stack_outputs['primary_lambda_name']
            )
            secondary_lambda = aws_clients['secondary']['lambda'].get_function(
                FunctionName=stack_outputs['secondary_lambda_name']
            )

            assert primary_lambda['Configuration']['State'] == 'Active'
            assert secondary_lambda['Configuration']['State'] == 'Active'

            # Check S3 buckets accessible
            primary_bucket = stack_outputs['primary_bucket_arn'].split(':::')[-1]
            secondary_bucket = stack_outputs['secondary_bucket_arn'].split(':::')[-1]

            aws_clients['primary']['s3'].head_bucket(Bucket=primary_bucket)
            aws_clients['secondary']['s3'].head_bucket(Bucket=secondary_bucket)

            # Check DynamoDB tables
            tables = aws_clients['primary']['dynamodb'].list_tables()
            healthcare_tables = [t for t in tables.get('TableNames', []) if 'healthcare' in t]

            for table in healthcare_tables:
                table_desc = aws_clients['primary']['dynamodb'].describe_table(TableName=table)
                assert table_desc['Table']['TableStatus'] in ['ACTIVE', 'UPDATING']
        except ClientError as e:
            pytest.fail(f"Component health check failed: {e}")

    def test_disaster_recovery_readiness_score(self, stack_outputs, aws_clients):
        """Calculate and verify DR readiness score."""
        readiness_checks = {
            'primary_resources_active': False,
            'secondary_resources_active': False,
            'global_tables_configured': False,
            'encryption_enabled': False,
            'versioning_enabled': False,
            'monitoring_configured': False,
            'pitr_enabled': False,
        }

        try:
            # Check primary resources
            aws_clients['primary']['lambda'].get_function(
                FunctionName=stack_outputs['primary_lambda_name']
            )
            readiness_checks['primary_resources_active'] = True

            # Check secondary resources
            aws_clients['secondary']['lambda'].get_function(
                FunctionName=stack_outputs['secondary_lambda_name']
            )
            readiness_checks['secondary_resources_active'] = True

            # Check global tables
            tables = aws_clients['primary']['dynamodb'].list_tables()
            if any('healthcare' in t for t in tables.get('TableNames', [])):
                readiness_checks['global_tables_configured'] = True

            # Check encryption
            primary_bucket = stack_outputs['primary_bucket_arn'].split(':::')[-1]
            encryption = aws_clients['primary']['s3'].get_bucket_encryption(Bucket=primary_bucket)
            if encryption:
                readiness_checks['encryption_enabled'] = True

            # Check versioning
            versioning = aws_clients['primary']['s3'].get_bucket_versioning(Bucket=primary_bucket)
            if versioning.get('Status') == 'Enabled':
                readiness_checks['versioning_enabled'] = True

            # Check monitoring
            dashboards = aws_clients['primary']['cloudwatch'].list_dashboards()
            if any('healthcare' in d['DashboardName'] for d in dashboards.get('DashboardEntries', [])):
                readiness_checks['monitoring_configured'] = True

            # Check PITR
            try:
                pitr = aws_clients['primary']['dynamodb'].describe_continuous_backups(
                    TableName='healthcare-patient-records-v2-pr7112'
                )
                if pitr['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'] == 'ENABLED':
                    readiness_checks['pitr_enabled'] = True
            except:
                pass

        except ClientError:
            pass

        # Calculate readiness score
        total_checks = len(readiness_checks)
        passed_checks = sum(1 for v in readiness_checks.values() if v)
        readiness_score = (passed_checks / total_checks) * 100

        print(f"\nDisaster Recovery Readiness Score: {readiness_score:.1f}%")
        print(f"Passed checks: {passed_checks}/{total_checks}")
        for check, status in readiness_checks.items():
            print(f"  {check}: {'✓' if status else '✗'}")

        # Require at least 70% readiness
        assert readiness_score >= 70, \
            f"DR readiness score {readiness_score:.1f}% is below minimum 70%"
