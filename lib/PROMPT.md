Hey there! I need some help creating a CloudFormation template for a secure AWS setup in us-west-2. 

So here's what I'm trying to build - we need a solid AWS environment that follows security best practices. I've been working on this project and need to make sure everything is locked down properly.

For the S3 part, I want to make sure bucket are private by default (no public access allowed). We also need server-side encryption enabled for everything we store. Oh, and bucket names should follow the pattern `project-<name>` - that's our naming convention.

On the monitoring side, I need a CloudWatch alarm that can detect when someone tries to access our EC2 instances without authorization. When that happens, it should send a notification to our Admin team through SNS. This is pretty important for security.

For IAM, I want to use roles for the EC2 instances with minimal permissions - just what they actually need. And absolutely no hardcoded access keys anywhere in the config. That's a security nightmare waiting to happen.

A few things to keep in mind:
- S3 bucket must stay private and encrypted
- The CloudWatch alarm needs to specifically watch for unauthorized EC2 access attempts
- IAM roles should handle all the permissions without any embedded credentials
- VPC IDs need to follow the `vpc-` format
- Everything should have the `project-` prefix in the name

I need this as a single CloudFormation YAML file that will actually work - it should pass the `aws cloudformation validate-template` check and be ready to deploy without any tweaking.
