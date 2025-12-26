I need to build a fraud detection pipeline for our transaction processing system. We're dealing with millions of daily transactions and need an automated way to analyze them for fraud patterns using Spark jobs on EMR Serverless.

Here's what I'm looking for:

**Core Requirements:**

1. **EMR Serverless Setup**: I need a Spark 3.3.0 application that can scale up to 100 vCPUs and 300 GB of memory. The jobs should run in private subnets without internet access - we'll use VPC endpoints for S3 and DynamoDB connectivity.

2. **S3 Storage**: Three buckets are needed:
   - `raw-transactions` - where incoming transaction files land
   - `processed-data` - where Spark outputs the analysis results
   - `fraud-reports` - for final reports
   
   All buckets should have versioning enabled, use AWS-managed encryption, and automatically move old files to Glacier after 30 days to save costs.

3. **Lambda Validator**: A function that gets triggered when new files arrive in the raw-transactions bucket. It should validate the file format, create a job record in DynamoDB, and kick off the processing workflow.

4. **Step Functions Orchestration**: The state machine needs to handle the entire pipeline:
   - Submit the EMR job with the right Spark configuration
   - Poll for job completion
   - Update DynamoDB with job status
   - Send notifications when done (success or failure)

5. **DynamoDB Table**: Track all job executions with:
   - `job_id` as partition key
   - `timestamp` as sort key
   - `status` and `input_file` attributes
   
   Use on-demand billing since job volume will vary.

6. **EventBridge Integration**: Automatically trigger the Lambda when new objects are created in the raw-transactions bucket.

7. **Notifications**: SNS topic with email subscription for job completion alerts.

8. **Monitoring**: CloudWatch dashboard showing:
   - EMR job metrics
   - Lambda invocation counts and errors
   - Step Functions execution status

9. **Networking**: VPC with private isolated subnets across 2 AZs, no NAT gateways. Gateway endpoints for S3 and DynamoDB to keep everything private.

10. **Resource Tagging**: Apply Environment=Production, Project=FraudDetection, ManagedBy=CDK tags to all resources.

**Technical Constraints:**

- EMR Serverless must use Spark 3.3.0 runtime (emr-6.9.0 release)
- All S3 buckets use server-side encryption with AWS managed keys
- EMR runs in isolated network with no internet access
- Step Functions handles error cases with proper retries
- Lambda execution roles follow least privilege principles
- CloudWatch Logs retention set to 7 days for cost control
- DynamoDB uses on-demand billing mode

**Deliverables:**

I need two TypeScript files using AWS CDK v2:
- `bin/tap.ts` - App entry point that creates the stack
- `lib/tap-stack.ts` - Complete stack definition with all resources wired together

The solution should be production-ready and handle the full lifecycle from file upload to notification delivery. Make sure IAM permissions are scoped correctly and all the pieces connect properly.
