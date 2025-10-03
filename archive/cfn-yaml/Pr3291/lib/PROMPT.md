I need a serverless processing system for a logistics application that will handle about 1,500 shipment updates each day. The system should automatically route events, process them efficiently, and provide basic monitoring and alerts.

Please design this as a single AWS CloudFormation template with the following:

    •	Amazon EventBridge to capture and route shipment update events.
    •	AWS Lambda (Python 3.10) to process each event.
    •	DynamoDB to store and track shipment update logs.
    •	CloudWatch for basic monitoring and usage metrics.
    •	SNS to send alerts when issues occur.
    •	IAM roles and policies to ensure secure access between all services.

The focus should be on serverless, reliable automation with lightweight monitoring.
