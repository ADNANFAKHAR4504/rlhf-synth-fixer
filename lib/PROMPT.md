# Food Delivery API Infrastructure Requirements

Build a serverless REST API infrastructure for a food delivery application that processes approximately 3,500 daily orders. The solution must be cost-effective, scalable, and secure.

## Technical Requirements

Create infrastructure code that includes:

1. **API Gateway REST API**
   - Public-facing REST endpoints for order management
   - Request validation and throttling
   - CORS configuration for web clients
   - API key authentication for partner integrations

2. **Lambda Functions**
   - Order processing function to handle CREATE, READ, UPDATE operations
   - Implement request validation and error handling
   - Configure reserved concurrent executions to handle traffic spikes
   - Use environment variables for configuration

3. **DynamoDB Table**
   - Orders table with partition key (orderId) and sort key (timestamp)
   - Enable point-in-time recovery for data protection
   - Configure auto-scaling for read/write capacity (5-100 units)
   - Global secondary index for querying by customerId
   - Use on-demand billing mode with auto-scaling policies

4. **IAM Security**
   - Least privilege access for Lambda execution roles
   - Separate roles for different Lambda functions
   - Resource-based policies for API Gateway integration

5. **CloudWatch Monitoring**
   - Custom metrics for order processing latency
   - Alarms for high error rates (>1% threshold)
   - Dashboard showing API requests, Lambda invocations, and DynamoDB metrics
   - Log groups with 7-day retention

6. **Systems Manager Parameter Store**
   - Store database table names
   - API configuration parameters
   - Feature flags for gradual rollouts
   - Use SecureString for sensitive configurations

7. **Additional AWS Services**
   - Use AWS X-Ray for distributed tracing across services
   - Implement dead letter queues using SQS for failed order processing

## Performance Requirements
- API response time under 500ms for 95th percentile
- Support concurrent processing of 100 orders
- Auto-scale based on request patterns

## Deployment
Deploy all resources in us-east-1 region using AWS CDK with TypeScript.

Generate the complete infrastructure code with all necessary configurations, Lambda function handlers, and ensure proper error handling throughout the system.