# Model Response Failures Compared to Ideal Response

## 1. Availability Zones Handling
- **Ideal:** Dynamically fetches AZs using `DataAwsAvailabilityZones` and validates that at least two are available.  
- **Model:** Relies on hardcoded or sliced AZs.  
- **Failure Impact:** Code becomes region-specific. If fewer AZs exist, the stack fails silently or misconfigures networking.

## 2. Validation and Safety
- **Ideal:** Explicit error handling ensures VPC requires two AZs before continuing.  
- **Model:** Skips validation, assumes AZs exist.  
- **Failure Impact:** Risk of incomplete networking setups with no clear failure signal.

## 3. Outputs Management
- **Ideal:** All outputs are centralized in `tap-stack.ts` with `TerraformOutput` for consistency.  
- **Model:** Outputs are scattered between modules and stack.  
- **Failure Impact:** Breaks separation of concerns, harder to maintain and consume outputs across environments.

## 4. Resource Tagging
- **Ideal:** Applies consistent tagging (`Environment: Production`) across all resources.  
- **Model:** Only some resources tagged explicitly, others left untagged.  
- **Failure Impact:** Leads to inconsistent tagging, complicating compliance, billing, and auditing.

## 5. Networking Robustness
- **Ideal:** Includes explicit routing associations and dependency ordering for IGW/NAT.  
- **Model:** Routing present but without explicit dependency handling.  
- **Failure Impact:** Possible race conditions or misconfigured routing during deployment.

## 6. Module Reusability
- **Ideal:** Parameterized modules with clear input/output contracts for reusability.  
- **Model:** Uses more hardcoded values and fewer parameters.  
- **Failure Impact:** Code is tightly coupled to one environment, not reusable in staging/prod.

## 7. Type Safety
- **Ideal:** Consistently uses strong typing (`TerraformOutput`, interfaces).  
- **Model:** Partly relies on type inference, weaker typing.  
- **Failure Impact:** Less compile-time validation, more runtime risks.

## 8. Prompt Compliance
- **Ideal:** Fully satisfies the task: dynamic AZs, centralized outputs, production tagging, networking best practices.  
- **Model:** Misses key requirements (dynamic AZs, outputs centralization, full tagging).  
- **Failure Impact:** Does not meet strict specifications, reducing trustworthiness of IaC.
