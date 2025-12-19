I need a reliable, serverless scheduling system for a retail application that runs around 1,000 inventory update jobs every day. The system should automatically trigger updates on schedule, process them efficiently, and provide basic monitoring and alerts.

Please build this as a single AWS CloudFormation template with the following components:

    •	CloudWatch Events (EventBridge Scheduler) to schedule and trigger inventory update jobs.
    •	AWS Lambda (Python 3.9) to perform each inventory update.
    •	DynamoDB to store and manage inventory data.
    •	CloudWatch for tracking job metrics and system performance.
    •	SNS to send alerts for job failures or anomalies.
    •	IAM roles and policies to ensure secure access between all services.

The design should prioritize reliability, simplicity, and visibility, keeping costs low while ensuring consistent operation.
