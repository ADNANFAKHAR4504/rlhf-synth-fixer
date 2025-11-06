We’re designing a multi-region disaster recovery (DR) environment on AWS using Terraform — something robust enough for a financial services company that cannot afford data loss or prolonged downtime during high-traffic trading hours.

The primary region (us-east-1) has been unreliable during peak loads, so the goal is to create a fully automated failover to us-west-2 with synchronized replication across all critical layers — database, storage, networking, and DNS.

Everything here should follow production-grade infrastructure principles, focus on high availability, data durability, and network isolation, and adhere to AWS best practices.
Terraform version must be 1.5+, AWS provider 5.0+.

Infrastructure and Networking Architecture

Each region will have a dedicated VPC, purpose-built from scratch with non-overlapping CIDR blocks to maintain isolation and clear routing boundaries.
No shared components, no hidden dependencies.

Primary Region (us-east-1)

VPC CIDR: 10.0.0.0/16

Two Public Subnets: 10.0.1.0/24, 10.0.2.0/24

Two Private Subnets: 10.0.3.0/24, 10.0.4.0/24

One Internet Gateway for public internet access.

One NAT Gateway in a public subnet for controlled egress from private workloads.

Separate route tables for public and private networks.

Tagging standard applied: Environment, DisasterRecovery.

Secondary Region (us-west-2)

VPC CIDR: 10.1.0.0/16

Identical subnet and routing structure to mirror primary.

Separate IGW and NAT Gateway.

Used primarily for replication, standby services, and DR testing.

We’ll establish a VPC Peering Connection between the two regions to allow private, low-latency communication for database replication and control plane operations.
Routing tables must be updated on both sides to ensure private CIDR visibility between regions.

All resources, regardless of region, will include a -dbha suffix for consistent naming and traceability across environments.

Database Layer (RDS for PostgreSQL)

The backbone of the application data layer will be Amazon RDS for PostgreSQL, version 17.4, using the default parameter group.

The primary RDS instance will reside in us-east-1, deployed in Multi-AZ mode to ensure local availability.
We’ll enable automated cross-region backups with a 7-day retention policy.
In us-west-2, a read replica will be deployed, continuously synchronized via cross-region replication.
This read replica must be promotable to standalone within minutes during failover.

The RDS master password should be randomly generated (16 alphanumeric characters), managed securely via AWS Secrets Manager, and never hardcoded in Terraform variables.

Security groups for RDS instances must allow:

Replication traffic from the secondary region.

Inbound connections only from the ALB and bastion hosts (if any) within the same VPC.

No public accessibility at any point.

CloudWatch alarms will monitor RDS health, replica lag, and failover status.
Metrics and alarms should trigger SNS notifications or automation via Lambda for orchestration if required.

Object Storage and Replication (S3)

We’ll use two S3 buckets, one per region, configured with bidirectional replication.
Replication will use cross-region replication (CRR) with versioning enabled on both ends.
IAM roles for replication must have the minimum required permissions (replication and object access only).

Each bucket will have:

Public access fully blocked.

Server-side encryption (SSE-S3 or SSE-KMS).

Lifecycle rules for data retention and cost optimization.

The idea is that regardless of which region is active, both S3 buckets remain consistent and serve as mirrored datasets.

Compute and Load Balancing

Each region hosts its own Application Load Balancer (ALB) serving EC2 instances or containers running the data processing application.
The ALBs will be tied to target groups within their respective VPCs.

Primary ALB (us-east-1) serves traffic under normal conditions.
Secondary ALB (us-west-2) remains in standby, health-monitored, and ready to receive traffic during failover.

Security groups for ALBs should only allow inbound access on required ports (e.g., 80/443), with target groups restricted to application subnets.

DNS and Failover Routing (Route 53)

We’ll manage the DNS layer via Amazon Route 53, using the domain rdsha.com.
Failover routing will be implemented using Route 53 Health Checks against the primary region’s ALB endpoint.

Key configurations:

Health check interval: 30 seconds

Failover type: Primary–Secondary

DNS TTL tuned for quick propagation (< 60 seconds)

When the primary health check fails, Route 53 automatically routes traffic to the secondary region’s ALB endpoint.
This mechanism must ensure RTO < 5 minutes from the moment of primary failure.

Monitoring, Alerts, and Observability

Amazon CloudWatch will be the central observability layer:

RDS metrics: replication lag, availability, storage usage, connections.

ALB metrics: healthy targets, request count, error rates.

Regional dashboards for real-time visibility.

CloudWatch Alarms must feed into an SNS topic for notifications and optionally invoke a Lambda function to orchestrate custom failover actions if needed.

Security and Compliance

All resources must follow AWS security best practices:

IAM roles scoped to least privilege.

S3 and RDS encryption enabled by default.

No hardcoded credentials or sensitive data in Terraform code.

VPC Flow Logs enabled for both regions for auditability.

KMS used where applicable for encryption at rest.

All infrastructure tagging must remain consistent:

Environment = "Production"
DisasterRecovery = "Enabled"

Outcome and Expectations

The final Terraform configuration should deploy a self-sufficient, automated DR infrastructure capable of sustaining complete regional failure with minimal human intervention.

Failover between us-east-1 and us-west-2 should complete within 5 minutes.
Data replication between RDS and S3 must remain continuous and verifiable.
All network, database, and application layers should reflect architectural symmetry, maintaining operational parity between regions.

