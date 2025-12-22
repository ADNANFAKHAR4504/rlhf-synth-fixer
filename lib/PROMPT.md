You are an expert AWS Solutions Architect specializing in Infrastructure as Code (IaC) and building highly available, resilient systems. Your task is to generate a comprehensive, production-ready AWS CloudFormation template in YAML format that adheres strictly to the following requirements.

SCENARIO:
The goal is to provision a complete, high-availability web application infrastructure for the "Failure Recovery and High Availability Stack" project. The architecture must be deployed in the us-west-2 region, leveraging multiple Availability Zones to ensure automatic failure recovery and fault tolerance. The design must prioritize security, durability, and operational excellence through monitoring and notifications.

TEMPLATE STRUCTURE AND CONVENTIONS:
- The output MUST be a single, complete CloudFormation template in YAML format.
- The template must be valid and pass AWS CloudFormation linter checks (cfn-lint).
- Add descriptive comments to explain the purpose of major resources and logical sections.
- Use a consistent naming convention for all resources, prefixed with ${AWS::StackName} to ensure uniqueness and clarity.
- Use a minimal, essential set of Parameters only for values that must change between deployments (e.g., environment size, domain names, or account-specific identifiers). This makes the template reusable without being overly complex.
- Use Mappings for environment-specific values like AMIs.
- Use Outputs to expose critical resource information like the application URL and load balancer DNS name.

CORE ARCHITECTURE REQUIREMENTS:
1. Networking:
   - Create a new VPC.
   - Provision public and private subnets across at least three Availability Zones.
   - Create an Internet Gateway for public access and a NAT Gateway in a public subnet to allow outbound internet access for instances in private subnets.
   - Configure Route Tables accordingly for public and private subnets.

2. Load Balancing & DNS:
   - Deploy an Application Load Balancer (ALB) that is internet-facing and spans all public subnets across the three AZs.
   - Configure an HTTPS listener on port 443 and an HTTP listener on port 80 that redirects to HTTPS.
   - Create a Route 53 Alias record at the zone apex (e.g., example.com) of the provided Hosted Zone, pointing to the ALB.
   - Implement a Route 53 Health Check that monitors the health of the ALB endpoint.

3. Compute & Scaling:
   - Create a Launch Template for EC2 instances. The instances should:
     - Be deployed into the private subnets.
     - Use an Amazon Linux 2 AMI (use a mapping to find the latest).
     - Have Detailed Monitoring enabled.
     - Be assigned an IAM role with the necessary permissions.
   - Implement an Auto Scaling Group (ASG) using the Launch Template. The ASG must:
     - Span all private subnets across the three AZs.
     - Use the ALB's health checks to determine instance health.
     - Implement a target tracking scaling policy based on average CPU utilization (e.g., scale out when CPU > 70%).

4. Security:
   - Implement granular Security Groups:
     - One for the ALB, allowing inbound traffic on ports 80 and 443 from anywhere (0.0.0.0/0).
     - One for the EC2 instances, allowing inbound traffic only from the ALB's security group on the application port (e.g., 8080).
   - Create an IAM Instance Profile and Role for the EC2 instances, granting least-privilege permissions (e.g., permissions for the CloudWatch agent).
   - Encrypt all data in transit to the ALB using an SSL/TLS certificate from AWS Certificate Manager (ACM). The ARN for this certificate will be provided as a parameter.

5. Data & Backup:
   - Ensure EC2 instances launched by the ASG use encrypted EBS volumes.
   - Implement a backup strategy using AWS Backup. The template must create:
     - A Backup Vault.
     - A Backup Plan that schedules daily snapshots of resources tagged appropriately with the stack name, with a 7-day retention period.

6. Monitoring & Notifications:
   - Create an SNS Topic for operational alerts. (Note: Subscriptions to this topic should be configured manually after deployment).
   - Create a CloudWatch Alarm based on the ASG's CPU utilization scaling policy.
   - Configure the ASG and the CloudWatch alarm to send notifications to the SNS Topic for events like scaling actions and alarm state changes.

ADVANCED DEPLOYMENT FEATURES:
- StackSets Readiness: Design the template so it can be deployed via CloudFormation StackSets across multiple AWS accounts and regions. This means avoiding hardcoded, account-specific values and using parameters for all configurable items. Add a comment explaining how this template is StackSet-ready.
- Update & Rollback: Ensure resource Logical IDs are stable and the template is structured to smoothly handle updates and rollbacks using CloudFormation's native capabilities.

PARAMETERS TO INCLUDE:
- pInstanceType: The EC2 instance type (e.g., t3.micro).
- pHostedZoneName: The Route 53 hosted zone name for creating the DNS record (e.g., example.com.).
- pAcmCertificateArn: The ARN of the ACM certificate for the ALB's HTTPS listener.

EXPECTED OUTPUT:
Produce a single block of YAML code representing the complete CloudFormation template. Do not include any explanatory text before or after the YAML block. The code should be ready for direct deployment.