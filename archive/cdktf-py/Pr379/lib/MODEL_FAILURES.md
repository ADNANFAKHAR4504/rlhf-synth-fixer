### Common Model Failures for this Prompt

#### 1. ❌ Nested Stack Usage
- Some versions may attempt to wrap subnet or VPC logic into a sub-stack or module, violating the prompt constraint ("no nested stack").

#### 2. ❌ Missing Internet Gateway
- A common oversight is defining subnets and VPC but not attaching an Internet Gateway or public route table.

#### 3. ❌ Route Table Misconfiguration
- Creating a route table but failing to define the `0.0.0.0/0` route to IGW.
- Or associating private subnets instead of only public ones.

#### 4. ❌ Hardcoded Region
- Some models might default region to `us-east-1` instead of pulling from `kwargs` or app context.

#### 5. ❌ Test Mismatches
- Tests might refer to attributes that aren't exposed in the `TapStack` (e.g., referencing `stack.vpc` when not defined as a class field).

#### 6. ❌ Improper Formatting
- Using 4-space indentation or CRLF endings when prompt clearly asks for 2-space and LF.

---

### Summary of Negative Results
- ❌ VPC created but no subnets or IGW.
- ❌ Subnets created but CIDRs incorrect or not variable-driven.
- ❌ Route table exists but no route or association.
- ❌ Unit test fails due to mismatched subnet attributes.
