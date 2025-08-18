// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

describe('TapStack Stack Outputs (smoke test)', () => {
  const keys = [
    'CodeBuildProjectName',
    'ValidationLambdaName',
    'PipelineName',
    'SourceBucketName',
    'PipelineConsoleURL',
    'ArtifactsBucketName',
    'SourceBucketConsoleURL',
  ];

  test('all required outputs are present and non-empty', () => {
    keys.forEach(key => {
      expect(outputs[key]).toBeDefined();
      expect(String(outputs[key]).length).toBeGreaterThan(0);
    });
  });
});

describe('TapStack Stack Outputs (detailed integration)', () => {
  const keys = [
    'CodeBuildProjectName',
    'ValidationLambdaName',
    'PipelineName',
    'SourceBucketName',
    'PipelineConsoleURL',
    'ArtifactsBucketName',
    'SourceBucketConsoleURL',
  ];

  test('all required outputs are present and non-empty', () => {
    keys.forEach(key => {
      expect(outputs[key]).toBeDefined();
      expect(String(outputs[key]).length).toBeGreaterThan(0);
    });
  });

  test('PipelineName follows naming convention', () => {
    expect(outputs.PipelineName).toMatch(/^my-cicd-project-pipeline/);
  });

  test('CodeBuildProjectName follows naming convention', () => {
    expect(outputs.CodeBuildProjectName).toMatch(/^my-cicd-project-build/);
  });

  test('ValidationLambdaName follows naming convention', () => {
    expect(outputs.ValidationLambdaName).toMatch(/^my-cicd-project-validation-function/);
  });

  test('SourceBucketName and ArtifactsBucketName are valid S3 bucket names', () => {
    expect(outputs.SourceBucketName).toMatch(/^source-code-bucket-.*-us-east-1$/);
    expect(outputs.ArtifactsBucketName).toMatch(/^build-artifacts-bucket-.*-us-east-1$/);
  });

  test('PipelineConsoleURL is a valid AWS CodePipeline URL', () => {
    expect(outputs.PipelineConsoleURL).toMatch(
      /^https:\/\/console\.aws\.amazon\.com\/codesuite\/codepipeline\/pipelines\//
    );
  });

  test('SourceBucketConsoleURL is a valid AWS S3 URL', () => {
    expect(outputs.SourceBucketConsoleURL).toMatch(
      /^https:\/\/console\.aws\.amazon\.com\/s3\/buckets\//
    );
  });
});
