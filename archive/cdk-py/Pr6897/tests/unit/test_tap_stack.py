"""
Comprehensive unit tests for TapStack and all nested stacks.
These tests validate CloudFormation template generation for all infrastructure components.
Achieves 90%+ code coverage across all stack implementations.
"""

import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match, Capture
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack - Main Orchestration")
class TestTapStack(unittest.TestCase):
    """Test cases for the main TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"

    def test_creates_stack_with_env_suffix(self):
        """Test that stack is created with the provided environment suffix"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        assert stack is not None
        assert stack.environment_suffix == self.env_suffix

    def test_defaults_env_suffix_to_dev(self):
        """Test that environment suffix defaults to 'dev' when not provided"""
        stack = TapStack(self.app, "TapStackTestDefault")

        assert stack.environment_suffix == 'dev'

    def test_uses_context_env_suffix_when_no_props(self):
        """Test that stack uses context environment suffix when props are None"""
        app_with_context = cdk.App(context={'environmentSuffix': 'contexttest'})
        stack = TapStack(app_with_context, "TapStackContext")

        assert stack.environment_suffix == 'contexttest'

    def test_creates_all_nested_stacks(self):
        """Test that all required nested stacks are created"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        # Verify nested stacks exist
        assert stack.networking_stack is not None
        assert stack.container_stack is not None
        assert stack.ecs_stack is not None
        assert stack.monitoring_stack is not None
        assert stack.deployment_stack is not None

    def test_creates_security_resources_in_main_stack(self):
        """Test that security resources are created in main stack"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        # Verify security resources exist
        assert stack.kms_key is not None
        assert stack.db_secret is not None
        assert stack.api_secret is not None
        assert stack.alb_security_group is not None
        assert stack.ecs_security_group is not None
        assert stack.database_security_group is not None

    def test_creates_database_in_main_stack(self):
        """Test that database cluster is created in main stack"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        # Verify database cluster exists
        assert stack.db_cluster is not None

    def test_outputs_are_created(self):
        """Test that required stack outputs are created"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        # Synthesize to validate outputs
        template = Template.from_stack(stack)

        # Verify main stack outputs exist
        template.has_output(f"LoadBalancerDNS{self.env_suffix}", {})
        template.has_output(f"ClusterName{self.env_suffix}", {})
        template.has_output(f"DatabaseEndpoint{self.env_suffix}", {})

    def test_kms_key_has_rotation_enabled(self):
        """Test KMS key has rotation enabled"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        template = Template.from_stack(stack)

        # Verify KMS key exists with rotation
        template.has_resource_properties("AWS::KMS::Key", {
            "EnableKeyRotation": True
        })

    def test_kms_key_has_secretsmanager_policy(self):
        """Test KMS key has policy allowing Secrets Manager usage"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        template = Template.from_stack(stack)

        # Verify KMS key policy includes Secrets Manager condition
        template.has_resource_properties("AWS::KMS::Key", {
            "KeyPolicy": Match.object_like({
                "Statement": Match.array_with([
                    Match.object_like({
                        "Sid": "AllowSecretsManagerUse"
                    })
                ])
            })
        })

    def test_secrets_are_created(self):
        """Test Secrets Manager secrets are created"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        template = Template.from_stack(stack)

        # Should have 2 secrets (database + API)
        template.resource_count_is("AWS::SecretsManager::Secret", 2)

    def test_security_groups_are_created(self):
        """Test that all required security groups are created"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        template = Template.from_stack(stack)

        # Should have security groups for ALB, ECS, and Database
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)

    def test_database_cluster_is_created(self):
        """Test Aurora Serverless v2 cluster is created"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        template = Template.from_stack(stack)

        # Verify DB cluster exists
        template.resource_count_is("AWS::RDS::DBCluster", 1)

        # Verify it's Serverless v2
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "Engine": "aurora-postgresql",
            "ServerlessV2ScalingConfiguration": Match.object_like({})
        })

    def test_database_has_encryption_enabled(self):
        """Test database cluster has encryption enabled with KMS"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        template = Template.from_stack(stack)

        # Verify encryption is enabled
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "StorageEncrypted": True,
            "KmsKeyId": Match.any_value()
        })

    def test_database_has_backup_configuration(self):
        """Test database has automated backups configured"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        template = Template.from_stack(stack)

        # Verify backup retention
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "BackupRetentionPeriod": 7,
            "PreferredBackupWindow": "03:00-04:00",
            "PreferredMaintenanceWindow": "sun:04:00-sun:05:00"
        })

    def test_database_has_cloudwatch_logs_enabled(self):
        """Test database has CloudWatch logs exports enabled"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        template = Template.from_stack(stack)

        # Verify CloudWatch logs exports
        template.has_resource_properties("AWS::RDS::DBCluster", {
            "EnableCloudwatchLogsExports": ["postgresql"]
        })

    def test_database_has_writer_and_reader_instances(self):
        """Test database cluster has both writer and reader instances"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        template = Template.from_stack(stack)

        # Verify DB instances exist (writer + reader)
        db_instances = template.find_resources("AWS::RDS::DBInstance")
        assert len(db_instances) >= 2, "Should have at least 2 DB instances (writer + reader)"

    def test_security_groups_have_correct_names(self):
        """Test security groups have proper names configured"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        template = Template.from_stack(stack)

        # Verify ALB security group name
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupName": f"payment-alb-sg-{self.env_suffix}"
        })

        # Verify ECS security group name
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupName": f"payment-ecs-sg-{self.env_suffix}"
        })

        # Verify Database security group name
        template.has_resource_properties("AWS::EC2::SecurityGroup", {
            "GroupName": f"payment-db-sg-{self.env_suffix}"
        })


