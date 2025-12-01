"""TapStack CloudFormation template wrapper for testing."""
import json
from pathlib import Path


class TapStack:
    """Wrapper class for TapStack CloudFormation template."""

    def __init__(self):
        """Initialize by loading the template."""
        self.template_path = Path(__file__).parent / "TapStack.json"
        with open(self.template_path, "r", encoding="utf-8") as f:
            self.template = json.load(f)

    def get_template(self):
        """Get the CloudFormation template as a dictionary."""
        return self.template

    def get_resources(self):
        """Get all resources from the template."""
        return self.template.get("Resources", {})

    def get_parameters(self):
        """Get all parameters from the template."""
        return self.template.get("Parameters", {})

    def get_outputs(self):
        """Get all outputs from the template."""
        return self.template.get("Outputs", {})

    def get_resource(self, resource_name):
        """Get a specific resource by name."""
        return self.template.get("Resources", {}).get(resource_name)

    def get_resource_type(self, resource_name):
        """Get the type of a specific resource."""
        resource = self.get_resource(resource_name)
        return resource.get("Type") if resource else None

    def get_resource_properties(self, resource_name):
        """Get the properties of a specific resource."""
        resource = self.get_resource(resource_name)
        return resource.get("Properties", {}) if resource else {}

    def list_resource_names(self):
        """List all resource names in the template."""
        return list(self.get_resources().keys())

    def list_resource_types(self):
        """List all resource types in the template."""
        resources = self.get_resources()
        return [resource.get("Type") for resource in resources.values()]

    def count_resources(self):
        """Count the total number of resources."""
        return len(self.get_resources())

    def count_resources_by_type(self, resource_type):
        """Count resources of a specific type."""
        return sum(1 for r in self.get_resources().values() if r.get("Type") == resource_type)

    def validate_json_structure(self):
        """Validate the template is a valid dictionary."""
        return isinstance(self.template, dict)

    def has_description(self):
        """Check if the template has a description."""
        return "Description" in self.template

    def has_parameters(self):
        """Check if the template has parameters."""
        return "Parameters" in self.template

    def has_resources(self):
        """Check if the template has resources."""
        return "Resources" in self.template and len(self.get_resources()) > 0

    def has_outputs(self):
        """Check if the template has outputs."""
        return "Outputs" in self.template

    def find_resources_by_type(self, resource_type):
        """Find all resources of a specific type."""
        return {
            name: resource
            for name, resource in self.get_resources().items()
            if resource.get("Type") == resource_type
        }

    def uses_environment_suffix(self):
        """Check if the template uses environmentSuffix parameter."""
        template_str = json.dumps(self.template)
        return "${environmentSuffix}" in template_str

    def count_environment_suffix_usage(self):
        """Count how many times environmentSuffix is used."""
        template_str = json.dumps(self.template)
        return template_str.count("${environmentSuffix}")

    def has_deletion_policy_retain(self):
        """Check if any resource has DeletionPolicy: Retain."""
        for resource in self.get_resources().values():
            if resource.get("DeletionPolicy") == "Retain":
                return True
        return False

    def has_deletion_protection(self):
        """Check if any resource has DeletionProtection enabled."""
        template_str = json.dumps(self.template).lower()
        return "deletionprotection" in template_str

    def get_vpc_cidr(self):
        """Get the VPC CIDR block."""
        vpc = self.get_resource("VPC")
        if vpc:
            return vpc.get("Properties", {}).get("CidrBlock")
        return None

    def get_ecs_cluster_settings(self):
        """Get ECS cluster settings."""
        cluster = self.get_resource("ECSCluster")
        if cluster:
            return cluster.get("Properties", {}).get("ClusterSettings", [])
        return []

    def get_task_definition_cpu(self):
        """Get ECS task definition CPU."""
        task_def = self.get_resource("ECSTaskDefinition")
        if task_def:
            return task_def.get("Properties", {}).get("Cpu")
        return None

    def get_task_definition_memory(self):
        """Get ECS task definition Memory."""
        task_def = self.get_resource("ECSTaskDefinition")
        if task_def:
            return task_def.get("Properties", {}).get("Memory")
        return None

    def get_service_desired_count(self, service_name):
        """Get desired count for a service."""
        service = self.get_resource(service_name)
        if service:
            return service.get("Properties", {}).get("DesiredCount")
        return None

    def get_target_group_health_check_config(self, tg_name):
        """Get health check configuration for a target group."""
        tg = self.get_resource(tg_name)
        if tg:
            props = tg.get("Properties", {})
            return {
                "HealthCheckEnabled": props.get("HealthCheckEnabled"),
                "HealthCheckIntervalSeconds": props.get("HealthCheckIntervalSeconds"),
                "HealthCheckPath": props.get("HealthCheckPath"),
                "HealthCheckProtocol": props.get("HealthCheckProtocol"),
                "HealthCheckTimeoutSeconds": props.get("HealthCheckTimeoutSeconds"),
                "HealthyThresholdCount": props.get("HealthyThresholdCount"),
                "UnhealthyThresholdCount": props.get("UnhealthyThresholdCount"),
            }
        return None

    def get_autoscaling_target_config(self, target_name):
        """Get autoscaling target configuration."""
        target = self.get_resource(target_name)
        if target:
            props = target.get("Properties", {})
            return {
                "MinCapacity": props.get("MinCapacity"),
                "MaxCapacity": props.get("MaxCapacity"),
                "ServiceNamespace": props.get("ServiceNamespace"),
                "ScalableDimension": props.get("ScalableDimension"),
            }
        return None

    def get_alb_listener_config(self):
        """Get ALB listener configuration."""
        listener = self.get_resource("ALBListener")
        if listener:
            props = listener.get("Properties", {})
            return {
                "Protocol": props.get("Protocol"),
                "Port": props.get("Port"),
                "DefaultActions": props.get("DefaultActions"),
            }
        return None
