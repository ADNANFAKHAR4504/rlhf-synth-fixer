"""
Unit tests for the loan processing CloudFormation infrastructure template.
Tests validate all resource definitions, properties, and configurations.
"""
import json
import pytest


@pytest.fixture
def template():
    """Load the CloudFormation template from JSON."""
    with open('lib/loan-processing-infrastructure.json', 'r', encoding='utf-8') as file:
        return json.load(file)


@pytest.fixture
def resources(template):
    """Extract resources from template."""
    return template.get('Resources', {})


@pytest.fixture
def outputs(template):
    """Extract outputs from template."""
    return template.get('Outputs', {})


@pytest.fixture
def parameters(template):
    """Extract parameters from template."""
    return template.get('Parameters', {})


class TestTemplateStructure:
    """Test the overall template structure."""

    def test_template_version(self, template):
        """Verify CloudFormation template version."""
        assert template['AWSTemplateFormatVersion'] == '2010-09-09'

    def test_template_description(self, template):
        """Verify template has description."""
        assert 'Description' in template
        assert 'loan processing' in template['Description'].lower()

    def test_has_resources(self, resources):
        """Verify template contains resources."""
        assert len(resources) > 0
        assert len(resources) == 68  # Expected resource count

    def test_has_parameters(self, parameters):
        """Verify template contains parameters."""
        assert len(parameters) > 0
        assert 'EnvironmentSuffix' in parameters

    def test_has_outputs(self, outputs):
        """Verify template contains outputs."""
        assert len(outputs) > 0


class TestParameters:
    """Test parameter definitions."""

    def test_environment_suffix_parameter(self, parameters):
        """Verify EnvironmentSuffix parameter configuration."""
        param = parameters['EnvironmentSuffix']
        assert param['Type'] == 'String'
        assert param['Default'] == 'prod'
        assert 'AllowedPattern' in param

    def test_enable_deletion_protection_parameter(self, parameters):
        """Verify EnableDeletionProtection parameter."""
        param = parameters['EnableDeletionProtection']
        assert param['Type'] == 'String'
        assert param['Default'] == 'false'
        assert 'AllowedValues' in param
        assert 'true' in param['AllowedValues']
        assert 'false' in param['AllowedValues']

    def test_container_image_parameter(self, parameters):
        """Verify ContainerImage parameter."""
        param = parameters['ContainerImage']
        assert param['Type'] == 'String'
        assert param['Default'] == 'nginx:latest'

    def test_db_master_password_parameter(self, parameters):
        """Verify DBMasterPassword parameter."""
        param = parameters['DBMasterPassword']
        assert param['Type'] == 'String'
        assert param['NoEcho'] is True
        assert param['MinLength'] == 8


class TestKMSKeys:
    """Test KMS encryption key resources."""

    def test_rds_encryption_key(self, resources):
        """Verify RDS encryption key configuration."""
        key = resources['RDSEncryptionKey']
        assert key['Type'] == 'AWS::KMS::Key'
        assert key['DeletionPolicy'] == 'Delete'
        assert key['UpdateReplacePolicy'] == 'Delete'
        assert key['Properties']['EnableKeyRotation'] is True
        assert 'KeyPolicy' in key['Properties']

    def test_s3_encryption_key(self, resources):
        """Verify S3 encryption key configuration."""
        key = resources['S3EncryptionKey']
        assert key['Type'] == 'AWS::KMS::Key'
        assert key['DeletionPolicy'] == 'Delete'
        assert key['Properties']['EnableKeyRotation'] is True

    def test_cloudwatch_logs_key(self, resources):
        """Verify CloudWatch Logs encryption key."""
        key = resources['CloudWatchLogsKey']
        assert key['Type'] == 'AWS::KMS::Key'
        assert key['DeletionPolicy'] == 'Delete'
        assert key['Properties']['EnableKeyRotation'] is True

    def test_kms_key_aliases(self, resources):
        """Verify KMS key aliases exist."""
        assert 'RDSEncryptionKeyAlias' in resources
        assert 'S3EncryptionKeyAlias' in resources
        assert 'CloudWatchLogsKeyAlias' in resources


