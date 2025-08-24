## Implementing AWS Security with CloudFormation

We need to build a CloudFormation YAML template to set up a secure AWS environment. This setup needs to follow our organization's security and compliance rules. The infrastructure spans multiple AWS accounts and regions, and we're using a centralized logging strategy. All resource names should follow the `proj-env-resource-randomstring` format (e.g., `myproj-prod-s3bucket-a1b2c3d4`). We also need to make sure there are no linting errors and that the code meets all security standards.

Here's what the template needs to include:

* **S3 Encryption**: All S3 buckets must have server-side encryption enabled using **SSE-S3 (AWS-managed keys)**. This is crucial for protecting data at rest.
* **IAM Least Privilege**: Define IAM roles and policies carefully. They should **avoid wildcard permissions** and instead list specific actions grouped logically by service, ensuring each role has only the minimum necessary permissions.
* **Global Auditing**: **AWS CloudTrail** must be enabled in **all AWS regions**. Its logs will be stored in a central S3 bucket, allowing for comprehensive auditing of all API calls across the entire organization.
* **VPC Flow Logs**: Configure **VPC Flow Logs** for all VPCs. These logs will capture information about IP traffic and must be stored in a designated S3 bucket, which also needs to be encrypted using server-side encryption.

This CloudFormation YAML template should be functional, adhere to all these constraints, and pass AWS CloudFormation validation tests. It should also include a `README` file with clear instructions on how to set it up and how to check that each security configuration is working as expected.