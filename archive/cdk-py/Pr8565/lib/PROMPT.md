## AWS CDK Infrastructure Prompt (Aligned with Claude Sonnet 3.7 Best Practices)

You are an expert AWS architect.

Please write a complete Python AWS CDK application (in one or more stacks, if appropriate) that does the following:

1. **Creates a production-ready serverless REST API** using AWS **API Gateway** and **AWS Lambda**.
2. The API must be designed to **handle 1000 concurrent requests** with **minimal latency**, using appropriate settings for Lambda concurrency, memory size, and timeout configuration.
3. All resources must be deployed in the **`us-east-1` region** using the **Python CDK**.
4. The **Lambda function(s)** should include:
   - Proper **IAM permissions** following **least privilege** principles.
   - **CloudWatch logging** for execution success and error metrics.
   - Production-grade configurations (e.g., environment variables, reserved concurrency if needed).
5. **API Gateway** should be integrated with the Lambda backend and properly configured with:
   - At least one endpoint (e.g., `GET /status`) as an example.
   - Security best practices such as **throttling**, **request validation**, and **logging**.
6. All provisioned resources must be **tagged** with the key-value pair `Environment:Production`.
7. Ensure the solution follows **AWS security best practices** for production environments:
   - No public access where unnecessary.
   - No hardcoded secrets.
   - Use of secure IAM roles and policies.

### Additional Requirements:

- Output must be a **valid Python CDK app**, using constructs from `aws_cdk.aws_apigateway`, `aws_cdk.aws_lambda`, and other necessary CDK modules.
- Include **comments** in the code explaining major components and decisions.
- If necessary, modularize the CDK constructs (e.g., separate stacks or constructs for API, Lambda, logging, etc.).

### Key Focus:

- Ensure **resource connectivity** — API Gateway must be connected to Lambda.
- Ensure logging flows to CloudWatch.
- Ensure Lambda is configured to scale to the required concurrency.
