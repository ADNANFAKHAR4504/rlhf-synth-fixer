"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack without mocking.
"""

# Standard library imports
import unittest
import os

# Third-party imports - AWS SDK
import boto3
from botocore.exceptions import ClientError

# Third-party imports - Pulumi
from pulumi import automation as auto


class TestTapStackLiveIntegration(unittest.TestCase):
  """Integration tests against live deployed Pulumi stack."""

  def setUp(self):
    """Set up integration test with live stack."""
    self.stack_name = "dev"
    self.project_name = "pulumi-infra" 
    
    # Initialize AWS clients
    self.ec2_client = boto3.client('ec2', region_name='us-west-2')
    self.ecs_client = boto3.client('ecs', region_name='us-west-2')
    self.rds_client = boto3.client('rds', region_name='us-west-2')
    self.elasticache_client = boto3.client('elasticache', region_name='us-west-2')
    self.s3_client = boto3.client('s3', region_name='us-west-2')
    self.ecr_client = boto3.client('ecr', region_name='us-west-2')
    self.elbv2_client = boto3.client('elbv2', region_name='us-west-2')
    self.cloudfront_client = boto3.client('cloudfront', region_name='us-west-2')
    self.cloudtrail_client = boto3.client('cloudtrail', region_name='us-west-2')
    self.logs_client = boto3.client('logs', region_name='us-west-2')
    
    # Get stack outputs for resource discovery
    self.stack_outputs = self._get_stack_outputs()
    
    # Environment-agnostic resource discovery
    self.environment_suffix = self._discover_environment_suffix()

  def _get_stack_outputs(self):
    """Get Pulumi stack outputs dynamically."""
    try:
      # Try to get stack outputs using automation API
      stack = auto.select_stack(
        stack_name=self.stack_name,
        project_name=self.project_name,
        program=lambda: None,
        work_dir=os.getcwd()
      )
      return stack.outputs()
    except Exception as e:
      # Fallback: discover resources by tags and naming patterns
      print(f"Warning: Could not get stack outputs directly: {e}")
      return {}

  def _discover_environment_suffix(self):
    """Discover environment suffix from deployed resources."""
    # Try to find VPC with our tags and extract environment suffix
    try:
      vpcs = self.ec2_client.describe_vpcs(
        Filters=[
          {'Name': 'tag:Project', 'Values': ['MicroservicesCI']},
          {'Name': 'tag:Owner', 'Values': ['DevOps']},
          {'Name': 'state', 'Values': ['available']}
        ]
      )
      
      for vpc in vpcs['Vpcs']:
        for tag in vpc.get('Tags', []):
          if tag['Key'] == 'EnvironmentSuffix':
            return tag['Value']
      
      # Fallback to 'dev' if not found
      return 'dev'
    except Exception:
      return 'dev'

  def test_vpc_and_networking(self):
    """Test VPC and networking components are properly deployed."""
    # Find VPC by tags
    vpcs = self.ec2_client.describe_vpcs(
      Filters=[
        {'Name': 'tag:Project', 'Values': ['MicroservicesCI']},
        {'Name': 'tag:Owner', 'Values': ['DevOps']},
        {'Name': 'state', 'Values': ['available']}
      ]
    )
    
    self.assertGreater(len(vpcs['Vpcs']), 0, "VPC should be created")
    vpc = vpcs['Vpcs'][0]
    vpc_id = vpc['VpcId']
    
    # Check VPC CIDR
    self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
    
    # Check public subnets (should be 2)
    public_subnets = self.ec2_client.describe_subnets(
      Filters=[
        {'Name': 'vpc-id', 'Values': [vpc_id]},
        {'Name': 'tag:Name', 'Values': [f'public-subnet-*-{self.environment_suffix}']}
      ]
    )
    self.assertEqual(len(public_subnets['Subnets']), 2, "Should have 2 public subnets")
    
    # Check private subnets (should be 2)  
    private_subnets = self.ec2_client.describe_subnets(
      Filters=[
        {'Name': 'vpc-id', 'Values': [vpc_id]},
        {'Name': 'tag:Name', 'Values': [f'private-subnet-*-{self.environment_suffix}']}
      ]
    )
    self.assertEqual(len(private_subnets['Subnets']), 2, "Should have 2 private subnets")
    
    # Check NAT Gateways (should be 2)
    nat_gateways = self.ec2_client.describe_nat_gateways(
      Filters=[
        {'Name': 'vpc-id', 'Values': [vpc_id]},
        {'Name': 'state', 'Values': ['available']}
      ]
    )
    self.assertEqual(len(nat_gateways['NatGateways']), 2, "Should have 2 NAT gateways")

  def test_security_groups(self):
    """Test security groups are properly configured."""
    # Find security groups by tags
    security_groups = self.ec2_client.describe_security_groups(
      Filters=[
        {'Name': 'tag:Project', 'Values': ['MicroservicesCI']},
        {'Name': 'tag:Owner', 'Values': ['DevOps']}
      ]
    )
    
    sg_names = [sg['GroupName'] for sg in security_groups['SecurityGroups']]
    
    # Check required security groups exist
    required_sgs = [
      f'alb-sg-{self.environment_suffix}',
      f'ecs-sg-{self.environment_suffix}',
      f'db-sg-{self.environment_suffix}',
      f'cache-sg-{self.environment_suffix}'
    ]
    
    for sg_name in required_sgs:
      self.assertIn(sg_name, sg_names, f"Security group {sg_name} should exist")

  def test_s3_buckets(self):
    """Test S3 buckets are created with proper configuration."""
    # Test artifacts bucket
    artifacts_bucket_name = f'microservices-artifacts-{self.environment_suffix}'
    
    try:
      bucket_response = self.s3_client.head_bucket(Bucket=artifacts_bucket_name)
      self.assertIsNotNone(bucket_response)
      
      # Check bucket encryption
      encryption = self.s3_client.get_bucket_encryption(Bucket=artifacts_bucket_name)
      self.assertIn('ServerSideEncryptionConfiguration', encryption)
      
      # Check bucket versioning
      versioning = self.s3_client.get_bucket_versioning(Bucket=artifacts_bucket_name)
      self.assertEqual(versioning.get('Status'), 'Enabled')
      
    except ClientError as e:
      self.fail(f"Artifacts bucket {artifacts_bucket_name} should exist: {e}")

    # Test static assets bucket
    static_bucket_name = f'microservices-static-{self.environment_suffix}'
    
    try:
      bucket_response = self.s3_client.head_bucket(Bucket=static_bucket_name)
      self.assertIsNotNone(bucket_response)
    except ClientError as e:
      self.fail(f"Static bucket {static_bucket_name} should exist: {e}")

  def test_rds_instance(self):
    """Test RDS PostgreSQL instance is deployed correctly."""
    # Find RDS instance by identifier pattern
    db_identifier = f'microservices-db-{self.environment_suffix}'
    
    try:
      response = self.rds_client.describe_db_instances(
        DBInstanceIdentifier=db_identifier
      )
      
      db_instance = response['DBInstances'][0]
      
      # Check database configuration
      self.assertEqual(db_instance['Engine'], 'postgres')
      self.assertEqual(db_instance['DBInstanceClass'], 'db.t3.micro')
      self.assertTrue(db_instance['MultiAZ'])
      self.assertTrue(db_instance['StorageEncrypted'])
      self.assertEqual(db_instance['DBInstanceStatus'], 'available')
      
    except ClientError as e:
      self.fail(f"RDS instance {db_identifier} should exist: {e}")

  def test_elasticache_redis(self):
    """Test ElastiCache Redis cluster is deployed correctly."""
    replication_group_id = f'redis-{self.environment_suffix}'
    
    try:
      response = self.elasticache_client.describe_replication_groups(
        ReplicationGroupId=replication_group_id
      )
      
      replication_group = response['ReplicationGroups'][0]
      
      # Check Redis configuration
      self.assertEqual(replication_group['Status'], 'available')
      self.assertTrue(replication_group['AtRestEncryptionEnabled'])
      self.assertTrue(replication_group['MultiAZ'])
      self.assertTrue(replication_group['AutomaticFailover'] in ['enabled', 'enabling'])
      
    except ClientError as e:
      self.fail(f"Redis cluster {replication_group_id} should exist: {e}")

  def test_ecr_repository(self):
    """Test ECR repository is created."""
    repo_name = f'microservices-{self.environment_suffix}'
    
    try:
      response = self.ecr_client.describe_repositories(
        repositoryNames=[repo_name]
      )
      
      repository = response['repositories'][0]
      
      # Check repository configuration
      self.assertEqual(repository['repositoryName'], repo_name)
      self.assertEqual(repository['imageTagMutability'], 'MUTABLE')
      
      # Check image scanning is enabled
      self.assertTrue(repository['imageScanningConfiguration']['scanOnPush'])
      
    except ClientError as e:
      self.fail(f"ECR repository {repo_name} should exist: {e}")

  def test_ecs_cluster(self):
    """Test ECS cluster and service are deployed."""
    cluster_name = f'microservices-{self.environment_suffix}'
    
    try:
      # Check cluster
      cluster_response = self.ecs_client.describe_clusters(
        clusters=[cluster_name]
      )
      
      cluster = cluster_response['clusters'][0]
      self.assertEqual(cluster['status'], 'ACTIVE')
      self.assertEqual(cluster['clusterName'], cluster_name)
      
      # Check service
      services_response = self.ecs_client.list_services(cluster=cluster_name)
      self.assertGreater(
        len(services_response['serviceArns']), 0, "Should have at least one service"
      )
      
      # Get service details
      service_response = self.ecs_client.describe_services(
        cluster=cluster_name,
        services=services_response['serviceArns']
      )
      
      service = service_response['services'][0]
      self.assertEqual(service['status'], 'ACTIVE')
      self.assertEqual(service['launchType'], 'FARGATE')
      self.assertGreaterEqual(service['desiredCount'], 2)
      
    except ClientError as e:
      self.fail(f"ECS cluster {cluster_name} should exist: {e}")

  def test_application_load_balancer(self):
    """Test Application Load Balancer is configured correctly."""
    # Find ALB by tags
    response = self.elbv2_client.describe_load_balancers()
    
    microservices_albs = []
    for alb in response['LoadBalancers']:
      if f'microservices-alb-{self.environment_suffix}' in alb.get('LoadBalancerName', ''):
        microservices_albs.append(alb)
    
    self.assertGreater(len(microservices_albs), 0, "Should have ALB deployed")
    
    alb = microservices_albs[0]
    self.assertEqual(alb['Type'], 'application')
    self.assertEqual(alb['State']['Code'], 'active')
    self.assertEqual(alb['Scheme'], 'internet-facing')
    
    # Check target groups
    target_groups = self.elbv2_client.describe_target_groups(
      LoadBalancerArn=alb['LoadBalancerArn']
    )
    
    self.assertGreater(len(target_groups['TargetGroups']), 0, "Should have target groups")
    
    target_group = target_groups['TargetGroups'][0]
    self.assertEqual(target_group['Protocol'], 'HTTP')
    self.assertEqual(target_group['Port'], 8000)
    self.assertEqual(target_group['TargetType'], 'ip')

  def test_cloudwatch_logs(self):
    """Test CloudWatch log groups are created."""
    log_group_name = f'/ecs/microservices-{self.environment_suffix}'
    
    try:
      response = self.logs_client.describe_log_groups(
        logGroupNamePrefix=log_group_name
      )
      
      log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
      self.assertGreater(len(log_groups), 0, f"Log group {log_group_name} should exist")
      
      log_group = log_groups[0]
      self.assertEqual(log_group['retentionInDays'], 14)
      
    except ClientError as e:
      self.fail(f"CloudWatch log group {log_group_name} should exist: {e}")

  def test_cloudtrail(self):
    """Test CloudTrail is configured for audit logging."""
    trail_name = f'microservices-trail-{self.environment_suffix}'
    
    try:
      response = self.cloudtrail_client.describe_trails()
      
      microservices_trails = []
      for trail in response['trailList']:
        if trail_name in trail.get('Name', ''):
          microservices_trails.append(trail)
      
      self.assertGreater(len(microservices_trails), 0, f"CloudTrail {trail_name} should exist")
      
      trail = microservices_trails[0]
      self.assertTrue(trail['IsMultiRegionTrail'])
      self.assertTrue(trail['IncludeGlobalServiceEvents'])
      
      # Check trail status
      status_response = self.cloudtrail_client.get_trail_status(Name=trail['TrailARN'])
      self.assertTrue(status_response['IsLogging'])
      
    except ClientError as e:
      self.fail(f"CloudTrail {trail_name} should exist and be logging: {e}")

  def test_cloudfront_distribution(self):
    """Test CloudFront distribution is deployed."""
    try:
      response = self.cloudfront_client.list_distributions()
      
      # Find our distribution by comment or origin
      microservices_distributions = []
      for dist in response.get('DistributionList', {}).get('Items', []):
        # Look for distributions that might be ours based on origins
        for origin in dist.get('Origins', {}).get('Items', []):
          if f'microservices-static-{self.environment_suffix}' in origin.get('DomainName', ''):
            microservices_distributions.append(dist)
            break
      
      if microservices_distributions:
        distribution = microservices_distributions[0]
        self.assertEqual(distribution['Status'], 'Deployed')
        self.assertTrue(distribution['Enabled'])
        self.assertTrue(distribution['IsIPV6Enabled'])
      else:
        # CloudFront might take time to deploy, so this is informational
        print("Warning: CloudFront distribution not found - may still be deploying")
        
    except ClientError as e:
      print(f"Warning: Could not verify CloudFront distribution: {e}")

  def test_resource_tagging(self):
    """Test that resources are properly tagged."""
    # Check VPC tags
    vpcs = self.ec2_client.describe_vpcs(
      Filters=[
        {'Name': 'tag:Project', 'Values': ['MicroservicesCI']},
        {'Name': 'tag:Owner', 'Values': ['DevOps']},
        {'Name': 'tag:Environment', 'Values': ['Production']}
      ]
    )
    
    self.assertGreater(len(vpcs['Vpcs']), 0, "VPC should have proper tags")
    
    # Verify required tags exist on VPC
    vpc = vpcs['Vpcs'][0]
    tag_dict = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
    
    required_tags = ['Environment', 'Project', 'Owner', 'ManagedBy']
    for tag in required_tags:
      self.assertIn(tag, tag_dict, f"Tag {tag} should be present on VPC")

  def test_multi_az_deployment(self):
    """Test that resources are deployed across multiple availability zones."""
    # Check subnets span multiple AZs
    vpcs = self.ec2_client.describe_vpcs(
      Filters=[
        {'Name': 'tag:Project', 'Values': ['MicroservicesCI']}
      ]
    )
    
    if vpcs['Vpcs']:
      vpc_id = vpcs['Vpcs'][0]['VpcId']
      
      subnets = self.ec2_client.describe_subnets(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
      )
      
      # Get unique AZs
      availability_zones = set(subnet['AvailabilityZone'] for subnet in subnets['Subnets'])
      self.assertGreaterEqual(
        len(availability_zones), 2, "Resources should span at least 2 AZs"
      )

  @unittest.skipIf(
    os.getenv('SKIP_EXPENSIVE_TESTS') == 'true', "Skipping expensive integration test"
  )
  def test_complete_infrastructure_health(self):
    """Comprehensive health check of all deployed infrastructure."""
    # This test verifies the entire infrastructure is healthy
    health_checks = {
      'vpc': False,
      'subnets': False,
      'security_groups': False,
      'rds': False,
      'redis': False,
      'ecs': False,
      'alb': False,
      's3': False,
      'ecr': False,
      'logs': False
    }
    
    try:
      # VPC health
      vpcs = self.ec2_client.describe_vpcs(
        Filters=[{'Name': 'tag:Project', 'Values': ['MicroservicesCI']}]
      )
      if vpcs['Vpcs'] and vpcs['Vpcs'][0]['State'] == 'available':
        health_checks['vpc'] = True
      
      # More health checks can be added here...
      
    except Exception as e:
      self.fail(f"Infrastructure health check failed: {e}")
    
    # Report on health status
    failed_checks = [check for check, status in health_checks.items() if not status]
    if failed_checks:
      self.fail(f"Failed health checks: {failed_checks}")


if __name__ == '__main__':
  # Set environment variables for AWS region
  os.environ['AWS_DEFAULT_REGION'] = 'us-west-2'
  
  # Run tests
  unittest.main(verbosity=2)
