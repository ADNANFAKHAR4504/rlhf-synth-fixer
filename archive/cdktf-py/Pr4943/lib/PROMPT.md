I need help setting up infrastructure for a healthcare analytics platform that needs to be HIPAA compliant. We're launching this for HealthTech Solutions and the data security requirements are pretty strict.

**I need to use CDKTF with Python** for this project.

Here's what I need to set up:

First, we need a PostgreSQL database using Amazon RDS. It has to be encrypted at rest using AWS KMS, and all the automated backups and snapshots need to be encrypted too. I've read that RDS now supports customer managed keys for encryption which would be perfect for our compliance needs.

Second, we need Redis caching with ElastiCache for managing user sessions. This is critical - the Redis cluster must be in a private subnet with absolutely no internet access. I know ElastiCache for Redis is HIPAA eligible now and supports encryption both at rest and in transit, so please make sure both are enabled.

Third, we need AWS Secrets Manager to store all our database credentials and API keys. The secrets should be encrypted with KMS as well.

Fourth, we need to run our application containers on ECS Fargate. I've heard that newer Fargate versions support ephemeral storage encryption with customer managed keys, which would be great for our use case.

For the networking setup, please create a VPC with both public and private subnets across multiple availability zones for high availability. The database and cache should only be accessible from the private subnets where the Fargate tasks run.

All resources need to include an environment suffix in their names for managing different environments. And of course, everything should follow HIPAA compliance best practices with encryption everywhere.

Can you help me create the infrastructure code for this? Make sure to use the latest AWS features where applicable, especially around encryption and security.