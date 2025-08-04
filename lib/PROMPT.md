**Role:** You are an expert AWS Solutions Architect and a Senior DevOps Engineer specializing in Infrastructure as Code (IaC) with AWS CloudFormation.

**Objective:** Your task is to create a comprehensive, production-ready, and fully-functional AWS CloudFormation template in **YAML format**. This template will deploy a highly available, scalable, and fault-tolerant infrastructure for a web application in the us-west-2 region. The template must be self-contained and adhere strictly to all requirements listed below.

### **Project Details**

* **Project Name:** IaC-AWS-Nova-Model
* **Target AWS Region:** us-west-2
* **Core Architecture:** The infrastructure will host a web application on EC2 instances behind an Application Load Balancer, with Auto Scaling for resilience and performance. It will leverage Route 53 for DNS and health checks, secure storage with S3/EBS, and robust monitoring and notification systems.

### **Detailed Technical Requirements & Constraints**

You must satisfy every one of the following requirements in your CloudFormation template.

**1\. Networking and High Availability:**

* **VPC:** Create a new VPC with both public and private subnets.
* **Multi-AZ Deployment:** The infrastructure, including subnets and EC2 instances, must be deployed across at least **three (3) Availability Zones** within the us-west-2 region.
* **Load Balancing:**
  * Use an **Application Load Balancer (ALB)** to distribute incoming HTTP/HTTPS traffic.
  * The ALB must listen on port 443 (HTTPS) and redirect HTTP (port 80\) traffic to HTTPS.
  * The ALB should be placed in the public subnets.
* **DNS and Failover:**
  * Implement **Route 53 health checks** to monitor the health of the EC2 instances via the ALB's target group.
  * Create a Route 53 Alias record pointing to the ALB. The template must accept both the DomainName (e.g., app.example.com) and its corresponding HostedZoneId as parameters to ensure it can be deployed in any account.
  * Ensure the system can automatically handle DNS failover by redirecting traffic away from unhealthy Availability Zones.

**2\. Compute and Scaling:**

* **EC2 Instances:** Instances must be launched into the private subnets.
  * **AMI:** Use a Parameter Store lookup to dynamically fetch the latest Amazon Linux 2023 AMI ID (e.g., /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86\_64).
  * **UserData:** Include a simple UserData script to install and start a basic web server (e.g., httpd or nginx). This is essential for the ALB health checks to pass.
* **Auto Scaling Group (ASG):**
  * Implement an ASG to manage the EC2 instances.
  * Configure scaling policies to automatically increase or decrease the number of instances based on average CPU utilization (e.g., scale up at \>70% CPU, scale down at \<30% CPU).
  * Define a desired, minimum, and maximum number of instances.
* **Monitoring:** Enable **Detailed Monitoring** for all EC2 instances for enhanced observability.

**3\. Storage and Data Durability:**

* **Persistent Storage:** All application data must be stored on durable storage that persists through instance failures.
* **EBS:** Use General Purpose SSD (gp3) EBS volumes for the EC2 instances.
* **S3:** Create a private S3 bucket for storing application assets or backups. The bucket must block all public access.
* **Backup Strategy:** Create a dedicated AWS::Backup::BackupVault. Then, implement an AWS::Backup::BackupPlan with a rule for daily backups with a 7-day retention period. The backup selection should target resources based on a specific tag applied to the EC2 instances.

**4\. Security:**

* **IAM Roles:**
  * Create a specific IAM Role for the EC2 instances following the principle of least privilege. The role's policy must not contain wildcard actions (like s3:\*). It should include permissions for:
    * cloudwatch:PutMetricData, logs:CreateLogGroup, etc. for CloudWatch Logs.
    * s3:GetObject for the specified S3 bucket.
    * The AmazonSSMManagedInstanceCore managed policy to allow for secure remote access and management.
  * Do not use hard-coded credentials.
* **Security Groups:**
  * Create a security group for the ALB that allows inbound traffic on ports 80 and 443 from the internet (0.0.0.0/0).
  * Create a separate security group for the EC2 instances that only allows inbound traffic from the ALB's security group.
* **Encryption in Transit:**
  * Use **AWS Certificate Manager (ACM)** to provision an SSL/TLS certificate. The template should take the ACM Certificate ARN as a parameter.
  * Attach this certificate to the ALB's HTTPS listener to encrypt all data in transit.

**5\. Monitoring and Notifications:**

* **SNS Notifications:**
  * Create an SNS Topic for critical alerts.
  * Configure the ASG to send notifications to this topic for instance launch, termination, and failure events.
  * Configure the CloudWatch Alarms (used for scaling) to also send notifications to this SNS topic.

**6\. Deployment and Management (IaC Best Practices):**

* **CloudFormation StackSets:** Ensure the template is structured in a way that it can be easily deployed across multiple AWS accounts and regions using CloudFormation StackSets. This primarily means avoiding hard-coded, account-specific values where possible and using parameters effectively.
* **Versioning and Change Management:** The template should be written to support CloudFormation's update and rollback capabilities. Use parameters and mappings to manage environment-specific configurations.
* **Naming Convention:** All resources must be named using a consistent and clear naming convention. Use the project name as a prefix (e.g., IaC-AWS-Nova-Model-VPC, IaC-AWS-Nova-Model-ALB-SG).
* **Parameters:** Use the Parameters section for user-configurable values like InstanceType, VpcCidr, DomainName, and CertificateArn. Provide sensible defaults where applicable.
* **Outputs:** Use the Outputs section to export important values like the ALB's DNS name, the S3 Bucket Name, and the SNS Topic ARN.

### **Expected Output**

* A single, complete CloudFormation template in **YAML format**.
* The template must be well-commented, with explanations for each resource, parameter, and complex configuration.
* The final template must be valid and capable of passing AWS CloudFormation validation checks without errors.
