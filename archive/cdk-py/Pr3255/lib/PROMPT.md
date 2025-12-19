## Infrastructure Code Request

I need CDK Python code to build a serverless API for a retail application that handles product reviews. The system should process about 2,500 daily reviews through a REST API.

### Requirements:

1. **API Gateway**: Create a REST API with endpoints for submitting and retrieving product reviews. Enable throttling at 10 requests per second.

2. **Lambda Function**: Deploy a Python 3.9 Lambda function to process review submissions. Configure with 256MB memory and 30 second timeout. Include environment variables for DynamoDB table name and region.

3. **DynamoDB Table**: Set up a table named "ProductReviews" with:
   - Partition key: product_id (String)
   - Sort key: review_id (String)
   - Enable auto-scaling for read/write capacity (5-100 units)
   - Point-in-time recovery enabled
   - Global Secondary Index on reviewer_id

4. **IAM Roles**: Configure appropriate IAM roles for Lambda to access DynamoDB and CloudWatch. Follow least privilege principle.

5. **CloudWatch Monitoring**: Set up a dashboard showing:
   - API request count and latency
   - Lambda invocation metrics
   - DynamoDB consumed capacity
   - Create an alarm for API 4xx errors exceeding 10% of requests

6. **Systems Manager Parameter Store**: Store configuration values:
   - API throttle limits
   - DynamoDB table ARN
   - Lambda function ARN
   - Use standard tier parameters

7. **Additional Features**:
   - Enable X-Ray tracing for Lambda and API Gateway to track request flow
   - Configure Lambda Reserved Concurrent Executions at 50 to prevent overwhelming downstream services

Deploy everything to us-east-2 region. Provide the complete infrastructure code with one code block per file.