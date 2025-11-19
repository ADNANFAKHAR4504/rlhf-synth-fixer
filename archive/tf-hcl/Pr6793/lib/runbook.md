# AWS Region Migration Runbook: us-west-1 → us-west-2

## Overview

This runbook provides step-by-step instructions for migrating the transaction processing application from us-west-1 to us-west-2 with minimal downtime. The migration uses Terraform import to preserve resource identities and implements DNS cutover for traffic routing.

**Estimated Total Migration Time**: 4-6 hours
**Estimated Downtime**: 15-30 minutes

## Pre-Migration Checklist

### 7 Days Before Migration

- [ ] Schedule maintenance window and communicate to stakeholders
- [ ] Review and test all migration procedures in a development environment
- [ ] Verify Terraform state backup procedures
- [ ] Ensure AWS credentials have necessary permissions in both regions
- [ ] Create and test rollback procedures
- [ ] Set up monitoring and alerting in target region (us-west-2)

### 48 Hours Before Migration

- [ ] Reduce DNS TTL to 60 seconds for api.example.com
- [ ] Notify all stakeholders of upcoming maintenance window
- [ ] Verify backup retention policies are current
- [ ] Test database snapshot and restore procedures
- [ ] Verify S3 backend bucket and DynamoDB table exist
- [ ] Create emergency contact list and escalation procedures

### 24 Hours Before Migration

- [ ] Final review of migration runbook with team
- [ ] Verify all monitoring dashboards are functional
- [ ] Create database snapshot for baseline
- [ ] Document current performance metrics
- [ ] Prepare status update templates for stakeholders
- [ ] Test rollback procedures one final time

### 2 Hours Before Migration

- [ ] Backup all Terraform state files
- [ ] Take final database snapshot from us-west-1
- [ ] Verify all team members are available
- [ ] Set up war room communication channel
- [ ] Enable detailed CloudWatch logging
- [ ] Place application in maintenance mode (read-only if possible)

## Migration Timeline

### Phase 1: Pre-Cutover (No Downtime)
**Duration**: 2-4 hours

#### Step 1.1: Final Data Sync

```bash
# Set environment variables
export SOURCE_REGION="us-west-1"
export TARGET_REGION="us-west-2"
export DB_INSTANCE_ID="myapp-database"
export TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Stop application writes (enable maintenance mode)
echo "Enabling maintenance mode..."
# Add your maintenance mode command here

# Perform final database backup in source region
echo "Creating final database snapshot in ${SOURCE_REGION}..."
aws rds create-db-snapshot \
  --db-instance-identifier ${DB_INSTANCE_ID} \
  --db-snapshot-identifier myapp-final-snapshot-${TIMESTAMP} \
  --region ${SOURCE_REGION}

# Wait for snapshot completion
echo "Waiting for snapshot to complete..."
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier myapp-final-snapshot-${TIMESTAMP} \
  --region ${SOURCE_REGION}

echo "Snapshot completed successfully"

# Copy snapshot to target region
echo "Copying snapshot to ${TARGET_REGION}..."
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:${SOURCE_REGION}:$(aws sts get-caller-identity --query Account --output text):snapshot:myapp-final-snapshot-${TIMESTAMP} \
  --target-db-snapshot-identifier myapp-final-snapshot-${TIMESTAMP} \
  --region ${TARGET_REGION}

# Wait for copy completion
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier myapp-final-snapshot-${TIMESTAMP} \
  --region ${TARGET_REGION}

echo "Snapshot copy completed successfully"
```

**Validation Checkpoint**:
- [ ] Snapshot created successfully in source region
- [ ] Snapshot copied to target region
- [ ] Snapshot size matches expected database size
- [ ] Application in maintenance mode

#### Step 1.2: Restore Database in Target Region

