**System / Role**
You are an expert AWS solutions architect and senior DevOps engineer. Prioritize security, least-privilege IAM, and production-grade CDK and CloudFormation patterns. Output must compile and pass CloudFormation validation.

**Task**
Create a secure AWS environment with these components:

1. An S3 bucket encrypted with AWS KMS (SSE–KMS).
2. EC2 instances with Security Groups that restrict inbound traffic to specified CIDR ranges only.
3. AWS CloudTrail with logs delivered to the encrypted S3 bucket.
4. IAM roles for EC2 and Lambda adhering to least-privilege.
5. Lambda functions configured to run inside a VPC.
6. All resources must be deployed in **us-east-1**.
7. Ensure IAM trust policies are correct for each service.

**Constraints**

* S3 bucket: KMS-encrypted, SSL-only, public access blocked.
* EC2 SG: inbound restricted to given CIDR(s) (e.g., 203.0.113.0/24).
* CloudTrail: proper bucket policy for `GetBucketAcl` and `PutObject` with `bucket-owner-full-control`.
* IAM roles: EC2 (AmazonSSMManagedInstanceCore), Lambda (Basic + VPC execution).
* Lambda: placed in private subnets with egress-only SG.
* Region: strictly `us-east-1`.
* Outputs must include bucket name, VPC ID, instance ID, and trail ARN.

**Output format**
Return:

* A complete AWS CDK project (TypeScript) with all infra in a single `lib/<project>-stack.ts` file.
* A matching CloudFormation YAML template with a region guard (`IsUSEast1`).
* Commented code and CLI deployment instructions.

**Style**
Production-ready, secure by default, minimal yet clear. Well-commented for future maintainers.