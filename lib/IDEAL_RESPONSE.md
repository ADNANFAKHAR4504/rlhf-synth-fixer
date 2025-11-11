# CloudFormation Template - Three-Tier Migration Infrastructure (Production-Ready)

This is the corrected, production-ready CloudFormation template for creating a complete three-tier migration infrastructure. All issues from the initial MODEL_RESPONSE have been fixed.

## Improvements Made

This version includes:
- Complete and consistent tagging (Environment and MigrationPhase tags on all resources)
- HTTPS support in ALB security group
- SSH access for troubleshooting in app security group
- Full Secrets Manager integration with IAM permissions
- Automatic secret rotation with Lambda function
- CloudWatch Logs export for RDS
- Complete outputs including secret ARN and target group ARNs
- EnvironmentSuffix applied to ALL resource names

## Architecture Overview

The template creates:
- **VPC Layer**: VPC (10.0.0.0/16) with public, private, and database subnets across 2 AZs
- **Network Layer**: Internet Gateway, 2 NAT Gateways for high availability, route tables
- **Load Balancing**: Application Load Balancer with health checks
- **Compute Layer**: Auto Scaling Groups with launch templates (min 2, max 6 instances)
- **Database Layer**: RDS PostgreSQL Multi-AZ with 7-day backup retention and encryption
- **Security**: Least-privilege security groups, encrypted storage, Secrets Manager with rotation
- **Blue-Green Deployment**: Separate target groups for zero-downtime deployments

## File: lib/TapStack.json

The complete production-ready CloudFormation template is available in `lib/TapStack.json`. It includes all the AWS resources properly configured with:

### VPC and Networking Resources
- VPC with DNS support and hostnames enabled
- 2 public subnets (10.0.1.0/24, 10.0.2.0/24) for ALB
- 2 private subnets (10.0.11.0/24, 10.0.12.0/24) for application servers
- 2 database subnets (10.0.21.0/24, 10.0.22.0/24) for RDS
- Internet Gateway for public internet access
- 2 NAT Gateways (one per AZ) for high availability
- Route tables with proper associations

### Security Groups
- **ALB Security Group**: Allows HTTP (80) and HTTPS (443) from internet
- **App Security Group**: Allows traffic from ALB on port 8080, SSH from VPC
- **DB Security Group**: Allows PostgreSQL (5432) from app servers only

### Load Balancer and Target Groups
- Application Load Balancer in public subnets
- Blue Target Group for current deployment
- Green Target Group for new deployments
- Health checks on /health endpoint
- ALB Listener forwarding to Blue target group by default

### Auto Scaling
- Launch Template with Amazon Linux 2 AMI
- IAM instance profile with Secrets Manager access
- User data script that retrieves DB credentials from Secrets Manager
- Auto Scaling Group spanning both private subnets
- Min: 2, Max: 6, Desired: 2 instances
- ELB health checks with 5-minute grace period

### Database
- RDS PostgreSQL 14.7 with Multi-AZ deployment
- Encrypted storage (gp3)
- 7-day automated backup retention
- CloudWatch Logs export enabled
- Deployed in dedicated database subnets
- DeletionProtection disabled for testing (enable in production)

### Secrets Management
- AWS Secrets Manager secret storing database credentials
- Lambda function for automatic password rotation
- Rotation schedule set to 30 days
- EC2 instances have IAM permissions to read secrets
- Secret includes username, password, host, port, and database name

### IAM Roles and Policies
- **EC2 Role**:
  - AmazonSSMManagedInstanceCore for Systems Manager access
  - Custom policy for Secrets Manager read access
- **Lambda Role**:
  - AWSLambdaBasicExecutionRole for CloudWatch Logs
  - Custom policy for Secrets Manager rotation operations

### Outputs
- VPC ID
- ALB DNS Name (for application access)
- RDS Endpoint Address (for database connection)
- RDS Port
- DB Secret ARN (for retrieving credentials)
- Blue and Green Target Group ARNs (for deployment automation)
- Auto Scaling Group Name

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate credentials
- An EC2 key pair created in us-east-1 region
- Sufficient AWS service limits for the resources

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name migration-infrastructure-prod \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=DBUsername,ParameterValue=postgres \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=DBAllocatedStorage,ParameterValue=20 \
    ParameterKey=DBInstanceClass,ParameterValue=db.t3.micro \
    ParameterKey=InstanceType,ParameterValue=t3.micro \
    ParameterKey=KeyName,ParameterValue=your-key-pair-name \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Stack Creation

```bash
aws cloudformation describe-stacks \
  --stack-name migration-infrastructure-prod \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Retrieve Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name migration-infrastructure-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Testing and Validation

### 1. Verify VPC and Networking

```bash
# Get VPC ID from stack outputs
VPC_ID=$(aws cloudformation describe-stacks \
  --stack-name migration-infrastructure-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' \
  --output text)

# Verify VPC configuration
aws ec2 describe-vpcs --vpc-ids $VPC_ID

# Check subnets
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID"

# Verify NAT Gateways are active
aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID"
```

### 2. Test Load Balancer

```bash
# Get ALB DNS name
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name migration-infrastructure-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text)

# Test health endpoint (wait for instances to be healthy)
curl http://$ALB_DNS/health
```

### 3. Verify Auto Scaling Group

```bash
# Get ASG name
ASG_NAME=$(aws cloudformation describe-stacks \
  --stack-name migration-infrastructure-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`AutoScalingGroupName`].OutputValue' \
  --output text)

# Check ASG status
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names $ASG_NAME

