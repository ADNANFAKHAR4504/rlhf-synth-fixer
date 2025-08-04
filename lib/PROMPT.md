You are an expert AWS Cloud Solutions Architect specializing in Infrastructure as Code ($IaC$) with AWS CloudFormation.

Your task is to create a complete, production-ready, and reusable AWS CloudFormation template in YAML format for a project named **"AWS Nova Model"**. The architecture must be designed for high availability, automatic failure recovery, scalability, and security, intended for deployment across multiple AWS accounts.

**Architectural Overview:**
The infrastructure will be deployed in the `us-west-2` region across a minimum of three Availability Zones. It will consist of an Application Load Balancer distributing traffic to an Auto Scaling Group of $EC2$ instances. DNS will be managed by Route 53 with health checks for automatic failover. Data persistence will be handled by $EBS$ and $S3$, with a strong focus on security, monitoring, and disaster recovery.

**Detailed Requirements:**

1.  **Networking & Load Balancing:**
    * Provision an Application Load Balancer ($ALB$) to distribute incoming HTTPS traffic.
    * The $ALB$ must span at least three Availability Zones (e.g., `us-west-2a`, `us-west-2b`, `us-west-2c`).
    * Configure an HTTPS listener on the $ALB$ using an SSL/TLS certificate from AWS Certificate Manager ($ACM$). Assume the certificate ARN is provided as a parameter.
    * Implement a redirect from HTTP to HTTPS.

2.  **Compute & Auto Scaling:**
    * Create an Auto Scaling Group ($ASG$) for $EC2$ instances, linked to the $ALB$'s target group.
    * The $ASG$ should use a Launch Template.
    * Implement a CPU-based scaling policy: scale out when average CPU utilization exceeds 70% and scale in when it drops below 30%.
    * Enable detailed monitoring for all $EC2$ instances.

3.  **DNS & Health Checks:**
    * Create a Route 53 health check that monitors the health of the $ALB$.
    * Create a Route 53 Alias record pointing a given domain name (e.g., `api.novamodel.com`) to the $ALB$. The domain name should be a parameter.
    * This setup must ensure that traffic is automatically redirected away from failing Availability Zones.

4.  **Storage & Data Durability:**
    * Ensure the root $EBS$ volumes for the $EC2$ instances are encrypted.
    * Create a separate, general-purpose $S3$ bucket for application data storage. This bucket must be private, encrypted, and have versioning enabled.

5.  **Security & IAM:**
    * Create a dedicated $IAM$ role for the $EC2$ instances with the principle of least privilege. It should include permissions for CloudWatch Logs agent and read-only access to the specified $S3$ bucket.
    * Implement security groups: one for the $ALB$ allowing public traffic on ports 80 and 443, and another for the $EC2$ instances allowing traffic only from the $ALB$'s security group.

6.  **Monitoring & Notifications:**
    * Create a CloudWatch Alarm based on the $ASG$'s CPU scaling policy.
    * Create an $SNS$ topic for notifications.
    * Configure the $ASG$ to send notifications to the $SNS$ topic for scaling events (launch, terminate, fail).
    * Configure the CloudWatch Alarms to send notifications to the same $SNS$ topic.

7.  **Backup & Disaster Recovery:**
    * Implement a backup plan using AWS Backup to take daily snapshots of the $EC2$ instances' $EBS$ volumes. The plan should have a retention policy of 7 days.

8.  **Deployment & Management:**
    * The template must be structured to be deployable via CloudFormation StackSets across multiple AWS accounts and regions. Parameterize key values like VPC ID, Subnet IDs, and AMI ID to facilitate this.
    * Adhere to IaC best practices, including using a consistent naming convention for all resources (e.g., `${ProjectName}-${Environment}-${ResourceName}`) and adding `Description` fields to parameters and resources.

**Expected Output:**
A single, complete CloudFormation template in **YAML format**. The template must be well-commented, parameterized, and pass `cfn-lint` and AWS CloudFormation validation checks without errors. It should be ready for direct deployment.
