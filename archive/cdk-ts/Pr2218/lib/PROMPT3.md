# Fix TypeScript build error in CDK pipeline: `Property 'variable' does not exist on type 'typeof CodeBuildAction'`

### Problem

When building a CDK stack I get a TypeScript error pointing to the use of `CodeBuildAction.variable(...)`. The build fails with:

```
error TS2339: Property 'variable' does not exist on type 'typeof CodeBuildAction'.

      value: codepipeline_actions.CodeBuildAction.variable('CODEBUILD_BUILD_NUMBER'),
```

### Code (current)

```typescript
{
  stageName: 'Build',
  actions: [
    new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
      environmentVariables: {
        'CODEBUILD_BUILD_NUMBER': {
          value: codepipeline_actions.CodeBuildAction.variable('CODEBUILD_BUILD_NUMBER'),
        },
      },
    }),
  ],
}
```

### Request

Please check the error carefully and **fix the code** so the CDK build runs without TypeScript errors. Provide:

* The corrected TypeScript code (ready to paste into the CDK stack).
* A brief explanation of what was wrong and why your fix works.
* Any notes about which CDK/constructs import or versions matter (if relevant).
