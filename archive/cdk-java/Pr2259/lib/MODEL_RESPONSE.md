## Multi-Region High Availability
- The CDK app provisions resources in **two regions**: `us-east-1` and `us-west-2`.
- Two independent `TapStack` instances are created, one per region, to ensure **failover** and **disaster recovery**.

---

## Auto Scaling & Elastic Load Balancer
- Each regional stack defines an **Auto Scaling Group (ASG)** of EC2 instances.
- An **Application Load Balancer (ALB)** distributes traffic across the ASG.
- Scaling policies are attached to automatically increase/decrease capacity on load spikes.

---

## Centralized Logging
- A dedicated **S3 bucket** with **versioning** and **lifecycle policies** is deployed in the primary region (`us-east-1`).
- All application and system logs are configured to stream into this bucket.

---

## Database Resilience
- Each region provisions **Amazon RDS PostgreSQL** in **Multi-AZ** mode.
- Database storage is **KMS-encrypted**.
- SSL connections are enforced for data in transit.

---

## Route 53 DNS Management
- A global **Route 53 hosted zone** is configured with:
  - **Health checks** for each ALB endpoint.
  - A **failover routing policy** to automatically direct traffic to the healthy region.

---

## Secure VPC Design
- Each region has a dedicated **VPC** with:
  - **Public subnets** (for ALB and NAT gateways).
  - **Private subnets** (for EC2 ASG and RDS).
- Network ACLs and security groups enforce **least-privileged inbound/outbound rules**.

---

## IAM & Security
- Each resource stack attaches **IAM roles/policies** following **least privilege** principles.
- **AWS KMS** ensures encryption at rest.
- **SSL/TLS certificates** are integrated with ALB via ACM for encryption in transit.

---

## Monitoring & Alerts
- **CloudWatch Alarms** monitor:
  - CPU utilization on ASG instances.
  - RDS health metrics.
  - ELB target group health.
- Alarms trigger notifications (via SNS) to operators on threshold breach.

---

## Compliance & Robustness
- The design enforces **least privilege**, **multi-AZ**, **multi-region**, **encryption**, and **scalability**.
- The infrastructure is production-ready and resilient against **regional outages**.
- Validated through synthesis (`cdk synth`) and deployment tests.

---
