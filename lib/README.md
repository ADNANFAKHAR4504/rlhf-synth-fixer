# AWS WAF Security Infrastructure

This CloudFormation template deploys a comprehensive AWS WAF (Web Application Firewall) security configuration for API protection with rate limiting, geo-blocking, SQL injection protection, and centralized logging.

## Architecture Overview

The infrastructure includes:

- **WAFv2 Web ACL**: Regional Web ACL with CloudWatch metrics enabled
- **Rate Limiting**: Blocks IPs exceeding 2000 requests per 5-minute window
- **Geo-Blocking**: Denies traffic from North Korea (KP) and Iran (IR)
- **SQL Injection Protection**: AWS Managed Rule Group (AWSManagedRulesSQLiRuleSet)
- **IP Allowlisting**: Allows traffic from trusted office IPs (10.0.0.0/24, 192.168.1.0/24)
- **S3 Logging**: Centralized WAF logs with AES256 encryption
- **ALB Integration**: Associates Web ACL with existing Application Load Balancer

## Rule Priority Order

1. **Priority 0 - AllowOfficeIPs**: Allows traffic from allowlisted office IPs (bypasses all other rules)
2. **Priority 1 - GeoBlockRule**: Blocks traffic from North Korea and Iran
3. **Priority 2 - RateLimitRule**: Blocks IPs exceeding 2000 requests per 5 minutes
4. **Priority 3 - SQLInjectionProtection**: AWS Managed Rules for SQL injection attacks

## Prerequisites

- AWS CLI configured with appropriate credentials
- An existing Application Load Balancer (ALB) in the us-east-1 region
- IAM permissions for WAFv2, S3, and CloudFormation operations

## Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| EnvironmentSuffix | Suffix for resource naming (e.g., pr-123, test-1) | - | Yes |
| ALBArn | ARN of the Application Load Balancer | - | Yes |
| ProjectName | Project name for cost allocation | WAFSecurityProject | No |
| Environment | Environment name (production, staging, development, test) | production | No |

## Deployment

### Deploy the stack

```bash
aws cloudformation create-stack \
  --stack-name waf-security-stack \
  --template-body file://lib/template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=pr-001 \
    ParameterKey=ALBArn,ParameterValue=arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-alb/1234567890abcdef \
    ParameterKey=ProjectName,ParameterValue=MyProject \
    ParameterKey=Environment,ParameterValue=production \
  --region us-east-1
```

### Check deployment status

```bash
aws cloudformation describe-stacks \
  --stack-name waf-security-stack \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Get outputs

```bash
aws cloudformation describe-stacks \
  --stack-name waf-security-stack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Outputs

| Output | Description |
|--------|-------------|
| WebACLArn | ARN of the WAF Web ACL |
| WebACLId | ID of the WAF Web ACL |
| WAFLogBucketName | Name of the S3 bucket for WAF logs |
| WAFLogBucketArn | ARN of the S3 bucket for WAF logs |
| OfficeIPSetArn | ARN of the Office IP Set |

## Verification

### Verify WAF Web ACL

```bash
# Get Web ACL details
aws wafv2 get-web-acl \
  --scope REGIONAL \
  --id <WebACLId> \
  --name api-protection-webacl-<EnvironmentSuffix> \
  --region us-east-1

# List WAF Web ACLs
aws wafv2 list-web-acls \
  --scope REGIONAL \
  --region us-east-1
```

### Verify ALB Association

```bash
# List resources associated with the Web ACL
aws wafv2 list-resources-for-web-acl \
  --web-acl-arn <WebACLArn> \
  --region us-east-1
```

### Verify S3 Logging

```bash
# List objects in the WAF log bucket
aws s3 ls s3://aws-waf-logs-<EnvironmentSuffix>-<AccountId>/ \
  --region us-east-1

# Check bucket encryption
aws s3api get-bucket-encryption \
  --bucket aws-waf-logs-<EnvironmentSuffix>-<AccountId> \
  --region us-east-1
```

### Check CloudWatch Metrics

```bash
# View WAF metrics in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/WAFV2 \
  --metric-name AllowedRequests \
  --dimensions Name=WebACL,Value=api-protection-webacl-<EnvironmentSuffix> Name=Region,Value=us-east-1 Name=Rule,Value=ALL \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region us-east-1
```

