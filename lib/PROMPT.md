Use Terraform HCL to define the infrastructure. | Ensure the infrastructure supports high availability across multiple AWS regions.
 | Implement encryption at rest for all data storage components using AWS KMS.
 | Use IAM roles and policies to minimally grant necessary permissions to each component.
 | Set up VPCs with public and private subnets, ensuring secure communication between services. 
 | Include logging and monitoring for all components using AWS CloudWatch.


As a DevOps engineer at a financial services company, you are tasked with creating a highly secure and highly available cloud infrastructure using Terraform.
 Your solution must meet the following requirements: 
 1. Deploy all components using Terraform HCL.
 2. Ensure the infrastructure spans multiple AWS regions to provide high availability.
 3. Encrypt all stored data using AWS Key Management Service (KMS).
 4. Define IAM roles and policies to grant the minimum necessary permissions to different services and components. 
 5. Design a VPC architecture with both public and private subnets to enhance security and enable inter-service communication. 
 6. Implement comprehensive logging and monitoring using AWS CloudWatch.\n\nExpected output: Create a set of Terraform HCL files that defines the aforementioned infrastructure.
 These files should pass validation and syntax checks and effectively deploy the infrastructure upon execution with Terraform.


The infrastructure is designed for a financial services company operating in multiple AWS regions to ensure high availability, security, and compliance. Components include VPCs with subnets, IAM roles and policies, data storage solutions, and logging services.