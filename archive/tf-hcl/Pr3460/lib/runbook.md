# AWS Region Migration Runbook
# Migration from us-west-1 to us-west-2

## Executive Summary
This runbook provides a comprehensive, step-by-step plan for migrating the serverless application infrastructure from us-west-1 (Northern California) to us-west-2 (Oregon) with minimal downtime and zero data loss.

## Migration Overview

### Objectives
- Migrate all infrastructure resources from us-west-1 to us-west-2
- Preserve logical resource identities (names, tags, configurations)
- Minimize downtime (target: < 5 minutes)
- Zero data loss
- Maintain security and compliance posture

### Timeline
- **Preparation Phase**: 1-2 weeks
- **Migration Execution**: 4-6 hours
- **Validation Phase**: 2-4 hours
- **Cutover Window**: 5-10 minutes
- **Post-Cutover Monitoring**: 24 hours

### Prerequisites
- [x] All stakeholders notified
- [x] Maintenance window scheduled
- [x] us-west-2 infrastructure code ready
- [x] Terraform state migrated
- [x] Data migration scripts tested
- [x] Rollback plan validated
- [x] Monitoring and alerting configured
- [x] DNS TTL reduced to 60 seconds (24 hours before cutover)

## Pre-Migration Checklist

### Infrastructure Preparation (T-2 weeks)
- [ ] Review current us-west-1 infrastructure inventory
- [ ] Validate all Terraform code for us-west-2 deployment
- [ ] Create S3 state bucket in us-west-2
- [ ] Set up DynamoDB state locking table in us-west-2
- [ ] Configure AWS CLI profiles for both regions
- [ ] Verify IAM permissions for both regions
- [ ] Create backup S3 bucket for data migration
- [ ] Test data migration scripts in staging environment

### Communication (T-1 week)
- [ ] Notify all stakeholders of migration schedule
- [ ] Update status page with maintenance window
- [ ] Send email notifications to customers
- [ ] Schedule internal team sync calls
- [ ] Prepare incident response team roster

### DNS Preparation (T-24 hours)
- [ ] Reduce Route 53 DNS TTL from 300s to 60s
- [ ] Verify DNS propagation monitoring
- [ ] Test DNS failover procedures
- [ ] Document current DNS records

### Final Checks (T-4 hours)
- [ ] Backup all Terraform state files
- [ ] Snapshot all RDS/Aurora databases (if applicable)
- [ ] Export all DynamoDB tables
- [ ] Take AMI snapshots of EC2 instances (if applicable)
- [ ] Document current resource IDs (see id-mapping.csv)
- [ ] Verify VPN/Direct Connect to AWS (if used)
- [ ] Test rollback procedures in staging

## Phase 1: Infrastructure Deployment in us-west-2 (T-0 to T+2 hours)

### Step 1.1: Deploy VPC and Networking (30 minutes)
```bash
# Set environment variables
export AWS_REGION=us-west-2
export TF_VAR_target_region=us-west-2
export TF_VAR_source_region=us-west-1
export TF_VAR_environment=prod

# Navigate to project directory
cd /path/to/project

# Switch to target workspace
terraform workspace select target-uswest2

# Deploy VPC, subnets, NAT gateways
terraform apply -target=aws_vpc.main -auto-approve
terraform apply -target=aws_subnet.private -auto-approve
terraform apply -target=aws_subnet.public -auto-approve
terraform apply -target=aws_internet_gateway.main -auto-approve
terraform apply -target=aws_eip.nat -auto-approve
terraform apply -target=aws_nat_gateway.main -auto-approve
terraform apply -target=aws_route_table.private -auto-approve
terraform apply -target=aws_route_table.public -auto-approve

# Verify VPC connectivity
aws ec2 describe-vpcs --region us-west-2 --filters "Name=tag:Name,Values=serverless-app-vpc-prod"
```

**Validation Checkpoint**: Verify VPC and all subnets are created successfully.

