I need to create a multi-region disaster recovery setup for an Aurora PostgreSQL cluster using AWS CDK (TypeScript).
The goal is to build a fully automated architecture that ensures minimal downtime and data loss (RPO < 1 minute, RTO < 5 minutes) when a regional failure occurs.

Here’s what the system must do:

- Aurora Global Database Setup – Deploy an Aurora Global Database for PostgreSQL 13.x with:
- Primary cluster in us-east-1
- Secondary (read-only) cluster in us-west-2
- Use encrypted connections (TLS 1.2 or higher) and ensure all database traffic stays inside private subnets.

Backups and Recovery –
Enable automated backups with 7-day retention and point-in-time recovery.
The backup configuration should be consistent across both regions.

Health Monitoring and Failover Routing –
Set up Route53 health checks to monitor the primary Aurora endpoint’s availability and replication lag.
Health checks should use Lambda functions inside the VPC since Aurora endpoints are private.
Configure Route53 failover routing policies to switch to the DR region when the primary is unhealthy.

Automated Failover Orchestration –
Create Lambda functions that perform controlled failover when a CloudWatch composite alarm detects a primary failure.
These Lambdas must:

Validate primary cluster unavailability
Promote the secondary cluster
Update Route53 to point to the new writer endpoint
Notify via SNS and PagerDuty
Complete execution within 5 minutes

Alerts and Notifications –
Configure SNS topics for:
Failover events
Replication lag > 5 seconds
Backup or promotion failures
Integrate with PagerDuty for on-call alerts.

Auto Scaling and Sizing –
Use db.r6g.xlarge or larger instances for production.
Enable Aurora Auto Scaling with min = 2 and max = 4 instances per cluster (primary and secondary).
Ensure autoscaling policies respond to CPU, connections, and replica lag.

Secure Networking –
Deploy VPCs in both regions, each with private subnets across 3 Availability Zones.
Establish cross-region VPC peering for monitoring and replication-related traffic.
No internet exposure for any database or Lambda.

Monitoring & Dashboards –
Build CloudWatch dashboards that show:
Replication lag
Failover status
Cluster CPU/memory/IOPS
Backup success/failure
These should use cross-region metrics.

Connection Management –
Implement Lambda-based connection pooling or use RDS Proxy to ensure clients reconnect automatically after failover.
Connection manager must detect the new primary endpoint and refresh connections.

Automated DR Testing –
Schedule automated failover drills every 30 days using EventBridge or Step Functions.
The test should simulate a failover event, measure time to recover, and automatically restore the original topology afterward.

Constraints & Rules

Aurora instances must use db.r6g.xlarge or larger.
All data traffic must remain inside private subnets (no public access).
All connections must use TLS 1.2+ encryption.
CloudWatch alarms must be composite, combining multiple failure signals.
Route53 health checks must evaluate both endpoint connectivity and replication lag.
SNS notifications must integrate with PagerDuty.

Every resource must include tags:
CostCenter
Environment
DR-Role

Expected Output

A complete CDK solution written in TypeScript (CDK v2) that:
Creates the Aurora global database across both regions
Implements secure, encrypted replication
Automates detection, promotion, and DNS failover
Configures monitoring, alerts, and dashboards
Runs entirely inside private networking
Can be tested automatically every 30 days
The system should maintain RPO < 1 minute and RTO < 5 minutes during simulated or real failovers.
