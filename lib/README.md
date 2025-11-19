# Machine Learning API Infrastructure

Production-ready infrastructure for deploying a scalable ML API service on AWS using Pulumi with Python.

## Overview

This infrastructure stack deploys a highly available, auto-scaling machine learning API service with:

- **Compute**: ECS Fargate with Spot instances (70%) for cost optimization
- **Networking**: VPC with public/private subnets across 3 availability zones
- **Load Balancing**: Application Load Balancer with path-based routing and health checks
- **Database**: RDS Aurora Serverless v2 PostgreSQL for metadata storage
- **Session Storage**: DynamoDB with TTL and point-in-time recovery
- **Content Delivery**: CloudFront distribution with custom error pages
- **Monitoring**: CloudWatch Logs with 30-day retention
- **Auto-scaling**: 2-10 tasks based on ALB request count (target: 1000 req/task)
- **Security**: Least-privilege IAM roles and security group segmentation

## Architecture

```
Internet
   |
   v
CloudFront (HTTPS) --> ALB (HTTP) --> ECS Fargate Tasks (2-10)
                        |                    |
                   Public Subnets      Private Subnets
                                             |
                           +-----------------+----------------+
                           |                                  |
                    Aurora Serverless v2              DynamoDB Table
                    (PostgreSQL 15)                  (Session Storage)
```

## Prerequisites

1. **Pulumi CLI** (v3.x or later)
   ```bash
   curl -fsSL https://get.pulumi.com | sh
   ```

2. **Python** (3.9 or later)
   ```bash
   python3 --version
   ```

3. **AWS CLI** configured with appropriate credentials
   ```bash
   aws configure
   ```

4. **Python Dependencies**
   ```bash
   pip install pulumi pulumi-aws
   ```

## Configuration

Before deploying, configure the required settings:

### 1. Set Database Password

```bash
pulumi config set --secret db_password "YourStrongPassword123!"
```

### 2. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="test$(date +%s)"  # Unique suffix for resources
export AWS_REGION="us-east-1"                # Target AWS region
export REPOSITORY="iac-test-automations"     # Repository name
export TEAM="synth"                          # Team identifier
```

### 3. AWS Credentials

Ensure AWS credentials are configured:
```bash
aws sts get-caller-identity
```

## Deployment

### Quick Start

```bash
# 1. Initialize Pulumi stack (if not already initialized)
pulumi stack init dev

# 2. Preview changes
pulumi preview

# 3. Deploy infrastructure
pulumi up
```

### Step-by-Step Deployment

1. **Review the preview**
   ```bash
   pulumi preview
   ```
   This shows all resources that will be created (~45 resources).

2. **Deploy the stack**
   ```bash
   pulumi up
   ```
   Confirm with `yes` when prompted. Deployment takes approximately 10-15 minutes.

3. **Verify outputs**
   ```bash
   pulumi stack output
   ```

   Expected outputs:
   - `alb_dns_name`: ALB DNS endpoint
   - `cloudfront_domain_name`: CloudFront distribution domain
   - `cloudfront_distribution_url`: Full HTTPS URL
   - `rds_cluster_endpoint`: Aurora database endpoint
   - `dynamodb_table_name`: Session table name
   - `ecs_cluster_name`: ECS cluster name
   - `ecs_service_name`: ECS service name
   - `vpc_id`: VPC identifier

## Testing

### 1. Test ALB Health Endpoint

```bash
ALB_DNS=$(pulumi stack output alb_dns_name)
curl -I http://$ALB_DNS/health
```

Expected response: HTTP 200 OK (after tasks are healthy)

### 2. Test CloudFront Distribution

```bash
CF_URL=$(pulumi stack output cloudfront_distribution_url)
curl -I $CF_URL
```

Expected response: HTTPS with CloudFront headers

### 3. Check ECS Service Status

```bash
ECS_CLUSTER=$(pulumi stack output ecs_cluster_name)
ECS_SERVICE=$(pulumi stack output ecs_service_name)

aws ecs describe-services \
  --cluster $ECS_CLUSTER \
  --services $ECS_SERVICE \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'
```

Expected: `Status: ACTIVE`, `Running: 2`, `Desired: 2`

### 4. Verify Database Connectivity

```bash
RDS_ENDPOINT=$(pulumi stack output rds_cluster_endpoint)
echo "Database endpoint: $RDS_ENDPOINT"

