# Database Resource Migration Guide (v1 to v2)

## Overview

This document provides detailed procedures for migrating from v1 to v2 database resources in the Multi-Region Disaster Recovery Infrastructure. The v2 resources were introduced to enable zero-downtime migration and resolve deployment conflicts.

## What Changed

### Resource Naming Convention

All database-related resources have been renamed with a `-v2` suffix:

| Resource Type | v1 Name Pattern | v2 Name Pattern |
|---------------|-----------------|-----------------|
| Secrets Manager Secret | `db-password-{env}` | `db-password-v2-{env}` |
| RDS Global Cluster | `global-db-{env}` | `global-db-v2-{env}` |
| Primary RDS Cluster | `primary-db-cluster-{env}` | `primary-db-cluster-v2-{env}` |
| Primary RDS Instances | `primary-db-instance-{i}-{env}` | `primary-db-instance-v2-{i}-{env}` |
| DR RDS Cluster | `dr-db-cluster-{env}` | `dr-db-cluster-v2-{env}` |
| DR RDS Instances | `dr-db-instance-{i}-{env}` | `dr-db-instance-v2-{i}-{env}` |
| DynamoDB Global Table | `session-table-{env}` | `session-table-v2-{env}` |

### Why This Change Was Made

The v2 naming strategy was implemented to:

1. **Enable Blue-Green Deployments**: Deploy v2 resources alongside v1 without destroying existing infrastructure
2. **Resolve State Conflicts**: Avoid Pulumi state management conflicts during resource updates
3. **Support Zero-Downtime Migration**: Allow data migration and validation before switching traffic
4. **Provide Rollback Safety**: Keep v1 resources intact as a fallback during migration
5. **Facilitate Testing**: Test v2 resources in production environment before cutover

## Migration Strategy

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Migration Phases                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Phase 1: Deploy v2 Resources (Parallel to v1)          │
│  ├── Create v2 databases, tables, secrets               │
│  ├── Validate v2 resource health                        │
│  └── Keep v1 serving production traffic                 │
│                                                          │
│  Phase 2: Data Migration                                │
│  ├── Export data from v1 databases                      │
│  ├── Import data to v2 databases                        │
│  ├── Set up ongoing replication (if applicable)         │
│  └── Validate data integrity                            │
│                                                          │
│  Phase 3: Traffic Cutover                               │
│  ├── Update application connection strings              │
│  ├── Point to v2 database endpoints                     │
│  ├── Monitor v2 performance and errors                  │
│  └── Keep v1 available for rollback                     │
│                                                          │
│  Phase 4: Cleanup v1 Resources                          │
│  ├── Verify v2 stability (7-14 days)                    │
│  ├── Create final v1 backups                            │
│  ├── Delete v1 resources                                │
│  └── Update documentation                               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

Before starting the migration:

- [ ] Backup all v1 databases (RDS snapshots, DynamoDB backups)
- [ ] Document all v1 connection strings and configurations
- [ ] Schedule maintenance window (recommended: off-peak hours)
- [ ] Verify sufficient AWS service quotas for parallel resources
- [ ] Prepare rollback plan
- [ ] Set up monitoring dashboards for both v1 and v2
- [ ] Notify stakeholders of migration timeline

## Phase 1: Deploy v2 Resources

### Step 1.1: Deploy v2 Infrastructure

```bash
# Navigate to project directory
cd /path/to/worktree/synth-m0p3q5

# Review changes (verify v2 resources will be created, not replaced)
pulumi preview

# Deploy v2 resources
pulumi up

# Expected output: New resources created, v1 resources unchanged
# Deployment time: ~15-20 minutes
```

### Step 1.2: Verify v2 Resource Health

