## Setting Up AWS Security

We need a Terraform setup for AWS. Here's what it needs to do:

- **S3 Access**: Restrict access to an S3 bucket using IAM roles and policies based on its tags.
- **EC2 Placement**: Launch EC2 instances only inside a specific VPC and subnet we already have.
- **S3 Encryption**: Encrypt S3 bucket data at rest with a specific KMS key, and ensure it's encrypted when moving too.
- **Network Rules**: Limit security group rules to allow only HTTPS and SSH connections, and only from a specific set of IP addresses.
- **API Logging**: Turn on AWS CloudTrail to log every API call made to the account.
- **Deployment User**: Create an IAM user with only the necessary permissions for deployment tasks.
- **Tagging**: All resources must be tagged with 'Environment:Production'.

The infrastructure is in an AWS account, specifically in the 'eu-west-3' region. We have strict security and tagging rules.

Give us the Terraform script. It should be in HCL, work correctly, and follow all these requirements when deployed.
