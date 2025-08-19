We need to set up a secure and highly available web app environment in AWS, specifically in us-west-2.  
The CloudFormation template should create a VPC with public and private subnets in at least two AZs, and handle routing with an internet gateway and NAT gateway.

The database should be an RDS MySQL instance (db.t3.micro), with Multi-AZ enabled and storage encryption turned on. Only allow connections from the web server security group.

We also need S3 buckets for app data, with server-side encryption and access logging enabled.  
Parameters should cover things like AMI ID, DB password, and key pairs. If you want, add conditions to toggle features like S3 logging.

Make sure the template exports useful outputs: VPC ID, subnet IDs, EC2 public IPs, DB endpoint, S3 bucket name, etc.  
Tag every resource with the environment and owner. Add comments explaining any security or HA choices.

The template should pass cfn-lint and be ready to deploy as a single YAML file.  
Keep it modular, readable, and follow AWS