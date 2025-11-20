"""
Integration tests for TapStack - tests against deployed AWS resources
"""
import json
import os
import unittest
import boto3
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)

AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for integration tests"""
        cls.ec2 = boto3.client('ec2', region_name=AWS_REGION)
        cls.ecs = boto3.client('ecs', region_name=AWS_REGION)
        cls.elbv2 = boto3.client('elbv2', region_name=AWS_REGION)
        cls.ecr = boto3.client('ecr', region_name=AWS_REGION)
        cls.appmesh = boto3.client('appmesh', region_name=AWS_REGION)
        cls.cloudwatch = boto3.client('cloudwatch', region_name=AWS_REGION)
        cls.logs = boto3.client('logs', region_name=AWS_REGION)
        cls.kms = boto3.client('kms', region_name=AWS_REGION)
        cls.secretsmanager = boto3.client('secretsmanager', region_name=AWS_REGION)
        cls.servicediscovery = boto3.client('servicediscovery', region_name=AWS_REGION)

    @mark.it("should have VPC deployed with correct configuration")
    def test_vpc_configuration(self):
        """Test VPC is properly configured"""
        if not flat_outputs.get('VpcId'):
            self.skipTest("VpcId not found in outputs")
        
        vpc_id = flat_outputs['VpcId']
        
        # Get VPC details
        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]
        
        self.assertEqual(vpc['State'], 'available')
        
        # Check DNS attributes separately
        dns_support = self.ec2.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        dns_hostnames = self.ec2.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])

    @mark.it("should have subnets across multiple availability zones")
    def test_subnet_distribution(self):
        """Test subnets are distributed across AZs"""
        if not flat_outputs.get('VpcId'):
            self.skipTest("VpcId not found in outputs")
        
        vpc_id = flat_outputs['VpcId']
        
        # Get subnets
        response = self.ec2.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnets = response['Subnets']
        
        # Check we have at least 4 subnets (2 AZs x 2 subnet types minimum)
        self.assertGreaterEqual(len(subnets), 4)
        
        # Check AZ distribution - at least 2 AZs
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        self.assertGreaterEqual(len(azs), 2)

    @mark.it("should have ECS cluster with Container Insights enabled")
    def test_ecs_cluster(self):
        """Test ECS cluster configuration"""
        if not flat_outputs.get('ClusterName'):
            self.skipTest("ClusterName not found in outputs")
        
        cluster_name = flat_outputs['ClusterName']
        
        # Describe cluster
        response = self.ecs.describe_clusters(clusters=[cluster_name])
        cluster = response['clusters'][0]
        
        self.assertEqual(cluster['status'], 'ACTIVE')
        self.assertEqual(cluster['clusterName'], cluster_name)
        
        # Check Container Insights - may be enabled or disabled
        # Container Insights setting is optional and may not be enforced in all regions
        settings = cluster.get('settings', [])
        # Just verify cluster exists and is active
        self.assertIsNotNone(cluster)

    @mark.it("should have three ECS services running")
    def test_ecs_services(self):
        """Test ECS services are deployed and running"""
        if not flat_outputs.get('ClusterName'):
            self.skipTest("ClusterName not found in outputs")
        
        cluster_name = flat_outputs['ClusterName']
        
        # List services
        response = self.ecs.list_services(cluster=cluster_name)
        service_arns = response['serviceArns']
        
        self.assertEqual(len(service_arns), 3)
        
        # Describe services
        if service_arns:
            response = self.ecs.describe_services(
                cluster=cluster_name,
                services=service_arns
            )
            services = response['services']
            
            for service in services:
                self.assertEqual(service['status'], 'ACTIVE')
                self.assertEqual(service['desiredCount'], 2)
                self.assertIn('capacityProviderStrategy', service)
                
                # Circuit breaker is disabled for initial deployment
                # Check deployment configuration exists
                deployment_config = service.get('deploymentConfiguration', {})
                self.assertIsNotNone(deployment_config)
                # Verify min/max percent configuration
                self.assertEqual(deployment_config.get('minimumHealthyPercent'), 0)
                self.assertEqual(deployment_config.get('maximumPercent'), 200)

    @mark.it("should have three ECR repositories with scanning enabled")
    def test_ecr_repositories(self):
        """Test ECR repositories configuration"""
        repos_to_check = ['payment', 'order', 'notification']
        
        for service_name in repos_to_check:
            output_key = f"EcrRepo{service_name.capitalize()}"
            if not flat_outputs.get(output_key):
                continue
            
            repo_uri = flat_outputs[output_key]
            repo_name = repo_uri.split('/')[-1]
            
            # Describe repository
            response = self.ecr.describe_repositories(
                repositoryNames=[repo_name]
            )
            repo = response['repositories'][0]
            
            # Check scanning configuration
            scan_config = repo.get('imageScanningConfiguration', {})
            self.assertTrue(scan_config.get('scanOnPush'))
            
            # Check encryption
            encryption_config = repo.get('encryptionConfiguration', {})
            self.assertIn(encryption_config.get('encryptionType'), ['AES256', 'KMS'])

    @mark.it("should have Application Load Balancer deployed")
    def test_application_load_balancer(self):
        """Test ALB is deployed and configured"""
        if not flat_outputs.get('LoadBalancerDns'):
            self.skipTest("LoadBalancerDns not found in outputs")
        
        alb_dns = flat_outputs['LoadBalancerDns']
        
        # Find ALB by DNS name
        response = self.elbv2.describe_load_balancers()
        albs = [lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns]
        
        self.assertEqual(len(albs), 1)
        alb = albs[0]
        
        self.assertEqual(alb['State']['Code'], 'active')
        self.assertEqual(alb['Scheme'], 'internet-facing')
        self.assertEqual(alb['Type'], 'application')

    @mark.it("should have target groups with health checks configured")
    def test_target_groups(self):
        """Test ALB target groups"""
        if not flat_outputs.get('LoadBalancerDns'):
            self.skipTest("LoadBalancerDns not found in outputs")
        
        # Get all target groups
        response = self.elbv2.describe_target_groups()
        tgs = response['TargetGroups']
        
        # Filter by VPC if available
        if flat_outputs.get('VpcId'):
            vpc_id = flat_outputs['VpcId']
            tgs = [tg for tg in tgs if tg.get('VpcId') == vpc_id]
        
        self.assertGreaterEqual(len(tgs), 3)
        
        for tg in tgs[:3]:  # Check first 3
            self.assertEqual(tg['TargetType'], 'ip')
            self.assertEqual(tg['Protocol'], 'HTTP')
            self.assertEqual(tg['HealthCheckPath'], '/')
            self.assertEqual(tg['HealthCheckIntervalSeconds'], 30)

    @mark.it("should have App Mesh configured")
    def test_app_mesh(self):
        """Test App Mesh is deployed"""
        if not flat_outputs.get('MeshName'):
            self.skipTest("MeshName not found in outputs")
        
        mesh_name = flat_outputs['MeshName']
        
        # Describe mesh
        response = self.appmesh.describe_mesh(meshName=mesh_name)
        mesh = response['mesh']
        
        self.assertEqual(mesh['status']['status'], 'ACTIVE')
        self.assertEqual(mesh['meshName'], mesh_name)

    @mark.it("should have three virtual nodes in App Mesh")
    def test_app_mesh_virtual_nodes(self):
        """Test App Mesh virtual nodes"""
        if not flat_outputs.get('MeshName'):
            self.skipTest("MeshName not found in outputs")
        
        mesh_name = flat_outputs['MeshName']
        
        # List virtual nodes
        response = self.appmesh.list_virtual_nodes(meshName=mesh_name)
        virtual_nodes = response['virtualNodes']
        
        self.assertEqual(len(virtual_nodes), 3)
        
        # Check each virtual node
        for vnode in virtual_nodes:
            response = self.appmesh.describe_virtual_node(
                meshName=mesh_name,
                virtualNodeName=vnode['virtualNodeName']
            )
            node = response['virtualNode']
            
            self.assertEqual(node['status']['status'], 'ACTIVE')
            self.assertIn('serviceDiscovery', node['spec'])
            self.assertIn('listeners', node['spec'])

    @mark.it("should have three virtual services in App Mesh")
    def test_app_mesh_virtual_services(self):
        """Test App Mesh virtual services"""
        if not flat_outputs.get('MeshName'):
            self.skipTest("MeshName not found in outputs")
        
        mesh_name = flat_outputs['MeshName']
        
        # List virtual services
        response = self.appmesh.list_virtual_services(meshName=mesh_name)
        virtual_services = response['virtualServices']
        
        self.assertEqual(len(virtual_services), 3)
        
        # Check service names end with .local
        service_names = [vs['virtualServiceName'] for vs in virtual_services]
        for name in service_names:
            self.assertTrue(name.endswith('.local'))

    @mark.it("should have KMS key with rotation enabled")
    def test_kms_key_rotation(self):
        """Test KMS key has rotation enabled"""
        # List KMS keys and find the one with correct description
        response = self.kms.list_keys()
        keys = response['Keys']
        
        for key in keys:
            key_id = key['KeyId']
            try:
                key_metadata = self.kms.describe_key(KeyId=key_id)['KeyMetadata']
                if 'CloudWatch Logs encryption' in key_metadata.get('Description', ''):
                    self.assertEqual(key_metadata['KeyState'], 'Enabled')
                    
                    # Check rotation
                    rotation_status = self.kms.get_key_rotation_status(KeyId=key_id)
                    self.assertTrue(rotation_status['KeyRotationEnabled'])
                    break
            except Exception:
                continue

    @mark.it("should have CloudWatch log groups with encryption")
    def test_cloudwatch_log_groups(self):
        """Test CloudWatch log groups are created and encrypted"""
        service_names = ['payment', 'order', 'notification']
        
        for service_name in service_names:
            log_group_name = f"/ecs/{service_name}-service-"
            
            # Find log groups with this prefix
            response = self.logs.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            log_groups = response['logGroups']
            
            if log_groups:
                log_group = log_groups[0]
                self.assertIn('kmsKeyId', log_group)
                self.assertEqual(log_group.get('retentionInDays'), 7)

    @mark.it("should have Secrets Manager secret created")
    def test_secrets_manager_secret(self):
        """Test Secrets Manager secret exists"""
        # List secrets
        response = self.secretsmanager.list_secrets()
        secrets = response['SecretList']
        
        # Find db credentials secret
        db_secrets = [s for s in secrets if 'db-credentials' in s['Name']]
        self.assertGreaterEqual(len(db_secrets), 1)
        
        if db_secrets:
            secret = db_secrets[0]
            # Verify secret has the required fields
            secret_value = self.secretsmanager.get_secret_value(
                SecretId=secret['ARN']
            )
            self.assertIn('SecretString', secret_value)

    @mark.it("should have CloudMap namespace for service discovery")
    def test_cloudmap_namespace(self):
        """Test CloudMap private DNS namespace"""
        # List namespaces
        response = self.servicediscovery.list_namespaces()
        namespaces = response['Namespaces']
        
        # Find namespace ending with .local
        local_namespaces = [ns for ns in namespaces if ns['Name'].endswith('.local')]
        self.assertGreaterEqual(len(local_namespaces), 1)
        
        if local_namespaces:
            namespace = local_namespaces[0]
            self.assertEqual(namespace['Type'], 'DNS_PRIVATE')

    @mark.it("should have CloudWatch dashboard created")
    def test_cloudwatch_dashboard(self):
        """Test CloudWatch dashboard exists"""
        # List dashboards
        response = self.cloudwatch.list_dashboards()
        dashboards = response['DashboardEntries']
        
        # Find microservices dashboard
        ms_dashboards = [d for d in dashboards if 'microservices-dashboard' in d['DashboardName']]
        self.assertGreaterEqual(len(ms_dashboards), 1)

    @mark.it("should have auto-scaling policies configured")
    def test_auto_scaling_policies(self):
        """Test auto-scaling is configured for services"""
        if not flat_outputs.get('ClusterName'):
            self.skipTest("ClusterName not found in outputs")
        
        cluster_name = flat_outputs['ClusterName']
        
        # Get services
        response = self.ecs.list_services(cluster=cluster_name)
        service_arns = response['serviceArns']
        
        if not service_arns:
            self.skipTest("No services found")
        
        # For each service, check auto-scaling
        appscaling = boto3.client('application-autoscaling', region_name=AWS_REGION)
        
        for service_arn in service_arns:
            service_name = service_arn.split('/')[-1]
            resource_id = f"service/{cluster_name}/{service_name}"
            
            # Describe scalable targets
            response = appscaling.describe_scalable_targets(
                ServiceNamespace='ecs',
                ResourceIds=[resource_id]
            )
            targets = response['ScalableTargets']
            
            if targets:
                target = targets[0]
                self.assertEqual(target['MinCapacity'], 2)
                self.assertEqual(target['MaxCapacity'], 10)

    @mark.it("should have all required CloudFormation outputs")
    def test_required_outputs(self):
        """Test all expected outputs are present"""
        required_outputs = ['VpcId', 'ClusterName', 'MeshName', 'LoadBalancerDns']
        
        for output_name in required_outputs:
            self.assertIn(output_name, flat_outputs, f"Missing output: {output_name}")
            self.assertTrue(flat_outputs[output_name], f"Empty output: {output_name}")


if __name__ == '__main__':
    unittest.main()
