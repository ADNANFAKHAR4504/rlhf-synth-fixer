Create AWS CDK TypeScript infrastructure with defense-in-depth security for us-east-1.

Requirements:

1. KMS Key for EBS encryption
2. IAM Role for EC2 with SSM permissions
3. VPC with public/private subnets across 2 AZs
4. Security Group allowing SSH from personalIpAddress context
5. Launch Template with T2/T3 instances, encrypted EBS, SSM role
6. ALB + Auto Scaling Group with 2 EC2 instances
7. CloudFront distribution with ALB origin
8. WAFv2 Web ACL with AWSManagedRulesCommonRuleSet
9. S3 bucket with encryption
10. Lambda function triggered by S3 events
11. SQS queue for async logging
12. CloudWatch alarms for CPU/memory

Context parameters: environmentSuffix

Output: Complete CDK TypeScript code only.
