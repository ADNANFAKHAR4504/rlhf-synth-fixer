"""
Unit tests for template_validator module.

This test suite validates the validator functions that check CloudFormation
template compliance, security, and best practices.
"""

import json
import os
import tempfile
import unittest
from lib import template_validator


class TestTemplateValidator(unittest.TestCase):
    """Unit tests for template validator functions."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures."""
        cls.base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cls.primary_template_path = os.path.join(cls.base_path, "lib", "primary-stack.json")
        cls.secondary_template_path = os.path.join(cls.base_path, "lib", "secondary-stack.json")

    def test_load_template_success(self):
        """Test loading a valid CloudFormation template."""
        template = template_validator.load_template(self.primary_template_path)
        self.assertIsInstance(template, dict)
        self.assertIn("AWSTemplateFormatVersion", template)

    def test_load_template_file_not_found(self):
        """Test loading a non-existent template."""
        with self.assertRaises(FileNotFoundError):
            template_validator.load_template("/non/existent/template.json")

    def test_load_template_invalid_json(self):
        """Test loading an invalid JSON file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write("{ invalid json }")
            temp_file = f.name

        try:
            with self.assertRaises(json.JSONDecodeError):
                template_validator.load_template(temp_file)
        finally:
            os.unlink(temp_file)

    def test_validate_template_structure_valid(self):
        """Test validation of valid template structure."""
        template = template_validator.load_template(self.primary_template_path)
        errors = template_validator.validate_template_structure(template)
        self.assertEqual(len(errors), 0, f"Template should be valid, got errors: {errors}")

    def test_validate_template_structure_missing_version(self):
        """Test validation with missing format version."""
        template = {"Resources": {"Test": {"Type": "AWS::S3::Bucket"}}}
        errors = template_validator.validate_template_structure(template)
        self.assertIn("Missing AWSTemplateFormatVersion", errors)

    def test_validate_template_structure_wrong_version(self):
        """Test validation with wrong format version."""
        template = {
            "AWSTemplateFormatVersion": "2009-09-09",
            "Resources": {"Test": {"Type": "AWS::S3::Bucket"}}
        }
        errors = template_validator.validate_template_structure(template)
        self.assertTrue(any("Invalid format version" in e for e in errors))

    def test_validate_template_structure_missing_resources(self):
        """Test validation with missing resources."""
        template = {"AWSTemplateFormatVersion": "2010-09-09"}
        errors = template_validator.validate_template_structure(template)
        self.assertIn("Missing Resources section", errors)

    def test_validate_template_structure_empty_resources(self):
        """Test validation with empty resources."""
        template = {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Resources": {}
        }
        errors = template_validator.validate_template_structure(template)
        self.assertIn("Resources section is empty", errors)

    def test_validate_parameter_constraints_valid(self):
        """Test validation of valid parameter constraints."""
        template = template_validator.load_template(self.primary_template_path)
        errors = template_validator.validate_parameter_constraints(template)
        self.assertEqual(len(errors), 0, f"Parameters should be valid, got errors: {errors}")

    def test_validate_parameter_constraints_environment_suffix(self):
        """Test EnvironmentSuffix parameter validation."""
        template = {
            "Parameters": {
                "EnvironmentSuffix": {
                    "Type": "Number"  # Wrong type
                }
            }
        }
        errors = template_validator.validate_parameter_constraints(template)
        self.assertTrue(any("EnvironmentSuffix must be of type String" in e for e in errors))

    def test_validate_parameter_constraints_missing_allowed_pattern(self):
        """Test EnvironmentSuffix missing AllowedPattern."""
        template = {
            "Parameters": {
                "EnvironmentSuffix": {
                    "Type": "String",
                    "MinLength": 3
                }
            }
        }
        errors = template_validator.validate_parameter_constraints(template)
        self.assertTrue(any("AllowedPattern" in e for e in errors))

    def test_validate_parameter_constraints_database_password_no_echo(self):
        """Test DatabasePassword NoEcho validation."""
        template = {
            "Parameters": {
                "DatabasePassword": {
                    "Type": "String",
                    "NoEcho": False,  # Should be true
                    "MinLength": 8
                }
            }
        }
        errors = template_validator.validate_parameter_constraints(template)
        self.assertTrue(any("NoEcho" in e for e in errors))

    def test_validate_parameter_constraints_password_min_length(self):
        """Test DatabasePassword minimum length validation."""
        template = {
            "Parameters": {
                "DatabasePassword": {
                    "Type": "String",
                    "NoEcho": True,
                    "MinLength": 4  # Too short
                }
            }
        }
        errors = template_validator.validate_parameter_constraints(template)
        self.assertTrue(any("MinLength" in e and "8" in e for e in errors))

    def test_validate_security_groups_no_circular_dependency(self):
        """Test that actual templates have no circular dependencies."""
        template = template_validator.load_template(self.primary_template_path)
        errors = template_validator.validate_security_groups(template)
        # Should not have circular dependencies after our fixes
        circular_errors = [e for e in errors if "Circular dependency" in e]
        self.assertEqual(len(circular_errors), 0, f"Should not have circular dependencies: {circular_errors}")

    def test_validate_security_groups_inline_reference_warning(self):
        """Test detection of inline security group references."""
        template = {
            "Resources": {
                "SG1": {
                    "Type": "AWS::EC2::SecurityGroup",
                    "Properties": {
                        "SecurityGroupIngress": [
                            {
                                "IpProtocol": "tcp",
                                "FromPort": 80,
                                "ToPort": 80,
                                "SourceSecurityGroupId": {"Ref": "SG2"}
                            }
                        ]
                    }
                }
            }
        }
        errors = template_validator.validate_security_groups(template)
        self.assertTrue(any("inline ingress rule" in e for e in errors))

    def test_validate_aurora_configuration_valid(self):
        """Test validation of valid Aurora configuration."""
        template = template_validator.load_template(self.primary_template_path)
        errors = template_validator.validate_aurora_configuration(template)
        self.assertEqual(len(errors), 0, f"Aurora configuration should be valid, got errors: {errors}")

    def test_validate_aurora_deletion_protection(self):
        """Test Aurora deletion protection validation."""
        template = {
            "Resources": {
                "DBCluster": {
                    "Type": "AWS::RDS::DBCluster",
                    "Properties": {
                        "DeletionProtection": True,  # Should be false
                        "StorageEncrypted": True,
                        "BackupRetentionPeriod": 7
                    }
                }
            }
        }
        errors = template_validator.validate_aurora_configuration(template)
        self.assertTrue(any("DeletionProtection" in e for e in errors))

    def test_validate_aurora_deletion_policy(self):
        """Test Aurora deletion policy validation."""
        template = {
            "Resources": {
                "DBCluster": {
                    "Type": "AWS::RDS::DBCluster",
                    "DeletionPolicy": "Retain",  # Should be Delete
                    "Properties": {
                        "DeletionProtection": False,
                        "StorageEncrypted": True,
                        "BackupRetentionPeriod": 7
                    }
                }
            }
        }
        errors = template_validator.validate_aurora_configuration(template)
        self.assertTrue(any("DeletionPolicy" in e for e in errors))

    def test_validate_aurora_encryption(self):
        """Test Aurora encryption validation."""
        template = {
            "Resources": {
                "DBCluster": {
                    "Type": "AWS::RDS::DBCluster",
                    "DeletionPolicy": "Delete",
                    "Properties": {
                        "DeletionProtection": False,
                        "StorageEncrypted": False,  # Should be true
                        "BackupRetentionPeriod": 7
                    }
                }
            }
        }
        errors = template_validator.validate_aurora_configuration(template)
        self.assertTrue(any("StorageEncrypted" in e for e in errors))

    def test_validate_aurora_backup_retention(self):
        """Test Aurora backup retention validation."""
        template = {
            "Resources": {
                "DBCluster": {
                    "Type": "AWS::RDS::DBCluster",
                    "DeletionPolicy": "Delete",
                    "Properties": {
                        "DeletionProtection": False,
                        "StorageEncrypted": True,
                        "BackupRetentionPeriod": 3  # Too short
                    }
                }
            }
        }
        errors = template_validator.validate_aurora_configuration(template)
        self.assertTrue(any("BackupRetentionPeriod" in e for e in errors))

    def test_validate_aurora_global_cluster_dependency(self):
        """Test Aurora global cluster dependency validation."""
        template = {
            "Resources": {
                "DBCluster": {
                    "Type": "AWS::RDS::DBCluster",
                    "DeletionPolicy": "Delete",
                    "Properties": {
                        "DeletionProtection": False,
                        "StorageEncrypted": True,
                        "BackupRetentionPeriod": 7,
                        "GlobalClusterIdentifier": {"Fn::Sub": "global-${EnvironmentSuffix}"}
                    }
                }
            }
        }
        errors = template_validator.validate_aurora_configuration(template)
        self.assertTrue(any("DependsOn" in e for e in errors))

    def test_validate_lambda_configuration_valid(self):
        """Test validation of valid Lambda configuration."""
        template = template_validator.load_template(self.primary_template_path)
        errors = template_validator.validate_lambda_configuration(template)
        self.assertEqual(len(errors), 0, f"Lambda configuration should be valid, got errors: {errors}")

    def test_validate_lambda_reserved_concurrency(self):
        """Test Lambda reserved concurrency validation."""
        template = {
            "Resources": {
                "Func": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "MemorySize": 1024,
                        "VpcConfig": {}
                    }
                }
            }
        }
        errors = template_validator.validate_lambda_configuration(template)
        self.assertTrue(any("ReservedConcurrentExecutions" in e for e in errors))

    def test_validate_lambda_reserved_concurrency_value(self):
        """Test Lambda reserved concurrency value validation."""
        template = {
            "Resources": {
                "Func": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "ReservedConcurrentExecutions": 50,  # Should be 100
                        "MemorySize": 1024,
                        "VpcConfig": {}
                    }
                }
            }
        }
        errors = template_validator.validate_lambda_configuration(template)
        self.assertTrue(any("100" in e for e in errors))

    def test_validate_lambda_memory_size(self):
        """Test Lambda memory size validation."""
        template = {
            "Resources": {
                "Func": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "ReservedConcurrentExecutions": 100,
                        "MemorySize": 512,  # Should be 1024
                        "VpcConfig": {}
                    }
                }
            }
        }
        errors = template_validator.validate_lambda_configuration(template)
        self.assertTrue(any("MemorySize" in e and "1024" in e for e in errors))

    def test_validate_lambda_vpc_config(self):
        """Test Lambda VPC configuration validation."""
        template = {
            "Resources": {
                "Func": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "ReservedConcurrentExecutions": 100,
                        "MemorySize": 1024
                    }
                }
            }
        }
        errors = template_validator.validate_lambda_configuration(template)
        self.assertTrue(any("VpcConfig" in e for e in errors))

    def test_validate_environment_suffix_usage(self):
        """Test environment suffix usage validation."""
        template = template_validator.load_template(self.primary_template_path)
        warnings = template_validator.validate_environment_suffix_usage(template)
        # Most resources should have environment suffix
        self.assertTrue(len(warnings) < 5, f"Too many resources missing environment suffix: {warnings}")

    def test_validate_environment_suffix_missing(self):
        """Test detection of missing environment suffix."""
        template = {
            "Resources": {
                "MyBucket": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "FunctionName": "hardcoded-name"  # No environment suffix
                    }
                }
            }
        }
        warnings = template_validator.validate_environment_suffix_usage(template)
        self.assertTrue(len(warnings) > 0)

    def test_validate_route53_configuration_valid(self):
        """Test validation of valid Route 53 configuration."""
        template = template_validator.load_template(self.primary_template_path)
        errors = template_validator.validate_route53_configuration(template)
        self.assertEqual(len(errors), 0, f"Route 53 configuration should be valid, got errors: {errors}")

    def test_validate_route53_reserved_domain(self):
        """Test detection of reserved domain usage."""
        template = {
            "Resources": {
                "HostedZone": {
                    "Type": "AWS::Route53::HostedZone",
                    "Properties": {
                        "Name": {"Fn::Sub": "myapp-${EnvironmentSuffix}.example.com"}
                    }
                }
            }
        }
        errors = template_validator.validate_route53_configuration(template)
        self.assertTrue(any("reserved domain" in e for e in errors))

    def test_validate_route53_health_check_dependency(self):
        """Test Route 53 health check dependency validation."""
        template = {
            "Resources": {
                "HealthCheck": {
                    "Type": "AWS::Route53::HealthCheck",
                    "Properties": {
                        "HealthCheckConfig": {}
                    }
                }
            }
        }
        errors = template_validator.validate_route53_configuration(template)
        self.assertTrue(any("DependsOn" in e for e in errors))

    def test_validate_outputs_valid(self):
        """Test validation of valid outputs."""
        template = template_validator.load_template(self.primary_template_path)
        required_outputs = [
            "VPCId",
            "PrimaryAuroraEndpoint",
            "PrimaryLambdaArn",
            "GlobalClusterId",
            "HostedZoneId",
            "SNSTopicArn"
        ]
        errors = template_validator.validate_outputs(template, required_outputs)
        self.assertEqual(len(errors), 0, f"Outputs should be valid, got errors: {errors}")

    def test_validate_outputs_missing(self):
        """Test detection of missing outputs."""
        template = {"Outputs": {}}
        required_outputs = ["VPCId", "EndpointUrl"]
        errors = template_validator.validate_outputs(template, required_outputs)
        self.assertEqual(len(errors), 2)
        self.assertTrue(any("VPCId" in e for e in errors))
        self.assertTrue(any("EndpointUrl" in e for e in errors))

    def test_validate_outputs_missing_description(self):
        """Test detection of outputs missing description."""
        template = {
            "Outputs": {
                "VPCId": {
                    "Value": {"Ref": "VPC"}
                }
            }
        }
        errors = template_validator.validate_outputs(template, ["VPCId"])
        self.assertTrue(any("Description" in e for e in errors))

    def test_validate_outputs_missing_value(self):
        """Test detection of outputs missing value."""
        template = {
            "Outputs": {
                "VPCId": {
                    "Description": "VPC ID"
                }
            }
        }
        errors = template_validator.validate_outputs(template, ["VPCId"])
        self.assertTrue(any("Value" in e for e in errors))

    def test_validate_template_complete_primary(self):
        """Test complete validation of primary template."""
        is_valid, errors, warnings = template_validator.validate_template_complete(
            self.primary_template_path,
            "primary"
        )
        self.assertTrue(is_valid, f"Primary template should be valid. Errors: {errors}")
        self.assertEqual(len(errors), 0)

    def test_validate_template_complete_secondary(self):
        """Test complete validation of secondary template."""
        is_valid, errors, warnings = template_validator.validate_template_complete(
            self.secondary_template_path,
            "secondary"
        )
        self.assertTrue(is_valid, f"Secondary template should be valid. Errors: {errors}")
        self.assertEqual(len(errors), 0)

    def test_validate_template_complete_invalid_path(self):
        """Test complete validation with invalid path."""
        is_valid, errors, warnings = template_validator.validate_template_complete(
            "/non/existent/path.json"
        )
        self.assertFalse(is_valid)
        self.assertTrue(len(errors) > 0)
        self.assertTrue(any("Failed to load" in e for e in errors))

    def test_get_template_resources_count(self):
        """Test getting resource count from template."""
        count = template_validator.get_template_resources_count(self.primary_template_path)
        self.assertGreater(count, 20, "Primary template should have many resources")

    def test_get_template_resources_count_invalid(self):
        """Test getting resource count from invalid template."""
        count = template_validator.get_template_resources_count("/non/existent.json")
        self.assertEqual(count, 0)

    def test_get_template_parameters_count(self):
        """Test getting parameter count from template."""
        count = template_validator.get_template_parameters_count(self.primary_template_path)
        self.assertEqual(count, 4, "Primary template should have 4 parameters")

    def test_get_template_parameters_count_invalid(self):
        """Test getting parameter count from invalid template."""
        count = template_validator.get_template_parameters_count("/non/existent.json")
        self.assertEqual(count, 0)

    def test_validate_security_groups_circular_dependency_detected(self):
        """Test detection of actual circular dependency between security groups."""
        template = {
            "Resources": {
                "SG1": {
                    "Type": "AWS::EC2::SecurityGroup",
                    "Properties": {
                        "SecurityGroupEgress": [
                            {
                                "IpProtocol": "tcp",
                                "FromPort": 3306,
                                "ToPort": 3306,
                                "DestinationSecurityGroupId": {"Ref": "SG2"}
                            }
                        ]
                    }
                },
                "SG2": {
                    "Type": "AWS::EC2::SecurityGroup",
                    "Properties": {
                        "SecurityGroupIngress": [
                            {
                                "IpProtocol": "tcp",
                                "FromPort": 3306,
                                "ToPort": 3306,
                                "SourceSecurityGroupId": {"Ref": "SG1"}
                            }
                        ]
                    }
                }
            }
        }
        errors = template_validator.validate_security_groups(template)
        self.assertTrue(any("Circular dependency" in e for e in errors))

    def test_validate_aurora_with_non_global_cluster(self):
        """Test Aurora validation for non-global cluster."""
        template = {
            "Resources": {
                "DBCluster": {
                    "Type": "AWS::RDS::DBCluster",
                    "DeletionPolicy": "Delete",
                    "Properties": {
                        "DeletionProtection": False,
                        "StorageEncrypted": True,
                        "BackupRetentionPeriod": 5  # Less than 7, should fail
                    }
                }
            }
        }
        errors = template_validator.validate_aurora_configuration(template)
        self.assertTrue(any("BackupRetentionPeriod" in e and "7" in e for e in errors))

    def test_validate_aurora_wrong_depends_on(self):
        """Test Aurora validation with wrong DependsOn value."""
        template = {
            "Resources": {
                "DBCluster": {
                    "Type": "AWS::RDS::DBCluster",
                    "DeletionPolicy": "Delete",
                    "DependsOn": "WrongResource",  # Should be GlobalCluster
                    "Properties": {
                        "DeletionProtection": False,
                        "StorageEncrypted": True,
                        "BackupRetentionPeriod": 7,
                        "GlobalClusterIdentifier": {"Fn::Sub": "global-${EnvironmentSuffix}"}
                    }
                }
            }
        }
        errors = template_validator.validate_aurora_configuration(template)
        self.assertTrue(any("DependsOn should be GlobalCluster" in e for e in errors))

    def test_validate_environment_suffix_with_vpc_tags(self):
        """Test environment suffix validation with VPC resource."""
        template = {
            "Resources": {
                "VPC": {
                    "Type": "AWS::EC2::VPC",
                    "Properties": {
                        "CidrBlock": "10.0.0.0/16",
                        "Tags": [
                            {
                                "Key": "Name",
                                "Value": {"Fn::Sub": "vpc-${EnvironmentSuffix}"}
                            }
                        ]
                    }
                }
            }
        }
        warnings = template_validator.validate_environment_suffix_usage(template)
        # Should not have warnings for VPC with environment suffix in tags
        vpc_warnings = [w for w in warnings if "VPC" in w]
        self.assertEqual(len(vpc_warnings), 0)

    def test_validate_environment_suffix_missing_in_vpc(self):
        """Test environment suffix missing in VPC tags."""
        template = {
            "Resources": {
                "VPC": {
                    "Type": "AWS::EC2::VPC",
                    "Properties": {
                        "CidrBlock": "10.0.0.0/16",
                        "Tags": [
                            {
                                "Key": "Name",
                                "Value": "hardcoded-vpc-name"  # No environment suffix
                            }
                        ]
                    }
                }
            }
        }
        warnings = template_validator.validate_environment_suffix_usage(template)
        self.assertTrue(any("VPC" in w for w in warnings))


if __name__ == "__main__":
    unittest.main()
