Objective:
Create an AWS CloudFormation YAML template to provision a highly available, resilient, and scalable web application infrastructure that meets strict service-level objectives for uptime and failover recovery.

Functional Requirements:

Multi-AZ Deployment:
Deploy compute and database resources across at least two AWS Availability Zones to ensure redundancy and high availability.

Auto Scaling:
Implement Auto Scaling Groups behind a load balancer to handle traffic surges automatically without manual intervention.

Static Elastic IP for Load Balancer:
Allocate and use a static Elastic IP address with the primary load balancer to ensure a consistent public-facing endpoint, even when reassociating resources.

RDS Multi-AZ Failover:
Deploy Amazon RDS with automatic failover capability, using Multi-AZ deployment mode to ensure synchronous replication and failover support.

Monitoring and Alerting with CloudWatch:

Enable Amazon CloudWatch for monitoring application and instance health.

Set up CloudWatch Alarms to detect instance or application-level failures.

Configure SNS notifications to alert administrators of critical failures or threshold breaches.

IAM Roles with Least Privilege:
Define and attach IAM roles and policies that strictly adhere to the principle of least privilege, ensuring each service and instance only has access to necessary resources.

Rapid Failure Recovery:
Ensure that the system can recover automatically from any failure within 5 minutes to meet SLA requirements for downtime and availability.