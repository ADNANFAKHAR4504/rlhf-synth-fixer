Failure Handling & Recovery Requirements:

Multi-AZ Architecture:

Deploy all critical components (EC2, Load Balancer, RDS) across at least two Availability Zones to prevent single points of failure.

Auto Scaling & Self-Healing:

Configure Auto Scaling Groups to detect and replace unhealthy EC2 instances automatically.

Use health checks (EC2 and ELB-based) to identify and recover from instance failure.

Elastic IP for Predictable Failover:

Allocate a static Elastic IP (EIP) to the primary Elastic Load Balancer (NLB preferred for static IP support).

Ensure the EIP can be re-associated quickly in case of failover.

RDS High Availability:

Deploy an Amazon RDS instance in Multi-AZ mode with synchronous replication.

Enable automatic failover to a standby database instance in another AZ.

CloudWatch Monitoring & Alarms:

Enable detailed CloudWatch monitoring for EC2, ELB, and RDS.

Create CloudWatch Alarms to detect system failures (e.g., unhealthy hosts, CPU overload).

Integrate with SNS topics to send notifications on failure events.

IAM Roles – Least Privilege:

Create IAM roles for EC2 and other services using least privilege principles.

Grant only the minimal required permissions to interact with services (e.g., CloudWatch, S3, RDS, SNS).

Rapid Recovery Within 5 Minutes:

Design the system to detect and self-heal from failures automatically.

Ensure EC2 replacement, DB failover, and load balancer routing updates happen within 5 minutes of failure detection.