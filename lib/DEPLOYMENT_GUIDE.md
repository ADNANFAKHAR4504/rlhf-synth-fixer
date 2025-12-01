# Deployment Guide - CloudFormation Optimized Template

## Quick Start

### Step 1: Prerequisites Check
```bash
# Check AWS CLI version
aws --version
# Expected: aws-cli/2.x or higher

# Verify AWS credentials
aws sts get-caller-identity

# Check Python version (for tests)
python3 --version
# Expected: Python 3.8+
```

### Step 2: Validate Template
```bash
cd /var/www/turing/iac-test-automations/worktree/synth-101912945/lib

# Validate JSON syntax
python3 -m json.tool optimized-stack.json > /dev/null && echo "Valid JSON"

# Validate with AWS CloudFormation API
aws cloudformation validate-template \
  --template-body file://optimized-stack.json \
  --region us-east-1
```

### Step 3: Run Tests (Optional but Recommended)
```bash
cd ../test

# Install test dependencies
pip3 install -r requirements.txt

# Run unit tests
pytest test_template_structure.py -v

# Run integration tests (requires AWS credentials)
pytest test_integration.py -v
```

### Step 4: Deploy Stack
```bash
cd ../lib

# Create dev environment stack
aws cloudformation create-stack \
  --stack-name financial-app-dev-$(date +%Y%m%d) \
  --template-body file://optimized-stack.json \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-$(whoami) \
    ParameterKey=DBMasterPassword,ParameterValue=DevPassword123! \
  --region us-east-1 \
  --tags Key=Project,Value=FinancialApp Key=Environment,Value=dev

# Monitor stack creation (takes ~15-20 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name financial-app-dev-$(date +%Y%m%d) \
  --region us-east-1

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name financial-app-dev-$(date +%Y%m%d) \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table
```

## Deployment Scenarios

### Scenario 1: Development Environment (Low Cost)
```bash
aws cloudformation create-stack \
  --stack-name financial-app-dev-test \
  --template-body file://optimized-stack.json \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-test \
    ParameterKey=VpcCIDR,ParameterValue=10.0.0.0/16 \
    ParameterKey=DBMasterPassword,ParameterValue=DevPassword123! \
  --region us-east-1

# Expected Resources:
# - 1 t3.micro EC2 instance
# - 1 db.t3.small Aurora instance
# - 1 cache.t3.micro Redis node
# - Single AZ deployment
# Cost: ~$50/month
```

### Scenario 2: Staging Environment (Medium Cost)
```bash
aws cloudformation create-stack \
  --stack-name financial-app-staging \
  --template-body file://optimized-stack.json \
  --parameters \
    ParameterKey=Environment,ParameterValue=staging \
    ParameterKey=EnvironmentSuffix,ParameterValue=stg-v1 \
    ParameterKey=VpcCIDR,ParameterValue=10.1.0.0/16 \
    ParameterKey=DBMasterPassword,ParameterValue=StagingPassword456! \
  --region us-east-1

# Expected Resources:
# - 2 t3.small EC2 instances (can scale to 4)
# - 1 db.t3.medium Aurora instance
# - 1 cache.t3.small Redis node
# - Single AZ deployment
# Cost: ~$150/month
```

### Scenario 3: Production Environment (High Availability)
```bash
aws cloudformation create-stack \
  --stack-name financial-app-production \
  --template-body file://optimized-stack.json \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-v1 \
    ParameterKey=VpcCIDR,ParameterValue=10.2.0.0/16 \
    ParameterKey=DBMasterUsername,ParameterValue=prodadmin \
    ParameterKey=DBMasterPassword,ParameterValue=SecureProductionPassword789! \
  --region us-east-1

# Expected Resources:
# - 2 t3.medium EC2 instances (can scale to 6)
# - 2 db.r5.large Aurora instances (Multi-AZ)
# - Redis Replication Group (2 nodes, Multi-AZ)
# - Multi-AZ deployment with automatic failover
# Cost: ~$500/month
```

### Scenario 4: Custom CIDR Ranges
```bash
aws cloudformation create-stack \
  --stack-name financial-app-custom \
  --template-body file://optimized-stack.json \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=custom \
    ParameterKey=VpcCIDR,ParameterValue=172.16.0.0/16 \
    ParameterKey=PublicSubnet1CIDR,ParameterValue=172.16.1.0/24 \
    ParameterKey=PublicSubnet2CIDR,ParameterValue=172.16.2.0/24 \
    ParameterKey=PublicSubnet3CIDR,ParameterValue=172.16.3.0/24 \
    ParameterKey=PrivateSubnet1CIDR,ParameterValue=172.16.11.0/24 \
    ParameterKey=PrivateSubnet2CIDR,ParameterValue=172.16.12.0/24 \
    ParameterKey=PrivateSubnet3CIDR,ParameterValue=172.16.13.0/24 \
    ParameterKey=DBMasterPassword,ParameterValue=CustomPassword123! \
  --region us-east-1
```

