A logistics app needs to automate 2,000 daily shipment updates reliably to ensure timely tracking and status synchronization. The system must be serverless, dependable, and include basic monitoring for operational visibility.

Create an automation system using CloudFormation with:

    •	Amazon EventBridge for intelligent event routing of shipment updates
    •	AWS Lambda (Node.js) to process and handle shipment events
    •	Amazon DynamoDB to store shipment logs and processing details
    •	Amazon CloudWatch for performance metrics and monitoring
    •	Amazon SNS to send real-time alerts on failures or key updates
    •	AWS IAM for secure, least-privilege access control
