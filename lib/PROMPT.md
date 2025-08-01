Here's a **comprehensive high-level user prompt** that clearly defines the goals, constraints, and desired output for the CloudFormation-based infrastructure setup:

---

**High-Level User Prompt:**

> I need an AWS CloudFormation template written in **YAML** that sets up a **secure and scalable network infrastructure** in the **us-west-2** region. The template should automate the following requirements:
>
> 1. **VPC Configuration**:
>
>    * Create a **Virtual Private Cloud (VPC)** with a CIDR block of `10.0.0.0/16`.
>    * Divide the VPC into **four subnets**:
>
>      * **Two public subnets** (e.g., `10.0.1.0/24` and `10.0.2.0/24`)
>      * **Two private subnets** (e.g., `10.0.3.0/24` and `10.0.4.0/24`)
>      * Distribute each pair across **two different Availability Zones (AZs)** for high availability.
> 2. **Internet Access**:
>
>    * Attach an **Internet Gateway (IGW)** to the VPC.
>    * Configure route tables to ensure public subnets can reach the internet via the IGW.
>    * Deploy a **NAT Gateway** (in a public subnet) to enable **outbound internet access** for private subnets.
>    * Set up appropriate **route tables** for private subnets to direct traffic through the NAT Gateway.
> 3. **Security Groups**:
>
>    * Create a **Security Group** that allows **SSH (port 22)** access **only from a specific list of IP ranges** (e.g., a CIDR list like `203.0.113.0/24`). No wide-open SSH access.
>    * Apply this Security Group to resources that require SSH access.
> 4. **Best Practices**:
>
>    * Follow AWS best practices for security, including least privilege and subnet isolation.
>    * Use **default naming conventions** unless otherwise specified.
>    * Keep the configuration **efficient and clean** (no unused resources or parameters).
> 5. **Outputs**:
>
>    * Output the following resources for validation:
>
>      * VPC ID
>      * Public Subnet IDs
>      * Private Subnet IDs
>      * NAT Gateway ID
>      * Internet Gateway ID
>      * Security Group ID for SSH access
>
> The solution will be validated in a sandbox AWS environment to ensure all components function correctly. Please provide only the **YAML CloudFormation template**, ready to be deployed.