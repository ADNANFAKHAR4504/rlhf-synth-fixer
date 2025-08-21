I need help creating AWS infrastructure using CDK TypeScript for migrating our existing setup to infrastructure as code. The goal is to set up a VPC-based environment with public subnets and S3 storage for backup purposes.

Here are the specific requirements I need to implement:

1. Create a VPC with CIDR block 10.0.0.0/16 in the us-west-2 region
2. Set up at least two public subnets, each in different availability zones 
3. Add an internet gateway and configure route tables for public subnet internet access
4. Create an S3 bucket with a unique name like 'migration-backup-{random-suffix}' for backup storage
5. Set up a security group that allows SSH access from anywhere (0.0.0.0/0) as a temporary migration exception
6. Apply proper tags to all resources: 'Project: Migration' and 'Environment: Production'

I want to use CDK best practices and avoid hardcoded values. Please consider using some of the latest AWS features like Amazon EKS Auto Mode for simplified Kubernetes management or ElastiCache Serverless for auto-scaling cache if they would be beneficial for this migration setup.

The infrastructure should be deployable via CDK commands and follow proper project structure. Please provide the complete infrastructure code with one code block per file.