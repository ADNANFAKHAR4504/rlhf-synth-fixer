"""
CloudFormation template validation utilities.
Provides validation functions for TapStack CloudFormation templates.
"""
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional


class TemplateValidator:
    """Validates CloudFormation JSON templates."""

    def __init__(self, template_path: str):
        """
        Initialize validator with template path.

        Args:
            template_path: Path to CloudFormation JSON template
        """
        self.template_path = Path(template_path)
        self.template: Optional[Dict[str, Any]] = None
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def load_template(self) -> bool:
        """
        Load and parse CloudFormation template.

        Returns:
            True if successful, False otherwise
        """
        try:
            with open(self.template_path, 'r', encoding='utf-8') as f:
                self.template = json.load(f)
            return True
        except FileNotFoundError:
            self.errors.append(f"Template file not found: {self.template_path}")
            return False
        except json.JSONDecodeError as e:
            self.errors.append(f"Invalid JSON: {str(e)}")
            return False
        except Exception as e:
            self.errors.append(f"Error loading template: {str(e)}")
            return False

    def validate_structure(self) -> bool:
        """
        Validate basic CloudFormation template structure.

        Returns:
            True if structure is valid, False otherwise
        """
        if not self.template:
            self.errors.append("Template not loaded")
            return False

        required_sections = ["AWSTemplateFormatVersion", "Resources"]
        for section in required_sections:
            if section not in self.template:
                self.errors.append(f"Missing required section: {section}")

        if "AWSTemplateFormatVersion" in self.template:
            version = self.template["AWSTemplateFormatVersion"]
            if version != "2010-09-09":
                self.errors.append(f"Invalid AWSTemplateFormatVersion: {version}")

        return len(self.errors) == 0

    def validate_parameters(self) -> bool:
        """
        Validate Parameters section.

        Returns:
            True if parameters are valid, False otherwise
        """
        if not self.template:
            self.errors.append("Template not loaded")
            return False

        if "Parameters" not in self.template:
            self.warnings.append("No Parameters section defined")
            return True

        parameters = self.template["Parameters"]
        for param_name, param_config in parameters.items():
            if "Type" not in param_config:
                self.errors.append(f"Parameter {param_name} missing Type")

            if "Description" not in param_config:
                self.warnings.append(f"Parameter {param_name} missing Description")

            if param_config.get("Type") == "String":
                if "AllowedPattern" in param_config and "ConstraintDescription" not in param_config:
                    self.warnings.append(
                        f"Parameter {param_name} has AllowedPattern but no ConstraintDescription"
                    )

        return len(self.errors) == 0

    def validate_resources(self) -> bool:
        """
        Validate Resources section.

        Returns:
            True if resources are valid, False otherwise
        """
        if not self.template:
            self.errors.append("Template not loaded")
            return False

        if "Resources" not in self.template:
            self.errors.append("Missing Resources section")
            return False

        resources = self.template["Resources"]
        if not resources:
            self.errors.append("Resources section is empty")
            return False

        for resource_name, resource_config in resources.items():
            if "Type" not in resource_config:
                self.errors.append(f"Resource {resource_name} missing Type")

            if "Properties" not in resource_config:
                self.warnings.append(f"Resource {resource_name} has no Properties")

        return len(self.errors) == 0

    def validate_outputs(self) -> bool:
        """
        Validate Outputs section.

        Returns:
            True if outputs are valid, False otherwise
        """
        if not self.template:
            self.errors.append("Template not loaded")
            return False

        if "Outputs" not in self.template:
            self.warnings.append("No Outputs section defined")
            return True

        outputs = self.template["Outputs"]
        for output_name, output_config in outputs.items():
            if "Value" not in output_config:
                self.errors.append(f"Output {output_name} missing Value")

            if "Description" not in output_config:
                self.warnings.append(f"Output {output_name} missing Description")

            if "Export" in output_config:
                if "Name" not in output_config["Export"]:
                    self.errors.append(f"Output {output_name} Export missing Name")

        return len(self.errors) == 0

    def check_environment_suffix_usage(self) -> bool:
        """
        Check that EnvironmentSuffix parameter is used in resource names.

        Returns:
            True if parameter is properly used, False otherwise
        """
        if not self.template:
            self.errors.append("Template not loaded")
            return False

        if "Parameters" not in self.template or "EnvironmentSuffix" not in self.template["Parameters"]:
            self.warnings.append("EnvironmentSuffix parameter not defined")
            return True

        template_str = json.dumps(self.template)
        if "${EnvironmentSuffix}" not in template_str:
            self.warnings.append("EnvironmentSuffix parameter defined but not used")

        return len(self.errors) == 0

    def check_deletion_policies(self) -> bool:
        """
        Check that resources have appropriate DeletionPolicy.

        Returns:
            True if deletion policies are appropriate, False otherwise
        """
        if not self.template:
            self.errors.append("Template not loaded")
            return False

        if "Resources" not in self.template:
            return True

        resources = self.template["Resources"]
        for resource_name, resource_config in resources.items():
            resource_type = resource_config.get("Type", "")

            # Stateful resources should have explicit DeletionPolicy
            if resource_type in [
                "AWS::RDS::DBCluster",
                "AWS::RDS::DBInstance",
                "AWS::S3::Bucket",
                "AWS::DynamoDB::Table"
            ]:
                if "DeletionPolicy" not in resource_config:
                    self.warnings.append(
                        f"Resource {resource_name} ({resource_type}) missing DeletionPolicy"
                    )
                elif resource_config["DeletionPolicy"] == "Retain":
                    self.warnings.append(
                        f"Resource {resource_name} has Retain policy (may prevent stack deletion)"
                    )

        return len(self.errors) == 0

    def check_hardcoded_values(self) -> bool:
        """
        Check for hardcoded environment-specific values.

        Returns:
            True if no hardcoded values found, False otherwise
        """
        if not self.template:
            self.errors.append("Template not loaded")
            return False

        template_str = json.dumps(self.template).lower()

        # Patterns that indicate hardcoded environment values
        hardcoded_patterns = [
            (r'-dev-', "Found hardcoded '-dev-'"),
            (r'-prod-', "Found hardcoded '-prod-'"),
            (r'-staging-', "Found hardcoded '-staging-'"),
            (r'dev-', "Found hardcoded 'dev-' prefix"),
            (r'prod-', "Found hardcoded 'prod-' prefix"),
            (r'staging-', "Found hardcoded 'staging-' prefix"),
        ]

        for pattern, message in hardcoded_patterns:
            if re.search(pattern, template_str):
                self.warnings.append(message)

        return len(self.errors) == 0

    def validate_all(self) -> bool:
        """
        Run all validations.

        Returns:
            True if all validations pass, False otherwise
        """
        if not self.load_template():
            return False

        validations = [
            self.validate_structure(),
            self.validate_parameters(),
            self.validate_resources(),
            self.validate_outputs(),
            self.check_environment_suffix_usage(),
            self.check_deletion_policies(),
            self.check_hardcoded_values(),
        ]

        return all(validations)

    def get_results(self) -> Tuple[List[str], List[str]]:
        """
        Get validation results.

        Returns:
            Tuple of (errors, warnings)
        """
        return (self.errors, self.warnings)

    def get_resource_count(self) -> int:
        """
        Get count of resources in template.

        Returns:
            Number of resources
        """
        if not self.template or "Resources" not in self.template:
            return 0
        return len(self.template["Resources"])

    def get_output_count(self) -> int:
        """
        Get count of outputs in template.

        Returns:
            Number of outputs
        """
        if not self.template or "Outputs" not in self.template:
            return 0
        return len(self.template["Outputs"])

    def get_parameter_count(self) -> int:
        """
        Get count of parameters in template.

        Returns:
            Number of parameters
        """
        if not self.template or "Parameters" not in self.template:
            return 0
        return len(self.template["Parameters"])

    def get_resource_types(self) -> List[str]:
        """
        Get list of resource types in template.

        Returns:
            List of AWS resource types
        """
        if not self.template or "Resources" not in self.template:
            return []

        return [
            resource_config.get("Type", "Unknown")
            for resource_config in self.template["Resources"].values()
        ]

    def has_dynamodb_table(self) -> bool:
        """
        Check if template contains DynamoDB table.

        Returns:
            True if DynamoDB table exists, False otherwise
        """
        return "AWS::DynamoDB::Table" in self.get_resource_types()

    def has_s3_bucket(self) -> bool:
        """
        Check if template contains S3 bucket.

        Returns:
            True if S3 bucket exists, False otherwise
        """
        return "AWS::S3::Bucket" in self.get_resource_types()

    def has_lambda_function(self) -> bool:
        """
        Check if template contains Lambda function.

        Returns:
            True if Lambda function exists, False otherwise
        """
        return "AWS::Lambda::Function" in self.get_resource_types()

    def get_template_size(self) -> int:
        """
        Get template size in bytes.

        Returns:
            Template size in bytes
        """
        if not self.template:
            return 0
        return len(json.dumps(self.template))


def validate_template(template_path: str) -> Tuple[bool, List[str], List[str]]:
    """
    Convenience function to validate a CloudFormation template.

    Args:
        template_path: Path to CloudFormation JSON template

    Returns:
        Tuple of (is_valid, errors, warnings)
    """
    validator = TemplateValidator(template_path)
    is_valid = validator.validate_all()
    errors, warnings = validator.get_results()
    return (is_valid, errors, warnings)
