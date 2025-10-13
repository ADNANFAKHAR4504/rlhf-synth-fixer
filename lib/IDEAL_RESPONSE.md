# Secure Data Processing Pipeline for Federal Agency

## Implementation Overview

This infrastructure implements a FedRAMP Moderate compliant data processing pipeline for a federal agency handling citizen PII data. The solution leverages containerized processing with end-to-end encryption and proper audit trails.

## Architecture Components

### 1. AWS KMS (Encryption at Rest and In Transit)
- Customer-managed KMS key with automatic rotation enabled
- Used for encrypting:
  - Kinesis data streams
  - RDS PostgreSQL database
  - Secrets Manager credentials
  - CloudWatch logs
- Deletion window: 7 days (destroyable for CI/CD)

### 2. VPC and Networking
- **VPC**: 10.0.0.0/16 CIDR block with DNS support enabled
- **Public Subnets**: 2 subnets across us-east-1a and us-east-1b for NAT Gateway
- **Private Subnets**: 2 subnets for ECS tasks and RDS (no public access)
- **NAT Gateway**: Single NAT Gateway for cost optimization (private subnets can access AWS services)
- **Internet Gateway**: For public subnet connectivity
- **Route Tables**: Separate routing for public and private subnets

### 3. Security Groups (Least Privilege)
- **API Gateway SG**: HTTPS (443) ingress from anywhere
- **ECS Tasks SG**: Port 8080 ingress from API Gateway SG only, egress to all
- **RDS SG**: PostgreSQL (5432) ingress from ECS Tasks SG only, no egress

### 4. Amazon Kinesis Data Stream
- Stream for real-time data ingestion from API Gateway
- Single shard configuration (suitable for moderate workloads)
- 24-hour retention period
- KMS encryption enabled using customer-managed key
- Provides buffering between API Gateway and ECS processing

### 5. Amazon RDS PostgreSQL
- **Engine**: PostgreSQL 16.3 on db.t3.micro
- **Storage**: 20 GB gp3 with encryption at rest (KMS)
- **Network**: Private subnets only, no public accessibility
- **Security**:
  - Encrypted at rest using KMS
  - Only accessible from ECS tasks
  - CloudWatch logs export enabled (postgresql, upgrade)
- **Backup**: 7-day retention, daily at 3:00 AM
- **Compliance**: Deletion protection disabled, skip final snapshot (for CI/CD)

### 6. AWS Secrets Manager
- Stores database credentials encrypted with KMS
- Secret includes: username, password, host, port, database name
- Accessible only by ECS tasks via IAM role
- Demonstrates secure credential management pattern

### 7. Amazon ECS (Fargate)
- **Cluster**: Container Insights enabled for monitoring
- **Task Definition**:
  - Fargate launch type (serverless)
  - 256 CPU units, 512 MB memory
  - Sample container image (amazon/amazon-ecs-sample)
  - Environment variables: Kinesis stream name, DB secret ARN
- **Service**:
  - 1 desired task count
  - Runs in private subnets
  - No public IP assignment
- **Logging**: CloudWatch Logs with KMS encryption

### 8. IAM Roles and Policies (Least Privilege)

#### API Gateway Role
- Allows API Gateway to write records to Kinesis stream
- Permissions: `kinesis:PutRecord`, `kinesis:PutRecords`

#### ECS Task Execution Role
- Allows ECS to pull container images and write logs
- Uses AWS managed policy: `AmazonECSTaskExecutionRolePolicy`

#### ECS Task Role
- Allows application code to:
  - Read from Kinesis stream
  - Retrieve secrets from Secrets Manager
  - Decrypt using KMS

### 9. Amazon API Gateway
- **Type**: Regional REST API
- **Endpoint**: `/ingest` resource with POST method
- **Authentication**: AWS IAM (Signature v4)
- **Integration**: Direct integration with Kinesis PutRecord action
- **Request Transformation**: JSON payload base64-encoded and sent to Kinesis
- **Logging**: CloudWatch logging enabled (INFO level, data trace, metrics)
- **Stage**: `prod` deployment