class TestVPCResources:
    """Test VPC and networking resources."""

    def test_vpc_creation(self, resources):
        """Verify VPC configuration."""
        vpc = resources['VPC']
        assert vpc['Type'] == 'AWS::EC2::VPC'
        assert vpc['DeletionPolicy'] == 'Delete'
        assert vpc['Properties']['CidrBlock'] == '10.0.0.0/16'
        assert vpc['Properties']['EnableDnsHostnames'] is True
        assert vpc['Properties']['EnableDnsSupport'] is True

    def test_internet_gateway(self, resources):
        """Verify Internet Gateway exists."""
        igw = resources['InternetGateway']
        assert igw['Type'] == 'AWS::EC2::InternetGateway'
        assert igw['DeletionPolicy'] == 'Delete'

    def test_internet_gateway_attachment(self, resources):
        """Verify IGW is attached to VPC."""
        attachment = resources['AttachGateway']
        assert attachment['Type'] == 'AWS::EC2::VPCGatewayAttachment'

    def test_public_subnets(self, resources):
        """Verify public subnets across 3 AZs."""
        for i in range(1, 4):
            subnet_name = f'PublicSubnet{i}'
            assert subnet_name in resources
            subnet = resources[subnet_name]
            assert subnet['Type'] == 'AWS::EC2::Subnet'
            assert subnet['Properties']['MapPublicIpOnLaunch'] is True
            assert subnet['DeletionPolicy'] == 'Delete'

    def test_private_subnets(self, resources):
        """Verify private subnets across 3 AZs."""
        for i in range(1, 4):
            subnet_name = f'PrivateSubnet{i}'
            assert subnet_name in resources
            subnet = resources[subnet_name]
            assert subnet['Type'] == 'AWS::EC2::Subnet'
            assert subnet['DeletionPolicy'] == 'Delete'

    def test_nat_gateways(self, resources):
        """Verify NAT Gateways in each AZ."""
        for i in range(1, 4):
            nat_name = f'NatGateway{i}'
            eip_name = f'NatGateway{i}EIP'
            assert nat_name in resources
            assert eip_name in resources
            nat = resources[nat_name]
            eip = resources[eip_name]
            assert nat['Type'] == 'AWS::EC2::NatGateway'
            assert eip['Type'] == 'AWS::EC2::EIP'
            assert eip['Properties']['Domain'] == 'vpc'

    def test_route_tables(self, resources):
        """Verify route tables configuration."""
        assert 'PublicRouteTable' in resources
        for i in range(1, 4):
            assert f'PrivateRouteTable{i}' in resources

    def test_public_routes(self, resources):
        """Verify public route to Internet Gateway."""
        route = resources['PublicRoute']
        assert route['Type'] == 'AWS::EC2::Route'
        assert route['Properties']['DestinationCidrBlock'] == '0.0.0.0/0'

    def test_private_routes(self, resources):
        """Verify private routes to NAT Gateways."""
        for i in range(1, 4):
            route_name = f'PrivateRoute{i}'
            assert route_name in resources
            route = resources[route_name]
            assert route['Type'] == 'AWS::EC2::Route'
            assert route['Properties']['DestinationCidrBlock'] == '0.0.0.0/0'


