# Model Response Failures Analysis

This document analyzes critical failures in the MODEL_RESPONSE that prevented successful deployment and required corrections in the IDEAL_RESPONSE.

## Summary

- Total failures: 2 Critical
- Primary knowledge gaps: AWS IAM managed policy naming, CodePipeline action provider types
- Training value: HIGH - These are deployment-blocking bugs that demonstrate critical AWS service API misunderstandings

## Critical Failures

### 1. Non-Existent IAM Managed Policy

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:
The model generated code that references a non-existent AWS managed IAM policy:

```typescript
const codeDeployRole = new aws.iam.Role(
  `codedeploy-role-${environmentSuffix}`,
  {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { Service: 'codedeploy.amazonaws.com' },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    managedPolicyArns: [
      'arn:aws:iam::aws:policy/AWSCodeDeployRoleForLambda',  // ❌ DOES NOT EXIST
    ],
    tags: tags,
  },
  { parent: this }
);
```

**Deployment Error**:
```
operation error IAM: AttachRolePolicy, https response error StatusCode: 404,
RequestID: 8494e179-16d4-4984-bcad-1be691016544,
NoSuchEntity: Policy arn:aws:iam::aws:policy/AWSCodeDeployRoleForLambda does not exist or is not attachable.
```

**IDEAL_RESPONSE Fix**:
```typescript
const codeDeployRole = new aws.iam.Role(
  `codedeploy-role-${environmentSuffix}`,
  {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { Service: 'codedeploy.amazonaws.com' },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    inlinePolicies: [  // ✅ Use inline policy with required permissions
      {
        name: 'CodeDeployLambdaPolicy',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'lambda:InvokeFunction',
                'lambda:GetFunction',
                'lambda:GetFunctionConfiguration',
                'lambda:GetAlias',
                'lambda:UpdateAlias',
                'lambda:PublishVersion',
              ],
              Resource: '*',
            },
          ],
        }),
      },
    ],
    tags: tags,
  },
  { parent: this }
);
```

**Root Cause**:
The model hallucinated an AWS managed policy name. The policy `AWSCodeDeployRoleForLambda` does not exist in AWS. The similar-sounding policy `AWSCodeDeployRoleForLambdaLimitedInternal` exists but is deprecated. For CodeDeploy with Lambda, AWS recommends creating a custom inline policy with the specific permissions needed.

**AWS Documentation Reference**:
- https://docs.aws.amazon.com/codedeploy/latest/userguide/getting-started-create-service-role.html
- AWS managed policies for CodeDeploy do not include Lambda-specific deployment permissions

**Cost/Security/Performance Impact**:
- **Deployment**: BLOCKED - Cannot create CodeDeploy role without valid policy
- **Security**: N/A (deployment failed before resource creation)
- **Cost**: Deployment attempts wasted ~3 minutes each (3 attempts = 9 minutes AWS API time)

---

### 2. Invalid CodePipeline Action Provider

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:
The model generated a CodePipeline Deploy stage with an invalid action provider:

```typescript
{
  name: 'Deploy-Blue',
  actions: [
    {
      name: 'DeployBlue',
      category: 'Deploy',
      owner: 'AWS',
      provider: 'CodeDeployToLambda',  // ❌ INVALID PROVIDER
      version: '1',
      inputArtifacts: ['build_output'],
      configuration: {
        ApplicationName: deployApp.name,
        DeploymentGroupName: deploymentGroup.deploymentGroupName,
      },
    },
  ],
},
```

**Deployment Error**:
```
operation error CodePipeline: CreatePipeline, https response error StatusCode: 400,
RequestID: 5efc9f88-10bc-4005-828e-7d565963c317,
InvalidActionDeclarationException: ActionType (Category: 'Deploy', Provider: 'CodeDeployToLambda', Owner: 'AWS', Version: '1')
in action 'DeployBlue' is not available in region 'US_EAST_1'
```

**IDEAL_RESPONSE Fix**:
```typescript
{
  name: 'Deploy-Blue',
  actions: [
    {
      name: 'DeployBlue',
      category: 'Deploy',
      owner: 'AWS',
      provider: 'CodeDeploy',  // ✅ Correct provider name
      version: '1',
      inputArtifacts: ['build_output'],
      configuration: {
        ApplicationName: deployApp.name,
        DeploymentGroupName: deploymentGroup.deploymentGroupName,
      },
    },
  ],
},
```

**Root Cause**:
The model used an incorrect provider name `CodeDeployToLambda` which does not exist. The correct provider name for CodeDeploy actions in CodePipeline is simply `CodeDeploy`, regardless of whether deploying to EC2, ECS, or Lambda. The deployment target is determined by the CodeDeploy Application's `computePlatform` property ('Lambda' in this case), not by the CodePipeline action provider name.

**AWS Documentation Reference**:
- https://docs.aws.amazon.com/codepipeline/latest/userguide/action-reference-CodeDeploy.html
- Valid action types for CodePipeline Deploy category: CodeDeploy, CloudFormation, ECS, S3, Elastic Beanstalk

**Cost/Security/Performance Impact**:
- **Deployment**: BLOCKED - Cannot create pipeline with invalid action type
- **Security**: N/A (deployment failed before resource creation)
- **Cost**: Wasted 14 resources created before pipeline failure, required cleanup
- **Performance**: Multiple deployment attempts (2 failures before fix)

---

## Summary of Corrections

| Failure | Type | Impact | Fix Complexity | Detection Phase |
|---------|------|--------|----------------|-----------------|
| IAM Policy Name | API Knowledge Gap | Deployment Blocker | Medium | Resource Creation |
| Pipeline Provider | API Knowledge Gap | Deployment Blocker | Low | Resource Creation |

## Training Value Justification

**Score: HIGH**

These failures demonstrate critical gaps in the model's knowledge of AWS service APIs:

1. **IAM Policy Naming**: The model fabricated a plausible-sounding but non-existent managed policy name. This suggests the model may be pattern-matching on naming conventions rather than having accurate knowledge of available AWS managed policies.

2. **CodePipeline Action Types**: The model incorrectly assumed provider names follow a pattern like `{Service}To{Target}` (e.g., `CodeDeployToLambda`). This shows a misunderstanding of how CodePipeline action providers are named and how deployment targets are specified.

3. **Impact Severity**: Both errors were deployment blockers that would prevent any user from successfully deploying this infrastructure. They required AWS API knowledge to diagnose and fix.

4. **Discoverability**: These errors are not obvious from code review alone - they require actual deployment attempts to AWS to discover.

Including this example in training data will help the model:
- Learn actual AWS managed policy names vs. hallucinated names
- Understand CodePipeline action provider naming conventions
- Recognize when to use inline policies vs. managed policies
- Improve accuracy of AWS service API knowledge
