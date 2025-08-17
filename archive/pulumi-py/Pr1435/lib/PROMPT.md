Using Pulumi's Python SDK, sets up an S3 bucket with the following specification:

- **Versioning**: Enable versioning on the bucket to preserve, retrieve, and restore object versions.
- **IAM Role (Least Privilege)**: Create and attach an IAM role with only the permissions necessary to access the bucket.
- **SNS Notifications**: Create an SNS topic to send notifications whenever changes occur in the bucket.
- **CloudWatch Monitoring**: Configure a CloudWatch alarm to track and notify on specific events (e.g., failed access attempts).
- **KMS Encryption**: Apply AWS KMS server-side encryption for data at rest.
- **Block Public Access**: Ensure no public access is allowed to the bucket.
- **Access Logging**: Enable S3 access logging for auditing purposes.
- **Lifecycle Policy**: Automate cleanup of old object versions to manage storage costs.

Design:

- Follow a **modular design**: Each AWS resource (S3 bucket, IAM role, SNS topic, CloudWatch alarm) should be implemented as a **separate component in a `lib` directory**.  
- Apply **best practices for security and cost optimization**.