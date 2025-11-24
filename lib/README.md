# AWS WAF v2 with CloudFront Integration

This CDKTF Python project deploys a comprehensive web application firewall setup with CloudFront distribution for content delivery and protection.

## Architecture Overview

The infrastructure includes:

- **WAF v2 WebACL**: Comprehensive rule set for web application protection
- **CloudFront Distribution**: Global content delivery with WAF integration
- **S3 Bucket**: Secure origin storage with versioning
- **CloudWatch Logs**: WAF logging with 30-day retention
- **IP Allowlist**: Office IP addresses for bypass

## WAF Rules

The WebACL includes the following rules in priority order:

1. **IP Allowlist** (Priority 1): Allows traffic from office IPs (203.0.113.0/24, 198.51.100.0/24)
2. **Rate Limiting** (Priority 2): Limits requests to 2000 per 5 minutes per IP
3. **Common Rule Set** (Priority 3): AWS managed rules for common vulnerabilities
4. **Known Bad Inputs** (Priority 4): AWS managed rules for known malicious patterns
5. **SQL Injection** (Priority 5): Custom rule blocking SQL injection in query strings
6. **Geo-Blocking** (Priority 6): Blocks traffic outside US, CA, and UK

## Prerequisites

- Python 3.9 or higher
- CDKTF CLI 0.15+
- AWS CDK 2.x
- Terraform 1.5+
- AWS credentials configured
- Pipenv for dependency management

## Installation

1. Install dependencies:
```bash
pipenv install
```

2. Verify CDKTF providers are generated:
```bash
ls .gen/aws
```

## Deployment

1. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="your-state-bucket"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
```

2. Synthesize the Terraform configuration:
```bash
cdktf synth
```

3. Deploy the infrastructure:
```bash
cdktf deploy
```

4. Confirm the deployment when prompted.

## Configuration

### Environment Variables

- `ENVIRONMENT_SUFFIX`: Environment identifier (default: "dev")
- `AWS_REGION`: Primary AWS region (default: "us-east-1")
- `TERRAFORM_STATE_BUCKET`: S3 bucket for Terraform state
- `TERRAFORM_STATE_BUCKET_REGION`: Region for state bucket

### Resource Naming

All resources include the `environmentSuffix` in their names for environment isolation:
- WAF WebACL: `waf-webacl-{environmentSuffix}`
- CloudFront: Tagged with environment suffix
- S3 Bucket: `waf-cloudfront-origin-{environmentSuffix}`
- Log Group: `aws-waf-logs-{environmentSuffix}`

### Regions

- **us-east-1**: WAF WebACL, CloudFront distribution, CloudWatch Logs (required for CLOUDFRONT scope)
- **us-west-2**: S3 origin bucket

## Security Features

### WAF Protection

- Rate-based DDoS mitigation (2000 requests/5min per IP)
- SQL injection pattern blocking
- Common web vulnerabilities protection
- Known malicious input blocking
- Geographic restriction (US, CA, UK only)
- Office IP allowlisting

### S3 Security

- Versioning enabled
- Public access blocked
- HTTPS-only access enforced
- CloudFront OAC (Origin Access Control)

### CloudFront Security

- TLS 1.2 minimum protocol version
- HTTPS-only viewer protocol
- WAF integration
- Origin Access Control instead of legacy OAI

## Monitoring

- CloudWatch metrics enabled for all WAF rules
- Sampled requests enabled for analysis
- WAF logs sent to CloudWatch Logs
- 30-day log retention for compliance

## Testing

Run unit tests:
```bash
pipenv run pytest tests/
```

## Cleanup

To destroy the infrastructure:
```bash
cdktf destroy
```

All resources are configured with DESTROY removal policy for clean teardown.

## Outputs

After deployment, the following outputs are available:

- `cloudfront_distribution_id`: CloudFront distribution ID
- `cloudfront_distribution_domain_name`: CloudFront domain name for accessing content
- `waf_webacl_id`: WAF WebACL ID
- `waf_webacl_arn`: WAF WebACL ARN
- `origin_bucket_name`: S3 bucket name for uploading content
- `waf_log_group_name`: CloudWatch Log Group for WAF logs

## Usage Example

After deployment, upload content to the S3 bucket and access it via CloudFront:

```bash
# Upload a test file
aws s3 cp index.html s3://waf-cloudfront-origin-dev/

# Access via CloudFront (use the domain name from outputs)
curl https://{cloudfront-domain}/index.html
```

The WAF will automatically protect all requests to the CloudFront distribution.

## Troubleshooting

### Common Issues

1. **WAF must be in us-east-1**: CloudFront scope WAF resources must be created in us-east-1.

2. **OAC vs OAI**: This implementation uses Origin Access Control (OAC), not the legacy Origin Access Identity (OAI).

3. **S3 bucket policy**: The bucket policy is configured after CloudFront creation to reference the correct distribution ARN.

4. **Rate limiting**: Uses IP aggregation with CLOUDFRONT scope as required.

## Compliance

- CloudWatch log retention: Exactly 30 days
- HTTPS-only access enforced
- Geographic restrictions active
- All resources properly tagged

## Tags

All resources are tagged with:
- `Environment`: Environment suffix
- `Project`: WAF-CloudFront
- `CostCenter`: Security
- Additional default tags from environment variables
