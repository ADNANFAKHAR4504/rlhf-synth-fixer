> Act as a **Solution Architect**. Your task is to design and implement a secure, scalable, and modular **serverless microservices infrastructure** using the **AWS Cloud Development Kit (CDK) with Python** in the **`us-east-1` AWS region**.
>
> Your implementation should:
>
> 1. Define **AWS Lambda functions** (written in **Python 3.8**) for handling backend logic.
> 2. Use **Amazon API Gateway** to expose these Lambda functions via **RESTful HTTP endpoints**.
> 3. Implement **secure secrets management** by retrieving API keys or credentials from **AWS Secrets Manager** or **SSM Parameter Store**.
> 4. Use **IAM roles and policies** that follow the **principle of least privilege**.
> 5. Structure the CDK application into **logical constructs and stacks** for **scalability** and **clean code organization**.
> 6. Enable **CloudWatch logging** and metrics for monitoring the Lambda executions.
>
> Deliverable: A complete AWS CDK  written in Python in single file that defines and deploys this infrastructure. The solution should:
>
> * Avoid hardcoding secrets or sensitive data
> * Be extendable to support additional microservices
> * Pass `cdk synth`, `cdk deploy`, and relevant validation checks
>