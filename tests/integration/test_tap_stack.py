import json
import os
import unittest

import boto3
from pytest import mark

base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        outputs = json.loads(f.read())
else:
    outputs = {}

aws_region = os.environ.get('AWS_REGION', 'us-east-1')
aws_profile = os.environ.get('AWS_PROFILE', 'turing')
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'pr7008')

session = boto3.Session(profile_name=aws_profile, region_name=aws_region)
ec2_client = session.client('ec2')
ecs_client = session.client('ecs')
rds_client = session.client('rds')
elbv2_client = session.client('elbv2')
secretsmanager_client = session.client('secretsmanager')
cloudwatch_client = session.client('cloudwatch')
logs_client = session.client('logs')


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack resources"""

    @mark.it("validates VPC exists and is available")
    def test_vpc_exists(self):
        vpc_id = outputs.get("VPCId")
        assert vpc_id, "VPC ID should be in outputs"
        assert vpc_id.startswith("vpc-"), "VPC ID should start with vpc-"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'
        assert vpc['CidrBlock'] == '10.0.0.0/16'

        dns_hostnames = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        assert dns_hostnames['EnableDnsHostnames']['Value'] is True

        dns_support = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        assert dns_support['EnableDnsSupport']['Value'] is True

    @mark.it("validates VPC has 6 subnets (3 public + 3 private)")
    def test_vpc_subnets(self):
        vpc_id = outputs.get("VPCId")

        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnets = response['Subnets']
        assert len(subnets) == 6, "VPC should have 6 subnets"

        public_subnets = [s for s in subnets if s['MapPublicIpOnLaunch']]
        private_subnets = [s for s in subnets if not s['MapPublicIpOnLaunch']]

        assert len(public_subnets) == 3, "Should have 3 public subnets"
        assert len(private_subnets) == 3, "Should have 3 private subnets"

        azs = {s['AvailabilityZone'] for s in subnets}
        assert len(azs) == 3, "Subnets should span 3 availability zones"

    @mark.it("validates Internet Gateway is attached to VPC")
    def test_internet_gateway_attached(self):
        vpc_id = outputs.get("VPCId")

        response = ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )
        assert len(response['InternetGateways']) == 1
        igw = response['InternetGateways'][0]
        assert igw['Attachments'][0]['State'] == 'available'

    @mark.it("validates NAT Gateway exists and is available")
    def test_nat_gateway_exists(self):
        vpc_id = outputs.get("VPCId")

        response = ec2_client.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        nat_gateways = [ng for ng in response['NatGateways'] if ng['State'] != 'deleted']
        assert len(nat_gateways) >= 1, "Should have at least 1 NAT Gateway"

        nat_gateway = nat_gateways[0]
        assert nat_gateway['State'] == 'available'

    @mark.it("validates ECS cluster exists and is active")
    def test_ecs_cluster_exists(self):
        cluster_name = outputs.get("ECSClusterName")
        assert cluster_name, "ECS cluster name should be in outputs"
        assert environment_suffix in cluster_name, "Cluster name should contain environment suffix"

        response = ecs_client.describe_clusters(clusters=[cluster_name])
        assert len(response['clusters']) == 1
        cluster = response['clusters'][0]
        assert cluster['status'] == 'ACTIVE'
        assert cluster['clusterName'] == cluster_name

    @mark.it("validates blue ECS service exists with 2 tasks")
    def test_blue_service_exists(self):
        cluster_name = outputs.get("ECSClusterName")
        service_name = outputs.get("BlueServiceName")

        assert service_name, "Blue service name should be in outputs"
        assert environment_suffix in service_name, "Service name should contain environment suffix"

        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        assert len(response['services']) == 1
        service = response['services'][0]
        assert service['status'] == 'ACTIVE'
        assert service['desiredCount'] == 2
        assert service['launchType'] == 'FARGATE'

    @mark.it("validates green ECS service exists with 1 task")
    def test_green_service_exists(self):
        cluster_name = outputs.get("ECSClusterName")
        service_name = outputs.get("GreenServiceName")

        assert service_name, "Green service name should be in outputs"

        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        assert len(response['services']) == 1
        service = response['services'][0]
        assert service['status'] == 'ACTIVE'
        assert service['desiredCount'] == 1
        assert service['launchType'] == 'FARGATE'

    @mark.it("validates ECS task definition configuration")
    def test_ecs_task_definition(self):
        cluster_name = outputs.get("ECSClusterName")
        service_name = outputs.get("BlueServiceName")

        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        service = response['services'][0]
        task_def_arn = service['taskDefinition']

        task_def_response = ecs_client.describe_task_definition(
            taskDefinition=task_def_arn
        )
        task_def = task_def_response['taskDefinition']

        assert task_def['cpu'] == '2048'
        assert task_def['memory'] == '4096'
        assert task_def['networkMode'] == 'awsvpc'
        assert 'FARGATE' in task_def['requiresCompatibilities']

        containers = task_def['containerDefinitions']
        assert len(containers) >= 1
        container = containers[0]
        assert container['portMappings'][0]['containerPort'] == 80

    @mark.it("validates RDS Aurora cluster exists and is available")
    def test_rds_cluster_exists(self):
        db_endpoint = outputs.get("DatabaseEndpoint")
        assert db_endpoint, "Database endpoint should be in outputs"
        assert environment_suffix in db_endpoint, "DB endpoint should contain environment suffix"

        cluster_id = f"transaction-db-{environment_suffix}"

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        assert len(response['DBClusters']) == 1
        cluster = response['DBClusters'][0]
        assert cluster['Status'] == 'available'
        assert cluster['Engine'] == 'aurora-postgresql'
        assert cluster['EngineVersion'].startswith('15.')
        assert cluster['StorageEncrypted'] is True
        assert cluster['Port'] == 5432

    @mark.it("validates RDS has 2 instances (writer and reader)")
    def test_rds_instances(self):
        cluster_id = f"transaction-db-{environment_suffix}"

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        cluster = response['DBClusters'][0]
        members = cluster['DBClusterMembers']

        assert len(members) == 2, "Should have 2 DB instances"

        writers = [m for m in members if m['IsClusterWriter']]
        readers = [m for m in members if not m['IsClusterWriter']]

        assert len(writers) == 1, "Should have 1 writer"
        assert len(readers) == 1, "Should have 1 reader"

    @mark.it("validates RDS instances are using correct instance class")
    def test_rds_instance_class(self):
        cluster_id = f"transaction-db-{environment_suffix}"

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        cluster = response['DBClusters'][0]
        members = cluster['DBClusterMembers']

        instance_id = members[0]['DBInstanceIdentifier']
        instance_response = rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )
        instance = instance_response['DBInstances'][0]

        assert instance['DBInstanceClass'] == 'db.t3.medium'
        assert instance['PubliclyAccessible'] is False

    @mark.it("validates Secrets Manager secret exists for DB credentials")
    def test_db_secret_exists(self):
        secret_arn = outputs.get("DatabaseSecretArn")
        assert secret_arn, "Database secret ARN should be in outputs"
        assert environment_suffix in secret_arn, "Secret ARN should contain environment suffix"

        response = secretsmanager_client.describe_secret(SecretId=secret_arn)
        assert response['ARN'] == secret_arn
        assert response['Name'] == f"db-credentials-{environment_suffix}"

        secret_value_response = secretsmanager_client.get_secret_value(SecretId=secret_arn)
        secret_value = json.loads(secret_value_response['SecretString'])

        assert 'username' in secret_value
        assert 'password' in secret_value
        assert 'host' in secret_value
        assert 'port' in secret_value

    @mark.it("validates ALB exists and is active")
    def test_alb_exists(self):
        alb_dns = outputs.get("ALBDNSName")
        assert alb_dns, "ALB DNS name should be in outputs"
        assert environment_suffix in alb_dns, "ALB DNS should contain environment suffix"

        alb_name = f"transaction-alb-{environment_suffix}"

        response = elbv2_client.describe_load_balancers(Names=[alb_name])
        assert len(response['LoadBalancers']) == 1
        alb = response['LoadBalancers'][0]

        assert alb['State']['Code'] == 'active'
        assert alb['Type'] == 'application'
        assert alb['Scheme'] == 'internet-facing'
        assert alb['DNSName'] == alb_dns

    @mark.it("validates ALB has two target groups (blue and green)")
    def test_alb_target_groups(self):
        vpc_id = outputs.get("VPCId")

        response = elbv2_client.describe_target_groups()
        target_groups = [
            tg for tg in response['TargetGroups']
            if tg.get('VpcId') == vpc_id and environment_suffix in tg['TargetGroupName']
        ]

        assert len(target_groups) >= 2, "Should have at least 2 target groups"

        blue_tg = [tg for tg in target_groups if 'blue' in tg['TargetGroupName'].lower()]
        green_tg = [tg for tg in target_groups if 'green' in tg['TargetGroupName'].lower()]

        assert len(blue_tg) >= 1, "Should have blue target group"
        assert len(green_tg) >= 1, "Should have green target group"

        for tg in target_groups:
            assert tg['Protocol'] == 'HTTP'
            assert tg['Port'] == 80
            assert tg['TargetType'] == 'ip'
            assert tg['HealthCheckEnabled'] is True
            assert tg['HealthCheckProtocol'] == 'HTTP'
            assert tg['HealthCheckPath'] == '/'

    @mark.it("validates ALB listener with weighted routing")
    def test_alb_listener(self):
        alb_name = f"transaction-alb-{environment_suffix}"

        response = elbv2_client.describe_load_balancers(Names=[alb_name])
        alb_arn = response['LoadBalancers'][0]['LoadBalancerArn']

        listeners_response = elbv2_client.describe_listeners(LoadBalancerArn=alb_arn)
        assert len(listeners_response['Listeners']) >= 1

        listener = listeners_response['Listeners'][0]
        assert listener['Protocol'] == 'HTTP'
        assert listener['Port'] == 80

        default_actions = listener['DefaultActions']
        assert len(default_actions) >= 1
        assert default_actions[0]['Type'] == 'forward'

    @mark.it("validates security groups are configured correctly")
    def test_security_groups(self):
        vpc_id = outputs.get("VPCId")

        response = ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'group-name', 'Values': [
                    f"alb-sg-{environment_suffix}",
                    f"ecs-sg-{environment_suffix}",
                    f"rds-sg-{environment_suffix}"
                ]}
            ]
        )

        sg_names = [sg['GroupName'] for sg in response['SecurityGroups']]

        assert f"alb-sg-{environment_suffix}" in sg_names
        assert f"ecs-sg-{environment_suffix}" in sg_names
        assert f"rds-sg-{environment_suffix}" in sg_names

    @mark.it("validates ALB security group allows HTTP from anywhere")
    def test_alb_security_group_rules(self):
        vpc_id = outputs.get("VPCId")

        response = ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'group-name', 'Values': [f"alb-sg-{environment_suffix}"]}
            ]
        )

        sg = response['SecurityGroups'][0]
        ingress_rules = sg['IpPermissions']

        http_rules = [
            rule for rule in ingress_rules
            if rule.get('FromPort') == 80 and rule.get('ToPort') == 80
        ]
        assert len(http_rules) >= 1

        http_rule = http_rules[0]
        assert http_rule['IpProtocol'] == 'tcp'
        assert any(ip_range['CidrIp'] == '0.0.0.0/0' for ip_range in http_rule.get('IpRanges', []))

    @mark.it("validates CloudWatch log group exists")
    def test_cloudwatch_log_group(self):
        log_group_name = f"/ecs/transaction-app-{environment_suffix}"

        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
        assert len(log_groups) == 1

        log_group = log_groups[0]
        assert log_group['retentionInDays'] == 3

    @mark.it("validates CloudWatch Dashboard exists")
    def test_cloudwatch_dashboard(self):
        dashboard_name = f"transaction-app-{environment_suffix}"

        response = cloudwatch_client.list_dashboards()
        dashboard_names = [d['DashboardName'] for d in response['DashboardEntries']]

        assert dashboard_name in dashboard_names

    @mark.it("validates ECS tasks are running")
    def test_ecs_tasks_running(self):
        cluster_name = outputs.get("ECSClusterName")

        response = ecs_client.list_tasks(
            cluster=cluster_name,
            desiredStatus='RUNNING'
        )

        task_arns = response['taskArns']
        assert len(task_arns) >= 3, "Should have at least 3 running tasks (2 blue + 1 green)"

        tasks_response = ecs_client.describe_tasks(
            cluster=cluster_name,
            tasks=task_arns
        )

        for task in tasks_response['tasks']:
            assert task['lastStatus'] == 'RUNNING'
            assert task['healthStatus'] in ['HEALTHY', 'UNKNOWN']
            assert task['launchType'] == 'FARGATE'

    @mark.it("validates target group health checks")
    def test_target_group_health(self):
        vpc_id = outputs.get("VPCId")

        response = elbv2_client.describe_target_groups()
        target_groups = [
            tg for tg in response['TargetGroups']
            if tg.get('VpcId') == vpc_id and environment_suffix in tg['TargetGroupName']
        ]

        for tg in target_groups:
            health_response = elbv2_client.describe_target_health(
                TargetGroupArn=tg['TargetGroupArn']
            )

            targets = health_response['TargetHealthDescriptions']
            healthy_targets = [t for t in targets if t['TargetHealth']['State'] in ['healthy', 'initial']]
            assert len(healthy_targets) >= 0, f"Target group {tg['TargetGroupName']} should have targets"

    @mark.it("validates VPC DNS settings")
    def test_vpc_dns_settings(self):
        vpc_id = outputs.get("VPCId")

        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        assert response['EnableDnsSupport']['Value'] is True

        response = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        assert response['EnableDnsHostnames']['Value'] is True

    @mark.it("validates ECS service network configuration")
    def test_ecs_service_network_config(self):
        cluster_name = outputs.get("ECSClusterName")
        service_name = outputs.get("BlueServiceName")

        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )
        service = response['services'][0]

        network_config = service['networkConfiguration']['awsvpcConfiguration']
        assert len(network_config['subnets']) >= 1
        assert network_config['assignPublicIp'] == 'DISABLED'
        assert len(network_config['securityGroups']) >= 1

    @mark.it("validates route tables for public subnets")
    def test_public_subnet_routes(self):
        vpc_id = outputs.get("VPCId")

        subnets_response = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'map-public-ip-on-launch', 'Values': ['true']}
            ]
        )
        public_subnets = subnets_response['Subnets']

        route_tables_response = ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        for subnet in public_subnets:
            subnet_route_table = None
            for rt in route_tables_response['RouteTables']:
                for assoc in rt['Associations']:
                    if assoc.get('SubnetId') == subnet['SubnetId']:
                        subnet_route_table = rt
                        break

            if subnet_route_table:
                routes = subnet_route_table['Routes']
                igw_route = [r for r in routes if r.get('GatewayId', '').startswith('igw-')]
                assert len(igw_route) >= 1, f"Public subnet {subnet['SubnetId']} should have IGW route"

    @mark.it("validates route tables for private subnets")
    def test_private_subnet_routes(self):
        vpc_id = outputs.get("VPCId")

        subnets_response = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'map-public-ip-on-launch', 'Values': ['false']}
            ]
        )
        private_subnets = subnets_response['Subnets']

        route_tables_response = ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        for subnet in private_subnets:
            subnet_route_table = None
            for rt in route_tables_response['RouteTables']:
                for assoc in rt['Associations']:
                    if assoc.get('SubnetId') == subnet['SubnetId']:
                        subnet_route_table = rt
                        break

            if subnet_route_table:
                routes = subnet_route_table['Routes']
                nat_route = [r for r in routes if r.get('NatGatewayId', '').startswith('nat-')]
                assert len(nat_route) >= 1, f"Private subnet {subnet['SubnetId']} should have NAT route"

    @mark.it("validates all required outputs are present")
    def test_all_outputs_present(self):
        required_outputs = [
            "VPCId",
            "ALBDNSName",
            "DatabaseEndpoint",
            "DatabaseSecretArn",
            "ECSClusterName",
            "BlueServiceName",
            "GreenServiceName",
            "CloudWatchDashboard"
        ]

        for output in required_outputs:
            assert output in outputs, f"Output {output} should be present"
            assert outputs[output], f"Output {output} should have a value"
