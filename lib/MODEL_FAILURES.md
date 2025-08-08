# MODEL_FAILURES.md

## Fault 1: Missing Component-Based Modularity (Lack of Reusable Abstractions)

- **Fault:** The `MODEL_RESPONSE.md` implements the infrastructure using flat functions (e.g., `create_vpc_infrastructure`, `create_rds_instance`, etc.) in a procedural style without reusable Pulumi `ComponentResource` abstractions.
- **Why It’s a Problem:**
  - This **violates modular design** principles critical to **production-grade infrastructure**.
  - Makes **reuse, testing, and separation of concerns** difficult.
  - Breaks Pulumi best practices for encapsulation and output registration.
- **Correction (as seen in IDEAL_RESPONSE.md):**
  - The ideal version uses **`ComputeComponent`**, `IAMComponent`, `DatabaseComponent`, and `ServerlessComponent`, each as a Pulumi `ComponentResource`, with `register_outputs()` to expose reusable properties.
  - This promotes composability, reusability across environments, and better code organization.

---

## Fault 2: Security Misconfiguration in RDS - Incompatible Parameter Group Family

- **Fault:** The `MODEL_RESPONSE.md` uses:
  ```python
  family="postgres14"
  ```
  for the parameter group, while the `engine_version` is hardcoded as:
  ```python
  engine_version="14.9"
  ```
  This would **fail** for any updates to `postgres17` (which is commonly the latest).
- **Why It’s a Problem:**
  - **Not future-proof** or consistent with newer PostgreSQL versions.
  - Causes **hard-to-debug failures** when updating the engine version without updating the parameter group family.
- **Correction (as seen in IDEAL_RESPONSE.md):**
  - Uses:
    ```python
    family="postgres17"
    engine_version="17.5"
    ```
    Ensuring parameter group compatibility with engine version.

---

## Fault 3: API Gateway and Lambda Integration Is Incomplete and Lacks Explicit Dependencies

- **Faults Identified:**
  - No **explicit use of `depends_on`** in API Gateway and Lambda integration.
  - No `aws.lambda_.Permission` resource is created to allow API Gateway to invoke Lambda.
  - No deployment (`aws.apigateway.Deployment`) or stage (`aws.apigateway.Stage`) is defined in `MODEL_RESPONSE.md`.
- **Why It’s a Problem:**
  - **API Gateway might silently fail** to invoke Lambda without `lambda:InvokeFunction` permission granted explicitly.
  - Without `Deployment` and `Stage`, the REST API is **not deployed**, meaning the `api_gateway_url` Pulumi output would be invalid or not callable.
  - **Race conditions** may occur without proper `depends_on`, especially with AWS API Gateway integrations.
- **Correction (as seen in IDEAL_RESPONSE.md):**
  - Explicit use of:
    - `aws.lambda_.Permission`
    - `aws.apigateway.Deployment`
    - `aws.apigateway.Stage`
    - Extensive `depends_on` chains to control the creation order and ensure safe integration between resources.

---

## ✅ Summary Table of Faults

| Fault # | Category              | Description                                                                                      | Correction in IDEAL_RESPONSE |
|--------|------------------------|--------------------------------------------------------------------------------------------------|------------------------------|
| 1      | Architecture           | Lacks modular `ComponentResource` wrappers                                                       | Uses modular components      |
| 2      | Compatibility & Security | Uses incorrect RDS parameter group (`postgres14`) for latest PostgreSQL engine (`17.x`)         | Uses `postgres17` group      |
| 3      | API Gateway Deployment | Missing `lambda:InvokeFunction` permission, `Deployment`, `Stage`, and proper `depends_on`       | Fully implemented            |
