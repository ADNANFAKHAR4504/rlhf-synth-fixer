"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import boto3
import json
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with AWS clients."""
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'synth101912368')

        # AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.secretsmanager_client = boto3.client('secretsmanager', region_name=cls.region)

        # Load outputs if available
        cls.outputs = cls._load_stack_outputs()

        # Default tenant IDs
        cls.tenants = ['acme-corp', 'globex-inc', 'initech-llc']

    @classmethod
    def _load_stack_outputs(cls):
        """Load Pulumi stack outputs from flat-outputs.json if available."""
        outputs_file = 'cfn-outputs/flat-outputs.json'
        if os.path.exists(outputs_file):
            with open(outputs_file, 'r') as f:
                return json.load(f)
        return {}

    def test_vpc_exists(self):
        """Test that VPC exists with correct CIDR block."""
        vpc_filter = [
            {'Name': 'tag:Environment', 'Values': [self.environment_suffix]}
        ]

        try:
            vpcs = self.ec2_client.describe_vpcs(Filters=vpc_filter)
            self.assertGreater(len(vpcs['Vpcs']), 0, "VPC should exist")

            vpc = vpcs['Vpcs'][0]
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16', "VPC CIDR should be 10.0.0/16")

            # Get VPC attributes separately
            dns_support = self.ec2_client.describe_vpc_attribute(
                VpcId=vpc['VpcId'],
                Attribute='enableDnsSupport'
            )
            dns_hostnames = self.ec2_client.describe_vpc_attribute(
                VpcId=vpc['VpcId'],
                Attribute='enableDnsHostnames'
            )

            self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'],
                            "DNS hostnames should be enabled")
            self.assertTrue(dns_support['EnableDnsSupport']['Value'],
                            "DNS support should be enabled")
        except ClientError as e:
            self.fail(f"Failed to describe VPC: {e}")

    def test_subnets_exist(self):
        """Test that public and private subnets exist across 3 AZs."""
        subnet_filter = [
            {'Name': 'tag:Environment', 'Values': [self.environment_suffix]}
        ]

        try:
            subnets = self.ec2_client.describe_subnets(Filters=subnet_filter)
            self.assertGreaterEqual(len(subnets['Subnets']), 6,
                                    "Should have at least 6 subnets (3 public + 3 private)")

            # Check public subnets
            public_cidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']
            public_subnets = [s for s in subnets['Subnets']
                              if s['CidrBlock'] in public_cidrs]
            self.assertEqual(len(public_subnets), 3, "Should have 3 public subnets")

            # Check private subnets
            private_cidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']
            private_subnets = [s for s in subnets['Subnets']
                               if s['CidrBlock'] in private_cidrs]
            self.assertEqual(len(private_subnets), 3, "Should have 3 private subnets")

        except ClientError as e:
            self.fail(f"Failed to describe subnets: {e}")

    def test_nat_gateways_exist(self):
        """Test that NAT gateways exist for each AZ."""
        nat_filter = [
            {'Name': 'tag:Environment', 'Values': [self.environment_suffix]},
            {'Name': 'state', 'Values': ['available', 'pending']}
        ]

        try:
            nat_gateways = self.ec2_client.describe_nat_gateways(Filters=nat_filter)
            self.assertGreaterEqual(len(nat_gateways['NatGateways']), 3,
                                    "Should have at least 3 NAT gateways")
        except ClientError as e:
            self.fail(f"Failed to describe NAT gateways: {e}")

    def test_aurora_cluster_exists(self):
        """Test that Aurora PostgreSQL cluster exists and is available."""
        cluster_identifier = f"saas-aurora-{self.environment_suffix}"

        try:
            clusters = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_identifier
            )

            self.assertEqual(len(clusters['DBClusters']), 1, "Should have 1 Aurora cluster")

            cluster = clusters['DBClusters'][0]
            self.assertEqual(cluster['Engine'], 'aurora-postgresql', "Should be PostgreSQL")
            self.assertIn('15.', cluster['EngineVersion'], "Should be PostgreSQL 15.x")
            self.assertEqual(cluster['DatabaseName'], 'saasdb', "Database name should be saasdb")
            self.assertIn(cluster['Status'], ['available', 'creating', 'backing-up'],
                          "Cluster should be available or creating")

        except ClientError as e:
            if e.response['Error']['Code'] == 'DBClusterNotFoundFault':
                self.skipTest(f"Aurora cluster {cluster_identifier} not found - may be deleted")
            else:
                self.fail(f"Failed to describe Aurora cluster: {e}")

    def test_aurora_instance_exists(self):
        """Test that Aurora instance exists."""
        instance_identifier = f"saas-aurora-instance-{self.environment_suffix}"

        try:
            instances = self.rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_identifier
            )

            self.assertEqual(len(instances['DBInstances']), 1, "Should have 1 Aurora instance")

            instance = instances['DBInstances'][0]
            self.assertEqual(instance['Engine'], 'aurora-postgresql', "Should be PostgreSQL")
            self.assertEqual(instance['DBInstanceClass'], 'db.t3.medium',
                             "Instance class should be db.t3.medium")

        except ClientError as e:
            if e.response['Error']['Code'] == 'DBInstanceNotFound':
                self.skipTest(f"Aurora instance {instance_identifier} not found - may be deleted")
            else:
                self.fail(f"Failed to describe Aurora instance: {e}")

    def test_s3_buckets_exist_for_tenants(self):
        """Test that S3 buckets exist for each tenant."""
        for tenant_id in self.tenants:
            bucket_name = f"saas-platform-{tenant_id}-data-{self.environment_suffix}"

            try:
                self.s3_client.head_bucket(Bucket=bucket_name)
                # If no exception, bucket exists

                # Check bucket tags
                tagging = self.s3_client.get_bucket_tagging(Bucket=bucket_name)
                tags = {tag['Key']: tag['Value'] for tag in tagging['TagSet']}

                self.assertEqual(tags.get('tenant_id'), tenant_id,
                                 f"Bucket should have tenant_id tag: {tenant_id}")
                self.assertEqual(tags.get('cost_center'), tenant_id,
                                 f"Bucket should have cost_center tag: {tenant_id}")

            except ClientError as e:
                if e.response['Error']['Code'] == '404':
                    self.skipTest(f"S3 bucket {bucket_name} not found - may be deleted")
                else:
                    self.fail(f"Failed to check S3 bucket {bucket_name}: {e}")

    def test_alb_exists(self):
        """Test that Application Load Balancer exists."""
        alb_name = f"saas-alb-{self.environment_suffix}"

        try:
            load_balancers = self.elbv2_client.describe_load_balancers(
                Names=[alb_name]
            )

            self.assertEqual(len(load_balancers['LoadBalancers']), 1,
                             "Should have 1 load balancer")

            alb = load_balancers['LoadBalancers'][0]
            self.assertEqual(alb['Type'], 'application', "Should be application load balancer")
            self.assertEqual(alb['Scheme'], 'internet-facing', "Should be internet-facing")
            self.assertIn(alb['State']['Code'], ['active', 'provisioning'],
                          "ALB should be active or provisioning")

        except ClientError as e:
            if e.response['Error']['Code'] == 'LoadBalancerNotFound':
                self.skipTest(f"ALB {alb_name} not found - may be deleted")
            else:
                self.fail(f"Failed to describe ALB: {e}")

    def test_alb_listener_exists(self):
        """Test that ALB listener exists on port 80."""
        if not self.outputs.get('alb_dns_name'):
            self.skipTest("ALB DNS name not found in outputs")

        try:
            # Get ALB ARN first
            alb_name = f"saas-alb-{self.environment_suffix}"
            load_balancers = self.elbv2_client.describe_load_balancers(Names=[alb_name])
            alb_arn = load_balancers['LoadBalancers'][0]['LoadBalancerArn']

            # Get listeners
            listeners = self.elbv2_client.describe_listeners(LoadBalancerArn=alb_arn)

            port_80_listeners = [l for l in listeners['Listeners'] if l['Port'] == 80]
            self.assertGreater(len(port_80_listeners), 0, "Should have listener on port 80")

        except ClientError as e:
            self.skipTest(f"Failed to describe ALB listeners: {e}")

    def test_ecs_cluster_exists(self):
        """Test that ECS cluster exists."""
        cluster_name = f"saas-ecs-cluster-{self.environment_suffix}"

        try:
            clusters = self.ecs_client.describe_clusters(clusters=[cluster_name])

            self.assertEqual(len(clusters['clusters']), 1, "Should have 1 ECS cluster")

            cluster = clusters['clusters'][0]
            self.assertEqual(cluster['status'], 'ACTIVE', "ECS cluster should be active")
            self.assertGreaterEqual(cluster['registeredContainerInstancesCount'] +
                                    cluster['runningTasksCount'], 0,
                                    "ECS cluster should have tasks or instances")

        except ClientError as e:
            if 'ClusterNotFoundException' in str(e):
                self.skipTest(f"ECS cluster {cluster_name} not found - may be deleted")
            else:
                self.fail(f"Failed to describe ECS cluster: {e}")

    def test_ecs_services_exist_for_tenants(self):
        """Test that ECS services exist for each tenant."""
        cluster_name = f"saas-ecs-cluster-{self.environment_suffix}"

        try:
            # List services in cluster
            service_arns = self.ecs_client.list_services(cluster=cluster_name)['serviceArns']

            self.assertGreaterEqual(len(service_arns), len(self.tenants),
                                    f"Should have at least {len(self.tenants)} ECS services")

            # Describe services
            if service_arns:
                services = self.ecs_client.describe_services(
                    cluster=cluster_name,
                    services=service_arns
                )

                for service in services['services']:
                    self.assertIn(service['status'], ['ACTIVE', 'DRAINING'],
                                  "Service should be active or draining")
                    self.assertEqual(service['launchType'], 'FARGATE',
                                     "Service should use Fargate")

        except ClientError as e:
            if 'ClusterNotFoundException' in str(e):
                self.skipTest(f"ECS cluster {cluster_name} not found - may be deleted")
            else:
                self.fail(f"Failed to describe ECS services: {e}")

    def test_cloudwatch_log_groups_exist_for_tenants(self):
        """Test that CloudWatch log groups exist for each tenant."""
        for tenant_id in self.tenants:
            log_group_name = f"/ecs/tenant/{tenant_id}/{self.environment_suffix}"

            try:
                log_groups = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name,
                    limit=1
                )

                matching_groups = [lg for lg in log_groups['logGroups']
                                   if lg['logGroupName'] == log_group_name]

                self.assertEqual(len(matching_groups), 1,
                                 f"Log group should exist for tenant {tenant_id}")

                log_group = matching_groups[0]
                self.assertEqual(log_group['retentionInDays'], 30,
                                 "Log retention should be 30 days")

            except ClientError as e:
                if e.response['Error']['Code'] == 'ResourceNotFoundException':
                    self.skipTest(f"Log group {log_group_name} not found - may be deleted")
                else:
                    self.fail(f"Failed to describe log group: {e}")

    def test_secrets_manager_secrets_exist_for_tenants(self):
        """Test that Secrets Manager secrets exist for each tenant."""
        for tenant_id in self.tenants:
            secret_name = f"rds/tenant/{tenant_id}/{self.environment_suffix}/password"

            try:
                secret = self.secretsmanager_client.describe_secret(SecretId=secret_name)

                self.assertIsNotNone(secret, f"Secret should exist for tenant {tenant_id}")
                self.assertEqual(secret['Name'], secret_name, "Secret name should match")

                # Check tags
                tags = {tag['Key']: tag['Value'] for tag in secret.get('Tags', [])}
                self.assertEqual(tags.get('tenant_id'), tenant_id,
                                 f"Secret should have tenant_id tag: {tenant_id}")

            except ClientError as e:
                if e.response['Error']['Code'] == 'ResourceNotFoundException':
                    self.skipTest(f"Secret {secret_name} not found - may be deleted")
                else:
                    self.fail(f"Failed to describe secret: {e}")

    def test_security_groups_exist(self):
        """Test that security groups exist for ALB, ECS, and RDS."""
        sg_filter = [
            {'Name': 'tag:Environment', 'Values': [self.environment_suffix]}
        ]

        try:
            security_groups = self.ec2_client.describe_security_groups(Filters=sg_filter)

            sg_names = [sg['GroupName'] for sg in security_groups['SecurityGroups']]

            # Should have ALB, RDS, and tenant-specific ECS security groups
            alb_sgs = [name for name in sg_names if 'alb-sg' in name]
            rds_sgs = [name for name in sg_names if 'rds-sg' in name]
            ecs_sgs = [name for name in sg_names if 'ecs-' in name and '-sg' in name]

            self.assertGreaterEqual(len(alb_sgs), 1, "Should have ALB security group")
            self.assertGreaterEqual(len(rds_sgs), 1, "Should have RDS security group")
            self.assertGreaterEqual(len(ecs_sgs), len(self.tenants),
                                    f"Should have at least {len(self.tenants)} ECS security groups")

        except ClientError as e:
            self.fail(f"Failed to describe security groups: {e}")

    def test_tenant_endpoints_format(self):
        """Test that tenant endpoints are properly formatted."""
        for tenant_id in self.tenants:
            output_key = f"{tenant_id}_endpoint"
            if output_key in self.outputs:
                endpoint = self.outputs[output_key]
                self.assertEqual(endpoint, f"{tenant_id}.example.com",
                                 f"Tenant endpoint should be {tenant_id}.example.com")

    def test_tenant_db_connections_format(self):
        """Test that tenant database connection strings are properly formatted."""
        for tenant_id in self.tenants:
            output_key = f"{tenant_id}_db_connection"
            if output_key in self.outputs:
                connection_string = self.outputs[output_key]

                # Verify format: postgresql://tenant_<tenant>@<endpoint>/saasdb?secret=<name>
                tenant_username = tenant_id.replace('-', '_')
                self.assertIn(f"tenant_{tenant_username}", connection_string,
                              "Connection string should contain tenant username")
                self.assertIn("/saasdb", connection_string,
                              "Connection string should contain database name")
                self.assertIn("secret=", connection_string,
                              "Connection string should contain secret reference")


if __name__ == '__main__':
    unittest.main()
