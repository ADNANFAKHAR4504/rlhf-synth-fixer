"""
Unit tests for TapStack CloudFormation template
Tests template structure, resource configurations, and best practices
"""

import json
import os
import pytest
from typing import Dict, Any


class TestTapStackUnit:
    """Unit tests for TapStack CloudFormation template"""

    @pytest.fixture(scope="class")
    def template(self) -> Dict[str, Any]:
        """Load CloudFormation template"""
        template_path = os.path.join(os.path.dirname(__file__), "..", "lib", "TapStack.json")
        with open(template_path, 'r') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def resources(self, template: Dict[str, Any]) -> Dict[str, Any]:
        """Get resources from template"""
        return template.get('Resources', {})

    @pytest.fixture(scope="class")
    def parameters(self, template: Dict[str, Any]) -> Dict[str, Any]:
        """Get parameters from template"""
        return template.get('Parameters', {})

    @pytest.fixture(scope="class")
    def outputs(self, template: Dict[str, Any]) -> Dict[str, Any]:
        """Get outputs from template"""
        return template.get('Outputs', {})

    # Template Structure Tests
    def test_template_version(self, template: Dict[str, Any]):
        """Test template has correct AWSTemplateFormatVersion"""
        assert 'AWSTemplateFormatVersion' in template
        assert template['AWSTemplateFormatVersion'] == '2010-09-09'

    def test_template_description(self, template: Dict[str, Any]):
        """Test template has description"""
        assert 'Description' in template
        assert len(template['Description']) > 0

    def test_template_has_resources(self, template: Dict[str, Any]):
        """Test template has resources section"""
        assert 'Resources' in template
        assert len(template['Resources']) > 0

    def test_template_has_parameters(self, template: Dict[str, Any]):
        """Test template has parameters section"""
        assert 'Parameters' in template
        assert len(template['Parameters']) > 0

    def test_template_has_outputs(self, template: Dict[str, Any]):
        """Test template has outputs section"""
        assert 'Outputs' in template
        assert len(template['Outputs']) > 0

    # Parameter Tests
    def test_environment_suffix_parameter(self, parameters: Dict[str, Any]):
        """Test EnvironmentSuffix parameter exists and is configured correctly"""
        assert 'EnvironmentSuffix' in parameters
        env_param = parameters['EnvironmentSuffix']
        assert env_param['Type'] == 'String'
        assert 'Description' in env_param
        assert 'Default' in env_param

    def test_vpc_cidr_parameter(self, parameters: Dict[str, Any]):
        """Test VpcCidr parameter"""
        assert 'VpcCidr' in parameters
        vpc_param = parameters['VpcCidr']
        assert vpc_param['Type'] == 'String'
        assert vpc_param['Default'] == '10.0.0.0/16'

    def test_container_parameters(self, parameters: Dict[str, Any]):
        """Test container-related parameters"""
        assert 'ContainerImage' in parameters
        assert 'ContainerPort' in parameters
        assert 'TaskCpu' in parameters
        assert 'TaskMemory' in parameters

    def test_database_parameters(self, parameters: Dict[str, Any]):
        """Test database-related parameters"""
        assert 'DatabaseName' in parameters
        assert 'DatabaseUsername' in parameters
        assert 'MinDatabaseCapacity' in parameters
        assert 'MaxDatabaseCapacity' in parameters

    def test_autoscaling_parameters(self, parameters: Dict[str, Any]):
        """Test auto-scaling parameters"""
        assert 'DesiredCount' in parameters
        assert 'MinCapacity' in parameters
        assert 'MaxCapacity' in parameters

    # VPC and Networking Tests
    def test_vpc_resource(self, resources: Dict[str, Any]):
        """Test VPC resource configuration"""
        assert 'VPC' in resources
        vpc = resources['VPC']
        assert vpc['Type'] == 'AWS::EC2::VPC'
        props = vpc['Properties']
        assert props['EnableDnsHostnames'] is True
        assert props['EnableDnsSupport'] is True

    def test_internet_gateway(self, resources: Dict[str, Any]):
        """Test Internet Gateway exists"""
        assert 'InternetGateway' in resources
        igw = resources['InternetGateway']
        assert igw['Type'] == 'AWS::EC2::InternetGateway'

    def test_nat_gateway(self, resources: Dict[str, Any]):
        """Test NAT Gateway configuration"""
        assert 'NatGateway' in resources
        nat = resources['NatGateway']
        assert nat['Type'] == 'AWS::EC2::NatGateway'

    def test_public_subnets(self, resources: Dict[str, Any]):
        """Test public subnets configuration"""
        assert 'PublicSubnet1' in resources
        assert 'PublicSubnet2' in resources

        pub1 = resources['PublicSubnet1']
        pub2 = resources['PublicSubnet2']

        assert pub1['Type'] == 'AWS::EC2::Subnet'
        assert pub2['Type'] == 'AWS::EC2::Subnet'

        assert pub1['Properties']['MapPublicIpOnLaunch'] is True
        assert pub2['Properties']['MapPublicIpOnLaunch'] is True

    def test_private_subnets(self, resources: Dict[str, Any]):
        """Test private subnets configuration"""
        assert 'PrivateSubnet1' in resources
        assert 'PrivateSubnet2' in resources

        priv1 = resources['PrivateSubnet1']
        priv2 = resources['PrivateSubnet2']

        assert priv1['Type'] == 'AWS::EC2::Subnet'
        assert priv2['Type'] == 'AWS::EC2::Subnet'

    def test_route_tables(self, resources: Dict[str, Any]):
        """Test route tables exist"""
        assert 'PublicRouteTable' in resources
        assert 'PrivateRouteTable' in resources
        assert 'PublicRoute' in resources
        assert 'PrivateRoute' in resources

    # Security Group Tests
    def test_alb_security_group(self, resources: Dict[str, Any]):
        """Test ALB security group configuration"""
        assert 'ALBSecurityGroup' in resources
        sg = resources['ALBSecurityGroup']
        assert sg['Type'] == 'AWS::EC2::SecurityGroup'

        ingress = sg['Properties']['SecurityGroupIngress']
        assert len(ingress) > 0
        assert ingress[0]['FromPort'] == 80
        assert ingress[0]['ToPort'] == 80

    def test_ecs_security_group(self, resources: Dict[str, Any]):
        """Test ECS security group configuration"""
        assert 'ECSSecurityGroup' in resources
        sg = resources['ECSSecurityGroup']
        assert sg['Type'] == 'AWS::EC2::SecurityGroup'

        ingress = sg['Properties']['SecurityGroupIngress']
        assert len(ingress) > 0

    def test_database_security_group(self, resources: Dict[str, Any]):
        """Test database security group configuration"""
        assert 'DatabaseSecurityGroup' in resources
        sg = resources['DatabaseSecurityGroup']
        assert sg['Type'] == 'AWS::EC2::SecurityGroup'

        ingress = sg['Properties']['SecurityGroupIngress']
        assert len(ingress) > 0
        assert ingress[0]['FromPort'] == 5432
        assert ingress[0]['ToPort'] == 5432

    # Load Balancer Tests
    def test_application_load_balancer(self, resources: Dict[str, Any]):
        """Test ALB configuration"""
        assert 'ApplicationLoadBalancer' in resources
        alb = resources['ApplicationLoadBalancer']
        assert alb['Type'] == 'AWS::ElasticLoadBalancingV2::LoadBalancer'

        props = alb['Properties']
        assert props['Type'] == 'application'
        assert props['Scheme'] == 'internet-facing'

    def test_alb_target_group(self, resources: Dict[str, Any]):
        """Test ALB target group configuration"""
        assert 'ALBTargetGroup' in resources
        tg = resources['ALBTargetGroup']
        assert tg['Type'] == 'AWS::ElasticLoadBalancingV2::TargetGroup'

        props = tg['Properties']
        assert props['Protocol'] == 'HTTP'
        assert props['TargetType'] == 'ip'
        assert props['HealthCheckEnabled'] is True

    def test_alb_listener(self, resources: Dict[str, Any]):
        """Test ALB listener configuration"""
        assert 'ALBListener' in resources
        listener = resources['ALBListener']
        assert listener['Type'] == 'AWS::ElasticLoadBalancingV2::Listener'

        props = listener['Properties']
        assert props['Port'] == 80
        assert props['Protocol'] == 'HTTP'

    # ECS Tests
    def test_ecs_cluster(self, resources: Dict[str, Any]):
        """Test ECS cluster configuration"""
        assert 'ECSCluster' in resources
        cluster = resources['ECSCluster']
        assert cluster['Type'] == 'AWS::ECS::Cluster'

        # Check container insights
        settings = cluster['Properties']['ClusterSettings']
        assert any(s['Name'] == 'containerInsights' for s in settings)

    def test_ecs_task_definition(self, resources: Dict[str, Any]):
        """Test ECS task definition configuration"""
        assert 'ECSTaskDefinition' in resources
        task_def = resources['ECSTaskDefinition']
        assert task_def['Type'] == 'AWS::ECS::TaskDefinition'

        props = task_def['Properties']
        assert props['NetworkMode'] == 'awsvpc'
        assert 'FARGATE' in props['RequiresCompatibilities']
        assert len(props['ContainerDefinitions']) > 0

    def test_ecs_service(self, resources: Dict[str, Any]):
        """Test ECS service configuration"""
        assert 'ECSService' in resources
        service = resources['ECSService']
        assert service['Type'] == 'AWS::ECS::Service'

        props = service['Properties']
        assert props['LaunchType'] == 'FARGATE'
        assert len(props['LoadBalancers']) > 0

    def test_ecs_task_execution_role(self, resources: Dict[str, Any]):
        """Test ECS task execution role"""
        assert 'ECSTaskExecutionRole' in resources
        role = resources['ECSTaskExecutionRole']
        assert role['Type'] == 'AWS::IAM::Role'

    def test_ecs_task_role(self, resources: Dict[str, Any]):
        """Test ECS task role"""
        assert 'ECSTaskRole' in resources
        role = resources['ECSTaskRole']
        assert role['Type'] == 'AWS::IAM::Role'

    # RDS Tests
    def test_database_secret(self, resources: Dict[str, Any]):
        """Test database credentials secret"""
        assert 'DatabaseSecret' in resources
        secret = resources['DatabaseSecret']
        assert secret['Type'] == 'AWS::SecretsManager::Secret'

        props = secret['Properties']
        assert 'GenerateSecretString' in props

    def test_database_subnet_group(self, resources: Dict[str, Any]):
        """Test database subnet group"""
        assert 'DBSubnetGroup' in resources
        subnet_group = resources['DBSubnetGroup']
        assert subnet_group['Type'] == 'AWS::RDS::DBSubnetGroup'

    def test_database_cluster(self, resources: Dict[str, Any]):
        """Test Aurora database cluster configuration"""
        assert 'DBCluster' in resources
        cluster = resources['DBCluster']
        assert cluster['Type'] == 'AWS::RDS::DBCluster'

        props = cluster['Properties']
        assert props['Engine'] == 'aurora-postgresql'
        assert props['EngineMode'] == 'provisioned'
        assert props['StorageEncrypted'] is True
        assert 'ServerlessV2ScalingConfiguration' in props

    def test_database_instance(self, resources: Dict[str, Any]):
        """Test Aurora database instance"""
        assert 'DBInstance' in resources
        instance = resources['DBInstance']
        assert instance['Type'] == 'AWS::RDS::DBInstance'

        props = instance['Properties']
        assert props['DBInstanceClass'] == 'db.serverless'
        assert props['PubliclyAccessible'] is False

    # Auto-scaling Tests
    def test_autoscaling_target(self, resources: Dict[str, Any]):
        """Test auto-scaling target configuration"""
        assert 'ServiceAutoScalingTarget' in resources
        target = resources['ServiceAutoScalingTarget']
        assert target['Type'] == 'AWS::ApplicationAutoScaling::ScalableTarget'

        props = target['Properties']
        assert props['ScalableDimension'] == 'ecs:service:DesiredCount'
        assert props['ServiceNamespace'] == 'ecs'

    def test_cpu_scaling_policy(self, resources: Dict[str, Any]):
        """Test CPU-based scaling policy"""
        assert 'ServiceScalingPolicyCPU' in resources
        policy = resources['ServiceScalingPolicyCPU']
        assert policy['Type'] == 'AWS::ApplicationAutoScaling::ScalingPolicy'

        props = policy['Properties']
        assert props['PolicyType'] == 'TargetTrackingScaling'

    def test_memory_scaling_policy(self, resources: Dict[str, Any]):
        """Test memory-based scaling policy"""
        assert 'ServiceScalingPolicyMemory' in resources
        policy = resources['ServiceScalingPolicyMemory']
        assert policy['Type'] == 'AWS::ApplicationAutoScaling::ScalingPolicy'

    # CloudWatch Tests
    def test_application_log_group(self, resources: Dict[str, Any]):
        """Test CloudWatch log group"""
        assert 'ApplicationLogGroup' in resources
        log_group = resources['ApplicationLogGroup']
        assert log_group['Type'] == 'AWS::Logs::LogGroup'

        props = log_group['Properties']
        assert 'RetentionInDays' in props

    # EnvironmentSuffix Usage Tests
    def test_resource_names_use_environment_suffix(self, resources: Dict[str, Any]):
        """Test that named resources use EnvironmentSuffix"""
        name_properties = [
            ('VPC', 'Tags'),
            ('ApplicationLoadBalancer', 'Name'),
            ('ECSCluster', 'ClusterName'),
            ('DBCluster', 'DBClusterIdentifier'),
            ('DatabaseSecret', 'Name'),
        ]

        for resource_name, prop in name_properties:
            assert resource_name in resources
            resource = resources[resource_name]
            props = resource['Properties']

            if prop == 'Tags':
                # Check tags for Name tag with Fn::Sub
                tags = props.get('Tags', [])
                name_tag = next((t for t in tags if t['Key'] == 'Name'), None)
                assert name_tag is not None
                assert 'Fn::Sub' in name_tag['Value']
            else:
                # Check direct property
                assert prop in props
                name_value = props[prop]
                if isinstance(name_value, dict):
                    assert 'Fn::Sub' in name_value

    # Destroyability Tests
    def test_no_retain_policies(self, resources: Dict[str, Any]):
        """Test that no resources have Retain deletion policies"""
        for resource_name, resource in resources.items():
            assert resource.get('DeletionPolicy') != 'Retain', \
                f"Resource {resource_name} has DeletionPolicy: Retain"
            assert resource.get('UpdateReplacePolicy') != 'Retain', \
                f"Resource {resource_name} has UpdateReplacePolicy: Retain"

    def test_no_deletion_protection(self, resources: Dict[str, Any]):
        """Test that no resources have deletion protection enabled"""
        for resource_name, resource in resources.items():
            props = resource.get('Properties', {})
            assert props.get('DeletionProtection') is not True, \
                f"Resource {resource_name} has DeletionProtection enabled"

    # Output Tests
    def test_vpc_outputs(self, outputs: Dict[str, Any]):
        """Test VPC-related outputs"""
        assert 'VPCId' in outputs
        assert 'PublicSubnet1Id' in outputs
        assert 'PublicSubnet2Id' in outputs
        assert 'PrivateSubnet1Id' in outputs
        assert 'PrivateSubnet2Id' in outputs

    def test_load_balancer_outputs(self, outputs: Dict[str, Any]):
        """Test load balancer outputs"""
        assert 'LoadBalancerDNS' in outputs
        assert 'LoadBalancerURL' in outputs

    def test_ecs_outputs(self, outputs: Dict[str, Any]):
        """Test ECS outputs"""
        assert 'ECSClusterName' in outputs
        assert 'ECSServiceName' in outputs

    def test_database_outputs(self, outputs: Dict[str, Any]):
        """Test database outputs"""
        assert 'DatabaseClusterEndpoint' in outputs
        assert 'DatabaseClusterReadEndpoint' in outputs
        assert 'DatabaseName' in outputs
        assert 'DatabaseSecretArn' in outputs

    def test_logging_outputs(self, outputs: Dict[str, Any]):
        """Test logging outputs"""
        assert 'ApplicationLogGroup' in outputs

    def test_outputs_have_exports(self, outputs: Dict[str, Any]):
        """Test that important outputs have export names"""
        exports_required = [
            'VPCId',
            'ECSClusterName',
            'DatabaseClusterEndpoint'
        ]

        for output_name in exports_required:
            assert output_name in outputs
            output = outputs[output_name]
            assert 'Export' in output
            assert 'Name' in output['Export']

    # Resource Count Tests
    def test_resource_count(self, resources: Dict[str, Any]):
        """Test that template has expected number of resources"""
        assert len(resources) >= 30, "Template should have at least 30 resources"

    def test_security_groups_count(self, resources: Dict[str, Any]):
        """Test correct number of security groups"""
        sg_count = sum(1 for r in resources.values()
                      if r['Type'] == 'AWS::EC2::SecurityGroup')
        assert sg_count == 3, "Should have 3 security groups (ALB, ECS, Database)"

    def test_subnet_count(self, resources: Dict[str, Any]):
        """Test correct number of subnets"""
        subnet_count = sum(1 for r in resources.values()
                          if r['Type'] == 'AWS::EC2::Subnet')
        assert subnet_count == 4, "Should have 4 subnets (2 public, 2 private)"
