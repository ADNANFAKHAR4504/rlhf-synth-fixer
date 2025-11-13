# Highly Available Web Application Infrastructure for Financial Services

This CloudFormation template deploys a production-grade, highly available web application infrastructure for financial services transaction processing across 3 availability zones in AWS us-east-1 region.

## Architecture Overview

### Multi-AZ High Availability Architecture

```
                                    Internet
                                       |
                                       |
                    +------------------+------------------+
                    |                                     |
              Internet Gateway                    CloudWatch Logs
                    |                                     |
      +-------------+-------------+              VPC Flow Logs (30d)
      |             |             |
   [Public Subnet 1][Public Subnet 2][Public Subnet 3]
      |             |             |
   [NAT GW 1]    [NAT GW 2]    [NAT GW 3]
      |             |             |
      +-------------+-------------+
      |    Application Load Balancer     |
      |        (HTTPS/TLS 1.2)          |
      +---------------------------------+
                    |
      +-------------+-------------+
      |             |             |
   [Private Subnet 1][Private Subnet 2][Private Subnet 3]
      |             |             |
   [EC2 Instance][EC2 Instance][EC2 Instance]
      |   (Auto Scaling Group: 2-6 instances)
      |             |             |
      +-------------+-------------+
                    |
              +-----+-----+
              |  Aurora   |
              |  MySQL    |
              | Cluster   |
              | (Writer)  |
              | (Reader)  |
              +-----------+
                    |
            Secrets Manager
         (Automated Rotation)
```

### Components

1. **Network Layer (3 AZs)**
   - VPC with CIDR 10.0.0.0/16 (configurable)
   - 3 Public Subnets for internet-facing resources
   - 3 Private Subnets for application tier
   - 3 NAT Gateways (one per AZ) for outbound internet access
   - Internet Gateway for public internet connectivity
   - VPC Flow Logs enabled (30-day retention in CloudWatch)

2. **Application Layer**
   - Application Load Balancer (ALB) in public subnets
   - Auto Scaling Group with 2-6 EC2 t3.medium instances
   - EC2 instances in private subnets across 3 AZs
   - Amazon Linux 2023 with CloudWatch agent
   - IMDSv2 enforced for enhanced security

3. **Database Layer**
   - RDS Aurora MySQL 8.0 cluster
   - 1 Writer instance (db.t3.medium)
   - 1 Reader instance (db.t3.medium)
   - Encrypted with customer-managed KMS keys
   - Automated backups (7-day retention)

4. **Security & Secrets**
   - AWS Secrets Manager for RDS credentials
   - Lambda function for automatic credential rotation (30-day cycle)
   - KMS customer-managed keys for encryption
   - Security groups with least-privilege rules
   - No 0.0.0.0/0 inbound rules (except ALB for HTTPS/HTTP)

5. **Monitoring & Scaling**
   - CloudWatch alarms for CPU-based auto-scaling
   - Scale up at 70% CPU utilization
   - Scale down at 30% CPU utilization
   - CloudWatch Logs for application and system logs
   - VPC Flow Logs for network traffic analysis

## Mandatory Requirements (ALL IMPLEMENTED)

- [x] **Requirement 1**: VPC with 3 public subnets and 3 private subnets across 3 AZs
- [x] **Requirement 2**: RDS Aurora MySQL cluster (1 writer, 1 reader instance)
- [x] **Requirement 3**: Application Load Balancer in public subnets with target group health checks
- [x] **Requirement 4**: Auto Scaling Group (min 2, max 6 EC2 t3.medium instances) in private subnets
- [x] **Requirement 5**: NAT Gateways in each AZ for outbound internet access
- [x] **Requirement 6**: Security groups with explicit ingress/egress rules
- [x] **Requirement 7**: CloudWatch Logs for VPC Flow Logs with 30-day retention
- [x] **Requirement 8**: Secrets Manager for RDS credentials with Lambda-based rotation

## Security Constraints (ALL SATISFIED)

