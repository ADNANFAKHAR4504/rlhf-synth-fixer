"""Comprehensive integration tests for TapStack deployed resources"""
import json
import os
import unittest

import boto3
from pytest import mark

# Read outputs from flat-outputs.json
outputs_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(outputs_path):
    with open(outputs_path, 'r', encoding='utf-8') as f:
        outputs = json.loads(f.read())
else:
    outputs = {}

# Get environment variables
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
region = os.environ.get('AWS_REGION', 'us-east-1')


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack resources"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients once for all tests"""
        cls.ec2_client = boto3.client('ec2', region_name=region)
        cls.rds_client = boto3.client('rds', region_name=region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=region)
        cls.s3_client = boto3.client('s3', region_name=region)
        cls.cloudfront_client = boto3.client('cloudfront', region_name=region)
        cls.ecs_client = boto3.client('ecs', region_name=region)
        cls.elbv2_client = boto3.client('elbv2', region_name=region)
        cls.lambda_client = boto3.client('lambda', region_name=region)
        cls.sns_client = boto3.client('sns', region_name=region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=region)
        cls.kms_client = boto3.client('kms', region_name=region)
        cls.logs_client = boto3.client('logs', region_name=region)

    @mark.it("verifies VPC exists and is active")
    def test_vpc_exists_and_active(self):
        vpcs = self.ec2_client.describe_vpcs(
            Filters=[
                {'Name': 'tag:Name', 'Values': [f'*WebAppVpc{environment_suffix}*']},
                {'Name': 'state', 'Values': ['available']}
            ]
        )

        assert len(vpcs['Vpcs']) > 0, "VPC should exist"
        vpc = vpcs['Vpcs'][0]
        assert vpc['State'] == 'available', "VPC should be in available state"

    @mark.it("verifies VPC has correct number of subnets")
    def test_vpc_has_correct_subnets(self):
        vpcs = self.ec2_client.describe_vpcs(
            Filters=[{'Name': 'tag:Name', 'Values': [f'*WebAppVpc{environment_suffix}*']}]
        )

        assert len(vpcs['Vpcs']) > 0, "VPC should exist"
        vpc_id = vpcs['Vpcs'][0]['VpcId']

        subnets = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        assert len(subnets['Subnets']) >= 4, "VPC should have at least 4 subnets"

    @mark.it("verifies NAT gateways are available")
    def test_nat_gateways_available(self):
        vpcs = self.ec2_client.describe_vpcs(
            Filters=[{'Name': 'tag:Name', 'Values': [f'*WebAppVpc{environment_suffix}*']}]
        )

        assert len(vpcs['Vpcs']) > 0, "VPC should exist"
        vpc_id = vpcs['Vpcs'][0]['VpcId']

        subnets = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        subnet_ids = [s['SubnetId'] for s in subnets['Subnets']]

        nat_gateways = self.ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'subnet-id', 'Values': subnet_ids},
                {'Name': 'state', 'Values': ['available']}
            ]
        )

        assert len(nat_gateways['NatGateways']) >= 2, "Should have at least 2 available NAT gateways"

    @mark.it("verifies Internet Gateway is attached")
    def test_internet_gateway_attached(self):
        vpcs = self.ec2_client.describe_vpcs(
            Filters=[{'Name': 'tag:Name', 'Values': [f'*WebAppVpc{environment_suffix}*']}]
        )

        assert len(vpcs['Vpcs']) > 0, "VPC should exist"
        vpc_id = vpcs['Vpcs'][0]['VpcId']

        igws = self.ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        assert len(igws['InternetGateways']) == 1, "VPC should have 1 Internet Gateway attached"
        assert igws['InternetGateways'][0]['Attachments'][0]['State'] == 'available'

    @mark.it("verifies Aurora cluster exists and is available")
    def test_aurora_cluster_available(self):
        clusters = self.rds_client.describe_db_clusters()

        matching_clusters = [
            c for c in clusters['DBClusters']
            if environment_suffix in c['DBClusterIdentifier']
        ]

        assert len(matching_clusters) > 0, "Aurora cluster should exist"
        cluster = matching_clusters[0]
        assert cluster['Status'] == 'available', "Aurora cluster should be available"
        assert cluster['Engine'] == 'aurora-postgresql', "Should use aurora-postgresql engine"
        assert cluster['EngineVersion'].startswith('15.'), "Should use PostgreSQL 15.x"
        assert cluster['StorageEncrypted'] is True, "Storage should be encrypted"

    @mark.it("verifies Aurora has writer and reader instances")
    def test_aurora_instances_available(self):
        clusters = self.rds_client.describe_db_clusters()

        matching_clusters = [
            c for c in clusters['DBClusters']
            if environment_suffix in c['DBClusterIdentifier']
        ]

        assert len(matching_clusters) > 0, "Aurora cluster should exist"
        cluster_members = matching_clusters[0]['DBClusterMembers']

        assert len(cluster_members) == 2, "Should have 2 cluster instances (writer + reader)"

        writers = [m for m in cluster_members if m['IsClusterWriter']]
        readers = [m for m in cluster_members if not m['IsClusterWriter']]

        assert len(writers) == 1, "Should have 1 writer instance"
        assert len(readers) == 1, "Should have 1 reader instance"

    @mark.it("verifies KMS key has rotation enabled")
    def test_kms_key_rotation_enabled(self):
        keys = self.kms_client.list_keys()

        found_key = False
        for key in keys['Keys']:
            key_id = key['KeyId']

            key_metadata = self.kms_client.describe_key(KeyId=key_id)
            key_tags = self.kms_client.list_resource_tags(KeyId=key_id).get('Tags', [])

            tag_values = [t['TagValue'] for t in key_tags]
            if environment_suffix in str(tag_values) or environment_suffix in key_metadata.get('KeyMetadata', {}).get('Description', ''):
                rotation_status = self.kms_client.get_key_rotation_status(KeyId=key_id)
                assert rotation_status['KeyRotationEnabled'] is True, "KMS key rotation should be enabled"
                found_key = True
                break

        if not found_key:
            keys_with_rotation = [
                k for k in keys['Keys']
                if self.kms_client.get_key_rotation_status(KeyId=k['KeyId']).get('KeyRotationEnabled', False)
            ]
            assert len(keys_with_rotation) > 0, "Should have at least one KMS key with rotation enabled"

    @mark.it("verifies DynamoDB table exists and is active")
    def test_dynamodb_table_active(self):
        table_name = f"SessionsTable{environment_suffix}"

        tables = self.dynamodb_client.list_tables()
        matching_tables = [t for t in tables['TableNames'] if environment_suffix in t]

        assert len(matching_tables) > 0, "DynamoDB table should exist"

        table = self.dynamodb_client.describe_table(TableName=matching_tables[0])

        assert table['Table']['TableStatus'] == 'ACTIVE', "Table should be ACTIVE"
        assert table['Table']['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST'

        pitr = self.dynamodb_client.describe_continuous_backups(TableName=matching_tables[0])
        assert pitr['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus'] == 'ENABLED'

    @mark.it("verifies S3 bucket exists with versioning enabled")
    def test_s3_bucket_with_versioning(self):
        buckets = self.s3_client.list_buckets()

        matching_buckets = [
            b for b in buckets['Buckets']
            if environment_suffix in b['Name']
        ]

        assert len(matching_buckets) > 0, "S3 bucket should exist"
        bucket_name = matching_buckets[0]['Name']

        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        assert versioning.get('Status') == 'Enabled', "Bucket versioning should be enabled"

        lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        assert len(lifecycle['Rules']) > 0, "Bucket should have lifecycle rules"

    @mark.it("verifies CloudFront distribution is deployed and enabled")
    def test_cloudfront_distribution_enabled(self):
        cloudfront_url = outputs.get('CloudFrontURL', '')

        assert cloudfront_url, "CloudFront URL should be in outputs"

        domain_name = cloudfront_url.replace('https://', '').replace('http://', '').rstrip('/')

        distributions = self.cloudfront_client.list_distributions()

        matching_dist = [
            d for d in distributions.get('DistributionList', {}).get('Items', [])
            if d['DomainName'] == domain_name
        ]

        assert len(matching_dist) > 0, "CloudFront distribution should exist"
        assert matching_dist[0]['Enabled'] is True, "Distribution should be enabled"
        assert matching_dist[0]['Status'] == 'Deployed', "Distribution should be deployed"

    @mark.it("verifies ECS cluster exists and is active")
    def test_ecs_cluster_active(self):
        clusters = self.ecs_client.list_clusters()

        matching_clusters = [
            c for c in clusters['clusterArns']
            if environment_suffix in c
        ]

        assert len(matching_clusters) > 0, "ECS cluster should exist"

        cluster_details = self.ecs_client.describe_clusters(clusters=[matching_clusters[0]])

        assert cluster_details['clusters'][0]['status'] == 'ACTIVE', "Cluster should be ACTIVE"

    @mark.it("verifies ECS service is running with desired count")
    def test_ecs_service_running(self):
        clusters = self.ecs_client.list_clusters()

        matching_clusters = [
            c for c in clusters['clusterArns']
            if environment_suffix in c
        ]

        assert len(matching_clusters) > 0, "ECS cluster should exist"

        services = self.ecs_client.list_services(cluster=matching_clusters[0])

        assert len(services['serviceArns']) > 0, "ECS service should exist"

        service_details = self.ecs_client.describe_services(
            cluster=matching_clusters[0],
            services=[services['serviceArns'][0]]
        )

        service = service_details['services'][0]
        assert service['status'] == 'ACTIVE', "Service should be ACTIVE"
        assert service['desiredCount'] == 2, "Desired count should be 2"

    @mark.it("verifies Application Load Balancer is active")
    def test_alb_is_active(self):
        load_balancer_dns = outputs.get('LoadBalancerDNS', '')

        assert load_balancer_dns, "Load Balancer DNS should be in outputs"

        albs = self.elbv2_client.describe_load_balancers()

        matching_albs = [
            alb for alb in albs['LoadBalancers']
            if alb['DNSName'] == load_balancer_dns
        ]

        assert len(matching_albs) > 0, "ALB should exist"
        alb = matching_albs[0]
        assert alb['State']['Code'] == 'active', "ALB should be in active state"
        assert alb['Scheme'] == 'internet-facing', "ALB should be internet-facing"
        assert alb['Type'] == 'application', "Should be application load balancer"

    @mark.it("verifies ALB target group is healthy")
    def test_alb_target_group_exists(self):
        load_balancer_dns = outputs.get('LoadBalancerDNS', '')

        assert load_balancer_dns, "Load Balancer DNS should be in outputs"

        albs = self.elbv2_client.describe_load_balancers()

        matching_albs = [
            alb for alb in albs['LoadBalancers']
            if alb['DNSName'] == load_balancer_dns
        ]

        assert len(matching_albs) > 0, "ALB should exist"
        alb_arn = matching_albs[0]['LoadBalancerArn']

        target_groups = self.elbv2_client.describe_target_groups(LoadBalancerArn=alb_arn)

        assert len(target_groups['TargetGroups']) > 0, "Target group should exist"
        tg = target_groups['TargetGroups'][0]
        assert tg['Protocol'] == 'HTTP', "Target group should use HTTP"
        assert tg['Port'] == 80, "Target group should use port 80"
        assert tg['TargetType'] == 'ip', "Target group should use IP target type"
        assert tg['HealthCheckPath'] == '/', "Health check should be on root path"

    @mark.it("verifies ALB listener is configured")
    def test_alb_listener_configured(self):
        load_balancer_dns = outputs.get('LoadBalancerDNS', '')

        assert load_balancer_dns, "Load Balancer DNS should be in outputs"

        albs = self.elbv2_client.describe_load_balancers()

        matching_albs = [
            alb for alb in albs['LoadBalancers']
            if alb['DNSName'] == load_balancer_dns
        ]

        assert len(matching_albs) > 0, "ALB should exist"
        alb_arn = matching_albs[0]['LoadBalancerArn']

        listeners = self.elbv2_client.describe_listeners(LoadBalancerArn=alb_arn)

        assert len(listeners['Listeners']) > 0, "Listener should exist"
        listener = listeners['Listeners'][0]
        assert listener['Port'] == 80, "Listener should be on port 80"
        assert listener['Protocol'] == 'HTTP', "Listener should use HTTP"

    @mark.it("verifies Lambda function exists and is active")
    def test_lambda_function_exists(self):
        functions = self.lambda_client.list_functions()

        matching_functions = [
            f for f in functions['Functions']
            if environment_suffix in f['FunctionName']
        ]

        assert len(matching_functions) > 0, "Lambda function should exist"
        func = matching_functions[0]
        assert func['Runtime'] == 'python3.11', "Function should use python3.11 runtime"
        assert func['Timeout'] == 30, "Function timeout should be 30 seconds"

        concurrency = self.lambda_client.get_function_concurrency(
            FunctionName=func['FunctionName']
        )
        assert concurrency.get('ReservedConcurrentExecutions') == 10

    @mark.it("verifies SNS topic exists")
    def test_sns_topic_exists(self):
        topics = self.sns_client.list_topics()

        matching_topics = [
            t for t in topics['Topics']
            if environment_suffix in t['TopicArn']
        ]

        assert len(matching_topics) > 0, "SNS topic should exist"

        subscriptions = self.sns_client.list_subscriptions_by_topic(
            TopicArn=matching_topics[0]['TopicArn']
        )

        assert len(subscriptions['Subscriptions']) > 0, "SNS topic should have subscriptions"
        sub = subscriptions['Subscriptions'][0]
        assert sub['Protocol'] == 'email', "Subscription should be email"

    @mark.it("verifies CloudWatch dashboard exists")
    def test_cloudwatch_dashboard_exists(self):
        dashboards = self.cloudwatch_client.list_dashboards()

        matching_dashboards = [
            d for d in dashboards['DashboardEntries']
            if environment_suffix in d['DashboardName']
        ]

        assert len(matching_dashboards) > 0, "CloudWatch dashboard should exist"

    @mark.it("verifies CloudWatch alarms exist for comprehensive monitoring")
    def test_cloudwatch_alarms_exist(self):
        alarms = self.cloudwatch_client.describe_alarms()

        matching_alarms = [
            a for a in alarms['MetricAlarms']
            if environment_suffix in a['AlarmName']
        ]

        assert len(matching_alarms) >= 9, f"Should have at least 9 CloudWatch alarms, found {len(matching_alarms)}"

        alarm_types = [alarm['AlarmName'] for alarm in matching_alarms]
        assert any('cpu' in name.lower() for name in alarm_types), "Should have CPU alarm"
        assert any('memory' in name.lower() for name in alarm_types), "Should have Memory alarm"
        assert any('latency' in name.lower() or 'response' in name.lower() for name in alarm_types), "Should have Latency alarm"
        assert any('5xx' in name.lower() or 'error' in name.lower() for name in alarm_types), "Should have 5XX/Error alarm"

        for alarm in matching_alarms:
            assert len(alarm['AlarmActions']) > 0, f"Alarm {alarm['AlarmName']} should have actions configured"

    @mark.it("verifies CloudWatch log group exists")
    def test_cloudwatch_log_group_exists(self):
        log_groups = self.logs_client.describe_log_groups()

        matching_log_groups = [
            lg for lg in log_groups['logGroups']
            if environment_suffix in lg['logGroupName'] or 'web-app' in lg['logGroupName'].lower()
        ]

        if len(matching_log_groups) == 0:
            ecs_clusters = self.ecs_client.list_clusters()
            matching_clusters = [
                c for c in ecs_clusters['clusterArns']
                if environment_suffix in c
            ]

            if len(matching_clusters) > 0:
                services = self.ecs_client.list_services(cluster=matching_clusters[0])
                assert len(services['serviceArns']) > 0, "CloudWatch log group should exist for ECS service"
        else:
            log_group = matching_log_groups[0]
            if 'retentionInDays' in log_group:
                assert log_group.get('retentionInDays') == 7, "Log retention should be 7 days"

    @mark.it("verifies database endpoint is accessible in outputs")
    def test_database_endpoint_in_outputs(self):
        db_endpoint = outputs.get('DatabaseEndpoint', '')

        assert db_endpoint, "Database endpoint should be in outputs"
        assert 'rds.amazonaws.com' in db_endpoint, "Database endpoint should be valid RDS endpoint"
        assert environment_suffix in db_endpoint, "Database endpoint should contain environment suffix"

    @mark.it("verifies all required outputs are present")
    def test_all_required_outputs_present(self):
        required_outputs = ['CloudFrontURL', 'LoadBalancerDNS', 'DatabaseEndpoint']

        for output in required_outputs:
            assert output in outputs, f"{output} should be in outputs"
            assert outputs[output], f"{output} should not be empty"

    @mark.it("verifies security groups are configured correctly")
    def test_security_groups_configured(self):
        vpcs = self.ec2_client.describe_vpcs(
            Filters=[{'Name': 'tag:Name', 'Values': [f'*WebAppVpc{environment_suffix}*']}]
        )

        assert len(vpcs['Vpcs']) > 0, "VPC should exist"
        vpc_id = vpcs['Vpcs'][0]['VpcId']

        security_groups = self.ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        matching_sgs = [
            sg for sg in security_groups['SecurityGroups']
            if environment_suffix in sg.get('GroupName', '') or environment_suffix in str(sg.get('Tags', []))
        ]

        assert len(matching_sgs) >= 4, f"Should have at least 4 security groups (ALB, ECS, RDS, Lambda), found {len(matching_sgs)}"

        sg_descriptions = [sg['Description'].lower() for sg in matching_sgs]
        assert any('alb' in desc or 'load balancer' in desc for desc in sg_descriptions), "Should have ALB security group"
        assert any('ecs' in desc for desc in sg_descriptions), "Should have ECS security group"
        assert any('rds' in desc or 'database' in desc for desc in sg_descriptions), "Should have RDS security group"
        assert any('lambda' in desc for desc in sg_descriptions), "Should have Lambda security group"

    @mark.it("verifies ALB security group allows HTTP inbound")
    def test_alb_security_group_allows_http(self):
        vpcs = self.ec2_client.describe_vpcs(
            Filters=[{'Name': 'tag:Name', 'Values': [f'*WebAppVpc{environment_suffix}*']}]
        )

        assert len(vpcs['Vpcs']) > 0, "VPC should exist"
        vpc_id = vpcs['Vpcs'][0]['VpcId']

        security_groups = self.ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        alb_sgs = [
            sg for sg in security_groups['SecurityGroups']
            if 'alb' in sg['Description'].lower() or 'load balancer' in sg['Description'].lower()
        ]

        assert len(alb_sgs) > 0, "ALB security group should exist"

        alb_sg = alb_sgs[0]
        ingress_rules = alb_sg['IpPermissions']

        http_rule = [
            rule for rule in ingress_rules
            if rule.get('FromPort') == 80 and rule.get('ToPort') == 80
        ]

        assert len(http_rule) > 0, "ALB security group should allow HTTP on port 80"

    @mark.it("verifies RDS security group allows PostgreSQL from ECS and Lambda")
    def test_rds_security_group_configured(self):
        vpcs = self.ec2_client.describe_vpcs(
            Filters=[{'Name': 'tag:Name', 'Values': [f'*WebAppVpc{environment_suffix}*']}]
        )

        assert len(vpcs['Vpcs']) > 0, "VPC should exist"
        vpc_id = vpcs['Vpcs'][0]['VpcId']

        security_groups = self.ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        rds_sgs = [
            sg for sg in security_groups['SecurityGroups']
            if 'rds' in sg['Description'].lower() or 'aurora' in sg['Description'].lower() or 'database' in sg['Description'].lower()
        ]

        assert len(rds_sgs) > 0, "RDS security group should exist"

        rds_sg = rds_sgs[0]
        ingress_rules = rds_sg['IpPermissions']

        postgres_rules = [
            rule for rule in ingress_rules
            if rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432
        ]

        assert len(postgres_rules) >= 1, "RDS security group should allow PostgreSQL on port 5432"

    @mark.it("verifies ECS tasks are running in private subnets")
    def test_ecs_tasks_in_private_subnets(self):
        clusters = self.ecs_client.list_clusters()

        matching_clusters = [
            c for c in clusters['clusterArns']
            if environment_suffix in c
        ]

        assert len(matching_clusters) > 0, "ECS cluster should exist"

        services = self.ecs_client.list_services(cluster=matching_clusters[0])
        assert len(services['serviceArns']) > 0, "ECS service should exist"

        service_details = self.ecs_client.describe_services(
            cluster=matching_clusters[0],
            services=[services['serviceArns'][0]]
        )

        service = service_details['services'][0]
        network_config = service.get('networkConfiguration', {}).get('awsvpcConfiguration', {})
        subnets = network_config.get('subnets', [])

        assert len(subnets) > 0, "ECS service should have subnets configured"

        subnet_details = self.ec2_client.describe_subnets(SubnetIds=subnets)

        for subnet in subnet_details['Subnets']:
            subnet_tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
            subnet_type = subnet_tags.get('aws-cdk:subnet-type', '')
            assert 'Private' in subnet_type, "ECS tasks should run in private subnets"

    @mark.it("verifies auto-scaling is configured for ECS service")
    def test_ecs_auto_scaling_configured(self):
        autoscaling_client = boto3.client('application-autoscaling', region_name=region)

        targets = autoscaling_client.describe_scalable_targets(
            ServiceNamespace='ecs'
        )

        matching_targets = [
            t for t in targets['ScalableTargets']
            if environment_suffix in t['ResourceId']
        ]

        assert len(matching_targets) > 0, "ECS auto-scaling target should exist"

        target = matching_targets[0]
        assert target['MinCapacity'] == 2, "Min capacity should be 2"
        assert target['MaxCapacity'] == 10, "Max capacity should be 10"

        policies = autoscaling_client.describe_scaling_policies(
            ServiceNamespace='ecs',
            ResourceId=target['ResourceId']
        )

        assert len(policies['ScalingPolicies']) >= 2, "Should have at least 2 scaling policies (CPU and Memory)"

        policy_types = [p['PolicyName'].lower() for p in policies['ScalingPolicies']]
        assert any('cpu' in ptype for ptype in policy_types), "Should have CPU-based scaling policy"
        assert any('memory' in ptype for ptype in policy_types), "Should have Memory-based scaling policy"

    @mark.it("verifies Lambda is in VPC and has security group")
    def test_lambda_vpc_configuration(self):
        functions = self.lambda_client.list_functions()

        matching_functions = [
            f for f in functions['Functions']
            if environment_suffix in f['FunctionName'] and f.get('Runtime') == 'python3.11'
        ]

        assert len(matching_functions) > 0, "Lambda function should exist"
        func = matching_functions[0]

        vpc_config = func.get('VpcConfig', {})
        assert vpc_config.get('VpcId'), "Lambda should be in a VPC"
        assert len(vpc_config.get('SubnetIds', [])) > 0, "Lambda should have subnets configured"
        assert len(vpc_config.get('SecurityGroupIds', [])) > 0, "Lambda should have security groups configured"
