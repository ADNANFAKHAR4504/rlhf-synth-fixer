# E-commerce CI/CD Infrastructure Setup

I need help setting up infrastructure for an e-commerce platform called BrazilCart. We're expanding our operations and need a proper CI/CD pipeline with the right database and caching setup.

Here's what we need:

We're building this in the Europe (Spain) region - eu-south-2 specifically. The infrastructure needs to include:

1. A PostgreSQL database on RDS for handling all our order processing. It should be highly available with Multi-AZ deployment and encrypted at rest. I heard AWS has this Blue/Green deployment feature now for RDS PostgreSQL that makes upgrades safer - it would be great if we could configure the database to support that approach in the future.

2. A Redis cache using ElastiCache for our product catalog. This needs to be spread across multiple availability zones as well. I've read about ElastiCache Serverless which automatically scales - that sounds interesting but we can start with a standard multi-AZ cluster that gives us good availability.

3. A complete CI/CD pipeline using AWS CodePipeline to automate our deployments. We need this to handle our application deployment workflow with proper stages.

4. All database passwords and sensitive credentials must be stored in AWS Secrets Manager. No hardcoded passwords anywhere.

5. Encryption keys managed through AWS KMS for our database encryption.

Some important requirements:
- Everything must be in eu-south-2 region
- The RDS instance needs encryption at rest enabled with KMS
- ElastiCache cluster must be deployed across multiple AZs for high availability
- All database credentials stored securely in Secrets Manager
- We need this written in Pulumi using Python

Can you help me create the infrastructure code for this? We need it to be production-ready with proper resource naming that includes environment suffixes so we can deploy to different environments.