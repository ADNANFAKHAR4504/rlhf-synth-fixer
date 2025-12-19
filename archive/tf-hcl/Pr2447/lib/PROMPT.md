The infrastructure must be provisioned in the us-west-2 region. 
All security groups must block incoming traffic by default. 
All resources must have tags for Name, Environment, and Owner. 
Use of hard-coded secrets in Terraform files is prohibited; use AWS Secrets Manager instead. 
Ensure logging is enabled for all AWS services used.

Design a Terraform configuration to secure and manage a basic AWS infrastructure in the us-west-2 region.

Your task is to ensure the configuration aligns with security best practices: 
1. Implement a Virtual Private Cloud (VPC) with private and public subnets. 
2. Configure Network Access Control Lists (NACLs) to restrict inbound and outbound traffic.
3. Utilize AWS Identity and Access Management (IAM) roles and policies for secure access. 
4. Make use of AWS Secrets Manager to store any sensitive data referenced in the infrastructure. 
5. Enable proper logging mechanisms for resources such as VPC flow logs, S3 bucket access logs, and CloudTrail. 

Ensure all security groups deny incoming traffic by default and are tagged according to company policy. 
Expected output: A set of Terraform HCL files that when applies will set up the infrastructure adhering to all outlined constraints. 
Ensure to run `terraform plan` and `terraform apply` with no errors and resources configured properly as specified.

Provision infrastructure in the us-west-2 region using AWS services. Maintain strict security measures including limited inbound traffic and active logging.