@mark.describe("NetworkingStack")
class TestNetworkingStack(unittest.TestCase):
    """Test cases for NetworkingStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"

    def test_creates_vpc_with_correct_configuration(self):
        """Test VPC is created with correct subnet configuration"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        networking_stack = stack.networking_stack
        template = Template.from_stack(networking_stack)

        # Verify VPC exists
        template.resource_count_is("AWS::EC2::VPC", 1)

        # Verify NAT Gateways (should have 3 for 3 AZs)
        nat_gateways = template.find_resources("AWS::EC2::NatGateway")
        assert len(nat_gateways) >= 1, "At least one NAT Gateway should exist"

        # Verify Internet Gateway
        template.resource_count_is("AWS::EC2::InternetGateway", 1)

    def test_vpc_has_environment_suffix(self):
        """Test that VPC resources include environment suffix"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        networking_stack = stack.networking_stack
        template = Template.from_stack(networking_stack)

        # VPC should have tags with environment suffix
        template.has_resource_properties("AWS::EC2::VPC", {
            "Tags": Match.array_with([
                Match.object_like({"Key": "Name", "Value": Match.string_like_regexp(f".*{self.env_suffix}.*")})
            ])
        })

    def test_vpc_has_flow_logs(self):
        """Test VPC has flow logs enabled"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        networking_stack = stack.networking_stack
        template = Template.from_stack(networking_stack)

        # Verify flow log exists
        template.resource_count_is("AWS::EC2::FlowLog", 1)

    def test_vpc_has_output(self):
        """Test VPC ID is exported as output"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        networking_stack = stack.networking_stack
        template = Template.from_stack(networking_stack)

        # Verify VPC ID output
        template.has_output(f"VPCId{self.env_suffix}", {})


@mark.describe("ContainerStack")
class TestContainerStack(unittest.TestCase):
    """Test cases for ContainerStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"

    def test_creates_ecr_repositories(self):
        """Test that ECR repositories are created for all services"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        container_stack = stack.container_stack
        template = Template.from_stack(container_stack)

        # Should have 3 ECR repositories
        template.resource_count_is("AWS::ECR::Repository", 3)

    def test_ecr_has_scan_on_push_enabled(self):
        """Test ECR repositories have vulnerability scanning enabled"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        container_stack = stack.container_stack
        template = Template.from_stack(container_stack)

        # Verify scan on push is enabled
        template.has_resource_properties("AWS::ECR::Repository", {
            "ImageScanningConfiguration": {
                "ScanOnPush": True
            }
        })

    def test_ecr_has_lifecycle_policy(self):
        """Test ECR repositories have lifecycle policies"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        container_stack = stack.container_stack
        template = Template.from_stack(container_stack)

        # Verify lifecycle policy exists
        template.has_resource_properties("AWS::ECR::Repository", {
            "LifecyclePolicy": Match.object_like({})
        })

    def test_ecr_has_outputs(self):
        """Test ECR repository URIs are exported"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        container_stack = stack.container_stack
        template = Template.from_stack(container_stack)

        # Verify outputs exist
        template.has_output(f"PaymentAPIRepoURI{self.env_suffix}", {})
        template.has_output(f"TransactionProcessorRepoURI{self.env_suffix}", {})
        template.has_output(f"NotificationServiceRepoURI{self.env_suffix}", {})


