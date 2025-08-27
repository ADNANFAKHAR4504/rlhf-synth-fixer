Here's what you need to do:

We're moving an EC2 instance, an S3 bucket, and a DynamoDB table from us-east-1 to us-west-2. The goal is to keep all the data safe and available, and make sure everything is secure and scalable.

Use Pulumi with Java to set up the infrastructure. The EC2 instance should have a security group that allows HTTP and SSH. For the S3 bucket and DynamoDB table, make sure all the data is still there and accessible after the migration. Use the right security protocols for connections.

Don't hardcode the AWS region—read it from environment variables. Same goes for the environment suffix (from ENVIRONMENT_SUFFIX), and add that to all resource names.

If you need to use secrets, use dynamic references (not plain text). Only include EC2, S3, and DynamoDB resources. If you use CloudTrail, make sure logging is on. Skip unsupported properties and don't use Fn::Sub.

Your code should pass Pulumi and Java validation, and cfn-lint. In the end, you should have two Java files: WebAppStackConfig.java and WebAppStack.java. The main class should call WebAppStack.java, which deploys everything. Use clear, descriptive names, follow AWS best practices, and make sure the stack is ready to deploy without errors.
