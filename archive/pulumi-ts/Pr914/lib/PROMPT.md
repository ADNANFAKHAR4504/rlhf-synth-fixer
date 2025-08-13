# Production-Ready Secure Serverless API

**Role:** You are an expert AWS Security Architect and a senior TypeScript/Node.js developer with deep expertise in Pulumi. Your primary responsibility is to build highly secure, production-ready, and cost-efficient serverless infrastructures on AWS, with an uncompromising focus on the principle of least privilege.

**Objective:** Generate a complete, well-structured Pulumi TypeScript project to deploy a highly secure, private, serverless API backend in the `us-east-1` region. The infrastructure must be production-ready, incorporating modern AWS security and networking best practices to ensure all components are isolated from the public internet and operate with the absolute minimum required permissions.

---

### **High-Level Architecture Scenario: A Secure Document Processing API**

You are to build the infrastructure for a secure API that allows authenticated users to submit documents. The API Gateway will receive a request,trigger a private Lambda function, which then processes the request and stores the resulting document in a secure S3 bucket. All components must be locked down, and all data must be encrypted both in transit and at rest using AWS managed keys for simplicity and cost efficiency.

---

### **Detailed Infrastructure & Resource Connectivity**

Your Pulumi project must provision the following interconnected resources, demonstrating a deep understanding of secure cloud architecture.

1.  **VPC & Private Networking:**
    - Provision a VPC.
    - Create **public subnets** and **private subnets** (for the Lambda function) across at least two Availability Zones.
    - **Best Practice - VPC Endpoints:** Provision **Gateway VPC Endpoints** for S3 do not use NAT Gateways.
      - **Connection:** This is critical for security. It ensures that the Lambda function in the private subnet can access S3 via the private AWS backbone, without its traffic ever traversing the public internet.

2.  **S3 Bucket for Secure Storage:**
    - Provision a private S3 bucket.
    - **Connection & Security:**
      - This bucket must be encrypted at rest using **AWS managed keys (AES-256)** for simplicity and cost efficiency.
      - Enable versioning and configure access logging to another S3 bucket.
      - Block all public access.
      - Attach a **Bucket Policy** that explicitly denies all actions (`"Action": "*"`) unless the request comes from the specific Lambda execution role or through the S3 VPC Endpoint.

3.  **Lambda Function & IAM Role (Core Logic & Least Privilege):**
    - Provision a Lambda function. The function handler can be a simple inline placeholder demonstrating the logic.
    - **Connection & Security:**
      - The function **must** be deployed into the **private subnets** of the VPC.
      - Create a dedicated **IAM Execution Role** for this Lambda function. This role's IAM policy is the most critical part of the least-privilege implementation and must **only** grant the following permissions:
        - `s3:PutObject` on the specific S3 bucket ARN (`arn:aws:s3:::your-bucket-name/*`).
        - Permissions to create and write to its own CloudWatch Log Stream (`logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`) on a specific log group resource.
        - VPC-related permissions for running in a VPC.

4.  **API Gateway (Secure Entry Point):**
    - Provision a **REST API Gateway**.
    - **Connection & Security:**
      - Configure a default stage with logging enabled, sending logs to a CloudWatch Log Group.
      - Create an integration that triggers the Lambda function.
      - **Best Practice - Private Integration:** The integration between the API Gateway and the Lambda function must be private.

5.  **CloudWatch for Auditing:**
    - Provision a dedicated CloudWatch Log Group for the Lambda function.
    - Set a log retention policy (e.g., 90 days).
    - To demonstrate least privilege for auditing, add a comment explaining how you would create a separate IAM role for an "Auditor" that has `logs:GetLogEvents` and `logs:FilterLogEvents` permissions **only** on this specific log group's ARN.

---

### **Integration Test: How It All Works Together**

To validate the solution, the output should include a `README.md` file that explains how to test the end-to-end flow after deployment:

1.  **Trigger the API:** Use a tool like `curl` to make a `POST` request to the deployed API Gateway endpoint URL.
2.  **Private Execution:** Explain that this request triggers the Lambda function securely within the private subnet.
3.  **Secure Storage:** The Lambda function then uses its IAM role to write an object to the S3 bucket, which is automatically encrypted by AWS managed keys. This action is only possible via the S3 VPC Endpoint.
4.  **Verify the Outcome:** The user should then verify the successful execution by:
    - Checking the CloudWatch Logs for the Lambda function to see its output.
    - Navigating to the S3 bucket in the AWS Console to see the newly created, encrypted object.

---

### **Expected Output Format**

- **Language:** TypeScript
- **Tool:** Pulumi.

### **Mandatory Constraints Checklist**

Ensure the final Pulumi project explicitly implements every one of these constraints:

- **Region:** All resources are created in `us-east-1`.
- **Pulumi + TypeScript:** The entire infrastructure is defined in a well-structured Pulumi TypeScript project.
- **Least Privilege:** The Lambda IAM role has the absolute minimum necessary permissions, scoped to specific resources.
- **S3 Security:** The S3 bucket is fully private, encrypted with AWS managed keys (AES-256), and has a restrictive bucket policy.
- **VPC Isolation:** The Lambda function is deployed in a private subnet and communicates with other AWS services via VPC Endpoints.
- **CloudWatch Logging:** Logging is configured for the API Gateway and Lambda, with a clear path for secure, least-privilege access to logs.
