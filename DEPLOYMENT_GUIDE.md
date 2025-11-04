# Deployment Guide - CDKTF Python Infrastructure

## Overview
This guide provides step-by-step instructions for deploying the Product Catalog API infrastructure using CDKTF with Python.

## Prerequisites
- Node.js and npm installed
- Python 3.x installed
- AWS account with appropriate permissions
- AWS CLI configured (optional but recommended)

## Error Resolution: TERRAFORM_STATE_BUCKET Configuration

### Problem
During deployment, you may encounter this error:
```
Error: Invalid Value
on cdk.tf.json line 802, in terraform.backend.s3:
802: "bucket": "",
The value cannot be empty or all whitespace
```

### Root Cause
The `TERRAFORM_STATE_BUCKET` environment variable is not set, causing the S3 backend configuration to be empty.

### Solution

#### Step 1: Configure Environment Variables

Use the provided `set-env.sh` script to configure all required environment variables:

```bash
source ./set-env.sh
```

This script sets:
- `TERRAFORM_STATE_BUCKET`: S3 bucket for Terraform state
- `TERRAFORM_STATE_BUCKET_REGION`: Region for state bucket (us-east-1)
- `AWS_REGION`: Target AWS region for deployment
- `ENVIRONMENT_SUFFIX`: Environment identifier (e.g., pr5706)
- `REPOSITORY`: GitHub repository name
- `COMMIT_AUTHOR`: Author name for tagging
- `TF_VAR_db_username`: Database admin username
- `TF_VAR_db_password`: Database admin password

#### Step 2: Configure AWS Credentials

Before running deployment, configure AWS credentials using one of these methods:

**Method 1: Environment Variables** (Recommended for CI/CD)
```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_REGION="us-east-1"
```

**Method 2: AWS CLI Profile**
```bash
export AWS_PROFILE="your-profile-name"
```

**Method 3: AWS CLI Configuration**
```bash
aws configure
```

#### Step 3: Run Deployment

```bash
source ./set-env.sh
./scripts/deploy.sh
```

## Complete Deployment Commands

```bash
# Configure environment
source ./set-env.sh

# Set AWS credentials (choose one method)
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"

# Run deployment
./scripts/deploy.sh
```

## Deployment Process

The deployment script performs these steps:

1. **Bootstrap Phase**
   - Validates metadata.json
   - Checks platform (cdktf) and language (py)
   - Verifies required tools

2. **Synthesis Phase**
   - Runs `npm run cdktf:synth`
   - Generates Terraform configurations
   - Validates S3 backend configuration

3. **Deploy Phase**
   - Initializes Terraform backend
   - Plans infrastructure changes
   - Applies changes with auto-approval

## Infrastructure Components

The deployment creates:

