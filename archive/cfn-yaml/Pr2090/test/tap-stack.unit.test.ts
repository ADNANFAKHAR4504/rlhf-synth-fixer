import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Unit Tests', () => {
  let templateContent: string;

  beforeAll(() => {
    // Load the CloudFormation template as text for basic validation
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
    templateContent = fs.readFileSync(templatePath, 'utf8');
  });

  describe('Template Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(templateContent).toContain("AWSTemplateFormatVersion: '2010-09-09'");
    });

    test('should have a description', () => {
      expect(templateContent).toContain('Description:');
      expect(templateContent).toContain('Multi-Account CI/CD Pipeline');
    });

    test('should have all required parameters', () => {
      const requiredParams = [
        'ProjectName',
        'Environment',
        'EnvironmentSuffix',
        'CodeStarConnectionArn',
        'GitHubRepositoryOwner',
        'GitHubRepositoryName',
        'GitHubBranchName',
        'ApprovalNotificationEmail',
        'KeyPairName',
        'AmiId'
      ];

      requiredParams.forEach(param => {
        expect(templateContent).toContain(`${param}:`);
      });
    });

    test('should have default values for all parameters', () => {
      const requiredDefaults = [
        'Default: \'my-cicd-project\'',
        'Default: \'dev\'',
        'Default: \'your-github-username\'',
        'Default: \'your-repository-name\'',
        'Default: \'main\'',
        'Default: \'admin@example.com\'',
        "Default: ''",
        'Default: \'/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2\''
      ];

      requiredDefaults.forEach(defaultValue => {
        expect(templateContent).toContain(defaultValue);
      });
    });
  });

  describe('CloudFormation Resources', () => {
    test('should have CodePipeline resource', () => {
      expect(templateContent).toContain('Type: AWS::CodePipeline::Pipeline');
      expect(templateContent).toContain('CodePipeline:');
    });

    test('should have CodeBuild project', () => {
      expect(templateContent).toContain('Type: AWS::CodeBuild::Project');
      expect(templateContent).toContain('BuildProject:');
    });

    test('should have S3 bucket for artifacts', () => {
      expect(templateContent).toContain('Type: AWS::S3::Bucket');
      expect(templateContent).toContain('PipelineArtifactsBucket:');
    });

    test('should have SNS topics for notifications', () => {
      expect(templateContent).toContain('Type: AWS::SNS::Topic');
      expect(templateContent).toContain('ManualApprovalTopic:');
    });

    test('should have IAM roles', () => {
      expect(templateContent).toContain('Type: AWS::IAM::Role');
      expect(templateContent).toContain('CodePipelineServiceRole:');
      expect(templateContent).toContain('CodeBuildServiceRole:');
    });

    test('should have VPC infrastructure', () => {
      expect(templateContent).toContain('Type: AWS::EC2::VPC');
      expect(templateContent).toContain('SampleVPC:');
    });

    test('should have EC2 instance', () => {
      expect(templateContent).toContain('Type: AWS::EC2::Instance');
      expect(templateContent).toContain('SampleEC2Instance:');
    });
  });

  describe('Security Configuration', () => {
    test('should have proper S3 bucket security', () => {
      expect(templateContent).toContain('PublicAccessBlockConfiguration:');
      expect(templateContent).toContain('BlockPublicAcls: true');
      expect(templateContent).toContain('BlockPublicPolicy: true');
      expect(templateContent).toContain('IgnorePublicAcls: true');
      expect(templateContent).toContain('RestrictPublicBuckets: true');
    });

    test('should have S3 bucket encryption', () => {
      expect(templateContent).toContain('BucketEncryption:');
      expect(templateContent).toContain('ServerSideEncryptionConfiguration:');
    });

    test('should use CodeStar connection for GitHub', () => {
      expect(templateContent).toContain('Provider: CodeStarSourceConnection');
      expect(templateContent).toContain('ConnectionArn: !Ref CodeStarConnectionArn');
    });
  });

  describe('Pipeline Configuration', () => {
    test('should have correct pipeline stages', () => {
      expect(templateContent).toContain('- Name: Source');
      expect(templateContent).toContain('- Name: Build');
      expect(templateContent).toContain('- Name: Test');
      expect(templateContent).toContain('- Name: Approval');
      expect(templateContent).toContain('- Name: Deploy');
    });

    test('should have manual approval configuration', () => {
      expect(templateContent).toContain('Provider: Manual');
      expect(templateContent).toContain('NotificationArn: !Ref ManualApprovalTopic');
    });

    test('should have proper artifact configuration', () => {
      expect(templateContent).toContain('Type: S3');
      expect(templateContent).toContain('Location: !Ref PipelineArtifactsBucket');
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(templateContent).toContain('Conditions:');
      expect(templateContent).toContain('HasKeyPair: !Not [!Equals [!Ref KeyPairName, \'\']]');
    });

    test('should have HasEnvironmentSuffix condition', () => {
      expect(templateContent).toContain('HasEnvironmentSuffix: !Not [!Equals [!Ref EnvironmentSuffix, \'\']]');
    });

    test('should use conditional logic for resource naming', () => {
      // Check that resources use conditional naming with EnvironmentSuffix
      expect(templateContent).toContain('!If');
      expect(templateContent).toContain('HasEnvironmentSuffix');
    });

    test('should conditionally include SSH access in security group', () => {
      // Check that SSH port 22 is conditionally included
      expect(templateContent).toContain('!If');
      expect(templateContent).toContain('HasKeyPair');
      expect(templateContent).toContain('FromPort: 22');
    });

    test('should conditionally set KeyName in EC2 instance', () => {
      // Check that KeyName is conditionally set
      expect(templateContent).toContain('KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref AWS::NoValue]');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'PipelineName',
        'PipelineUrl',
        'ArtifactsBucket',
        'CodeStarConnectionArn',
        'ManualApprovalTopicArn',
        'PipelineNotificationTopicArn',
        'SampleInstanceId',
        'VPCId'
      ];

      requiredOutputs.forEach(output => {
        expect(templateContent).toContain(`${output}:`);
      });
    });

    test('should export important values', () => {
      expect(templateContent).toContain('Export:');
      expect(templateContent).toContain('Name: !Sub \'${AWS::StackName}-');
    });
  });

  describe('Parameter Validation', () => {
    test('should have proper parameter constraints', () => {
      expect(templateContent).toContain('AllowedPattern:');
      expect(templateContent).toContain('ConstraintDescription:');
    });

    test('should use SSM parameter for AMI ID', () => {
      expect(templateContent).toContain('Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(templateContent).toContain('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });
  });

  describe('Best Practices', () => {
    test('should not have hardcoded IAM role names', () => {
      // Check that we don't have explicit RoleName properties (auto-generated is better)
      const roleNameMatches = templateContent.match(/RoleName:/g);
      expect(roleNameMatches).toBeNull(); // Should not find any explicit role names
    });

    test('should use proper S3 ARN format', () => {
      expect(templateContent).toContain('arn:aws:s3:::');
      expect(templateContent).toContain('/*'); // For object-level permissions
    });

    test('should have proper resource dependencies', () => {
      expect(templateContent).toContain('DependsOn:');
      expect(templateContent).toContain('!Ref');
      expect(templateContent).toContain('!GetAtt');
    });

    test('should not use deprecated managed policies', () => {
      // Check that we don't use the deprecated AWSCodePipelineServiceRole
      expect(templateContent).not.toContain('arn:aws:iam::aws:policy/AWSCodePipelineServiceRole');

      // Should use custom policies instead
      expect(templateContent).toContain('PipelineExecutionPolicy');
      expect(templateContent).toContain('CodeBuildExecutionPolicy');
    });

    test('should have CloudWatch Logs permissions for CodeBuild', () => {
      expect(templateContent).toContain('logs:CreateLogGroup');
      expect(templateContent).toContain('logs:CreateLogStream');
      expect(templateContent).toContain('logs:PutLogEvents');
    });

    test('should use latest CodeBuild image version', () => {
      // Should use the latest amazonlinux2-x86_64-standard:5.0 image
      expect(templateContent).toContain('aws/codebuild/amazonlinux2-x86_64-standard:5.0');

      // Should not use the old 3.0 version
      expect(templateContent).not.toContain('aws/codebuild/amazonlinux2-x86_64-standard:3.0');
    });

    test('should pass environment variables to CodeBuild', () => {
      expect(templateContent).toContain('ENVIRONMENT_SUFFIX');
      expect(templateContent).toContain('PROJECT_NAME');
      expect(templateContent).toContain('ENVIRONMENT');
    });

    test('should have EventBridge permissions for SNS', () => {
      expect(templateContent).toContain('EventBridgeToSNSPermission');
      expect(templateContent).toContain('events.amazonaws.com');
      expect(templateContent).toContain('sns:Publish');
    });
  });

  describe('Template Validation', () => {
    test('should be valid YAML syntax', () => {
      // Basic YAML structure validation
      expect(templateContent).toContain('AWSTemplateFormatVersion:');
      expect(templateContent).toContain('Parameters:');
      expect(templateContent).toContain('Resources:');
      expect(templateContent).toContain('Outputs:');
    });

    test('should have consistent indentation', () => {
      const lines = templateContent.split('\n');
      let hasConsistentIndentation = true;

      lines.forEach(line => {
        if (line.trim() && line.startsWith(' ')) {
          // Check that indentation is consistent (multiples of 2)
          const leadingSpaces = line.match(/^ */)?.[0].length || 0;
          if (leadingSpaces % 2 !== 0) {
            hasConsistentIndentation = false;
          }
        }
      });

      expect(hasConsistentIndentation).toBe(true);
    });

    test('should not have trailing whitespace', () => {
      const lines = templateContent.split('\n');
      const hasTrailingWhitespace = lines.some(line => line.endsWith(' ') || line.endsWith('\t'));
      expect(hasTrailingWhitespace).toBe(false);
    });
  });
});