"""
Unit tests for TapStack CloudFormation template validation.

Tests cover:
- Template structure validation
- Parameters configuration
- Conditions logic
- Resource naming conventions
- Resource dependencies
- Security configurations
"""

import json
import os
import pytest
from pathlib import Path


@pytest.fixture
def cfn_template():
    """Load the CloudFormation template."""
    template_path = Path(__file__).parent.parent / "lib" / "TapStack.json"
    with open(template_path, 'r') as f:
        return json.load(f)


class TestTemplateStructure:
    """Test CloudFormation template structure."""

    def test_template_has_required_sections(self, cfn_template):
        """Verify template has all required top-level sections."""
        assert "AWSTemplateFormatVersion" in cfn_template
        assert "Description" in cfn_template
        assert "Parameters" in cfn_template
        assert "Conditions" in cfn_template
        assert "Resources" in cfn_template
        assert "Outputs" in cfn_template

    def test_template_format_version(self, cfn_template):
        """Verify correct CloudFormation template version."""
        assert cfn_template["AWSTemplateFormatVersion"] == "2010-09-09"

    def test_description_present(self, cfn_template):
        """Verify template has a description."""
        description = cfn_template["Description"]
        assert len(description) > 0
        assert "Loan Processing" in description or "loan" in description.lower()


class TestParameters:
    """Test CloudFormation Parameters section."""

    def test_environment_suffix_parameter(self, cfn_template):
        """Verify EnvironmentSuffix parameter is correctly defined."""
        params = cfn_template["Parameters"]
        assert "EnvironmentSuffix" in params

        env_suffix = params["EnvironmentSuffix"]
        assert env_suffix["Type"] == "String"
        assert "MinLength" in env_suffix
        assert env_suffix["MinLength"] == 1
        assert "MaxLength" in env_suffix
        assert "AllowedPattern" in env_suffix

    def test_environment_type_parameter(self, cfn_template):
        """Verify EnvironmentType parameter for dev/prod conditional logic."""
        params = cfn_template["Parameters"]
        assert "EnvironmentType" in params

        env_type = params["EnvironmentType"]
        assert env_type["Type"] == "String"
        assert "Default" in env_type
        assert env_type["Default"] == "dev"
        assert "AllowedValues" in env_type
        assert set(env_type["AllowedValues"]) == {"dev", "prod"}

    def test_db_instance_class_parameter(self, cfn_template):
        """Verify DBInstanceClass parameter configuration."""
        params = cfn_template["Parameters"]
        assert "DBInstanceClass" in params

        db_class = params["DBInstanceClass"]
        assert db_class["Type"] == "String"
        assert "Default" in db_class
        assert "AllowedValues" in db_class
        # Verify contains valid Aurora MySQL instance types
        allowed = db_class["AllowedValues"]
        assert any("db.t3" in val or "db.r5" in val for val in allowed)

    def test_tagging_parameters(self, cfn_template):
        """Verify tagging parameters for compliance."""
        params = cfn_template["Parameters"]
        assert "CostCenter" in params
        assert "MigrationPhase" in params

        # Verify MigrationPhase has allowed values
        migration_phase = params["MigrationPhase"]
        assert "AllowedValues" in migration_phase
        phases = migration_phase["AllowedValues"]
        assert len(phases) >= 3  # Should have multiple migration phases


class TestConditions:
    """Test CloudFormation Conditions section."""

    def test_is_production_condition(self, cfn_template):
        """Verify IsProduction condition for conditional resources."""
        conditions = cfn_template["Conditions"]
        assert "IsProduction" in conditions

        is_prod = conditions["IsProduction"]
        assert "Fn::Equals" in is_prod
        equals_args = is_prod["Fn::Equals"]
        assert len(equals_args) == 2
        # Should compare EnvironmentType to "prod"
        assert {"Ref": "EnvironmentType"} in equals_args
        assert "prod" in equals_args


