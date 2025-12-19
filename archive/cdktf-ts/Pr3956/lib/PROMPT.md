Goal: Design and implement a cross-region disaster recovery architecture for a mission-critical financial trading platform using AWS CDK v2 (TypeScript). The application must remain operational during a complete regional outage, meeting an RTO of 15 minutes and an RPO of 5 minutes.

Inputs

setup_requirements: ['AWS CDK v2.x', 'TypeScript 4.x+', 'Node.js 14.x+', 'AWS Account with administrative access', 'Two AWS regions configured: primary (us-west-2) and secondary (us-east-1)']

initial_architecture: ['ECS Fargate clusters', 'Aurora PostgreSQL database', 'Application Load Balancers', 'S3 buckets', 'Route 53 health checks']

required_configuration:

app.ts: Main CDK application entry point

lib/: Stack definitions for both regions

config/: Environmental configuration for both regions

Architecture Requirements

Primary Region (us-west-2)

ECS Fargate cluster running containerized microservices behind an Application Load Balancer.

Aurora PostgreSQL cluster with cross-region read replica in secondary.

S3 bucket with Cross-Region Replication to secondary.

Secondary Region (us-east-1)

Standby ECS Fargate cluster + ALB, ready to be promoted during failover.

Aurora cross-region replica that can be promoted to primary.

Replicated S3 bucket.

Failover & Health Monitoring

Route 53 health checks on primary ALB endpoints.

DNS failover policies to automatically redirect traffic to secondary within 15 minutes.

CloudWatch alarms integrated with health checks for observability.

Data Protection & Compliance

KMS keys specific to each region for encrypting Aurora, S3, and ECS secrets.

All replication traffic encrypted in transit (TLS).

Encryption at rest enabled on all storage.

RPO/RTO Objectives

Aurora cross-region replication for RPO < 5 minutes.

Automated DNS failover for RTO ≤ 15 minutes.

Tagging

All resources tagged with:

Environment=production

App=trading-platform

ManagedBy=CDK

CostCenter=FinanceOps

Deliverables

Complete CDK v2 TypeScript project with:

app.ts for orchestration

lib/ directory with primary + secondary stacks

config/ for environment/region configs

Encrypted, compliant, automated failover setup

Output: Return the full CDK TypeScript application code (multi-file project) implementing this architecture with strong typing, resource encryption, cross-region replication, health checks, and automated failover.