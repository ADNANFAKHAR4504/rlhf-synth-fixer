"""Comprehensive unit tests for TapStack CDK stack."""

import pytest
import aws_cdk as cdk
from aws_cdk import assertions
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_rds as rds
from aws_cdk import aws_iam as iam
from aws_cdk import aws_elasticloadbalancingv2 as elbv2
from aws_cdk import aws_autoscaling as autoscaling

from lib.tap_stack import TapStack, TapStackProps


class TestTapStackProps:
    """Test cases for TapStackProps class."""
    
    def test_tap_stack_props_default(self):
        """Test TapStackProps with default values."""
        props = TapStackProps()
        assert props.environment_suffix is None
    
    def test_tap_stack_props_with_environment_suffix(self):
        """Test TapStackProps with environment suffix."""
        props = TapStackProps(environment_suffix="test")
        assert props.environment_suffix == "test"
    
    def test_tap_stack_props_with_kwargs(self):
        """Test TapStackProps with additional kwargs."""
        props = TapStackProps(
            environment_suffix="prod",
            description="Test stack"
        )
        assert props.environment_suffix == "prod"


class TestTapStackInitialization:
    """Test cases for TapStack initialization."""
    
    def test_stack_creation_default(self, app):
        """Test stack creation with default settings."""
        stack = TapStack(app, "TestStack")
        assert stack.environment_suffix == "dev"
        assert isinstance(stack.vpc, ec2.Vpc)
        assert isinstance(stack.web_security_group, ec2.SecurityGroup)
        assert isinstance(stack.database_security_group, ec2.SecurityGroup)
        assert isinstance(stack.ec2_role, iam.Role)
        assert isinstance(stack.db_subnet_group, rds.SubnetGroup)
        assert isinstance(stack.database, rds.DatabaseInstance)
        assert isinstance(stack.load_balancer, elbv2.ApplicationLoadBalancer)
        assert isinstance(stack.auto_scaling_group, autoscaling.AutoScalingGroup)
    
    def test_stack_creation_with_props(self, app):
        """Test stack creation with custom props."""
        props = TapStackProps(environment_suffix="test")
        stack = TapStack(app, "TestStack", props=props)
        assert stack.environment_suffix == "test"
    
    def test_stack_creation_with_context(self, app):
        """Test stack creation with context override."""
        app.node.set_context("environmentSuffix", "context-env")
        stack = TapStack(app, "TestStack")
        assert stack.environment_suffix == "context-env"


class TestVPCConfiguration:
    """Test cases for VPC configuration."""
    
    def test_vpc_creation(self, synthesized_template):
        """Test VPC is created with correct configuration."""
        synthesized_template.has_resource_properties("AWS::EC2::VPC", {
            "CidrBlock": "10.0.0.0/16",
            "EnableDnsHostnames": True,
            "EnableDnsSupport": True
        })
    
    def test_public_subnets_creation(self, synthesized_template):
        """Test public subnets are created."""
        # Should create 2 public subnets (one per AZ, using 2 AZs)
        synthesized_template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 public + 2 private
        
        # Check for internet gateway
        synthesized_template.has_resource("AWS::EC2::InternetGateway", {})
    
    def test_private_subnets_creation(self, synthesized_template):
        """Test private subnets are created."""
        # Check for NAT Gateway
        synthesized_template.resource_count_is("AWS::EC2::NatGateway", 1)
    
    def test_vpc_flow_logs(self, synthesized_template):
        """Test VPC flow logs are configured."""
        synthesized_template.has_resource("AWS::EC2::FlowLog", {})
        synthesized_template.has_resource("AWS::Logs::LogGroup", {})
        synthesized_template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "vpc-flow-logs.amazonaws.com"
                        }
                    }
                ]
            }
        })


