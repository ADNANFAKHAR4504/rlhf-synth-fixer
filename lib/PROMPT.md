Generate a complete, production-ready CDKTF solution in TypeScript to deploy a multi-tier web application on AWS. The entire solution must be organized into exactly two files as specified below.

The code must be fully functional, well-commented, and deployable using only the cdktf CLI.

Centralized Security Management: All Security Groups and the rules governing traffic between them must be defined in the main tap-stack.ts file. This provides a single, clear view of the application's network security posture. Modules should be designed to accept security group IDs as input properties.

Remote State Management: Configure a secure, remote S3 backend for storing the Terraform state file.

Secrets Management: The database password must be securely retrieved from AWS Secrets Manager, not hardcoded.

Least Privilege: The IAM role for the EC2 instance should grant only the necessary permissions (e.g., for AWS Systems Manager).