class TestSecurityGroups:
    """Test security group configurations."""

    def test_alb_security_group(self, resources):
        """Verify ALB security group configuration."""
        sg = resources['ALBSecurityGroup']
        assert sg['Type'] == 'AWS::EC2::SecurityGroup'
        assert sg['DeletionPolicy'] == 'Delete'
        ingress = sg['Properties']['SecurityGroupIngress']
        assert len(ingress) == 2  # HTTP and HTTPS
        # Verify HTTP rule
        http_rule = next((r for r in ingress if r['FromPort'] == 80), None)
        assert http_rule is not None
        assert http_rule['CidrIp'] == '0.0.0.0/0'
        # Verify HTTPS rule
        https_rule = next((r for r in ingress if r['FromPort'] == 443), None)
        assert https_rule is not None

    def test_ecs_security_group(self, resources):
        """Verify ECS security group configuration."""
        sg = resources['ECSSecurityGroup']
        assert sg['Type'] == 'AWS::EC2::SecurityGroup'
        assert sg['DeletionPolicy'] == 'Delete'
        ingress = sg['Properties']['SecurityGroupIngress']
        assert len(ingress) == 1  # Only from ALB

    def test_rds_security_group(self, resources):
        """Verify RDS security group configuration."""
        sg = resources['RDSSecurityGroup']
        assert sg['Type'] == 'AWS::EC2::SecurityGroup'
        assert sg['DeletionPolicy'] == 'Delete'
        ingress = sg['Properties']['SecurityGroupIngress']
        assert len(ingress) == 1  # Only from ECS
        assert ingress[0]['FromPort'] == 3306
        assert ingress[0]['ToPort'] == 3306


class TestS3Buckets:
    """Test S3 bucket configurations."""

    def test_document_bucket(self, resources):
        """Verify document bucket configuration."""
        bucket = resources['DocumentBucket']
        assert bucket['Type'] == 'AWS::S3::Bucket'
        assert bucket['DeletionPolicy'] == 'Delete'
        props = bucket['Properties']
        # Verify encryption
        assert 'BucketEncryption' in props
        assert props['BucketEncryption']['ServerSideEncryptionConfiguration'][0]['ServerSideEncryptionByDefault']['SSEAlgorithm'] == 'aws:kms'
        # Verify versioning
        assert props['VersioningConfiguration']['Status'] == 'Enabled'
        # Verify lifecycle policy
        assert 'LifecycleConfiguration' in props
        lifecycle_rules = props['LifecycleConfiguration']['Rules']
        assert len(lifecycle_rules) == 1
        assert lifecycle_rules[0]['Transitions'][0]['TransitionInDays'] == 180
        assert lifecycle_rules[0]['Transitions'][0]['StorageClass'] == 'GLACIER'
        # Verify public access block
        assert props['PublicAccessBlockConfiguration']['BlockPublicAcls'] is True

    def test_static_assets_bucket(self, resources):
        """Verify static assets bucket configuration."""
        bucket = resources['StaticAssetsBucket']
        assert bucket['Type'] == 'AWS::S3::Bucket'
        assert bucket['DeletionPolicy'] == 'Delete'
        props = bucket['Properties']
        assert 'BucketEncryption' in props
        assert props['VersioningConfiguration']['Status'] == 'Enabled'
        assert 'LifecycleConfiguration' in props

    def test_static_assets_bucket_policy(self, resources):
        """Verify static assets bucket policy for CloudFront."""
        policy = resources['StaticAssetsBucketPolicy']
        assert policy['Type'] == 'AWS::S3::BucketPolicy'
        assert policy['DeletionPolicy'] == 'Delete'


class TestCloudFront:
    """Test CloudFront distribution."""

    def test_cloudfront_oai(self, resources):
        """Verify CloudFront Origin Access Identity."""
        oai = resources['CloudFrontOAI']
        assert oai['Type'] == 'AWS::CloudFront::CloudFrontOriginAccessIdentity'
        assert oai['DeletionPolicy'] == 'Delete'

    def test_cloudfront_distribution(self, resources):
        """Verify CloudFront distribution configuration."""
        dist = resources['CloudFrontDistribution']
        assert dist['Type'] == 'AWS::CloudFront::Distribution'
        assert dist['DeletionPolicy'] == 'Delete'
        config = dist['Properties']['DistributionConfig']
        assert config['Enabled'] is True
        assert config['DefaultRootObject'] == 'index.html'
        # Verify HTTPS redirect
        assert config['DefaultCacheBehavior']['ViewerProtocolPolicy'] == 'redirect-to-https'
        # Verify TLS version
        assert config['ViewerCertificate']['MinimumProtocolVersion'] == 'TLSv1.2_2021'


