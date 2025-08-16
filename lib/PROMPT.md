## Let's Build a Secure AWS Logging Setup

Hey, we need to put together a CloudFormation template for a secure little setup in AWS. It's all about handling logs safely.

Here’s the deal:

- **Log Storage:** We need an S3 bucket just for our confidential logs. Make sure nobody from the outside can get to it, and that everything stored in it is encrypted with S3's own encryption (SSE-S3).
- **Log Processor:** There'll be a Lambda function that does something with those logs from the S3 bucket. Its permissions need to be super tight—just enough to do its job with S3 and run itself, nothing extra.
- **Database:** We'll use an RDS database to store the processed logs. This database absolutely cannot be reachable from the internet, and its data needs to be encrypted using a KMS key. Only certain things inside our network should be able to talk to it, controlled by a VPC security group.
- **Tagging:** Every single piece of this setup needs to be tagged with 'Project: SecurityConfig'.

This whole thing needs to go into the `us-east-1` region. And everything should be tucked away inside its own network (a VPC) with a `10.0.0.0/16` address range.

What we need back is that CloudFormation YAML template, called `secure_infrastructure.yml`. It needs to work perfectly, meet all these security points, and deploy smoothly.
