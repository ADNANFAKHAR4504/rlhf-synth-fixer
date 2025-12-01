"""
Unit tests for Payment Processing CloudFormation Stack
Tests template syntax, structure, and compliance with requirements.
"""

import json
import os
import pytest
from pathlib import Path
from lib.template_loader import (
    load_template,
    validate_template_structure,
    get_resources,
    get_parameters,
    get_outputs,
    find_resource_by_type
)


# Get the lib directory path
LIB_DIR = Path(__file__).parent.parent / "lib"


class TestMainTemplate:
    """Tests for the main PaymentProcessingStack.json template"""

    @pytest.fixture
    def template(self):
        """Load the main CloudFormation template"""
        template_path = str(LIB_DIR / "PaymentProcessingStack.json")
        template = load_template(template_path)
        assert validate_template_structure(template)
        return template

    def test_template_format_version(self, template):
        """Verify CloudFormation template format version"""
        assert template["AWSTemplateFormatVersion"] == "2010-09-09"

    def test_template_has_description(self, template):
        """Verify template has a description"""
        assert "Description" in template
        assert "Payment Processing" in template["Description"]

    def test_has_required_parameters(self, template):
        """Verify all required parameters are present"""
        parameters = get_parameters(template)
        required_params = [
            "EnvironmentName",
            "AccountId",
            "DomainName",
            "SnsEmail",
            "VpcCidr",
            "AvailabilityZone1",
            "AvailabilityZone2",
            "AvailabilityZone3",
            "NetworkStackTemplateUrl",
            "ComputeStackTemplateUrl",
            "StorageStackTemplateUrl",
            "MonitoringStackTemplateUrl"
        ]

        params = template["Parameters"]
        for param in required_params:
            assert param in params, f"Missing parameter: {param}"

    def test_environment_name_parameter(self, template):
        """Verify EnvironmentName parameter configuration"""
        env_param = template["Parameters"]["EnvironmentName"]
        assert env_param["Type"] == "String"
        assert set(env_param["AllowedValues"]) == {"dev", "staging", "prod"}
        assert env_param["Default"] == "dev"

    def test_account_id_parameter_validation(self, template):
        """Verify AccountId parameter has proper validation"""
        account_param = template["Parameters"]["AccountId"]
        assert account_param["Type"] == "String"
        assert "AllowedPattern" in account_param
        # Should validate 12-digit account IDs
        assert "12" in account_param["AllowedPattern"]

    def test_has_production_condition(self, template):
        """Verify IsProduction condition exists"""
        assert "Conditions" in template
        assert "IsProduction" in template["Conditions"]

        condition = template["Conditions"]["IsProduction"]
        assert "Fn::Equals" in condition

    def test_has_nested_stacks(self, template):
        """Verify all required nested stacks are present"""
        resources = get_resources(template)
        cfn_stacks = find_resource_by_type(template, "AWS::CloudFormation::Stack")
        required_stacks = ["NetworkStack", "StorageStack", "ComputeStack", "MonitoringStack"]

        for stack in required_stacks:
            assert stack in resources, f"Missing nested stack: {stack}"
            assert stack in cfn_stacks, f"Stack {stack} not found in CloudFormation stacks"
            assert resources[stack]["Type"] == "AWS::CloudFormation::Stack"

    def test_stack_dependencies(self, template):
        """Verify proper stack dependencies"""
        resources = template["Resources"]

        # ComputeStack should depend on NetworkStack and StorageStack
        compute_deps = resources["ComputeStack"].get("DependsOn", [])
        assert "NetworkStack" in compute_deps
        assert "StorageStack" in compute_deps

        # MonitoringStack should depend on ComputeStack and StorageStack
        monitoring_deps = resources["MonitoringStack"].get("DependsOn", [])
        assert "ComputeStack" in monitoring_deps
        assert "StorageStack" in monitoring_deps

    def test_has_required_outputs(self, template):
        """Verify all required outputs are present"""
        required_outputs = [
            "StackName",
            "EnvironmentName",
            "VpcId",
            "AlbDnsName",
            "StateMachineArn",
            "PaymentTableName"
        ]

        outputs = get_outputs(template)
        for output in required_outputs:
            assert output in outputs, f"Missing output: {output}"

    def test_outputs_have_exports(self, template):
        """Verify outputs are exported for cross-stack references"""
        outputs = template["Outputs"]

        for output_name, output_config in outputs.items():
            assert "Export" in output_config, f"Output {output_name} missing Export"
            assert "Name" in output_config["Export"]


