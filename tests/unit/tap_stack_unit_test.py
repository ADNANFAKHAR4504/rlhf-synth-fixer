"""
Unit tests for CloudFormation templates
Tests JSON syntax, resource properties, parameters, outputs, and naming conventions
"""

import json
import os
import pytest
from pathlib import Path

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent
LIB_DIR = PROJECT_ROOT / "lib"

class TestJSONSyntax:
    """Test that all CloudFormation templates are valid JSON"""

    def test_main_stack_json_valid(self):
        """Main stack template should be valid JSON"""
        with open(LIB_DIR / "main-stack.json", "r") as f:
            data = json.load(f)
        assert isinstance(data, dict)
        assert "AWSTemplateFormatVersion" in data

    def test_secrets_stack_json_valid(self):
        """Secrets stack template should be valid JSON"""
        with open(LIB_DIR / "secrets-stack.json", "r") as f:
            data = json.load(f)
        assert isinstance(data, dict)
        assert "AWSTemplateFormatVersion" in data

    def test_networking_stack_json_valid(self):
        """Networking stack template should be valid JSON"""
        with open(LIB_DIR / "networking-stack.json", "r") as f:
            data = json.load(f)
        assert isinstance(data, dict)
        assert "AWSTemplateFormatVersion" in data

    def test_database_stack_json_valid(self):
        """Database stack template should be valid JSON"""
        with open(LIB_DIR / "database-stack.json", "r") as f:
            data = json.load(f)
        assert isinstance(data, dict)
        assert "AWSTemplateFormatVersion" in data

    def test_compute_stack_json_valid(self):
        """Compute stack template should be valid JSON"""
        with open(LIB_DIR / "compute-stack.json", "r") as f:
            data = json.load(f)
        assert isinstance(data, dict)
        assert "AWSTemplateFormatVersion" in data

    def test_monitoring_stack_json_valid(self):
        """Monitoring stack template should be valid JSON"""
        with open(LIB_DIR / "monitoring-stack.json", "r") as f:
            data = json.load(f)
        assert isinstance(data, dict)
        assert "AWSTemplateFormatVersion" in data


class TestMainStackStructure:
    """Test main stack structure and parameters"""

    @pytest.fixture
    def main_stack(self):
        with open(LIB_DIR / "main-stack.json", "r") as f:
            return json.load(f)

    def test_has_required_parameters(self, main_stack):
        """Main stack should have all required parameters"""
        params = main_stack.get("Parameters", {})
        required_params = [
            "EnvironmentName",
            "EnvironmentSuffix",
            "VpcId",
            "PrivateSubnetIds",
            "PublicSubnetIds",
            "HostedZoneId",
            "DomainName",
            "NestedStacksBucketName"
        ]
        for param in required_params:
            assert param in params, f"Missing required parameter: {param}"

    def test_environment_name_has_allowed_values(self, main_stack):
        """EnvironmentName should have dev, staging, prod as allowed values"""
        env_param = main_stack["Parameters"]["EnvironmentName"]
        assert "AllowedValues" in env_param
        assert set(env_param["AllowedValues"]) == {"dev", "staging", "prod"}

    def test_has_environment_mappings(self, main_stack):
        """Main stack should have EnvironmentConfig mappings"""
        assert "Mappings" in main_stack
        assert "EnvironmentConfig" in main_stack["Mappings"]
        env_config = main_stack["Mappings"]["EnvironmentConfig"]
        assert "dev" in env_config
        assert "staging" in env_config
        assert "prod" in env_config

    def test_has_nested_stack_resources(self, main_stack):
        """Main stack should define all nested stacks"""
        resources = main_stack.get("Resources", {})
        nested_stacks = [
            "SecretsStack",
            "NetworkingStack",
            "DatabaseStack",
            "ComputeStack",
            "MonitoringStack"
        ]
        for stack in nested_stacks:
            assert stack in resources
            assert resources[stack]["Type"] == "AWS::CloudFormation::Stack"

    def test_has_required_outputs(self, main_stack):
        """Main stack should have comprehensive outputs"""
        outputs = main_stack.get("Outputs", {})
        required_outputs = [
            "ApplicationURL",
            "ALBDNSName",
            "ECSClusterName",
            "ECRRepositoryURI",
            "DBEndpoint",
            "DBName"
        ]
        for output in required_outputs:
            assert output in outputs


