I need to migrate our existing AWS infrastructure to Terraform CDK. We're setting up a new network environment in us-west-2 that will host our application servers and need proper backup storage.

Here's what we need:

Create a VPC with 10.0.0.0/16 CIDR in us-west-2. Set up two public subnets spread across different availability zones - these will host our web servers that need direct internet access. Connect an Internet Gateway to the VPC and configure routing so traffic from the subnets can reach the internet through the IGW.

For security, create a security group that allows SSH access from anywhere temporarily - we'll lock this down once the migration is complete. This security group will be attached to our EC2 instances later.

We also need an S3 bucket for storing migration backups, with the name starting with migration-backup- followed by unique identifiers. The bucket should connect to our VPC through the default gateway.

All resources must be tagged with Project: Migration and Environment: Production for cost tracking. Store the Terraform state in an S3 backend with encryption enabled.

Use data sources to fetch available AZs dynamically - no hard-coded zone names. The code should work across our dev and prod environments by using variables for the environment suffix.

I'm using Terraform CDK with TypeScript since our team is already familiar with that stack. Make sure everything follows best practices for production deployments.
