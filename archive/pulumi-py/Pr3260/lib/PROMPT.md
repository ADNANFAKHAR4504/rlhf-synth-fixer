Please design a production-ready Infrastructure as Code solution using Pulumi with Python to deploy a serverless AWS Lambda function triggered by S3 bucket events, following these detailed requirements:

- Deploy the Lambda function running Python 3.9 code, triggered by events on a specified S3 bucket.
- The Lambda function should process data from the input S3 bucket and output results to the same or another specified S3 bucket.
- Apply an IAM role granting the Lambda minimal necessary permissions strictly limited to the specified S3 bucket and CloudWatch Logs for execution logging.
- Configure the Lambda function to log activity in CloudWatch Logs and enforce a maximum execution timeout of 5 minutes.
- Implement S3 bucket access restrictions to allow only specific IP ranges.
- Use Pulumi’s native packaging and deployment mechanisms to manage Lambda deployment artifacts, replacing AWS SAM packaging.
- Pass environment variables to the Lambda function via Pulumi configuration parameters for flexible runtime settings.
- Restrict deployment explicitly to the us-east-1 AWS region.
- Ensure the solution is modular, reusable, and includes inline comments explaining each resource and configuration step.
- Guarantee that the infrastructure design adheres to security best practices, including least privilege IAM policies and network restrictions.
- The solution must be fully validated and ready for deployment, complying with AWS CloudFormation validation standards.
- Do not use raw CloudFormation JSON templates; instead, produce Pulumi Python code that replicates these requirements naturally and effectively.

Please keep your solution modular.