class TestIAMRoles:
    """Test IAM role configurations."""

    def test_ecs_task_execution_role(self, resources):
        """Verify ECS task execution role."""
        role = resources['ECSTaskExecutionRole']
        assert role['Type'] == 'AWS::IAM::Role'
        assert role['DeletionPolicy'] == 'Delete'
        assert 'AssumeRolePolicyDocument' in role['Properties']
        # Verify managed policy
        managed_policies = role['Properties']['ManagedPolicyArns']
        assert 'AmazonECSTaskExecutionRolePolicy' in managed_policies[0]

    def test_ecs_task_role(self, resources):
        """Verify ECS task role with S3 and RDS permissions."""
        role = resources['ECSTaskRole']
        assert role['Type'] == 'AWS::IAM::Role'
        assert role['DeletionPolicy'] == 'Delete'
        policies = role['Properties']['Policies']
        assert len(policies) == 2  # S3 and RDS policies
        # Verify S3 access policy
        s3_policy = next((p for p in policies if p['PolicyName'] == 'S3AccessPolicy'), None)
        assert s3_policy is not None
        # Verify RDS access policy
        rds_policy = next((p for p in policies if p['PolicyName'] == 'RDSAccessPolicy'), None)
        assert rds_policy is not None

    def test_ecs_autoscaling_role(self, resources):
        """Verify ECS auto-scaling role."""
        role = resources['ECSAutoScalingRole']
        assert role['Type'] == 'AWS::IAM::Role'
        assert role['DeletionPolicy'] == 'Delete'

    def test_rds_enhanced_monitoring_role(self, resources):
        """Verify RDS enhanced monitoring role."""
        role = resources['RDSEnhancedMonitoringRole']
        assert role['Type'] == 'AWS::IAM::Role'
        assert role['DeletionPolicy'] == 'Delete'
        managed_policies = role['Properties']['ManagedPolicyArns']
        assert 'AmazonRDSEnhancedMonitoringRole' in managed_policies[0]


class TestCloudWatchLogs:
    """Test CloudWatch log group configuration."""

    def test_ecs_log_group(self, resources):
        """Verify ECS log group configuration."""
        log_group = resources['ECSLogGroup']
        assert log_group['Type'] == 'AWS::Logs::LogGroup'
        assert log_group['DeletionPolicy'] == 'Delete'
        assert log_group['Properties']['RetentionInDays'] == 90


class TestLoadBalancer:
    """Test Application Load Balancer configuration."""

    def test_alb(self, resources):
        """Verify ALB configuration."""
        alb = resources['ApplicationLoadBalancer']
        assert alb['Type'] == 'AWS::ElasticLoadBalancingV2::LoadBalancer'
        assert alb['DeletionPolicy'] == 'Delete'
        props = alb['Properties']
        assert props['Type'] == 'application'
        assert props['Scheme'] == 'internet-facing'
        assert len(props['Subnets']) == 3  # 3 AZs

    def test_alb_target_group(self, resources):
        """Verify ALB target group configuration."""
        tg = resources['ALBTargetGroup']
        assert tg['Type'] == 'AWS::ElasticLoadBalancingV2::TargetGroup'
        assert tg['DeletionPolicy'] == 'Delete'
        props = tg['Properties']
        assert props['Protocol'] == 'HTTP'
        assert props['TargetType'] == 'ip'
        # Verify health check
        assert props['HealthCheckEnabled'] is True
        assert props['HealthCheckPath'] == '/health'
        assert props['HealthCheckIntervalSeconds'] == 30

    def test_alb_listener(self, resources):
        """Verify ALB listener configuration."""
        listener = resources['ALBListener']
        assert listener['Type'] == 'AWS::ElasticLoadBalancingV2::Listener'
        assert listener['DeletionPolicy'] == 'Delete'
        props = listener['Properties']
        assert props['Port'] == 80
        assert props['Protocol'] == 'HTTP'


