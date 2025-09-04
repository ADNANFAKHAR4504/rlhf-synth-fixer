Hey there,

I'm working on a pretty big project to migrate some of our infrastructure, and I could really use your expertise in putting together the Terraform code. The goal is to create a mirrored, highly available setup across two AWS regions: us-east-1 as our primary and eu-west-1 as our secondary.

To keep things simple, I'd like to stick to just two files: provider.tf for the AWS provider setup and tap_stack.tf for, well, everything else.

Provider Setup (provider.tf)
For the provider file, we'll need to configure AWS to handle both regions. This means setting up the default provider for us-east-1 and then an aliased provider for eu-west-1 (maybe we can call the alias "eu_west_1"). This part is super important for making the multi-region magic happen.

The Main Stack (tap_stack.tf)
This is where the bulk of the work will be. I want to define all our resources in this one file, using the provider alias for anything we build in the secondary region.

Here's a rundown of what we need:

Let's start by setting up a VPC in each region. Once those are up, we'll need to link them with a VPC peering connection and add the necessary routes so they can talk to each other privately.

This is the critical part. I'm thinking:

S3 Buckets: One in each region, with cross-region replication set up to copy data from the primary to the secondary bucket.

DynamoDB Global Tables: A single global table that automatically replicates data between both regions. We should also add some auto-scaling policies to handle the load.

RDS Instances: An RDS instance in each region, and both absolutely must be Multi-AZ for high availability.

We'll need an EC2 instance in each region. To keep things consistent, let's use variables for the instance type and key pair name. It would also be great to use a data source to automatically find the latest Amazon Linux 2 AMI in each region.

Security first, always!

Let's create a KMS key in each region and make sure all our services—S3, DynamoDB, RDS, and even the EC2 drives—are using these keys for encryption at rest.

For IAM, a single global IAM role with a tight, least-privilege policy should do the trick.

We also need CloudTrail enabled in both regions, with all the logs sent to a single, centralised S3 bucket in us-east-1. Let's also add a lifecycle policy to that bucket to manage old logs.

Finally, it would be super helpful to have some outputs defined, like the RDS endpoints and S3 bucket names for both regions, just so we can easily find them later.

Could you help me pull all this together into those two files? I'm looking for a clean, production-ready configuration that we can rely on.

Thanks a ton!
