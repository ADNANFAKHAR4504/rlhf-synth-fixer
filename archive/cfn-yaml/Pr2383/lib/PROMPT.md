Environment:

Create a CloudFormation template in YAML that deploys a highly available web application infrastructure. The infrastructure must satisfy the following requirements:

Deploy the application across the AWS regions us-east-1 and us-west-2 for high availability but ensure strict data residency policies in us-east-1 while providing cross-region replication without direct cross-region traffic for non-global services.

Distribute incoming traffic using an Elastic Load Balancer, but ensure that traffic from us-west-2 only routes through us-east-1 if the load balancer is at capacity.

Implement an auto-scaling group that scales between 2 to 6 instances of type t3.micro. However, auto-scaling must be conditioned by both traffic volume and resource usage, with dynamic scaling behavior only triggered by a non-zero CPU and memory threshold that should be customizable per region.

Store data in a Multi-AZ RDS PostgreSQL instance with a setup for manual failover. Failover mechanisms must also apply to the read replica but must prevent failover during active read operations in us-west-2 unless explicitly triggered.

Implement logging and monitoring using CloudWatch Logs, but logs must not be stored beyond 30 days unless explicitly configured for global replication (i.e., any CloudWatch log group should be limited to regional retention by default unless cross-region aggregation is enabled).

Ensure all EC2 instances adhere to a VPC setup with public and private subnets. However, ensure EC2 instances in us-east-1 must route traffic to the private subnet in us-west-2 using private IP addresses, while us-west-2 instances can only use VPC peering for communication to the private subnet in us-east-1.

Implement security best practices with IAM roles for least privileged access, but create a scenario where access control to specific instances is temporarily overridden in case of emergency without manual IAM role updates.

Use Route 53 for managing DNS with failover routing policies. However, DNS failover must respect regional resource availability and service health checks that depend on the availability of multi-region load balancers without introducing unnecessary propagation delays.

Tag all resources according to predefined cost-center and environment tags, but allow overriding tags for resources under the "failover" condition. These overridden tags must apply retroactively to previously deployed resources.

Use AWS Backup for daily backups of the RDS instance. However, backups must only be triggered on weekdays, with dynamic exclusion for weekends while adhering to region-specific backup windows.

Expected output:

A YAML CloudFormation template file that, when deployed, establishes the described infrastructure. Ensure the template passes validation checks, adheres to AWS best practices, and enforces regional and failover constraints. There should be no resource conflicts or deployment errors, but the model should also ensure complete failover resilience across regions with data residency considerations and dynamic, real-time infrastructure adjustments during peak load conditions.

projectName: IaC - AWS Nova Model Breaking
Constraints Items:

Use AWS Regions us-east-1 and us-west-2 for high availability, but enforce strict data residency policies for us-east-1 and cross-region replication without direct cross-region traffic unless global resources are involved.

Utilize AWS Elastic Load Balancer to distribute incoming traffic with traffic routing restrictions based on capacity constraints and cross-region routing fallbacks.

Implement auto-scaling with dynamic scaling behavior conditioned by both traffic volume and resource usage thresholds.

Store data in a Multi-AZ RDS PostgreSQL instance with manual failover enabled but read replica failover restrictions when reads are active.

Enable CloudWatch Logs for monitoring, but limit log retention to 30 days unless specified for global log replication.

Ensure EC2 instances are deployed within a VPC with public and private subnets, but private IP routing conditions between us-east-1 and us-west-2 should be respected.

Apply IAM least privilege with emergency access controls that can temporarily override IAM roles without manual updates.

Use Route 53 for DNS failover routing policies with regional service health checks and low propagation delays.

Tag all resources according to cost-center and environment, but allow temporary tag overrides during failover conditions.

Use AWS Backup for daily RDS backups with a dynamic exclusion for weekends based on region-specific backup windows.

Problem Difficulty: hard
Proposed Statement:

The target environment involves deploying a highly available application across two regions, with regional traffic routing rules, strict data residency and cross-region replication, and dynamic scaling behavior that adapts to real-time resource constraints. The infrastructure must also ensure complete failover resilience, emergency access controls, and regional backup windows while strictly adhering to AWS security and compliance standards.