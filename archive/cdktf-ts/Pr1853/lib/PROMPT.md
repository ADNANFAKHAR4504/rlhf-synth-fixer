I want you to act as an expert AWS Infrastructure Engineer with a strong focus on Infrastructure as Code (IaC), specifically using **CDKTF with TypeScript**.

Your task is to generate **complete, production-ready CDKTF TypeScript code** that provisions a **multi-environment AWS infrastructure**. The solution should handle different configurations for **development, staging, and production** environments, using a centralized mapping for easy management.

The output must be organized into exactly two files:

- `lib/modules.ts`
- `lib/tap-stack.ts`

---

## File 1: `lib/modules.ts`

This file should define **reusable, modular infrastructure components**.

### VpcModule
- Create a `TerraformModule` class for a VPC.  
- It should accept `name` and `cidrBlock` as properties.  
- It must provision an `aws_vpc` and at least one `aws_subnet`.  
- The created `subnetId` should be exposed as a **public output property**.  

### Ec2Module
- Create a `TerraformModule` class for an EC2 Instance.  
- It should accept `instanceType`, `ami`, `subnetId`, and `tags` as properties.  
- It must provision an `aws_instance` using the given properties.  

---

## File 2: `lib/tap-stack.ts`

This is the **main stack file** that wires everything together.

### TapStack Class
- Create a `TapStack` class that extends `TerraformStack`.  
- Its constructor should accept `scope`, `id`, and a **configuration object** containing an `environment` string (`dev`, `staging`, or `prod`).  

### Environment Configuration Mapping
Inside the stack, define a single configuration map (plain object) that specifies settings for each environment:

- **dev**: `t2.micro` instance and VPC CIDR `10.10.1.0/24`  
- **staging**: `t3.small` instance and VPC CIDR `10.10.2.0/24`  
- **production**: `t3.medium` instance and VPC CIDR `10.10.3.0/24`  

### Dynamic Resource Creation
- Based on the `environment` string passed in, look up the parameters from the map.  
- Instantiate the `VpcModule` with the environment-specific CIDR.  
- Instantiate the `Ec2Module` with the correct `instanceType` and the `subnetId` output from the `VpcModule`.  

### Tagging
- Ensure all resources created by the stack are tagged with the environment name (e.g., `Environment=dev`, `Environment=staging`, `Environment=production`).  

---

## Final Instructions
- Provide the **full, unabridged TypeScript code** for both `lib/modules.ts` and `lib/tap-stack.ts`.  
- The code should be **clean, well-commented, and production-ready**.  
- It should be ready to import into a standard **CDKTF `main.ts` entrypoint file**.  
- Make sure the environment configuration selection logic is **robust and clearly demonstrated**.  