#!/usr/bin/env python3
"""
Unit tests for CloudFormation template validation.
Tests template structure, parameters, resources, and outputs.
"""

import json
import os
import unittest
from pathlib import Path


class TestCloudFormationTemplate(unittest.TestCase):
    """Unit tests for CloudFormation template structure and content."""

    @classmethod
    def setUpClass(cls):
        """Load the CloudFormation template once for all tests."""
        template_path = Path(__file__).parent.parent / "lib" / "template.json"
        with open(template_path, "r") as f:
            cls.template = json.load(f)

    def test_template_format_version(self):
        """Test that template has correct AWSTemplateFormatVersion."""
        self.assertEqual(
            self.template.get("AWSTemplateFormatVersion"),
            "2010-09-09",
            "Template must have AWSTemplateFormatVersion 2010-09-09"
        )

    def test_template_has_description(self):
        """Test that template includes a description."""
        self.assertIn("Description", self.template)
        self.assertIsInstance(self.template["Description"], str)
        self.assertGreater(len(self.template["Description"]), 0)

    def test_required_parameters_exist(self):
        """Test that all required parameters are defined."""
        required_params = [
            "EnvironmentName",
            "EnvironmentSuffix",
            "DBUsername",
            "DBPassword",
            "VPCId",
            "PrivateSubnetIds"
        ]
        params = self.template.get("Parameters", {})

        for param in required_params:
            self.assertIn(param, params, f"Required parameter {param} is missing")

    def test_environment_name_parameter(self):
        """Test EnvironmentName parameter configuration."""
        env_param = self.template["Parameters"]["EnvironmentName"]

        self.assertEqual(env_param["Type"], "String")
        self.assertEqual(env_param["Default"], "dev")
        self.assertIn("AllowedValues", env_param)
        self.assertEqual(
            set(env_param["AllowedValues"]),
            {"dev", "staging", "prod"}
        )

    def test_environment_suffix_parameter(self):
        """Test EnvironmentSuffix parameter configuration."""
        suffix_param = self.template["Parameters"]["EnvironmentSuffix"]

        self.assertEqual(suffix_param["Type"], "String")
        self.assertEqual(suffix_param["MinLength"], 1)
        self.assertEqual(suffix_param["MaxLength"], 20)
        self.assertIn("AllowedPattern", suffix_param)

    def test_db_password_parameter_security(self):
        """Test DBPassword parameter has NoEcho enabled."""
        db_pass = self.template["Parameters"]["DBPassword"]

        self.assertTrue(db_pass.get("NoEcho", False), "DBPassword must have NoEcho=true")
        self.assertEqual(db_pass["MinLength"], 8)
        self.assertEqual(db_pass["MaxLength"], 41)

    def test_isproduction_condition_exists(self):
        """Test that IsProduction condition is defined correctly."""
        conditions = self.template.get("Conditions", {})

        self.assertIn("IsProduction", conditions)
        is_prod = conditions["IsProduction"]

        self.assertIn("Fn::Equals", is_prod)
        equals_args = is_prod["Fn::Equals"]
        self.assertEqual(len(equals_args), 2)

    def test_required_resources_exist(self):
        """Test that all required resources are defined."""
        required_resources = [
            "DBSubnetGroup",
            "DBSecurityGroup",
            "LambdaSecurityGroup",
            "AuroraDBCluster",
            "AuroraDBInstance",
            "TransactionProcessorRole",
            "TransactionProcessorFunction",
            "TransactionProcessorLogGroup",
            "DBSecret",
            "NotificationTopic"
        ]
        resources = self.template.get("Resources", {})

        for resource in required_resources:
            self.assertIn(resource, resources, f"Required resource {resource} is missing")

    def test_aurora_cluster_configuration(self):
        """Test Aurora cluster has correct configuration."""
        cluster = self.template["Resources"]["AuroraDBCluster"]

        self.assertEqual(cluster["Type"], "AWS::RDS::DBCluster")
        self.assertEqual(cluster["DeletionPolicy"], "Retain")
        self.assertEqual(cluster["UpdateReplacePolicy"], "Retain")

        props = cluster["Properties"]
        self.assertEqual(props["Engine"], "aurora-mysql")
        self.assertIn("ServerlessV2ScalingConfiguration", props)

        scaling = props["ServerlessV2ScalingConfiguration"]
        self.assertEqual(scaling["MinCapacity"], 0.5)
        self.assertEqual(scaling["MaxCapacity"], 1.0)

    def test_aurora_instance_serverless_class(self):
        """Test Aurora instance uses db.serverless class."""
        instance = self.template["Resources"]["AuroraDBInstance"]

        self.assertEqual(instance["Type"], "AWS::RDS::DBInstance")
        props = instance["Properties"]
        self.assertEqual(props["DBInstanceClass"], "db.serverless")
        self.assertFalse(props["PubliclyAccessible"])

    def test_lambda_function_configuration(self):
        """Test Lambda function has correct memory and concurrency settings."""
        lambda_func = self.template["Resources"]["TransactionProcessorFunction"]

        self.assertEqual(lambda_func["Type"], "AWS::Lambda::Function")
        self.assertEqual(lambda_func["DeletionPolicy"], "Delete")

        props = lambda_func["Properties"]
        self.assertEqual(props["MemorySize"], 3008)
        self.assertEqual(props["ReservedConcurrentExecutions"], 100)
        self.assertEqual(props["Timeout"], 300)

    def test_lambda_depends_on_rds(self):
        """Test Lambda function has explicit DependsOn for RDS resources."""
        lambda_func = self.template["Resources"]["TransactionProcessorFunction"]

        self.assertIn("DependsOn", lambda_func)
        depends_on = lambda_func["DependsOn"]

        self.assertIn("AuroraDBCluster", depends_on)
        self.assertIn("AuroraDBInstance", depends_on)

    def test_lambda_role_uses_stack_name(self):
        """Test Lambda IAM role name uses Fn::Sub with AWS::StackName."""
        role = self.template["Resources"]["TransactionProcessorRole"]

        role_name = role["Properties"]["RoleName"]
        self.assertIn("Fn::Sub", role_name)
        self.assertIn("${AWS::StackName}", role_name["Fn::Sub"])

    def test_security_groups_no_circular_dependency(self):
        """Test security groups reference each other without circular dependency."""
        db_sg = self.template["Resources"]["DBSecurityGroup"]
        lambda_sg = self.template["Resources"]["LambdaSecurityGroup"]

        # DB SG should reference Lambda SG in ingress
        ingress = db_sg["Properties"]["SecurityGroupIngress"][0]
        self.assertIn("Ref", ingress["SourceSecurityGroupId"])
        self.assertEqual(ingress["SourceSecurityGroupId"]["Ref"], "LambdaSecurityGroup")

        # Lambda SG should NOT reference DB SG (avoiding circular dependency)
        lambda_sg_props = lambda_sg["Properties"]
        self.assertNotIn("SecurityGroupIngress", lambda_sg_props)

    def test_environment_suffix_used_in_resource_names(self):
        """Test that EnvironmentSuffix parameter is used in resource naming."""
        resources_with_suffix = [
            "DBSubnetGroup",
            "DBSecurityGroup",
            "LambdaSecurityGroup",
            "AuroraDBCluster",
            "AuroraDBInstance",
            "TransactionProcessorFunction",
            "TransactionProcessorLogGroup",
            "DBSecret",
            "NotificationTopic"
        ]

        for resource_name in resources_with_suffix:
            resource = self.template["Resources"][resource_name]
            props = resource.get("Properties", {})

            # Check if any property uses EnvironmentSuffix
            resource_json = json.dumps(props)
            self.assertIn(
                "EnvironmentSuffix",
                resource_json,
                f"Resource {resource_name} should use EnvironmentSuffix in naming"
            )

    def test_conditional_resources(self):
        """Test that conditional resources have IsProduction condition."""
        conditional_resources = ["RDSMonitoringRole", "CloudWatchDashboard"]

        for resource_name in conditional_resources:
            resource = self.template["Resources"][resource_name]
            self.assertEqual(
                resource.get("Condition"),
                "IsProduction",
                f"{resource_name} should be conditional on IsProduction"
            )

    def test_monitoring_interval_uses_condition(self):
        """Test Aurora instance monitoring interval uses conditional logic."""
        instance = self.template["Resources"]["AuroraDBInstance"]
        props = instance["Properties"]

        monitoring_interval = props["MonitoringInterval"]
        self.assertIn("Fn::If", monitoring_interval)

        # Should be 60 for production, 0 for non-production
        if_args = monitoring_interval["Fn::If"]
        self.assertEqual(if_args[0], "IsProduction")
        self.assertEqual(if_args[1], 60)
        self.assertEqual(if_args[2], 0)

    def test_required_outputs_exist(self):
        """Test that all required outputs are defined."""
        required_outputs = [
            "RDSClusterEndpoint",
            "RDSClusterReadEndpoint",
            "LambdaFunctionArn",
            "LambdaSecurityGroupId",
            "DBSecurityGroupId",
            "DBSecretArn",
            "NotificationTopicArn"
        ]
        outputs = self.template.get("Outputs", {})

        for output in required_outputs:
            self.assertIn(output, outputs, f"Required output {output} is missing")

    def test_outputs_use_export_names(self):
        """Test that outputs use Export names with AWS::StackName pattern."""
        outputs = self.template.get("Outputs", {})

        for output_name, output_config in outputs.items():
            self.assertIn("Export", output_config, f"Output {output_name} should have Export")
            export = output_config["Export"]
            self.assertIn("Name", export)

            # Export name should use Fn::Sub with ${AWS::StackName}
            export_name = export["Name"]
            self.assertIn("Fn::Sub", export_name)
            self.assertIn("${AWS::StackName}", export_name["Fn::Sub"])

    def test_secrets_manager_integration(self):
        """Test Secrets Manager secret is configured correctly."""
        secret = self.template["Resources"]["DBSecret"]

        self.assertEqual(secret["Type"], "AWS::SecretsManager::Secret")
        props = secret["Properties"]

        # Secret should include database connection details
        secret_string = props["SecretString"]
        self.assertIn("Fn::Sub", secret_string)

        secret_content = secret_string["Fn::Sub"]
        self.assertIn("username", secret_content)
        self.assertIn("password", secret_content)
        self.assertIn("host", secret_content)
        self.assertIn("port", secret_content)

    def test_cloudwatch_logs_retention(self):
        """Test CloudWatch log group has conditional retention period."""
        log_group = self.template["Resources"]["TransactionProcessorLogGroup"]
        props = log_group["Properties"]

        retention = props["RetentionInDays"]
        self.assertIn("Fn::If", retention)

        # Should be 30 days for prod, 7 days for non-prod
        if_args = retention["Fn::If"]
        self.assertEqual(if_args[0], "IsProduction")
        self.assertEqual(if_args[1], 30)
        self.assertEqual(if_args[2], 7)

    def test_no_hardcoded_values_in_parameters(self):
        """Test that no AWS account IDs or hardcoded IDs are in parameters."""
        params = self.template.get("Parameters", {})

        for param_name, param_config in params.items():
            # Check Default values don't contain hardcoded AWS IDs
            default = param_config.get("Default", "")
            if isinstance(default, str):
                self.assertNotRegex(
                    default,
                    r"^\d{12}$",
                    f"Parameter {param_name} should not have hardcoded AWS account ID"
                )
                self.assertNotRegex(
                    default,
                    r"^vpc-[a-f0-9]+$",
                    f"Parameter {param_name} should not have hardcoded VPC ID"
                )

    def test_template_is_valid_json(self):
        """Test that template is valid JSON structure."""
        # If we got this far, template loaded successfully
        self.assertIsInstance(self.template, dict)
        self.assertGreater(len(self.template), 0)

    def test_sns_topic_created(self):
        """Test SNS topic for notifications is created."""
        topic = self.template["Resources"]["NotificationTopic"]

        self.assertEqual(topic["Type"], "AWS::SNS::Topic")
        props = topic["Properties"]
        self.assertIn("TopicName", props)
        self.assertIn("DisplayName", props)

    def test_vpc_config_on_lambda(self):
        """Test Lambda function has VPC configuration."""
        lambda_func = self.template["Resources"]["TransactionProcessorFunction"]
        props = lambda_func["Properties"]

        self.assertIn("VpcConfig", props)
        vpc_config = props["VpcConfig"]
        self.assertIn("SecurityGroupIds", vpc_config)
        self.assertIn("SubnetIds", vpc_config)


if __name__ == "__main__":
    unittest.main()
