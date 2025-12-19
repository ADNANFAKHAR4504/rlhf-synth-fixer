# AWS Region Migration Runbook

## Executive Summary

This runbook provides detailed procedures for migrating AWS infrastructure from us-west-1 to us-west-2 with zero data loss and minimal downtime. The migration follows a blue-green deployment strategy.

## Migration Team Roles

- **Migration Lead**: Overall coordination and go/no-go decisions
- **Infrastructure Engineer**: Terraform execution and resource provisioning
- **Database Administrator**: Data replication and validation
- **Application Engineer**: Application deployment and testing
- **Network Engineer**: DNS cutover and traffic management
- **Security Engineer**: Security validation and compliance checks

## Pre-Migration Checklist

### 1 Week Before Migration

- [ ] Review and approve migration plan with stakeholders
- [ ] Create S3 backend bucket and DynamoDB table for Terraform state
- [ ] Configure backend.tf with actual resource names
- [ ] Set up monitoring and alerting for both regions
- [ ] Create rollback procedures and test them
- [ ] Schedule maintenance window with stakeholders
- [ ] Prepare communication templates for status updates

### 3 Days Before Migration

- [ ] Verify AWS credentials and permissions for both regions
- [ ] Test Terraform configuration in non-production environment
- [ ] Backup all critical data from source region
- [ ] Document current state of all resources
- [ ] Create AMIs of all EC2 instances in us-west-1
- [ ] Export RDS snapshot for data migration
- [ ] Verify S3 bucket replication is configured
- [ ] Test application failover procedures

### 1 Day Before Migration

- [ ] Reduce DNS TTL to 300 seconds (5 minutes)
- [ ] Notify users of upcoming maintenance window
- [ ] Verify backup integrity
- [ ] Confirm team availability during migration window
- [ ] Review rollback criteria and procedures
- [ ] Test communication channels
- [ ] Prepare monitoring dashboards for both regions

### Migration Day (Morning of)

- [ ] Final backup of all data in source region
- [ ] Verify all team members are available
- [ ] Set up war room (physical or virtual)
- [ ] Configure logging for all migration activities
- [ ] Verify rollback resources are ready

## Migration Execution Timeline

### Phase 1: Infrastructure Provisioning (T+0 to T+2 hours)

**T+0: Maintenance Window Begins**

````bash
# Send notification
echo "Migration starting at $(date)"

# Initialize Terraform
cd /path/to/terraform/config
terraform init

# Create workspaces
terraform workspace new us-west-1
terraform workspace new us-west-2


**T+0:15: Import Source Infrastructure**

```bash
# Switch to us-west-1 workspace
terraform workspace select us-west-1

# Import all existing resources (see state-migration.md for complete list)
# Example:
terraform import aws_vpc.main vpc-XXXXXXXX

# Verify import
terraform plan
# Should show no changes


**T+0:30: Deploy Target Infrastructure**

```bash
# Switch to us-west-2 workspace
terraform workspace select us-west-2

# Set variables
export TF_VAR_environment_suffix="prod-usw2"
export TF_VAR_aws_region="us-west-2"
export TF_VAR_db_password="SECURE_PASSWORD"

# Plan deployment
terraform plan -out=us-west-2.tfplan

# Review plan carefully
terraform show us-west-2.tfplan

# Apply with approval
terraform apply us-west-2.tfplan


**T+1:00: Verify Infrastructure Creation**

```bash
# Check all resources created
terraform state list

# Verify outputs
terraform output

# Test network connectivity
# SSH to instances and verify they can reach each other

# Verify security groups
aws ec2 describe-security-groups --region us-west-2 --filters "Name=tag:EnvironmentSuffix,Values=prod-usw2"


**T+1:30: Update ID Mapping**

```bash
# Document all resource IDs
terraform workspace select us-west-1
terraform state list > us-west-1-resources.txt
terraform show > us-west-1-state.txt