## Data Flow

1. **Ingestion**: Client sends POST request to API Gateway `/ingest` endpoint with IAM authentication
2. **Streaming**: API Gateway transforms request and writes to Kinesis data stream
3. **Processing**: ECS Fargate tasks consume records from Kinesis stream
4. **Storage**: Processed data written to PostgreSQL database in private subnet
5. **Credentials**: ECS tasks retrieve DB credentials from Secrets Manager at runtime

## Security Controls

### Encryption
- **In Transit**: TLS 1.2+ for all API calls, HTTPS endpoints
- **At Rest**: KMS encryption for Kinesis, RDS, Secrets Manager, CloudWatch Logs

### Network Isolation
- RDS in private subnets with no public access
- ECS tasks in private subnets
- Security groups enforce least privilege access

### Identity and Access Management
- IAM roles with minimum required permissions
- No hardcoded credentials
- Service-to-service authentication

### Audit and Monitoring
- CloudWatch Logs for API Gateway, ECS tasks, RDS
- Container Insights for ECS cluster monitoring
- API Gateway metrics and tracing enabled

### FedRAMP Moderate Compliance Features
- Encryption at rest and in transit
- Audit logging enabled
- Network isolation
- Principle of least privilege
- Automatic key rotation
- Backup and recovery capabilities

## Stack Outputs

The infrastructure exports the following outputs:

```yaml
vpcId: VPC identifier
vpcCidr: VPC CIDR block
publicSubnet1Id: Public subnet 1 ID
publicSubnet2Id: Public subnet 2 ID
privateSubnet1Id: Private subnet 1 ID
privateSubnet2Id: Private subnet 2 ID
kmsKeyId: KMS key ID
kmsKeyArn: KMS key ARN
kinesisStreamName: Kinesis stream name
kinesisStreamArn: Kinesis stream ARN
rdsEndpoint: RDS instance endpoint (host:port)
rdsInstanceId: RDS instance identifier
rdsInstanceArn: RDS instance ARN
dbSecretArn: Secrets Manager secret ARN
ecsClusterName: ECS cluster name
ecsClusterArn: ECS cluster ARN
ecsTaskDefinitionArn: ECS task definition ARN
apiGatewayId: API Gateway REST API ID
apiGatewayUrl: Full API Gateway URL (https://[api-id].execute-api.us-east-1.amazonaws.com/prod/ingest)
apiGatewayEndpoint: API Gateway invoke URL
```

## Deployment Instructions

### Prerequisites
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Go 1.23+ installed

### Deployment Steps

1. **Initialize Pulumi Stack**:
   ```bash
   cd /path/to/worktree/synth-2237444138
   pulumi stack init dev
   ```

2. **Install Dependencies**:
   ```bash
   go mod tidy
   ```

3. **Set AWS Region**:
   ```bash
   pulumi config set aws:region us-east-1
   ```

4. **Preview Changes**:
   ```bash
   pulumi preview
   ```

5. **Deploy Infrastructure**:
   ```bash
   pulumi up --yes
   ```

6. **View Outputs**:
   ```bash
   pulumi stack output
   ```

### Deployment Time Estimates
- VPC and Networking: ~2 minutes
- KMS Key: ~1 minute
- Kinesis Stream: ~1 minute
- RDS PostgreSQL: ~5-10 minutes (database provisioning)
- ECS Cluster and Service: ~3-5 minutes
- API Gateway: ~1 minute
- **Total**: ~15-20 minutes

## Testing the Infrastructure

### 1. Test API Gateway Endpoint

Generate AWS Signature v4 and send a POST request:

