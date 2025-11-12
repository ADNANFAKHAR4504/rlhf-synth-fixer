# Failure Recovery and High Availability

> ** CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with py**
> 
> Platform: **pulumi**  
> Language: **py**  
> Region: **eu-central-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi Python program to deploy a multi-region disaster recovery infrastructure for a trading platform. The configuration must: 1. Set up Route 53 hosted zone with health checks monitoring primary region endpoints every 30 seconds. 2. Create Aurora PostgreSQL global database cluster with a primary cluster in eu-central-1 and secondary in eu-central-2. 3. Deploy identical Lambda functions in both regions that process trading orders from SQS queues. 4. Configure DynamoDB global tables for user session storage with on-demand billing and point-in-time recovery. 5. Establish S3 buckets in both regions with cross-region replication rules for static content and trading reports. 6. Set up API Gateway REST APIs in both regions with Lambda proxy integrations and custom domain names. 7. Create CloudWatch composite alarms that monitor Aurora writer availability, Lambda error rates, and API Gateway 5xx errors. 8. Deploy Lambda-based failover orchestrator that promotes Aurora read replica and updates Route 53 records upon alarm trigger. 9. Configure SNS topics in both regions for alerting DevOps team during failover events. 10. Implement CloudWatch Synthetics canaries that continuously test critical API endpoints in both regions. Expected output: A Pulumi stack that provisions complete multi-region infrastructure with automated failover capabilities. The solution should achieve RTO of under 5 minutes and RPO of under 1 minute for database transactions.

---

## Additional Context

### Background
A fintech company operates a critical trading platform that processes millions of transactions daily. After experiencing a regional AWS outage that resulted in 4 hours of downtime and significant revenue loss, they need to implement a robust multi-region disaster recovery solution that can automatically failover within minutes.

### Constraints and Requirements
- [Configure SNS cross-region subscriptions for failover notifications, Set up S3 cross-region replication with RTC (Replication Time Control) for objects under 128 MB, Implement API Gateway custom domain names with regional endpoints in both regions, Configure DynamoDB global tables with point-in-time recovery enabled, Use Route 53 health checks with failover routing policies for automatic DNS failover, Use Systems Manager Parameter Store with cross-region replication for configuration data, Deploy Lambda functions in both regions using identical deployment packages, Implement CloudWatch Synthetics canaries in both regions for continuous availability monitoring, Use CloudWatch cross-region composite alarms to trigger failover automation, Implement cross-region RDS Aurora Global Database with automated promotion capabilities]

### Environment Setup
Multi-region disaster recovery infrastructure spanning eu-central-1 (primary) and eu-central-2 (DR). Utilizes Route 53 for DNS failover, Aurora Global Database for data persistence, Lambda and API Gateway for compute, DynamoDB global tables for session data, S3 with cross-region replication for static assets. Requires Pulumi 3.x with Python 3.9+, boto3, and AWS CLI configured with cross-region permissions. Each region has its own VPC with 3 availability zones, private subnets for databases, and public subnets for load balancers. Automated failover orchestration through CloudWatch Events and Lambda.

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration  
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **eu-central-1**
