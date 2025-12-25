# MODEL_FAILURES.md

---

## [PASS] Comparison Summary

| Aspect                        | Ideal Response ([PASS])                                                                                         | Model Response ([FAIL])                                                                                          | Comments                                                                                               |
|------------------------------|-------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Parameter Handling           | Uses `Type: String` with `Default: ""` and supports optional keypair behavior                              | Uses `Type: AWS::EC2::KeyPair::KeyName` without default                                                       | Makes `KeyPairName` required, which causes deploy failure unless explicitly passed                     |
| Condition Usage              | Defines `HasKeyPair` condition and uses `Fn::If` to include `KeyName` only if provided                     | No condition logic, assumes `KeyName` always present                                                         | CI/CD deployment breaks if `KeyPairName` is missing or unset                                          |
| IAM & Flexibility            | Uses `AWS::NoValue` to optionally omit EC2 `KeyName`                                                       | Hardcoded `KeyName`, no conditional guard                                                                    | Makes the template less adaptable                                                                      |
| Resource Tagging             | Includes consistent `Tags`, including `Environment: Production` in all key resources                       | Tags are inconsistent; missing or partial                                                                    | Fails organizational tagging standards expected by CI pipeline                                        |
| GroupName Usage              | Avoids hardcoding `GroupName`, relies on `!Sub` with `${AWS::StackName}` pattern for all naming           | Uses static `GroupName`, which risks conflict in multi-stack deployments                                     | Not aligned with CI/CD dynamic stack handling strategies                                               |
| Template Portability         | Parameterized template for region-agnostic usage with minimal required params                              | Fixed values for `KeyPair` and subnet usage                                                                  | Limits reuse across regions or projects                                                                |
| CI/CD Compatibility          | Fully deployable in GitHub Actions with optional params and dynamic naming                                 | Deployment breaks on missing parameter; lacks conditional behavior                                           | Major issue for automated workflows                                                                    |
| Environment Awareness        | Resource names and tags include `${AWS::StackName}` or dynamic references                                 | Uses generic or static names                                                                                  | Doesn't support naming standards enforced by pipeline                                                  |
| Default Security Group Usage | Uses separate SG with port constraints clearly defined                                                     | Uses EC2 security group but includes hard-to-manage `GroupName`                                              | Redundant SG config hinders CI tagging and automated testing                                           |
| Output Structure             | Outputs use consistent export names and follow `${AWS::StackName}-logicalName-ID` format                 | Mostly aligned, though some naming lacks consistent formatting                                               | Minor improvements needed                                                                              |
| Template Size & Style        | Clean, readable, logically grouped, and under best practice line limits (~500 lines)                       | Bloated with redundant tag blocks                                                                            | Your version is cleaner and easier to maintain                                                         |

---

## ## Model Failure Diagnosis Prompt

Use the following checklist and corrections to fix issues found in the model's output and align with CI/CD pipeline expectations:

### ## Corrections for Model Output

1. ! Change `KeyPairName` parameter:
   - Type: `String`
   - Default: `""`
   - Description: "Name of an existing EC2 KeyPair (leave empty to disable SSH)"
   - ConstraintDescription: "Must be a valid EC2 KeyPair name or an empty string"

2. [PASS] Add a Conditions block:
    Conditions:
        HasKeyPair: !Not [!Equals !Ref KeyPairName, “”]


3. [PASS] Use conditional logic in the EC2 `KeyName` property:
    KeyName: !If HasKeyPair, !Ref KeyPairName, !Ref “AWS::NoValue”


4. [BLOCK] Remove hardcoded `GroupName`, and apply dynamic naming like:
    Tags:- 
        Key: 
        NameValue: !Sub ‘${AWS::StackName}-WebServerSecurityGroup’

5. [TAG] Ensure consistent resource tagging:
- Apply to all core resources:
  ```
  - Key: Environment
    Value: Production
  ```

6. [PACKAGE] Use proper output export names for CI/CD:
    Outputs:
        VPCId:
        Value: !Ref VPC
        Export:
        Name: !Sub ‘${AWS::StackName}-VPC-ID’

7. [TEST] Confirm the template passes all validation:
- `cfn-lint`
- `npm run build`
- `npm run test:unit`

8. [TARGET] Final Goals:
- CI/CD-safe with no required user input
- All IDs and resources dual-tagged with `Name` & `Environment`
- Flexible for dynamic environments and reusable across regions