```bash
# Restore database from snapshot in target region
echo "Restoring database in ${TARGET_REGION}..."
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ${DB_INSTANCE_ID}-new \
  --db-snapshot-identifier myapp-final-snapshot-${TIMESTAMP} \
  --db-subnet-group-name myapp-db-subnet-group \
  --vpc-security-group-ids $(terraform output -raw database_security_group_id) \
  --region ${TARGET_REGION}

# Wait for database to become available
echo "Waiting for database restoration..."
aws rds wait db-instance-available \
  --db-instance-identifier ${DB_INSTANCE_ID}-new \
  --region ${TARGET_REGION}

echo "Database restoration completed"

# Get new database endpoint
NEW_DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier ${DB_INSTANCE_ID}-new \
  --region ${TARGET_REGION} \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "New database endpoint: ${NEW_DB_ENDPOINT}"
```

**Validation Checkpoint**:
- [ ] Database restored successfully
- [ ] Database in 'available' state
- [ ] Database endpoint accessible from private subnets
- [ ] Database credentials verified

#### Step 1.3: Infrastructure Deployment in Target Region

```bash
# Switch to target region workspace
cd /path/to/terraform
terraform workspace select myapp-us-west-2 || terraform workspace new myapp-us-west-2

# Initialize Terraform
terraform init

# Review the plan
terraform plan -out=migration-plan

# Apply infrastructure (excluding database if already restored)
terraform apply migration-plan

# Verify outputs
terraform output
```

**Validation Checkpoint**:
- [ ] All infrastructure deployed successfully
- [ ] VPC and subnets created
- [ ] Security groups configured correctly
- [ ] ALB and target group created
- [ ] Auto Scaling Group initialized
- [ ] No Terraform errors

#### Step 1.4: Application Deployment

```bash
# Update application configuration with new database endpoint
# Update environment variables or configuration files

# Deploy application to new Auto Scaling Group
# This depends on your deployment mechanism (CodeDeploy, custom scripts, etc.)

# Example using AWS Systems Manager Parameter Store
aws ssm put-parameter \
  --name "/myapp/database/endpoint" \
  --value "${NEW_DB_ENDPOINT}" \
  --type "SecureString" \
  --overwrite \
  --region ${TARGET_REGION}

# Trigger application deployment
# Add your deployment commands here
```

**Validation Checkpoint**:
- [ ] Application deployed to all instances
- [ ] Application logs show no errors
- [ ] Database connectivity verified
- [ ] Health checks passing

#### Step 1.5: Pre-Cutover Testing

```bash
# Test ALB health endpoint
NEW_ALB_DNS=$(terraform output -raw alb_dns_name)
echo "Testing ALB health endpoint: ${NEW_ALB_DNS}"

# Test application health
curl -f http://${NEW_ALB_DNS}/health
if [ $? -eq 0 ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed - ABORT MIGRATION"
  exit 1
fi

# Test database connectivity
# Add your database connectivity test here

# Test application functionality (smoke tests)
./scripts/smoke-test.sh ${TARGET_REGION}

# Load test (optional but recommended)
./scripts/load-test.sh ${NEW_ALB_DNS}
```

**Validation Checkpoint**:
- [ ] Health checks passing (100% success rate)
- [ ] Database connectivity verified
- [ ] Smoke tests passed
- [ ] Load tests show acceptable performance
- [ ] No errors in application logs
- [ ] Metrics show normal operation

**Go/No-Go Decision Point**:
- If all validation checkpoints pass → Proceed to Phase 2
- If any validation fails → Investigate and resolve before proceeding
- If unresolvable → Execute rollback procedure

### Phase 2: DNS Cutover (Downtime Begins)
**Duration**: 5-10 minutes

#### Step 2.1: Pre-Cutover Status

```bash
# Document current state
echo "Current ALB DNS (us-west-1): $(dig +short api.example.com)"
echo "New ALB DNS (us-west-2): ${NEW_ALB_DNS}"

# Verify new environment one last time
curl -f http://${NEW_ALB_DNS}/health || exit 1

# Alert stakeholders
echo "Beginning DNS cutover at $(date)"
```

#### Step 2.2: Update DNS Records

