# Task: Security Configuration as Code - Secure S3 Bucket

## Task ID: trainr937
## Platform: CloudFormation
## Language: YAML
## Difficulty: Hard

## Requirements

Design an AWS CloudFormation template in YAML that sets up a secure S3 bucket with integrated security services. The template must show how these AWS services connect and work together:

1. **S3 Bucket Versioning**: The S3 bucket must have versioning enabled to preserve multiple variants of an object.

2. **Server-side Encryption with KMS Integration**: The S3 bucket connects to AWS KMS to enforce server-side encryption using KMS-managed keys. The KMS key must be configured to allow the S3 service principal to use it for encryption operations.

3. **VPC-restricted Access**: Set up a bucket policy that restricts S3 bucket access to requests originating from a specific VPC (vpc-123abc456). The bucket policy integrates with VPC endpoints to validate the source VPC of incoming requests.

4. **Access Logging to Separate S3 Bucket**: Configure the main S3 bucket to send access logs to a dedicated logging S3 bucket. The logging bucket must have appropriate permissions allowing the main bucket to write log files.

5. **Object Lock Configuration**: Enable object lock on the S3 bucket to comply with regulatory standards for data retention, preventing object deletion or modification during the retention period.

## Expected Output

- A valid CloudFormation template in YAML format
- File name: `secure-s3-template.yaml`
- The template must be deployable without errors
- Must meet all the above requirements
- The solution will be tested in the AWS environment to confirm compliance with all configuration policies stated

## Environment Details

- Infrastructure is deployed across the AWS US-East-1 region
- Standard AWS account setup
- Resources are managed using AWS CloudFormation in YAML format

## Constraints

1. Ensure all S3 buckets have server-side encryption enabled at all times.

## Background

In modern cloud environments, ensuring security and compliance is critical, especially with storage solutions like Amazon S3. This solution demonstrates how multiple AWS services integrate to create defense-in-depth security:

- S3 integrates with KMS for encryption key management and cryptographic operations
- S3 bucket policies connect to VPC service to restrict access based on network origin
- S3 access logging sends audit trails to a dedicated logging bucket for centralized monitoring
- CloudWatch can be configured to monitor metrics from both the main bucket and KMS key usage

Proper configuration of these service integrations prevents unauthorized data access and ensures compliance with data retention standards.

## References

- https://github.com/aws-samples/aws-cloudformation-samples
- https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket.html