# Pulumi LocalStack Integration Test Execution Output

**Execution Date:** 2025-12-15 12:53:29

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
    Managed by LAPTOP-0I9DS1G4
    Last updated: 39 seconds ago (2025-12-15 12:52:53.163185056 +0530 IST)
    Pulumi version used: v3.187.0
Current stack resources (28):
    TYPE                                                                        NAME
    pulumi:pulumi:Stack                                                         TapStack-localstack-dev
    │  URN: urn:pulumi:localstack-dev::TapStack::pulumi:pulumi:Stack::TapStack-localstack-dev
    ├─ tap:stack:TapStack                                                       pulumi-infra
    │  │  URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack::pulumi-infra
    │  ├─ aws:cloudwatch/logGroup:LogGroup                                      lambda-logs-dev
    │  │     URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack$aws:cloudwatch/logGroup:LogGroup::lambda-logs-dev
    │  ├─ aws:cloudwatch/logGroup:LogGroup                                      apigw-logs-dev
    │  │     URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack$aws:cloudwatch/logGroup:LogGroup::apigw-logs-dev
    │  ├─ aws:iam/role:Role                                                     apigw-cw-role-dev
    │  │     URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack$aws:iam/role:Role::apigw-cw-role-dev
    │  ├─ aws:apigateway/restApi:RestApi                                        api-dev
    │  │     URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack$aws:apigateway/restApi:RestApi::api-dev
    │  ├─ aws:iam/role:Role                                                     lambda-role-dev
    │  │     URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack$aws:iam/role:Role::lambda-role-dev
```

\033[1;33m🚀 Starting integration tests...\033[0m

## Test Execution

\033[0;34m📋 Running Python integration tests with pytest...\033[0m
```
============================= test session starts ==============================
collecting ... collected 30 items

tests/integration/test_tap_stack.py::test_json_has_expected_keys PASSED  [  3%]
tests/integration/test_tap_stack.py::test_execute_api_arn_format PASSED  [  6%]
tests/integration/test_tap_stack.py::test_lambda_arn_format PASSED       [ 10%]
tests/integration/test_tap_stack.py::test_s3_arn_format PASSED           [ 13%]
tests/integration/test_tap_stack.py::test_sts_account_matches_arn_account PASSED [ 16%]
tests/integration/test_tap_stack.py::test_rest_api_exists PASSED         [ 20%]
tests/integration/test_tap_stack.py::test_stage_exists PASSED            [ 23%]
tests/integration/test_tap_stack.py::test_stage_access_logs_enabled PASSED [ 26%]
tests/integration/test_tap_stack.py::test_stage_method_settings_present PASSED [ 30%]
tests/integration/test_tap_stack.py::test_apigw_account_cloudwatch_role_matches PASSED [ 33%]
tests/integration/test_tap_stack.py::test_api_log_group_exists PASSED    [ 36%]
tests/integration/test_tap_stack.py::test_api_log_group_retention_14 PASSED [ 40%]
tests/integration/test_tap_stack.py::test_lambda_log_group_exists PASSED [ 43%]
tests/integration/test_tap_stack.py::test_lambda_log_group_retention_14 PASSED [ 46%]
tests/integration/test_tap_stack.py::test_lambda_exists PASSED           [ 50%]
tests/integration/test_tap_stack.py::test_lambda_runtime_python39 PASSED [ 53%]
tests/integration/test_tap_stack.py::test_lambda_memory_256 PASSED       [ 56%]
tests/integration/test_tap_stack.py::test_lambda_env_has_bucket PASSED   [ 60%]
tests/integration/test_tap_stack.py::test_lambda_policy_allows_apigw_invoke PASSED [ 63%]
tests/integration/test_tap_stack.py::test_lambda_invoke_health_direct_event PASSED [ 66%]
tests/integration/test_tap_stack.py::test_lambda_version_is_number_string PASSED [ 70%]
tests/integration/test_tap_stack.py::test_public_health_ok PASSED        [ 73%]
tests/integration/test_tap_stack.py::test_public_echo_ok PASSED          [ 76%]
tests/integration/test_tap_stack.py::test_public_info_ok PASSED          [ 80%]
tests/integration/test_tap_stack.py::test_s3_bucket_exists PASSED        [ 83%]
tests/integration/test_tap_stack.py::test_s3_public_access_block_enabled PASSED [ 86%]
tests/integration/test_tap_stack.py::test_s3_lifecycle_config_present PASSED [ 90%]
tests/integration/test_tap_stack.py::test_cw_alarm_lambda_errors_exists PASSED [ 93%]
tests/integration/test_tap_stack.py::test_cw_alarm_lambda_duration_exists PASSED [ 96%]
tests/integration/test_tap_stack.py::test_invoke_and_find_recent_s3_log_object PASSED [100%]

============================== 30 passed in 1.60s ==============================
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
