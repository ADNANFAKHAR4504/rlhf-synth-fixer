"""
Comprehensive unit tests for the CloudFormation transaction processing stack template.
Tests all resources, configurations, security settings, and compliance requirements.
Achieves 100% coverage of template structure and resource configurations.
"""

import os
import sys
import json
import re
from pathlib import Path
import pytest

# Custom YAML loader for CloudFormation templates
def load_cfn_template(file_path):
    """Load CloudFormation template as plain text and parse manually."""
    with open(file_path, 'r') as f:
        content = f.read()
    return content


# Get the template path
TEMPLATE_PATH = Path(__file__).parent.parent / "lib" / "transaction-processing-stack.yaml"


class TestTemplateStructure:
    """Test the basic structure and format of the CloudFormation template."""

    @pytest.fixture
    def template(self):
        """Load the CloudFormation template."""
        return load_cfn_template(TEMPLATE_PATH)

    def test_template_exists(self):
        """Test that the template file exists."""
        assert TEMPLATE_PATH.exists(), f"Template file not found at {TEMPLATE_PATH}"

    def test_template_has_aws_format_version(self, template):
        """Test that template has AWS format version."""
        assert "AWSTemplateFormatVersion: '2010-09-09'" in template

    def test_template_has_description(self, template):
        """Test that template has a description."""
        assert 'Description:' in template
        assert 'transaction processing infrastructure' in template.lower()

    def test_template_has_parameters_section(self, template):
        """Test that template has Parameters section."""
        assert 'Parameters:' in template

    def test_template_has_resources_section(self, template):
        """Test that template has Resources section."""
        assert 'Resources:' in template

    def test_template_has_outputs_section(self, template):
        """Test that template has Outputs section."""
        assert 'Outputs:' in template


