**Designation:** The designated role is that of a specialist in AWS CloudFormation Engineering, possessing profound expertise in the architecting of secure, scalable, and cost-optimized infrastructures.

**Objective:** The primary objective is the generation of a complete, production-grade AWS CloudFormation template composed in the **JSON** data-interchange format. This template is intended to provision a foundational, multi-Availability Zone networking and compute environment situated within the `us-east-1` region. The resultant artifact must be comprehensively documented, parameterized, and adhere strictly to established AWS best practices.

### **Enumerated Stipulations**

**1. Parameterization:**
The template is mandated to incorporate the subsequent parameters to facilitate its reusability and modularity:

* `ProjectName`: A string value to be utilized as a prefix for the nomenclature of all instantiated resources, thereby ensuring coherent tagging and systematic identification. (Exemplar Default: `"MyWebApp"`)

* `SshCidrBlock`: The specific Classless Inter-Domain Routing (CIDR) block from which Secure Shell (SSH) access is permissible. (Exemplar Default: `"203.0.113.0/24"`)

* `InstanceType`: The classification of the EC2 instance to be deployed throughout the environment. (Exemplar Default: `"t3.micro"`)

**2. Networking Infrastructure:**
The following network topology is to be constructed:

* **Virtual Private Cloud (VPC):**

  * A singular VPC shall be established with the assigned CIDR block of `10.0.0.0/16`.

* **Subnetworks (Subnets):**

  * The instantiation of three distinct subnets is required, with the stipulation that each reside within a separate Availability Zone. This distribution shall be achieved through the dynamic application of the `Fn::GetAZs` intrinsic function.

  * **Public Subnet:**

    * CIDR: `10.0.1.0/24`.

    * This subnet must be configured for the automatic assignment of public IPv4 addresses to any instances launched therein.

  * **Private Subnet A:**

    * CIDR: `10.0.2.0/24`.

  * **Private Subnet B:**

    * CIDR: `10.0.3.0/24`.

* **Gateways and Routing Logic:**

  * **Internet Gateway:** An Internet Gateway shall be created and subsequently attached to the VPC.

  * **NAT Gateway:** A Network Address Translation (NAT) Gateway, accompanied by an associated Elastic IP address, is to be deployed within the Public Subnet.

  * **Route Tables:**

    * **Public Route Table:** This table must be associated with the Public Subnet and is required to contain a default route (`0.0.0.0/0`) directed to the Internet Gateway.

    * **Private Route Table:** This table is to be associated with both Private Subnets and must contain a default route (`0.0.0.0/0`) directed to the NAT Gateway.

**3. Compute Stratum:**
The compute resources shall be provisioned as follows:

* **EC2 Instances:**

  * The deployment of one Elastic Compute Cloud (EC2) instance within each of the three aforementioned subnets is required.

  * The Amazon Machine Image (AMI) to be utilized must be the latest available for Amazon Linux 2. The AMI identifier shall be retrieved dynamically via the SSM Parameter Store path: `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`.

**4. Security and Monitoring Protocols:**
The following security and monitoring configurations are mandated:

* **EC2 Security Group:**

  * A unitary security group is to be configured for application across all three EC2 instances.

  * **Ingress Rules:**

    * Ingress for SSH traffic on TCP port 22 shall be permitted exclusively from the CIDR block specified by the `SshCidrBlock` parameter.

    * All network traffic originating from any resource within the same security group shall be permitted, thereby facilitating intra-VPC communication.

* **VPC Flow Logs:**

  * A CloudWatch Logs Log Group must be created for the purpose of storing flow log data.

  * VPC Flow Logs are to be enabled for the entire VPC, configured to capture `ALL` traffic dispositions (`ACCEPT`, `REJECT`).

  * The resultant logs must be configured for publication to the aforementioned CloudWatch Log Group.

**5. Resource Metadata and Outputs:**
The following conventions for metadata and stack outputs must be observed:

* **Resource Tagging:**

  * It is requisite that a `Name` tag be applied to all supported resources, including but not limited to the VPC, Subnets, Route Tables, Gateways, and EC2 Instances.

  * The value assigned to the `Name` tag is to be dynamically constructed, concatenating the `ProjectName` parameter with a resource-specific identifier (e.g., `MyWebApp-VPC`, `MyWebApp-Public-Subnet-1a`, `MyWebApp-EC2-Private-A`).

* **Outputs Section:**

  * The template shall incorporate an `Outputs` section that exports the identifiers of key resources for external reference. This section must include, at a minimum, the `VPCId`, `PublicInstanceId`, and the `NATGatewayEIP`.

**Terminal Deliverable:**
The final deliverable shall be a singular, syntactically valid, and correctly formatted JSON file that constitutes the complete CloudFormation template. It is imperative that intrinsic functions (e.g., `!Ref`, `!GetAtt`, `!Sub`) are correctly utilized to establish dependencies and relationships between resources.
