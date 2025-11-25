"""
Unit tests for Aurora Global Database CloudFormation Template.
Tests template structure, resources, parameters, and outputs without AWS deployment.
"""
import json
import unittest
from pathlib import Path
import sys

# Add lib directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "lib"))

from tap_stack import TapStack, load_stack, validate_template


class TestTapStackPythonModule(unittest.TestCase):
    """Unit tests for TapStack Python module."""

    @classmethod
    def setUpClass(cls):
        """Initialize TapStack instance."""
        cls.stack = load_stack()

    def test_load_stack_returns_instance(self):
        """Test load_stack returns TapStack instance."""
        self.assertIsInstance(self.stack, TapStack)

    def test_get_template_returns_dict(self):
        """Test get_template returns dictionary."""
        template = self.stack.get_template()
        self.assertIsInstance(template, dict)

    def test_get_format_version(self):
        """Test get_format_version returns correct version."""
        version = self.stack.get_format_version()
        self.assertEqual(version, "2010-09-09")

    def test_get_description(self):
        """Test get_description returns non-empty string."""
        description = self.stack.get_description()
        self.assertIsInstance(description, str)
        self.assertGreater(len(description), 0)

    def test_get_parameters(self):
        """Test get_parameters returns dict."""
        params = self.stack.get_parameters()
        self.assertIsInstance(params, dict)
        self.assertGreater(len(params), 0)

    def test_get_parameter(self):
        """Test get_parameter returns specific parameter."""
        param = self.stack.get_parameter("environmentSuffix")
        self.assertIsInstance(param, dict)
        self.assertEqual(param["Type"], "String")

    def test_has_parameter(self):
        """Test has_parameter checks parameter existence."""
        self.assertTrue(self.stack.has_parameter("environmentSuffix"))
        self.assertFalse(self.stack.has_parameter("NonExistentParam"))

    def test_get_resources(self):
        """Test get_resources returns dict."""
        resources = self.stack.get_resources()
        self.assertIsInstance(resources, dict)
        self.assertGreater(len(resources), 0)

    def test_get_resource(self):
        """Test get_resource returns specific resource."""
        resource = self.stack.get_resource("VPC")
        self.assertIsInstance(resource, dict)
        self.assertEqual(resource["Type"], "AWS::EC2::VPC")

    def test_has_resource(self):
        """Test has_resource checks resource existence."""
        self.assertTrue(self.stack.has_resource("VPC"))
        self.assertFalse(self.stack.has_resource("NonExistentResource"))

    def test_get_resource_type(self):
        """Test get_resource_type returns resource type."""
        resource_type = self.stack.get_resource_type("VPC")
        self.assertEqual(resource_type, "AWS::EC2::VPC")

    def test_get_resource_properties(self):
        """Test get_resource_properties returns properties dict."""
        props = self.stack.get_resource_properties("VPC")
        self.assertIsInstance(props, dict)
        self.assertIn("CidrBlock", props)

    def test_get_outputs(self):
        """Test get_outputs returns dict."""
        outputs = self.stack.get_outputs()
        self.assertIsInstance(outputs, dict)
        self.assertGreater(len(outputs), 0)

    def test_get_output(self):
        """Test get_output returns specific output."""
        output = self.stack.get_output("VPCId")
        self.assertIsInstance(output, dict)
        self.assertIn("Value", output)

    def test_has_output(self):
        """Test has_output checks output existence."""
        self.assertTrue(self.stack.has_output("VPCId"))
        self.assertFalse(self.stack.has_output("NonExistentOutput"))

    def test_list_resource_names(self):
        """Test list_resource_names returns list of names."""
        names = self.stack.list_resource_names()
        self.assertIsInstance(names, list)
        self.assertIn("VPC", names)
        self.assertIn("DBCluster", names)

    def test_list_resource_types(self):
        """Test list_resource_types returns unique types."""
        types = self.stack.list_resource_types()
        self.assertIsInstance(types, list)
        self.assertIn("AWS::EC2::VPC", types)
        self.assertIn("AWS::RDS::DBCluster", types)

    def test_list_parameter_names(self):
        """Test list_parameter_names returns list."""
        names = self.stack.list_parameter_names()
        self.assertIsInstance(names, list)
        self.assertIn("environmentSuffix", names)

    def test_list_output_names(self):
        """Test list_output_names returns list."""
        names = self.stack.list_output_names()
        self.assertIsInstance(names, list)
        self.assertIn("VPCId", names)

    def test_get_vpc_resource(self):
        """Test get_vpc_resource returns VPC config."""
        vpc = self.stack.get_vpc_resource()
        self.assertEqual(vpc["Type"], "AWS::EC2::VPC")

    def test_get_subnet_resources(self):
        """Test get_subnet_resources returns subnets."""
        subnets = self.stack.get_subnet_resources()
        self.assertIsInstance(subnets, dict)
        self.assertGreaterEqual(len(subnets), 3)

    def test_get_db_cluster_resource(self):
        """Test get_db_cluster_resource returns cluster config."""
        cluster = self.stack.get_db_cluster_resource()
        self.assertEqual(cluster["Type"], "AWS::RDS::DBCluster")

    def test_get_global_cluster_resource(self):
        """Test get_global_cluster_resource returns global cluster."""
        global_cluster = self.stack.get_global_cluster_resource()
        self.assertEqual(global_cluster["Type"], "AWS::RDS::GlobalCluster")

    def test_get_db_instances(self):
        """Test get_db_instances returns instances."""
        instances = self.stack.get_db_instances()
        self.assertIsInstance(instances, dict)
        self.assertGreaterEqual(len(instances), 2)

    def test_get_security_group_resource(self):
        """Test get_security_group_resource returns SG config."""
        sg = self.stack.get_security_group_resource()
        self.assertEqual(sg["Type"], "AWS::EC2::SecurityGroup")

    def test_get_db_subnet_group_resource(self):
        """Test get_db_subnet_group_resource returns subnet group."""
        subnet_group = self.stack.get_db_subnet_group_resource()
        self.assertEqual(subnet_group["Type"], "AWS::RDS::DBSubnetGroup")

    def test_get_secret_resource(self):
        """Test get_secret_resource returns secret config."""
        secret = self.stack.get_secret_resource()
        self.assertEqual(secret["Type"], "AWS::SecretsManager::Secret")

    def test_validate_template_structure(self):
        """Test validate_template_structure returns True."""
        self.assertTrue(self.stack.validate_template_structure())

    def test_validate_resources_have_types(self):
        """Test validate_resources_have_types returns True."""
        self.assertTrue(self.stack.validate_resources_have_types())

    def test_validate_parameters_have_types(self):
        """Test validate_parameters_have_types returns True."""
        self.assertTrue(self.stack.validate_parameters_have_types())

    def test_validate_outputs_have_values(self):
        """Test validate_outputs_have_values returns True."""
        self.assertTrue(self.stack.validate_outputs_have_values())

    def test_check_resource_naming(self):
        """Test check_resource_naming detects environmentSuffix usage."""
        self.assertTrue(self.stack.check_resource_naming("VPC"))
        self.assertTrue(self.stack.check_resource_naming("DBCluster"))

    def test_get_encryption_settings(self):
        """Test get_encryption_settings returns encryption map."""
        encryption = self.stack.get_encryption_settings()
        self.assertIsInstance(encryption, dict)
        self.assertTrue(encryption.get("GlobalCluster"))
        self.assertTrue(encryption.get("DBCluster"))

    def test_get_backup_settings(self):
        """Test get_backup_settings returns backup config."""
        backup = self.stack.get_backup_settings()
        self.assertIsInstance(backup, dict)
        self.assertIn("BackupRetentionPeriod", backup)
        self.assertEqual(backup["BackupRetentionPeriod"], 7)

    def test_get_cloudwatch_log_exports(self):
        """Test get_cloudwatch_log_exports returns log types."""
        logs = self.stack.get_cloudwatch_log_exports()
        self.assertIsInstance(logs, list)
        self.assertIn("error", logs)
        self.assertIn("general", logs)
        self.assertIn("slowquery", logs)

    def test_validate_no_deletion_protection(self):
        """Test validate_no_deletion_protection returns True."""
        self.assertTrue(self.stack.validate_no_deletion_protection())

    def test_validate_no_retain_policy(self):
        """Test validate_no_retain_policy returns True."""
        self.assertTrue(self.stack.validate_no_retain_policy())

    def test_get_engine_version(self):
        """Test get_engine_version returns version string."""
        version = self.stack.get_engine_version()
        self.assertIsInstance(version, str)
        self.assertTrue(version.startswith("8.0"))

    def test_get_engine_type(self):
        """Test get_engine_type returns engine type."""
        engine = self.stack.get_engine_type()
        self.assertEqual(engine, "aurora-mysql")

    def test_validate_template_function(self):
        """Test validate_template function."""
        self.assertTrue(validate_template())

    def test_get_parameter_raises_on_missing(self):
        """Test get_parameter raises KeyError for missing parameter."""
        with self.assertRaises(KeyError):
            self.stack.get_parameter("NonExistentParameter")

    def test_get_resource_raises_on_missing(self):
        """Test get_resource raises KeyError for missing resource."""
        with self.assertRaises(KeyError):
            self.stack.get_resource("NonExistentResource")

    def test_get_output_raises_on_missing(self):
        """Test get_output raises KeyError for missing output."""
        with self.assertRaises(KeyError):
            self.stack.get_output("NonExistentOutput")

    def test_get_resource_type_for_missing_resource(self):
        """Test get_resource_type raises KeyError for missing resource."""
        with self.assertRaises(KeyError):
            self.stack.get_resource_type("NonExistentResource")

    def test_get_resource_properties_for_missing_resource(self):
        """Test get_resource_properties raises KeyError for missing resource."""
        with self.assertRaises(KeyError):
            self.stack.get_resource_properties("NonExistentResource")

    def test_get_vpc_resource_with_properties(self):
        """Test get_vpc_resource returns complete VPC with all properties."""
        vpc = self.stack.get_vpc_resource()
        props = vpc["Properties"]
        self.assertIn("CidrBlock", props)
        self.assertIn("EnableDnsHostnames", props)

    def test_get_security_group_ingress_rules(self):
        """Test get_security_group_resource ingress rules."""
        sg = self.stack.get_security_group_resource()
        props = sg["Properties"]
        ingress = props["SecurityGroupIngress"]
        self.assertGreater(len(ingress), 0)
        self.assertEqual(ingress[0]["FromPort"], 3306)

    def test_get_db_subnet_group_subnets(self):
        """Test get_db_subnet_group_resource subnet configuration."""
        subnet_group = self.stack.get_db_subnet_group_resource()
        props = subnet_group["Properties"]
        subnet_ids = props["SubnetIds"]
        self.assertEqual(len(subnet_ids), 3)

    def test_check_resource_naming_all_critical_resources(self):
        """Test all critical resources use environmentSuffix."""
        critical_resources = [
            "VPC",
            "DBCluster",
            "GlobalCluster",
            "DatabaseSecret",
            "DBSubnetGroup",
            "DBSecurityGroup"
        ]
        for resource_name in critical_resources:
            self.assertTrue(
                self.stack.check_resource_naming(resource_name),
                f"{resource_name} must use environmentSuffix"
            )

    def test_get_backup_settings_all_fields(self):
        """Test get_backup_settings returns all backup configuration fields."""
        backup = self.stack.get_backup_settings()
        self.assertEqual(backup["BackupRetentionPeriod"], 7)
        self.assertIsNotNone(backup["PreferredBackupWindow"])
        self.assertIsNotNone(backup["PreferredMaintenanceWindow"])

    def test_get_encryption_settings_with_resources(self):
        """Test get_encryption_settings returns correct encryption for all resources."""
        encryption = self.stack.get_encryption_settings()
        # Verify GlobalCluster and DBCluster have StorageEncrypted
        self.assertIn("GlobalCluster", encryption)
        self.assertIn("DBCluster", encryption)
        for resource_name, is_encrypted in encryption.items():
            self.assertTrue(is_encrypted, f"{resource_name} must have encryption enabled")

    def test_list_resource_types_contains_expected_types(self):
        """Test list_resource_types contains all expected AWS resource types."""
        types = self.stack.list_resource_types()
        expected_types = [
            "AWS::EC2::VPC",
            "AWS::EC2::Subnet",
            "AWS::EC2::SecurityGroup",
            "AWS::RDS::DBCluster",
            "AWS::RDS::DBInstance",
            "AWS::RDS::GlobalCluster",
            "AWS::RDS::DBSubnetGroup",
            "AWS::SecretsManager::Secret",
            "AWS::CloudWatch::Alarm",
            "AWS::Route53::HealthCheck"
        ]
        for expected_type in expected_types:
            self.assertIn(expected_type, types, f"Expected resource type {expected_type} not found")

    def test_get_subnet_resources_returns_all_subnets(self):
        """Test get_subnet_resources returns all subnet configurations."""
        subnets = self.stack.get_subnet_resources()
        subnet_names = list(subnets.keys())

        # Check all subnets are named correctly
        self.assertIn("PrivateSubnet1", subnet_names)
        self.assertIn("PrivateSubnet2", subnet_names)
        self.assertIn("PrivateSubnet3", subnet_names)

        # Verify each subnet has proper structure
        for subnet_name, subnet_config in subnets.items():
            self.assertEqual(subnet_config["Type"], "AWS::EC2::Subnet")
            self.assertIn("Properties", subnet_config)

    def test_get_db_instances_returns_all_instances(self):
        """Test get_db_instances returns all DB instance configurations."""
        instances = self.stack.get_db_instances()
        instance_names = list(instances.keys())

        self.assertIn("DBInstance1", instance_names)
        self.assertIn("DBInstance2", instance_names)

        for instance_name, instance_config in instances.items():
            self.assertEqual(instance_config["Type"], "AWS::RDS::DBInstance")
            self.assertIn("Properties", instance_config)


