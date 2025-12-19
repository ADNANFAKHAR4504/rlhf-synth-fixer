"""Integration tests for TapStack."""
import json
import os
import boto3
import pytest


@pytest.fixture(scope="module")
def outputs():
    """Load deployment outputs."""
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
        pytest.skip("No deployment outputs found")

    with open(outputs_file, 'r') as f:
        flat_outputs = json.load(f)
    
    # Find the TapStack outputs (nested under stack name like TapStackpr4916)
    stack_keys = [key for key in flat_outputs if key.startswith("TapStack")]
    if not stack_keys:
        pytest.skip("TapStack outputs are missing from flat outputs")

    stack_key = stack_keys[0]
    stack_outputs = flat_outputs.get(stack_key, {})
    if not isinstance(stack_outputs, dict):
        pytest.skip(f"TapStack outputs for {stack_key} are empty or malformed")

    return stack_outputs


@pytest.fixture(scope="module")
def aws_region(outputs):
    """Get AWS region from outputs."""
    return outputs.get("AwsRegion", "sa-east-1")


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_vpc_exists_and_accessible(self, outputs, aws_region):
        """Test that VPC exists and is accessible."""
        vpc_id = outputs.get("VpcId")
        assert vpc_id is not None, "VPC ID not found in outputs"

        ec2_client = boto3.client('ec2', region_name=aws_region)
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['VpcId'] == vpc_id
        assert response['Vpcs'][0]['State'] == 'available'

    def test_ecs_cluster_exists(self, outputs, aws_region):
        """Test that ECS cluster exists and is active."""
        cluster_name = outputs.get("EcsClusterName")
        assert cluster_name is not None, "ECS cluster name not found in outputs"

        ecs_client = boto3.client('ecs', region_name=aws_region)
        response = ecs_client.describe_clusters(clusters=[cluster_name])

        assert len(response['clusters']) == 1
        assert response['clusters'][0]['status'] == 'ACTIVE'
        assert response['clusters'][0]['clusterName'] == cluster_name

    def test_elasticache_endpoint_accessible(self, outputs, aws_region):
        """Test that ElastiCache endpoint exists."""
        endpoint = outputs.get("ElastiCacheEndpoint")
        assert endpoint is not None, "ElastiCache endpoint not found in outputs"
        assert "serverless.sae1.cache.amazonaws.com" in endpoint

    def test_alb_dns_accessible(self, outputs, aws_region):
        """Test that ALB DNS exists."""
        alb_dns = outputs.get("AlbDns")
        assert alb_dns is not None, "ALB DNS not found in outputs"
        assert "elb.amazonaws.com" in alb_dns

    def test_sns_topic_exists(self, outputs, aws_region):
        """Test that SNS topic exists."""
        topic_arn = outputs.get("SnsTopicArn")
        assert topic_arn is not None, "SNS topic ARN not found in outputs"

        sns_client = boto3.client('sns', region_name=aws_region)
        response = sns_client.get_topic_attributes(TopicArn=topic_arn)

        assert response['Attributes']['TopicArn'] == topic_arn

    def test_cloudwatch_alarms_exist(self, outputs, aws_region):
        """Test that CloudWatch alarms are created."""
        environment_suffix = outputs.get("EnvironmentSuffix")

        cloudwatch_client = boto3.client('cloudwatch', region_name=aws_region)
        response = cloudwatch_client.describe_alarms(
            AlarmNamePrefix=f"catalog-"
        )

        # Filter alarms for this environment
        env_alarms = [
            alarm for alarm in response['MetricAlarms']
            if environment_suffix in alarm['AlarmName']
        ]

        assert len(env_alarms) >= 7, f"Expected at least 7 alarms, found {len(env_alarms)}"

    def test_ecs_service_running(self, outputs, aws_region):
        """Test that ECS service is running."""
        cluster_name = outputs.get("EcsClusterName")
        environment_suffix = outputs.get("EnvironmentSuffix")
        service_name = f"catalog-service-{environment_suffix}"

        ecs_client = boto3.client('ecs', region_name=aws_region)
        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        assert len(response['services']) == 1
        service = response['services'][0]
        assert service['status'] == 'ACTIVE'
        assert service['desiredCount'] >= 2

    def test_waf_web_acl_exists(self, outputs, aws_region):
        """Test that WAF WebACL exists."""
        environment_suffix = outputs.get("EnvironmentSuffix")

        wafv2_client = boto3.client('wafv2', region_name=aws_region)
        response = wafv2_client.list_web_acls(Scope='REGIONAL')

        # Find our WebACL
        our_waf = [
            waf for waf in response['WebACLs']
            if environment_suffix in waf['Name']
        ]

        assert len(our_waf) == 1, f"Expected 1 WAF WebACL, found {len(our_waf)}"
