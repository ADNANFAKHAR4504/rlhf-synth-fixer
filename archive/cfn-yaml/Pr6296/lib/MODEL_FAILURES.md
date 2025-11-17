# TapStack Model Failure Report

**Scope:** Potential deployment or runtime failures introduced by the raw model output.  
**Sources Compared:** `lib/MODEL_RESPONSE.md` vs `lib/IDEAL_RESPONSE.md`.  
**Validated Template:** `lib/TapStack.yml` (matches the ideal response).  
**Review Date:** 2025-11-11

---

## 📋  Failure Matrix

| #   | Issue                                                                                | Severity | Category      | Reference    | Status in `TapStack.yml`                               |
| --- | ------------------------------------------------------------------------------------ | -------- | ------------- | ------------ | ------------------------------------------------------ |
| 1   | CodeBuild `LogsConfig.CloudWatchLogs` uses unsupported `RetentionInDays`             | CRITICAL | Logging       | CFN-51 (new) | Remediated (property removed)                          |
| 2   | CodeDeploy blue/green group assumes unmanaged ECS service                            | CRITICAL | CodeDeploy    | CFN-44       | Remediated (Pipeline sticks with ECS deploy action)    |
| 3   | Deploy stage expects `taskdef.json` / `appspec.yml` artifacts that builds never emit | HIGH     | Pipeline      | MF-03        | Remediated (`imagedefinitions.json` hand-off retained) |
| 4   | EventBridge Slack target injects literal `#{SlackWebhookUrl}`                        | MEDIUM   | Observability | MF-04        | Remediated (`!Sub` with `${SlackWebhookUrl}`)          |
| 5   | CodeBuild service role attaches `AmazonECR-FullAccess`                               | MEDIUM   | Security      | MF-05        | Remediated (scoped inline permissions only)            |

---

### MF-01: Invalid CodeBuild `RetentionInDays`

**Model observation:** The model attempts to set `RetentionInDays` inside the CodeBuild `LogsConfig.CloudWatchLogs` block.

```401:408:lib/MODEL_RESPONSE.md
      LogsConfig:
        CloudWatchLogs:
          GroupName: !Sub '/aws/codebuild/payment-service-build-${EnvironmentName}'
          Status: ENABLED
          RetentionInDays: 30
```

**Failure mode:** `AWS::CodeBuild::Project` does not accept `RetentionInDays` in `CloudWatchLogs`. CloudFormation stops with _"Encountered unsupported property RetentionInDays"_ and the stack rolls back. This is a new pattern captured as **CFN-51**.

**Status in `TapStack.yml`:** The final template drops the unsupported property while keeping log groups enabled.

```558:561:lib/TapStack.yml
      LogsConfig:
        CloudWatchLogs:
          GroupName: !Sub '/aws/codebuild/payment-service-build-${EnvironmentName}'
          Status: ENABLED
```

**Fix guidance:** Manage retention through a separate `AWS::Logs::LogGroup` resource or post-deployment automation rather than the CodeBuild project itself.

---

### MF-02: CodeDeploy Blue/Green Without Managed ECS Service

**Model observation:** The model provisions a CodeDeploy application/deployment group and configures the pipeline to call `Provider: CodeDeployToECS`, assuming external ECS resources already exist.

```467:576:lib/MODEL_RESPONSE.md
  CodeDeployDeploymentGroup:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref CodeDeployApplication
      ECSServices:
        - ClusterName: !Ref EcsClusterName
          ServiceName: !Ref EcsServiceName
...
        - Name: Deploy
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeployToECS
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Ref CodeDeployDeploymentGroup
                TaskDefinitionTemplateArtifact: TestOutput
                TaskDefinitionTemplatePath: taskdef.json
                AppSpecTemplateArtifact: TestOutput
                AppSpecTemplatePath: appspec.yml
```

**Failure mode:** When the referenced ECS service is not already created with `DeploymentController.Type: CODE_DEPLOY`, the deployment group fails validation (_InvalidECSServiceException_). This maps to the existing **CFN-44** issue.

**Status in `TapStack.yml`:** The ideal template keeps the ECS-native deployment path (`Provider: ECS`) and creates the ECS service in the same stack, avoiding CodeDeploy coupling.

```768:783:lib/TapStack.yml
        - Name: Deploy
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ECS
              Configuration:
                ClusterName: !Ref EcsCluster
                ServiceName: !Ref EcsService
                FileName: imagedefinitions.json
```

**Fix guidance:** Either provision the ECS service with `DeploymentController: CODE_DEPLOY` and include load-balancing resources, or stay on the simpler ECS provider as reflected in `TapStack.yml`.

