We’re setting up a production-ready AWS environment for our web app in us-east-1. The infrastructure needs to be secure, highly available, and easy to manage.

Here’s what we’re looking for:  
Start with a VPC that connects to both public and private subnets spread across at least two availability zones. We’ll need proper routing-an internet gateway for public traffic and a NAT gateway for private resources.

For compute, we want EC2 instances launched with a parameterized AMI ID. Use user data to bootstrap the app servers, and make sure security groups restrict traffic to only what's required. IAM roles should be attached to EC2, following least privilege principles.

The database should be an RDS instance (MySQL, db.t3.micro), set up for Multi-AZ and encrypted storage. Only allow access from the private subnets and the right security groups.

We’ll also need S3 buckets for storage, with versioning and server-side encryption turned on. If possible, enable access logging.

Monitoring is important-set up CloudWatch alarms to alert us if any EC2 instance’s CPU goes above 70%, and send notifications through SNS.

Use parameters for things like environment suffix, AMI IDs, key pairs, instance types, DB credentials, and owner email. Export useful outputs like VPC IDs, subnet IDs, ALB DNS, RDS endpoint, and S3 bucket names.

Add comments in the template wherever you make security, high availability, or compliance decisions.  
The final result should be a single YAML file that passes cfn-lint and is ready