## Testing

### Test Rate Limiting

You can test the rate limiting by sending more than 2000 requests from a single IP within 5 minutes:

```bash
# Example using ab (Apache Bench)
ab -n 2100 -c 10 https://your-alb-endpoint.com/
```

After exceeding the limit, requests from that IP should be blocked for 5 minutes.

### Test Geo-Blocking

Geo-blocking can be tested using a VPN or proxy from North Korea or Iran. Requests should be blocked immediately.

### Test SQL Injection Protection

Try sending requests with SQL injection patterns:

```bash
curl "https://your-alb-endpoint.com/api?id=1' OR '1'='1"
```

These requests should be blocked by the SQL injection protection rule.

### Test Office IP Allowlist

From an IP in the 10.0.0.0/24 or 192.168.1.0/24 range, all requests should be allowed regardless of other rules.

## Monitoring and Logging

### CloudWatch Metrics

The following metrics are available in CloudWatch:

- **AllowOfficeIPsRule**: Requests matched by office IP allowlist
- **GeoBlockRule**: Requests blocked by geo-blocking
- **RateLimitRule**: Requests blocked by rate limiting
- **SQLInjectionProtection**: Requests matched by SQL injection rules
- **ApiProtectionWebACL-{EnvironmentSuffix}**: Overall Web ACL metrics

### S3 Logs

WAF logs are stored in the S3 bucket with the following structure:

```
s3://aws-waf-logs-{EnvironmentSuffix}-{AccountId}/
  AWSLogs/
    {AccountId}/
      WAFLogs/
        {Region}/
          {WebACLName}/
            {Year}/
              {Month}/
                {Day}/
```

Logs are in JSON format and include:

- Timestamp
- Action taken (ALLOW, BLOCK, COUNT)
- Rule matched
- Request details (headers, URI, method)
- Rate limit details

## Cost Considerations

### Monthly Cost Estimate (us-east-1)

- WAF Web ACL: $5.00/month
- WAF Rules (4 rules): $4.00/month ($1.00 per rule)
- WAF Requests: $0.60 per million requests
- S3 Storage: ~$0.023/GB per month
- S3 Requests: Minimal cost for log writes

**Estimated monthly cost**: $10-20 for typical usage (excluding high request volume)

## Cleanup

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name waf-security-stack \
  --region us-east-1
```

Note: The S3 bucket must be empty before the stack can be deleted. You may need to empty it first:

```bash
aws s3 rm s3://aws-waf-logs-<EnvironmentSuffix>-<AccountId>/ --recursive
```

## Troubleshooting

### WAF Not Blocking Traffic

1. Verify Web ACL is associated with the ALB:
   ```bash
   aws wafv2 list-resources-for-web-acl --web-acl-arn <WebACLArn>
   ```

2. Check CloudWatch metrics to see if rules are being evaluated

3. Review WAF logs in S3 for matched rules and actions

### S3 Logging Not Working

1. Verify bucket policy allows WAF log delivery
2. Check logging configuration:
   ```bash
   aws wafv2 get-logging-configuration --resource-arn <WebACLArn>
   ```
3. Ensure bucket name follows AWS WAF logging requirements (must start with `aws-waf-logs-`)

### Rate Limiting Not Working

1. Verify rate limit is set to 2000 requests per 5 minutes
2. Check if test IP is in the office allowlist (priority 0 rule bypasses rate limiting)
3. Review CloudWatch metrics for RateLimitRule

## Security Best Practices

1. **Regular Rule Updates**: Review and update AWS Managed Rules regularly
2. **Log Monitoring**: Set up CloudWatch alarms for blocked requests
3. **IP Set Management**: Regularly review and update office IP allowlist
4. **Access Control**: Restrict S3 bucket access using IAM policies
5. **Cost Monitoring**: Set up AWS Budgets to monitor WAF costs
6. **Testing**: Regularly test WAF rules in non-production environments

## Additional Resources

- [AWS WAF Developer Guide](https://docs.aws.amazon.com/waf/latest/developerguide/)
- [AWS WAF Pricing](https://aws.amazon.com/waf/pricing/)
- [AWS Managed Rules for AWS WAF](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups.html)
- [WAF Security Automations](https://aws.amazon.com/solutions/implementations/security-automations-for-aws-waf/)
```
