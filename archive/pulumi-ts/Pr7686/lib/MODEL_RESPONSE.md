# AWS Inspector v2 Security Assessment Infrastructure

## Implementation Overview

This Pulumi TypeScript implementation creates a comprehensive AWS Inspector v2 security assessment infrastructure with automated scanning, notification, reporting, and monitoring capabilities.

## Architecture

The implementation consists of:

1. **AWS Inspector v2 Enabler** - Enables Inspector for EC2 scanning
2. **SNS Topic** - Receives formatted security findings
3. **EventBridge Rule** - Filters HIGH and CRITICAL findings
4. **Lambda Function** - Processes findings and sends notifications
5. **CloudWatch Dashboard** - Visualizes security metrics
6. **S3 Compliance Bucket** - Stores finding reports
7. **IAM Roles** - Lambda and EC2 roles with least privilege
8. **Organizations Config** - Optional cross-account aggregation

## Key Features

- All resources include `environmentSuffix` for unique naming
- S3 bucket encryption and public access blocking
- EventBridge filters for HIGH and CRITICAL severity only
- Lambda parses findings and exports to S3
- CloudWatch Dashboard with 4 widgets showing metrics
- IAM policies follow least privilege principle
- All resources are fully destroyable (forceDestroy enabled)
- Graceful Organizations configuration handling

## Files Generated

### Infrastructure Code
- `lib/tap-stack.ts` - Main Pulumi stack (556 lines)

### Tests
- `test/tap-stack.unit.test.ts` - Comprehensive unit tests (415 lines, 90%+ coverage)
- `test/tap-stack.int.test.ts` - Integration tests (412 lines)

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{purpose}-${environmentSuffix}`

Examples:
- `inspector-compliance-dev` (S3 bucket)
- `inspector-findings-topic-prod` (SNS topic)
- `inspector-findings-processor-test` (Lambda function)

## Deployment

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Deploy stack
pulumi up

# Run tests
npm test
```

## Lambda Function Logic

The Lambda function:
1. Receives Inspector findings from EventBridge
2. Extracts severity, title, description, and affected resources
3. Formats a human-readable alert message
4. Publishes to SNS for email notification
5. Exports finding summary to S3 for compliance
6. Logs all operations to CloudWatch

## Security Features

- S3 bucket encrypted with AES256
- Public access blocked on compliance bucket
- IAM roles limited to specific actions and resources
- Lambda uses AWS SDK v3 clients
- SNS email subscription requires manual confirmation
- CloudWatch Logs retention set to 7 days (configurable)

## Cost Optimization

- Lambda: Pay per invocation (findings only)
- CloudWatch Logs: 7-day retention by default
- S3: Standard storage for compliance reports
- Inspector v2: Regional service, EC2 only
- No NAT Gateways or expensive resources

## Testing

Unit tests cover:
- Stack initialization with various configurations
- Resource naming with environmentSuffix
- S3 bucket configuration and destroyability
- Lambda function configuration
- CloudWatch Dashboard widgets
- IAM roles and policies
- EventBridge integration
- Error handling

Integration tests verify:
- All resources exist and are accessible
- S3 encryption and public access blocking
- Lambda runtime, timeout, and environment variables
- EventBridge rule pattern and targets
- IAM trust policies and attached policies
- Inspector v2 enablement
- Complete data flow (EventBridge -> Lambda -> SNS -> S3)

## Compliance

- All findings stored in S3 with timestamps
- Findings organized by severity in S3
- CloudWatch Dashboard provides audit trail
- Email notifications for immediate response
- IAM policies documented and least privilege
