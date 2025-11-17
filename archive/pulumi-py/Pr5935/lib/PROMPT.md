Hey there! We’d like you to design a robust and scalable file upload system using Pulumi with Python on AWS.

Here’s what we need:

- Use AWS Lambda functions (written in the latest Python) to handle file processing tasks.
- Configure an API Gateway to trigger these Lambdas upon file upload requests.
- Store uploaded files in an S3 bucket with a **public-read access policy**.
- Use DynamoDB to store metadata for each file uploaded to S3, with **AWS KMS encryption** for data at rest.
- Assign least-privilege IAM roles to Lambda functions so they only have the permissions they need.
- Set up a CloudWatch log group to monitor all Lambda executions.
- Configure SNS to send notifications whenever a file is uploaded to the S3 bucket.
- Implement AWS Step Functions to automatically retry failed Lambda executions for error resilience.
- Ensure the entire infrastructure can **scale automatically** to handle traffic spikes.
- All resources must be deployed in the **us-east-1** region.

Expected output:

- a Pulumi Python stack that provisions all these resources, handles retries and notifications seamlessly.
- The solution should follow best practices as well as have a modular structure!
