# Pulumi LocalStack Integration Test Execution Output

**Execution Date:** 2025-12-12 18:33:22

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
    Last updated: 51 seconds ago (2025-12-12 18:32:35.488556543 +0500 PKT)
    Pulumi version used: v3.210.0
Current stack resources (19):
    TYPE                                       NAME
    pulumi:pulumi:Stack                        TapStack-localstack-dev
    │  URN: urn:pulumi:localstack-dev::TapStack::pulumi:pulumi:Stack::TapStack-localstack-dev
    ├─ pulumi:providers:aws                    aws
    │     URN: urn:pulumi:localstack-dev::TapStack::pulumi:providers:aws::aws
    └─ tap:stack:TapStack                      TapStackdev
       │  URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack::TapStackdev
       ├─ pulumi:providers:aws                 primary-provider-dev
       │     URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack$pulumi:providers:aws::primary-provider-dev
       ├─ pulumi:providers:aws                 secondary-provider-dev
       │     URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack$pulumi:providers:aws::secondary-provider-dev
       ├─ aws:rds/globalCluster:GlobalCluster  aurora-global-v2-dev
       │     URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack$aws:rds/globalCluster:GlobalCluster::aurora-global-v2-dev
       ├─ aws:ec2/vpc:Vpc                      db-vpc-primary-dev
       │     URN: urn:pulumi:localstack-dev::TapStack::tap:stack:TapStack$aws:ec2/vpc:Vpc::db-vpc-primary-dev
```

\033[1;33m🚀 Starting integration tests...\033[0m

## Test Execution

\033[0;34m📋 Running Python integration tests with pytest...\033[0m
```
============================= test session starts ==============================
collecting ... collected 16 items

tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_compute_module_imports PASSED [  6%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_database_module_imports PASSED [ 12%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_drift_detector_imports PASSED [ 18%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_fraud_detection_component_imports PASSED [ 25%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_iam_module_imports PASSED [ 31%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_monitoring_module_imports PASSED [ 37%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_networking_module_imports PASSED [ 43%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_output_alb_exists PASSED [ 50%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_output_aurora_exists PASSED [ 56%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_output_dashboard_exists PASSED [ 62%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_output_dynamodb_exists PASSED [ 68%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_output_ecs_cluster_exists PASSED [ 75%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_output_environment_is_pr6896 PASSED [ 81%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_output_region_is_eu_west_1 PASSED [ 87%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_output_sns_exists PASSED [ 93%]
tests/integration/test_deployed_infrastructure.py::TestPulumiInfrastructure::test_output_vpc_id_exists PASSED [100%]

============================== 16 passed in 0.36s ==============================
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
