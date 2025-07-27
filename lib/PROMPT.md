You are a cloud infrastructure expert. Using the AWS CDK with Python, build a complete, regionally redundant infrastructure on AWS that meets the following requirements. Ensure all services are configured according to best practices, interconnected securely, and defined as Infrastructure as Code.

Infrastructure Requirements:

Deploy infrastructure in at least two AWS regions to ensure regional redundancy.

Create VPCs in each region, with public and private subnets spanning multiple availability zones.

Deploy EC2 Auto Scaling Groups per region:

Minimum of 2, maximum of 10 instances per region.

Instances launched in private subnets.

Use Elastic Load Balancers (ELB) with HTTP/HTTPS listeners in public subnets to route traffic to EC2 instances.

Set up security groups to:

Allow ELB to connect to EC2 instances on ports 80 and 443.

Restrict SSH access (port 22) to a specific IP range or management subnet.

Allow EC2 instances to access RDS over the correct database port (e.g., 5432 for PostgreSQL).

Deploy Amazon RDS with multi-AZ enabled, inside private subnets. Enable automated backups with at least 7-day retention.

Configure AWS Route 53 for DNS management, including:

Hosted zones and record sets.

Health checks and failover routing across regions.

Enable Amazon CloudWatch for monitoring:

EC2 metrics (CPU, memory, disk)

RDS performance (connections, IOPS)

VPC networking and latency

Create AWS Lambda functions triggered on a cron schedule for lightweight serverless processing tasks.

Provision S3 buckets with:

Versioning

Encryption at rest using either SSE-S3 or SSE-KMS

Define IAM roles and policies to:

Restrict infrastructure management to a specific team or role.

Enforce least privilege access control.

Ensure all AWS resources are tagged (e.g., Environment, Team, CostCenter) for proper cost allocation.

Use AWS Systems Manager (SSM) to automate patching of EC2 instances.

Attach AWS WAF to the ELBs to defend against common web attacks (e.g., SQL injection, XSS).

Configure Slack notifications for infrastructure changes using AWS Chatbot or a webhook-based integration.

Instructions:

Use AWS CDK with Python as the Infrastructure as Code tool.

Define and organize resources using proper CDK constructs and stacks.

Ensure that all services are securely connected, such as:

ELB to EC2

EC2 to RDS

CloudWatch to all relevant resources

Lambda with S3 or EventBridge triggers if needed

Follow AWS best practices for networking, access control, encryption, and scalability.

Include comments in the CDK code to explain each major resource and connection.