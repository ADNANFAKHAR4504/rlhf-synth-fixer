Create a secure and highly available infrastructure on AWS using AWS CloudFormation. The infrastructure must adhere to stringent security best practices. The solution should be implemented using TypeScript for AWS CDK. The main requirements are as follows:
Utilize CloudFormation scripts to set up necessary AWS resources.
Ensure that all S3 buckets benefit from server-side encryption using AWS KMS.
Define IAM roles and policies applying the principle of least privilege.
Enable CloudWatch logs for all Lambda functions created within your environment.
Ensure that all resources are tagged properly for identification and cost management purposes.
Configure a Virtual Private Cloud (VPC) with a setup that includes both public and private subnets across multiple availability zones.
Configure security groups in the environment so that SSH access is restricted to a specified IP range and not open to the internet.
Implement and make use of ACM to provision SSL certificates where HTTPS is required.
All RDS databases should be encrypted at rest for data protection.
Employ AWS Config rules to monitor compliance and set up alerts for configurations that deviate from security requirements The main stack is in the lib folder, and the stack is called tap-stack.ts
