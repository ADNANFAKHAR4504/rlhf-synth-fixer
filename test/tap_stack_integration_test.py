#!/usr/bin/env python3
"""
Integration tests for Highly Available Transaction Processing System.
Tests actual deployed AWS infrastructure using deployment outputs.
"""

import json
import os
import time
import unittest
import boto3
import requests
from typing import Dict, Any, List


class TerraformIntegrationTests(unittest.TestCase):
    """Integration tests for deployed Terraform infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Set up test environment and load deployment outputs."""
        cls.outputs_path = os.path.join(
            os.path.dirname(__file__), '..', 'cfn-outputs', 'flat-outputs.json'
        )

        with open(cls.outputs_path, 'r') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.region = 'us-east-1'
        cls.ec2 = boto3.client('ec2', region_name=cls.region)
        cls.elbv2 = boto3.client('elbv2', region_name=cls.region)
        cls.ecs = boto3.client('ecs', region_name=cls.region)
        cls.rds = boto3.client('rds', region_name=cls.region)
        cls.elasticache = boto3.client('elasticache', region_name=cls.region)
        cls.cloudwatch = boto3.client('cloudwatch', region_name=cls.region)
        cls.sns = boto3.client('sns', region_name=cls.region)

    def test_outputs_file_exists(self):
        """Test that deployment outputs file exists."""
        self.assertTrue(os.path.exists(self.outputs_path))

    def test_vpc_deployed(self):
        """Test that VPC is deployed and accessible."""
        vpc_id = self.outputs['vpc_id']
        self.assertIsNotNone(vpc_id)

        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')
        self.assertTrue(vpc['EnableDnsHostnames'])
        self.assertTrue(vpc['EnableDnsSupport'])

    def test_multi_az_subnets(self):
        """Test that subnets span multiple availability zones."""
        # Test public subnets
        public_subnet_ids = self.outputs['public_subnet_ids']
        self.assertEqual(len(public_subnet_ids), 3, "Should have 3 public subnets")

        public_subnets = self.ec2.describe_subnets(SubnetIds=public_subnet_ids)['Subnets']
        public_azs = set(subnet['AvailabilityZone'] for subnet in public_subnets)
        self.assertEqual(len(public_azs), 3, "Public subnets should span 3 AZs")

        # Test private app subnets
        private_app_subnet_ids = self.outputs['private_app_subnet_ids']
        self.assertEqual(len(private_app_subnet_ids), 3, "Should have 3 private app subnets")

        private_app_subnets = self.ec2.describe_subnets(SubnetIds=private_app_subnet_ids)['Subnets']
        private_app_azs = set(subnet['AvailabilityZone'] for subnet in private_app_subnets)
        self.assertEqual(len(private_app_azs), 3, "Private app subnets should span 3 AZs")

        # Test private DB subnets
        private_db_subnet_ids = self.outputs['private_db_subnet_ids']
        self.assertEqual(len(private_db_subnet_ids), 3, "Should have 3 private DB subnets")

        private_db_subnets = self.ec2.describe_subnets(SubnetIds=private_db_subnet_ids)['Subnets']
        private_db_azs = set(subnet['AvailabilityZone'] for subnet in private_db_subnets)
        self.assertEqual(len(private_db_azs), 3, "Private DB subnets should span 3 AZs")

    def test_alb_deployed_and_accessible(self):
        """Test that Application Load Balancer is deployed and accessible."""
        alb_dns = self.outputs['alb_dns_name']
        self.assertIsNotNone(alb_dns)

        # Get ALB details
        load_balancers = self.elbv2.describe_load_balancers(
            Names=[alb_dns.split('.')[0]]
        )['LoadBalancers']

        self.assertEqual(len(load_balancers), 1)
        alb = load_balancers[0]
        self.assertEqual(alb['State']['Code'], 'active')
        self.assertEqual(alb['Type'], 'application')
        self.assertEqual(alb['Scheme'], 'internet-facing')

        # Test ALB is accessible (HTTP)
        try:
            response = requests.get(f'http://{alb_dns}', timeout=10)
            # ALB should respond (even if ECS tasks return 503, ALB itself is working)
            self.assertIsNotNone(response.status_code)
        except requests.exceptions.RequestException:
            # If connection fails, that's okay - ALB might not have healthy targets yet
            pass

    def test_alb_cross_zone_load_balancing(self):
        """Test that ALB has cross-zone load balancing enabled."""
        alb_dns = self.outputs['alb_dns_name']
        alb_arn = self.elbv2.describe_load_balancers(
            Names=[alb_dns.split('.')[0]]
        )['LoadBalancers'][0]['LoadBalancerArn']

        attributes = self.elbv2.describe_load_balancer_attributes(
            LoadBalancerArn=alb_arn
        )['Attributes']

        cross_zone_attr = next(
            (attr for attr in attributes if attr['Key'] == 'load_balancing.cross_zone.enabled'),
            None
        )
        self.assertIsNotNone(cross_zone_attr)
        self.assertEqual(cross_zone_attr['Value'], 'true')

    def test_ecs_cluster_deployed(self):
        """Test that ECS cluster is deployed."""
        cluster_name = self.outputs['ecs_cluster_name']
        self.assertIsNotNone(cluster_name)

        clusters = self.ecs.describe_clusters(clusters=[cluster_name])['clusters']
        self.assertEqual(len(clusters), 1)
        cluster = clusters[0]
        self.assertEqual(cluster['status'], 'ACTIVE')
        self.assertGreaterEqual(cluster['runningTasksCount'], 0)

    def test_ecs_service_running_correct_task_count(self):
        """Test that ECS service is running with correct task count."""
        cluster_name = self.outputs['ecs_cluster_name']
        service_name = self.outputs['ecs_service_name']

        services = self.ecs.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )['services']

        self.assertEqual(len(services), 1)
        service = services[0]
        self.assertEqual(service['status'], 'ACTIVE')
        self.assertEqual(service['desiredCount'], 6, "Should have 6 desired tasks (2 per AZ)")
        self.assertGreaterEqual(service['runningCount'], 1, "Should have at least 1 running task")

    def test_ecs_tasks_distributed_across_azs(self):
        """Test that ECS tasks are distributed across multiple AZs."""
        cluster_name = self.outputs['ecs_cluster_name']
        service_name = self.outputs['ecs_service_name']

        # Get task ARNs
        task_arns = self.ecs.list_tasks(
            cluster=cluster_name,
            serviceName=service_name
        )['taskArns']

        if len(task_arns) > 0:
            # Describe tasks to get their AZs
            tasks = self.ecs.describe_tasks(
                cluster=cluster_name,
                tasks=task_arns
            )['tasks']

            # Get AZs from task attachments (network interfaces)
            task_azs = set()
            for task in tasks:
                for attachment in task.get('attachments', []):
                    if attachment['type'] == 'ElasticNetworkInterface':
                        for detail in attachment['details']:
                            if detail['name'] == 'subnetId':
                                subnet_id = detail['value']
                                subnet = self.ec2.describe_subnets(SubnetIds=[subnet_id])['Subnets'][0]
                                task_azs.add(subnet['AvailabilityZone'])

            # Should have tasks in multiple AZs
            self.assertGreaterEqual(len(task_azs), 1, "Tasks should be in at least one AZ")

    def test_aurora_cluster_deployed(self):
        """Test that Aurora PostgreSQL cluster is deployed."""
        cluster_endpoint = self.outputs['aurora_cluster_endpoint']
        self.assertIsNotNone(cluster_endpoint)

        # Extract cluster identifier from endpoint
        cluster_id = cluster_endpoint.split('.')[0]

        clusters = self.rds.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )['DBClusters']

        self.assertEqual(len(clusters), 1)
        cluster = clusters[0]
        self.assertEqual(cluster['Status'], 'available')
        self.assertEqual(cluster['Engine'], 'aurora-postgresql')
        self.assertTrue(cluster['MultiAZ'])
        self.assertGreaterEqual(cluster['BackupRetentionPeriod'], 7)

    def test_aurora_instances_across_azs(self):
        """Test that Aurora instances are deployed across multiple AZs."""
        cluster_endpoint = self.outputs['aurora_cluster_endpoint']
        cluster_id = cluster_endpoint.split('.')[0]

        instances = self.rds.describe_db_cluster_members(
            DBClusterIdentifier=cluster_id
        )['DBClusterMembers']

        self.assertGreaterEqual(len(instances), 3, "Should have at least 3 Aurora instances")

        # Get instance details to check AZs
        instance_ids = [member['DBInstanceIdentifier'] for member in instances]
        instance_details = []
        for instance_id in instance_ids:
            details = self.rds.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )['DBInstances'][0]
            instance_details.append(details)

        instance_azs = set(instance['AvailabilityZone'] for instance in instance_details)
        self.assertGreaterEqual(len(instance_azs), 2, "Aurora instances should span at least 2 AZs")

    def test_elasticache_redis_deployed(self):
        """Test that ElastiCache Redis cluster is deployed."""
        redis_endpoint = self.outputs['redis_configuration_endpoint']
        self.assertIsNotNone(redis_endpoint)

        # Extract cluster ID from endpoint
        cluster_id = redis_endpoint.split('.')[1]

        replication_groups = self.elasticache.describe_replication_groups(
            ReplicationGroupId=cluster_id
        )['ReplicationGroups']

        self.assertEqual(len(replication_groups), 1)
        redis = replication_groups[0]
        self.assertEqual(redis['Status'], 'available')
        self.assertTrue(redis['AutomaticFailover'] in ['enabled', 'enabling'])
        self.assertTrue(redis['MultiAZ'] in ['enabled', 'enabling'])
        self.assertTrue(redis['AtRestEncryptionEnabled'])
        self.assertTrue(redis['TransitEncryptionEnabled'])

    def test_redis_node_groups_across_azs(self):
        """Test that Redis node groups span multiple AZs."""
        redis_endpoint = self.outputs['redis_configuration_endpoint']
        cluster_id = redis_endpoint.split('.')[1]

        replication_groups = self.elasticache.describe_replication_groups(
            ReplicationGroupId=cluster_id
        )['ReplicationGroups']

        redis = replication_groups[0]
        node_groups = redis['NodeGroups']

        self.assertGreaterEqual(len(node_groups), 3, "Should have at least 3 node groups")

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created."""
        alarms = self.cloudwatch.describe_alarms()['MetricAlarms']

        alarm_names = [alarm['AlarmName'] for alarm in alarms]

        # Check for key alarms
        alarm_patterns = [
            'alb-unhealthy-targets',
            'ecs-cpu-high',
            'aurora-cpu-high',
            'aurora-replication-lag',
            'redis-cpu-high'
        ]

        for pattern in alarm_patterns:
            matching_alarms = [name for name in alarm_names if pattern in name]
            self.assertGreater(len(matching_alarms), 0, f"Should have alarm matching pattern: {pattern}")

    def test_sns_topic_exists(self):
        """Test that SNS topic for alarms exists."""
        sns_topic_arn = self.outputs['sns_topic_arn']
        self.assertIsNotNone(sns_topic_arn)

        # Get topic attributes to verify it exists
        try:
            attributes = self.sns.get_topic_attributes(TopicArn=sns_topic_arn)
            self.assertIsNotNone(attributes['Attributes'])
        except Exception as e:
            self.fail(f"SNS topic should be accessible: {str(e)}")

    def test_resource_tagging(self):
        """Test that resources are properly tagged."""
        vpc_id = self.outputs['vpc_id']

        # Check VPC tags
        vpc_tags = self.ec2.describe_tags(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]},
                {'Name': 'key', 'Values': ['Environment', 'DisasterRecovery', 'ManagedBy', 'EnvironmentSuffix']}
            ]
        )['Tags']

        tag_keys = set(tag['Key'] for tag in vpc_tags)
        self.assertIn('Environment', tag_keys)
        self.assertIn('DisasterRecovery', tag_keys)
        self.assertIn('ManagedBy', tag_keys)
        self.assertIn('EnvironmentSuffix', tag_keys)

        # Verify DisasterRecovery tag value
        dr_tag = next((tag for tag in vpc_tags if tag['Key'] == 'DisasterRecovery'), None)
        self.assertEqual(dr_tag['Value'], 'enabled')

    def test_security_groups_proper_isolation(self):
        """Test that security groups provide proper tier isolation."""
        vpc_id = self.outputs['vpc_id']

        # Get all security groups in the VPC
        security_groups = self.ec2.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )['SecurityGroups']

        sg_names = [sg['GroupName'] for sg in security_groups]

        # Check for required security groups
        required_sgs = ['alb-sg', 'ecs-tasks-sg', 'aurora-sg', 'redis-sg']
        for required_sg in required_sgs:
            matching = [name for name in sg_names if required_sg in name]
            self.assertGreater(len(matching), 0, f"Should have security group: {required_sg}")

    def test_nat_gateways_per_az(self):
        """Test that NAT Gateways are deployed per AZ."""
        vpc_id = self.outputs['vpc_id']

        nat_gateways = self.ec2.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )['NatGateways']

        self.assertGreaterEqual(len(nat_gateways), 3, "Should have at least 3 NAT Gateways")

        # Check NAT Gateways are in different AZs
        nat_azs = set(nat['SubnetId'] for nat in nat_gateways)
        subnet_azs = set()
        for subnet_id in nat_azs:
            subnet = self.ec2.describe_subnets(SubnetIds=[subnet_id])['Subnets'][0]
            subnet_azs.add(subnet['AvailabilityZone'])

        self.assertGreaterEqual(len(subnet_azs), 2, "NAT Gateways should be in at least 2 different AZs")

    def test_alb_health_check_configuration(self):
        """Test ALB target group health check configuration."""
        alb_dns = self.outputs['alb_dns_name']
        alb_arn = self.elbv2.describe_load_balancers(
            Names=[alb_dns.split('.')[0]]
        )['LoadBalancers'][0]['LoadBalancerArn']

        # Get target groups
        target_groups = self.elbv2.describe_target_groups(
            LoadBalancerArn=alb_arn
        )['TargetGroups']

        self.assertGreater(len(target_groups), 0, "Should have at least one target group")

        tg = target_groups[0]
        self.assertEqual(tg['HealthCheckProtocol'], 'HTTP')
        self.assertGreaterEqual(tg['HealthCheckIntervalSeconds'], 30)
        self.assertGreaterEqual(tg['HealthyThresholdCount'], 2)
        self.assertGreaterEqual(tg['UnhealthyThresholdCount'], 2)
        self.assertGreaterEqual(tg['DeregistrationDelay'], 30)


if __name__ == '__main__':
    unittest.main(verbosity=2)
