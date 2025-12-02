# MODEL_FAILURES.md - Intentional Errors Documentation

This document describes potential errors and issues that could occur in a CI/CD pipeline implementation, which have been avoided in the current implementation.

## 1. Missing S3 Bucket Versioning

**Error Type:** Configuration Omission
**Severity:** Medium
**Description:** S3 bucket created without versioning enabled, violating requirement #1.

**Wrong Implementation:**
```typescript
const artifactBucket = new aws.s3.Bucket(`cicd-artifacts-${environmentSuffix}`, {
  bucket: `cicd-artifacts-${environmentSuffix}`,
  // Missing: versioning configuration
  tags: defaultTags,
}, { parent: this });
```

**Correct Implementation:**
```typescript
const artifactBucket = new aws.s3.Bucket(`cicd-artifacts-${environmentSuffix}`, {
  bucket: `cicd-artifacts-${environmentSuffix}`,
  versioning: {
    enabled: true,  // ✓ Versioning enabled as required
  },
  forceDestroy: true,
  tags: defaultTags,
}, { parent: this });
```

## 2. Incorrect ECR Lifecycle Policy

**Error Type:** Logic Error
**Severity:** High
**Description:** ECR lifecycle policy configured to retain 5 images instead of required 10.

**Wrong Implementation:**
```typescript
new aws.ecr.LifecyclePolicy(`app-repository-lifecycle-${environmentSuffix}`, {
  repository: ecrRepository.name,
  policy: JSON.stringify({
    rules: [{
      rulePriority: 1,
      description: 'Retain only last 5 images',  // Wrong count
      selection: {
        tagStatus: 'any',
        countType: 'imageCountMoreThan',
        countNumber: 5,  // ✗ Should be 10
      },
      action: {
        type: 'expire',
      },
    }],
  }),
}, { parent: this });
```

**Correct Implementation:**
```typescript
new aws.ecr.LifecyclePolicy(`app-repository-lifecycle-${environmentSuffix}`, {
  repository: ecrRepository.name,
  policy: JSON.stringify({
    rules: [{
      rulePriority: 1,
      description: 'Retain only last 10 images',
      selection: {
        tagStatus: 'any',
        countType: 'imageCountMoreThan',
        countNumber: 10,  // ✓ Correct count
      },
      action: {
        type: 'expire',
      },
    }],
  }),
}, { parent: this });
```

## 3. Missing CloudWatch Logs Retention

**Error Type:** Configuration Omission
**Severity:** Medium
**Description:** CloudWatch Log Group created without 7-day retention policy.

**Wrong Implementation:**
```typescript
const codeBuildLogGroup = new aws.cloudwatch.LogGroup(`codebuild-logs-${environmentSuffix}`, {
  name: `/aws/codebuild/app-build-${environmentSuffix}`,
  // Missing: retentionInDays
  tags: defaultTags,
}, { parent: this });
```

**Correct Implementation:**
```typescript
const codeBuildLogGroup = new aws.cloudwatch.LogGroup(`codebuild-logs-${environmentSuffix}`, {
  name: `/aws/codebuild/app-build-${environmentSuffix}`,
  retentionInDays: 7,  // ✓ 7-day retention as required
  tags: defaultTags,
}, { parent: this });
```

## 4. Overly Permissive IAM Policies

**Error Type:** Security Issue
**Severity:** Critical
**Description:** IAM role granted wildcard permissions instead of least-privilege.

**Wrong Implementation:**
```typescript
new aws.iam.RolePolicy(`codebuild-ecr-policy-${environmentSuffix}`, {
  role: codeBuildRole.id,
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: 'ecr:*',  // ✗ Wildcard permissions
      Resource: '*',    // ✗ All resources
    }],
  }),
}, { parent: this });
```

**Correct Implementation:**
```typescript
new aws.iam.RolePolicy(`codebuild-ecr-policy-${environmentSuffix}`, {
  role: codeBuildRole.id,
  policy: pulumi.all([ecrRepository.arn]).apply(([repoArn]) => JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['ecr:GetAuthorizationToken'],  // ✓ Specific action
        Resource: '*',  // Required for GetAuthorizationToken
      },
      {
        Effect: 'Allow',
        Action: [  // ✓ Specific actions only
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
          'ecr:PutImage',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload',
        ],
        Resource: repoArn,  // ✓ Specific resource
      },
    ],
  })),
}, { parent: this });
```