terraform workspace select us-west-2
terraform state list > us-west-2-resources.txt
terraform show > us-west-2-state.txt

# Update id-mapping.csv with actual values


### Phase 2: Data Migration (T+2 to T+4 hours)

**T+2:00: Database Migration**

```bash
# Create final snapshot in us-west-1
aws rds create-db-snapshot \
  --db-instance-identifier db-prod-usw1 \
  --db-snapshot-identifier migration-final-snapshot-$(date +%Y%m%d) \
  --region us-west-1

# Wait for snapshot to complete
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier migration-final-snapshot-$(date +%Y%m%d) \
  --region us-west-1

# Copy snapshot to us-west-2
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:us-west-1:ACCOUNT:snapshot:migration-final-snapshot-$(date +%Y%m%d) \
  --target-db-snapshot-identifier migration-final-snapshot-$(date +%Y%m%d) \
  --region us-west-2

# Restore snapshot to new RDS instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier db-prod-usw2 \
  --db-snapshot-identifier migration-final-snapshot-$(date +%Y%m%d) \
  --region us-west-2

# Wait for restore to complete
aws rds wait db-instance-available \
  --db-instance-identifier db-prod-usw2 \
  --region us-west-2


**T+2:30: S3 Data Synchronization**

```bash
# Sync S3 data from us-west-1 to us-west-2
aws s3 sync \
  s3://app-data-prod-usw1-SUFFIX \
  s3://app-data-prod-usw2-SUFFIX \
  --source-region us-west-1 \
  --region us-west-2

# Verify sync
aws s3 ls s3://app-data-prod-usw2-SUFFIX --recursive | wc -l


**T+3:00: Application Deployment**

```bash
# Deploy application to new EC2 instances
# Use configuration management tool (Ansible, Chef, etc.)
# or run deployment scripts

# Example with Ansible
ansible-playbook -i inventory/us-west-2 deploy-app.yml

# Verify application is running
curl http://INSTANCE-IP:8080/health


**T+3:30: Data Validation**

```bash
# Verify database data integrity
# Run application-specific validation queries

# Verify S3 object count matches
SOURCE_COUNT=$(aws s3 ls s3://app-data-prod-usw1-SUFFIX --recursive | wc -l)
TARGET_COUNT=$(aws s3 ls s3://app-data-prod-usw2-SUFFIX --recursive | wc -l)

if [ "$SOURCE_COUNT" -eq "$TARGET_COUNT" ]; then
  echo "S3 data validation: PASSED"
else
  echo "S3 data validation: FAILED - counts do not match"
fi


### Phase 3: Application Testing (T+4 to T+5 hours)

**T+4:00: Smoke Tests**

- [ ] Verify application health endpoints respond
- [ ] Test database connectivity
- [ ] Verify S3 read/write operations
- [ ] Check security group rules
- [ ] Test internal service communication
- [ ] Verify logging and monitoring

**T+4:30: Integration Tests**

- [ ] Run automated test suite against us-west-2 environment
- [ ] Perform manual testing of critical user journeys
- [ ] Verify external integrations work correctly
- [ ] Test authentication and authorization
- [ ] Validate data consistency

### Phase 4: DNS Cutover (T+5 to T+5:30)

**T+5:00: DNS Configuration**

```bash
# Update Route53 records to point to us-west-2
# Example: Update A record for application
aws route53 change-resource-record-sets \
  --hosted-zone-id ZXXXXXXXXXXXX \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "app.example.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "NEW_IP_ADDRESS"}]
      }
    }]
  }'

# Verify DNS propagation
dig app.example.com +short

# Monitor DNS queries
watch -n 5 'dig app.example.com +short'


**T+5:10: Traffic Monitoring**

- [ ] Monitor application logs in us-west-2
- [ ] Verify traffic is being received
- [ ] Check error rates
- [ ] Monitor response times
- [ ] Verify no traffic to us-west-1

### Phase 5: Validation and Monitoring (T+5:30 to T+6:00)

**T+5:30: Final Validation**

- [ ] Verify all users are connecting to us-west-2
- [ ] Check application metrics and dashboards
- [ ] Verify no errors in logs
- [ ] Test all critical functionality
- [ ] Confirm data is being written to us-west-2 resources

**T+6:00: Migration Complete**

```bash
# Send completion notification
echo "Migration completed successfully at $(date)"

# Document final state
terraform workspace select us-west-2
terraform output > final-outputs.txt

# Set DNS TTL back to normal (e.g., 3600)
aws route53 change-resource-record-sets \
  --hosted-zone-id ZXXXXXXXXXXXX \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "app.example.com",
        "Type": "A",
        "TTL": 3600,
        "ResourceRecords": [{"Value": "NEW_IP_ADDRESS"}]
      }
    }]
  }'


