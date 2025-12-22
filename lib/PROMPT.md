## Setting Up Security for Our EC2s and S3

Hey, we need a CloudFormation template to sort out the security for our EC2 instances and S3 buckets in a production environment.

Here's what we need it to do:

We're using CloudFormation to set up all these security bits. The S3 bucket should connect to our EC2 instances through IAM roles rather than hardcoded credentials, ensuring secure access without exposing keys. Any data moving between the EC2 instances and S3 bucket needs to flow through encrypted channels using SSL.

Our EC2 instances need IAM roles that enable them to write logs and data to both S3 and CloudWatch, creating a secure logging pipeline where application logs from EC2 automatically flow to CloudWatch with a 7-day retention policy. The security groups should create a protective barrier around our EC2 instances, only allowing inbound traffic on port 443 to ensure all communication uses encrypted HTTPS connections.

Every single resource should be tagged with 'Environment: Production' to maintain proper resource organization. The IAM policies need to follow the principle of least privilege, giving out only the absolute minimum permissions needed for EC2 instances to access S3 buckets and send logs to CloudWatch without any extra access.

This whole setup needs to work in the us-west-1 region and should follow AWS's best practices for security.

What we need back is a CloudFormation YAML template. It should correctly deploy this setup and meet all the security rules we talked about.