## Stack Updates

### Update Stack Parameters Only
```bash
# Update environment from dev to staging
aws cloudformation update-stack \
  --stack-name financial-app-dev-test \
  --use-previous-template \
  --parameters \
    ParameterKey=Environment,ParameterValue=staging \
    ParameterKey=EnvironmentSuffix,UsePreviousValue=true \
    ParameterKey=DBMasterPassword,UsePreviousValue=true

# This will:
# - Scale up instance sizes (t3.micro -> t3.small)
# - Increase ASG capacity (1->2 instances)
# - Upgrade RDS instance (db.t3.small -> db.t3.medium)
```

### Update Template with Changes
```bash
# Update stack with new template version
aws cloudformation update-stack \
  --stack-name financial-app-dev-test \
  --template-body file://optimized-stack.json \
  --parameters \
    ParameterKey=Environment,UsePreviousValue=true \
    ParameterKey=EnvironmentSuffix,UsePreviousValue=true \
    ParameterKey=DBMasterPassword,UsePreviousValue=true

# Monitor update
aws cloudformation wait stack-update-complete \
  --stack-name financial-app-dev-test
```

## Monitoring Deployment

### Watch Events in Real-Time
```bash
# Terminal 1: Watch events
watch -n 5 "aws cloudformation describe-stack-events \
  --stack-name financial-app-dev-test \
  --max-items 10 \
  --query 'StackEvents[*].[Timestamp,ResourceType,ResourceStatus]' \
  --output table"
```

### Check Specific Resource Status
```bash
# Check VPC creation
aws cloudformation describe-stack-resource \
  --stack-name financial-app-dev-test \
  --logical-resource-id VPC

# Check ALB creation
aws cloudformation describe-stack-resource \
  --stack-name financial-app-dev-test \
  --logical-resource-id ApplicationLoadBalancer

# Check Aurora cluster
aws cloudformation describe-stack-resource \
  --stack-name financial-app-dev-test \
  --logical-resource-id AuroraCluster
```

### Get Stack Outputs
```bash
# Get all outputs
aws cloudformation describe-stacks \
  --stack-name financial-app-dev-test \
  --query 'Stacks[0].Outputs'

# Get specific output (ALB DNS)
aws cloudformation describe-stacks \
  --stack-name financial-app-dev-test \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text

# Test ALB endpoint
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name financial-app-dev-test \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)
curl -I http://$ALB_DNS
```

## Troubleshooting

### Issue 1: Stack Creation Fails - Parameter Validation
**Error:**
```
An error occurred (ValidationError) when calling the CreateStack operation:
Parameter validation failed: Parameter 'EnvironmentSuffix' must match pattern
```

**Solution:**
```bash
# EnvironmentSuffix must be lowercase alphanumeric with hyphens only
# WRONG: Dev_Test, dev.test, DevTest123!
# CORRECT: dev-test, devtest123, dev-test-01

aws cloudformation create-stack \
  --stack-name financial-app-dev \
  --template-body file://optimized-stack.json \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-test01 \  # FIXED
    ParameterKey=DBMasterPassword,ParameterValue=Password123!
```

### Issue 2: Aurora Creation Timeout
**Symptoms:**
- Stack creation stuck at "CREATE_IN_PROGRESS" for AuroraCluster
- Taking longer than 15 minutes

**Solution:**
```bash
# This is NORMAL for first Aurora deployment
# Aurora cluster creation typically takes 10-15 minutes
# Wait for completion (timeout is 30 minutes by default)

# Check Aurora-specific events
aws cloudformation describe-stack-events \
  --stack-name financial-app-dev-test \
  --query 'StackEvents[?ResourceType==`AWS::RDS::DBCluster`]' \
  --output table

# If truly stuck (>30 minutes), check RDS console for detailed errors
aws rds describe-db-clusters --db-cluster-identifier aurora-cluster-dev-test
```

### Issue 3: S3 Bucket Name Already Exists
**Error:**
```
Resource creation cancelled: Bucket name 'logs-dev-test-123456789012' already exists
```

**Solution:**
```bash
# S3 bucket names are globally unique
# Change EnvironmentSuffix to make it unique

aws cloudformation create-stack \
  --stack-name financial-app-dev \
  --template-body file://optimized-stack.json \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-$(whoami)-$(date +%s) \  # UNIQUE
    ParameterKey=DBMasterPassword,ParameterValue=Password123!
```

### Issue 4: ALB Health Checks Failing
**Symptoms:**
- Stack created successfully
- But accessing ALB returns 503 Service Unavailable
- Target group shows 0 healthy targets