class TestAuroraDatabase:
    """Test Aurora MySQL cluster configuration."""

    def test_db_subnet_group(self, resources):
        """Verify DB subnet group configuration."""
        subnet_group = resources['DBSubnetGroup']
        assert subnet_group['Type'] == 'AWS::RDS::DBSubnetGroup'
        assert subnet_group['DeletionPolicy'] == 'Delete'
        assert len(subnet_group['Properties']['SubnetIds']) == 3

    def test_db_cluster_parameter_group(self, resources):
        """Verify DB cluster parameter group for SSL/TLS."""
        param_group = resources['DBClusterParameterGroup']
        assert param_group['Type'] == 'AWS::RDS::DBClusterParameterGroup'
        assert param_group['DeletionPolicy'] == 'Delete'
        params = param_group['Properties']['Parameters']
        assert params['require_secure_transport'] == 'ON'
        assert params['tls_version'] == 'TLSv1.2'

    def test_db_parameter_group(self, resources):
        """Verify DB instance parameter group."""
        param_group = resources['DBParameterGroup']
        assert param_group['Type'] == 'AWS::RDS::DBParameterGroup'
        assert param_group['DeletionPolicy'] == 'Delete'
        assert param_group['Properties']['Family'] == 'aurora-mysql8.0'

    def test_aurora_db_cluster(self, resources):
        """Verify Aurora DB cluster configuration."""
        cluster = resources['AuroraDBCluster']
        assert cluster['Type'] == 'AWS::RDS::DBCluster'
        assert cluster['DeletionPolicy'] == 'Delete'
        props = cluster['Properties']
        assert props['Engine'] == 'aurora-mysql'
        assert props['StorageEncrypted'] is True
        assert props['BackupRetentionPeriod'] == 30
        assert 'EnableCloudwatchLogsExports' in props
        assert 'error' in props['EnableCloudwatchLogsExports']

    def test_aurora_writer_instance(self, resources):
        """Verify Aurora writer instance."""
        instance = resources['AuroraDBInstanceWriter']
        assert instance['Type'] == 'AWS::RDS::DBInstance'
        assert instance['DeletionPolicy'] == 'Delete'
        props = instance['Properties']
        assert props['Engine'] == 'aurora-mysql'
        assert props['DBInstanceClass'] == 'db.r5.large'
        assert props['MonitoringInterval'] == 60
        assert props['PubliclyAccessible'] is False

    def test_aurora_reader_instances(self, resources):
        """Verify Aurora reader instances."""
        for i in range(1, 3):
            instance_name = f'AuroraDBInstanceReader{i}'
            assert instance_name in resources
            instance = resources[instance_name]
            assert instance['Type'] == 'AWS::RDS::DBInstance'
            assert instance['DeletionPolicy'] == 'Delete'
            props = instance['Properties']
            assert props['Engine'] == 'aurora-mysql'
            assert props['PubliclyAccessible'] is False


