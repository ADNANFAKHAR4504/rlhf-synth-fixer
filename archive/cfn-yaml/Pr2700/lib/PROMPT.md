# **IaC - AWS Nova Model Breaking**

## **Objective**
Design and implement a **production-grade, secure AWS environment** using **AWS CloudFormation (YAML)**. The solution must enforce **least-privilege IAM**, strong **network boundaries**, and **encryption at rest** across all services, following AWS best practices.

---

## **Problem Statement**
You are to create a **CloudFormation template** that provisions a secure foundation for a production application in **`us-west-2`**.  
The stack should include **multiple VPCs**, **IAM roles**, and **security groups** that enable **secure cross-service communication**, with **tight ingress/egress controls** and **KMS-backed encryption** for data at rest.  
All production resources should use a **`prod-`** naming prefix for consistency and governance.

---

## **Functional Requirements**
1. **Identity & Access Management (IAM)**
   - Define **roles and policies** that strictly follow the **principle of least privilege**.
   - Scope permissions narrowly to the required services, actions, and resources.
   - Use **managed policies** only when they do not over-grant; otherwise, prefer **custom inline policies**.

2. **Network Security**
   - Provision **multiple VPCs** (e.g., app and shared-services) with appropriate **subnets**, **route tables**, and **NAT/IGW** as needed.
   - Create **security groups** with **minimal ingress/egress** rules to permit only necessary traffic.
   - Define **Network ACLs** as an additional layer of defense where appropriate.
   - Ensure **secure cross-service communication** (e.g., VPC endpoints/PrivateLink where applicable).

3. **Encryption**
   - **Encrypt all data at rest** using **AWS KMS** or native encryption mechanisms (e.g., EBS, RDS, S3 SSE-KMS).
   - Limit KMS key usage via **key policies** and **grants** to least privilege principals.

4. **Operational Hardening**
   - Tag all resources with meaningful metadata (e.g., `Environment=Production`, `Application`, `Owner`).
   - Apply **naming convention**: `prod-<service>-<purpose>` (e.g., `prod-vpc-app`, `prod-sg-web`).
   - Structure the template for clarity and reuse (Parameters, Mappings, Conditions, Outputs).

---

## **Constraints**
- Implement **IAM roles** with **strict, least-privilege permissions**.
- **Encrypt all resources** at rest using **AWS KMS** or **native service encryption**.
- Deploy exclusively in **`us-west-2`**.
- Use **`prod-`** prefixes for all production-namespaced resources.
- Template must be a single YAML file named **`TapStack.yml`**.

---

## **Deliverable**
- A validated **CloudFormation YAML template**: **`TapStack.yml`** that:
  - Provisions **multiple VPCs**, **IAM roles**, and **security groups** with compliant ingress/egress rules.
  - Enforces **KMS-backed encryption at rest** across relevant services.
  - Conforms to **least-privilege** and **network security** best practices.
  - **Passes CloudFormation validation** (e.g., `aws cloudformation validate-template`) without errors.
  - **Performs a dummy deployment** (create-change-set/apply in a test account) without errors to confirm deployability.
  - Uses consistent **`prod-`** naming and **Production** tagging for all resources.