Generate a production-ready AWS CDKTF TypeScript implementation that creates the following infrastructure in us-east-1. Output only two files: lib/tap-stack.ts and lib/modules.ts.

REQUIREMENTS:
- Target region: us-east-1. Single AWS account.
- Only two files allowed: lib/tap-stack.ts and lib/modules.ts. All infrastructure code must be in those files.
- Use CDKTF TypeScript patterns, modular designs, and clear parameters.

INFRA SPEC:
1. VPC: CIDR 10.0.0.0/16.
2. Subnets:
   - Two public subnets in different AZs with CIDRs chosen from 10.0.1.0/24 and 10.0.2.0/24.
   - Two private subnets in different AZs with CIDRs chosen from 10.0.3.0/24 and 10.0.4.0/24.
3. Internet Gateway attached to the VPC. Public subnets route 0.0.0.0/0 to IGW.
4. NAT Gateway with Elastic IP placed in one public subnet. Private subnets route 0.0.0.0/0 to NAT.
5. EC2:
   - One EC2 instance in each public subnet.
   - SSH on port 22 allowed only from a configurable CIDR called sshAllowedCidr.
   - Public instances must use a public IP and an IAM role with only necessary permissions.
6. RDS:
   - MySQL instance placed in private subnets, Multi-AZ enabled.
   - Use AWS-managed RDS credentials. Do not create Secrets Manager secrets.
   - RDS storage must be encrypted with an AWS-managed KMS key. Customer-managed KMS may be acceptable only if it uses the default AWS-managed key, but explicitly ensure that encryption is enabled using the AWS-managed key.
   - Backups and deletion protection should be parameterized.
7. NACLs:
   - Create VPC Network ACLs that permit only required traffic with explicit inbound and outbound rules for public and private subnets.
8. VPC Flow Logs:
   - Enable VPC Flow Logs and send them to CloudWatch Logs. Create the necessary Log Group.
9. S3:
   - Create an S3 bucket for application logs with versioning enabled.
   - Block all public access through Block Public Access settings.
10. Systems Manager Parameter Store:
    - Store DB connectivity information (DB endpoint, port, and a reference for credentials) in SSM Parameter Store. Do not store plaintext passwords in the code.
11. Tags:
    - Tag all resources with environment set to production.
12. Security Groups:
    - Public instance security group: Allow HTTP on port 80 and HTTPS on port 443 from 0.0.0.0/0; allow SSH on port 22 only from sshAllowedCidr.
    - RDS security group: Allow MySQL on port 3306 only from private instance security groups.
13. Outputs:
    - Export via Terraform outputs the following: VPC ID, public subnet IDs, private subnet IDs, NAT Gateway ID and EIP, public instance IDs, security group IDs, RDS endpoint and port, S3 bucket name, CloudWatch Log Group name, SSM Parameter ARNs and Names.
14. Validation:
    - Validate input variables and fail early with clear errors, such as missing sshAllowedCidr.
    - Include inline comments and brief guidance in the code for checks that need to be performed at deployment time.
15. Parameterization:
    - Expose variables with sensible defaults where appropriate, including projectName, environment (defaulting to production), region (defaulting to us-east-1), sshAllowedCidr (required), instanceType (defaulting to t3.micro), dbInstanceClass (defaulting to db.t3.medium), dbStorageGb (defaulting to 20), backupRetentionDays, and deletionProtection (default set to true).