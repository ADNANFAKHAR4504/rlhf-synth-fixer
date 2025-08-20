# Task: Build a Highly Available AWS Web Application Infrastructure Using CloudFormation

## Goal

Develop a CloudFormation YAML template named `TapStack.yaml` that provisions a **resilient**, **scalable**, and **cost-effective** infrastructure stack for a web application, following AWS architectural best practices.

## Infrastructure Criteria

Your CloudFormation template should provision the following features:

### 1. **Resilience and Availability**
- Deploy EC2 instances across **multiple Availability Zones (AZs)** within a single AWS region.
- Ensure infrastructure continuity during zone-level failures by leveraging redundancy and geographic distribution.

### 2. **Load Distribution**
- Integrate an **Application Load Balancer (ALB)** to distribute incoming web traffic across the EC2 instances.
- Support both HTTP (or HTTPS optionally) routing and ensure even traffic flow across all availability zones.

### 3. **Dynamic Auto Scaling**
- Implement **Auto Scaling Groups** to adjust the number of EC2 instances based on real-time demand.
- Configuration requirements:
  - **Minimum Capacity:** 2 EC2 instances
  - **Maximum Capacity:** 10 EC2 instances
  - **Scaling Mechanism:** Based on CPU utilization or other load metrics
- Define appropriate **health checks** to identify and automatically replace non-functional instances.

### 4. **Persistent Logging with Lifecycle Policy**
- Create an **Amazon S3 bucket** to persist application logs securely.
- Set up a **lifecycle policy** that transitions logs to **Amazon S3 Glacier** after **30 days** to optimize storage costs.

### 5. **Flexibility and Reusability**
- Ensure the template is **region-agnostic** unless specific constraints are mentioned.
- Use **CloudFormation Parameters** to support customization of VPC CIDRs, instance types, environment names, etc.
- Apply consistent **naming conventions** and **resource tagging** (e.g., `Environment`, `Name`) for clarity and cost tracking.

## Final Deliverable

- A fully functional CloudFormation template named: `TapStack.yaml`
- Must be:
  - **Deployable** in any AWS environment
  - **Syntactically correct**, **logically organized**, and written using **Infrastructure as Code (IaC)** best practices
  - Easy to understand and modify for future needs

## Additional Guidelines

- Use **IAM roles or policies** only if required to enable specific services or features.
- Include **Output values** such as:
  - Load Balancer DNS name
  - S3 bucket name
  - Auto Scaling Group name
- Focus on **cost optimization** without compromising on performance or availability. 

