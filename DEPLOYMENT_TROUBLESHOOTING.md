# Deployment Troubleshooting Guide

## Issue: Lambda Functions Already Exist (409 ResourceConflictException)

### Problem
```
Error: creating Lambda Function (fintech-event-processor-dev-event-ingestion): 
ResourceConflictException: Function already exist
```

### Root Cause
This occurs when a previous Terraform deployment partially completed. Resources were created in AWS but not properly recorded in the Terraform state file, typically due to:
- Deployment interruption or timeout
- State locking issues
- Network errors during state save

### Solution Options

#### Option 1: Import Existing Resources (Recommended for Recovery)
```bash
# Import existing Lambda functions into Terraform state
cd lib
terraform import aws_lambda_function.authorizer fintech-event-processor-dev-authorizer
terraform import aws_lambda_function.event_ingestion fintech-event-processor-dev-event-ingestion
terraform import aws_lambda_function.event_processing fintech-event-processor-dev-event-processing
terraform import aws_lambda_function.event_storage fintech-event-processor-dev-event-storage

# Then run terraform plan to see remaining resources
terraform plan
```

#### Option 2: Clean Up Orphaned Resources (Recommended for Fresh Start)
```bash
# Delete the partially created Lambda functions
aws lambda delete-function --function-name fintech-event-processor-dev-authorizer || true
aws lambda delete-function --function-name fintech-event-processor-dev-event-ingestion || true
aws lambda delete-function --function-name fintech-event-processor-dev-event-processing || true
aws lambda delete-function --function-name fintech-event-processor-dev-event-storage || true

# Then retry the deployment
cd lib && terraform apply -auto-approve
```

#### Option 3: Force Unlock State (If State is Locked)
```bash
# Only if you see "Error acquiring the state lock"
cd lib
terraform force-unlock <LOCK_ID>
```

### Prevention
The infrastructure code is designed to be idempotent and should handle re-deployments gracefully. However, to prevent this issue:

1. **Ensure unique naming**: The `environment_suffix` variable creates unique resource names per deployment
2. **Use proper backend configuration**: S3 backend with DynamoDB locking prevents state corruption
3. **Don't interrupt deployments**: Allow Terraform to complete or properly destroy resources
4. **Monitor state file**: Ensure state file is properly saved after each apply

### For CI/CD Pipeline
Add a pre-deployment cleanup step that checks for orphaned resources:

```bash
# Check if resources exist without state
FUNCTION_EXISTS=$(aws lambda get-function --function-name fintech-event-processor-${ENVIRONMENT_SUFFIX}-event-ingestion 2>&1 || echo "not found")

if [[ $FUNCTION_EXISTS != *"not found"* ]]; then
  echo "⚠️  Function exists but not in state. Cleaning up..."
  # Import or delete based on your recovery strategy
fi
```

### Quick Recovery Script
```bash
#!/bin/bash
# Run this script to clean up orphaned Lambda functions
ENVIRONMENT_SUFFIX=${ENVIRONMENT_SUFFIX:-dev}
PREFIX="fintech-event-processor-${ENVIRONMENT_SUFFIX}"

echo "Cleaning up Lambda functions with prefix: $PREFIX"

aws lambda delete-function --function-name "${PREFIX}-authorizer" 2>/dev/null || echo "✓ authorizer already deleted"
aws lambda delete-function --function-name "${PREFIX}-event-ingestion" 2>/dev/null || echo "✓ event-ingestion already deleted"
aws lambda delete-function --function-name "${PREFIX}-event-processing" 2>/dev/null || echo "✓ event-processing already deleted"
aws lambda delete-function --function-name "${PREFIX}-event-storage" 2>/dev/null || echo "✓ event-storage already deleted"

echo "✅ Cleanup complete. Retry deployment now."
```

## Other Common Issues

### Issue: Reserved Concurrent Executions Exceeds Limit
**Error**: `Specified ReservedConcurrentExecutions decreases account's UnreservedConcurrentExecution below its minimum value`

**Solution**: Already fixed in current version (reduced from 225 to 20 total)

### Issue: API Gateway Integration Response Timing
**Error**: `Invalid Integration identifier specified`

**Solution**: Already fixed with explicit `depends_on` in api-gateway.tf

### Issue: State Lock Timeout
**Error**: `Error acquiring the state lock`

**Solution**: 
```bash
# Wait for lock to release (up to 5 minutes) or force unlock
terraform force-unlock <LOCK_ID>
```