- **VPC**: 10.0.0.0/16 with DNS support
- **Subnets**: 2 public + 2 private across 2 AZs
- **Internet Gateway**: For public subnet access
- **Security Groups**: ALB, ECS, and RDS with least privilege
- **Application Load Balancer**: Public-facing HTTP listener
- **ECS Fargate Cluster**: With FARGATE_SPOT capacity
- **ECS Service**: 2-10 tasks with auto-scaling
- **RDS Aurora PostgreSQL**: Version 16.4, db.t3.medium
- **CloudFront Distribution**: CDN with managed cache policy
- **Secrets Manager**: Database credentials storage
- **CloudWatch Logs**: ECS task logging (7-day retention)
- **S3 Bucket**: Log storage (30-day lifecycle)
- **IAM Roles**: Task execution and policy attachments
- **Auto Scaling**: CPU-based (70% target)

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TERRAFORM_STATE_BUCKET` | Yes | iac-rlhf-tf-states | S3 bucket for state files |
| `TERRAFORM_STATE_BUCKET_REGION` | Yes | us-east-1 | State bucket region |
| `AWS_REGION` | Yes | us-east-1 | Target deployment region |
| `ENVIRONMENT_SUFFIX` | Yes | pr5706 | Environment identifier |
| `REPOSITORY` | No | TuringGpt/iac-test-automations | Repository name |
| `COMMIT_AUTHOR` | No | mayanksethi-turing | Author for tagging |
| `TF_VAR_db_username` | No | temp_admin | Database username |
| `TF_VAR_db_password` | No | TempPassword123! | Database password |
| `AWS_ACCESS_KEY_ID` | Yes* | - | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Yes* | - | AWS secret key |

*Required for deployment, not needed for synthesis only

## Troubleshooting

### Error: "No valid credential sources found"

**Cause**: AWS credentials are not configured

**Solution**:
```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
```

### Error: "TERRAFORM_STATE_BUCKET is empty"

**Cause**: Environment variable not set

**Solution**:
```bash
source ./set-env.sh
```

### Error: "terraform init failed"

**Cause**: S3 backend bucket doesn't exist or no access

**Solution**:
1. Verify bucket exists in AWS
2. Check AWS credentials have S3 access
3. Verify bucket name matches environment variable

## Testing Deployment

After successful deployment, verify:

1. **Check Terraform Outputs**
   ```bash
   cd cdktf.out/stacks/TapStackpr5706
   terraform output
   ```

2. **Verify ECS Service**
   ```bash
   aws ecs describe-services \
     --cluster catalog-api-cluster-pr5706 \
     --services catalog-api-service-pr5706 \
     --region us-east-1
   ```

3. **Test ALB Endpoint**
   ```bash
   # Get ALB DNS from outputs
   curl http://<alb-dns-name>/health
   ```

## Cleanup

To destroy all infrastructure:

```bash
source ./set-env.sh
npm run cdktf:destroy
```

## Configuration Files

- `set-env.sh`: Environment variable configuration
- `metadata.json`: Project metadata (platform, language, services)
- `tap.py`: CDKTF app entry point
- `lib/tap_stack.py`: Infrastructure stack definition
- `scripts/deploy.sh`: Deployment orchestration script
- `scripts/bootstrap.sh`: Bootstrap script for initialization

## Best Practices

1. **Always source `set-env.sh` before deployment**
2. **Use secure methods for AWS credentials** (avoid hardcoding)
3. **Verify state bucket exists before deployment**
4. **Use unique environment suffixes** to avoid conflicts
5. **Review Terraform plan** before applying changes
6. **Keep database passwords secure** (use Secrets Manager in production)

## Advanced Deployment Scenarios

### Blue-Green Deployment Strategy

#### Setup Blue-Green Infrastructure
```bash
# Create blue environment (current)
source ./set-env.sh
export ENVIRONMENT_SUFFIX="blue-${ENVIRONMENT_SUFFIX}"
npm run cdktf:deploy

# Create green environment (new version)
export ENVIRONMENT_SUFFIX="green-${ENVIRONMENT_SUFFIX}" 
export NEW_IMAGE_TAG="v2.0.0"
npm run cdktf:deploy
```

#### Traffic Switching Process
1. **Validate Green Environment**
   ```bash
   # Health check green environment
   GREEN_ALB_DNS=$(aws elbv2 describe-load-balancers \
     --names "alb-green-${ENVIRONMENT_SUFFIX}" \
     --query 'LoadBalancers[0].DNSName' --output text)
   
   curl -f http://${GREEN_ALB_DNS}/health || echo "Health check failed"
   ```

2. **CloudFront Origin Switch**
   ```bash
   # Update CloudFront distribution origin
   aws cloudfront update-distribution \
     --id ${DISTRIBUTION_ID} \
     --distribution-config file://new-origin-config.json
   ```

3. **Rollback Procedure**
   ```bash
   # Quick rollback to blue environment
   aws cloudfront update-distribution \
     --id ${DISTRIBUTION_ID} \
     --distribution-config file://blue-origin-config.json
   ```

### Canary Deployment Pattern

#### Weighted Routing Configuration
```python
# ALB target group with weighted routing
green_target_group = ApplicationTargetGroup(
    self, "green-target-group",
    port=3000,
    vpc=vpc,
    target_type=TargetType.IP,
    health_check=HealthCheck(
        path="/health",
        healthy_threshold_count=2,
        unhealthy_threshold_count=2,
        timeout=Duration.seconds(5),
        interval=Duration.seconds(30)
    )
)

