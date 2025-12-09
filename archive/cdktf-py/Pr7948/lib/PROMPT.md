# Failure Recovery and High Availability

> **CRITICAL REQUIREMENT: This task MUST be implemented using CDKTF with Python**
> 
> Platform: **cdktf**  
> Language: **py**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

## Background
A financial services company needs to implement a multi-region disaster recovery solution for their critical payment processing system. The system currently runs in us-east-1 and requires near-zero RPO with automated failover capabilities to us-east-2.

## Problem Statement
Create a CDKTF Python program to deploy a multi-region disaster recovery infrastructure. The configuration must: 1. Set up VPCs in us-east-1 and us-east-2 with 3 availability zones each, including private and public subnets. 2. Deploy DynamoDB Global Tables with on-demand billing and point-in-time recovery enabled. 3. Create Lambda functions in both regions that process payment transactions, with identical code and environment variables. 4. Configure API Gateway REST APIs in each region with custom domain names and AWS Certificate Manager certificates. 5. Implement Route 53 hosted zone with health checks and failover routing between primary and secondary API endpoints. 6. Set up AWS Global Accelerator with endpoints in both regions and automatic failover based on health checks. 7. Create S3 buckets with cross-region replication including delete marker replication and RTC for sub-15-minute replication. 8. Deploy Aurora Global Database with PostgreSQL 14 engine, one write cluster in us-east-1 and read replica cluster in us-east-2. 9. Configure EventBridge Global Endpoints to route events between regions with dead letter queues. 10. Implement AWS Backup plans for Aurora clusters with cross-region copy enabled. 11. Set up CloudWatch dashboards in both regions to monitor replication lag and system health. 12. Create SNS topics for alerting on failover events and replication issues. Expected output: A CDKTF program that creates all resources with proper tagging (Environment: production, DR-Region: primary/secondary), outputs the Global Accelerator DNS name, primary and secondary API endpoints, and health check URLs. The solution should handle automatic failover within 60 seconds of primary region failure.

## Environment Setup
Multi-region disaster recovery infrastructure spanning us-east-1 (primary) and us-east-2 (secondary). Utilizes DynamoDB Global Tables for data replication, Lambda for compute, API Gateway for endpoints, Route 53 for DNS failover, Global Accelerator for traffic routing, S3 with cross-region replication, Aurora Global Database for relational data, EventBridge for event processing, and Systems Manager for configuration management. Requires Pulumi 3.x with Python 3.9+, AWS CLI configured with appropriate permissions. VPCs in both regions with private subnets for compute resources and public subnets for load balancers. Direct Connect or VPN connectivity between regions for secure replication.

---

## Implementation Guidelines

### Platform Requirements
- Use CDKTF as the IaC framework
- All code must be written in Python
- Follow CDKTF best practices for resource organization
- Ensure all resources use the `environmentSuffix` variable for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Deployment Requirements (CRITICAL)

### Resource Naming
- **MANDATORY**: All named resources MUST include `environmentSuffix` in their names
- Pattern: `{resource-name}-${environmentSuffix}`
- Examples:
  - S3 Bucket: `my-bucket-${environmentSuffix}`
  - Lambda Function: `my-function-${environmentSuffix}`
  - DynamoDB Table: `my-table-${environmentSuffix}`
- **Validation**: Every resource with a `name`, `bucketName`, `functionName`, `tableName`, `roleName`, `queueName`, `topicName`, `streamName`, `clusterName`, or `dbInstanceIdentifier` property MUST include environmentSuffix

### Resource Lifecycle
- **MANDATORY**: All resources MUST be destroyable after testing
- **FORBIDDEN**: 
  - `RemovalPolicy.RETAIN` (CDK/CDKTF) → Use `RemovalPolicy.DESTROY` instead
  - `DeletionPolicy: Retain` (CloudFormation) → Remove or use `Delete`
  - `deletionProtection: true` (RDS, DynamoDB) → Use `deletionProtection: false`
  - `skip_final_snapshot: false` (RDS) → Use `skip_final_snapshot: true`
- **Rationale**: CI/CD needs to clean up resources after testing

### AWS Service-Specific Requirements

#### GuardDuty
- **CRITICAL**: Do NOT create GuardDuty detectors in code
- GuardDuty allows only ONE detector per AWS account/region
- If task requires GuardDuty, add comment: "GuardDuty should be enabled manually at account level"

