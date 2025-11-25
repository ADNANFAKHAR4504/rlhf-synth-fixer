"""
Python module representing the Aurora Global Database CloudFormation template.
This module provides programmatic access to the template structure and validates its contents.
"""
import json
from pathlib import Path
from typing import Dict, Any, List


class TapStack:
    """Represents the Aurora Global Database CloudFormation stack."""

    def __init__(self):
        """Initialize TapStack by loading the CloudFormation template."""
        self.template_path = Path(__file__).parent / "TapStack.json"
        self.template = self._load_template()

    def _load_template(self) -> Dict[str, Any]:
        """Load CloudFormation template from JSON file."""
        with open(self.template_path, "r") as f:
            return json.load(f)

    def get_template(self) -> Dict[str, Any]:
        """Get the full CloudFormation template."""
        return self.template

    def get_format_version(self) -> str:
        """Get CloudFormation template format version."""
        return self.template.get("AWSTemplateFormatVersion", "")

    def get_description(self) -> str:
        """Get template description."""
        return self.template.get("Description", "")

    def get_parameters(self) -> Dict[str, Any]:
        """Get template parameters."""
        return self.template.get("Parameters", {})

    def get_parameter(self, param_name: str) -> Dict[str, Any]:
        """Get specific parameter configuration."""
        params = self.get_parameters()
        if param_name not in params:
            raise KeyError(f"Parameter {param_name} not found in template")
        return params[param_name]

    def get_resources(self) -> Dict[str, Any]:
        """Get all template resources."""
        return self.template.get("Resources", {})

    def get_resource(self, resource_name: str) -> Dict[str, Any]:
        """Get specific resource configuration."""
        resources = self.get_resources()
        if resource_name not in resources:
            raise KeyError(f"Resource {resource_name} not found in template")
        return resources[resource_name]

    def get_resource_type(self, resource_name: str) -> str:
        """Get the type of a specific resource."""
        resource = self.get_resource(resource_name)
        return resource.get("Type", "")

    def get_resource_properties(self, resource_name: str) -> Dict[str, Any]:
        """Get properties of a specific resource."""
        resource = self.get_resource(resource_name)
        return resource.get("Properties", {})

    def get_outputs(self) -> Dict[str, Any]:
        """Get template outputs."""
        return self.template.get("Outputs", {})

    def get_output(self, output_name: str) -> Dict[str, Any]:
        """Get specific output configuration."""
        outputs = self.get_outputs()
        if output_name not in outputs:
            raise KeyError(f"Output {output_name} not found in template")
        return outputs[output_name]

    def has_parameter(self, param_name: str) -> bool:
        """Check if parameter exists."""
        return param_name in self.get_parameters()

    def has_resource(self, resource_name: str) -> bool:
        """Check if resource exists."""
        return resource_name in self.get_resources()

    def has_output(self, output_name: str) -> bool:
        """Check if output exists."""
        return output_name in self.get_outputs()

    def list_resource_names(self) -> List[str]:
        """List all resource names."""
        return list(self.get_resources().keys())

    def list_resource_types(self) -> List[str]:
        """List all unique resource types."""
        resources = self.get_resources()
        return list(set(res.get("Type", "") for res in resources.values()))

    def list_parameter_names(self) -> List[str]:
        """List all parameter names."""
        return list(self.get_parameters().keys())

    def list_output_names(self) -> List[str]:
        """List all output names."""
        return list(self.get_outputs().keys())

    def get_vpc_resource(self) -> Dict[str, Any]:
        """Get VPC resource configuration."""
        return self.get_resource("VPC")

    def get_subnet_resources(self) -> Dict[str, Dict[str, Any]]:
        """Get all subnet resources."""
        resources = self.get_resources()
        return {
            name: resource
            for name, resource in resources.items()
            if resource.get("Type") == "AWS::EC2::Subnet"
        }

    def get_db_cluster_resource(self) -> Dict[str, Any]:
        """Get DB cluster resource configuration."""
        return self.get_resource("DBCluster")

    def get_global_cluster_resource(self) -> Dict[str, Any]:
        """Get global cluster resource configuration."""
        return self.get_resource("GlobalCluster")

    def get_db_instances(self) -> Dict[str, Dict[str, Any]]:
        """Get all DB instance resources."""
        resources = self.get_resources()
        return {
            name: resource
            for name, resource in resources.items()
            if resource.get("Type") == "AWS::RDS::DBInstance"
        }

    def get_security_group_resource(self) -> Dict[str, Any]:
        """Get DB security group resource configuration."""
        return self.get_resource("DBSecurityGroup")

    def get_db_subnet_group_resource(self) -> Dict[str, Any]:
        """Get DB subnet group resource configuration."""
        return self.get_resource("DBSubnetGroup")

    def get_secret_resource(self) -> Dict[str, Any]:
        """Get database secret resource configuration."""
        return self.get_resource("DatabaseSecret")

    def validate_template_structure(self) -> bool:
        """Validate basic template structure."""
        required_keys = ["AWSTemplateFormatVersion", "Resources"]
        return all(key in self.template for key in required_keys)

    def validate_resources_have_types(self) -> bool:
        """Validate all resources have a Type property."""
        resources = self.get_resources()
        return all("Type" in resource for resource in resources.values())

    def validate_parameters_have_types(self) -> bool:
        """Validate all parameters have a Type property."""
        parameters = self.get_parameters()
        return all("Type" in param for param in parameters.values())

    def validate_outputs_have_values(self) -> bool:
        """Validate all outputs have a Value property."""
        outputs = self.get_outputs()
        return all("Value" in output for output in outputs.values())

    def check_resource_naming(self, resource_name: str) -> bool:
        """Check if resource name includes environmentSuffix."""
        resource = self.get_resource(resource_name)
        props = resource.get("Properties", {})

        # Check all properties for environmentSuffix usage
        props_str = json.dumps(props)
        return "${environmentSuffix}" in props_str

    def get_encryption_settings(self) -> Dict[str, bool]:
        """Get encryption settings for all resources."""
        resources = self.get_resources()
        encryption_map = {}

        for name, resource in resources.items():
            props = resource.get("Properties", {})
            if "StorageEncrypted" in props:
                encryption_map[name] = props["StorageEncrypted"]

        return encryption_map

    def get_backup_settings(self) -> Dict[str, Any]:
        """Get backup settings for DB cluster."""
        try:
            db_cluster = self.get_db_cluster_resource()
            props = db_cluster.get("Properties", {})
            return {
                "BackupRetentionPeriod": props.get("BackupRetentionPeriod"),
                "PreferredBackupWindow": props.get("PreferredBackupWindow"),
                "PreferredMaintenanceWindow": props.get("PreferredMaintenanceWindow")
            }
        except KeyError:
            return {}

    def get_cloudwatch_log_exports(self) -> List[str]:
        """Get CloudWatch log exports for DB cluster."""
        try:
            db_cluster = self.get_db_cluster_resource()
            props = db_cluster.get("Properties", {})
            return props.get("EnableCloudwatchLogsExports", [])
        except KeyError:
            return []

    def validate_no_deletion_protection(self) -> bool:
        """Validate no resources have deletion protection enabled."""
        resources = self.get_resources()

        for resource in resources.values():
            props = resource.get("Properties", {})
            if props.get("DeletionProtection", False):
                return False

        return True

    def validate_no_retain_policy(self) -> bool:
        """Validate no resources have Retain deletion policy."""
        resources = self.get_resources()

        for resource in resources.values():
            if resource.get("DeletionPolicy") == "Retain":
                return False

        return True

    def get_engine_version(self) -> str:
        """Get Aurora engine version."""
        try:
            global_cluster = self.get_global_cluster_resource()
            props = global_cluster.get("Properties", {})
            return props.get("EngineVersion", "")
        except KeyError:
            return ""

    def get_engine_type(self) -> str:
        """Get Aurora engine type."""
        try:
            global_cluster = self.get_global_cluster_resource()
            props = global_cluster.get("Properties", {})
            return props.get("Engine", "")
        except KeyError:
            return ""


def load_stack() -> TapStack:
    """Load and return TapStack instance."""
    return TapStack()


def validate_template() -> bool:
    """Validate CloudFormation template structure and content."""
    stack = load_stack()
    return (
        stack.validate_template_structure()
        and stack.validate_resources_have_types()
        and stack.validate_parameters_have_types()
        and stack.validate_outputs_have_values()
    )
