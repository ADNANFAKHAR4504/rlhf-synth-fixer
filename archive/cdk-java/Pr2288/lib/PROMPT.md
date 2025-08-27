I need to create a comprehensive security infrastructure for a web application that needs to be production-ready and compliant with our corporate security standards. The infrastructure should be built using AWS CDK in Java and needs to implement several security layers and monitoring capabilities.

Here's what I need:

**Core Security Requirements:**
1. A VPC with proper network segmentation - I need public and private subnets across multiple availability zones (at least 2) for high availability. The application should only be accessible from our office IP ranges for security.

2. An IAM role that follows least privilege principles - it needs access to S3 and DynamoDB but nothing more. I want to make sure we're not giving excessive permissions.

3. S3 bucket with encryption - needs server-side encryption with AES256 as the default. This will store our application logs and CloudTrail logs.

4. CloudTrail setup - I need to log all API calls in our AWS account and store them in the S3 bucket mentioned above. This is for compliance and security monitoring.

5. CloudWatch monitoring - set up alarms that will alert us if there are any unauthorized API calls detected by CloudTrail. We need to know immediately if something suspicious happens.

6. AWS Config rules - implement monitoring for changes in IAM policies so we can track when policies are modified.

**Network Architecture:**
- The VPC should have both public and private subnets
- Public subnets need NAT gateways so private instances can access the internet securely 
- Web application access should be restricted to specific IP ranges only

**Additional Considerations:**
- I'd like to use some of the newer AWS security features if possible, particularly CloudTrail network activity events for VPC endpoints and Resource Control Policies if they make sense for this setup
- The infrastructure should be suitable for a corporate environment with strict security requirements
- Everything should be defined as infrastructure code for consistency and repeatability

Could you help me create the CDK Java code that implements this security architecture? I need the complete infrastructure code with all the components properly configured and integrated.