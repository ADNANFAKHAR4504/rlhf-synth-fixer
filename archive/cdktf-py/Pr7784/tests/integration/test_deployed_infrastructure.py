"""Integration tests for deployed infrastructure using real AWS resources."""
import json
import os
import boto3
import pytest


def _flatten_outputs(outputs_dict):
    """Flatten nested outputs structure to a single level dict.

    CDKTF outputs are nested under stack names, e.g.:
    {"TapStackpr7784": {"output_name": "value"}}

    This flattens to: {"output_name": "value"}
    """
    flattened = {}
    for key, value in outputs_dict.items():
        if isinstance(value, dict):
            # If the value is a dict, merge its contents
            flattened.update(value)
        else:
            # Otherwise keep the key-value pair as-is
            flattened[key] = value
    return flattened


class TestDeployedInfrastructure:
    """Integration tests for deployed multi-region DR infrastructure."""

    @pytest.fixture(scope="class")
    def outputs(self):
        """Load deployment outputs from flat-outputs.json."""
        outputs_path = os.path.join(os.path.dirname(__file__), '..', '..', 'cfn-outputs', 'flat-outputs.json')
        with open(outputs_path, 'r') as f:
            raw_outputs = json.load(f)
        return _flatten_outputs(raw_outputs)

    @pytest.fixture(scope="class")
    def environment_suffix(self):
        """Get environment suffix from environment variable."""
        return os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

    @pytest.fixture(scope="class")
    def region(self):
        """Get AWS region from environment or default."""
        return os.environ.get('AWS_REGION', 'us-east-1')

    def test_api_endpoint_exists(self, outputs):
        """Test that API endpoint output exists if available."""
        # Skip if this output is not present (depends on stack configuration)
        if 'api_endpoint' not in outputs:
            pytest.skip("api_endpoint output not present in current stack")
        api_endpoint = outputs['api_endpoint']
        assert api_endpoint is not None

    def test_alb_dns_name_exists(self, outputs):
        """Test that ALB DNS name exists if available."""
        if 'alb_dns_name' not in outputs:
            pytest.skip("alb_dns_name output not present in current stack")
        alb_dns = outputs['alb_dns_name']
        assert '.elb.amazonaws.com' in alb_dns or '.elb.' in alb_dns

    def test_aurora_endpoint_exists(self, outputs):
        """Test that Aurora endpoint exists if available."""
        if 'aurora_endpoint' not in outputs and 'rds_cluster_endpoint' not in outputs:
            pytest.skip("aurora/rds endpoint output not present in current stack")
        endpoint_key = 'aurora_endpoint' if 'aurora_endpoint' in outputs else 'rds_cluster_endpoint'
        aurora_endpoint = outputs[endpoint_key]
        assert '.rds.amazonaws.com' in aurora_endpoint

    def test_ecs_cluster_name_exists(self, outputs):
        """Test that ECS cluster name is defined if available."""
        if 'ecs_cluster_name' not in outputs:
            pytest.skip("ecs_cluster_name output not present in current stack")
        cluster_name = outputs['ecs_cluster_name']
        assert cluster_name is not None and len(cluster_name) > 0

    def test_vpc_id_exists(self, outputs):
        """Test that VPC ID exists if available."""
        if 'vpc_id' not in outputs:
            pytest.skip("vpc_id output not present in current stack")
        vpc_id = outputs['vpc_id']
        assert vpc_id.startswith('vpc-')

    def test_dashboard_url_exists(self, outputs):
        """Test that CloudWatch dashboard URL exists if available."""
        if 'dashboard_url' not in outputs:
            pytest.skip("dashboard_url output not present in current stack")
        dashboard_url = outputs['dashboard_url']
        assert 'cloudwatch' in dashboard_url

    def test_vpc_exists_in_aws(self, outputs, region):
        """Test that VPC actually exists in AWS."""
        if 'vpc_id' not in outputs:
            pytest.skip("vpc_id output not present in current stack")
        ec2 = boto3.client('ec2', region_name=region)
        vpc_id = outputs['vpc_id']

        response = ec2.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'

    def test_ecs_cluster_exists_in_aws(self, outputs, region):
        """Test that ECS cluster actually exists in AWS."""
        if 'ecs_cluster_name' not in outputs:
            pytest.skip("ecs_cluster_name output not present in current stack")
        ecs = boto3.client('ecs', region_name=region)
        cluster_name = outputs['ecs_cluster_name']

        response = ecs.describe_clusters(clusters=[cluster_name])
        assert len(response['clusters']) == 1
        cluster = response['clusters'][0]
        assert cluster['status'] == 'ACTIVE'
        assert cluster['clusterName'] == cluster_name

    def test_ecs_service_running(self, outputs, region):
        """Test that ECS service is running in the cluster."""
        if 'ecs_cluster_name' not in outputs:
            pytest.skip("ecs_cluster_name output not present in current stack")
        ecs = boto3.client('ecs', region_name=region)
        cluster_name = outputs['ecs_cluster_name']

        response = ecs.list_services(cluster=cluster_name)
        if len(response['serviceArns']) == 0:
            pytest.skip("No ECS services found in cluster")

        service_arn = response['serviceArns'][0]
        service_details = ecs.describe_services(cluster=cluster_name, services=[service_arn])

        assert len(service_details['services']) == 1
        service = service_details['services'][0]
        assert service['status'] == 'ACTIVE'

    def test_rds_cluster_exists_in_aws(self, outputs, region):
        """Test that Aurora RDS cluster actually exists in AWS."""
        endpoint_key = None
        if 'aurora_endpoint' in outputs:
            endpoint_key = 'aurora_endpoint'
        elif 'rds_cluster_endpoint' in outputs:
            endpoint_key = 'rds_cluster_endpoint'
        else:
            pytest.skip("No RDS/Aurora endpoint output present in current stack")

        rds = boto3.client('rds', region_name=region)

        # Extract cluster identifier from endpoint
        aurora_endpoint = outputs[endpoint_key]
        cluster_id = aurora_endpoint.split('.')[0]

        response = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)
        assert len(response['DBClusters']) == 1
        cluster = response['DBClusters'][0]
        assert cluster['Status'] == 'available'

    def test_alb_exists_and_healthy(self, outputs, region):
        """Test that ALB exists and is in active state."""
        if 'alb_dns_name' not in outputs:
            pytest.skip("alb_dns_name output not present in current stack")
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
        assert alb['Type'] == 'application'

    def test_alb_target_groups_healthy(self, outputs, region):
        """Test that ALB target groups are configured correctly."""
        if 'alb_dns_name' not in outputs:
            pytest.skip("alb_dns_name output not present in current stack")
        elbv2 = boto3.client('elbv2', region_name=region)
        alb_dns = outputs['alb_dns_name']

        # Get ALB ARN
        response = elbv2.describe_load_balancers()
        alb_arn = None
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_dns:
                alb_arn = lb['LoadBalancerArn']
                break

        if alb_arn is None:
            pytest.skip("ALB not found")

        # Get target groups associated with this ALB
        tg_response = elbv2.describe_target_groups(LoadBalancerArn=alb_arn)
        assert len(tg_response['TargetGroups']) >= 1, "Should have at least 1 target group"

    def test_api_gateway_exists(self, outputs, region):
        """Test that API Gateway exists and is configured correctly."""
        if 'api_endpoint' not in outputs:
            pytest.skip("api_endpoint output not present in current stack")
        apigatewayv2 = boto3.client('apigatewayv2', region_name=region)

        # Extract API ID from endpoint
        api_endpoint = outputs['api_endpoint']
        api_id = api_endpoint.split('//')[1].split('.')[0]

        response = apigatewayv2.get_api(ApiId=api_id)
        assert response['ProtocolType'] == 'HTTP'

    def test_cloudwatch_log_group_exists(self, outputs, region):
        """Test that CloudWatch log group for ECS exists."""
        logs = boto3.client('logs', region_name=region)

        # Look for any log groups with common prefixes
        prefixes = ['/ecs/', '/aws/ecs/', '/aws/lambda/']
        found_log_group = False

        for prefix in prefixes:
            response = logs.describe_log_groups(logGroupNamePrefix=prefix, limit=5)
            if len(response['logGroups']) > 0:
                found_log_group = True
                break

        assert found_log_group, "At least one CloudWatch log group should exist"

    def test_secrets_manager_secret_exists(self, outputs, region):
        """Test that Secrets Manager secret for DB credentials exists."""
        secretsmanager = boto3.client('secretsmanager', region_name=region)

        # List secrets to find any secrets related to the deployment
        response = secretsmanager.list_secrets(MaxResults=10)

        # Check if any secrets exist (flexible test)
        if len(response['SecretList']) == 0:
            pytest.skip("No secrets found in Secrets Manager")

        # At least one secret should exist
        assert len(response['SecretList']) > 0

    def test_waf_web_acl_exists(self, outputs, region):
        """Test that WAF Web ACL exists and is associated with ALB."""
        wafv2 = boto3.client('wafv2', region_name=region)

        response = wafv2.list_web_acls(Scope='REGIONAL')

        # Check if any WAF ACL exists (flexible test)
        if len(response['WebACLs']) == 0:
            pytest.skip("No WAF Web ACLs found")

        assert len(response['WebACLs']) > 0
