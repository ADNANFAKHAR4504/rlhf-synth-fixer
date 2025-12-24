Need a CloudFormation template (YAML) for setting up a basic AWS environment. We're testing this on us-west-2 but should work anywhere.

What I need:

S3 bucket - versioning on, name should be a parameter so we can change it per environment

EC2 instance - needs to run in a VPC/subnet (both should be parameters). Instance type should also be configurable.

IAM role for the EC2 - just s3:ListBucket permissions, nothing more. We had issues before with overly permissive roles.

Security group - SSH access but ONLY from our office IP (make this a parameter). Don't want it wide open.

CloudWatch alarm - trigger if CPU goes over 70%. Our instances sometimes spike and we need to know about it.

DynamoDB table - configurable table name, needs a primary key (also configurable), read capacity of 5 is fine for now.

Tag everything with Project: CloudSetup so we can track costs properly.

Keep it clean and use parameters where it makes sense. File should be called TapStack.yml. Just give me the YAML, don't need explanations.  
