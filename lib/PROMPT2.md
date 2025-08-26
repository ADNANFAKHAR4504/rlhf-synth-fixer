Getting the build error when trying to build the cdk stack.

Code Block

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


Error:
 error TS2339: Property 'variable' does not exist on type 'typeof CodeBuildAction'.

               value: codepipeline_actions.CodeBuildAction.variable('CODEBUILD_BUILD_NUMBER'),


Check the error carefully and fix it so that build will run without any error.