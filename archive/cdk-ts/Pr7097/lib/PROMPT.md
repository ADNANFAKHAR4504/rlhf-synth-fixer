As an expert AWS CDK engineer. Ship production-ready TypeScript (CDK v2) that synthesizes clean CloudFormation and follows every requirement below. Keep all details intact while you rewrite the infrastructure in code. When a resource needs uniqueness, append a string suffix using the convention `[environment]-[region]-[service][Suffix]`.

What you’re building:
- A single deployable CDK app (one stack or a small set of stacks) that provisions a multi-environment, multi-region AWS footprint in TypeScript.
- Configurable environments and regions, with any region called out as the primary example (others like any region may also appear). Make each region choice explicit and adjustable.

Requirements:
1. Create a distinct VPC per AWS region with non-overlapping CIDR ranges.
2. Provide Lambda functions in every environment that respond to S3 events.
3. Stand up encrypted PostgreSQL RDS instances in each region.
4. Allow inbound traffic to load balancers solely on port 443 via Security Groups.
5. Manage DNS with Route 53 and enable failover across environments.
6. Establish cross-account IAM roles so environments can access one another safely.
7. Simulate Terraform-style variables (via CDK parameters or context) to set EC2 counts per region, defaulting to 3.
8. Configure per-environment CloudWatch alarms that monitor EC2 CPU utilization.
9. Ensure every S3 bucket is versioned and enforces HTTPS-only access.
10. Add a CloudFront distribution that routes requests to the nearest region.
11. Store and reference database credentials in AWS Secrets Manager.
12. Create shared SNS topics for application error notifications across environments.
13. Use AWS Config rules to enforce tagging and encryption compliance.
14. Apply auto-scaling policies to ALBs that react to live traffic signals.
15. Keep Auto Scaling Groups at a minimum of two instances in every environment.

Implementation guardrails:
- Follow least-privilege IAM practices for Lambda, EC2, RDS, and supporting services.
- Wire up S3→Lambda triggers, CloudFront origins, Route 53 failover records, and similar integrations so they actually function.
- Enable CloudWatch logging and metrics for key components, and add a Lambda error alarm alongside the other monitoring.
- Keep the CDK code modular, readable, and fully compatible with CDK v2.
- Surface Stack outputs for critical endpoints and ARNs (CloudFront domain, SNS topics, Secrets Manager, RDS endpoints, API endpoints, etc.).
- Use CDK parameters or context to expose environment names, regions, suffix values, and EC2 counts; document in code comments where to adjust them.

Deliverables
- TypeScript sources that you can deploy with `cdk deploy` and that satisfy every item above.
- Consistent resource naming that respects the `[environment]-[region]-[service][Suffix]` pattern wherever uniqueness is required.
- Secure defaults across the board: block public S3 access, encrypt everything at rest, avoid hardcoded secrets, and provide environment-specific tagging (e.g., `Environment: Prod` or similar).
