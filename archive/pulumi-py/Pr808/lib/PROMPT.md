Here's a prompt designed to align with Claude's Sonnet best practices, providing clear, structured, and comprehensive instructions for your serverless application deployment.

---

## Serverless Web Application Deployment on AWS

---

### Objective

As an expert cloud architect and Pulumi developer, your task is to design and implement a **Pulumi Python script** to deploy a foundational **serverless web application infrastructure** on **AWS**. This involves creating a core AWS Lambda function, setting up its trigger via API Gateway, and ensuring proper logging and access management.

---

### Core Architectural Components

The Pulumi program must provision and configure the following AWS services:

- **AWS Lambda Function**: A Python-based serverless function that will serve as the core logic of the application.
- **Amazon API Gateway**: To expose the Lambda function via an HTTP endpoint, allowing external access.
- **AWS CloudWatch Logs**: For capturing and storing all Lambda function execution logs.
- **AWS Identity and Access Management (IAM)**: Essential roles and policies required for the Lambda function's execution permissions and for API Gateway to invoke the Lambda.

---

### Technical Specifications & Constraints

- **Deployment Technology**: The entire solution must be defined using **Pulumi's Python SDK**.
- **Cloud Provider**: All resources must be deployed on **AWS**.
- **Target AWS Region**: All infrastructure and services must reside in the `us-west-2` (Oregon) region.
- **Naming Convention**:
  - **Lambda Functions**: Should adhere to the format `[environment_name]-[function_name]`. For example, if your environment is `dev`, a function might be `dev-my-api-handler`.
  - **General Resources**: While the Lambda has a specific prefix, strive for clear and consistent naming for all other resources (e.g., API Gateway, IAM roles, log groups) that reflects their purpose and association with this serverless application and deployment environment.
- **Tagging**: All deployed AWS infrastructure resources **must** be tagged with `project:serverless-infra-pulumi`.
- **Logging**: Ensure the Lambda function's logs are automatically directed to a dedicated CloudWatch Log Group for monitoring and debugging.
- **Lambda Execution**: The test function must verify that the Lambda function executes successfully upon invocation through the API Gateway endpoint.
- **Security & Efficiency**: Adhere to best practices for security (e.g., least privilege for IAM roles) and efficiency (e.g., appropriate Lambda memory/timeout settings, cost-effective resource choices).

---

### Expected Output

Provide a complete and runnable **Pulumi Python program** (`__main__.py` and any supporting files). The program should include:

1.  **Pulumi Infrastructure Code**: Defines all AWS resources as specified above.
2.  **Lambda Function Code**: A basic Python handler for the Lambda function.
3.  **Unit Tests**: A Python test function (e.g., using `unittest` or `pytest`) that simulates an API Gateway invocation and asserts the successful execution of the Lambda function. This test should confirm the Lambda's ability to be triggered and return an expected successful response.

<!-- end list -->

```python
# Your Pulumi Python script (e.g., __main__.py) will be presented here.
# It should be a self-contained and executable Python program.
# Include comments for clarity on resource definitions and dependencies.

# Additionally, include the Python unit test code for the Lambda function.
```