class TestNetworkingResources:
    """Test VPC and networking resource configurations."""

    def test_vpc_exists(self, cfn_template):
        """Verify VPC resource is defined."""
        resources = cfn_template["Resources"]
        assert "VPC" in resources

        vpc = resources["VPC"]
        assert vpc["Type"] == "AWS::EC2::VPC"
        assert "CidrBlock" in vpc["Properties"]
        assert vpc["Properties"]["EnableDnsHostnames"] is True
        assert vpc["Properties"]["EnableDnsSupport"] is True

    def test_vpc_naming_includes_suffix(self, cfn_template):
        """Verify VPC name includes EnvironmentSuffix."""
        vpc = cfn_template["Resources"]["VPC"]
        name_tag = next(
            (tag for tag in vpc["Properties"]["Tags"] if tag["Key"] == "Name"),
            None
        )
        assert name_tag is not None
        name_value = name_tag["Value"]
        assert "Fn::Sub" in name_value
        assert "${EnvironmentSuffix}" in name_value["Fn::Sub"]

    def test_subnets_across_multiple_azs(self, cfn_template):
        """Verify subnets span at least 2 availability zones."""
        resources = cfn_template["Resources"]

        # Check public subnets
        assert "PublicSubnet1" in resources
        assert "PublicSubnet2" in resources

        # Check private subnets
        assert "PrivateSubnet1" in resources
        assert "PrivateSubnet2" in resources

        # Verify they use different AZs
        pub1_az = resources["PublicSubnet1"]["Properties"]["AvailabilityZone"]
        pub2_az = resources["PublicSubnet2"]["Properties"]["AvailabilityZone"]

        # Should use Fn::Select with different indices
        assert pub1_az["Fn::Select"][0] == 0
        assert pub2_az["Fn::Select"][0] == 1

    def test_nat_gateway_conditional_creation(self, cfn_template):
        """Verify second NAT Gateway is conditionally created for production."""
        resources = cfn_template["Resources"]

        # NAT Gateway 1 should always be created (no condition)
        assert "NATGateway1" in resources
        nat1 = resources["NATGateway1"]
        assert "Condition" not in nat1

        # NAT Gateway 2 should be conditional (production only)
        assert "NATGateway2" in resources
        nat2 = resources["NATGateway2"]
        assert "Condition" in nat2
        assert nat2["Condition"] == "IsProduction"

    def test_subnet_naming_includes_suffix(self, cfn_template):
        """Verify all subnets include EnvironmentSuffix in names."""
        resources = cfn_template["Resources"]
        subnet_names = ["PublicSubnet1", "PublicSubnet2", "PrivateSubnet1", "PrivateSubnet2"]

        for subnet_name in subnet_names:
            subnet = resources[subnet_name]
            name_tag = next(
                (tag for tag in subnet["Properties"]["Tags"] if tag["Key"] == "Name"),
                None
            )
            assert name_tag is not None
            assert "Fn::Sub" in name_tag["Value"]
            assert "${EnvironmentSuffix}" in name_tag["Value"]["Fn::Sub"]


