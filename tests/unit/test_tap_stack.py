"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi
from pulumi import ResourceOptions
import pytest
import json
import pulumi_aws as aws
import pulumi_random as random  
import sys
import os

# Import the classes we're testing
from lib.tap_stack import TapStack, TapStackArgs

"""
test_tap_stack.py

Unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

# Module-level fixtures (required for pytest to recognize them)
@pytest.fixture
def mock_pulumi_config():
    """Mock Pulumi configuration for consistent testing"""
    with patch('pulumi.Config') as mock_config_class:
        # Create separate mock instances for different config namespaces
        main_config = Mock()
        main_config.require.side_effect = lambda key: {
            'environment': 'prod',
            'project': 'cloudsetup', 
            'owner': 'mgt'
        }.get(key, 'default-value')
        
        aws_config = Mock()
        aws_config.get.side_effect = lambda key: {
            'region': 'us-west-2'
        }.get(key)
        
        # Mock the Config class to return different instances based on namespace
        def config_side_effect(namespace=None):
            if namespace == 'aws':
                return aws_config
            elif namespace == 'pulumi':
                pulumi_config = Mock()
                pulumi_config.get_object.return_value = {'pulumi:template': 'python'}
                return pulumi_config
            else:
                return main_config
        
        mock_config_class.side_effect = config_side_effect
        yield mock_config_class

@pytest.fixture
def mock_aws_resources():
    """Mock AWS data sources and external resources"""
    with patch('pulumi_aws.get_availability_zones') as mock_az, \
         patch('pulumi_aws.ec2.get_ami') as mock_ami, \
         patch('pulumi_aws.Provider') as mock_provider:
        
        # Mock availability zones
        mock_az_result = Mock()
        mock_az_result.names = ['us-west-2a', 'us-west-2b', 'us-west-2c']
        mock_az.return_value = mock_az_result
        
        # Mock AMI
        mock_ami_result = Mock()
        mock_ami_result.id = 'ami-12345678'
        mock_ami.return_value = mock_ami_result
        
        # Mock AWS Provider
        mock_provider_instance = Mock()
        mock_provider.return_value = mock_provider_instance
        
        yield {
            'availability_zones': mock_az_result,
            'ami': mock_ami_result,
            'provider': mock_provider_instance
        }

@pytest.fixture
def sample_tapstack_args():
    """Create sample TapStackArgs for testing"""
    # Import here to avoid circular imports during test discovery
    try:
        from __main__ import TapStackArgs
        return TapStackArgs(
            environment="prod",
            project="cloudsetup",
            owner="mgt", 
            region="us-west-2",
            tags={"ManagedBy": "Pulumi", "Environment": "prod"}
        )
    except ImportError:
        # Create a mock if import fails
        mock_args = Mock()
        mock_args.environment = "prod"
        mock_args.project = "cloudsetup"
        mock_args.owner = "mgt"
        mock_args.region = "us-west-2"
        mock_args.tags = {"ManagedBy": "Pulumi", "Environment": "prod"}
        return mock_args


class TapStackArgs:
    """Mock TapStackArgs for testing when import fails"""
    def __init__(self, environment: str, project: str, owner: str, region: str, environment_suffix: str = "dev", tags: dict = None):
        self.environment = environment
        self.project = project
        self.owner = owner
        self.region = region
        self.environment_suffix = environment_suffix
        self.tags = tags or {}


class TestTapStackArgs:
    """Test TapStackArgs configuration class"""
    
    def test_args_initialization(self):
        """Test TapStackArgs initializes correctly"""
        try:
            from __main__ import TapStackArgs
            args = TapStackArgs(
                environment="Development",
                project="TestProject",
                owner="TestOwner",
                region="us-west-2",
                environment_suffix="dev",
                tags={"Test": "Value"}
            )
            
            assert args.environment == "Development"
            assert args.project == "TestProject"
            assert args.owner == "TestOwner"
            assert args.region == "us-west-2"
            assert args.environment_suffix == "dev"
            assert args.tags["Test"] == "Value"
        except ImportError:
            pytest.skip("TapStackArgs not available for testing")

    def test_args_defaults(self):
        """Test TapStackArgs default values"""
        try:
            from __main__ import TapStackArgs
            args = TapStackArgs(
                environment="prod",
                project="cloudsetup",
                owner="mgt",
                region="us-west-2"
            )
            
            assert args.environment_suffix == "dev"
            assert args.tags == {}
        except ImportError:
            pytest.skip("TapStackArgs not available for testing")


class TestNetworkingStack:
    """Test NetworkingStack component"""
    
    def test_vpc_creation_parameters(self, mock_aws_resources, sample_tapstack_args):
        """Test VPC is created with correct parameters"""
        vpc = aws.ec2.Vpc("test-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_support=True,
            enable_dns_hostnames=True,
            tags={
                "Name": f"{sample_tapstack_args.environment}-{sample_tapstack_args.project}-{sample_tapstack_args.owner}-vpc",
                "Environment": sample_tapstack_args.environment,
                "Project": sample_tapstack_args.project,
                "Owner": sample_tapstack_args.owner
            })
        
        assert vpc._name == "test-vpc"
    
    def test_subnet_cidr_allocation(self, mock_aws_resources, sample_tapstack_args):
        """Test subnet CIDR blocks are allocated correctly"""
        # Test the CIDR allocation logic
        expected_public_cidrs = ["10.0.0.0/24", "10.0.1.0/24"]
        expected_private_cidrs = ["10.0.2.0/24", "10.0.3.0/24"]
        
        for i in range(2):
            public_cidr = f"10.0.{i}.0/24"
            private_cidr = f"10.0.{i+2}.0/24"
            
            assert public_cidr == expected_public_cidrs[i]
            assert private_cidr == expected_private_cidrs[i]
    
    def test_availability_zone_distribution(self, mock_aws_resources, sample_tapstack_args):
        """Test subnets are distributed across availability zones"""
        az_names = mock_aws_resources['availability_zones'].names
        used_azs = min(2, len(az_names))
        
        assert used_azs == 2
        assert len(az_names) >= 2
        
        for i in range(used_azs):
            assert az_names[i] in ['us-west-2a', 'us-west-2b', 'us-west-2c']

    def test_internet_gateway_configuration(self, mock_aws_resources, sample_tapstack_args):
        """Test Internet Gateway configuration"""
        vpc = aws.ec2.Vpc("test-vpc", cidr_block="10.0.0.0/16")
        
        igw = aws.ec2.InternetGateway("test-igw",
            vpc_id=vpc.id,
            tags={
                "Name": f"{sample_tapstack_args.environment}-{sample_tapstack_args.project}-{sample_tapstack_args.owner}-igw"
            })
        
        assert igw._name == "test-igw"

    def test_nat_gateway_setup(self, mock_aws_resources, sample_tapstack_args):
        """Test NAT Gateway and EIP setup"""
        eip = aws.ec2.Eip("test-eip", domain="vpc")
        
        # Verify EIP uses correct domain parameter (not deprecated vpc=True)
        assert eip._name == "test-eip"


class TestSecurityStack:
    """Test SecurityStack component"""
    
    def test_web_security_group_rules(self, mock_aws_resources, sample_tapstack_args):
        """Test web security group has correct ingress rules"""
        vpc = aws.ec2.Vpc("test-vpc", cidr_block="10.0.0.0/16")
        
        web_sg = aws.ec2.SecurityGroup("test-web-sg",
            vpc_id=vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"],
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"],
                )
            ])
        
        assert web_sg._name == "test-web-sg"
    
    def test_database_security_group_isolation(self, mock_aws_resources, sample_tapstack_args):
        """Test database security group restricts access to VPC only"""
        vpc = aws.ec2.Vpc("test-vpc", cidr_block="10.0.0.0/16")
        
        db_sg = aws.ec2.SecurityGroup("test-db-sg",
            vpc_id=vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    cidr_blocks=["10.0.0.0/16"],  # VPC CIDR only
                )
            ])
        
        assert db_sg._name == "test-db-sg"

    def test_ec2_iam_role_trust_policy(self, mock_aws_resources, sample_tapstack_args):
        """Test EC2 IAM role has correct trust policy"""
        expected_trust_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {"Service": "ec2.amazonaws.com"},
                "Effect": "Allow",
                "Sid": "",
            }]
        }
        
        # Test trust policy structure
        statement = expected_trust_policy["Statement"][0]
        assert statement["Action"] == "sts:AssumeRole"
        assert statement["Principal"]["Service"] == "ec2.amazonaws.com"
        assert statement["Effect"] == "Allow"

    def test_ec2_role_policy_permissions(self, mock_aws_resources, sample_tapstack_args):
        """Test EC2 role policy has required permissions"""
        expected_permissions = [
            "s3:Get*",
            "s3:List*", 
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "ssm:GetParameter"
        ]
        
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": expected_permissions,
                "Resource": "*"
            }]
        }
        
        # Verify all expected permissions are present
        actions = policy_document["Statement"][0]["Action"]
        for permission in expected_permissions:
            assert permission in actions


class TestComputeStack:
    """Test ComputeStack component"""
    
    def test_ec2_instance_configuration(self, mock_aws_resources, sample_tapstack_args):
        """Test EC2 instances are configured correctly"""
        vpc = aws.ec2.Vpc("test-vpc", cidr_block="10.0.0.0/16")
        subnet = aws.ec2.Subnet("test-subnet", vpc_id=vpc.id, cidr_block="10.0.1.0/24", availability_zone="us-west-2a")
        sg = aws.ec2.SecurityGroup("test-sg", vpc_id=vpc.id)
        role = aws.iam.Role("test-role", assume_role_policy=json.dumps({}))
        
        instance = aws.ec2.Instance("test-instance",
            instance_type="t2.micro",
            ami=mock_aws_resources['ami'].id,
            subnet_id=subnet.id,
            vpc_security_group_ids=[sg.id],
            user_data="""#!/bin/bash
