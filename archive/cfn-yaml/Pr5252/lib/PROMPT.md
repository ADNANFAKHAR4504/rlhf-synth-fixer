### Functional scope (build everything new):

Create a **CloudFormation YAML template (`TapStack.yml`)** that provisions a *completely new* multi-tier VPC architecture from scratch in `us-east-1`, following AWS best practices for security, scalability, and modularity. The stack must not reference or depend on any pre-existing resources.

The configuration should include:

1. A **VPC** with CIDR `10.0.0.0/16` distributed across **three Availability Zones**.
2. **Public subnets** for load balancers and NAT gateways:

   * `10.0.1.0/24`, `10.0.2.0/24`, and `10.0.3.0/24`.
3. **Private subnets** for application workloads:

   * `10.0.11.0/24`, `10.0.12.0/24`, and `10.0.13.0/24`.
4. **Database subnets** with no Internet access:

   * `10.0.21.0/24`, `10.0.22.0/24`, and `10.0.23.0/24`.
5. **Internet Gateway** and **three NAT Gateways** (one per AZ) for fault-tolerant outbound Internet access.
6. **Custom Route Tables** explicitly associated with each subnet tier (public, private, and database).
7. **VPC Endpoints** for **S3** and **DynamoDB** to reduce external data transfer.
8. **VPC Flow Logs** configured to publish all accepted and rejected traffic to **CloudWatch Logs** with 1-minute aggregation.
9. **Network ACLs** enforcing tier-level isolation with:

   * Explicit **deny rule** for SSH (`port 22`) traffic from public subnets to database subnets.
10. **Consistent tagging** across all resources with the keys: `Environment`, `Team`, and `CostCenter`.
11. **Proper dependencies (`DependsOn`)** so the stack is deletable without manual cleanup.
12. All resources and logical names must include an **`ENVIRONMENT_SUFFIX`** parameter to ensure isolation between environments.

---

### Implementation requirements:

* The `TapStack.yml` file must include:

  * All **Parameters** (including CIDR ranges, environment suffix, tag values, and region).
  * **Mappings** and **Conditions** if required for AZ logic.
  * Complete **Resources** definitions (VPC, Subnets, IGW, NATs, Routes, Endpoints, NACLs, Flow Logs, etc.).
  * **Outputs** for all Subnet IDs, Route Table IDs, NAT Gateway IDs, and VPC Endpoint IDs.
* Use **explicit logical names**, **clear indentation**, and **YAML anchors** where applicable for reusability.
* All resources must be **self-contained**, **deployable**, and compliant with best practices (no default associations, no public access to database tiers, no 0.0.0.0/0 for DB subnets).
* Ensure **Flow Logs** are enabled for **ALL traffic types**.
* Subnets should map automatically to AZs using `Fn::GetAZs` and `Fn::Select`.
* Follow AWS deletion ordering best practices using `DependsOn` attributes for NATs, EIPs, and IGW.

---

### Deliverable:

A single CloudFormation file named **`TapStack.yml`** that:

* Creates the full VPC network stack from scratch.
* Contains all parameter declarations, logic, and outputs within one file (no external references).
* Implements every networking layer: VPC, Subnets, Routing, Gateways, Endpoints, NACLs, and Flow Logs.
* Is production-ready, compliant with AWS standards, and follows least-privilege and fault-tolerance principles.
* Uses structured, commented YAML following this logical order:

  1. Metadata
  2. Parameters
  3. Mappings / Conditions
  4. Resources (VPC → Subnets → Route Tables → NATs → Endpoints → NACLs → Flow Logs)
  5. Outputs
