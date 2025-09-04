> Act as a **Solution Architect**. Design and implement security configuration for a microservice-based AWS infrastructure using **AWS CDK in Python**. The application architecture includes **API Gateway**, **Lambda functions**, **S3**, and **DynamoDB**. Apply the following security practices:
>
> 1. Create **IAM roles and policies** with **least privilege access** for each component (Lambda, API Gateway, etc.).
> 2. Use **environment variables** to inject and manage **secret access keys** for AWS resources (e.g., DB credentials, API keys), avoiding hard-coded credentials.
> 3. **Tag all resources** with required key-value pairs following company standards (e.g., `Environment`, `Team`, `CostCenter`, `Project`).
> 4. Ensure the infrastructure code complies with the organizations **security standards and compliance policies**.
> 5. Enable **logging** for all networking components, such as:
>
> * **VPC Flow Logs**
> * **API Gateway Access Logs**
> * **CloudTrail or CloudWatch Logs** for auditing
>
> **Expected Output:**
>
> * A **Python AWS CDK application** that:
>
> * Provisions the required AWS resources: **API Gateway, Lambda functions, S3, DynamoDB**
> * Configures **IAM roles/policies** with **least privilege**
> * Injects **secrets via environment variables** securely
> * Adds **tags** to all resources using CDK tagging
> * Enables **network logs** for audit and tracking

---