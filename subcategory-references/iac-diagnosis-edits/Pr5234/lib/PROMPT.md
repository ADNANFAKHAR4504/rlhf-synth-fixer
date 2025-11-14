Hey, I need help building a CDK Java application that creates AWS infrastructure. Let me tell you what I need...

So basically everything should be in one stack called TapStack. Don't split it into multiple stacks because that just causes circular dependency headaches. Just put everything together in one place.

Here's what needs to get created:

First, the VPC stuff. I need a VPC with CIDR 10.0.0.0/16 that spans 2 availability zones. Set up both public and private subnets with a /24 mask. Only use 1 NAT Gateway to keep costs down. Also add VPC endpoints for S3 and DynamoDB - this helps reduce the amount of data going through the NAT Gateway which saves money.

For security, create a security group for the Lambda functions. It should allow HTTPS traffic (port 443) from within the VPC, and allow all outbound traffic.


The S3 bucket should be named something like tap-data-bucket-{env}-{account}. Use S3-managed encryption, turn on versioning, and set up lifecycle rules that move objects to Infrequent Access storage after 90 days and delete old versions after 30 days. Block all public access obviously. And make sure the bucket doesn't get deleted when the stack gets torn down - use a retention policy for that.

For the Lambda function, use Python 3.11 runtime. It needs to run in the private subnets with VPC configuration. Give it 256MB of memory and 30 second timeout. The code should actually work - it needs to list objects from the input/ prefix in the S3 bucket. Set environment variables for BUCKET_NAME and ENVIRONMENT.

Create a CloudWatch log group at /aws/lambda/tap-processor-{env} with 1 week retention. This log group should get destroyed when you delete the stack.

The IAM role needs to follow least privilege principles. Everything should be scoped to specific resources, not using wildcards everywhere. Here's what permissions it needs:
- S3: GetObject and GetObjectVersion but only on input/* path
- S3: PutObject on output/* path  
- S3: ListBucket but with a condition that restricts it to input/* and output/* prefixes only
- CloudWatch: CreateLogStream and PutLogEvents on the specific log group
- SSM: GetParameter on /tap/{env}/* path
- VPC execution stuff: the network interface permissions have to use wildcard because ENIs are created dynamically

For sharing stuff across stacks (even though we're using one stack, this is for future expansion), create SSM parameters for:
- /tap/{env}/vpc-id
- /tap/{env}/data-bucket-name  
- /tap/{env}/data-bucket-arn

Also create CloudFormation outputs for VPC ID, Security Group ID, Bucket Name, Bucket ARN, and Function ARN. Export them all with the environment suffix in the name.

The environment support should work by getting environmentSuffix from CDK context, defaulting to "dev" if not provided. You'd deploy it like:

```
cdk deploy -c environmentSuffix=prod
```

Get the account and region from CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION environment variables.

For CDK Nag, run AwsSolutionsChecks on the whole app using Aspects.

Add suppressions with real justifications for:
- VPC Flow Logs being disabled (we're keeping costs down in dev)
- S3 SSL enforcement (we handle this via IAM not bucket policy)
- Security group allowing all outbound (needed for VPC endpoints)
- IAM wildcards for CloudWatch log streams (required) and VPC ENIs (dynamic resources, can't know IDs ahead of time)
- S3 access logging (not needed for this use case)
- Python 3.11 runtime (it's current and supported)

File structure should just be Main.java with everything in it - the TapStack class, TapStackProps class, and the Main class with the main() method. Also need a build.gradle with all the dependencies: CDK core stuff, S3, Lambda, EC2, IAM, Logs, SSM, and cdk-nag.

When you run it, here's what should happen:
- cdk synth should complete successfully with CDK Nag checks passing (with the suppressions)
- cdk deploy --all should deploy everything
- Running cdk deploy --all again should show no changes and nothing should get replaced

Make sure resource names use stable patterns so redeployment doesn't recreate resources. The bucket name needs to include the account ID to make it globally unique.

The Lambda function should have actual working Python code that connects to S3, not just placeholder comments. It should list files from the input/ prefix and return them in a JSON response.

Important stuff to remember:

Everything uses least privilege. Only use wildcards where absolutely necessary (log streams, VPC ENIs) and add comments explaining why.

All resources need proper logical IDs that don't change between deployments.

The inline policies need to be scoped tight - S3 permissions are split between read (input/*) and write (output/*) paths.

VPC execution policy needs wildcards because Lambda creates network interfaces dynamically - you can't know the resource IDs ahead of time.

Just give me code that works out of the box without needing modifications.