class TestNetworkingStack:
    """Test networking stack resources and security groups"""

    @pytest.fixture
    def networking_stack(self):
        with open(LIB_DIR / "networking-stack.json", "r") as f:
            return json.load(f)

    def test_has_security_groups(self, networking_stack):
        """Networking stack should define all security groups"""
        resources = networking_stack["Resources"]
        sg_resources = [
            "ALBSecurityGroup",
            "ECSSecurityGroup",
            "DBSecurityGroup"
        ]
        for sg in sg_resources:
            assert sg in resources
            assert resources[sg]["Type"] == "AWS::EC2::SecurityGroup"

    def test_no_circular_dependencies(self, networking_stack):
        """Security groups should not have circular dependencies"""
        resources = networking_stack["Resources"]

        # Check that security groups don't directly reference each other in their Properties
        alb_sg = resources["ALBSecurityGroup"]["Properties"]
        assert "SecurityGroupEgress" not in alb_sg or \
               all("DestinationSecurityGroupId" not in rule or \
                   rule.get("DestinationSecurityGroupId", {}).get("Ref") != "ECSSecurityGroup" \
                   for rule in alb_sg.get("SecurityGroupEgress", []))

        ecs_sg = resources["ECSSecurityGroup"]["Properties"]
        assert "SecurityGroupIngress" not in ecs_sg or \
               all("SourceSecurityGroupId" not in rule \
                   for rule in ecs_sg.get("SecurityGroupIngress", []))

    def test_has_separate_sg_rules(self, networking_stack):
        """Networking stack should have separate SecurityGroupIngress/Egress resources"""
        resources = networking_stack["Resources"]

        # Check for separate ingress/egress resources
        rule_resources = [
            "ALBToECSEgress",
            "ECSFromALBIngress",
            "ECSToDBEgress",
            "DBFromECSIngress"
        ]
        for rule in rule_resources:
            assert rule in resources
            assert resources[rule]["Type"] in [
                "AWS::EC2::SecurityGroupIngress",
                "AWS::EC2::SecurityGroupEgress"
            ]

    def test_has_load_balancer(self, networking_stack):
        """Networking stack should define ALB"""
        resources = networking_stack["Resources"]
        assert "ApplicationLoadBalancer" in resources
        alb = resources["ApplicationLoadBalancer"]
        assert alb["Type"] == "AWS::ElasticLoadBalancingV2::LoadBalancer"
        assert alb["Properties"]["Type"] == "application"
        assert alb["Properties"]["Scheme"] == "internet-facing"

    def test_has_target_group(self, networking_stack):
        """Networking stack should define target group"""
        resources = networking_stack["Resources"]
        assert "ALBTargetGroup" in resources
        tg = resources["ALBTargetGroup"]
        assert tg["Type"] == "AWS::ElasticLoadBalancingV2::TargetGroup"
        assert tg["Properties"]["TargetType"] == "ip"

    def test_resource_naming_uses_environment_suffix(self, networking_stack):
        """All resources should use EnvironmentSuffix in names"""
        resources = networking_stack["Resources"]

        name_properties = [
            ("ALBSecurityGroup", "GroupName"),
            ("ECSSecurityGroup", "GroupName"),
            ("DBSecurityGroup", "GroupName"),
            ("ApplicationLoadBalancer", "Name"),
            ("ALBTargetGroup", "Name")
        ]

        for resource_name, prop_name in name_properties:
            if resource_name in resources:
                props = resources[resource_name]["Properties"]
                if prop_name in props:
                    name_def = props[prop_name]
                    assert "Fn::Sub" in name_def
                    assert "EnvironmentSuffix" in name_def["Fn::Sub"]


class TestSecretsStack:
    """Test secrets stack resources"""

    @pytest.fixture
    def secrets_stack(self):
        with open(LIB_DIR / "secrets-stack.json", "r") as f:
            return json.load(f)

    def test_has_db_password_secret(self, secrets_stack):
        """Secrets stack should define DB password secret"""
        resources = secrets_stack["Resources"]
        assert "DBMasterPasswordSecret" in resources
        secret = resources["DBMasterPasswordSecret"]
        assert secret["Type"] == "AWS::SecretsManager::Secret"
        assert "GenerateSecretString" in secret["Properties"]

    def test_has_app_secrets(self, secrets_stack):
        """Secrets stack should define application secrets"""
        resources = secrets_stack["Resources"]
        assert "AppSecrets" in resources
        secret = resources["AppSecrets"]
        assert secret["Type"] == "AWS::SecretsManager::Secret"

    def test_has_required_outputs(self, secrets_stack):
        """Secrets stack should output secret ARNs"""
        outputs = secrets_stack["Outputs"]
        assert "DBMasterPasswordSecretArn" in outputs
        assert "AppSecretsArn" in outputs


