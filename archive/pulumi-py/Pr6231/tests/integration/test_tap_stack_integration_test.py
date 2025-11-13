"""
Integration tests for deployed Pulumi infrastructure
Tests actual AWS resources created by the stack
"""
import unittest
import json
import boto3
import os
from botocore.exceptions import ClientError


class TestDeployedInfrastructure(unittest.TestCase):
    """Test deployed AWS infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs and set up AWS clients"""
        outputs_file = 'cfn-outputs/flat-outputs.json'

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(f"Stack outputs file not found: {outputs_file}")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        cls.region = os.getenv('AWS_REGION', 'us-east-2')

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.ecr_client = boto3.client('ecr', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.autoscaling_client = boto3.client('application-autoscaling', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)

    def test_vpc_exists(self):
        """Test VPC exists and is configured correctly"""
        vpc_id = self.outputs['vpc_id']
        self.assertIsNotNone(vpc_id, "VPC ID is None")

        # Describe VPC
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

    def test_subnets_exist(self):
        """Test subnets are created in multiple AZs"""
        vpc_id = self.outputs['vpc_id']

        # Get all subnets in the VPC
        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        self.assertGreaterEqual(len(subnets), 4, "Expected at least 4 subnets")

        # Check multiple AZs are used
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        self.assertGreaterEqual(len(azs), 2, "Subnets should span at least 2 AZs")

    def test_alb_exists_and_healthy(self):
        """Test Application Load Balancer exists and is active"""
        alb_dns = self.outputs['alb_dns_name']
        self.assertIsNotNone(alb_dns, "ALB DNS name is None")

        # Find the ALB by DNS name
        response = self.elbv2_client.describe_load_balancers()

        alb_found = False
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_dns:
                alb_found = True
                self.assertEqual(lb['State']['Code'], 'active')
                self.assertEqual(lb['Type'], 'application')
                self.assertEqual(lb['Scheme'], 'internet-facing')
                break

        self.assertTrue(alb_found, f"ALB with DNS {alb_dns} not found")

    def test_target_group_exists(self):
        """Test target group exists with correct configuration"""
        alb_dns = self.outputs['alb_dns_name']

        # Get load balancer ARN
        response = self.elbv2_client.describe_load_balancers()
        alb_arn = None
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_dns:
                alb_arn = lb['LoadBalancerArn']
                break

        self.assertIsNotNone(alb_arn, "ALB ARN not found")

        # Get target groups for this ALB
        tg_response = self.elbv2_client.describe_target_groups(
            LoadBalancerArn=alb_arn
        )

        self.assertGreater(len(tg_response['TargetGroups']), 0)

        tg = tg_response['TargetGroups'][0]
        self.assertEqual(tg['Protocol'], 'HTTP')
        self.assertEqual(tg['Port'], 5000)
        self.assertEqual(tg['HealthCheckPath'], '/health')

    def test_ecs_cluster_exists(self):
        """Test ECS cluster exists and is active"""
        cluster_name = self.outputs['ecs_cluster_name']
        self.assertIsNotNone(cluster_name, "ECS cluster name is None")

        response = self.ecs_client.describe_clusters(clusters=[cluster_name])

        self.assertEqual(len(response['clusters']), 1)
        cluster = response['clusters'][0]
        self.assertEqual(cluster['status'], 'ACTIVE')
        self.assertEqual(cluster['clusterName'], cluster_name)

    def test_ecs_service_running(self):
        """Test ECS service is running with desired tasks"""
        cluster_name = self.outputs['ecs_cluster_name']
        service_name = self.outputs['ecs_service_name']

        response = self.ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        self.assertEqual(len(response['services']), 1)
        service = response['services'][0]

        self.assertEqual(service['status'], 'ACTIVE')
        self.assertEqual(service['launchType'], 'FARGATE')
        self.assertEqual(service['desiredCount'], 2)

    def test_ecr_repository_exists(self):
        """Test ECR repository exists"""
        ecr_url = self.outputs['ecr_repository_url']
        self.assertIsNotNone(ecr_url, "ECR repository URL is None")

        # Extract repository name from URL
        # Format: account.dkr.ecr.region.amazonaws.com/repo-name
        repo_name = ecr_url.split('/')[-1]

        try:
            response = self.ecr_client.describe_repositories(
                repositoryNames=[repo_name]
            )
            self.assertEqual(len(response['repositories']), 1)

            repo = response['repositories'][0]
            self.assertTrue(repo['imageScanningConfiguration']['scanOnPush'])
        except ClientError as e:
            self.fail(f"ECR repository not found: {e}")

    def test_rds_instance_available(self):
        """Test RDS instance exists and is available"""
        rds_endpoint = self.outputs['rds_endpoint']
        self.assertIsNotNone(rds_endpoint, "RDS endpoint is None")

        # Extract DB instance identifier from endpoint
        # Format: identifier.hash.region.rds.amazonaws.com:port
        db_identifier = rds_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        self.assertEqual(len(response['DBInstances']), 1)
        db = response['DBInstances'][0]

        self.assertEqual(db['DBInstanceStatus'], 'available')
        self.assertEqual(db['Engine'], 'postgres')
        self.assertGreaterEqual(int(db['EngineVersion'].split('.')[0]), 14)
        self.assertEqual(db['DBInstanceClass'], 'db.t3.micro')
        self.assertTrue(db['StorageEncrypted'])
        self.assertFalse(db['PubliclyAccessible'])

    def test_dynamodb_table_exists(self):
        """Test DynamoDB table exists with TTL enabled"""
        table_name = self.outputs['dynamodb_table_name']
        self.assertIsNotNone(table_name, "DynamoDB table name is None")

        response = self.dynamodb_client.describe_table(TableName=table_name)

        table = response['Table']
        self.assertEqual(table['TableStatus'], 'ACTIVE')
        self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

        # Check TTL
        ttl_response = self.dynamodb_client.describe_time_to_live(TableName=table_name)
        self.assertEqual(ttl_response['TimeToLiveDescription']['TimeToLiveStatus'], 'ENABLED')
        self.assertEqual(ttl_response['TimeToLiveDescription']['AttributeName'], 'expiry')

    def test_cloudwatch_log_group_exists(self):
        """Test CloudWatch log group exists"""
        log_group_name = self.outputs['log_group_name']
        self.assertIsNotNone(log_group_name, "Log group name is None")

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
        self.assertEqual(len(log_groups), 1)

        log_group = log_groups[0]
        self.assertEqual(log_group['retentionInDays'], 7)

    def test_autoscaling_target_exists(self):
        """Test ECS service has autoscaling configured"""
        cluster_name = self.outputs['ecs_cluster_name']
        service_name = self.outputs['ecs_service_name']

        resource_id = f"service/{cluster_name}/{service_name}"

        response = self.autoscaling_client.describe_scalable_targets(
            ServiceNamespace='ecs',
            ResourceIds=[resource_id]
        )

        self.assertEqual(len(response['ScalableTargets']), 1)

        target = response['ScalableTargets'][0]
        self.assertEqual(target['MinCapacity'], 2)
        self.assertEqual(target['MaxCapacity'], 10)

    def test_autoscaling_policy_exists(self):
        """Test autoscaling policy is configured"""
        cluster_name = self.outputs['ecs_cluster_name']
        service_name = self.outputs['ecs_service_name']

        resource_id = f"service/{cluster_name}/{service_name}"

        response = self.autoscaling_client.describe_scaling_policies(
            ServiceNamespace='ecs',
            ResourceId=resource_id
        )

        self.assertGreater(len(response['ScalingPolicies']), 0)

        # Check for target tracking policy
        target_tracking_policies = [p for p in response['ScalingPolicies']
                                     if p['PolicyType'] == 'TargetTrackingScaling']
        self.assertGreater(len(target_tracking_policies), 0)

    def test_cloudwatch_alarms_exist(self):
        """Test CloudWatch alarms are created for ECS service"""
        cluster_name = self.outputs['ecs_cluster_name']
        service_name = self.outputs['ecs_service_name']

        response = self.cloudwatch_client.describe_alarms()

        # Extract environment suffix from cluster name (e.g., "flask-cluster-dev" -> "dev")
        env_suffix = cluster_name.split('-')[-1] if '-' in cluster_name else ''

        # Filter alarms related to this ECS service
        ecs_alarms = [alarm for alarm in response['MetricAlarms']
                      if 'ecs' in alarm['AlarmName'].lower() and
                      env_suffix in alarm['AlarmName'].lower()]

        self.assertGreaterEqual(len(ecs_alarms), 2, "Expected at least 2 CloudWatch alarms")

        # Check alarm configurations
        for alarm in ecs_alarms:
            self.assertEqual(alarm['Namespace'], 'AWS/ECS')
            self.assertEqual(alarm['MetricName'], 'CPUUtilization')
            self.assertEqual(alarm['Statistic'], 'Average')

    def test_security_groups_configured(self):
        """Test security groups are properly configured"""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        sg_names = [sg['GroupName'] for sg in response['SecurityGroups']]

        # Should have at least 3 security groups (ALB, ECS, RDS) + default
        self.assertGreaterEqual(len(sg_names), 4)

        # Find ALB security group
        alb_sgs = [sg for sg in response['SecurityGroups']
                   if 'alb' in sg['GroupName'].lower()]
        self.assertGreater(len(alb_sgs), 0)

        # Check ALB security group allows HTTP
        alb_sg = alb_sgs[0]
        http_rule = next((rule for rule in alb_sg['IpPermissions']
                          if rule['FromPort'] == 80), None)
        self.assertIsNotNone(http_rule, "ALB security group missing HTTP ingress rule")

    def test_nat_gateways_exist(self):
        """Test NAT gateways are created for private subnet internet access"""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        nat_gateways = [ng for ng in response['NatGateways']
                        if ng['State'] in ['available', 'pending']]

        self.assertGreaterEqual(len(nat_gateways), 2, "Expected at least 2 NAT gateways")

    def test_resource_tags_include_environment_suffix(self):
        """Test resources are tagged with EnvironmentSuffix"""
        vpc_id = self.outputs['vpc_id']
        cluster_name = self.outputs['ecs_cluster_name']

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        self.assertIn('EnvironmentSuffix', tags)

        # Extract expected environment suffix from cluster name
        expected_suffix = cluster_name.split('-')[-1] if '-' in cluster_name else 'dev'
        self.assertEqual(tags['EnvironmentSuffix'], expected_suffix)


if __name__ == '__main__':
    unittest.main()
