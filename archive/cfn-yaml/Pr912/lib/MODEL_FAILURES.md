1. Missing EnvironmentSuffix and resource naming
   - Issue: Resources were named without an environment suffix, risking name collisions across parallel deployments.
   - Fix: Added `Parameters.EnvironmentSuffix` and updated names for DynamoDB table, Lambda functions, IAM role, security group, and API Gateway to include `-${EnvironmentSuffix}`.

2. No conditional VPC configuration
   - Issue: Template required VPC inputs always and forced Lambda VPC configuration.
   - Fix: Introduced `Parameters.EnableVPC` and `Conditions.UseVPC`. Applied conditional `VpcConfig` to Lambdas and conditionally created the security group.

3. Hardcoded environment tag and weak tagging
   - Issue: DynamoDB `Environment` tag was hardcoded to `Production` and a `Name` tag was missing.
   - Fix: Set `Environment` tag to `!Ref EnvironmentSuffix` and added a `Name` tag for clarity and inventory.

4. Exports not aligned with reproducible stacks
   - Issue: Output export names were application-based and not stack-scoped.
   - Fix: Standardized outputs to export using `${AWS::StackName}-...` and added `EnvironmentSuffix` output for testability.

5. Missing deletion policies
   - Issue: DynamoDB table could be retained on replacement/deletion.
   - Fix: Added `DeletionPolicy: Delete` and `UpdateReplacePolicy: Delete` to ensure clean teardown.

6. Parameter defaults for non-VPC runs
   - Issue: VPC parameters lacked defaults, blocking non-VPC validations.
   - Fix: Added placeholder defaults for `VpcId` and `PrivateSubnetIds` enabling validation and tests without a VPC.

7. YAML to JSON conversion for tests
   - Issue: Unit tests rely on JSON but the template was YAML only.
   - Fix: Added conversion step and committed `lib/TapStack.json` for test consumption.
Insert here the model's failures