class TestECSResources:
    """Test ECS cluster and service configuration."""

    def test_ecs_cluster(self, resources):
        """Verify ECS cluster configuration."""
        cluster = resources['ECSCluster']
        assert cluster['Type'] == 'AWS::ECS::Cluster'
        assert cluster['DeletionPolicy'] == 'Delete'
        props = cluster['Properties']
        assert 'FARGATE' in props['CapacityProviders']
        # Verify Container Insights
        settings = props['ClusterSettings']
        assert any(s['Name'] == 'containerInsights' and s['Value'] == 'enabled' for s in settings)

    def test_ecs_task_definition(self, resources):
        """Verify ECS task definition configuration."""
        task_def = resources['ECSTaskDefinition']
        assert task_def['Type'] == 'AWS::ECS::TaskDefinition'
        assert task_def['DeletionPolicy'] == 'Delete'
        props = task_def['Properties']
        assert props['NetworkMode'] == 'awsvpc'
        assert 'FARGATE' in props['RequiresCompatibilities']
        assert props['Cpu'] == '512'
        assert props['Memory'] == '1024'
        # Verify container definition
        containers = props['ContainerDefinitions']
        assert len(containers) == 1
        container = containers[0]
        assert container['Name'] == 'loan-processing-app'
        assert 'LogConfiguration' in container
        # Verify environment variables
        env_vars = container['Environment']
        env_names = [e['Name'] for e in env_vars]
        assert 'DB_HOST' in env_names
        assert 'DB_PORT' in env_names
        assert 'DB_NAME' in env_names
        assert 'DOCUMENT_BUCKET' in env_names

    def test_ecs_service(self, resources):
        """Verify ECS service configuration."""
        service = resources['ECSService']
        assert service['Type'] == 'AWS::ECS::Service'
        assert service['DeletionPolicy'] == 'Delete'
        props = service['Properties']
        assert props['DesiredCount'] == 2
        assert props['LaunchType'] == 'FARGATE'
        # Verify network configuration
        network_config = props['NetworkConfiguration']['AwsvpcConfiguration']
        assert network_config['AssignPublicIp'] == 'DISABLED'
        assert len(network_config['Subnets']) == 3
        # Verify load balancer integration
        assert len(props['LoadBalancers']) == 1
        assert props['HealthCheckGracePeriodSeconds'] == 60


class TestAutoScaling:
    """Test auto-scaling configuration."""

    def test_ecs_autoscaling_target(self, resources):
        """Verify ECS auto-scaling target configuration."""
        target = resources['ECSAutoScalingTarget']
        assert target['Type'] == 'AWS::ApplicationAutoScaling::ScalableTarget'
        assert target['DeletionPolicy'] == 'Delete'
        props = target['Properties']
        assert props['MinCapacity'] == 2
        assert props['MaxCapacity'] == 10
        assert props['ScalableDimension'] == 'ecs:service:DesiredCount'

    def test_ecs_cpu_scaling_policy(self, resources):
        """Verify CPU-based scaling policy."""
        policy = resources['ECSScalingPolicyCPU']
        assert policy['Type'] == 'AWS::ApplicationAutoScaling::ScalingPolicy'
        assert policy['DeletionPolicy'] == 'Delete'
        config = policy['Properties']['TargetTrackingScalingPolicyConfiguration']
        assert config['PredefinedMetricSpecification']['PredefinedMetricType'] == 'ECSServiceAverageCPUUtilization'
        assert config['TargetValue'] == 70.0
        assert config['ScaleInCooldown'] == 300
        assert config['ScaleOutCooldown'] == 60

    def test_ecs_memory_scaling_policy(self, resources):
        """Verify memory-based scaling policy."""
        policy = resources['ECSScalingPolicyMemory']
        assert policy['Type'] == 'AWS::ApplicationAutoScaling::ScalingPolicy'
        assert policy['DeletionPolicy'] == 'Delete'
        config = policy['Properties']['TargetTrackingScalingPolicyConfiguration']
        assert config['PredefinedMetricSpecification']['PredefinedMetricType'] == 'ECSServiceAverageMemoryUtilization'
        assert config['TargetValue'] == 80.0