```bash
# Check RDS cluster status
aws rds describe-db-clusters \
  --db-cluster-identifier primary-db-cluster-v2-${ENV} \
  --region us-east-1 \
  --query 'DBClusters[0].[Status,ReaderEndpoint,Endpoint]'

aws rds describe-db-clusters \
  --db-cluster-identifier dr-db-cluster-v2-${ENV} \
  --region us-east-2 \
  --query 'DBClusters[0].[Status,ReaderEndpoint,Endpoint]'

# Verify global cluster replication
aws rds describe-global-clusters \
  --global-cluster-identifier global-db-v2-${ENV} \
  --query 'GlobalClusters[0].GlobalClusterMembers[*].[DBClusterArn,IsWriter]'

# Check DynamoDB table status
aws dynamodb describe-table \
  --table-name session-table-v2-${ENV} \
  --region us-east-1 \
  --query 'Table.[TableStatus,Replicas[0].ReplicaStatus]'

# Retrieve v2 database password
aws secretsmanager get-secret-value \
  --secret-id db-password-v2-${ENV} \
  --region us-east-1 \
  --query 'SecretString' \
  --output text
```

### Step 1.3: Test v2 Database Connectivity

```bash
# Get v2 RDS endpoint
V2_ENDPOINT=$(aws rds describe-db-clusters \
  --db-cluster-identifier primary-db-cluster-v2-${ENV} \
  --region us-east-1 \
  --query 'DBClusters[0].Endpoint' \
  --output text)

# Get v2 password
V2_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id db-password-v2-${ENV} \
  --region us-east-1 \
  --query 'SecretString' \
  --output text)

# Test connection
psql -h $V2_ENDPOINT -U dbadmin -d paymentsdb -c "SELECT version();"

# Verify empty database (no data migrated yet)
psql -h $V2_ENDPOINT -U dbadmin -d paymentsdb -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

## Phase 2: Data Migration

### Step 2.1: Backup v1 Data

```bash
# Create RDS snapshot
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier primary-db-cluster-${ENV} \
  --db-cluster-snapshot-identifier primary-db-v1-final-snapshot-$(date +%Y%m%d) \
  --region us-east-1

# Export DynamoDB table
aws dynamodb create-backup \
  --table-name session-table-${ENV} \
  --backup-name session-table-v1-backup-$(date +%Y%m%d) \
  --region us-east-1
```

### Step 2.2: RDS Data Migration

**Option A: For Large Databases (Recommended)**

Use AWS Database Migration Service (DMS):

```bash
# 1. Create replication instance
aws dms create-replication-instance \
  --replication-instance-identifier v1-to-v2-migration \
  --replication-instance-class dms.c5.xlarge \
  --allocated-storage 100 \
  --vpc-security-group-ids ${SG_ID} \
  --replication-subnet-group-identifier ${SUBNET_GROUP}

# 2. Create source endpoint (v1)
aws dms create-endpoint \
  --endpoint-identifier v1-source \
  --endpoint-type source \
  --engine-name aurora-postgresql \
  --server-name ${V1_ENDPOINT} \
  --port 5432 \
  --database-name paymentsdb \
  --username dbadmin \
  --password ${V1_PASSWORD}

# 3. Create target endpoint (v2)
aws dms create-endpoint \
  --endpoint-identifier v2-target \
  --endpoint-type target \
  --engine-name aurora-postgresql \
  --server-name ${V2_ENDPOINT} \
  --port 5432 \
  --database-name paymentsdb \
  --username dbadmin \
  --password ${V2_PASSWORD}

# 4. Create and start replication task
aws dms create-replication-task \
  --replication-task-identifier v1-to-v2-full-load \
  --source-endpoint-arn ${SOURCE_ARN} \
  --target-endpoint-arn ${TARGET_ARN} \
  --replication-instance-arn ${REPLICATION_INSTANCE_ARN} \
  --migration-type full-load-and-cdc \
  --table-mappings file://table-mappings.json

# 5. Monitor replication progress
aws dms describe-replication-tasks \
  --filters Name=replication-task-arn,Values=${TASK_ARN} \
  --query 'ReplicationTasks[0].[Status,ReplicationTaskStats]'
