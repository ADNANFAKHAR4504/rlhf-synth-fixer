"""
Integration tests for deployed payment processing infrastructure.
Tests validate actual AWS resources using CloudFormation outputs.
"""

import json
import os
import unittest
import boto3
from pytest import mark

# Load CloudFormation outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("Payment Processing Infrastructure")
class TestPaymentProcessingInfrastructure(unittest.TestCase):
    """Integration tests for deployed payment processing system"""

    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients and verify outputs exist"""
        cls.outputs = flat_outputs

        if not cls.outputs:
            raise unittest.SkipTest("CloudFormation outputs not found - deployment may not be complete")

        # Initialize AWS clients
        cls.ecs_client = boto3.client('ecs')
        cls.elbv2_client = boto3.client('elbv2')
        cls.rds_client = boto3.client('rds')
        cls.ecr_client = boto3.client('ecr')
        cls.codedeploy_client = boto3.client('codedeploy')
        cls.cloudwatch_client = boto3.client('cloudwatch')

    @mark.it("validates ECS cluster exists and is active")
    def test_ecs_cluster_exists(self):
        """Test that ECS cluster was created and is active"""
        cluster_name = self.outputs.get('ClusterName')

        assert cluster_name is not None, "ClusterName output not found"

        response = self.ecs_client.describe_clusters(clusters=[cluster_name])

        assert len(response['clusters']) == 1, "Cluster not found"
        assert response['clusters'][0]['status'] == 'ACTIVE', "Cluster is not active"
        assert response['clusters'][0]['clusterName'] == cluster_name

    @mark.it("validates all three ECS services are running")
    def test_ecs_services_running(self):
        """Test that all three ECS services are running with correct configuration"""
        cluster_name = self.outputs.get('ClusterName')

        assert cluster_name is not None, "ClusterName output not found"

        # List services in cluster
        services_response = self.ecs_client.list_services(cluster=cluster_name)
        service_arns = services_response['serviceArns']

        assert len(service_arns) >= 3, f"Expected at least 3 services, found {len(service_arns)}"

        # Describe services
        services_detail = self.ecs_client.describe_services(
            cluster=cluster_name,
            services=service_arns
        )

        for service in services_detail['services']:
            # Verify service is active
            assert service['status'] == 'ACTIVE', f"Service {service['serviceName']} is not active"

            # Verify CODE_DEPLOY deployment controller
            assert service['deploymentController']['type'] == 'CODE_DEPLOY', \
                f"Service {service['serviceName']} does not use CODE_DEPLOY controller"

            # Verify desired count
            assert service['desiredCount'] >= 2, \
                f"Service {service['serviceName']} has insufficient desired count"

    @mark.it("validates ALB exists and is active")
    def test_alb_exists_and_active(self):
        """Test that Application Load Balancer exists and is active"""
        alb_dns = self.outputs.get('LoadBalancerDNS')

        assert alb_dns is not None, "LoadBalancerDNS output not found"

        # Find ALB by DNS name
        albs = self.elbv2_client.describe_load_balancers()

        alb_found = False
        for alb in albs['LoadBalancers']:
            if alb['DNSName'] == alb_dns:
                alb_found = True
                assert alb['State']['Code'] == 'active', "ALB is not active"
                assert alb['Scheme'] == 'internet-facing', "ALB is not internet-facing"
                break

        assert alb_found, f"ALB with DNS {alb_dns} not found"

    @mark.it("validates target groups exist for blue-green deployments")
    def test_target_groups_exist(self):
        """Test that blue and green target groups exist for each service"""
        alb_dns = self.outputs.get('LoadBalancerDNS')

        assert alb_dns is not None, "LoadBalancerDNS output not found"

        # Get target groups
        target_groups = self.elbv2_client.describe_target_groups()

        # Should have at least 6 target groups (3 services × 2 for blue/green)
        assert len(target_groups['TargetGroups']) >= 6, \
            f"Expected at least 6 target groups, found {len(target_groups['TargetGroups'])}"

        # Verify health check configuration
        for tg in target_groups['TargetGroups']:
            assert tg['HealthCheckEnabled'] == True, "Health checks not enabled"
            assert tg['HealthCheckPath'] == '/health', "Health check path incorrect"

    @mark.it("validates Aurora database cluster exists")
    def test_database_cluster_exists(self):
        """Test that Aurora Serverless v2 database cluster exists"""
        db_endpoint = self.outputs.get('DatabaseEndpoint')

        assert db_endpoint is not None, "DatabaseEndpoint output not found"

        # Extract cluster identifier from endpoint
        cluster_id = db_endpoint.split('.')[0]

        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        assert len(response['DBClusters']) == 1, "Database cluster not found"

        cluster = response['DBClusters'][0]
        assert cluster['Engine'] == 'aurora-postgresql', "Wrong database engine"
        assert cluster['Status'] == 'available', "Database cluster not available"
        assert 'ServerlessV2ScalingConfiguration' in cluster, "Not Serverless v2"

    @mark.it("validates ECR repositories exist with scan on push enabled")
    def test_ecr_repositories_exist(self):
        """Test that ECR repositories exist for all services with vulnerability scanning"""
        repos = self.ecr_client.describe_repositories()

        # Should have at least 3 repositories
        assert len(repos['repositories']) >= 3, \
            f"Expected at least 3 ECR repositories, found {len(repos['repositories'])}"

        # Verify scan on push is enabled
        for repo in repos['repositories']:
            assert repo['imageScanningConfiguration']['scanOnPush'] == True, \
                f"Scan on push not enabled for {repo['repositoryName']}"

    @mark.it("validates CodeDeploy application and deployment groups exist")
    def test_codedeploy_configuration(self):
        """Test that CodeDeploy application and deployment groups are configured"""
        # List CodeDeploy applications
        apps = self.codedeploy_client.list_applications()

        assert len(apps['applications']) >= 1, "No CodeDeploy applications found"

        # Get deployment groups for first application
        app_name = apps['applications'][0]

        deployment_groups = self.codedeploy_client.list_deployment_groups(
            applicationName=app_name
        )

        # Should have 3 deployment groups (one per service)
        assert len(deployment_groups['deploymentGroups']) >= 3, \
            f"Expected at least 3 deployment groups, found {len(deployment_groups['deploymentGroups'])}"

        # Verify deployment group configuration
        for dg_name in deployment_groups['deploymentGroups']:
            dg_info = self.codedeploy_client.get_deployment_group(
                applicationName=app_name,
                deploymentGroupName=dg_name
            )

            dg = dg_info['deploymentGroupInfo']
            assert dg['computePlatform'] == 'ECS', "Wrong compute platform"
            assert 'blueGreenDeploymentConfiguration' in dg, "Blue-green config missing"
            assert 'autoRollbackConfiguration' in dg, "Auto-rollback not configured"

    @mark.it("validates CloudWatch alarms exist for all services")
    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are configured for monitoring"""
        alarms = self.cloudwatch_client.describe_alarms()

        # Should have alarms for each service
        assert len(alarms['MetricAlarms']) >= 3, \
            f"Expected at least 3 CloudWatch alarms, found {len(alarms['MetricAlarms'])}"

        # Verify alarm actions are configured
        for alarm in alarms['MetricAlarms']:
            assert len(alarm.get('AlarmActions', [])) > 0, \
                f"Alarm {alarm['AlarmName']} has no actions configured"

    @mark.it("validates VPC configuration with proper subnets")
    def test_vpc_configuration(self):
        """Test that VPC is configured with proper subnet structure"""
        vpc_id = self.outputs.get('VPCId')

        # Note: VPCId might not be in outputs, this test is optional
        if not vpc_id:
            self.skipTest("VPCId not in outputs")

        ec2_client = boto3.client('ec2')

        # Get VPC details
        vpcs = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(vpcs['Vpcs']) == 1, "VPC not found"

        # Get subnets
        subnets = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        # Should have public, private, and isolated subnets across multiple AZs
        assert len(subnets['Subnets']) >= 6, \
            f"Expected at least 6 subnets (2 per type × 3 AZs), found {len(subnets['Subnets'])}"


if __name__ == '__main__':
    unittest.main()
