I need to create a comprehensive security infrastructure for a web application that needs to be production-ready and compliant with our corporate security standards. The infrastructure should be built using AWS CDK in Java and needs to implement several security layers and monitoring capabilities.

Here's what I need:

**Core Security Requirements:**
1. A VPC with proper network segmentation - I need public and private subnets across at least two availability zones for high availability. Security groups should restrict access to application ports 80 and 443 from our office IP ranges only.

2. An IAM role that follows least privilege principles - EC2 instances should assume this role to securely access S3 buckets and DynamoDB tables. It needs specific permissions like GetObject and PutObject on S3, plus GetItem, PutItem, and Query on DynamoDB, but nothing more. I want to make sure we're not giving excessive permissions.

3. S3 bucket with encryption - needs server-side encryption with AES256 as the default. This bucket stores application logs and serves as the destination for CloudTrail logs, which feed into CloudWatch Logs for monitoring.

4. CloudTrail setup - I need to log all API calls in our AWS account and deliver them to the S3 bucket mentioned above, which then connects to CloudWatch Logs for real-time analysis. This is for compliance and security monitoring.

5. CloudWatch monitoring - metric filters should read CloudTrail logs and trigger alarms when unauthorized API calls are detected, specifically UnauthorizedOperation or AccessDenied errors. These alarms should detect security events from the CloudTrail log stream.

6. AWS Config rules - implement monitoring that tracks IAM policy changes and evaluates them against our security baselines. Config rules should check for policies with admin access and alert when root access keys exist.

**Network Architecture:**
- The VPC should have both public and private subnets where EC2 instances in private subnets route internet traffic through NAT gateways in public subnets
- Security groups attached to EC2 instances allow inbound traffic only from specific office IP ranges on ports 80 and 443
- DynamoDB and S3 are accessed via VPC endpoints to keep traffic within the AWS network

**Additional Considerations:**
- I'd like to use some of the newer AWS security features if possible, particularly CloudTrail network activity events for VPC endpoints and Resource Control Policies if they make sense for this setup
- The infrastructure should be suitable for a corporate environment with strict security requirements
- Everything should be defined as infrastructure code for consistency and repeatability

Could you help me create the CDK Java code that implements this security architecture? I need the complete infrastructure code with all the components properly configured and integrated.
