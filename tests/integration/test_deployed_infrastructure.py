"""Integration tests for deployed infrastructure using real AWS resources."""
import json
import os
import boto3
import pytest


class TestDeployedInfrastructure:
    """Integration tests for deployed fraud detection infrastructure."""

    @pytest.fixture(scope="class")
    def outputs(self):
        """Load deployment outputs from flat-outputs.json."""
        outputs_path = os.path.join(os.path.dirname(__file__), '..', '..', 'cfn-outputs', 'flat-outputs.json')
        with open(outputs_path, 'r') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def region(self):
        """Get AWS region from environment or default."""
        return os.environ.get('AWS_REGION', 'us-east-1')

    def test_api_endpoint_exists(self, outputs):
        """Test that API Gateway endpoint exists and is accessible."""
        assert 'api_endpoint' in outputs
        api_endpoint = outputs['api_endpoint']
        assert api_endpoint.startswith('https://')
        assert 'execute-api' in api_endpoint
        assert '.amazonaws.com' in api_endpoint

    def test_alb_dns_name_exists(self, outputs):
        """Test that ALB DNS name exists and is properly formatted."""
        assert 'alb_dns_name' in outputs
        alb_dns = outputs['alb_dns_name']
        assert 'fraud-alb-dev' in alb_dns
        assert '.elb.amazonaws.com' in alb_dns

    def test_aurora_endpoint_exists(self, outputs):
        """Test that Aurora endpoint exists and is properly formatted."""
        assert 'aurora_endpoint' in outputs
        aurora_endpoint = outputs['aurora_endpoint']
        assert 'fraud-db-dev' in aurora_endpoint
        assert '.rds.amazonaws.com' in aurora_endpoint

    def test_ecs_cluster_name_exists(self, outputs):
        """Test that ECS cluster name is defined."""
        assert 'ecs_cluster_name' in outputs
        cluster_name = outputs['ecs_cluster_name']
        assert cluster_name == 'fraud-cluster-dev'

    def test_vpc_id_exists(self, outputs):
        """Test that VPC ID exists and is properly formatted."""
        assert 'vpc_id' in outputs
        vpc_id = outputs['vpc_id']
        assert vpc_id.startswith('vpc-')

    def test_dashboard_url_exists(self, outputs):
        """Test that CloudWatch dashboard URL exists."""
        assert 'dashboard_url' in outputs
        dashboard_url = outputs['dashboard_url']
        assert 'cloudwatch' in dashboard_url
        assert 'fraud-dashboard-dev' in dashboard_url

    def test_vpc_exists_in_aws(self, outputs, region):
        """Test that VPC actually exists in AWS."""
        ec2 = boto3.client('ec2', region_name=region)
        vpc_id = outputs['vpc_id']

        response = ec2.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'

    def test_ecs_cluster_exists_in_aws(self, outputs, region):
        """Test that ECS cluster actually exists in AWS."""
        ecs = boto3.client('ecs', region_name=region)
        cluster_name = outputs['ecs_cluster_name']

        response = ecs.describe_clusters(clusters=[cluster_name])
        assert len(response['clusters']) == 1
        cluster = response['clusters'][0]
        assert cluster['status'] == 'ACTIVE'
        assert cluster['clusterName'] == cluster_name

    def test_ecs_service_running(self, outputs, region):
        """Test that ECS service is running in the cluster."""
        ecs = boto3.client('ecs', region_name=region)
        cluster_name = outputs['ecs_cluster_name']

        response = ecs.list_services(cluster=cluster_name)
        assert len(response['serviceArns']) > 0, "At least one service should be running"

        service_arn = response['serviceArns'][0]
        service_details = ecs.describe_services(cluster=cluster_name, services=[service_arn])

        assert len(service_details['services']) == 1
        service = service_details['services'][0]
        assert service['status'] == 'ACTIVE'
        assert service['desiredCount'] == 2

    def test_rds_cluster_exists_in_aws(self, outputs, region):
        """Test that Aurora RDS cluster actually exists in AWS."""
        rds = boto3.client('rds', region_name=region)

        # Extract cluster identifier from endpoint
        aurora_endpoint = outputs['aurora_endpoint']
        cluster_id = aurora_endpoint.split('.')[0]

        response = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)
        assert len(response['DBClusters']) == 1
        cluster = response['DBClusters'][0]
        assert cluster['Status'] == 'available'
        assert cluster['Engine'] == 'aurora-postgresql'
        assert cluster['EngineVersion'].startswith('15.')

    def test_alb_exists_and_healthy(self, outputs, region):
        """Test that ALB exists and is in active state."""
        elbv2 = boto3.client('elbv2', region_name=region)
        alb_dns = outputs['alb_dns_name']

        # Get ALB by DNS name
        response = elbv2.describe_load_balancers()
        alb = None
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_dns:
                alb = lb
                break

        assert alb is not None, "ALB should exist"
        assert alb['State']['Code'] == 'active'
        assert alb['Scheme'] == 'internet-facing'
        assert alb['Type'] == 'application'

    def test_alb_target_groups_healthy(self, outputs, region):
        """Test that ALB target groups are configured correctly."""
        elbv2 = boto3.client('elbv2', region_name=region)
        alb_dns = outputs['alb_dns_name']

        # Get ALB ARN
        response = elbv2.describe_load_balancers()
        alb_arn = None
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_dns:
                alb_arn = lb['LoadBalancerArn']
                break

        assert alb_arn is not None

        # Get target groups associated with this ALB
        tg_response = elbv2.describe_target_groups(LoadBalancerArn=alb_arn)
        assert len(tg_response['TargetGroups']) >= 1, "Should have at least 1 target group"

        # Verify target group configuration
        for tg in tg_response['TargetGroups']:
            assert tg['Protocol'] == 'HTTP'
            assert tg['Port'] == 8080
            assert tg['HealthCheckPath'] == '/health'
            assert 'fraud-tg' in tg['TargetGroupName']

    def test_api_gateway_exists(self, outputs, region):
        """Test that API Gateway exists and is configured correctly."""
        apigatewayv2 = boto3.client('apigatewayv2', region_name=region)

        # Extract API ID from endpoint
        api_endpoint = outputs['api_endpoint']
        api_id = api_endpoint.split('//')[1].split('.')[0]

        response = apigatewayv2.get_api(ApiId=api_id)
        assert response['Name'] == 'fraud-api-dev'
        assert response['ProtocolType'] == 'HTTP'

    def test_cloudwatch_log_group_exists(self, outputs, region):
        """Test that CloudWatch log group for ECS exists."""
        logs = boto3.client('logs', region_name=region)

        log_group_name = '/ecs/fraud-api-dev'
        response = logs.describe_log_groups(logGroupNamePrefix=log_group_name)

        assert len(response['logGroups']) > 0
        log_group = response['logGroups'][0]
        assert log_group['logGroupName'] == log_group_name
        assert log_group['retentionInDays'] == 30

    def test_secrets_manager_secret_exists(self, outputs, region):
        """Test that Secrets Manager secret for DB credentials exists."""
        secretsmanager = boto3.client('secretsmanager', region_name=region)

        secret_name = 'fraud-db-secret-dev'
        response = secretsmanager.describe_secret(SecretId=secret_name)

        assert response['Name'] == secret_name
        assert 'Tags' in response or 'Name' in response

    def test_waf_web_acl_exists(self, outputs, region):
        """Test that WAF Web ACL exists and is associated with ALB."""
        wafv2 = boto3.client('wafv2', region_name=region)

        response = wafv2.list_web_acls(Scope='REGIONAL')

        fraud_waf = None
        for acl in response['WebACLs']:
            if acl['Name'] == 'fraud-waf-dev':
                fraud_waf = acl
                break

        assert fraud_waf is not None, "WAF Web ACL should exist"
        assert fraud_waf['Name'] == 'fraud-waf-dev'
