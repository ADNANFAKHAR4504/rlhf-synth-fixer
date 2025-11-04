Help write a Pulumi program in Python that defines an event-driven architecture for a logistics application that processes around 1,500 shipment updates per day. The goal is to automate shipment update handling using AWS services while maintaining reliability, security, and basic monitoring within a cost-efficient, serverless design.

Use **Amazon EventBridge** as the central event bus to route shipment update events between services. Create **AWS Lambda** functions (Python 3.10 runtime) to process these events — for example, updating shipment statuses, recording metadata, or triggering downstream workflows. Store event logs and tracking data in **Amazon DynamoDB** to ensure persistence and traceability of each processed event.

Add **Amazon CloudWatch** to collect logs and metrics for both EventBridge and Lambda, providing visibility into event flow, failures, and performance. Configure **Amazon SNS** for real-time notifications when errors or critical processing events occur. Define **IAM roles and policies** that enforce least-privilege access and secure interaction between all resources.

The Pulumi stack should:

- Be easy to deploy and re-deploy with minimal manual setup
- Follow clear, maintainable Python code structure and naming conventions
- Include configuration options for runtime parameters (e.g., event sources, thresholds)
- Provide basic observability to support troubleshooting and monitoring

The final solution should demonstrate best practices in event-driven architecture, ensuring that the logistics app can scale automatically and handle daily shipment events reliably in production.
