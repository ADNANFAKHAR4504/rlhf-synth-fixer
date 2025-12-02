# AWS Inspector v2 Security Assessment Infrastructure

## Platform and Language
**MANDATORY**: Use **Pulumi with TypeScript**

## Task Description
Create a Pulumi TypeScript program to deploy AWS Inspector v2 for automated security assessments.

## Requirements

The configuration must:

1. **Enable Inspector v2** for EC2 instance scanning in the current region
2. **Create an SNS topic** for security finding notifications
3. **Set up EventBridge rules** to capture Inspector findings with severity HIGH or CRITICAL
4. **Configure email notifications** to security@company.com for critical findings
5. **Tag all EC2 instances** with 'SecurityScan: enabled' for Inspector targeting
6. **Create a Lambda function** to parse Inspector findings and format alerts
7. **Set up CloudWatch dashboard** showing finding counts by severity
8. **Configure Inspector** to run assessments on all tagged instances
9. **Create IAM roles** with least privilege for Inspector operations
10. **Enable finding aggregation** across multiple AWS accounts if Organizations is enabled
11. **Export finding summaries** to S3 bucket for compliance reporting

## AWS Services Required
- AWS Inspector v2
- Amazon SNS
- Amazon EventBridge
- AWS Lambda
- Amazon CloudWatch (Dashboard and Logs)
- Amazon S3
- AWS IAM
- AWS Organizations (conditional)

## Constraints

### Resource Naming
- All named resources MUST include `environmentSuffix` parameter
- Format: `resource-name-${environmentSuffix}`
- Example: `inspector-findings-topic-${environmentSuffix}`

### Destroyability
- No `RemovalPolicy.RETAIN` or `DeletionPolicy: Retain`
- S3 buckets must be destroyable (no retention policies blocking deletion)
- All resources must be cleanable for CI/CD

### Security
- IAM roles must follow least privilege principle
- Email notifications should use SNS subscriptions (requires manual confirmation)
- Lambda function should have appropriate CloudWatch Logs permissions
- S3 bucket for compliance reporting must have encryption enabled

### Performance
- Lambda function should have appropriate timeout and memory configuration
- EventBridge rules should use specific filters to reduce noise
- CloudWatch dashboard should provide clear visibility into security findings

### Cost Optimization
- Use appropriate CloudWatch Logs retention (7-14 days recommended)
- Consider Lambda provisioned concurrency needs (likely not needed for security alerts)
- S3 lifecycle policies for old compliance reports (optional but recommended)

### Region
- Use the default AWS region (us-east-1) unless specified in `lib/AWS_REGION`
- Inspector v2 is regional - ensure all resources are in the same region

## Deliverables

1. **Infrastructure Code**: Pulumi TypeScript program in `lib/` directory
2. **Tests**: Unit tests with 90%+ coverage in `tests/unit/`
3. **Integration Tests**: Tests using deployed resources in `tests/integration/`
4. **Documentation**:
   - Architecture overview
   - Deployment instructions
   - Security considerations
   - Cost estimates

## Success Criteria

- All infrastructure deploys successfully
- Inspector v2 is enabled and scanning EC2 instances
- EventBridge rules capture HIGH and CRITICAL findings
- Lambda function processes findings and sends formatted alerts
- CloudWatch dashboard displays finding metrics
- S3 bucket receives compliance reports
- All tests pass with 90%+ coverage
- No deployment blockers or errors
