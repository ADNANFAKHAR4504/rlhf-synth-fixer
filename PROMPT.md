# Infrastructure as Code Task

## Task ID: b8i0b2

## Platform & Language
- **Platform:** Pulumi
- **Language:** TypeScript
- **Difficulty:** expert

## Category
**Failure Recovery and High Availability** - Failure Recovery Automation

## Problem Statement
Create a Pulumi TypeScript program to implement a multi-region disaster recovery solution for a trading platform. The configuration must: 1. Deploy primary infrastructure in us-east-1 with Aurora PostgreSQL cluster, ALB, and Auto Scaling Group. 2. Set up standby infrastructure in us-east-2 with Aurora read replica and minimal compute resources. 3. Configure Route53 health checks that validate API endpoints return valid trading data. 4. Implement automated DNS failover using Route53 with primary/secondary routing policies. 5. Create Lambda functions to monitor database replication lag every 30 seconds. 6. Set up CloudWatch alarms for replication lag, failed health checks, and regional outages. 7. Configure SNS topics in both regions for incident notifications to ops team. 8. Implement S3 bucket replication for application artifacts and configuration files. 9. Create Auto Scaling policies that rapidly scale standby region when failover occurs. 10. Deploy CloudWatch dashboards showing real-time failover readiness metrics. Expected output: A complete Pulumi TypeScript program that deploys all infrastructure with exported values for primary and secondary endpoints, health check URLs, and failover status dashboard URL. The solution should demonstrate automatic failover when primary region health checks fail.

## Background/Story
A financial services company operates a critical trading platform that must maintain 99.99% uptime. After experiencing a regional outage that cost $2M in lost trades, they need to implement a multi-region disaster recovery solution with automated failover capabilities.

## Infrastructure Requirements
Multi-region disaster recovery infrastructure spanning us-east-1 (primary) and us-east-2 (standby). Utilizes Route53 for DNS failover, RDS Aurora Global Database for data replication, S3 cross-region replication for static assets, Lambda functions for health monitoring, CloudWatch for metrics and alarms, SNS for alerting, and Auto Scaling Groups with launch templates. Requires Pulumi CLI 3.x with TypeScript, Node.js 18+, AWS CLI configured with appropriate IAM permissions. VPCs in both regions with private subnets across 3 AZs, VPC peering for cross-region communication, and NAT Gateways for outbound traffic.

## Constraints
["Failover must be automated without manual intervention", "RPO (Recovery Point Objective) must be under 1 minute", "Cost optimization: standby region should use minimal resources until activated", "All sensitive data must be encrypted in transit and at rest using AWS KMS", "Database replication lag must be monitored and alerted if exceeding 30 seconds", "RTO (Recovery Time Objective) must be under 5 minutes", "Health checks must validate application functionality, not just infrastructure availability"]

## Deliverables
- Complete IaC program that deploys the described infrastructure
- All resources properly configured and connected
- Exported values for endpoints and important resource identifiers
- Code that follows best practices for Pulumi with TypeScript
