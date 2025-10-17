We need a reliable, event-driven processing system for a logistics platform that handles around 2,000 shipment updates per day, each triggered by external events. The system must ensure reliable event delivery, automated processing, and basic operational monitoring. Please produce one self-contained AWS CDK (Python) stack file that provisions the following components with sensible defaults and parameters for customization:

Core Requirements

    •	Amazon EventBridge: Serve as the central event bus for routing external shipment events.
    •	AWS Lambda (Python 3.10): Process incoming events and update shipment records.
    •	Amazon DynamoDB: Store shipment update logs with partition key shipmentId and automatic scaling.
    •	Amazon CloudWatch: Collect metrics for event throughput, Lambda execution time, and errors.
    •	Amazon SNS: Send notifications for failed or delayed events.
    •	AWS IAM: Apply least-privilege access for all components (EventBridge, Lambda, DynamoDB, SNS, CloudWatch).