**Solution:**
```bash
# Check target group health
TG_ARN=$(aws cloudformation describe-stack-resource \
  --stack-name financial-app-dev-test \
  --logical-resource-id TargetGroup \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)

aws elbv2 describe-target-health --target-group-arn $TG_ARN

# Common causes:
# 1. EC2 instances don't have app running on port 8080
# 2. /health endpoint doesn't exist
# 3. Security group blocking traffic

# Fix: SSH to instance and check
INSTANCE_ID=$(aws autoscaling describe-auto-scaling-groups \
  --query 'AutoScalingGroups[?Tags[?Key==`aws:cloudformation:stack-name`&&Value==`financial-app-dev-test`]].Instances[0].InstanceId' \
  --output text)

aws ec2 describe-instances --instance-ids $INSTANCE_ID

# For testing, you can deploy a simple web server:
# ssh to instance and run: python3 -m http.server 8080
```

### Issue 5: Stack Deletion Stuck
**Symptoms:**
- Stack deletion in progress for >30 minutes
- Some resources not deleting

**Solution:**
```bash
# Check which resources are stuck
aws cloudformation describe-stack-resources \
  --stack-name financial-app-dev-test \
  --query 'StackResources[?ResourceStatus==`DELETE_IN_PROGRESS`]'

# Common stuck resources:
# 1. RDS: DeletionPolicy is Snapshot (creates snapshot before delete)
# 2. S3: DeletionPolicy is Retain (bucket not deleted automatically)
# 3. ENI: Attached to Lambda or other resources

# For RDS snapshots (if you want to delete them):
aws rds describe-db-cluster-snapshots \
  --query 'DBClusterSnapshots[?contains(DBClusterSnapshotIdentifier,`aurora-cluster-dev-test`)]'

# Delete snapshot if not needed
aws rds delete-db-cluster-snapshot \
  --db-cluster-snapshot-identifier <snapshot-id>

# For S3 buckets (if you want to delete them):
BUCKET_NAME=$(aws cloudformation describe-stack-resource \
  --stack-name financial-app-dev-test \
  --logical-resource-id LogBucket \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text 2>/dev/null)

if [ ! -z "$BUCKET_NAME" ]; then
  aws s3 rb s3://$BUCKET_NAME --force
fi
```

## Stack Deletion

### Standard Deletion (Keeps RDS Snapshots and S3 Data)
```bash
# Delete stack (RDS snapshot will be created, S3 bucket retained)
aws cloudformation delete-stack \
  --stack-name financial-app-dev-test

# Monitor deletion
aws cloudformation wait stack-delete-complete \
  --stack-name financial-app-dev-test

# Clean up retained resources if desired
# 1. Delete RDS snapshots (see Issue 5 above)
# 2. Empty and delete S3 bucket (see Issue 5 above)
```

### Complete Cleanup (For Testing Only)
```bash
# WARNING: This deletes ALL data including backups
# Only use for temporary test environments

# Get resource IDs before deletion
BUCKET_NAME=$(aws cloudformation describe-stack-resource \
  --stack-name financial-app-dev-test \
  --logical-resource-id LogBucket \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)

CLUSTER_ID=$(aws cloudformation describe-stack-resource \
  --stack-name financial-app-dev-test \
  --logical-resource-id AuroraCluster \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)

# Delete stack
aws cloudformation delete-stack --stack-name financial-app-dev-test

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name financial-app-dev-test

# Delete RDS snapshots
for snapshot in $(aws rds describe-db-cluster-snapshots \
  --query "DBClusterSnapshots[?contains(DBClusterSnapshotIdentifier,'$CLUSTER_ID')].DBClusterSnapshotIdentifier" \
  --output text); do
  aws rds delete-db-cluster-snapshot --db-cluster-snapshot-identifier $snapshot
done

# Empty and delete S3 bucket
aws s3 rm s3://$BUCKET_NAME --recursive
aws s3 rb s3://$BUCKET_NAME
```

## Testing Deployed Stack

### Test 1: Verify VPC and Networking
```bash
# Get VPC ID
VPC_ID=$(aws cloudformation describe-stacks \
  --stack-name financial-app-dev-test \
  --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' \
  --output text)

# Check VPC configuration
aws ec2 describe-vpcs --vpc-ids $VPC_ID

# Check subnets
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID"

# Verify 6 subnets (3 public, 3 private)
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'length(Subnets)'
```

### Test 2: Verify Load Balancer
```bash
# Get ALB DNS
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name financial-app-dev-test \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)

# Test HTTP endpoint
curl -I http://$ALB_DNS

# Check target health
TG_ARN=$(aws cloudformation describe-stack-resource \
  --stack-name financial-app-dev-test \
  --logical-resource-id TargetGroup \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)

aws elbv2 describe-target-health --target-group-arn $TG_ARN
```

