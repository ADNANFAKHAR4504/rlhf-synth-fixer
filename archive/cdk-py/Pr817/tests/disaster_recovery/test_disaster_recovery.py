"""Disaster Recovery testing for TapStack infrastructure"""

import json
import time
import unittest

import boto3
from botocore.exceptions import ClientError
from pytest import mark

from tests.utils import load_flat_outputs

# Load CloudFormation outputs
flat_outputs = load_flat_outputs()


@mark.describe("TapStack Disaster Recovery Tests")
class TestTapStackDisasterRecovery(unittest.TestCase):
    """Disaster Recovery test cases for the deployed TapStack infrastructure"""

    def setUp(self):
        """Set up AWS clients for disaster recovery testing"""
        self.env_suffix = 'dev'  # Default for DR tests
        self.eu_west_region = 'eu-west-2'
        self.eu_central_region = 'eu-central-1'

        self.eu_west_session = boto3.Session(region_name=self.eu_west_region)
        self.eu_central_session = boto3.Session(region_name=self.eu_central_region)

        # AWS service clients for both regions
        self.eu_west_lambda = self.eu_west_session.client('lambda')
        self.eu_west_s3 = self.eu_west_session.client('s3')
        self.eu_west_rds = self.eu_west_session.client('rds')
        self.eu_west_ec2 = self.eu_west_session.client('ec2')
        
        self.eu_central_lambda = self.eu_central_session.client('lambda')
        self.eu_central_s3 = self.eu_central_session.client('s3')
        self.eu_central_rds = self.eu_central_session.client('rds')
        self.eu_central_ec2 = self.eu_central_session.client('ec2')

    def _get_output_value(self, stack_prefix, output_key):
        """Helper method to get CloudFormation output values"""
        for stack_output_key in flat_outputs.keys():
            if stack_output_key.endswith(f".{output_key}"):
                stack_name = stack_output_key.replace(f".{output_key}", "")
                if stack_prefix in stack_name and self.env_suffix in stack_name:
                    return flat_outputs[stack_output_key]
        return None

    @mark.it("Primary region availability should be testable")
    def test_primary_region_availability(self):
        """Test primary region (EU-West-2) service availability"""
        # Test Lambda service availability
        lambda_arn = self._get_output_value('MultiRegionStackEUWest', 'LambdaFunctionArn')
        if lambda_arn:
            function_name = lambda_arn.split(':')[-1]
            try:
                response = self.eu_west_lambda.get_function(FunctionName=function_name)
                lambda_available = True
            except ClientError:
                lambda_available = False
            
            self.assertTrue(lambda_available, "Primary region Lambda should be available")

        # Test S3 service availability
        s3_bucket = self._get_output_value('MultiRegionStackEUWest', 'S3BucketSSES3Name')
        if s3_bucket:
            try:
                self.eu_west_s3.head_bucket(Bucket=s3_bucket)
                s3_available = True
            except ClientError:
                s3_available = False
            
            self.assertTrue(s3_available, "Primary region S3 should be available")

        # Test RDS availability
        db_endpoint = self._get_output_value('MultiRegionStackEUWest', 'DatabaseEndpoint')
        if db_endpoint:
            try:
                # Find DB instance by endpoint
                instances = self.eu_west_rds.describe_db_instances()
                db_instance = None
                for instance in instances['DBInstances']:
                    if instance['Endpoint']['Address'] == db_endpoint:
                        db_instance = instance
                        break
                
                rds_available = db_instance is not None and db_instance['DBInstanceStatus'] == 'available'
            except ClientError:
                rds_available = False
            
            self.assertTrue(rds_available, "Primary region RDS should be available")

    @mark.it("Secondary region should be ready for failover")
    def test_secondary_region_readiness(self):
        """Test secondary region (EU-Central-1) readiness for failover"""
        # Test Lambda service readiness
        lambda_arn = self._get_output_value('MultiRegionStackEUCentral', 'LambdaFunctionArn')
        if lambda_arn:
            function_name = lambda_arn.split(':')[-1]
            try:
                response = self.eu_central_lambda.get_function(FunctionName=function_name)
                lambda_ready = response['Configuration']['State'] == 'Active'
            except ClientError:
                lambda_ready = False
            
            self.assertTrue(lambda_ready, "Secondary region Lambda should be ready")

        # Test S3 service readiness
        s3_bucket = self._get_output_value('MultiRegionStackEUCentral', 'S3BucketSSEKMSName')
        if s3_bucket:
            try:
                response = self.eu_central_s3.head_bucket(Bucket=s3_bucket)
                s3_ready = response['ResponseMetadata']['HTTPStatusCode'] == 200
            except ClientError:
                s3_ready = False
            
            self.assertTrue(s3_ready, "Secondary region S3 should be ready")

        # Test network infrastructure readiness
        vpc_id = self._get_output_value('MultiRegionStackEUCentral', 'VPCId')
        if vpc_id:
            try:
                vpcs = self.eu_central_ec2.describe_vpcs(VpcIds=[vpc_id])
                vpc_ready = len(vpcs['Vpcs']) > 0 and vpcs['Vpcs'][0]['State'] == 'available'
            except ClientError:
                vpc_ready = False
            
            self.assertTrue(vpc_ready, "Secondary region VPC should be ready")

    @mark.it("Data replication capabilities should exist")
    def test_data_replication_capabilities(self):
        """Test that infrastructure supports data replication for DR"""
        primary_bucket = self._get_output_value('MultiRegionStackEUWest', 'S3BucketSSES3Name')
        secondary_bucket = self._get_output_value('MultiRegionStackEUCentral', 'S3BucketSSES3Name')
        
        if primary_bucket and secondary_bucket:
            # Test data can be written to primary region
            test_key = f'dr-test/{int(time.time())}/test-object.json'
            test_data = json.dumps({'disaster_recovery_test': True, 'timestamp': time.time()})
            
            try:
                # Write to primary
                self.eu_west_s3.put_object(
                    Bucket=primary_bucket,
                    Key=test_key,
                    Body=test_data,
                    ContentType='application/json'
                )
                
                # Verify object exists in primary
                primary_response = self.eu_west_s3.head_object(Bucket=primary_bucket, Key=test_key)
                self.assertEqual(primary_response['ResponseMetadata']['HTTPStatusCode'], 200)
                
                # Test data can be written to secondary region (for manual replication testing)
                self.eu_central_s3.put_object(
                    Bucket=secondary_bucket,
                    Key=test_key,
                    Body=test_data,
                    ContentType='application/json'
                )
                
                # Verify object exists in secondary
                secondary_response = self.eu_central_s3.head_object(Bucket=secondary_bucket, Key=test_key)
                self.assertEqual(secondary_response['ResponseMetadata']['HTTPStatusCode'], 200)
                
                # Clean up test data
                self.eu_west_s3.delete_object(Bucket=primary_bucket, Key=test_key)
                self.eu_central_s3.delete_object(Bucket=secondary_bucket, Key=test_key)
                
            except ClientError as e:
                self.fail(f"Data replication capability test failed: {e}")

    @mark.it("Cross-region failover should be feasible")
    def test_cross_region_failover_feasibility(self):
        """Test that cross-region failover is technically feasible"""
        # Verify both regions have equivalent infrastructure
        primary_vpc = self._get_output_value('MultiRegionStackEUWest', 'VPCId')
        secondary_vpc = self._get_output_value('MultiRegionStackEUCentral', 'VPCId')
        
        primary_lambda = self._get_output_value('MultiRegionStackEUWest', 'LambdaFunctionArn')
        secondary_lambda = self._get_output_value('MultiRegionStackEUCentral', 'LambdaFunctionArn')
        
        primary_db = self._get_output_value('MultiRegionStackEUWest', 'DatabaseEndpoint')
        secondary_db = self._get_output_value('MultiRegionStackEUCentral', 'DatabaseEndpoint')
        
        # Both regions should have equivalent resources
        if primary_vpc and secondary_vpc:
            self.assertNotEqual(primary_vpc, secondary_vpc, "VPCs should be different across regions")
            
        if primary_lambda and secondary_lambda:
            self.assertNotEqual(primary_lambda, secondary_lambda, "Lambda ARNs should be different across regions")
            # Both should contain their respective regions
            self.assertIn('eu-west-2', primary_lambda)
            self.assertIn('eu-central-1', secondary_lambda)
            
        if primary_db and secondary_db:
            self.assertNotEqual(primary_db, secondary_db, "Database endpoints should be different across regions")
            self.assertIn('eu-west-2', primary_db)
            self.assertIn('eu-central-1', secondary_db)

    @mark.it("Backup verification should be possible")
    def test_backup_verification(self):
        """Test that backup mechanisms are in place and verifiable"""
        regions = [
            ('eu-west-2', self.eu_west_rds, 'MultiRegionStackEUWest'),
            ('eu-central-1', self.eu_central_rds, 'MultiRegionStackEUCentral')
        ]
        
        for region, rds_client, stack_prefix in regions:
            with self.subTest(region=region):
                db_endpoint = self._get_output_value(stack_prefix, 'DatabaseEndpoint')
                
                if db_endpoint:
                    # Find the database instance
                    instances = rds_client.describe_db_instances()
                    db_instance = None
                    
                    for instance in instances['DBInstances']:
                        if instance['Endpoint']['Address'] == db_endpoint:
                            db_instance = instance
                            break
                    
                    if db_instance:
                        # Verify backup retention is configured
                        backup_retention = db_instance['BackupRetentionPeriod']
                        self.assertGreaterEqual(backup_retention, 7,
                                              f"Backup retention should be at least 7 days in {region}")
                        
                        # Verify automated backups are enabled
                        self.assertTrue('PreferredBackupWindow' in db_instance,
                                      f"Automated backups should be configured in {region}")

    @mark.it("Recovery time objective should be measurable")
    def test_recovery_time_objective(self):
        """Test that RTO (Recovery Time Objective) can be measured"""
        # This test measures the time it takes to verify secondary region availability
        # In a real DR scenario, this would measure actual failover time
        
        start_time = time.time()
        
        # Simulate checking secondary region services
        secondary_services_available = 0
        total_services = 0
        
        # Check Lambda
        lambda_arn = self._get_output_value('MultiRegionStackEUCentral', 'LambdaFunctionArn')
        if lambda_arn:
            total_services += 1
            try:
                function_name = lambda_arn.split(':')[-1]
                self.eu_central_lambda.get_function(FunctionName=function_name)
                secondary_services_available += 1
            except ClientError:
                pass
        
        # Check S3
        s3_bucket = self._get_output_value('MultiRegionStackEUCentral', 'S3BucketSSES3Name')
        if s3_bucket:
            total_services += 1
            try:
                self.eu_central_s3.head_bucket(Bucket=s3_bucket)
                secondary_services_available += 1
            except ClientError:
                pass
        
        # Check VPC
        vpc_id = self._get_output_value('MultiRegionStackEUCentral', 'VPCId')
        if vpc_id:
            total_services += 1
            try:
                self.eu_central_ec2.describe_vpcs(VpcIds=[vpc_id])
                secondary_services_available += 1
            except ClientError:
                pass
        
        verification_time = time.time() - start_time
        
        # RTO verification should complete quickly (under 30 seconds)
        self.assertLess(verification_time, 30.0,
                       f"Service verification took too long: {verification_time:.2f}s")
        
        # At least 80% of services should be available for failover
        if total_services > 0:
            availability_percentage = (secondary_services_available / total_services) * 100
            self.assertGreaterEqual(availability_percentage, 80.0,
                                  f"Only {availability_percentage:.1f}% of services available for failover")

    @mark.it("Recovery point objective should be achievable")
    def test_recovery_point_objective(self):
        """Test that RPO (Recovery Point Objective) requirements can be met"""
        # Test data consistency across regions for RPO calculation
        
        primary_bucket = self._get_output_value('MultiRegionStackEUWest', 'S3BucketSSES3Name')
        secondary_bucket = self._get_output_value('MultiRegionStackEUCentral', 'S3BucketSSES3Name')
        
        if primary_bucket and secondary_bucket:
            # Create a timestamped test object
            current_time = time.time()
            test_key = f'rpo-test/{current_time}/data.json'
            test_data = json.dumps({
                'rpo_test': True,
                'creation_time': current_time,
                'region': 'eu-west-2'
            })
            
            try:
                # Write to primary region
                primary_write_time = time.time()
                self.eu_west_s3.put_object(
                    Bucket=primary_bucket,
                    Key=test_key,
                    Body=test_data,
                    ContentType='application/json'
                )
                
                # Simulate RPO by checking if we can replicate to secondary
                # In real scenario, this would be automatic cross-region replication
                secondary_write_time = time.time()
                self.eu_central_s3.put_object(
                    Bucket=secondary_bucket,
                    Key=test_key,
                    Body=test_data,
                    ContentType='application/json'
                )
                
                replication_time = secondary_write_time - primary_write_time
                
                # RPO should be achievable within reasonable time (e.g., 15 minutes = 900 seconds)
                # For testing, we use a much smaller window
                self.assertLess(replication_time, 60.0,
                               f"Simulated replication time too long: {replication_time:.2f}s")
                
                # Clean up
                self.eu_west_s3.delete_object(Bucket=primary_bucket, Key=test_key)
                self.eu_central_s3.delete_object(Bucket=secondary_bucket, Key=test_key)
                
            except ClientError as e:
                self.fail(f"RPO test failed: {e}")

    @mark.it("Communication channels should be tested")
    def test_disaster_recovery_communication(self):
        """Test that DR communication channels (SNS) are functional"""
        regions = [
            ('eu-west-2', self.eu_west_session, 'MultiRegionStackEUWest'),
            ('eu-central-1', self.eu_central_session, 'MultiRegionStackEUCentral')
        ]
        
        for region, session, stack_prefix in regions:
            with self.subTest(region=region):
                sns_client = session.client('sns')
                sns_topic_arn = self._get_output_value(stack_prefix, 'SNSTopicArn')
                
                if sns_topic_arn:
                    try:
                        # Verify SNS topic exists and is accessible
                        attributes = sns_client.get_topic_attributes(TopicArn=sns_topic_arn)
                        self.assertIn('Attributes', attributes)
                        
                        # Test that we can publish a DR test message (optional)
                        # sns_client.publish(
                        #     TopicArn=sns_topic_arn,
                        #     Subject='DR Communication Test',
                        #     Message=f'Disaster Recovery communication test from {region}'
                        # )
                        
                    except ClientError as e:
                        self.fail(f"SNS communication test failed in {region}: {e}")

    @mark.it("Infrastructure dependencies should be documented")
    def test_infrastructure_dependencies(self):
        """Test that infrastructure dependencies are properly mapped for DR"""
        # This test ensures that all critical dependencies are accounted for
        
        regions = [
            ('eu-west-2', 'MultiRegionStackEUWest'),
            ('eu-central-1', 'MultiRegionStackEUCentral')
        ]
        
        for region, stack_prefix in regions:
            with self.subTest(region=region):
                # Core infrastructure components that must exist
                required_outputs = [
                    'VPCId',
                    'S3BucketSSES3Name',
                    'LambdaFunctionArn',
                    'DatabaseEndpoint',
                    'SNSTopicArn'
                ]
                
                missing_outputs = []
                for output in required_outputs:
                    value = self._get_output_value(stack_prefix, output)
                    if not value:
                        missing_outputs.append(output)
                
                self.assertEqual(len(missing_outputs), 0,
                               f"Missing critical outputs in {region}: {missing_outputs}")


if __name__ == '__main__':
    unittest.main()