class TestDatabaseResources:
    """Test RDS Aurora cluster configuration."""

    def test_db_cluster_exists(self, cfn_template):
        """Verify Aurora cluster resource is defined."""
        resources = cfn_template["Resources"]
        assert "DBCluster" in resources

        db_cluster = resources["DBCluster"]
        assert db_cluster["Type"] == "AWS::RDS::DBCluster"
        assert db_cluster["Properties"]["Engine"] == "aurora-mysql"

    def test_db_cluster_encryption(self, cfn_template):
        """Verify database encryption with KMS."""
        db_cluster = cfn_template["Resources"]["DBCluster"]
        props = db_cluster["Properties"]

        assert props["StorageEncrypted"] is True
        assert "KmsKeyId" in props
        assert props["KmsKeyId"] == {"Ref": "KMSKey"}

    def test_db_cluster_no_deletion_protection(self, cfn_template):
        """Verify DeletionProtection is false for testing."""
        db_cluster = cfn_template["Resources"]["DBCluster"]
        props = db_cluster["Properties"]

        assert "DeletionProtection" in props
        assert props["DeletionProtection"] is False

    def test_db_instance_conditional_creation(self, cfn_template):
        """Verify second DB instance is conditional for multi-AZ."""
        resources = cfn_template["Resources"]

        # First instance should always be created
        assert "DBInstance1" in resources
        db1 = resources["DBInstance1"]
        assert "Condition" not in db1

        # Second instance should be conditional (production only)
        assert "DBInstance2" in resources
        db2 = resources["DBInstance2"]
        assert "Condition" in db2
        assert db2["Condition"] == "IsProduction"

    def test_db_naming_includes_suffix(self, cfn_template):
        """Verify database resources include EnvironmentSuffix."""
        resources = cfn_template["Resources"]

        # Check DB cluster identifier
        cluster_id = resources["DBCluster"]["Properties"]["DBClusterIdentifier"]
        assert "Fn::Sub" in cluster_id
        assert "${EnvironmentSuffix}" in cluster_id["Fn::Sub"]

        # Check DB instance identifier
        instance_id = resources["DBInstance1"]["Properties"]["DBInstanceIdentifier"]
        assert "Fn::Sub" in instance_id
        assert "${EnvironmentSuffix}" in instance_id["Fn::Sub"]

    def test_db_subnet_group(self, cfn_template):
        """Verify DB subnet group configuration."""
        resources = cfn_template["Resources"]
        assert "DBSubnetGroup" in resources

        subnet_group = resources["DBSubnetGroup"]
        assert subnet_group["Type"] == "AWS::RDS::DBSubnetGroup"

        subnet_ids = subnet_group["Properties"]["SubnetIds"]
        assert len(subnet_ids) == 2
        assert {"Ref": "PrivateSubnet1"} in subnet_ids
        assert {"Ref": "PrivateSubnet2"} in subnet_ids


class TestSecretsManagerResources:
    """Test Secrets Manager configuration."""

    def test_db_secret_exists(self, cfn_template):
        """Verify database secret is defined."""
        resources = cfn_template["Resources"]
        assert "DBSecret" in resources

        secret = resources["DBSecret"]
        assert secret["Type"] == "AWS::SecretsManager::Secret"

    def test_db_secret_encryption(self, cfn_template):
        """Verify secret is encrypted with KMS."""
        secret = cfn_template["Resources"]["DBSecret"]
        props = secret["Properties"]

        assert "KmsKeyId" in props
        assert props["KmsKeyId"] == {"Ref": "KMSKey"}

    def test_db_secret_naming(self, cfn_template):
        """Verify secret name includes EnvironmentSuffix."""
        secret = cfn_template["Resources"]["DBSecret"]
        name = secret["Properties"]["Name"]

        assert "Fn::Sub" in name
        assert "${EnvironmentSuffix}" in name["Fn::Sub"]

    def test_secret_rotation_schedule(self, cfn_template):
        """Verify 30-day rotation schedule."""
        resources = cfn_template["Resources"]
        assert "SecretRotationSchedule" in resources

        rotation = resources["SecretRotationSchedule"]
        assert rotation["Type"] == "AWS::SecretsManager::RotationSchedule"

        rules = rotation["Properties"]["RotationRules"]
        assert rules["AutomaticallyAfterDays"] == 30

    def test_rotation_lambda_exists(self, cfn_template):
        """Verify rotation Lambda function is defined."""
        resources = cfn_template["Resources"]
        assert "SecretRotationLambda" in resources

        rotation_lambda = resources["SecretRotationLambda"]
        assert rotation_lambda["Type"] == "AWS::Lambda::Function"
        assert rotation_lambda["Properties"]["Runtime"] == "python3.11"


