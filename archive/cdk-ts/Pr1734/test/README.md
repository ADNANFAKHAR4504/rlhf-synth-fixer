# TapStack Integration Tests

This directory contains comprehensive integration tests for the TapStack infrastructure that validate AWS resources using the TypeScript AWS SDK libraries.

## Overview

The integration tests validate that all AWS resources created by the TapStack are properly configured and functioning. The tests use the actual AWS APIs to verify:

- **Application Load Balancer** configuration and health
- **Auto Scaling Group** settings and instance health
- **RDS Database** configuration and availability
- **SNS Topic** setup and subscriptions
- **CloudWatch Alarms** and metrics
- **VPC and Security Groups** configuration
- **IAM Roles** and policies
- **Route 53** DNS configuration (optional)
- **End-to-End Connectivity** testing

## Prerequisites

1. **AWS Credentials**: Ensure you have valid AWS credentials configured
2. **Node.js**: Version 22.17.0 or higher
3. **npm**: Version 10.0.0 or higher
4. **Deployed Infrastructure**: The TapStack must be deployed and outputs available in `cfn-outputs/flat-outputs.json`

## Running the Tests

### Install Dependencies
```bash
npm install
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run Specific Test Categories
```bash
# Run only ALB tests
npm test -- --testNamePattern="Application Load Balancer"

# Run only RDS tests
npm test -- --testNamePattern="RDS Database"

# Run only connectivity tests
npm test -- --testNamePattern="End-to-End Connectivity"
```

## Test Categories

### 1. Application Load Balancer Tests
- **ALB Configuration**: Validates ALB type, scheme, state, and VPC
- **Security Groups**: Checks HTTP/HTTPS ingress rules
- **Target Groups**: Verifies health check configuration and targets

### 2. Auto Scaling Group Tests
- **ASG Configuration**: Validates min/max capacity and desired capacity
- **Instance Health**: Checks that instances are running and in service
- **Instance Configuration**: Verifies instance type, IAM roles, and security groups

### 3. RDS Database Tests
- **Database Configuration**: Validates engine, version, instance class, and settings
- **Subnet Groups**: Checks VPC and subnet configuration
- **Security**: Verifies encryption, multi-AZ, and deletion protection

### 4. SNS Topic Tests
- **Topic Configuration**: Validates topic ARN and display name
- **Subscriptions**: Checks for topic subscriptions

### 5. CloudWatch Tests
- **Alarms**: Validates monitoring alarms exist and are configured
- **Metrics**: Checks that metrics are being collected

### 6. VPC and Networking Tests
- **VPC Configuration**: Validates CIDR blocks and state
- **Security Groups**: Checks ALB, EC2, and RDS security groups

### 7. IAM Role Tests
- **EC2 Role**: Validates instance role and attached policies
- **Permissions**: Checks CloudWatch and SSM policies

### 8. Route 53 Tests (Optional)
- **Hosted Zones**: Validates DNS configuration if present
- **Health Checks**: Checks health check configuration

### 9. End-to-End Connectivity Tests
- **Health Check Endpoint**: Tests `/health` endpoint accessibility
- **Main Application**: Tests main application page accessibility

### 10. Resource Tagging Tests
- **Tag Validation**: Ensures resources have correct tags
- **Environment Tags**: Validates environment-specific tagging

## Expected Outputs

The tests expect the following outputs from `cfn-outputs/flat-outputs.json`:

```json
{
  "LoadBalancerDNS": "TapSta-Appli-NKb7Ey1s1esS-2141424351.us-east-2.elb.amazonaws.com",
  "DatabaseEndpoint": "tapstackpr1734-databaseb269d8bb-ewseparc1yay.c18eaeo2sank.us-east-2.rds.amazonaws.com",
  "SNSTopicArn": "arn:aws:sns:us-east-2:718240086340:TapStackpr1734-AlertTopic2720D535-ekguJ6J1QpOE"
}
```

## Test Configuration

### AWS Region
Tests are configured to run in `us-east-2` region. To change the region, update the region parameter in each AWS client initialization in `tap-stack.integration.test.ts`.

### Timeout Settings
- Default test timeout: 30 seconds
- Integration test timeout: 30 seconds (configurable in package.json)

### Error Handling
Tests include graceful error handling for:
- Missing deployment outputs
- Resources still starting up
- Optional DNS configuration
- Network connectivity issues

## Troubleshooting

### Common Issues

1. **AWS Credentials Not Configured**
   ```
   Error: Unable to load AWS credentials
   ```
   **Solution**: Configure AWS credentials using `aws configure` or environment variables

2. **Resources Not Found**
   ```
   Error: Resource not found
   ```
   **Solution**: Ensure the TapStack is fully deployed and outputs are available

3. **Timeout Errors**
   ```
   Error: Test timeout exceeded
   ```
   **Solution**: Increase timeout in Jest configuration or check resource availability

4. **Permission Errors**
   ```
   Error: Access denied
   ```
   **Solution**: Ensure IAM user/role has necessary permissions for all AWS services

### Debug Mode
Run tests with verbose output:
```bash
npm test -- --verbose
```

### Skip Specific Tests
```bash
# Skip connectivity tests
npm test -- --testPathIgnorePatterns="connectivity"

# Skip optional tests
npm test -- --testNamePattern="Route 53"
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines. Ensure:

1. **AWS Credentials**: Configure AWS credentials in CI environment
2. **Region**: Set AWS_REGION environment variable
3. **Timeout**: Increase timeout for CI environments if needed
4. **Outputs**: Ensure deployment outputs are available before running tests

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Include proper error handling and graceful degradation
3. Add appropriate documentation
4. Ensure tests are idempotent and can run multiple times
5. Include both positive and negative test cases where appropriate
