"""
Unit tests for HIPAA-Compliant Event Processing Pipeline CloudFormation Template
Tests resource configuration, security settings, and HIPAA compliance features.
"""

import json
import unittest
from pathlib import Path
from cfnlint.decode import cfn_yaml


class TestCloudFormationTemplate(unittest.TestCase):
    """Test suite for CloudFormation template validation"""

    @classmethod
    def setUpClass(cls):
        """Load the CloudFormation template once for all tests"""
        template_path = Path(__file__).parent.parent.parent / 'lib' / 'TapStack.yml'
        cls.template = cfn_yaml.load(str(template_path))
        cls.resources = cls.template.get('Resources', {})
        cls.parameters = cls.template.get('Parameters', {})
        cls.outputs = cls.template.get('Outputs', {})

    def test_template_version(self):
        """Test that template has correct CloudFormation version"""
        self.assertEqual(
            self.template['AWSTemplateFormatVersion'],
            '2010-09-09',
            'Template should have correct CloudFormation version'
        )

    def test_parameters_defined(self):
        """Test that required parameters are defined"""
        self.assertIn('EnvironmentSuffix', self.parameters)
        self.assertIn('DBUsername', self.parameters)
        self.assertIn('DBName', self.parameters)

    def test_environment_suffix_parameter(self):
        """Test EnvironmentSuffix parameter configuration"""
        env_param = self.parameters['EnvironmentSuffix']
        self.assertEqual(env_param['Type'], 'String')
        self.assertIn('AllowedPattern', env_param)

    # KMS Key Tests
    def test_kms_key_exists(self):
        """Test that KMS encryption key is defined"""
        self.assertIn('DataEncryptionKey', self.resources)
        kms_key = self.resources['DataEncryptionKey']
        self.assertEqual(kms_key['Type'], 'AWS::KMS::Key')

    def test_kms_key_rotation_enabled(self):
        """Test that KMS key rotation is enabled for HIPAA compliance"""
        kms_key = self.resources['DataEncryptionKey']
        self.assertTrue(
            kms_key['Properties']['EnableKeyRotation'],
            'KMS key rotation must be enabled for HIPAA compliance'
        )

    def test_kms_key_deletion_policy(self):
        """Test that KMS key has proper deletion policy"""
        kms_key = self.resources['DataEncryptionKey']
        self.assertEqual(kms_key['DeletionPolicy'], 'Delete')
        self.assertEqual(kms_key['UpdateReplacePolicy'], 'Delete')

    def test_kms_key_alias_exists(self):
        """Test that KMS key alias is defined"""
        self.assertIn('DataEncryptionKeyAlias', self.resources)
        alias = self.resources['DataEncryptionKeyAlias']
        self.assertEqual(alias['Type'], 'AWS::KMS::Alias')

    # VPC Tests
    def test_vpc_exists(self):
        """Test that VPC is defined"""
        self.assertIn('VPC', self.resources)
        vpc = self.resources['VPC']
        self.assertEqual(vpc['Type'], 'AWS::EC2::VPC')

    def test_vpc_dns_enabled(self):
        """Test that VPC has DNS support enabled"""
        vpc = self.resources['VPC']
        self.assertTrue(vpc['Properties']['EnableDnsHostnames'])
        self.assertTrue(vpc['Properties']['EnableDnsSupport'])

    def test_private_subnets_exist(self):
        """Test that all three private subnets are defined"""
        self.assertIn('PrivateSubnet1', self.resources)
        self.assertIn('PrivateSubnet2', self.resources)
        self.assertIn('PrivateSubnet3', self.resources)

    def test_private_subnets_not_public(self):
        """Test that private subnets don't auto-assign public IPs"""
        for i in range(1, 4):
            subnet = self.resources[f'PrivateSubnet{i}']
            self.assertFalse(
                subnet['Properties']['MapPublicIpOnLaunch'],
                f'PrivateSubnet{i} should not auto-assign public IPs'
            )

    def test_vpc_endpoints_exist(self):
        """Test that cost-optimized VPC endpoints are defined"""
        expected_endpoints = [
            'S3VPCEndpoint',
            'KinesisVPCEndpoint',
            'SecretsManagerVPCEndpoint',
            'ECRVPCEndpoint',
            'ECRAPIVPCEndpoint',
            'CloudWatchLogsVPCEndpoint'
        ]
        for endpoint in expected_endpoints:
            self.assertIn(endpoint, self.resources, f'{endpoint} should be defined')

    def test_s3_vpc_endpoint_is_gateway(self):
        """Test that S3 VPC endpoint is Gateway type (free)"""
        s3_endpoint = self.resources['S3VPCEndpoint']
        self.assertEqual(
            s3_endpoint['Properties']['VpcEndpointType'],
            'Gateway',
            'S3 VPC endpoint should be Gateway type for cost optimization'
        )

    # Security Group Tests
    def test_security_groups_exist(self):
        """Test that all required security groups are defined"""
        self.assertIn('VPCEndpointSecurityGroup', self.resources)
        self.assertIn('ECSTaskSecurityGroup', self.resources)
        self.assertIn('RDSSecurityGroup', self.resources)

    def test_ecs_security_group_egress_rules(self):
        """Test ECS security group has proper egress rules"""
        sg = self.resources['ECSTaskSecurityGroup']
        egress_rules = sg['Properties']['SecurityGroupEgress']
        self.assertEqual(len(egress_rules), 2)

        # Check HTTPS rule
        https_rule = egress_rules[0]
        self.assertEqual(https_rule['IpProtocol'], 'tcp')
        self.assertEqual(https_rule['FromPort'], 443)
        self.assertEqual(https_rule['ToPort'], 443)

    def test_rds_security_group_ingress(self):
        """Test RDS security group allows MySQL from ECS"""
        sg = self.resources['RDSSecurityGroup']
        ingress_rules = sg['Properties']['SecurityGroupIngress']
        self.assertTrue(len(ingress_rules) > 0)

        mysql_rule = ingress_rules[0]
        self.assertEqual(mysql_rule['FromPort'], 3306)
        self.assertEqual(mysql_rule['ToPort'], 3306)

    # Kinesis Tests
    def test_kinesis_stream_exists(self):
        """Test that Kinesis Data Stream is defined"""
        self.assertIn('PatientDataStream', self.resources)
        stream = self.resources['PatientDataStream']
        self.assertEqual(stream['Type'], 'AWS::Kinesis::Stream')

    def test_kinesis_stream_encrypted(self):
        """Test that Kinesis stream is encrypted with KMS"""
        stream = self.resources['PatientDataStream']
        encryption = stream['Properties']['StreamEncryption']
        self.assertEqual(encryption['EncryptionType'], 'KMS')
        self.assertIn('KeyId', encryption)

    def test_kinesis_stream_shard_count(self):
        """Test Kinesis stream has proper shard count for 1000 events/sec"""
        stream = self.resources['PatientDataStream']
        self.assertEqual(
            stream['Properties']['ShardCount'],
            2,
            'Kinesis should have 2 shards for 1000 events/sec capacity'
        )

    def test_kinesis_stream_retention(self):
        """Test Kinesis stream has 24-hour retention"""
        stream = self.resources['PatientDataStream']
        self.assertEqual(stream['Properties']['RetentionPeriodHours'], 24)

    # RDS Aurora Tests
    def test_aurora_cluster_exists(self):
        """Test that Aurora DB cluster is defined"""
        self.assertIn('AuroraDBCluster', self.resources)
        cluster = self.resources['AuroraDBCluster']
        self.assertEqual(cluster['Type'], 'AWS::RDS::DBCluster')

    def test_aurora_serverless_v2_configured(self):
        """Test that Aurora Serverless v2 scaling is configured"""
        cluster = self.resources['AuroraDBCluster']
        scaling = cluster['Properties']['ServerlessV2ScalingConfiguration']
        self.assertIn('MinCapacity', scaling)
        self.assertIn('MaxCapacity', scaling)
        self.assertEqual(scaling['MinCapacity'], 0.5)
        self.assertEqual(scaling['MaxCapacity'], 2)

    def test_aurora_cluster_encrypted(self):
        """Test that Aurora cluster is encrypted"""
        cluster = self.resources['AuroraDBCluster']
        self.assertTrue(
            cluster['Properties']['StorageEncrypted'],
            'Aurora cluster must be encrypted for HIPAA compliance'
        )
        self.assertIn('KmsKeyId', cluster['Properties'])

    def test_aurora_deletion_protection_disabled(self):
        """Test that Aurora deletion protection is disabled for cleanup"""
        cluster = self.resources['AuroraDBCluster']
        self.assertFalse(
            cluster['Properties']['DeletionProtection'],
            'DeletionProtection should be False to allow cleanup'
        )

    def test_aurora_deletion_policy(self):
        """Test that Aurora has proper deletion policies"""
        cluster = self.resources['AuroraDBCluster']
        self.assertEqual(cluster['DeletionPolicy'], 'Delete')
        self.assertEqual(cluster['UpdateReplacePolicy'], 'Delete')

    def test_aurora_cloudwatch_logs_enabled(self):
        """Test that Aurora CloudWatch log exports are enabled"""
        cluster = self.resources['AuroraDBCluster']
        log_exports = cluster['Properties']['EnableCloudwatchLogsExports']
        expected_logs = ['error', 'general', 'slowquery', 'audit']
        for log_type in expected_logs:
            self.assertIn(log_type, log_exports)

    def test_aurora_instances_exist(self):
        """Test that Aurora DB instances are defined"""
        self.assertIn('AuroraDBInstance1', self.resources)
        self.assertIn('AuroraDBInstance2', self.resources)

    def test_aurora_instances_serverless(self):
        """Test that Aurora instances use serverless class"""
        for i in range(1, 3):
            instance = self.resources[f'AuroraDBInstance{i}']
            self.assertEqual(
                instance['Properties']['DBInstanceClass'],
                'db.serverless'
            )

    def test_aurora_instances_not_public(self):
        """Test that Aurora instances are not publicly accessible"""
        for i in range(1, 3):
            instance = self.resources[f'AuroraDBInstance{i}']
            self.assertFalse(instance['Properties']['PubliclyAccessible'])

    # Secrets Manager Tests
    def test_db_secret_exists(self):
        """Test that database secret is defined"""
        self.assertIn('DBSecret', self.resources)
        secret = self.resources['DBSecret']
        self.assertEqual(secret['Type'], 'AWS::SecretsManager::Secret')

    def test_db_secret_encrypted(self):
        """Test that database secret is encrypted with KMS"""
        secret = self.resources['DBSecret']
        self.assertIn('KmsKeyId', secret['Properties'])

    def test_db_secret_attachment_exists(self):
        """Test that secret attachment to Aurora cluster exists"""
        self.assertIn('DBSecretAttachment', self.resources)
        attachment = self.resources['DBSecretAttachment']
        self.assertEqual(
            attachment['Type'],
            'AWS::SecretsManager::SecretTargetAttachment'
        )

    # ECS Tests
    def test_ecs_cluster_exists(self):
        """Test that ECS cluster is defined"""
        self.assertIn('ECSCluster', self.resources)
        cluster = self.resources['ECSCluster']
        self.assertEqual(cluster['Type'], 'AWS::ECS::Cluster')

    def test_ecs_container_insights_enabled(self):
        """Test that ECS Container Insights is enabled"""
        cluster = self.resources['ECSCluster']
        settings = cluster['Properties']['ClusterSettings']
        self.assertTrue(len(settings) > 0)
        self.assertEqual(settings[0]['Name'], 'containerInsights')
        self.assertEqual(settings[0]['Value'], 'enabled')

    def test_ecs_task_definition_exists(self):
        """Test that ECS task definition is defined"""
        self.assertIn('ECSTaskDefinition', self.resources)
        task_def = self.resources['ECSTaskDefinition']
        self.assertEqual(task_def['Type'], 'AWS::ECS::TaskDefinition')

    def test_ecs_task_definition_fargate(self):
        """Test that ECS task uses Fargate"""
        task_def = self.resources['ECSTaskDefinition']
        self.assertIn('FARGATE', task_def['Properties']['RequiresCompatibilities'])
        self.assertEqual(task_def['Properties']['NetworkMode'], 'awsvpc')

    def test_ecs_task_log_group_encrypted(self):
        """Test that ECS task log group is encrypted"""
        log_group = self.resources['ECSTaskLogGroup']
        self.assertIn('KmsKeyId', log_group['Properties'])

    def test_ecs_task_log_group_retention(self):
        """Test that ECS log group has 7-day retention"""
        log_group = self.resources['ECSTaskLogGroup']
        self.assertEqual(log_group['Properties']['RetentionInDays'], 7)

    def test_ecs_service_exists(self):
        """Test that ECS service is defined"""
        self.assertIn('ECSService', self.resources)
        service = self.resources['ECSService']
        self.assertEqual(service['Type'], 'AWS::ECS::Service')

    def test_ecs_service_high_availability(self):
        """Test that ECS service has 2 tasks for high availability"""
        service = self.resources['ECSService']
        self.assertEqual(service['Properties']['DesiredCount'], 2)

    def test_ecs_service_private_subnets(self):
        """Test that ECS service is deployed in private subnets"""
        service = self.resources['ECSService']
        network_config = service['Properties']['NetworkConfiguration']['AwsvpcConfiguration']
        self.assertEqual(network_config['AssignPublicIp'], 'DISABLED')

    def test_ecs_iam_roles_exist(self):
        """Test that ECS IAM roles are defined"""
        self.assertIn('ECSTaskExecutionRole', self.resources)
        self.assertIn('ECSTaskRole', self.resources)

    # API Gateway Tests
    def test_api_gateway_exists(self):
        """Test that API Gateway is defined"""
        self.assertIn('RestAPI', self.resources)
        api = self.resources['RestAPI']
        self.assertEqual(api['Type'], 'AWS::ApiGateway::RestApi')

    def test_api_gateway_regional(self):
        """Test that API Gateway uses regional endpoint"""
        api = self.resources['RestAPI']
        endpoint_config = api['Properties']['EndpointConfiguration']
        self.assertIn('REGIONAL', endpoint_config['Types'])

    def test_api_gateway_stage_exists(self):
        """Test that API Gateway stage is defined"""
        self.assertIn('APIGatewayStage', self.resources)
        stage = self.resources['APIGatewayStage']
        self.assertEqual(stage['Type'], 'AWS::ApiGateway::Stage')

    def test_api_gateway_access_logging_enabled(self):
        """Test that API Gateway has access logging enabled"""
        stage = self.resources['APIGatewayStage']
        # Access logging via AccessLogSetting
        self.assertIn('AccessLogSetting', stage['Properties'])
        access_log_setting = stage['Properties']['AccessLogSetting']
        self.assertIn('DestinationArn', access_log_setting)
        self.assertIn('Format', access_log_setting)

        # Metrics should be enabled
        method_settings = stage['Properties']['MethodSettings'][0]
        self.assertTrue(method_settings['MetricsEnabled'])

    def test_api_gateway_throttling_configured(self):
        """Test that API Gateway has throttling configured"""
        stage = self.resources['APIGatewayStage']
        method_settings = stage['Properties']['MethodSettings'][0]
        self.assertEqual(method_settings['ThrottlingBurstLimit'], 500)
        self.assertEqual(method_settings['ThrottlingRateLimit'], 100)

    def test_api_gateway_usage_plan_exists(self):
        """Test that API Gateway usage plan is defined"""
        self.assertIn('APIGatewayUsagePlan', self.resources)
        usage_plan = self.resources['APIGatewayUsagePlan']
        self.assertEqual(usage_plan['Type'], 'AWS::ApiGateway::UsagePlan')

    def test_api_gateway_log_group_encrypted(self):
        """Test that API Gateway log group is encrypted"""
        log_group = self.resources['APIGatewayLogGroup']
        self.assertIn('KmsKeyId', log_group['Properties'])

    # CloudTrail Tests
    def test_cloudtrail_exists(self):
        """Test that CloudTrail is defined"""
        self.assertIn('CloudTrail', self.resources)
        trail = self.resources['CloudTrail']
        self.assertEqual(trail['Type'], 'AWS::CloudTrail::Trail')

    def test_cloudtrail_logging_enabled(self):
        """Test that CloudTrail logging is enabled"""
        trail = self.resources['CloudTrail']
        self.assertTrue(trail['Properties']['IsLogging'])

    def test_cloudtrail_log_validation_enabled(self):
        """Test that CloudTrail log validation is enabled"""
        trail = self.resources['CloudTrail']
        self.assertTrue(
            trail['Properties']['EnableLogFileValidation'],
            'CloudTrail log file validation required for HIPAA compliance'
        )

    def test_cloudtrail_encrypted(self):
        """Test that CloudTrail is encrypted with KMS"""
        trail = self.resources['CloudTrail']
        self.assertIn('KMSKeyId', trail['Properties'])

    def test_cloudtrail_bucket_exists(self):
        """Test that CloudTrail S3 bucket is defined"""
        self.assertIn('CloudTrailBucket', self.resources)
        bucket = self.resources['CloudTrailBucket']
        self.assertEqual(bucket['Type'], 'AWS::S3::Bucket')

    def test_cloudtrail_bucket_encrypted(self):
        """Test that CloudTrail bucket is encrypted"""
        bucket = self.resources['CloudTrailBucket']
        encryption_config = bucket['Properties']['BucketEncryption']
        sse_config = encryption_config['ServerSideEncryptionConfiguration'][0]
        self.assertEqual(sse_config['ServerSideEncryptionByDefault']['SSEAlgorithm'], 'aws:kms')

    def test_cloudtrail_bucket_public_access_blocked(self):
        """Test that CloudTrail bucket blocks public access"""
        bucket = self.resources['CloudTrailBucket']
        public_access_config = bucket['Properties']['PublicAccessBlockConfiguration']
        self.assertTrue(public_access_config['BlockPublicAcls'])
        self.assertTrue(public_access_config['BlockPublicPolicy'])
        self.assertTrue(public_access_config['IgnorePublicAcls'])
        self.assertTrue(public_access_config['RestrictPublicBuckets'])

    def test_cloudtrail_bucket_lifecycle_policy(self):
        """Test that CloudTrail bucket has lifecycle policy"""
        bucket = self.resources['CloudTrailBucket']
        lifecycle_rules = bucket['Properties']['LifecycleConfiguration']['Rules']
        self.assertTrue(len(lifecycle_rules) > 0)
        self.assertEqual(lifecycle_rules[0]['ExpirationInDays'], 90)

    # Resource Naming Tests
    def test_resources_include_environment_suffix(self):
        """Test that all resource names include EnvironmentSuffix"""
        # Check a sample of resources that have name properties
        resources_with_names = {
            'PatientDataStream': 'Name',
            'ECSCluster': 'ClusterName',
            'RestAPI': 'Name',
            'CloudTrail': 'TrailName',
            'AuroraDBCluster': 'DBClusterIdentifier',
        }

        for resource_name, name_property in resources_with_names.items():
            resource = self.resources[resource_name]
            name_value = resource['Properties'][name_property]
            # Check if it's using !Sub with ${EnvironmentSuffix}
            if isinstance(name_value, dict):
                self.assertIn('Fn::Sub', name_value or 'Sub')
            else:
                # Direct string check
                self.assertIn('${EnvironmentSuffix}', str(name_value))

    # Outputs Tests
    def test_required_outputs_exist(self):
        """Test that all required outputs are defined"""
        required_outputs = [
            'VPCId',
            'KMSKeyId',
            'KinesisStreamName',
            'KinesisStreamArn',
            'DBClusterId',
            'DBClusterEndpoint',
            'DBSecretArn',
            'ECSClusterName',
            'ECSServiceName',
            'APIGatewayId',
            'APIGatewayURL',
            'CloudTrailName',
            'CloudTrailBucketName',
            'EnvironmentSuffix'
        ]

        for output in required_outputs:
            self.assertIn(output, self.outputs, f'Output {output} should be defined')

    def test_outputs_have_descriptions(self):
        """Test that all outputs have descriptions"""
        for output_name, output_config in self.outputs.items():
            self.assertIn('Description', output_config, f'Output {output_name} should have description')

    def test_outputs_have_exports(self):
        """Test that outputs have export names"""
        for output_name, output_config in self.outputs.items():
            self.assertIn('Export', output_config, f'Output {output_name} should have export')

    # HIPAA Compliance Tests
    def test_all_encryption_at_rest(self):
        """Test that all data stores have encryption at rest"""
        # Kinesis
        kinesis = self.resources['PatientDataStream']
        self.assertIn('StreamEncryption', kinesis['Properties'])

        # Aurora
        aurora = self.resources['AuroraDBCluster']
        self.assertTrue(aurora['Properties']['StorageEncrypted'])

        # S3
        bucket = self.resources['CloudTrailBucket']
        self.assertIn('BucketEncryption', bucket['Properties'])

        # Secrets Manager
        secret = self.resources['DBSecret']
        self.assertIn('KmsKeyId', secret['Properties'])

    def test_all_log_groups_encrypted(self):
        """Test that all CloudWatch log groups are encrypted"""
        log_groups = [
            'ECSTaskLogGroup',
            'APIGatewayLogGroup'
        ]

        for log_group_name in log_groups:
            log_group = self.resources[log_group_name]
            self.assertIn(
                'KmsKeyId',
                log_group['Properties'],
                f'{log_group_name} should be encrypted with KMS'
            )

    def test_secure_transport_enforced(self):
        """Test that database enforces secure transport"""
        param_group = self.resources['DBClusterParameterGroup']
        parameters = param_group['Properties']['Parameters']
        self.assertEqual(
            parameters['require_secure_transport'],
            'ON',
            'Database should enforce secure transport for HIPAA compliance'
        )

    def test_audit_logging_enabled(self):
        """Test that audit logging is enabled"""
        # CloudTrail enabled
        trail = self.resources['CloudTrail']
        self.assertTrue(trail['Properties']['IsLogging'])

        # Aurora audit logs
        aurora = self.resources['AuroraDBCluster']
        log_exports = aurora['Properties']['EnableCloudwatchLogsExports']
        self.assertIn('audit', log_exports)

    def test_high_availability_multi_az(self):
        """Test that resources are deployed across multiple AZs"""
        # Check that we have 3 private subnets
        self.assertIn('PrivateSubnet1', self.resources)
        self.assertIn('PrivateSubnet2', self.resources)
        self.assertIn('PrivateSubnet3', self.resources)

        # Check that Aurora has 2 instances
        self.assertIn('AuroraDBInstance1', self.resources)
        self.assertIn('AuroraDBInstance2', self.resources)

        # Check that ECS service has 2 tasks
        service = self.resources['ECSService']
        self.assertEqual(service['Properties']['DesiredCount'], 2)

    def test_resource_count(self):
        """Test that template has expected number of resources"""
        # Template should have around 44 resources
        resource_count = len(self.resources)
        self.assertGreaterEqual(
            resource_count,
            40,
            f'Template should have at least 40 resources, found {resource_count}'
        )
        self.assertLessEqual(
            resource_count,
            50,
            f'Template should have at most 50 resources, found {resource_count}'
        )


if __name__ == '__main__':
    unittest.main()
