Syntax Issues
1.1 Incorrect Fn::Sub Usage
Issue: !Sub used where no interpolation needed (lines 285, 291).
Fix: Use direct literal for ImageId '{{resolve:ssm:...}}' and plain literal block for UserData.

1.2 Invalid Parameter Type
Issue: KeyPairName parameter type AWS::EC2::KeyPair::KeyName forces existing key.
Fix: Change to String with empty default for optional usage.

Deployment-Time Issues
2.1 Required Parameter Without Default
Issue: KeyPairName lacked default causing deployment failure.
Fix: Add empty string default and conditional !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue'].

2.2 Missing Condition for Optional Parameter
Issue: No condition wrapping optional KeyPairName.
Fix: Add condition HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']].

2.3 Hardcoded Resource Names
Issue: Static names (ALB, ASG) block multi-environment reuse.
Fix: Parameterize with !Sub '${AWS::StackName}-${EnvironmentSuffix}'.

Configuration Issues
3.1 Missing Metadata Section
Issue: No AWS::CloudFormation::Interface metadata for parameter UX.
Fix: Add Metadata → AWS::CloudFormation::Interface with ParameterGroups & ParameterLabels.

3.2 Hardcoded Environment Tags
Issue: Tags fixed to "Development".
Fix: Use !Ref EnvironmentSuffix.

3.3 No Environment Parameterization
Issue: Lacks EnvironmentSuffix parameter.
Fix: Add EnvironmentSuffix (AllowedValues: dev, staging, prod).

Best Practice Violations
4.1 Non-Deterministic Resource Naming
Issue: Some resources unnamed → harder tracking & exports.
Fix: Explicit names using stack + environment.

4.2 Limited CI/CD Compatibility
Issue: Hardcoded values reduce pipeline flexibility.
Fix: Parameterize instance types, environment, optional features.

4.3 Missing Export Name Patterns
Issue: Inconsistent export naming.
Fix: Use !Sub '${AWS::StackName}-${EnvironmentSuffix}-ResourceName'.
