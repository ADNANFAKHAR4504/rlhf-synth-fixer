I need help deploying an order processing system for a restaurant chain in AWS using Pulumi with Java. The system handles around 3,400 online orders per day and needs to be deployed in the us-west-1 region.

Here are the requirements:

Create an SQS FIFO queue to maintain order sequence. Orders must be processed in the exact order they are received to ensure accurate fulfillment.

Set up a Lambda function using Node.js 20 runtime that validates incoming orders. The Lambda should check for required fields and data integrity before passing orders downstream.

Create a DynamoDB table to store order details persistently. The table should support efficient queries for order status tracking.

Implement a Step Functions state machine to orchestrate the order workflow. The workflow should include validation, processing, and confirmation steps. Make sure to include error retry logic to handle transient failures.

Configure a Dead Letter Queue for failed messages. Messages should be retained for 3 days to allow for troubleshooting and manual intervention if needed.

Set up CloudWatch metrics to monitor order processing throughput, error rates, and Lambda execution times. This will help identify bottlenecks in the system.

Create appropriate IAM roles and policies to ensure Lambda can access SQS, DynamoDB, and CloudWatch. Follow the principle of least privilege.

Configure EventBridge Scheduler to generate daily order summary reports. The reports should run at the end of each business day to provide insights into order volumes and success rates.

The code should be production-ready and follow best practices for serverless applications. Include proper error handling and monitoring capabilities. All resources should have appropriate tags for cost tracking and resource management.

Please provide the complete infrastructure code using Pulumi Java SDK. Generate one code block per file, making sure each file can be used directly without modifications.