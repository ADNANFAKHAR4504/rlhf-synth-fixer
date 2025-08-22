# AWS Resource Validation Integration Tests

This directory contains comprehensive integration tests that **validate existing deployed AWS resources** using AWS SDK clients.

## 🎯 Purpose

These integration tests do **NOT deploy new resources**. Instead, they:

- **Discover existing AWS resources** using tags and naming patterns
- **Validate resource configurations** using AWS SDK APIs  
- **Perform real interactions** with deployed infrastructure
- **Test security settings** and compliance requirements
- **Verify inter-resource communication** and dependencies

## ⚠️ Prerequisites

### 1. Deployed Infrastructure
You must have **already deployed** your infrastructure components before running these tests. The tests will discover and validate existing resources.

### 2. AWS Credentials
Configure AWS credentials using one of these methods:

```bash
# Environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"

# Or use AWS CLI configuration
aws configure
```

### 3. Required AWS Permissions

The test user/role needs **READ** permissions for:
- **EC2**: DescribeVpcs, DescribeSubnets, DescribeSecurityGroups, DescribeInstances
- **S3**: ListBuckets, GetBucketTagging, GetBucketEncryption, GetBucketVersioning, HeadBucket
- **IAM**: ListRoles, ListAttachedRolePolicies  
- **KMS**: ListKeys, DescribeKey, ListResourceTags
- **CloudTrail**: DescribeTrails, GetTrailStatus
- **CloudWatch Logs**: DescribeLogGroups, DescribeLogStreams
- **STS**: GetCallerIdentity

And **WRITE** permissions for:
- **S3**: PutObject, GetObject, DeleteObject (for functional testing)

### 4. Resource Tagging
Your deployed resources should be tagged with:
- `Project` tag with a consistent value (default: "SecureInfrastructure")
- Or follow naming patterns that include your project identifier

### 5. Enable Live Testing
Set the environment variable:
```bash
export ENABLE_LIVE_TESTS=true
```

## 🚀 Running the Tests

### Basic Execution
```bash
export ENABLE_LIVE_TESTS=true
export PROJECT_NAME="YourProjectName"  # Optional, defaults to "SecureInfrastructure"
./gradlew integrationTest
```

### Run Specific Test Suites
```bash
# Test resource discovery and existence
./gradlew integrationTest --tests "*ResourceExistenceTests*"

# Test resource interactions and functionality
./gradlew integrationTest --tests "*ResourceInteractionTests*"

# Test security and compliance
./gradlew integrationTest --tests "*SecurityComplianceTests*"
```

## 📋 Test Structure

### 1. Resource Existence Validation Tests (`@Order(1-5)`)

#### VPC Infrastructure Validation (`@Order(1)`)
- Discovers VPCs with project tags
- Validates VPC configuration (DNS, CIDR blocks)
- Verifies subnets exist and are properly configured
- Checks availability zones and network setup

#### S3 Storage Validation (`@Order(2)`)  
- Discovers S3 buckets with project tags
- Validates bucket encryption configuration
- Checks versioning is enabled
- Verifies public access is blocked
- Tests bucket accessibility

#### KMS Key Validation (`@Order(3)`)
- Discovers KMS keys with project tags  
- Validates key state and usage permissions
- Checks key rotation is enabled
- Verifies key metadata and description

#### CloudTrail Validation (`@Order(4)`)
- Discovers CloudTrail trails by name/tags
- Validates trail is actively logging
- Checks multi-region configuration
- Verifies log file validation is enabled
- Confirms KMS encryption is used

#### IAM Configuration Validation (`@Order(5)`)
- Discovers IAM roles by name patterns
- Validates assume role policies exist
- Checks attached policies and permissions
- Verifies least privilege principles

### 2. Resource Interaction and Functional Tests (`@Order(10-13)`)

#### S3 Operations Testing (`@Order(10)`)
- Performs PUT/GET/DELETE operations on discovered buckets
- Tests access controls and permissions  
- Validates encryption in transit
- Verifies bucket policies are working
- Cleans up test objects automatically