class TestDatabaseStack:
    """Test database stack resources"""

    @pytest.fixture
    def database_stack(self):
        with open(LIB_DIR / "database-stack.json", "r") as f:
            return json.load(f)

    def test_has_db_instance(self, database_stack):
        """Database stack should define RDS instance"""
        resources = database_stack["Resources"]
        assert "DBInstance" in resources
        db = resources["DBInstance"]
        assert db["Type"] == "AWS::RDS::DBInstance"
        assert db["Properties"]["Engine"] == "postgres"

    def test_db_uses_secrets_manager(self, database_stack):
        """DB should use Secrets Manager for credentials"""
        resources = database_stack["Resources"]
        db = resources["DBInstance"]
        props = db["Properties"]

        # Check for dynamic reference to secrets
        master_password = props["MasterUserPassword"]
        assert "Fn::Sub" in master_password
        assert "secretsmanager" in master_password["Fn::Sub"]

    def test_has_subnet_group(self, database_stack):
        """Database stack should define subnet group"""
        resources = database_stack["Resources"]
        assert "DBSubnetGroup" in resources
        assert resources["DBSubnetGroup"]["Type"] == "AWS::RDS::DBSubnetGroup"

    def test_has_parameter_group(self, database_stack):
        """Database stack should define parameter group"""
        resources = database_stack["Resources"]
        assert "DBParameterGroup" in resources
        assert resources["DBParameterGroup"]["Type"] == "AWS::RDS::DBParameterGroup"

    def test_db_not_publicly_accessible(self, database_stack):
        """DB should not be publicly accessible"""
        resources = database_stack["Resources"]
        db = resources["DBInstance"]
        assert db["Properties"]["PubliclyAccessible"] == False

    def test_db_has_backups(self, database_stack):
        """DB should have automated backups configured"""
        resources = database_stack["Resources"]
        db = resources["DBInstance"]
        props = db["Properties"]
        assert "BackupRetentionPeriod" in props
        assert props["BackupRetentionPeriod"] > 0


class TestComputeStack:
    """Test compute stack resources"""

    @pytest.fixture
    def compute_stack(self):
        with open(LIB_DIR / "compute-stack.json", "r") as f:
            return json.load(f)

    def test_has_ecs_cluster(self, compute_stack):
        """Compute stack should define ECS cluster"""
        resources = compute_stack["Resources"]
        assert "ECSCluster" in resources
        cluster = resources["ECSCluster"]
        assert cluster["Type"] == "AWS::ECS::Cluster"

    def test_has_ecr_repository(self, compute_stack):
        """Compute stack should define ECR repository"""
        resources = compute_stack["Resources"]
        assert "ECRRepository" in resources
        repo = resources["ECRRepository"]
        assert repo["Type"] == "AWS::ECR::Repository"
        assert repo["Properties"]["ImageScanningConfiguration"]["ScanOnPush"] == True

    def test_has_task_definition(self, compute_stack):
        """Compute stack should define ECS task definition"""
        resources = compute_stack["Resources"]
        assert "ECSTaskDefinition" in resources
        task = resources["ECSTaskDefinition"]
        assert task["Type"] == "AWS::ECS::TaskDefinition"
        assert "FARGATE" in task["Properties"]["RequiresCompatibilities"]

    def test_has_ecs_service(self, compute_stack):
        """Compute stack should define ECS service"""
        resources = compute_stack["Resources"]
        assert "ECSService" in resources
        service = resources["ECSService"]
        assert service["Type"] == "AWS::ECS::Service"
        assert service["Properties"]["LaunchType"] == "FARGATE"

    def test_has_iam_roles(self, compute_stack):
        """Compute stack should define IAM roles"""
        resources = compute_stack["Resources"]
        assert "ECSTaskExecutionRole" in resources
        assert "ECSTaskRole" in resources

        exec_role = resources["ECSTaskExecutionRole"]
        assert exec_role["Type"] == "AWS::IAM::Role"

        task_role = resources["ECSTaskRole"]
        assert task_role["Type"] == "AWS::IAM::Role"

    def test_has_autoscaling(self, compute_stack):
        """Compute stack should define autoscaling"""
        resources = compute_stack["Resources"]
        assert "ServiceScalingTarget" in resources
        assert "ServiceScalingPolicy" in resources


