## Prompt

The infrastructure should be deployed in a single AWS account within the us-east-1 region. Naming conventions should follow the standard 'project-component-environment'. Assume that existing Identity Provider (IdP) information is available for federated authentication setup.


Design and implement a secure AWS environment using Terraform that adheres to strict security and compliance guidelines. Your solution must implement the following requirements, ensuring all constraints are met:
 
 1. Provision an AWS VPC with a public subnet and a private subnet strategy.
 2. Configure AWS IAM to enforce strict identity and access management policies, ensuring users have MFA enabled.
 3. Use AWS Security Groups to maintain least privilege access for all protocols.
 4. Store sensitive data using AWS S3 with server-side encryption enabled and manage these keys using AWS KMS.
 5. Set up AWS CloudTrail to capture and log all API activity within the environment.
 6. Implement AWS Config to automate the security checks across the resources.
 7. Establish alerts for any security events and configure AWS SNS to handle these notifications.
 
 Expected output: You should provide a set of HCL files. Ensure your files can be directly deployed with 'terraform apply' and that all modules are reusable across different projects with similar requirements. Ensure all provided constraints are strictly adhered to; the solution will be evaluated on security efficacy, modularity, and adherence to best practices.