- [x] Database credentials in Secrets Manager with automatic rotation (30-day cycle)
- [x] RDS encrypted storage with customer-managed KMS keys
- [x] ALB enforces HTTPS-only with SSL termination (when certificate provided)
- [x] EC2 instances use IMDSv2 exclusively
- [x] All resources tagged with Environment, Project, CostCenter
- [x] VPC Flow Logs enabled to CloudWatch with 30-day retention
- [x] Security groups follow least-privilege (no 0.0.0.0/0 inbound except ALB)
- [x] Stack supports blue-green deployments via parameter updates

## Prerequisites

Before deploying this stack, ensure you have:

1. **AWS CLI** installed and configured:
   ```bash
   aws --version
   aws configure
   ```

2. **IAM Permissions** for:
   - CloudFormation (create/update/delete stacks)
   - VPC, EC2, RDS, ELB, Auto Scaling
   - IAM roles and policies
   - Secrets Manager, KMS
   - CloudWatch Logs
   - Lambda functions

3. **Optional: SSL Certificate** in AWS Certificate Manager (ACM):
   - If you want HTTPS termination on ALB
   - Must be in the same region (us-east-1)
   - Note the certificate ARN

## Deployment

### Step 1: Validate the Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/template.json \
  --region us-east-1
```

### Step 2: Create the Stack

**Basic deployment (HTTP only, no SSL certificate):**

```bash
aws cloudformation create-stack \
  --stack-name financial-app-prod \
  --template-body file://lib/template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=Project,ParameterValue=financial-transactions \
    ParameterKey=CostCenter,ParameterValue=engineering \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

**Full deployment with HTTPS:**

```bash
aws cloudformation create-stack \
  --stack-name financial-app-prod \
  --template-body file://lib/template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=Project,ParameterValue=financial-transactions \
    ParameterKey=CostCenter,ParameterValue=engineering \
    ParameterKey=SSLCertificateArn,ParameterValue=arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERT_ID \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 3: Monitor Deployment

```bash
# Watch stack creation progress
aws cloudformation describe-stacks \
  --stack-name financial-app-prod \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'

# Watch detailed events
aws cloudformation describe-stack-events \
  --stack-name financial-app-prod \
  --region us-east-1 \
  --max-items 10
```

**Expected deployment time**: 25-35 minutes
- VPC and networking: ~5 minutes
- NAT Gateways: ~3 minutes
- RDS Aurora cluster: ~15-20 minutes (longest component)
- Auto Scaling Group: ~5 minutes
- Lambda and Secrets rotation: ~2 minutes

### Step 4: Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name financial-app-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

**Important Outputs:**
- `ALBDNSName`: Load balancer DNS name for accessing the application
- `DBClusterEndpoint`: Writer endpoint for database connections
- `DBClusterReadEndpoint`: Reader endpoint for read-only queries
- `DBSecretArn`: ARN of the database credentials secret
- `VPCId`: VPC identifier
- `AutoScalingGroupName`: ASG name for monitoring

## Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `EnvironmentSuffix` | String | `prod` | Unique suffix for resource naming |
| `Environment` | String | `production` | Environment tag (development/staging/production) |
| `Project` | String | `financial-transactions` | Project name for tagging |
| `CostCenter` | String | `engineering` | Cost center for billing attribution |
| `VpcCIDR` | String | `10.0.0.0/16` | CIDR block for VPC |
| `DBMasterUsername` | String | `admin` | RDS master username (NoEcho) |
| `InstanceType` | String | `t3.medium` | EC2 instance type |
| `LatestAmiId` | SSM Parameter | Auto | Latest Amazon Linux 2023 AMI |
| `SSLCertificateArn` | String | (empty) | ACM certificate ARN for HTTPS |

## Post-Deployment Configuration

### 1. Access the Application

```bash
# Get the ALB DNS name
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name financial-app-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text)

echo "Application URL: http://${ALB_DNS}"
# Or https://${ALB_DNS} if you configured SSL certificate
```

### 2. Connect to RDS Database

```bash
# Get database credentials from Secrets Manager
SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name financial-app-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`DBSecretArn`].OutputValue' \
  --output text)

