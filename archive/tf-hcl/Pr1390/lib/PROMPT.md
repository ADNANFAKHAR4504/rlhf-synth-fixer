## Prompt

You are tasked with creating a **serverless infrastructure** on AWS using **Terraform**.  
The solution must adhere to the following **requirements and constraints**:

### Functional Requirements
1. **AWS Lambda Functions**
   - Implement **two** Lambda functions.
   - Each Lambda function must have **512 MB** of memory allocated.
   - Use Python or Node.js runtime (choose one and keep it consistent across both functions).

2. **AWS DynamoDB**
   - Create **one DynamoDB table** to be shared by both Lambda functions.
   - The table must have **at least**:
     - **5 Write Capacity Units (WCU)**
     - **5 Read Capacity Units (RCU)**

3. **IAM Role & Permissions**
   - Create an **IAM role** with the **minimum required permissions** for Lambda to:
     - Read from the DynamoDB table.
     - Write to the DynamoDB table.

4. **Deployment Region**
   - All resources must be deployed in **`us-east-1`**.

5. **Terraform Implementation**
   - Use **HCL (HashiCorp Configuration Language)**.
   - Modularize the infrastructure using **Terraform modules**.
   - Follow the **naming convention**:  
     ```
     companyname-env-resource
     ```
     Example: `acme-dev-lambda1`

### Deliverables
- Terraform configuration files that, when executed, will deploy the specified infrastructure.
- The project must:
  1. Run successfully with:
     ```bash
     terraform init
     terraform plan
     terraform apply
     ```
  2. Create all resources as per the above requirements.
  3. Include any **module files** or **scripts** required for deployment.

### Additional Context
- The project uses Terraform for **infrastructure provisioning** in AWS.
- Environments follow the **`companyname-env-resource`** naming standard to maintain consistency across **development**, **staging**, and **production**.