class TestNetworkStack:
    """Tests for the Network nested stack"""

    @pytest.fixture
    def template(self):
        """Load the Network CloudFormation template"""
        template_path = str(LIB_DIR / "nested" / "NetworkStack.json")
        template = load_template(template_path)
        assert validate_template_structure(template)
        return template

    def test_has_vpc(self, template):
        """Verify VPC resource exists"""
        assert "VPC" in template["Resources"]
        assert template["Resources"]["VPC"]["Type"] == "AWS::EC2::VPC"

    def test_vpc_uses_environment_name(self, template):
        """Verify VPC uses EnvironmentName parameter"""
        vpc_tags = template["Resources"]["VPC"]["Properties"]["Tags"]
        name_tag = next((tag for tag in vpc_tags if tag["Key"] == "Name"), None)
        assert name_tag is not None
        assert "EnvironmentName" in str(name_tag["Value"])

    def test_has_three_availability_zones(self, template):
        """Verify three AZ parameters"""
        params = template["Parameters"]
        assert "AvailabilityZone1" in params
        assert "AvailabilityZone2" in params
        assert "AvailabilityZone3" in params

    def test_has_public_and_private_subnets(self, template):
        """Verify 3 public and 3 private subnets"""
        resources = template["Resources"]

        # Check for 3 public subnets
        assert "PublicSubnet1" in resources
        assert "PublicSubnet2" in resources
        assert "PublicSubnet3" in resources

        # Check for 3 private subnets
        assert "PrivateSubnet1" in resources
        assert "PrivateSubnet2" in resources
        assert "PrivateSubnet3" in resources

    def test_has_internet_gateway(self, template):
        """Verify Internet Gateway exists"""
        resources = template["Resources"]
        assert "InternetGateway" in resources
        assert "AttachGateway" in resources

    def test_has_security_groups(self, template):
        """Verify required security groups exist"""
        resources = template["Resources"]
        assert "LambdaSecurityGroup" in resources
        assert "AlbSecurityGroup" in resources

    def test_alb_security_group_allows_https(self, template):
        """Verify ALB security group allows HTTPS"""
        alb_sg = template["Resources"]["AlbSecurityGroup"]["Properties"]
        ingress_rules = alb_sg["SecurityGroupIngress"]

        https_rule = next((rule for rule in ingress_rules if rule["FromPort"] == 443), None)
        assert https_rule is not None
        assert https_rule["ToPort"] == 443
        assert https_rule["IpProtocol"] == "tcp"

    def test_has_dynamodb_endpoint(self, template):
        """Verify DynamoDB VPC endpoint exists"""
        resources = template["Resources"]
        assert "DynamoDBEndpoint" in resources
        assert resources["DynamoDBEndpoint"]["Type"] == "AWS::EC2::VPCEndpoint"

    def test_outputs_all_subnet_ids(self, template):
        """Verify all subnet IDs are output"""
        outputs = template["Outputs"]
        required_outputs = [
            "PublicSubnet1Id", "PublicSubnet2Id", "PublicSubnet3Id",
            "PrivateSubnet1Id", "PrivateSubnet2Id", "PrivateSubnet3Id"
        ]

        for output in required_outputs:
            assert output in outputs


