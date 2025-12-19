# Deployment Guide - Multi-Environment Infrastructure

This guide explains the deployment process and post-deployment steps for the multi-environment infrastructure.

## Table of Contents

1. [Initial Deployment](#initial-deployment)
2. [ECS Desired Count Configuration](#ecs-desired-count-configuration)
3. [Post-Deployment Steps](#post-deployment-steps)
4. [Environment-Specific Configurations](#environment-specific-configurations)
5. [Security Considerations](#security-considerations)

---

## Initial Deployment

The infrastructure is deployed using CDKTF (Terraform CDK) with TypeScript. To deploy:

```bash
# Set environment variables
export AWS_PROFILE=your-profile
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=dev  # or staging, prod, pr-branch-name

# Deploy infrastructure
./scripts/deploy.sh
```

---

## ECS Desired Count Configuration

### Why is `desiredCount` set to 0?

In `lib/ecs-construct.ts:272`, the ECS Service is intentionally created with `desiredCount: 0`:

```typescript
const service = new EcsService(this, 'service', {
  name: `app-service-${props.environmentName}-${props.environmentSuffix}`,
  cluster: cluster.id,
  taskDefinition: taskDef.arn,
  desiredCount: 0,  // ⚠️ Set to 0 initially
  // ...
});
```

**Reason**: This prevents ECS tasks from failing during initial deployment when no container image exists in the ECR repository yet. If `desiredCount > 0` and no image is available, ECS will continuously try to start tasks and fail, creating noise in logs and alarms.

### Post-Deployment: Enabling ECS Tasks

After deploying the infrastructure, follow these steps to enable your application:

#### Step 1: Build and Push Container Image

```bash
# Navigate to your application directory
cd your-application/

# Build Docker image
docker build -t myapp:latest .

# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag image for ECR (use the ECR repository URL from outputs)
docker tag myapp:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/app-repo-${ENVIRONMENT_SUFFIX}:latest

# Push to ECR
docker push \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/app-repo-${ENVIRONMENT_SUFFIX}:latest
```

#### Step 2: Update ECS Service Desired Count

After the container image is successfully pushed to ECR, update the desired count:

**Option A: Update via AWS CLI**
```bash
# Get the service name from outputs
export SERVICE_NAME="app-service-dev-${ENVIRONMENT_SUFFIX}"
export CLUSTER_NAME="app-cluster-dev-${ENVIRONMENT_SUFFIX}"

# Update desired count
aws ecs update-service \
  --cluster ${CLUSTER_NAME} \
  --service ${SERVICE_NAME} \
  --desired-count 1 \
  --region us-east-1
```

**Option B: Update via Terraform** (Recommended for prod)

Modify `lib/tap-stack.ts` to use environment-specific desired counts from configuration:

```typescript
// In tap-stack.ts, update ECS construct call:
const ecs = new EcsConstruct(this, 'Ecs', {
  // ...
  desiredCount: envConfig.ecs.desiredCount,  // Use config instead of 0
  // ...
});
```

Then run deployment again:
```bash
./scripts/deploy.sh
```

#### Step 3: Verify Application is Running

```bash
# Check service status
aws ecs describe-services \
  --cluster ${CLUSTER_NAME} \
  --services ${SERVICE_NAME} \
  --region us-east-1

# Check task status
aws ecs list-tasks \
  --cluster ${CLUSTER_NAME} \
  --service-name ${SERVICE_NAME} \
  --region us-east-1

# Get ALB DNS name from outputs
export ALB_DNS=$(cat cfn-outputs/flat-outputs.json | jq -r '.TapStack'${ENVIRONMENT_SUFFIX}'.alb_dns_name')

# Test application endpoint
curl http://${ALB_DNS}/health
```

---

## Environment-Specific Configurations

The infrastructure supports three environment types with different configurations:

### Development (`dev`)
- **VPC CIDR**: `10.1.0.0/16`
- **RDS**: 1 writer instance, 0 read replicas, `db.t3.medium`
- **ECS**: 1 task, 256 CPU / 512 MB RAM
- **Purpose**: Testing, feature development
- **Cost**: ~$50-100/month

### Staging (`staging`)
- **VPC CIDR**: `10.2.0.0/16`
- **RDS**: 1 writer instance, **1 read replica**, `db.t3.large`
- **ECS**: 2 tasks, 512 CPU / 1024 MB RAM
- **Purpose**: Pre-production testing, QA validation
- **Cost**: ~$150-250/month

### Production (`prod`)
- **VPC CIDR**: `10.3.0.0/16`
- **RDS**: 2 writer instances, **2 read replicas** (HA), `db.r5.large`
- **ECS**: 3 tasks, 1024 CPU / 2048 MB RAM
- **Purpose**: Live production workloads
- **Cost**: ~$500-800/month

**Note**: Read replicas provide:
- Improved read performance by distributing queries
- High availability for database reads
- Reduced load on primary instance

### RDS Read Replica Architecture

The infrastructure implements **intra-cluster read replicas** for staging and production environments:

- **Dev Environment**: No read replicas (cost optimization)
- **Staging Environment**: 1 read replica within the same Aurora cluster
- **Production Environment**: 2 read replicas within the same Aurora cluster (HA)

**Important**: These read replicas are within each environment's own Aurora cluster, not cross-environment replicas. Each environment (dev, staging, prod) has its own isolated Aurora cluster within its own VPC.

### Cross-Environment Data Replication

For **cross-environment data replication** (e.g., production data to staging for testing), Aurora PostgreSQL within the same region requires one of the following approaches:

#### Option 1: Aurora Database Cloning (Recommended)
Fast, cost-effective copy-on-write clones for testing:

```bash
# Clone production database to staging
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier aurora-prod-${PROD_SUFFIX} \
  --db-cluster-identifier aurora-staging-clone-${TIMESTAMP} \
  --restore-type copy-on-write \
  --use-latest-restorable-time \
  --vpc-security-group-ids ${STAGING_SG_ID} \
  --db-subnet-group-name aurora-subnet-staging-${STAGING_SUFFIX} \
  --region us-east-1
```

**Pros**: Fast (minutes), minimal storage cost initially
**Cons**: Point-in-time copy, not live replication

#### Option 2: Snapshot Restore
Restore production snapshots to staging:

```bash
# Create snapshot of production
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier aurora-prod-${PROD_SUFFIX} \
  --db-cluster-snapshot-identifier prod-snapshot-${DATE} \
  --region us-east-1

# Restore to staging (different VPC)
aws rds restore-db-cluster-from-snapshot \
  --db-cluster-identifier aurora-staging-restored \
  --snapshot-identifier prod-snapshot-${DATE} \
  --engine aurora-postgresql \
  --vpc-security-group-ids ${STAGING_SG_ID} \
  --db-subnet-group-name aurora-subnet-staging-${STAGING_SUFFIX} \
  --region us-east-1
```

**Pros**: Simple, proven approach
**Cons**: Slower than cloning, point-in-time only

#### Option 3: AWS Database Migration Service (DMS)
For continuous replication between environments:

1. Create VPC peering between prod and staging VPCs
2. Update security groups to allow cross-VPC database access
3. Set up DMS replication instance
4. Configure ongoing replication from prod to staging

**Pros**: Continuous near-real-time replication
**Cons**: Additional cost (~$0.145/hour for t3.medium), complex setup

#### Option 4: PostgreSQL Logical Replication
Native PostgreSQL replication (advanced):

1. Enable logical replication in Aurora parameter group
2. Create publication on prod cluster
3. Create subscription on staging cluster
4. Requires VPC peering and security group updates

**Pros**: Native PostgreSQL feature, no additional AWS service
**Cons**: Complex configuration, network setup required

### Recommendation

- **Development/Testing**: Use Aurora cloning (Option 1) for periodic refreshes
- **Continuous Integration**: Use DMS (Option 3) if staging needs near-real-time prod data
- **Cost-Sensitive**: Use snapshot restore (Option 2) for occasional data refreshes

---

## Post-Deployment Steps

### 1. Retrieve Generated Passwords

The Aurora master password is randomly generated and stored in SSM Parameter Store:

```bash
# Retrieve master password
aws ssm get-parameter \
  --name "/${ENVIRONMENT_SUFFIX}/aurora/master-password" \
  --with-decryption \
  --region us-east-1 \
  --query 'Parameter.Value' \
  --output text

# Save to password manager (recommended)
```

### 2. Configure Application Environment Variables

Update your application with the database connection details:

```bash
# Get Aurora endpoint from outputs
export DB_ENDPOINT=$(cat cfn-outputs/flat-outputs.json | \
  jq -r '.TapStack'${ENVIRONMENT_SUFFIX}'.aurora_cluster_endpoint')

# Application environment variables
DB_HOST=${DB_ENDPOINT}
DB_PORT=5432
DB_NAME=appdb
DB_USER=dbadmin
DB_PASSWORD=<from-ssm-parameter>
```

### 3. Initialize Database Schema

After the first deployment and before setting `desiredCount > 0`:

```bash
# Connect to Aurora cluster
psql -h ${DB_ENDPOINT} -U dbadmin -d appdb

# Run migration scripts
# Or use your application's migration tool (e.g., Flyway, Liquibase, Alembic)
```

### 4. Configure CloudWatch Alarms

The infrastructure creates CloudWatch alarms automatically, but you may want to configure SNS notifications:

```bash
# Create SNS topic for alarm notifications
aws sns create-topic \
  --name infrastructure-alarms-${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# Subscribe email to topic
aws sns subscribe \
  --topic-arn <topic-arn> \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-1

# Update alarms to send to SNS (manual step or update monitoring-construct.ts)
```

### 5. Enable HTTPS (Optional, Recommended for Production)

The infrastructure supports HTTPS via ACM certificates. To enable:

1. **Request ACM certificate for your domain:**

```bash
# Request certificate
aws acm request-certificate \
  --domain-name example.com \
  --validation-method DNS \
  --region us-east-1 \
  --query 'CertificateArn' \
  --output text
```

2. **Validate the certificate** (add DNS records as prompted)

3. **Update environment configuration** in `lib/tap-stack.ts`:

```typescript
// Add certificate ARN to environment config
interface EnvironmentConfig {
  name: string;
  cidrBase: number;
  rds: { /* ... */ };
  ecs: { /* ... */ };
  alarms: { /* ... */ };
  certificateArn?: string; // Add this
}

// Then configure per environment:
const environmentConfigs: Record<string, EnvironmentConfig> = {
  prod: {
    // ... existing config
    certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/...',
  },
  // ... other environments
};
```

4. **Pass certificate to ECS construct** in `tap-stack.ts`:

```typescript
const ecs = new EcsConstruct(this, 'Ecs', {
  // ... existing props
  certificateArn: envConfig.certificateArn, // Add this line
});
```

5. **Redeploy** the infrastructure:

```bash
./scripts/deploy.sh
```

**What happens when HTTPS is enabled:**
- HTTPS listener created on port 443 with TLS 1.2+
- HTTP listener automatically redirects to HTTPS (301 redirect)
- ALB handles SSL/TLS termination
- Backend communication remains HTTP (ALB → ECS tasks)

---

## Security Considerations

### 1. Aurora Master Password

- ✅ **Randomly generated** (32 characters, mixed case, numbers, special chars)
- ✅ Stored securely in SSM Parameter Store as `SecureString`
- ✅ Unique per environment
- ⚠️ **Action Required**: Rotate passwords regularly (every 90 days)

```bash
# To rotate password, generate new random password and update:
aws rds modify-db-cluster \
  --db-cluster-identifier aurora-${ENV_NAME}-${ENV_SUFFIX} \
  --master-user-password <new-password> \
  --apply-immediately \
  --region us-east-1

# Update SSM parameter
aws ssm put-parameter \
  --name "/${ENVIRONMENT_SUFFIX}/aurora/master-password" \
  --value <new-password> \
  --type SecureString \
  --overwrite \
  --region us-east-1
```

### 2. Network Security

- ✅ RDS in private subnets only
- ✅ Security groups restrict access to VPC CIDR only
- ✅ ECS tasks in private subnets with NAT gateway for egress
- ✅ ALB in public subnets for internet access
- ✅ **VPC Flow Logs enabled** - All network traffic logged to CloudWatch
- ✅ HTTPS/TLS 1.2+ support via ACM certificates (optional, configurable)

**VPC Flow Logs**: The infrastructure automatically enables VPC Flow Logs for all network traffic:
- **Destination**: CloudWatch Logs (`/aws/vpc/flowlogs/${ENV_NAME}-${ENV_SUFFIX}`)
- **Traffic Type**: ALL (accepted, rejected, and all traffic)
- **Retention**: 7 days (configurable in `vpc-construct.ts`)
- **Use Cases**:
  - Security analysis and threat detection
  - Network troubleshooting
  - Compliance auditing

To query flow logs:
```bash
# View recent flow logs
aws logs tail /aws/vpc/flowlogs/${ENV_NAME}-${ENV_SUFFIX} \
  --follow \
  --region us-east-1

# Search for rejected connections
aws logs filter-log-events \
  --log-group-name /aws/vpc/flowlogs/${ENV_NAME}-${ENV_SUFFIX} \
  --filter-pattern "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action=REJECT, flowlogstatus]" \
  --region us-east-1
```

### 3. S3 Bucket Security

- ✅ Encryption at rest (AES-256)
- ✅ Public access blocked (all 4 settings)
- ✅ Lifecycle policies for cost optimization

### 4. IAM Best Practices

- ✅ Least-privilege IAM roles for ECS tasks
- ✅ Task execution role for pulling images
- ✅ Task role for application permissions (S3 access)

---

## Troubleshooting

### ECS Tasks Not Starting

**Problem**: Tasks fail to start after setting `desiredCount > 0`

**Solutions**:
1. Verify image exists in ECR: `aws ecr list-images --repository-name app-repo-${ENV_SUFFIX}`
2. Check ECS task logs: `aws logs tail /ecs/${ENV_NAME}-${ENV_SUFFIX} --follow`
3. Verify task definition: `aws ecs describe-task-definition --task-definition app-task-${ENV_NAME}-${ENV_SUFFIX}`

### Cannot Connect to RDS

**Problem**: Application cannot connect to Aurora database

**Solutions**:
1. Verify security group allows VPC CIDR: Check `aurora-sg` ingress rules
2. Verify correct endpoint: Should be `aurora-${ENV_NAME}-${ENV_SUFFIX}.cluster-*.rds.amazonaws.com`
3. Check password: Retrieve from SSM and verify it matches what application is using
4. Verify subnet connectivity: ECS tasks must be in private subnets with NAT gateway access

### High Costs

**Problem**: Monthly AWS costs higher than expected

**Solutions**:
1. Scale down dev environments when not in use
2. Use EC2 Spot instances for non-critical environments (requires code changes)
3. Reduce RDS instance sizes for dev
4. Review S3 lifecycle policies
5. Consider using Aurora Serverless v2 for variable workloads

---

## Cleanup

To destroy all infrastructure:

```bash
export AWS_PROFILE=your-profile
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=dev

./scripts/destroy.sh
```

⚠️ **Warning**: This will permanently delete all resources including databases. Ensure you have backups if needed.

---

## Additional Resources

- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Aurora Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)
- [VPC Design Best Practices](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-design.html)
- [Terraform CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)
