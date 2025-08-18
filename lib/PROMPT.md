## Building a Secure AWS Web App

Hey, we need a CloudFormation template to set up a really **secure AWS infrastructure** for a web app.

Here's what it needs to do:

- **IAM Roles:** Use IAM roles to give everything just enough access, no more.
- **CloudTrail:** Turn on CloudTrail everywhere to log all API activity in our AWS account.
- **Data Encryption:** Encrypt all data that's just sitting there (at rest) using AWS KMS.
- **S3 Versioning:** Turn on versioning for all S3 buckets, so we don't accidentally lose files.
- **Region:** All resources need to be deployed in the **`us-east-1` region**.
- **Security Groups:** Set up security groups to only allow necessary network access.
- **AWS Config:** Use AWS Config rules to continuously check if our setup follows security best practices and fix issues.

This setup is for a global web app in AWS. It's all about high security, compliance, and making sure it stays online. Everything goes in `us-east-1`, and we'll use standard names for things like VPCs, S3 buckets, EC2 instances, and IAM roles.

We need a YAML CloudFormation template. It has to work, set up all the security and replication stuff, and pass all its tests when we deploy it in AWS.