### Step 1.2: Deploy Security Groups (15 minutes)
```bash
# Deploy security groups
terraform apply \
  -target=aws_security_group.lambda \
  -target=aws_security_group.redis \
  -target=aws_security_group.dax \
  -target=aws_security_group.vpc_endpoints \
  -auto-approve

# Verify security groups
aws ec2 describe-security-groups --region us-west-2 | grep serverless-app
```

**Validation Checkpoint**: Verify all security groups have correct ingress/egress rules.

### Step 1.3: Deploy KMS and Encryption (10 minutes)
```bash
# Deploy KMS key
terraform apply -target=aws_kms_key.master -auto-approve
terraform apply -target=aws_kms_alias.master -auto-approve

# Verify KMS key
aws kms list-keys --region us-west-2
aws kms describe-key --key-id alias/serverless-app-prod --region us-west-2
```

**Validation Checkpoint**: Verify KMS key is enabled and rotation is configured.

### Step 1.4: Deploy Storage and Databases (45 minutes)
```bash
# Deploy S3 bucket
terraform apply -target=aws_s3_bucket.data -auto-approve
terraform apply -target=aws_s3_bucket_versioning.data -auto-approve
terraform apply -target=aws_s3_bucket_server_side_encryption_configuration.data -auto-approve
terraform apply -target=aws_s3_bucket_public_access_block.data -auto-approve

# Deploy DynamoDB table
terraform apply -target=aws_dynamodb_table.primary -auto-approve

# Deploy DAX cluster
terraform apply -target=aws_dax_subnet_group.main -auto-approve
terraform apply -target=aws_iam_role.dax -auto-approve
terraform apply -target=aws_dax_cluster.main -auto-approve

# Deploy ElastiCache Redis
terraform apply -target=aws_elasticache_subnet_group.redis -auto-approve
terraform apply -target=aws_elasticache_parameter_group.redis -auto-approve
terraform apply -target=aws_elasticache_replication_group.redis -auto-approve

# Wait for clusters to be available
aws dax describe-clusters --cluster-names serverless-app-prod --region us-west-2
aws elasticache describe-replication-groups --replication-group-id serverless-app-prod --region us-west-2
```

**Validation Checkpoint**: Verify all databases and caches are in "available" status.

### Step 1.5: Deploy Kinesis and Streaming (20 minutes)
```bash
# Deploy Kinesis stream
terraform apply -target=aws_kinesis_stream.main -auto-approve

# Deploy Kinesis Firehose
terraform apply -target=aws_iam_role.firehose -auto-approve
terraform apply -target=aws_kinesis_firehose_delivery_stream.s3 -auto-approve

# Verify Kinesis resources
aws kinesis describe-stream --stream-name serverless-app-stream-prod --region us-west-2
```

**Validation Checkpoint**: Verify Kinesis stream is active with correct shard count.

### Step 1.6: Deploy Lambda and Compute (30 minutes)
```bash
# Deploy Lambda IAM role
terraform apply -target=aws_iam_role.lambda -auto-approve
terraform apply -target=aws_iam_role_policy.lambda -auto-approve

# Deploy Lambda function (with placeholder code)
terraform apply -target=aws_lambda_function.processor -auto-approve

# Deploy Step Functions
terraform apply -target=aws_iam_role.step_functions -auto-approve
terraform apply -target=aws_sfn_state_machine.main -auto-approve

# Verify Lambda function
aws lambda get-function --function-name serverless-app-processor-prod --region us-west-2
```

**Validation Checkpoint**: Verify Lambda function is in VPC and can access databases.