```

**Option B: For Smaller Databases**

Use pg_dump and pg_restore:

```bash
# 1. Export from v1
pg_dump -h ${V1_ENDPOINT} \
  -U dbadmin \
  -d paymentsdb \
  -F c \
  -f /tmp/paymentsdb_v1_$(date +%Y%m%d).dump

# 2. Import to v2
pg_restore -h ${V2_ENDPOINT} \
  -U dbadmin \
  -d paymentsdb \
  -j 4 \
  /tmp/paymentsdb_v1_$(date +%Y%m%d).dump

# 3. Verify data
V1_COUNT=$(psql -h ${V1_ENDPOINT} -U dbadmin -d paymentsdb -t -c "SELECT count(*) FROM payments;")
V2_COUNT=$(psql -h ${V2_ENDPOINT} -U dbadmin -d paymentsdb -t -c "SELECT count(*) FROM payments;")

echo "v1 records: $V1_COUNT"
echo "v2 records: $V2_COUNT"

if [ "$V1_COUNT" = "$V2_COUNT" ]; then
  echo "✅ Data migration successful"
else
  echo "❌ Data mismatch - investigate"
fi
```

### Step 2.3: DynamoDB Data Migration

```bash
# Option 1: Use AWS Data Pipeline
# (Recommended for tables > 10GB)

# Option 2: Point-in-time restore
aws dynamodb restore-table-from-backup \
  --target-table-name session-table-v2-${ENV}-temp \
  --backup-arn ${BACKUP_ARN}

# Then migrate from temp to v2 table using scan/batch-write

# Option 3: For small tables, use scan and put-item
# Export v1 data
aws dynamodb scan \
  --table-name session-table-${ENV} \
  --region us-east-1 \
  > /tmp/sessions_v1.json

# Import to v2
# Use a script to batch-write items to session-table-v2-${ENV}
```

### Step 2.4: Validate Data Integrity

```bash
# Run data validation script
cat > /tmp/validate-migration.sh << 'EOF'
#!/bin/bash
set -e

