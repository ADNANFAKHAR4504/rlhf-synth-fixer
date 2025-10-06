# MODEL_FAILURES.md

## Overview

The `MODEL_RESPONSE.md` implemented a functional AWS CDK stack, but several key gaps and deviations were found when compared with the `IDEAL_RESPONSE.md`.  
The following summarizes all mismatches, missing configurations, and improvements applied during QA.

---

## 1. Missing Practical Integration

**Failure:**  
The model response provided standalone code but didn’t mention project structure integration or how it fits within the CDK app entry (`app.py` / `cdk.json`).

**Fix in Ideal Response:**  
Integrated `TapStack` within the existing project hierarchy (`lib/tap_stack.py`, `TapStackProps`, `environment_suffix` patterns) to make it deployable in real projects.

---

## 2. Environment Suffix Handling

**Failure:**  
Resource names used environment suffix inconsistently in some identifiers.  
Example: Some outputs and class identifiers lacked suffix concatenation.

**Fix in Ideal Response:**  
Uniform suffixing for every resource name, logical ID, and output:
```python
vpc = ec2.Vpc(self, f"VPC{environment_suffix}", ...)
CfnOutput(self, f"VPCId{environment_suffix}", ...)
