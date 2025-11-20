"""test_tap_stack.py - Integration tests for TapStack deployment"""

import json
import os
import pytest

# Get CloudFormation outputs if they exist
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

cfn_outputs = {}
if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        cfn_outputs = json.loads(f.read())


@pytest.fixture
def stack_outputs():
    """Provide CloudFormation stack outputs"""
    if not cfn_outputs:
        pytest.skip("Stack not deployed - cfn-outputs/flat-outputs.json not found")
    return cfn_outputs


class TestStackDeployment:
    """Test stack deployment outputs"""

    def test_required_outputs_exist(self, stack_outputs):
        """Test that all required CloudFormation outputs exist"""
        required_outputs = [
            'TransactionBucketName',
            'TransactionTableName',
            'IngestionFunctionArn',
            'ValidationFunctionArn',
            'EnrichmentFunctionArn',
            'StateMachineArn',
            'IngestionQueueUrl',
            'ValidationQueueUrl',
            'ApiEndpoint',
            'FailureTopicArn'
        ]

        for output_name in required_outputs:
            assert output_name in stack_outputs, f"Missing required output: {output_name}"
            assert stack_outputs[output_name], f"Output {output_name} is empty"

    def test_resource_naming_convention(self, stack_outputs):
        """Test that resources follow naming conventions with environment suffix"""
        # Extract suffix from table name
        table_name = stack_outputs.get('TransactionTableName', '')
        if '-' in table_name:
            suffix = table_name.split('-')[-1]

            # Verify other resources use the same suffix
            bucket_name = stack_outputs.get('TransactionBucketName', '')
            assert bucket_name.endswith(suffix), \
                f"Bucket name doesn't end with suffix {suffix}"

    def test_api_endpoint_format(self, stack_outputs):
        """Test API endpoint has correct format"""
        api_endpoint = stack_outputs.get('ApiEndpoint', '')
        assert api_endpoint.startswith('https://'), "API endpoint should use HTTPS"
        assert 'amazonaws.com' in api_endpoint, "API endpoint should be AWS domain"