## 5. Missing buildspec.yml Configuration

**Error Type:** Configuration Omission
**Severity:** High
**Description:** CodeBuild project not configured to use buildspec.yml from repository.

**Wrong Implementation:**
```typescript
const codeBuildProject = new aws.codebuild.Project(`app-build-${environmentSuffix}`, {
  name: `app-build-${environmentSuffix}`,
  serviceRole: codeBuildRole.arn,
  source: {
    type: 'CODEPIPELINE',
    // Missing: buildspec: 'buildspec.yml'
  },
  // ... other config
}, { parent: this });
```

**Correct Implementation:**
```typescript
const codeBuildProject = new aws.codebuild.Project(`app-build-${environmentSuffix}`, {
  name: `app-build-${environmentSuffix}`,
  serviceRole: codeBuildRole.arn,
  source: {
    type: 'CODEPIPELINE',
    buildspec: 'buildspec.yml',  // ✓ Uses buildspec.yml from repo
  },
  // ... other config
}, { parent: this });
```

## 6. Missing Pipeline Stage

**Error Type:** Requirement Omission
**Severity:** Critical
**Description:** CodePipeline missing one of the three required stages.

**Wrong Implementation:**
```typescript
const pipeline = new aws.codepipeline.Pipeline(`app-pipeline-${environmentSuffix}`, {
  name: `app-pipeline-${environmentSuffix}`,
  roleArn: codePipelineRole.arn,
  stages: [
    { name: 'Source', /* ... */ },
    { name: 'Build', /* ... */ },
    // Missing: Deploy stage
  ],
  tags: defaultTags,
}, { parent: this });
```

**Correct Implementation:**
```typescript
const pipeline = new aws.codepipeline.Pipeline(`app-pipeline-${environmentSuffix}`, {
  name: `app-pipeline-${environmentSuffix}`,
  roleArn: codePipelineRole.arn,
  stages: [
    { name: 'Source', /* ... */ },  // ✓ GitHub source
    { name: 'Build', /* ... */ },   // ✓ CodeBuild
    { name: 'Deploy', /* ... */ },  // ✓ ECS deployment
  ],
  tags: defaultTags,
}, { parent: this });
```

## 7. Missing SNS Notification for Failures

**Error Type:** Requirement Omission
**Severity:** Medium
**Description:** Pipeline failures not configured to send SNS notifications.

**Wrong Implementation:**
```typescript
// SNS topic created but not connected to pipeline events
const snsTopic = new aws.sns.Topic(`pipeline-notifications-${environmentSuffix}`, {
  name: `pipeline-notifications-${environmentSuffix}`,
  tags: defaultTags,
}, { parent: this });
// Missing: EventBridge rule and target
```

**Correct Implementation:**
```typescript
// SNS topic
const snsTopic = new aws.sns.Topic(`pipeline-notifications-${environmentSuffix}`, {
  name: `pipeline-notifications-${environmentSuffix}`,
  tags: defaultTags,
}, { parent: this });

// ✓ EventBridge rule for failures
const pipelineEventRule = new aws.cloudwatch.EventRule(`pipeline-failure-rule-${environmentSuffix}`, {
  name: `pipeline-failure-rule-${environmentSuffix}`,
  description: 'Capture pipeline failures',
  eventPattern: pulumi.all([pipeline.name]).apply(([pipelineName]) => JSON.stringify({
    source: ['aws.codepipeline'],
    'detail-type': ['CodePipeline Pipeline Execution State Change'],
    detail: {
      state: ['FAILED'],
      pipeline: [pipelineName],
    },
  })),
  tags: defaultTags,
}, { parent: this });

// ✓ EventBridge target to SNS
new aws.cloudwatch.EventTarget(`pipeline-failure-target-${environmentSuffix}`, {
  rule: pipelineEventRule.name,
  arn: snsTopic.arn,
  inputTransformer: {
    inputPaths: {
      pipeline: '$.detail.pipeline',
      state: '$.detail.state',
      execution: '$.detail.execution-id',
    },
    inputTemplate: '"Pipeline <pipeline> has <state>. Execution ID: <execution>"',
  },
}, { parent: this });
```

## 8. Incorrect Resource Tags

**Error Type:** Configuration Error
**Severity:** Low
**Description:** Resources not tagged with required Environment=Production and ManagedBy=Pulumi.

