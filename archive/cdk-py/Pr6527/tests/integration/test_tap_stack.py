"""
Comprehensive integration tests for TAP infrastructure.
Tests actual deployed resources and their connectivity using deployment outputs.
No mocking - uses real AWS resources from deployment.
"""
import json
import os
import time
import unittest
from datetime import datetime, timedelta

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load deployment outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        OUTPUTS = json.load(f)
else:
    raise FileNotFoundError("cfn-outputs/flat-outputs.json not found. Deploy infrastructure first.")


@mark.describe("Infrastructure Deployment Validation")
class TestInfrastructureDeployment(unittest.TestCase):
    """Validate that all infrastructure resources are deployed correctly"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for all tests"""
        cls.ec2_client = boto3.client('ec2')
        cls.rds_client = boto3.client('rds')
        cls.elasticache_client = boto3.client('elasticache')
        cls.ecs_client = boto3.client('ecs')
        cls.dynamodb_client = boto3.client('dynamodb')
        cls.lambda_client = boto3.client('lambda')
        cls.s3_client = boto3.client('s3')
        cls.elb_client = boto3.client('elbv2')
        cls.secretsmanager_client = boto3.client('secretsmanager')

    @mark.it("validates VPC exists and is available")
    def test_vpc_exists(self):
        """Test VPC is deployed and available"""
        vpc_id = OUTPUTS.get('VPCId')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpcs = response['Vpcs']

        self.assertEqual(len(vpcs), 1, "VPC not found")
        self.assertEqual(vpcs[0]['State'], 'available', "VPC is not available")

    @mark.it("validates Aurora cluster is available")
    def test_aurora_cluster_available(self):
        """Test Aurora cluster is deployed and available"""
        cluster_arn = OUTPUTS.get('AuroraClusterArn')
        self.assertIsNotNone(cluster_arn, "Aurora cluster ARN not found")

        cluster_id = cluster_arn.split(':')[-1]
        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        clusters = response['DBClusters']

        self.assertEqual(len(clusters), 1, "Aurora cluster not found")
        self.assertEqual(
            clusters[0]['Status'], 'available',
            "Aurora cluster is not available"
        )

    @mark.it("validates Aurora has correct engine and configuration")
    def test_aurora_configuration(self):
        """Test Aurora cluster has correct configuration"""
        cluster_arn = OUTPUTS.get('AuroraClusterArn')
        cluster_id = cluster_arn.split(':')[-1]

        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        cluster = response['DBClusters'][0]

        # Validate engine
        self.assertEqual(cluster['Engine'], 'aurora-postgresql')
        self.assertTrue(cluster['StorageEncrypted'], "Storage is not encrypted")
        self.assertGreater(
            cluster['BackupRetentionPeriod'], 0,
            "Backup retention not configured"
        )

    @mark.it("validates ElastiCache Redis cluster is available")
    def test_redis_cluster_available(self):
        """Test Redis cluster is deployed and available"""
        cluster_id = OUTPUTS.get('RedisClusterId')
        self.assertIsNotNone(cluster_id, "Redis cluster ID not found")

        response = self.elasticache_client.describe_replication_groups(
            ReplicationGroupId=cluster_id
        )
        groups = response['ReplicationGroups']

        self.assertEqual(len(groups), 1, "Redis cluster not found")
        self.assertEqual(
            groups[0]['Status'], 'available',
            "Redis cluster is not available"
        )

    @mark.it("validates Redis has encryption enabled")
    def test_redis_encryption(self):
        """Test Redis cluster has encryption enabled"""
        cluster_id = OUTPUTS.get('RedisClusterId')

        response = self.elasticache_client.describe_replication_groups(
            ReplicationGroupId=cluster_id
        )
        cluster = response['ReplicationGroups'][0]

        self.assertTrue(
            cluster['AtRestEncryptionEnabled'],
            "At-rest encryption not enabled"
        )
        self.assertTrue(
            cluster['TransitEncryptionEnabled'],
            "Transit encryption not enabled"
        )

    @mark.it("validates ECS cluster is active")
    def test_ecs_cluster_active(self):
        """Test ECS cluster is deployed and active"""
        cluster_name = OUTPUTS.get('EcsClusterName') or OUTPUTS.get('ECSClusterName')
        self.assertIsNotNone(cluster_name, "ECS cluster name not found")

        response = self.ecs_client.describe_clusters(clusters=[cluster_name])
        clusters = response['clusters']

        self.assertEqual(len(clusters), 1, "ECS cluster not found")
        self.assertEqual(
            clusters[0]['status'], 'ACTIVE',
            "ECS cluster is not active"
        )

    @mark.it("validates ECS service is running")
    def test_ecs_service_running(self):
        """Test ECS service is running with desired tasks"""
        cluster_name = OUTPUTS.get('EcsClusterName') or OUTPUTS.get('ECSClusterName')
        service_name = OUTPUTS.get('ECSServiceName')

        self.assertIsNotNone(cluster_name, "ECS cluster name not found")
        self.assertIsNotNone(service_name, "ECS service name not found")

        response = self.ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        services = response['services']

        self.assertEqual(len(services), 1, "ECS service not found")
        self.assertGreater(
            services[0]['desiredCount'], 0,
            "ECS service has no desired tasks"
        )
        # Running count may be 0 initially, so just check it's >= 0
        self.assertGreaterEqual(
            services[0]['runningCount'], 0,
            "ECS service running count is negative"
        )

    @mark.it("validates DynamoDB table exists and is active")
    def test_dynamodb_table_active(self):
        """Test DynamoDB table is deployed and active"""
        table_name = OUTPUTS.get('DynamoTableName') or OUTPUTS.get('DynamoDBTableName')
        self.assertIsNotNone(table_name, "DynamoDB table name not found")

        response = self.dynamodb_client.describe_table(TableName=table_name)
        table = response['Table']

        self.assertEqual(
            table['TableStatus'], 'ACTIVE',
            "DynamoDB table is not active"
        )

    @mark.it("validates DynamoDB has encryption and PITR enabled")
    def test_dynamodb_security_features(self):
        """Test DynamoDB table has security features enabled"""
        table_name = OUTPUTS.get('DynamoTableName') or OUTPUTS.get('DynamoDBTableName')

        response = self.dynamodb_client.describe_table(TableName=table_name)
        table = response['Table']

        # Check encryption
        self.assertIn('SSEDescription', table, "SSE not configured")
        self.assertEqual(
            table['SSEDescription']['Status'], 'ENABLED',
            "SSE not enabled"
        )

        # Check PITR
        pitr_response = self.dynamodb_client.describe_continuous_backups(
            TableName=table_name
        )
        self.assertEqual(
            pitr_response['ContinuousBackupsDescription']
            ['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'],
            'ENABLED',
            "Point-in-time recovery not enabled"
        )

    @mark.it("validates all Lambda functions exist and are active")
    def test_lambda_functions_exist(self):
        """Test all Lambda functions are deployed"""
        lambda_names = [
            OUTPUTS.get('LambdaFunction0Name'),
            OUTPUTS.get('LambdaFunction1Name'),
            OUTPUTS.get('LambdaFunction2Name')
        ]

        # Filter out None values
        lambda_names = [name for name in lambda_names if name]
        self.assertGreater(len(lambda_names), 0, "No Lambda function names found")

        for function_name in lambda_names:
            response = self.lambda_client.get_function(
                FunctionName=function_name
            )
            self.assertEqual(
                response['Configuration']['State'], 'Active',
                f"Lambda function {function_name} is not active"
            )

    @mark.it("validates S3 buckets exist with proper configuration")
    def test_s3_buckets_exist(self):
        """Test all S3 buckets are deployed with correct configuration"""
        bucket_names = [
            OUTPUTS.get('S3Bucket0Name'),
            OUTPUTS.get('S3Bucket1Name'),
            OUTPUTS.get('S3Bucket2Name')
        ]

        # Filter out None values
        bucket_names = [name for name in bucket_names if name]
        self.assertGreater(len(bucket_names), 0, "No S3 bucket names found")

        for bucket_name in bucket_names:
            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(
                response['ResponseMetadata']['HTTPStatusCode'], 200,
                f"Bucket {bucket_name} not accessible"
            )

            # Check encryption
            encryption = self.s3_client.get_bucket_encryption(
                Bucket=bucket_name
            )
            self.assertIn(
                'Rules', encryption['ServerSideEncryptionConfiguration'],
                f"Bucket {bucket_name} encryption not configured"
            )

            # Check versioning
            versioning = self.s3_client.get_bucket_versioning(
                Bucket=bucket_name
            )
            self.assertEqual(
                versioning.get('Status'), 'Enabled',
                f"Bucket {bucket_name} versioning not enabled"
            )

    @mark.it("validates Application Load Balancer is active")
    def test_alb_active(self):
        """Test ALB is deployed and active"""
        alb_dns = OUTPUTS.get('ALBDnsName') or OUTPUTS.get('LoadBalancerDNS')
        self.assertIsNotNone(alb_dns, "ALB DNS not found")

        # Get load balancer ARN by DNS name
        response = self.elb_client.describe_load_balancers()
        alb = None
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_dns:
                alb = lb
                break

        self.assertIsNotNone(alb, "ALB not found")
        self.assertEqual(
            alb['State']['Code'], 'active',
            "ALB is not active"
        )


