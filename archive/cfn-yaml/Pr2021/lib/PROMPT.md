# Task: Security Configuration as Code - Secure S3 Bucket

## Task ID: trainr937
## Platform: CloudFormation
## Language: YAML
## Difficulty: Hard

## Requirements

Design an AWS CloudFormation template in YAML that sets up a secure S3 bucket. The template must adhere to the following requirements:

1. **S3 Bucket Versioning**: The S3 bucket must have versioning enabled to preserve multiple variants of an object.

2. **Server-side Encryption**: Ensure that server-side encryption is enforced using AWS KMS (Key Management Service) managed keys.

3. **VPC-restricted Access**: Set up a bucket policy that only allows access to the bucket from a specific VPC identified by VPC ID 'vpc-123abc456'.

4. **Access Logging**: The bucket should log all access requests and store those logs in a separate S3 bucket designed specifically for logging purposes.

5. **Object Lock Configuration**: Ensure that object lock configuration is enabled to comply with regulatory standards for data retention.

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

In modern cloud environments, ensuring security and compliance is critical, especially with storage solutions like Amazon S3. Proper configuration prevents unauthorized data access and ensures compliance with data retention standards.

## References

- https://github.com/aws-samples/aws-cloudformation-samples
- https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket.html