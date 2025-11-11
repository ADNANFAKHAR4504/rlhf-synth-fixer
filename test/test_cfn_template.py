"""
Unit tests for CloudFormation template validation
Tests template structure, parameters, resources, and outputs
"""

import json
import os
import unittest
from pathlib import Path


class TestCloudFormationTemplate(unittest.TestCase):
    """Test suite for CloudFormation template validation"""

    @classmethod
    def setUpClass(cls):
        """Load the CloudFormation template once for all tests"""
        template_path = Path(__file__).parent.parent / "lib" / "TapStack.json"
        with open(template_path, 'r') as f:
            cls.template = json.load(f)

    def test_template_format_version(self):
        """Test that template has correct format version"""
        self.assertEqual(
            self.template.get("AWSTemplateFormatVersion"),
            "2010-09-09",
            "Template should have AWSTemplateFormatVersion 2010-09-09"
        )

    def test_template_has_description(self):
        """Test that template has a description"""
        self.assertIn("Description", self.template)
        self.assertIn("Three-Tier", self.template["Description"])

    def test_parameters_exist(self):
        """Test that required parameters are defined"""
        required_params = [
            "EnvironmentSuffix",
            "DBUsername",
            "DBPassword",
            "DBAllocatedStorage",
            "DBInstanceClass",
            "InstanceType",
            "KeyName",
            "LatestAmiId"
        ]

        self.assertIn("Parameters", self.template)
        for param in required_params:
            self.assertIn(
                param,
                self.template["Parameters"],
                f"Parameter {param} should be defined"
            )

    def test_environment_suffix_parameter(self):
        """Test EnvironmentSuffix parameter configuration"""
        env_suffix = self.template["Parameters"]["EnvironmentSuffix"]
        self.assertEqual(env_suffix["Type"], "String")
        self.assertEqual(env_suffix["Default"], "migration")
        self.assertIn("AllowedPattern", env_suffix)

    def test_db_password_no_echo(self):
        """Test that DBPassword has NoEcho enabled"""
        db_password = self.template["Parameters"]["DBPassword"]
        self.assertTrue(
            db_password.get("NoEcho", False),
            "DBPassword should have NoEcho enabled"
        )

    def test_vpc_resource_exists(self):
        """Test that VPC resource is defined"""
        self.assertIn("Resources", self.template)
        self.assertIn("VPC", self.template["Resources"])

        vpc = self.template["Resources"]["VPC"]
        self.assertEqual(vpc["Type"], "AWS::EC2::VPC")
        self.assertEqual(
            vpc["Properties"]["CidrBlock"],
            "10.0.0.0/16"
        )

    def test_subnet_count(self):
        """Test that correct number of subnets are created"""
        resources = self.template["Resources"]

        # Should have 2 public, 2 private, 2 DB subnets
        subnet_resources = [
            "PublicSubnet1", "PublicSubnet2",
            "PrivateSubnet1", "PrivateSubnet2",
            "DBSubnet1", "DBSubnet2"
        ]

        for subnet in subnet_resources:
            self.assertIn(subnet, resources)
            self.assertEqual(
                resources[subnet]["Type"],
                "AWS::EC2::Subnet"
            )

    def test_nat_gateway_configuration(self):
        """Test that NAT Gateways are properly configured"""
        resources = self.template["Resources"]

        # Should have 2 NAT Gateways for high availability
        self.assertIn("NatGateway1", resources)
        self.assertIn("NatGateway2", resources)

        # Each NAT Gateway should have an EIP
        self.assertIn("NatGateway1EIP", resources)
        self.assertIn("NatGateway2EIP", resources)

    def test_internet_gateway_exists(self):
        """Test that Internet Gateway is defined and attached"""
        resources = self.template["Resources"]

        self.assertIn("InternetGateway", resources)
        self.assertIn("AttachGateway", resources)

        igw = resources["InternetGateway"]
        self.assertEqual(igw["Type"], "AWS::EC2::InternetGateway")

    def test_security_groups(self):
        """Test that all required security groups are defined"""
        resources = self.template["Resources"]

        security_groups = [
            "ALBSecurityGroup",
            "AppSecurityGroup",
            "DBSecurityGroup"
        ]

        for sg in security_groups:
            self.assertIn(sg, resources)
            self.assertEqual(
                resources[sg]["Type"],
                "AWS::EC2::SecurityGroup"
            )

    def test_alb_security_group_rules(self):
        """Test ALB security group has HTTP and HTTPS rules"""
        alb_sg = self.template["Resources"]["ALBSecurityGroup"]
        ingress = alb_sg["Properties"]["SecurityGroupIngress"]

        ports = [rule["FromPort"] for rule in ingress]
        self.assertIn(80, ports, "ALB should allow HTTP")
        self.assertIn(443, ports, "ALB should allow HTTPS")

    def test_app_security_group_rules(self):
        """Test App security group has correct ingress rules"""
        app_sg = self.template["Resources"]["AppSecurityGroup"]
        ingress = app_sg["Properties"]["SecurityGroupIngress"]

        # Should have port 8080 from ALB and port 22 from VPC
        ports = [rule["FromPort"] for rule in ingress]
        self.assertIn(8080, ports, "App should accept traffic on 8080")
        self.assertIn(22, ports, "App should accept SSH on 22")

    def test_db_security_group_rules(self):
        """Test DB security group only allows PostgreSQL from app"""
        db_sg = self.template["Resources"]["DBSecurityGroup"]
        ingress = db_sg["Properties"]["SecurityGroupIngress"]

        self.assertEqual(len(ingress), 1, "DB should have only one ingress rule")
        self.assertEqual(ingress[0]["FromPort"], 5432)
        self.assertEqual(ingress[0]["ToPort"], 5432)

    def test_alb_configuration(self):
        """Test Application Load Balancer configuration"""
        resources = self.template["Resources"]

        self.assertIn("ApplicationLoadBalancer", resources)
        alb = resources["ApplicationLoadBalancer"]

        self.assertEqual(alb["Type"], "AWS::ElasticLoadBalancingV2::LoadBalancer")
        self.assertEqual(alb["Properties"]["Type"], "application")
        self.assertEqual(alb["Properties"]["Scheme"], "internet-facing")

    def test_target_groups(self):
        """Test that blue and green target groups exist"""
        resources = self.template["Resources"]

        self.assertIn("BlueTargetGroup", resources)
        self.assertIn("GreenTargetGroup", resources)

        blue_tg = resources["BlueTargetGroup"]
        green_tg = resources["GreenTargetGroup"]

        # Both should be HTTP on port 8080
        self.assertEqual(blue_tg["Properties"]["Port"], 8080)
        self.assertEqual(green_tg["Properties"]["Port"], 8080)
        self.assertEqual(blue_tg["Properties"]["Protocol"], "HTTP")
        self.assertEqual(green_tg["Properties"]["Protocol"], "HTTP")

    def test_target_group_health_checks(self):
        """Test that target groups have health checks configured"""
        blue_tg = self.template["Resources"]["BlueTargetGroup"]["Properties"]

        self.assertTrue(blue_tg.get("HealthCheckEnabled", False))
        self.assertEqual(blue_tg["HealthCheckPath"], "/health")
        self.assertEqual(blue_tg["HealthCheckProtocol"], "HTTP")

    def test_launch_template_exists(self):
        """Test that launch template is defined"""
        resources = self.template["Resources"]

        self.assertIn("LaunchTemplate", resources)
        lt = resources["LaunchTemplate"]

        self.assertEqual(lt["Type"], "AWS::EC2::LaunchTemplate")
        self.assertIn("LaunchTemplateData", lt["Properties"])

    def test_launch_template_user_data(self):
        """Test that launch template has user data script"""
        lt = self.template["Resources"]["LaunchTemplate"]
        lt_data = lt["Properties"]["LaunchTemplateData"]

        self.assertIn("UserData", lt_data)
        # UserData should be base64 encoded
        self.assertIn("Fn::Base64", lt_data["UserData"])

    def test_auto_scaling_group(self):
        """Test Auto Scaling Group configuration"""
        resources = self.template["Resources"]

        self.assertIn("AutoScalingGroup", resources)
        asg = resources["AutoScalingGroup"]

        self.assertEqual(asg["Type"], "AWS::AutoScaling::AutoScalingGroup")
        self.assertEqual(asg["Properties"]["MinSize"], "2")
        self.assertEqual(asg["Properties"]["MaxSize"], "6")
        self.assertEqual(asg["Properties"]["DesiredCapacity"], "2")

    def test_asg_health_check_configuration(self):
        """Test ASG has ELB health checks enabled"""
        asg = self.template["Resources"]["AutoScalingGroup"]

        self.assertEqual(asg["Properties"]["HealthCheckType"], "ELB")
        self.assertEqual(asg["Properties"]["HealthCheckGracePeriod"], 300)

    def test_iam_roles_exist(self):
        """Test that required IAM roles are defined"""
        resources = self.template["Resources"]

        self.assertIn("EC2Role", resources)
        self.assertIn("EC2InstanceProfile", resources)
        self.assertIn("LambdaExecutionRole", resources)

    def test_ec2_role_has_secrets_manager_policy(self):
        """Test EC2 role has Secrets Manager access"""
        ec2_role = self.template["Resources"]["EC2Role"]

        self.assertIn("Policies", ec2_role["Properties"])
        policies = ec2_role["Properties"]["Policies"]

        policy_names = [p["PolicyName"] for p in policies]
        self.assertIn("SecretsManagerAccess", policy_names)

    def test_secrets_manager_secret_exists(self):
        """Test that Secrets Manager secret is defined"""
        resources = self.template["Resources"]

        self.assertIn("DBSecret", resources)
        secret = resources["DBSecret"]

        self.assertEqual(secret["Type"], "AWS::SecretsManager::Secret")
        self.assertIn("SecretString", secret["Properties"])

    def test_secret_rotation_configured(self):
        """Test that secret rotation is configured"""
        resources = self.template["Resources"]

        # Should have rotation function, schedule, and permission
        self.assertIn("SecretRotationFunction", resources)
        self.assertIn("SecretRotationSchedule", resources)
        self.assertIn("LambdaInvokePermission", resources)

        rotation_schedule = resources["SecretRotationSchedule"]
        self.assertIn("RotationRules", rotation_schedule["Properties"])

    def test_rds_instance_configuration(self):
        """Test RDS instance configuration"""
        resources = self.template["Resources"]

        self.assertIn("RDSInstance", resources)
        rds = resources["RDSInstance"]

        self.assertEqual(rds["Type"], "AWS::RDS::DBInstance")
        props = rds["Properties"]

        # Verify critical settings
        self.assertEqual(props["Engine"], "postgres")
        self.assertTrue(props.get("MultiAZ", False), "RDS should be Multi-AZ")
        self.assertTrue(props.get("StorageEncrypted", False), "RDS should be encrypted")
        self.assertEqual(props["BackupRetentionPeriod"], 7)

    def test_rds_cloudwatch_logs_enabled(self):
        """Test that RDS exports logs to CloudWatch"""
        rds = self.template["Resources"]["RDSInstance"]

        self.assertIn("EnableCloudwatchLogsExports", rds["Properties"])
        logs = rds["Properties"]["EnableCloudwatchLogsExports"]
        self.assertIn("postgresql", logs)

    def test_rds_deletion_policy(self):
        """Test RDS has Delete policy for testing environments"""
        rds = self.template["Resources"]["RDSInstance"]

        self.assertEqual(rds.get("DeletionPolicy"), "Delete")

    def test_db_subnet_group_exists(self):
        """Test that DB subnet group is defined"""
        resources = self.template["Resources"]

        self.assertIn("DBSubnetGroup", resources)
        db_subnet_group = resources["DBSubnetGroup"]

        self.assertEqual(db_subnet_group["Type"], "AWS::RDS::DBSubnetGroup")
        self.assertIn("SubnetIds", db_subnet_group["Properties"])

    def test_outputs_exist(self):
        """Test that all required outputs are defined"""
        required_outputs = [
            "VPCId",
            "ALBDNSName",
            "RDSEndpoint",
            "RDSPort",
            "DBSecretArn",
            "BlueTargetGroupArn",
            "GreenTargetGroupArn",
            "AutoScalingGroupName"
        ]

        self.assertIn("Outputs", self.template)
        for output in required_outputs:
            self.assertIn(
                output,
                self.template["Outputs"],
                f"Output {output} should be defined"
            )

    def test_outputs_have_exports(self):
        """Test that outputs have export names for cross-stack references"""
        outputs = self.template["Outputs"]

        for output_name, output_config in outputs.items():
            self.assertIn(
                "Export",
                output_config,
                f"Output {output_name} should have Export defined"
            )

    def test_resource_naming_uses_environment_suffix(self):
        """Test that resources use EnvironmentSuffix in names"""
        resources = self.template["Resources"]

        # Sample resources that should use EnvironmentSuffix
        named_resources = [
            "VPC",
            "InternetGateway",
            "PublicSubnet1",
            "ApplicationLoadBalancer",
            "RDSInstance",
            "DBSecret"
        ]

        for resource_name in named_resources:
            resource = resources[resource_name]
            if "Properties" in resource and "Tags" in resource["Properties"]:
                tags = resource["Properties"]["Tags"]
                name_tag = next((t for t in tags if t["Key"] == "Name"), None)
                if name_tag:
                    # Name should use Fn::Sub with EnvironmentSuffix
                    self.assertIsInstance(name_tag["Value"], dict)
                    self.assertIn("Fn::Sub", name_tag["Value"])

    def test_consistent_tagging(self):
        """Test that resources have consistent tagging"""
        resources = self.template["Resources"]

        # Check a sample of resources for Environment tag
        taggable_resources = [
            "VPC",
            "PublicSubnet1",
            "ApplicationLoadBalancer",
            "ALBSecurityGroup",
            "RDSInstance"
        ]

        for resource_name in taggable_resources:
            resource = resources[resource_name]
            if "Properties" in resource and "Tags" in resource["Properties"]:
                tags = resource["Properties"]["Tags"]
                tag_keys = [t["Key"] for t in tags]
                self.assertIn(
                    "Environment",
                    tag_keys,
                    f"{resource_name} should have Environment tag"
                )

    def test_vpc_has_migration_phase_tag(self):
        """Test that VPC has MigrationPhase tag"""
        vpc = self.template["Resources"]["VPC"]
        tags = vpc["Properties"]["Tags"]

        tag_keys = [t["Key"] for t in tags]
        self.assertIn("MigrationPhase", tag_keys)

    def test_route_tables_configuration(self):
        """Test that route tables are properly configured"""
        resources = self.template["Resources"]

        # Should have public and private route tables
        self.assertIn("PublicRouteTable", resources)
        self.assertIn("PrivateRouteTable1", resources)
        self.assertIn("PrivateRouteTable2", resources)

    def test_private_routes_use_nat_gateways(self):
        """Test that private routes use NAT Gateways"""
        resources = self.template["Resources"]

        private_route1 = resources["PrivateRoute1"]
        private_route2 = resources["PrivateRoute2"]

        self.assertIn("NatGatewayId", private_route1["Properties"])
        self.assertIn("NatGatewayId", private_route2["Properties"])

    def test_json_structure_validity(self):
        """Test that template is valid JSON"""
        # If we got here, template was already loaded successfully
        self.assertIsInstance(self.template, dict)
        self.assertGreater(len(self.template), 0)


class TestTemplateComplexity(unittest.TestCase):
    """Test suite for template complexity and best practices"""

    @classmethod
    def setUpClass(cls):
        """Load the CloudFormation template"""
        template_path = Path(__file__).parent.parent / "lib" / "TapStack.json"
        with open(template_path, 'r') as f:
            cls.template = json.load(f)

    def test_resource_count(self):
        """Test that template has reasonable number of resources"""
        resource_count = len(self.template.get("Resources", {}))

        # Should have 30+ resources for a three-tier architecture
        self.assertGreater(resource_count, 30)
        self.assertLess(resource_count, 100)  # Not overly complex

    def test_parameter_count(self):
        """Test that template has reasonable number of parameters"""
        param_count = len(self.template.get("Parameters", {}))

        self.assertGreater(param_count, 5)
        self.assertLess(param_count, 15)  # Not too many parameters

    def test_output_count(self):
        """Test that template has sufficient outputs"""
        output_count = len(self.template.get("Outputs", {}))

        self.assertGreater(output_count, 5)


if __name__ == "__main__":
    unittest.main()
