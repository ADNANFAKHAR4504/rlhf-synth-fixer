I need to create AWS infrastructure using CDK TypeScript for a scalable cloud environment. The infrastructure must support multi-availability zone deployment and include the following components:

1. Create an S3 bucket with versioning enabled for application log storage
2. Set up an IAM role for EC2 instances following least privilege principle
3. Deploy an RDS database with automated backups
4. Configure auto-scaling infrastructure for future expansion
5. Deploy across at least 3 availability zones in us-east-1 region

The solution should include proper resource tagging for environment identification, cost center tracking, and ownership. Use CDK Toolkit Library features for drift detection if available, and leverage Application Composer integration where possible for visual infrastructure management.

Please provide infrastructure code with one code block per file. The code should be production-ready with proper error handling and follow AWS best practices.