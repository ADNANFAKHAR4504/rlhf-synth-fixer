ROLE: You are a senior cloud infrastructure engineer specializing in disaster recovery architecture.

CONTEXT:
I'm working with a large financial services company that processes roughly $5 billion in daily transactions. We need to build out a comprehensive disaster recovery solution that can handle regional failures. The business requires an RTO of 5 minutes and RPO of 1 minute - these are pretty strict requirements because any downtime or data loss directly impacts revenue and customer trust.

The current setup is running in us-east-1 and we need DR capability in us-west-2. The system needs to automatically detect failures and failover without manual intervention. We also have to maintain PCI-DSS compliance across both regions and run quarterly DR tests to prove everything works.

REQUIREMENTS:
- Use Terraform HCL to define all infrastructure
- Primary database: Aurora Global Database with cross-region replication
- Session/state data: DynamoDB Global Tables for automatic multi-region replication
- Storage: S3 with cross-region replication for transaction logs and compliance docs
- Load balancing: Application Load Balancers in both regions with proper health checks
- DNS: Route 53 with health-based failover routing
- Automation: Lambda functions to handle failover orchestration and DR procedures
- Monitoring: CloudWatch alarms that trigger failover when thresholds are breached
- Orchestration: EventBridge rules to coordinate the failover sequence
- Testing: Systems Manager automation documents for DR testing without impacting production
- Compliance: Security Hub to ensure PCI-DSS controls are met in both regions

CONSTRAINTS:
- RTO cannot exceed 5 minutes from failure detection to full service restoration
- RPO must be 1 minute or less (minimal data loss)
- All failover must be automated - no manual DNS changes or database promotions
- DR testing should be non-disruptive to production workloads
- All resources must be tagged appropriately for compliance auditing
- Secrets and sensitive data must use AWS Secrets Manager (no hardcoded values)
- Cost-optimize standby region where possible but don't compromise recovery objectives

DELIVERABLES:
1) tap_stack.tf - core infrastructure including networking, Aurora, DynamoDB, S3, ALB and all resources and outputs in single file
2) variables.tf - parameterized configuration for both regions
3) provider.tf - important endpoints, ARNs, and connection strings


OUTPUT FORMAT:
Please provide each file in a separate code block with the filename clearly marked at the top. Use actual Terraform HCL syntax, not pseudocode. Include comments explaining the key configuration decisions, especially around the RTO/RPO requirements.