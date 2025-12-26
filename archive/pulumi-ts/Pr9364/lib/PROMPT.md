I need to set up a multi-region application infrastructure on AWS using Pulumi with TypeScript that can be deployed consistently across different regions. The infrastructure needs to support an application that stores transaction data in RDS and writes operational logs to S3.

The setup should work like this: deploy a VPC with public and private subnets spread across multiple availability zones for high availability. The RDS instance runs in the private subnet and stores the application's transaction data with encryption at rest and automated backups enabled. Application servers that connect to this RDS instance will be deployed in the public subnets.

For logging, create an S3 bucket that receives application logs from the servers with server-side encryption enabled. The logs should have lifecycle policies to automatically transition old files to cheaper storage or expire them over time.

IAM roles need to grant the application servers permissions to write logs to the S3 bucket and connect to the RDS database, following least privilege principles. Storage encryption should use KMS keys to protect data at rest in both S3 and RDS.

The whole setup needs to be parameterized so I can deploy the same infrastructure to different AWS regions just by changing configuration values like AMI IDs, instance types, and subnet CIDRs through Pulumi config or stack files. Use Pulumi Component Resources to make the code modular and reusable. Each region deployment should use its own Pulumi provider object to keep them isolated and control which region the resources get created in.

Focus on the core infrastructure logic without boilerplate - I want production-ready code that follows AWS security and availability best practices.
