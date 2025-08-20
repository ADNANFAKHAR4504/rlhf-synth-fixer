> **Act as a Solution Architect.**
> Design a **secure, serverless application infrastructure** using **AWS CloudFormation (YAML format)** that meets the following enterprise-grade requirements:
>
> #### Architecture Requirements:
>
> 1. Use **Amazon API Gateway** to expose a **REST API**.
> 2. The API Gateway must trigger an **AWS Lambda** function.
> 3. The Lambda function must perform **read and write operations** on a **DynamoDB table**.
> 4. The Lambda function must be deployed **inside a VPC** to ensure **network security**.
> 5. Define all infrastructure components using **YAML CloudFormation** in a **single template**.
>
> #### Security & Configuration:
>
> * Configure **IAM roles and policies**:
>
> * Grant **API Gateway** permission to invoke the Lambda function.
> * Grant **Lambda** access to **read/write** to the DynamoDB table.
> * Ensure **all resources** are deployed in the **same AWS region**.
> * Define VPC components:
>
> * VPC, Subnets (private preferred), Route Tables, Internet/NAT Gateway (if needed), and Security Groups for Lambda.
>
> #### Expected Output:
>
> * A single CloudFormation **YAML template file** named `serverless-app.yaml`.
> * The template must pass `cfn-lint` and **successfully deploy** in AWS CloudFormation.
> * The output must demonstrate **secure communication** from **API Gateway Lambda DynamoDB**, and enforce **network isolation and security best practices**.

---