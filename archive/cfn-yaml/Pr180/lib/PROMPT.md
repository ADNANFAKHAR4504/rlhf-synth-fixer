
## Objective
Migrate an existing cloud infrastructure to AWS CloudFormation, using a **single YAML template** that defines a secure, scalable, and cost-efficient architecture. The template must maintain service continuity, modular logical separation (within the file), and follow AWS best practices.
---

## Requirements

### 1. **Single Template Structure**
- Create infrastructure using a **single CloudFormation template**.
- The template must be in **YAML format**.
- Maintain logical separation within the template using comments and organized sections (e.g., networking, compute, database, IAM).

### 2. **Resource Dependencies**
- Define clear **dependencies between resources** using:
  - `DependsOn`
  - `Ref` and `GetAtt` for resource references
  - Proper ordering of resource creation

### 3. **Region Configuration**
- All resources must be created in the **`us-east-1`** AWS region.

### 4. **Use of Intrinsic Functions**
- Use intrinsic functions appropriately:
  - `Ref`
  - `GetAtt`
  - `Sub`
  - `Join`
  - `Select`

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
  - Service-to-service access control
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



