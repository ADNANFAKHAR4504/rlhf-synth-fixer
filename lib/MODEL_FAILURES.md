# Model Failures - Cross-Region Migration Task

## Task ID: h1u2r4i8
## Platform: CDKTF Python
## Complexity: Expert

## Previous Failure Summary

The model was previously marked as ERROR due to 10 critical CDKTF API errors in the generated code.

## Root Cause Analysis

**Primary Issue**: Model confused AWS CDK (class-based) API patterns with CDKTF (dictionary-based) API patterns.

### Critical Errors Identified

1. **Security Group Rules** (9 usages)
   - WRONG: Used class-based `SecurityGroupIngress()` and `SecurityGroupEgress()`
   - Correct: Use dictionary objects with keys like `from_port`, `to_port`, `protocol`, `cidr_blocks`

2. **Route Table Routes** (4 usages)
   - WRONG: Created separate `aws_route` resources
   - Correct: Use inline `route` parameter as list of dictionaries in `RouteTable` resource

3. **Launch Template IAM Profile** (1 usage)
   - WRONG: Used class `IamInstanceProfile()` object
   - Correct: Use dictionary with `{"name": profile_name}`

4. **Auto Scaling Group Tags** (1 usage)
   - WRONG: Used class `Tag()` objects
   - Correct: Use list of dictionaries with `key`, `value`, `propagate_at_launch`

5. **Load Balancer Target Group Health Checks** (1 usage)
   - WRONG: Used class `HealthCheck()` object
   - Correct: Use dictionary with health check parameters

6. **Load Balancer Listener Actions** (1 usage)
   - WRONG: Used class `Action()` objects
   - Correct: Use list of dictionaries with `type`, `target_group_arn`

7. **Route 53 Weighted Routing and Alias** (4 usages)
   - WRONG: Used classes `WeightedRoutingPolicy()` and `Alias()`
   - Correct: Use dictionaries `weighted_routing_policy={}` and `alias={}`

8. **CloudWatch Alarm Dimensions** (3 usages)
   - WRONG: Used class `Dimensions()` object
   - Correct: Use dictionary with dimension key-value pairs

9. **VPC Peering Accepter Class Name** (1 usage)
   - WRONG: Used `VpcPeeringConnectionAccepter` (without 'A')
   - Correct: Use `VpcPeeringConnectionAccepterA` (with 'A' suffix)

10. **Missing Test Infrastructure**
    - No comprehensive unit tests
    - No integration tests
    - No test coverage reporting

## Why These Errors Occurred

### Knowledge Gap
- **AWS CDK vs CDKTF Confusion**: Model has extensive training on AWS CDK (TypeScript/Python) which uses class-based constructs
- **CDKTF Documentation**: Less common in training data compared to CDK
- **API Pattern Mixing**: Model defaulted to familiar CDK patterns when generating CDKTF code

### Pattern Recognition Failure
- Model recognized the need for resources like SecurityGroups, LaunchTemplates, etc.
- However, model applied wrong API syntax (class instantiation vs dictionary configuration)
- Failed to distinguish between:
  - CDK: `ec2.SecurityGroupIngress(protocol="tcp", ...)`
  - CDKTF: `ingress=[{"protocol": "tcp", ...}]`

## Impact on Training

### What Model Learned (Incorrectly)
1. Believed CDKTF uses same class-based API as AWS CDK
2. Thought separate resources (like `aws_route`) were correct for CDKTF
3. Assumed Python typing/classes were appropriate for configuration

### What Model Should Learn

1. **CDKTF uses HCL-like dictionary patterns**:
   ```python
   # CORRECT CDKTF Pattern
   SecurityGroup(
       self,
       "sg",
       ingress=[{
           "from_port": 443,
           "to_port": 443,
           "protocol": "tcp",
           "cidr_blocks": ["0.0.0.0/0"]
       }]
   )
   ```

2. **Inline configuration over separate resources**:
   ```python
   # CORRECT: Inline routes
   RouteTable(
       self,
       "rt",
       route=[{
           "cidr_block": "0.0.0.0/0",
           "gateway_id": igw.id
       }]
   )
   ```

3. **Dictionary-based nested objects**:
   ```python
   # CORRECT: Dictionary for nested config
   LaunchTemplate(
       self,
       "lt",
       iam_instance_profile={
           "name": profile.name
       }
   )
   ```

## Prevention Strategies

### For Future Prompts
1. **Explicit API Pattern Specification**: Always state "Use CDKTF dictionary-based patterns, NOT CDK class-based"
2. **Provide Examples**: Include code snippets showing correct CDKTF syntax
3. **Platform Disambiguation**: Clarify "CDKTF (Terraform CDK)" vs "AWS CDK"
4. **Common Gotchas Section**: List frequent errors and corrections

### For Model Training
1. **Negative Examples**: Include wrong patterns with corrections
2. **Comparison Tables**: Show CDK vs CDKTF side-by-side
3. **Test-Driven Examples**: Show how to test CDKTF synthesized JSON
4. **Version Awareness**: Specify CDKTF CLI vs library version compatibility

## Success Criteria

Task is considered successfully fixed when:
1. All 10 API pattern errors corrected
2. Code uses 100% dictionary-based configuration
3. No class-based constructs for resource configuration
4. Inline routes/rules instead of separate resources
5. VPC Peering Accepter uses correct class name
6. Comprehensive test suite with 100% coverage
7. All tests passing (unit + integration)
8. Successful deployment with real AWS resources
9. Training quality score >= 8

## Lessons Learned

### Critical Insight
**Platform documentation matters more than language familiarity**. Even though Python was used, CDKTF Python API != AWS CDK Python API. Model must prioritize platform-specific patterns over language conventions.

### Key Takeaway
When working with Infrastructure-as-Code tools that wrap other tools (CDKTF wraps Terraform), **always follow the wrapper's API patterns**, not the underlying tool's native language or similar-looking frameworks.# Trigger retry
