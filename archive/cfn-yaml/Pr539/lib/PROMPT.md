Here is a **comprehensive high-level user prompt** that clearly conveys the expectations and technical constraints for the above problem:

---

### High-Level Prompt for CloudFormation-Based DynamoDB Multi-Region Deployment

---

You are tasked with designing **CloudFormation infrastructure-as-code templates** to deploy **Amazon DynamoDB tables in two AWS regions**, with the following strict requirements and validations in mind.

---

#### Objective:

Create **CloudFormation YAML templates** that can be used to deploy an **Amazon DynamoDB table in each of the specified regions**, such as `us-west-1` and `us-west-2`. These templates should be reusable, parameterized, and must incorporate **best practices for cross-region and intra-stack resource referencing**, especially using **CloudFormation intrinsic functions**.

---

#### Key Requirements:

1. **Multi-Region Deployment**:

   * You must define two separate CloudFormation stacks (or templates), one per region (`us-west-1` and `us-west-2`).
   * Each template should create **one DynamoDB table** in its respective region.

2. **Region-Specific Capacity Settings**:

   * Each stack must configure the DynamoDB table’s **read and write capacity** values differently.
   * For `us-west-1`: Hardcode `ReadCapacityUnits: 5` and `WriteCapacityUnits: 5`.
   * For `us-west-2`: Make `ReadCapacityUnits` and `WriteCapacityUnits` configurable using **CloudFormation Parameters**.

3. **Use of CloudFormation Intrinsic Functions**:

   * Apply intrinsic functions like `Fn::GetAtt`, `Fn::ImportValue`, `Ref`, `Fn::Sub`, and `Fn::Join` where appropriate.
   * If using a **shared resource or exporting any output for inter-stack use**, use `Export` and `Fn::ImportValue` for referencing across stacks.
   * Maintain **logical dependencies and referential integrity** using these functions.

4. **Template Validation & Execution**:

   * The CloudFormation YAML templates must be syntactically and semantically valid.
   * When deployed using AWS CloudFormation, the stacks should:

     * Launch successfully without any errors.
     * Create DynamoDB tables in the specified regions.
     * Properly reflect the read/write capacity configurations per region.
   * Consider necessary IAM permissions (e.g., for stack creation, DynamoDB provisioning).

5. **Reusability and Modularity**:

   * Structure your templates to promote **modularity**, allowing future extension or reusability across environments.
   * Document parameters, resource definitions, and outputs clearly.

---

#### Expected Deliverables:

* One YAML CloudFormation template for `us-west-1` (with fixed capacity).
* One YAML CloudFormation template for `us-west-2` (with parameterized capacity).
* Use of `Outputs` section in both templates (e.g., exporting table names or ARNs).
* Demonstration of at least one usage of `Fn::GetAtt`, `Fn::ImportValue`, or `Ref` in a meaningful way.
* All templates must pass **CloudFormation Linter (`cfn-lint`) validation**.
* README-style comments or explanations in-line, where appropriate.

---

#### Important Notes:

* **No need to implement replication or global tables**, unless explicitly stated.
* Avoid use of deprecated resource types or syntax.
* If you export any value in one stack, demonstrate how it would be consumed in the other using `Fn::ImportValue`.

---

#### Optional (Advanced):

* Add `Tags` to the DynamoDB tables using `Fn::Sub` for dynamic values.
* Include a basic `Outputs` block to expose useful resource attributes like the table ARN.

---

Let me know if you want the full YAML templates generated for this or a README.md to accompany the templates.

---