**Wrong Implementation:**
```typescript
const defaultTags = {
  ...tags,
  Environment: 'Development',  // ✗ Should be 'Production'
  ManagedBy: 'Terraform',      // ✗ Should be 'Pulumi'
};
```

**Correct Implementation:**
```typescript
const defaultTags = {
  ...tags,
  Environment: 'Production',  // ✓ Correct
  ManagedBy: 'Pulumi',       // ✓ Correct
};
```

## 9. Missing environmentSuffix in Resource Names

**Error Type:** Naming Convention Violation
**Severity:** Medium
**Description:** Resources not using environmentSuffix for uniqueness.

**Wrong Implementation:**
```typescript
const artifactBucket = new aws.s3.Bucket('cicd-artifacts', {  // ✗ No suffix
  bucket: 'cicd-artifacts',
  // ...
});
```

**Correct Implementation:**
```typescript
const artifactBucket = new aws.s3.Bucket(`cicd-artifacts-${environmentSuffix}`, {  // ✓ With suffix
  bucket: `cicd-artifacts-${environmentSuffix}`,
  // ...
});
```

## 10. CodeBuild Missing Privileged Mode

**Error Type:** Configuration Error
**Severity:** High
**Description:** CodeBuild not configured with privileged mode required for Docker builds.

**Wrong Implementation:**
```typescript
const codeBuildProject = new aws.codebuild.Project(`app-build-${environmentSuffix}`, {
  environment: {
    computeType: 'BUILD_GENERAL1_SMALL',
    image: 'aws/codebuild/standard:5.0',
    type: 'LINUX_CONTAINER',
    // Missing: privilegedMode: true
  },
  // ...
});
```

**Correct Implementation:**
```typescript
const codeBuildProject = new aws.codebuild.Project(`app-build-${environmentSuffix}`, {
  environment: {
    computeType: 'BUILD_GENERAL1_SMALL',
    image: 'aws/codebuild/standard:5.0',
    type: 'LINUX_CONTAINER',
    privilegedMode: true,  // ✓ Required for Docker builds
  },
  // ...
});
```

## 11. Incorrect CodePipeline artifactStore Property

**Error Type:** API Schema Error
**Severity:** Critical
**Description:** CodePipeline using deprecated `artifactStore` property instead of `artifactStores` array, causing TypeScript compilation failure.

**Wrong Implementation (from MODEL_RESPONSE):**
```typescript
const pipeline = new aws.codepipeline.Pipeline(`app-pipeline-${environmentSuffix}`, {
  name: `app-pipeline-${environmentSuffix}`,
  roleArn: codePipelineRole.arn,
  artifactStore: {  // ✗ Incorrect - causes TypeScript error
    location: artifactBucket.bucket,
    type: 'S3',
  },
  stages: [/* ... */],
}, { parent: this });
```

**Error Message:**
```
error TS2561: Object literal may only specify known properties, but 'artifactStore' does not exist in type 'PipelineArgs'. Did you mean to write 'artifactStores'?
```

**Correct Implementation:**
```typescript
const pipeline = new aws.codepipeline.Pipeline(`app-pipeline-${environmentSuffix}`, {
  name: `app-pipeline-${environmentSuffix}`,
  roleArn: codePipelineRole.arn,
  artifactStores: [  // ✓ Correct - array of artifact stores
    {
      location: artifactBucket.bucket,
      type: 'S3',
    },
  ],
  stages: [/* ... */],
}, { parent: this });
```

**Root Cause:** The model used an outdated or incorrect API schema. The Pulumi AWS provider requires `artifactStores` (plural, array) instead of `artifactStore` (singular, object).

**Impact:** This was a build-breaking error that prevented TypeScript compilation. Caught during the build quality gate before deployment.

## Summary

The following errors were found and corrected in the MODEL_RESPONSE:

Critical Errors:
- ✓ Fixed incorrect artifactStore property (build failure)

All potential errors have been avoided or corrected in the current implementation. The infrastructure code:

- ✓ Enables S3 versioning
- ✓ Configures ECR lifecycle policy for 10 images
- ✓ Sets CloudWatch Logs retention to 7 days
- ✓ Implements least-privilege IAM policies
- ✓ Configures buildspec.yml usage
- ✓ Includes all three pipeline stages
- ✓ Sets up SNS notifications for failures
- ✓ Tags all resources correctly
- ✓ Uses environmentSuffix consistently
- ✓ Enables privileged mode for Docker builds
- ✓ Uses correct artifactStores array property