#### VPC Network Connectivity (`@Order(11)`)
- Validates security group configurations
- Checks for overly permissive rules
- Tests network isolation settings
- Verifies routing and connectivity

#### CloudWatch Logs Validation (`@Order(12)`)
- Discovers log groups related to the project
- Validates log streams have recent activity
- Checks log retention policies
- Verifies monitoring is functioning

#### EC2 Instance Configuration (`@Order(13)`)
- Discovers EC2 instances with project tags
- Validates instances are in VPCs (not EC2-Classic)
- Checks security group assignments
- Verifies proper tagging and IAM roles

### 3. Security and Compliance Tests (`@Order(20-22)`)

#### Encryption Validation (`@Order(20)`)
- Validates S3 buckets use KMS encryption
- Checks customer-managed KMS keys
- Verifies key rotation is enabled
- Tests encryption at rest and in transit

#### Audit Logging Validation (`@Order(21)`)
- Validates CloudTrail is actively logging
- Checks for recent log delivery
- Verifies no notification errors
- Tests log integrity and monitoring

#### Network Security Validation (`@Order(22)`)
- Validates VPC default security groups are restrictive
- Checks for unnecessary public access
- Verifies network ACLs and security groups
- Tests network isolation and segmentation

## 🔧 How It Works

### 1. Resource Discovery Phase
```java
@BeforeAll
void setUp() {
    // Initialize AWS SDK clients for each service
    // Discover existing resources using tags and naming patterns
    // Store resource identifiers for validation
}
```

The tests automatically discover resources by:
- **VPCs**: Filter by `Project` tag
- **S3 Buckets**: Check bucket tags for `Project` key
- **KMS Keys**: List keys and check tags  
- **CloudTrails**: Filter by name containing project identifier
- **EC2 Instances**: Filter by `Project` tag and active states
- **IAM Roles**: Filter by name patterns containing project name

### 2. Validation Phase
Each test category validates different aspects:
- **Configuration**: Resource settings match expected values
- **Security**: Encryption, access controls, and compliance
- **Functionality**: Resources work as expected
- **Integration**: Resources communicate properly

### 3. Interaction Testing
Tests perform actual operations on discovered resources:
- Upload/download test files to S3 buckets
- Query CloudWatch logs for activity
- Validate network connectivity and security rules
- Test IAM role permissions and policies

## 🏷️ Resource Identification

### Default Project Tag
By default, tests look for resources tagged with:
- **Key**: `Project`
- **Value**: `SecureInfrastructure`

### Custom Project Identification
Override the project identifier:
```bash
export PROJECT_NAME="MyCustomProject"
./gradlew integrationTest
```

### Naming Pattern Fallbacks
If tags are not available, tests also look for resources with names containing:
- Project name in lowercase
- CloudTrail trails with project name in ARN
- IAM roles with project name in role name or description

## ⚡ Example Test Execution

```bash
$ export ENABLE_LIVE_TESTS=true
$ export PROJECT_NAME="MyProject"  
$ ./gradlew integrationTest --tests "*MainIntegrationTest*"

> Task :integrationTest

=== Starting AWS Resource Validation Tests ===
Region: us-east-1
Project Tag: MyProject
Current AWS Account ID: 123456789012

--- Discovering Existing Resources ---
Discovered VPCs: [vpc-12345abc, vpc-67890def]
Discovered S3 Buckets: [myproject-bucket-123, myproject-logs-456]
Discovered KMS Keys: [arn:aws:kms:us-east-1:123:key/abcd-1234]
Discovered CloudTrails: [myproject-security-trail]
Discovered EC2 Instances: [i-1234567890abcdef0]
--- Resource Discovery Complete ---

MainIntegrationTest > Resource Existence Validation Tests > Should validate VPC infrastructure exists and is properly configured PASSED
✓ VPC vpc-12345abc validated: 10.0.0.0/16
✓ VPC vpc-12345abc has 4 subnets

MainIntegrationTest > Resource Existence Validation Tests > Should validate S3 storage infrastructure with proper encryption PASSED
✓ Bucket myproject-bucket-123 has encryption: aws:kms
✓ Bucket myproject-bucket-123 has versioning enabled
✓ Bucket myproject-bucket-123 has public access blocked

[... more test output ...]

BUILD SUCCESSFUL in 45s
```

