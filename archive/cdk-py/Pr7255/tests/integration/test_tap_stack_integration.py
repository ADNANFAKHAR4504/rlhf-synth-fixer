"""
Integration tests for TapStack - Payment Processing Infrastructure

Tests live AWS resources deployed by the stack.
Requirements:
- Reads outputs from cfn-outputs/flat-outputs.json
- No hardcoding (uses environment variables)
- No try-catch blocks
- Tests actual deployed resources using AWS SDK (boto3)
"""
import json
import os
import uuid
from pathlib import Path

import boto3
import pytest
import requests

# Get environment variables
environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
region = os.environ.get('AWS_REGION', 'us-east-1')

# Read outputs from flat-outputs.json
outputs_path = Path(os.getcwd()) / 'cfn-outputs' / 'flat-outputs.json'
with open(outputs_path, 'r', encoding='utf-8') as f:
    outputs = json.load(f)

# Extract outputs
api_endpoint = outputs.get('ApiEndpoint')
payments_table_name = outputs.get('PaymentsTableName')
payment_queue_url = outputs.get('PaymentQueueUrl')
payment_dlq_url = outputs.get('PaymentDlqUrl')
payment_dlq_arn = outputs.get('PaymentDlqArn')
audit_bucket_name = outputs.get('AuditBucketName')
cost_topic_arn = outputs.get('CostTopicArn')
security_topic_arn = outputs.get('SecurityTopicArn')
ops_topic_arn = outputs.get('OpsTopicArn')
vpc_id = outputs.get('VpcId')
waf_acl_arn = outputs.get('WafAclArn')
payment_processor_function_name = outputs.get('PaymentProcessorFunctionName')
payment_processor_function_arn = outputs.get('PaymentProcessorFunctionArn')
event_handler_function_name = outputs.get('EventHandlerFunctionName')
event_handler_function_arn = outputs.get('EventHandlerFunctionArn')
db_secret_arn = outputs.get('DbSecretArn')
asg_name = outputs.get('AsgName')
lambda_security_group_id = outputs.get('LambdaSecurityGroupId')
ec2_security_group_id = outputs.get('Ec2SecurityGroupId')

# Initialize AWS clients
dynamodb_client = boto3.client('dynamodb', region_name=region)
sqs_client = boto3.client('sqs', region_name=region)
sns_client = boto3.client('sns', region_name=region)
s3_client = boto3.client('s3', region_name=region)
lambda_client = boto3.client('lambda', region_name=region)
secretsmanager_client = boto3.client('secretsmanager', region_name=region)
ec2_client = boto3.client('ec2', region_name=region)
autoscaling_client = boto3.client('autoscaling', region_name=region)
wafv2_client = boto3.client('wafv2', region_name=region)
apigateway_client = boto3.client('apigateway', region_name=region)
cloudwatch_client = boto3.client('cloudwatch', region_name=region)
events_client = boto3.client('events', region_name=region)


class TestDynamoDBTable:
    """Integration tests for DynamoDB table"""

    def test_table_exists_and_active(self):
        """Verify DynamoDB table exists and is active"""
        response = dynamodb_client.describe_table(TableName=payments_table_name)

        assert response['Table']['TableName'] == payments_table_name
        assert response['Table']['TableStatus'] == 'ACTIVE'

    def test_table_billing_mode(self):
        """Verify table uses PAY_PER_REQUEST billing"""
        response = dynamodb_client.describe_table(TableName=payments_table_name)

        assert response['Table']['BillingModeSummary']['BillingMode'] == 'PAY_PER_REQUEST'

    def test_table_encryption_enabled(self):
        """Verify server-side encryption is enabled"""
        response = dynamodb_client.describe_table(TableName=payments_table_name)

        assert response['Table']['SSEDescription']['Status'] == 'ENABLED'

    def test_table_point_in_time_recovery(self):
        """Verify point-in-time recovery is enabled"""
        response = dynamodb_client.describe_continuous_backups(TableName=payments_table_name)

        pitr_status = response['ContinuousBackupsDescription']['PointInTimeRecoveryDescription']['PointInTimeRecoveryStatus']
        assert pitr_status == 'ENABLED'

    def test_table_has_gsi(self):
        """Verify table has status-index GSI"""
        response = dynamodb_client.describe_table(TableName=payments_table_name)

        gsi_names = [gsi['IndexName'] for gsi in response['Table'].get('GlobalSecondaryIndexes', [])]
        assert 'status-index' in gsi_names

    def test_table_key_schema(self):
        """Verify table has correct key schema"""
        response = dynamodb_client.describe_table(TableName=payments_table_name)

        key_schema = {k['AttributeName']: k['KeyType'] for k in response['Table']['KeySchema']}
        assert key_schema.get('payment_id') == 'HASH'
        assert key_schema.get('timestamp') == 'RANGE'


