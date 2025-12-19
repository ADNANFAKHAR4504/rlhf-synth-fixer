You are a Senior AWS Solutions Architect and Infrastructure as Code expert specializing in Pulumi with Python.

Your task is to implement an AWS serverless infrastructure using Pulumi (Python SDK) to meet strict organizational and security requirements.

Environment:
This infrastructure is to be deployed in the **us-east-1** region and tagged with **'Environment: Production'** for all resources. Naming conventions and access control must be enforced consistently.

Requirements:

1. Define an AWS Lambda function written in Python to handle HTTP requests.
2. Set up an API Gateway to route HTTP requests to the Lambda function.
3. Configure CORS settings on API Gateway to ensure secure cross-origin access.
4. Create IAM roles and policies for the Lambda function using the principle of least privilege.
5. Enable logging and monitoring via CloudWatch, capturing metrics such as:
- Execution time
- Error counts

6. Tag **all** AWS resources with the key-value tag: `Environment: Production`.

Constraints:

- All infrastructure must be provisioned using Pulumi and Python.
- The deployment must occur in **us-east-1**.
- Code must pass tests validating resource creation, tagging, IAM scoping, and monitoring configuration.
- The solution must follow a modular, readable, and maintainable structure.
- Hardcoded credentials must be avoided. Use Pulumis secrets management or AWS IAM roles for auth.

Expected Output:

A complete Pulumi Python script that provisions the described infrastructure. The code must reflect secure defaults, proper tagging, minimal IAM permissions, and effective monitoring. It should be suitable for deployment as part of an automated CI/CD pipeline and verifiable using automated infrastructure tests.
