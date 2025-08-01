Absolutely! Here's a **comprehensive, high-level user prompt** for the `lib/MODEL_RESPONSE.md` file, which is typically used to document how a system or infrastructure model is expected to respond under certain conditions — including edge cases, automation behavior, compliance logic, and design assumptions.

---

## ✅ **Comprehensive Prompt for `lib/MODEL_RESPONSE.md`**

> Create or update the file `lib/MODEL_RESPONSE.md` to serve as a reference for **documenting expected behaviors and responses of the infrastructure model** under various input conditions, system states, and operational scenarios.
>
> This document is meant to help engineers understand how the system is designed to respond to failures, configurations, deployment parameters, and runtime events. It is particularly useful for onboarding, quality assurance, compliance audits, and debugging.

---

### 📌 **Requirements**

1. **Purpose and Overview**

   * Begin the document with a short **summary** of its purpose — i.e., to define the expected responses of the IaC model in various real-world and testable conditions.
   * Mention that it complements `MODEL_FAILURES.md`, which describes failure cases, by focusing on how the system *should behave*.

2. **Structure**
   For each scenario or condition, clearly define:

   * **Scenario ID** (e.g., `MR001`)
   * **Input Condition** (what triggers the response)
   * **Expected Response** (the exact system behavior or configuration result)
   * **Reasoning/Justification** (why the model behaves this way)
   * **Affected Resources/Components**
   * **Status** (e.g., Confirmed, Planned, In Development)
   * Optional: **Test Coverage** (linked test case, unit/integration validation)

3. **Example Scenarios to Document**

   * Creation of a VPC with subnets distributed across AZs
   * Auto-assignment of public IPs in public subnets
   * SSH traffic blocked unless CIDR matches security group
   * Routing through NAT Gateway for private subnets
   * Behavior when AZs are selected dynamically using `Fn::GetAZs`
   * Reactions to CloudFormation `DeletionPolicy` or `DependsOn` conditions
   * Responses to different `Parameter` values (e.g., `Environment: dev vs prod`)

4. **Style Guidelines**

   * Use **Markdown syntax**
   * Prefer tables or structured lists for consistency
   * Keep language **precise and implementation-neutral**
   * Use consistent IDs (`MR###`) to allow for referencing in issues and tests

5. **Bonus (Optional Enhancements)**

   * Link specific CloudFormation resources or template lines
   * Cross-reference related entries in `MODEL_FAILURES.md`
   * Include diagrams if useful for illustrating architectural responses
   * Add changelog or version notes if model behavior evolves

---

### 📂 **Output:**

* A structured, developer-readable `lib/MODEL_RESPONSE.md` file in Markdown format
* Complete with meaningful, realistic scenarios that describe how your infrastructure responds to inputs and events
* Ready for CI teams, reviewers, or new engineers to use as a model behavior reference

---

Would you like a starter template or sample entries for `MODEL_RESPONSE.md` to go with this prompt?