### Step 1.7: Deploy API Gateway and WAF (20 minutes)
```bash
# Deploy API Gateway
terraform apply -target=aws_apigatewayv2_api.main -auto-approve
terraform apply -target=aws_apigatewayv2_stage.main -auto-approve
terraform apply -target=aws_apigatewayv2_integration.lambda -auto-approve
terraform apply -target=aws_apigatewayv2_route.main -auto-approve

# Deploy WAF
terraform apply -target=aws_wafv2_web_acl.main -auto-approve
terraform apply -target=aws_wafv2_web_acl_association.api_gateway -auto-approve

# Get API Gateway URL
aws apigatewayv2 get-apis --region us-west-2 | grep ApiEndpoint
```

**Validation Checkpoint**: Verify API Gateway is accessible and protected by WAF.

### Step 1.8: Deploy Monitoring and Observability (15 minutes)
```bash
# Deploy CloudWatch log groups
terraform apply -target=aws_cloudwatch_log_group.api_gateway -auto-approve
terraform apply -target=aws_cloudwatch_log_group.lambda -auto-approve

# Deploy CloudWatch alarms
terraform apply -target=aws_cloudwatch_metric_alarm.lambda_errors -auto-approve
terraform apply -target=aws_cloudwatch_metric_alarm.api_gateway_5xx -auto-approve

# Deploy SNS topic
terraform apply -target=aws_sns_topic.alerts -auto-approve
terraform apply -target=aws_sns_topic_subscription.alerts_email -auto-approve

# Deploy EventBridge rules
terraform apply -target=aws_cloudwatch_event_rule.scheduled -auto-approve
terraform apply -target=aws_cloudwatch_event_target.lambda -auto-approve
```

**Validation Checkpoint**: Verify CloudWatch alarms are set up and SNS subscriptions confirmed.

### Step 1.9: Deploy Secrets and Configuration (10 minutes)
```bash
# Deploy Secrets Manager
terraform apply -target=aws_secretsmanager_secret.app_secrets -auto-approve
terraform apply -target=aws_secretsmanager_secret_version.app_secrets -auto-approve

# Deploy SQS queues
terraform apply -target=aws_sqs_queue.dlq -auto-approve
terraform apply -target=aws_sqs_queue.main -auto-approve
```

**Validation Checkpoint**: Verify secrets are encrypted and SQS queues are accessible.

## Phase 2: Data Migration (T+2 to T+4 hours)

### Step 2.1: Sync S3 Data (60 minutes)
```bash
# Start S3 sync from us-west-1 to us-west-2
aws s3 sync \
  s3://serverless-app-data-123456789012-us-west-1 \
  s3://serverless-app-data-123456789012-us-west-2 \
  --source-region us-west-1 \
  --region us-west-2 \
  --storage-class STANDARD \
  --metadata-directive COPY \
  --exclude "*.tmp" \
  --exclude "*.temp"

# Monitor sync progress
aws s3 ls s3://serverless-app-data-123456789012-us-west-2 --recursive --summarize

# Verify object count and sizes match
SOURCE_COUNT=$(aws s3 ls s3://serverless-app-data-123456789012-us-west-1 --recursive --summarize | grep "Total Objects" | awk '{print $3}')
TARGET_COUNT=$(aws s3 ls s3://serverless-app-data-123456789012-us-west-2 --recursive --summarize | grep "Total Objects" | awk '{print $3}')

echo "Source: $SOURCE_COUNT objects"
echo "Target: $TARGET_COUNT objects"
```

**Validation Checkpoint**: Verify S3 object counts match between regions.

### Step 2.2: Export DynamoDB Data (30 minutes)
```bash
# Export DynamoDB table from us-west-1
aws dynamodb scan \
  --table-name serverless_app_primary_prod \
  --region us-west-1 \
  --output json > /tmp/dynamodb-export-uswest1-$(date +%Y%m%d-%H%M%S).json

# Count items
ITEM_COUNT=$(jq '.Items | length' /tmp/dynamodb-export-uswest1-*.json)
echo "Exported $ITEM_COUNT items from us-west-1"

# Store export in S3 for backup
aws s3 cp /tmp/dynamodb-export-uswest1-*.json \
  s3://serverless-app-data-123456789012-us-west-2/backups/dynamodb/
```

