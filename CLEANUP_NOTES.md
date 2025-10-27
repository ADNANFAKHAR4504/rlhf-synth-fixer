# Cleanup Notes for Task 6226190395

## Resources Requiring Manual Cleanup

### 1. ElastiCache Replication Group
- **Resource ID**: `media-redis-synth6226190395`
- **Status**: Stuck in "creating" state
- **Action Required**: Wait for cluster to reach "available" state, then delete
- **Command**:
```bash
# Check status
aws elasticache describe-replication-groups --replication-group-id media-redis-synth6226190395 --region ap-northeast-1

# Delete when available
aws elasticache delete-replication-group --replication-group-id media-redis-synth6226190395 --region ap-northeast-1
```

### 2. CloudFormation Stack
- **Stack Name**: `TapStack-synth6226190395`
- **Status**: ROLLBACK_FAILED
- **Action Required**: Delete stack after ElastiCache cleanup
- **Command**:
```bash
aws cloudformation delete-stack --stack-name TapStack-synth6226190395 --region ap-northeast-1
aws cloudformation wait stack-delete-complete --stack-name TapStack-synth6226190395 --region ap-northeast-1
```

### 3. Secrets Manager Secrets
- **Secrets**:
  - `media-db-credentials-synth6226190395`
  - `media-redis-auth-synth6226190395`
- **Action Required**: Delete secrets
- **Commands**:
```bash
aws secretsmanager delete-secret --secret-id media-db-credentials-synth6226190395 --region ap-northeast-1 --force-delete-without-recovery
aws secretsmanager delete-secret --secret-id media-redis-auth-synth6226190395 --region ap-northeast-1 --force-delete-without-recovery
```

### 4. Orphaned Resources (if any)
Check for any remaining resources with tag or name containing "synth6226190395":
- VPC and networking components
- Security groups
- Subnet groups
- IAM roles (auto-generated names)
- S3 buckets
- CloudWatch log groups

## Deployment Issues Summary

### Issue 1: AWS Managed Policy Not Available
- **Error**: Policy `arn:aws:iam::aws:policy/AWSCodePipelineFullAccess` does not exist (404)
- **Fix Applied**: Replaced with inline policy with necessary permissions

### Issue 2: Secrets Manager Format
- **Error**: "Could not parse SecretString JSON"
- **Root Cause**: 
  - RDS expects JSON format: `{"username": "value", "password": "value"}`
  - ElastiCache AuthToken expects plain string (not JSON with key)
- **Fix Applied**: Updated template to use correct secret resolution format

### Issue 3: ElastiCache Stuck in Creating
- **Error**: Cannot delete replication group in "creating" state
- **Resolution**: Must wait for state transition before cleanup

## Estimated Cleanup Time
- ElastiCache stabilization: 5-10 minutes
- Stack deletion: 5-10 minutes
- Total: 15-20 minutes

## Cost Impact
- ElastiCache cluster (if running): ~$0.02/hour
- NAT Gateway (if created): ~$0.045/hour
- Other resources: Minimal

**Note**: All resources use on-demand pricing with no commitments