class TestMonitoringStack:
    """Test monitoring stack resources"""

    @pytest.fixture
    def monitoring_stack(self):
        with open(LIB_DIR / "monitoring-stack.json", "r") as f:
            return json.load(f)

    def test_has_route53_record(self, monitoring_stack):
        """Monitoring stack should define Route53 DNS record"""
        resources = monitoring_stack["Resources"]
        assert "DNSRecord" in resources
        record = resources["DNSRecord"]
        assert record["Type"] == "AWS::Route53::RecordSet"

    def test_has_health_check(self, monitoring_stack):
        """Monitoring stack should define health check"""
        resources = monitoring_stack["Resources"]
        assert "HealthCheck" in resources
        hc = resources["HealthCheck"]
        assert hc["Type"] == "AWS::Route53::HealthCheck"

    def test_has_cloudwatch_alarms(self, monitoring_stack):
        """Monitoring stack should define CloudWatch alarms"""
        resources = monitoring_stack["Resources"]
        assert "CPUAlarmHigh" in resources
        assert "MemoryAlarmHigh" in resources


class TestResourceTagging:
    """Test that all resources have proper tagging"""

    @pytest.fixture
    def all_stacks(self):
        stacks = {}
        stack_files = [
            "main-stack.json",
            "secrets-stack.json",
            "networking-stack.json",
            "database-stack.json",
            "compute-stack.json",
            "monitoring-stack.json"
        ]
        for stack_file in stack_files:
            with open(LIB_DIR / stack_file, "r") as f:
                stacks[stack_file] = json.load(f)
        return stacks

    def test_resources_have_tags(self, all_stacks):
        """Most resources should have comprehensive tags"""
        required_tag_keys = ["Environment", "Project", "ManagedBy"]

        for stack_name, stack in all_stacks.items():
            resources = stack.get("Resources", {})
            for resource_name, resource in resources.items():
                # Skip certain resource types that don't support tags
                if resource["Type"] in [
                    "AWS::EC2::SecurityGroupIngress",
                    "AWS::EC2::SecurityGroupEgress",
                    "AWS::ElasticLoadBalancingV2::Listener",
                    "AWS::CloudFormation::Stack"
                ]:
                    continue

                props = resource.get("Properties", {})
                if "Tags" in props:
                    tag_keys = [tag["Key"] for tag in props["Tags"]]
                    for required_key in required_tag_keys:
                        assert required_key in tag_keys, \
                            f"{stack_name}:{resource_name} missing tag {required_key}"


class TestParameterFiles:
    """Test parameter files are properly structured"""

    def test_dev_params_exist(self):
        """Dev parameter file should exist"""
        assert (LIB_DIR / "parameters" / "dev-params.json").exists()

    def test_staging_params_exist(self):
        """Staging parameter file should exist"""
        assert (LIB_DIR / "parameters" / "staging-params.json").exists()

    def test_prod_params_exist(self):
        """Production parameter file should exist"""
        assert (LIB_DIR / "parameters" / "prod-params.json").exists()

    def test_dev_params_valid(self):
        """Dev parameters should be valid JSON with correct structure"""
        with open(LIB_DIR / "parameters" / "dev-params.json", "r") as f:
            data = json.load(f)
        assert "Parameters" in data
        assert isinstance(data["Parameters"], list)

        # Check for required parameters
        param_keys = [p["ParameterKey"] for p in data["Parameters"]]
        assert "EnvironmentName" in param_keys
        assert "EnvironmentSuffix" in param_keys

    def test_environment_names_match(self):
        """Parameter files should have matching environment names"""
        envs = ["dev", "staging", "prod"]

        for env in envs:
            with open(LIB_DIR / "parameters" / f"{env}-params.json", "r") as f:
                data = json.load(f)

            env_param = next(p for p in data["Parameters"] if p["ParameterKey"] == "EnvironmentName")
            assert env_param["ParameterValue"] == env


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=lib", "--cov-report=term-missing", "--cov-report=json:coverage/coverage.json"])
