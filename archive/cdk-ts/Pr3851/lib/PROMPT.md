I need to deploy a recommendation engine system in AWS using CDK with TypeScript. The system will handle around 7,800 user interactions per day to generate personalized content recommendations.

Requirements:

Set up a Kinesis Data Stream for ingesting user interaction events. Configure it with 4 shards to handle the throughput. Use on-demand capacity mode if possible for automatic scaling.

Create a Lambda function using Python 3.11 runtime that processes events from the Kinesis stream in real-time. The Lambda should have reserved concurrency of 50. The function should extract user data and prepare it for storage.

Set up a DynamoDB table to store user profiles and their preference data. Enable auto-scaling for both read and write capacity. Use partition key as userId.

Create an S3 bucket for storing machine learning model artifacts that the recommendation engine will use.

Deploy a SageMaker serverless inference endpoint for making real-time recommendations. Use serverless inference to avoid managing infrastructure. Configure it to work with the model artifacts stored in S3.

Set up CloudWatch alarms to monitor Lambda execution latency and track when it exceeds acceptable thresholds. Also monitor the Kinesis stream and DynamoDB performance.

Create an EventBridge rule that triggers batch processing jobs on a schedule (like hourly or daily) for updating recommendation models.

Implement proper IAM roles and policies so Lambda can read from Kinesis and write to DynamoDB, Lambda can access the SageMaker endpoint, SageMaker can read model artifacts from S3, and EventBridge can trigger the appropriate Lambda functions.

The deployment should be in the us-east-2 region. Make sure all resources are properly configured to work together as a complete recommendation pipeline.

Please provide the infrastructure code with one code block per file.