```bash
# Get Route 53 hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='example.com.'].Id" \
  --output text | cut -d'/' -f3)

# Create change batch file
cat > dns-change-batch.json <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "api.example.com",
      "Type": "CNAME",
      "TTL": 60,
      "ResourceRecords": [{"Value": "${NEW_ALB_DNS}"}]
    }
  }]
}
EOF

# Update Route 53 record
CHANGE_ID=$(aws route53 change-resource-record-sets \
  --hosted-zone-id ${HOSTED_ZONE_ID} \
  --change-batch file://dns-change-batch.json \
  --query 'ChangeInfo.Id' \
  --output text)

echo "DNS change initiated: ${CHANGE_ID}"

# Wait for change to propagate
aws route53 wait resource-record-sets-changed --id ${CHANGE_ID}
echo "DNS change completed"
```

**Alternative**: Using Alias Record (recommended)

```bash
# Get ALB hosted zone ID
ALB_ZONE_ID=$(aws elbv2 describe-load-balancers \
  --names myapp-alb \
  --region ${TARGET_REGION} \
  --query 'LoadBalancers[0].CanonicalHostedZoneId' \
  --output text)

# Create alias record change batch
cat > dns-alias-batch.json <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "api.example.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "${ALB_ZONE_ID}",
        "DNSName": "${NEW_ALB_DNS}",
        "EvaluateTargetHealth": true
      }
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id ${HOSTED_ZONE_ID} \
  --change-batch file://dns-alias-batch.json
```

#### Step 2.3: Verify DNS Propagation

```bash
# Monitor DNS propagation
echo "Monitoring DNS propagation..."
for i in {1..30}; do
  RESOLVED=$(dig +short api.example.com @8.8.8.8)
  echo "$(date): DNS resolves to: ${RESOLVED}"

  if echo "${RESOLVED}" | grep -q "us-west-2"; then
    echo "✅ DNS cutover successful!"
    break
  fi

  if [ $i -eq 30 ]; then
    echo "⚠️  DNS propagation taking longer than expected"
  fi

  sleep 10
done

# Test from multiple locations
dig +short api.example.com @8.8.8.8
dig +short api.example.com @1.1.1.1
dig +short api.example.com @208.67.222.222
```

**Validation Checkpoint**:
- [ ] DNS updated in Route 53
- [ ] DNS propagation confirmed
- [ ] Multiple DNS servers return new address
- [ ] Application accessible via domain name

### Phase 3: Post-Cutover Verification (Downtime Ends)
**Duration**: 10-15 minutes

#### Step 3.1: Application Health Checks

```bash
# Verify application is responding
echo "Testing application via domain..."
curl -f https://api.example.com/health
if [ $? -eq 0 ]; then
  echo "✅ Application responding"
else
  echo "❌ Application not responding - INVESTIGATE IMMEDIATELY"
fi

# Check application logs for errors
aws logs tail /aws/ec2/myapp --region ${TARGET_REGION} --follow &
LOG_PID=$!

# Monitor for 2 minutes
sleep 120
kill $LOG_PID

# Verify database connectivity from application
# Add your database connectivity verification here
```

**Validation Checkpoint**:
- [ ] Application responding to requests
- [ ] No errors in application logs
- [ ] Database queries succeeding
- [ ] Authentication working correctly
- [ ] All API endpoints functional

#### Step 3.2: Traffic Monitoring

```bash
# Monitor ALB metrics
echo "Monitoring ALB traffic..."

# Request count
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=app/myapp-alb/$(terraform output -raw alb_arn | cut -d':' -f6) \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum \
  --region ${TARGET_REGION}

# Target response time
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/myapp-alb/$(terraform output -raw alb_arn | cut -d':' -f6) \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average \
  --region ${TARGET_REGION}

# Check for 5XX errors
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_ELB_5XX_Count \
  --dimensions Name=LoadBalancer,Value=app/myapp-alb/$(terraform output -raw alb_arn | cut -d':' -f6) \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum \
  --region ${TARGET_REGION}

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw target_group_arn) \
  --region ${TARGET_REGION}
```

**Validation Checkpoint**:
- [ ] Request count increasing
- [ ] Response times within acceptable range
- [ ] Error rate < 1%
- [ ] All targets healthy
- [ ] Auto Scaling Group at desired capacity

#### Step 3.3: Functional Testing

```bash
# Run comprehensive functional tests
./scripts/functional-test.sh production

# Test critical user journeys
# - User authentication
# - Transaction creation
# - Data retrieval
# - Report generation

# Verify data consistency
# Compare sample records between old and new databases
```

