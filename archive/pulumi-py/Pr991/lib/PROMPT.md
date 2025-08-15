# Enterprise Serverless Infrastructure Challenge - AWS Lambda with SSM Integration

Create a production-ready serverless infrastructure on AWS using Pulumi Python that can handle enterprise-scale workloads with the following complex requirements:

## Core Infrastructure Requirements

1. **Deploy an AWS Lambda function** written in Python that processes HTTP requests and handles database operations with sub-200ms response times
2. **Deploy exclusively in 'us-east-1' region** with proper multi-AZ distribution and fault tolerance
3. **Secure environment variable management** using AWS SSM Parameter Store with KMS encryption and hierarchical parameter organization
4. **Scale to handle 1000+ concurrent executions** with automatic provisioned concurrency management and burst scaling
5. **Comprehensive CloudWatch logging** with structured JSON logs, custom metrics, alerting, and log retention policies

## Advanced Technical Constraints

- **Lambda function requirements**:
  - Support batch processing of up to 500 records per invocation
  - Implement custom runtime layers for optimized Python libraries
  - Handle both synchronous API calls and asynchronous event processing
  - Graceful error handling with exponential backoff retry logic

- **SSM Parameter Store integration**:
  - Environment variables must be dynamically loaded from SSM with client-side caching
  - Implement parameter hierarchies: `/myapp/prod/database/`, `/myapp/prod/api/`, `/myapp/prod/cache/`
  - Use different KMS keys for different parameter categories
  - Support parameter versioning and rollback capabilities

- **Security and networking**:
  - Lambda must run in private VPC subnets with no internet access
  - Implement VPC endpoints for AWS services (SSM, KMS, CloudWatch)
  - Use least-privilege IAM roles with resource-specific permissions
  - Enable AWS X-Ray tracing for distributed request monitoring

- **Monitoring and observability**:
  - Custom CloudWatch dashboards with business-specific metrics
  - CloudWatch alarms for latency, error rates, and cost thresholds
  - Dead letter queues with automated error analysis
  - Integration with AWS Config for compliance monitoring

## Infrastructure Components Required

- **Networking**: VPC with private subnets, NAT Gateway, VPC endpoints, security groups
- **Compute**: Lambda functions with layers, provisioned concurrency, auto-scaling triggers
- **Storage**: S3 buckets for deployment artifacts with versioning and lifecycle policies
- **Security**: KMS keys, IAM roles/policies, SSM parameters with encryption
- **Monitoring**: CloudWatch log groups, custom metrics, alarms, dashboards, X-Ray tracing
- **API**: API Gateway with rate limiting, caching, and custom domain
- **Database**: RDS instances with read replicas and automated backups

## Performance and Cost Optimization

- **Cost constraints**: Total monthly cost must remain under $500 at peak usage
- **Performance targets**: 
  - Cold start latency under 500ms
  - Warm request processing under 50ms
  - 99.9% availability SLA
  - Support for 10,000 requests per minute during peak hours

## Naming and Tagging Standards

- **Resource naming**: All resources must follow 'serverless-infra-{environment}-{resource-type}' pattern
- **Tagging requirements**: Environment, CostCenter, Owner, Application, Backup, Compliance tags
- **Environment suffix support**: Infrastructure must work for dev, staging, and prod environments

## Success Criteria

- All infrastructure deploys without errors using `pulumi up`
- Lambda can handle 1000 concurrent requests with <200ms latency
- Environment variables load securely from SSM with <10ms retrieval time
- CloudWatch logs show structured JSON format with proper correlation IDs
- Cost estimation remains under budget constraints
- All security best practices implemented (no public subnets, encrypted data, least privilege)
- Integration tests pass for all API endpoints and async processing

Provide a complete Pulumi Python program that creates this enterprise-grade serverless infrastructure with full error handling, documentation, and deployment instructions.
