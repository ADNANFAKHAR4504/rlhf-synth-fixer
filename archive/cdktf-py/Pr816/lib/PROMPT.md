# IaC - AWS Nova Model Breaking

**Platform:** `cdktf`  
**Language:** `python`  
**Region:** `us-east-1`

---

## Requirements
1. **VPC**  
   - CIDR: `10.0.0.0/16`  
   - Region: `us-east-1`

2. **Subnets**  
   - 2 **public** + 2 **private**  
   - Spread across **2 Availability Zones** (e.g., `us-east-1a`, `us-east-1b`)  
   - Example CIDRs:  
     - Public: `10.0.0.0/24`, `10.0.1.0/24`  
     - Private: `10.0.2.0/24`, `10.0.3.0/24`

3. **Internet Access**
   - **Internet Gateway** for public subnets  
   - **1 NAT Gateway** (with Elastic IP) in first public subnet for private subnet egress

4. **EC2 Instances**
   - Instance type: `t3.micro`  
   - One in public subnet, one in private subnet (optional for test)  
   - SSH restricted to `203.0.113.0/24`

5. **Remote State**
   - Backend: AWS **S3** for state file  
   - **DynamoDB** table for state locking  

6. **Tagging**
   - All resources tagged: `Environment=Development`

---

## Deliverables
- CDKTF Python code for:
  - VPC, subnets, route tables, IGW, NAT, security groups, EC2
- Backend config for S3 + DynamoDB
- README with deployment + backend setup steps
- Outputs: VPC ID, subnet IDs, NAT ID, public instance IP

---

## Acceptance Checklist
- [ ] VPC created in `us-east-1` with `10.0.0.0/16`
- [ ] 2 public + 2 private subnets in 2 AZs
- [ ] IGW for public subnets
- [ ] NAT GW for private subnets
- [ ] EC2 instances = `t3.micro`
- [ ] SSH allowed only from `203.0.113.0/24`
- [ ] Remote state functional via S3 + DynamoDB
- [ ] All resources tagged `Environment=Development`

Important:  Make sure to define all the resources within `tap_stack.py`, and synthesize them via `tap.py`.