## Secure Web App Environment in Pulumi TypeScript

Pulumi script needs to define and connect the following components.

#### **1. Networking Layer**

- Inside the existing VPC, define two subnets:
  - A **public subnet**
  - A **private subnet**

#### **2. Database Tier**

- Provision an **RDS MySQL** instance (`db.t3.micro`) within the **private subnet**.
- It requires a custom **parameter group** to set `max_connections` to `100`.
- The master password for the database must be created and managed by **AWS Secrets Manager**, including rotation.

#### **3. Application & Web Tiers**

- Deploy a single **EC2 instance** in the **public subnet**.
  - Its security group must only allow SSH access from the IP range `203.0.113.0/24`.
- Create an **Application Load Balancer (ALB)**.
  - It should listen on port 80 and have the EC2 instance as its target.
- Configure a **Route 53 'A' Record** that points a domain (e.g., `app.your-domain.com`) to the ALB.
- **Connectivity**: Configure the security groups so the EC2 instance's group is allowed to connect to the RDS instance's group on the MySQL port (3306).

#### **4. Storage & Serverless**

- Create an S3 bucket named **`my-app-data-bucket`**.
- Provision a **Lambda function**.
  - It needs a least-privilege **IAM execution role** granting it permission to access the `my-app-data-bucket`.

#### **5. Security, Auditing & Governance**

- Create a customer-managed **AWS KMS key**. Use this key to encrypt the S3 bucket and the RDS instance.
- Set up an **AWS CloudTrail** trail to monitor data access events for the S3 bucket.
- Enable basic **CloudWatch logging** for the EC2 and RDS instances.
- **Tag all resources** with `Environment: Production` and `Owner: DevOps`.

#### **5. Region**

- us-west-1 (add it in the provider block)

---

### **IaC Constraints Checklist**

- Create New VPC
- Provisions one public and one private subnet with the specified CIDRs.
- EC2 is public, with SSH access locked down.
- RDS is private, uses a custom parameter group, and its password is in Secrets Manager.
- Security groups correctly link the ALB, EC2, and RDS tiers.
- The Route 53 A record points to the ALB.
- The Lambda's IAM role is scoped tightly to the S3 bucket.
- A single KMS key is created and used for S3 and RDS encryption.
- A CloudTrail trail logs S3 data events.
- All resources are correctly tagged.

---

### **Expected Output**

- **Language**: TypeScript
- **Tool**: Pulumi
- **Project Structure**:
  - `tap.ts`: The main file defining the infrastructure.
  - `tap-stack.ts` : The file defines the TapStack class, the main Pulumi ComponentResource for the project
  - `resources.ts` : This is where you would create instances of your other component resources
  - `Pulumi.yaml`: The project definition file.
