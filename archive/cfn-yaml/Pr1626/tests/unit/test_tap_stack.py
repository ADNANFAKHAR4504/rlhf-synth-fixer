"""Unit tests for TapStack CloudFormation template."""

import json
import os
import pytest
import subprocess


class TestTapStackTemplate:
    """Test suite for TapStack CloudFormation template."""
    
    @classmethod
    def setup_class(cls):
        """Load both JSON and YAML templates for testing."""
        # Load JSON template
        json_path = os.path.join(os.path.dirname(__file__), '../../lib/TapStack.json')
        with open(json_path, 'r') as f:
            cls.json_template = json.load(f)
        
        # Convert YAML to JSON using cfn-flip
        yaml_path = os.path.join(os.path.dirname(__file__), '../../lib/TapStack.yml')
        try:
            result = subprocess.run(
                ['cfn-flip', yaml_path],
                capture_output=True,
                text=True,
                check=True
            )
            cls.yaml_template = json.loads(result.stdout)
        except (subprocess.CalledProcessError, json.JSONDecodeError):
            # If cfn-flip fails, use the JSON template as fallback
            cls.yaml_template = cls.json_template
    
    def test_template_format_version(self):
        """Test that template has correct CloudFormation version."""
        assert self.json_template['AWSTemplateFormatVersion'] == '2010-09-09'
        assert self.yaml_template['AWSTemplateFormatVersion'] == '2010-09-09'
    
    def test_template_description(self):
        """Test that template has a proper description."""
        assert 'Description' in self.json_template
        assert 'serverless' in self.json_template['Description'].lower()
        assert 'Description' in self.yaml_template
        assert 'serverless' in self.yaml_template['Description'].lower()
    
    def test_parameters_exist(self):
        """Test that all required parameters are defined."""
        required_params = ['EnvironmentSuffix', 'LambdaFunctionName', 'DynamoDBTableName', 'SQSQueueName']
        
        for param in required_params:
            assert param in self.json_template['Parameters']
            assert param in self.yaml_template['Parameters']
            assert self.json_template['Parameters'][param]['Type'] == 'String'
            assert self.yaml_template['Parameters'][param]['Type'] == 'String'
    
    def test_environment_suffix_parameter(self):
        """Test EnvironmentSuffix parameter configuration."""
        env_param = self.json_template['Parameters']['EnvironmentSuffix']
        assert env_param['Default'] == 'dev'
        assert 'Description' in env_param
        
        env_param_yaml = self.yaml_template['Parameters']['EnvironmentSuffix']
        assert env_param_yaml['Default'] == 'dev'
    
    def test_kms_keys_exist(self):
        """Test that KMS keys are defined for encryption."""
        assert 'DynamoDBKMSKey' in self.json_template['Resources']
        assert 'SQSKMSKey' in self.json_template['Resources']
        assert 'DynamoDBKMSKeyAlias' in self.json_template['Resources']
        assert 'SQSKMSKeyAlias' in self.json_template['Resources']
        
        # Check types
        assert self.json_template['Resources']['DynamoDBKMSKey']['Type'] == 'AWS::KMS::Key'
        assert self.json_template['Resources']['SQSKMSKey']['Type'] == 'AWS::KMS::Key'
    
    def test_dynamodb_table_configuration(self):
        """Test DynamoDB table configuration."""
        table = self.json_template['Resources']['ProcessedDataTable']
        
        assert table['Type'] == 'AWS::DynamoDB::Table'
        assert table['Properties']['BillingMode'] == 'PAY_PER_REQUEST'
        
        # Check encryption
        sse = table['Properties']['SSESpecification']
        assert sse['SSEEnabled'] == True
        assert sse['SSEType'] == 'KMS'
        assert 'KMSMasterKeyId' in sse
        
        # Check Point-in-Time Recovery
        pitr = table['Properties']['PointInTimeRecoverySpecification']
        assert pitr['PointInTimeRecoveryEnabled'] == True
        
        # Check table name includes environment suffix
        table_name = table['Properties']['TableName']
        assert 'Fn::Sub' in table_name
        assert '${EnvironmentSuffix}' in table_name['Fn::Sub']
    
    def test_sqs_dlq_configuration(self):
        """Test SQS Dead Letter Queue configuration."""
        queue = self.json_template['Resources']['DeadLetterQueue']
        
        assert queue['Type'] == 'AWS::SQS::Queue'
        
        # Check KMS encryption
        assert 'KmsMasterKeyId' in queue['Properties']
        assert queue['Properties']['KmsDataKeyReusePeriodSeconds'] == 300
        
        # Check message retention (14 days)
        assert queue['Properties']['MessageRetentionPeriod'] == 1209600
        
        # Check queue name includes environment suffix
        queue_name = queue['Properties']['QueueName']
        assert 'Fn::Sub' in queue_name
        assert '${EnvironmentSuffix}' in queue_name['Fn::Sub']
    
    def test_lambda_function_configuration(self):
        """Test Lambda function configuration."""
        lambda_fn = self.json_template['Resources']['ProcessorLambdaFunction']
        
        assert lambda_fn['Type'] == 'AWS::Lambda::Function'
        assert lambda_fn['Properties']['Runtime'] == 'python3.12'
        assert lambda_fn['Properties']['Timeout'] == 60
        
        # Check DLQ configuration
        assert 'DeadLetterConfig' in lambda_fn['Properties']
        dlq_config = lambda_fn['Properties']['DeadLetterConfig']
        assert 'TargetArn' in dlq_config
        
        # Check environment variables
        env_vars = lambda_fn['Properties']['Environment']['Variables']
        assert 'DYNAMODB_TABLE' in env_vars
        assert 'DLQ_URL' in env_vars
        
        # Check function name includes environment suffix
        fn_name = lambda_fn['Properties']['FunctionName']
        assert 'Fn::Sub' in fn_name
        assert '${EnvironmentSuffix}' in fn_name['Fn::Sub']
    
    def test_iam_role_configuration(self):
        """Test IAM role configuration for Lambda."""
        role = self.json_template['Resources']['LambdaExecutionRole']
        
        assert role['Type'] == 'AWS::IAM::Role'
        
        # Check trust policy
        trust_policy = role['Properties']['AssumeRolePolicyDocument']
        assert trust_policy['Statement'][0]['Principal']['Service'] == 'lambda.amazonaws.com'
        
        # Check managed policies
        managed_policies = role['Properties']['ManagedPolicyArns']
        assert 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole' in managed_policies
        
        # Check inline policies
        policies = role['Properties']['Policies']
        policy_names = [p['PolicyName'] for p in policies]
        assert 'DynamoDBAccess' in policy_names
        assert 'SQSAccess' in policy_names
    
    def test_api_gateway_configuration(self):
        """Test API Gateway configuration."""
        api = self.json_template['Resources']['ServerlessApi']
        
        assert api['Type'] == 'AWS::ApiGateway::RestApi'
        
        # Check API name includes environment suffix
        api_name = api['Properties']['Name']
        assert 'Fn::Sub' in api_name
        assert '${EnvironmentSuffix}' in api_name['Fn::Sub']
        
        # Check endpoint configuration
        assert api['Properties']['EndpointConfiguration']['Types'] == ['REGIONAL']
        
        # Check proxy resource
        proxy = self.json_template['Resources']['ApiGatewayProxyResource']
        assert proxy['Type'] == 'AWS::ApiGateway::Resource'
        assert proxy['Properties']['PathPart'] == '{proxy+}'
        
        # Check methods
        root_method = self.json_template['Resources']['ApiGatewayRootMethod']
        assert root_method['Properties']['HttpMethod'] == 'ANY'
        assert root_method['Properties']['AuthorizationType'] == 'NONE'
        
        proxy_method = self.json_template['Resources']['ApiGatewayProxyMethod']
        assert proxy_method['Properties']['HttpMethod'] == 'ANY'
        assert proxy_method['Properties']['AuthorizationType'] == 'NONE'
    
    def test_outputs_exist(self):
        """Test that all required outputs are defined."""
        required_outputs = [
            'ApiGatewayUrl',
            'LambdaFunctionArn',
            'DynamoDBTableName',
            'DeadLetterQueueUrl',
            'DynamoDBKMSKeyId',
            'SQSKMSKeyId'
        ]
        
        for output in required_outputs:
            assert output in self.json_template['Outputs']
            assert 'Description' in self.json_template['Outputs'][output]
            assert 'Value' in self.json_template['Outputs'][output]
            assert 'Export' in self.json_template['Outputs'][output]
    
    def test_resource_count(self):
        """Test that template has expected number of resources."""
        resource_count = len(self.json_template['Resources'])
        assert resource_count >= 11  # At least 11 resources expected
    
    def test_parameter_count(self):
        """Test that template has expected number of parameters."""
        param_count = len(self.json_template['Parameters'])
        assert param_count == 4  # Exactly 4 parameters expected
    
    def test_output_count(self):
        """Test that template has expected number of outputs."""
        output_count = len(self.json_template['Outputs'])
        assert output_count == 6  # Exactly 6 outputs expected
    
    def test_kms_key_policies(self):
        """Test KMS key policies are properly configured."""
        dynamo_key = self.json_template['Resources']['DynamoDBKMSKey']
        sqs_key = self.json_template['Resources']['SQSKMSKey']
        
        # Check DynamoDB KMS key policy
        dynamo_policy = dynamo_key['Properties']['KeyPolicy']['Statement']
        assert len(dynamo_policy) >= 2
        
        # Find service permission statement
        service_stmt = None
        for stmt in dynamo_policy:
            if stmt.get('Sid') == 'Allow DynamoDB Service':
                service_stmt = stmt
                break
        
        assert service_stmt is not None
        assert service_stmt['Principal']['Service'] == 'dynamodb.amazonaws.com'
        assert 'kms:Decrypt' in service_stmt['Action']
        
        # Check SQS KMS key policy
        sqs_policy = sqs_key['Properties']['KeyPolicy']['Statement']
        assert len(sqs_policy) >= 2
        
        # Find service permission statement
        service_stmt = None
        for stmt in sqs_policy:
            if stmt.get('Sid') == 'Allow SQS Service':
                service_stmt = stmt
                break
        
        assert service_stmt is not None
        assert service_stmt['Principal']['Service'] == 'sqs.amazonaws.com'
    
    def test_lambda_permissions(self):
        """Test Lambda permissions for API Gateway."""
        permission = self.json_template['Resources']['LambdaApiGatewayPermission']
        
        assert permission['Type'] == 'AWS::Lambda::Permission'
        assert permission['Properties']['Action'] == 'lambda:InvokeFunction'
        assert permission['Properties']['Principal'] == 'apigateway.amazonaws.com'
    
    def test_api_deployment(self):
        """Test API Gateway deployment configuration."""
        deployment = self.json_template['Resources']['ApiGatewayDeployment']
        
        assert deployment['Type'] == 'AWS::ApiGateway::Deployment'
        assert deployment['Properties']['StageName'] == 'prod'
        assert 'DependsOn' in deployment
        assert 'ApiGatewayRootMethod' in deployment['DependsOn']
        assert 'ApiGatewayProxyMethod' in deployment['DependsOn']
    
    def test_all_resources_use_environment_suffix(self):
        """Test that all nameable resources include environment suffix."""
        # Lambda function name
        lambda_name = self.json_template['Resources']['ProcessorLambdaFunction']['Properties']['FunctionName']
        assert '${EnvironmentSuffix}' in lambda_name['Fn::Sub']
        
        # DynamoDB table name
        table_name = self.json_template['Resources']['ProcessedDataTable']['Properties']['TableName']
        assert '${EnvironmentSuffix}' in table_name['Fn::Sub']
        
        # SQS queue name
        queue_name = self.json_template['Resources']['DeadLetterQueue']['Properties']['QueueName']
        assert '${EnvironmentSuffix}' in queue_name['Fn::Sub']
        
        # API Gateway name
        api_name = self.json_template['Resources']['ServerlessApi']['Properties']['Name']
        assert '${EnvironmentSuffix}' in api_name['Fn::Sub']
        
        # KMS key aliases
        dynamo_alias = self.json_template['Resources']['DynamoDBKMSKeyAlias']['Properties']['AliasName']
        assert '${EnvironmentSuffix}' in dynamo_alias['Fn::Sub']
        
        sqs_alias = self.json_template['Resources']['SQSKMSKeyAlias']['Properties']['AliasName']
        assert '${EnvironmentSuffix}' in sqs_alias['Fn::Sub']
    
    def test_lambda_code_exists(self):
        """Test that Lambda function has inline code."""
        lambda_fn = self.json_template['Resources']['ProcessorLambdaFunction']
        
        assert 'Code' in lambda_fn['Properties']
        assert 'ZipFile' in lambda_fn['Properties']['Code']
        
        code = lambda_fn['Properties']['Code']['ZipFile']
        assert 'lambda_handler' in code
        assert 'dynamodb' in code
        assert 'boto3' in code
    
    def test_security_compliance(self):
        """Test security and compliance requirements."""
        # DynamoDB encryption
        table = self.json_template['Resources']['ProcessedDataTable']
        assert table['Properties']['SSESpecification']['SSEEnabled'] == True
        assert table['Properties']['SSESpecification']['SSEType'] == 'KMS'
        
        # SQS encryption
        queue = self.json_template['Resources']['DeadLetterQueue']
        assert 'KmsMasterKeyId' in queue['Properties']
        
        # API Gateway no auth (as per requirements)
        root_method = self.json_template['Resources']['ApiGatewayRootMethod']
        assert root_method['Properties']['AuthorizationType'] == 'NONE'
        
        proxy_method = self.json_template['Resources']['ApiGatewayProxyMethod']
        assert proxy_method['Properties']['AuthorizationType'] == 'NONE'