class TestSQSQueues:
    """Integration tests for SQS queues"""

    def test_payment_queue_exists(self):
        """Verify payment queue exists"""
        response = sqs_client.get_queue_attributes(
            QueueUrl=payment_queue_url,
            AttributeNames=['QueueArn']
        )

        assert 'Attributes' in response
        assert 'QueueArn' in response['Attributes']

    def test_payment_queue_has_dlq(self):
        """Verify payment queue has DLQ configured"""
        response = sqs_client.get_queue_attributes(
            QueueUrl=payment_queue_url,
            AttributeNames=['RedrivePolicy']
        )

        redrive_policy = json.loads(response['Attributes']['RedrivePolicy'])
        assert redrive_policy['deadLetterTargetArn'] == payment_dlq_arn
        assert redrive_policy['maxReceiveCount'] == 3

    def test_dlq_exists(self):
        """Verify DLQ exists"""
        response = sqs_client.get_queue_attributes(
            QueueUrl=payment_dlq_url,
            AttributeNames=['QueueArn']
        )

        assert response['Attributes']['QueueArn'] == payment_dlq_arn

    def test_queues_are_encrypted(self):
        """Verify queues have encryption enabled"""
        response = sqs_client.get_queue_attributes(
            QueueUrl=payment_queue_url,
            AttributeNames=['KmsMasterKeyId']
        )

        assert 'KmsMasterKeyId' in response['Attributes']


class TestSNSTopics:
    """Integration tests for SNS topics"""

    def test_cost_topic_exists(self):
        """Verify cost alerts topic exists"""
        response = sns_client.get_topic_attributes(TopicArn=cost_topic_arn)

        assert response['Attributes']['TopicArn'] == cost_topic_arn

    def test_security_topic_exists(self):
        """Verify security alerts topic exists"""
        response = sns_client.get_topic_attributes(TopicArn=security_topic_arn)

        assert response['Attributes']['TopicArn'] == security_topic_arn

    def test_ops_topic_exists(self):
        """Verify ops alerts topic exists"""
        response = sns_client.get_topic_attributes(TopicArn=ops_topic_arn)

        assert response['Attributes']['TopicArn'] == ops_topic_arn


class TestS3Bucket:
    """Integration tests for S3 bucket"""

    def test_bucket_exists(self):
        """Verify audit bucket exists"""
        response = s3_client.head_bucket(Bucket=audit_bucket_name)

        assert response['ResponseMetadata']['HTTPStatusCode'] == 200

    def test_bucket_versioning_enabled(self):
        """Verify bucket versioning is enabled"""
        response = s3_client.get_bucket_versioning(Bucket=audit_bucket_name)

        assert response['Status'] == 'Enabled'

    def test_bucket_encryption_enabled(self):
        """Verify bucket encryption is enabled"""
        response = s3_client.get_bucket_encryption(Bucket=audit_bucket_name)

        rules = response['ServerSideEncryptionConfiguration']['Rules']
        assert len(rules) > 0
        assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'

    def test_bucket_public_access_blocked(self):
        """Verify bucket blocks public access"""
        response = s3_client.get_public_access_block(Bucket=audit_bucket_name)

        config = response['PublicAccessBlockConfiguration']
        assert config['BlockPublicAcls'] is True
        assert config['BlockPublicPolicy'] is True
        assert config['IgnorePublicAcls'] is True
        assert config['RestrictPublicBuckets'] is True

    def test_bucket_lifecycle_rules(self):
        """Verify bucket has lifecycle rules"""
        response = s3_client.get_bucket_lifecycle_configuration(Bucket=audit_bucket_name)

        rules = response['Rules']
        glacier_rule = next((r for r in rules if r['ID'] == 'TransitionToGlacier'), None)
        assert glacier_rule is not None
        assert glacier_rule['Status'] == 'Enabled'


