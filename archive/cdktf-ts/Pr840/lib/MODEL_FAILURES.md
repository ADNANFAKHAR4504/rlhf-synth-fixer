# Model Response Failures Compared to Ideal Response

## 1. Missing Dynamic Availability Zone Handling
- **Ideal:** Uses `dataAwsAvailabilityZones` to dynamically pull AZ names for the target region.
- **Model:** Hardcodes or slices a static array, making it region-dependent.
- **Impact:** Breaks portability; may fail in regions with fewer or more AZs.

---

## 2. Lack of Strict Validation
- **Ideal:** Throws an error if fewer than two AZs are returned (production safeguard).
- **Model:** Omits validation or assumes AZ count.
- **Impact:** Can result in incomplete or broken VPC deployments in low-AZ environments.

---

## 3. Outputs Not Centralized
- **Ideal:** All outputs are defined in `tap-stack.ts` only, keeping module boundaries clean.
- **Model:** Defines outputs in both module and stack.
- **Impact:** Violates separation of concerns, harder to maintain in large-scale deployments.

---

## 4. Resource Tagging Scope
- **Ideal:** Ensures all AWS resources inherit `Environment: Production` tags at the module level.
- **Model:** Tags only some explicitly created resources.
- **Impact:** Inconsistent tagging can cause cost tracking and compliance issues.

---

## 5. Networking Pattern Robustness
- **Ideal:** Public/private subnets have strict route associations and dependencies for resilience.
- **Model:** Functional but may lack explicit dependency ordering or associations.
- **Impact:** Higher risk of misconfigured routing in multi-stack environments.

---

## 6. Module Reusability
- **Ideal:** Highly parameterized modules with clear input/output contracts for reuse.
- **Model:** Less parameterized, built more for single-use cases.
- **Impact:** More duplication when scaling to multiple environments.

---

## 7. Type Safety in CDKTF
- **Ideal:** Uses explicit `TerraformOutput` typing and strong interfaces for all variables.
- **Model:** Relies on type inference for some variables.
- **Impact:** Increases risk of passing incorrect values at compile time.

---

## 8. Compliance With Prompt Requirements
- **Required:** Dynamic AZ handling, centralized outputs, full tagging, production-grade networking.
- **Model:** Missed at least the first three requirements.
- **Impact:** Not fully compliant with original specifications.
