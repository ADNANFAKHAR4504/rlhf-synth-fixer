# **AI Prompt: Secure AWS Multi-Account Configuration with CDK and TypeScript**

This prompt is designed to instruct an AI model in generating an AWS CDK TypeScript program for a multi-account AWS security configuration.

### **Prompt Details**

- **Problem ID:** SecurityConfigurationasCode_Pulumi_Python_4f7jc09h3k8r
- **Environment:** You need to configure security settings across multiple AWS accounts using **CDK with TypeScript**. The application's infrastructure requires secure configurations to protect sensitive data and limit access to critical resources.
- **Constraints Items:**
  - Ensure all IAM roles have the least privileges necessary.
  - Enable multi-factor authentication (MFA) for all IAM users.
  - Encrypt all data at rest using the AWS KMS service.
- **Proposed Statement:** The target infrastructure environment includes AWS resources primarily within the us-east-2 and us-west-2 regions. You will use **CDK with TypeScript** to configure the security of a multi-account AWS setup. Naming conventions should follow company standards (e.g., dept-env-purpose, such as hr-prod-database). IAM roles and policies should adhere to least privilege principles.

### **Requirements (Steps for the AI)**

1. **CDK Project Structure:** Create a CDK project in TypeScript with a file structure that can manage resources across multiple AWS accounts and regions (us-east-2, us-west-2).
2. **IAM and Authentication:**
   - Define IAM roles for both development and production environments, ensuring each role's policies grant only the minimum permissions required for its function (principle of least privilege).
   - Create a CDK construct or function that configures a policy requiring all IAM users to use Multi-Factor Authentication (MFA).
3. **Data Encryption:**
   - Provision an AWS Key Management Service (KMS) Key.
   - Define a policy for the KMS Key that restricts its use to authorized IAM roles and services.
   - Ensure that all relevant data storage services (e.g., S3 buckets, RDS databases) created by the infrastructure program are configured to use this KMS key for server-side encryption at rest.
4. **Resource Naming:** All resources must follow the specified naming convention: \<dept\>-\<env\>-\<purpose\>.

### **Testing Requirements**

- **Unit Tests:** Implement unit tests for the CDK program to verify the correct configuration of security settings. This includes:
  - Testing the IAM role policies to ensure they do not contain excessive or wildcard permissions.
  - Verifying that the KMS Key policy restricts access appropriately.
  - Confirming that data storage resources are configured with the correct KMS key for encryption.
- **Integration Tests:** Write integration tests to deploy the stack and validate that the deployed infrastructure meets all security requirements in a live AWS environment.
- **Code Coverage:** The combined unit and integration tests must achieve **100% code coverage** for the CDK program.

### **Expected Output**

The final output should be a complete, well-commented TypeScript script using the CDK library that defines the security configuration as code. The code must be self-contained and runnable, including the necessary testing framework, and demonstrate compliance with all specified constraints and security best practices. The solution must be idempotent.