**Validation Checkpoint**:
- [ ] All functional tests passing
- [ ] Critical user journeys working
- [ ] Data consistency verified
- [ ] No data loss detected
- [ ] Performance metrics acceptable

#### Step 3.4: Disable Maintenance Mode

```bash
# Remove maintenance mode
echo "Disabling maintenance mode..."
# Add your command to disable maintenance mode

# Announce migration completion
echo "Migration completed at $(date)"
# Send notification to stakeholders
```

**Migration Complete** - Monitor closely for next 24 hours

## Post-Migration Tasks

### Immediate (Within 1 hour)

- [ ] Verify all application functionality
- [ ] Confirm monitoring and alerting are working
- [ ] Update documentation with new resource IDs
- [ ] Notify stakeholders of successful migration
- [ ] Monitor application performance for anomalies
- [ ] Review error logs for any issues
- [ ] Verify backup procedures are working in new region

### Within 24 hours

- [ ] Increase DNS TTL back to normal values (3600 seconds)
- [ ] Update any hardcoded references to old region
- [ ] Verify backup procedures are working in new region
- [ ] Update disaster recovery procedures
- [ ] Conduct post-mortem meeting
- [ ] Document lessons learned
- [ ] Update runbooks based on actual experience

### Within 1 week

- [ ] Review and optimize resource configuration
- [ ] Verify all monitoring dashboards
- [ ] Update infrastructure diagrams
- [ ] Review and adjust auto-scaling policies
- [ ] Optimize database configuration
- [ ] Review security group rules
- [ ] Conduct performance benchmarking

### Within 1 month

- [ ] Plan cleanup of old region resources
- [ ] Create final snapshot of old region database
- [ ] Document all resource IDs for old region
- [ ] Prepare old region decommission plan
- [ ] Execute old region resource cleanup
- [ ] Verify no services are using old region
- [ ] Cancel any region-specific subscriptions or services

## Rollback Procedure

**When to Execute Rollback**:
- Critical application functionality broken
- Unacceptable error rates (> 5%)
- Database connectivity issues
- Security concerns
- Performance degradation > 50%
- Data consistency issues

### Rollback Step 1: Revert DNS

```bash
# Get old ALB DNS name
OLD_ALB_DNS="old-alb-dns-from-backup.us-west-1.elb.amazonaws.com"

# Revert DNS change
cat > dns-rollback-batch.json <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "api.example.com",
      "Type": "CNAME",
      "TTL": 60,
      "ResourceRecords": [{"Value": "${OLD_ALB_DNS}"}]
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id ${HOSTED_ZONE_ID} \
  --change-batch file://dns-rollback-batch.json

echo "DNS reverted to old region"
```

### Rollback Step 2: Verify Old Environment

```bash
# Verify old environment is still functioning
curl -f http://${OLD_ALB_DNS}/health

# Check target health in old region
aws elbv2 describe-target-health \
  --target-group-arn <old-target-group-arn> \
  --region us-west-1

# Re-enable application writes in old region
# Remove maintenance mode from old environment
```

### Rollback Step 3: Restore Terraform State

```bash
# Switch back to old workspace
terraform workspace select myapp-us-west-1

# Verify state
terraform state list

# If state was corrupted, restore from backup
terraform state push backup-us-west-1-${TIMESTAMP}.json
```

### Rollback Step 4: Communicate and Monitor

```bash
# Notify stakeholders of rollback
echo "Migration rolled back at $(date) - operating in us-west-1"

# Monitor old environment
watch -n 5 'aws elbv2 describe-target-health --target-group-arn <old-target-group-arn> --region us-west-1'
```

### Rollback Validation

- [ ] DNS pointing to old region
- [ ] Application functioning in old region
- [ ] Users can access application
- [ ] No data loss occurred
- [ ] Terraform state restored
- [ ] Stakeholders notified

## Troubleshooting

### Issue: DNS Not Propagating

**Symptoms**: DNS queries return old address