## 🔍 Troubleshooting

### Common Issues

1. **No Resources Found**
   ```
   org.opentest4j.TestAbortedException: At least some infrastructure resources should exist for testing
   ```
   - **Solution**: Deploy your infrastructure first, or check your `PROJECT_NAME` environment variable

2. **Access Denied Errors**  
   ```
   software.amazon.awssdk.services.s3.model.S3Exception: Access Denied
   ```
   - **Solution**: Check AWS credentials and IAM permissions

3. **Tests Skipped**
   ```
   MainIntegrationTest > All tests SKIPPED
   ```
   - **Solution**: Set `ENABLE_LIVE_TESTS=true` environment variable

4. **Resource Discovery Issues**
   - **Solution**: Verify your resources have proper tags or naming patterns

### Debug Mode
Run tests with detailed logging:
```bash
./gradlew integrationTest --tests "*MainIntegrationTest*" --info
```

### Resource-Specific Testing  
Test only specific resource types by running individual test classes:
```bash
# Test only S3 resources
./gradlew integrationTest --tests "*shouldValidateS3*"

# Test only VPC resources  
./gradlew integrationTest --tests "*shouldValidateVpc*"
```

## 🛡️ Security Considerations

- **Read-Only by Default**: Most tests only read resource configurations
- **Minimal Write Operations**: Only S3 functional tests create/delete small test objects
- **Automatic Cleanup**: Test objects are automatically cleaned up
- **No Resource Modification**: Tests never modify existing infrastructure
- **Credential Safety**: Uses standard AWS credential providers

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Infrastructure Validation Tests
on:
  schedule:
    - cron: '0 8 * * *'  # Run daily at 8 AM
  workflow_dispatch:

jobs:
  validate-infrastructure:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
        
    - name: Run Infrastructure Validation Tests
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_DEFAULT_REGION: us-east-1
        ENABLE_LIVE_TESTS: true
        PROJECT_NAME: ${{ vars.PROJECT_NAME }}
      run: ./gradlew integrationTest --tests "*MainIntegrationTest*"
```

### Jenkins Pipeline Example
```groovy
pipeline {
    agent any
    
    environment {
        AWS_ACCESS_KEY_ID = credentials('aws-access-key-id')
        AWS_SECRET_ACCESS_KEY = credentials('aws-secret-access-key')
        AWS_DEFAULT_REGION = 'us-east-1'
        ENABLE_LIVE_TESTS = 'true'
        PROJECT_NAME = 'MyProject'
    }
    
    stages {
        stage('Validate Infrastructure') {
            steps {
                sh './gradlew integrationTest --tests "*MainIntegrationTest*"'
            }
        }
    }
}
```

## 📊 Test Categories Summary

| Category | Purpose | Creates Resources | Modifies Resources |
|----------|---------|-------------------|-------------------|
| **Resource Existence** | Validate deployed resources exist and are configured correctly | ❌ | ❌ |
| **Resource Interaction** | Test functionality and communication between resources | ⚠️ Small test objects only | ❌ |
| **Security Compliance** | Validate security settings and compliance requirements | ❌ | ❌ |

## 🎯 Best Practices

1. **Run Regularly**: Schedule these tests to run daily or after deployments
2. **Monitor Results**: Set up alerts for test failures  
3. **Tag Resources**: Ensure all resources have proper project tags
4. **Separate Accounts**: Consider using dedicated AWS accounts for testing
5. **Minimal Permissions**: Use least-privilege IAM policies for test execution
6. **Clean State**: Ensure tests can run independently and don't depend on previous runs

These integration tests provide comprehensive validation of your deployed AWS infrastructure without the cost and complexity of deploying new resources for every test run!