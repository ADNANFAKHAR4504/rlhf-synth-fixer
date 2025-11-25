# Deployment Checklist for Multi-Region Disaster Recovery

## Pre-Deployment Verification

- [ ] AWS credentials configured with appropriate permissions
- [ ] Terraform 1.5.0+ installed
- [ ] VPCs exist in us-east-1 and us-west-2
- [ ] Private subnets configured across 3 AZs in each region
- [ ] VPC peering established between regions
- [ ] NAT gateways configured for outbound connectivity
- [ ] Route 53 hosted zone exists and is accessible
- [ ] S3 bucket for Terraform state created
- [ ] DynamoDB table for state locking created

## Configuration Files

- [ ] Copy backend.hcl.example to backend.hcl
- [ ] Update backend.hcl with actual S3 bucket and DynamoDB table
- [ ] Copy terraform.tfvars.example to terraform.tfvars
- [ ] Update terraform.tfvars with actual VPC IDs
- [ ] Update terraform.tfvars with actual subnet IDs
- [ ] Update terraform.tfvars with Route 53 hosted zone ID
- [ ] Update terraform.tfvars with domain name
- [ ] Set unique environment_suffix value

## Deployment Steps

1. Initialize Terraform:
   ```bash
   cd lib
   terraform init -backend-config=backend.hcl
   ```

2. Review plan:
   ```bash
   terraform plan -out=tfplan
   ```

3. Verify resource counts:
   - [ ] 2 RDS Aurora clusters (primary + secondary)
   - [ ] 4 RDS cluster instances (2 per region)
   - [ ] 1 RDS Global Database
   - [ ] 4 KMS keys (2 per region for RDS + SNS)
   - [ ] 2 S3 buckets with cross-region replication
   - [ ] 2 Secrets Manager secrets
   - [ ] 2 Route 53 health checks
   - [ ] 2 Route 53 DNS records (failover configuration)
   - [ ] 2 SNS topics with dead letter queues
   - [ ] 6 CloudWatch alarms (replication lag, CPU, connections)
   - [ ] Security groups and IAM roles

4. Apply configuration (60-minute timeout expected):
   ```bash
   terraform apply tfplan
   ```

## Post-Deployment Verification

### RDS Aurora Global Database
- [ ] Primary cluster status: available
- [ ] Secondary cluster status: available
- [ ] Global cluster replication lag: < 60 seconds
- [ ] Read replicas: 2 per region, status available
- [ ] Encryption at rest: enabled with KMS
- [ ] CloudWatch logs: enabled for PostgreSQL

### Route 53 Health Checks
- [ ] Primary health check: healthy
- [ ] Secondary health check: healthy
- [ ] Failover DNS record created: db-primary.[domain]
- [ ] DNS resolution working

### S3 Buckets
- [ ] Primary backup bucket created with versioning enabled
- [ ] Secondary backup bucket created with versioning enabled
- [ ] Cross-region replication configured and active
- [ ] Lifecycle policies: transition to Glacier after 30 days
- [ ] Public access blocked on both buckets

### Secrets Manager
- [ ] Primary secret created with database credentials
- [ ] Secondary secret created with database credentials
- [ ] Secrets retrievable via AWS CLI/console

### SNS and CloudWatch
- [ ] SNS topics created in both regions
- [ ] Dead letter queues configured
- [ ] RDS event subscriptions active
- [ ] CloudWatch alarms created and in OK state
- [ ] CloudWatch log groups created

### Security
- [ ] KMS keys created with proper policies
- [ ] Security groups restrict access to application subnets only
- [ ] IAM roles created with least privilege permissions

## Testing Procedures

### Database Connectivity Test
```bash
# Get primary endpoint
PRIMARY_ENDPOINT=$(terraform output -raw primary_cluster_endpoint)

# Test connection
psql -h $PRIMARY_ENDPOINT -U dbadmin -d transactiondb -c "SELECT version();"
```

### Failover DNS Test
```bash
# Resolve failover endpoint
dig db-primary.[your-domain]

# Should return primary cluster endpoint when healthy
```

### Replication Lag Test
```bash
# Check replication lag metric
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag \
  --dimensions Name=DBClusterIdentifier,Value=aurora-primary-[suffix] \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average
```

### S3 Replication Test
```bash
# Get bucket names
PRIMARY_BUCKET=$(terraform output -raw primary_backup_bucket)
SECONDARY_BUCKET=$(terraform output -raw secondary_backup_bucket)

# Upload test file
echo "test" > test.txt
aws s3 cp test.txt s3://$PRIMARY_BUCKET/test.txt

# Wait 5 minutes, then verify replication
aws s3 ls s3://$SECONDARY_BUCKET/ --region us-west-2
```

## Monitoring Setup

### Subscribe to SNS Topics
```bash
# Primary region
aws sns subscribe \
  --topic-arn $(terraform output -raw primary_sns_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com

# Secondary region
aws sns subscribe \
  --topic-arn $(terraform output -raw secondary_sns_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-west-2
```

## Troubleshooting

### Common Issues

1. **Timeout during Aurora Global Database creation**
   - Expected: Global database setup takes 30-45 minutes
   - Solution: Wait for completion, do not interrupt

2. **KMS permissions error**
   - Check IAM role has necessary KMS permissions
   - Verify KMS key policies allow RDS and SNS services

3. **Route 53 health check fails**
   - Verify CloudWatch alarms are in OK state
   - Check IAM role for Route 53 has CloudWatch read permissions

4. **Replication configuration fails**
   - Ensure S3 versioning is enabled before replication
   - Verify IAM role has cross-region permissions

## Cleanup Procedure

**WARNING**: This will delete all resources including databases and backups (except Glacier archives)

```bash
# Destroy all resources
terraform destroy

# Verify all resources deleted
terraform show
```

## Cost Estimate

Approximate monthly costs:
- RDS Aurora: $1,800-$2,000 (4x db.r6g.large instances)
- S3 Storage: $50-$100 (depending on data size)
- Data Transfer: $100-$200 (cross-region replication)
- KMS: $4 (4 keys)
- Other Services: $50-$100 (CloudWatch, SNS, Route 53)

**Total: $2,000-$2,500/month**

## Success Criteria

- [ ] All resources deployed successfully
- [ ] Database clusters accessible from application subnets
- [ ] Replication lag consistently under 60 seconds
- [ ] Route 53 health checks passing
- [ ] S3 cross-region replication working
- [ ] CloudWatch alarms configured and monitoring
- [ ] SNS notifications received for test events
- [ ] All security best practices implemented
- [ ] Documentation reviewed and understood
- [ ] Disaster recovery procedures tested

## Next Steps

1. Configure application to use Route 53 failover endpoint
2. Set up regular backup testing procedures
3. Schedule quarterly disaster recovery drills
4. Review and tune CloudWatch alarm thresholds
5. Implement automated failover testing (optional Lambda)
6. Consider AWS Backup for centralized backup management (optional)