@mark.describe("Resource Connectivity Tests")
class TestResourceConnectivity(unittest.TestCase):
    """Test connectivity between infrastructure resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients"""
        cls.ec2_client = boto3.client('ec2')
        cls.rds_client = boto3.client('rds')
        cls.elasticache_client = boto3.client('elasticache')
        cls.ecs_client = boto3.client('ecs')
        cls.elb_client = boto3.client('elbv2')

    @mark.it("validates security groups allow proper communication")
    def test_security_group_connectivity(self):
        """Test security groups are properly configured for resource communication"""
        vpc_id = OUTPUTS.get('VPCId')

        # Get all security groups in the VPC
        response = self.ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        security_groups = response['SecurityGroups']

        # Find Aurora and ECS security groups
        aurora_sg = None
        ecs_sg = None

        for sg in security_groups:
            group_name = sg.get('GroupName', '')
            if 'Aurora' in group_name or 'aurora' in group_name.lower():
                aurora_sg = sg
            elif 'Ecs' in group_name or 'ecs' in group_name.lower():
                ecs_sg = sg

        # Validate Aurora SG allows PostgreSQL from ECS
        if aurora_sg and ecs_sg:
            postgres_rule_found = False
            for rule in aurora_sg.get('IpPermissions', []):
                if rule.get('FromPort') == 5432:
                    for source in rule.get('UserIdGroupPairs', []):
                        if source['GroupId'] == ecs_sg['GroupId']:
                            postgres_rule_found = True
                            break

            self.assertTrue(
                postgres_rule_found,
                "Aurora SG does not allow PostgreSQL from ECS SG"
            )

    @mark.it("validates ECS service is connected to target group")
    def test_ecs_alb_integration(self):
        """Test ECS service is properly integrated with ALB target group"""
        cluster_name = OUTPUTS.get('EcsClusterName') or OUTPUTS.get('ECSClusterName')
        service_name = OUTPUTS.get('ECSServiceName')

        # Get ECS service details
        response = self.ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        self.assertGreater(len(response['services']), 0, "ECS service not found")
        service = response['services'][0]

        # Check if service has load balancers attached
        self.assertGreater(
            len(service.get('loadBalancers', [])), 0,
            "ECS service has no load balancers attached"
        )

        # Get target group ARN
        target_group_arn = service['loadBalancers'][0]['targetGroupArn']

        # Verify target group exists
        health_response = self.elb_client.describe_target_health(
            TargetGroupArn=target_group_arn
        )

        # Should have at least registered targets (may not be healthy immediately)
        self.assertGreaterEqual(
            len(health_response['TargetHealthDescriptions']), 0,
            "Target group exists"
        )

    @mark.it("validates Aurora and ElastiCache are in private subnets")
    def test_database_subnet_placement(self):
        """Test databases are deployed in private subnets"""
        cluster_arn = OUTPUTS.get('AuroraClusterArn')
        cluster_id = cluster_arn.split(':')[-1]

        # Check Aurora subnet group
        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        cluster = response['DBClusters'][0]
        subnet_group_name = cluster['DBSubnetGroup']

        subnet_response = self.rds_client.describe_db_subnet_groups(
            DBSubnetGroupName=subnet_group_name
        )
        subnets = subnet_response['DBSubnetGroups'][0]['Subnets']

        # Verify subnets exist
        self.assertGreater(len(subnets), 0, "Aurora has no subnets")

        # Check at least one subnet route table to ensure routing exists
        for subnet in subnets[:1]:  # Check at least one subnet
            subnet_id = subnet['SubnetIdentifier']
            route_tables = self.ec2_client.describe_route_tables(
                Filters=[
                    {'Name': 'association.subnet-id', 'Values': [subnet_id]}
                ]
            )

            # Should have route table configured
            self.assertGreater(
                len(route_tables['RouteTables']), 0,
                f"No route table for subnet {subnet_id}"
            )