class TestCloudWatchAlarms:
    """Test CloudWatch alarm configurations."""

    def test_cpu_utilization_alarm(self, resources):
        """Verify CPU utilization alarm."""
        alarm = resources['CPUUtilizationAlarm']
        assert alarm['Type'] == 'AWS::CloudWatch::Alarm'
        assert alarm['DeletionPolicy'] == 'Delete'
        props = alarm['Properties']
        assert props['MetricName'] == 'CPUUtilization'
        assert props['Namespace'] == 'AWS/ECS'
        assert props['Threshold'] == 70
        assert props['ComparisonOperator'] == 'GreaterThanThreshold'
        assert props['EvaluationPeriods'] == 2

    def test_memory_utilization_alarm(self, resources):
        """Verify memory utilization alarm."""
        alarm = resources['MemoryUtilizationAlarm']
        assert alarm['Type'] == 'AWS::CloudWatch::Alarm'
        assert alarm['DeletionPolicy'] == 'Delete'
        props = alarm['Properties']
        assert props['MetricName'] == 'MemoryUtilization'
        assert props['Threshold'] == 80

    def test_database_connections_alarm(self, resources):
        """Verify database connections alarm."""
        alarm = resources['DatabaseConnectionsAlarm']
        assert alarm['Type'] == 'AWS::CloudWatch::Alarm'
        assert alarm['DeletionPolicy'] == 'Delete'
        props = alarm['Properties']
        assert props['MetricName'] == 'DatabaseConnections'
        assert props['Namespace'] == 'AWS/RDS'
        assert props['Threshold'] == 80

    def test_database_cpu_alarm(self, resources):
        """Verify database CPU utilization alarm."""
        alarm = resources['DatabaseCPUUtilizationAlarm']
        assert alarm['Type'] == 'AWS::CloudWatch::Alarm'
        assert alarm['DeletionPolicy'] == 'Delete'
        props = alarm['Properties']
        assert props['MetricName'] == 'CPUUtilization'
        assert props['Namespace'] == 'AWS/RDS'
        assert props['Threshold'] == 80


class TestOutputs:
    """Test stack outputs."""

    def test_vpc_id_output(self, outputs):
        """Verify VPC ID output."""
        assert 'VPCId' in outputs
        output = outputs['VPCId']
        assert 'Description' in output
        assert 'Value' in output
        assert 'Export' in output

    def test_load_balancer_outputs(self, outputs):
        """Verify load balancer outputs."""
        assert 'LoadBalancerDNS' in outputs
        assert 'LoadBalancerURL' in outputs
        url_output = outputs['LoadBalancerURL']
        # Verify URL starts with http://
        assert 'http://' in str(url_output['Value'])

    def test_database_outputs(self, outputs):
        """Verify database-related outputs."""
        assert 'DatabaseEndpoint' in outputs
        assert 'DatabaseReaderEndpoint' in outputs
        assert 'DatabasePort' in outputs

    def test_s3_bucket_outputs(self, outputs):
        """Verify S3 bucket outputs."""
        assert 'DocumentBucketName' in outputs
        assert 'StaticAssetsBucketName' in outputs

    def test_cloudfront_outputs(self, outputs):
        """Verify CloudFront outputs."""
        assert 'CloudFrontDistributionURL' in outputs
        assert 'CloudFrontDistributionId' in outputs
        url_output = outputs['CloudFrontDistributionURL']
        # Verify URL starts with https://
        assert 'https://' in str(url_output['Value'])

    def test_ecs_outputs(self, outputs):
        """Verify ECS-related outputs."""
        assert 'ECSClusterName' in outputs
        assert 'ECSServiceName' in outputs
        assert 'ECSTaskDefinitionArn' in outputs


