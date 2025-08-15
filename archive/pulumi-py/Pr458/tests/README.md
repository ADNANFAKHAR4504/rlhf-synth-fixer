# TapStack Infrastructure Testing Suite

This comprehensive testing suite validates the TapStack AWS infrastructure against all requirements specified in PROMPT.md. The tests ensure production-ready, secure, and compliant infrastructure deployment.

## Test Structure

```
tests/
├── README.md              # This file
├── __init__.py
├── unit/                  # Unit tests with Pulumi mocks
│   ├── __init__.py
│   └── test_tap_stack.py  # 50+ unit test scenarios
└── integration/           # End-to-end tests against live AWS
    ├── __init__.py
    └── test_tap_stack.py  # 35+ integration test scenarios
```

## 🎯 Test Coverage Overview

### **Unit Tests** (`tests/unit/test_tap_stack.py`)
- **50+ Test Methods** with comprehensive Pulumi mocking
- **Enhanced Mock Infrastructure** with realistic AWS resource responses
- **Complete Component Validation** across all infrastructure components
- **Security & Compliance Testing** built-in

### **Integration Tests** (`tests/integration/test_tap_stack.py`)
- **35+ End-to-End Scenarios** against live AWS infrastructure
- **9 PROMPT.md-Specific Tests** for mandatory requirements
- **Real AWS Resource Validation** without mocks
- **Production Workflow Simulation**

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
pip install -r requirements.txt

# Ensure AWS credentials are configured
aws configure

# Deploy TapStack infrastructure first
pulumi up
```

### Running Tests

```bash
# Run all tests
python -m pytest tests/ -v

# Run only unit tests (fast, no AWS resources needed)
python -m pytest tests/unit/ -v

# Run only integration tests (requires deployed infrastructure)
python -m pytest tests/integration/ -v

# Run specific test file
python -m pytest tests/integration/test_tap_stack.py::TestTapStackIntegrationComprehensive::test_complete_s3_lambda_workflow_end_to_end -v

