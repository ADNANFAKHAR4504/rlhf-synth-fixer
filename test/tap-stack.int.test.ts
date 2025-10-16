// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

describe('TAP CI/CD Pipeline Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('Pipeline name should be defined and follow naming convention', () => {
      expect(outputs.PipelineName).toBeDefined();
      expect(outputs.PipelineName).toBe(`tap-pipeline-${environmentSuffix}`);
    });

    test('CodeBuild project name should be defined and follow naming convention', () => {
      expect(outputs.CodeBuildProjectName).toBeDefined();
      expect(outputs.CodeBuildProjectName).toBe(`tap-build-${environmentSuffix}`);
    });

    test('CodeDeploy application name should be defined and follow naming convention', () => {
      expect(outputs.CodeDeployApplicationName).toBeDefined();
      expect(outputs.CodeDeployApplicationName).toBe(`tap-app-${environmentSuffix}`);
    });

    test('VPC ID should be defined and valid format', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('Load Balancer DNS should be defined and valid format', () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerDNS).toContain('.elb.amazonaws.com');
      expect(outputs.LoadBalancerDNS).toContain(region);
    });

    test('Source bucket name should be defined and follow naming convention', () => {
      expect(outputs.SourceBucketName).toBeDefined();
      expect(outputs.SourceBucketName).toContain('tap-source');
      expect(outputs.SourceBucketName).toContain(environmentSuffix);
    });

    test('Artifacts bucket name should be defined and follow naming convention', () => {
      expect(outputs.ArtifactsBucketName).toBeDefined();
      expect(outputs.ArtifactsBucketName).toContain('tap-artifacts');
      expect(outputs.ArtifactsBucketName).toContain(environmentSuffix);
    });

    test('SNS topic ARN should be defined and valid format', () => {
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:/);
      expect(outputs.SNSTopicArn).toContain(region);
      expect(outputs.SNSTopicArn).toContain('tap-pipeline-notifications');
    });

    test('StackSet name should be defined and follow naming convention', () => {
      expect(outputs.StackSetName).toBeDefined();
      expect(outputs.StackSetName).toBe(`tap-pipeline-stackset-${environmentSuffix}`);
    });

    test('Region should match expected region', () => {
      expect(outputs.Region).toBeDefined();
      expect(outputs.Region).toBe(region);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('All resource names should include environment suffix', () => {
      expect(outputs.PipelineName).toContain(environmentSuffix);
      expect(outputs.CodeBuildProjectName).toContain(environmentSuffix);
      expect(outputs.CodeDeployApplicationName).toContain(environmentSuffix);
      expect(outputs.SourceBucketName).toContain(environmentSuffix);
      expect(outputs.ArtifactsBucketName).toContain(environmentSuffix);
    });

    test('All resource names should start with "tap-" prefix', () => {
      expect(outputs.PipelineName).toMatch(/^tap-/);
      expect(outputs.CodeBuildProjectName).toMatch(/^tap-/);
      expect(outputs.CodeDeployApplicationName).toMatch(/^tap-/);
      expect(outputs.SourceBucketName).toMatch(/^tap-/);
      expect(outputs.ArtifactsBucketName).toMatch(/^tap-/);
      expect(outputs.StackSetName).toMatch(/^tap-/);
    });
  });

  describe('Regional Configuration', () => {
    test('All region-specific resources should be in correct region', () => {
      expect(outputs.Region).toBe(region);
      expect(outputs.SNSTopicArn).toContain(`:${region}:`);
      expect(outputs.LoadBalancerDNS).toContain(`.${region}.`);
    });

    test('Region should be ap-northeast-1 for this deployment', () => {
      expect(region).toBe('ap-northeast-1');
      expect(outputs.Region).toBe('ap-northeast-1');
    });
  });

  describe('Required Infrastructure Components', () => {
    test('All required S3 buckets should be present', () => {
      expect(outputs.SourceBucketName).toBeDefined();
      expect(outputs.ArtifactsBucketName).toBeDefined();
    });

    test('All required CI/CD components should be present', () => {
      expect(outputs.PipelineName).toBeDefined();
      expect(outputs.CodeBuildProjectName).toBeDefined();
      expect(outputs.CodeDeployApplicationName).toBeDefined();
    });

    test('All required networking components should be present', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
    });

    test('All required notification components should be present', () => {
      expect(outputs.SNSTopicArn).toBeDefined();
    });
  });

  describe('Output Completeness', () => {
    test('All expected outputs should be present', () => {
      const expectedOutputs = [
        'PipelineName',
        'CodeBuildProjectName',
        'CodeDeployApplicationName',
        'VPCId',
        'LoadBalancerDNS',
        'SourceBucketName',
        'ArtifactsBucketName',
        'SNSTopicArn',
        'Region',
        'StackSetName',
        'GreenTargetGroupName',
        'LoadBalancerListenerArn',
      ];

      expectedOutputs.forEach((output) => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('Outputs should not contain placeholder or default values', () => {
      Object.values(outputs).forEach((value) => {
        expect(value).not.toContain('PLACEHOLDER');
        expect(value).not.toContain('TODO');
        expect(value).not.toContain('CHANGEME');
      });
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('Environment suffix should be correctly applied', () => {
      const suffix = environmentSuffix;
      expect(suffix).toBeTruthy();
      expect(suffix.length).toBeGreaterThan(0);
    });

    test('Resources should be isolated per environment', () => {
      // Verify that resource names include environment suffix for isolation
      const resourceNames = [
        outputs.PipelineName,
        outputs.CodeBuildProjectName,
        outputs.CodeDeployApplicationName,
        outputs.SourceBucketName,
        outputs.ArtifactsBucketName,
      ];

      resourceNames.forEach((name) => {
        expect(name).toContain(environmentSuffix);
      });
    });
  });

  describe('ARN Format Validation', () => {
    test('SNS Topic ARN should have correct format', () => {
      const arnPattern = /^arn:aws:sns:[a-z0-9-]+:\d{12}:.+$/;
      expect(outputs.SNSTopicArn).toMatch(arnPattern);
    });

    test('SNS Topic ARN should contain account ID', () => {
      const arnParts = outputs.SNSTopicArn.split(':');
      expect(arnParts.length).toBeGreaterThanOrEqual(6);
      expect(arnParts[4]).toMatch(/^\d{12}$/); // AWS account ID is 12 digits
    });
  });

  describe('DNS and Network Configuration', () => {
    test('Load Balancer DNS should be resolvable format', () => {
      expect(outputs.LoadBalancerDNS).toMatch(/^[a-z0-9-]+\..*\.elb\.amazonaws\.com$/);
    });

    test('VPC ID should be valid AWS VPC format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
    });
  });

  describe('Integration Readiness', () => {
    test('All outputs required for application deployment should be available', () => {
      // Verify outputs needed for application to deploy and run
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.SourceBucketName).toBeDefined();
      expect(outputs.ArtifactsBucketName).toBeDefined();
      expect(outputs.CodeDeployApplicationName).toBeDefined();
    });

    test('All outputs required for CI/CD pipeline should be available', () => {
      // Verify outputs needed for pipeline to function
      expect(outputs.PipelineName).toBeDefined();
      expect(outputs.CodeBuildProjectName).toBeDefined();
      expect(outputs.CodeDeployApplicationName).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
    });

    test('All outputs required for blue/green deployment should be available', () => {
      // Verify outputs needed for blue/green deployment
      expect(outputs.GreenTargetGroupName).toBeDefined();
      expect(outputs.LoadBalancerListenerArn).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
    });
  });

  describe('Blue/Green Deployment Configuration', () => {
    test('Green target group name should follow naming convention', () => {
      expect(outputs.GreenTargetGroupName).toBeDefined();
      expect(outputs.GreenTargetGroupName).toContain('tap-green-tg');
      expect(outputs.GreenTargetGroupName).toContain(environmentSuffix);
    });

    test('Load balancer listener ARN should be valid format', () => {
      expect(outputs.LoadBalancerListenerArn).toBeDefined();
      expect(outputs.LoadBalancerListenerArn).toMatch(
        /^arn:aws:elasticloadbalancing:[a-z0-9-]+:\d{12}:listener\/app\/.+$/
      );
      expect(outputs.LoadBalancerListenerArn).toContain(region);
    });
  });
});
