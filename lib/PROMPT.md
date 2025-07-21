
## Objective
Migrate an existing cloud infrastructure to **AWS CloudFormation**, using **YAML** format for template definitions. The system must be logically decomposed into modular stacks, preserving service continuity, security, and cost-efficiency.

---

## Requirements

### 1. **Stack Modularization**
- Convert the infrastructure into **multiple CloudFormation stacks**.
- Each stack must be represented by a **separate `.yaml` file**.
- Logical boundaries between stacks must be clearly defined (e.g., networking, compute, database, IAM).

### 2. **Stack Dependencies**
- Define clear **dependencies between stacks** using:
  - `DependsOn`
  - `Export`/`ImportValue`
  - Cross-stack references using `Fn::ImportValue`

### 3. **Region Configuration**
- All resources must be created in the **`us-east-1`** AWS region.

### 4. **Use of Intrinsic Functions**
- Use intrinsic functions appropriately:
  - `Ref`
  - `GetAtt`
  - `Sub`
  - `ImportValue`
  - `Join`

### 5. **Parameterization**
- Define **parameters** for:
  - Instance types (e.g., `t3.micro`, `m5.large`)
  - Instance counts
  - Key names
  - Environment suffixes (`dev`, `prod`, etc.)

### 6. **Non-Disruptive Updates**
- Design the stacks for **update safety**:
  - Use `UpdatePolicy`, `CreationPolicy`, and `AutoScalingRollingUpdate` where needed.
  - Avoid changes that trigger resource replacement unless necessary.

### 7. **Operation Logging**
- Enable **stack operation logging**:
  - Set up an **S3 bucket** for logging.
  - Enable CloudFormation **Stack Policy Logging**, **Change Set auditing**, and **CloudTrail logging** for stack operations.

### 8. **Security and Access Management**
- Use **IAM roles** and policies for:
  - EC2 instances
  - Lambda functions
  - Cross-stack access control
- Ensure least-privilege principle across services.

### 9. **Data Encryption**
- Use **AWS KMS**:
  - Encrypt EBS volumes
  - Encrypt S3 buckets
  - Use customer-managed KMS keys where required

### 10. **Cost Optimization**
- Utilize **on-demand instances** or **spot instances** where appropriate.
- Avoid over-provisioning.
- Apply autoscaling with defined min/max/desired counts.