**Validation Checkpoint**: Verify DynamoDB export file is complete and backed up.

### Step 2.3: Migrate Secrets (10 minutes)
```bash
# Export secret from us-west-1
aws secretsmanager get-secret-value \
  --secret-id serverless-app-secrets-prod \
  --region us-west-1 \
  --query SecretString \
  --output text > /tmp/secret-value.json

# Update secret in us-west-2
aws secretsmanager update-secret \
  --secret-id serverless-app-secrets-prod \
  --secret-string file:///tmp/secret-value.json \
  --region us-west-2

# Clean up local secret file
shred -u /tmp/secret-value.json
```

**Validation Checkpoint**: Verify secrets are accessible in us-west-2.

### Step 2.4: Import DynamoDB Data to us-west-2 (30 minutes)
**IMPORTANT**: This step is performed during the cutover window to ensure data consistency.

```bash
# Prepare batch write script (execute during cutover)
# This will be run after traffic is stopped in us-west-1

# Convert scan output to batch-write-item format
jq '.Items | map({PutRequest: {Item: .}}) | {RequestItems: {"serverless_app_primary_prod": .}}' \
  /tmp/dynamodb-export-uswest1-*.json > /tmp/dynamodb-import-uswest2.json

# Import data in batches (25 items per batch due to AWS limit)
# This script handles batching automatically
python3 << 'EOF'
import boto3
import json

client = boto3.client('dynamodb', region_name='us-west-2')

with open('/tmp/dynamodb-import-uswest2.json', 'r') as f:
    data = json.load(f)

items = data['RequestItems']['serverless_app_primary_prod']
batch_size = 25

for i in range(0, len(items), batch_size):
    batch = items[i:i+batch_size]
    response = client.batch_write_item(
        RequestItems={'serverless_app_primary_prod': batch}
    )
    print(f"Processed batch {i//batch_size + 1}, {len(batch)} items")
EOF
```

**Validation Checkpoint**: Verify DynamoDB item count matches source.

## Phase 3: Pre-Cutover Validation (T+4 to T+5 hours)

### Step 3.1: Infrastructure Validation
```bash
# Run Terraform plan to ensure no drift
terraform plan -detailed-exitcode

# Should return exit code 0 (no changes needed)
if [ $? -eq 0 ]; then
  echo "✓ Infrastructure matches desired state"
else
  echo "✗ Infrastructure drift detected - investigate before proceeding"
  exit 1
fi
```

### Step 3.2: Connectivity Testing
```bash
# Test Lambda function invocation
aws lambda invoke \
  --function-name serverless-app-processor-prod \
  --region us-west-2 \
  --payload '{"test": "pre-cutover"}' \
  /tmp/lambda-response.json

cat /tmp/lambda-response.json

# Test API Gateway endpoint
NEW_API_URL=$(terraform output -raw api_gateway_url)
curl -X POST "$NEW_API_URL/process" \
  -H "Content-Type: application/json" \
  -d '{"test": "api-validation"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Test DynamoDB connectivity from Lambda
aws lambda invoke \
  --function-name serverless-app-processor-prod \
  --region us-west-2 \
  --payload '{"action": "db-test"}' \
  /tmp/db-test-response.json

# Test Redis connectivity
aws lambda invoke \
  --function-name serverless-app-processor-prod \
  --region us-west-2 \
  --payload '{"action": "redis-test"}' \
  /tmp/redis-test-response.json
```

**Validation Checkpoint**: All connectivity tests pass successfully.

### Step 3.3: Performance Baseline
```bash
# Run load test against us-west-2 API
# (Use your preferred load testing tool)

# Apache Bench example
ab -n 1000 -c 10 -p test-payload.json -T application/json "$NEW_API_URL/process"

# Monitor CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=serverless-app-processor-prod \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region us-west-2
```

**Validation Checkpoint**: Performance metrics meet baseline requirements.

