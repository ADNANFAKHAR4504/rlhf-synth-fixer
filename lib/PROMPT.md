# Need complete AWS setup with Pulumi Python

Building a test automation platform - need the full infrastructure coded and ready to deploy.

## What I'm looking for

Complete working code. Not snippets or skeleton code with TODOs. Should be able to run this immediately.

Put Lambda code inline in the infrastructure file as strings - easier to manage that way.

Create these files:
- tap_stack.py with all the infrastructure
- test_tap_stack.py for unit tests
- test_tap_stack.py for integration tests
- README explaining setup and deployment

## Architecture

VPC in us-east-1 with 10.0.0.0/16 CIDR. Need 2 public subnets and 2 private subnets across two availability zones. Public subnets get internet gateway access, private subnets route through NAT gateway in one of the public subnets.

S3 bucket with encryption and versioning turned on. Block all public access. When files land in this bucket, they should automatically trigger a Lambda function through S3 event notifications.

Lambda runs on Python 3.9. Gets invoked when objects are created in the S3 bucket. Should have an IAM role that allows it to read from that specific S3 bucket and write logs to CloudWatch. Keep it scoped - just what it needs.

CloudWatch log group for the Lambda with 14-day retention. Lambda writes there automatically through its execution role.

IAM roles and policies should follow least privilege - specific resources, specific actions. No wildcards in resource ARNs. Don't use overly broad managed policies.

Make everything parameterized with environment variables like STAGE and BUCKET so we can deploy to dev, staging, prod without code changes. Tag all resources with Project, Stage, and Managed tags for tracking.

## Tests

Unit tests that mock Pulumi resources. Need to verify the VPC, subnets, S3 bucket, Lambda function, and IAM roles all get created with correct properties.

Integration tests against real AWS. Deploy the stack, upload a file to S3, verify Lambda gets triggered and processes it. Check that logging works. Verify the multi-AZ networking is set up right.

Pylint should give a score over 7 when we run it.

## Documentation

README needs install steps, how to configure AWS credentials, how to deploy with pulumi up, and how to tear down with pulumi destroy.

Explain what each component does and how they connect - VPC provides network isolation, S3 stores files and triggers Lambda, Lambda processes files and logs to CloudWatch.

Add some troubleshooting help for common issues like IAM permission errors or S3 event notification delays.

Give me tap_stack.py first with all the infrastructure code.