class TestStorageStack:
    """Tests for the Storage nested stack"""

    @pytest.fixture
    def template(self):
        """Load the Storage CloudFormation template"""
        template_path = str(LIB_DIR / "nested" / "StorageStack.json")
        template = load_template(template_path)
        assert validate_template_structure(template)
        return template

    def test_has_payment_table(self, template):
        """Verify payment transactions table exists"""
        resources = template["Resources"]
        assert "PaymentTransactionsTable" in resources
        assert resources["PaymentTransactionsTable"]["Type"] == "AWS::DynamoDB::Table"

    def test_table_uses_environment_name(self, template):
        """Verify table name includes EnvironmentName"""
        table = template["Resources"]["PaymentTransactionsTable"]["Properties"]
        table_name = table["TableName"]
        assert "EnvironmentName" in str(table_name)

    def test_table_has_correct_keys(self, template):
        """Verify table has correct partition and sort keys"""
        table = template["Resources"]["PaymentTransactionsTable"]["Properties"]
        key_schema = table["KeySchema"]

        # Check partition key
        hash_key = next((key for key in key_schema if key["KeyType"] == "HASH"), None)
        assert hash_key is not None
        assert hash_key["AttributeName"] == "transactionId"

        # Check sort key
        range_key = next((key for key in key_schema if key["KeyType"] == "RANGE"), None)
        assert range_key is not None
        assert range_key["AttributeName"] == "timestamp"

    def test_table_has_two_gsi(self, template):
        """Verify table has exactly 2 Global Secondary Indexes"""
        table = template["Resources"]["PaymentTransactionsTable"]["Properties"]
        gsis = table["GlobalSecondaryIndexes"]

        assert len(gsis) == 2

        # Check GSI names
        gsi_names = [gsi["IndexName"] for gsi in gsis]
        assert "customer-index" in gsi_names
        assert "status-index" in gsi_names

    def test_customer_gsi_configuration(self, template):
        """Verify customer GSI has correct configuration"""
        table = template["Resources"]["PaymentTransactionsTable"]["Properties"]
        gsis = table["GlobalSecondaryIndexes"]

        customer_gsi = next((gsi for gsi in gsis if gsi["IndexName"] == "customer-index"), None)
        assert customer_gsi is not None

        # Check key schema
        key_schema = customer_gsi["KeySchema"]
        hash_key = next((key for key in key_schema if key["KeyType"] == "HASH"), None)
        assert hash_key["AttributeName"] == "customerId"

    def test_table_billing_mode(self, template):
        """Verify table uses on-demand billing"""
        table = template["Resources"]["PaymentTransactionsTable"]["Properties"]
        assert table["BillingMode"] == "PAY_PER_REQUEST"

    def test_table_deletion_policy(self, template):
        """Verify table has Delete deletion policy"""
        table = template["Resources"]["PaymentTransactionsTable"]
        assert table["DeletionPolicy"] == "Delete"
        assert table["UpdateReplacePolicy"] == "Delete"