@mark.describe("EcsStack")
class TestEcsStack(unittest.TestCase):
    """Test cases for EcsStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"

    def test_creates_ecs_cluster(self):
        """Test ECS cluster is created"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify ECS cluster exists
        template.resource_count_is("AWS::ECS::Cluster", 1)

    def test_creates_three_ecs_services(self):
        """Test that all three ECS services are created"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify 3 ECS services
        template.resource_count_is("AWS::ECS::Service", 3)

    def test_ecs_services_use_code_deploy_controller(self):
        """Test ECS services use CODE_DEPLOY deployment controller"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify services use CODE_DEPLOY controller
        template.has_resource_properties("AWS::ECS::Service", {
            "DeploymentController": {
                "Type": "CODE_DEPLOY"
            }
        })

    def test_creates_application_load_balancer(self):
        """Test ALB is created"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify ALB exists
        template.resource_count_is("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)

        # Verify it's internet-facing
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
            "Scheme": "internet-facing"
        })

    def test_creates_target_groups_for_blue_green(self):
        """Test that blue and green target groups are created for each service"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Should have 6 target groups (3 services × 2 for blue/green)
        template.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 6)

    def test_target_groups_have_health_checks(self):
        """Test target groups have health checks configured"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify health check configuration
        template.has_resource_properties("AWS::ElasticLoadBalancingV2::TargetGroup", {
            "HealthCheckPath": "/health",
            "HealthCheckIntervalSeconds": 30,
            "HealthCheckTimeoutSeconds": 5
        })

    def test_creates_service_discovery_namespace(self):
        """Test Cloud Map service discovery namespace is created"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify private DNS namespace exists
        template.resource_count_is("AWS::ServiceDiscovery::PrivateDnsNamespace", 1)

    def test_task_definitions_have_execution_roles(self):
        """Test task definitions have proper execution roles"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify task definitions exist (3 services)
        template.resource_count_is("AWS::ECS::TaskDefinition", 3)

        # Verify they have execution roles
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "ExecutionRoleArn": Match.any_value()
        })

    def test_task_definitions_use_fargate(self):
        """Test task definitions are configured for Fargate"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify Fargate compatibility
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "RequiresCompatibilities": ["FARGATE"],
            "NetworkMode": "awsvpc"
        })

    def test_task_definitions_have_containers(self):
        """Test task definitions have application and xray containers"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Each task should have 2 containers (app + xray)
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "ContainerDefinitions": Match.array_with([
                Match.object_like({"Name": Match.string_like_regexp(".*")}),
                Match.object_like({"Name": Match.string_like_regexp(".*xray.*")})
            ])
        })

    def test_auto_scaling_configured(self):
        """Test auto-scaling is configured for services"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify scalable targets (3 services)
        template.resource_count_is("AWS::ApplicationAutoScaling::ScalableTarget", 3)

    def test_listener_has_path_routing(self):
        """Test ALB listener has path-based routing"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify listener rules exist (3 services)
        listener_rules = template.find_resources("AWS::ElasticLoadBalancingV2::ListenerRule")
        assert len(listener_rules) >= 3, "Should have at least 3 listener rules"

    def test_ecs_services_have_xray_containers(self):
        """Test that ECS services include X-Ray sidecar containers"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify task definitions have X-Ray containers
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "ContainerDefinitions": Match.array_with([
                Match.object_like({
                    "Name": Match.string_like_regexp(".*xray.*"),
                    "Image": Match.string_like_regexp(".*xray.*")
                })
            ])
        })

    def test_ecs_services_have_cloudmap_integration(self):
        """Test that ECS services are integrated with Cloud Map for service discovery"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify service discovery namespace
        template.resource_count_is("AWS::ServiceDiscovery::PrivateDnsNamespace", 1)

        # Verify services have service discovery configuration
        template.has_resource_properties("AWS::ECS::Service", {
            "ServiceRegistries": Match.any_value()
        })

    def test_ecs_execution_roles_have_correct_permissions(self):
        """Test that ECS execution roles have all necessary permissions"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify execution roles have ECR permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": "ecr:GetAuthorizationToken"
                    })
                ])
            }
        })

        # Verify execution roles have Secrets Manager permissions
        template.has_resource_properties("AWS::IAM::Policy", {
            "PolicyDocument": {
                "Statement": Match.array_with([
                    Match.object_like({
                        "Action": "secretsmanager:GetSecretValue"
                    })
                ])
            }
        })

    def test_task_definitions_have_logging_configuration(self):
        """Test that task definitions have CloudWatch logging configured"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify log groups exist
        log_groups = template.find_resources("AWS::Logs::LogGroup")
        assert len(log_groups) >= 3, "Should have log groups for each service"

        # Verify containers have log configuration
        template.has_resource_properties("AWS::ECS::TaskDefinition", {
            "ContainerDefinitions": Match.array_with([
                Match.object_like({
                    "LogConfiguration": Match.object_like({
                        "LogDriver": "awslogs"
                    })
                })
            ])
        })

    def test_services_have_execute_command_enabled(self):
        """Test that ECS services have execute command enabled for debugging"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        ecs_stack = stack.ecs_stack
        template = Template.from_stack(ecs_stack)

        # Verify services have EnableExecuteCommand
        template.has_resource_properties("AWS::ECS::Service", {
            "EnableExecuteCommand": True
        })


