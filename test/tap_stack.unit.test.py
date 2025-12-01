"""Unit tests for TapStack CloudFormation template."""
import sys
import unittest
from pathlib import Path

# Add lib directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from lib.tap_stack import TapStack


class TestTapStackTemplate(unittest.TestCase):
    """Test CloudFormation template structure and resources."""

    @classmethod
    def setUpClass(cls):
        """Load CloudFormation template once for all tests."""
        cls.stack = TapStack()

    def test_template_loads_successfully(self):
        """Test template loads without errors."""
        self.assertIsNotNone(self.stack.get_template())

    def test_json_structure_valid(self):
        """Test template is valid JSON structure."""
        self.assertTrue(self.stack.validate_json_structure())

    def test_template_has_description(self):
        """Test template has a description."""
        self.assertTrue(self.stack.has_description())
        template = self.stack.get_template()
        self.assertIn("Description", template)
        self.assertGreater(len(template["Description"]), 0)

    def test_template_has_parameters(self):
        """Test template defines required parameters."""
        self.assertTrue(self.stack.has_parameters())
        params = self.stack.get_parameters()

        # Required parameter
        self.assertIn("environmentSuffix", params)
        self.assertEqual(params["environmentSuffix"]["Type"], "String")

        # Optional parameters with defaults
        self.assertIn("ContainerImage", params)
        self.assertEqual(params["ContainerImage"]["Default"], "nginx:latest")

        self.assertIn("ContainerPort", params)
        self.assertEqual(params["ContainerPort"]["Default"], 80)

    def test_template_has_outputs(self):
        """Test template defines all required outputs."""
        self.assertTrue(self.stack.has_outputs())
        outputs = self.stack.get_outputs()

        required_outputs = [
            "VPCId",
            "ECSClusterName",
            "ECSClusterArn",
            "BlueServiceName",
            "GreenServiceName",
            "BlueTargetGroupArn",
            "GreenTargetGroupArn",
            "ALBArn",
            "ALBDNSName",
            "LogGroupName",
            "SNSTopicArn",
            "ServiceDiscoveryNamespace"
        ]

        for output in required_outputs:
            self.assertIn(output, outputs, f"Missing output: {output}")

    def test_template_has_resources(self):
        """Test template has Resources section."""
        self.assertTrue(self.stack.has_resources())
        self.assertGreater(self.stack.count_resources(), 0)

    def test_vpc_configuration(self):
        """Test VPC resource configuration."""
        vpc = self.stack.get_resource("VPC")
        self.assertIsNotNone(vpc)
        self.assertEqual(vpc["Type"], "AWS::EC2::VPC")
        self.assertEqual(self.stack.get_vpc_cidr(), "10.0.0.0/16")

        props = self.stack.get_resource_properties("VPC")
        self.assertTrue(props["EnableDnsHostnames"])
        self.assertTrue(props["EnableDnsSupport"])

    def test_subnets_configuration(self):
        """Test subnet resources exist."""
        # Public subnets
        for i in range(1, 4):
            subnet_name = f"PublicSubnet{i}"
            subnet = self.stack.get_resource(subnet_name)
            self.assertIsNotNone(subnet)
            self.assertEqual(subnet["Type"], "AWS::EC2::Subnet")
            props = self.stack.get_resource_properties(subnet_name)
            self.assertTrue(props["MapPublicIpOnLaunch"])

        # Private subnets
        for i in range(1, 4):
            subnet_name = f"PrivateSubnet{i}"
            subnet = self.stack.get_resource(subnet_name)
            self.assertIsNotNone(subnet)
            self.assertEqual(subnet["Type"], "AWS::EC2::Subnet")
            props = self.stack.get_resource_properties(subnet_name)
            self.assertFalse(props.get("MapPublicIpOnLaunch", False))

    def test_internet_gateway_configuration(self):
        """Test Internet Gateway resource."""
        igw = self.stack.get_resource("InternetGateway")
        self.assertIsNotNone(igw)
        self.assertEqual(igw["Type"], "AWS::EC2::InternetGateway")

    def test_nat_gateway_configuration(self):
        """Test NAT Gateway resource."""
        nat = self.stack.get_resource("NATGateway")
        self.assertIsNotNone(nat)
        self.assertEqual(nat["Type"], "AWS::EC2::NatGateway")

        eip = self.stack.get_resource("NATGatewayEIP")
        self.assertIsNotNone(eip)
        self.assertEqual(eip["Type"], "AWS::EC2::EIP")
        props = self.stack.get_resource_properties("NATGatewayEIP")
        self.assertEqual(props["Domain"], "vpc")

    def test_ecs_cluster_configuration(self):
        """Test ECS Cluster resource."""
        cluster = self.stack.get_resource("ECSCluster")
        self.assertIsNotNone(cluster)
        self.assertEqual(cluster["Type"], "AWS::ECS::Cluster")

        settings = self.stack.get_ecs_cluster_settings()
        self.assertEqual(len(settings), 1)
        self.assertEqual(settings[0]["Name"], "containerInsights")
        self.assertEqual(settings[0]["Value"], "enabled")

    def test_ecs_task_definition_configuration(self):
        """Test ECS Task Definition resource."""
        task_def = self.stack.get_resource("ECSTaskDefinition")
        self.assertIsNotNone(task_def)
        self.assertEqual(task_def["Type"], "AWS::ECS::TaskDefinition")

        self.assertEqual(self.stack.get_task_definition_cpu(), "1024")
        self.assertEqual(self.stack.get_task_definition_memory(), "2048")

        props = self.stack.get_resource_properties("ECSTaskDefinition")
        self.assertEqual(props["NetworkMode"], "awsvpc")
        self.assertIn("FARGATE", props["RequiresCompatibilities"])

    def test_target_groups_configuration(self):
        """Test Target Group resources."""
        for tg_name in ["BlueTargetGroup", "GreenTargetGroup"]:
            tg = self.stack.get_resource(tg_name)
            self.assertIsNotNone(tg)
            self.assertEqual(tg["Type"], "AWS::ElasticLoadBalancingV2::TargetGroup")

            health_config = self.stack.get_target_group_health_check_config(tg_name)
            self.assertTrue(health_config["HealthCheckEnabled"])
            self.assertEqual(health_config["HealthCheckPath"], "/")
            self.assertEqual(health_config["HealthCheckIntervalSeconds"], 15)
            self.assertEqual(health_config["HealthCheckTimeoutSeconds"], 5)
            self.assertEqual(health_config["HealthyThresholdCount"], 2)
            self.assertEqual(health_config["UnhealthyThresholdCount"], 2)

            props = self.stack.get_resource_properties(tg_name)
            self.assertEqual(props["Protocol"], "HTTP")
            self.assertEqual(props["TargetType"], "ip")

            # Check deregistration delay is in TargetGroupAttributes
            attrs = props.get("TargetGroupAttributes", [])
            deregistration_attr = next(
                (attr for attr in attrs if attr["Key"] == "deregistration_delay.timeout_seconds"),
                None
            )
            self.assertIsNotNone(deregistration_attr)
            self.assertEqual(deregistration_attr["Value"], "30")

    def test_application_load_balancer_configuration(self):
        """Test Application Load Balancer resource."""
        alb = self.stack.get_resource("ApplicationLoadBalancer")
        self.assertIsNotNone(alb)
        self.assertEqual(alb["Type"], "AWS::ElasticLoadBalancingV2::LoadBalancer")

        props = self.stack.get_resource_properties("ApplicationLoadBalancer")
        self.assertEqual(props["Scheme"], "internet-facing")
        self.assertEqual(props["Type"], "application")
        self.assertEqual(props["IpAddressType"], "ipv4")

    def test_alb_listener_configuration(self):
        """Test ALB Listener resource."""
        listener_config = self.stack.get_alb_listener_config()
        self.assertIsNotNone(listener_config)
        self.assertEqual(listener_config["Protocol"], "HTTP")
        self.assertEqual(listener_config["Port"], 80)

        # Check weighted target groups (blue-green)
        default_actions = listener_config["DefaultActions"]
        self.assertEqual(len(default_actions), 1)
        action = default_actions[0]
        self.assertEqual(action["Type"], "forward")

        target_groups = action["ForwardConfig"]["TargetGroups"]
        self.assertEqual(len(target_groups), 2)

        # Both should have weight 50
        for tg in target_groups:
            self.assertEqual(tg["Weight"], 50)

    def test_ecs_services_configuration(self):
        """Test ECS Service resources."""
        for service_name in ["BlueECSService", "GreenECSService"]:
            service = self.stack.get_resource(service_name)
            self.assertIsNotNone(service)
            self.assertEqual(service["Type"], "AWS::ECS::Service")

            self.assertEqual(self.stack.get_service_desired_count(service_name), 3)

            props = self.stack.get_resource_properties(service_name)
            self.assertEqual(props["LaunchType"], "FARGATE")

            # Check network configuration
            network_config = props["NetworkConfiguration"]["AwsvpcConfiguration"]
            self.assertEqual(network_config["AssignPublicIp"], "DISABLED")

            # Check deployment configuration (circuit breaker)
            deployment_config = props["DeploymentConfiguration"]
            circuit_breaker = deployment_config["DeploymentCircuitBreaker"]
            self.assertTrue(circuit_breaker["Enable"])
            self.assertTrue(circuit_breaker["Rollback"])

    def test_autoscaling_targets_configuration(self):
        """Test Auto Scaling Target resources."""
        for target_name in ["BlueAutoScalingTarget", "GreenAutoScalingTarget"]:
            target = self.stack.get_resource(target_name)
            self.assertIsNotNone(target)
            self.assertEqual(target["Type"], "AWS::ApplicationAutoScaling::ScalableTarget")

            config = self.stack.get_autoscaling_target_config(target_name)
            self.assertEqual(config["MaxCapacity"], 10)
            self.assertEqual(config["MinCapacity"], 3)
            self.assertEqual(config["ServiceNamespace"], "ecs")
            self.assertEqual(config["ScalableDimension"], "ecs:service:DesiredCount")

    def test_autoscaling_policies_configuration(self):
        """Test Auto Scaling Policy resources."""
        # CPU policies
        for policy_name in ["BlueAutoScalingPolicyCPU", "GreenAutoScalingPolicyCPU"]:
            policy = self.stack.get_resource(policy_name)
            self.assertIsNotNone(policy)
            self.assertEqual(policy["Type"], "AWS::ApplicationAutoScaling::ScalingPolicy")

            props = self.stack.get_resource_properties(policy_name)
            self.assertEqual(props["PolicyType"], "TargetTrackingScaling")

            target_tracking = props["TargetTrackingScalingPolicyConfiguration"]
            self.assertEqual(target_tracking["TargetValue"], 70.0)
            self.assertIn("PredefinedMetricSpecification", target_tracking)

        # Memory policies
        for policy_name in ["BlueAutoScalingPolicyMemory", "GreenAutoScalingPolicyMemory"]:
            policy = self.stack.get_resource(policy_name)
            self.assertIsNotNone(policy)
            self.assertEqual(policy["Type"], "AWS::ApplicationAutoScaling::ScalingPolicy")

            props = self.stack.get_resource_properties(policy_name)
            self.assertEqual(props["PolicyType"], "TargetTrackingScaling")

            target_tracking = props["TargetTrackingScalingPolicyConfiguration"]
            self.assertEqual(target_tracking["TargetValue"], 80.0)

    def test_cloudwatch_log_group_configuration(self):
        """Test CloudWatch Log Group resource."""
        log_group = self.stack.get_resource("ECSLogGroup")
        self.assertIsNotNone(log_group)
        self.assertEqual(log_group["Type"], "AWS::Logs::LogGroup")

        props = self.stack.get_resource_properties("ECSLogGroup")
        self.assertEqual(props["RetentionInDays"], 30)

    def test_sns_topic_configuration(self):
        """Test SNS Topic resource."""
        sns = self.stack.get_resource("SNSTopic")
        self.assertIsNotNone(sns)
        self.assertEqual(sns["Type"], "AWS::SNS::Topic")

    def test_cloudwatch_alarms_configuration(self):
        """Test CloudWatch Alarm resources."""
        alarm_names = [
            "BlueUnhealthyTargetAlarm",
            "BlueUnhealthyTargetAlarm",
            "GreenUnhealthyTargetAlarm",
            "GreenUnhealthyTargetAlarm"
        ]

        for alarm_name in alarm_names:
            alarm = self.stack.get_resource(alarm_name)
            self.assertIsNotNone(alarm)
            self.assertEqual(alarm["Type"], "AWS::CloudWatch::Alarm")

            props = self.stack.get_resource_properties(alarm_name)
            self.assertEqual(props["Namespace"], "AWS/ApplicationELB")
            self.assertEqual(props["Statistic"], "Average")
            self.assertEqual(props["Period"], 60)
            self.assertEqual(props["EvaluationPeriods"], 2)
            self.assertEqual(props["ComparisonOperator"], "GreaterThanOrEqualToThreshold")

    def test_service_discovery_configuration(self):
        """Test Service Discovery resources."""
        namespace = self.stack.get_resource("ServiceDiscoveryNamespace")
        self.assertIsNotNone(namespace)
        self.assertEqual(namespace["Type"], "AWS::ServiceDiscovery::PrivateDnsNamespace")

        blue_service_discovery = self.stack.get_resource("BlueServiceDiscovery")
        self.assertIsNotNone(blue_service_discovery)

        green_service_discovery = self.stack.get_resource("GreenServiceDiscovery")
        self.assertIsNotNone(green_service_discovery)

    def test_iam_roles_configuration(self):
        """Test IAM Role resources."""
        exec_role = self.stack.get_resource("ECSTaskExecutionRole")
        self.assertIsNotNone(exec_role)
        self.assertEqual(exec_role["Type"], "AWS::IAM::Role")

        props = self.stack.get_resource_properties("ECSTaskExecutionRole")
        assume_policy = props["AssumeRolePolicyDocument"]
        self.assertEqual(assume_policy["Statement"][0]["Principal"]["Service"], "ecs-tasks.amazonaws.com")

    def test_security_groups_configuration(self):
        """Test Security Group resources."""
        alb_sg = self.stack.get_resource("ALBSecurityGroup")
        self.assertIsNotNone(alb_sg)
        self.assertEqual(alb_sg["Type"], "AWS::EC2::SecurityGroup")

        ecs_sg = self.stack.get_resource("ECSTaskSecurityGroup")
        self.assertIsNotNone(ecs_sg)
        self.assertEqual(ecs_sg["Type"], "AWS::EC2::SecurityGroup")

    def test_environment_suffix_usage(self):
        """Test environmentSuffix is used in resource names."""
        self.assertTrue(self.stack.uses_environment_suffix())
        suffix_count = self.stack.count_environment_suffix_usage()
        self.assertGreater(suffix_count, 30, "environmentSuffix should be used extensively")

    def test_no_deletion_policy_retain(self):
        """Test resources don't have DeletionPolicy: Retain."""
        self.assertFalse(self.stack.has_deletion_policy_retain())

    def test_no_deletion_protection(self):
        """Test resources don't have DeletionProtection enabled."""
        self.assertFalse(self.stack.has_deletion_protection())

    def test_resource_count(self):
        """Test template has expected number of resources."""
        resource_count = self.stack.count_resources()
        self.assertGreaterEqual(resource_count, 50, f"Expected 50+ resources, found {resource_count}")

    def test_capacity_providers_configuration(self):
        """Test ECS Cluster Capacity Providers."""
        cluster = self.stack.get_resource("ECSCluster")
        props = self.stack.get_resource_properties("ECSCluster")

        capacity_providers = props["CapacityProviders"]
        self.assertIn("FARGATE", capacity_providers)
        self.assertIn("FARGATE_SPOT", capacity_providers)

    def test_list_resource_names(self):
        """Test listing all resource names."""
        resource_names = self.stack.list_resource_names()
        self.assertIsInstance(resource_names, list)
        self.assertGreater(len(resource_names), 0)

    def test_list_resource_types(self):
        """Test listing all resource types."""
        resource_types = self.stack.list_resource_types()
        self.assertIsInstance(resource_types, list)
        self.assertGreater(len(resource_types), 0)

    def test_find_ec2_resources(self):
        """Test finding resources by type."""
        ec2_resources = self.stack.find_resources_by_type("AWS::EC2::VPC")
        self.assertEqual(len(ec2_resources), 1)

    def test_count_ecs_services(self):
        """Test counting ECS services."""
        ecs_service_count = self.stack.count_resources_by_type("AWS::ECS::Service")
        self.assertEqual(ecs_service_count, 2)  # Blue and Green services

    def test_count_target_groups(self):
        """Test counting Target Groups."""
        tg_count = self.stack.count_resources_by_type("AWS::ElasticLoadBalancingV2::TargetGroup")
        self.assertEqual(tg_count, 2)  # Blue and Green target groups

    def test_count_autoscaling_policies(self):
        """Test counting Auto Scaling policies."""
        policy_count = self.stack.count_resources_by_type("AWS::ApplicationAutoScaling::ScalingPolicy")
        self.assertEqual(policy_count, 4)  # 2 services x 2 policies each (CPU + Memory)

    def test_get_template_method(self):
        """Test get_template returns dict."""
        template = self.stack.get_template()
        self.assertIsInstance(template, dict)
        self.assertIn("Resources", template)

    def test_get_resource_method_nonexistent(self):
        """Test get_resource returns None for nonexistent resource."""
        resource = self.stack.get_resource("NonExistentResource")
        self.assertIsNone(resource)

    def test_get_resource_type_method(self):
        """Test get_resource_type returns correct type."""
        resource_type = self.stack.get_resource_type("VPC")
        self.assertEqual(resource_type, "AWS::EC2::VPC")

    def test_get_resource_type_nonexistent(self):
        """Test get_resource_type returns None for nonexistent resource."""
        resource_type = self.stack.get_resource_type("NonExistentResource")
        self.assertIsNone(resource_type)

    def test_get_resource_properties_method(self):
        """Test get_resource_properties returns dict."""
        props = self.stack.get_resource_properties("VPC")
        self.assertIsInstance(props, dict)
        self.assertIn("CidrBlock", props)

    def test_get_resource_properties_nonexistent(self):
        """Test get_resource_properties returns empty dict for nonexistent resource."""
        props = self.stack.get_resource_properties("NonExistentResource")
        self.assertEqual(props, {})

    def test_get_service_desired_count_nonexistent(self):
        """Test get_service_desired_count returns None for nonexistent service."""
        count = self.stack.get_service_desired_count("NonExistentService")
        self.assertIsNone(count)

    def test_get_target_group_health_check_config_nonexistent(self):
        """Test get_target_group_health_check_config returns None for nonexistent TG."""
        config = self.stack.get_target_group_health_check_config("NonExistentTG")
        self.assertIsNone(config)

    def test_get_autoscaling_target_config_nonexistent(self):
        """Test get_autoscaling_target_config returns None for nonexistent target."""
        config = self.stack.get_autoscaling_target_config("NonExistentTarget")
        self.assertIsNone(config)

    def test_get_alb_listener_config_method(self):
        """Test get_alb_listener_config returns config."""
        config = self.stack.get_alb_listener_config()
        self.assertIsNotNone(config)
        self.assertIn("Protocol", config)
        self.assertIn("Port", config)


    def test_vpc_cidr_coverage(self):
        """Test get_vpc_cidr returns value."""
        cidr = self.stack.get_vpc_cidr()
        self.assertEqual(cidr, "10.0.0.0/16")

    def test_ecs_cluster_settings_coverage(self):
        """Test get_ecs_cluster_settings returns list."""
        settings = self.stack.get_ecs_cluster_settings()
        self.assertIsInstance(settings, list)
        self.assertGreater(len(settings), 0)

    def test_task_definition_cpu_coverage(self):
        """Test get_task_definition_cpu returns value."""
        cpu = self.stack.get_task_definition_cpu()
        self.assertEqual(cpu, "1024")

    def test_task_definition_memory_coverage(self):
        """Test get_task_definition_memory returns value."""
        memory = self.stack.get_task_definition_memory()
        self.assertEqual(memory, "2048")

    def test_service_desired_count_coverage(self):
        """Test get_service_desired_count returns value."""
        count = self.stack.get_service_desired_count("BlueECSService")
        self.assertEqual(count, 3)

    def test_deletion_policy_retain_coverage(self):
        """Test has_deletion_policy_retain returns False."""
        has_retain = self.stack.has_deletion_policy_retain()
        self.assertFalse(has_retain)



    def test_edge_case_missing_resources(self):
        """Test edge case where VPC, cluster, task def, listener don't exist."""
        # Temporarily clear resources to test None returns
        original_resources = self.stack.template["Resources"]
        
        # Test with empty resources
        self.stack.template["Resources"] = {}
        
        self.assertIsNone(self.stack.get_vpc_cidr())
        self.assertEqual(self.stack.get_ecs_cluster_settings(), [])
        self.assertIsNone(self.stack.get_task_definition_cpu())
        self.assertIsNone(self.stack.get_task_definition_memory())
        self.assertIsNone(self.stack.get_service_desired_count("AnyService"))
        self.assertIsNone(self.stack.get_alb_listener_config())
        
        # Restore original resources
        self.stack.template["Resources"] = original_resources



    def test_deletion_policy_retain_true_case(self):
        """Test has_deletion_policy_retain detects Retain policy."""
        # Temporarily add a resource with Retain policy
        original_resources = dict(self.stack.template["Resources"])
        
        # Add a fake resource with Retain policy
        self.stack.template["Resources"]["FakeResource"] = {
            "Type": "AWS::S3::Bucket",
            "DeletionPolicy": "Retain"
        }
        
        self.assertTrue(self.stack.has_deletion_policy_retain())
        
        # Restore original resources
        self.stack.template["Resources"] = original_resources



