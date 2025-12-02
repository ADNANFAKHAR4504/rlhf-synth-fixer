"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load stack outputs from cfn-outputs/flat-outputs.json
        outputs_file = 'cfn-outputs/flat-outputs.json'
        if not os.path.exists(outputs_file):
            raise FileNotFoundError(f"Outputs file not found: {outputs_file}")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # AWS clients
        cls.ec2 = boto3.client('ec2', region_name='us-east-1')
        cls.ecs = boto3.client('ecs', region_name='us-east-1')
        cls.elbv2 = boto3.client('elbv2', region_name='us-east-1')
        cls.ecr = boto3.client('ecr', region_name='us-east-1')
        cls.logs = boto3.client('logs', region_name='us-east-1')
        cls.ssm = boto3.client('ssm', region_name='us-east-1')
        cls.cloudwatch = boto3.client('cloudwatch', region_name='us-east-1')
        cls.autoscaling = boto3.client('application-autoscaling', region_name='us-east-1')

    def test_vpc_exists(self):
        """Test that VPC was created."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)
        self.assertEqual(response['Vpcs'][0]['VpcId'], vpc_id)

    def test_vpc_cidr_block(self):
        """Test VPC CIDR block."""
        vpc_id = self.outputs.get('vpc_id')
        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        cidr_block = response['Vpcs'][0]['CidrBlock']
        self.assertEqual(cidr_block, '10.0.0.0/16')

    def test_subnets_exist(self):
        """Test that subnets were created."""
        vpc_id = self.outputs.get('vpc_id')
        response = self.ec2.describe_subnets(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])

        # Should have 3 public + 3 private = 6 subnets
        self.assertEqual(len(response['Subnets']), 6)

    def test_internet_gateway_exists(self):
        """Test that Internet Gateway was created."""
        vpc_id = self.outputs.get('vpc_id')
        response = self.ec2.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )
        self.assertGreaterEqual(len(response['InternetGateways']), 1)

    def test_nat_gateways_exist(self):
        """Test that NAT Gateways were created."""
        vpc_id = self.outputs.get('vpc_id')
        response = self.ec2.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        # Should have 3 NAT Gateways
        self.assertEqual(len(response['NatGateways']), 3)

    def test_ecr_repository_exists(self):
        """Test that ECR repository was created."""
        ecr_uri = self.outputs.get('ecr_repository_uri')
        self.assertIsNotNone(ecr_uri)

        # Extract repository name from URI
        repo_name = ecr_uri.split('/')[-1]

        response = self.ecr.describe_repositories(repositoryNames=[repo_name])
        self.assertEqual(len(response['repositories']), 1)
        self.assertEqual(response['repositories'][0]['repositoryName'], repo_name)

    def test_ecr_lifecycle_policy(self):
        """Test that ECR lifecycle policy is set."""
        ecr_uri = self.outputs.get('ecr_repository_uri')
        repo_name = ecr_uri.split('/')[-1]

        response = self.ecr.get_lifecycle_policy(repositoryName=repo_name)
        self.assertIsNotNone(response.get('lifecyclePolicyText'))

        policy = json.loads(response['lifecyclePolicyText'])
        self.assertEqual(policy['rules'][0]['selection']['countNumber'], 5)

    def test_ecs_cluster_exists(self):
        """Test that ECS cluster was created."""
        cluster_name = self.outputs.get('ecs_cluster_name')
        self.assertIsNotNone(cluster_name)

        response = self.ecs.describe_clusters(clusters=[cluster_name])
        self.assertEqual(len(response['clusters']), 1)
        self.assertEqual(response['clusters'][0]['clusterName'], cluster_name)
        self.assertEqual(response['clusters'][0]['status'], 'ACTIVE')

    def test_ecs_service_exists(self):
        """Test that ECS service was created."""
        cluster_name = self.outputs.get('ecs_cluster_name')
        service_name = self.outputs.get('ecs_service_name')
        self.assertIsNotNone(service_name)

        response = self.ecs.describe_services(cluster=cluster_name, services=[service_name])
        self.assertEqual(len(response['services']), 1)
        self.assertEqual(response['services'][0]['serviceName'], service_name)
        self.assertEqual(response['services'][0]['status'], 'ACTIVE')

    def test_ecs_service_desired_count(self):
        """Test that ECS service has correct desired count."""
        cluster_name = self.outputs.get('ecs_cluster_name')
        service_name = self.outputs.get('ecs_service_name')

        response = self.ecs.describe_services(cluster=cluster_name, services=[service_name])
        desired_count = response['services'][0]['desiredCount']
        self.assertEqual(desired_count, 2)

    def test_alb_exists(self):
        """Test that Application Load Balancer was created."""
        alb_endpoint = self.outputs.get('alb_endpoint')
        self.assertIsNotNone(alb_endpoint)

        response = self.elbv2.describe_load_balancers()
        alb_found = False
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_endpoint:
                alb_found = True
                self.assertEqual(lb['Type'], 'application')
                self.assertEqual(lb['Scheme'], 'internet-facing')
                break

        self.assertTrue(alb_found, f"ALB with DNS {alb_endpoint} not found")

    def test_alb_target_group_exists(self):
        """Test that target group was created."""
        alb_endpoint = self.outputs.get('alb_endpoint')
        response = self.elbv2.describe_load_balancers()

        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_endpoint:
                lb_arn = lb['LoadBalancerArn']
                listeners = self.elbv2.describe_listeners(LoadBalancerArn=lb_arn)
                self.assertGreaterEqual(len(listeners['Listeners']), 1)

                # Get target group from listener
                default_actions = listeners['Listeners'][0]['DefaultActions']
                self.assertEqual(len(default_actions), 1)
                self.assertEqual(default_actions[0]['Type'], 'forward')
                break

    def test_alb_health_check_configuration(self):
        """Test ALB target group health check configuration."""
        alb_endpoint = self.outputs.get('alb_endpoint')
        response = self.elbv2.describe_load_balancers()

        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_endpoint:
                lb_arn = lb['LoadBalancerArn']
                listeners = self.elbv2.describe_listeners(LoadBalancerArn=lb_arn)
                tg_arn = listeners['Listeners'][0]['DefaultActions'][0]['TargetGroupArn']

                tg_response = self.elbv2.describe_target_groups(TargetGroupArns=[tg_arn])
                tg = tg_response['TargetGroups'][0]

                self.assertEqual(tg['HealthCheckPath'], '/health')
                self.assertEqual(tg['HealthCheckPort'], '8080')
                self.assertEqual(tg['HealthCheckProtocol'], 'HTTP')
                break

    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch log group was created."""
        # Log group follows pattern /ecs/product-catalog-api-{suffix}
        environment_suffix = self.outputs.get('ecs_cluster_name', '').split('-')[-1]
        log_group_name = f"/ecs/product-catalog-api-{environment_suffix}"

        response = self.logs.describe_log_groups(logGroupNamePrefix=log_group_name)
        self.assertGreaterEqual(len(response['logGroups']), 1)

        # Check retention
        log_group = response['logGroups'][0]
        self.assertEqual(log_group.get('retentionInDays'), 7)

    def test_ssm_parameters_exist(self):
        """Test that SSM parameters were created."""
        environment_suffix = self.outputs.get('ecs_cluster_name', '').split('-')[-1]
        db_param_name = f"/product-catalog/db-connection-{environment_suffix}"
        api_key_param_name = f"/product-catalog/api-key-{environment_suffix}"

        # Test DB connection parameter
        db_response = self.ssm.get_parameter(Name=db_param_name, WithDecryption=False)
        self.assertEqual(db_response['Parameter']['Name'], db_param_name)
        self.assertEqual(db_response['Parameter']['Type'], 'SecureString')

        # Test API key parameter
        api_response = self.ssm.get_parameter(Name=api_key_param_name, WithDecryption=False)
        self.assertEqual(api_response['Parameter']['Name'], api_key_param_name)
        self.assertEqual(api_response['Parameter']['Type'], 'SecureString')

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms were created."""
        environment_suffix = self.outputs.get('ecs_cluster_name', '').split('-')[-1]
        cpu_alarm_name = f"ecs-high-cpu-alarm-{environment_suffix}"
        task_alarm_name = f"ecs-low-task-alarm-{environment_suffix}"

        response = self.cloudwatch.describe_alarms(AlarmNames=[cpu_alarm_name, task_alarm_name])
        self.assertEqual(len(response['MetricAlarms']), 2)

        # Check CPU alarm
        cpu_alarm = next((a for a in response['MetricAlarms'] if a['AlarmName'] == cpu_alarm_name), None)
        self.assertIsNotNone(cpu_alarm)
        self.assertEqual(cpu_alarm['MetricName'], 'CPUUtilization')
        self.assertEqual(cpu_alarm['Threshold'], 80.0)

        # Check task alarm
        task_alarm = next((a for a in response['MetricAlarms'] if a['AlarmName'] == task_alarm_name), None)
        self.assertIsNotNone(task_alarm)
        self.assertEqual(task_alarm['MetricName'], 'HealthyHostCount')
        self.assertEqual(task_alarm['Threshold'], 2.0)

    def test_autoscaling_target_exists(self):
        """Test that auto-scaling target was created."""
        cluster_name = self.outputs.get('ecs_cluster_name')
        service_name = self.outputs.get('ecs_service_name')
        resource_id = f"service/{cluster_name}/{service_name}"

        response = self.autoscaling.describe_scalable_targets(
            ServiceNamespace='ecs',
            ResourceIds=[resource_id]
        )

        self.assertEqual(len(response['ScalableTargets']), 1)
        target = response['ScalableTargets'][0]
        self.assertEqual(target['MinCapacity'], 2)
        self.assertEqual(target['MaxCapacity'], 10)

    def test_autoscaling_policy_exists(self):
        """Test that auto-scaling policy was created."""
        cluster_name = self.outputs.get('ecs_cluster_name')
        service_name = self.outputs.get('ecs_service_name')
        resource_id = f"service/{cluster_name}/{service_name}"

        response = self.autoscaling.describe_scaling_policies(
            ServiceNamespace='ecs',
            ResourceId=resource_id
        )

        self.assertGreaterEqual(len(response['ScalingPolicies']), 1)
        policy = response['ScalingPolicies'][0]
        self.assertEqual(policy['PolicyType'], 'TargetTrackingScaling')

        # Check target tracking configuration
        config = policy['TargetTrackingScalingPolicyConfiguration']
        self.assertEqual(config['TargetValue'], 70.0)
        self.assertEqual(config['PredefinedMetricSpecification']['PredefinedMetricType'],
                        'ECSServiceAverageCPUUtilization')

    def test_stack_outputs_format(self):
        """Test that all required stack outputs are present."""
        required_outputs = [
            'vpc_id',
            'alb_endpoint',
            'alb_url',
            'ecr_repository_uri',
            'ecs_cluster_name',
            'ecs_service_name'
        ]

        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Required output '{output}' not found")
            self.assertIsNotNone(self.outputs[output], f"Output '{output}' is None")

    def test_alb_url_format(self):
        """Test that ALB URL has correct format."""
        alb_url = self.outputs.get('alb_url')
        self.assertIsNotNone(alb_url)
        self.assertTrue(alb_url.startswith('http://'))
        self.assertIn('elb.amazonaws.com', alb_url)


if __name__ == '__main__':
    unittest.main()
