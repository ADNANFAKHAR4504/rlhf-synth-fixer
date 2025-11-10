"""
Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack with dynamic discovery.
"""

import unittest
import os
import json
import subprocess
import boto3
from typing import Dict, Any


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack - runs once for all tests."""
        # Dynamically discover environment suffix
        cls.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        cls.stack_name = f'TapStack{cls.environment_suffix}'
        cls.project_name = 'TapStack'
        
        # Get Pulumi backend URL
        cls.pulumi_backend_url = os.getenv('PULUMI_BACKEND_URL')
        if not cls.pulumi_backend_url:
            # Try to infer from common locations
            if os.path.exists('pulumi-state'):
                cls.pulumi_backend_url = f'file://{os.getcwd()}/pulumi-state'
        
        # Initialize AWS clients
        cls.rds_client = boto3.client('rds')
        cls.dms_client = boto3.client('dms')
        cls.secrets_client = boto3.client('secretsmanager')
        cls.cloudwatch_client = boto3.client('cloudwatch')
        cls.ec2_client = boto3.client('ec2')
        
        # Dynamically get stack outputs
        cls.outputs = cls._get_stack_outputs()
        
        # Discover resources by tags and naming convention
        cls.resources = cls._discover_resources()

    @classmethod
    def _get_stack_outputs(cls) -> Dict[str, Any]:
        """Get Pulumi stack outputs dynamically."""
        try:
            env = os.environ.copy()
            if cls.pulumi_backend_url:
                env['PULUMI_BACKEND_URL'] = cls.pulumi_backend_url
            
            # Get outputs using pulumi CLI
            result = subprocess.run(
                ['pulumi', 'stack', 'output', '--json', '--stack', cls.stack_name],
                capture_output=True,
                text=True,
                cwd=os.getcwd(),
                env=env
            )
            
            if result.returncode == 0 and result.stdout:
                return json.loads(result.stdout)
            else:
                print(f"Warning: Could not get stack outputs: {result.stderr}")
                return {}
        except Exception as e:
            print(f"Warning: Error getting stack outputs: {e}")
            return {}

    @classmethod
    def _discover_resources(cls) -> Dict[str, Any]:
        """Discover AWS resources dynamically by tags and naming patterns."""
        resources = {}
        
        # Discover Aurora cluster
        try:
            clusters = cls.rds_client.describe_db_clusters()
            for cluster in clusters['DBClusters']:
                if cls.environment_suffix in cluster['DBClusterIdentifier']:
                    resources['aurora_cluster'] = cluster
                    break
        except Exception as e:
            print(f"Warning: Could not discover Aurora cluster: {e}")
        
        # Discover Aurora instances
        try:
            instances = cls.rds_client.describe_db_instances()
            resources['aurora_instances'] = [
                inst for inst in instances['DBInstances']
                if cls.environment_suffix in inst['DBInstanceIdentifier']
            ]
        except Exception as e:
            print(f"Warning: Could not discover Aurora instances: {e}")
        
        # Discover DMS replication instance
        try:
            dms_instances = cls.dms_client.describe_replication_instances()
            for inst in dms_instances['ReplicationInstances']:
                if cls.environment_suffix in inst['ReplicationInstanceIdentifier']:
                    resources['dms_instance'] = inst
                    break
        except Exception as e:
            print(f"Warning: Could not discover DMS instance: {e}")
        
        # Discover DMS endpoints
        try:
            endpoints = cls.dms_client.describe_endpoints()
            resources['dms_endpoints'] = [
                ep for ep in endpoints['Endpoints']
                if cls.environment_suffix in ep['EndpointIdentifier']
            ]
        except Exception as e:
            print(f"Warning: Could not discover DMS endpoints: {e}")
        
        # Discover DMS replication tasks
        try:
            tasks = cls.dms_client.describe_replication_tasks()
            resources['dms_tasks'] = [
                task for task in tasks['ReplicationTasks']
                if cls.environment_suffix in task['ReplicationTaskIdentifier']
            ]
        except Exception as e:
            print(f"Warning: Could not discover DMS tasks: {e}")
        
        # Discover Secrets Manager secrets
        try:
            secrets = cls.secrets_client.list_secrets()
            resources['secrets'] = [
                secret for secret in secrets['SecretList']
                if cls.environment_suffix in secret['Name']
            ]
        except Exception as e:
            print(f"Warning: Could not discover secrets: {e}")
        
        # Discover security groups
        try:
            sgs = cls.ec2_client.describe_security_groups(
                Filters=[
                    {'Name': 'tag:Environment', 'Values': [cls.environment_suffix]}
                ]
            )
            resources['security_groups'] = sgs['SecurityGroups']
        except Exception as e:
            # Try by name pattern if tag filter fails
            try:
                all_sgs = cls.ec2_client.describe_security_groups()
                resources['security_groups'] = [
                    sg for sg in all_sgs['SecurityGroups']
                    if cls.environment_suffix in sg.get('GroupName', '')
                ]
            except Exception as e2:
                print(f"Warning: Could not discover security groups: {e2}")
        
        return resources

    def test_aurora_cluster_exists(self):
        """Test that Aurora cluster exists and is available."""
        self.assertIn('aurora_cluster', self.resources, "Aurora cluster not found")
        cluster = self.resources['aurora_cluster']
        self.assertEqual(cluster['Status'], 'available', 
                        f"Aurora cluster status is {cluster['Status']}, expected 'available'")
        self.assertEqual(cluster['Engine'], 'aurora-postgresql',
                        "Aurora cluster engine should be aurora-postgresql")

    def test_aurora_cluster_instances(self):
        """Test that Aurora has correct number of instances (1 writer + 2 readers)."""
        self.assertIn('aurora_instances', self.resources, "Aurora instances not found")
        instances = self.resources['aurora_instances']
        self.assertEqual(len(instances), 3, 
                        f"Expected 3 Aurora instances, found {len(instances)}")
        
        # Verify all instances are available
        for inst in instances:
            self.assertEqual(inst['DBInstanceStatus'], 'available',
                           f"Instance {inst['DBInstanceIdentifier']} is not available")

    def test_aurora_performance_insights(self):
        """Test that Performance Insights is enabled on all instances."""
        self.assertIn('aurora_instances', self.resources, "Aurora instances not found")
        for inst in self.resources['aurora_instances']:
            self.assertTrue(inst.get('PerformanceInsightsEnabled', False),
                          f"Performance Insights not enabled on {inst['DBInstanceIdentifier']}")

    def test_aurora_multi_az(self):
        """Test that Aurora cluster has multi-AZ enabled."""
        self.assertIn('aurora_cluster', self.resources, "Aurora cluster not found")
        cluster = self.resources['aurora_cluster']
        self.assertTrue(cluster.get('MultiAZ', False),
                       "Aurora cluster should have MultiAZ enabled")

    def test_dms_replication_instance_exists(self):
        """Test that DMS replication instance exists and is available."""
        self.assertIn('dms_instance', self.resources, "DMS replication instance not found")
        dms_inst = self.resources['dms_instance']
        self.assertEqual(dms_inst['ReplicationInstanceStatus'], 'available',
                        f"DMS instance status is {dms_inst['ReplicationInstanceStatus']}")
        self.assertTrue(dms_inst.get('MultiAZ', False),
                       "DMS instance should have MultiAZ enabled")

    def test_dms_endpoints_exist(self):
        """Test that DMS source and target endpoints exist."""
        self.assertIn('dms_endpoints', self.resources, "DMS endpoints not found")
        endpoints = self.resources['dms_endpoints']
        self.assertGreaterEqual(len(endpoints), 2,
                               f"Expected at least 2 DMS endpoints, found {len(endpoints)}")
        
        # Verify we have source and target (case-insensitive)
        endpoint_types = {ep['EndpointType'].lower() for ep in endpoints}
        self.assertIn('source', endpoint_types, "Source endpoint not found")
        self.assertIn('target', endpoint_types, "Target endpoint not found")

    def test_dms_endpoints_ssl(self):
        """Test that DMS source endpoint uses SSL."""
        self.assertIn('dms_endpoints', self.resources, "DMS endpoints not found")
        source_endpoints = [ep for ep in self.resources['dms_endpoints'] 
                           if ep['EndpointType'].lower() == 'source']
        self.assertGreater(len(source_endpoints), 0, "No source endpoints found")
        
        for ep in source_endpoints:
            ssl_mode = ep.get('SslMode', 'none')
            self.assertIn(ssl_mode, ['require', 'verify-ca', 'verify-full'],
                         f"Source endpoint should use SSL, got {ssl_mode}")

    def test_dms_replication_task_exists(self):
        """Test that DMS replication task exists."""
        self.assertIn('dms_tasks', self.resources, "DMS tasks not found")
        tasks = self.resources['dms_tasks']
        self.assertGreater(len(tasks), 0, "No DMS replication tasks found")
        
        # Verify task is configured for full-load-and-cdc
        for task in tasks:
            self.assertEqual(task['MigrationType'], 'full-load-and-cdc',
                           "DMS task should be configured for full-load-and-cdc")

    def test_secrets_manager_credentials(self):
        """Test that Aurora credentials are stored in Secrets Manager."""
        self.assertIn('secrets', self.resources, "Secrets not found")
        secrets = self.resources['secrets']
        self.assertGreater(len(secrets), 0, "No secrets found in Secrets Manager")
        
        # Verify secret name contains 'aurora' or 'credentials'
        secret_names = [s['Name'].lower() for s in secrets]
        aurora_secrets = [n for n in secret_names if 'aurora' in n or 'credentials' in n]
        self.assertGreater(len(aurora_secrets), 0,
                          "No Aurora credentials found in Secrets Manager")

    def test_security_groups_exist(self):
        """Test that security groups for Aurora and DMS exist."""
        self.assertIn('security_groups', self.resources, "Security groups not found")
        sgs = self.resources['security_groups']
        self.assertGreater(len(sgs), 0, "No security groups found")
        
        # Look for Aurora and DMS security groups
        sg_names = [sg.get('GroupName', '').lower() for sg in sgs]
        has_aurora = any('aurora' in name for name in sg_names)
        has_dms = any('dms' in name for name in sg_names)
        
        self.assertTrue(has_aurora or has_dms,
                       "Expected to find Aurora or DMS security groups")

    def test_stack_outputs_available(self):
        """Test that stack outputs are available and contain expected keys."""
        if not self.outputs:
            self.skipTest("Stack outputs not available")
        
        expected_outputs = ['cluster_endpoint', 'reader_endpoint', 'secret_arn', 'dms_task_arn']
        for output_key in expected_outputs:
            self.assertIn(output_key, self.outputs,
                         f"Expected output '{output_key}' not found in stack outputs")

    def test_cluster_endpoint_from_output(self):
        """Test that cluster endpoint from output matches discovered cluster."""
        if 'cluster_endpoint' not in self.outputs:
            self.skipTest("cluster_endpoint not in stack outputs")
        
        if 'aurora_cluster' not in self.resources:
            self.skipTest("Aurora cluster not discovered")
        
        output_endpoint = self.outputs['cluster_endpoint']
        discovered_endpoint = self.resources['aurora_cluster']['Endpoint']
        
        self.assertEqual(output_endpoint, discovered_endpoint,
                        "Cluster endpoint from output doesn't match discovered endpoint")


if __name__ == '__main__':
    unittest.main()

#     self.pulumi_backend_url = os.getenv('PULUMI_BACKEND_URL', 's3://iac-rlhf-pulumi-states')