## Post-Migration Activities

### Day 1 After Migration

- [ ] Monitor application performance and errors
- [ ] Verify all integrations working correctly
- [ ] Review monitoring alerts
- [ ] Collect feedback from users
- [ ] Document any issues encountered

### Week 1 After Migration

- [ ] Continue monitoring for anomalies
- [ ] Verify billing is as expected
- [ ] Update documentation with actual resource IDs
- [ ] Conduct post-migration review meeting
- [ ] Identify lessons learned

### Week 2-4 After Migration

- [ ] Prepare to decommission us-west-1 resources
- [ ] Verify no dependencies on old region
- [ ] Archive data from us-west-1
- [ ] Update disaster recovery plans

## Rollback Procedures

### Rollback Decision Criteria

Execute rollback if:
- Critical functionality is broken in us-west-2
- Data integrity issues detected
- Performance degradation exceeds acceptable thresholds
- Security vulnerabilities discovered
- More than 15 minutes past scheduled cutover window without success

### Rollback Step 1: DNS Revert (5 minutes)

```bash
# Immediately revert DNS to us-west-1
aws route53 change-resource-record-sets \
  --hosted-zone-id ZXXXXXXXXXXXX \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "app.example.com",
        "Type": "A",
        "TTL": 60,
        "ResourceRecords": [{"Value": "OLD_IP_ADDRESS"}]
      }
    }]
  }'

# Verify DNS change
dig app.example.com +short


### Rollback Step 2: Verify Source Region (5 minutes)

```bash
# Verify us-west-1 is still operational
terraform workspace select us-west-1
terraform plan
# Should show no changes

# Test application in us-west-1
curl http://OLD_IP_ADDRESS/health

# Verify database is accessible
psql -h OLD_DB_ENDPOINT -U dbadmin -d appdb -c "SELECT 1;"


### Rollback Step 3: Data Synchronization (if needed) (15 minutes)

```bash
# If any data was written to us-west-2, sync back to us-west-1
aws s3 sync \
  s3://app-data-prod-usw2-SUFFIX \
  s3://app-data-prod-usw1-SUFFIX \
  --source-region us-west-2 \
  --region us-west-1 \
  --exclude "*" \
  --include "DATA_PATTERN_FROM_CUTOVER_TIME*"


### Rollback Step 4: Communication

```bash
# Notify stakeholders of rollback
echo "Migration rolled back at $(date). Application running on us-west-1."

# Document rollback reason
cat > rollback-report.txt <<EOF
Rollback executed at $(date)
Reason: [SPECIFIC REASON]
Duration of cutover: [DURATION]
Status: Application operational on us-west-1
Next steps: [ACTION ITEMS]
EOF


## Validation Checks

### Infrastructure Validation

