# Web Application Infrastructure Requirements

Hey there! We're building out the infrastructure for our new web app and need help getting the Terraform config set up properly. Here's what we're looking for:

## File Structure
Everything needs to go into `./lib/main.tf` - variables, locals, resources, outputs, the whole nine yards. We already have a provider.tf file that handles the AWS provider setup and reads the aws_region variable, so don't worry about that part.

## Security Requirements
Our security team has been pretty clear about what they need:

- Set up IAM roles with the minimum permissions needed (they're really strict about this)
- Every S3 bucket has to use KMS encryption - no exceptions
- We need CloudWatch monitoring to catch any sketchy API calls
- Set up SNS alerts so we know immediately if something weird happens
- Everything should be locked down to us-west-2 region only (compliance requirement)

## Infrastructure Standards
We've learned some hard lessons from previous deployments, so please make sure:

- Don't open up any wide-open security groups (0.0.0.0/0 is banned on sensitive stuff)
- Turn on encryption everywhere you can - S3, EBS volumes, CloudWatch logs, etc.
- Tag everything consistently so we can track costs and ownership
- Keep secrets out of the outputs (ops team will kill us if we leak anything)

## Other Notes
This is a greenfield deployment, so build everything from scratch rather than referencing existing resources. Also, make sure the outputs include the stuff our CI/CD pipeline and test suite will need - bucket names, SNS topic ARNs, IAM role info, that kind of thing.

Thanks for helping us get this set up securely!
