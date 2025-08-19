You are an experienced AWS Cloud Architect with deep expertise in designing Infrastructure as Code (IaC) solutions using CloudFormation. Your task is to generate a **YAML-based CloudFormation template** that provisions a **serverless API architecture** in AWS. The template should conform to the following requirements:

### Requirements:

1. **Region**:
   - The infrastructure must be deployed in the **us-east-1** region.

2. **Lambda Function**:
   - Implement an AWS Lambda function as the compute service.
   - The function must have **at least 256 MB of memory** and a **15-second timeout**.
   - Assign **environment variables** for data processing.

3. **API Gateway**:
   - Configure an **Amazon API Gateway (REST API)**.
   - The API must handle **HTTP GET requests** on the path `/data`.
   - The request should correctly trigger the Lambda function.
   - Do not include unnecessary stages or features beyond what is needed.

4. **IAM Role**:
   - Define an **IAM Role** with **least privilege permissions** required for the Lambda function to execute successfully.

5. **Logging and Monitoring**:
   - Enable **CloudWatch logging** for both the Lambda function and the API Gateway.

6. **Template Quality**:
   - The CloudFormation template must be fully valid and error-free.
   - Follow **YAML format standards** and **CloudFormation template anatomy best practices**.
   - Include **descriptions** and **metadata** for resources to make the template clear and production-ready.

---

### Constraints Checklist:

- AWS Lambda is used as compute.
- API Gateway exposes Lambda via `/data` (HTTP GET).
- Region is fixed to **us-east-1**.
- Lambda has **≥256 MB memory** and **15s timeout**.
- IAM role follows the **principle of least privilege**.
- Logging is enabled for Lambda and API Gateway with **CloudWatch**.
- Template is **YAML**, validated, and documented with metadata/descriptions.

---

### Expected Output:

A **complete CloudFormation YAML template** that:

- Provisions Lambda, API Gateway, IAM roles, and logging.
- Passes `aws cloudformation validate-template` with no errors.
- Creates a working `/data` endpoint in API Gateway backed by the Lambda function.