```bash
# Get API Gateway URL
API_URL=$(pulumi stack output apiGatewayUrl)

# Send test request (requires AWS credentials and awscurl or similar tool)
aws apigatewayv2 --region us-east-1 test-invoke-method \
  --http-method POST \
  --path /ingest \
  --body '{"citizenId":"12345","name":"Test User","applicationDate":"2025-01-01"}'
```

### 2. Verify Kinesis Stream

```bash
# Get stream name
STREAM_NAME=$(pulumi stack output kinesisStreamName)

# Describe stream
aws kinesis describe-stream --stream-name $STREAM_NAME --region us-east-1
```

### 3. Check ECS Tasks

```bash
# Get cluster name
CLUSTER_NAME=$(pulumi stack output ecsClusterName)

# List running tasks
aws ecs list-tasks --cluster $CLUSTER_NAME --region us-east-1

# View task logs in CloudWatch
aws logs tail /ecs/TapStack-dev --follow --region us-east-1
```

### 4. Verify RDS Connectivity (from ECS task)

Connect to an ECS task and test database connectivity:

```bash
# Get DB secret ARN
SECRET_ARN=$(pulumi stack output dbSecretArn)

# Retrieve credentials (from within ECS task or with appropriate IAM permissions)
aws secretsmanager get-secret-value --secret-id $SECRET_ARN --region us-east-1
```

## Cleanup

To destroy all resources:

```bash
pulumi destroy --yes
```

This will tear down all infrastructure in reverse dependency order.

## Cost Optimization Notes

1. **Single NAT Gateway**: Used one NAT Gateway instead of one per AZ to reduce costs (~$32/month per NAT Gateway)
2. **RDS db.t3.micro**: Small instance size suitable for development/testing
3. **ECS Fargate**: Pay-per-use model, only charged when tasks are running
4. **Kinesis Single Shard**: Minimal shard count for moderate workloads
5. **CloudWatch Logs**: 7-day retention to minimize storage costs

**Estimated Monthly Cost**: ~$50-100 (primarily NAT Gateway, RDS, and ECS runtime)

## Troubleshooting

### Issue: RDS Takes Too Long to Deploy
- **Cause**: PostgreSQL instance provisioning time
- **Solution**: Wait for 5-10 minutes. Consider using Aurora Serverless v2 for faster provisioning.

### Issue: ECS Tasks Failing to Start
- **Cause**: Missing permissions or invalid container image
- **Solution**: Check CloudWatch Logs for task errors. Verify IAM roles have correct permissions.

### Issue: API Gateway Returns 403
- **Cause**: Missing IAM authentication
- **Solution**: Ensure requests include AWS Signature v4 headers. Use AWS SDK or tools like awscurl.

### Issue: Database Connection Refused
- **Cause**: Security group blocking connection or incorrect endpoint
- **Solution**: Verify ECS tasks are in correct subnets and security groups allow traffic.

## Compliance and Best Practices

This implementation follows:
- **FedRAMP Moderate** security controls
- **NIST 800-53** cybersecurity framework
- **AWS Well-Architected Framework** pillars:
  - Security: Encryption, IAM, network isolation
  - Reliability: Multi-AZ deployment, automated backups
  - Performance: Serverless compute, optimized database
  - Cost Optimization: Right-sized resources
  - Operational Excellence: CloudWatch monitoring, Infrastructure as Code

## Future Enhancements

1. **Multi-Region Deployment**: Add replica in second region for disaster recovery
2. **Auto Scaling**: Configure ECS service auto-scaling based on Kinesis metrics
3. **WAF Integration**: Add AWS WAF to API Gateway for enhanced security
4. **Enhanced Monitoring**: Add custom CloudWatch dashboards and alarms
5. **Backup Automation**: Implement automated RDS snapshot lifecycle management
6. **Secret Rotation**: Enable automatic secret rotation in Secrets Manager
7. **VPC Flow Logs**: Enable VPC Flow Logs for network traffic analysis
8. **GuardDuty**: Enable AWS GuardDuty for threat detection