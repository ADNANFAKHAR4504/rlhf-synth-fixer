# Model Failures: Comparison of IDEAL_RESPONSE.md vs MODEL_RESPONSE.md

The following outputs/resources are present in the IDEAL response but missing or incorrect in the model response:

## Missed Outputs (with Example Snippets)

### 1. PipelineName Output
**IDEAL:**
```yaml
PipelineName:
  Description: 'Name of the created CodePipeline'
  Value: !Ref CodePipeline
  Export:
    Name: !Sub '${AWS::StackName}-PipelineName'
```
**MODEL:** _(missing)_

### 2. SourceBucketName Output
**IDEAL:**
```yaml
SourceBucketName:
  Description: 'Name of the S3 bucket for source code'
  Value: !Ref SourceCodeBucket
  Export:
    Name: !Sub '${AWS::StackName}-SourceBucket'
```
**MODEL:** _(missing)_

### 3. ArtifactsBucketName Output
**IDEAL:**
```yaml
ArtifactsBucketName:
  Description: 'Name of the S3 bucket for build artifacts'
  Value: !Ref ArtifactsBucket
  Export:
    Name: !Sub '${AWS::StackName}-ArtifactsBucket'
```
**MODEL:** _(missing)_

### 4. CodeBuildProjectName Output
**IDEAL:**
```yaml
CodeBuildProjectName:
  Description: 'Name of the CodeBuild project'
  Value: !Ref CodeBuildProject
  Export:
    Name: !Sub '${AWS::StackName}-CodeBuildProject'
```
**MODEL:** _(missing)_

### 5. ValidationLambdaName Output
**IDEAL:**
```yaml
ValidationLambdaName:
  Description: 'Name of the validation Lambda function'
  Value: !Ref ValidationLambda
  Export:
    Name: !Sub '${AWS::StackName}-ValidationLambda'
```
**MODEL:** _(missing)_

### 6. PipelineConsoleURL Output
**IDEAL:**
```yaml
PipelineConsoleURL:
  Description: 'URL to view the pipeline in AWS Console'
  Value: !Sub 'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${CodePipeline}/view'
```
**MODEL:** _(missing)_

### 7. SourceBucketConsoleURL Output
**IDEAL:**
```yaml
SourceBucketConsoleURL:
  Description: 'URL to view the source bucket in AWS Console'
  Value: !Sub 'https://console.aws.amazon.com/s3/buckets/${SourceCodeBucket}'
```
**MODEL:** _(missing)_

---

## Missed/Incorrect Resource Properties
- All outputs above should use correct CloudFormation intrinsic functions (`!Ref`, `!Sub`) and export names as shown.
- Resource names and outputs must follow the naming conventions and patterns as in the IDEAL response.

---

**Note:**
- The model response is missing all required stack outputs as defined in the IDEAL response.
- Please update the model to include all outputs and ensure correct formatting and naming as shown above.