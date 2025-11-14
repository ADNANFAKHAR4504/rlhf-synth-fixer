# PROMPT

Hey team,

So we need to build out a production-ready web application infrastructure on AWS using Terraform. This is for our TAP stack deployment and we need to make sure everything meets enterprise security rules while keeping it able to scale and easy to monitor.

The deployment needs to go into us-east-1, and we have some specific stuff that came down from the security and compliance folks that we need to hit.

## What we need to build

### Networking setup
We need to set up a solid foundation with a VPC that spans at least two availability zones. Each AZ should have both public and private subnets. The public subnets need an internet gateway for external access, and we need a NAT gateway so our private resources can reach out when needed. Make sure the route tables are set up right for both internet and NAT traffic.

### Compute infrastructure  
For the application layer, we need an Auto Scaling Group running t3.micro instances with a minimum of 2 and maximum of 5 instances. Use a launch template for consistency. Put a Network Load Balancer in front of everything to distribute traffic - it should listen on port 80 and forward to port 8080 on the instances. The EC2 instances need to be in the public subnets for this setup.

### Security controls
Security groups need to be locked down tight. Only allow HTTP on port 80 and SSH on port 22 inbound, and SSH should only be from our company CIDR blocks (we'll use a variable for this). Outbound traffic can stay open. Make sure to set up IAM roles and instance profiles for the EC2 instances - keep it minimal with just what they actually need.

### Database layer
We need an RDS instance running MySQL or PostgreSQL in Multi-AZ mode for high availability. Keep it in the private subnets only. Enable encryption at rest using KMS, and pull the database credentials from AWS Secrets Manager instead of hardcoding them anywhere.

### Monitoring and compliance
Set up CloudWatch alarms for EC2 CPU utilization that trigger when it hits 80%. Get the load balancer to send access logs to S3. Create an S3 bucket for log storage with versioning turned on and server-side encryption. AWS Config needs to track changes to our key resources for compliance.

### General stuff we need
Tag everything so we can track resources easily. Keep IAM policies tight - only give access to what's actually needed. Make sure deletion protection is turned off on everything since this is for testing and development.

## Key constraints to remember

The VPC has to span at least two availability zones - no exceptions on this one. EC2 instances must be t3.micro in an Auto Scaling Group with min 2, max 5. The Network Load Balancer needs to listen on port 80 and forward to port 8080 on the targets.

For security groups, only allow HTTP port 80 and SSH port 22 inbound. EC2 goes in public subnets, RDS stays in private subnets. KMS encryption is required for both RDS and S3. Secrets Manager handles all sensitive credentials.

The CloudWatch alarm must trigger when EC2 CPU hits 80%. Load balancer access logging goes to S3. Include the NAT gateway for outbound access from private subnets. AWS Config tracks changes to key resources. All resources need deletion protection disabled.

## What you need to deliver

We need one Terraform file called main.tf with everything set up in HCL. Use AWS best practices and add comments explaining the major sections so it's easy to read. Keep it organized in the same file - just group the networking stuff together, compute together, database together, and monitoring together.

It needs to pass all our compliance checks for the stuff I mentioned above.

## Output format

Just give us the complete Terraform file with everything above. Make it valid HCL with good comments explaining the security stuff. Don't write a summary or break it up - we just want the working Terraform file.

## How we'll evaluate this

First thing we'll check is that everything works - all the pieces need to be there and working right. Security is huge for us with encryption, good access controls, and not giving more permissions than needed. We need high availability with Multi-AZ stuff and fault tolerance. Monitoring and compliance with CloudWatch alarms, AWS Config, and logging are must-haves. Code needs to be clean and well-commented. And it has to meet all the specs exactly.

### Success checklist
- Infrastructure works in us-east-1 without problems
- Web app accessible through NLB DNS name  
- Auto Scaling kicks in when CPU gets high
- Database only reachable from EC2 instances
- Security groups are locked down tight
- CloudWatch alarms fire when they should  
- AWS Config tracking resource changes
- Everything encrypted that should be
- No deletion protection turned on

### Watch out for these common mistakes
Don't put EC2 instances in private subnets - they go in public subnets. Use Network Load Balancer, not Application Load Balancer. Don't hardcode database passwords - use Secrets Manager. RDS needs Multi-AZ turned on. Port mapping is NLB port 80 to target port 8080. Don't make security group rules too open. KMS encryption is required for sensitive stuff. IAM policies need to be just right - not too broad, not too tight. AWS Config setup is required. Deletion protection has to be off.

That's the rundown. Let me know if you need clarification on any of this stuff.