# Run with coverage report
python -m pytest tests/ --cov=lib --cov-report=html
```

## 📋 Test Categories

### **1. Unit Tests Coverage**

#### **VPC & Networking Tests (10 tests)**
- ✅ VPC creation and DNS configuration
- ✅ CIDR block validation and non-overlapping subnets  
- ✅ Multi-AZ distribution and subnet configuration
- ✅ Internet Gateway and NAT Gateway placement
- ✅ Route table associations and connectivity

#### **S3 Storage Tests (8 tests)**
- ✅ Bucket naming conventions and encryption
- ✅ Versioning and public access blocking
- ✅ Security configurations and force destroy settings

#### **Lambda Function Tests (6 tests)**
- ✅ Runtime validation and handler specification
- ✅ Resource allocation and environment variables
- ✅ Code structure and error handling validation

#### **IAM Security Tests (5 tests)**
- ✅ Assume role policies and least privilege validation
- ✅ No admin permissions and role naming consistency

#### **CloudWatch Tests (3 tests)**
- ✅ Log group naming and retention configuration

#### **Integration & Dependencies (8 tests)**
- ✅ Resource creation order and cross-references
- ✅ Configuration validation and tagging compliance

### **2. Integration Tests Coverage**

#### **Infrastructure Deployment Tests (3 tests)**
- ✅ Complete stack validation and resource cross-references
- ✅ Deployment idempotency for CI/CD scenarios

#### **Network Connectivity Tests (4 tests)**
- ✅ VPC configuration and multi-AZ subnet deployment
- ✅ Internet Gateway and NAT Gateway configuration
- ✅ Route table validation

#### **S3-Lambda Integration Tests (3 tests)**
- ✅ S3 upload triggering Lambda execution
- ✅ Multiple file type handling and concurrent processing

#### **Security & Compliance Tests (3 tests)**
- ✅ S3 bucket security configuration
- ✅ IAM least privilege validation
- ✅ Network isolation validation

#### **Performance & Load Tests (2 tests)**
- ✅ Lambda performance under load
- ✅ S3 upload throughput testing

#### **Monitoring Tests (2 tests)**
- ✅ CloudWatch metrics collection
- ✅ Log group retention configuration

#### **Resilience Tests (2 tests)**
- ✅ Multi-AZ resilience validation
- ✅ S3 data durability validation

#### **Operational Tests (3 tests)**
- ✅ Infrastructure tagging compliance
- ✅ Cost optimization validation
- ✅ Backup and recovery procedures

#### **Error Scenario Tests (2 tests)**
- ✅ Lambda error handling validation
- ✅ Resource limits and quotas testing

## 🎯 PROMPT.md Requirement-Specific Tests

### **9 Mandatory Requirement Validation Tests**

#### **1. Complete Infrastructure Deployment**
```python
test_complete_infrastructure_deployment_per_requirements()
```
- ✅ **us-east-1 region** enforcement
- ✅ **VPC CIDR 10.0.0.0/16** exact validation
- ✅ **2 public + 2 private subnets** across different AZs
- ✅ **IGW and NAT Gateway** existence validation

#### **2. CI/CD Idempotency**
```python
test_idempotent_deployment_multi_environment()
```
- ✅ **Environment suffix** naming patterns
- ✅ **Multi-branch CI/CD** support validation
- ✅ **Resource stability** on re-deployment

#### **3. Complete S3 → Lambda Workflow**
```python
test_complete_s3_lambda_workflow_end_to_end()
```
- ✅ **Multiple file types** processing (PDF, CSV, JSON, ZIP, TXT)
- ✅ **S3 event triggering** validation
- ✅ **Lambda processing** confirmation
- ✅ **Metadata handling** verification

#### **4. Lambda Requirements**
```python
test_lambda_function_meets_requirements()
```
- ✅ **Python 3.9 runtime** enforcement
- ✅ **Environment variables** (STAGE, BUCKET) validation
- ✅ **S3 event processing** capability testing

#### **5. Security Requirements**
```python
test_security_requirements_comprehensive()
```
- ✅ **Encryption at rest** (AES256) validation
- ✅ **S3 versioning** enabled verification
- ✅ **Public access blocked** confirmation
- ✅ **IAM least privilege** enforcement

#### **6. Service Integration**
```python
test_all_services_properly_integrated()
```
- ✅ **S3 → Lambda notification** configuration
- ✅ **CloudWatch 14-day retention** requirement
- ✅ **Lambda S3 access** permissions validation
- ✅ **End-to-end connectivity** testing

#### **7. Multi-AZ Resilience**
```python
test_multi_az_resilience_requirements()
```
- ✅ **Multi-AZ distribution** validation
- ✅ **NAT Gateway availability** confirmation
- ✅ **Route table configuration** verification

#### **8. Production-Ready Configuration**
```python
test_production_ready_configuration()
```
- ✅ **Resource tagging** (Project, Stage, Managed)
- ✅ **Error handling** with invalid payloads
- ✅ **Performance optimization** validation
- ✅ **Production scenarios** testing

#### **9. Complete Business Workflow**
```python
test_complete_business_workflow_end_to_end()
```
- ✅ **Real-world file processing** workflow
- ✅ **Error recovery** and resilience testing
- ✅ **Multiple content types** handling
- ✅ **Processing quality** validation

## 🛠️ Test Configuration

### **Environment Variables**
```bash
# Required for integration tests
export AWS_REGION=us-east-1
export STAGE=dev  # or staging, prod

# Optional test configuration
export TEST_TIMEOUT=300
export PERFORMANCE_ITERATIONS=10
export CONCURRENT_UPLOADS=5
```

### **Test Configuration** (`TEST_CONFIG`)
```python
TEST_CONFIG = {
    "REGION": "us-east-1",
    "PROJECT_NAME": "iac-aws-nova-model-breaking", 
    "STACK_NAME": "dev",
    "TEST_TIMEOUT": 300,  # 5 minutes
    "PERFORMANCE_ITERATIONS": 10,
    "CONCURRENT_UPLOADS": 5
}
```

## 📊 Test Results and Reports

### **Running with Coverage**
```bash
# Generate HTML coverage report
python -m pytest tests/ --cov=lib --cov-report=html --cov-report=term

# View coverage report
open htmlcov/index.html
```

### **Test Output Examples**
```bash
# Successful test run
tests/unit/test_tap_stack.py::TestTapStackComprehensive::test_vpc_creation_comprehensive PASSED
tests/unit/test_tap_stack.py::TestTapStackComprehensive::test_s3_bucket_naming_conventions PASSED
tests/integration/test_tap_stack.py::TestTapStackIntegrationComprehensive::test_complete_s3_lambda_workflow_end_to_end PASSED