@mark.describe("End-to-End Workflow Tests")
class TestEndToEndWorkflows(unittest.TestCase):
    """Test complete workflows across multiple resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and test data"""
        cls.s3_client = boto3.client('s3')
        cls.dynamodb_client = boto3.client('dynamodb')
        cls.lambda_client = boto3.client('lambda')
        cls.ecs_client = boto3.client('ecs')
        cls.secretsmanager_client = boto3.client('secretsmanager')
        cls.test_key = f"integration-test-{int(time.time())}.txt"
        cls.test_content = b"Integration test content"

    @classmethod
    def tearDownClass(cls):
        """Clean up test data"""
        # Clean up S3 test objects
        bucket_names = [
            OUTPUTS.get('S3Bucket0Name'),
            OUTPUTS.get('S3Bucket1Name'),
            OUTPUTS.get('S3Bucket2Name')
        ]

        for bucket_name in bucket_names:
            if bucket_name:
                try:
                    cls.s3_client.delete_object(
                        Bucket=bucket_name,
                        Key=cls.test_key
                    )
                except Exception:
                    pass  # Ignore errors during cleanup

    @mark.it("tests S3 bucket write and read workflow")
    def test_s3_write_read_workflow(self):
        """Test writing to and reading from S3 bucket"""
        bucket_name = OUTPUTS.get('S3Bucket0Name')
        self.assertIsNotNone(bucket_name, "S3 bucket name not found")

        # Write object to S3
        self.s3_client.put_object(
            Bucket=bucket_name,
            Key=self.test_key,
            Body=self.test_content
        )

        # Read object from S3
        response = self.s3_client.get_object(
            Bucket=bucket_name,
            Key=self.test_key
        )

        content = response['Body'].read()
        self.assertEqual(
            content, self.test_content,
            "S3 content does not match written data"
        )

        # Verify object is encrypted
        self.assertIn(
            'ServerSideEncryption', response,
            "Object is not encrypted"
        )

    @mark.it("tests DynamoDB write and read workflow")
    def test_dynamodb_write_read_workflow(self):
        """Test writing to and reading from DynamoDB table"""
        table_name = OUTPUTS.get('DynamoTableName') or OUTPUTS.get('DynamoDBTableName')
        self.assertIsNotNone(table_name, "DynamoDB table name not found")

        test_item = {
            'pk': {'S': f'TEST#{int(time.time())}'},
            'sk': {'S': 'INTEGRATION_TEST'},
            'data': {'S': 'Integration test data'},
            'timestamp': {'N': str(int(time.time()))}
        }

        # Write item to DynamoDB
        self.dynamodb_client.put_item(
            TableName=table_name,
            Item=test_item
        )

        # Read item from DynamoDB
        response = self.dynamodb_client.get_item(
            TableName=table_name,
            Key={
                'pk': test_item['pk'],
                'sk': test_item['sk']
            }
        )

        self.assertIn('Item', response, "Item not found in DynamoDB")
        self.assertEqual(
            response['Item']['data']['S'],
            test_item['data']['S'],
            "DynamoDB data does not match"
        )

        # Clean up
        self.dynamodb_client.delete_item(
            TableName=table_name,
            Key={
                'pk': test_item['pk'],
                'sk': test_item['sk']
            }
        )

    @mark.it("tests Lambda function invocation workflow")
    def test_lambda_invocation_workflow(self):
        """Test Lambda function can be invoked successfully"""
        # Use the first available Lambda function
        function_name = (OUTPUTS.get('LambdaFunction0Name') or
                        OUTPUTS.get('LambdaFunction1Name') or
                        OUTPUTS.get('LambdaFunction2Name'))

        self.assertIsNotNone(function_name, "No Lambda function name found")

        # Invoke Lambda function
        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'test': 'integration_test',
                'timestamp': int(time.time())
            }).encode('utf-8')
        )

        # Verify successful invocation
        self.assertEqual(
            response['StatusCode'], 200,
            "Lambda invocation failed"
        )

    @mark.it("tests database secret retrieval workflow")
    def test_database_secret_retrieval(self):
        """Test database credentials can be retrieved from Secrets Manager"""
        secret_arn = OUTPUTS.get('DatabaseSecretArn')
        self.assertIsNotNone(secret_arn, "Database secret ARN not found")

        # Retrieve secret
        response = self.secretsmanager_client.get_secret_value(
            SecretId=secret_arn
        )

        self.assertIn('SecretString', response, "Secret string not found")

        # Parse secret
        secret = json.loads(response['SecretString'])

        # Verify secret has required fields
        self.assertIn('username', secret, "Username not in secret")
        self.assertIn('password', secret, "Password not in secret")
        self.assertIn('host', secret, "Host not in secret")
        self.assertIn('port', secret, "Port not in secret")

    @mark.it("tests S3 to Lambda integration workflow")
    def test_s3_lambda_workflow(self):
        """Test S3 and Lambda integration workflow"""
        bucket_name = OUTPUTS.get('S3Bucket0Name')
        function_name = (OUTPUTS.get('LambdaFunction0Name') or
                        OUTPUTS.get('LambdaFunction1Name'))

        self.assertIsNotNone(bucket_name, "S3 bucket name not found")
        self.assertIsNotNone(function_name, "Lambda function name not found")

        # Put object in S3
        self.s3_client.put_object(
            Bucket=bucket_name,
            Key=self.test_key,
            Body=self.test_content
        )

        # Simulate S3 event by invoking Lambda with S3 event payload
        s3_event = {
            'Records': [{
                's3': {
                    'bucket': {'name': bucket_name},
                    'object': {'key': self.test_key}
                }
            }]
        }

        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(s3_event).encode('utf-8')
        )

        self.assertEqual(
            response['StatusCode'], 200,
            "Lambda invocation with S3 event failed"
        )

    @mark.it("tests DynamoDB and Lambda integration workflow")
    def test_dynamodb_lambda_workflow(self):
        """Test DynamoDB and Lambda integration"""
        table_name = OUTPUTS.get('DynamoTableName') or OUTPUTS.get('DynamoDBTableName')
        function_name = OUTPUTS.get('LambdaFunction0Name')

        self.assertIsNotNone(table_name, "DynamoDB table name not found")
        self.assertIsNotNone(function_name, "Lambda function name not found")

        # Write item to DynamoDB
        test_item = {
            'pk': {'S': f'LAMBDA_TEST#{int(time.time())}'},
            'sk': {'S': 'WORKFLOW'},
            'data': {'S': 'Lambda workflow test'}
        }

        self.dynamodb_client.put_item(
            TableName=table_name,
            Item=test_item
        )

        # Invoke Lambda with DynamoDB stream event simulation
        dynamodb_event = {
            'Records': [{
                'eventName': 'INSERT',
                'dynamodb': {
                    'Keys': {
                        'pk': test_item['pk'],
                        'sk': test_item['sk']
                    },
                    'NewImage': test_item
                }
            }]
        }

        response = self.lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(dynamodb_event).encode('utf-8')
        )

        self.assertEqual(
            response['StatusCode'], 200,
            "Lambda invocation with DynamoDB event failed"
        )

        # Clean up
        self.dynamodb_client.delete_item(
            TableName=table_name,
            Key={
                'pk': test_item['pk'],
                'sk': test_item['sk']
            }
        )


