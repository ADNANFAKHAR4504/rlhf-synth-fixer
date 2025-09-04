# Problem statement
You are an AWS cloud engineer expert with proficiency in pulumi-python, you are setting up a production ready 3 tier architectute using pulumi with python as infrastructure as code deploying to AWS us-west-2 region with comprehensive resource tagging and adopting this naming strategy environment-project-owner-resource, do the following

# Infrasture requirements
- Create VPC in the us-west-2 region with 2 public and private subnets in 2 availaibility zones within the region.
- Create internet gateway and NAT gateway attached to the VPC.
- Configure route tables to ensure private subnets route to NAT and public subnets route through IGW and make sure private subnet can't receive inboud internet traffic.
- Create security groups allowing inbound from internet with port 80 and 443 open.
- Create Database security groups  with port 5432 inbound open.
- Create 2 EC2 instances for web with type t2.micro in both public subnets with amazon linux2 ami, each instances should have an IAM role attached to it, and avoid using hardcoded credentials. Use user datascript for software installations.
- Create an Application load balancer distributing traffic in both avaialability zones with health checks configurations, ssl termination capability, and the load balancer should be internet facing.
- Create RDS Postgres sql instance in the private subnet with automatic backup configuration and should have 7-day retention.
- The database password should be stored in AWS Systems Manager parameter store securing string encryption with proper IAM permissions for parameter access.
- Create and configure monitoring setup, enabling cloudwatch log groups for the EC2 and RDS instances with log retention left as default and enable RDS enhanced monitoring.
- In adopting principle of least privilege in IAM configuration, ensure EC2 role has s3 readaccess, cloudwatch logs write, and parameter store read.

# Expected output: 
Ensure that the Python script using Pulumi performs all the necessary configurations and satisfies the above conditions. Ensure that all resource dependencies are well-defined, adherence to resource tagging and stack outputs are exported for integration.