# Test summary
=================== 85 passed, 0 failed, 0 skipped in 120.45s ===================
```

## 🚨 Troubleshooting

### **Common Issues**

#### **1. Integration Tests Failing**
```bash
# Ensure infrastructure is deployed
pulumi stack select dev
pulumi up

# Check AWS credentials
aws sts get-caller-identity

# Verify stack outputs
pulumi stack output
```

#### **2. Unit Tests Import Errors**
```bash
# Install test dependencies
pip install pytest pytest-cov

# Check Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

#### **3. Lambda Function Not Processing Files**
```bash
# Check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/"

# Verify S3 bucket notifications
aws s3api get-bucket-notification-configuration --bucket <bucket-name>
```

#### **4. Permission Errors**
```bash
# Check IAM role permissions
aws iam get-role --role-name <lambda-role-name>

# Verify Lambda function configuration
aws lambda get-function --function-name <function-name>
```

### **Test-Specific Debugging**

#### **Enable Verbose Logging**
```bash
# Run with maximum verbosity
python -m pytest tests/ -v -s --tb=long

# Enable debug logging
python -m pytest tests/ --log-cli-level=DEBUG
```

#### **Run Individual Test Categories**
```bash
# Test only networking
python -m pytest tests/ -k "network" -v

# Test only security requirements  
python -m pytest tests/ -k "security" -v

# Test only PROMPT.md requirements
python -m pytest tests/ -k "requirements" -v
```

## 📈 Performance Benchmarks

### **Expected Test Execution Times**

| Test Category | Unit Tests | Integration Tests |
|---------------|------------|-------------------|
| **VPC & Networking** | < 5 seconds | 30-60 seconds |
| **S3 Storage** | < 3 seconds | 20-40 seconds |
| **Lambda Functions** | < 5 seconds | 60-120 seconds |
| **Security Validation** | < 3 seconds | 45-90 seconds |
| **End-to-End Workflows** | < 2 seconds | 120-300 seconds |
| **Total Suite** | < 30 seconds | 5-15 minutes |

### **Performance Thresholds**
- **S3 Upload Time**: < 30 seconds per file
- **Lambda Execution**: < 10 seconds average
- **End-to-End Workflow**: < 5 minutes complete
- **Test Suite Completion**: < 15 minutes total

## 🔍 Test Quality Metrics

### **Coverage Targets**
- **Unit Test Coverage**: > 95%
- **Integration Test Coverage**: > 90%
- **PROMPT.md Requirement Coverage**: 100%
- **Critical Path Coverage**: 100%

### **Quality Gates**
- ✅ All mandatory requirements tested
- ✅ Security validation comprehensive
- ✅ Error scenarios covered
- ✅ Performance thresholds met
- ✅ Multi-environment compatibility
- ✅ Production-ready validation

## 📚 Additional Resources

### **Related Documentation**
- [PROMPT.md](../lib/PROMPT.md) - Infrastructure requirements
- [TapStack Implementation](../lib/tap_stack.py) - Main infrastructure code
- [Project README](../README.md) - Overall project documentation

### **AWS Services Tested**
- **VPC**: Virtual Private Cloud networking
- **EC2**: Subnets, Internet Gateway, NAT Gateway, Route Tables
- **S3**: Object storage with encryption and versioning
- **Lambda**: Serverless function execution
- **IAM**: Identity and access management
- **CloudWatch**: Monitoring and logging

### **Testing Frameworks Used**
- **unittest**: Python standard testing framework
- **boto3**: AWS SDK for Python
- **pulumi**: Infrastructure as Code mocking
- **pytest**: Advanced test runner (optional)

## 🎯 Success Criteria

A successful test run should demonstrate:

1. ✅ **All 85+ tests pass** without failures
2. ✅ **Infrastructure meets PROMPT.md requirements** exactly
3. ✅ **Security configurations** are properly implemented
4. ✅ **End-to-end workflows** function correctly
5. ✅ **Performance targets** are achieved
6. ✅ **Error handling** works as expected
7. ✅ **Multi-AZ resilience** is validated
8. ✅ **Production-ready standards** are met

---

**🚀 Happy Testing!** 

For questions or issues, please refer to the troubleshooting section or check the main project documentation.