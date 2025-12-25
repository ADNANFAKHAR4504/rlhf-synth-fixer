You are an AWS Solutions Architect.

**Task**: Produce a re-usable CloudFormation template in YAML that deploys a highly available, scalable web-application stack in the us-east-1 region and satisfies all of these requirements:

1. Create a new VPC with CIDR 10.0.0.0/16, containing 2 public and 2 private subnets split across two Availability Zones.
2. Launch application servers in an Auto Scaling Group located in the public subnets.
3. Place an Application Load Balancer in front of the servers to distribute HTTP traffic.
4. Provision an Amazon RDS MySQL instance in the private subnets; it must not be Internet-accessible.
5. Attach appropriate IAM roles and policies to every component, following security best practices.
6. Enable CloudWatch Logs and create alarms for key metrics like CPU utilization above 70% on both the ASG and RDS.
7. Host all static assets in an S3 bucket that is publicly readable.
8. Every logical ID and resource name must follow the pattern prod-<resource_name>.
9. The template must accept two Parameters: Environment with default prod and KeyPairName so it can be reused with minimal changes.

**Service Connectivity Requirements**:
- EC2 instances in the Auto Scaling Group must connect to the RDS instance via security group references for database access
- The Application Load Balancer forwards HTTP traffic to EC2 instances through a target group
- EC2 instances use IAM instance profiles to access S3 bucket for static assets
- CloudWatch monitors both ASG instances and RDS, triggering scaling policies when CPU thresholds are exceeded
- Private subnets route outbound traffic through NAT Gateways for software updates while remaining isolated from direct internet access
- RDS subnet group spans both private subnets for high availability with Multi-AZ deployment

Return only the complete, valid YAML CloudFormation template without extra commentary or markdown.