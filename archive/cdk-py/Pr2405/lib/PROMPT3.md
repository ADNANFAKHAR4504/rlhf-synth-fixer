Hi there! I need your help with setting up a serverless web application on AWS. The idea is to use AWS Lambda for the compute layer, triggered by an API Gateway, and DynamoDB for storing data. I’d like to define the infrastructure using AWS CDK with Python, and it’s important that the solution is secure, reliable, and follows best practices.

So, here’s what we’re trying to achieve. The Lambda functions should be triggered by an API Gateway, and we want to make sure the API Gateway has a usage plan in place. This means adding throttling and quotas to manage traffic effectively. For monitoring, we’ll use AWS CloudWatch to keep track of the Lambda functions, so we can troubleshoot and optimize performance when needed.

Security is a big deal here. Any persistent storage, like DynamoDB or S3, should have encryption at rest enabled. We also want to manage permissions carefully using IAM roles, making sure each resource only gets the access it absolutely needs.

Another thing to keep in mind is high availability. The application should be deployed in multiple region (us-west-2) so it can handle regional outages and stay resilient. And finally, we’ll need a detailed README that explains how everything works, how to deploy it, and any other important details.

Can you help build this solution using AWS CDK with Python? Let’s make sure the code is clean, easy to understand, and aligns with best practices for serverless architecture.