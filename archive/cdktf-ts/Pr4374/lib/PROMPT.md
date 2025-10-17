Generate a production-ready AWS CDKTF TypeScript project that sets up a highly available, secure, and cost-effective AWS infrastructure in the us-east-1 region. The output must include only two files: `lib/tap-stack.ts` and `lib/modules.ts`. 

1. VPC and Networking:
   - Create a VPC that spans at least two Availability Zones.
   - Include public and private subnets in each Availability Zone.
   - Configure an Internet Gateway and a NAT Gateway for routing the public and private subnets.
   - Implement appropriate Route Tables and Network ACLs.

2. RDS Database:
   - Deploy an RDS PostgreSQL instance in private subnets.
   - Enable Multi-AZ deployment for fault tolerance.
   - Use AWS-managed encryption and automated backups.
   - Protect the RDS instance with dedicated Security Groups.
   - Enable CloudWatch monitoring and enhanced logging.

3. Compute and Load Balancing:
   - Deploy an Elastic Load Balancer (ELB) in public subnets to distribute traffic.
   - Create an Auto Scaling Group (ASG) for EC2 instances in public subnets.
   - Configure launch templates with minimal instance types and adjustable AMI/instance sizes.
   - Ensure secure connections between EC2 instances and RDS using IAM roles and Security Group rules.

4. IAM and Security:
   - Define IAM roles and policies based on the least privilege principle.
   - Allow EC2 instances to securely access RDS and read from the SSM Parameter Store.
   - Store sensitive data like database credentials or API keys in the AWS Systems Manager Parameter Store, using the `SecureString` type.
   - Enable Multi-Factor Authentication (MFA) for IAM users and document enforcement in the comments.

5. Monitoring and Logging:
   - Enable CloudWatch Logs for EC2, RDS, and application logs.
   - Set up CloudWatch Alarms for high CPU usage, RDS free storage, and ELB latency.
   - Send alarm notifications through SNS topics.
   - Include comments for setting up the EC2 CloudWatch agent configuration.

6. High Availability and Reliability:
   - Ensure Multi-AZ redundancy for VPC subnets, RDS, and load balancing.
   - Implement Auto Scaling for flexibility and fault tolerance.
   - Use health checks for the Application Load Balancer to route traffic only to healthy EC2 instances.

7. Tagging and Cost Management:
   - Apply consistent tags (`Project`, `Environment`, `Owner`) to all resources.
   - Make sure to use cost allocation tags for budgeting and reporting.

8. Documentation and Outputs:
   - Comment on all security settings for clarity and audits.
   - Define Terraform Outputs for essential resources:
     - VPC ID  
     - RDS endpoint  
     - ELB DNS name  
     - ASG name  
     - CloudWatch log group names  
     - SSM parameter names  