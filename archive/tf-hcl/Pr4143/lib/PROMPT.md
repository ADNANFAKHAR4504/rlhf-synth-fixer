Help write a Terraform configuration (HCL) that deploys a production-ready, PCI-DSS–compatible API platform for a retail application handling ~2 million daily requests. The design must prioritize security (including DDoS protection and WAF rules), observability, performance, and cost-aware scaling. The solution should be modular, maintainable, and ready for deployment in a single Terraform workspace.

## Primary goals
- Provide a secure API surface for high-throughput traffic (≈2M requests/day).
- Protect against web exploits and basic DDoS threats using AWS WAF and associated best practices.
- Capture detailed analytics, tracing, and metrics for auditing and performance tuning.
- Meet PCI-DSS operational requirements for logging, encryption, and access control.

## Required components
- **Amazon API Gateway** for REST/HTTP endpoints (authoritative entry point).
- **AWS WAF** attached to the API (managed rule sets + custom rules to mitigate OWASP top risks).
- **AWS Lambda** functions for request processing (stateless handlers).
- **Amazon DynamoDB** for application data with appropriate encryption at rest and throughput/autoscaling.
- **Amazon CloudWatch** for metrics and logs (API Gateway + Lambda + WAF metrics).
- **AWS X-Ray** for distributed tracing end-to-end.
- **Amazon QuickSight** (or a setup-ready export) for analytics dashboards based on metrics/logs.
- **IAM** roles and least-privilege policies for all services to restrict access.
- Optional: CloudFront or regional API Gateway configuration if needed for improved DDoS posture (describe and implement if appropriate).

## Constraints and security controls
- All sensitive data at rest must be encrypted (KMS-managed keys).  
- VPC, subnet, and network considerations where required for compliance or Lambda networking.  
- Use least-privilege IAM roles and include example policy boundaries.  
- Enable verbose logging and retention policies suitable for PCI-DSS (document retention length and how to change it).  
- Attach WAF managed rule groups and include at least one custom rule to block suspicious IP ranges or patterns.  
- Provide CloudWatch Alarms for critical conditions (high 5xx rate, latency spikes, WAF block surges, throttling).  
- Add Terraform modules or clear module boundaries for reusability and testability.

## Deliverables
1. A modular Terraform codebase (HCL) with clear file structure (modules + root).  
2. Example `variables.tf` with sensible defaults and `terraform.tfvars.example` for environment-specific values.  
3. README with deployment steps, IAM / least-privilege notes, and how to run tests or dry-runs.  
4. Example CloudWatch dashboards and X-Ray sampling rules or configuration.  
5. QuickSight setup notes (or minimal dataset export/Glue step) that enable analytics on request counts, latencies, errors, and cost-related metrics.  
6. A simple smoke-test plan (curl examples, synthetic requests, validation queries against DynamoDB) and acceptance criteria.

## Acceptance criteria (how to validate)
- Terraform plan/apply runs without errors in an AWS account with adequate permissions.  
- API Gateway endpoints respond to synthetic requests and Lambda executes successfully.  
- WAF is attached and returns blocks for test patterns that trigger custom rules.  
- CloudWatch metrics and logs are present; X-Ray traces show end-to-end spans.  
- QuickSight (or exported dataset) can display request volume, error rate, and latency charts.  
- Documentation explains how the solution meets PCI-DSS aspects (encryption, logging, access controls, retention).