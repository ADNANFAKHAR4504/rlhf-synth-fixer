Serverless Monitoring System using AWS CDK (TypeScript) in a single template file

A startup needs to monitor five Lambda functions that handle around 1,500 daily requests. The system must automatically alert on errors, track performance metrics, and provide a clear operational overview.

Create a monitoring system using AWS CDK (TypeScript) with:

    •	Lambda (Node.js 18) functions as monitored workloads
    •	CloudWatch Alarms for error rate (>5%) and latency (>500 ms) thresholds
    •	CloudWatch Logs for capturing detailed execution logs
    •	SNS for sending real-time alerts to subscribers
    •	DynamoDB for persisting structured error logs
    •	IAM for secure role-based access and least privilege policies
