# Model Failures

This file lists concrete failures in the model's response when evaluated against the requirements in `PROMPT.md`. Each entry describes a deviation, omission, incorrect assumption, or unsafe practice found in `MODEL_RESPONSE.md`. This document contains failures only — no fixes or remediation guidance.

1. Route 53 failover not implemented correctly
	- The response creates a hosted zone and weighted A records but does not configure proper Route 53 failover (primary/secondary records and routing-policy-based failover). The health check and record configuration are insufficient to provide cross-environment failover as required.

2. CloudFront does not route to the nearest region
	- The implementation provisions a CloudFront distribution per region that points to that region's ALB. It does not configure origin groups, geo-proximity, Lambda@Edge, or other multi-region origin routing to ensure requests go to the nearest region.

3. Cross-account IAM roles are not implemented for real cross-account access
	- The "cross-account" role is created using the same account (placeholder) and comments instead of configuring concrete cross-account principals or documenting actual account IDs. This does not satisfy the requirement to establish safe cross-account roles across environments.

4. SNS topics are regional, not shared across environments
	- The model creates SNS topics per environment/region instead of creating a shared cross-environment SNS topic for application error notifications as required.

5. Certificates and TLS are placeholders or missing
	- CloudFront has `certificate: undefined` and ALB uses a placeholder ACM ARN. The CDK output and configuration do not provide real ACM certificates or a mechanism to provision/attach them, leaving TLS incomplete.

6. S3 HTTPS-only enforcement is not robust
	- The S3 buckets rely on `enforceSSL` (or similar) but do not add an explicit bucket policy that denies non-HTTPS requests. The provided code may not enforce HTTPS-only access in all accounts/clients.

7. Secrets and IAM policies are overly broad or use wildcard ARNs
	- Several inline policies allow broad or wildcard resources (e.g., logs: resources=['*'] and secretsmanager patterns with wildcards), violating the least-privilege requirement.

8. Terraform-style per-region EC2 counts not implemented
	- The response uses a single `ec2InstanceCountPerRegion` context value applied uniformly, rather than providing per-region variable mappings or a clear per-region override mechanism as requested.

9. Route 53 health check references ALB DNS without ensuring stable target
	- The CfnHealthCheck uses the ALB DNS name directly without addressing timing/propagation or leveraging Route53 health-check targets/origin-target groups; this is fragile for failover scenarios.

10. Shared outputs and cross-stack references may be incorrectly scoped
	- The code uses atypical scoping for some outputs (e.g., constructing outputs with `scope.node.scope as cdk.Stack`) and may not correctly export or reference cross-region/cross-stack ARNs/values as required for multi-region wiring.

11. CloudFront multi-region logging/certificate/behavior incomplete
	- CloudFront logging bucket is created per-distribution with limited configuration and no central logging/retention policy for multi-region distributions; certificate management is not handled.

12. Config rules and Config delivery channel setup incomplete for multi-account/multi-region
	- AWS Config recorder and delivery channel use a local config bucket and role but do not address cross-account or multi-region aggregation required for enterprise compliance or cross-environment rule enforcement.

13. Cross-account assume-role permissions use wildcard ARNs
	- The non-prod role that can assume prod uses a wildcard pattern for the prod role ARN, which is not a least-privilege or reliable pattern for cross-account access.

14. ALB Internet-facing exposure and security group gaps
	- The ALB is internet-facing with an SG that allows 0.0.0.0/0 on port 443; there is no IPv6 consideration, and some security-group ingress/egress relationships are expressed using SecurityGroup objects rather than explicit, least-privilege peers.

15. Documentation and deployment instructions gloss over required runtime setup
	- The deployment instructions include placeholder values and do not describe ACM certificate provisioning, cross-account roles/account IDs, or Route 53 DNS ownership required to make failover and TLS functional in a real environment.

16. Assertions of meeting all requirements are overstated
	- The model claims to fully satisfy all 15 requirements and produce "production-ready" code, but the implementation contains multiple placeholders, missing cross-region wiring, and security/integration gaps that prevent it from being deployable to production as-is.

