### **Prompt: Security Configuration as Code CloudFormation YAML**

You are acting as a **Solution Architect** responsible for designing a secure and scalable network infrastructure on AWS using **CloudFormation YAML**. Your objective is to translate business and security requirements into a production-ready, codified infrastructure template. The deployment must occur in the **`us-east-1`** region and follow AWS best practices for security, scalability, and availability.

#### **Infrastructure Requirements:**

1. **VPC Configuration**

* Create a VPC in `us-east-1` with a **CIDR block of `10.0.0.0/16`**

2. **Subnets**

* Define **3 public subnets** and **3 private subnets**
* Distribute subnets evenly across **3 availability zones** for high availability

3. **Internet & NAT Gateways**

* Attach an **Internet Gateway (IGW)** to the VPC
* Route public subnet traffic to the IGW
* Deploy a **NAT Gateway** in a public subnet to allow **private subnet instances** to access the internet

4. **Routing & Traffic Control**

* All subnets must allow **outbound traffic**
* Inbound traffic must be **restricted**, allowing only:

* **SSH (port 22)** access to specific EC2 instances
* **HTTP (port 80)** traffic to designated web resources

5. **Security Groups**

* Define Security Groups to enforce the allowed traffic
* Block all other inbound access by default

6. **Network ACL (NACL)**

* Implement a **Network ACL** to add another layer of traffic control at the subnet level

7. **S3 Bucket**

* Provision an **S3 bucket** with **default encryption enabled** to securely store data

8. **Template Format**

* Write the solution entirely in **YAML**
* Ensure the template is **modular**, **readable**, **well-commented**, and passes **AWS CloudFormation validation**

#### **Expected Output:**

Submit a YAML file (e.g., `secure_network_stack.yaml`) that defines the infrastructure described above. Your template must be **fully executable in AWS CloudFormation**, adhere to **infrastructure-as-code standards**, and **pass validation checks**. All configurations must reflect the responsibilities and foresight expected of a Solution Architect.