aws secretsmanager get-secret-value \
  --secret-id "${SECRET_ARN}" \
  --region us-east-1 \
  --query 'SecretString' \
  --output text

# Get database endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name financial-app-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`DBClusterEndpoint`].OutputValue' \
  --output text)

echo "Database Endpoint: ${DB_ENDPOINT}"
```

### 3. Configure DNS (Optional)

If you have a custom domain, create a CNAME or Alias record pointing to the ALB DNS name:

```bash
# Using Route 53 (example)
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.yourdomain.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'${ALB_DNS}'"}]
      }
    }]
  }'
```

## Monitoring and Observability

### CloudWatch Dashboards

View metrics in CloudWatch:

1. **EC2 Auto Scaling Metrics**:
   - CPU utilization per instance
   - Network in/out
   - Disk usage

2. **RDS Aurora Metrics**:
   - Database connections
   - Read/Write IOPS
   - Storage usage
   - Replication lag (reader instance)

3. **ALB Metrics**:
   - Request count
   - Target response time
   - HTTP 2xx, 4xx, 5xx counts
   - Healthy/unhealthy target counts

### View VPC Flow Logs

```bash
# Get log group name
LOG_GROUP=$(aws cloudformation describe-stacks \
  --stack-name financial-app-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`VPCFlowLogsLogGroup`].OutputValue' \
  --output text)

# View recent logs
aws logs tail "${LOG_GROUP}" --follow --region us-east-1
```

### Check Auto Scaling Activity

```bash
ASG_NAME=$(aws cloudformation describe-stacks \
  --stack-name financial-app-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`AutoScalingGroupName`].OutputValue' \
  --output text)

aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name "${ASG_NAME}" \
  --max-records 10 \
  --region us-east-1
```

## Updating the Stack

### Update Parameters (Blue-Green Deployment)

To perform a blue-green deployment:

1. Create a new stack with different `EnvironmentSuffix`:
   ```bash
   aws cloudformation create-stack \
     --stack-name financial-app-blue \
     --template-body file://lib/template.json \
     --parameters \
       ParameterKey=EnvironmentSuffix,ParameterValue=blue \
       ParameterKey=Environment,ParameterValue=production \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

2. Test the new environment
3. Update DNS to point to new ALB
4. Delete old stack after validation

### Update Existing Stack

```bash
aws cloudformation update-stack \
  --stack-name financial-app-prod \
  --template-body file://lib/template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,UsePreviousValue=true \
    ParameterKey=InstanceType,ParameterValue=t3.large \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Cost Estimation

### Monthly Cost Breakdown (us-east-1, approximate)

| Component | Configuration | Estimated Cost |
|-----------|---------------|----------------|
| EC2 Instances | 2x t3.medium (on-demand) | ~$60 |
| NAT Gateways | 3 gateways + data transfer | ~$100 |
| Application Load Balancer | 1 ALB + LCU | ~$25 |
| RDS Aurora MySQL | 2x db.t3.medium | ~$110 |
| EBS Storage | RDS storage (~100 GB) | ~$12 |
| CloudWatch Logs | VPC Flow Logs (moderate traffic) | ~$10 |
| Secrets Manager | 1 secret with rotation | ~$1 |
| KMS | 1 customer-managed key | ~$1 |
| Data Transfer | Moderate inter-AZ transfer | ~$20 |
| **Total Estimated** | | **~$340/month** |

**Cost Optimization Tips**:
- Use Reserved Instances for EC2 and RDS (up to 60% savings)
- Consider Aurora Serverless v2 for variable workloads
- Reduce NAT Gateway count to 1 for non-production (saves ~$66/month)
- Use VPC endpoints for AWS services to reduce NAT Gateway data transfer

## Troubleshooting

### Stack Creation Fails

**Issue**: Stack creation fails with "Rollback in progress"

**Solution**:
```bash
# Check failure reason
aws cloudformation describe-stack-events \
  --stack-name financial-app-prod \
  --region us-east-1 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Common issues:
