# Model Failures for MODEL_RESPONSE.md

1. **Lack of Modular, Per-Resource Test Files**
   - The model groups tests by construct type (e.g., `networking.test.ts`, `security.test.ts`) and places them in a `test/unit/` directory, with only a single integration test. The ideal solution provides one test file per construct and per test type (e.g., `vpc.unit.test.ts`, `alb.int.test.ts`), all at the top level of the `test/` directory, ensuring better maintainability and full coverage.

2. **Missing or Incomplete Edge Case/Error Handling in Tests**
   - The model's tests do not cover error or edge cases, such as missing required properties or expected exceptions (e.g., missing certificate ARN for ALB). The ideal solution includes explicit tests for these scenarios, which are critical for robust infrastructure code.

3. **Resource Implementation and Test Coverage Gaps**
   - The model omits best practices and details present in the ideal solution, such as:
     - No tagging of resources for stage, region, or problem ID.
     - No propagation of tags across all resources.
     - The ALB's HTTPS listener is configured as HTTP and does not use ACM certificates or enforce SSL, which is a security and compliance gap.
     - VPC and subnet configuration is less explicit and may not match requirements for public/private subnets as in the ideal.
   - The ideal solution ensures all resources are tagged, listeners are properly configured (with ACM certificates for HTTPS), and all resource properties and security controls are explicit and correct.
