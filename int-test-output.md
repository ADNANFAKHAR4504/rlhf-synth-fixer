# Pulumi LocalStack Integration Test Execution Output

**Execution Date:** 2025-12-12 22:46:16

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
    Last updated: 23 seconds ago (2025-12-12 22:45:57.882159929 +0500 PKT)
    Pulumi version used: v3.210.0
Current stack resources (75):
    TYPE                                                       NAME
    pulumi:pulumi:Stack                                        TapStack-localstack-dev
    │  URN: urn:pulumi:localstack-dev::TapStack::pulumi:pulumi:Stack::TapStack-localstack-dev
    ├─ pulumi:providers:aws                                    aws
    │     URN: urn:pulumi:localstack-dev::TapStack::pulumi:providers:aws::aws
    ├─ tap:stack:TapStack                                      multi-tenant-saas
    │  │  URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack::multi-tenant-saas
    │  ├─ aws:iam/role:Role                                    lambda-role-dev
    │  │     URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack$aws:iam/role:Role::lambda-role-dev
    │  ├─ aws:cloudwatch/logGroup:LogGroup                     log-group-tenant-003-dev
    │  │     URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack$aws:cloudwatch/logGroup:LogGroup::log-group-tenant-003-dev
    │  ├─ aws:cloudwatch/logGroup:LogGroup                     log-group-tenant-002-dev
    │  │     URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack$aws:cloudwatch/logGroup:LogGroup::log-group-tenant-002-dev
    │  ├─ aws:cloudwatch/logGroup:LogGroup                     log-group-tenant-005-dev
    │  │     URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack$aws:cloudwatch/logGroup:LogGroup::log-group-tenant-005-dev
```

\033[1;33m🚀 Starting integration tests...\033[0m

## Test Execution

\033[0;34m📋 Running Python integration tests with pytest...\033[0m
```
============================= test session starts ==============================
collecting ... collected 14 items

tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_api_gateway_exists PASSED [  7%]
tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_api_gateway_has_authorizer PASSED [ 14%]
tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_api_gateway_has_resources PASSED [ 21%]
tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_cloudwatch_log_groups_exist PASSED [ 28%]
tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_dynamodb_data_tables_exist PASSED [ 35%]
tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_dynamodb_tables_can_write_and_read PASSED [ 42%]
tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_dynamodb_tables_encrypted_with_kms PASSED [ 50%]
tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_dynamodb_users_tables_exist PASSED [ 57%]
tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_kms_keys_exist_for_all_tenants PASSED [ 64%]
tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_lambda_functions_exist_for_all_tenants PASSED [ 71%]
tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_lambda_functions_have_environment_variables PASSED [ 78%]
tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_lambda_functions_have_proper_permissions PASSED [ 85%]
tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_multi_tenant_isolation PASSED [ 92%]
tests/integration/test_tap_stack_integration.py::TestTapStackIntegration::test_vpc_exists PASSED [100%]

============================== 14 passed in 2.01s ==============================
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