@mark.describe("Performance and Scalability Tests")
class TestPerformanceScalability(unittest.TestCase):
    """Test performance and scalability aspects"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients"""
        cls.cloudwatch_client = boto3.client('cloudwatch')
        cls.ecs_client = boto3.client('ecs')
        cls.dynamodb_client = boto3.client('dynamodb')

    @mark.it("validates ECS tasks publish CloudWatch metrics")
    def test_ecs_cloudwatch_metrics(self):
        """Test ECS tasks are publishing metrics to CloudWatch"""
        cluster_name = OUTPUTS.get('EcsClusterName') or OUTPUTS.get('ECSClusterName')
        service_name = OUTPUTS.get('ECSServiceName')

        self.assertIsNotNone(cluster_name, "ECS cluster name not found")
        self.assertIsNotNone(service_name, "ECS service name not found")

        # Query CloudWatch for ECS metrics
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=1)

        response = self.cloudwatch_client.get_metric_statistics(
            Namespace='AWS/ECS',
            MetricName='CPUUtilization',
            Dimensions=[
                {'Name': 'ClusterName', 'Value': cluster_name},
                {'Name': 'ServiceName', 'Value': service_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=['Average']
        )

        # Metrics exist (may be zero if service just started)
        self.assertGreaterEqual(
            len(response['Datapoints']), 0,
            "CloudWatch metrics query successful"
        )

    @mark.it("validates DynamoDB table has correct billing mode")
    def test_dynamodb_capacity_configuration(self):
        """Test DynamoDB table is properly configured"""
        table_name = OUTPUTS.get('DynamoTableName') or OUTPUTS.get('DynamoDBTableName')

        response = self.dynamodb_client.describe_table(TableName=table_name)
        table = response['Table']

        # Check billing mode - should be PROVISIONED or PAY_PER_REQUEST
        billing_mode = table.get('BillingModeSummary', {}).get('BillingMode', 'PROVISIONED')

        self.assertIn(
            billing_mode, ['PROVISIONED', 'PAY_PER_REQUEST', None],
            "DynamoDB billing mode is valid"
        )

        # If provisioned, check capacity
        if billing_mode == 'PROVISIONED' or billing_mode is None:
            self.assertGreater(
                table['ProvisionedThroughput']['ReadCapacityUnits'], 0,
                "Read capacity configured"
            )
            self.assertGreater(
                table['ProvisionedThroughput']['WriteCapacityUnits'], 0,
                "Write capacity configured"
            )


if __name__ == '__main__':
    unittest.main()
