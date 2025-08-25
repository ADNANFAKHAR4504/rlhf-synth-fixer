You are tasked with setting up a secure AWS environment using CDK for Terraform (CDKTF) with Go. This environment will host a web application requiring robust security measures. Specifically, you need to:

1. Create a VPC in the 'us-west-2' region named 'secure-network'.
2. Configure subnets, security groups, and network ACLs to ensure traffic to the web application is tightly controlled.
3. Deploy an EC2 instance to host the web application, ensuring that the instance only accepts inbound traffic on port 80 (HTTP) and port 443 (HTTPS).
4. Set up an S3 bucket for storing application logs, ensuring server-side encryption is enabled at all times.
5. Implement IAM roles and policies so that the EC2 instance can write logs to the S3 bucket without exposing unnecessary permissions.

Expected Output: A complete CDKTF configuration in Go that meets these requirements and adheres to all AWS Security Best Practices. Your configuration should pass all validation tests without errors, and demonstrate effective use of security features in CDKTF.

Environment: You must configure the infrastructure to operate within the 'us-west-2' AWS region, leveraging a single VPC named 'secure-network'. All resources must be tagged with 'Environment': 'Production'.

Constraints:
- All resources must comply with AWS Security Best Practices v1.0.0.
- Use CDKTF with Go to implement the infrastructure
- Deploy all resources in the us-west-2 region
- Apply proper security configurations including encryption and least privilege access

Additional Requirements:
- Implement EC2 Instance Connect Endpoint for secure access without bastion hosts
- Use VPC endpoints for S3 to keep traffic within AWS network backbone
- Apply new AWS global condition context keys (aws:EC2InstanceSourceVPC and aws:EC2InstanceSourcePrivateIPv4) in IAM policies for enhanced EC2 security

Please provide the infrastructure code with one code block per file. Ensure all code follows CDKTF Go patterns and includes proper error handling and validation.