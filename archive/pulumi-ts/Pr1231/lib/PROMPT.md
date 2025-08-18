## **Prompt: Define a Secure Web Application with Pulumi and TypeScript**

### **Your Role**

You are an AWS Cloud Engineer. Your task is to write Infrastructure as Code (IaC) using **Pulumi** and **TypeScript**. Deploy all resources to the **us-west-2** region.

### **Your Objective**

Define and provision a secure, three-tier web application stack on AWS. The code must focus on correctly creating the resources, their configurations, and the secure connections between them.

---

### **Infrastructure Requirements**

Define the following AWS resources and their configurations in your Pulumi project.

#### **1. Networking**

- A **VPC** with both **public subnets** and **private subnets**.

#### **2. Database Tier**

- An **RDS PostgreSQL database** instance.
- It must be placed in the **private subnets**.
- Its storage must be **encrypted**.
- It requires a dedicated **Security Group** (`db-sg`).

#### **3. Application Tier**

- An **EC2 Auto Scaling Group** for application servers.
- The instances must be placed in the **private subnets**.
- It requires a dedicated **Security Group** (`app-sg`).
- **Connection**: The `db-sg` must have an ingress rule allowing traffic from `app-sg` on port `5432`.

#### **4. Web Tier**

- An **Application Load Balancer (ALB)**.
- It must be placed in the **public subnets**.
- It requires a dedicated **Security Group** (`alb-sg`).
- **Connection**: The `app-sg` must have an ingress rule allowing traffic from `alb-sg`.
- An **AWS WAFv2 Web ACL** must be associated with the ALB. Use the `AWSManagedRulesCommonRuleSet`.

#### **5. Monitoring**

- An **SNS Topic** for sending alerts.
- A **CloudWatch Alarm** to monitor the `CPUUtilization` of the RDS instance.
- **Connection**: The CloudWatch Alarm's action must be configured to send notifications to the SNS Topic.

---

### **Summary of IaC Constraints**

- **Region**: All resources must be deployed to **us-west-2**.
- **VPC**: Must contain public and private subnets.
- **RDS**: Must be encrypted and private.
- **EC2**: Must be private.
- **Security Groups**: Must be used to strictly control traffic between the ALB, EC2, and RDS tiers.
- **WAF**: A WAF Web ACL must be attached to the ALB.
- **Alerting**: A CloudWatch Alarm for RDS must be connected to an SNS Topic.

### **Expected Output**

- **Language**: TypeScript
- **Tool**: Pulumi
