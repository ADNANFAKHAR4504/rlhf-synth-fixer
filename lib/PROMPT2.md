Follwing code block giving build error -

```typescript
  // Build Stage
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
        },

Error:
 error TS2339: Property 'variable' does not exist on type 'typeof CodeBuildAction'.

               value: codepipeline_actions.CodeBuildAction.variable('CODEBUILD_BUILD_NUMBER'),
```

Fix it and provide me error free code