#### AWS Config
- **CRITICAL**: If creating AWS Config roles, use correct managed policy:
  - CORRECT: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/service-role/ConfigRole`
  - WRONG: `arn:aws:iam::aws:policy/AWS_ConfigRole`
- **Alternative**: Use service-linked role `AWSServiceRoleForConfig` (auto-created)

#### Lambda Functions
- **Python Runtime**: Use Python 3.9+ as specified
- **Reserved Concurrency**: Avoid setting `reservedConcurrentExecutions` unless required
  - If required, use low values (1-5) to avoid account limit issues

#### RDS/Aurora Databases
- **CRITICAL**: For Aurora Global Database:
  - Use PostgreSQL 14 engine as specified
  - Enable deletion protection: false (for CI/CD cleanup)
  - Set `skip_final_snapshot: true`
  - Configure cross-region replication properly
- **Note**: Aurora Global Database provisioning takes 20-30 minutes

#### NAT Gateways
- **Cost Warning**: NAT Gateways cost ~$32/month each
- **For this task**: Create NAT Gateways as required for private subnet connectivity
- **Alternative**: Use VPC Endpoints where possible for S3, DynamoDB (free)

#### Route 53
- **Health Checks**: Configure proper health check intervals and thresholds
- **Failover Routing**: Set up PRIMARY and SECONDARY record sets correctly
- **DNS TTL**: Use appropriate TTL values (60 seconds or less for fast failover)

#### Global Accelerator
- **Endpoint Configuration**: Add both regional endpoints
- **Health Check**: Configure automatic failover based on endpoint health
- **Output**: Provide the Global Accelerator DNS name for testing

### Multi-Region Requirements (CRITICAL)

This task requires deploying infrastructure in TWO regions:
- **Primary Region**: us-east-1
- **Secondary Region**: us-east-2

Each region must have:
1. VPC with 3 availability zones (private and public subnets)
2. Lambda functions with identical code and configuration
3. API Gateway with custom domain names
4. DynamoDB Global Table replicas
5. S3 buckets with cross-region replication
6. Aurora cluster (write in us-east-1, read replica in us-east-2)

### Cross-Region Replication Requirements

1. **S3 Replication**:
   - Enable versioning on both source and destination buckets
   - Configure Replication Time Control (RTC) for sub-15-minute replication
   - Enable delete marker replication
   - Create IAM role for replication

2. **DynamoDB Global Tables**:
   - Use on-demand billing mode
   - Enable point-in-time recovery
   - Configure both regions as replicas

3. **Aurora Global Database**:
   - Primary cluster in us-east-1 (read-write)
   - Secondary cluster in us-east-2 (read-only)
   - Enable automated backups
   - Configure backup retention period

4. **EventBridge Global Endpoints**:
   - Configure event routing between regions
   - Set up dead letter queues for failed events

### Failover Requirements

The solution must achieve automatic failover within 60 seconds:

1. **Route 53 Health Checks**:
   - Monitor API Gateway endpoints in both regions
   - Configure failover routing policy
   - Set health check interval to 30 seconds

2. **Global Accelerator**:
   - Configure health checks for both regional endpoints
   - Set appropriate traffic dial percentage
   - Enable automatic failover

3. **Monitoring**:
   - CloudWatch dashboards in both regions
   - Monitor replication lag
   - SNS topics for failover alerts

### Hardcoded Values (FORBIDDEN)
- **DO NOT** hardcode:
  - Environment names: `prod-`, `dev-`, `stage-`, `production`, `development`, `staging`
  - Account IDs: `123456789012`
  - Explicit region names in resource names (use variables)
- **USE**: Environment variables, context values, or parameters instead

### Resource Tagging (MANDATORY)

All resources must be tagged with:
- `Environment: production`
- `DR-Region: primary` (for us-east-1 resources)
- `DR-Region: secondary` (for us-east-2 resources)
- `EnvironmentSuffix: ${environmentSuffix}`

## Expected Outputs

The CDKTF program must output:
1. Global Accelerator DNS name
2. Primary API endpoint (us-east-1)
3. Secondary API endpoint (us-east-2)
4. Health check URLs for both regions
5. DynamoDB Global Table name
6. Aurora cluster endpoints (primary and secondary)
7. S3 bucket names (both regions)

## Success Criteria

1. Infrastructure deploys successfully in both regions
2. All security and compliance constraints are met
3. Cross-region replication is working for all services
4. Failover completes within 60 seconds of primary region failure
5. Tests pass successfully
6. Resources are properly tagged
7. Infrastructure can be cleanly destroyed

## Target Regions
- **Primary**: us-east-1
- **Secondary**: us-east-2
