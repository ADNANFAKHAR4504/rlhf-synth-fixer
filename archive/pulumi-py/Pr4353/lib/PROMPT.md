Please design a robust, automated failure recovery solution for EC2 instances using Pulumi with Python, meeting the following detailed requirements:

- Deploy an AWS Lambda function that detects when EC2 instances enter the stopped state and automatically attempts to restart them within 5 minutes.
- Manage only EC2 instances tagged with `Auto-Recover: true`.
- Configure an SNS topic to send alerts to a predefined email if an instance fails to restart after 3 retry attempts.
- Use CloudWatch Events to trigger the Lambda function every 10 minutes to monitor instance states.
- Store any intermediate or temporary state data in an S3 bucket.
- Use AWS Parameter Store to securely manage sensitive configuration data required by the Lambda.
- The Lambda function must use Boto3 (AWS SDK for Python) for all AWS API interactions.
- Implement comprehensive error handling, logging all exceptions and failures to CloudWatch Logs.
- Ensure EC2 instances recover with their original parameters, including instance type and attached EBS volumes.
- Lambda IAM roles must follow the least privilege principle, granting only permissions necessary to describe, start, and stop EC2 instances, access S3 and Parameter Store, and publish to SNS.
- Limit deployment to the us-west-2 AWS region.
- Define all AWS infrastructure using Pulumi Python, building a modular and reusable codebase that replicates the CloudFormation template approach.
- The solution must be fully deployable, consistent, and repeatable using infrastructure as code principles.

Your code should be clean and ready for production.