# Test from within VPC or use bastion host
# psql -h $RDS_ENDPOINT -U dbadmin -d mlapi
```

### 5. Check DynamoDB Table

```bash
TABLE_NAME=$(pulumi stack output dynamodb_table_name)
aws dynamodb describe-table --table-name $TABLE_NAME \
  --query 'Table.{Name:TableName,Status:TableStatus,Billing:BillingModeSummary.BillingMode}'
```

Expected: `Status: ACTIVE`, `Billing: PAY_PER_REQUEST`

## Monitoring

### CloudWatch Logs

View ECS task logs:
```bash
aws logs tail /aws/ecs/ml-api-$ENVIRONMENT_SUFFIX --follow
```

View ALB logs:
```bash
aws logs tail /aws/alb/ml-api-$ENVIRONMENT_SUFFIX --follow
```

### ECS Container Insights

```bash
# View cluster metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=ml-api-cluster-$ENVIRONMENT_SUFFIX \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### Auto-scaling Activity

```bash
# View scaling activities
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --max-results 10
```

## Troubleshooting

### ECS Tasks Not Starting

1. Check task definition:
   ```bash
   aws ecs describe-task-definition \
     --task-definition ml-api-task-$ENVIRONMENT_SUFFIX
   ```

2. Check service events:
   ```bash
   aws ecs describe-services \
     --cluster ml-api-cluster-$ENVIRONMENT_SUFFIX \
     --services ml-api-service-$ENVIRONMENT_SUFFIX \
     --query 'services[0].events[0:5]'
   ```

3. Check CloudWatch logs for errors

### ALB Health Check Failing

1. Verify security group rules:
   ```bash
   # ALB should allow traffic to ECS security group on port 8080
   ```

2. Check target health:
   ```bash
   TG_ARN=$(aws elbv2 describe-target-groups \
     --names ml-api-tg-$ENVIRONMENT_SUFFIX \
     --query 'TargetGroups[0].TargetGroupArn' --output text)

   aws elbv2 describe-target-health --target-group-arn $TG_ARN
   ```

3. Ensure /health endpoint responds with HTTP 200

### Database Connection Issues

1. Verify RDS cluster status:
   ```bash
   aws rds describe-db-clusters \
     --db-cluster-identifier ml-api-aurora-cluster-$ENVIRONMENT_SUFFIX \
     --query 'DBClusters[0].Status'
   ```

2. Check security group rules (ECS SG → RDS SG on port 5432)

3. Verify database credentials in Pulumi config

### CloudFront Not Serving Content

1. Check distribution status:
   ```bash
   CF_ID=$(aws cloudfront list-distributions \
     --query "DistributionList.Items[?Comment=='ML API CloudFront distribution for $ENVIRONMENT_SUFFIX'].Id" \
     --output text)

   aws cloudfront get-distribution --id $CF_ID \
     --query 'Distribution.Status'
   ```

2. Wait for distribution to deploy (Status: Deployed)

3. Verify ALB is responding first (CloudFront origin)

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Confirm with `yes` when prompted. This will:
1. Delete CloudFront distribution
2. Terminate ECS tasks
3. Delete Aurora cluster (no final snapshot)
4. Delete DynamoDB table (no recovery after 30 days)
5. Remove all networking resources
6. Delete all IAM roles and policies

**Note**: Cleanup takes approximately 10-15 minutes due to CloudFront distribution deletion.

## Cost Estimation

Estimated monthly costs in us-east-1 with moderate usage:

| Service | Monthly Cost |
|---------|-------------|
| ECS Fargate (2-10 tasks) | $30-80 |
| Aurora Serverless v2 (0.5-2 ACU) | $40-100 |
| NAT Gateway | $32 |
| Application Load Balancer | $16-25 |
| DynamoDB (on-demand) | $5-15 |
| CloudFront | $5-20 |
| CloudWatch Logs | $2-5 |
| Data Transfer | $5-30 |
| **Total** | **$135-307** |

Cost optimization features:
- Fargate Spot: 60-70% savings on compute
- Aurora Serverless v2: Auto-scaling to 0.5 ACU minimum
- Single NAT Gateway: 66% savings vs per-AZ deployment
- On-demand DynamoDB: No provisioned capacity waste

## Infrastructure Components

### VPC Configuration
- **CIDR**: 10.0.0.0/16
- **Public Subnets**: 3 subnets (10.0.0-2.0/24) across AZs
- **Private Subnets**: 3 subnets (10.0.10-12.0/24) across AZs
- **NAT Gateway**: Single NAT in first public subnet
- **Internet Gateway**: For public subnet connectivity