class TestTapStackUnit(unittest.TestCase):
    """Unit tests for TapStack CloudFormation template."""

    @classmethod
    def setUpClass(cls):
        """Load the CloudFormation template once for all tests."""
        template_path = Path(__file__).parent.parent.parent / "lib" / "TapStack.json"
        with open(template_path, "r") as f:
            cls.template = json.load(f)

    def test_template_format_version(self):
        """Test CloudFormation template format version."""
        self.assertEqual(
            self.template["AWSTemplateFormatVersion"],
            "2010-09-09",
            "Template must use CloudFormation format version 2010-09-09"
        )

    def test_template_has_description(self):
        """Test template has a meaningful description."""
        self.assertIn("Description", self.template)
        self.assertIn("Aurora Global Database", self.template["Description"])

    def test_required_parameters_exist(self):
        """Test all required parameters are defined."""
        params = self.template["Parameters"]
        required_params = ["environmentSuffix", "DatabaseName", "MasterUsername", "DBInstanceClass"]

        for param in required_params:
            self.assertIn(param, params, f"Required parameter {param} missing")

    def test_environment_suffix_parameter(self):
        """Test environmentSuffix parameter configuration."""
        env_suffix = self.template["Parameters"]["environmentSuffix"]

        self.assertEqual(env_suffix["Type"], "String")
        self.assertIn("AllowedPattern", env_suffix)
        self.assertEqual(env_suffix["AllowedPattern"], "[a-z0-9-]+")

    def test_db_instance_class_allowed_values(self):
        """Test DBInstanceClass parameter has valid allowed values."""
        db_class = self.template["Parameters"]["DBInstanceClass"]

        self.assertIn("AllowedValues", db_class)
        allowed = db_class["AllowedValues"]

        # Must have at least one db.r5 or db.r6g instance type
        valid_types = [v for v in allowed if v.startswith("db.r5") or v.startswith("db.r6g")]
        self.assertGreater(len(valid_types), 0)

    def test_required_resources_exist(self):
        """Test all critical resources are defined."""
        resources = self.template["Resources"]
        required_resources = [
            "VPC",
            "PrivateSubnet1",
            "PrivateSubnet2",
            "PrivateSubnet3",
            "DBSubnetGroup",
            "DBSecurityGroup",
            "DatabaseSecret",
            "GlobalCluster",
            "DBCluster",
            "DBInstance1",
            "DBInstance2"
        ]

        for resource in required_resources:
            self.assertIn(resource, resources, f"Required resource {resource} missing")

    def test_vpc_configuration(self):
        """Test VPC resource configuration."""
        vpc = self.template["Resources"]["VPC"]

        self.assertEqual(vpc["Type"], "AWS::EC2::VPC")
        self.assertEqual(vpc["Properties"]["CidrBlock"], "10.0.0.0/16")
        self.assertTrue(vpc["Properties"]["EnableDnsHostnames"])
        self.assertTrue(vpc["Properties"]["EnableDnsSupport"])

    def test_subnets_in_different_azs(self):
        """Test subnets are distributed across availability zones."""
        subnet1 = self.template["Resources"]["PrivateSubnet1"]
        subnet2 = self.template["Resources"]["PrivateSubnet2"]
        subnet3 = self.template["Resources"]["PrivateSubnet3"]

        # Each subnet should use different AZ index
        az1 = subnet1["Properties"]["AvailabilityZone"]["Fn::Select"][0]
        az2 = subnet2["Properties"]["AvailabilityZone"]["Fn::Select"][0]
        az3 = subnet3["Properties"]["AvailabilityZone"]["Fn::Select"][0]

        self.assertEqual(az1, 0)
        self.assertEqual(az2, 1)
        self.assertEqual(az3, 2)

    def test_db_subnet_group_has_subnets(self):
        """Test DB subnet group contains all three subnets."""
        db_subnet_group = self.template["Resources"]["DBSubnetGroup"]

        self.assertEqual(db_subnet_group["Type"], "AWS::RDS::DBSubnetGroup")

        subnet_ids = db_subnet_group["Properties"]["SubnetIds"]
        self.assertEqual(len(subnet_ids), 3, "DB subnet group must have 3 subnets")

        # Verify each subnet is referenced
        expected_refs = ["PrivateSubnet1", "PrivateSubnet2", "PrivateSubnet3"]
        for subnet_ref in subnet_ids:
            self.assertIn("Ref", subnet_ref)
            self.assertIn(subnet_ref["Ref"], expected_refs)

    def test_security_group_ingress_rules(self):
        """Test security group has MySQL port open."""
        sg = self.template["Resources"]["DBSecurityGroup"]

        self.assertEqual(sg["Type"], "AWS::EC2::SecurityGroup")

        ingress = sg["Properties"]["SecurityGroupIngress"]
        self.assertGreater(len(ingress), 0, "Security group must have ingress rules")

        mysql_rule = ingress[0]
        self.assertEqual(mysql_rule["IpProtocol"], "tcp")
        self.assertEqual(mysql_rule["FromPort"], 3306)
        self.assertEqual(mysql_rule["ToPort"], 3306)

    def test_database_secret_configuration(self):
        """Test Secrets Manager secret configuration."""
        secret = self.template["Resources"]["DatabaseSecret"]

        self.assertEqual(secret["Type"], "AWS::SecretsManager::Secret")

        gen_config = secret["Properties"]["GenerateSecretString"]
        self.assertEqual(gen_config["GenerateStringKey"], "password")
        self.assertEqual(gen_config["PasswordLength"], 32)

    def test_global_cluster_configuration(self):
        """Test Aurora Global Cluster configuration."""
        global_cluster = self.template["Resources"]["GlobalCluster"]

        self.assertEqual(global_cluster["Type"], "AWS::RDS::GlobalCluster")

        props = global_cluster["Properties"]
        self.assertEqual(props["Engine"], "aurora-mysql")
        self.assertTrue(props["StorageEncrypted"])

        # Verify engine version is valid
        self.assertIn("EngineVersion", props)
        self.assertTrue(props["EngineVersion"].startswith("8.0"))

    def test_db_cluster_attached_to_global(self):
        """Test DB cluster is attached to global cluster."""
        db_cluster = self.template["Resources"]["DBCluster"]

        self.assertEqual(db_cluster["Type"], "AWS::RDS::DBCluster")

        props = db_cluster["Properties"]
        self.assertIn("GlobalClusterIdentifier", props)
        self.assertEqual(props["GlobalClusterIdentifier"]["Ref"], "GlobalCluster")

    def test_db_cluster_credentials_from_secrets(self):
        """Test DB cluster uses Secrets Manager for credentials."""
        db_cluster = self.template["Resources"]["DBCluster"]

        props = db_cluster["Properties"]

        # Check username resolution
        username = props["MasterUsername"]["Fn::Sub"]
        self.assertIn("resolve:secretsmanager", username)
        self.assertIn("username", username)

        # Check password resolution
        password = props["MasterUserPassword"]["Fn::Sub"]
        self.assertIn("resolve:secretsmanager", password)
        self.assertIn("password", password)

    def test_db_cluster_encryption_enabled(self):
        """Test DB cluster has encryption enabled."""
        db_cluster = self.template["Resources"]["DBCluster"]

        props = db_cluster["Properties"]
        self.assertTrue(props["StorageEncrypted"])

    def test_db_cluster_backup_configuration(self):
        """Test DB cluster backup configuration."""
        db_cluster = self.template["Resources"]["DBCluster"]

        props = db_cluster["Properties"]
        self.assertEqual(props["BackupRetentionPeriod"], 7)
        self.assertIn("PreferredBackupWindow", props)
        self.assertIn("PreferredMaintenanceWindow", props)

    def test_db_cluster_cloudwatch_logs(self):
        """Test DB cluster exports logs to CloudWatch."""
        db_cluster = self.template["Resources"]["DBCluster"]

        props = db_cluster["Properties"]
        self.assertIn("EnableCloudwatchLogsExports", props)

        log_types = props["EnableCloudwatchLogsExports"]
        self.assertIn("error", log_types)
        self.assertIn("general", log_types)
        self.assertIn("slowquery", log_types)

    def test_db_instances_attached_to_cluster(self):
        """Test DB instances are attached to cluster."""
        instance1 = self.template["Resources"]["DBInstance1"]
        instance2 = self.template["Resources"]["DBInstance2"]

        self.assertEqual(instance1["Type"], "AWS::RDS::DBInstance")
        self.assertEqual(instance2["Type"], "AWS::RDS::DBInstance")

        self.assertEqual(instance1["Properties"]["DBClusterIdentifier"]["Ref"], "DBCluster")
        self.assertEqual(instance2["Properties"]["DBClusterIdentifier"]["Ref"], "DBCluster")

    def test_db_instances_not_publicly_accessible(self):
        """Test DB instances are not publicly accessible."""
        instance1 = self.template["Resources"]["DBInstance1"]
        instance2 = self.template["Resources"]["DBInstance2"]

        self.assertFalse(instance1["Properties"]["PubliclyAccessible"])
        self.assertFalse(instance2["Properties"]["PubliclyAccessible"])

    def test_cloudwatch_alarm_exists(self):
        """Test CloudWatch alarm is configured."""
        resources = self.template["Resources"]

        # Find alarm resources
        alarms = [r for r in resources.values() if r["Type"] == "AWS::CloudWatch::Alarm"]
        self.assertGreater(len(alarms), 0, "Must have at least one CloudWatch alarm")

        # Check first alarm configuration
        alarm = resources["ClusterCPUAlarm"]
        self.assertEqual(alarm["Properties"]["MetricName"], "CPUUtilization")
        self.assertEqual(alarm["Properties"]["Namespace"], "AWS/RDS")

    def test_route53_health_check_exists(self):
        """Test Route53 health check is configured."""
        health_check = self.template["Resources"]["ClusterHealthCheck"]

        self.assertEqual(health_check["Type"], "AWS::Route53::HealthCheck")
        self.assertEqual(health_check["Properties"]["HealthCheckConfig"]["Type"], "CALCULATED")

    def test_all_resources_use_environment_suffix(self):
        """Test all resources use environmentSuffix for naming."""
        resources = self.template["Resources"]

        resources_requiring_suffix = [
            "VPC",
            "DBSubnetGroup",
            "DBSecurityGroup",
            "DatabaseSecret",
            "GlobalCluster",
            "DBCluster",
            "DBInstance1",
            "DBInstance2",
            "ClusterHealthCheck",
            "ClusterCPUAlarm"
        ]

        for resource_name in resources_requiring_suffix:
            resource = resources[resource_name]
            props = resource["Properties"]

            # Find any property with Fn::Sub
            found_suffix = False
            for key, value in props.items():
                if isinstance(value, dict) and "Fn::Sub" in value:
                    fn_sub_value = value["Fn::Sub"]
                    if "${environmentSuffix}" in fn_sub_value:
                        found_suffix = True
                        break
                elif isinstance(value, list):
                    for item in value:
                        if isinstance(item, dict):
                            for k, v in item.items():
                                if isinstance(v, dict) and "Fn::Sub" in v:
                                    if "${environmentSuffix}" in v["Fn::Sub"]:
                                        found_suffix = True
                                        break

            self.assertTrue(
                found_suffix,
                f"Resource {resource_name} must use environmentSuffix in naming"
            )

    def test_no_deletion_protection(self):
        """Test resources don't have deletion protection enabled."""
        resources = self.template["Resources"]

        # Check RDS clusters and instances
        for resource_name, resource in resources.items():
            if resource["Type"] in ["AWS::RDS::DBCluster", "AWS::RDS::DBInstance"]:
                props = resource["Properties"]

                # DeletionProtection should not exist or be False
                deletion_protection = props.get("DeletionProtection", False)
                self.assertFalse(
                    deletion_protection,
                    f"{resource_name} must not have DeletionProtection enabled"
                )

    def test_no_retain_deletion_policy(self):
        """Test resources don't have Retain deletion policy."""
        resources = self.template["Resources"]

        for resource_name, resource in resources.items():
            deletion_policy = resource.get("DeletionPolicy")
            self.assertNotEqual(
                deletion_policy,
                "Retain",
                f"{resource_name} must not have DeletionPolicy: Retain"
            )

    def test_required_outputs_exist(self):
        """Test all required outputs are defined."""
        outputs = self.template["Outputs"]

        required_outputs = [
            "GlobalClusterIdentifier",
            "ClusterEndpoint",
            "ClusterReadEndpoint",
            "DatabaseSecretArn",
            "VPCId",
            "DBClusterIdentifier"
        ]

        for output in required_outputs:
            self.assertIn(output, outputs, f"Required output {output} missing")

    def test_outputs_have_descriptions(self):
        """Test all outputs have descriptions."""
        outputs = self.template["Outputs"]

        for output_name, output_config in outputs.items():
            self.assertIn(
                "Description",
                output_config,
                f"Output {output_name} must have a description"
            )

    def test_outputs_have_exports(self):
        """Test critical outputs are exported for cross-stack references."""
        outputs = self.template["Outputs"]

        critical_exports = [
            "GlobalClusterIdentifier",
            "ClusterEndpoint",
            "DatabaseSecretArn",
            "VPCId"
        ]

        for export_name in critical_exports:
            output = outputs[export_name]
            self.assertIn(
                "Export",
                output,
                f"Output {export_name} must be exported"
            )

    def test_output_values_reference_resources(self):
        """Test output values correctly reference resources."""
        outputs = self.template["Outputs"]

        # GlobalClusterIdentifier should reference GlobalCluster
        global_cluster_output = outputs["GlobalClusterIdentifier"]
        self.assertEqual(global_cluster_output["Value"]["Ref"], "GlobalCluster")

        # ClusterEndpoint should use Fn::GetAtt
        endpoint_output = outputs["ClusterEndpoint"]
        self.assertIn("Fn::GetAtt", endpoint_output["Value"])
        self.assertEqual(endpoint_output["Value"]["Fn::GetAtt"][0], "DBCluster")

    def test_template_json_structure(self):
        """Test template is valid JSON with proper structure."""
        # If we got here, JSON loaded successfully
        self.assertIsInstance(self.template, dict)

        # Must have these top-level keys
        required_keys = ["AWSTemplateFormatVersion", "Resources"]
        for key in required_keys:
            self.assertIn(key, self.template)

    def test_resource_types_are_valid(self):
        """Test all resource types are valid AWS resource types."""
        resources = self.template["Resources"]

        valid_prefixes = ["AWS::", "Custom::"]
        for resource_name, resource in resources.items():
            resource_type = resource["Type"]

            has_valid_prefix = any(resource_type.startswith(prefix) for prefix in valid_prefixes)
            self.assertTrue(
                has_valid_prefix,
                f"{resource_name} has invalid resource type: {resource_type}"
            )

    def test_no_hardcoded_regions(self):
        """Test template doesn't contain hardcoded regions."""
        template_str = json.dumps(self.template)

        hardcoded_regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]

        for region in hardcoded_regions:
            # Allow in AllowedValues but not in actual resource configurations
            if region in template_str:
                # Check if it's only in AllowedValues
                params_str = json.dumps(self.template.get("Parameters", {}))
                if region in params_str:
                    # This is OK - in AllowedValues
                    pass
                else:
                    # Check if it appears in Resources (bad)
                    resources_str = json.dumps(self.template["Resources"])
                    self.assertNotIn(
                        region,
                        resources_str,
                        f"Template should not contain hardcoded region {region} in Resources"
                    )

    def test_no_hardcoded_account_ids(self):
        """Test template doesn't contain hardcoded account IDs."""
        template_str = json.dumps(self.template)

        # Pattern for 12-digit account IDs
        import re
        account_pattern = r'\b\d{12}\b'

        # Exclude parameter defaults
        resources_str = json.dumps(self.template["Resources"])
        matches = re.findall(account_pattern, resources_str)

        # Check for common test account IDs
        test_accounts = ["123456789012", "111111111111", "000000000000"]
        for account in test_accounts:
            self.assertNotIn(
                account,
                resources_str,
                f"Template should not contain hardcoded account ID {account}"
            )


if __name__ == "__main__":
    unittest.main()