class TestComputeStack:
    """Tests for the Compute nested stack"""

    @pytest.fixture
    def template(self):
        """Load the Compute CloudFormation template"""
        with open(LIB_DIR / "nested" / "ComputeStack.json") as f:
            return json.load(f)

    def test_has_lambda_functions(self, template):
        """Verify both Lambda functions exist"""
        resources = template["Resources"]
        assert "ValidationFunction" in resources
        assert "ProcessingFunction" in resources

    def test_lambda_runtime(self, template):
        """Verify Lambda functions use Node.js 18.x"""
        validation = template["Resources"]["ValidationFunction"]["Properties"]
        processing = template["Resources"]["ProcessingFunction"]["Properties"]

        assert validation["Runtime"] == "nodejs18.x"
        assert processing["Runtime"] == "nodejs18.x"

    def test_lambda_memory(self, template):
        """Verify Lambda functions have 512 MB memory"""
        validation = template["Resources"]["ValidationFunction"]["Properties"]
        processing = template["Resources"]["ProcessingFunction"]["Properties"]

        assert validation["MemorySize"] == 512
        assert processing["MemorySize"] == 512

    def test_lambda_timeouts(self, template):
        """Verify Lambda function timeouts"""
        validation = template["Resources"]["ValidationFunction"]["Properties"]
        processing = template["Resources"]["ProcessingFunction"]["Properties"]

        assert validation["Timeout"] == 30
        assert processing["Timeout"] == 60

    def test_lambda_uses_environment_name(self, template):
        """Verify Lambda functions include EnvironmentName in name"""
        validation = template["Resources"]["ValidationFunction"]["Properties"]
        processing = template["Resources"]["ProcessingFunction"]["Properties"]

        assert "EnvironmentName" in str(validation["FunctionName"])
        assert "EnvironmentName" in str(processing["FunctionName"])

    def test_lambda_reserved_concurrency_conditional(self, template):
        """Verify reserved concurrency uses production condition"""
        validation = template["Resources"]["ValidationFunction"]["Properties"]

        assert "ReservedConcurrentExecutions" in validation
        concurrency = validation["ReservedConcurrentExecutions"]
        assert "Fn::If" in concurrency
        assert concurrency["Fn::If"][0] == "EnableProductionFeatures"

    def test_has_alb(self, template):
        """Verify Application Load Balancer exists"""
        resources = template["Resources"]
        assert "ApplicationLoadBalancer" in resources
        assert resources["ApplicationLoadBalancer"]["Type"] == "AWS::ElasticLoadBalancingV2::LoadBalancer"

    def test_alb_type_and_scheme(self, template):
        """Verify ALB is application type and internet-facing"""
        alb = template["Resources"]["ApplicationLoadBalancer"]["Properties"]
        assert alb["Type"] == "application"
        assert alb["Scheme"] == "internet-facing"

    def test_has_target_groups(self, template):
        """Verify target groups for both Lambda functions"""
        resources = template["Resources"]
        assert "ValidationTargetGroup" in resources
        assert "ProcessingTargetGroup" in resources

    def test_target_groups_are_lambda_type(self, template):
        """Verify target groups are configured for Lambda"""
        validation_tg = template["Resources"]["ValidationTargetGroup"]["Properties"]
        processing_tg = template["Resources"]["ProcessingTargetGroup"]["Properties"]

        assert validation_tg["TargetType"] == "lambda"
        assert processing_tg["TargetType"] == "lambda"

    def test_has_step_functions_state_machine(self, template):
        """Verify Step Functions state machine exists"""
        resources = template["Resources"]
        assert "PaymentStateMachine" in resources
        assert resources["PaymentStateMachine"]["Type"] == "AWS::StepFunctions::StateMachine"

    def test_state_machine_uses_environment_name(self, template):
        """Verify state machine name includes EnvironmentName"""
        state_machine = template["Resources"]["PaymentStateMachine"]["Properties"]
        assert "EnvironmentName" in str(state_machine["StateMachineName"])

    def test_has_iam_roles(self, template):
        """Verify IAM roles exist"""
        resources = template["Resources"]
        assert "LambdaExecutionRole" in resources
        assert "StepFunctionsRole" in resources


class TestMonitoringStack:
    """Tests for the Monitoring nested stack"""

    @pytest.fixture
    def template(self):
        """Load the Monitoring CloudFormation template"""
        with open(LIB_DIR / "nested" / "MonitoringStack.json") as f:
            return json.load(f)

    def test_has_sns_topic(self, template):
        """Verify SNS topic exists"""
        resources = template["Resources"]
        assert "AlarmTopic" in resources
        assert resources["AlarmTopic"]["Type"] == "AWS::SNS::Topic"

    def test_sns_topic_uses_environment_name(self, template):
        """Verify SNS topic name includes EnvironmentName"""
        topic = template["Resources"]["AlarmTopic"]["Properties"]
        assert "EnvironmentName" in str(topic["TopicName"])

    def test_has_cloudwatch_alarms(self, template):
        """Verify all required CloudWatch alarms exist"""
        resources = template["Resources"]
        required_alarms = [
            "ValidationFunctionErrorAlarm",
            "ProcessingFunctionErrorAlarm",
            "DynamoDBThrottleAlarm",
            "StateMachineFailureAlarm",
            "ValidationFunctionDurationAlarm"
        ]

        for alarm in required_alarms:
            assert alarm in resources, f"Missing alarm: {alarm}"
            assert resources[alarm]["Type"] == "AWS::CloudWatch::Alarm"

    def test_lambda_error_alarm_threshold(self, template):
        """Verify Lambda error alarms have correct threshold"""
        validation_alarm = template["Resources"]["ValidationFunctionErrorAlarm"]["Properties"]
        processing_alarm = template["Resources"]["ProcessingFunctionErrorAlarm"]["Properties"]

        assert validation_alarm["Threshold"] == 5
        assert processing_alarm["Threshold"] == 5
        assert validation_alarm["Period"] == 300  # 5 minutes

    def test_alarms_publish_to_sns(self, template):
        """Verify all alarms publish to SNS topic"""
        resources = template["Resources"]
        alarms = [
            "ValidationFunctionErrorAlarm",
            "ProcessingFunctionErrorAlarm",
            "DynamoDBThrottleAlarm"
        ]

        for alarm_name in alarms:
            alarm = resources[alarm_name]["Properties"]
            assert "AlarmActions" in alarm
            assert "Ref" in alarm["AlarmActions"][0]
            assert alarm["AlarmActions"][0]["Ref"] == "AlarmTopic"


