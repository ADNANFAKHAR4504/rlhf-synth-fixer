Design a CDK for Terraform (CDKTF) application in **TypeScript** that provisions three completely isolated AWS environments—`dev`, `staging`, and `prod`—while ensuring architecture consistency and ease of maintenance. The implementation must be structured across only **two files**:

- `lib/tap-stack.ts`: The root stack responsible for instantiating all environments.
- `lib/modules.ts`: A reusable module library housing common constructs such as VPC, ECS, ALB, and RDS.

### Requirements

**1. Networking**
- Create an isolated VPC per environment with:
  - **3 Availability Zones**
  - **Public, Private, and Database subnets** in each AZ
  - Unique CIDR blocks:
    - `dev`: `10.0.0.0/16`
    - `staging`: `10.1.0.0/16`
    - `prod`: `10.2.0.0/16`
- Include VPC Endpoints for S3, ECR, and Systems Manager.
- Set up **VPC peering** between staging and prod for data migration.

**2. Application**
- Deploy an **ECS Fargate cluster** per environment:
  - Auto-scaling enabled via Capacity Providers.
  - Use a reusable construct for ECS Services.
  
**3. Database**
- Create an **RDS Aurora PostgreSQL** cluster per environment:
  - Use `db.t3.micro` for all environments.
  - Disable deletion protection for all environments.
  - Store database credentials in **SSM Parameter Store** encrypted with KMS.

**4. Load Balancing / DNS**
- Deploy Application Load Balancers for each environment.
- Use **HTTP listeners only**, **do not configure SSL/TLS**.
- Configure Route53 records for each environment:
  - `dev.example.com`, `staging.example.com`, `prod.example.com`

**5. IAM**
- Implement least-privilege IAM roles/policies for ECS and RDS access as reusable constructs.

**6. Logging & Monitoring**
- Enable VPC Flow Logs with varying retention:
  - Dev: 7 days  
  - Staging: 30 days  
  - Prod: 90 days  

**7. CDKTF Configuration**
- Use Terraform **remote backend** with S3 + DynamoDB for state locking per environment.
- Enforce **provider version constraints** for repeatable deployments.
- Use **stack dependencies** to ensure RDS is provisioned before ECS services.
- Export critical endpoints and IDs via CDKTF stack outputs.
- Add consistent **tagging** across all resources:
  - `Environment`
  - `Project`
  - `CostCenter`

### Background
A fintech startup needs to deploy isolated AWS environments for development, staging, and production. Each environment must maintain strict isolation while reusing infrastructure-as-code constructs for cost-efficiency and consistency.

### Expected Output
- A working CDKTF TypeScript configuration with:
  - Reusable construct modules in `lib/modules.ts`
  - Root stack orchestration in `lib/tap-stack.ts`
  - Each environment is deployable independently using the same constructs but different configuration inputs.
- All AWS resources must be provisioned within the **new VPCs** created by the stack without reusing any existing infrastructure.