**Resolution**:
```bash
# Force DNS propagation by reducing TTL further
# Update record with TTL=0 (not recommended but works in emergency)

# Clear local DNS cache
sudo systemd-resolve --flush-caches  # Linux
dscacheutil -flushcache               # macOS

# Test with direct DNS query
dig @8.8.8.8 api.example.com
```

### Issue: Health Checks Failing

**Symptoms**: Targets showing unhealthy in target group

**Resolution**:
```bash
# Check security group rules
aws ec2 describe-security-groups \
  --group-ids $(terraform output -raw app_security_group_id) \
  --region ${TARGET_REGION}

# Verify application is running
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=myapp-app-instance-*" \
  --region ${TARGET_REGION}

# Check application logs
aws ssm start-session --target <instance-id>
sudo tail -f /var/log/application.log

# Adjust health check settings if needed
```

### Issue: Database Connection Errors

**Symptoms**: Application cannot connect to database

**Resolution**:
```bash
# Verify database is available
aws rds describe-db-instances \
  --db-instance-identifier ${DB_INSTANCE_ID} \
  --region ${TARGET_REGION}

# Check security group allows traffic from app tier
aws ec2 describe-security-groups \
  --group-ids $(terraform output -raw database_security_group_id) \
  --region ${TARGET_REGION}

# Test database connectivity from application instance
telnet ${NEW_DB_ENDPOINT} 3306

# Verify database credentials
# Check application environment variables or parameter store
```

### Issue: High Error Rate

**Symptoms**: 5XX errors in ALB metrics

**Resolution**:
```bash
# Check application logs for errors
aws logs filter-log-events \
  --log-group-name /aws/ec2/myapp \
  --filter-pattern "ERROR" \
  --region ${TARGET_REGION}

# Review recent application deployments
# Check Auto Scaling Group health

# If errors persist, consider rollback
```

### Issue: Performance Degradation

**Symptoms**: Response times higher than baseline

**Resolution**:
```bash
# Check instance CPU/memory utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=AutoScalingGroupName,Value=$(terraform output -raw asg_name) \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region ${TARGET_REGION}

# Scale up if needed
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name $(terraform output -raw asg_name) \
  --desired-capacity 4 \
  --region ${TARGET_REGION}

# Review database performance
# Check RDS performance insights
```

## Success Criteria

- [ ] Application accessible via domain name
- [ ] All functional tests passing
- [ ] Error rate < 1%
- [ ] Response times within 10% of baseline
- [ ] All targets healthy
- [ ] No data loss
- [ ] Monitoring and alerting functional
- [ ] Documentation updated
- [ ] Stakeholders notified
- [ ] Terraform state consistent

## Emergency Contacts

- Migration Lead: [Name] - [Phone] - [Email]
- Database Administrator: [Name] - [Phone] - [Email]
- Network Engineer: [Name] - [Phone] - [Email]
- Application Owner: [Name] - [Phone] - [Email]
- AWS Support: [Support Plan Level] - [Case ID]

## Communication Templates

### Migration Start
```
Subject: [MAINTENANCE] Region Migration Starting - api.example.com

The planned migration from us-west-1 to us-west-2 is beginning at [TIME].
Expected duration: 15-30 minutes
Status updates will be provided every 15 minutes.
```

### Migration Complete
```
Subject: [COMPLETE] Region Migration Successful - api.example.com

The region migration has completed successfully at [TIME].
Total downtime: [X] minutes
All systems are operational in us-west-2.
Monitoring continues for next 24 hours.
```

### Migration Issue
```
Subject: [ISSUE] Region Migration Experiencing Issues - api.example.com

We are experiencing [ISSUE] during the migration.
Current status: [STATUS]
Expected resolution: [TIME]
Updates every 10 minutes.
```

### Rollback Initiated
```
Subject: [ROLLBACK] Region Migration Rolled Back - api.example.com

Due to [REASON], we have rolled back to us-west-1.
Service restored at [TIME].
Post-mortem scheduled for [DATE/TIME].
```

## Notes

- This runbook should be reviewed and updated after each migration
- Practice migrations in development environment regularly
- Keep backup of all configuration and state files
- Document any deviations from this runbook
- Update timing estimates based on actual migration experience
