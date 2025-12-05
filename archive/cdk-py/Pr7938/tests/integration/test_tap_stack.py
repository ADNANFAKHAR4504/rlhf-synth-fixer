"""Integration tests for deployed TapStack infrastructure"""
import json
import os
import unittest

import boto3


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


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for integration tests"""
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.kinesis_client = boto3.client('kinesis', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.elasticache_client = boto3.client('elasticache', region_name=cls.region)
        cls.efs_client = boto3.client('efs', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.secretsmanager_client = boto3.client('secretsmanager', region_name=cls.region)

    def test_kinesis_stream_exists(self):
        """Test that Kinesis stream exists and is active"""
        self.assertIn('KinesisStreamName', flat_outputs, "KinesisStreamName not in outputs")
        stream_name = flat_outputs['KinesisStreamName']

        response = self.kinesis_client.describe_stream(StreamName=stream_name)
        self.assertEqual(response['StreamDescription']['StreamStatus'], 'ACTIVE')
        self.assertEqual(response['StreamDescription']['ShardCount'], 10)
        self.assertEqual(response['StreamDescription']['RetentionPeriodHours'], 24)

    def test_ecs_cluster_exists(self):
        """Test that ECS cluster exists with correct configuration"""
        self.assertIn('EcsClusterName', flat_outputs, "EcsClusterName not in outputs")
        cluster_name = flat_outputs['EcsClusterName']

        response = self.ecs_client.describe_clusters(clusters=[cluster_name])
        self.assertEqual(len(response['clusters']), 1)
        self.assertEqual(response['clusters'][0]['status'], 'ACTIVE')
        self.assertEqual(response['clusters'][0]['clusterName'], cluster_name)

    def test_rds_instance_is_available(self):
        """Test that RDS instance is available and configured correctly"""
        self.assertIn('RdsEndpoint', flat_outputs, "RdsEndpoint not in outputs")
        rds_endpoint = flat_outputs['RdsEndpoint']

        # Extract instance identifier from endpoint
        instance_id = rds_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances()
        matching_instances = [
            db for db in response['DBInstances']
            if db['Endpoint']['Address'] == rds_endpoint
        ]

        self.assertEqual(len(matching_instances), 1)
        db_instance = matching_instances[0]
        self.assertEqual(db_instance['DBInstanceStatus'], 'available')
        self.assertTrue(db_instance['StorageEncrypted'])
        self.assertTrue(db_instance['MultiAZ'])
        self.assertEqual(db_instance['Engine'], 'postgres')

    def test_redis_cluster_is_available(self):
        """Test that ElastiCache Redis cluster is available"""
        self.assertIn('RedisEndpoint', flat_outputs, "RedisEndpoint not in outputs")
        redis_endpoint = flat_outputs['RedisEndpoint']

        # List replication groups and find matching one
        response = self.elasticache_client.describe_replication_groups()
        matching_groups = [
            rg for rg in response['ReplicationGroups']
            if rg.get('ConfigurationEndpoint', {}).get('Address') == redis_endpoint
        ]

        self.assertGreater(len(matching_groups), 0, "Redis cluster not found")
        redis_group = matching_groups[0]
        self.assertEqual(redis_group['Status'], 'available')
        self.assertTrue(redis_group['AtRestEncryptionEnabled'])
        self.assertTrue(redis_group['TransitEncryptionEnabled'])
        self.assertTrue(redis_group['AutomaticFailover'] in ['enabled', 'enabling'])

    def test_efs_file_system_exists(self):
        """Test that EFS file system exists and is available"""
        self.assertIn('EfsId', flat_outputs, "EfsId not in outputs")
        file_system_id = flat_outputs['EfsId']

        response = self.efs_client.describe_file_systems(FileSystemId=file_system_id)
        self.assertEqual(len(response['FileSystems']), 1)
        file_system = response['FileSystems'][0]
        self.assertEqual(file_system['LifeCycleState'], 'available')
        self.assertTrue(file_system['Encrypted'])
        self.assertEqual(file_system['PerformanceMode'], 'generalPurpose')

    def test_api_gateway_exists(self):
        """Test that API Gateway exists and is configured"""
        self.assertIn('ApiEndpoint', flat_outputs, "ApiEndpoint not in outputs")
        api_endpoint = flat_outputs['ApiEndpoint']

        # Extract API ID from endpoint URL
        # Format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/
        api_id = api_endpoint.split('//')[1].split('.')[0]

        response = self.apigateway_client.get_rest_api(restApiId=api_id)
        self.assertIsNotNone(response['id'])
        self.assertIn('iot-sensor-api', response['name'])

    def test_ecs_service_is_running(self):
        """Test that ECS service is running with correct task count"""
        self.assertIn('EcsClusterName', flat_outputs, "EcsClusterName not in outputs")
        cluster_name = flat_outputs['EcsClusterName']

        # List services in cluster
        services_response = self.ecs_client.list_services(cluster=cluster_name)
        self.assertGreater(len(services_response['serviceArns']), 0, "No ECS services found")

        # Describe services
        service_arns = services_response['serviceArns']
        response = self.ecs_client.describe_services(
            cluster=cluster_name,
            services=service_arns
        )

        self.assertEqual(len(response['services']), 1)
        service = response['services'][0]
        self.assertEqual(service['status'], 'ACTIVE')
        self.assertEqual(service['desiredCount'], 2)

    def test_secrets_manager_secret_exists(self):
        """Test that Secrets Manager secret exists for DB credentials"""
        # List secrets and find the one for this environment
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        secret_name = f"iot-db-credentials-{env_suffix}"

        response = self.secretsmanager_client.describe_secret(SecretId=secret_name)
        self.assertEqual(response['Name'], secret_name)
        self.assertIsNotNone(response['ARN'])
        self.assertTrue(response['RotationEnabled'])

    def test_kinesis_stream_accepts_records(self):
        """Test that we can write records to Kinesis stream"""
        self.assertIn('KinesisStreamName', flat_outputs, "KinesisStreamName not in outputs")
        stream_name = flat_outputs['KinesisStreamName']

        test_data = json.dumps({
            'sensorId': 'test-sensor-001',
            'timestamp': '2025-12-04T00:00:00Z',
            'temperature': 25.5,
            'humidity': 60.0
        })

        response = self.kinesis_client.put_record(
            StreamName=stream_name,
            Data=test_data,
            PartitionKey='test-sensor-001'
        )

        self.assertIsNotNone(response['SequenceNumber'])
        self.assertIsNotNone(response['ShardId'])

    def test_ecs_task_definition_has_correct_resources(self):
        """Test that ECS task definition has correct resource allocation"""
        self.assertIn('EcsClusterName', flat_outputs, "EcsClusterName not in outputs")
        cluster_name = flat_outputs['EcsClusterName']

        # List services and get task definition
        services_response = self.ecs_client.list_services(cluster=cluster_name)
        service_arns = services_response['serviceArns']

        services = self.ecs_client.describe_services(
            cluster=cluster_name,
            services=service_arns
        )

        task_definition_arn = services['services'][0]['taskDefinition']

        # Describe task definition
        response = self.ecs_client.describe_task_definition(
            taskDefinition=task_definition_arn
        )

        task_def = response['taskDefinition']
        self.assertEqual(task_def['cpu'], '1024')
        self.assertEqual(task_def['memory'], '2048')
        self.assertEqual(task_def['networkMode'], 'awsvpc')
        self.assertIn('FARGATE', task_def['requiresCompatibilities'])

    def test_api_gateway_has_sensors_resource(self):
        """Test that API Gateway has the /sensors resource"""
        self.assertIn('ApiEndpoint', flat_outputs, "ApiEndpoint not in outputs")
        api_endpoint = flat_outputs['ApiEndpoint']

        # Extract API ID from endpoint URL
        api_id = api_endpoint.split('//')[1].split('.')[0]

        # Get resources
        response = self.apigateway_client.get_resources(restApiId=api_id)

        sensor_resources = [
            r for r in response['items']
            if r.get('pathPart') == 'sensors'
        ]

        self.assertEqual(len(sensor_resources), 1, "sensors resource not found")

    def test_all_required_outputs_present(self):
        """Test that all required CloudFormation outputs are present"""
        required_outputs = [
            'KinesisStreamName',
            'EcsClusterName',
            'RdsEndpoint',
            'RedisEndpoint',
            'EfsId',
            'ApiEndpoint'
        ]

        for output in required_outputs:
            self.assertIn(output, flat_outputs, f"{output} not in deployment outputs")
            self.assertIsNotNone(flat_outputs[output], f"{output} is None")
            self.assertNotEqual(flat_outputs[output], '', f"{output} is empty")


if __name__ == "__main__":
    unittest.main()
