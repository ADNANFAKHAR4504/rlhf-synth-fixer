Hello! I need you to act as an expert AWS Cloud Engineer. Your task is to generate a complete AWS CDK stack using TypeScript to deploy a secure and highly available three-tier web application architecture. This architecture should replicate a standard corporate network being migrated to the cloud.

Please provide the complete, well-commented code for the main CDK stack file.

### **Core Requirements**

1.  **VPC and Subnet Configuration:**

    -   Create a new VPC with the CIDR block `192.168.0.0/16`.

    -   The VPC must span **two Availability Zones**.

    -   Configure three distinct subnet tiers within the VPC:

        -   **Public Subnets:** For internet-facing resources.

        -   **Private Application Subnets:** For the web server EC2 instances.

        -   **Private Database Subnets:** A fully isolated tier for databases.

2.  **Load Balancing and Compute:**

    -   Deploy an **Application Load Balancer (ALB)** in the public subnets, listening for HTTP traffic on port 80.

    -   Launch a basic **EC2 instance** in each private application subnet to simulate the web tier. These instances should have a user data script to install and run a simple web server (like Nginx) that responds on port 80. The ALB should route traffic to these instances.

3.  **Network Security and Routing:**

    -   Deploy a **NAT Gateway** in each public subnet to allow resources in the private subnets to initiate outbound connections to the internet.

    -   Ensure that EC2 instances in the **private application and database subnets are not assigned public IP addresses**.

    -   Configure the **Security Groups** with the following strict rules:

        -   **ALB Security Group:** Allow inbound HTTP (port 80) traffic from anywhere on the internet (`0.0.0.0/0`).

        -   **Web Tier Security Group:** Only allow inbound traffic on port 80 from the ALB's security group.

### **Bastion Host for Management and Testing**

To facilitate future integration testing and provide secure administrative access, please include an EC2 bastion host.

-   **Placement:** The bastion host should be placed in one of the **public subnets** so it can be reached from the internet.

-   **Security:** Create a dedicated security group for the bastion host. This group must **only** allow inbound SSH (port 22) traffic from a user-configurable IP address. Please use a placeholder like `0.0.0.0/0` in the code for the source IP(this is clearly for integration.

### **Expected Output**

A single, complete TypeScript file for the CDK stack (`lib/migration-stack.ts`) that includes all the resources defined above. The code should be production-ready, well-structured, and include comments explaining the key components.