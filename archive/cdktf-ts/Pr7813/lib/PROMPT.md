# Payment Processing Environment Infrastructure

## Platform and Language Requirements
**MANDATORY: This infrastructure MUST be implemented using CDKTF with TypeScript.**

## Task Description

Create a CDKTF TypeScript program to deploy a payment processing environment in AWS. The configuration must:

1. Set up a VPC with CIDR 10.0.0.0/16 across 3 availability zones with both public and private subnets.
2. Deploy an API Gateway REST API with Lambda proxy integration for a payments endpoint.
3. Create three Lambda functions: payment-validator, payment-processor, and payment-notifier with 512MB memory and 30-second timeout.
4. Configure a DynamoDB table named 'transactions' with partition key 'transactionId' (String) and sort key 'timestamp' (Number).
5. Set up an S3 bucket for audit logs with server-side encryption using AWS-managed keys.
6. Create CloudWatch Log Groups for each Lambda function with 7-day retention.
7. Implement SNS topic for payment notifications with email subscription endpoint.
8. Configure NAT Gateways in each public subnet for Lambda outbound connectivity.
9. Set up VPC endpoints for S3 and DynamoDB to keep traffic within AWS network.
10. Create CloudWatch dashboard displaying Lambda invocations, errors, and DynamoDB read/write capacity metrics.

## Background

A financial services startup is expanding to the Asia-Pacific region and needs to establish a new cloud environment for their payment processing system. The infrastructure must comply with PCI DSS requirements and support high-throughput transaction processing with sub-second latency.

## Environment

New AWS environment in us-east-2 (Singapore) region for payment processing infrastructure. Requires Pulumi 3.x with TypeScript, Node.js 18+, and AWS CLI v2 configured with appropriate credentials. The setup includes VPC with 3 availability zones, private subnets for compute resources, public subnets for NAT gateways, API Gateway for external API access, Lambda functions for transaction processing, DynamoDB for transaction storage, S3 for audit logs, and CloudWatch for monitoring. Network architecture uses Transit Gateway for future multi-region connectivity.

## Constraints

1. All compute resources must run in private subnets with no direct internet access
2. CloudWatch alarms must trigger SNS notifications for any Lambda errors exceeding 1%
3. Lambda functions must have reserved concurrent executions set to prevent cold starts
4. DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
5. API Gateway must implement request throttling at 10,000 requests per minute
6. S3 buckets must have versioning enabled and lifecycle policies for 90-day archival
7. VPC flow logs must be enabled and sent to CloudWatch Logs
8. All IAM roles must use session policies with maximum session duration of 1 hour
9. Database backups must be encrypted with customer-managed KMS keys
10. All security groups must follow least-privilege principle with explicit port definitions

## Expected Output

A complete CDKTF program that exports:
- API Gateway URL
- S3 bucket name
- DynamoDB table name
- CloudWatch dashboard URL

The program should use CDKTF construct pattern to organize related resources and implement proper tagging with Environment, Project, and ManagedBy tags.

## Critical Requirements

### Resource Naming
ALL named resources MUST include the `environmentSuffix` variable to ensure uniqueness across deployments:
- Pattern: `resourceName-${environmentSuffix}`
- This is MANDATORY for S3 buckets, DynamoDB tables, Lambda functions, IAM roles, etc.
- Scan all code before deployment to verify compliance

### Destroyability
- NO resources should have deletion protection enabled
- NO RemovalPolicy.RETAIN or equivalent retention policies
- All resources must be cleanly destroyable for testing purposes

### Region
- Deploy to **us-east-2** as specified in the environment requirements
- Note: The environment description mentions Singapore, but us-east-2 is actually in Ohio, USA
- Use us-east-2 as the deployment region unless otherwise specified

### Cost Optimization
- Use VPC endpoints for S3 and DynamoDB (specified in requirements)
- Consider using a single NAT Gateway with multi-AZ redundancy instead of one per AZ if budget is a concern
- Lambda: 512MB memory is specified, maintain this configuration

### Security Best Practices
- Enable encryption at rest for all data stores (DynamoDB, S3, CloudWatch Logs)
- Use AWS-managed keys (SSE-S3) for S3 encryption as specified
- Use customer-managed KMS keys for database backups as specified in constraints
- Implement least-privilege IAM policies
- Enable VPC flow logs as specified

### Lambda Placeholder Code
Since this is infrastructure-as-code, Lambda function code should be minimal placeholders that demonstrate:
- Proper logging to CloudWatch
- Basic error handling
- Integration with other AWS services (DynamoDB, SNS)

Example placeholder structure:
```typescript
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  // Placeholder logic
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Function executed successfully' })
  };
};
```

### Testing Requirements
- Implement comprehensive unit tests with 90%+ coverage
- Unit tests should validate resource configurations
- Integration tests should use actual deployment outputs from cfn-outputs/flat-outputs.json
- No mocking in integration tests - use real AWS SDK calls
