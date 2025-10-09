# Integration Testing Guide

## Overview
This guide provides instructions for running live integration tests against deployed AWS infrastructure. The integration tests validate that actual AWS resources are working correctly and meet all requirements.

## Prerequisites

### 1. AWS Credentials
Ensure you have valid AWS credentials configured:
```bash
# Option 1: Environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"

# Option 2: AWS CLI configured
aws configure
```

### 2. Deployed Infrastructure
Deploy the infrastructure first:
```bash
cd lib

# Initialize Terraform
terraform init

# Create terraform.tfvars with real values
cat > terraform.tfvars <<EOF
acm_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID"
key_pair_name = "your-existing-keypair"
my_allowed_cidr = "YOUR.IP.ADDRESS/32"
rds_password = "YourSecurePassword123!"
instance_ami = "ami-0c02fb55731490381"
EOF

# Deploy infrastructure
terraform apply

# Export outputs to flat-outputs.json
terraform output -json > ../cfn-outputs/flat-outputs.json
```

### 3. Test Dependencies
Ensure all test dependencies are installed:
```bash
npm install
```

## Running Integration Tests

### Run All Integration Tests
```bash
npm run test:integration
```

### Run Specific Test Suite
```bash
# Run only VPC tests
npm run test:integration -- --testNamePattern="VPC"

# Run only security group tests
npm run test:integration -- --testNamePattern="Security Groups"

# Run only RDS tests
npm run test:integration -- --testNamePattern="RDS"
```

### Run with Verbose Output
```bash
npm run test:integration -- --verbose
```

## Integration Test Coverage

### 1. VPC and Networking Tests
**Test**: VPC should exist with correct CIDR block
- Validates VPC exists with CIDR 10.0.0.0/16
- Checks DNS hostnames and DNS support enabled
- Verifies Environment tag is "Production"

**Test**: Subnets should exist with correct CIDR blocks
- Public subnet (10.0.1.0/24) in first AZ
- Private subnet primary (10.0.2.0/24) in first AZ
- Private subnet secondary (10.0.3.0/24) in second AZ
- Validates public IP mapping for public subnet

### 2. Security Groups Tests
**Test**: Security groups should exist with correct rules
- ALB security group allows HTTPS (443) and HTTP (80) from internet
- Web security group allows traffic from ALB only
- DB security group allows PostgreSQL (5432) from web server only
- Validates least-privilege security model

### 3. EC2 Instance Tests
**Test**: Web server instance should be running with correct configuration
- Instance is in "running" state
- Instance type is t3.micro or t3.small
- Environment tag is "Production"
- IAM instance profile attached

### 4. Application Load Balancer Tests
**Test**: ALB should be active and healthy
- ALB state is "active"
- Type is "application"
- Scheme is "internet-facing"
- DNS name is accessible

**Test**: Target group should have healthy targets
- At least one target registered
- Target health validation
- Health check configuration verified

### 5. RDS Database Tests
**Test**: PostgreSQL instance should be available and Multi-AZ
- DB instance status is "available"
- Engine is PostgreSQL
- Multi-AZ is enabled
- Not publicly accessible
- Performance Insights enabled
- Enhanced monitoring active

### 6. CloudWatch Monitoring Tests
**Test**: CloudWatch alarms should be configured
- Production alarms exist
- RDS CPU utilization alarm configured
- ALB unhealthy target alarm configured
- EC2 high CPU alarm configured

### 7. S3 Bucket Tests
**Test**: S3 bucket should exist and be configured for ALB logs
- Bucket exists and is accessible
- Public access is blocked
- Bucket policy allows ALB to write logs
- Encryption configured

### 8. End-to-End Workflow Tests
**Test**: ALB should be accessible via HTTPS
- ALB responds to HTTPS requests
- HTTP redirects to HTTPS
- Target health is maintained

## Test Output Format

### Success Output
```
PASS  test/terraform.int.test.ts
  Terraform Infrastructure Integration Tests
    VPC and Networking
      ✓ VPC should exist with correct CIDR block (120 ms)
      ✓ Subnets should exist with correct CIDR blocks (85 ms)
    Security Groups
      ✓ Security groups should exist with correct rules (95 ms)
    EC2 Instance
      ✓ Web server instance should be running with correct configuration (110 ms)
    Application Load Balancer
      ✓ ALB should be active and healthy (150 ms)
      ✓ Target group should have healthy targets (90 ms)
    RDS Database
      ✓ PostgreSQL instance should be available and Multi-AZ (200 ms)
    CloudWatch Monitoring
      ✓ CloudWatch alarms should be configured (180 ms)
    S3 Bucket for ALB Logs
      ✓ S3 bucket should exist and be configured for ALB logs (75 ms)
    End-to-End Workflow
      ✓ ALB should be accessible via HTTPS (250 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Time:        3.5s
```

### Pre-Deployment Output (Graceful Skips)
When infrastructure is not deployed, tests gracefully skip:
```
console.warn
    VPC ID not found in outputs, skipping test
console.warn
    Subnet IDs not found in outputs, skipping test
...
```

This allows the tests to run in CI/CD pipelines without failing when infrastructure isn't deployed yet.

## Troubleshooting

### Issue: "AWS credentials not found"
**Solution**: Configure AWS credentials as described in Prerequisites section.

### Issue: "Resource not found"
**Solution**: Ensure infrastructure is deployed and outputs are exported to `cfn-outputs/flat-outputs.json`.

### Issue: "Permission denied"
**Solution**: Ensure your AWS IAM user/role has permissions to describe EC2, RDS, ELB, CloudWatch, and S3 resources.

### Issue: "Tests timing out"
**Solution**: Increase test timeout:
```bash
npm run test:integration -- --testTimeout=60000
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Integration Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Run Integration Tests
        run: npm run test:integration
```

## Best Practices

1. **Run Tests After Deployment**
   - Always deploy infrastructure before running integration tests
   - Export Terraform outputs to the expected location

2. **Use Appropriate Timeouts**
   - RDS and ALB operations can take time
   - Default timeout is 30 seconds, increase if needed

3. **Clean Up Resources**
   - After testing, destroy infrastructure to avoid costs:
   ```bash
   cd lib
   terraform destroy
   ```

4. **Secure Credentials**
   - Never commit AWS credentials
   - Use environment variables or AWS CLI configuration
   - In CI/CD, use secrets management

5. **Monitor Costs**
   - Integration tests against live infrastructure incur AWS costs
   - Use cost allocation tags to track testing expenses
   - Consider using AWS Cost Explorer

## Live Test Execution Checklist

- [ ] AWS credentials configured
- [ ] Infrastructure deployed via `terraform apply`
- [ ] Outputs exported to `cfn-outputs/flat-outputs.json`
- [ ] Test dependencies installed (`npm install`)
- [ ] Run integration tests (`npm run test:integration`)
- [ ] Verify all tests pass
- [ ] Clean up resources (`terraform destroy`)

## Expected Results

With properly deployed infrastructure, you should see:
- ✅ 10/10 integration tests passing
- ✅ All AWS resources validated
- ✅ Security configurations verified
- ✅ End-to-end connectivity confirmed
- ✅ No test failures or errors

## Support

For issues with integration tests:
1. Check AWS credentials and permissions
2. Verify infrastructure deployment status
3. Review test logs for specific error messages
4. Ensure all prerequisites are met
5. Check that outputs file exists and contains required values