```bash
# VPC validation
terraform workspace select us-west-2
VPC_ID=$(terraform output -raw vpc_id)
aws ec2 describe-vpcs --vpc-ids $VPC_ID --region us-west-2

# Subnet validation
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region us-west-2

# Security group validation
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" --region us-west-2

# Instance validation
aws ec2 describe-instances --filters "Name=vpc-id,Values=$VPC_ID" "Name=instance-state-name,Values=running" --region us-west-2

# RDS validation
aws rds describe-db-instances --region us-west-2 | grep DBInstanceIdentifier


### Application Validation

```bash
# Health check endpoints
curl -f http://NEW_IP_ADDRESS/health || echo "Health check failed"

# API endpoints
curl -f http://NEW_IP_ADDRESS/api/v1/status || echo "API check failed"

# Database connectivity
psql -h NEW_DB_ENDPOINT -U dbadmin -d appdb -c "SELECT version();" || echo "DB check failed"

# S3 connectivity
aws s3 ls s3://app-data-prod-usw2-SUFFIX || echo "S3 check failed"


### Performance Validation

```bash
# Response time check
curl -w "@curl-format.txt" -o /dev/null -s http://NEW_IP_ADDRESS/

# Load test (if applicable)
ab -n 1000 -c 10 http://NEW_IP_ADDRESS/

# Database query performance
psql -h NEW_DB_ENDPOINT -U dbadmin -d appdb -c "EXPLAIN ANALYZE SELECT * FROM critical_table LIMIT 100;"


## Monitoring and Alerts

### Critical Metrics to Monitor

1. **Application Metrics**
   - HTTP response codes (target: <1% 5xx errors)
   - Response time (target: p95 < 200ms)
   - Request rate
   - Active connections

2. **Infrastructure Metrics**
   - CPU utilization (target: <70%)
   - Memory utilization (target: <80%)
   - Disk I/O
   - Network throughput

3. **Database Metrics**
   - Connection count
   - Query latency
   - Replication lag (if applicable)
   - Disk usage

4. **AWS Service Metrics**
   - EC2 instance status checks
   - RDS availability
   - S3 request rate
   - CloudWatch alarms

### Alert Thresholds

- **Critical**: Immediate action required, page on-call engineer
  - Application down
  - Database unavailable
  - Error rate >5%

- **Warning**: Investigation needed within 15 minutes
  - Error rate 2-5%
  - Response time >500ms
  - CPU >80%

- **Info**: Monitor but no immediate action
  - Response time 200-500ms
  - CPU 70-80%

## Decommissioning Source Region

### After 30 Days of Stable Operation

```bash
# Verify no traffic to us-west-1
# Check monitoring dashboards and logs

# Take final backup
aws rds create-db-snapshot \
  --db-instance-identifier db-prod-usw1 \
  --db-snapshot-identifier final-backup-before-decomm-$(date +%Y%m%d) \
  --region us-west-1

# Backup S3 data
aws s3 sync s3://app-data-prod-usw1-SUFFIX s3://archive-bucket/us-west-1-$(date +%Y%m%d)/ --region us-west-1

# Destroy infrastructure with Terraform
terraform workspace select us-west-1
terraform destroy -auto-approve

# Delete workspace
terraform workspace select default
terraform workspace delete us-west-1

# Archive state file
aws s3 cp .terraform/terraform.tfstate s3://archive-bucket/terraform-states/us-west-1-final.json


## Contact Information

- **Migration Lead**: [Name, Phone, Email]
- **Infrastructure Team**: [Team Channel, Email]
- **Database Team**: [Team Channel, Email]
- **Application Team**: [Team Channel, Email]
- **Network Team**: [Team Channel, Email]
- **Security Team**: [Team Channel, Email]

## Emergency Escalation

1. **Level 1**: Team leads (immediate)
2. **Level 2**: Engineering managers (15 minutes)
3. **Level 3**: VP Engineering (30 minutes)
4. **Level 4**: CTO (45 minutes)

## Document Revision History

- **v1.0**: Initial runbook creation
- **v1.1**: Add actual resource IDs after migration
- **v1.2**: Update with lessons learned
````
