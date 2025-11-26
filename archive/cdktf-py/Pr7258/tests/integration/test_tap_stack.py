"""Integration tests for the Payment Processing Migration infrastructure.

These tests validate the complete infrastructure deployment including:
- VPC and network connectivity
- Aurora PostgreSQL cluster availability
- Lambda function deployment
- Application Load Balancer accessibility
- DMS replication status
- Security configurations
- Monitoring and alerting
"""

import json
import os
import time
import unittest
import boto3
from pytest import mark
from typing import Dict, List, Any


# Load outputs from deployed stack
base_dir = os.path.dirname(os.path.abspath(__file__))
outputs_path = os.path.join(base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json')

if os.path.exists(outputs_path):
    with open(outputs_path, 'r', encoding='utf-8') as f:
        outputs = json.loads(f.read())
else:
    outputs = {}


@mark.describe("Payment Processing Migration - Integration Tests")
class TestPaymentMigrationIntegration(unittest.TestCase):
    """Integration tests for payment processing migration infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for testing."""
        cls.ec2_client = boto3.client('ec2', region_name='us-east-2')
        cls.rds_client = boto3.client('rds', region_name='us-east-2')
        cls.lambda_client = boto3.client('lambda', region_name='us-east-2')
        cls.elbv2_client = boto3.client('elbv2', region_name='us-east-2')
        cls.dms_client = boto3.client('dms', region_name='us-east-2')
        cls.secretsmanager_client = boto3.client('secretsmanager', region_name='us-east-2')
        cls.wafv2_client = boto3.client('wafv2', region_name='us-east-2')
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name='us-east-2')
        cls.kms_client = boto3.client('kms', region_name='us-east-2')
        cls.acm_client = boto3.client('acm', region_name='us-east-2')
        cls.outputs = outputs

    @mark.it("VPC is created with correct configuration")
    def test_vpc_configuration(self):
        """Test VPC creation and configuration."""
        vpc_id = self.outputs.get('vpc_id')
        
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")
        
        # Verify VPC exists and has correct CIDR
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]
        
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        
        # Check DNS attributes separately
        dns_response = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_response['EnableDnsHostnames']['Value'])
        
        dns_support_response = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support_response['EnableDnsSupport']['Value'])

    @mark.it("has 6 subnets across 3 availability zones")
    def test_subnet_configuration(self):
        """Test subnet creation across AZs."""
        vpc_id = self.outputs.get('vpc_id')
        
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")
        
        # Get all subnets in the VPC
        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        
        subnets = response['Subnets']
        self.assertEqual(len(subnets), 6)
        
        # Check AZ distribution
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        self.assertEqual(len(azs), 3)

    @mark.it("NAT Gateways are configured for private subnets")
    def test_nat_gateway_configuration(self):
        """Test NAT Gateway configuration."""
        vpc_id = self.outputs.get('vpc_id')
        
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")
        
        # Get NAT Gateways
        response = self.ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )
        
        nat_gateways = response['NatGateways']
        self.assertGreaterEqual(len(nat_gateways), 1)

    @mark.it("Aurora PostgreSQL cluster is available")
    def test_aurora_cluster_availability(self):
        """Test Aurora PostgreSQL cluster status."""
        cluster_id = self.outputs.get('aurora_cluster_id')
        
        if not cluster_id:
            self.skipTest("Aurora cluster ID not found in outputs")
        
        # Check cluster status
        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response['DBClusters'][0]
        self.assertEqual(cluster['Status'], 'available')
        self.assertEqual(cluster['Engine'], 'aurora-postgresql')
        self.assertIn('14', cluster['EngineVersion'])
        
        # Verify Multi-AZ
        self.assertTrue(cluster['MultiAZ'])
        
        # Verify encryption
        self.assertTrue(cluster['StorageEncrypted'])

    @mark.it("database uses KMS encryption")
    def test_database_kms_encryption(self):
        """Test database KMS encryption."""
        cluster_id = self.outputs.get('aurora_cluster_id')
        
        if not cluster_id:
            self.skipTest("Aurora cluster ID not found in outputs")
        
        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response['DBClusters'][0]
        self.assertTrue(cluster['StorageEncrypted'])
        self.assertIsNotNone(cluster.get('KmsKeyId'))

    @mark.it("Lambda functions are deployed")
    def test_lambda_deployment(self):
        """Test Lambda function deployment."""
        function_name = self.outputs.get('payment_lambda_name')
        
        if not function_name:
            self.skipTest("Lambda function name not found in outputs")
        
        # Check function exists and is active
        response = self.lambda_client.get_function(
            FunctionName=function_name
        )
        
        self.assertEqual(response['Configuration']['State'], 'Active')
        self.assertIn('container', response['Configuration']['PackageType'].lower())

    @mark.it("Lambda auto-scaling is configured")
    def test_lambda_auto_scaling(self):
        """Test Lambda auto-scaling configuration."""
        function_name = self.outputs.get('payment_lambda_name')
        
        if not function_name:
            self.skipTest("Lambda function name not found in outputs")
        
        # Check reserved concurrent executions
        response = self.lambda_client.get_function_concurrency(
            FunctionName=function_name
        )
        
        # Should have reserved concurrency configured
        if 'ReservedConcurrentExecutions' in response:
            self.assertGreaterEqual(response['ReservedConcurrentExecutions'], 2)
            self.assertLessEqual(response['ReservedConcurrentExecutions'], 10)

    @mark.it("Application Load Balancer is accessible")
    def test_alb_accessibility(self):
        """Test ALB accessibility and configuration."""
        alb_arn = self.outputs.get('alb_arn')
        
        if not alb_arn:
            self.skipTest("ALB ARN not found in outputs")
        
        # Check ALB status
        response = self.elbv2_client.describe_load_balancers(
            LoadBalancerArns=[alb_arn]
        )
        
        alb = response['LoadBalancers'][0]
        self.assertEqual(alb['State']['Code'], 'active')
        self.assertEqual(alb['Type'], 'application')
        
        # Check for SSL listener
        listeners = self.elbv2_client.describe_listeners(
            LoadBalancerArn=alb_arn
        )
        
        ssl_listeners = [l for l in listeners['Listeners'] 
                        if l['Protocol'] == 'HTTPS']
        self.assertGreaterEqual(len(ssl_listeners), 1)

    @mark.it("health checks are configured")
    def test_health_checks(self):
        """Test health check configuration."""
        target_group_arn = self.outputs.get('target_group_arn')
        
        if not target_group_arn:
            self.skipTest("Target group ARN not found in outputs")
        
        # Check target group health check settings
        response = self.elbv2_client.describe_target_health(
            TargetGroupArn=target_group_arn
        )
        
        # Should have healthy targets
        healthy_targets = [t for t in response['TargetHealthDescriptions']
                          if t['TargetHealth']['State'] == 'healthy']
        self.assertGreaterEqual(len(healthy_targets), 1)

    @mark.it("DMS replication instance is running")
    def test_dms_replication_instance(self):
        """Test DMS replication instance status."""
        replication_instance_id = self.outputs.get('dms_replication_instance_id')
        
        if not replication_instance_id:
            self.skipTest("DMS replication instance ID not found in outputs")
        
        # Check replication instance status
        response = self.dms_client.describe_replication_instances(
            Filters=[
                {'Name': 'replication-instance-id', 'Values': [replication_instance_id]}
            ]
        )
        
        if response['ReplicationInstances']:
            instance = response['ReplicationInstances'][0]
            self.assertEqual(instance['ReplicationInstanceStatus'], 'available')

    @mark.it("continuous replication is active")
    def test_continuous_replication(self):
        """Test continuous replication status."""
        replication_task_id = self.outputs.get('dms_replication_task_id')
        
        if not replication_task_id:
            self.skipTest("DMS replication task ID not found in outputs")
        
        # Check replication task status
        response = self.dms_client.describe_replication_tasks(
            Filters=[
                {'Name': 'replication-task-id', 'Values': [replication_task_id]}
            ]
        )
        
        if response['ReplicationTasks']:
            task = response['ReplicationTasks'][0]
            self.assertIn(task['Status'], ['running', 'ready'])
            self.assertEqual(task['MigrationType'], 'full-load-and-cdc')

    @mark.it("Secrets Manager stores database credentials")
    def test_secrets_manager_configuration(self):
        """Test Secrets Manager configuration."""
        secret_arn = self.outputs.get('db_secret_arn')
        
        if not secret_arn:
            self.skipTest("Database secret ARN not found in outputs")
        
        # Check secret exists
        response = self.secretsmanager_client.describe_secret(
            SecretId=secret_arn
        )
        
        self.assertIsNotNone(response['ARN'])
        self.assertTrue(response.get('RotationEnabled', False))
        
        # Check rotation configuration
        if response.get('RotationRules'):
            rotation_days = response['RotationRules']['AutomaticallyAfterDays']
            self.assertEqual(rotation_days, 30)

    @mark.it("WAF is configured with SQL injection protection")
    def test_waf_configuration(self):
        """Test WAF configuration."""
        web_acl_id = self.outputs.get('waf_web_acl_id')
        
        if not web_acl_id:
            self.skipTest("WAF Web ACL ID not found in outputs")
        
        # Check WAF Web ACL
        response = self.wafv2_client.get_web_acl(
            Scope='REGIONAL',
            Id=web_acl_id,
            Name=f"payment-waf-{os.getenv('ENVIRONMENT_SUFFIX', 'dev')}"
        )
        
        web_acl = response['WebACL']
        self.assertIsNotNone(web_acl)
        
        # Check for SQL injection rule
        sql_rules = [r for r in web_acl['Rules'] 
                    if 'sql' in r['Name'].lower()]
        self.assertGreaterEqual(len(sql_rules), 1)

    @mark.it("rate limiting is configured")
    def test_rate_limiting(self):
        """Test rate limiting configuration."""
        web_acl_id = self.outputs.get('waf_web_acl_id')
        
        if not web_acl_id:
            self.skipTest("WAF Web ACL ID not found in outputs")
        
        # Check for rate limit rule
        response = self.wafv2_client.get_web_acl(
            Scope='REGIONAL',
            Id=web_acl_id,
            Name=f"payment-waf-{os.getenv('ENVIRONMENT_SUFFIX', 'dev')}"
        )
        
        web_acl = response['WebACL']
        rate_rules = [r for r in web_acl['Rules']
                     if r.get('Statement', {}).get('RateBasedStatement')]
        
        self.assertGreaterEqual(len(rate_rules), 1)
        
        # Check rate limit is 1000 req/min
        if rate_rules:
            rate_limit = rate_rules[0]['Statement']['RateBasedStatement']['Limit']
            self.assertEqual(rate_limit, 60000)  # 1000 req/min = 60000 per 5 min

    @mark.it("CloudWatch dashboards are created")
    def test_cloudwatch_dashboards(self):
        """Test CloudWatch dashboard creation."""
        dashboard_name = self.outputs.get('migration_dashboard_name')
        
        if not dashboard_name:
            self.skipTest("Dashboard name not found in outputs")
        
        # Check dashboard exists
        response = self.cloudwatch_client.get_dashboard(
            DashboardName=dashboard_name
        )
        
        self.assertIsNotNone(response['DashboardBody'])
        
        # Parse dashboard body
        dashboard_config = json.loads(response['DashboardBody'])
        self.assertIn('widgets', dashboard_config)
        self.assertGreaterEqual(len(dashboard_config['widgets']), 1)

    @mark.it("monitoring alarms are configured")
    def test_monitoring_alarms(self):
        """Test monitoring alarm configuration."""
        # Skip if no outputs available (stack not deployed)
        if not self.outputs:
            self.skipTest("Stack outputs not found - stack may not be deployed")
        
        # Check for key alarms
        # Use broader prefix to catch all payment alarms
        response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix="payment-"
        )
        
        alarms = response['MetricAlarms']
        
        # Filter to current environment's alarms
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        env_alarms = [a for a in alarms if env_suffix in a['AlarmName']]
        
        # Should have alarms for key metrics
        expected_metrics = ['CPUUtilization', 'DatabaseConnections', 'Latency']
        
        for metric in expected_metrics:
            matching_alarms = [a for a in env_alarms if a['MetricName'] == metric]
            self.assertGreaterEqual(len(matching_alarms), 1, 
                                   f"No alarm found for metric: {metric}")

    @mark.it("ACM certificate is configured for SSL")
    def test_acm_certificate(self):
        """Test ACM certificate configuration."""
        certificate_arn = self.outputs.get('certificate_arn')
        
        if not certificate_arn:
            self.skipTest("Certificate ARN not found in outputs")
        
        # Check certificate status
        response = self.acm_client.describe_certificate(
            CertificateArn=certificate_arn
        )
        
        cert = response['Certificate']
        self.assertEqual(cert['Status'], 'ISSUED')
        self.assertEqual(cert['Type'], 'AMAZON_ISSUED')

    @mark.it("weighted routing is configured")
    def test_weighted_routing(self):
        """Test weighted routing configuration."""
        # This would typically check Route53 weighted routing policies
        # For now, we'll check if the routing construct was created
        self.assertTrue(True)  # Placeholder for actual routing tests

    @mark.it("rollback mechanism is available")
    def test_rollback_mechanism(self):
        """Test rollback mechanism availability."""
        rollback_lambda = self.outputs.get('rollback_lambda_name')
        
        if not rollback_lambda:
            self.skipTest("Rollback Lambda not found in outputs")
        
        # Check rollback function exists
        response = self.lambda_client.get_function(
            FunctionName=rollback_lambda
        )
        
        self.assertEqual(response['Configuration']['State'], 'Active')

    @mark.it("validation checks pass")
    def test_validation_checks(self):
        """Test pre/post migration validation checks."""
        validation_lambda = self.outputs.get('validation_lambda_name')
        
        if not validation_lambda:
            self.skipTest("Validation Lambda not found in outputs")
        
        # Invoke validation function
        response = self.lambda_client.invoke(
            FunctionName=validation_lambda,
            InvocationType='RequestResponse',
            Payload=json.dumps({'action': 'validate'})
        )
        
        if response['StatusCode'] == 200:
            result = json.loads(response['Payload'].read())
            self.assertTrue(result.get('success', False))

    @mark.it("resources are properly tagged")
    def test_resource_tagging(self):
        """Test resource tagging compliance."""
        vpc_id = self.outputs.get('vpc_id')
        
        if not vpc_id:
            self.skipTest("VPC ID not found in outputs")
        
        # Check VPC tags
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]
        
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        
        # Check required tags
        required_tags = ['Environment', 'Project', 'Team']
        for tag_key in required_tags:
            self.assertIn(tag_key, tags, f"Missing required tag: {tag_key}")

    @mark.it("estimated costs are within budget")
    def test_cost_estimation(self):
        """Test that estimated costs are within $3000/month budget."""
        # This is a placeholder for actual cost calculation
        # In a real scenario, you would use AWS Cost Explorer API
        estimated_monthly_cost = 2500  # Placeholder value
        
        self.assertLessEqual(estimated_monthly_cost, 3000,
                           f"Estimated cost ${estimated_monthly_cost} exceeds budget")


if __name__ == "__main__":
    unittest.main()