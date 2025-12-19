
Hey, I need you to build me a secure S3 setup in Terraform. Everything should go in ./lib/main.tf since I've already got the provider config sorted in provider.tf.

Here's what I'm looking for:

The main bucket needs to be called `data-secured-<account_id>` - use the caller identity data source to grab the account ID dynamically. Deploy everything in us-east-1.

For security, I want the bucket locked down tight:
- Turn on encryption with AWS managed keys
- Enable versioning 
- Block all public access
- Set up access logging to a separate bucket
- Add lifecycle rules to clean up objects after a year
- Set up cross-region replication to us-west-2

Also need MFA enforcement - create an IAM policy that requires multi-factor auth for bucket access. Keep the permissions minimal.

For the replication, create a destination bucket in us-west-2 with the same security settings and set up the IAM role with just enough permissions to handle the replication.

Make sure to include these outputs: source bucket name, destination bucket name, and logging bucket name. Don't output anything sensitive though.

Some technical notes:
- Put all variables in main.tf (including aws_region) so provider.tf can reference them
- Don't add any provider blocks to main.tf
- No external modules - build everything inline
- Tag everything with owner, environment, and ManagedBy=terraform for cost tracking
- This needs to work with Terraform 0.15+ and pass validation

Just create the complete main.tf file with proper HCL that follows AWS best practices.