class TestLambdaFunctions:
    """Integration tests for Lambda functions"""

    def test_payment_processor_exists(self):
        """Verify payment processor function exists"""
        response = lambda_client.get_function(FunctionName=payment_processor_function_name)

        assert response['Configuration']['FunctionName'] == payment_processor_function_name
        assert response['Configuration']['FunctionArn'] == payment_processor_function_arn

    def test_payment_processor_configuration(self):
        """Verify payment processor function configuration"""
        response = lambda_client.get_function(FunctionName=payment_processor_function_name)

        config = response['Configuration']
        assert config['Runtime'] == 'python3.11'
        # Memory and timeout are environment-specific (dev: 512/30, prod: 1024/60)
        assert config['MemorySize'] >= 512
        assert config['Timeout'] >= 30
        assert config['Architectures'] == ['arm64']

    def test_payment_processor_in_vpc(self):
        """Verify payment processor is in VPC"""
        response = lambda_client.get_function(FunctionName=payment_processor_function_name)

        vpc_config = response['Configuration']['VpcConfig']
        assert vpc_config['VpcId'] == vpc_id
        assert lambda_security_group_id in vpc_config['SecurityGroupIds']

    def test_event_handler_exists(self):
        """Verify event handler function exists"""
        response = lambda_client.get_function(FunctionName=event_handler_function_name)

        assert response['Configuration']['FunctionName'] == event_handler_function_name
        assert response['Configuration']['FunctionArn'] == event_handler_function_arn

    def test_event_handler_configuration(self):
        """Verify event handler function configuration"""
        response = lambda_client.get_function(FunctionName=event_handler_function_name)

        config = response['Configuration']
        assert config['Runtime'] == 'python3.11'
        # Memory and timeout are environment-specific (dev: 512/60, prod: 1024/120)
        assert config['MemorySize'] >= 512
        assert config['Timeout'] >= 60
        assert config['Architectures'] == ['arm64']


class TestSecretsManager:
    """Integration tests for Secrets Manager"""

    def test_secret_exists(self):
        """Verify database secret exists"""
        response = secretsmanager_client.describe_secret(SecretId=db_secret_arn)

        assert response['ARN'] == db_secret_arn
        assert 'payment-db-credentials' in response['Name']

    def test_secret_has_value(self):
        """Verify secret has a value"""
        response = secretsmanager_client.get_secret_value(SecretId=db_secret_arn)

        secret_value = json.loads(response['SecretString'])
        assert 'username' in secret_value
        assert 'password' in secret_value
        assert secret_value['username'] == 'paymentuser'


class TestVPCAndNetworking:
    """Integration tests for VPC and networking"""

    def test_vpc_exists(self):
        """Verify VPC exists"""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['VpcId'] == vpc_id
        assert response['Vpcs'][0]['State'] == 'available'

    def test_lambda_security_group_exists(self):
        """Verify Lambda security group exists"""
        response = ec2_client.describe_security_groups(GroupIds=[lambda_security_group_id])

        assert len(response['SecurityGroups']) == 1
        assert response['SecurityGroups'][0]['GroupId'] == lambda_security_group_id

    def test_ec2_security_group_exists(self):
        """Verify EC2 security group exists"""
        response = ec2_client.describe_security_groups(GroupIds=[ec2_security_group_id])

        assert len(response['SecurityGroups']) == 1
        assert response['SecurityGroups'][0]['GroupId'] == ec2_security_group_id

    def test_ec2_security_group_allows_https(self):
        """Verify EC2 security group allows HTTPS from VPC"""
        response = ec2_client.describe_security_groups(GroupIds=[ec2_security_group_id])

        sg = response['SecurityGroups'][0]
        https_rule = next(
            (r for r in sg['IpPermissions'] if r.get('FromPort') == 443 and r.get('ToPort') == 443),
            None
        )
        assert https_rule is not None


class TestAutoScalingGroup:
    """Integration tests for Auto Scaling group"""

    def test_asg_exists(self):
        """Verify Auto Scaling group exists"""
        response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )

        assert len(response['AutoScalingGroups']) == 1
        assert response['AutoScalingGroups'][0]['AutoScalingGroupName'] == asg_name

    def test_asg_capacity_settings(self):
        """Verify ASG capacity settings"""
        response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )

        asg = response['AutoScalingGroups'][0]
        # Environment-specific config: min is always >= 1, max >= min
        assert asg['MinSize'] >= 1
        assert asg['MaxSize'] >= asg['MinSize']
        # Desired capacity can be between min and max based on scaling policies
        assert asg['MinSize'] <= asg['DesiredCapacity'] <= asg['MaxSize']

    def test_asg_in_vpc(self):
        """Verify ASG is in correct VPC"""
        response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )

        asg = response['AutoScalingGroups'][0]
        subnet_ids = asg['VPCZoneIdentifier'].split(',')

        # Verify at least one subnet belongs to our VPC
        for subnet_id in subnet_ids:
            subnet_response = ec2_client.describe_subnets(SubnetIds=[subnet_id.strip()])
            assert subnet_response['Subnets'][0]['VpcId'] == vpc_id


