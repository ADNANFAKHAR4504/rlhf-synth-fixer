I need to create Pulumi TypeScript infrastructure for a comprehensive cloud application with integrated AWS services. The infrastructure should be deployable in the us-west-2 region and meet the following requirements:

Architecture Overview:
The application processes data through a serverless pipeline where S3 serves as the storage layer, Lambda handles processing triggered by S3 events, RDS stores processed data, EventBridge manages event routing, and Systems Manager Parameter Store securely provides database credentials to Lambda at runtime.

Service Integration Requirements:

1. S3 Bucket Setup:
   - Enable versioning for object history
   - Configure public read access while restricting writes
   - Store Lambda deployment code
   - Trigger Lambda function when objects are uploaded

2. Lambda Function Processing Pipeline:
   - Deploy Lambda function with code from S3 bucket
   - Configure Lambda to retrieve RDS credentials from Systems Manager Parameter Store at runtime
   - Connect to RDS database using credentials from Parameter Store
   - Process S3 objects and write results to RDS
   - Publish processing events to EventBridge custom event bus for monitoring

3. RDS Database:
   - Use 'gp2' storage type with 7+ days backup retention
   - Store database connection details in Parameter Store
   - Accept connections from Lambda function in private subnets

4. Systems Manager Parameter Store Integration:
   - Securely store RDS endpoint, username, and password
   - Provide credentials to Lambda through IAM-authorized access
   - Enable Lambda to connect to RDS without hardcoded credentials

5. EventBridge Event Routing:
   - Create custom event bus for application events
   - Receive events from Lambda when processing completes
   - Route events to CloudWatch Logs for monitoring
   - Configure event patterns to match S3 processing statuses

6. IAM Security:
   - Grant Lambda read access to S3 for code and data
   - Grant Lambda read access to Parameter Store for RDS credentials
   - Grant Lambda write access to RDS
   - Grant Lambda publish access to EventBridge

7. Stack Outputs:
   - Export S3 bucket name for external reference

I'd also like to use some of AWS's recent features including S3 default data integrity protections for uploaded objects, Lambda's improved scaling capabilities, Systems Manager Parameter Store's enhanced secret rotation capabilities, and EventBridge's advanced event pattern matching that were introduced in 2024.

Please provide the infrastructure code with proper TypeScript types and ensure all resources follow Pulumi best practices. Make sure to structure the code in multiple files for better organization.