# List instances
aws autoscaling describe-auto-scaling-instances \
  --query "AutoScalingInstances[?AutoScalingGroupName=='$ASG_NAME']"
```

### 4. Verify RDS Database

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name migration-infrastructure-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`RDSEndpoint`].OutputValue' \
  --output text)

# Check RDS instance status
aws rds describe-db-instances \
  --db-instance-identifier migration-postgres-prod \
  --query 'DBInstances[0].[DBInstanceStatus,MultiAZ,BackupRetentionPeriod]'
```

### 5. Test Secrets Manager Integration

```bash
# Get secret ARN
SECRET_ARN=$(aws cloudformation describe-stacks \
  --stack-name migration-infrastructure-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`DBSecretArn`].OutputValue' \
  --output text)

# Retrieve secret value
aws secretsmanager get-secret-value \
  --secret-id $SECRET_ARN \
  --query SecretString \
  --output text | jq .
```

### 6. Verify Security Groups

```bash
# List security groups
aws ec2 describe-security-groups \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'SecurityGroups[*].[GroupName,GroupId]'

# Check ALB security group rules
aws ec2 describe-security-groups \
  --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=migration-alb-sg-prod" \
  --query 'SecurityGroups[0].IpPermissions'
```

## Blue-Green Deployment Process

To perform a blue-green deployment:

### 1. Deploy to Green Target Group

```bash
# Get green target group ARN
GREEN_TG=$(aws cloudformation describe-stacks \
  --stack-name migration-infrastructure-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`GreenTargetGroupArn`].OutputValue' \
  --output text)

# Create new launch template version with updated application
# Update ASG to use green target group
aws autoscaling attach-load-balancer-target-groups \
  --auto-scaling-group-name $ASG_NAME \
  --target-group-arns $GREEN_TG
```

### 2. Switch Traffic

```bash
# Get ALB listener ARN
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names migration-alb-prod \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn $ALB_ARN \
  --query 'Listeners[0].ListenerArn' \
  --output text)

# Modify listener to forward to green target group
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$GREEN_TG
```

### 3. Rollback if Needed

```bash
# Get blue target group ARN
BLUE_TG=$(aws cloudformation describe-stacks \
  --stack-name migration-infrastructure-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`BlueTargetGroupArn`].OutputValue' \
  --output text)

# Switch back to blue
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$BLUE_TG
```

## Cleanup

To delete the stack and all resources:

```bash
aws cloudformation delete-stack \
  --stack-name migration-infrastructure-prod \
  --region us-east-1
```

Note: RDS deletion may take several minutes. Monitor with:

```bash
aws cloudformation describe-stack-events \
  --stack-name migration-infrastructure-prod \
  --max-items 20
```

## Security Best Practices Implemented

1. **Encryption at Rest**: RDS storage is encrypted using AWS KMS
2. **Encryption in Transit**: Use HTTPS for ALB (configure SSL certificate)
3. **Least Privilege**: Security groups restrict traffic to only necessary ports and sources
4. **Secret Management**: Database credentials stored in Secrets Manager with automatic rotation
5. **Network Isolation**: Database in private subnets, no public accessibility
6. **Multi-AZ**: RDS deployed across multiple availability zones for high availability
7. **Automated Backups**: 7-day retention with automated backups
8. **Monitoring**: CloudWatch Logs enabled for RDS PostgreSQL
9. **IAM Roles**: Instance profiles used instead of storing credentials on instances
10. **Deletion Protection**: Can be enabled for production by setting DeletionProtection: true

## Cost Optimization Tips

1. **NAT Gateways**: Consider using NAT instances for development environments
2. **RDS Instance Class**: Use db.t3.micro for testing, scale up for production
3. **Auto Scaling**: Adjust min/max/desired capacity based on actual load
4. **Reserved Instances**: Purchase RIs for predictable long-term workloads
5. **S3 Gateway Endpoint**: Add VPC endpoint for S3 to avoid NAT Gateway charges

## Production Readiness Checklist

- [x] Multi-AZ deployment for high availability
- [x] Automated backups configured (7 days)
- [x] Secrets rotation enabled
- [x] Security groups follow least privilege
- [x] Encryption at rest enabled
- [x] CloudWatch Logs enabled
- [x] All resources properly tagged
- [x] EnvironmentSuffix applied for uniqueness
- [x] Blue-green deployment support
- [x] Health checks configured
- [ ] SSL certificate configured for HTTPS (add ACM certificate ARN)
- [ ] CloudWatch alarms for monitoring (add as needed)
- [ ] Backup verification process (implement)
- [ ] Disaster recovery plan (document)
- [ ] Enable DeletionProtection for production RDS

## Troubleshooting

### Instances Not Passing Health Checks

1. Check security group rules allow traffic from ALB
2. Verify application is listening on port 8080
3. Ensure /health endpoint returns 200 status
4. Check CloudWatch Logs for application errors
5. Use Systems Manager Session Manager to connect to instances

### RDS Connection Issues

1. Verify security group allows port 5432 from app servers
2. Check RDS is in available state
3. Retrieve correct endpoint from stack outputs
4. Verify credentials from Secrets Manager
5. Test connection from EC2 instance in same VPC

### Secret Rotation Failures

1. Check Lambda function logs in CloudWatch
2. Verify Lambda has network access to RDS
3. Ensure IAM permissions are correct
4. Test manual secret update

## Support and Maintenance

For ongoing maintenance:
- Monitor CloudWatch metrics and alarms
- Review RDS performance insights
- Rotate secrets regularly (automated every 30 days)
- Apply security patches via Auto Scaling group rolling updates
- Review and optimize costs monthly
- Test disaster recovery procedures quarterly
