### **Prompt Details**

- **Environment:** Your task is to set up a secure infrastructure configuration using CDK Typescript. Specifically, you should focus on ensuring that data is both encrypted at rest and in transit, and that IAM permissions adhere to best practices.
- **Constraints Items:**
  - Use AWS KMS to encrypt S3 bucket data at rest.
  - Ensure data is encrypted in transit using SSL certificates.
  - Implement IAM roles with the principle of least privilege.
- **Proposed Statement:** You are to configure infrastructure using CDK for an existing multi-region setup, spanning us-west-2 and eu-central-1. The environment includes multiple VPCs, S3 buckets, and EC2 instances. The solution will be in Typescript.

### **Requirements (Steps for the AI)**

1. **Repository Setup:** Create a new branch named secure-setup for the CDK project.
2. **AWS Services:** The infrastructure should include an S3 bucket for data storage and a public-facing endpoint (e.g., API Gateway) that interacts with the data.
3. **CDK Code:**
   - Write a Typescript program using the CDK library to define the infrastructure.
   - The S3 bucket must be configured to use a new or existing AWS KMS key for default encryption. This should apply to all existing and future objects in the buckets.
   - The public endpoint must enforce the use of SSL/TLS with valid SSL certificates to secure data in transit.
   - Define an IAM role with the minimum necessary permissions for the services to function, ensuring it can only access the specified resources.
4. **Testing:** Include a section with unit tests for the CDK program.
   - The tests should verify that the S3 bucket's encryption configuration is correct (e.g., checks the default encryption settings).
   - The tests should also confirm that the IAM role's policy adheres to the principle of least privilege by checking its policy document.

### **Expected Output**

The final output should be a complete and well-commented Typescript program using the CDK library that defines infrastructure as code to meet the above requirements. The code should include unit tests verifying encryption and IAM configurations, and all tests should pass without errors.