# - Insufficient IAM permissions: Add required permissions
# - Service limits exceeded: Request limit increase
# - Invalid SSL certificate ARN: Verify certificate exists in us-east-1
```

### Cannot Connect to RDS

**Issue**: Applications cannot connect to RDS cluster

**Solution**:
1. Verify security group rules allow EC2 instances to connect on port 3306
2. Check RDS cluster is in "available" state
3. Verify credentials from Secrets Manager are correct
4. Ensure EC2 instances are in private subnets with proper routing

### ALB Health Checks Failing

**Issue**: Target group shows unhealthy instances

**Solution**:
1. Verify `/health` endpoint exists and returns HTTP 200
2. Check security group allows ALB to reach EC2 instances on port 80
3. Review CloudWatch Logs for application errors
4. SSH into instance via Session Manager and test locally:
   ```bash
   curl http://localhost/health
   ```

### Secret Rotation Fails

**Issue**: Secrets Manager rotation fails

**Solution**:
1. Verify Lambda function can reach RDS (check VPC/subnet configuration)
2. Check Lambda execution role has necessary permissions
3. Review CloudWatch Logs for Lambda function errors
4. Ensure RDS security group allows Lambda security group on port 3306

## Cleanup

### Delete the Stack

```bash
aws cloudformation delete-stack \
  --stack-name financial-app-prod \
  --region us-east-1

# Monitor deletion
aws cloudformation wait stack-delete-complete \
  --stack-name financial-app-prod \
  --region us-east-1
```

**Note**:
- Deletion takes 15-20 minutes
- RDS cluster snapshots are retained (delete manually if not needed)
- CloudWatch Log Groups are retained (delete manually if not needed)
- Elastic IPs for NAT Gateways are released automatically

### Manual Cleanup (if needed)

If stack deletion fails, manually delete:

1. **RDS Cluster**:
   ```bash
   aws rds delete-db-cluster \
     --db-cluster-identifier aurora-cluster-prod \
     --skip-final-snapshot \
     --region us-east-1
   ```

2. **NAT Gateways** (if stuck):
   ```bash
   aws ec2 delete-nat-gateway --nat-gateway-id nat-xxxxx --region us-east-1
   ```

3. **Elastic IPs**:
   ```bash
   aws ec2 release-address --allocation-id eipalloc-xxxxx --region us-east-1
   ```

## Testing

Comprehensive tests are available in the `test/` directory:

```bash
# Run unit tests
npm test

# Run integration tests (requires deployed stack)
npm run test:integration
```

## Security Best Practices

This template implements AWS Well-Architected Framework security pillars:

1. **Identity and Access Management**:
   - IAM roles with least-privilege permissions
   - No hardcoded credentials
   - IMDSv2 enforced on EC2 instances

2. **Detective Controls**:
   - VPC Flow Logs enabled
   - CloudWatch monitoring and alarms
   - RDS audit logging enabled

3. **Infrastructure Protection**:
   - Private subnets for application and database tiers
   - Security groups with explicit rules
   - No direct internet access to private resources

4. **Data Protection**:
   - Encryption at rest (RDS with KMS)
   - Encryption in transit (HTTPS on ALB)
   - Automated secret rotation
   - Automated RDS backups

5. **Incident Response**:
   - CloudWatch alarms for anomalies
   - Comprehensive logging
   - Automated backups for disaster recovery

## Additional Resources

- [AWS CloudFormation User Guide](https://docs.aws.amazon.com/cloudformation/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [RDS Aurora MySQL Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)
- [Application Load Balancer Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [AWS Secrets Manager Rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)

## Support and Contributions

For issues, questions, or contributions:
- Review the implementation in `lib/template.json`
- Check `lib/MODEL_RESPONSE.md` for detailed implementation notes
- Refer to AWS documentation for service-specific questions

## License

This template is provided as-is for educational and production use.
