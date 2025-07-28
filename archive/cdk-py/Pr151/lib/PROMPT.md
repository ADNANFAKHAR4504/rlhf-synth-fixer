**Core Principle:** Focus on establishing secure and functional connections and dependencies between all specified resources. Assume a "least privilege" security model and prioritize network segmentation.

**Input Format:** You will receive high-level infrastructure requirements in a clear, bulleted list.

**Output Request:**
Generate the complete IaC code for the described infrastructure. Prioritize secure connectivity and resource relationships.

**Choose ONE IaC Tool for the entire solution:**
* **AWS Cloud Development Kit (CDK) - Python:** For highly abstracted, object-oriented infrastructure definitions.

**Instructions for IaC Generation:**

1.  **Network Foundation:** Always start by defining the Virtual Private Cloud (VPC), subnets (public/private/database as appropriate), NAT Gateways (for private subnet internet access), and Internet Gateways (for public subnet internet access).
2.  **Resource Placement:** Place resources in appropriate subnets based on their exposure requirements (e.g., web servers in public/private, databases in private).
3.  **Security Groups & Network ACLs:**
    * Create granular Security Groups for *each* resource type (e.g., EC2 Web SG, RDS DB SG, Load Balancer SG).
    * Define precise inbound and outbound rules for these Security Groups, allowing only necessary traffic.
    * **Crucially:** Ensure Security Groups explicitly reference *other* Security Groups to establish allowed communication pathways (e.g., EC2 Web SG's outbound rule allows traffic to RDS DB SG; RDS DB SG's inbound rule allows traffic *only* from EC2 Web SG).
    * Consider Network ACLs for additional subnet-level filtering if complex multi-tier segmentation is required.
4.  **Connectivity & Dependencies:**
    * **EC2 to RDS (if applicable):** If an RDS database is requested, the EC2 instances (e.g., application servers) must be able to securely connect to it. This involves appropriate subnet placement, route table configuration, and, most importantly, Security Group rules explicitly allowing traffic between them.
    * **Load Balancer to EC2 (if applicable):** If an Application Load Balancer (ALB) or Network Load Balancer (NLB) is requested, it must correctly route traffic to the EC2 instances. Security Groups must allow traffic from the Load Balancer to the EC2 instances.
    * **Lambda to VPC Resources (if applicable):** If Lambda functions need to access resources within the VPC (like RDS), ensure they are deployed into VPC subnets and have the correct Security Group attached.
    * **S3 VPC Endpoint (if applicable):** If S3 access is needed from private subnets, configure a VPC Endpoint for S3.
    * **Secrets Management (if applicable):** If sensitive data (e.g., database credentials) is involved, integrate AWS Secrets Manager or AWS Systems Manager Parameter Store.
    * **IAM Roles & Policies:** Define least-privilege IAM roles for EC2 instances, Lambda functions, etc., allowing them to interact with other AWS services as needed (e.g., EC2 role to access S3, CloudWatch).
    * **Networking Configuration:** Ensure correct route table associations and subnet configurations for inter-resource communication.
5.  **Monitoring & Logging (Optional but recommended):** Integrate basic CloudWatch logging for instances and services.

**High-Level Requirements:**

* **VPC:** Create a new VPC with appropriate subnets distributed across two Availability Zones.
* **Subnets:** Provision public subnets with necessary internet access and private subnets for internal resources.
* **EC2 Instance:** Deploy an EC2 instance configured with security best practices for public HTTP access, placing it in a public subnet.
* **Logging & Monitoring:** Ensure all logs and monitoring are set up with AWS CloudWatch and CloudTrail.
* **Security Compliance:** Implement necessary IAM roles, security groups, and encryption settings for security compliance.
* **Tagging:** All infrastructure should be tagged for easy identification and management.
* **Lifecycle Policies:** Ensure resource lifecycle policies to manage logs efficiently.