### Step 3.4: Security Validation
```bash
# Verify encryption at rest
aws s3api get-bucket-encryption --bucket serverless-app-data-123456789012-us-west-2
aws dynamodb describe-table --table-name serverless_app_primary_prod --region us-west-2 | jq '.Table.SSEDescription'
aws kms describe-key --key-id alias/serverless-app-prod --region us-west-2

# Verify security group rules
aws ec2 describe-security-groups --region us-west-2 --filters "Name=tag:Name,Values=serverless-app-*"

# Test WAF protection
curl -X POST "$NEW_API_URL/process" \
  -H "User-Agent: sqlmap/1.0" \
  -d '{"test": "waf"}' \
  -w "\nHTTP Status: %{http_code}\n"
# Should return 403 Forbidden
```

**Validation Checkpoint**: All security controls are in place and functional.

## Phase 4: Cutover Execution (T+5 to T+5.1 hours - 5-10 minutes)

### Pre-Cutover Tasks (T+5:00)
```bash
# Announce maintenance window start
echo "Maintenance window started at $(date)"

# Stop accepting new traffic in us-west-1
# Option 1: Update API Gateway throttling
aws apigateway update-stage \
  --rest-api-id <OLD_API_ID> \
  --stage-name prod \
  --patch-operations op=replace,path=/throttle/rateLimit,value=0 \
  --region us-west-1

# Option 2: Update load balancer target group (if applicable)
# Option 3: Set CloudFront distribution to maintenance mode

# Wait for in-flight requests to complete (2-3 minutes)
sleep 180
```

### Data Cutover (T+5:03)
```bash
# Perform final incremental DynamoDB sync
# Export only items modified since last export

# Get last export timestamp
LAST_EXPORT_TIME=$(date -d '2 hours ago' +%s)

# Scan for items modified after last export
aws dynamodb scan \
  --table-name serverless_app_primary_prod \
  --region us-west-1 \
  --filter-expression "updated_at > :timestamp" \
  --expression-attribute-values "{\":timestamp\":{\"N\":\"$LAST_EXPORT_TIME\"}}" \
  --output json > /tmp/dynamodb-incremental.json

# Import incremental data to us-west-2
# (Use same batch import script as Phase 2.4)

# Verify DynamoDB item counts match
SOURCE_ITEMS=$(aws dynamodb describe-table --table-name serverless_app_primary_prod --region us-west-1 --query 'Table.ItemCount' --output text)
TARGET_ITEMS=$(aws dynamodb describe-table --table-name serverless_app_primary_prod --region us-west-2 --query 'Table.ItemCount' --output text)

echo "Source DynamoDB items: $SOURCE_ITEMS"
echo "Target DynamoDB items: $TARGET_ITEMS"

# Abort cutover if counts don't match
if [ "$SOURCE_ITEMS" -ne "$TARGET_ITEMS" ]; then
  echo "✗ DynamoDB item count mismatch - aborting cutover"
  # Execute rollback plan
  exit 1
fi
```

### DNS Cutover (T+5:05)
```bash
# Update Route 53 DNS records to point to us-west-2

# Get current DNS record
OLD_API_URL=$(aws route53 list-resource-record-sets \
  --hosted-zone-id <HOSTED_ZONE_ID> \
  --query "ResourceRecordSets[?Name=='api.example.com.'].ResourceRecords[0].Value" \
  --output text)

# Get new API Gateway URL
NEW_API_URL=$(terraform output -raw api_gateway_url | sed 's|https://||')

# Update DNS record
aws route53 change-resource-record-sets \
  --hosted-zone-id <HOSTED_ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [{"Value": "'$NEW_API_URL'"}]
      }
    }]
  }'

echo "DNS updated from $OLD_API_URL to $NEW_API_URL"

# Wait for DNS propagation (60-120 seconds due to 60s TTL)
sleep 120
```

