need cloudformation yaml for secure multi-region financial data infrastructure

deploying to us-east-1, us-west-2, and eu-central-1 regions

setup kms keys for encryption and have s3 buckets use server-side encryption by default - financial data bucket sends access logs to a dedicated logging bucket, cloudtrail writes audit logs to cloudwatch logs encrypted with kms

waf protects the load balancers and api endpoints from web attacks

vpc with public and private subnets across two availability zones - ec2 instances in private subnets connect through nat gateways for outbound internet access, application load balancer in public subnets receives traffic and routes to ec2 instances, rds database in private data subnets only accessible from application subnets through security groups

iam roles for ec2 to read from s3 financial bucket and access secrets manager for database credentials, cloudtrail role writes logs to cloudwatch - all using least privilege policies

network acls on subnets to filter traffic - public subnets allow http/https inbound from internet, private subnets restrict to vpc internal communication only

cloudtrail trail sends events to cloudwatch log group and s3 bucket for long-term storage

template should work as stackset deployment or single parameterized stack per region

output pure yaml in code block
