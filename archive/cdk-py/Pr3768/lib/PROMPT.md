Create an AWS CDK v2 Python stack to deploy a reliable event-driven messaging system for a logistics firm processing 20,000 daily delivery events with decoupled services. Use SNS topics for event publishing, SQS queues for message processing, and a Lambda function for event handling. Store processed event logs in DynamoDB, configure a Dead-Letter Queue (DLQ) for failed messages, and set up CloudWatch for queue metrics and monitoring. Apply least-privilege IAM roles and output a fully deployable, secure, and observable CDK program.

Expected output: Single stack (tap_stack.py)
