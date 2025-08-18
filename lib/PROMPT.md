We're building out production-ready AWS infrastructure using CloudFormation in the us-west-2 region. Please write a functional YAML template that sets up the following resources in line with real-world security and operational best practices:

- Create a VPC with CIDR block 10.0.0.0/16.
- Define two public subnets in different AZs: use CIDR blocks 10.0.1.0/24 and 10.0.2.0/24.
- Attach an Internet Gateway to the VPC for public subnet connectivity.
- Set up a NAT Gateway in one public subnet (for future private subnet internet access).
- Create an S3 bucket for logging, with versioning enabled—make sure the name is unique if using a parameter.
- Build IAM roles for EC2 that follow least privilege principles—the roles should allow writing logs only to the S3 bucket.
- Configure security groups to strictly allow SSH access from 203.0.113.0/24 only.
- Apply tags to every resource—key: 'Environment', value: 'Production'.
- Ensure that all YAML and resource properties adhere to AWS security best practices and are suitable for a production environment.

I'd like the template to include clear outputs for validation: VPC ID, the two subnet IDs, and the S3 bucket name. Add comments where design choices or security controls matter. Assure the deployment works as-is in a sandbox environment—no placeholders, only useful and valid configurations.