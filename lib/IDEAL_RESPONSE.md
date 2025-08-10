Objectives
Provision a Secure S3 Bucket

Create an S3 bucket with versioning enabled.

Block all forms of public access.

Apply consistent resource tagging.

Implement Remote State Management

Use an S3 bucket as the backend for storing Terraform state remotely.

Enable encryption and versioning on the state bucket.

Use a DynamoDB table to manage state locking and prevent concurrent modifications.

Follow Infrastructure Best Practices

Modular code structure for reusability.

Validate input variables to catch misconfigurations early.

Apply security-conscious defaults (e.g., block public access, enable encryption).

Use descriptive and consistent tagging across resources.