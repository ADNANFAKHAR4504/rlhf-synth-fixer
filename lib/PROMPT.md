You are an expert AWS Pulumi infrastructure architect specializing in multi-region, high-availability, and security-compliant deployments using infrastructure-as-code tools such as Pulumi.

Your task is to generate production-grade IaC code that provisions the following environment:

**High-Level Requirements:**
- Deploy a serverless application with a Multi-AZ database backend.
- Fully automated deployment across two AWS regions: `us-east-1` and `us-west-2` for failover.
- Focus on strong security, compliance, and high availability.
- Core services: AWS Lambda, S3, DynamoDB, RDS, Application Load Balancer (ALB), and supporting infrastructure.
- All resources must be properly connected and networked for functionality and security.

**Implementation & Resource Connections:**
1. **Networking:**
   - Create a VPC in each region with public and private subnets across multiple AZs.
   - Configure routing so that:
     - ALB resides in public subnets.
     - Lambda functions and RDS instance are in private subnets.
   - Apply security groups so Lambda functions can connect to the RDS database securely.
   - Restrict inbound and outbound traffic per least-privilege firewall rules.

2. **Serverless & Compute:**
   - Deploy AWS Lambda functions (512 MB memory) inside private subnets with VPC access to RDS.
   - Grant Lambda IAM roles only the necessary permissions (least privilege).
   - Lambda must be able to read/write to DynamoDB and S3.

3. **Data & Storage:**
   - RDS: Use `db.m5.large` instance type, Multi-AZ enabled, encrypted at rest with KMS.
   - DynamoDB: Enable auto-scaling for read/write capacity and encrypt with KMS.
   - S3 buckets: Private access only, versioning enabled, encrypted with KMS.

4. **Security & Compliance:**
   - Tag all resources with `Project:PulumiOptimization`.
   - Enable AWS WAF for all public endpoints with rate limiting (1000 requests/minute).
   - Redirect HTTP to HTTPS on ALBs.
   - Enable AWS CloudTrail in both regions for auditing and monitoring.

5. **Failover & Multi-Region Strategy:**
   - Ensure S3, DynamoDB, and RDS are set up with replication or cross-region strategies to maintain availability.

**Constraints:**
- Use AWS KMS for encryption at rest wherever supported.
- Follow AWS best practices for IAM, networking, and compliance.
- Include comments in the IaC code explaining how each resource connects to others.

**Output Requirements:**
- Provide the complete Pulumi IaC implementation for the above requirements, structuring each major resource group as a separate, reusable component
- Ensure resource dependencies and network connections are correctly configured.
- Include security groups, IAM roles, and policies to enforce least privilege.
- Clearly comment the code where important configurations or connections occur.