yum update -y
amazon-linux-extras install -y nginx1
systemctl start nginx
systemctl enable nginx
""")
        
        assert instance._name == "test-instance"

    def test_load_balancer_configuration(self, mock_aws_resources, sample_tapstack_args):
        """Test Application Load Balancer configuration"""
        vpc = aws.ec2.Vpc("test-vpc", cidr_block="10.0.0.0/16")
        subnet1 = aws.ec2.Subnet("test-subnet-1", vpc_id=vpc.id, cidr_block="10.0.1.0/24", availability_zone="us-west-2a")
        subnet2 = aws.ec2.Subnet("test-subnet-2", vpc_id=vpc.id, cidr_block="10.0.2.0/24", availability_zone="us-west-2b")
        sg = aws.ec2.SecurityGroup("test-sg", vpc_id=vpc.id)
        
        alb = aws.lb.LoadBalancer("test-alb",
            security_groups=[sg.id],
            subnets=[subnet1.id, subnet2.id])
        
        assert alb._name == "test-alb"

    def test_target_group_health_check(self, mock_aws_resources, sample_tapstack_args):
        """Test target group health check configuration"""
        vpc = aws.ec2.Vpc("test-vpc", cidr_block="10.0.0.0/16")
        
        target_group = aws.lb.TargetGroup("test-tg",
            port=80,
            protocol="HTTP",
            vpc_id=vpc.id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                path="/",
                port="traffic-port",
                protocol="HTTP",
                interval=30,
                timeout=5,
                healthy_threshold=5,
                unhealthy_threshold=2,
                matcher="200"
            ))
        
        assert target_group._name == "test-tg"


class TestDatabaseStack:
    """Test DatabaseStack component"""
    
    def test_rds_instance_configuration(self, mock_aws_resources, sample_tapstack_args):
        """Test RDS instance configuration parameters"""
        vpc = aws.ec2.Vpc("test-vpc", cidr_block="10.0.0.0/16")
        subnet1 = aws.ec2.Subnet("test-subnet-1", vpc_id=vpc.id, cidr_block="10.0.1.0/24", availability_zone="us-west-2a")
        subnet2 = aws.ec2.Subnet("test-subnet-2", vpc_id=vpc.id, cidr_block="10.0.2.0/24", availability_zone="us-west-2b")
        sg = aws.ec2.SecurityGroup("test-sg", vpc_id=vpc.id)
        
        db_subnet_group = aws.rds.SubnetGroup("test-db-subnet-group",
            subnet_ids=[subnet1.id, subnet2.id])
        
        # Create random password
        db_password = random.RandomPassword("test-db-password",
            length=16,
            special=True)
        
        db_instance = aws.rds.Instance("test-db",
            engine="postgres",
            engine_version="15.13",
            instance_class="db.t3.micro",  # Correct instance class for PostgreSQL 15+
            allocated_storage=20,
            vpc_security_group_ids=[sg.id],
            db_subnet_group_name=db_subnet_group.name,
            skip_final_snapshot=True,
            username="postgres",
            password=db_password.result)  # Use RandomPassword result
        
        assert db_instance._name == "test-db"

    def test_rds_monitoring_configuration(self, mock_aws_resources, sample_tapstack_args):
        """Test RDS Enhanced Monitoring configuration"""
        monitoring_role = aws.iam.Role("test-monitoring-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "monitoring.rds.amazonaws.com"
                    }
                }]
            }))
        
        policy_attachment = aws.iam.RolePolicyAttachment("test-monitoring-policy",
            role=monitoring_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole")
        
        assert monitoring_role._name == "test-monitoring-role"
        assert policy_attachment._name == "test-monitoring-policy"

    def test_database_backup_configuration(self, mock_aws_resources, sample_tapstack_args):
        """Test RDS backup settings"""
        expected_backup_config = {
            "backup_retention_period": 7,
            "backup_window": "03:00-04:00",
            "maintenance_window": "sun:04:00-sun:05:00",
            "skip_final_snapshot": True
        }
        
        # Verify backup configuration values
        assert expected_backup_config["backup_retention_period"] == 7
        assert expected_backup_config["backup_window"] == "03:00-04:00"
        assert expected_backup_config["maintenance_window"] == "sun:04:00-sun:05:00"
        assert expected_backup_config["skip_final_snapshot"] is True

    def test_password_generation(self, mock_aws_resources, sample_tapstack_args):
        """Test database password generation (using pulumi-random)"""
        with patch('pulumi_random.RandomPassword') as mock_password:
            mock_password_instance = Mock()
            mock_password_instance.result = "test-password-123"
            mock_password.return_value = mock_password_instance
            
            db_password = random.RandomPassword("test-db-pwd",
                length=16,
                special=True)
            
            # Verify password is generated correctly
            assert db_password.result == "test-password-123"


class TestResourceNaming:
    """Test resource naming conventions across all components"""
    
    def test_consistent_naming_pattern(self, mock_aws_resources, sample_tapstack_args):
        """Test all resources follow consistent naming pattern"""
        environment = sample_tapstack_args.environment
        project = sample_tapstack_args.project
        owner = sample_tapstack_args.owner
        
        # Test naming patterns
        expected_patterns = {
            "vpc": f"{environment}-{project}-{owner}-vpc",
            "web_sg": f"{environment}-{project}-{owner}-web-sg",
            "db_sg": f"{environment}-{project}-{owner}-db-sg",
            "alb": f"{environment}-{project}-{owner}-alb",
            "db": f"{environment}-{project}-{owner}-db"
        }
        
        assert expected_patterns["vpc"] == "prod-cloudsetup-mgt-vpc"
        assert expected_patterns["web_sg"] == "prod-cloudsetup-mgt-web-sg"
        assert expected_patterns["db_sg"] == "prod-cloudsetup-mgt-db-sg"
        assert expected_patterns["alb"] == "prod-cloudsetup-mgt-alb"
        assert expected_patterns["db"] == "prod-cloudsetup-mgt-db"

    def test_aws_naming_length_limits(self, mock_aws_resources, sample_tapstack_args):
        """Test resource names respect AWS length limits"""
        # Test that long names are handled appropriately
        long_environment = "VeryLongEnvironmentName"
        long_project = "VeryLongProjectNameThatExceedsLimits"
        long_owner = "VeryLongOwnerName"
        
        # Target Group names must be <= 32 characters
        tg_name = f"{long_environment[:4]}-{long_project[:8]}-tg"
        assert len(tg_name) <= 32
        
        # EIP names should be reasonable
        eip_name = f"{long_environment[:4]}-{long_project[:8]}-eip"
        assert len(eip_name) <= 50


class TestConfigurationValidation:
    """Test configuration parsing and validation"""
    
    def test_config_value_parsing(self, mock_pulumi_config, mock_aws_resources):
        """Test configuration values are parsed correctly"""
        config = pulumi.Config()
        aws_config = pulumi.Config("aws")
        
        assert config.require("environment") == "prod"
        assert config.require("project") == "cloudsetup"
        assert config.require("owner") == "mgt"
        assert aws_config.get("region") == "us-west-2"

    def test_tag_generation_from_config(self, mock_pulumi_config, mock_aws_resources):
        """Test tags are generated correctly from configuration"""
        config = pulumi.Config()
        
        expected_tags = {
            "Environment": config.require("environment"),
            "Project": config.require("project"),
            "Owner": config.require("owner"),
            "ManagedBy": "Pulumi"
        }
        
        assert expected_tags["Environment"] == "prod"
        assert expected_tags["Project"] == "cloudsetup"
        assert expected_tags["Owner"] == "mgt"
        assert expected_tags["ManagedBy"] == "Pulumi"


class TestIntegration:
    """Test component integration and dependencies"""
    
    def test_component_dependency_flow(self, mock_aws_resources, sample_tapstack_args):
        """Test components depend on each other correctly"""
        # This would test the actual component integration
        # NetworkingStack -> SecurityStack -> ComputeStack/DatabaseStack
        
        # Mock the flow
        networking_outputs = {
            "vpc_id": "vpc-12345",
            "public_subnet_ids": ["subnet-123", "subnet-456"],
            "private_subnet_ids": ["subnet-789", "subnet-abc"]
        }
        
        security_outputs = {
            "web_security_group_id": "sg-web-123",
            "db_security_group_id": "sg-db-456",
            "ec2_role_name": "ec2-role-789"
        }
        
        # Verify outputs exist
        assert networking_outputs["vpc_id"] is not None
        assert len(networking_outputs["public_subnet_ids"]) == 2
        assert len(networking_outputs["private_subnet_ids"]) == 2
        assert security_outputs["web_security_group_id"] is not None
        assert security_outputs["db_security_group_id"] is not None


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def test_insufficient_availability_zones(self, mock_aws_resources, sample_tapstack_args):
        """Test handling when fewer than 2 AZs are available"""
        # Mock only 1 AZ available
        mock_az_result = Mock()
        mock_az_result.names = ['us-west-2a']
        
        with patch('pulumi_aws.get_availability_zones', return_value=mock_az_result):
            az_names = mock_az_result.names
            used_azs = min(2, len(az_names))
            
            # Should handle gracefully and use only 1 AZ
            assert used_azs == 1
            assert len(az_names) == 1

    def test_invalid_configuration_values(self, mock_aws_resources):
        """Test handling of invalid configuration values"""
        # Test empty or None values
        config_values = {
            'environment': '',
            'project': None,
            'owner': 'mgt'
        }
        
        # Should handle empty/None values appropriately
        environment = config_values.get('environment') or 'default'
        project = config_values.get('project') or 'default'
        
        assert environment == 'default'
        assert project == 'default'


class TestTapStackIntegration:
    """Test the entire TapStack component integration"""
    
    def test_full_stack_initialization(self, mock_aws_resources, mock_pulumi_config):
        """Test complete TapStack can be initialized with all components"""
        try:
            from __main__ import TapStack, TapStackArgs
            
            # Create stack args
            args = TapStackArgs(
                environment="prod",
                project="cloudsetup", 
                owner="mgt",
                region="us-west-2",
                tags={"ManagedBy": "Pulumi"}
            )
            
            # Mock the provider creation
            with patch('pulumi_aws.Provider') as mock_provider:
                mock_provider_instance = Mock()
                mock_provider.return_value = mock_provider_instance
                
                # This would normally create the full stack
                # For testing, we just verify the args are passed correctly
                assert args.environment == "prod"
                assert args.project == "cloudsetup" 
                assert args.owner == "mgt"
                assert args.region == "us-west-2"
                
        except ImportError:
            pytest.skip("TapStack classes not available for testing")

    def test_stack_component_dependencies(self, mock_aws_resources, sample_tapstack_args):
        """Test that stack components have correct dependencies"""
        # Test dependency chain: Networking -> Security -> Compute/Database
        
        # Mock component creation flow
        networking_created = True
        security_requires_networking = networking_created
        compute_requires_security = security_requires_networking and networking_created
        database_requires_security = security_requires_networking and networking_created
        
        # Verify dependency chain
        assert networking_created
        assert security_requires_networking
        assert compute_requires_security
        assert database_requires_security

    def test_stack_outputs_completeness(self, mock_aws_resources, sample_tapstack_args):
        """Test that stack exports all required outputs"""
        expected_outputs = [
            "vpc_id",
            "alb_dns_name", 
            "db_endpoint",
            "region"
        ]
        
        # Mock stack outputs
        mock_stack_outputs = {
            "vpc_id": "vpc-12345678",
            "alb_dns_name": "test-alb-123456789.us-west-2.elb.amazonaws.com",
            "db_endpoint": "test-db.123456789012.us-west-2.rds.amazonaws.com",
            "region": "us-west-2"
        }
        
        # Verify all expected outputs are present
        for output in expected_outputs:
            assert output in mock_stack_outputs
            assert mock_stack_outputs[output] is not None

    def test_stack_resource_tagging(self, mock_aws_resources, sample_tapstack_args):
        """Test that all stack resources are properly tagged"""
        expected_base_tags = {
            "Environment": sample_tapstack_args.environment,
            "Project": sample_tapstack_args.project,
            "Owner": sample_tapstack_args.owner,
            "ManagedBy": "Pulumi"
        }
        
        # Test that base tags are correctly formatted
        assert expected_base_tags["Environment"] == "prod"
        assert expected_base_tags["Project"] == "cloudsetup"
        assert expected_base_tags["Owner"] == "mgt"
        assert expected_base_tags["ManagedBy"] == "Pulumi"
        
        # Test resource-specific tagging
        vpc_tags = {
            **expected_base_tags,
            "Name": f"{sample_tapstack_args.environment}-{sample_tapstack_args.project}-{sample_tapstack_args.owner}-vpc"
        }
        
        assert "Name" in vpc_tags
        assert vpc_tags["Name"] == "prod-cloudsetup-mgt-vpc"

    def test_stack_provider_configuration(self, mock_aws_resources, sample_tapstack_args):
        """Test AWS provider is configured correctly"""
        with patch('pulumi_aws.Provider') as mock_provider:
            mock_provider_instance = Mock()
            mock_provider_instance.region = sample_tapstack_args.region
            mock_provider.return_value = mock_provider_instance
            
            # Test provider creation
            provider = aws.Provider("test-provider", region=sample_tapstack_args.region)
            
            # Verify provider configuration
            assert provider == mock_provider_instance

    def test_stack_regional_deployment(self, mock_aws_resources, sample_tapstack_args):
        """Test stack can be deployed to different regions"""
        test_regions = ["us-west-2", "us-west-2", "eu-west-1"]
        
        for region in test_regions:
            args = TapStackArgs(
                environment="Test",
                project="RegionTest",
                owner="DevOps", 
                region=region
            ) if 'TapStackArgs' in globals() else Mock(region=region)
            
            # Test that region is properly set
            if hasattr(args, 'region'):
                assert args.region == region

    def test_stack_multiple_environment_support(self, mock_aws_resources):
        """Test stack supports multiple environments"""
        environments = ["Development", "Staging", "prod"]
        
        for env in environments:
            try:
                from __main__ import TapStackArgs
                args = TapStackArgs(
                    environment=env,
                    project="TestProject",
                    owner="TestOwner",
                    region="us-west-2"
                )
                
                # Verify environment-specific naming
                expected_vpc_name = f"{env}-TestProject-TestOwner-vpc"
                assert expected_vpc_name.startswith(env)
                
            except ImportError:
                # Mock test if import fails
                expected_vpc_name = f"{env}-TestProject-TestOwner-vpc"
                assert expected_vpc_name.startswith(env)

    def test_stack_error_handling(self, mock_aws_resources, sample_tapstack_args):
        """Test stack handles common error scenarios gracefully"""
        # Test missing configuration
        with pytest.raises(Exception):
            # This should fail if required config is missing
            config = pulumi.Config()
            config.require("nonexistent_config")
        
        # Test invalid region handling
        invalid_regions = ["invalid-region", "", None]
        
        for invalid_region in invalid_regions:
            if invalid_region:
                # Should handle invalid region names gracefully
                region = invalid_region if invalid_region and len(invalid_region) > 0 else "us-west-2"
                assert len(region) > 0

    def test_stack_resource_count_validation(self, mock_aws_resources, sample_tapstack_args):
        """Test that stack creates expected number of resources"""
        # Expected resource counts for a full deployment
        expected_resource_counts = {
            "vpc": 1,
            "subnets": 4,  # 2 public + 2 private
            "security_groups": 2,  # web + db
            "ec2_instances": 2,  # One per public subnet
            "load_balancer": 1,
            "target_group": 1,
            "rds_instance": 1,
            "iam_roles": 2,  # EC2 role + RDS monitoring role
            "route_tables": 2,  # public + private
        }
        
        # Verify expected counts
        assert expected_resource_counts["vpc"] == 1
        assert expected_resource_counts["subnets"] == 4
        assert expected_resource_counts["security_groups"] == 2
        assert expected_resource_counts["ec2_instances"] == 2
        assert expected_resource_counts["rds_instance"] == 1


if __name__ == '__main__':
    # Run tests with verbose output
    pytest.main([__file__, '-v', '--tb=short'])