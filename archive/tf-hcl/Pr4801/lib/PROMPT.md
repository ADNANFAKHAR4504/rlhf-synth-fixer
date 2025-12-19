Hey team,

We need to set up a production AWS environment using Terraform. Nothing too fancy, just the basics to get us started with a solid foundation in us-west-2.

The whole thing should be in one Terraform file to keep it simple. We're looking at S3, EC2, IAM, and security groups - standard production setup.

What we need:

S3 Bucket
Set up an S3 bucket with versioning turned on. Name it with a Prod prefix, something like ProdAppBucket. Tag everything with Environment = Production so we can track costs and resources properly.

EC2 Instance
Spin up a t3.micro instance in us-west-2. Nothing crazy, just enough to run our app. We'll need to pass in a key pair name as a variable for SSH access. Make sure it has the security group and IAM role attached.

Security Group
Create a security group that only allows SSH from a specific IP address - we'll pass that in as a variable too. Everything else outbound should be open. Keep the naming consistent with the Prod prefix.

IAM Role and Policy
The EC2 instance needs to read from the S3 bucket, so set up an IAM role with the right permissions. We're talking s3:GetObject and s3:ListBucket here. Don't forget the instance profile to actually attach it to the EC2.

Outputs
When it's done deploying, output the S3 bucket name and the EC2 public DNS so we can actually use them.

A few things to keep in mind:

Everything goes in us-west-2. All resource names should have that Prod prefix for consistency. Tag everything with Environment = Production.

Make sure the Terraform code is idempotent and passes validation. Add explicit dependencies where it makes sense, like EC2 depending on the IAM role and security group being ready first.

Use variables for the key pair name and allowed IP address so we're not hardcoding anything.

Everything in one file - let's call it main.tf or whatever makes sense. Just keep it simple and production-ready.

Output the full Terraform configuration with comments explaining the security best practices we're following. The code should be ready to run with terraform init, plan, and apply.
