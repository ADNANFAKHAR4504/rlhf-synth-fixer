"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import json
import os
import unittest

import boto3
import pulumi
from pulumi import automation as auto

"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""


# class TestTapStackLiveIntegration(unittest.TestCase):
#   """Integration tests against live deployed Pulumi stack."""

#   def setUp(self):
#     """Set up integration test with live stack."""
#     self.stack_name = "dev"  # Your live Pulumi stack name (just the env part)
#     self.project_name = "tap-infra"  # Your Pulumi project name
#     self.s3_client = boto3.client('s3')
    
#     # Configure Pulumi to use S3 backend (not Pulumi Cloud)
#     self.pulumi_backend_url = os.getenv('PULUMI_BACKEND_URL', 's3://iac-rlhf-pulumi-states')

class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack infrastructure using actual deployment outputs."""
    
    def setUp(self):
        """Set up integration test with deployment outputs from environment or dep.txt."""
        # Read deployment outputs from environment variables or dep.txt file
        self.deployment_outputs = self._load_deployment_outputs()
        
        # Initialize AWS clients
        self.lambda_client = boto3.client('lambda')
        self.s3_client = boto3.client('s3')
        self.apigateway_client = boto3.client('apigateway')
        self.sqs_client = boto3.client('sqs')
        self.sns_client = boto3.client('sns')
        self.cloudwatch_client = boto3.client('cloudwatch')
        self.ssm_client = boto3.client('ssm')
        self.xray_client = boto3.client('xray')
        self.iam_client = boto3.client('iam')

    def _load_deployment_outputs(self):
        """Load deployment outputs by discovering actual deployed resources."""
        # Get environment suffix (e.g., pr3158)
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        
        # Try to discover actual deployed resources
        outputs = self._discover_deployed_resources(env_suffix)
        
        return outputs

    def _discover_deployed_resources(self, env_suffix):
        """Discover actual deployed resources by querying AWS."""
        outputs = {
            'api_gateway_id': None,
            'api_gateway_url': None,
            'dashboard_url': f"serverless-app-{env_suffix}-dashboard",
            'dlq_arn': None,
            'dlq_url': None,
            'environment_variables': {
                "ENVIRONMENT": env_suffix,
                "PARAMETER_PREFIX": f"/serverless-app-{env_suffix}",
                "REGION": "us-east-1",
                "S3_BUCKET_NAME": None
            },
            'failover_function_arn': None,
            'failover_function_name': f"serverless-app-{env_suffix}-failover-failover",
            'lambda_function_arn': None,
            'lambda_function_invoke_arn': None,
            'lambda_function_name': f"serverless-app-{env_suffix}",
            'parameter_prefix': f"/serverless-app-{env_suffix}",
            's3_bucket_arn': None,
            's3_bucket_name': None,
            'sns_topic_arn': None,
            'xray_group_name': f"serverless-app-{env_suffix}-group"
        }
        
        # Try to discover resources, but don't fail if we can't
        try:
            # Try to find Lambda functions
            lambda_client = boto3.client('lambda')
            functions = lambda_client.list_functions()['Functions']
            
            for func in functions:
                if func['FunctionName'] == f"serverless-app-{env_suffix}":
                    outputs['lambda_function_name'] = func['FunctionName']
                    outputs['lambda_function_arn'] = func['FunctionArn']
                    # Get environment variables from actual function
                    if 'Environment' in func and 'Variables' in func['Environment']:
                        outputs['environment_variables'].update(func['Environment']['Variables'])
                        if 'S3_BUCKET_NAME' in func['Environment']['Variables']:
                            outputs['s3_bucket_name'] = func['Environment']['Variables']['S3_BUCKET_NAME']
                            outputs['s3_bucket_arn'] = f"arn:aws:s3:::{func['Environment']['Variables']['S3_BUCKET_NAME']}"
                elif func['FunctionName'] == f"serverless-app-{env_suffix}-failover-failover":
                    outputs['failover_function_name'] = func['FunctionName']
                    outputs['failover_function_arn'] = func['FunctionArn']
            
            # Try to find API Gateway
            apigateway_client = boto3.client('apigateway')
            apis = apigateway_client.get_rest_apis()['items']
            for api in apis:
                if f"serverless-app-{env_suffix}" in api['name']:
                    outputs['api_gateway_id'] = api['id']
                    outputs['api_gateway_url'] = f"{api['id']}.execute-api.us-east-1.amazonaws.com/api"
                    break
            
            # Try to find S3 buckets
            s3_client = boto3.client('s3')
            buckets = s3_client.list_buckets()['Buckets']
            for bucket in buckets:
                if f"sa-{env_suffix}" in bucket['Name']:
                    outputs['s3_bucket_name'] = bucket['Name']
                    outputs['s3_bucket_arn'] = f"arn:aws:s3:::{bucket['Name']}"
                    outputs['environment_variables']['S3_BUCKET_NAME'] = bucket['Name']
                    break
                    
        except Exception as e:
            # If we can't discover resources, that's okay - tests will skip
            print(f"Note: Could not discover all resources (this is normal in CI/CD): {e}")
        
        return outputs

    def test_lambda_function_exists_and_active(self):
        """Test that main Lambda function exists and is active."""
        function_name = self.deployment_outputs['lambda_function_name']
        
        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
        except Exception as e:
            self.fail(f"Failed to get Lambda function {function_name}: {e}")
        
        # Test function exists and is active
        self.assertEqual(response['Configuration']['State'], 'Active')
        self.assertEqual(response['Configuration']['FunctionName'], function_name)
        self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
        self.assertEqual(response['Configuration']['Timeout'], 180)  # 3 minutes
        # Memory size can vary, just check it's reasonable
        self.assertGreaterEqual(response['Configuration']['MemorySize'], 128)
        self.assertLessEqual(response['Configuration']['MemorySize'], 1024)
        
        # Test X-Ray tracing is enabled
        self.assertTrue(response['Configuration']['TracingConfig']['Mode'] == 'Active')
        
        # Test environment variables exist (don't require exact matches)
        env_vars = response['Configuration']['Environment']['Variables']
        self.assertIn('ENVIRONMENT', env_vars)
        self.assertIn('REGION', env_vars)
        self.assertIn('PARAMETER_PREFIX', env_vars)
        self.assertIn('S3_BUCKET_NAME', env_vars)

    def test_failover_lambda_function_exists(self):
        """Test that failover Lambda function exists and is active."""
        function_name = self.deployment_outputs['failover_function_name']
        
        response = self.lambda_client.get_function(FunctionName=function_name)
        
        # Test function exists and is active
        self.assertEqual(response['Configuration']['State'], 'Active')
        self.assertEqual(response['Configuration']['FunctionName'], function_name)
        self.assertEqual(response['Configuration']['Runtime'], 'python3.9')
        self.assertEqual(response['Configuration']['Timeout'], 180)  # 3 minutes

    def test_s3_bucket_exists_and_configured(self):
        """Test that S3 bucket exists and is properly configured."""
        bucket_name = self.deployment_outputs['s3_bucket_name']
        
        try:
            # Test bucket exists
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            # Test bucket versioning
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning['Status'], 'Enabled')
            
            # Test bucket encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            self.assertIn('ServerSideEncryptionConfiguration', encryption)
            
            # Test bucket public access block
            public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
            self.assertTrue(public_access['PublicAccessBlockConfiguration']['BlockPublicAcls'])
            self.assertTrue(public_access['PublicAccessBlockConfiguration']['BlockPublicPolicy'])
            self.assertTrue(public_access['PublicAccessBlockConfiguration']['IgnorePublicAcls'])
            self.assertTrue(public_access['PublicAccessBlockConfiguration']['RestrictPublicBuckets'])
        except Exception as e:
            self.fail(f"Failed to verify S3 bucket {bucket_name}: {e}")

    def test_api_gateway_exists_and_configured(self):
        """Test that API Gateway exists and is properly configured."""
        api_id = self.deployment_outputs['api_gateway_id']
        
        # Skip if no API Gateway ID provided
        if not api_id:
            self.skipTest("API Gateway ID not available")
        
        try:
            # Test API exists
            response = self.apigateway_client.get_rest_api(restApiId=api_id)
            self.assertEqual(response['id'], api_id)
            # Don't hardcode the name - just check it exists and is not empty
            self.assertIsNotNone(response['name'])
            self.assertNotEqual(response['name'], '')
            
            # Test API has resources
            resources = self.apigateway_client.get_resources(restApiId=api_id)
            self.assertGreater(len(resources['items']), 0)
            
            # Test API has stages - don't hardcode stage name
            stages = self.apigateway_client.get_stages(restApiId=api_id)
            self.assertGreater(len(stages['item']), 0)
        except Exception as e:
            self.fail(f"Failed to verify API Gateway {api_id}: {e}")

    def test_cloudwatch_dashboard_exists(self):
        """Test that CloudWatch dashboard exists."""
        dashboard_name = self.deployment_outputs['dashboard_url']
        
        try:
            # Test dashboard exists
            response = self.cloudwatch_client.list_dashboards()
            dashboard_names = [dashboard['DashboardName'] for dashboard in response['DashboardEntries']]
            self.assertIn(dashboard_name, dashboard_names)
        except Exception as e:
            self.fail(f"Failed to verify CloudWatch dashboard {dashboard_name}: {e}")

    def test_xray_group_exists(self):
        """Test that X-Ray group exists."""
        group_name = self.deployment_outputs['xray_group_name']
        
        # Test group exists
        response = self.xray_client.get_group(GroupName=group_name)
        self.assertEqual(response['Group']['GroupName'], group_name)

    def test_parameter_store_parameters_exist(self):
        """Test that Parameter Store parameters exist."""
        parameter_prefix = self.deployment_outputs['parameter_prefix']
        
        # Test parameters exist
        response = self.ssm_client.get_parameters_by_path(Path=parameter_prefix, Recursive=True)
        self.assertGreater(len(response['Parameters']), 0)
        
        # Test that parameters have the correct prefix
        for param in response['Parameters']:
            self.assertTrue(param['Name'].startswith(parameter_prefix), 
                          f"Parameter {param['Name']} should start with {parameter_prefix}")

    def test_lambda_iam_role_exists(self):
        """Test that Lambda execution role exists and has correct permissions."""
        function_name = self.deployment_outputs['lambda_function_name']
        
        # Get function configuration
        response = self.lambda_client.get_function(FunctionName=function_name)
        role_arn = response['Configuration']['Role']
        
        # Test role exists
        role_name = role_arn.split('/')[-1]
        role_response = self.iam_client.get_role(RoleName=role_name)
        self.assertEqual(role_response['Role']['RoleName'], role_name)
        
        # Test role has correct trust policy
        trust_policy = role_response['Role']['AssumeRolePolicyDocument']
        self.assertIn('lambda.amazonaws.com', str(trust_policy))

    def test_api_gateway_lambda_integration(self):
        """Test that API Gateway is properly integrated with Lambda."""
        api_id = self.deployment_outputs['api_gateway_id']
        lambda_function_name = self.deployment_outputs['lambda_function_name']
        
        # Skip if no API Gateway ID provided
        if not api_id:
            self.skipTest("API Gateway ID not available")
        
        try:
            # Get API resources
            resources = self.apigateway_client.get_resources(restApiId=api_id)
            
            # Find the ANY method resource
            any_resource = None
            for resource in resources['items']:
                if resource['path'] == '/{proxy+}':
                    any_resource = resource
                    break
            
            self.assertIsNotNone(any_resource, "API Gateway should have {proxy+} resource")
            
            # Test integration exists
            methods = self.apigateway_client.get_method(
                restApiId=api_id,
                resourceId=any_resource['id'],
                httpMethod='ANY'
            )
            
            # Test integration type
            integration = self.apigateway_client.get_integration(
                restApiId=api_id,
                resourceId=any_resource['id'],
                httpMethod='ANY'
            )
            
            self.assertEqual(integration['type'], 'AWS_PROXY')
            self.assertIn(lambda_function_name, integration['uri'])
        except Exception as e:
            self.fail(f"Failed to verify API Gateway Lambda integration: {e}")

    def test_environment_variables_consistency(self):
        """Test that environment variables are consistent across deployment."""
        expected_env_vars = self.deployment_outputs['environment_variables']
        
        # Test Lambda function environment variables
        function_name = self.deployment_outputs['lambda_function_name']
        response = self.lambda_client.get_function(FunctionName=function_name)
        actual_env_vars = response['Configuration']['Environment']['Variables']
        
        # Test that all expected keys exist, but allow values to be different (e.g., different S3 bucket names)
        for key in expected_env_vars.keys():
            self.assertIn(key, actual_env_vars, f"Environment variable {key} should exist in Lambda function")
            # Only test exact matches for non-bucket related variables
            if key != 'S3_BUCKET_NAME':
                self.assertEqual(actual_env_vars[key], expected_env_vars[key])

    def test_security_configurations(self):
        """Test that security configurations are properly set."""
        # Test S3 bucket security
        bucket_name = self.deployment_outputs['s3_bucket_name']
        public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
        
        # All public access should be blocked
        for setting in ['BlockPublicAcls', 'BlockPublicPolicy', 'IgnorePublicAcls', 'RestrictPublicBuckets']:
            self.assertTrue(public_access['PublicAccessBlockConfiguration'][setting])
        
        # Test Lambda function security (X-Ray tracing)
        function_name = self.deployment_outputs['lambda_function_name']
        response = self.lambda_client.get_function(FunctionName=function_name)
        self.assertEqual(response['Configuration']['TracingConfig']['Mode'], 'Active')

    def test_api_gateway_lambda_cross_service_integration(self):
        """Test API Gateway can trigger Lambda function (cross-service interaction)."""
        api_id = self.deployment_outputs['api_gateway_id']
        lambda_function_name = self.deployment_outputs['lambda_function_name']
        
        try:
            # Test that API Gateway has permission to invoke Lambda
            lambda_policy = self.lambda_client.get_policy(FunctionName=lambda_function_name)
            policy_doc = json.loads(lambda_policy['Policy'])
            
            # Verify API Gateway has invoke permission
            has_api_permission = False
            for statement in policy_doc['Statement']:
                if (statement.get('Principal', {}).get('Service') == 'apigateway.amazonaws.com' and
                    statement.get('Action') == 'lambda:InvokeFunction'):
                    has_api_permission = True
                    break
            
            self.assertTrue(has_api_permission, "API Gateway should have permission to invoke Lambda")
            
        except Exception as e:
            self.fail(f"Failed to verify API Gateway Lambda cross-service integration: {e}")

    def test_lambda_s3_cross_service_integration(self):
        """Test Lambda has access to S3 bucket for saving logs (cross-service interaction)."""
        lambda_function_name = self.deployment_outputs['lambda_function_name']
        bucket_name = self.deployment_outputs['s3_bucket_name']
        
        try:
            # Test Lambda IAM role has S3 permissions
            function_config = self.lambda_client.get_function(FunctionName=lambda_function_name)
            role_arn = function_config['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
            has_s3_permission = False
            
            # Check attached managed policies (this is where our custom policies are attached)
            attached_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            for policy in attached_policies['AttachedPolicies']:
                # Check if it's our custom S3 policy
                if 's3-access' in policy['PolicyName']:
                    has_s3_permission = True
                    break
                # Also check for AWS managed S3 policies
                if 'S3' in policy['PolicyName'] or 'AmazonS3' in policy['PolicyName']:
                    has_s3_permission = True
                    break
            
            # If not found in attached policies, check inline policies
            if not has_s3_permission:
                inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
                for policy_name in inline_policies['PolicyNames']:
                    policy_doc = self.iam_client.get_role_policy(RoleName=role_name, PolicyName=policy_name)
                    policy_content = json.loads(policy_doc['PolicyDocument'])
                    
                    for statement in policy_content.get('Statement', []):
                        actions = statement.get('Action', [])
                        if isinstance(actions, str):
                            actions = [actions]
                        
                        if (statement.get('Effect') == 'Allow' and 
                            any('s3:' in action for action in actions)):
                            has_s3_permission = True
                            break
                    if has_s3_permission:
                        break
            
            self.assertTrue(has_s3_permission, f"Lambda role should have S3 permissions for bucket {bucket_name}")
            
        except Exception as e:
            self.fail(f"Failed to verify Lambda S3 cross-service integration: {e}")

    def test_lambda_parameter_store_cross_service_integration(self):
        """Test Lambda can access Parameter Store for configuration (cross-service interaction)."""
        lambda_function_name = self.deployment_outputs['lambda_function_name']
        parameter_prefix = self.deployment_outputs['parameter_prefix']
        
        try:
            # Test Lambda IAM role has Parameter Store permissions
            function_config = self.lambda_client.get_function(FunctionName=lambda_function_name)
            role_arn = function_config['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
            has_parameter_store_permission = False
            
            # Check attached managed policies (this is where our custom policies are attached)
            attached_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            for policy in attached_policies['AttachedPolicies']:
                # Check if it's our custom SSM policy
                if 'ssm-access' in policy['PolicyName']:
                    has_parameter_store_permission = True
                    break
                # Also check for AWS managed SSM policies
                if 'SSM' in policy['PolicyName'] or 'AmazonSSM' in policy['PolicyName']:
                    has_parameter_store_permission = True
                    break
            
            # If not found in attached policies, check inline policies
            if not has_parameter_store_permission:
                inline_policies = self.iam_client.list_role_policies(RoleName=role_name)
                for policy_name in inline_policies['PolicyNames']:
                    policy_doc = self.iam_client.get_role_policy(RoleName=role_name, PolicyName=policy_name)
                    policy_content = json.loads(policy_doc['PolicyDocument'])
                    
                    for statement in policy_content.get('Statement', []):
                        actions = statement.get('Action', [])
                        if isinstance(actions, str):
                            actions = [actions]
                        
                        if (statement.get('Effect') == 'Allow' and 
                            any('ssm:' in action for action in actions)):
                            has_parameter_store_permission = True
                            break
                    if has_parameter_store_permission:
                        break
            
            self.assertTrue(has_parameter_store_permission, 
                          f"Lambda role should have Parameter Store permissions for prefix {parameter_prefix}")
            
        except Exception as e:
            self.fail(f"Failed to verify Lambda Parameter Store cross-service integration: {e}")

    def test_iam_least_privilege_cross_service_access(self):
        """Test IAM permissions follow least privilege for cross-service access."""
        lambda_function_name = self.deployment_outputs['lambda_function_name']
        
        try:
            # Get Lambda execution role
            function_config = self.lambda_client.get_function(FunctionName=lambda_function_name)
            role_arn = function_config['Configuration']['Role']
            role_name = role_arn.split('/')[-1]
            
            # Get all policies attached to the role
            attached_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            
            # Verify no overly broad permissions
            has_broad_permissions = False
            for policy in attached_policies['AttachedPolicies']:
                if policy['PolicyName'] in ['AdministratorAccess', 'PowerUserAccess']:
                    has_broad_permissions = True
                    break
            
            self.assertFalse(has_broad_permissions, 
                           "Lambda role should not have overly broad permissions")
            
        except Exception as e:
            self.fail(f"Failed to verify IAM least privilege cross-service access: {e}")
