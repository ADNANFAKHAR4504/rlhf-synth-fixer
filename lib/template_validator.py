"""
CloudFormation Template Validator Module

This module provides functions to validate CloudFormation templates
for multi-region disaster recovery infrastructure.
"""

import json
import os
from typing import Any, Dict, List, Tuple


def load_template(template_path: str) -> Dict[str, Any]:
    """
    Load a CloudFormation template from a JSON file.

    Args:
        template_path: Path to the CloudFormation template JSON file

    Returns:
        Dictionary containing the parsed template

    Raises:
        FileNotFoundError: If template file doesn't exist
        json.JSONDecodeError: If template is invalid JSON
    """
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template not found: {template_path}")

    with open(template_path, "r") as f:
        template = json.load(f)

    return template


def validate_template_structure(template: Dict[str, Any]) -> List[str]:
    """
    Validate basic CloudFormation template structure.

    Args:
        template: CloudFormation template dictionary

    Returns:
        List of validation errors (empty if valid)
    """
    errors = []

    # Check required top-level keys
    if "AWSTemplateFormatVersion" not in template:
        errors.append("Missing AWSTemplateFormatVersion")
    elif template["AWSTemplateFormatVersion"] != "2010-09-09":
        errors.append(f"Invalid format version: {template['AWSTemplateFormatVersion']}")

    if "Resources" not in template:
        errors.append("Missing Resources section")
    elif not template["Resources"]:
        errors.append("Resources section is empty")

    return errors


def validate_parameter_constraints(template: Dict[str, Any]) -> List[str]:
    """
    Validate parameter constraints and patterns.

    Args:
        template: CloudFormation template dictionary

    Returns:
        List of validation errors
    """
    errors = []
    parameters = template.get("Parameters", {})

    # Check EnvironmentSuffix parameter
    if "EnvironmentSuffix" in parameters:
        env_param = parameters["EnvironmentSuffix"]
        if env_param.get("Type") != "String":
            errors.append("EnvironmentSuffix must be of type String")
        if "AllowedPattern" not in env_param:
            errors.append("EnvironmentSuffix must have AllowedPattern")
        if "MinLength" not in env_param:
            errors.append("EnvironmentSuffix must have MinLength")

    # Check DatabasePassword parameter
    if "DatabasePassword" in parameters:
        db_pass = parameters["DatabasePassword"]
        if not db_pass.get("NoEcho", False):
            errors.append("DatabasePassword must have NoEcho set to true")
        if db_pass.get("MinLength", 0) < 8:
            errors.append("DatabasePassword MinLength should be at least 8")

    return errors


def validate_security_groups(template: Dict[str, Any]) -> List[str]:
    """
    Validate security group configuration to avoid circular dependencies.

    Args:
        template: CloudFormation template dictionary

    Returns:
        List of validation errors
    """
    errors = []
    resources = template.get("Resources", {})

    # Check for security groups with circular references
    for resource_name, resource in resources.items():
        if resource.get("Type") == "AWS::EC2::SecurityGroup":
            properties = resource.get("Properties", {})

            # Check ingress rules for references to other security groups
            ingress_rules = properties.get("SecurityGroupIngress", [])
            for rule in ingress_rules:
                if "SourceSecurityGroupId" in rule and isinstance(rule["SourceSecurityGroupId"], dict):
                    if "Ref" in rule["SourceSecurityGroupId"]:
                        # This could cause circular dependency
                        errors.append(
                            f"{resource_name} has inline ingress rule referencing another SG. "
                            "Consider using AWS::EC2::SecurityGroupIngress resource."
                        )

            # Check egress rules
            egress_rules = properties.get("SecurityGroupEgress", [])
            for rule in egress_rules:
                if "DestinationSecurityGroupId" in rule and isinstance(rule["DestinationSecurityGroupId"], dict):
                    if "Ref" in rule["DestinationSecurityGroupId"]:
                        # Check if this references a SG that references back
                        ref_sg = rule["DestinationSecurityGroupId"]["Ref"]
                        if ref_sg in resources and resources[ref_sg].get("Type") == "AWS::EC2::SecurityGroup":
                            ref_sg_props = resources[ref_sg].get("Properties", {})
                            ref_sg_ingress = ref_sg_props.get("SecurityGroupIngress", [])
                            for ing_rule in ref_sg_ingress:
                                if "SourceSecurityGroupId" in ing_rule:
                                    if isinstance(ing_rule["SourceSecurityGroupId"], dict):
                                        if ing_rule["SourceSecurityGroupId"].get("Ref") == resource_name:
                                            errors.append(
                                                f"Circular dependency detected between {resource_name} and {ref_sg}"
                                            )

    return errors