**GO/NO-GO Decision Point**: Verify DNS has propagated before proceeding.

### Traffic Verification (T+5:07)
```bash
# Test DNS resolution
dig api.example.com +short

# Test API endpoint via DNS
curl -X POST https://api.example.com/process \
  -H "Content-Type: application/json" \
  -d '{"test": "post-cutover"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Monitor CloudWatch metrics in us-west-2
watch -n 5 'aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=serverless-app-api-prod \
  --start-time $(date -u -d "5 minutes ago" +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum \
  --region us-west-2'
```

### Cutover Completion (T+5:10)
```bash
# Announce cutover complete
echo "Cutover completed at $(date)"

# Update status page
# Update monitoring dashboards to us-west-2 region

# Verify metrics are flowing
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=serverless-app-processor-prod \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum \
  --region us-west-2
```

**Validation Checkpoint**: Traffic is flowing to us-west-2 successfully.

## Phase 5: Post-Cutover Monitoring (T+5:10 to T+29:10 - 24 hours)

### Immediate Monitoring (First 30 minutes)
```bash
# Monitor CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-names \
    serverless-app-lambda-errors-prod \
    serverless-app-api-5xx-prod \
  --region us-west-2

# Check Lambda error rates
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=serverless-app-processor-prod \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-west-2

# Check API Gateway error rates
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name 5XXError \
  --dimensions Name=ApiName,Value=serverless-app-api-prod \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-west-2

# Monitor DynamoDB throttles
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=serverless_app_primary_prod \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-west-2
```

### Extended Monitoring (24 hours)
- Monitor CloudWatch dashboards continuously
- Review application logs for errors
- Track API latency and throughput
- Monitor database performance metrics
- Review CloudWatch alarms and SNS notifications
- Check customer support tickets for migration-related issues

### Metrics to Track
1. **API Gateway**:
   - Request count
   - 4XX and 5XX error rates
   - Latency (p50, p90, p99)

2. **Lambda**:
   - Invocations
   - Errors
   - Duration
   - Concurrent executions
   - Throttles

3. **DynamoDB**:
   - Read/write capacity units
   - Throttled requests
   - System errors
   - User errors

4. **ElastiCache Redis**:
   - Cache hits/misses
   - CPU utilization
   - Network throughput
   - Evictions

5. **Kinesis**:
   - Incoming records
   - Iterator age
   - Write/read throughput

## Phase 6: Post-Cutover Tasks (T+29:10 onwards)

### Step 6.1: Increase DNS TTL (24 hours post-cutover)
```bash
# Increase TTL back to normal (300 seconds)
aws route53 change-resource-record-sets \
  --hosted-zone-id <HOSTED_ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$NEW_API_URL'"}]
      }
    }]
  }'
```

### Step 6.2: Cleanup us-west-1 Resources (7 days post-cutover)
**IMPORTANT**: Only perform after confirming successful migration.

```bash
# Snapshot resources before deletion
aws dynamodb create-backup \
  --table-name serverless_app_primary_prod \
  --backup-name serverless-app-final-backup-$(date +%Y%m%d) \
  --region us-west-1

# Export S3 inventory
aws s3 ls s3://serverless-app-data-123456789012-us-west-1 --recursive > /tmp/s3-inventory-uswest1.txt

# Document resource IDs for audit trail
terraform state list > /tmp/terraform-uswest1-resources.txt

# Destroy us-west-1 infrastructure (after approval)
terraform workspace select source-uswest1
terraform destroy -auto-approve  # Use with extreme caution

# Archive us-west-1 state file
terraform state pull > /tmp/terraform-uswest1-final-state.json
aws s3 cp /tmp/terraform-uswest1-final-state.json \
  s3://serverless-app-terraform-state-<ACCOUNT_ID>/archives/
```

### Step 6.3: Update Documentation
- [ ] Update architecture diagrams with us-west-2 region
- [ ] Update runbooks and SOPs
- [ ] Update incident response playbooks
- [ ] Update disaster recovery plans
- [ ] Archive migration documentation
- [ ] Conduct post-mortem review

