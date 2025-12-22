## Setting Up Security for Our EC2s and S3

Hey, we need a CloudFormation template to sort out the security for our EC2 instances and S3 buckets in a production environment.

Here's what we need it to do:

- **CloudFormation**: We're using CloudFormation to set up all these security bits.
- **S3 Bucket**: The S3 bucket should not be public at all, and any data moving to it needs to use SSL (HTTPS).
- **EC2 Access**: Use IAM roles to control who can get to the EC2 instances.
- **Logging**: Turn on logging for everything and send it to CloudWatch. Keep those logs for 7 days.
- **Security Group Traffic**: Our security groups should only let in traffic on port 443 (HTTPS).
- **Tagging**: Tag every single resource with 'Environment: Production'.
- **IAM Permissions**: Make sure our IAM policies give out only the absolute minimum permissions needed. No extra access!

This whole setup needs to work in the **`us-west-1` region**, and it should follow AWS's best practices for security.

What we need back is a CloudFormation YAML template. It should correctly deploy this setup and meet all the security rules we talked about.
