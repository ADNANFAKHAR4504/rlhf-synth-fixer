Please design a fault-tolerant, multi-region serverless event processing pipeline suitable for a global financial trading platform using Pulumi with Python. Keep the solution straightforward and easy to maintain with the following requirements:

- Deploy the infrastructure across two AWS regions: primary in us-east-1 and secondary in us-west-2 for disaster recovery.
- Use AWS EventBridge event buses with custom rules to route real-time trading events.
- Implement AWS Lambda functions for processing events as they arrive.
- Utilize DynamoDB Global Tables to maintain transaction consistency across regions.
- Set up CloudWatch alarms to monitor system health and performance indicators.
- Create IAM roles following the principle of least privilege for all Lambda and EventBridge components.
- Configure cross-region replication for DynamoDB Global Tables to ensure data durability and availability.
- Structure the Pulumi Python code to be modular, readable, and reusable without unnecessary complexity.
- Focus on fault tolerance, disaster recovery, and operational observability.
- Use Pulumi and Python, leveraging Pulumi’s native AWS resource support.

Your code should balance resilience, consistency, and maintainability.