def validate_aurora_configuration(template: Dict[str, Any]) -> List[str]:
    """
    Validate Aurora database cluster configuration.

    Args:
        template: CloudFormation template dictionary

    Returns:
        List of validation errors
    """
    errors = []
    resources = template.get("Resources", {})

    for resource_name, resource in resources.items():
        if resource.get("Type") == "AWS::RDS::DBCluster":
            properties = resource.get("Properties", {})

            # Check deletion protection
            if properties.get("DeletionProtection", True):
                errors.append(
                    f"{resource_name}: DeletionProtection should be false for testing"
                )

            # Check deletion policy
            if resource.get("DeletionPolicy") != "Delete":
                errors.append(
                    f"{resource_name}: DeletionPolicy should be Delete for testing"
                )

            # Check encryption
            if not properties.get("StorageEncrypted", False):
                errors.append(
                    f"{resource_name}: StorageEncrypted should be true"
                )

            # Check backup retention (only for primary clusters)
            # Secondary clusters in Global Database inherit backup settings
            if "GlobalClusterIdentifier" in properties:
                global_id = properties["GlobalClusterIdentifier"]
                # If it's a Ref to parameter, it's a secondary cluster
                is_secondary = isinstance(global_id, dict) and "Ref" in global_id

                if not is_secondary:
                    # Primary cluster - check DependsOn
                    if "DependsOn" not in resource:
                        errors.append(
                            f"{resource_name}: Should have DependsOn GlobalCluster"
                        )
                    elif resource["DependsOn"] != "GlobalCluster":
                        errors.append(
                            f"{resource_name}: DependsOn should be GlobalCluster"
                        )

                    # Primary cluster - check backup retention
                    if properties.get("BackupRetentionPeriod", 0) < 7:
                        errors.append(
                            f"{resource_name}: BackupRetentionPeriod should be at least 7 days"
                        )
            else:
                # Non-global cluster - check backup retention
                if properties.get("BackupRetentionPeriod", 0) < 7:
                    errors.append(
                        f"{resource_name}: BackupRetentionPeriod should be at least 7 days"
                    )

    return errors


def validate_lambda_configuration(template: Dict[str, Any]) -> List[str]:
    """
    Validate Lambda function configuration.

    Args:
        template: CloudFormation template dictionary

    Returns:
        List of validation errors
    """
    errors = []
    resources = template.get("Resources", {})

    for resource_name, resource in resources.items():
        if resource.get("Type") == "AWS::Lambda::Function":
            properties = resource.get("Properties", {})

            # Check reserved concurrency
            if "ReservedConcurrentExecutions" not in properties:
                errors.append(
                    f"{resource_name}: Missing ReservedConcurrentExecutions"
                )
            elif properties["ReservedConcurrentExecutions"] != 100:
                errors.append(
                    f"{resource_name}: ReservedConcurrentExecutions should be 100"
                )

            # Check memory size
            if properties.get("MemorySize") != 1024:
                errors.append(
                    f"{resource_name}: MemorySize should be 1024 (1GB)"
                )

            # Check VPC configuration
            if "VpcConfig" not in properties:
                errors.append(
                    f"{resource_name}: Missing VpcConfig for VPC-attached Lambda"
                )

    return errors


def validate_environment_suffix_usage(template: Dict[str, Any]) -> List[str]:
    """
    Validate that EnvironmentSuffix is used in resource naming.

    Args:
        template: CloudFormation template dictionary

    Returns:
        List of validation warnings
    """
    warnings = []
    resources = template.get("Resources", {})

    naming_properties = {
        "AWS::EC2::VPC": ["Tags"],
        "AWS::RDS::DBCluster": ["DBClusterIdentifier"],
        "AWS::RDS::DBSubnetGroup": ["DBSubnetGroupName"],
        "AWS::EC2::SecurityGroup": ["GroupName"],
        "AWS::IAM::Role": ["RoleName"],
        "AWS::Lambda::Function": ["FunctionName"],
        "AWS::SNS::Topic": ["TopicName"],
        "AWS::CloudWatch::Alarm": ["AlarmName"],
        "AWS::Logs::LogGroup": ["LogGroupName"]
    }

    for resource_name, resource in resources.items():
        resource_type = resource.get("Type")
        if resource_type in naming_properties:
            properties = resource.get("Properties", {})
            has_suffix = False

            for prop in naming_properties[resource_type]:
                if prop in properties:
                    value = properties[prop]

                    # Check for Fn::Sub with EnvironmentSuffix
                    if isinstance(value, dict) and "Fn::Sub" in value:
                        if "${EnvironmentSuffix}" in value["Fn::Sub"]:
                            has_suffix = True
                            break

                    # Check Tags for VPC
                    if prop == "Tags" and isinstance(value, list):
                        for tag in value:
                            if tag.get("Key") == "Name" and isinstance(tag.get("Value"), dict):
                                if "Fn::Sub" in tag["Value"]:
                                    if "${EnvironmentSuffix}" in tag["Value"]["Fn::Sub"]:
                                        has_suffix = True
                                        break

            if not has_suffix:
                warnings.append(
                    f"{resource_name} ({resource_type}): Should include EnvironmentSuffix in naming"
                )

    return warnings