class TestParameterFiles:
    """Tests for environment parameter files"""

    @pytest.fixture
    def dev_params(self):
        """Load dev parameter file"""
        with open(LIB_DIR / "parameters" / "dev-params.json") as f:
            return json.load(f)

    @pytest.fixture
    def staging_params(self):
        """Load staging parameter file"""
        with open(LIB_DIR / "parameters" / "staging-params.json") as f:
            return json.load(f)

    @pytest.fixture
    def prod_params(self):
        """Load prod parameter file"""
        with open(LIB_DIR / "parameters" / "prod-params.json") as f:
            return json.load(f)

    def test_dev_environment_name(self, dev_params):
        """Verify dev params have correct EnvironmentName"""
        env_param = next((p for p in dev_params if p["ParameterKey"] == "EnvironmentName"), None)
        assert env_param is not None
        assert env_param["ParameterValue"] == "dev"

    def test_staging_environment_name(self, staging_params):
        """Verify staging params have correct EnvironmentName"""
        env_param = next((p for p in staging_params if p["ParameterKey"] == "EnvironmentName"), None)
        assert env_param is not None
        assert env_param["ParameterValue"] == "staging"

    def test_prod_environment_name(self, prod_params):
        """Verify prod params have correct EnvironmentName"""
        env_param = next((p for p in prod_params if p["ParameterKey"] == "EnvironmentName"), None)
        assert env_param is not None
        assert env_param["ParameterValue"] == "prod"

    def test_account_ids_differ(self, dev_params, staging_params, prod_params):
        """Verify each environment has different account ID"""
        def get_account_id(params):
            param = next((p for p in params if p["ParameterKey"] == "AccountId"), None)
            return param["ParameterValue"] if param else None

        dev_account = get_account_id(dev_params)
        staging_account = get_account_id(staging_params)
        prod_account = get_account_id(prod_params)

        assert dev_account != staging_account
        assert staging_account != prod_account
        assert dev_account != prod_account

    def test_vpc_cidrs_differ(self, dev_params, staging_params, prod_params):
        """Verify each environment has different VPC CIDR"""
        def get_vpc_cidr(params):
            param = next((p for p in params if p["ParameterKey"] == "VpcCidr"), None)
            return param["ParameterValue"] if param else None

        dev_cidr = get_vpc_cidr(dev_params)
        staging_cidr = get_vpc_cidr(staging_params)
        prod_cidr = get_vpc_cidr(prod_params)

        assert dev_cidr != staging_cidr
        assert staging_cidr != prod_cidr

    def test_all_params_have_same_keys(self, dev_params, staging_params, prod_params):
        """Verify all parameter files have the same parameter keys"""
        dev_keys = set(p["ParameterKey"] for p in dev_params)
        staging_keys = set(p["ParameterKey"] for p in staging_params)
        prod_keys = set(p["ParameterKey"] for p in prod_params)

        assert dev_keys == staging_keys == prod_keys


