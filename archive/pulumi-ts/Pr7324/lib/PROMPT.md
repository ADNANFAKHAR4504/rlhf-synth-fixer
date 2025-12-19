# Multi-Region Disaster Recovery Infrastructure

Create a production-ready multi-region disaster recovery (DR) infrastructure using Pulumi TypeScript that demonstrates high availability, data replication, and failover capabilities across AWS regions.

## Requirements

### Primary Region: us-east-1 | Secondary Region: us-west-2

### 1. Network Infrastructure (Both Regions)
- VPC with 3 public and 3 private subnets across 3 availability zones
- Internet Gateway for public subnets
- NAT Gateway in each public subnet for private subnet internet access
- Appropriate route tables and security groups
- VPC peering between regions for cross-region communication

### 2. Database Layer (Both Regions)
- **Aurora Serverless v2 PostgreSQL clusters** - one REGIONAL cluster per region
  - Primary cluster in us-east-1 with automatic backups
  - Secondary cluster in us-west-2
  - Use backup/restore strategy for DR (NOT Aurora Global Database)
  - Configure continuous backups and point-in-time recovery
  - Min capacity: 0.5 ACU, Max capacity: 1 ACU
- **DynamoDB Global Table**
  - Automatically replicated across both regions
  - Provisioned capacity: 5 RCU/WCU in each region
  - Point-in-time recovery enabled
  - Stream enabled for change data capture

### 3. Compute Layer (Both Regions)
- **Lambda Functions**
  - Data processing function in each region
  - Connected to VPC for Aurora access
  - Environment variables for database endpoints
  - 512 MB memory, 30 second timeout
  - IAM role with appropriate permissions

### 4. Event Processing (Both Regions)
- **EventBridge Rules**
  - Scheduled rule (rate: 5 minutes) to trigger Lambda
  - Cross-region event bus for event replication
  - Dead letter queue for failed events

### 5. Routing and Failover
- **Route 53**
  - Hosted zone for the application
  - Health checks for both regions
  - Failover routing policy (primary: us-east-1, secondary: us-west-2)
  - DNS records pointing to regional endpoints

### 6. Monitoring and Alerting (Both Regions)
- **CloudWatch**
  - Custom metrics for application health
  - Alarms for Lambda errors, database connections, and latency
  - Log groups for Lambda functions
  - Metric filters for error patterns
- **SNS Topics**
  - Alert topic for CloudWatch alarms
  - Email subscription for notifications

### 7. Backup Strategy
- Aurora automated backups with 7-day retention
- DynamoDB point-in-time recovery
- Cross-region backup replication using S3 (if applicable)

## Expected Outputs

Export the following outputs for each region:
- VPC ID and subnet IDs
- Aurora cluster endpoint and reader endpoint
- DynamoDB table name and ARN
- Lambda function ARN and name
- EventBridge rule ARN
- Route 53 zone ID and nameservers
- SNS topic ARN
- CloudWatch log group names

## Technical Constraints

1. Use Pulumi ComponentResource pattern for modularity
2. All resources must have appropriate tags (Environment, Region, Purpose)
3. Follow AWS best practices for security (least privilege IAM, security groups)
4. Use environment variables for region-specific configuration
5. Implement proper error handling and logging
6. DO NOT use Aurora Global Database (use regional clusters instead)
7. All resources must be properly connected (Lambda in VPC, correct security groups)

## Testing Requirements

1. Verify infrastructure deploys successfully in both regions
2. Confirm VPC peering is established
3. Validate Lambda can connect to both Aurora and DynamoDB
4. Test EventBridge triggers Lambda successfully
5. Verify Route 53 health checks are functioning
6. Confirm CloudWatch alarms trigger on simulated failures
7. Achieve 100% code coverage with unit tests
8. Create integration tests using actual deployed resources
