I need to deploy a scalable web application infrastructure using Pulumi with TypeScript on AWS. The deployment must be production-grade, region-specific (`ap-south-1`), and follow AWS security and availability best practices. Here are the components I need:

- Deploy EC2 instances within an Auto Scaling Group (ASG) to handle variable traffic loads.
   - Use launch templates or configurations with the latest Amazon Linux 2 AMI.
   - Allow configuration of min, max, and desired capacity via Pulumi config.
- Create an Application Load Balancer (ALB) to distribute HTTP requests across the EC2 instances.
   - Configure target groups, health checks, and listeners.
   - Ensure the ALB is internet-facing and public.
- Provision an Amazon RDS instance to serve as the database backend:
   - Use multi-AZ deployment for high availability.
   - Enable automated backups and encryption at rest.
- Integrate Amazon CloudWatch for monitoring and logging:
   - Capture logs from EC2, ALB, and RDS.
   - Set up log groups and metric alarms for CPU, memory, and health status.
- Configure IAM roles with least privilege access:
   - Create instance profiles for EC2 with only the necessary permissions (e.g., CloudWatch logs).
   - Avoid wildcard permissions and restrict actions to defined resources where possible.
- Ensure all resources (EC2, ALB, RDS) are securely networked and can communicate appropriately:
   - Use security groups and route tables to manage traffic between tiers.
   - Place ALB and EC2 instances in public subnets, and RDS in private subnets.
- All resources to be deployed in the `ap-south-1` region.
- Use a Pulumi provider object to ensure resources are deployed in correct region.
- Export the ALB DNS name as an output so that the web application can be accessed and verified after deployment.
- Make use of pulumi providers for creating all the resources.

Please provide the Pulumi TypeScript code that implements this infrastructure. Avoid boilerplate scaffolding — focus only on the core infrastructure logic needed to satisfy the above requirements.
