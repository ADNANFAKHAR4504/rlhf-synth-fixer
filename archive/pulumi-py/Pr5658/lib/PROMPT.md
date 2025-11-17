PlHey man, we want you to design a secure, scalable, and maintainable CI\CD pipeline infrastructure using Pulumi with Python.
You should incorporating the following specifications:

- Deploy AWS Lambda functions within a VPC to enhance security.
- Set up an API Gateway with a pre-configured usage plan that enforces rate limiting.
- Use environment variables for all Lambda function configurations.
- Apply IAM roles adhering strictly to the principle of least privilege, specifically for Lambda execution.
- Support multi-region deployment across us-east-1, us-west-2, and eu-central-1 regions.
- Integrate CloudWatch Metrics to monitor Lambda invocations, errors, and overall performance.
- Tag all resources consistently according to the company’s tagging policy (e.g., including tags such as 'Environment' and 'Owner').
- Implement AWS CodePipeline to automate the CI/CD process for Lambda function deployments.
- Provision an S3 bucket dedicated to storing Lambda application logs securely.
- Configure Lambda functions to automatically handle retries upon failure, ensuring robustness.

Remember, we need you to Ensure that the design is modular, reusable, and well-documented, built for easy maintenance and reliable multi-region operation.