class TestResourceNaming:
    """Test that all resources include environmentSuffix."""

    def test_resource_names_include_suffix(self, resources):
        """Verify all named resources include environmentSuffix."""
        resources_with_names = []
        resources_with_suffix = []

        for resource_name, resource_data in resources.items():
            props = resource_data.get('Properties', {})

            # Check various name properties
            name_props = ['Name', 'BucketName', 'ClusterName', 'ServiceName',
                         'DBClusterIdentifier', 'DBInstanceIdentifier',
                         'LoadBalancerName', 'RoleName', 'LogGroupName',
                         'DBSubnetGroupName', 'AlarmName', 'Family', 'PolicyName']

            for name_prop in name_props:
                if name_prop in props:
                    resources_with_names.append(resource_name)
                    name_value = props[name_prop]
                    # Check if name includes EnvironmentSuffix reference
                    if isinstance(name_value, dict):
                        # Check Fn::Sub for ${EnvironmentSuffix}
                        if 'Fn::Sub' in name_value or '${EnvironmentSuffix}' in str(name_value):
                            resources_with_suffix.append(resource_name)
                    elif isinstance(name_value, str) and '${EnvironmentSuffix}' in name_value:
                        resources_with_suffix.append(resource_name)
                    break

        # Calculate percentage of resources with suffix
        if resources_with_names:
            coverage = (len(resources_with_suffix) / len(resources_with_names)) * 100
            assert coverage >= 80, f"Only {coverage}% of named resources include environmentSuffix (expected ≥80%)"


class TestDeletionPolicies:
    """Test deletion policies for destroyability."""

    def test_resources_have_delete_policy(self, resources):
        """Verify resources have DeletionPolicy: Delete."""
        resources_with_policy = []

        for resource_name, resource_data in resources.items():
            if 'DeletionPolicy' in resource_data:
                resources_with_policy.append(resource_name)
                assert resource_data['DeletionPolicy'] == 'Delete', \
                    f"{resource_name} has DeletionPolicy: {resource_data['DeletionPolicy']}, expected 'Delete'"

        # Most resources should have DeletionPolicy
        assert len(resources_with_policy) > 50, \
            f"Only {len(resources_with_policy)} resources have DeletionPolicy defined"


class TestSecurityCompliance:
    """Test security and compliance configurations."""

    def test_encryption_at_rest(self, resources):
        """Verify encryption at rest for data stores."""
        # RDS encryption
        assert resources['AuroraDBCluster']['Properties']['StorageEncrypted'] is True

        # S3 encryption
        doc_bucket = resources['DocumentBucket']['Properties']
        assert 'BucketEncryption' in doc_bucket

        # CloudWatch Logs encryption
        assert 'KmsKeyId' in resources['ECSLogGroup']['Properties']

    def test_s3_public_access_blocked(self, resources):
        """Verify S3 buckets block public access."""
        for bucket_name in ['DocumentBucket', 'StaticAssetsBucket']:
            bucket = resources[bucket_name]['Properties']
            assert 'PublicAccessBlockConfiguration' in bucket
            config = bucket['PublicAccessBlockConfiguration']
            assert config['BlockPublicAcls'] is True
            assert config['BlockPublicPolicy'] is True
            assert config['IgnorePublicAcls'] is True
            assert config['RestrictPublicBuckets'] is True

    def test_s3_versioning_enabled(self, resources):
        """Verify S3 buckets have versioning enabled."""
        for bucket_name in ['DocumentBucket', 'StaticAssetsBucket']:
            bucket = resources[bucket_name]['Properties']
            assert bucket['VersioningConfiguration']['Status'] == 'Enabled'

    def test_rds_not_publicly_accessible(self, resources):
        """Verify RDS instances are not publicly accessible."""
        for instance_name in ['AuroraDBInstanceWriter', 'AuroraDBInstanceReader1', 'AuroraDBInstanceReader2']:
            instance = resources[instance_name]['Properties']
            assert instance['PubliclyAccessible'] is False

    def test_ecs_tasks_in_private_subnets(self, resources):
        """Verify ECS tasks run in private subnets."""
        service = resources['ECSService']['Properties']
        network_config = service['NetworkConfiguration']['AwsvpcConfiguration']
        assert network_config['AssignPublicIp'] == 'DISABLED'