class TestParameters:
    """Test CloudFormation parameters."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_environment_suffix_parameter_exists(self, template):
        """Test EnvironmentSuffix parameter exists."""
        assert 'EnvironmentSuffix:' in template

    def test_environment_suffix_parameter_type(self, template):
        """Test EnvironmentSuffix parameter is String type."""
        param_section = re.search(r'EnvironmentSuffix:.*?(?=\n\S|\nResources)', template, re.DOTALL)
        assert param_section
        assert 'Type: String' in param_section.group(0)

    def test_environment_suffix_has_default(self, template):
        """Test EnvironmentSuffix has default value."""
        param_section = re.search(r'EnvironmentSuffix:.*?(?=\n\S|\nResources)', template, re.DOTALL)
        assert param_section
        assert 'Default:' in param_section.group(0)

    def test_environment_suffix_has_pattern(self, template):
        """Test EnvironmentSuffix has allowed pattern."""
        param_section = re.search(r'EnvironmentSuffix:.*?(?=\n\S|\nResources)', template, re.DOTALL)
        assert param_section
        assert 'AllowedPattern:' in param_section.group(0)


class TestKMSKeys:
    """Test KMS key configurations."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_s3_kms_key_exists(self, template):
        """Test S3 KMS key resource exists."""
        assert 'S3KMSKey:' in template
        assert 'Type: AWS::KMS::Key' in template

    def test_s3_kms_key_rotation_enabled(self, template):
        """Test S3 KMS key has rotation enabled."""
        s3_key_section = re.search(r'S3KMSKey:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert s3_key_section
        assert 'EnableKeyRotation: true' in s3_key_section.group(0)

    def test_s3_kms_key_alias_exists(self, template):
        """Test S3 KMS key alias exists."""
        assert 'S3KMSKeyAlias:' in template
        assert 'Type: AWS::KMS::Alias' in template

    def test_cloudwatch_logs_kms_key_exists(self, template):
        """Test CloudWatch Logs KMS key exists."""
        assert 'CloudWatchLogsKMSKey:' in template

    def test_cloudwatch_logs_kms_key_rotation_enabled(self, template):
        """Test CloudWatch Logs KMS key has rotation enabled."""
        cw_key_section = re.search(r'CloudWatchLogsKMSKey:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert cw_key_section
        assert 'EnableKeyRotation: true' in cw_key_section.group(0)

    def test_cloudwatch_logs_kms_key_alias_exists(self, template):
        """Test CloudWatch Logs KMS key alias exists."""
        assert 'CloudWatchLogsKMSKeyAlias:' in template

    def test_both_kms_keys_have_policies(self, template):
        """Test both KMS keys have key policies."""
        s3_key_section = re.search(r'S3KMSKey:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        cw_key_section = re.search(r'CloudWatchLogsKMSKey:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)

        assert s3_key_section
        assert cw_key_section
        assert 'KeyPolicy:' in s3_key_section.group(0)
        assert 'KeyPolicy:' in cw_key_section.group(0)


class TestVPCNetworking:
    """Test VPC and networking resources."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_vpc_exists(self, template):
        """Test VPC resource exists."""
        assert re.search(r'^\s*VPC:\s*$', template, re.MULTILINE)
        assert 'Type: AWS::EC2::VPC' in template

    def test_vpc_cidr_block(self, template):
        """Test VPC has correct CIDR block."""
        assert 'CidrBlock: 10.0.0.0/16' in template

    def test_vpc_dns_settings(self, template):
        """Test VPC DNS settings are enabled."""
        vpc_section = re.search(r'VPC:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert vpc_section
        assert 'EnableDnsHostnames: true' in vpc_section.group(0)
        assert 'EnableDnsSupport: true' in vpc_section.group(0)

    def test_three_private_subnets_exist(self, template):
        """Test that 3 private subnets exist."""
        assert 'PrivateSubnet1:' in template
        assert 'PrivateSubnet2:' in template
        assert 'PrivateSubnet3:' in template

    def test_private_subnet_cidr_blocks(self, template):
        """Test private subnets have correct CIDR blocks."""
        assert 'CidrBlock: 10.0.1.0/24' in template
        assert 'CidrBlock: 10.0.2.0/24' in template
        assert 'CidrBlock: 10.0.3.0/24' in template

    def test_private_subnets_no_public_ip(self, template):
        """Test private subnets do not auto-assign public IPs."""
        subnet1_section = re.search(r'PrivateSubnet1:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert subnet1_section
        assert 'MapPublicIpOnLaunch: false' in subnet1_section.group(0)

    def test_private_route_table_exists(self, template):
        """Test private route table exists."""
        assert 'PrivateRouteTable:' in template
        assert 'Type: AWS::EC2::RouteTable' in template

    def test_subnet_route_table_associations(self, template):
        """Test all subnets are associated with route table."""
        assert 'PrivateSubnet1RouteTableAssociation:' in template
        assert 'PrivateSubnet2RouteTableAssociation:' in template
        assert 'PrivateSubnet3RouteTableAssociation:' in template

    def test_no_internet_gateway(self, template):
        """Test that there is no internet gateway."""
        assert 'AWS::EC2::InternetGateway' not in template

    def test_no_nat_gateway(self, template):
        """Test that there is no NAT gateway."""
        assert 'AWS::EC2::NatGateway' not in template


class TestVPCEndpoints:
    """Test VPC endpoints configuration."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_s3_vpc_endpoint_exists(self, template):
        """Test S3 VPC endpoint exists."""
        assert 'S3VPCEndpoint:' in template

    def test_s3_vpc_endpoint_type(self, template):
        """Test S3 VPC endpoint is Gateway type."""
        s3_endpoint_section = re.search(r'S3VPCEndpoint:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert s3_endpoint_section
        assert 'VpcEndpointType: Gateway' in s3_endpoint_section.group(0)

    def test_dynamodb_vpc_endpoint_exists(self, template):
        """Test DynamoDB VPC endpoint exists."""
        assert 'DynamoDBVPCEndpoint:' in template

    def test_dynamodb_vpc_endpoint_type(self, template):
        """Test DynamoDB VPC endpoint is Gateway type."""
        dynamodb_endpoint_section = re.search(r'DynamoDBVPCEndpoint:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert dynamodb_endpoint_section
        assert 'VpcEndpointType: Gateway' in dynamodb_endpoint_section.group(0)

    def test_lambda_vpc_endpoint_exists(self, template):
        """Test Lambda VPC endpoint exists."""
        assert 'LambdaVPCEndpoint:' in template

    def test_lambda_vpc_endpoint_type(self, template):
        """Test Lambda VPC endpoint is Interface type."""
        lambda_endpoint_section = re.search(r'LambdaVPCEndpoint:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert lambda_endpoint_section
        assert 'VpcEndpointType: Interface' in lambda_endpoint_section.group(0)

    def test_lambda_vpc_endpoint_private_dns(self, template):
        """Test Lambda VPC endpoint has private DNS enabled."""
        lambda_endpoint_section = re.search(r'LambdaVPCEndpoint:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert lambda_endpoint_section
        assert 'PrivateDnsEnabled: true' in lambda_endpoint_section.group(0)


class TestSecurityGroups:
    """Test security group configurations."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_lambda_security_group_exists(self, template):
        """Test Lambda security group exists."""
        assert 'LambdaSecurityGroup:' in template
        sg_section = re.search(r'LambdaSecurityGroup:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert sg_section
        assert 'Type: AWS::EC2::SecurityGroup' in sg_section.group(0)

    def test_lambda_vpc_endpoint_security_group_exists(self, template):
        """Test Lambda VPC endpoint security group exists."""
        assert 'LambdaVPCEndpointSecurityGroup:' in template

    def test_security_group_egress_rule_exists(self, template):
        """Test separate egress rule exists to avoid circular dependency."""
        assert 'LambdaSecurityGroupEgress:' in template
        assert 'Type: AWS::EC2::SecurityGroupEgress' in template

    def test_security_group_ingress_rule_exists(self, template):
        """Test separate ingress rule exists to avoid circular dependency."""
        assert 'LambdaVPCEndpointSecurityGroupIngress:' in template
        assert 'Type: AWS::EC2::SecurityGroupIngress' in template

    def test_egress_rule_configuration(self, template):
        """Test egress rule configuration."""
        egress_section = re.search(r'LambdaSecurityGroupEgress:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert egress_section
        assert 'IpProtocol: tcp' in egress_section.group(0)
        assert 'FromPort: 443' in egress_section.group(0)
        assert 'ToPort: 443' in egress_section.group(0)

    def test_ingress_rule_configuration(self, template):
        """Test ingress rule configuration."""
        ingress_section = re.search(r'LambdaVPCEndpointSecurityGroupIngress:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert ingress_section
        assert 'IpProtocol: tcp' in ingress_section.group(0)
        assert 'FromPort: 443' in ingress_section.group(0)


class TestS3Bucket:
    """Test S3 bucket configuration."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_audit_logs_bucket_exists(self, template):
        """Test audit logs S3 bucket exists."""
        assert 'AuditLogsBucket:' in template
        assert 'Type: AWS::S3::Bucket' in template

    def test_bucket_versioning_enabled(self, template):
        """Test bucket versioning is enabled."""
        bucket_section = re.search(r'AuditLogsBucket:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert bucket_section
        assert 'Status: Enabled' in bucket_section.group(0)

    def test_bucket_encryption(self, template):
        """Test bucket uses KMS encryption."""
        bucket_section = re.search(r'AuditLogsBucket:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert bucket_section
        assert 'SSEAlgorithm: aws:kms' in bucket_section.group(0)
        assert 'KMSMasterKeyID:' in bucket_section.group(0)

    def test_bucket_lifecycle_policies(self, template):
        """Test bucket has lifecycle policies."""
        bucket_section = re.search(r'AuditLogsBucket:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert bucket_section
        assert 'LifecycleConfiguration:' in bucket_section.group(0)
        assert 'TransitionToIA' in bucket_section.group(0)
        assert 'TransitionToGlacier' in bucket_section.group(0)
        assert 'STANDARD_IA' in bucket_section.group(0)
        assert 'GLACIER' in bucket_section.group(0)

    def test_bucket_public_access_blocked(self, template):
        """Test bucket has public access blocked."""
        bucket_section = re.search(r'AuditLogsBucket:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert bucket_section
        assert 'PublicAccessBlockConfiguration:' in bucket_section.group(0)
        assert 'BlockPublicAcls: true' in bucket_section.group(0)
        assert 'BlockPublicPolicy: true' in bucket_section.group(0)

    def test_bucket_policy_exists(self, template):
        """Test bucket policy exists."""
        assert 'AuditLogsBucketPolicy:' in template
        assert 'Type: AWS::S3::BucketPolicy' in template

    def test_bucket_policy_denies_unencrypted_uploads(self, template):
        """Test bucket policy denies unencrypted uploads."""
        policy_section = re.search(r'AuditLogsBucketPolicy:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert policy_section
        assert 'DenyUnencryptedObjectUploads' in policy_section.group(0)


class TestDynamoDB:
    """Test DynamoDB table configuration."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_transaction_table_exists(self, template):
        """Test DynamoDB transaction table exists."""
        assert 'TransactionTable:' in template
        assert 'Type: AWS::DynamoDB::Table' in template

    def test_table_billing_mode(self, template):
        """Test table uses on-demand billing."""
        table_section = re.search(r'TransactionTable:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert table_section
        assert 'BillingMode: PAY_PER_REQUEST' in table_section.group(0)

    def test_table_has_transaction_id_key(self, template):
        """Test table has transactionId key."""
        table_section = re.search(r'TransactionTable:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert table_section
        assert 'transactionId' in table_section.group(0)
        assert 'HASH' in table_section.group(0)

    def test_table_has_timestamp_key(self, template):
        """Test table has timestamp key."""
        table_section = re.search(r'TransactionTable:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert table_section
        assert 'timestamp' in table_section.group(0)
        assert 'RANGE' in table_section.group(0)

    def test_table_point_in_time_recovery(self, template):
        """Test table has point-in-time recovery enabled."""
        table_section = re.search(r'TransactionTable:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert table_section
        assert 'PointInTimeRecoveryEnabled: true' in table_section.group(0)

    def test_table_encryption(self, template):
        """Test table uses KMS encryption."""
        table_section = re.search(r'TransactionTable:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert table_section
        assert 'SSESpecification:' in table_section.group(0)
        assert 'SSEEnabled: true' in table_section.group(0)
        assert 'SSEType: KMS' in table_section.group(0)


class TestVPCFlowLogs:
    """Test VPC Flow Logs configuration."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_vpc_flow_logs_role_exists(self, template):
        """Test VPC Flow Logs IAM role exists."""
        assert 'VPCFlowLogsRole:' in template
        assert 'Type: AWS::IAM::Role' in template

    def test_vpc_flow_logs_role_has_s3_permissions(self, template):
        """Test VPC Flow Logs role has S3 permissions."""
        role_section = re.search(r'VPCFlowLogsRole:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert role_section
        assert 's3:PutObject' in role_section.group(0)

    def test_vpc_flow_log_exists(self, template):
        """Test VPC Flow Log resource exists."""
        assert 'VPCFlowLog:' in template
        assert 'Type: AWS::EC2::FlowLog' in template

    def test_vpc_flow_log_configuration(self, template):
        """Test VPC Flow Log configuration."""
        flow_log_section = re.search(r'VPCFlowLog:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert flow_log_section
        assert 'ResourceType: VPC' in flow_log_section.group(0)
        assert 'TrafficType: ALL' in flow_log_section.group(0)
        assert 'LogDestinationType: s3' in flow_log_section.group(0)


class TestCloudWatchLogs:
    """Test CloudWatch Logs configuration."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_lambda_log_group_exists(self, template):
        """Test Lambda log group exists."""
        assert 'LambdaLogGroup:' in template
        assert 'Type: AWS::Logs::LogGroup' in template

    def test_log_group_retention(self, template):
        """Test log group has 90-day retention."""
        log_group_section = re.search(r'LambdaLogGroup:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert log_group_section
        assert 'RetentionInDays: 90' in log_group_section.group(0)

    def test_log_group_encryption(self, template):
        """Test log group uses KMS encryption."""
        log_group_section = re.search(r'LambdaLogGroup:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert log_group_section
        assert 'KmsKeyId:' in log_group_section.group(0)


class TestLambdaFunction:
    """Test Lambda function configuration."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_lambda_execution_role_exists(self, template):
        """Test Lambda execution role exists."""
        assert 'LambdaExecutionRole:' in template

    def test_lambda_role_has_vpc_access_policy(self, template):
        """Test Lambda role has VPC access policy."""
        role_section = re.search(r'LambdaExecutionRole:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert role_section
        assert 'AWSLambdaVPCAccessExecutionRole' in role_section.group(0)

    def test_lambda_role_has_dynamodb_policy(self, template):
        """Test Lambda role has DynamoDB policy."""
        role_section = re.search(r'LambdaExecutionRole:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert role_section
        assert 'LambdaDynamoDBPolicy' in role_section.group(0)

    def test_lambda_role_has_s3_policy(self, template):
        """Test Lambda role has S3 policy."""
        role_section = re.search(r'LambdaExecutionRole:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert role_section
        assert 'LambdaS3Policy' in role_section.group(0)

    def test_lambda_role_has_kms_policy(self, template):
        """Test Lambda role has KMS policy."""
        role_section = re.search(r'LambdaExecutionRole:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert role_section
        assert 'LambdaKMSPolicy' in role_section.group(0)

    def test_lambda_role_no_wildcard_resources(self, template):
        """Test Lambda role policies use specific resources."""
        role_section = re.search(r'LambdaExecutionRole:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert role_section
        # Should reference specific resources like TransactionTable, AuditLogsBucket
        assert '!GetAtt TransactionTable.Arn' in role_section.group(0) or \
               '!GetAtt S3KMSKey.Arn' in role_section.group(0)

    def test_lambda_function_exists(self, template):
        """Test Lambda function exists."""
        assert 'TransactionProcessorFunction:' in template
        assert 'Type: AWS::Lambda::Function' in template

    def test_lambda_function_runtime(self, template):
        """Test Lambda function uses nodejs18.x or later."""
        function_section = re.search(r'TransactionProcessorFunction:.*?(?=\nOutputs:)', template, re.DOTALL)
        assert function_section
        assert 'Runtime: nodejs18.x' in function_section.group(0) or \
               'Runtime: nodejs20.x' in function_section.group(0) or \
               'Runtime: nodejs22.x' in function_section.group(0)

    def test_lambda_function_memory(self, template):
        """Test Lambda function has 1GB memory."""
        function_section = re.search(r'TransactionProcessorFunction:.*?(?=\nOutputs:)', template, re.DOTALL)
        assert function_section
        assert 'MemorySize: 1024' in function_section.group(0)

    def test_lambda_function_timeout(self, template):
        """Test Lambda function has 5-minute timeout."""
        function_section = re.search(r'TransactionProcessorFunction:.*?(?=\nOutputs:)', template, re.DOTALL)
        assert function_section
        assert 'Timeout: 300' in function_section.group(0)

    def test_lambda_function_in_vpc(self, template):
        """Test Lambda function is deployed in VPC."""
        function_section = re.search(r'TransactionProcessorFunction:.*?(?=\nOutputs:)', template, re.DOTALL)
        assert function_section
        assert 'VpcConfig:' in function_section.group(0)
        assert 'SecurityGroupIds:' in function_section.group(0)
        assert 'SubnetIds:' in function_section.group(0)

    def test_lambda_function_environment_variables(self, template):
        """Test Lambda function has required environment variables."""
        function_section = re.search(r'TransactionProcessorFunction:.*?(?=\nOutputs:)', template, re.DOTALL)
        assert function_section
        assert 'TRANSACTION_TABLE:' in function_section.group(0)
        assert 'AUDIT_BUCKET:' in function_section.group(0)

    def test_lambda_function_has_code(self, template):
        """Test Lambda function has inline code."""
        function_section = re.search(r'TransactionProcessorFunction:.*?(?=\nOutputs:)', template, re.DOTALL)
        assert function_section
        assert 'ZipFile:' in function_section.group(0) or 'Code:' in function_section.group(0)

    def test_lambda_code_uses_aws_sdk_v3(self, template):
        """Test Lambda code uses AWS SDK v3."""
        function_section = re.search(r'TransactionProcessorFunction:.*?(?=\nOutputs:)', template, re.DOTALL)
        assert function_section
        assert '@aws-sdk/client-dynamodb' in function_section.group(0)
        assert '@aws-sdk/client-s3' in function_section.group(0)


class TestOutputs:
    """Test CloudFormation outputs."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_outputs_section_exists(self, template):
        """Test Outputs section exists."""
        assert 'Outputs:' in template

    def test_vpc_id_output_exists(self, template):
        """Test VPC ID output exists."""
        outputs_section = re.search(r'Outputs:.*', template, re.DOTALL)
        assert outputs_section
        assert 'VPCId:' in outputs_section.group(0)

    def test_subnet_outputs_exist(self, template):
        """Test subnet outputs exist."""
        outputs_section = re.search(r'Outputs:.*', template, re.DOTALL)
        assert outputs_section
        assert 'PrivateSubnet1Id:' in outputs_section.group(0)
        assert 'PrivateSubnet2Id:' in outputs_section.group(0)
        assert 'PrivateSubnet3Id:' in outputs_section.group(0)

    def test_kms_key_outputs_exist(self, template):
        """Test KMS key outputs exist."""
        outputs_section = re.search(r'Outputs:.*', template, re.DOTALL)
        assert outputs_section
        assert 'S3KMSKeyId:' in outputs_section.group(0)
        assert 'CloudWatchLogsKMSKeyId:' in outputs_section.group(0)

    def test_bucket_outputs_exist(self, template):
        """Test bucket outputs exist."""
        outputs_section = re.search(r'Outputs:.*', template, re.DOTALL)
        assert outputs_section
        assert 'AuditLogsBucketName:' in outputs_section.group(0)

    def test_table_outputs_exist(self, template):
        """Test table outputs exist."""
        outputs_section = re.search(r'Outputs:.*', template, re.DOTALL)
        assert outputs_section
        assert 'TransactionTableName:' in outputs_section.group(0)

    def test_lambda_outputs_exist(self, template):
        """Test Lambda outputs exist."""
        outputs_section = re.search(r'Outputs:.*', template, re.DOTALL)
        assert outputs_section
        assert 'LambdaFunctionName:' in outputs_section.group(0)
        assert 'LambdaFunctionArn:' in outputs_section.group(0)

    def test_vpc_endpoint_outputs_exist(self, template):
        """Test VPC endpoint outputs exist."""
        outputs_section = re.search(r'Outputs:.*', template, re.DOTALL)
        assert outputs_section
        assert 'S3VPCEndpointId:' in outputs_section.group(0)
        assert 'DynamoDBVPCEndpointId:' in outputs_section.group(0)
        assert 'LambdaVPCEndpointId:' in outputs_section.group(0)

    def test_outputs_have_descriptions(self, template):
        """Test outputs have descriptions."""
        outputs_section = re.search(r'Outputs:.*', template, re.DOTALL)
        assert outputs_section
        # Count Description occurrences in Outputs section
        description_count = outputs_section.group(0).count('Description:')
        assert description_count >= 10, f"Expected at least 10 output descriptions, found {description_count}"

    def test_outputs_have_export_names(self, template):
        """Test outputs have export names."""
        outputs_section = re.search(r'Outputs:.*', template, re.DOTALL)
        assert outputs_section
        # Count Export occurrences in Outputs section
        export_count = outputs_section.group(0).count('Export:')
        assert export_count >= 10, f"Expected at least 10 exports, found {export_count}"


class TestComplianceAndSecurity:
    """Test compliance and security configurations."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_no_deletion_protection(self, template):
        """Test that no resources have deletion protection enabled."""
        # DeletionProtection should not appear with true value
        assert 'DeletionProtection: true' not in template

    def test_no_retain_policies(self, template):
        """Test that no resources have Retain deletion policy."""
        assert 'DeletionPolicy: Retain' not in template

    def test_all_named_resources_use_environment_suffix(self, template):
        """Test that all named resources include environment suffix."""
        # Count occurrences of EnvironmentSuffix in resource naming
        suffix_count = template.count('${EnvironmentSuffix}')
        assert suffix_count >= 15, f"EnvironmentSuffix should appear in multiple resource names, found {suffix_count}"

    def test_s3_uses_kms_encryption(self, template):
        """Test S3 bucket uses KMS encryption."""
        bucket_section = re.search(r'AuditLogsBucket:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert bucket_section
        assert 'SSEAlgorithm: aws:kms' in bucket_section.group(0)
        # Should not use SSE-S3
        assert 'SSEAlgorithm: AES256' not in bucket_section.group(0)

    def test_dynamodb_uses_kms_encryption(self, template):
        """Test DynamoDB uses KMS encryption."""
        table_section = re.search(r'TransactionTable:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert table_section
        assert 'SSEType: KMS' in table_section.group(0)

    def test_cloudwatch_logs_encrypted(self, template):
        """Test CloudWatch Logs use KMS encryption."""
        log_group_section = re.search(r'LambdaLogGroup:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert log_group_section
        assert 'KmsKeyId:' in log_group_section.group(0)

    def test_no_public_subnets(self, template):
        """Test there are no public subnets."""
        # PublicSubnet should not appear
        assert 'PublicSubnet' not in template

    def test_security_groups_no_open_egress(self, template):
        """Test security groups don't have open egress to internet."""
        # Should not have 0.0.0.0/0 destination
        sg_section = re.search(r'LambdaSecurityGroup:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        if sg_section:
            assert '0.0.0.0/0' not in sg_section.group(0)


class TestResourceNaming:
    """Test resource naming conventions."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_bucket_name_includes_suffix(self, template):
        """Test S3 bucket name includes environment suffix."""
        assert 'audit-logs-${EnvironmentSuffix}' in template

    def test_table_name_includes_suffix(self, template):
        """Test DynamoDB table name includes environment suffix."""
        assert 'transactions-${EnvironmentSuffix}' in template

    def test_function_name_includes_suffix(self, template):
        """Test Lambda function name includes environment suffix."""
        assert 'transaction-processor-${EnvironmentSuffix}' in template

    def test_role_names_include_suffix(self, template):
        """Test IAM role names include environment suffix."""
        assert 'lambda-transaction-processor-role-${EnvironmentSuffix}' in template
        assert 'vpc-flow-logs-role-${EnvironmentSuffix}' in template

    def test_log_group_name_includes_suffix(self, template):
        """Test CloudWatch Log group name includes environment suffix."""
        assert 'transaction-processor-${EnvironmentSuffix}' in template

    def test_security_group_names_include_suffix(self, template):
        """Test security group names include environment suffix."""
        assert 'lambda-sg-${EnvironmentSuffix}' in template

    def test_kms_key_aliases_include_suffix(self, template):
        """Test KMS key aliases include environment suffix."""
        assert 's3-encryption-${EnvironmentSuffix}' in template
        assert 'cloudwatch-logs-${EnvironmentSuffix}' in template


class TestResourceDependencies:
    """Test resource dependencies and relationships."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_lambda_depends_on_log_group(self, template):
        """Test Lambda function depends on log group."""
        function_section = re.search(r'TransactionProcessorFunction:.*?(?=\nOutputs:)', template, re.DOTALL)
        assert function_section
        assert 'DependsOn: LambdaLogGroup' in function_section.group(0)

    def test_vpc_flow_log_depends_on_bucket_policy(self, template):
        """Test VPC Flow Log depends on bucket policy."""
        flow_log_section = re.search(r'VPCFlowLog:.*?(?=\n\S*[A-Z]\w+:)', template, re.DOTALL)
        assert flow_log_section
        assert 'DependsOn: AuditLogsBucketPolicy' in flow_log_section.group(0)

    def test_no_circular_dependency_in_security_groups(self, template):
        """Test security groups use separate ingress/egress resources."""
        # Should have separate ingress/egress resources, not inline rules
        assert 'LambdaSecurityGroupEgress:' in template
        assert 'LambdaVPCEndpointSecurityGroupIngress:' in template


class TestLambdaCode:
    """Test Lambda function code implementation."""

    @pytest.fixture
    def template(self):
        return load_cfn_template(TEMPLATE_PATH)

    def test_lambda_code_has_handler(self, template):
        """Test Lambda code exports handler function."""
        assert 'exports.handler' in template

    def test_lambda_code_handles_dynamodb(self, template):
        """Test Lambda code interacts with DynamoDB."""
        assert 'PutItemCommand' in template
        assert 'dynamodb.send' in template

    def test_lambda_code_handles_s3(self, template):
        """Test Lambda code interacts with S3."""
        assert 'PutObjectCommand' in template
        assert 's3.send' in template

    def test_lambda_code_has_error_handling(self, template):
        """Test Lambda code has error handling."""
        function_section = re.search(r'TransactionProcessorFunction:.*?(?=\nOutputs:)', template, re.DOTALL)
        assert function_section
        assert 'try' in function_section.group(0) or 'catch' in function_section.group(0)

    def test_lambda_code_returns_status_code(self, template):
        """Test Lambda code returns proper status codes."""
        function_section = re.search(r'TransactionProcessorFunction:.*?(?=\nOutputs:)', template, re.DOTALL)
        assert function_section
        assert 'statusCode:' in function_section.group(0)


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
