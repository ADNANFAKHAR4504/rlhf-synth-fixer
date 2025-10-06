# Media Processing Pipeline - Ideal Solution

A production-ready media processing pipeline using Terraform that handles ~5,000 video uploads/day.

## Architecture

- **Storage**: S3 buckets (input/output) with KMS encryption and blocked public access
- **Processing**: Lambda orchestrates MediaConvert jobs via SQS event-driven architecture
- **Data**: DynamoDB tracks asset state with GSI for status queries
- **Messaging**: SQS queues with dead-letter queues for resilience
- **Monitoring**: CloudWatch alarms, dashboard, encrypted logs
- **Security**: KMS at-rest encryption, IAM least-privilege, multi-AZ via regional services

## Key Improvements Over MODEL_RESPONSE

1. **Removed VPC/Networking**: Lambda doesn't need VPC for MediaConvert/S3/DynamoDB (all regional)
2. **Added MediaConvert IAM Role**: Lambda can pass this role when creating jobs
3. **Added PassRole Policy**: Lambda needs iam:PassRole for MediaConvert role
4. **Fixed Lambda Runtime**: python3.11 (nodejs16.x is deprecated)
5. **Made Resources Deletable**: force_destroy=true, shorter KMS deletion window
6. **Environment Suffix**: All resources use var.environment_suffix for isolation (passed as pr{NUMBER} from CI/CD)
7. **Proper Dependencies**: S3 notification depends on SQS policy
8. **Archive Provider**: Uses archive_file data source to package Lambda
9. **Single File Structure**: Variables, resources, and outputs in one tap_stack.tf file

## Infrastructure Files

### tap_stack.tf (Single File)
Complete stack in one file containing:
- **Variables**: aws_region, environment_suffix (CI/CD passes "pr{PR_NUMBER}" or "dev")
- **Resources**: KMS key, S3 buckets (input/output with encryption), DynamoDB table, SQS queues with DLQs, IAM roles/policies (Lambda, MediaConvert), Lambda function with event source mappings, S3 notifications, EventBridge rule, CloudWatch alarms and dashboard
- **Outputs**: bucket names, table name, queue URLs, Lambda function name/ARN, KMS key ID/ARN, dashboard name, MediaConvert role ARN

### lambda_function.py
Python Lambda handler that:
- Processes S3 upload events from SQS
- Creates MediaConvert jobs with 1080p/720p renditions
- Updates DynamoDB with asset status (PENDING, PROCESSING, COMPLETED, FAILED)
- Handles MediaConvert status updates from EventBridge
- Uses proper error handling and logging

## CI/CD Integration

The environment_suffix variable is automatically set by GitHub Actions:
```yaml
ENVIRONMENT_SUFFIX: ${{ github.event.number && format('pr{0}', github.event.number) || 'dev' }}
```
This ensures each PR gets isolated resources (e.g., pr123) while main branch uses 'dev'.

## Testing

### Unit Tests
Verify Terraform configuration structure, resource definitions, and best practices without deployment.

### Integration Tests
The integration tests read deployment outputs from `cfn-outputs/all-outputs.json`, which is created by:
1. `deploy.sh` calls `get-outputs.sh`
2. `get-outputs.sh` runs `terraform output -json` and saves to `cfn-outputs/all-outputs.json`
3. CI/CD uploads `cfn-outputs/` as artifact
4. Integration tests download and read the outputs to verify live infrastructure