class TestLambdaResources:
    """Test Lambda function configuration."""

    def test_validation_lambda_exists(self, cfn_template):
        """Verify loan validation Lambda is defined."""
        resources = cfn_template["Resources"]
        assert "LoanValidationFunction" in resources

        lambda_func = resources["LoanValidationFunction"]
        assert lambda_func["Type"] == "AWS::Lambda::Function"

    def test_lambda_memory_configuration(self, cfn_template):
        """Verify Lambda has 1GB memory as required."""
        lambda_func = cfn_template["Resources"]["LoanValidationFunction"]
        props = lambda_func["Properties"]

        assert "MemorySize" in props
        assert props["MemorySize"] == 1024

    def test_lambda_reserved_concurrency(self, cfn_template):
        """Verify Lambda has reserved concurrent executions."""
        lambda_func = cfn_template["Resources"]["LoanValidationFunction"]
        props = lambda_func["Properties"]

        assert "ReservedConcurrentExecutions" in props
        assert props["ReservedConcurrentExecutions"] > 0

    def test_lambda_vpc_configuration(self, cfn_template):
        """Verify Lambda is deployed in VPC."""
        lambda_func = cfn_template["Resources"]["LoanValidationFunction"]
        props = lambda_func["Properties"]

        assert "VpcConfig" in props
        vpc_config = props["VpcConfig"]

        assert "SecurityGroupIds" in vpc_config
        assert "SubnetIds" in vpc_config
        assert len(vpc_config["SubnetIds"]) == 2

    def test_lambda_naming_includes_suffix(self, cfn_template):
        """Verify Lambda function name includes EnvironmentSuffix."""
        lambda_func = cfn_template["Resources"]["LoanValidationFunction"]
        func_name = lambda_func["Properties"]["FunctionName"]

        assert "Fn::Sub" in func_name
        assert "${EnvironmentSuffix}" in func_name["Fn::Sub"]


class TestStorageResources:
    """Test S3 bucket configuration."""

    def test_s3_bucket_exists(self, cfn_template):
        """Verify S3 bucket for loan documents."""
        resources = cfn_template["Resources"]
        assert "LoanDocumentsBucket" in resources

        bucket = resources["LoanDocumentsBucket"]
        assert bucket["Type"] == "AWS::S3::Bucket"

    def test_s3_versioning_enabled(self, cfn_template):
        """Verify S3 bucket has versioning enabled."""
        bucket = cfn_template["Resources"]["LoanDocumentsBucket"]
        props = bucket["Properties"]

        assert "VersioningConfiguration" in props
        assert props["VersioningConfiguration"]["Status"] == "Enabled"

    def test_s3_encryption_with_kms(self, cfn_template):
        """Verify S3 bucket uses KMS encryption."""
        bucket = cfn_template["Resources"]["LoanDocumentsBucket"]
        props = bucket["Properties"]

        assert "BucketEncryption" in props
        encryption_config = props["BucketEncryption"]["ServerSideEncryptionConfiguration"][0]
        sse_default = encryption_config["ServerSideEncryptionByDefault"]

        assert sse_default["SSEAlgorithm"] == "aws:kms"
        assert "KMSMasterKeyID" in sse_default

    def test_s3_bucket_naming(self, cfn_template):
        """Verify S3 bucket name includes EnvironmentSuffix."""
        bucket = cfn_template["Resources"]["LoanDocumentsBucket"]
        bucket_name = bucket["Properties"]["BucketName"]

        assert "Fn::Sub" in bucket_name
        assert "${EnvironmentSuffix}" in bucket_name["Fn::Sub"]


