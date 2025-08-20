Here is a **comprehensive and high-quality user prompt** tailored for generating or validating a CloudFormation YAML template based on your exact requirements:

---

### Prompt Title

**Generate a Basic Production-Ready AWS Environment in us-east-1 using CloudFormation YAML**

---

### Prompt Description

Act as an expert **AWS CloudFormation Architect**. Design a deployable CloudFormation **YAML template** that provisions a **basic AWS infrastructure** in the `us-east-1` region. This environment will simulate a production-grade setup, including VPC networking, compute resources, internet access, and security configuration. The template must use **CloudFormation intrinsic functions** effectively and include **tags** for resource classification.

---

### Required Infrastructure Modules and Constraints

#### 1. **Region and Tagging**

* Deploy all resources strictly within the **`us-east-1`** region by passing as parameter for re-use.
* Apply the tag `Environment: production` to **every resource**. pass Environment tag as parameter for better visibility

#### 2. **Networking Configuration**

* Create a **VPC** with the CIDR block `10.0.0.0/16` using parameter for better use.
* Within the VPC, create **two public subnets** using parameters for better visibility:

* Subnet A: `10.0.1.0/24`
* Subnet B: `10.0.2.0/24`
* Attach an **Internet Gateway** to the VPC.
* Create a **Route Table** with a route to the Internet Gateway.
* Associate the route table with both public subnets.

#### 3. **Compute Resources**
Create key pair to be used with EC2
* Launch **two EC2 instances**, one in each public subnet.
* Use the **Amazon Linux 2 AMI** (latest available in `us-east-1`).
* Associate each instance with:

* The public subnet
* A **Security Group** allowing **inbound HTTP traffic on port 80** from specific CIDR
* A **public IP address**
* A **KeyPair** (allow the key name to be passed as a parameter)

#### 4. **Security**

* Create a **Security Group** that:

* Allows **inbound HTTP (TCP/80)** from Subnets CIDR Range
* Allows **outbound** traffic by default

#### 5. **CloudFormation Best Practices**

* Use **intrinsic functions** such as:

* `!Ref` for referencing parameters and logical IDs
* `!GetAtt` for retrieving attributes like IP addresses and subnet IDs
* `!Sub` for dynamic naming or ARN construction
* Define **logical dependencies** to ensure proper provisioning order.
* Use **parameterization** where appropriate (e.g., KeyName).
* Include **Outputs** for public IPs or instance IDs for visibility after deployment.

---

### Expected Output

* A fully valid and deployable **CloudFormation YAML file** named `basic-prod-env.yaml`
* It must:

* Provision all required resources
* Be logically structured with clear sections
* Use best practices in resource referencing and dependency management
* Contain meaningful tags and intrinsic functions
* The stack should **launch without errors** and enable two EC2 instances to be **publicly accessible via HTTP (port 80)** in separate public subnets.