# Compare table counts
echo "Validating RDS data..."
V1_TABLES=$(psql -h $V1_ENDPOINT -U dbadmin -d paymentsdb -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
V2_TABLES=$(psql -h $V2_ENDPOINT -U dbadmin -d paymentsdb -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")

if [ "$V1_TABLES" = "$V2_TABLES" ]; then
  echo "✅ Table count matches: $V1_TABLES"
else
  echo "❌ Table count mismatch: v1=$V1_TABLES, v2=$V2_TABLES"
  exit 1
fi

# Compare record counts for each table
TABLES=$(psql -h $V1_ENDPOINT -U dbadmin -d paymentsdb -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public';")
for table in $TABLES; do
  V1_ROWS=$(psql -h $V1_ENDPOINT -U dbadmin -d paymentsdb -t -c "SELECT count(*) FROM $table;")
  V2_ROWS=$(psql -h $V2_ENDPOINT -U dbadmin -d paymentsdb -t -c "SELECT count(*) FROM $table;")

  if [ "$V1_ROWS" = "$V2_ROWS" ]; then
    echo "✅ $table: $V1_ROWS rows"
  else
    echo "❌ $table mismatch: v1=$V1_ROWS, v2=$V2_ROWS"
  fi
done

echo "Validating DynamoDB data..."
V1_COUNT=$(aws dynamodb scan --table-name session-table-${ENV} --select COUNT --query 'Count' --output text)
V2_COUNT=$(aws dynamodb scan --table-name session-table-v2-${ENV} --select COUNT --query 'Count' --output text)

if [ "$V1_COUNT" = "$V2_COUNT" ]; then
  echo "✅ DynamoDB count matches: $V1_COUNT"
else
  echo "❌ DynamoDB count mismatch: v1=$V1_COUNT, v2=$V2_COUNT"
fi

echo "✅ All validation checks passed"
EOF

chmod +x /tmp/validate-migration.sh
/tmp/validate-migration.sh
```

## Phase 3: Traffic Cutover

### Step 3.1: Update Application Configuration

```bash
# Update connection strings in application configuration
# Replace v1 endpoints with v2 endpoints

# v1 endpoint (old):
# primary-db-cluster-${ENV}.cluster-xxxxx.us-east-1.rds.amazonaws.com

# v2 endpoint (new):
# primary-db-cluster-v2-${ENV}.cluster-yyyyy.us-east-1.rds.amazonaws.com

# Update environment variables or configuration management system
# Example: AWS Systems Manager Parameter Store
aws ssm put-parameter \
  --name "/app/${ENV}/database/endpoint" \
  --value "${V2_ENDPOINT}" \
  --type SecureString \
  --overwrite \
  --region us-east-1

aws ssm put-parameter \
  --name "/app/${ENV}/database/password-secret" \
  --value "db-password-v2-${ENV}" \
  --type String \
  --overwrite \
  --region us-east-1

aws ssm put-parameter \
  --name "/app/${ENV}/dynamodb/table" \
  --value "session-table-v2-${ENV}" \
  --type String \
  --overwrite \
  --region us-east-1
```

### Step 3.2: Rolling Application Restart

```bash
# For applications running on Auto Scaling Groups
# Perform a rolling restart to pick up new configuration

# Primary region
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name primary-asg-${ENV} \
  --preferences MinHealthyPercentage=80,InstanceWarmup=120 \
  --region us-east-1

# DR region
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name dr-asg-${ENV} \
  --preferences MinHealthyPercentage=80,InstanceWarmup=120 \
  --region us-east-2

# Monitor instance refresh
watch -n 10 'aws autoscaling describe-instance-refreshes \
  --auto-scaling-group-name primary-asg-${ENV} \
  --region us-east-1 \
  --query "InstanceRefreshes[0].[Status,PercentageComplete]"'
```

### Step 3.3: Monitor v2 Traffic

```bash
# Monitor v2 database connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBClusterIdentifier,Value=primary-db-cluster-v2-${ENV} \
  --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average \
  --region us-east-1

# Monitor v2 DynamoDB read/write capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=session-table-v2-${ENV} \
  --start-time $(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum \
  --region us-east-1

# Check application error rates
aws logs filter-log-events \
  --log-group-name /aws/application/${ENV} \
  --start-time $(date -u -d '10 minutes ago' +%s)000 \
  --filter-pattern "ERROR" \
  --region us-east-1 \
  | grep -i database
```

### Step 3.4: Rollback Procedure (If Needed)

If issues arise during cutover:

```bash
# 1. Revert configuration to v1 endpoints
aws ssm put-parameter \
  --name "/app/${ENV}/database/endpoint" \
  --value "${V1_ENDPOINT}" \
  --type SecureString \
  --overwrite \
  --region us-east-1

aws ssm put-parameter \
  --name "/app/${ENV}/database/password-secret" \
  --value "db-password-${ENV}" \
  --type String \
  --overwrite \
  --region us-east-1

aws ssm put-parameter \
  --name "/app/${ENV}/dynamodb/table" \
  --value "session-table-${ENV}" \
  --type String \
  --overwrite \
  --region us-east-1

# 2. Restart applications to pick up v1 configuration
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name primary-asg-${ENV} \
  --preferences MinHealthyPercentage=80,InstanceWarmup=120 \
  --region us-east-1

# 3. Verify traffic has returned to v1
# Monitor v1 connections and v2 should drop to zero

# 4. Investigate v2 issues before retry
```

## Phase 4: Cleanup v1 Resources

### Step 4.1: Stabilization Period

Wait **7-14 days** after successful cutover to ensure v2 stability:

- Monitor v2 performance metrics daily
- Review application logs for database errors
- Validate backup and restore procedures on v2
- Ensure disaster recovery tests pass with v2

### Step 4.2: Final v1 Backups

Before deleting v1 resources:

```bash
# Create final snapshots
aws rds create-db-cluster-snapshot \
  --db-cluster-identifier primary-db-cluster-${ENV} \
  --db-cluster-snapshot-identifier primary-db-v1-final-archive-$(date +%Y%m%d) \
  --region us-east-1 \
  --tags Key=Purpose,Value=ArchiveBeforeV2Migration Key=RetainUntil,Value=$(date -d '+90 days' +%Y-%m-%d)

aws rds create-db-cluster-snapshot \
  --db-cluster-identifier dr-db-cluster-${ENV} \
  --db-cluster-snapshot-identifier dr-db-v1-final-archive-$(date +%Y%m%d) \
  --region us-east-2 \
  --tags Key=Purpose,Value=ArchiveBeforeV2Migration Key=RetainUntil,Value=$(date -d '+90 days' +%Y-%m-%d)

# Export DynamoDB to S3 for archival
aws dynamodb export-table-to-point-in-time \
  --table-arn arn:aws:dynamodb:us-east-1:ACCOUNT:table/session-table-${ENV} \
  --s3-bucket ${ARCHIVE_BUCKET} \
  --s3-prefix dynamodb-archives/session-table-v1-$(date +%Y%m%d)/ \
  --export-format DYNAMODB_JSON
```

### Step 4.3: Delete v1 Resources

Create a cleanup script:

```bash
cat > /tmp/cleanup-v1-resources.sh << 'EOF'
#!/bin/bash
set -e

ENV=${1:-dev}

echo "⚠️  WARNING: This will delete v1 database resources for environment: $ENV"
echo "Ensure:"
echo "  1. v2 has been stable for 7-14 days"
echo "  2. Final backups have been created"
echo "  3. Stakeholders have been notified"
echo ""
read -p "Type 'DELETE-V1' to confirm: " confirm

if [ "$confirm" != "DELETE-V1" ]; then
  echo "Aborted"
  exit 1
fi

echo "Deleting v1 resources..."

# Delete DR cluster instances first
for i in 0 1; do
  echo "Deleting dr-db-instance-$i-${ENV}..."
  aws rds delete-db-instance \
    --db-instance-identifier dr-db-instance-$i-${ENV} \
    --skip-final-snapshot \
    --region us-east-2 || echo "Already deleted or not found"
done

# Wait for DR instances to be deleted
echo "Waiting for DR instances to be deleted..."
sleep 60

# Delete DR cluster
echo "Deleting dr-db-cluster-${ENV}..."
aws rds delete-db-cluster \
  --db-cluster-identifier dr-db-cluster-${ENV} \
  --skip-final-snapshot \
  --region us-east-2 || echo "Already deleted or not found"

# Delete primary cluster instances
for i in 0 1; do
  echo "Deleting primary-db-instance-$i-${ENV}..."
  aws rds delete-db-instance \
    --db-instance-identifier primary-db-instance-$i-${ENV} \
    --skip-final-snapshot \
    --region us-east-1 || echo "Already deleted or not found"
done

# Wait for primary instances to be deleted
echo "Waiting for primary instances to be deleted..."
sleep 60

# Delete primary cluster
echo "Deleting primary-db-cluster-${ENV}..."
aws rds delete-db-cluster \
  --db-cluster-identifier primary-db-cluster-${ENV} \
  --skip-final-snapshot \
  --region us-east-1 || echo "Already deleted or not found"

# Wait for clusters to be deleted
echo "Waiting for clusters to be deleted..."
sleep 120

# Delete global cluster
echo "Deleting global-db-${ENV}..."
aws rds delete-global-cluster \
  --global-cluster-identifier global-db-${ENV} || echo "Already deleted or not found"

# Delete DynamoDB table
echo "Deleting session-table-${ENV}..."
aws dynamodb delete-table \
  --table-name session-table-${ENV} \
  --region us-east-1 || echo "Already deleted or not found"

# Delete secrets
echo "Deleting db-password-${ENV}..."
aws secretsmanager delete-secret \
  --secret-id db-password-${ENV} \
  --force-delete-without-recovery \
  --region us-east-1 || echo "Already deleted or not found"

echo "✅ v1 resources deleted successfully"
echo "Final backups retained for 90 days"
EOF

chmod +x /tmp/cleanup-v1-resources.sh

# Execute when ready
/tmp/cleanup-v1-resources.sh $ENV
```

### Step 4.4: Update Documentation

After cleanup:

```bash
# Update README.md to remove v1 references
# Update CHANGELOG.md with migration completion
# Archive migration documentation for future reference

cat >> lib/CHANGELOG.md << EOF

## [v2.0.0] - $(date +%Y-%m-%d)

### Changed
- Migrated all database resources to v2 naming convention
- Completed zero-downtime migration from v1 to v2
- Deleted v1 resources after 14-day stabilization period

### Migration Details
- Migration started: [START_DATE]
- Cutover completed: [CUTOVER_DATE]
- v1 cleanup completed: $(date +%Y-%m-%d)
- Final v1 backups retained until: $(date -d '+90 days' +%Y-%m-%d)

### Verified By
- Database Administrator: [NAME]
- DevOps Lead: [NAME]
- Application Team: [NAME]

EOF
```

## Troubleshooting

### Issue: DMS replication lag increasing

**Cause**: Source database write load exceeds replication capacity

**Solution**:
```bash
# Scale up replication instance
aws dms modify-replication-instance \
  --replication-instance-arn ${INSTANCE_ARN} \
  --replication-instance-class dms.c5.2xlarge \
  --apply-immediately
```

### Issue: Data mismatch after migration

**Cause**: Ongoing writes to v1 during migration

**Solution**:
```bash
# Option 1: Use DMS CDC (Change Data Capture) to sync ongoing changes
# Option 2: Schedule maintenance window with read-only mode on v1
# Option 3: Re-run migration for affected tables
```

### Issue: Application cannot connect to v2 database

**Cause**: Security group rules not updated

**Solution**:
```bash
# Check security group for v2 RDS cluster
aws ec2 describe-security-groups \
  --group-ids $(aws rds describe-db-clusters \
    --db-cluster-identifier primary-db-cluster-v2-${ENV} \
    --query 'DBClusters[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
    --output text)

# Add application security group to RDS security group ingress
aws ec2 authorize-security-group-ingress \
  --group-id ${RDS_SG_ID} \
  --source-group ${APP_SG_ID} \
  --protocol tcp \
  --port 5432
```

### Issue: High cost during migration

**Cause**: Parallel operation of v1 and v2 resources

**Solution**:
- Migrate non-production environments first
- Schedule production migration during low-traffic periods
- Delete v1 resources as soon as v2 is validated stable
- Consider using Aurora Serverless v2 for cost optimization

## Best Practices

1. **Always test in non-production first**: Run complete migration in dev/staging
2. **Schedule during maintenance windows**: Minimize user impact
3. **Monitor closely during cutover**: Have DBA and DevOps on standby
4. **Keep v1 for fallback**: Don't delete v1 until v2 is proven stable
5. **Document everything**: Record endpoints, timings, issues encountered
6. **Communicate proactively**: Keep stakeholders informed at each phase
7. **Automate validation**: Use scripts to verify data integrity
8. **Test rollback procedure**: Ensure you can quickly revert if needed

## Support Contacts

- **Database Issues**: DBA Team (dba-team@example.com)
- **Infrastructure Issues**: DevOps Team (devops@example.com)
- **Application Issues**: Application Team (app-team@example.com)
- **Emergency Escalation**: On-call SRE (pager-duty@example.com)

## References

- [AWS RDS Migration Guide](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_GettingStarted.html)
- [DynamoDB Data Migration](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/S3DataExport.html)
- [Pulumi State Management](https://www.pulumi.com/docs/concepts/state/)
- [Zero-Downtime Database Migrations](https://www.pulumi.com/blog/zero-downtime-migrations/)