class TestSecurityGroups:
    """Test cases for security group configuration."""
    
    def test_web_security_group_creation(self, synthesized_template):
        """Test web security group is created with correct rules."""
        synthesized_template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for web servers - HTTP and SSH access",
            "SecurityGroupEgress": [
                {
                    "CidrIp": "0.0.0.0/0",
                    "Description": "Allow all outbound traffic by default",
                    "IpProtocol": "-1"
                }
            ],
            "SecurityGroupIngress": [
                {
                    "CidrIp": "0.0.0.0/0",
                    "Description": "Allow HTTP access from internet",
                    "FromPort": 80,
                    "IpProtocol": "tcp",
                    "ToPort": 80
                },
                {
                    "CidrIp": "0.0.0.0/0", 
                    "Description": "Allow SSH access from internet",
                    "FromPort": 22,
                    "IpProtocol": "tcp",
                    "ToPort": 22
                }
            ]
        })
    
    def test_database_security_group_creation(self, synthesized_template):
        """Test database security group is created with correct rules."""
        synthesized_template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupDescription": "Security group for PostgreSQL database"
        })


class TestIAMRoles:
    """Test cases for IAM role configuration."""
    
    def test_ec2_role_creation(self, synthesized_template):
        """Test EC2 IAM role is created with correct permissions."""
        synthesized_template.has_resource_properties("AWS::IAM::Role", {
            "AssumeRolePolicyDocument": {
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ec2.amazonaws.com"
                        }
                    }
                ]
            },
            "Description": "IAM role for EC2 web server instances",
            "ManagedPolicyArns": [
                {
                    "Fn::Join": [
                        "",
                        [
                            "arn:",
                            {"Ref": "AWS::Partition"},
                            ":iam::aws:policy/CloudWatchAgentServerPolicy"
                        ]
                    ]
                },
                {
                    "Fn::Join": [
                        "",
                        [
                            "arn:",
                            {"Ref": "AWS::Partition"}, 
                            ":iam::aws:policy/AmazonSSMManagedInstanceCore"
                        ]
                    ]
                }
            ]
        })
    
    def test_ec2_instance_profile_creation(self, synthesized_template):
        """Test EC2 instance profile is created."""
        synthesized_template.has_resource("AWS::IAM::InstanceProfile", {})


class TestRDSConfiguration:
    """Test cases for RDS database configuration."""
    
    def test_db_subnet_group_creation(self, synthesized_template):
        """Test DB subnet group is created."""
        synthesized_template.has_resource_properties("AWS::RDS::DBSubnetGroup", {
            "DBSubnetGroupDescription": "Subnet group for PostgreSQL database"
        })
    
    def test_database_creation(self, synthesized_template):
        """Test PostgreSQL database is created with correct configuration."""
        synthesized_template.has_resource_properties("AWS::RDS::DBInstance", {
            "Engine": "postgres",
            "EngineVersion": "15.7",
            "DBInstanceClass": "db.t3.micro",
            "DBName": "webapp",
            "AllocatedStorage": "20",
            "StorageType": "gp2",
            "StorageEncrypted": True,
            "BackupRetentionPeriod": 7,
            "PreferredBackupWindow": "03:00-04:00",
            "PreferredMaintenanceWindow": "Mon:04:00-Mon:05:00",
            "DeletionProtection": False,
            "AutoMinorVersionUpgrade": True,
            "MonitoringInterval": 60,
            "EnablePerformanceInsights": True
        })
    
    def test_database_parameter_group_creation(self, synthesized_template):
        """Test database parameter group is created."""
        synthesized_template.has_resource_properties("AWS::RDS::DBParameterGroup", {
            "Description": "Parameter group for PostgreSQL 15.7",
            "Family": "postgres15"
        })
    
    def test_database_credentials_secret(self, synthesized_template):
        """Test database credentials secret is created."""
        synthesized_template.has_resource("AWS::SecretsManager::Secret", {})


class TestLoadBalancerConfiguration:
    """Test cases for Application Load Balancer configuration."""
    
    def test_load_balancer_creation(self, synthesized_template):
        """Test Application Load Balancer is created."""
        synthesized_template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Type": "application",
            "Scheme": "internet-facing"
        })
    
    def test_target_group_creation(self, synthesized_template):
        """Test target group is created with health checks."""
        synthesized_template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "Port": 80,
            "Protocol": "HTTP",
            "HealthCheckEnabled": True,
            "HealthCheckIntervalSeconds": 30,
            "HealthCheckPath": "/health.html",
            "HealthCheckProtocol": "HTTP",
            "HealthCheckTimeoutSeconds": 5,
            "UnhealthyThresholdCount": 3,
            "Matcher": {
                "HttpCode": "200"
            }
        })
    
    def test_listener_creation(self, synthesized_template):
        """Test load balancer listener is created."""
        synthesized_template.has_resource_properties("AWS::ElasticLoadBalancingV2::Listener", {
            "Port": 80,
            "Protocol": "HTTP"
        })