## Rollback Plan

### When to Rollback
- DynamoDB item count mismatch
- Critical API errors > 5% error rate
- Database connectivity issues
- Data corruption detected
- Severe performance degradation
- Stakeholder-requested abort

### Rollback Procedure (5-10 minutes)
```bash
echo "INITIATING ROLLBACK at $(date)"

# Step 1: Revert DNS to us-west-1
OLD_API_URL="<original-us-west-1-api-url>"

aws route53 change-resource-record-sets \
  --hosted-zone-id <HOSTED_ZONE_ID> \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [{"Value": "'$OLD_API_URL'"}]
      }
    }]
  }'

# Step 2: Re-enable us-west-1 API Gateway
aws apigateway update-stage \
  --rest-api-id <OLD_API_ID> \
  --stage-name prod \
  --patch-operations op=replace,path=/throttle/rateLimit,value=10000 \
  --region us-west-1

# Step 3: Wait for DNS propagation
sleep 120

# Step 4: Verify traffic is flowing to us-west-1
curl -X POST https://api.example.com/process \
  -H "Content-Type: application/json" \
  -d '{"test": "rollback-verify"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Step 5: Monitor us-west-1 metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=<OLD_API_NAME> \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum \
  --region us-west-1

echo "ROLLBACK COMPLETED at $(date)"
echo "Traffic restored to us-west-1"
```

### Post-Rollback Actions
1. Notify all stakeholders of rollback
2. Update status page
3. Investigate root cause
4. Fix issues in us-west-2
5. Re-test migration in staging
6. Reschedule cutover

## Success Criteria

Migration is considered successful when:
- [x] All resources deployed in us-west-2
- [x] All data migrated with zero loss
- [x] DNS cutover completed
- [x] API error rate < 0.1%
- [x] API latency within baseline (< 100ms p99)
- [x] No critical alarms triggered
- [x] All connectivity tests pass
- [x] 24-hour monitoring period complete with no issues
- [x] Customer support reports no migration-related issues
- [x] Post-mortem review completed

## Contact Information

### Escalation Path
- **L1 Support**: support@example.com
- **L2 Engineering**: engineering@example.com
- **L3 DevOps Lead**: devops-lead@example.com
- **CTO**: cto@example.com

### On-Call Rotation
- **Primary**: John Doe (+1-555-0100)
- **Secondary**: Jane Smith (+1-555-0101)
- **Manager**: Bob Johnson (+1-555-0102)

## Appendix

### A. Key URLs
- **us-west-1 API**: https://<OLD_API_ID>.execute-api.us-west-1.amazonaws.com/prod
- **us-west-2 API**: https://<NEW_API_ID>.execute-api.us-west-2.amazonaws.com/prod
- **CloudWatch Dashboard**: https://console.aws.amazon.com/cloudwatch/home?region=us-west-2
- **Status Page**: https://status.example.com

### B. Scripts Repository
All migration scripts are located at:
- `/scripts/migration/`
- Git repository: https://github.com/example/migration-scripts

### C. State Files
- **us-west-1 state**: s3://serverless-app-terraform-state-<ACCOUNT_ID>/serverless-app/us-west-1/terraform.tfstate
- **us-west-2 state**: s3://serverless-app-terraform-state-<ACCOUNT_ID>/serverless-app/us-west-2/terraform.tfstate

### D. Reference Documents
- [state-migration.md](state-migration.md) - Detailed Terraform state migration guide
- [id-mapping.csv](id-mapping.csv) - Resource ID mapping between regions
- AWS Well-Architected Framework - Migration best practices
- Terraform documentation - State management

---

**Document Version**: 1.0
**Last Updated**: 2025-01-03
**Maintained By**: DevOps Team
**Review Cycle**: Quarterly or as needed for updates
