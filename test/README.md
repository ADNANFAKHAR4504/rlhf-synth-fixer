# EKS Cluster Terraform Tests

This directory contains integration tests for the EKS cluster Terraform configuration using Terratest.

## Prerequisites

- Go 1.21 or later
- AWS credentials configured
- Terraform 1.5+ installed
- kubectl 1.28+ installed

## Test Structure

- `terraform_test.go`: Main integration test suite

## Running Tests

### Run all tests:
```bash
cd test
go mod download
go test -v -timeout 90m
```

### Run specific test:
```bash
go test -v -timeout 90m -run TestEKSClusterDeployment
```

### Run tests in parallel:
```bash
go test -v -timeout 90m -parallel 4
```

## Test Coverage

The test suite validates:

1. **EKS Cluster Deployment** (Requirement 1)
   - Cluster exists and is active
   - Version 1.28 is deployed
   - OIDC provider is enabled

2. **Node Groups** (Requirement 2)
   - All 3 node groups created (frontend, backend, data-processing)
   - Correct instance types configured
   - Scaling configuration (min 2, max 10)

3. **Fargate Profiles** (Requirement 3)
   - CoreDNS Fargate profile exists
   - ALB Controller Fargate profile exists

4. **IRSA Roles** (Requirement 4)
   - ALB Controller role created
   - Cluster Autoscaler role created
   - Secrets Manager role created

5. **ALB Ingress Controller** (Requirement 5)
   - Service account with proper IRSA
   - Helm deployment verified

6. **Cluster Autoscaler** (Requirement 6)
   - Min/max configuration correct
   - Proper IAM permissions

7. **EKS Add-ons** (Requirement 7)
   - VPC CNI deployed
   - Kube-proxy deployed
   - CoreDNS deployed

8. **CloudWatch Container Insights** (Requirement 8)
   - Log groups created
   - Metrics collection enabled

9. **Security**
   - ECR vulnerability scanning enabled
   - Secrets Manager integration
   - Network policies configured

10. **Networking**
    - VPC with correct CIDR
    - 3 public subnets
    - 3 private subnets
    - NAT gateways configured

## Test Timeout

Tests can take up to 60-90 minutes due to:
- EKS cluster provisioning (~15-20 minutes)
- Node group creation (~10-15 minutes)
- Fargate profile setup (~5-10 minutes)
- Add-on deployment (~5-10 minutes)
- Cluster destruction (~15-20 minutes)

## Cleanup

Tests automatically clean up resources using `defer terraform.Destroy()`. If tests fail unexpectedly, manually check for remaining resources:

```bash
# Check for EKS clusters
aws eks list-clusters --region eu-central-1

# Check for VPCs
aws ec2 describe-vpcs --region eu-central-1 --filters "Name=tag:EnvironmentSuffix,Values=test-*"

# Manual cleanup if needed
cd ../lib
terraform destroy -var="environment_suffix=<suffix>"
```

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Terratest
  run: |
    cd test
    go test -v -timeout 90m
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_DEFAULT_REGION: eu-central-1
```

## Troubleshooting

### Test failures due to rate limits:
- Add retry logic with backoff
- Increase `TimeBetweenRetries` in test options

### Timeout errors:
- Increase test timeout: `-timeout 120m`
- Check AWS service limits

### Authentication errors:
- Verify AWS credentials: `aws sts get-caller-identity`
- Check IAM permissions for EKS, VPC, IAM

### Resource conflicts:
- Ensure unique `environment_suffix` for each test run
- Check for existing resources with same names
