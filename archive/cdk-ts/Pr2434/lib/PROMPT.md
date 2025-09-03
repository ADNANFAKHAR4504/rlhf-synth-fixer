### Secure AWS Infrastructure Deployment Prompt

setting up a really secure cloud environment using **AWS CloudFormation with AWS CDK in TypeScript**. My organization is moving everything to AWS, so this infrastructure has to meet some super strict security rules and compliance standards.

We're going to set up and secure this sensitive application in the **us-east-1 region**. The infrastructure will use a VPC with both public and private subnets, S3 for storage, RDS for the database, IAM roles for access control, and a bunch of other AWS services. Everything needs to be buttoned up according to our security policies to keep our data confidential, intact, and always available.

Here's what I need the CDK code to do:

- **Core Services**: The stack should include all the necessary AWS resources: VPC, S3, RDS, IAM, Lambda, CloudWatch, API Gateway, Route 53, and CloudTrail.
- **VPC Setup**: The VPC absolutely needs to have both public and private subnets. Our RDS database instances must stay in those private subnets.
- **Data Encryption**: All sensitive data storage needs to be encrypted, both when it's just sitting there (at rest) and when it's moving around (in transit).
- **Monitoring & Logging**: I need proper monitoring and logging through **AWS CloudTrail** and **CloudWatch Logs**, with good log retention policies defined.
- **DNS Failover**: Let's set up an automated DNS failover solution using **Route 53 health checks**.
- **Security Best Practices**: We need to enforce strong security practices. That means **MFA for IAM users** and **least privilege access for IAM roles**.

And here are some specific constraints to keep in mind:

- All S3 buckets need **server-side encryption**.
- IAM roles must follow the **principle of least privilege**.
- **MFA (Multi-Factor Authentication)** is mandatory for IAM users.
- All RDS instances belong in a **private subnet**. use MYsql version 8.0.42, disable performance insights, and slow-query
- Route 53 hosted zones should be private unless we explicitly say they need to be public.
- **CloudTrail** must be enabled for the AWS account.
- **CloudWatch Logs** need defined retention periods.
- Security groups should **never allow unrestricted SSH (port 22) access**.
- **Automatic DNS failover** using Route 53 health checks is required.
- **VPC Flow Logs** need to be enabled for all VPCs.
- All data in RDS instances must be **encrypted at rest**.
- S3 buckets should _not_ be publicly accessible unless specifically requested.
- Lambda functions' permissions need to be **scoped to specific functions and resources**.
- **SSL/TLS is required** for all API Gateway endpoints.
- **Automatic backups** must be enabled for RDS instances.

The final output should be the full **AWS CDK code in TypeScript**. I'll verify it by deploying the stack successfully and making sure it passes all our security checks without any issues.
My Directory structure follows generate the code accordingly
lib/
├── MODEL_RESPONSE.md
├── PROMPT.md
└── tap-stack.ts
