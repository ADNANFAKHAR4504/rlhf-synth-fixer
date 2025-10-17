ROLE: You are a senior Terraform engineer at a financial services company.

CONTEXT:
Our team needs to build a secure API infrastructure that handles around 500,000 transactions daily. The system must work across multiple regions (us-east-1 and us-west-2) with custom authentication, and we need to stay GDPR compliant. Performance is critical - users expect fast responses no matter where they're located.

CONSTRAINTS:
- Use Terraform HCL only (no modules from registry, keep it simple)
- Lambda authorizer must be Python 3.10 runtime
- DynamoDB needs to be Global Tables for multi-region sync
- All sensitive data (API keys, secrets) must use Secrets Manager
- WAF rules should block common attack patterns (SQL injection, XSS)
- CloudWatch logs must retain for at least 90 days
- X-Ray tracing enabled on all Lambda functions
- API Gateway should have throttling configured (10000 requests/sec burst, 5000 steady)
- Use Route 53 latency-based routing between regions

DELIVERABLES:
1) main.tf - core infrastructure (API Gateway REST API, DynamoDB Global Table, Route 53, CloudFront)
2) variables.tf - all configurable parameters
3) lambda_authorizer.py - custom authorizer logic (token validation)
4) lambda_transaction.py - transaction processing function
5) security.tf - WAF rules and security groups
6) monitoring.tf - CloudWatch dashboards, alarms, X-Ray config
7) outputs.tf - API endpoints, CloudFront domain, monitoring dashboard URLs

OUTPUT FORMAT (IMPORTANT):
- Each file should be in its own fenced code block
- Comment the filename at the top, like:
```hcl
# main.tf
...