class TestKMSResources:
    """Test KMS key configuration."""

    def test_kms_key_exists(self, cfn_template):
        """Verify KMS key for encryption."""
        resources = cfn_template["Resources"]
        assert "KMSKey" in resources

        kms_key = resources["KMSKey"]
        assert kms_key["Type"] == "AWS::KMS::Key"

    def test_kms_key_rotation_enabled(self, cfn_template):
        """Verify KMS key rotation is enabled."""
        kms_key = cfn_template["Resources"]["KMSKey"]
        props = kms_key["Properties"]

        assert "EnableKeyRotation" in props
        assert props["EnableKeyRotation"] is True

    def test_kms_key_policy_complete(self, cfn_template):
        """Verify KMS key policy includes all required service principals."""
        kms_key = cfn_template["Resources"]["KMSKey"]
        policy = kms_key["Properties"]["KeyPolicy"]

        statements = policy["Statement"]
        assert len(statements) >= 3

        # Check for service principals
        service_principals = []
        for statement in statements:
            if "Principal" in statement and "Service" in statement["Principal"]:
                service_principals.append(statement["Principal"]["Service"])

        # Should include RDS, Lambda, Secrets Manager
        assert "rds.amazonaws.com" in service_principals
        assert "lambda.amazonaws.com" in service_principals
        assert "secretsmanager.amazonaws.com" in service_principals

    def test_kms_alias_exists(self, cfn_template):
        """Verify KMS alias is created."""
        resources = cfn_template["Resources"]
        assert "KMSKeyAlias" in resources

        alias = resources["KMSKeyAlias"]
        assert alias["Type"] == "AWS::KMS::Alias"

        alias_name = alias["Properties"]["AliasName"]
        assert "Fn::Sub" in alias_name
        assert "${EnvironmentSuffix}" in alias_name["Fn::Sub"]


class TestCloudWatchResources:
    """Test CloudWatch Logs configuration."""

    def test_log_group_exists(self, cfn_template):
        """Verify CloudWatch Log Group for Lambda."""
        resources = cfn_template["Resources"]
        assert "LoanValidationLogGroup" in resources

        log_group = resources["LoanValidationLogGroup"]
        assert log_group["Type"] == "AWS::Logs::LogGroup"

    def test_log_retention_90_days(self, cfn_template):
        """Verify 90-day log retention for compliance."""
        log_group = cfn_template["Resources"]["LoanValidationLogGroup"]
        props = log_group["Properties"]

        assert "RetentionInDays" in props
        assert props["RetentionInDays"] == 90


class TestSecurityGroups:
    """Test security group configurations."""

    def test_lambda_security_group_exists(self, cfn_template):
        """Verify Lambda security group."""
        resources = cfn_template["Resources"]
        assert "LambdaSecurityGroup" in resources

        sg = resources["LambdaSecurityGroup"]
        assert sg["Type"] == "AWS::EC2::SecurityGroup"

    def test_db_security_group_exists(self, cfn_template):
        """Verify database security group."""
        resources = cfn_template["Resources"]
        assert "DBSecurityGroup" in resources

        sg = resources["DBSecurityGroup"]
        assert sg["Type"] == "AWS::EC2::SecurityGroup"

    def test_db_security_group_ingress_from_lambda(self, cfn_template):
        """Verify DB security group allows Lambda access."""
        db_sg = cfn_template["Resources"]["DBSecurityGroup"]
        ingress_rules = db_sg["Properties"]["SecurityGroupIngress"]

        assert len(ingress_rules) >= 1

        # Find MySQL/Aurora rule
        mysql_rule = next(
            (rule for rule in ingress_rules if rule["FromPort"] == 3306),
            None
        )
        assert mysql_rule is not None
        assert mysql_rule["ToPort"] == 3306
        assert mysql_rule["IpProtocol"] == "tcp"
        assert "SourceSecurityGroupId" in mysql_rule


