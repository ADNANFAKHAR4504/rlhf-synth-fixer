I need to set up a secure AWS infrastructure for a financial application that handles sensitive financial documents. The infrastructure needs to comply with financial industry security standards and follow a security-first approach.

Requirements:
- Create an S3 bucket specifically for storing sensitive financial documents 
- Implement server-side encryption using SSE-S3 for all data at rest
- Enforce SSL/TLS encryption for all bucket requests - no unencrypted connections allowed
- Block all public access to the bucket completely
- Set up an IAM role with least-privilege access that only allows necessary S3 operations
- Enable bucket versioning for audit trail purposes
- Use proper naming convention: FinApp-<ResourceType>

The infrastructure should be deployed in us-east-1 region. I want to use the latest AWS security features like S3 Object Lock for compliance retention and AWS Config for continuous compliance monitoring. Also include CloudTrail logging for auditing all API calls.

Generate the infrastructure code using Pulumi with Go. Make sure the solution is production-ready and follows AWS security best practices for financial applications.
