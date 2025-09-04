## Secure AWS Infrastructure Setup

We need a CloudFormation YAML template to set up a secure AWS infrastructure. It's going into an AWS account in the `us-west-2` region, using a single VPC with public and private subnets. All resources should follow the naming convention 'corp-resourceName'. Remember to use AWS's default KMS key for encryption.

Here's what the template needs to do:

- **IAM Permissions**: Implement IAM roles and policies that grant only the bare minimum permissions needed for all services.
- **Data Encryption**: Use AWS KMS to encrypt all sensitive data when it's sitting still, across different services.
- **Logging**: Make sure logging is on for all the important AWS services to catch critical security events.
- **Network Setup**: Configure a VPC with both private and public subnets for secure network separation, following AWS recommendations.
- **Resource Tagging**: Tag every resource with 'Environment', 'Owner', and 'Project' for tracking and cost management.
- **API Auditing**: Enable AWS CloudTrail to record every API call for auditing purposes.
- **MFA for Users**: Multi-factor authentication (MFA) must be turned on for the root account and all active IAM users.
- **Security Groups**: Design Security Groups to restrict traffic, ensuring only necessary ports are open.
- **ELB Health Checks**: Allow all Elastic Load Balancers (ELBs) to perform health checks to keep things highly available.
- **RDS High Availability**: Deploy RDS databases in a multi-AZ setup for better fault tolerance.
- **Lambda Permissions**: Apply least privilege policies to all AWS Lambda functions within the architecture.

What we need back is a CloudFormation YAML template. It should meet all these requirements, adhere to AWS security best practices, and work correctly when deployed.
