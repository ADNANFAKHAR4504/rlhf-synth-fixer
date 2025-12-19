I need to build a bug tracking system for my team that handles around 3,800 issue reports daily. We need automated triaging and assignment capabilities.

The system should be deployed to AWS us-west-1 region using AWS CDK with TypeScript. Here are the specific requirements:

- API Gateway for receiving bug report submissions from our applications
- Lambda function using Python 3.10 runtime that processes incoming issues
- Use Amazon Comprehend for automatic severity classification of bug reports. I heard there's a targeted sentiment feature that can analyze sentiment towards specific entities - can you use that to assess the severity of issues?
- DynamoDB table to store all bug reports and their metadata
- Step Functions workflow to handle the triage process with conditional routing based on priority levels. I think there's a newer distributed map feature for Step Functions - if that makes sense for parallel processing of issues, please incorporate it
- SNS topic for sending notifications to developers when they're assigned bugs
- S3 bucket to store bug report attachments like screenshots and logs
- CloudWatch dashboard and alarms to track issue metrics like submission rate and processing time
- Proper IAM roles and policies so team members can access and manage the system

I also want to integrate two newer AWS features to improve the system:

- Use Amazon Bedrock with Claude or another foundation model to perform AI-powered bug analysis. The AI should help categorize bugs by type (e.g., UI, backend, database, security), suggest potential root causes, and extract key technical entities from bug descriptions. Add this analysis to bug reports when they are created.
- Replace the current DynamoDB Streams Lambda trigger with AWS EventBridge Pipes. The pipe should connect DynamoDB Streams to EventBridge, allowing for better event filtering and routing. Only new bug insertions should trigger the triage workflow through EventBridge.

Important constraints:
- Must use DynamoDB Streams as the source for EventBridge Pipes to enable real-time updates when new issues come in
- The Step Functions workflow needs to route issues differently based on priority (high priority goes to senior developers, medium to regular team, low priority gets batched)
- Make sure all Lambda functions have proper error handling and logging to CloudWatch
- For Amazon Bedrock, use the us-west-2 cross-region inference profile since Bedrock may not be available in us-west-1. Configure the Lambda function to call Bedrock in us-west-2.

Please provide the complete infrastructure code. Create separate code blocks for each file that needs to be created, making sure each file is complete and can be directly used in a CDK project.
