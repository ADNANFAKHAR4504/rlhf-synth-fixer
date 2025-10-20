Please create a reliable and scalable AWS environment migration solution using Pulumi with Python, focusing on the following human-centered requirements:

- Automate the deployment of complete AWS infrastructure stacks across multiple regions, ensuring consistency and security compliance without using raw Boto3 or CloudFormation templates directly.
- Define and assign IAM roles and policies with tight scopes to allow secure and least-privilege access to resources.
- Securely manage sensitive configuration data using AWS Secrets Manager or AWS Systems Manager Parameter Store integrated with Pulumi.
- Enable comprehensive logging and monitoring of application and infrastructure activity through AWS CloudWatch Logs.
- Use S3 buckets for centralized storage of Pulumi templates or deployment assets, ensuring efficient access and versioning.
- Incorporate automated resource validation, rollback mechanisms, and error handling in the Pulumi Python deployment scripts to minimize downtime during failures.
- Establish SNS-based notification systems to alert deployment status and operational events.
- Apply consistent resource tagging aligned with predefined naming conventions to ease management and cost allocation.
- Design Pulumi Python scripts to automate environment setup and teardown with clear, maintainable documentation.
- Guarantee cross-region deployment support by leveraging Pulumi’s multi-region capabilities and dynamic configuration.
- Structure the code in a modular, reusable fashion that promotes operational clarity and repeatability.

Remember, we are emphasizing on automation, security, operational monitoring, and resilience
