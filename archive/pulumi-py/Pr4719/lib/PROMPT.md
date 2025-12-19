## our prompt

Please design a scalable, regionally agnostic serverless backend architecture using Pulumi with Python, focusing on the following practical requirements:

- Use AWS Lambda as the serverless compute layer, avoiding any EC2 instances, and expose RESTful endpoints through API Gateway.
- Configure Lambda functions with tightly scoped IAM roles that grant access to specific S3 buckets used for static file storage.
- Pass environment variables to Lambda functions from configuration data, preferably serialized in JSON format.
- Define separate API Gateway deployment stages such as 'dev', 'test', and 'prod', each with distinct configurations.
- Integrate AWS Systems Manager Parameter Store to securely handle sensitive configurations and credentials for the infrastructure.
- Enable CloudWatch logging for Lambda functions to capture operational data and monitor API performance metrics thoroughly.
- Architect the solution to work seamlessly across multiple AWS regions without manual reconfiguration or drift.
- Structure the Pulumi Python code to be modular, well-documented, and maintainable, with automated deployment capabilities.

Remember to keep your solution organized while still emphasizing on security, scalability, environment separation, and operational observability.
