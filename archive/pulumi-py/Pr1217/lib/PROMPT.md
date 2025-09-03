# High-Level Prompt: Pulumi AWS Serverless Infrastructure in Python

## Goal
Develop a **modular Pulumi-based infrastructure** in Python to set up a **serverless architecture** on AWS.

## Requirements
1. **AWS Lambda**
   - Deploy a Python-based AWS Lambda function.
   - Lambda source code is located in an **external repository**.

2. **S3 Bucket**
   - Create an S3 bucket that:
     - Triggers the deployed Lambda upon **object creation**.
     - Has **versioning enabled**.

3. **IAM Roles**
   - Create IAM roles and policies for Lambda execution and S3 access.
   - Apply the **least privilege principle**.

4. **Pulumi Backend**
   - Use **AWS backend** for Pulumi state management.

5. **Region**
   - All resources must be deployed in **`us-west-2`**.

6. **Outputs**
   - Output the **ARN** of:
     - The created Lambda function.
     - The created S3 bucket.

7. **Code Organization**
   - Follow a **modular architecture**:
     - Store resource definitions in **classes** under a `components/` folder.
     - Keep function code separate from Pulumi scripts.
     - Maintain clean structure for readability and scalability.

8. **Best Practices**
   - Ensure clear separation of concerns between components.
   - Use meaningful variable and class names.
   - Follow Pulumi and AWS security best practices.

## Expected Deliverable
- A set of **Python scripts** that, when executed with Pulumi, will:
  - Deploy the described infrastructure.
  - Output the specified ARNs.
  - Follow the modular structure defined above.