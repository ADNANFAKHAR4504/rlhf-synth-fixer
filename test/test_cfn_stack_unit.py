"""
Unit tests for CloudFormation multi-region disaster recovery templates.

This test suite validates the CloudFormation template structure, resource
configuration, and compliance with best practices without deploying to AWS.
"""

import json
import os
import unittest
from typing import Any, Dict


class TestCloudFormationTemplateUnit(unittest.TestCase):
    """Unit tests for CloudFormation template validation."""

    @classmethod
    def setUpClass(cls):
        """Load CloudFormation templates once for all tests."""
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        # Load primary stack template
        primary_path = os.path.join(base_path, "lib", "primary-stack.json")
        with open(primary_path, "r") as f:
            cls.primary_template = json.load(f)

        # Load secondary stack template
        secondary_path = os.path.join(base_path, "lib", "secondary-stack.json")
        with open(secondary_path, "r") as f:
            cls.secondary_template = json.load(f)

    def test_template_format_version(self):
        """Test that templates have correct AWSTemplateFormatVersion."""
        self.assertEqual(
            self.primary_template.get("AWSTemplateFormatVersion"),
            "2010-09-09",
            "Primary template must have correct format version"
        )
        self.assertEqual(
            self.secondary_template.get("AWSTemplateFormatVersion"),
            "2010-09-09",
            "Secondary template must have correct format version"
        )

    def test_template_has_description(self):
        """Test that templates have descriptions."""
        self.assertIn(
            "Description",
            self.primary_template,
            "Primary template must have Description"
        )
        self.assertIn(
            "Description",
            self.secondary_template,
            "Secondary template must have Description"
        )

    def test_required_parameters_present(self):
        """Test that all required parameters are defined."""
        # Primary stack parameters
        primary_params = self.primary_template.get("Parameters", {})
        self.assertIn("EnvironmentSuffix", primary_params)
        self.assertIn("DatabaseUsername", primary_params)
        self.assertIn("DatabasePassword", primary_params)
        self.assertIn("NotificationEmail", primary_params)

        # Secondary stack parameters
        secondary_params = self.secondary_template.get("Parameters", {})
        self.assertIn("EnvironmentSuffix", secondary_params)
        self.assertIn("GlobalClusterIdentifier", secondary_params)
        self.assertIn("HostedZoneId", secondary_params)
        self.assertIn("NotificationEmail", secondary_params)

    def test_environment_suffix_parameter_validation(self):
        """Test EnvironmentSuffix parameter has proper validation."""
        primary_env_param = self.primary_template["Parameters"]["EnvironmentSuffix"]
        self.assertEqual(primary_env_param["Type"], "String")
        self.assertEqual(primary_env_param["MinLength"], 3)
        self.assertEqual(primary_env_param["MaxLength"], 20)
        self.assertEqual(primary_env_param["AllowedPattern"], "[a-z0-9-]+")

        secondary_env_param = self.secondary_template["Parameters"]["EnvironmentSuffix"]
        self.assertEqual(secondary_env_param["Type"], "String")
        self.assertEqual(secondary_env_param["MinLength"], 3)

    def test_database_password_no_echo(self):
        """Test that database password has NoEcho enabled."""
        db_password = self.primary_template["Parameters"]["DatabasePassword"]
        self.assertTrue(
            db_password.get("NoEcho", False),
            "DatabasePassword must have NoEcho set to true"
        )

    def test_vpc_configuration(self):
        """Test VPC resource configuration."""
        primary_vpc = self.primary_template["Resources"]["VPC"]
        self.assertEqual(primary_vpc["Type"], "AWS::EC2::VPC")
        self.assertEqual(primary_vpc["Properties"]["CidrBlock"], "10.0.0.0/16")
        self.assertTrue(primary_vpc["Properties"]["EnableDnsHostnames"])
        self.assertTrue(primary_vpc["Properties"]["EnableDnsSupport"])

        secondary_vpc = self.secondary_template["Resources"]["VPC"]
        self.assertEqual(secondary_vpc["Type"], "AWS::EC2::VPC")
        self.assertEqual(secondary_vpc["Properties"]["CidrBlock"], "10.1.0.0/16")

    def test_subnet_configuration(self):
        """Test subnet resources are properly configured."""
        # Primary stack subnets
        for subnet_name in ["PrivateSubnet1", "PrivateSubnet2", "PrivateSubnet3"]:
            subnet = self.primary_template["Resources"][subnet_name]
            self.assertEqual(subnet["Type"], "AWS::EC2::Subnet")
            self.assertIn("VpcId", subnet["Properties"])
            self.assertIn("CidrBlock", subnet["Properties"])
            self.assertIn("AvailabilityZone", subnet["Properties"])

        # Secondary stack subnets
        for subnet_name in ["PrivateSubnet1", "PrivateSubnet2", "PrivateSubnet3"]:
            subnet = self.secondary_template["Resources"][subnet_name]
            self.assertEqual(subnet["Type"], "AWS::EC2::Subnet")

    def test_db_subnet_group(self):
        """Test DB subnet group configuration."""
        primary_db_subnet = self.primary_template["Resources"]["DBSubnetGroup"]
        self.assertEqual(primary_db_subnet["Type"], "AWS::RDS::DBSubnetGroup")
        self.assertEqual(len(primary_db_subnet["Properties"]["SubnetIds"]), 3)

        secondary_db_subnet = self.secondary_template["Resources"]["DBSubnetGroup"]
        self.assertEqual(secondary_db_subnet["Type"], "AWS::RDS::DBSubnetGroup")
        self.assertEqual(len(secondary_db_subnet["Properties"]["SubnetIds"]), 3)

    def test_security_groups_no_circular_dependency(self):
        """Test that security groups don't have circular dependencies."""
        # Database security group should not have inline ingress rules
        db_sg = self.primary_template["Resources"]["DatabaseSecurityGroup"]
        self.assertNotIn(
            "SecurityGroupIngress",
            db_sg["Properties"],
            "DatabaseSecurityGroup should not have inline ingress rules"
        )

        # Lambda security group should have minimal inline egress rules
        lambda_sg = self.primary_template["Resources"]["LambdaSecurityGroup"]
        egress_rules = lambda_sg["Properties"].get("SecurityGroupEgress", [])
        # Should only have HTTPS egress inline, MySQL should be separate
        for rule in egress_rules:
            self.assertNotIn(
                "DestinationSecurityGroupId",
                rule,
                "Lambda SG should not reference DB SG in inline egress"
            )

        # Separate security group rules should exist
        self.assertIn("DatabaseSecurityGroupIngress", self.primary_template["Resources"])
        self.assertIn("LambdaSecurityGroupEgress", self.primary_template["Resources"])

    def test_aurora_global_cluster_configuration(self):
        """Test Aurora Global Cluster configuration."""
        global_cluster = self.primary_template["Resources"]["GlobalCluster"]
        self.assertEqual(global_cluster["Type"], "AWS::RDS::GlobalCluster")
        self.assertEqual(global_cluster["Properties"]["Engine"], "aurora-mysql")
        self.assertFalse(
            global_cluster["Properties"]["DeletionProtection"],
            "DeletionProtection must be false for testing"
        )
        self.assertTrue(global_cluster["Properties"]["StorageEncrypted"])

    def test_aurora_db_cluster_configuration(self):
        """Test Aurora DB cluster configuration."""
        db_cluster = self.primary_template["Resources"]["AuroraDBCluster"]
        self.assertEqual(db_cluster["Type"], "AWS::RDS::DBCluster")
        self.assertEqual(db_cluster["DeletionPolicy"], "Delete")
        self.assertFalse(
            db_cluster["Properties"]["DeletionProtection"],
            "DeletionProtection must be false for testing"
        )
        self.assertTrue(db_cluster["Properties"]["StorageEncrypted"])
        self.assertEqual(db_cluster["Properties"]["BackupRetentionPeriod"], 7)
        self.assertIn("DependsOn", db_cluster)
        self.assertEqual(db_cluster["DependsOn"], "GlobalCluster")

    def test_aurora_db_instances(self):
        """Test Aurora DB instances configuration."""
        for instance_name in ["AuroraDBInstance1", "AuroraDBInstance2"]:
            instance = self.primary_template["Resources"][instance_name]
            self.assertEqual(instance["Type"], "AWS::RDS::DBInstance")
            self.assertEqual(instance["Properties"]["Engine"], "aurora-mysql")
            self.assertEqual(instance["Properties"]["DBInstanceClass"], "db.r5.large")
            self.assertFalse(instance["Properties"]["PubliclyAccessible"])

    def test_lambda_execution_role(self):
        """Test Lambda execution role configuration."""
        role = self.primary_template["Resources"]["LambdaExecutionRole"]
        self.assertEqual(role["Type"], "AWS::IAM::Role")

        # Check assume role policy
        assume_policy = role["Properties"]["AssumeRolePolicyDocument"]
        self.assertEqual(assume_policy["Version"], "2012-10-17")

        # Check managed policies
        managed_policies = role["Properties"]["ManagedPolicyArns"]
        self.assertIn(
            "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            managed_policies
        )

        # Check inline policies
        policies = role["Properties"]["Policies"]
        policy_names = [p["PolicyName"] for p in policies]
        self.assertIn("RDSDataAccess", policy_names)
        self.assertIn("CloudWatchLogs", policy_names)

    def test_lambda_function_configuration(self):
        """Test Lambda function configuration."""
        func = self.primary_template["Resources"]["PaymentProcessorFunction"]
        self.assertEqual(func["Type"], "AWS::Lambda::Function")
        self.assertEqual(func["Properties"]["Runtime"], "python3.11")
        self.assertEqual(func["Properties"]["MemorySize"], 1024)
        self.assertEqual(func["Properties"]["ReservedConcurrentExecutions"], 100)
        self.assertIn("VpcConfig", func["Properties"])
        self.assertIn("Code", func["Properties"])

    def test_cloudwatch_alarms(self):
        """Test CloudWatch alarm configuration."""
        # Replication lag alarm
        replication_alarm = self.primary_template["Resources"]["ReplicationLagAlarm"]
        self.assertEqual(replication_alarm["Type"], "AWS::CloudWatch::Alarm")
        self.assertEqual(
            replication_alarm["Properties"]["MetricName"],
            "AuroraGlobalDBReplicationLag"
        )
        self.assertEqual(replication_alarm["Properties"]["Threshold"], 1000)

        # Database CPU alarm
        cpu_alarm = self.primary_template["Resources"]["DatabaseCPUAlarm"]
        self.assertEqual(cpu_alarm["Properties"]["MetricName"], "CPUUtilization")
        self.assertEqual(cpu_alarm["Properties"]["Threshold"], 80)

        # Lambda error alarm
        error_alarm = self.primary_template["Resources"]["LambdaErrorAlarm"]
        self.assertEqual(error_alarm["Properties"]["MetricName"], "Errors")

    def test_sns_topic_configuration(self):
        """Test SNS topic configuration."""
        topic = self.primary_template["Resources"]["FailoverNotificationTopic"]
        self.assertEqual(topic["Type"], "AWS::SNS::Topic")
        self.assertEqual(topic["Properties"]["KmsMasterKeyId"], "alias/aws/sns")

        # Check subscription
        subscription = self.primary_template["Resources"]["FailoverNotificationSubscription"]
        self.assertEqual(subscription["Type"], "AWS::SNS::Subscription")
        self.assertEqual(subscription["Properties"]["Protocol"], "email")

    def test_route53_hosted_zone(self):
        """Test Route 53 hosted zone configuration."""
        hosted_zone = self.primary_template["Resources"]["Route53HostedZone"]
        self.assertEqual(hosted_zone["Type"], "AWS::Route53::HostedZone")

        # Check that it doesn't use reserved domain
        zone_name = hosted_zone["Properties"]["Name"]
        if isinstance(zone_name, dict) and "Fn::Sub" in zone_name:
            zone_template = zone_name["Fn::Sub"]
            self.assertNotIn(
                "example.com",
                zone_template,
                "Should not use reserved domain example.com"
            )
            self.assertIn(
                "test-domain.internal",
                zone_template,
                "Should use test-domain.internal"
            )

    def test_route53_health_check(self):
        """Test Route 53 health check configuration."""
        health_check = self.primary_template["Resources"]["PrimaryHealthCheck"]
        self.assertEqual(health_check["Type"], "AWS::Route53::HealthCheck")
        self.assertIn("DependsOn", health_check)
        self.assertEqual(health_check["DependsOn"], "PrimaryHealthAlarm")

        config = health_check["Properties"]["HealthCheckConfig"]
        self.assertEqual(config["Type"], "CLOUDWATCH_METRIC")
        self.assertIn("AlarmIdentifier", config)

    def test_dns_failover_configuration(self):
        """Test DNS failover record configuration."""
        primary_record = self.primary_template["Resources"]["PrimaryDNSRecord"]
        self.assertEqual(primary_record["Type"], "AWS::Route53::RecordSet")
        self.assertEqual(primary_record["Properties"]["Type"], "CNAME")
        self.assertEqual(primary_record["Properties"]["Failover"], "PRIMARY")
        self.assertEqual(primary_record["Properties"]["TTL"], 60)

    def test_resource_naming_includes_environment_suffix(self):
        """Test that resources use EnvironmentSuffix in naming."""
        resources_to_check = [
            "VPC",
            "DBSubnetGroup",
            "DatabaseSecurityGroup",
            "LambdaSecurityGroup",
            "AuroraDBCluster",
            "LambdaExecutionRole",
            "PaymentProcessorFunction"
        ]

        for resource_name in resources_to_check:
            resource = self.primary_template["Resources"][resource_name]
            properties = resource.get("Properties", {})

            # Find naming property
            naming_props = [
                "VpcId", "GroupName", "DBClusterIdentifier",
                "RoleName", "FunctionName", "DBSubnetGroupName"
            ]

            found_suffix = False
            for prop in naming_props:
                if prop in properties:
                    value = properties[prop]
                    if isinstance(value, dict) and "Fn::Sub" in value:
                        if "${EnvironmentSuffix}" in value["Fn::Sub"]:
                            found_suffix = True
                            break

            # VPC doesn't have naming property in CloudFormation, uses Tags
            if resource_name == "VPC":
                tags = properties.get("Tags", [])
                for tag in tags:
                    if tag["Key"] == "Name" and isinstance(tag["Value"], dict):
                        if "Fn::Sub" in tag["Value"]:
                            if "${EnvironmentSuffix}" in tag["Value"]["Fn::Sub"]:
                                found_suffix = True
                                break

            self.assertTrue(
                found_suffix,
                f"Resource {resource_name} must include EnvironmentSuffix in naming"
            )

    def test_outputs_defined(self):
        """Test that stack outputs are defined."""
        primary_outputs = self.primary_template.get("Outputs", {})
        required_outputs = [
            "VPCId",
            "PrimaryAuroraEndpoint",
            "PrimaryLambdaArn",
            "GlobalClusterId",
            "HostedZoneId",
            "SNSTopicArn"
        ]

        for output in required_outputs:
            self.assertIn(
                output,
                primary_outputs,
                f"Primary stack must have {output} output"
            )

    def test_secondary_stack_references_primary_outputs(self):
        """Test that secondary stack parameters reference primary outputs."""
        secondary_params = self.secondary_template["Parameters"]
        self.assertIn(
            "GlobalClusterIdentifier",
            secondary_params,
            "Secondary stack must accept GlobalClusterIdentifier parameter"
        )
        self.assertIn(
            "HostedZoneId",
            secondary_params,
            "Secondary stack must accept HostedZoneId parameter"
        )

    def test_no_hardcoded_regions(self):
        """Test that templates don't have hardcoded regions in resources."""
        # Check primary template resources
        primary_resources_str = json.dumps(self.primary_template["Resources"])

        # Allow region in comments and intrinsic functions
        # But check for hardcoded values
        self.assertNotIn(
            '"us-west-1"',
            primary_resources_str,
            "Should not have hardcoded us-west-1 in primary template"
        )

    def test_deletion_protection_disabled(self):
        """Test that deletion protection is disabled for testing."""
        # Aurora cluster
        db_cluster = self.primary_template["Resources"]["AuroraDBCluster"]
        self.assertFalse(
            db_cluster["Properties"]["DeletionProtection"],
            "Aurora cluster must have DeletionProtection false"
        )

        # Global cluster
        global_cluster = self.primary_template["Resources"]["GlobalCluster"]
        self.assertFalse(
            global_cluster["Properties"]["DeletionProtection"],
            "Global cluster must have DeletionProtection false"
        )

    def test_encryption_enabled(self):
        """Test that encryption is enabled for data at rest."""
        # Aurora cluster
        db_cluster = self.primary_template["Resources"]["AuroraDBCluster"]
        self.assertTrue(
            db_cluster["Properties"]["StorageEncrypted"],
            "Aurora cluster must have encryption enabled"
        )

        # Global cluster
        global_cluster = self.primary_template["Resources"]["GlobalCluster"]
        self.assertTrue(
            global_cluster["Properties"]["StorageEncrypted"],
            "Global cluster must have encryption enabled"
        )

        # SNS topic
        topic = self.primary_template["Resources"]["FailoverNotificationTopic"]
        self.assertEqual(
            topic["Properties"]["KmsMasterKeyId"],
            "alias/aws/sns",
            "SNS topic must use KMS encryption"
        )

    def test_backup_configuration(self):
        """Test that backup is properly configured."""
        db_cluster = self.primary_template["Resources"]["AuroraDBCluster"]
        self.assertEqual(
            db_cluster["Properties"]["BackupRetentionPeriod"],
            7,
            "Backup retention must be 7 days"
        )
        self.assertIn(
            "PreferredBackupWindow",
            db_cluster["Properties"],
            "Backup window must be specified"
        )

    def test_lambda_logging_configured(self):
        """Test that Lambda logging is configured."""
        log_group = self.primary_template["Resources"]["PaymentProcessorLogGroup"]
        self.assertEqual(log_group["Type"], "AWS::Logs::LogGroup")
        self.assertEqual(
            log_group["Properties"]["RetentionInDays"],
            30,
            "Log retention should be 30 days"
        )

    def test_template_is_valid_json(self):
        """Test that templates are valid JSON."""
        # If we got here, templates loaded successfully as JSON
        self.assertIsInstance(self.primary_template, dict)
        self.assertIsInstance(self.secondary_template, dict)

    def test_resources_section_not_empty(self):
        """Test that Resources section is not empty."""
        self.assertTrue(
            len(self.primary_template.get("Resources", {})) > 0,
            "Primary template must have resources"
        )
        self.assertTrue(
            len(self.secondary_template.get("Resources", {})) > 0,
            "Secondary template must have resources"
        )


if __name__ == "__main__":
    unittest.main()