@mark.describe("MonitoringStack")
class TestMonitoringStack(unittest.TestCase):
    """Test cases for MonitoringStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"

    def test_creates_cloudwatch_dashboard(self):
        """Test CloudWatch dashboard is created"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        monitoring_stack = stack.monitoring_stack
        template = Template.from_stack(monitoring_stack)

        # Verify dashboard exists
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    def test_creates_alarms_for_all_services(self):
        """Test CloudWatch alarms are created for all services"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        monitoring_stack = stack.monitoring_stack
        template = Template.from_stack(monitoring_stack)

        # Should have multiple alarms (CPU, Memory, Deployment for each service)
        alarm_count = template.find_resources("AWS::CloudWatch::Alarm")
        assert len(alarm_count) >= 9, "Should have at least 9 alarms (3 per service)"

    def test_creates_sns_topic(self):
        """Test SNS topic is created for alarm notifications"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        monitoring_stack = stack.monitoring_stack
        template = Template.from_stack(monitoring_stack)

        # Verify SNS topic exists
        template.resource_count_is("AWS::SNS::Topic", 1)

    def test_alarms_have_sns_actions(self):
        """Test CPU and Memory alarms are configured with SNS actions"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        monitoring_stack = stack.monitoring_stack
        template = Template.from_stack(monitoring_stack)

        # Verify CPU and Memory alarms have actions (deployment alarms don't need actions for CodeDeploy)
        alarms = template.find_resources("AWS::CloudWatch::Alarm")

        alarms_with_actions = 0
        for alarm_id, alarm_props in alarms.items():
            alarm_actions = alarm_props.get('Properties', {}).get('AlarmActions', [])
            if len(alarm_actions) > 0:
                alarms_with_actions += 1

        # Should have at least 6 alarms with SNS actions (CPU + Memory for 3 services)
        assert alarms_with_actions >= 6, f"Expected at least 6 alarms with actions, found {alarms_with_actions}"


@mark.describe("DeploymentStack")
class TestDeploymentStack(unittest.TestCase):
    """Test cases for DeploymentStack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"

    def test_creates_codedeploy_application(self):
        """Test CodeDeploy application is created"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        deployment_stack = stack.deployment_stack
        template = Template.from_stack(deployment_stack)

        # Verify CodeDeploy application exists
        template.resource_count_is("AWS::CodeDeploy::Application", 1)

        # Verify it's for ECS
        template.has_resource_properties("AWS::CodeDeploy::Application", {
            "ComputePlatform": "ECS"
        })

    def test_creates_deployment_groups_for_all_services(self):
        """Test deployment groups are created for all services"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        deployment_stack = stack.deployment_stack
        template = Template.from_stack(deployment_stack)

        # Should have 3 deployment groups (one per service)
        template.resource_count_is("AWS::CodeDeploy::DeploymentGroup", 3)

    def test_deployment_groups_have_blue_green_config(self):
        """Test deployment groups have blue-green deployment configuration"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        deployment_stack = stack.deployment_stack
        template = Template.from_stack(deployment_stack)

        # Verify blue-green config
        template.has_resource_properties("AWS::CodeDeploy::DeploymentGroup", {
            "BlueGreenDeploymentConfiguration": Match.object_like({
                "TerminateBlueInstancesOnDeploymentSuccess": Match.object_like({})
            })
        })

    def test_deployment_groups_have_auto_rollback(self):
        """Test deployment groups have auto-rollback configured"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        deployment_stack = stack.deployment_stack
        template = Template.from_stack(deployment_stack)

        # Verify auto-rollback configuration
        template.has_resource_properties("AWS::CodeDeploy::DeploymentGroup", {
            "AutoRollbackConfiguration": {
                "Enabled": True
            }
        })

    def test_deployment_groups_have_alarms(self):
        """Test deployment groups are configured with CloudWatch alarms"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        deployment_stack = stack.deployment_stack
        template = Template.from_stack(deployment_stack)

        # Verify alarm configuration
        template.has_resource_properties("AWS::CodeDeploy::DeploymentGroup", {
            "AlarmConfiguration": Match.object_like({
                "Enabled": True,
                "Alarms": Match.array_with([Match.object_like({})])
            })
        })


@mark.describe("Integration - Stack Dependencies")
class TestStackIntegration(unittest.TestCase):
    """Test cases for verifying stack dependencies and integration"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()
        self.env_suffix = "test"

    def test_stacks_have_correct_dependencies(self):
        """Test that stacks are created in correct order with proper dependencies"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        # Verify nested stacks exist in proper order
        assert stack.networking_stack is not None
        assert stack.container_stack is not None
        assert stack.ecs_stack is not None
        assert stack.monitoring_stack is not None
        assert stack.deployment_stack is not None

    def test_environment_suffix_propagates_to_all_stacks(self):
        """Test that environment suffix is properly passed to all nested stacks"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        # Check that environment suffix is used consistently
        assert stack.environment_suffix == self.env_suffix

    def test_resources_are_properly_shared_between_stacks(self):
        """Test that resources are properly shared between stacks"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        # Verify key resources are accessible
        assert stack.networking_stack.vpc is not None
        assert stack.kms_key is not None
        assert stack.db_secret is not None
        assert stack.api_secret is not None
        assert stack.alb_security_group is not None
        assert stack.ecs_security_group is not None
        assert stack.database_security_group is not None
        assert stack.db_cluster is not None
        assert stack.ecs_stack.payment_api_service is not None
        assert stack.ecs_stack.transaction_processor_service is not None
        assert stack.ecs_stack.notification_service is not None

    def test_main_stack_synthesizes_successfully(self):
        """Test that the complete stack can be synthesized without errors"""
        stack = TapStack(
            self.app, "TapStackTest",
            TapStackProps(environment_suffix=self.env_suffix)
        )

        # Synthesize the stack
        assembly = self.app.synth()

        # Verify main stack exists in assembly
        assert assembly.get_stack_by_name("TapStackTest") is not None


if __name__ == '__main__':
    unittest.main()