### Test 3: Verify Database Connection
```bash
# Get Aurora endpoint
AURORA_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name financial-app-dev-test \
  --query 'Stacks[0].Outputs[?OutputKey==`AuroraClusterEndpoint`].OutputValue' \
  --output text)

# Test connection (from within VPC or via bastion)
mysql -h $AURORA_ENDPOINT -u admin -p appdb
```

### Test 4: Verify Redis Connection
```bash
# Get Redis endpoint
REDIS_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name financial-app-dev-test \
  --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' \
  --output text)

# Test connection (from within VPC or via bastion)
redis-cli -h $REDIS_ENDPOINT ping
```

### Test 5: Verify Auto Scaling
```bash
# Get ASG name
ASG_NAME=$(aws cloudformation describe-stack-resource \
  --stack-name financial-app-dev-test \
  --logical-resource-id AutoScalingGroup \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)

# Check ASG configuration
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names $ASG_NAME

# Check instance count
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names $ASG_NAME \
  --query 'AutoScalingGroups[0].[MinSize,DesiredCapacity,MaxSize]'
```

## Performance Benchmarks

### Deployment Times
- **Initial Creation**: 15-20 minutes
  - VPC/Networking: 2-3 minutes
  - Aurora Cluster: 10-12 minutes
  - EC2/ALB: 3-5 minutes
  - ElastiCache: 2-3 minutes

- **Stack Updates**: 5-15 minutes
  - Parameter changes: 5-8 minutes
  - Template changes: 10-15 minutes (depends on resources)

- **Stack Deletion**: 10-15 minutes
  - With snapshots: 12-15 minutes
  - Without snapshots: 8-10 minutes

### Resource Creation Order
1. VPC, Subnets, IGW, Route Tables (parallel)
2. Security Groups (after VPC)
3. DB Subnet Group, Cache Subnet Group (parallel)
4. Aurora Cluster (longest)
5. Aurora Instances (after cluster)
6. ElastiCache (parallel with Aurora instances)
7. ALB, Target Group (parallel)
8. Launch Configuration (after SG)
9. Auto Scaling Group (after launch config, target group)
10. S3 Bucket (parallel with compute resources)

## Cost Estimates

### Development Environment (~$50/month)
- EC2: 1 x t3.micro = $7.50/month
- RDS: 1 x db.t3.small = $24/month
- Redis: 1 x cache.t3.micro = $12/month
- ALB: $16.20/month
- Data transfer: ~$5/month
- **Total**: ~$65/month

### Staging Environment (~$150/month)
- EC2: 2 x t3.small = $30/month
- RDS: 1 x db.t3.medium = $48/month
- Redis: 1 x cache.t3.small = $24/month
- ALB: $16.20/month
- Data transfer: ~$10/month
- **Total**: ~$130/month

### Production Environment (~$500/month)
- EC2: 2 x t3.medium = $60/month
- RDS: 2 x db.r5.large (Multi-AZ) = $290/month
- Redis: 2-node replication group (cache.r5.large) = $140/month
- ALB: $16.20/month
- Data transfer: ~$20/month
- **Total**: ~$526/month

## Security Checklist

Before deploying to production, verify:

- [ ] Database password is strong and stored in AWS Secrets Manager
- [ ] Security groups follow least privilege principle
- [ ] IMDSv2 is enforced on all EC2 instances
- [ ] RDS storage encryption is enabled
- [ ] S3 buckets have public access blocked
- [ ] CloudWatch Logs are enabled for Aurora
- [ ] Backup retention is set appropriately (7 days default)
- [ ] VPC Flow Logs are enabled (optional, not in template)
- [ ] AWS WAF is configured for ALB (optional, not in template)
- [ ] Route53 DNS is configured (optional, not in template)
- [ ] ACM certificate for HTTPS (optional, not in template)

## Next Steps

After successful deployment:

1. **Configure DNS**: Point custom domain to ALB DNS name
2. **Enable HTTPS**: Add ACM certificate to ALB listener
3. **Deploy Application**: Deploy application code to EC2 instances
4. **Configure Monitoring**: Set up CloudWatch alarms and dashboards
5. **Enable Logging**: Configure application logs to CloudWatch Logs
6. **Set Up CI/CD**: Integrate with deployment pipeline
7. **Configure Backups**: Verify RDS and Aurora backups are working
8. **Test Failover**: Verify Multi-AZ failover (production only)
9. **Load Testing**: Test application under load
10. **Documentation**: Document application-specific configuration

## Support

For issues or questions:
- Review README.md for detailed documentation
- Review MODEL_FAILURES.md for requirement details
- Check AWS CloudFormation documentation
- Run cfn-lint for template validation
- Review integration test results

## Additional Resources

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [CloudFormation Best Practices](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/best-practices.html)
- [cfn-lint Tool](https://github.com/aws-cloudformation/cfn-lint)
