### **Functional scope - build everything new:**

Design and implement a complete **hub-and-spoke multi-account network foundation** in AWS using **CloudFormation**. The template TapStack.yml must provision all required resources from scratch - no existing infrastructure references are permitted. The architecture must include:

1. **Hub VPC with 10.0.0.0/16 CIDR** deployed across 3 Availability Zones using dynamic AZ mapping.

   * Each AZ contains public, private, and NAT subnets with /24 masks.
   * NAT Gateways are deployed **only in the hub VPC** for centralized egress.
   * Internet Gateway, route tables, and necessary routes for outbound access are included.

2. **Three spoke VPCs with CIDRs 10.1.0.0/16, 10.2.0.0/16, 10.3.0.0/16** and /24 subnets in each AZ.

   * No direct internet access.
   * Each spoke connects to the hub through a **Transit Gateway attachment**.

3. **AWS Transit Gateway** as single regional deployment:

   * DNS support enabled, multicast disabled.
   * Separate **route tables** configured to enforce isolation:

     * Hub route table allows connectivity to all spokes.
     * Spoke route tables allow only communication with the hub, preventing spoke-to-spoke access.

4. **VPC Flow Logs** for all VPCs:

   * Destination: CloudWatch Logs group.
   * Retention: 7 days.

5. **Systems Manager VPC Endpoints** in each VPC for secure management.

6. **Route53 Private Hosted Zones** for internal DNS resolution, associated appropriately to enable service discovery.

7. **Tagging requirements**:
   Every resource must include the following lowercase, hyphenated tags:

   * `environment` = value of `EnvironmentName` parameter
   * `cost-center` = value of `CostCenter` parameter
   * `owner` = value of `Owner` parameter

---

### **Technical constraints and logic:**

* All subnets use `/24` CIDR blocks.
* Use **YAML anchors** and references to minimize duplication for subnet definitions, tags, and route tables.
* Implement **CloudFormation Conditions** for dynamic AZ selection.
* Follow AWS best practices for VPC design, naming, IAM least privilege, and resource dependencies.
* The template must use only AWS::EC2::TransitGateway without AWS::RAM::ResourceShare.
* Define parameters, mappings, and outputs comprehensively with default values and allowed patterns.
* Include environment suffix ENVIRONMENT_SUFFIX in all resource logical IDs and names to ensure multi-environment deployment compatibility.

---

### **Deliverable:**

A single, self-contained TapStack.yml file containing:

* Parameter declarations for EnvironmentName, CostCenter, Owner, EnvironmentSuffix, and similar
* All resource definitions for VPCs, Subnets, NATs, Transit Gateway, Route Tables, Flow Logs, Endpoints, Hosted Zones
* Conditions and mappings for AZ logic
* Outputs for VPC IDs, Subnet IDs, Transit Gateway ID, and Route53 zones
* Complete tagging, retention, and routing logic aligned with AWS compliance and maintainability best practices.
