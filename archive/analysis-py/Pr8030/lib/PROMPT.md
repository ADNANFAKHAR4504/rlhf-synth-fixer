I need a Python script using Boto3 to conduct a comprehensive Load Balancer audit, calculating a quantifiable Load Balancer Health Score for every asset.

The script must analyze configurations and 7-day CloudWatch metrics against the following 18 critical failure points.

Security & Compliance (CRITICAL):

Weak TLS Policy: Flag ALBs using deprecated TLS policies (allowing TLS 1.0/1.1 or weak ciphers).

No Encryption Enforcement: Identify ALBs with HTTP listeners (port 80) that are not configured to redirect traffic to HTTPS.

Missing WAF: Flag all Internet-facing ALBs that do not have an AWS WAF Web ACL attached.

SSL Expiration Risk: Check ACM certificates and flag any associated with an ALB that will expire in less than 30 days.

No Deletion Protection: Flag all production load balancers (tagged Environment: production) that do not have deletion protection enabled.

Security Group Mislink: Audit ALB security groups to ensure they are properly referencing their target security groups, preventing overly broad ingress access.

Performance & Resilience:

Unhealthy Targets: Identify LBs with consistently unhealthy targets (> 20% unhealthy) over the last 7 days (via CloudWatch metrics).

High 5XX Rate: Flag LBs with a 5XX error rate exceeding 1% over the last 7 days, indicating severe application issues.

Inefficient Health Checks: Flag health checks with intervals > 30 seconds or timeouts > 10 seconds, delaying failure detection.

Single AZ Risk: Flag LBs configured with subnets in only one Availability Zone, lacking high availability.

NLB Skew: Flag Network Load Balancers (NLBs) that have cross-zone load balancing disabled, causing uneven traffic distribution and hot spots.

Stateful Session Issues: Flag ALBs serving stateful applications that do not have session stickiness (cookie-based) enabled.

Cost, Observability, and Maintenance:

Idle Assets (FINOPS): Flag load balancers that have recorded zero requests in the last 30 days.

Unused Target Groups: Find target groups with zero registered targets or zero healthy targets for more than 30 days.

Missing Observability: Flag LBs without Access Logging enabled to S3 for troubleshooting.

No Monitoring Alarms: Flag LBs without CloudWatch alarms configured for target response time, 5XX errors, or unhealthy host count.

Maintenance Rules: Identify listener rules returning fixed responses (e.g., maintenance pages) that have been active for more than 7 days, suggesting forgotten rules.

Inefficient Target Type: Flag target groups using EC2 instances where the workload is appropriate for cheaper serverless targets (Lambda or Fargate).

Filters and Deliverables
The script must ignore resources tagged ExcludeFromAnalysis: true and any resource prefixed with test- or dev-. It must only analyze LBs older than 14 days.

For the final report, I need four deliverables:

Console Output: A summary table showing the Load Balancer Health Score and prioritization of security issues with the detailed AWS resource details.

load_balancer_analysis.json: A detailed JSON report listing all findings, certificate expiry dates, and a summary of unused assets.

cost_optimization_plan.csv: A prioritized action plan identifying idle and underutilized load balancers with estimated monthly savings.

The script must be testable and work reliably across different AWS environments. I need a separate test file that creates at least 40 ALBs/NLBs with various configurations, including scenarios showing high 5XX errors and unhealthy targets, to prove the audit logic is accurate.

Please provide the final Python code in separate, labeled code blocks for `lib/analyse.py`.