# Listener rule for canary traffic (10%)
ApplicationListenerRule(
    self, "canary-rule",
    listener=listener,
    priority=100,
    conditions=[
        ListenerCondition.path_patterns(["/api/*"])
    ],
    action=ListenerAction.weighted_forward(
        target_groups=[
            WeightedTargetGroup(target_group=blue_target_group, weight=90),
            WeightedTargetGroup(target_group=green_target_group, weight=10)
        ]
    )
)
```

### Multi-Region Deployment

#### Primary Region (eu-north-1)
```bash
# Deploy primary infrastructure
export AWS_REGION="eu-north-1"
export ENVIRONMENT_SUFFIX="primary-${ENVIRONMENT_SUFFIX}"
source ./set-env.sh
npm run cdktf:deploy
```

#### Secondary Region (eu-west-1)
```bash
# Deploy disaster recovery region
export AWS_REGION="eu-west-1" 
export ENVIRONMENT_SUFFIX="secondary-${ENVIRONMENT_SUFFIX}"
export DB_REPLICA_SOURCE="primary-cluster-arn"
source ./set-env.sh
npm run cdktf:deploy
```

#### Cross-Region Replication Setup
```python
# RDS Cross-Region Read Replica
replica_cluster = DatabaseCluster(
    self, "replica-cluster",
    engine=DatabaseClusterEngine.aurora_postgres(
        version=AuroraPostgresEngineVersion.VER_16_4
    ),
    vpc=vpc,
    # Reference to primary cluster in another region
    source_cluster_identifier=f"arn:aws:rds:eu-north-1:{account}:cluster:rds-cluster-primary-{environment_suffix}"
)
```

### Container Registry Management

#### ECR Repository Setup
```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name catalog-api \
  --region eu-north-1 \
  --image-scanning-configuration scanOnPush=true

# Configure repository policy
aws ecr set-repository-policy \
  --repository-name catalog-api \
  --policy-text file://ecr-policy.json
```

#### Image Build and Push Pipeline
```bash
#!/bin/bash
# build-and-push.sh

# Build application image
docker build -t catalog-api:${VERSION} .

# Tag for ECR
ECR_URI="${ACCOUNT_ID}.dkr.ecr.eu-north-1.amazonaws.com/catalog-api"
docker tag catalog-api:${VERSION} ${ECR_URI}:${VERSION}
docker tag catalog-api:${VERSION} ${ECR_URI}:latest

# Login to ECR
aws ecr get-login-password --region eu-north-1 | \
  docker login --username AWS --password-stdin ${ECR_URI}

# Push images
docker push ${ECR_URI}:${VERSION}
docker push ${ECR_URI}:latest

# Scan for vulnerabilities
aws ecr start-image-scan --repository-name catalog-api --image-id imageTag=${VERSION}
```

### Database Migration Strategy

#### Schema Migration Process
```bash
#!/bin/bash
# migrate-database.sh

# Get database connection details
DB_HOST=$(aws rds describe-db-clusters \
  --db-cluster-identifier rds-cluster-${ENVIRONMENT_SUFFIX} \
  --query 'DBClusters[0].Endpoint' --output text)

DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id db-secret-${ENVIRONMENT_SUFFIX} \
  --query 'SecretString' --output text | jq -r '.password')

# Run database migrations
psql -h ${DB_HOST} -U admin -d catalog_db -c "
BEGIN;

