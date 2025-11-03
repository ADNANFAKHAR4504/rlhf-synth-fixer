# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdktf with ts**
> 
> Platform: **cdktf**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a CDKTF program to deploy a serverless location tracking API. The configuration must: 1. Deploy a REST API using API Gateway with throttling limits of 10,000 requests per second. 2. Create three Lambda functions: one for receiving location updates, one for retrieving current driver locations, and one for querying location history. 3. Set up a DynamoDB table with partition key 'driverId' and sort key 'timestamp' with on-demand billing mode. 4. Configure the location update Lambda with 1GB memory and 30-second timeout. 5. Implement dead letter queues for all Lambda functions using SQS. 6. Create CloudWatch alarms for Lambda errors exceeding 1% error rate over 5 minutes. 7. Set up API Gateway request validation for POST requests to ensure 'driverId', 'latitude', and 'longitude' fields are present. 8. Configure Lambda environment variables for DynamoDB table name and region. 9. Enable X-Ray tracing for all Lambda functions and API Gateway. 10. Create IAM roles with least privilege access for each Lambda function. Expected output: A fully deployed serverless API accessible via API Gateway endpoint that accepts POST requests for location updates and GET requests for retrieving driver locations, with all components properly configured for production use.

---

## Additional Context

### Background
A ride-sharing company needs a serverless API to track driver locations in real-time. The system must handle thousands of concurrent location updates per second while maintaining low latency and cost efficiency.

### Constraints and Requirements
- [Lambda functions must use Node.js 18.x runtime, DynamoDB table must have point-in-time recovery enabled, API Gateway must use edge-optimized endpoint configuration, All Lambda functions must be deployed in the same VPC with private subnets, CloudWatch logs retention must be set to 7 days for cost optimization]

### Environment Setup
AWS

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration  
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **ap-southeast-1**
