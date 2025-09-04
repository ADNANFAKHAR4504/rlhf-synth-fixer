# MODEL_FAILURES.md

This document lists three expert-level faults found in MODEL_RESPONSE.md when compared to IDEAL_RESPONSE.md for a hard infrastructure-as-code problem:

---

**1. Lack of Modularity and Separation of Concerns**
MODEL_RESPONSE.md implements all resources in a single monolithic stack (`SecureScalableStack`). The ideal solution separates resources into dedicated stacks (e.g., `ComputeStack`, `DatabaseStack`, `KmsStack`, `MonitoringStack`, `NetworkStack`, `StorageStack`). This modular approach improves maintainability, testability, and reusability.

*Fault:* Lacks modular stack separation; all resources are bundled together, making the solution less maintainable and harder to extend.

---

**2. Poor Test Coverage and Organization**
MODEL_RESPONSE.md places all unit and integration tests in a single file, and does not organize them by resource or stack. The ideal solution provides dedicated unit and integration test files for each stack, organized in `unit-test/` and `integration-test/` folders, ensuring targeted and comprehensive coverage.

*Fault:* Test files are not organized by resource/stack, reducing clarity and making it difficult to isolate and debug failures for individual components.

---

**3. Missing Resource Dependency Validation and Error Handling**
MODEL_RESPONSE.md does not perform explicit runtime validation for required resource dependencies (e.g., missing props for cross-stack references). The ideal solution includes runtime checks and throws errors if required props (such as `vpc`, `dataKey`, `appBucket`, etc.) are missing, ensuring robust error detection and safer deployments.

*Fault:* Missing runtime validation for required props and cross-stack dependencies, which can lead to silent failures or misconfigured resources.

---