class TestResourceTagging:
    """Test resource tagging for compliance."""

    def test_vpc_has_required_tags(self, cfn_template):
        """Verify VPC has all required tags."""
        vpc = cfn_template["Resources"]["VPC"]
        tags = vpc["Properties"]["Tags"]

        tag_keys = {tag["Key"] for tag in tags}
        required_tags = {"Name", "Environment", "CostCenter", "MigrationPhase"}

        assert required_tags.issubset(tag_keys)

    def test_rds_cluster_has_required_tags(self, cfn_template):
        """Verify RDS cluster has all required tags."""
        db_cluster = cfn_template["Resources"]["DBCluster"]
        tags = db_cluster["Properties"]["Tags"]

        tag_keys = {tag["Key"] for tag in tags}
        required_tags = {"Name", "Environment", "CostCenter", "MigrationPhase"}

        assert required_tags.issubset(tag_keys)

    def test_lambda_has_required_tags(self, cfn_template):
        """Verify Lambda function has all required tags."""
        lambda_func = cfn_template["Resources"]["LoanValidationFunction"]
        tags = lambda_func["Properties"]["Tags"]

        tag_keys = {tag["Key"] for tag in tags}
        required_tags = {"Name", "Environment", "CostCenter", "MigrationPhase"}

        assert required_tags.issubset(tag_keys)


class TestOutputs:
    """Test CloudFormation Outputs section."""

    def test_outputs_section_exists(self, cfn_template):
        """Verify Outputs section is present."""
        assert "Outputs" in cfn_template
        outputs = cfn_template["Outputs"]
        assert len(outputs) > 0

    def test_key_outputs_defined(self, cfn_template):
        """Verify key infrastructure outputs are defined."""
        outputs = cfn_template["Outputs"]

        # Key outputs that integration tests will need
        expected_outputs = [
            "VPCId",
            "DBClusterEndpoint",
            "DBSecretArn",
            "LoanDocumentsBucketName",
            "LoanValidationFunctionArn",
            "KMSKeyId"
        ]

        for output_key in expected_outputs:
            assert output_key in outputs, f"Missing output: {output_key}"

    def test_outputs_have_exports(self, cfn_template):
        """Verify outputs are exported for cross-stack references."""
        outputs = cfn_template["Outputs"]

        for output_name, output_config in outputs.items():
            if output_name in ["VPCId", "DBClusterEndpoint", "DBSecretArn"]:
                assert "Export" in output_config
                assert "Name" in output_config["Export"]


class TestResourceCount:
    """Test overall resource count and complexity."""

    def test_minimum_resource_count(self, cfn_template):
        """Verify template has expected number of resources."""
        resources = cfn_template["Resources"]

        # Should have 35+ resources for complete infrastructure
        # Actual: 38 resources (VPC, Subnets, RDS, Lambda, S3, KMS, etc.)
        assert len(resources) >= 35, f"Expected 35+ resources, found {len(resources)}"

    def test_no_retain_policies(self, cfn_template):
        """Verify no resources have DeletionPolicy: Retain."""
        resources = cfn_template["Resources"]

        for resource_name, resource_config in resources.items():
            if "DeletionPolicy" in resource_config:
                assert resource_config["DeletionPolicy"] != "Retain", \
                    f"Resource {resource_name} has DeletionPolicy: Retain"


class TestDependencies:
    """Test resource dependencies."""

    def test_db_cluster_depends_on_subnet_group(self, cfn_template):
        """Verify DB cluster references subnet group."""
        db_cluster = cfn_template["Resources"]["DBCluster"]
        props = db_cluster["Properties"]

        assert "DBSubnetGroupName" in props
        assert props["DBSubnetGroupName"] == {"Ref": "DBSubnetGroup"}

    def test_lambda_depends_on_log_group(self, cfn_template):
        """Verify Lambda function has explicit dependency on log group."""
        lambda_func = cfn_template["Resources"]["LoanValidationFunction"]

        assert "DependsOn" in lambda_func
        assert "LoanValidationLogGroup" in lambda_func["DependsOn"]

    def test_secret_rotation_depends_on_db_instance(self, cfn_template):
        """Verify secret rotation waits for DB instance."""
        rotation_schedule = cfn_template["Resources"]["SecretRotationSchedule"]

        assert "DependsOn" in rotation_schedule
        assert "DBInstance1" in rotation_schedule["DependsOn"]
