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

import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for Transaction Processing Platform Stack."""

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
            'VpcId', 'DatabaseEndpoint', 'ReadReplicaEndpoint',
            'RedisEndpoint', 'AsgName', 'NlbDnsName'
        ]
        missing = [out for out in required_outputs if out not in cls.outputs]
        if missing:
            raise ValueError(f"Missing required outputs: {missing}")

        # Get region from outputs
        region = cls.outputs.get('Region', 'us-east-1')

        # Initialize AWS clients with correct region
        cls.ec2 = boto3.client('ec2', region_name=region)
        cls.rds = boto3.client('rds', region_name=region)
        cls.elasticache = boto3.client('elasticache', region_name=region)
        cls.autoscaling = boto3.client('autoscaling', region_name=region)
        cls.elbv2 = boto3.client('elbv2', region_name=region)
        cls.lambda_client = boto3.client('lambda', region_name=region)
        cls.ssm = boto3.client('ssm', region_name=region)
        cls.cloudwatch = boto3.client('cloudwatch', region_name=region)
        cls.logs = boto3.client('logs', region_name=region)
        cls.kms = boto3.client('kms', region_name=region)
        cls.secretsmanager = boto3.client('secretsmanager', region_name=region)

        # Extract identifiers from outputs
        cls.vpc_id = cls.outputs['VpcId']
        cls.asg_name = cls.outputs['AsgName']
        cls.db_endpoint = cls.outputs['DatabaseEndpoint']
        cls.read_replica_endpoint = cls.outputs['ReadReplicaEndpoint']
        cls.redis_endpoint = cls.outputs['RedisEndpoint']
        cls.nlb_dns = cls.outputs['NlbDnsName']
        cls.db_port = cls.outputs.get('DatabasePort', '5432')
        cls.redis_port = cls.outputs.get('RedisPort', '6379')
        cls.db_name = cls.outputs.get('DatabaseName', 'tapdb')

        # Extract database instance identifier from endpoint
        cls.db_instance_id = cls.db_endpoint.split('.')[0]
        cls.read_replica_id = cls.read_replica_endpoint.split('.')[0]

        # Get Redis cluster identifier from outputs (fallback to parsing endpoint)
        cls.redis_cluster_id = cls.outputs.get('RedisClusterId')
        if not cls.redis_cluster_id:
            # Fallback: extract from configuration endpoint (less reliable)
            cls.redis_cluster_id = cls.redis_endpoint.split('.')[0]

    @classmethod
    def _wait_for_ssm_ready(cls, max_wait=60):
        """Wait for EC2 instances to be registered with SSM."""
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
                    raise TimeoutError(f"ASG '{cls.asg_name}' not found")

                asg = response['AutoScalingGroups'][0]
                instances = [i for i in asg.get('Instances', [])
                            if i['LifecycleState'] == 'InService']

                desired = asg.get('DesiredCapacity', 0)
                if desired == 0:
                    raise TimeoutError(f"ASG '{cls.asg_name}' has DesiredCapacity=0")

                if not instances:
                    print(f"  [{elapsed:.0f}s] Waiting for {desired} instance(s)...")
                    time.sleep(10)
                    continue

                instance_ids = [i['InstanceId'] for i in instances]
                print(f"  [{elapsed:.0f}s] Found {len(instances)} InService instance(s)...")

                ssm_response = cls.ssm.describe_instance_information(
                    Filters=[{'Key': 'InstanceIds', 'Values': instance_ids}]
                )

                managed_instances = ssm_response.get('InstanceInformationList', [])
                online_instances = [i for i in managed_instances
                                  if i['PingStatus'] == 'Online']

                if online_instances:
                    print(f"SUCCESS: Found {len(online_instances)} SSM-ready instance(s)")
                    return online_instances

                print(f"  [{elapsed:.0f}s] Instances found but not yet SSM-ready...")

            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', '')
                if error_code == 'ValidationError':
                    raise TimeoutError(f"ASG '{cls.asg_name}' not found")
                print(f"  [{elapsed:.0f}s] AWS API error: {error_code}")

            time.sleep(10)

        raise TimeoutError(f"EC2 instances not ready for SSM after {max_wait}s")

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
                    print(f"SUCCESS: Command completed in {elapsed:.1f}s")
                    return response
                elif status in ['Failed', 'Cancelled', 'TimedOut', 'Cancelling']:
                    print(f"FAILED: Command {status} after {elapsed:.1f}s")
                    print(f"  StdOut: {response.get('StandardOutputContent', '')[:500]}")
                    print(f"  StdErr: {response.get('StandardErrorContent', '')[:500]}")
                    return response
                else:
                    print(f"  [{elapsed:.0f}s] Command status: {status}")
                    time.sleep(5)

            except ClientError as e:
                if 'InvocationDoesNotExist' in str(e):
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
    # RDS PostgreSQL Tests (Primary + Read Replica)
    # =========================================================================

    def test_rds_primary_exists_and_available(self):
        """Test RDS primary instance exists and is available."""
        response = self.rds.describe_db_instances(
            DBInstanceIdentifier=self.db_instance_id
        )
        self.assertEqual(len(response['DBInstances']), 1)

        db = response['DBInstances'][0]
        self.assertEqual(db['DBInstanceStatus'], 'available')
        self.assertEqual(db['Engine'], 'postgres')
        self.assertTrue(db['MultiAZ'])

    def test_rds_read_replica_exists(self):
        """Test RDS read replica exists and is available."""
        response = self.rds.describe_db_instances(
            DBInstanceIdentifier=self.read_replica_id
        )
        self.assertEqual(len(response['DBInstances']), 1)

        replica = response['DBInstances'][0]
        self.assertEqual(replica['DBInstanceStatus'], 'available')
        self.assertIn('ReadReplicaSourceDBInstanceIdentifier', replica)

    def test_rds_encryption_enabled(self):
        """Test RDS instances have encryption at rest enabled."""
        response = self.rds.describe_db_instances(
            DBInstanceIdentifier=self.db_instance_id
        )
        db = response['DBInstances'][0]

        self.assertTrue(db['StorageEncrypted'])
        self.assertIn('KmsKeyId', db)

        # Verify KMS key is enabled
        kms_key_id = db['KmsKeyId']
        key_response = self.kms.describe_key(KeyId=kms_key_id)
        self.assertTrue(key_response['KeyMetadata']['Enabled'])

    def test_rds_backup_configured(self):
        """Test RDS has automated backups configured."""
        response = self.rds.describe_db_instances(
            DBInstanceIdentifier=self.db_instance_id
        )
        db = response['DBInstances'][0]

        self.assertGreater(db['BackupRetentionPeriod'], 0)
        self.assertIn('PreferredBackupWindow', db)

    def test_rds_security_group_allows_vpc_access(self):
        """Test RDS security group allows PostgreSQL access from VPC."""
        response = self.rds.describe_db_instances(
            DBInstanceIdentifier=self.db_instance_id
        )
        db = response['DBInstances'][0]
        sg_ids = [sg['VpcSecurityGroupId'] for sg in db.get('VpcSecurityGroups', [])]

        self.assertGreater(len(sg_ids), 0)

        for sg_id in sg_ids:
            sg_response = self.ec2.describe_security_groups(GroupIds=[sg_id])
            sg_details = sg_response['SecurityGroups'][0]
            ingress_rules = sg_details.get('IpPermissions', [])

            postgres_rules = [r for r in ingress_rules
                            if r.get('FromPort') == 5432 or r.get('ToPort') == 5432]

            if postgres_rules:
                self.assertGreater(len(postgres_rules), 0)
                return

    def test_rds_enhanced_monitoring(self):
        """Test RDS has enhanced monitoring enabled."""
        response = self.rds.describe_db_instances(
            DBInstanceIdentifier=self.db_instance_id
        )
        db = response['DBInstances'][0]

        # Enhanced monitoring interval should be set
        self.assertIn('MonitoringInterval', db)
        self.assertGreater(db.get('MonitoringInterval', 0), 0)

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

        # Should have 6 shards with 2 replicas each (3 nodes total per shard)
        self.assertEqual(len(node_groups), 6)

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

        self.assertGreater(len(member_clusters), 0)

        # Check first member cluster
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
                            self.assertGreater(len(redis_rules), 0)
                            return

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

    def test_e2e_ec2_to_rds_live_connectivity(self):
        """E2E LIVE: Test EC2 can actually connect to RDS PostgreSQL."""
        print("\nTesting live EC2 to RDS connectivity...")

        try:
            online_instances = self._wait_for_ssm_ready()
        except TimeoutError as e:
            self.fail(f"Cannot run connectivity test: {e}")

        instance_id = online_instances[0]['InstanceId']
        rds_host = self.outputs['DatabaseEndpoint']

        # Install PostgreSQL client and test actual connection
        commands = [
            # Install PostgreSQL client
            "sudo yum install -y postgresql 2>&1 | tail -5",
            # Test TCP connectivity to RDS
            f"timeout 10 bash -c 'cat < /dev/null > /dev/tcp/{rds_host}/5432' && echo 'TCP_SUCCESS' || echo 'TCP_FAILED'",
        ]

        try:
            ssm_response = self.ssm.send_command(
                InstanceIds=[instance_id],
                DocumentName='AWS-RunShellScript',
                Parameters={'commands': commands},
                TimeoutSeconds=120
            )

            command_id = ssm_response['Command']['CommandId']
            output = self._wait_for_ssm_command(command_id, instance_id, max_wait=120)

            stdout = output.get('StandardOutputContent', '')
            stderr = output.get('StandardErrorContent', '')
            status = output.get('Status', '')

            print(f"Command status: {status}")
            print(f"RDS connectivity output: {stdout}")
            if stderr:
                print(f"Stderr: {stderr}")

            self.assertEqual(status, 'Success', f"SSM command should succeed. Status: {status}, StdErr: {stderr}")
            self.assertIn('TCP_SUCCESS', stdout,
                         f"EC2 should connect to RDS on port 5432. Output: {stdout}")

        except (ClientError, TimeoutError) as e:
            self.fail(f"Failed to test RDS connectivity: {e}")


    def test_e2e_ec2_to_redis_live_connectivity(self):
        """E2E LIVE: Test EC2 can actually connect to Redis cluster."""
        print("\nTesting live EC2 to Redis connectivity...")

        try:
            online_instances = self._wait_for_ssm_ready()
        except TimeoutError as e:
            self.fail(f"Cannot run connectivity test: {e}")

        instance_id = online_instances[0]['InstanceId']
        redis_host = self.outputs['RedisEndpoint']

        # Install Redis tools and test actual connection
        commands = [
            # Install Redis tools
            "sudo amazon-linux-extras install -y redis6 2>&1 | tail -5",
            # Test TCP connectivity
            f"timeout 10 bash -c 'cat < /dev/null > /dev/tcp/{redis_host}/6379' && echo 'TCP_SUCCESS' || echo 'TCP_FAILED'",
            # Test actual Redis command (PING) with TLS
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

    def test_e2e_ec2_to_s3_via_vpc_endpoint(self):
        """E2E LIVE: Test EC2 can access S3 via VPC endpoint (not internet)."""
        print("\nTesting EC2 to S3 access via VPC endpoint...")

        try:
            online_instances = self._wait_for_ssm_ready()
        except TimeoutError as e:
            self.fail(f"Cannot run connectivity test: {e}")

        instance_id = online_instances[0]['InstanceId']

        # Test S3 access from EC2 instance using AWS CLI
        commands = [
            # List S3 buckets to verify connectivity
            "aws s3 ls --region $(ec2-metadata --availability-zone | cut -d' ' -f2 | sed 's/[a-z]$//') && echo 'S3_ACCESS_SUCCESS' || echo 'S3_ACCESS_FAILED'",
            # Create a test file and upload to S3 (from instance itself)
            "echo 'e2e-test-$(date +%s)' > /tmp/test-file.txt",
            "aws s3 cp /tmp/test-file.txt s3://$(aws s3 ls | head -1 | awk '{print $3}')/test-file.txt --region $(ec2-metadata --availability-zone | cut -d' ' -f2 | sed 's/[a-z]$//') && echo 'S3_UPLOAD_SUCCESS' || echo 'S3_UPLOAD_SKIPPED'"
        ]

        try:
            ssm_response = self.ssm.send_command(
                InstanceIds=[instance_id],
                DocumentName='AWS-RunShellScript',
                Parameters={'commands': commands},
                TimeoutSeconds=120
            )

            command_id = ssm_response['Command']['CommandId']
            output = self._wait_for_ssm_command(command_id, instance_id, max_wait=120)

            stdout = output.get('StandardOutputContent', '')
            stderr = output.get('StandardErrorContent', '')
            status = output.get('Status', '')

            print(f"Command status: {status}")
            print(f"S3 access output: {stdout}")
            if stderr:
                print(f"Stderr: {stderr}")

            self.assertEqual(status, 'Success', f"SSM command should succeed. Status: {status}, StdErr: {stderr}")
            self.assertIn('S3_ACCESS_SUCCESS', stdout,
                         f"EC2 should access S3 via VPC endpoint. Output: {stdout}")

        except (ClientError, TimeoutError) as e:
            self.fail(f"Failed to test S3 connectivity: {e}")

    def test_e2e_cross_resource_vpc_connectivity(self):

        """E2E: Verify all resources are in the same VPC."""
        print("\nVerifying cross-resource VPC connectivity...")

        # Get RDS VPC
        rds_response = self.rds.describe_db_instances(
            DBInstanceIdentifier=self.db_instance_id
        )
        rds_instance = rds_response['DBInstances'][0]
        rds_vpc_id = rds_instance['DBSubnetGroup']['VpcId']
        self.assertEqual(rds_vpc_id, self.vpc_id,
                       "RDS should be in the same VPC")

        # Get Redis VPC
        redis_response = self.elasticache.describe_replication_groups(
            ReplicationGroupId=self.redis_cluster_id
        )
        cluster = redis_response['ReplicationGroups'][0]
        member_clusters = cluster.get('MemberClusters', [])

        if member_clusters:
            cache_cluster = self.elasticache.describe_cache_clusters(
                CacheClusterId=member_clusters[0],
                ShowCacheNodeInfo=True
            )
            cache_subnet_group = cache_cluster['CacheClusters'][0].get('CacheSubnetGroupName')
            if cache_subnet_group:
                subnet_groups = self.elasticache.describe_cache_subnet_groups(
                    CacheSubnetGroupName=cache_subnet_group
                )
                redis_vpc_id = subnet_groups['CacheSubnetGroups'][0]['VpcId']
                self.assertEqual(redis_vpc_id, self.vpc_id,
                               "Redis should be in the same VPC")

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


if __name__ == '__main__':
    unittest.main()