### ECS Configuration
- **Launch Type**: Fargate
- **Capacity Provider**: 70% Spot, 30% Fargate (base: 2)
- **Task CPU**: 1024 (1 vCPU)
- **Task Memory**: 2048 MB
- **Network Mode**: awsvpc
- **Platform Version**: LATEST

### Load Balancer
- **Type**: Application Load Balancer
- **Scheme**: Internet-facing
- **Subnets**: All 3 public subnets
- **Health Check**: /health endpoint, 30-second interval
- **Path Routing**: /api/v1/* and /api/v2/*

### Database
- **Engine**: Aurora PostgreSQL 15.4
- **Mode**: Serverless v2
- **Scaling**: 0.5-2 ACUs
- **Storage**: Encrypted with AWS-managed keys
- **Backups**: 7-day retention
- **Multi-AZ**: Automatic failover

### Session Storage
- **Type**: DynamoDB
- **Billing**: On-demand
- **Hash Key**: sessionId (String)
- **TTL**: Enabled on 'ttl' attribute
- **Recovery**: Point-in-time recovery enabled

### Auto-scaling
- **Metric**: ALBRequestCountPerTarget
- **Target**: 1000 requests per task
- **Min Tasks**: 2
- **Max Tasks**: 10
- **Scale-out Cooldown**: 60 seconds
- **Scale-in Cooldown**: 300 seconds

## Security

### Network Security
- **ALB Security Group**: HTTP (80) and HTTPS (443) from 0.0.0.0/0
- **ECS Security Group**: Port 8080 from ALB only
- **RDS Security Group**: Port 5432 from ECS only
- **Private Subnets**: No direct internet access (via NAT)

### IAM Roles
- **ECS Task Execution Role**: ECR, CloudWatch Logs, Secrets Manager
- **ECS Task Role**: DynamoDB, CloudWatch Logs (scoped to session table)

### Data Encryption
- **RDS**: Storage encrypted with AWS-managed KMS keys
- **DynamoDB**: Encrypted at rest by default
- **CloudWatch Logs**: Encrypted at rest
- **ALB**: HTTPS listeners (if ACM cert configured)

### Best Practices
- Least-privilege IAM policies
- Security group segmentation (ALB → ECS → RDS)
- Private subnets for compute and database
- No public IP assignment to ECS tasks
- CloudWatch logging for audit trails

## Advanced Configuration

### Custom Container Image

Replace the placeholder nginx image in `lib/tap_stack.py`:

```python
# Line 594
"image": f"{account_id}.dkr.ecr.us-east-1.amazonaws.com/ml-api:latest",
```

### AWS Secrets Manager Integration

To use Secrets Manager for database password:

```python
# Create secret
db_secret = aws.secretsmanager.Secret("db-secret",
    name=f"ml-api-db-password-{self.environment_suffix}",
    opts=ResourceOptions(parent=self))

# Update RDS cluster
master_password=db_secret.secret_string,
```

### Custom Domain and ACM Certificate

```python
# Create certificate (must be in us-east-1 for CloudFront)
cert = aws.acm.Certificate("cf-cert",
    domain_name="api.example.com",
    validation_method="DNS",
    opts=ResourceOptions(parent=self))

# Update CloudFront
viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
    acm_certificate_arn=cert.arn,
    ssl_support_method="sni-only",
    minimum_protocol_version="TLSv1.2_2021"
),
```

### Add WAF Protection

```python
waf_web_acl = aws.wafv2.WebAcl("ml-api-waf",
    name=f"ml-api-waf-{self.environment_suffix}",
    scope="REGIONAL",
    default_action=aws.wafv2.WebAclDefaultActionArgs(allow={}),
    rules=[...],
    visibility_config=...)

aws.wafv2.WebAclAssociation("alb-waf",
    resource_arn=self.alb.arn,
    web_acl_arn=waf_web_acl.arn)
```

## Documentation

- **PROMPT.md**: Original requirements and constraints
- **MODEL_RESPONSE.md**: Initial code generation documentation
- **IDEAL_RESPONSE.md**: Production-ready improvements and validation
- **MODEL_FAILURES.md**: Analysis of issues and corrections

## Support

For issues or questions:
1. Check CloudWatch Logs for errors
2. Review Pulumi stack trace: `pulumi stack`
3. Verify AWS service quotas: `aws service-quotas list-service-quotas --service-code ecs`
4. Check AWS Service Health Dashboard

## License

This infrastructure code is provided as-is for testing and development purposes.

## Version

- **Infrastructure Version**: 1.0.0
- **Pulumi**: 3.x
- **Python**: 3.9+
- **Platform**: AWS
- **Region**: us-east-1
