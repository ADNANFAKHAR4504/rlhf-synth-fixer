# Infrastructure as Code Task: Failure Recovery Automation

## Platform and Language
**MANDATORY**: Use **Pulumi with TypeScript**

## Task Description

Create a Pulumi TypeScript program to deploy a highly available payment processing infrastructure with automatic failure recovery. The configuration must:

1. Set up a VPC with 3 public and 3 private subnets across different availability zones.
2. Deploy an Application Load Balancer in public subnets with cross-zone load balancing enabled.
3. Create an Auto Scaling Group that launches t3.medium instances in private subnets with automated scaling policies.
4. Configure an RDS Aurora PostgreSQL cluster with one writer and two read replicas, each in different AZs.
5. Implement Route 53 health checks with automatic DNS failover to a static S3 maintenance page.
6. Set up CloudWatch alarms for ALB target health, Auto Scaling events, and RDS performance metrics.
7. Create an SNS topic that receives all alarm notifications and sends emails to ops@company.com.
8. Configure Auto Scaling lifecycle hooks to drain connections before instance termination.
9. Implement EC2 instance recovery for hardware failures with StatusCheckFailed_System alarm.
10. Enable RDS automated backups with encrypted snapshots and cross-region replication to us-east-2.
11. Add CloudWatch Logs for ALB access logs and EC2 application logs with 30-day retention.

Expected output: A Pulumi program that creates resilient infrastructure capable of handling component failures, traffic spikes, and regional outages while maintaining 99.95% uptime SLA.

## Scenario

A fintech startup needs to ensure their payment processing API remains available during traffic spikes and infrastructure failures. They've experienced downtime during Black Friday sales and need a resilient architecture that automatically handles failures and scales based on demand.

## Setup Description

High-availability infrastructure deployed across us-east-1a, us-east-1b, and us-east-1c availability zones. Architecture includes Application Load Balancer, Auto Scaling Group with EC2 instances, RDS Aurora PostgreSQL cluster with read replicas, Route 53 for DNS failover, CloudWatch for monitoring, and SNS for alerting. Requires Pulumi CLI 3.x with TypeScript, Node.js 18+, and AWS credentials configured. VPC spans three AZs with public subnets for ALB and private subnets for compute and database tiers. NAT Gateways provide outbound internet access for private instances.

## Technical Requirements

- Application Load Balancer must perform health checks every 15 seconds with a 2-check failure threshold
- Auto Scaling Group must maintain minimum 3 instances across 3 availability zones
- RDS Aurora cluster must have automated backups with 7-day retention and point-in-time recovery enabled
- All EC2 instances must use Amazon Linux 2023 AMI with SSM agent pre-installed
- Target group deregistration delay must be set to 30 seconds for graceful shutdown
- Auto Scaling must trigger at 70% CPU utilization with 5-minute cooldown periods
- Database read replicas must be in different AZs than the primary instance
- CloudWatch alarms must send notifications to SNS topic for all failure scenarios
- Route 53 health checks must monitor the ALB endpoint with 10-second intervals

## AWS Services Required

- VPC (Virtual Private Cloud)
- EC2 (Elastic Compute Cloud)
- Application Load Balancer (ALB)
- Auto Scaling Group
- RDS Aurora PostgreSQL
- Route 53
- S3 (for maintenance page)
- CloudWatch (Alarms, Logs, Metrics)
- SNS (Simple Notification Service)
- KMS (for encryption)

## Compliance and Best Practices

- All resources must include environment suffix for uniqueness
- Enable encryption at rest for RDS using KMS
- Enable encryption for S3 buckets
- Implement least-privilege IAM roles
- Enable CloudWatch monitoring for all resources
- Tag all resources appropriately
- Follow AWS Well-Architected Framework principles
- Ensure infrastructure is destroyable (no retention policies for synthetic tasks)