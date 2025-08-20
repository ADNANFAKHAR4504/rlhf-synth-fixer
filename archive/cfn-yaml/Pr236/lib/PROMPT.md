Heres a **high-level, comprehensive user prompt** that you can use to generate or request a CloudFormation YAML template for the network infrastructure described:

---

### Prompt Title:

**Generate a basic public network infrastructure in AWS using CloudFormation YAML (Production Environment)**

---

### Prompt Description:

Act as an **expert AWS Solutions Architect**. Your task is to write a **CloudFormation YAML template** to configure a **basic network infrastructure** in the `us-east-1` AWS region. This infrastructure will support a **production environment** and must follow **AWS best practices for naming, tagging, and internet accessibility**.

---

### Infrastructure Requirements:

#### 1. **VPC**

* Create a **VPC** named `ProductionVPC` with a CIDR block of `10.0.0.0/16`.

#### 2. **Subnets**

* Create **two public subnets** inside the VPC:

* `PublicSubnetA` with CIDR block `10.0.1.0/24`
* `PublicSubnetB` with CIDR block `10.0.2.0/24`

#### 3. **Internet Gateway**

* Create an **Internet Gateway**
* Attach it to the VPC to allow public internet access

#### 4. **Route Table**

* Create a **Route Table** for public access
* Add a **default route (`0.0.0.0/0`)** pointing to the Internet Gateway

#### 5. **Route Table Associations**

* Associate the route table with both public subnets

#### 6. **Tagging**

* All resources must be tagged with:

```yaml
Tags:
- Key: Environment
Value: Production
```

#### 7. **Best Practices**

* Use **descriptive logical names** for resources (e.g., `PublicRouteTable`, `IGW`, `AttachIGW`)
* Organize and indent YAML properly
* Ensure the template **validates** and **deploys without errors**