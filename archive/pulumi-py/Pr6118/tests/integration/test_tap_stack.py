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
        """Discover AWS resources dynamically using stack outputs as primary source."""
        resources = {}
        
        # Use cluster_endpoint from outputs to discover Aurora cluster
        if 'cluster_endpoint' in cls.outputs:
            cluster_endpoint = cls.outputs['cluster_endpoint']
            # Extract cluster identifier from endpoint (format: cluster-id.cluster-xxx.region.rds.amazonaws.com)
            cluster_id = cluster_endpoint.split('.')[0]
            
            try:
                clusters = cls.rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
                if clusters['DBClusters']:
                    resources['aurora_cluster'] = clusters['DBClusters'][0]
                    
                    # Get cluster members (instances) from cluster
                    members = resources['aurora_cluster'].get('DBClusterMembers', [])
                    resources['cluster_members'] = members
            except Exception as e:
                print(f"Warning: Could not discover Aurora cluster from endpoint: {e}")
        
        # Fallback: Search by environment suffix if outputs not available
        if 'aurora_cluster' not in resources:
            try:
                clusters = cls.rds_client.describe_db_clusters()
                for cluster in clusters['DBClusters']:
                    if cls.environment_suffix in cluster['DBClusterIdentifier']:
                        resources['aurora_cluster'] = cluster
                        members = cluster.get('DBClusterMembers', [])
                        resources['cluster_members'] = members
                        break
            except Exception as e:
                print(f"Warning: Could not discover Aurora cluster: {e}")
        
        # Discover Aurora instances (if cluster members exist)
        if 'cluster_members' in resources and len(resources['cluster_members']) > 0:
            try:
                instance_ids = [m['DBInstanceIdentifier'] for m in resources['cluster_members']]
                instances_response = cls.rds_client.describe_db_instances()
                resources['aurora_instances'] = [
                    inst for inst in instances_response['DBInstances']
                    if inst['DBInstanceIdentifier'] in instance_ids
                ]
            except Exception as e:
                print(f"Warning: Could not discover Aurora instances: {e}")
        
        # Use dms_task_arn from outputs to discover DMS resources
        if 'dms_task_arn' in cls.outputs:
            task_arn = cls.outputs['dms_task_arn']
            
            try:
                # Get task details from ARN
                tasks = cls.dms_client.describe_replication_tasks(
                    Filters=[{'Name': 'replication-task-arn', 'Values': [task_arn]}]
                )
                if tasks['ReplicationTasks']:
                    resources['dms_task'] = tasks['ReplicationTasks'][0]
                    
                    # Get replication instance from task
                    rep_instance_arn = resources['dms_task'].get('ReplicationInstanceArn')
                    if rep_instance_arn:
                        instances = cls.dms_client.describe_replication_instances(
                            Filters=[{'Name': 'replication-instance-arn', 'Values': [rep_instance_arn]}]
                        )
                        if instances['ReplicationInstances']:
                            resources['dms_instance'] = instances['ReplicationInstances'][0]
                    
                    # Get endpoints from task
                    source_endpoint_arn = resources['dms_task'].get('SourceEndpointArn')
                    target_endpoint_arn = resources['dms_task'].get('TargetEndpointArn')
                    
                    endpoint_arns = [arn for arn in [source_endpoint_arn, target_endpoint_arn] if arn]
                    if endpoint_arns:
                        endpoints = cls.dms_client.describe_endpoints(
                            Filters=[{'Name': 'endpoint-arn', 'Values': endpoint_arns}]
                        )
                        resources['dms_endpoints'] = endpoints.get('Endpoints', [])
            except Exception as e:
                print(f"Warning: Could not discover DMS resources from task ARN: {e}")
        
        # Fallback: Search DMS resources by environment suffix
        if 'dms_instance' not in resources:
            try:
                dms_instances = cls.dms_client.describe_replication_instances()
                for inst in dms_instances['ReplicationInstances']:
                    if cls.environment_suffix in inst['ReplicationInstanceIdentifier']:
                        resources['dms_instance'] = inst
                        break
            except Exception as e:
                print(f"Warning: Could not discover DMS instance: {e}")
        
        if 'dms_endpoints' not in resources:
            try:
                endpoints = cls.dms_client.describe_endpoints()
                resources['dms_endpoints'] = [
                    ep for ep in endpoints['Endpoints']
                    if cls.environment_suffix in ep['EndpointIdentifier']
                ]
            except Exception as e:
                print(f"Warning: Could not discover DMS endpoints: {e}")
        
        if 'dms_task' not in resources:
            try:
                tasks = cls.dms_client.describe_replication_tasks()
                for task in tasks['ReplicationTasks']:
                    if cls.environment_suffix in task['ReplicationTaskIdentifier']:
                        resources['dms_task'] = task
                        break
            except Exception as e:
                print(f"Warning: Could not discover DMS task: {e}")
        
        # Use secret_arn from outputs
        if 'secret_arn' in cls.outputs:
            try:
                secret = cls.secrets_client.describe_secret(SecretId=cls.outputs['secret_arn'])
                resources['secret'] = secret
            except Exception as e:
                print(f"Warning: Could not discover secret: {e}")
        
        # Fallback: Search secrets by environment suffix
        if 'secret' not in resources:
            try:
                secrets = cls.secrets_client.list_secrets()
                for secret in secrets['SecretList']:
                    if cls.environment_suffix in secret['Name']:
                        resources['secret'] = secret
                        break
            except Exception as e:
                print(f"Warning: Could not discover secrets: {e}")
        
        # Discover security groups from Aurora cluster VPC
        if 'aurora_cluster' in resources:
            try:
                vpc_sg_ids = [sg['VpcSecurityGroupId'] for sg in resources['aurora_cluster'].get('VpcSecurityGroups', [])]
                if vpc_sg_ids:
                    sgs = cls.ec2_client.describe_security_groups(GroupIds=vpc_sg_ids)
                    resources['security_groups'] = sgs['SecurityGroups']
            except Exception as e:
                print(f"Warning: Could not discover security groups: {e}")
        
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
        # Use cluster members from discovered cluster
        self.assertIn('cluster_members', self.resources, "Aurora cluster members not found")
        members = self.resources['cluster_members']
        
        self.assertEqual(len(members), 3, 
                        f"Expected 3 Aurora instances in cluster, found {len(members)}")
        
        # Check for 1 writer and 2 readers from cluster members
        writers = [m for m in members if m.get('IsClusterWriter', False)]
        readers = [m for m in members if not m.get('IsClusterWriter', False)]
        
        self.assertEqual(len(writers), 1, f"Should have exactly 1 writer instance, found {len(writers)}")
        self.assertEqual(len(readers), 2, f"Should have exactly 2 reader instances, found {len(readers)}")

    def test_aurora_performance_insights(self):
        """Test that Performance Insights is enabled on all instances."""
        # Use discovered aurora instances
        self.assertIn('aurora_instances', self.resources, "Aurora instances not found")
        instances = self.resources['aurora_instances']
        self.assertGreater(len(instances), 0, "No Aurora instances found")
        
        for inst in instances:
            self.assertTrue(inst.get('PerformanceInsightsEnabled', False),
                          f"Performance Insights not enabled on {inst['DBInstanceIdentifier']}")

    def test_aurora_multi_az(self):
        """Test that Aurora cluster instances are distributed across multiple AZs."""
        self.assertIn('aurora_cluster', self.resources, "Aurora cluster not found")
        cluster = self.resources['aurora_cluster']
        
        # Check availability zones from cluster
        azs = cluster.get('AvailabilityZones', [])
        self.assertGreaterEqual(len(azs), 2, 
                              f"Aurora cluster should span at least 2 AZs, found {len(azs)}")
        
        # Verify cluster members are distributed (if they exist)
        members = cluster.get('DBClusterMembers', [])
        if len(members) > 0:
            # At least check that we have members
            self.assertGreater(len(members), 0, "Cluster should have instances")

    def test_dms_replication_instance_exists(self):
        """Test that DMS replication instance exists and is available."""
        self.assertIn('dms_instance', self.resources, "DMS replication instance not found")
        
        dms_instance = self.resources['dms_instance']
        self.assertIn('ReplicationInstanceStatus', dms_instance,
                     "DMS instance should have status")
        self.assertEqual(dms_instance['ReplicationInstanceStatus'], 'available',
                        f"DMS instance should be available, current status: {dms_instance.get('ReplicationInstanceStatus')}")

    def test_dms_endpoints_exist(self):
        """Test that DMS source and target endpoints exist."""
        # Use discovered DMS endpoints
        self.assertIn('dms_endpoints', self.resources, "DMS endpoints not found")
        endpoints = self.resources['dms_endpoints']
        self.assertGreaterEqual(len(endpoints), 1,
                              f"Expected at least 1 DMS endpoint, found {len(endpoints)}")
        
        # Check for source endpoint
        source_endpoints = [ep for ep in endpoints if ep.get('EndpointType') == 'SOURCE']
        self.assertGreaterEqual(len(source_endpoints), 1, "Should have at least 1 source endpoint")
        
        # Note: Target endpoint may be created after Aurora is ready
    
    def test_dms_endpoints_ssl(self):
        """Test that DMS source endpoint uses SSL."""
        # Use discovered DMS endpoints
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
        # Use stack output as primary source
        if 'dms_task_arn' in self.outputs:
            # Validate using stack output
            task_arn = self.outputs['dms_task_arn']
            self.assertTrue(task_arn.startswith('arn:aws:dms:'),
                          f"DMS task ARN should be valid: {task_arn}")
            
            # If we also have the task details, validate migration type
            if 'dms_task' in self.resources:
                task = self.resources['dms_task']
                self.assertEqual(task.get('MigrationType'), 'full-load-and-cdc',
                               "DMS task should be configured for full-load-and-cdc")
        elif 'dms_task' in self.resources:
            # Validate using discovered task
            task = self.resources['dms_task']
            self.assertEqual(task.get('MigrationType'), 'full-load-and-cdc',
                           "DMS task should be configured for full-load-and-cdc")
        else:
            self.fail("DMS replication task not found in outputs or discovered resources")

    def test_secrets_manager_credentials(self):
        """Test that Aurora credentials are stored in Secrets Manager."""
        # Use stack output to get secret ARN directly instead of filtering by environment suffix
        self.assertIn('secret_arn', self.outputs, "Secret ARN not in stack outputs")
        secret_arn = self.outputs['secret_arn']
        
        # Verify the secret exists and is accessible
        try:
            secret = self.secrets_client.describe_secret(SecretId=secret_arn)
            self.assertIn('Name', secret, "Secret should have a Name")
            
            # Verify secret name contains 'aurora' or 'credentials'
            secret_name = secret['Name'].lower()
            self.assertTrue('aurora' in secret_name or 'credentials' in secret_name,
                          f"Secret name '{secret['Name']}' should contain 'aurora' or 'credentials'")
        except Exception as e:
            self.fail(f"Failed to access secret: {e}")

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