if __name__ == "__main__":
    unittest.main()

    def test_get_template_method(self):
        """Test get_template returns dict."""
        template = self.stack.get_template()
        self.assertIsInstance(template, dict)
        self.assertIn("Resources", template)

    def test_get_outputs_method(self):
        """Test get_outputs returns dict."""
        outputs = self.stack.get_outputs()
        self.assertIsInstance(outputs, dict)

    def test_get_resource_method_nonexistent(self):
        """Test get_resource returns None for nonexistent resource."""
        resource = self.stack.get_resource("NonExistentResource")
        self.assertIsNone(resource)

    def test_get_resource_type_method(self):
        """Test get_resource_type returns correct type."""
        resource_type = self.stack.get_resource_type("VPC")
        self.assertEqual(resource_type, "AWS::EC2::VPC")

    def test_get_resource_type_nonexistent(self):
        """Test get_resource_type returns None for nonexistent resource."""
        resource_type = self.stack.get_resource_type("NonExistentResource")
        self.assertIsNone(resource_type)

    def test_get_resource_properties_method(self):
        """Test get_resource_properties returns dict."""
        props = self.stack.get_resource_properties("VPC")
        self.assertIsInstance(props, dict)
        self.assertIn("CidrBlock", props)

    def test_get_resource_properties_nonexistent(self):
        """Test get_resource_properties returns empty dict for nonexistent resource."""
        props = self.stack.get_resource_properties("NonExistentResource")
        self.assertEqual(props, {})

    def test_get_service_desired_count_nonexistent(self):
        """Test get_service_desired_count returns None for nonexistent service."""
        count = self.stack.get_service_desired_count("NonExistentService")
        self.assertIsNone(count)

    def test_get_target_group_health_check_config_nonexistent(self):
        """Test get_target_group_health_check_config returns None for nonexistent TG."""
        config = self.stack.get_target_group_health_check_config("NonExistentTG")
        self.assertIsNone(config)

    def test_get_autoscaling_target_config_nonexistent(self):
        """Test get_autoscaling_target_config returns None for nonexistent target."""
        config = self.stack.get_autoscaling_target_config("NonExistentTarget")
        self.assertIsNone(config)

    def test_get_alb_listener_config_method(self):
        """Test get_alb_listener_config returns config."""
        config = self.stack.get_alb_listener_config()
        self.assertIsNotNone(config)
        self.assertIn("Protocol", config)
        self.assertIn("Port", config)

