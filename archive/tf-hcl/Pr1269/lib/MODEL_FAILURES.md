# MODEL_FAILURES.md

This document enumerates every point where the LLM-generated Terraform (MODEL_RESPONSE.md) fails to meet the requirements described in PROMPT.md when compared with the authoritative implementation in main.tf.

## 1. Methodology
- PROMPT.md parsed for explicit and implicit requirements.
- main.tf treated as ground truth implementation.
- MODEL_RESPONSE.md examined for structural, semantic, syntactic, and compliance deviations.
- Issues categorized by type and assigned severity (Critical, Major, Minor, Informational).

## 2. Summary (Fill After Analysis)
- Total failures: <count>
- Critical: <count>
- Major: <count>
- Minor: <count>
- Informational: <count>
- High‑level risk: <short summary>

## 3. Requirements Extracted From PROMPT.md
List each requirement as atomic bullet points, numbered.
Example:
R1. Use provider X with version constraint Y.
R2. Create resource type A with mandatory attributes (list).
R3. Follow naming convention <convention>.
R4. Enforce tags: (key1, key2, ...).
R5. Implement variable validation for <var>.
R6. Output values for <items>.
R7. No hard‑coded secrets.
R8. Module structure (if specified).
(Continue until all requirements are captured.)

## 4. Ground Truth Overview (main.tf)
Provide a concise structural outline:
- Providers:
- Backend (if any):
- Variables:
- Locals:
- Resources (list each with key attributes):
- Data sources:
- Modules:
- Outputs:
- Policies / lifecycle / depends_on usage:
- Security / encryption settings:
- Naming / tagging patterns:

## 5. MODEL_RESPONSE.md Overview
Summarize what the model produced:
- Present resources:
- Missing resources:
- Extra / irrelevant resources:
- Variables declared vs. used:
- Outputs:
- Provider blocks:
- Structural deviations:
- Notable stylistic / formatting issues:

## 6. Detailed Failure Matrix

### 6.1 Missing Components
List each required element absent in MODEL_RESPONSE.md.
Format:
- [Severity] Requirement ID(s): Description of what is missing and where it should appear.

### 6.2 Incorrect / Incomplete Resource Definitions
For every resource present but wrong:
- Resource Identifier (type.name):
  - Requirement refs:
  - Expected (from main.tf): <attribute/value>
  - Actual (from model): <attribute/value or absent>
  - Issue: <explanation>
  - Severity:

### 6.3 Superfluous / Unauthorized Elements
List resources / blocks added by model not in main.tf or PROMPT.md.

### 6.4 Provider & Backend Issues
- Version constraints differences
- Missing required configuration
- Incorrect region/location
- Backend state misconfiguration (if applicable)

### 6.5 Variable Handling Failures
- Undeclared variables used
- Declared but unused variables
- Missing type constraints
- Missing validations
- Hard-coded literals replacing variables

### 6.6 Outputs Discrepancies
- Missing outputs
- Incorrect value expressions
- Sensitive flag misuse

### 6.7 Naming & Tagging Deviations
- Tag sets incomplete / inconsistent
- Naming convention violations
- Case / delimiter inconsistencies

### 6.8 Security & Compliance Gaps
- Public exposure (if applicable)
- Missing encryption settings
- Secrets in plain text
- Lack of least-privilege constructs

### 6.9 Idempotency / Dependency Issues
- Missing depends_on where required
- Ordering assumptions
- Non-deterministic expressions

### 6.10 Reusability & Modularity
- Failure to use modules (if required)
- Hard-coded values preventing reuse

### 6.11 Formatting / Style
- Indentation
- Argument ordering (if policy-driven)
- Unsorted blocks
- Comment clarity

### 6.12 Logical / Semantic Errors
- Attribute misuse
- Data source vs resource confusion
- Wrong interpolation syntax

### 6.13 Performance / Cost Considerations (If Relevant)
- Oversized instance types
- Unnecessary resources

## 7. Consolidated Issue Table (Optional)
| Severity | Category | Item | Requirement Ref(s) | Brief |
|----------|----------|------|--------------------|-------|
| Critical | ... | ... | R? | ... |

## 8. Root Cause Patterns
- Pattern 1: (e.g., Ignored variable abstraction)
- Pattern 2: (e.g., Omitted mandatory attributes)
- Pattern 3: (e.g., Misinterpretation of naming rules)
- Pattern 4: (e.g., No alignment with tagging policy)

## 9. Recommendations
Prioritized remediation steps:
1. Define missing providers / backend first.
2. Add absent critical resources <list>.
3. Align variable declarations with main.tf; remove hard-coded values.
4. Restore mandatory security attributes <list>.
5. Reconstruct outputs to expose required values.
6. Enforce consistent tagging and naming.
7. Add validations & sensitive flags.
8. Remove extraneous resources.

## 10. Validation Checklist (Populate After Fixes)
- terraform fmt passes
- terraform validate passes
- terraform plan shows zero drift vs. main.tf
- All requirements R1..Rn satisfied
- No plain-text secrets
- All outputs accounted for

## 11. Appendix
A. Snippets from main.tf (reference)
B. Snippets from MODEL_RESPONSE.md (reference)
C. Mapping table: Requirement -> Implementation line(s)

(Replace placeholders above with concrete findings after extracting file contents.)