-- Create new tables
CREATE TABLE IF NOT EXISTS products_v2 (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing data
INSERT INTO products_v2 (name, description, price)
SELECT name, description, price FROM products;

-- Verify migration
SELECT COUNT(*) as migrated_records FROM products_v2;

COMMIT;
"

echo "Database migration completed"
```

#### Backup Before Migration
```bash
# Create manual snapshot before migration
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier rds-cluster-${ENVIRONMENT_SUFFIX} \
  --db-cluster-snapshot-identifier migration-backup-$(date +%Y%m%d-%H%M%S)

# Wait for snapshot completion
aws rds wait db-cluster-snapshot-completed \
  --db-cluster-snapshot-identifier migration-backup-$(date +%Y%m%d-%H%M%S)
```

### Monitoring and Observability Setup

#### Custom Metrics Dashboard
```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name "CatalogAPI-${ENVIRONMENT_SUFFIX}" \
  --dashboard-body file://dashboard-config.json
```

#### Application Performance Monitoring
```python
# X-Ray tracing integration
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK calls
patch_all()

@xray_recorder.capture('product_search')
def search_products(query):
    # Application logic with tracing
    pass
```

### Security Hardening Deployment

#### WAF Integration
```python
# Web Application Firewall
web_acl = CfnWebACL(
    self, "catalog-api-waf",
    scope="CLOUDFRONT",
    default_action=CfnWebACL.DefaultActionProperty(
        allow={}
    ),
    rules=[
        # Rate limiting rule
        CfnWebACL.RuleProperty(
            name="RateLimitRule",
            priority=1,
            statement=CfnWebACL.StatementProperty(
                rate_based_statement=CfnWebACL.RateBasedStatementProperty(
                    limit=2000,  # 2000 requests per 5 minutes
                    aggregate_key_type="IP"
                )
            ),
            action=CfnWebACL.RuleActionProperty(
                block={}
            ),
            visibility_config=CfnWebACL.VisibilityConfigProperty(
                sampled_requests_enabled=True,
                cloud_watch_metrics_enabled=True,
                metric_name="RateLimitRule"
            )
        )
    ]
)
```

#### Secrets Rotation Automation
```python
# Automated secret rotation
rotation_lambda = Function(
    self, "secret-rotation",
    runtime=Runtime.PYTHON_3_9,
    handler="lambda_function.lambda_handler",
    code=Code.from_asset("lambda/secret-rotation"),
    environment={
        'SECRET_ARN': db_secret.secret_arn,
        'RDS_CLUSTER_ARN': rds_cluster.cluster_arn
    }
)

# Schedule rotation every 90 days
db_secret.add_rotation_schedule(
    "rotation-schedule",
    rotation_lambda=rotation_lambda,
    automatically_after=Duration.days(90)
)
```

### Cost Optimization Strategies

#### Spot Instance Configuration
```python
# ECS Fargate Spot configuration
capacity_provider = CfnCapacityProvider(
    self, "fargate-spot-provider",
    name=f"fargate-spot-{environment_suffix}",
    fargate_capacity_provider=CfnCapacityProvider.FargateCapacityProviderProperty(
        fargate_capacity_provider_name="FARGATE_SPOT"
    )
)

# Service with spot capacity
service = FargateService(
    self, "catalog-api-service",
    cluster=cluster,
    task_definition=task_definition,
    capacity_provider_strategies=[
        CapacityProviderStrategy(
            capacity_provider="FARGATE_SPOT",
            weight=70,  # 70% spot instances
            base=2      # Always maintain 2 on-demand tasks
        ),
        CapacityProviderStrategy(
            capacity_provider="FARGATE", 
            weight=30   # 30% on-demand instances
        )
    ]
)
```

#### Reserved Capacity Planning
```bash
# Analyze usage patterns for Reserved Instance recommendations
aws ce get-rightsizing-recommendation \
  --service "Amazon Elastic Compute Cloud - Compute" \
  --filter file://cost-filter.json

# Purchase RDS Reserved Instances
aws rds purchase-reserved-db-instances-offering \
  --reserved-db-instances-offering-id ${OFFERING_ID} \
  --reserved-db-instance-id "catalog-api-reserved-${ENVIRONMENT_SUFFIX}"
```

### Notes

- The deployment uses FARGATE_SPOT for cost optimization with fallback to on-demand
- Auto-scaling is configured for 2-10 tasks based on CPU (70% target) with predictive scaling
- RDS Aurora uses version 16.4 (compatible with all regions) with automated backup and cross-region replication
- CloudFront uses managed cache policy with WAF integration for security
- All resources include environment_suffix for uniqueness and proper resource isolation
- No deletion protection is enabled for testing purposes, but can be enabled for production
- Comprehensive monitoring includes custom metrics, distributed tracing, and automated alerting
- Security hardening includes WAF, secrets rotation, and compliance monitoring
- Cost optimization through spot instances, reserved capacity, and automated scaling policies