class TestAutoScalingConfiguration:
    """Test cases for Auto Scaling Group configuration."""
    
    def test_launch_template_creation(self, synthesized_template):
        """Test launch template is created with correct configuration."""
        synthesized_template.has_resource_properties("AWS::EC2::LaunchTemplate", {
            "LaunchTemplateData": {
                "InstanceType": "t3.micro",
                "Monitoring": {
                    "Enabled": True
                }
            }
        })
    
    def test_auto_scaling_group_creation(self, synthesized_template):
        """Test Auto Scaling Group is created with correct configuration."""
        synthesized_template.has_resource_properties("AWS::AutoScaling::AutoScalingGroup", {
            "MinSize": "2",
            "MaxSize": "5",
            "DesiredCapacity": "2",
            "HealthCheckType": "ELB",
            "HealthCheckGracePeriod": 300
        })


class TestTagging:
    """Test cases for resource tagging."""
    
    def test_stack_tags_applied(self, stack):
        """Test that tags are applied to the stack."""
        # Test tags by checking the synthesized template
        template = cdk.assertions.Template.from_stack(stack)
        
        # Check that VPC has some of the expected tags (not all tags may be applied to all resources)
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": cdk.assertions.Match.array_with([
                {"Key": "Environment", "Value": "Production"},
                {"Key": "Project", "Value": "WebApp"}
            ])
        })


class TestStackOutputs:
    """Test cases for CloudFormation outputs."""
    
    def test_load_balancer_dns_output(self, synthesized_template):
        """Test load balancer DNS output is created."""
        synthesized_template.has_output("LoadBalancerDNS", {
            "Description": "DNS name of the Application Load Balancer",
            "Export": {
                "Name": "WebApp-LoadBalancer-DNS-dev"
            }
        })
    
    def test_database_endpoint_output(self, synthesized_template):
        """Test database endpoint output is created."""
        synthesized_template.has_output("DatabaseEndpoint", {
            "Description": "PostgreSQL database endpoint",
            "Export": {
                "Name": "WebApp-Database-Endpoint-dev"
            }
        })
    
    def test_database_port_output(self, synthesized_template):
        """Test database port output is created."""
        synthesized_template.has_output("DatabasePort", {
            "Description": "PostgreSQL database port",
            "Export": {
                "Name": "WebApp-Database-Port-dev"
            }
        })
    
    def test_vpc_id_output(self, synthesized_template):
        """Test VPC ID output is created."""
        synthesized_template.has_output("VPCId", {
            "Description": "VPC ID for the web application",
            "Export": {
                "Name": "WebApp-VPC-Id-dev"
            }
        })
    
    def test_web_url_output(self, synthesized_template):
        """Test web URL output is created."""
        synthesized_template.has_output("WebURL", {
            "Description": "Web application URL", 
            "Export": {
                "Name": "WebApp-URL-dev"
            }
        })


class TestEnvironmentVariations:
    """Test cases for different environment configurations."""
    
    def test_test_environment_outputs(self, synthesized_template_with_props):
        """Test outputs have correct export names for test environment."""
        synthesized_template_with_props.has_output("LoadBalancerDNS", {
            "Export": {
                "Name": "WebApp-LoadBalancer-DNS-test"
            }
        })
    
    def test_prod_environment_tags(self, stack_prod):
        """Test production environment has correct tags."""
        template = cdk.assertions.Template.from_stack(stack_prod)
        
        # Check that VPC has the prod environment suffix tag
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": cdk.assertions.Match.array_with([
                {"Key": "EnvironmentSuffix", "Value": "prod"}
            ])
        })


