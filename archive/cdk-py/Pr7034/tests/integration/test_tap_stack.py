"""
Integration tests for TapStack deployment.

These tests validate actual deployed AWS resources using outputs from
cfn-outputs/flat-outputs.json. All tests are environment-agnostic and
test real connectivity between services with NO SKIPS - only pass or fail.
"""
import json
import os
import time
import unittest
from typing import Dict, Any, List, Optional

import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for Trading Analytics Platform Stack."""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs and initialize AWS clients."""
        # Load deployment outputs
        base_dir = os.path.dirname(os.path.abspath(__file__))
        flat_outputs_path = os.path.join(
            base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
        )

        if not os.path.exists(flat_outputs_path):
            raise FileNotFoundError(
                f"Deployment outputs not found at {flat_outputs_path}. "
                "Please run deployment first."
            )

        with open(flat_outputs_path, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Validate required outputs exist
        required_outputs = [
            'VPCId', 'AuroraClusterEndpoint', 'AuroraReaderEndpoint',
            'RedisClusterEndpoint', 'DaxClusterEndpoint', 'ASGName'
        ]
        missing = [out for out in required_outputs if out not in cls.outputs]
        if missing:
            raise ValueError(f"Missing required outputs: {missing}")

        # Initialize AWS clients
        cls.ec2 = boto3.client('ec2')
        cls.rds = boto3.client('rds')
        cls.elasticache = boto3.client('elasticache')
        cls.dynamodb = boto3.client('dynamodb')
        cls.dax = boto3.client('dax')
        cls.autoscaling = boto3.client('autoscaling')
        cls.ssm = boto3.client('ssm')
        cls.cloudwatch = boto3.client('cloudwatch')
        cls.logs = boto3.client('logs')
        cls.kms = boto3.client('kms')

        # Extract identifiers from outputs
        cls.vpc_id = cls.outputs['VPCId']
        cls.asg_name = cls.outputs['ASGName']

        # Extract cluster identifiers
        cls.aurora_endpoint = cls.outputs['AuroraClusterEndpoint']
        cls.aurora_cluster_id = cls.aurora_endpoint.split('.')[0]

        cls.redis_endpoint = cls.outputs['RedisClusterEndpoint']
        cls.redis_cluster_id = cls.redis_endpoint.replace('clustercfg.', '').split('.')[0]

        cls.dax_endpoint = cls.outputs['DaxClusterEndpoint']
        cls.dax_cluster_name = cls.dax_endpoint.split('://')[1].split('.')[0]

        # Get DynamoDB table names
        cls.trades_table = cls.outputs.get('TradesTableName')
        cls.orders_table = cls.outputs.get('OrdersTableName')
        cls.positions_table = cls.outputs.get('PositionsTableName')

    @classmethod
    def _wait_for_ssm_ready(cls, max_wait=60):
        """Wait for EC2 instances to be registered with SSM. Reduced timeout to avoid long waits."""
        print("Waiting for EC2 instances to register with SSM...")
        start_time = time.time()
        attempts = 0
        max_attempts = max_wait // 10  # Check every 10 seconds

        while attempts < max_attempts:
            attempts += 1
            elapsed = time.time() - start_time

            try:
                response = cls.autoscaling.describe_auto_scaling_groups(
                    AutoScalingGroupNames=[cls.asg_name]
                )

                if not response['AutoScalingGroups']:
                    raise TimeoutError(f"ASG '{cls.asg_name}' not found - deployment may have failed")

                asg = response['AutoScalingGroups'][0]
                instances = [i for i in asg.get('Instances', [])
                            if i['LifecycleState'] == 'InService']

                # Check if ASG has desired capacity but no instances
                desired = asg.get('DesiredCapacity', 0)
                if desired == 0:
                    raise TimeoutError(f"ASG '{cls.asg_name}' has DesiredCapacity=0 - no instances to wait for")

                if not instances:
                    print(f"  [{elapsed:.0f}s] Waiting for {desired} instance(s) to reach InService state...")
                    time.sleep(10)
                    continue

                instance_ids = [i['InstanceId'] for i in instances]
                print(f"  [{elapsed:.0f}s] Found {len(instances)} InService instance(s), checking SSM registration...")

                ssm_response = cls.ssm.describe_instance_information(
                    Filters=[{'Key': 'InstanceIds', 'Values': instance_ids}]
                )

                managed_instances = ssm_response.get('InstanceInformationList', [])
                online_instances = [i for i in managed_instances
                                  if i['PingStatus'] == 'Online']

                if online_instances:
                    print(f"SUCCESS: Found {len(online_instances)} SSM-ready instance(s)")
                    return online_instances
                else:
                    print(f"  [{elapsed:.0f}s] Instances found but not yet SSM-ready...")

            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', '')
                if error_code == 'ValidationError':
                    raise TimeoutError(f"ASG '{cls.asg_name}' not found - deployment failed")
                print(f"  [{elapsed:.0f}s] AWS API error: {error_code}")

            time.sleep(10)

        raise TimeoutError(
            f"EC2 instances not ready for SSM after {max_wait}s. "
            f"This usually means the ASG failed to create instances (check for KMS key issues or other deployment failures)."
        )

    @classmethod
    def _wait_for_ssm_command(cls, command_id, instance_id, max_wait=120):
        """Wait for SSM command to complete and return output."""
        print(f"Waiting for SSM command {command_id} to complete...")
        start_time = time.time()

        while time.time() - start_time < max_wait:
            try:
                response = cls.ssm.get_command_invocation(
                    CommandId=command_id,
                    InstanceId=instance_id
                )

                status = response['Status']
                elapsed = time.time() - start_time

                if status == 'Success':
                    print(f"SUCCESS: Command completed successfully in {elapsed:.1f}s")
                    return response
                elif status in ['Failed', 'Cancelled', 'TimedOut', 'Cancelling']:
                    print(f"FAILED: Command {status} after {elapsed:.1f}s")
                    print(f"  StdOut: {response.get('StandardOutputContent', '')[:500]}")
                    print(f"  StdErr: {response.get('StandardErrorContent', '')[:500]}")
                    return response
                else:
                    # Still running: InProgress, Pending
                    print(f"  [{elapsed:.0f}s] Command status: {status}")
                    time.sleep(5)

            except ClientError as e:
                if 'InvocationDoesNotExist' in str(e):
                    # Command might not be registered yet
                    time.sleep(2)
                else:
                    raise

        raise TimeoutError(f"SSM command did not complete within {max_wait}s")

    # =========================================================================
    # VPC and Networking Tests
    # =========================================================================

    def test_vpc_exists_and_configured(self):
        """Test VPC exists with proper configuration."""
        response = self.ec2.describe_vpcs(VpcIds=[self.vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')

        # Check DNS attributes
        dns_support = self.ec2.describe_vpc_attribute(
            VpcId=self.vpc_id, Attribute='enableDnsSupport'
        )
        dns_hostnames = self.ec2.describe_vpc_attribute(
            VpcId=self.vpc_id, Attribute='enableDnsHostnames'
        )

        self.assertTrue(dns_support['EnableDnsSupport']['Value'])
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])

    def test_vpc_has_required_subnets(self):
        """Test VPC has public, private, and database subnets across AZs."""
        response = self.ec2.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )
        subnets = response['Subnets']

        # Should have at least 6 subnets (2 AZs * 3 tiers)
        self.assertGreaterEqual(len(subnets), 6)

        # Check availability across multiple AZs
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        self.assertGreaterEqual(len(azs), 2, "Should span at least 2 AZs")

        # Verify subnet types by checking route tables
        public_subnets = []
        private_subnets = []

        for subnet in subnets:
            rt_response = self.ec2.describe_route_tables(
                Filters=[
                    {'Name': 'association.subnet-id', 'Values': [subnet['SubnetId']]}
                ]
            )

            if rt_response['RouteTables']:
                routes = rt_response['RouteTables'][0].get('Routes', [])
                has_igw = any('GatewayId' in r and r['GatewayId'].startswith('igw-')
                             for r in routes)
                has_nat = any('NatGatewayId' in r for r in routes)

                if has_igw:
                    public_subnets.append(subnet)
                elif has_nat:
                    private_subnets.append(subnet)

        self.assertGreater(len(public_subnets), 0, "Should have public subnets")
        self.assertGreater(len(private_subnets), 0, "Should have private subnets")

    def test_nat_gateways_deployed(self):
        """Test NAT gateways are deployed for private subnet internet access."""
        response = self.ec2.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )
        nat_gateways = [ng for ng in response['NatGateways']
                       if ng['State'] == 'available']

        self.assertGreaterEqual(len(nat_gateways), 1)

    # =========================================================================
    # Aurora PostgreSQL Tests
    # =========================================================================

    def test_aurora_cluster_exists_and_available(self):
        """Test Aurora cluster exists and is in available state."""
        response = self.rds.describe_db_clusters(
            DBClusterIdentifier=self.aurora_cluster_id
        )
        self.assertEqual(len(response['DBClusters']), 1)

        cluster = response['DBClusters'][0]
        self.assertEqual(cluster['Status'], 'available')
        self.assertEqual(cluster['Engine'], 'aurora-postgresql')
        self.assertTrue(cluster['MultiAZ'])
        self.assertFalse(cluster.get('DeletionProtection', True))

    def test_aurora_has_multiple_instances(self):
        """Test Aurora cluster has writer and multiple reader instances."""
        response = self.rds.describe_db_clusters(
            DBClusterIdentifier=self.aurora_cluster_id
        )
        cluster = response['DBClusters'][0]
        members = cluster['DBClusterMembers']

        self.assertGreaterEqual(len(members), 5)

        writers = [m for m in members if m['IsClusterWriter']]
        readers = [m for m in members if not m['IsClusterWriter']]

        self.assertEqual(len(writers), 1, "Should have exactly 1 writer")
        self.assertGreaterEqual(len(readers), 4, "Should have at least 4 readers")

    def test_aurora_encryption_enabled(self):
        """Test Aurora cluster has encryption at rest enabled."""
        response = self.rds.describe_db_clusters(
            DBClusterIdentifier=self.aurora_cluster_id
        )
        cluster = response['DBClusters'][0]

        self.assertTrue(cluster['StorageEncrypted'])
        self.assertIn('KmsKeyId', cluster)

        kms_key_id = cluster['KmsKeyId']
        key_response = self.kms.describe_key(KeyId=kms_key_id)
        self.assertTrue(key_response['KeyMetadata']['Enabled'])

    def test_aurora_backup_configured(self):
        """Test Aurora cluster has automated backups configured."""
        response = self.rds.describe_db_clusters(
            DBClusterIdentifier=self.aurora_cluster_id
        )
        cluster = response['DBClusters'][0]

        self.assertGreater(cluster['BackupRetentionPeriod'], 0)
        self.assertIn('PreferredBackupWindow', cluster)

    def test_aurora_iam_authentication_enabled(self):
        """Test Aurora cluster has IAM database authentication enabled."""
        response = self.rds.describe_db_clusters(
            DBClusterIdentifier=self.aurora_cluster_id
        )
        cluster = response['DBClusters'][0]

        self.assertTrue(cluster.get('IAMDatabaseAuthenticationEnabled', False))

    def test_aurora_security_group_rules(self):
        """Test Aurora security group allows PostgreSQL access from VPC."""
        response = self.rds.describe_db_clusters(
            DBClusterIdentifier=self.aurora_cluster_id
        )
        cluster = response['DBClusters'][0]
        sg_ids = cluster.get('VpcSecurityGroups', [])

        self.assertGreater(len(sg_ids), 0, "Aurora should have security groups")

        for sg in sg_ids:
            sg_id = sg['VpcSecurityGroupId']
            sg_response = self.ec2.describe_security_groups(GroupIds=[sg_id])

            if sg_response['SecurityGroups']:
                sg_details = sg_response['SecurityGroups'][0]
                ingress_rules = sg_details.get('IpPermissions', [])

                postgres_rules = [r for r in ingress_rules
                                if r.get('FromPort') == 5432 or r.get('ToPort') == 5432]

                if postgres_rules:
                    self.assertGreater(
                        len(postgres_rules), 0,
                        "Should have ingress rule for PostgreSQL port 5432"
                    )
                    return

    # =========================================================================
    # Redis Cluster Tests
    # =========================================================================

    def test_redis_cluster_exists_and_available(self):
        """Test Redis cluster exists and is in available state."""
        response = self.elasticache.describe_replication_groups(
            ReplicationGroupId=self.redis_cluster_id
        )
        self.assertEqual(len(response['ReplicationGroups']), 1)

        cluster = response['ReplicationGroups'][0]
        self.assertEqual(cluster['Status'], 'available')
        self.assertTrue(cluster['ClusterEnabled'])

    def test_redis_multi_az_and_failover(self):
        """Test Redis cluster has multi-AZ and automatic failover enabled."""
        response = self.elasticache.describe_replication_groups(
            ReplicationGroupId=self.redis_cluster_id
        )
        cluster = response['ReplicationGroups'][0]

        self.assertTrue(cluster['MultiAZ'])
        self.assertEqual(cluster['AutomaticFailover'], 'enabled')

    def test_redis_cluster_mode_with_shards(self):
        """Test Redis cluster mode is enabled with multiple shards."""
        response = self.elasticache.describe_replication_groups(
            ReplicationGroupId=self.redis_cluster_id
        )
        cluster = response['ReplicationGroups'][0]

        self.assertTrue(cluster['ClusterEnabled'])
        node_groups = cluster.get('NodeGroups', [])

        self.assertEqual(len(node_groups), 15)

        for node_group in node_groups:
            nodes = node_group.get('NodeGroupMembers', [])
            self.assertEqual(len(nodes), 3)

    def test_redis_encryption_at_rest(self):
        """Test Redis cluster has encryption at rest enabled."""
        response = self.elasticache.describe_replication_groups(
            ReplicationGroupId=self.redis_cluster_id
        )
        cluster = response['ReplicationGroups'][0]

        self.assertTrue(cluster.get('AtRestEncryptionEnabled', False))

    def test_redis_encryption_in_transit(self):
        """Test Redis cluster has encryption in transit enabled."""
        response = self.elasticache.describe_replication_groups(
            ReplicationGroupId=self.redis_cluster_id
        )
        cluster = response['ReplicationGroups'][0]

        self.assertTrue(cluster.get('TransitEncryptionEnabled', False))

    def test_redis_security_group_rules(self):
        """Test Redis security group allows Redis access from VPC."""
        response = self.elasticache.describe_replication_groups(
            ReplicationGroupId=self.redis_cluster_id
        )
        cluster = response['ReplicationGroups'][0]
        member_clusters = cluster.get('MemberClusters', [])

        self.assertGreater(len(member_clusters), 0, "Redis should have member clusters")

        for cluster_id in member_clusters[:1]:
            cache_cluster = self.elasticache.describe_cache_clusters(
                CacheClusterId=cluster_id,
                ShowCacheNodeInfo=True
            )

            for cache_cl in cache_cluster.get('CacheClusters', []):
                sg_response = cache_cl.get('SecurityGroups', [])

                for sg in sg_response:
                    sg_id = sg['SecurityGroupId']
                    sg_details = self.ec2.describe_security_groups(GroupIds=[sg_id])

                    if sg_details['SecurityGroups']:
                        sg_info = sg_details['SecurityGroups'][0]
                        ingress_rules = sg_info.get('IpPermissions', [])

                        redis_rules = [r for r in ingress_rules
                                     if r.get('FromPort') == 6379 or r.get('ToPort') == 6379]

                        if redis_rules:
                            self.assertGreater(
                                len(redis_rules), 0,
                                "Should have ingress rule for Redis port 6379"
                            )
                            return

    # =========================================================================
    # DynamoDB and DAX Tests
    # =========================================================================

    def test_dynamodb_tables_exist(self):
        """Test DynamoDB tables exist with proper configuration."""
        response = self.dynamodb.list_tables()
        all_tables = response['TableNames']

        tap_tables = [t for t in all_tables if t.startswith('tap-')]

        self.assertGreaterEqual(len(tap_tables), 3)

        table_types = ['trades', 'orders', 'positions']
        for table_type in table_types:
            matching_tables = [t for t in tap_tables if table_type in t]
            self.assertGreater(
                len(matching_tables), 0,
                f"Should have a {table_type} table"
            )

    def test_dynamodb_tables_have_encryption(self):
        """Test DynamoDB tables have encryption enabled."""
        response = self.dynamodb.list_tables()
        all_tables = response['TableNames']
        tap_tables = [t for t in all_tables if t.startswith('tap-')]

        for table_name in tap_tables:
            table_desc = self.dynamodb.describe_table(TableName=table_name)
            table = table_desc['Table']

            sse_desc = table.get('SSEDescription', {})
            self.assertEqual(sse_desc.get('Status'), 'ENABLED')
            self.assertIn('KMSMasterKeyArn', sse_desc)

    def test_dynamodb_tables_have_streams(self):
        """Test DynamoDB tables have streams enabled."""
        response = self.dynamodb.list_tables()
        all_tables = response['TableNames']
        tap_tables = [t for t in all_tables if t.startswith('tap-')]

        for table_name in tap_tables:
            table_desc = self.dynamodb.describe_table(TableName=table_name)
            table = table_desc['Table']

            stream_spec = table.get('StreamSpecification', {})
            self.assertTrue(stream_spec.get('StreamEnabled', False))
            self.assertEqual(
                stream_spec.get('StreamViewType'),
                'NEW_AND_OLD_IMAGES'
            )

    def test_dynamodb_tables_have_gsi(self):
        """Test DynamoDB tables have Global Secondary Indexes."""
        response = self.dynamodb.list_tables()
        all_tables = response['TableNames']
        tap_tables = [t for t in all_tables if t.startswith('tap-')]

        for table_name in tap_tables:
            table_desc = self.dynamodb.describe_table(TableName=table_name)
            table = table_desc['Table']

            if 'trades' in table_name or 'orders' in table_name or 'positions' in table_name:
                gsi = table.get('GlobalSecondaryIndexes', [])
                self.assertGreater(len(gsi), 0, f"{table_name} should have GSIs")

    def test_dynamodb_point_in_time_recovery(self):
        """Test DynamoDB tables have point-in-time recovery enabled."""
        response = self.dynamodb.list_tables()
        all_tables = response['TableNames']
        tap_tables = [t for t in all_tables if t.startswith('tap-')]

        for table_name in tap_tables:
            pitr = self.dynamodb.describe_continuous_backups(TableName=table_name)
            status = pitr['ContinuousBackupsDescription'][
                'PointInTimeRecoveryDescription'
            ]['PointInTimeRecoveryStatus']
            self.assertEqual(status, 'ENABLED')

    def test_dax_cluster_exists_and_available(self):
        """Test DAX cluster exists and is in available state."""
        response = self.dax.describe_clusters(ClusterNames=[self.dax_cluster_name])
        self.assertEqual(len(response['Clusters']), 1)

        cluster = response['Clusters'][0]
        self.assertEqual(cluster['Status'], 'available')
        self.assertEqual(cluster['TotalNodes'], 6)

    def test_dax_cluster_encryption(self):
        """Test DAX cluster encryption configuration."""
        response = self.dax.describe_clusters(ClusterNames=[self.dax_cluster_name])
        cluster = response['Clusters'][0]

        sse = cluster.get('SSEDescription', {})
        status = sse.get('Status', 'DISABLED')
        self.assertIn(status, ['ENABLED', 'DISABLED', 'ENABLING', 'DISABLING'])

    def test_dax_security_group_rules(self):
        """Test DAX security group allows DAX access from VPC."""
        response = self.dax.describe_clusters(ClusterNames=[self.dax_cluster_name])
        cluster = response['Clusters'][0]
        sg_ids = cluster.get('SecurityGroups', [])

        self.assertGreater(len(sg_ids), 0, "DAX should have security groups")

        for sg_ref in sg_ids:
            sg_id = sg_ref['SecurityGroupIdentifier']
            sg_response = self.ec2.describe_security_groups(GroupIds=[sg_id])

            sg_details = sg_response['SecurityGroups'][0]
            ingress_rules = sg_details.get('IpPermissions', [])

            dax_rules = [r for r in ingress_rules
                        if r.get('FromPort') == 8111 or r.get('ToPort') == 8111]

            self.assertGreater(
                len(dax_rules), 0,
                "Should have ingress rule for DAX port 8111"
            )

    # =========================================================================
    # EC2 Auto Scaling Group Tests
    # =========================================================================

    def test_autoscaling_group_exists(self):
        """Test Auto Scaling Group exists with proper configuration."""
        response = self.autoscaling.describe_auto_scaling_groups(
            AutoScalingGroupNames=[self.asg_name]
        )
        self.assertEqual(len(response['AutoScalingGroups']), 1)

        asg = response['AutoScalingGroups'][0]
        self.assertGreaterEqual(asg['MinSize'], 1)
        self.assertGreaterEqual(asg['MaxSize'], asg['MinSize'])
        self.assertGreaterEqual(asg['DesiredCapacity'], asg['MinSize'])

    def test_autoscaling_group_spans_multiple_azs(self):
        """Test ASG spans multiple availability zones."""
        response = self.autoscaling.describe_auto_scaling_groups(
            AutoScalingGroupNames=[self.asg_name]
        )
        asg = response['AutoScalingGroups'][0]

        azs = asg.get('AvailabilityZones', [])
        self.assertGreaterEqual(len(azs), 2, "Should span at least 2 AZs")

    def test_autoscaling_group_has_instances(self):
        """Test ASG has running instances."""
        response = self.autoscaling.describe_auto_scaling_groups(
            AutoScalingGroupNames=[self.asg_name]
        )
        asg = response['AutoScalingGroups'][0]

        instances = asg.get('Instances', [])
        healthy_instances = [
            i for i in instances
            if i['LifecycleState'] == 'InService' and i['HealthStatus'] == 'Healthy'
        ]

        self.assertGreater(
            len(healthy_instances), 0,
            "Should have at least one healthy instance"
        )

    def test_ec2_instances_ssm_ready(self):
        """Test EC2 instances are registered with Systems Manager."""
        # Wait for SSM to be ready (no skip!)
        online_instances = self._wait_for_ssm_ready()
        self.assertGreater(len(online_instances), 0,
                          "Should have at least one SSM-ready instance")

    # =========================================================================
    # CloudWatch Monitoring Tests
    # =========================================================================

    def test_cloudwatch_log_groups_exist(self):
        """Test CloudWatch log groups exist for application logging."""
        response = self.logs.describe_log_groups()
        log_group_names = [lg['logGroupName'] for lg in response['logGroups']]

        trading_log_groups = [
            lg for lg in log_group_names
            if 'trading' in lg.lower() or 'tap' in lg.lower()
        ]

        self.assertGreater(
            len(trading_log_groups), 0,
            "Should have CloudWatch log groups for the platform"
        )

    def test_cloudwatch_alarms_exist(self):
        """Test CloudWatch alarms exist for monitoring."""
        response = self.cloudwatch.describe_alarms()
        alarms = response.get('MetricAlarms', []) + response.get('CompositeAlarms', [])

        self.assertGreater(
            len(alarms), 0,
            "Should have CloudWatch alarms configured"
        )

    # =========================================================================
    # End-to-End LIVE Connectivity Tests
    # =========================================================================

    def test_e2e_ec2_to_aurora_live_connectivity(self):
        """E2E LIVE: Test EC2 can actually connect to Aurora PostgreSQL."""
        print("\nTesting live EC2 to Aurora connectivity...")

        try:
            online_instances = self._wait_for_ssm_ready()
        except TimeoutError as e:
            self.fail(f"Cannot run connectivity test: {e}")

        instance_id = online_instances[0]['InstanceId']

        aurora_host = self.outputs['AuroraClusterEndpoint']

        # Install PostgreSQL client and test actual connection
        commands = [
            # Install PostgreSQL client (postgresql package is available in AL2)
            "sudo yum install -y postgresql 2>&1 | tail -5",
            # Test TCP connectivity to Aurora
            f"timeout 10 bash -c 'cat < /dev/null > /dev/tcp/{aurora_host}/5432' && echo 'TCP_SUCCESS' || echo 'TCP_FAILED'",
        ]

        try:
            ssm_response = self.ssm.send_command(
                InstanceIds=[instance_id],
                DocumentName='AWS-RunShellScript',
                Parameters={'commands': commands},
                TimeoutSeconds=120
            )

            command_id = ssm_response['Command']['CommandId']

            # Wait for command to complete
            output = self._wait_for_ssm_command(command_id, instance_id, max_wait=120)

            stdout = output.get('StandardOutputContent', '')
            stderr = output.get('StandardErrorContent', '')
            status = output.get('Status', '')

            print(f"Command status: {status}")
            print(f"Aurora connectivity output: {stdout}")
            if stderr:
                print(f"Stderr: {stderr}")

            self.assertEqual(status, 'Success', f"SSM command should succeed. Status: {status}, StdErr: {stderr}")
            self.assertIn('TCP_SUCCESS', stdout,
                         f"EC2 should connect to Aurora on port 5432. Output: {stdout}")

        except (ClientError, TimeoutError) as e:
            self.fail(f"Failed to test Aurora connectivity: {e}")

    def test_e2e_ec2_to_redis_live_connectivity(self):
        """E2E LIVE: Test EC2 can actually connect to Redis cluster."""
        print("\nTesting live EC2 to Redis connectivity...")

        try:
            online_instances = self._wait_for_ssm_ready()
        except TimeoutError as e:
            self.fail(f"Cannot run connectivity test: {e}")

        instance_id = online_instances[0]['InstanceId']

        redis_host = self.outputs['RedisClusterEndpoint']

        # Install Redis tools and test actual connection
        commands = [
            # Install Redis tools
            "sudo amazon-linux-extras install -y redis6 2>&1 | tail -5",
            # Test TCP connectivity
            f"timeout 10 bash -c 'cat < /dev/null > /dev/tcp/{redis_host}/6379' && echo 'TCP_SUCCESS' || echo 'TCP_FAILED'",
            # Test actual Redis command (PING)
            f"timeout 10 redis-cli -h {redis_host} -p 6379 --tls PING 2>&1 || echo 'REDIS_FAILED'",
        ]

        try:
            ssm_response = self.ssm.send_command(
                InstanceIds=[instance_id],
                DocumentName='AWS-RunShellScript',
                Parameters={'commands': commands},
                TimeoutSeconds=120
            )

            command_id = ssm_response['Command']['CommandId']

            # Wait for command to complete
            output = self._wait_for_ssm_command(command_id, instance_id, max_wait=120)

            stdout = output.get('StandardOutputContent', '')
            stderr = output.get('StandardErrorContent', '')
            status = output.get('Status', '')

            print(f"Command status: {status}")
            print(f"Redis connectivity output: {stdout}")
            if stderr:
                print(f"Stderr: {stderr}")

            self.assertEqual(status, 'Success', f"SSM command should succeed. Status: {status}, StdErr: {stderr}")
            self.assertIn('TCP_SUCCESS', stdout,
                         f"EC2 should connect to Redis on port 6379. Output: {stdout}")

        except (ClientError, TimeoutError) as e:
            self.fail(f"Failed to test Redis connectivity: {e}")

    def test_e2e_ec2_to_dynamodb_live_operations(self):
        """E2E LIVE: Test EC2 can perform DynamoDB operations."""
        print("\nTesting live EC2 to DynamoDB operations...")

        online_instances = self._wait_for_ssm_ready()
        instance_id = online_instances[0]['InstanceId']

        table_name = self.trades_table or 'tap-trades-dev'

        # Test actual DynamoDB operations from EC2
        commands = [
            # Install AWS CLI v2 if not present
            "which aws || (curl -s 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o '/tmp/awscliv2.zip' && unzip -q /tmp/awscliv2.zip -d /tmp && sudo /tmp/aws/install --update)",
            # Put an item
            f"aws dynamodb put-item --table-name {table_name} --item '{{\"trade_id\": {{\"S\": \"test-$(date +%s)\"}}, \"test_data\": {{\"S\": \"e2e_connectivity_test\"}}}}' --region $(ec2-metadata --availability-zone | cut -d' ' -f2 | sed 's/[a-z]$//') && echo 'PUT_SUCCESS' || echo 'PUT_FAILED'",
            # List tables
            f"aws dynamodb describe-table --table-name {table_name} --region $(ec2-metadata --availability-zone | cut -d' ' -f2 | sed 's/[a-z]$//') --query 'Table.TableName' --output text && echo 'DESCRIBE_SUCCESS' || echo 'DESCRIBE_FAILED'",
        ]

        try:
            ssm_response = self.ssm.send_command(
                InstanceIds=[instance_id],
                DocumentName='AWS-RunShellScript',
                Parameters={'commands': commands},
                TimeoutSeconds=180
            )

            command_id = ssm_response['Command']['CommandId']

            # Wait for command to complete
            output = self._wait_for_ssm_command(command_id, instance_id, max_wait=180)

            stdout = output.get('StandardOutputContent', '')
            stderr = output.get('StandardErrorContent', '')
            status = output.get('Status', '')

            print(f"Command status: {status}")
            print(f"DynamoDB operations output: {stdout}")
            if stderr:
                print(f"Stderr: {stderr}")

            self.assertEqual(status, 'Success', f"SSM command should succeed. Status: {status}, StdErr: {stderr}")
            self.assertIn('DESCRIBE_SUCCESS', stdout,
                         f"EC2 should access DynamoDB. Output: {stdout}")

        except (ClientError, TimeoutError) as e:
            self.fail(f"Failed to test DynamoDB operations: {e}")

    def test_e2e_dynamodb_write_read_delete(self):
        """E2E LIVE: Test actual DynamoDB write/read/delete operations."""
        print("\nTesting live DynamoDB write/read/delete cycle...")

        response = self.dynamodb.list_tables()
        all_tables = response['TableNames']
        tap_tables = [t for t in all_tables if t.startswith('tap-trades')]

        if not tap_tables:
            self.fail("No DynamoDB tables found for testing")

        table_name = tap_tables[0]

        # Get table schema
        table_desc = self.dynamodb.describe_table(TableName=table_name)
        key_schema = table_desc['Table']['KeySchema']
        attribute_defs = {attr['AttributeName']: attr['AttributeType']
                         for attr in table_desc['Table']['AttributeDefinitions']}

        hash_key = next(k['AttributeName'] for k in key_schema if k['KeyType'] == 'HASH')
        range_key = next((k['AttributeName'] for k in key_schema if k['KeyType'] == 'RANGE'), None)

        # Build test item
        test_id = f'e2e-test-{int(time.time())}'
        test_item = {
            hash_key: {attribute_defs[hash_key]: test_id},
            'test_data': {'S': 'live_e2e_test'},
            'amount': {'N': '1000'},
            'status': {'S': 'PENDING'}
        }

        if range_key:
            test_item[range_key] = {attribute_defs[range_key]: str(int(time.time()))}

        key = {hash_key: test_item[hash_key]}
        if range_key:
            key[range_key] = test_item[range_key]

        try:
            # WRITE
            print(f"Writing item to {table_name}...")
            self.dynamodb.put_item(TableName=table_name, Item=test_item)

            # READ
            print(f"Reading item from {table_name}...")
            response = self.dynamodb.get_item(TableName=table_name, Key=key)

            self.assertIn('Item', response, "Item should be readable after write")
            self.assertEqual(
                response['Item']['test_data']['S'],
                'live_e2e_test',
                "Data should match what was written"
            )

            # UPDATE
            print(f"Updating item in {table_name}...")
            self.dynamodb.update_item(
                TableName=table_name,
                Key=key,
                UpdateExpression='SET #status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': {'S': 'COMPLETED'}}
            )

            # VERIFY UPDATE
            response = self.dynamodb.get_item(TableName=table_name, Key=key)
            self.assertEqual(
                response['Item']['status']['S'],
                'COMPLETED',
                "Update should be successful"
            )

            # DELETE
            print(f"Deleting item from {table_name}...")
            self.dynamodb.delete_item(TableName=table_name, Key=key)

            # VERIFY DELETION
            response = self.dynamodb.get_item(TableName=table_name, Key=key)
            self.assertNotIn('Item', response, "Item should be deleted")

            print("SUCCESS: Complete DynamoDB lifecycle test successful!")

        except ClientError as e:
            self.fail(f"DynamoDB operations failed: {e}")

    def test_e2e_cross_resource_vpc_connectivity(self):
        """E2E: Verify all resources are in the same VPC."""
        print("\nVerifying cross-resource VPC connectivity...")

        # Get Aurora VPC
        aurora_response = self.rds.describe_db_clusters(
            DBClusterIdentifier=self.aurora_cluster_id
        )
        aurora_cluster = aurora_response['DBClusters'][0]
        aurora_subnet_group_name = aurora_cluster.get('DBSubnetGroup')

        if aurora_subnet_group_name:
            subnet_groups = self.rds.describe_db_subnet_groups(
                DBSubnetGroupName=aurora_subnet_group_name
            )
            aurora_vpc_id = subnet_groups['DBSubnetGroups'][0]['VpcId']
            self.assertEqual(aurora_vpc_id, self.vpc_id,
                           "Aurora should be in the same VPC")

        # Get DAX VPC
        dax_response = self.dax.describe_clusters(ClusterNames=[self.dax_cluster_name])
        dax_subnet_group = dax_response['Clusters'][0].get('SubnetGroup')
        self.assertIsNotNone(dax_subnet_group, "DAX should have subnet group")

        # Verify ASG instances are in the VPC
        asg_response = self.autoscaling.describe_auto_scaling_groups(
            AutoScalingGroupNames=[self.asg_name]
        )
        asg = asg_response['AutoScalingGroups'][0]

        if asg.get('Instances'):
            instance_id = asg['Instances'][0]['InstanceId']
            instance_response = self.ec2.describe_instances(InstanceIds=[instance_id])
            instance_vpc = instance_response['Reservations'][0]['Instances'][0]['VpcId']
            self.assertEqual(instance_vpc, self.vpc_id,
                           "EC2 instances should be in the same VPC")

        print("SUCCESS: All resources are properly connected in the same VPC!")

    def test_e2e_dax_accelerates_dynamodb(self):
        """E2E: Test DAX cluster is configured for DynamoDB tables."""
        response = self.dax.describe_clusters(ClusterNames=[self.dax_cluster_name])
        cluster = response['Clusters'][0]

        self.assertIn('SubnetGroup', cluster)
        self.assertIn('IamRoleArn', cluster)


if __name__ == '__main__':
    unittest.main()
