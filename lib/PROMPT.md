**Role:** You are an expert AWS CloudFormation engineer specializing in creating robust, secure, and highly available infrastructure as code (IaC).

**Objective:** Generate a single, complete, and syntactically correct AWS CloudFormation template in YAML format. This template will define a high-availability architecture for a web application named "Nova". The template must be fully automated, using sensible defaults and pseudo-parameters where necessary, to allow for direct deployment in an AWS region without requiring manual input for its core functionality. It must pass aws cloudformation validate-template checks.

**Architectural Requirements:**

1. **Networking & Load Balancing:**
   * Deploy all resources into a new VPC spanning at least three Availability Zones (AZs).
   * Create public and private subnets in each AZ.
   * Use an Application Load Balancer (ALB) to distribute incoming HTTPS traffic across the private subnets in all specified AZs.
   * Configure an Internet Gateway (IGW) and NAT Gateways (one per AZ) for connectivity.
2. **Compute & Scalability:**
   * Implement an Auto Scaling Group (ASG) for EC2 instances.
   * The ASG should launch instances into the private subnets, distributed across all three AZs.
   * Configure CPU-based scaling policies to automatically scale the number of instances in and out based on load.
   * The EC2 launch template should use the latest Amazon Linux 2 AMI.
3. **DNS & Failover:**
   * Integrate with Route 53\. Assume a Hosted Zone ID will be provided as a parameter.
   * Create a Route 53 record (e.g., nova.yourdomain.com) pointing to the ALB.
   * Implement Route 53 health checks that monitor the ALB and its target group to enable DNS failover.
4. **Security:**
   * **IAM:** Create granular IAM roles with the least privilege required for EC2 instances (e.g., permissions for SSM, CloudWatch Logs) and other services. Do not use hard-coded credentials.
   * **Encryption:** The ALB listener must use an AWS Certificate Manager (ACM) certificate for SSL/TLS termination, encrypting all data in transit. The ARN for the certificate will be provided as a parameter.
   * **Security Groups:** Implement tightly-scoped security groups. For example, the ALB security group should only allow inbound HTTPS traffic from the internet (0.0.0.0/0), and the EC2 security group should only allow inbound traffic from the ALB's security group.
5. **Storage & State:**
   * EC2 instances should be stateless.
   * For persistent, durable data storage, create an S3 bucket. The bucket must be private, encrypted, and configured with a backup policy (e.g., versioning and lifecycle rules).
6. **Monitoring & Notifications:**
   * Enable detailed monitoring for all EC2 instances.
   * Create a CloudWatch Alarm based on the ASG's CPU utilization metric.
   * Create an SNS topic. Configure the CloudWatch Alarm and the ASG's instance termination events to send notifications to this topic.
7. **Deployment & Management:**
   * Structure the template for use with CloudFormation StackSets to facilitate multi-account and multi-region deployment.
   * Use a consistent naming convention for all resources, prefixed with Nova-.
   * Include detailed descriptions for all parameters and resources to support IaC versioning and maintainability.
   * The template should be designed to leverage CloudFormation's update and rollback capabilities safely.

Expected Output:
A single, self-contained YAML file containing the complete CloudFormation template that fulfills all the requirements above.
