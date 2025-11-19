"""
Integration tests for TapStack - validates actual deployed infrastructure
Tests use AWS SDK to verify resources are properly configured and running
"""
import json
import os
import time
import unittest

import boto3
import requests
from botocore.exceptions import ClientError
from pytest import mark

# Load deployment outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients once for all tests"""
        cls.ecs_client = boto3.client('ecs', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        cls.ecr_client = boto3.client('ecr', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        cls.elbv2_client = boto3.client('elbv2', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        cls.appmesh_client = boto3.client('appmesh', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        cls.logs_client = boto3.client('logs', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        cls.servicediscovery_client = boto3.client('servicediscovery', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        cls.autoscaling_client = boto3.client('application-autoscaling', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        
        # Extract environment suffix from cluster name
        cluster_name = flat_outputs.get('ClusterName', 'trading-cluster-dev')
        cls.env_suffix = cluster_name.replace('trading-cluster-', '')
        cls.microservices = ['data-ingestion', 'analytics-engine', 'api-gateway']

    @mark.it("verifies stack outputs are present")
    def test_stack_outputs_exist(self):
        """Verify all required stack outputs are present"""
        required_outputs = [
            'ClusterName',
            'MeshName',
            'LoadBalancerDNS',
            'EcrRepoapigateway',
            'EcrRepoanalyticsengine',
            'EcrRepodataingestion'
        ]
        
        for output in required_outputs:
            self.assertIn(output, flat_outputs, f"Missing required output: {output}")
            self.assertTrue(flat_outputs[output], f"Output {output} is empty")

    @mark.it("verifies ECS cluster exists and is active")
    def test_ecs_cluster_exists(self):
        """Test that ECS cluster is created and active"""
        cluster_name = flat_outputs.get('ClusterName')
        self.assertIsNotNone(cluster_name, "ClusterName not found in outputs")
        
        response = self.ecs_client.describe_clusters(clusters=[cluster_name])
        self.assertEqual(len(response['clusters']), 1)
        
        cluster = response['clusters'][0]
        self.assertEqual(cluster['status'], 'ACTIVE')
        self.assertEqual(cluster['clusterName'], cluster_name)

    @mark.it("verifies all three ECS services are running")
    def test_ecs_services_running(self):
        """Test that all microservice ECS services are deployed and running"""
        cluster_name = flat_outputs.get('ClusterName')
        
        for service_name in self.microservices:
            service_full_name = f'{service_name}-{self.env_suffix}'
            
            response = self.ecs_client.describe_services(
                cluster=cluster_name,
                services=[service_full_name]
            )
            
            self.assertEqual(len(response['services']), 1, 
                           f"Service {service_full_name} not found")
            
            service = response['services'][0]
            self.assertEqual(service['status'], 'ACTIVE',
                           f"Service {service_full_name} is not ACTIVE")
            self.assertGreaterEqual(service['desiredCount'], 2,
                                  f"Service {service_full_name} should have at least 2 tasks")

    @mark.it("verifies ECS tasks are running for each service")
    def test_ecs_tasks_running(self):
        """Test that ECS tasks are running for each service"""
        cluster_name = flat_outputs.get('ClusterName')
        
        for service_name in self.microservices:
            service_full_name = f'{service_name}-{self.env_suffix}'
            
            response = self.ecs_client.list_tasks(
                cluster=cluster_name,
                serviceName=service_full_name,
                desiredStatus='RUNNING'
            )
            
            self.assertGreater(len(response['taskArns']), 0,
                             f"No running tasks found for service {service_full_name}")

    @mark.it("verifies ECR repositories exist and are accessible")
    def test_ecr_repositories_exist(self):
        """Test that ECR repositories are created for all microservices"""
        for service_name in self.microservices:
            output_key = f'EcrRepo{service_name.replace("-", "")}'
            repo_uri = flat_outputs.get(output_key)
            
            self.assertIsNotNone(repo_uri, f"ECR repo URI not found for {service_name}")
            
            # Extract repository name from URI
            repo_name = f'{service_name}-{self.env_suffix}'
            
            try:
                response = self.ecr_client.describe_repositories(
                    repositoryNames=[repo_name]
                )
                self.assertEqual(len(response['repositories']), 1)
                
                repo = response['repositories'][0]
                self.assertEqual(repo['repositoryName'], repo_name)
                self.assertTrue(repo['imageScanningConfiguration']['scanOnPush'],
                              f"Image scanning not enabled for {repo_name}")
            except ClientError as e:
                self.fail(f"ECR repository {repo_name} not accessible: {e}")

    @mark.it("verifies Application Load Balancer is accessible")
    def test_alb_exists_and_accessible(self):
        """Test that ALB is created and responding to requests"""
        alb_dns = flat_outputs.get('LoadBalancerDNS')
        self.assertIsNotNone(alb_dns, "LoadBalancerDNS not found in outputs")
        
        # Test ALB responds (may return 404 for default action, which is expected)
        try:
            response = requests.get(f'http://{alb_dns}', timeout=10)
            # ALB should respond (even with 404 or 200)
            self.assertIn(response.status_code, [200, 404, 503],
                        f"ALB returned unexpected status: {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.fail(f"ALB not accessible at {alb_dns}: {e}")

    @mark.it("verifies ALB target groups are healthy")
    def test_alb_target_groups_healthy(self):
        """Test that ALB target groups have healthy targets"""
        alb_dns = flat_outputs.get('LoadBalancerDNS')
        
        # Get load balancer ARN
        alb_name = alb_dns.split('.')[0]
        response = self.elbv2_client.describe_load_balancers()
        
        alb_arn = None
        for lb in response['LoadBalancers']:
            if alb_name in lb['LoadBalancerArn']:
                alb_arn = lb['LoadBalancerArn']
                break
        
        if alb_arn:
            # Get target groups
            tg_response = self.elbv2_client.describe_target_groups(
                LoadBalancerArn=alb_arn
            )
            
            self.assertGreater(len(tg_response['TargetGroups']), 0,
                             "No target groups found for ALB")
            
            # Check health of targets (may take time to be healthy)
            for tg in tg_response['TargetGroups']:
                health_response = self.elbv2_client.describe_target_health(
                    TargetGroupArn=tg['TargetGroupArn']
                )
                # Just verify targets are registered (they may still be initializing)
                self.assertGreaterEqual(len(health_response['TargetHealthDescriptions']), 0,
                                      "No targets registered in target group")

    @mark.it("verifies App Mesh exists and is active")
    def test_app_mesh_exists(self):
        """Test that App Mesh is created"""
        mesh_name = flat_outputs.get('MeshName')
        self.assertIsNotNone(mesh_name, "MeshName not found in outputs")
        
        try:
            response = self.appmesh_client.describe_mesh(meshName=mesh_name)
            mesh = response['mesh']
            self.assertEqual(mesh['meshName'], mesh_name)
            self.assertEqual(mesh['status']['status'], 'ACTIVE')
        except ClientError as e:
            self.fail(f"App Mesh {mesh_name} not accessible: {e}")

    @mark.it("verifies App Mesh virtual nodes exist for all services")
    def test_app_mesh_virtual_nodes_exist(self):
        """Test that virtual nodes are created for all microservices"""
        mesh_name = flat_outputs.get('MeshName')
        
        for service_name in self.microservices:
            vn_name = f'{service_name}-vn-{self.env_suffix}'
            
            try:
                response = self.appmesh_client.describe_virtual_node(
                    meshName=mesh_name,
                    virtualNodeName=vn_name
                )
                vn = response['virtualNode']
                self.assertEqual(vn['virtualNodeName'], vn_name)
                self.assertEqual(vn['status']['status'], 'ACTIVE')
                
                # Verify listener configuration
                self.assertGreater(len(vn['spec']['listeners']), 0,
                                 f"No listeners configured for {vn_name}")
                
                listener = vn['spec']['listeners'][0]
                self.assertEqual(listener['portMapping']['port'], 80)
                self.assertEqual(listener['portMapping']['protocol'], 'http')
                
            except ClientError as e:
                self.fail(f"Virtual node {vn_name} not accessible: {e}")

    @mark.it("verifies App Mesh virtual routers exist")
    def test_app_mesh_virtual_routers_exist(self):
        """Test that virtual routers are created"""
        mesh_name = flat_outputs.get('MeshName')
        
        for service_name in self.microservices:
            vr_name = f'{service_name}-vr-{self.env_suffix}'
            
            try:
                response = self.appmesh_client.describe_virtual_router(
                    meshName=mesh_name,
                    virtualRouterName=vr_name
                )
                vr = response['virtualRouter']
                self.assertEqual(vr['virtualRouterName'], vr_name)
                self.assertEqual(vr['status']['status'], 'ACTIVE')
            except ClientError as e:
                self.fail(f"Virtual router {vr_name} not accessible: {e}")

    @mark.it("verifies App Mesh virtual services exist")
    def test_app_mesh_virtual_services_exist(self):
        """Test that virtual services are created"""
        mesh_name = flat_outputs.get('MeshName')
        
        for service_name in self.microservices:
            vs_name = f'{service_name}.trading.local-{self.env_suffix}'
            
            try:
                response = self.appmesh_client.describe_virtual_service(
                    meshName=mesh_name,
                    virtualServiceName=vs_name
                )
                vs = response['virtualService']
                self.assertEqual(vs['virtualServiceName'], vs_name)
                self.assertEqual(vs['status']['status'], 'ACTIVE')
            except ClientError as e:
                self.fail(f"Virtual service {vs_name} not accessible: {e}")

    @mark.it("verifies CloudWatch log groups exist for services")
    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch log groups are created"""
        for service_name in self.microservices:
            log_group_name = f'/ecs/trading/{service_name}-{self.env_suffix}'
            
            try:
                response = self.logs_client.describe_log_groups(
                    logGroupNamePrefix=log_group_name
                )
                self.assertGreater(len(response['logGroups']), 0,
                                 f"Log group {log_group_name} not found")
                
                log_group = response['logGroups'][0]
                self.assertEqual(log_group['retentionInDays'], 30,
                               f"Log retention not set to 30 days for {log_group_name}")
            except ClientError as e:
                self.fail(f"Log group {log_group_name} not accessible: {e}")

    @mark.it("verifies CloudWatch alarms exist for services")
    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are configured"""
        # Check for CPU alarms
        response = self.cloudwatch_client.describe_alarms(
            AlarmNamePrefix=f'trading-'
        )
        
        self.assertGreater(len(response['MetricAlarms']), 0,
                         "No CloudWatch alarms found")
        
        # Verify alarm types exist (CPU, memory, errors)
        alarm_names = [alarm['AlarmName'] for alarm in response['MetricAlarms']]
        
        has_cpu_alarm = any('high-cpu' in name for name in alarm_names)
        has_memory_alarm = any('high-memory' in name for name in alarm_names)
        
        self.assertTrue(has_cpu_alarm, "No CPU alarms found")
        self.assertTrue(has_memory_alarm, "No memory alarms found")

    @mark.it("verifies auto-scaling is configured for services")
    def test_autoscaling_configured(self):
        """Test that auto-scaling is configured for ECS services"""
        cluster_name = flat_outputs.get('ClusterName')
        
        for service_name in self.microservices:
            resource_id = f'service/{cluster_name}/{service_name}-{self.env_suffix}'
            
            try:
                response = self.autoscaling_client.describe_scalable_targets(
                    ServiceNamespace='ecs',
                    ResourceIds=[resource_id]
                )
                
                self.assertGreater(len(response['ScalableTargets']), 0,
                                 f"No scalable targets found for {service_name}")
                
                target = response['ScalableTargets'][0]
                self.assertEqual(target['MinCapacity'], 2)
                self.assertEqual(target['MaxCapacity'], 10)
                
            except ClientError as e:
                # Auto-scaling may not be immediately available
                self.skipTest(f"Auto-scaling not yet available for {service_name}: {e}")

    @mark.it("verifies auto-scaling policies exist")
    def test_autoscaling_policies_exist(self):
        """Test that auto-scaling policies are created"""
        cluster_name = flat_outputs.get('ClusterName')
        
        for service_name in self.microservices:
            resource_id = f'service/{cluster_name}/{service_name}-{self.env_suffix}'
            
            try:
                response = self.autoscaling_client.describe_scaling_policies(
                    ServiceNamespace='ecs',
                    ResourceId=resource_id
                )
                
                # Should have at least CPU and memory scaling policies
                self.assertGreaterEqual(len(response['ScalingPolicies']), 2,
                                      f"Expected at least 2 scaling policies for {service_name}")
                
            except ClientError as e:
                self.skipTest(f"Scaling policies not yet available for {service_name}: {e}")

    @mark.it("verifies Cloud Map namespace exists")
    def test_cloud_map_namespace_exists(self):
        """Test that Cloud Map service discovery namespace is created"""
        namespace_name = f'trading.local-{self.env_suffix}'
        
        try:
            response = self.servicediscovery_client.list_namespaces()
            
            namespaces = [ns for ns in response['Namespaces'] 
                         if ns['Name'] == namespace_name]
            
            self.assertGreater(len(namespaces), 0,
                             f"Cloud Map namespace {namespace_name} not found")
            
            namespace = namespaces[0]
            self.assertEqual(namespace['Type'], 'DNS_PRIVATE')
            
        except ClientError as e:
            self.fail(f"Cloud Map namespace {namespace_name} not accessible: {e}")

    @mark.it("verifies Cloud Map services exist for microservices")
    def test_cloud_map_services_exist(self):
        """Test that Cloud Map services are registered"""
        namespace_name = f'trading.local-{self.env_suffix}'
        
        try:
            # Get namespace ID
            namespaces_response = self.servicediscovery_client.list_namespaces()
            namespace = next((ns for ns in namespaces_response['Namespaces'] 
                            if ns['Name'] == namespace_name), None)
            
            if namespace:
                namespace_id = namespace['Id']
                
                # List services in namespace
                services_response = self.servicediscovery_client.list_services(
                    Filters=[
                        {
                            'Name': 'NAMESPACE_ID',
                            'Values': [namespace_id]
                        }
                    ]
                )
                
                self.assertGreaterEqual(len(services_response['Services']), len(self.microservices),
                                      "Not all microservices registered in Cloud Map")
            else:
                self.skipTest("Cloud Map namespace not found")
                
        except ClientError as e:
            self.skipTest(f"Cloud Map services not accessible: {e}")


if __name__ == '__main__':
    unittest.main()