class TestConsistency:
    """Tests for multi-environment consistency requirements"""

    def test_all_templates_valid_json(self):
        """Verify all JSON templates are valid"""
        json_files = list((LIB_DIR / "nested").glob("*.json"))
        json_files.append(LIB_DIR / "PaymentProcessingStack.json")

        for json_file in json_files:
            with open(json_file) as f:
                try:
                    json.load(f)
                except json.JSONDecodeError as e:
                    pytest.fail(f"Invalid JSON in {json_file}: {e}")

    def test_lambda_configs_identical_across_templates(self):
        """Verify Lambda configuration is identical across nested template"""
        with open(LIB_DIR / "nested" / "ComputeStack.json") as f:
            compute = json.load(f)

        validation = compute["Resources"]["ValidationFunction"]["Properties"]
        processing = compute["Resources"]["ProcessingFunction"]["Properties"]

        # Both should have identical runtime and memory
        assert validation["Runtime"] == processing["Runtime"] == "nodejs18.x"
        assert validation["MemorySize"] == processing["MemorySize"] == 512

    def test_dynamodb_billing_consistent(self):
        """Verify DynamoDB uses consistent billing mode"""
        with open(LIB_DIR / "nested" / "StorageStack.json") as f:
            storage = json.load(f)

        table = storage["Resources"]["PaymentTransactionsTable"]["Properties"]
        assert table["BillingMode"] == "PAY_PER_REQUEST"

    def test_all_resources_use_intrinsic_functions(self):
        """Verify IAM roles use CloudFormation intrinsic functions only"""
        with open(LIB_DIR / "nested" / "ComputeStack.json") as f:
            compute = json.load(f)

        # Check Lambda execution role
        role = compute["Resources"]["LambdaExecutionRole"]["Properties"]
        policies = role["Policies"]

        # Verify policies use Ref and Fn::Sub
        for policy in policies:
            policy_doc = json.dumps(policy)
            # Should not have hard-coded ARNs or values
            assert "123456789012" not in policy_doc
            assert "234567890123" not in policy_doc


class TestTemplateLoader:
    """Tests for the template_loader module"""

    def test_load_nonexistent_template(self):
        """Test that loading a nonexistent template raises FileNotFoundError"""
        from lib.template_loader import load_template
        with pytest.raises(FileNotFoundError):
            load_template("/nonexistent/path/template.json")

    def test_validate_non_dict_template(self):
        """Test validation of non-dict template raises ValueError"""
        from lib.template_loader import validate_template_structure
        with pytest.raises(ValueError, match="must be a dictionary"):
            validate_template_structure("not a dict")

    def test_validate_missing_format_version(self):
        """Test validation of template missing AWSTemplateFormatVersion"""
        from lib.template_loader import validate_template_structure
        with pytest.raises(ValueError, match="AWSTemplateFormatVersion"):
            validate_template_structure({"Resources": {}})

    def test_validate_missing_resources(self):
        """Test validation of template missing Resources section"""
        from lib.template_loader import validate_template_structure
        with pytest.raises(ValueError, match="Resources"):
            validate_template_structure({"AWSTemplateFormatVersion": "2010-09-09"})

    def test_find_resource_by_type_no_matches(self):
        """Test finding resources by type when none exist"""
        from lib.template_loader import find_resource_by_type
        template = {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Resources": {
                "Bucket": {"Type": "AWS::S3::Bucket"}
            }
        }
        result = find_resource_by_type(template, "AWS::Lambda::Function")
        assert result == {}

    def test_find_resource_by_type_with_matches(self):
        """Test finding resources by type when they exist"""
        from lib.template_loader import find_resource_by_type
        template = {
            "AWSTemplateFormatVersion": "2010-09-09",
            "Resources": {
                "Func1": {"Type": "AWS::Lambda::Function"},
                "Func2": {"Type": "AWS::Lambda::Function"},
                "Bucket": {"Type": "AWS::S3::Bucket"}
            }
        }
        result = find_resource_by_type(template, "AWS::Lambda::Function")
        assert len(result) == 2
        assert "Func1" in result
        assert "Func2" in result
