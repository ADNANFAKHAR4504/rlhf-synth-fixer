I need to create a secure cloud infrastructure for a web application using AWS CDK Java. The infrastructure should follow security best practices and include all the necessary components for a production-ready web application.

Here are the specific requirements:

1. Create a VPC with both private and public subnets across multiple Availability Zones for high availability and proper network segmentation

2. Set up Security Groups that allow inbound HTTPS traffic only from specific IP ranges (you can use 10.0.0.0/16 and 192.168.1.0/24 as example ranges)

3. Deploy an EC2 instance in the public subnet and attach an IAM role that allows read-only access to a specific S3 bucket

4. Enable EBS encryption for the EC2 instance volumes using AWS KMS keys, and take advantage of the new EBS direct API VPC endpoint policies feature for enhanced security

5. Deploy an RDS instance in the private subnet with encryption enabled

6. Implement AWS CloudTrail for comprehensive API logging and audit trail

7. Tag all resources with 'Project: CloudSecurity' and 'Environment: Production' tags for governance

8. Create an S3 bucket with versioning enabled and server-side encryption using AES-256

9. Set up a VPC endpoint for S3 to ensure private connectivity without internet traversal

10. Additionally, implement GuardDuty for intelligent threat detection that will analyze VPC flow logs and other security data sources

The solution should be deployed in the us-west-2 region and follow the naming convention 'app-<resource-type>-<id>' for all resources. Make sure to use current AWS CDK Java best practices and ensure the infrastructure is secure and production-ready.

Please provide the complete CDK Java infrastructure code with proper imports, resource configurations, and security settings. Structure the code with one file per major component and ensure everything is syntactically correct and ready for deployment.