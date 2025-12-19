Please design a reliable, automated failure recovery and high availability solution for a web application infrastructure using Pulumi with Python. The solution should meet the following key requirements:

- Automatically restore the infrastructure to its last valid state within 15 minutes of failure, ensuring no data loss during rollback.
- Support Auto Scaling groups and maintain the current number of instances during rollback operations.
- Integrate AWS Lambda to orchestrate rollback triggers and AWS SNS for alert notifications upon failure or recovery events.
- Employ AWS CloudWatch to monitor the overall system state, trigger automated rollbacks, and enable comprehensive logging.
- Store detailed logs for debugging in an encrypted S3 bucket.
- Manage configuration parameters dynamically and securely via AWS Systems Manager Parameter Store.
- Ensure the solution is compatible with deployment across multiple AWS regions, minimizing downtime.
- Implement cost-efficient cleanup of unused resources following recovery.
- Provide least privilege IAM roles tailored specifically for rollback actions.
- Structure the Pulumi Python code to be modular, maintainable, and well documented for operational clarity.

This prompt tests your capability to build advanced fault-tolerant AWS infrastructure with Pulumi Python, focused on automation, observability, and multi-region.