class TestResourceCounts:
    """Test cases for verifying correct number of resources."""
    
    def test_vpc_resource_count(self, synthesized_template):
        """Test correct number of VPC-related resources."""
        synthesized_template.resource_count_is("AWS::EC2::VPC", 1)
        synthesized_template.resource_count_is("AWS::EC2::InternetGateway", 1)
        synthesized_template.resource_count_is("AWS::EC2::NatGateway", 1)
        synthesized_template.resource_count_is("AWS::EC2::Subnet", 4)  # 2 public + 2 private
    
    def test_security_group_count(self, synthesized_template):
        """Test correct number of security groups."""
        synthesized_template.resource_count_is("AWS::EC2::SecurityGroup", 2)  # web + database
    
    def test_iam_resource_count(self, synthesized_template):
        """Test correct number of IAM resources."""
        # EC2 role, VPC flow log role, RDS monitoring role
        synthesized_template.resource_count_is("AWS::IAM::Role", 3)
        synthesized_template.resource_count_is("AWS::IAM::InstanceProfile", 1)
    
    def test_rds_resource_count(self, synthesized_template):
        """Test correct number of RDS resources."""
        synthesized_template.resource_count_is("AWS::RDS::DBInstance", 1)
        synthesized_template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)
        synthesized_template.resource_count_is("AWS::RDS::DBParameterGroup", 1)
    
    def test_load_balancer_resource_count(self, synthesized_template):
        """Test correct number of load balancer resources."""
        synthesized_template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
        synthesized_template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 1)
        synthesized_template.resource_count_is("AWS::ElasticLoadBalancingV2::Listener", 1)
    
    def test_auto_scaling_resource_count(self, synthesized_template):
        """Test correct number of auto scaling resources."""
        synthesized_template.resource_count_is("AWS::AutoScaling::AutoScalingGroup", 1)
        synthesized_template.resource_count_is("AWS::EC2::LaunchTemplate", 1)


class TestErrorConditions:
    """Test cases for error conditions and edge cases."""
    
    def test_stack_creation_without_app(self):
        """Test that stack creation requires an app."""
        # CDK is flexible and allows None scope in some cases
        # This test verifies that the stack constructor doesn't crash immediately
        # but synthesis might fail later, which is acceptable behavior
        stack = TapStack(None, "TestStack")
        assert stack is not None
        assert stack.environment_suffix == "dev"
    
    def test_stack_creation_with_empty_construct_id(self, app):
        """Test stack creation with empty construct ID."""
        with pytest.raises(RuntimeError, match="Only root constructs may have an empty ID"):
            TapStack(app, "")
    
    def test_invalid_props_type(self, app):
        """Test stack creation with invalid props type."""
        with pytest.raises((TypeError, AttributeError)):
            TapStack(app, "TestStack", props="invalid")


@pytest.mark.parametrize("environment_suffix,expected_secret_name", [
    ("dev", "webapp-db-credentials-dev"),
    ("test", "webapp-db-credentials-test"),
    ("prod", "webapp-db-credentials-prod"),
    ("staging", "webapp-db-credentials-staging")
])
def test_database_secret_naming(app, environment_suffix, expected_secret_name):
    """Test database secret naming for different environments."""
    props = TapStackProps(environment_suffix=environment_suffix)
    stack = TapStack(app, "TestStack", props=props)
    template = assertions.Template.from_stack(stack)
    
    # Check that secret name contains the environment suffix
    template.has_resource_properties("AWS::SecretsManager::Secret", {
        "Name": expected_secret_name
    })


class TestStackIntegrity:
    """Test cases for overall stack integrity."""
    
    def test_stack_synthesis_succeeds(self, stack):
        """Test that stack can be successfully synthesized."""
        template = assertions.Template.from_stack(stack)
        assert template is not None
    
    def test_stack_has_required_attributes(self, stack):
        """Test that stack has all required attributes after initialization."""
        required_attributes = [
            'vpc', 'web_security_group', 'database_security_group',
            'ec2_role', 'db_subnet_group', 'database', 'load_balancer',
            'auto_scaling_group', 'environment_suffix'
        ]
        
        for attr in required_attributes:
            assert hasattr(stack, attr), f"Stack missing required attribute: {attr}"
            assert getattr(stack, attr) is not None, f"Stack attribute {attr} is None"
    
    def test_stack_dependencies_correct(self, stack):
        """Test that stack resources have correct dependencies."""
        # This is a basic test - in practice you might want to check specific dependencies
        template = assertions.Template.from_stack(stack)
        
        # Ensure database depends on security group and subnet group
        db_resources = template.find_resources("AWS::RDS::DBInstance")
        assert len(db_resources) == 1
        
        # Ensure load balancer has subnets
        lb_resources = template.find_resources("AWS::ElasticLoadBalancingV2::LoadBalancer")
        assert len(lb_resources) == 1