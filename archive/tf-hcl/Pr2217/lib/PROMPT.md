We need to set up a secure AWS environment using Terraform. Everything will run in us-east-1.

Here’s what that means in plain terms:

Only give AWS roles the exact permissions they need — nothing extra.

Store data in an S3 bucket that’s encrypted and completely private (no public access).

Run an EC2 instance inside a private network (VPC) with the address range 10.0.0.0/16.

For security groups, be very clear about what traffic is allowed in and out — no “open to everything” rules.

In short: we’re building a safe AWS setup that follows security best practices and meets compliance rules.

Please implement this in terraform with tap_stack.tf file. I already have providers.tf file with me.