def validate_route53_configuration(template: Dict[str, Any]) -> List[str]:
    """
    Validate Route 53 configuration.

    Args:
        template: CloudFormation template dictionary

    Returns:
        List of validation errors
    """
    errors = []
    resources = template.get("Resources", {})

    for resource_name, resource in resources.items():
        if resource.get("Type") == "AWS::Route53::HostedZone":
            properties = resource.get("Properties", {})
            zone_name = properties.get("Name", {})

            # Check for reserved domain
            if isinstance(zone_name, dict) and "Fn::Sub" in zone_name:
                if "example.com" in zone_name["Fn::Sub"]:
                    errors.append(
                        f"{resource_name}: Should not use reserved domain example.com"
                    )

        elif resource.get("Type") == "AWS::Route53::HealthCheck":
            # Check that health check has DependsOn for alarm
            if "DependsOn" not in resource:
                errors.append(
                    f"{resource_name}: Should have DependsOn for CloudWatch alarm"
                )

    return errors


def validate_outputs(template: Dict[str, Any], required_outputs: List[str]) -> List[str]:
    """
    Validate that required outputs are defined.

    Args:
        template: CloudFormation template dictionary
        required_outputs: List of required output names

    Returns:
        List of validation errors
    """
    errors = []
    outputs = template.get("Outputs", {})

    for required_output in required_outputs:
        if required_output not in outputs:
            errors.append(f"Missing required output: {required_output}")
        else:
            output = outputs[required_output]
            if "Description" not in output:
                errors.append(f"Output {required_output} missing Description")
            if "Value" not in output:
                errors.append(f"Output {required_output} missing Value")

    return errors


def validate_template_complete(
    template_path: str,
    stack_type: str = "primary"
) -> Tuple[bool, List[str], List[str]]:
    """
    Perform complete validation of a CloudFormation template.

    Args:
        template_path: Path to the template file
        stack_type: Type of stack ("primary" or "secondary")

    Returns:
        Tuple of (is_valid, errors, warnings)
    """
    all_errors = []
    all_warnings = []

    try:
        template = load_template(template_path)
    except Exception as e:
        return False, [f"Failed to load template: {str(e)}"], []

    # Run all validation checks
    all_errors.extend(validate_template_structure(template))
    all_errors.extend(validate_parameter_constraints(template))
    all_errors.extend(validate_security_groups(template))
    all_errors.extend(validate_aurora_configuration(template))
    all_errors.extend(validate_lambda_configuration(template))
    all_errors.extend(validate_route53_configuration(template))

    all_warnings.extend(validate_environment_suffix_usage(template))

    # Stack-specific validation
    if stack_type == "primary":
        required_outputs = [
            "VPCId",
            "PrimaryAuroraEndpoint",
            "PrimaryLambdaArn",
            "GlobalClusterId",
            "HostedZoneId",
            "SNSTopicArn"
        ]
    else:
        required_outputs = [
            "VPCId",
            "SecondaryAuroraEndpoint",
            "SecondaryLambdaArn",
            "SNSTopicArn"
        ]

    all_errors.extend(validate_outputs(template, required_outputs))

    is_valid = len(all_errors) == 0

    return is_valid, all_errors, all_warnings


def get_template_resources_count(template_path: str) -> int:
    """
    Get the count of resources in a CloudFormation template.

    Args:
        template_path: Path to the template file

    Returns:
        Number of resources in the template
    """
    try:
        template = load_template(template_path)
        return len(template.get("Resources", {}))
    except Exception:
        return 0


def get_template_parameters_count(template_path: str) -> int:
    """
    Get the count of parameters in a CloudFormation template.

    Args:
        template_path: Path to the template file

    Returns:
        Number of parameters in the template
    """
    try:
        template = load_template(template_path)
        return len(template.get("Parameters", {}))
    except Exception:
        return 0
