Create an AWS CloudFormation template in JSON to set up a secure and scalable web infrastructure in the us-west-2 region.

The template should include the following components and follow these requirements:

Networking
* Create a new VPC with the CIDR block 10.0.0.0/16.
* The VPC must have separate public and private subnets.
* Deploy a NAT Gateway in a public subnet to handle outbound traffic for resources in the private subnets.

Compute & Scaling
* Launch EC2 instances within an Auto Scaling group to ensure high availability. Place these instances in the private subnets.
* Please use AWS Systems Manager Session Manager for SSH access. Do not include a KeyPair parameter in the template.
* Implement a policy to prevent accidental termination of critical EC2 instances.

Database
* Set up an RDS instance in a private subnet.
* Restrict inbound access to the RDS instance to a specific IP range (you can use a placeholder).
* Enable encryption at rest for the RDS instance using AWS KMS.
* Store the database master username and password securely in AWS Secrets Manager.

Storage & Content Delivery
* Create an S3 bucket for web content.
* Enable Server-Side Encryption (SSE-S3) for the S3 bucket.
* Configure a CloudFront distribution to serve content from the S3 bucket, using the default CloudFront SSL certificate for HTTPS.
* Enable access logging for both the CloudFront distribution and the S3 bucket.

Security & Monitoring
* Set up IAM roles and policies following the principle of least privilege.
* Use AWS CloudTrail to log all API activity related to the S3 bucket.
* Implement AWS Config to monitor and track any configuration changes to the resources.

General Requirements
* Add a parameter named EnvironmentSuffix with a default value (e.g., prod). Use this suffix in resource names to ensure they are unique (e.g., my-vpc-${EnvironmentSuffix}). S3 bucket names must be all lowercase.
* All parameters should have sensible default values.
* Tag all resources with a Department tag for cost allocation purposes.