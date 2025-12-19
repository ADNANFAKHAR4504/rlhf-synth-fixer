You are a Senior Cloud Engineer with expertise in AWS.

**Global**
- Deploy in a **single AWS region** across **multiple Availability Zones** for high availability.
- Target workload: real-time clickstream ingestion and processing for ~**10,000 events/min** at peak with **no event loss**.
- All components must run in **private subnets**; any egress to the internet must go **through NAT Gateways only**.

**VPC & Networking**
- Create a VPC with **private subnets in at least two AZs** (multi-AZ).
- Provide **NAT Gateways** and route tables so private subnets have **egress-only internet access** via NAT.
- No public subnets; ensure **all resources are placed in private subnets**.
- Security groups and NACLs must allow only the **minimum required east–west traffic** among Kinesis, Lambda, DynamoDB endpoints, and ALB targets.

**Amazon Kinesis Data Streams (Ingestion)**
- Provision a Kinesis Data Stream to ingest **real-time clickstream events**.
- Stream capacity must sustain **~10,000 events/min** peaks and **prevent data loss**.
- Enable **multi-AZ fault tolerance** by placing producers/consumers in subnets spanning multiple AZs.

**AWS Lambda (Processing)**
- Create Lambda functions to **consume from Kinesis** and **process events in real time**.
- Place Lambdas in **private subnets** with VPC access; allow **egress via NAT** as needed.
- Configure **event source mapping** from the Kinesis stream to Lambda with appropriate batch size and retry behavior to avoid event loss.

**Amazon DynamoDB (Processed Storage)**
- Create a DynamoDB table to store **processed behavioral data** used by the recommendation engine.
- Enable **Auto Scaling** for read/write capacity.
- Enable **Point-in-Time Recovery (PITR)**.
- Use **VPC endpoints**/private connectivity patterns where applicable; ensure all access originates from **private subnets**.

**Application Load Balancer (API Endpoints)**
- Deploy an **Application Load Balancer** for API endpoints.
- Configure **target group(s)** and **listener(s)** for the API services that expose processed/derived insights internally.
- Ensure the ALB and its targets are **spread across multiple AZs** for high availability.
- All traffic remains within the VPC; **no public exposure**.

---

### File Structure  
- `provider.tf` (already present)  
  - Configure the Terraform **S3 backend** for remote state (all identifiers/paths parameterized).  
- `lib/tap_stack.tf`  
  - Declare **all variables** (including `aws_region`, unique suffix/ID for S3 names, CIDRs, SSH allowed CIDR, tagging map, toggle flags) with default value set.  
  - Define **locals** for resource naming conventions, tags, CIDR blocks, toggles, and IP ranges.  
  - **Implement resources**:  
  - **Outputs**:  
    Expose IDs/ARNs/hosts/endpoints for all key resources.