class TestWAF:
    """Integration tests for WAF WebACL"""

    def test_waf_acl_exists(self):
        """Verify WAF WebACL exists"""
        # Extract WebACL ID and name from ARN
        # ARN format: arn:aws:wafv2:region:account:regional/webacl/name/id
        arn_parts = waf_acl_arn.split('/')
        webacl_name = arn_parts[-2]
        webacl_id = arn_parts[-1]

        response = wafv2_client.get_web_acl(
            Name=webacl_name,
            Scope='REGIONAL',
            Id=webacl_id
        )

        assert response['WebACL']['ARN'] == waf_acl_arn

    def test_waf_has_rules(self):
        """Verify WAF has security rules configured"""
        arn_parts = waf_acl_arn.split('/')
        webacl_name = arn_parts[-2]
        webacl_id = arn_parts[-1]

        response = wafv2_client.get_web_acl(
            Name=webacl_name,
            Scope='REGIONAL',
            Id=webacl_id
        )

        rules = response['WebACL']['Rules']
        rule_names = [r['Name'] for r in rules]

        assert 'RateLimitRule' in rule_names
        assert 'SQLiProtection' in rule_names
        assert 'XSSProtection' in rule_names


class TestAPIGateway:
    """Integration tests for API Gateway"""

    def test_api_endpoint_accessible(self):
        """Verify API endpoint is accessible"""
        # API Gateway returns 403 without valid request, which is expected
        response = requests.get(api_endpoint, timeout=10)

        # 403 is expected (missing auth or invalid path), but proves API is up
        assert response.status_code in [200, 403, 404]

    def test_api_endpoint_format(self):
        """Verify API endpoint has correct format"""
        assert api_endpoint.startswith('https://')
        assert '.execute-api.' in api_endpoint
        assert f'.{region}.amazonaws.com' in api_endpoint
        # Verify endpoint ends with a stage name (any valid stage)
        assert api_endpoint.endswith('/')


class TestCloudWatchAlarms:
    """Integration tests for CloudWatch Alarms"""

    def test_lambda_error_alarm_exists(self):
        """Verify Lambda error alarm exists"""
        alarm_name = f'lambda-errors-{environment_suffix}'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])

        assert len(response['MetricAlarms']) == 1
        assert response['MetricAlarms'][0]['AlarmName'] == alarm_name

    def test_dynamodb_throttle_alarm_exists(self):
        """Verify DynamoDB throttle alarm exists"""
        alarm_name = f'dynamodb-throttle-{environment_suffix}'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])

        assert len(response['MetricAlarms']) == 1
        assert response['MetricAlarms'][0]['AlarmName'] == alarm_name

    def test_api_4xx_alarm_exists(self):
        """Verify API 4xx alarm exists"""
        alarm_name = f'api-4xx-errors-{environment_suffix}'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])

        assert len(response['MetricAlarms']) == 1

    def test_api_5xx_alarm_exists(self):
        """Verify API 5xx alarm exists"""
        alarm_name = f'api-5xx-errors-{environment_suffix}'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])

        assert len(response['MetricAlarms']) == 1

    def test_ec2_cpu_alarm_exists(self):
        """Verify EC2 CPU alarm exists"""
        alarm_name = f'ec2-cpu-high-{environment_suffix}'
        response = cloudwatch_client.describe_alarms(AlarmNames=[alarm_name])

        assert len(response['MetricAlarms']) == 1


class TestEventBridgeRules:
    """Integration tests for EventBridge Rules"""

    def test_security_findings_rule_exists(self):
        """Verify security findings rule exists"""
        rule_name = f'security-findings-{environment_suffix}'
        response = events_client.describe_rule(Name=rule_name)

        assert response['Name'] == rule_name
        assert response['State'] == 'ENABLED'

    def test_cost_anomaly_rule_exists(self):
        """Verify cost anomaly rule exists"""
        rule_name = f'cost-anomaly-{environment_suffix}'
        response = events_client.describe_rule(Name=rule_name)

        assert response['Name'] == rule_name
        assert response['State'] == 'ENABLED'

    def test_ec2_state_rule_exists(self):
        """Verify EC2 state change rule exists"""
        rule_name = f'ec2-state-change-{environment_suffix}'
        response = events_client.describe_rule(Name=rule_name)

        assert response['Name'] == rule_name
        assert response['State'] == 'ENABLED'


class TestCloudWatchDashboards:
    """Integration tests for CloudWatch Dashboards"""

    def test_cost_dashboard_exists(self):
        """Verify cost dashboard exists"""
        dashboard_name = f'payment-costs-{environment_suffix}'
        response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)

        assert response['DashboardName'] == dashboard_name
        assert len(response['DashboardBody']) > 0

    def test_security_dashboard_exists(self):
        """Verify security dashboard exists"""
        dashboard_name = f'payment-security-{environment_suffix}'
        response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)

        assert response['DashboardName'] == dashboard_name

    def test_ops_dashboard_exists(self):
        """Verify ops dashboard exists"""
        dashboard_name = f'payment-ops-{environment_suffix}'
        response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)

        assert response['DashboardName'] == dashboard_name
