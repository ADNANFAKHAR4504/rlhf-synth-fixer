We’re setting up some AWS infrastructure for a project and need to make sure it passes all the security/compliance checks. A couple of big things we care about:

Any S3 bucket we spin up should be encrypted with KMS (not the default key, we’d like a customer-managed one). And yeah, no public access by mistake.

EC2 boxes should be hooked into CloudWatch with detailed monitoring so we can actually see what’s going on. Logs should go to CloudWatch too.

We’ve got a few Lambda functions, but they really don’t need wide access. Roles should be super restricted — basically only the services they actually touch.

For the database, we want high availability. Multi-AZ RDS (MySQL or Aurora) is fine, but single AZ isn’t an option.

The goal is a CloudFormation template (YAML) we can drop into dev/staging/prod. It should have parameters for stuff like environment suffix, instance type, etc. And please include Outputs for things we might want to plug into other stacks (like bucket names or DB endpoint).