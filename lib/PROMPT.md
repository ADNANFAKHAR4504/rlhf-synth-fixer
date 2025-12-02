# FinOps Cost Optimization Analyzer

## Overview

Build a FinOps cost optimization analyzer that scans AWS infrastructure resources and identifies cost-saving opportunities. The tool analyzes idle or underutilized resources across multiple AWS services and generates actionable reports with estimated monthly savings.

## What We Need to Build

Create a Python-based AWS cost analysis tool that automatically identifies wasteful resources and provides optimization recommendations.

### Core Requirements

1. **Application Load Balancer (ALB) Analysis**
   - Identify idle ALBs with < 1000 requests in the last 14 days
   - Calculate estimated monthly savings (~$18.40/month per idle ALB)
   - Skip resources tagged with CostCenter: R&D

2. **NAT Gateway Analysis**
   - Find underutilized NAT Gateways (< 1 GB processed in 30 days)
   - Detect misconfigured NAT Gateways in AZs without private subnets
   - Calculate estimated monthly savings (~$32.40/month per NAT Gateway)

3. **S3 Bucket Analysis**
   - Identify buckets with versioning enabled but no non-current version expiration
   - Find large buckets (> 1 TB) without Glacier Deep Archive lifecycle policies
   - Calculate storage cost savings based on tier transitions

4. **Elastic IP Analysis**
   - Find unassociated Elastic IPs
   - Identify EIPs attached to stopped EC2 instances
   - Calculate estimated monthly savings (~$3.60/month per unused EIP)

5. **Report Generation**
   - Generate console table output with findings summary
   - Create detailed JSON report (finops_report.json)
   - Calculate total monthly and annual savings estimates

### Technical Requirements

- **Language**: Python 3.x
- **AWS SDK**: boto3 with support for Moto testing via AWS_ENDPOINT_URL
- **Dependencies**: boto3, tabulate
- **Region**: us-east-1 (configurable)
- **Output**: Console table + JSON report file

## Required IAM Permissions

The analyzer requires the following IAM permissions to function correctly:

### EC2 Permissions
```json
{
  "Effect": "Allow",
  "Action": [
    "ec2:DescribeNatGateways",
    "ec2:DescribeSubnets",
    "ec2:DescribeRouteTables",
    "ec2:DescribeAddresses",
    "ec2:DescribeInstances"
  ],
  "Resource": "*"
}
```

### Elastic Load Balancing Permissions
```json
{
  "Effect": "Allow",
  "Action": [
    "elasticloadbalancing:DescribeLoadBalancers",
    "elasticloadbalancing:DescribeTags"
  ],
  "Resource": "*"
}
```

### CloudWatch Permissions
```json
{
  "Effect": "Allow",
  "Action": [
    "cloudwatch:GetMetricStatistics"
  ],
  "Resource": "*"
}
```

### S3 Permissions
```json
{
  "Effect": "Allow",
  "Action": [
    "s3:ListAllMyBuckets",
    "s3:GetBucketTagging",
    "s3:GetBucketVersioning",
    "s3:GetLifecycleConfiguration"
  ],
  "Resource": "*"
}
```

### Minimum IAM Policy (Combined)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "FinOpsAnalyzerReadOnly",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeNatGateways",
        "ec2:DescribeSubnets",
        "ec2:DescribeRouteTables",
        "ec2:DescribeAddresses",
        "ec2:DescribeInstances",
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:DescribeTags",
        "cloudwatch:GetMetricStatistics",
        "s3:ListAllMyBuckets",
        "s3:GetBucketTagging",
        "s3:GetBucketVersioning",
        "s3:GetLifecycleConfiguration"
      ],
      "Resource": "*"
    }
  ]
}
```

## Security Requirements

### Credential Exposure Prevention

1. **Error Message Sanitization**
   - Never expose AWS credentials, access keys, or secret keys in error messages
   - Sanitize exception messages before logging to remove sensitive data
   - Use generic error messages for end users while logging details securely
   - Avoid printing full stack traces that may contain credential information

2. **Safe Error Handling Pattern**
   ```python
   try:
       # AWS operation
   except Exception as e:
       # Log sanitized error - avoid exposing credentials
       print(f"Error analyzing resource: Operation failed", file=sys.stderr)
       # Do NOT log: print(f"Error: {e}") - may contain sensitive info
   ```

3. **Environment Variable Security**
   - AWS_ENDPOINT_URL should only be set in testing environments
   - Never log or print environment variables containing credentials
   - Use AWS IAM roles instead of hardcoded credentials when possible

### Sensitive Resource ARN Handling

1. **ARN Masking in Reports**
   - Truncate long ARNs in console output (max 50 characters with ellipsis)
   - Consider masking account IDs in ARNs for shared reports
   - JSON reports should include full ARNs only for internal use

2. **Report Security**
   - finops_report.json contains sensitive resource identifiers
   - Ensure proper file permissions on generated reports
   - Do not commit reports to version control
   - Consider encrypting reports at rest in production

3. **Output Sanitization Options**
   ```python
   def mask_account_id(arn: str) -> str:
       """Mask AWS account ID in ARN for external sharing"""
       # arn:aws:service:region:account-id:resource
       parts = arn.split(':')
       if len(parts) >= 5:
           parts[4] = '***MASKED***'
       return ':'.join(parts)
   ```

4. **Logging Best Practices**
   - Use stderr for warnings and errors (not stdout)
   - Avoid logging full API responses which may contain sensitive metadata
   - Implement log levels to control verbosity in production

## Testing Requirements

- Use Moto library for AWS service mocking
- Set AWS_ENDPOINT_URL environment variable for local testing
- Test all resource analysis functions independently
- Verify R&D tag exclusion logic
- Test CloudWatch metric retrieval edge cases
- Validate report generation with various finding combinations

## Success Criteria

- **Functionality**: Successfully identifies all waste types across ALB, NAT Gateway, S3, and EIP
- **Accuracy**: Correct calculation of estimated savings based on AWS pricing
- **Performance**: Handles pagination for large resource counts
- **Security**: No credential exposure, sanitized error messages, secure report handling
- **Testing**: Comprehensive test coverage with Moto mocks
- **Code Quality**: Passes pylint with score >= 7.0/10

## Deliverables

- `lib/analyse.py` - Main FinOps analyzer implementation
- Unit tests with Moto mocks
- IAM policy documentation (included above)
- JSON report schema documentation
