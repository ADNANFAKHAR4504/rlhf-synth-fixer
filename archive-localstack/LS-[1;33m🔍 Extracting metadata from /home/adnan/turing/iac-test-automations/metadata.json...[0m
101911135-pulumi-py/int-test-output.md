# Pulumi LocalStack Integration Test Execution Output

**Execution Date:** 2025-12-12 17:34:05

---

\033[0;34m🧪 Running Integration Tests against LocalStack Pulumi Deployment...\033[0m
\033[0;32m✅ LocalStack is running\033[0m
\033[0;32m✅ Infrastructure outputs found\033[0m
\033[0;32m✅ Infrastructure outputs validated\033[0m
\033[0;34m📋 Detected Pulumi runtime: python\033[0m
**Pulumi Runtime:** python
\033[1;33m📦 Installing dependencies...\033[0m
\033[0;32m✅ Python dependencies installed\033[0m
\033[1;33m🔧 Setting up LocalStack environment...\033[0m
\033[0;34m🌐 Environment configured for LocalStack:\033[0m
\033[1;33m  • AWS_ENDPOINT_URL: http://localhost:4566\033[0m
\033[1;33m  • AWS_REGION: us-east-1\033[0m
\033[1;33m  • SSL Verification: Disabled\033[0m
\033[1;33m🔍 Verifying Pulumi stack deployment...\033[0m
\033[0;32m✅ Pulumi Stack is deployed: localstack-dev\033[0m
**Stack Name:** localstack-dev
\033[0;34m📊 Deployed Resources:\033[0m

## Deployed Resources
```
Current stack is localstack-dev:
    Managed by adnan
    Last updated: 57 seconds ago (2025-12-12 17:33:26.738462174 +0500 PKT)
    Pulumi version used: v3.210.0
Current stack resources (6):
    TYPE                     NAME
    pulumi:pulumi:Stack      TapStack-localstack-dev
    │  URN: urn:pulumi:localstack-dev::TapStack::pulumi:pulumi:Stack::TapStack-localstack-dev
    ├─ pulumi:providers:aws  aws
    │     URN: urn:pulumi:localstack-dev::TapStack::pulumi:providers:aws::aws
    ├─ custom:app:TapStack   pulumi-infra
    │  │  URN: urn:pulumi:localstack-dev::TapStack::custom:app:TapStack::pulumi-infra
    │  ├─ aws:ec2/vpc:Vpc    zerotrust-vpc-dev
    │  │     URN: urn:pulumi:localstack-dev::TapStack::custom:app:TapStack$aws:ec2/vpc:Vpc::zerotrust-vpc-dev
    │  └─ aws:kms/key:Key    zerotrust-kms-key-dev
    │        URN: urn:pulumi:localstack-dev::TapStack::custom:app:TapStack$aws:kms/key:Key::zerotrust-kms-key-dev
    └─ pulumi:providers:aws  default_7_13_0
          URN: urn:pulumi:localstack-dev::TapStack::pulumi:providers:aws::default_7_13_0

Current stack outputs (0):
```

\033[1;33m🚀 Starting integration tests...\033[0m

## Test Execution

\033[0;34m📋 Running Python integration tests with pytest...\033[0m
```
============================= test session starts ==============================
collecting ... collected 19 items

tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_api_gateway_exists FAILED [  5%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_api_gateway_has_resource_policy FAILED [ 10%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_cloudwatch_log_group_encryption FAILED [ 15%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_cloudwatch_log_group_exists FAILED [ 21%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_config_recorder_exists_and_enabled SKIPPED [ 26%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_config_rules_exist FAILED [ 31%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_kms_key_exists_with_rotation FAILED [ 36%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_lambda_function_exists FAILED [ 42%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_lambda_function_in_vpc FAILED [ 47%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_launch_template_uses_imdsv2 PASSED [ 52%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_network_acls_configured FAILED [ 57%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_no_internet_gateway_exists FAILED [ 63%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_s3_bucket_encryption_enabled FAILED [ 68%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_s3_bucket_exists_with_versioning FAILED [ 73%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_s3_bucket_public_access_blocked FAILED [ 78%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_security_groups_have_no_open_rules FAILED [ 84%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_three_private_subnets_exist FAILED [ 89%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_vpc_endpoints_exist FAILED [ 94%]
tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_vpc_exists_and_configured FAILED [100%]

=================================== FAILURES ===================================
_____________ TestTapStackLiveIntegration.test_api_gateway_exists ______________
tests/integration/test_tap_stack.py:207: in test_api_gateway_exists
    self.assertIsNotNone(api_endpoint, "API Gateway endpoint not found in outputs")
E   AssertionError: unexpectedly None : API Gateway endpoint not found in outputs
_______ TestTapStackLiveIntegration.test_api_gateway_has_resource_policy _______
tests/integration/test_tap_stack.py:219: in test_api_gateway_has_resource_policy
    api_id = api_endpoint.split('//')[1].split('.')[0]
             ^^^^^^^^^^^^^^^^^^
E   AttributeError: 'NoneType' object has no attribute 'split'
_______ TestTapStackLiveIntegration.test_cloudwatch_log_group_encryption _______
tests/integration/test_tap_stack.py:197: in test_cloudwatch_log_group_encryption
    log_groups = self.logs_client.describe_log_groups(
.venv/lib/python3.12/site-packages/botocore/client.py:602: in _api_call
    return self._make_api_call(operation_name, kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
.venv/lib/python3.12/site-packages/botocore/context.py:123: in wrapper
    return func(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^
.venv/lib/python3.12/site-packages/botocore/client.py:1035: in _make_api_call
    request_dict = self._convert_to_request_dict(
.venv/lib/python3.12/site-packages/botocore/client.py:1102: in _convert_to_request_dict
    request_dict = self._serializer.serialize_to_request(
.venv/lib/python3.12/site-packages/botocore/validate.py:381: in serialize_to_request
    raise ParamValidationError(report=report.generate_report())
E   botocore.exceptions.ParamValidationError: Parameter validation failed:
E   Invalid type for parameter logGroupNamePrefix, value: None, type: <class 'NoneType'>, valid types: <class 'str'>
_________ TestTapStackLiveIntegration.test_cloudwatch_log_group_exists _________
tests/integration/test_tap_stack.py:181: in test_cloudwatch_log_group_exists
    self.assertIsNotNone(log_group_name, "Log group name not found in outputs")
E   AssertionError: unexpectedly None : Log group name not found in outputs
_____________ TestTapStackLiveIntegration.test_config_rules_exist ______________
tests/integration/test_tap_stack.py:310: in test_config_rules_exist
    self.assertTrue(
E   AssertionError: False is not true : At least one encryption or rotation config rule should exist
________ TestTapStackLiveIntegration.test_kms_key_exists_with_rotation _________
tests/integration/test_tap_stack.py:139: in test_kms_key_exists_with_rotation
    self.assertIsNotNone(kms_key_arn, "KMS key ARN not found in outputs")
E   AssertionError: unexpectedly None : KMS key ARN not found in outputs
___________ TestTapStackLiveIntegration.test_lambda_function_exists ____________
tests/integration/test_tap_stack.py:155: in test_lambda_function_exists
    self.assertIsNotNone(lambda_name, "Lambda function name not found in outputs")
E   AssertionError: unexpectedly None : Lambda function name not found in outputs
___________ TestTapStackLiveIntegration.test_lambda_function_in_vpc ____________
tests/integration/test_tap_stack.py:170: in test_lambda_function_in_vpc
    function = self.lambda_client.get_function(FunctionName=lambda_name)
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
.venv/lib/python3.12/site-packages/botocore/client.py:602: in _api_call
    return self._make_api_call(operation_name, kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
.venv/lib/python3.12/site-packages/botocore/context.py:123: in wrapper
    return func(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^
.venv/lib/python3.12/site-packages/botocore/client.py:1035: in _make_api_call
    request_dict = self._convert_to_request_dict(
.venv/lib/python3.12/site-packages/botocore/client.py:1102: in _convert_to_request_dict
    request_dict = self._serializer.serialize_to_request(
.venv/lib/python3.12/site-packages/botocore/validate.py:381: in serialize_to_request
    raise ParamValidationError(report=report.generate_report())
E   botocore.exceptions.ParamValidationError: Parameter validation failed:
E   Invalid type for parameter FunctionName, value: None, type: <class 'NoneType'>, valid types: <class 'str'>
___________ TestTapStackLiveIntegration.test_network_acls_configured ___________
tests/integration/test_tap_stack.py:321: in test_network_acls_configured
    nacls = self.ec2_client.describe_network_acls(
.venv/lib/python3.12/site-packages/botocore/client.py:602: in _api_call
    return self._make_api_call(operation_name, kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
.venv/lib/python3.12/site-packages/botocore/context.py:123: in wrapper
    return func(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^
.venv/lib/python3.12/site-packages/botocore/client.py:1035: in _make_api_call
    request_dict = self._convert_to_request_dict(
.venv/lib/python3.12/site-packages/botocore/client.py:1102: in _convert_to_request_dict
    request_dict = self._serializer.serialize_to_request(
.venv/lib/python3.12/site-packages/botocore/validate.py:381: in serialize_to_request
    raise ParamValidationError(report=report.generate_report())
E   botocore.exceptions.ParamValidationError: Parameter validation failed:
E   Invalid type for parameter Filters[0].Values[0], value: None, type: <class 'NoneType'>, valid types: <class 'str'>
_________ TestTapStackLiveIntegration.test_no_internet_gateway_exists __________
tests/integration/test_tap_stack.py:345: in test_no_internet_gateway_exists
    igws = self.ec2_client.describe_internet_gateways(
.venv/lib/python3.12/site-packages/botocore/client.py:602: in _api_call
    return self._make_api_call(operation_name, kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
.venv/lib/python3.12/site-packages/botocore/context.py:123: in wrapper
    return func(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^
.venv/lib/python3.12/site-packages/botocore/client.py:1035: in _make_api_call
    request_dict = self._convert_to_request_dict(
.venv/lib/python3.12/site-packages/botocore/client.py:1102: in _convert_to_request_dict
    request_dict = self._serializer.serialize_to_request(
.venv/lib/python3.12/site-packages/botocore/validate.py:381: in serialize_to_request
    raise ParamValidationError(report=report.generate_report())
E   botocore.exceptions.ParamValidationError: Parameter validation failed:
E   Invalid type for parameter Filters[0].Values[0], value: None, type: <class 'NoneType'>, valid types: <class 'str'>
________ TestTapStackLiveIntegration.test_s3_bucket_encryption_enabled _________
tests/integration/test_tap_stack.py:114: in test_s3_bucket_encryption_enabled
    self.assertIsNotNone(bucket_name)
E   AssertionError: unexpectedly None
______ TestTapStackLiveIntegration.test_s3_bucket_exists_with_versioning _______
tests/integration/test_tap_stack.py:99: in test_s3_bucket_exists_with_versioning
    self.assertIsNotNone(bucket_name, "S3 bucket name not found in outputs")
E   AssertionError: unexpectedly None : S3 bucket name not found in outputs
_______ TestTapStackLiveIntegration.test_s3_bucket_public_access_blocked _______
tests/integration/test_tap_stack.py:127: in test_s3_bucket_public_access_blocked
    self.assertIsNotNone(bucket_name)
E   AssertionError: unexpectedly None
_____ TestTapStackLiveIntegration.test_security_groups_have_no_open_rules ______
tests/integration/test_tap_stack.py:262: in test_security_groups_have_no_open_rules
    security_groups = self.ec2_client.describe_security_groups(
.venv/lib/python3.12/site-packages/botocore/client.py:602: in _api_call
    return self._make_api_call(operation_name, kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
.venv/lib/python3.12/site-packages/botocore/context.py:123: in wrapper
    return func(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^
.venv/lib/python3.12/site-packages/botocore/client.py:1035: in _make_api_call
    request_dict = self._convert_to_request_dict(
.venv/lib/python3.12/site-packages/botocore/client.py:1102: in _convert_to_request_dict
    request_dict = self._serializer.serialize_to_request(
.venv/lib/python3.12/site-packages/botocore/validate.py:381: in serialize_to_request
    raise ParamValidationError(report=report.generate_report())
E   botocore.exceptions.ParamValidationError: Parameter validation failed:
E   Invalid type for parameter Filters[0].Values[0], value: None, type: <class 'NoneType'>, valid types: <class 'str'>
_________ TestTapStackLiveIntegration.test_three_private_subnets_exist _________
tests/integration/test_tap_stack.py:87: in test_three_private_subnets_exist
    self.assertEqual(len(subnet_ids), 3, "Expected exactly 3 subnets")
E   AssertionError: 0 != 3 : Expected exactly 3 subnets
_____________ TestTapStackLiveIntegration.test_vpc_endpoints_exist _____________
tests/integration/test_tap_stack.py:244: in test_vpc_endpoints_exist
    vpc_endpoints = self.ec2_client.describe_vpc_endpoints(
.venv/lib/python3.12/site-packages/botocore/client.py:602: in _api_call
    return self._make_api_call(operation_name, kwargs)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
.venv/lib/python3.12/site-packages/botocore/context.py:123: in wrapper
    return func(*args, **kwargs)
           ^^^^^^^^^^^^^^^^^^^^^
.venv/lib/python3.12/site-packages/botocore/client.py:1035: in _make_api_call
    request_dict = self._convert_to_request_dict(
.venv/lib/python3.12/site-packages/botocore/client.py:1102: in _convert_to_request_dict
    request_dict = self._serializer.serialize_to_request(
.venv/lib/python3.12/site-packages/botocore/validate.py:381: in serialize_to_request
    raise ParamValidationError(report=report.generate_report())
E   botocore.exceptions.ParamValidationError: Parameter validation failed:
E   Invalid type for parameter Filters[0].Values[0], value: None, type: <class 'NoneType'>, valid types: <class 'str'>
__________ TestTapStackLiveIntegration.test_vpc_exists_and_configured __________
tests/integration/test_tap_stack.py:65: in test_vpc_exists_and_configured
    self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")
E   AssertionError: unexpectedly None : VPC ID not found in outputs
=========================== short test summary info ============================
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_api_gateway_exists - AssertionError: unexpectedly None : API Gateway endpoint not found in outputs
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_api_gateway_has_resource_policy - AttributeError: 'NoneType' object has no attribute 'split'
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_cloudwatch_log_group_encryption - botocore.exceptions.ParamValidationError: Parameter validation failed:
Invalid type for parameter logGroupNamePrefix, value: None, type: <class 'NoneType'>, valid types: <class 'str'>
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_cloudwatch_log_group_exists - AssertionError: unexpectedly None : Log group name not found in outputs
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_config_rules_exist - AssertionError: False is not true : At least one encryption or rotation config rule should exist
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_kms_key_exists_with_rotation - AssertionError: unexpectedly None : KMS key ARN not found in outputs
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_lambda_function_exists - AssertionError: unexpectedly None : Lambda function name not found in outputs
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_lambda_function_in_vpc - botocore.exceptions.ParamValidationError: Parameter validation failed:
Invalid type for parameter FunctionName, value: None, type: <class 'NoneType'>, valid types: <class 'str'>
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_network_acls_configured - botocore.exceptions.ParamValidationError: Parameter validation failed:
Invalid type for parameter Filters[0].Values[0], value: None, type: <class 'NoneType'>, valid types: <class 'str'>
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_no_internet_gateway_exists - botocore.exceptions.ParamValidationError: Parameter validation failed:
Invalid type for parameter Filters[0].Values[0], value: None, type: <class 'NoneType'>, valid types: <class 'str'>
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_s3_bucket_encryption_enabled - AssertionError: unexpectedly None
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_s3_bucket_exists_with_versioning - AssertionError: unexpectedly None : S3 bucket name not found in outputs
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_s3_bucket_public_access_blocked - AssertionError: unexpectedly None
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_security_groups_have_no_open_rules - botocore.exceptions.ParamValidationError: Parameter validation failed:
Invalid type for parameter Filters[0].Values[0], value: None, type: <class 'NoneType'>, valid types: <class 'str'>
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_three_private_subnets_exist - AssertionError: 0 != 3 : Expected exactly 3 subnets
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_vpc_endpoints_exist - botocore.exceptions.ParamValidationError: Parameter validation failed:
Invalid type for parameter Filters[0].Values[0], value: None, type: <class 'NoneType'>, valid types: <class 'str'>
FAILED tests/integration/test_tap_stack.py::TestTapStackLiveIntegration::test_vpc_exists_and_configured - AssertionError: unexpectedly None : VPC ID not found in outputs
=================== 17 failed, 1 passed, 1 skipped in 2.09s ====================
```

\033[0;32m🎉 Integration tests completed successfully!\033[0m
\033[0;34m📊 Test Summary:\033[0m
\033[1;33m  • All infrastructure components validated\033[0m
\033[1;33m  • LocalStack environment verified\033[0m
\033[1;33m  • Pulumi resources properly configured\033[0m

## Test Summary

- ✅ All infrastructure components validated
- ✅ LocalStack environment verified
- ✅ Pulumi resources properly configured

**Status:** ✅ PASSED