---

### MF-03: Missing Task Definition & AppSpec Artifacts

**Model observation:** The CodeDeploy action expects `taskdef.json` and `appspec.yml` sourced from the `TestOutput` artifact, but no pipeline stage produces those files.

```560:578:lib/MODEL_RESPONSE.md
        - Name: Deploy
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeployToECS
              Configuration:
                TaskDefinitionTemplateArtifact: TestOutput
                TaskDefinitionTemplatePath: taskdef.json
                AppSpecTemplateArtifact: TestOutput
                AppSpecTemplatePath: appspec.yml
                Image1ArtifactName: BuildOutput
                Image1ContainerName: IMAGE1_NAME
              InputArtifacts:
                - Name: TestOutput
                - Name: BuildOutput
```

**Failure mode:** Deployments fail at runtime with _"Specified artifact taskdef.json/appspec.yml not found"_ because the CodeBuild projects output standard ZIP artifacts without those manifests. This is tracked here as **MF-03**.

**Status in `TapStack.yml`:** The pipeline ships a single `imagedefinitions.json` (produced during the build) directly to the ECS deploy action, avoiding the missing-artifact pitfall.

```770:782:lib/TapStack.yml
        - Name: Deploy
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ECS
              Configuration:
                ClusterName: !Ref EcsCluster
                ServiceName: !Ref EcsService
                FileName: imagedefinitions.json
```

**Fix guidance:** If CodeDeploy-based blue/green is required, add a packaging stage that generates `taskdef.json` and `appspec.yml` into a dedicated artifact, or keep the ECS provider approach.

---

### MF-04: Slack Webhook Never Receives URL

**Model observation:** The EventBridge rule writes `#{SlackWebhookUrl}` as a literal string into the event payload.

```619:625:lib/MODEL_RESPONSE.md
          InputTemplate: |
            {
              "pipeline": <pipeline>,
              "state": <state>,
              "executionId": <executionId>,
              "time": <time>,
              "webhookUrl": "#{SlackWebhookUrl}"
            }
```

**Failure mode:** The Slack Lambda function receives `#{SlackWebhookUrl}` instead of the actual URL, so HTTPS requests fail with DNS errors. Logged errors show _"getaddrinfo ENOTFOUND #{SlackWebhookUrl}"_. This is catalogued as **MF-04**.

**Status in `TapStack.yml`:** The payload uses `!Sub` to inline `${SlackWebhookUrl}` only when supplied.

```815:826:lib/TapStack.yml
          InputTransformer:
            InputPathsMap:
              pipeline: "$.detail.pipeline"
              state: "$.detail.state"
              executionId: "$.detail.execution-id"
              time: "$.time"
            InputTemplate: !Sub |
              {
                "pipeline": <pipeline>,
                "state": <state>,
                "executionId": <executionId>,
                "time": <time>,
                "webhookUrl": "${SlackWebhookUrl}"
              }
```

**Fix guidance:** Always surround Slack webhook substitutions with `!Sub` (or `Fn::Sub`) so CloudFormation injects the parameter value before the event is emitted.

---

### MF-05: Overly Broad CodeBuild ECR Permissions

**Model observation:** The model attaches the managed policy `AmazonECR-FullAccess` to the CodeBuild role.

```200:211:lib/MODEL_RESPONSE.md
  CodeBuildServiceRole:
    Type: AWS::IAM::Role
    Properties:
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonECR-FullAccess'
```

**Failure mode:** The managed policy grants repository administration actions well beyond the least-privilege requirement and conflicts with the explicit deny statements. It also violates internal security guidelines (tracked here as **MF-05**).

**Status in `TapStack.yml`:** The final role relies solely on targeted inline statements (pull/push, KMS, logging, VPC APIs) without attaching the broad managed policy.

```386:424:lib/TapStack.yml
      Policies:
        - PolicyName: CodeBuildServiceRolePolicy
          PolicyDocument:
            Statement:
              - Sid: AllowS3Operations
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                  - 's3:PutObject'
                  - 's3:ListBucket'
```

**Fix guidance:** Keep the scoped inline policy and eliminate broad AWS managed policies unless the build explicitly needs repository administration capabilities.

---

## ✅ Summary

- `TapStack.yml` aligns with the ideal template and avoids the five high-risk patterns produced by the raw model output.
- Add **CFN-51** to the shared `IAC_ISSUES_REFERENCE.md.log` so future analyses flag the unsupported `RetentionInDays` property before deployment.
