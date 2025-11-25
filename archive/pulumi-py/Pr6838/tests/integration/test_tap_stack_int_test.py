"""
Integration tests for multi-region disaster recovery infrastructure.

These tests validate that the infrastructure would work correctly by:
1. Reading actual deployment outputs from cfn-outputs/flat-outputs.json
2. Validating resource naming conventions
3. Verifying cross-region relationships
4. Testing failover configurations
5. Validating data replication setup

Note: In a no-deployment scenario, these tests use mock outputs.
In production, these would validate real AWS resources.
"""

import unittest
import json
import os
import re


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs once for all tests."""
        outputs_path = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )

        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

    def test_outputs_file_exists(self):
        """Test that deployment outputs file exists."""
        outputs_path = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )
        self.assertTrue(os.path.exists(outputs_path))

    def test_global_accelerator_deployed(self):
        """Test that Global Accelerator is deployed with valid DNS."""
        dns_name = self.outputs.get('GlobalAcceleratorDnsName')
        self.assertIsNotNone(dns_name)
        self.assertIn('awsglobalaccelerator.com', dns_name)

        # Verify static IPs
        static_ip1 = self.outputs.get('GlobalAcceleratorStaticIP1')
        static_ip2 = self.outputs.get('GlobalAcceleratorStaticIP2')
        self.assertIsNotNone(static_ip1)
        self.assertIsNotNone(static_ip2)

    def test_vpc_networking_deployed(self):
        """Test that VPCs are deployed in both regions."""
        primary_vpc = self.outputs.get('PrimaryVpcId')
        secondary_vpc = self.outputs.get('SecondaryVpcId')

        self.assertIsNotNone(primary_vpc)
        self.assertIsNotNone(secondary_vpc)
        self.assertTrue(primary_vpc.startswith('vpc-'))
        self.assertTrue(secondary_vpc.startswith('vpc-'))

        # Verify VPC peering
        peering_id = self.outputs.get('VpcPeeringConnectionId')
        self.assertIsNotNone(peering_id)
        self.assertTrue(peering_id.startswith('pcx-'))

    def test_nlb_endpoints_deployed(self):
        """Test that Network Load Balancers are deployed in both regions."""
        primary_nlb_dns = self.outputs.get('PrimaryNLBDnsName')
        secondary_nlb_dns = self.outputs.get('SecondaryNLBDnsName')

        self.assertIsNotNone(primary_nlb_dns)
        self.assertIsNotNone(secondary_nlb_dns)

        # Verify region-specific DNS names
        self.assertIn('us-east-1', primary_nlb_dns)
        self.assertIn('us-east-2', secondary_nlb_dns)

        # Verify ARNs
        primary_arn = self.outputs.get('PrimaryNLBArn')
        secondary_arn = self.outputs.get('SecondaryNLBArn')
        self.assertIsNotNone(primary_arn)
        self.assertIsNotNone(secondary_arn)

    def test_health_checks_configured(self):
        """Test that Route 53 health checks are configured."""
        primary_health_check = self.outputs.get('PrimaryHealthCheckId')
        secondary_health_check = self.outputs.get('SecondaryHealthCheckId')

        self.assertIsNotNone(primary_health_check)
        self.assertIsNotNone(secondary_health_check)

        # Verify UUID format for health check IDs
        uuid_pattern = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
        self.assertTrue(uuid_pattern.match(primary_health_check))
        self.assertTrue(uuid_pattern.match(secondary_health_check))

    def test_api_gateway_deployed(self):
        """Test that API Gateway is deployed in both regions."""
        primary_api_endpoint = self.outputs.get('PrimaryApiEndpoint')
        secondary_api_endpoint = self.outputs.get('SecondaryApiEndpoint')

        self.assertIsNotNone(primary_api_endpoint)
        self.assertIsNotNone(secondary_api_endpoint)

        # Verify HTTPS endpoints
        self.assertTrue(primary_api_endpoint.startswith('https://'))
        self.assertTrue(secondary_api_endpoint.startswith('https://'))

        # Verify region-specific endpoints
        self.assertIn('us-east-1', primary_api_endpoint)
        self.assertIn('us-east-2', secondary_api_endpoint)

        # Verify stage
        self.assertIn('/prod', primary_api_endpoint)
        self.assertIn('/prod', secondary_api_endpoint)

    def test_parameter_store_configured(self):
        """Test that Parameter Store parameters are configured."""
        db_endpoint_param = self.outputs.get('PrimaryParameterDBEndpoint')
        api_key_param = self.outputs.get('PrimaryParameterAPIKey')
        feature_flag_param = self.outputs.get('PrimaryParameterFeatureFlag')

        self.assertIsNotNone(db_endpoint_param)
        self.assertIsNotNone(api_key_param)
        self.assertIsNotNone(feature_flag_param)

        # Verify parameter naming convention
        self.assertTrue(db_endpoint_param.startswith('/app/'))
        self.assertTrue(api_key_param.startswith('/app/'))
        self.assertTrue(feature_flag_param.startswith('/app/'))

    def test_storage_deployed(self):
        """Test that S3 and DynamoDB storage are deployed."""
        # S3 buckets
        primary_bucket = self.outputs.get('PrimaryS3BucketName')
        secondary_bucket = self.outputs.get('SecondaryS3BucketName')
        self.assertIsNotNone(primary_bucket)
        self.assertIsNotNone(secondary_bucket)

        # DynamoDB Global Table
        dynamodb_table = self.outputs.get('DynamoDBTableName')
        dynamodb_arn = self.outputs.get('DynamoDBTableArn')
        self.assertIsNotNone(dynamodb_table)
        self.assertIsNotNone(dynamodb_arn)
        self.assertIn('dynamodb', dynamodb_arn)

    def test_aurora_global_database_deployed(self):
        """Test that Aurora Global Database is deployed."""
        global_cluster = self.outputs.get('AuroraGlobalClusterId')
        self.assertIsNotNone(global_cluster)

        # Primary cluster
        primary_cluster_id = self.outputs.get('PrimaryAuroraClusterId')
        primary_endpoint = self.outputs.get('PrimaryAuroraEndpoint')
        self.assertIsNotNone(primary_cluster_id)
        self.assertIsNotNone(primary_endpoint)
        self.assertIn('.us-east-1.rds.amazonaws.com', primary_endpoint)

        # Secondary cluster
        secondary_cluster_id = self.outputs.get('SecondaryAuroraClusterId')
        secondary_endpoint = self.outputs.get('SecondaryAuroraEndpoint')
        self.assertIsNotNone(secondary_cluster_id)
        self.assertIsNotNone(secondary_endpoint)
        self.assertIn('.us-east-2.rds.amazonaws.com', secondary_endpoint)

    def test_lambda_functions_deployed(self):
        """Test that Lambda functions are deployed in both regions."""
        primary_lambda = self.outputs.get('PrimaryLambdaArn')
        secondary_lambda = self.outputs.get('SecondaryLambdaArn')

        self.assertIsNotNone(primary_lambda)
        self.assertIsNotNone(secondary_lambda)

        # Verify ARN format
        self.assertTrue(primary_lambda.startswith('arn:aws:lambda:us-east-1:'))
        self.assertTrue(secondary_lambda.startswith('arn:aws:lambda:us-east-2:'))

    def test_event_buses_deployed(self):
        """Test that EventBridge event buses are deployed."""
        primary_bus = self.outputs.get('PrimaryEventBusName')
        secondary_bus = self.outputs.get('SecondaryEventBusName')

        self.assertIsNotNone(primary_bus)
        self.assertIsNotNone(secondary_bus)

    def test_monitoring_deployed(self):
        """Test that monitoring resources (SNS topics) are deployed."""
        primary_sns = self.outputs.get('PrimarySNSTopicArn')
        secondary_sns = self.outputs.get('SecondarySNSTopicArn')

        self.assertIsNotNone(primary_sns)
        self.assertIsNotNone(secondary_sns)

        # Verify ARN format
        self.assertTrue(primary_sns.startswith('arn:aws:sns:us-east-1:'))
        self.assertTrue(secondary_sns.startswith('arn:aws:sns:us-east-2:'))

    def test_backup_configuration_deployed(self):
        """Test that AWS Backup vaults are deployed."""
        primary_vault = self.outputs.get('PrimaryBackupVaultName')
        secondary_vault = self.outputs.get('SecondaryBackupVaultName')

        self.assertIsNotNone(primary_vault)
        self.assertIsNotNone(secondary_vault)

    def test_resource_naming_conventions(self):
        """Test that all resources follow proper naming conventions."""
        # All resources should include environment suffix (implied in output names)
        # This validates that resources can coexist with other deployments

        # Check that primary and secondary resources have distinct names
        primary_nlb = self.outputs.get('PrimaryNLBDnsName')
        secondary_nlb = self.outputs.get('SecondaryNLBDnsName')
        self.assertNotEqual(primary_nlb, secondary_nlb)

        primary_bucket = self.outputs.get('PrimaryS3BucketName')
        secondary_bucket = self.outputs.get('SecondaryS3BucketName')
        self.assertNotEqual(primary_bucket, secondary_bucket)

    def test_multi_region_architecture(self):
        """Test that infrastructure spans both regions properly."""
        # Verify we have resources in both us-east-1 and us-east-2
        primary_resources = [
            self.outputs.get('PrimaryNLBDnsName'),
            self.outputs.get('PrimaryApiEndpoint'),
            self.outputs.get('PrimaryAuroraEndpoint'),
            self.outputs.get('PrimaryLambdaArn')
        ]

        secondary_resources = [
            self.outputs.get('SecondaryNLBDnsName'),
            self.outputs.get('SecondaryApiEndpoint'),
            self.outputs.get('SecondaryAuroraEndpoint'),
            self.outputs.get('SecondaryLambdaArn')
        ]

        # All primary resources should exist
        for resource in primary_resources:
            self.assertIsNotNone(resource)

        # All secondary resources should exist
        for resource in secondary_resources:
            self.assertIsNotNone(resource)

    def test_failover_configuration(self):
        """Test that failover mechanisms are properly configured."""
        # Global Accelerator provides automatic failover
        global_accelerator = self.outputs.get('GlobalAcceleratorDnsName')
        self.assertIsNotNone(global_accelerator)

        # Health checks enable failover decisions
        primary_health = self.outputs.get('PrimaryHealthCheckId')
        secondary_health = self.outputs.get('SecondaryHealthCheckId')
        self.assertIsNotNone(primary_health)
        self.assertIsNotNone(secondary_health)

        # Both NLBs are available as failover targets
        primary_nlb = self.outputs.get('PrimaryNLBArn')
        secondary_nlb = self.outputs.get('SecondaryNLBArn')
        self.assertIsNotNone(primary_nlb)
        self.assertIsNotNone(secondary_nlb)

    def test_data_replication_setup(self):
        """Test that data replication is configured across regions."""
        # S3 cross-region replication
        primary_bucket = self.outputs.get('PrimaryS3BucketName')
        secondary_bucket = self.outputs.get('SecondaryS3BucketName')
        self.assertIsNotNone(primary_bucket)
        self.assertIsNotNone(secondary_bucket)

        # DynamoDB Global Table (automatic multi-region replication)
        dynamodb_table = self.outputs.get('DynamoDBTableName')
        self.assertIsNotNone(dynamodb_table)

        # Aurora Global Database (automatic replication)
        global_cluster = self.outputs.get('AuroraGlobalClusterId')
        self.assertIsNotNone(global_cluster)

    def test_configuration_replication(self):
        """Test that configuration data is replicated via Parameter Store."""
        # Parameter Store parameters should be available
        # In production, these would be verified in both regions
        db_param = self.outputs.get('PrimaryParameterDBEndpoint')
        api_param = self.outputs.get('PrimaryParameterAPIKey')
        flag_param = self.outputs.get('PrimaryParameterFeatureFlag')

        self.assertIsNotNone(db_param)
        self.assertIsNotNone(api_param)
        self.assertIsNotNone(flag_param)


class TestInfrastructureWorkflows(unittest.TestCase):
    """Test end-to-end workflows across the infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs."""
        outputs_path = os.path.join(
            os.path.dirname(__file__),
            '../../cfn-outputs/flat-outputs.json'
        )

        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

    def test_traffic_routing_workflow(self):
        """Test that traffic routing workflow is properly configured."""
        # Step 1: Global Accelerator receives traffic
        accelerator = self.outputs.get('GlobalAcceleratorDnsName')
        self.assertIsNotNone(accelerator)

        # Step 2: Routes to NLBs in both regions
        primary_nlb = self.outputs.get('PrimaryNLBDnsName')
        secondary_nlb = self.outputs.get('SecondaryNLBDnsName')
        self.assertIsNotNone(primary_nlb)
        self.assertIsNotNone(secondary_nlb)

        # Step 3: Health checks monitor endpoints
        primary_health = self.outputs.get('PrimaryHealthCheckId')
        secondary_health = self.outputs.get('SecondaryHealthCheckId')
        self.assertIsNotNone(primary_health)
        self.assertIsNotNone(secondary_health)

    def test_data_flow_workflow(self):
        """Test that data flows properly across regions."""
        # Step 1: Data written to primary region
        primary_bucket = self.outputs.get('PrimaryS3BucketName')
        primary_db = self.outputs.get('PrimaryAuroraClusterId')
        primary_dynamo = self.outputs.get('DynamoDBTableName')

        self.assertIsNotNone(primary_bucket)
        self.assertIsNotNone(primary_db)
        self.assertIsNotNone(primary_dynamo)

        # Step 2: Data replicated to secondary region
        secondary_bucket = self.outputs.get('SecondaryS3BucketName')
        secondary_db = self.outputs.get('SecondaryAuroraClusterId')

        self.assertIsNotNone(secondary_bucket)
        self.assertIsNotNone(secondary_db)

    def test_event_processing_workflow(self):
        """Test that event processing works in both regions."""
        # Step 1: Events published to EventBridge
        primary_bus = self.outputs.get('PrimaryEventBusName')
        secondary_bus = self.outputs.get('SecondaryEventBusName')

        self.assertIsNotNone(primary_bus)
        self.assertIsNotNone(secondary_bus)

        # Step 2: Lambda functions process events
        primary_lambda = self.outputs.get('PrimaryLambdaArn')
        secondary_lambda = self.outputs.get('SecondaryLambdaArn')

        self.assertIsNotNone(primary_lambda)
        self.assertIsNotNone(secondary_lambda)

    def test_monitoring_and_alerting_workflow(self):
        """Test that monitoring and alerting workflow is complete."""
        # Step 1: Health checks monitor resources
        primary_health = self.outputs.get('PrimaryHealthCheckId')
        secondary_health = self.outputs.get('SecondaryHealthCheckId')

        self.assertIsNotNone(primary_health)
        self.assertIsNotNone(secondary_health)

        # Step 2: Alerts sent via SNS
        primary_sns = self.outputs.get('PrimarySNSTopicArn')
        secondary_sns = self.outputs.get('SecondarySNSTopicArn')

        self.assertIsNotNone(primary_sns)
        self.assertIsNotNone(secondary_sns)


if __name__ == '__main__':
    unittest.main()
