import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Additional Coverage Tests', () => {
  describe('Environment Detection', () => {
    test('detects prod environment from suffix', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'ProdStack', {
        environmentSuffix: 'prod-deploy',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      // Should have manual approval stage for prod
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'ManualApproval' })
        ])
      });
    });

    test('detects staging environment from suffix', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'StagingStack', {
        environmentSuffix: 'staging-test',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      // Should NOT have manual approval stage for staging
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0];
      const stages = pipelineResource?.Properties?.Stages || [];
      const hasManualApproval = stages.some((stage: any) => stage.Name === 'ManualApproval');
      expect(hasManualApproval).toBe(false);
    });

    test('defaults to dev environment', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'DevStack', {
        environmentSuffix: 'feature-branch',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      // Should NOT have manual approval stage for dev
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0];
      const stages = pipelineResource?.Properties?.Stages || [];
      const hasManualApproval = stages.some((stage: any) => stage.Name === 'ManualApproval');
      expect(hasManualApproval).toBe(false);
    });
  });

  describe('Context and Props Handling', () => {
    test('uses environment suffix from context when props not provided', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'context-suffix'
        }
      });
      const stack = new TapStack(app, 'ContextStack', {
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      // Should use context suffix in resource names
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'ci-cd-pipeline-context-suffix'
      });
    });

    test('prefers props over context for environment suffix', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'context-suffix'
        }
      });
      const stack = new TapStack(app, 'PropsStack', {
        environmentSuffix: 'props-suffix',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      // Should use props suffix, not context
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'ci-cd-pipeline-props-suffix'
      });
    });

    test('defaults to dev when no suffix provided', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'DefaultStack', {
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      // Should use 'dev' as default suffix
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'ci-cd-pipeline-dev'
      });
    });
  });

  describe('Resource Naming Consistency', () => {
    test('all resources use consistent naming with environment suffix', () => {
      const environmentSuffix = 'consistency-test';
      const app = new cdk.App();
      const stack = new TapStack(app, 'ConsistencyStack', {
        environmentSuffix,
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      // Check all major resource types have consistent naming
      const resourceChecks = [
        { type: 'AWS::EC2::VPC', nameProperty: 'Tags', nameKey: 'Name', expectedName: `ci-cd-vpc-${environmentSuffix}` },
        { type: 'AWS::S3::Bucket', nameProperty: 'BucketName', expectedPattern: `ci-cd-artifacts-${environmentSuffix}` },
        { type: 'AWS::SNS::Topic', nameProperty: 'TopicName', expectedName: `ci-cd-notifications-${environmentSuffix}` },
        { type: 'AWS::AutoScaling::AutoScalingGroup', nameProperty: 'AutoScalingGroupName', expectedName: `ci-cd-asg-${environmentSuffix}` },
        { type: 'AWS::ElasticLoadBalancingV2::LoadBalancer', nameProperty: 'Name', expectedName: `ci-cd-alb-${environmentSuffix}` },
        { type: 'AWS::ElasticLoadBalancingV2::TargetGroup', nameProperty: 'Name', expectedName: `ci-cd-tg-${environmentSuffix}` },
        { type: 'AWS::CodeDeploy::Application', nameProperty: 'ApplicationName', expectedName: `ci-cd-app-${environmentSuffix}` },
        { type: 'AWS::CodeDeploy::DeploymentGroup', nameProperty: 'DeploymentGroupName', expectedName: `ci-cd-dg-${environmentSuffix}` },
        { type: 'AWS::CodeBuild::Project', nameProperty: 'Name', expectedName: `ci-cd-project-${environmentSuffix}` },
        { type: 'AWS::CodePipeline::Pipeline', nameProperty: 'Name', expectedName: `ci-cd-pipeline-${environmentSuffix}` }
      ];
      
      resourceChecks.forEach(check => {
        const resources = template.findResources(check.type);
        const resourceExists = Object.keys(resources).length > 0;
        expect(resourceExists).toBe(true);
        
        if (check.nameKey) {
          // For resources that use tags for naming
          const resource = Object.values(resources)[0];
          const tags = resource?.Properties?.Tags || [];
          const nameTag = tags.find((tag: any) => tag.Key === check.nameKey);
          expect(nameTag?.Value).toBe(check.expectedName);
        } else if (check.expectedPattern) {
          // For resources with pattern-based names (like S3 buckets)
          const resource = Object.values(resources)[0];
          const name = resource?.Properties?.[check.nameProperty];
          expect(name).toContain(check.expectedPattern);
        } else {
          // For resources with direct name properties
          const resource = Object.values(resources)[0];
          expect(resource?.Properties?.[check.nameProperty]).toBe(check.expectedName);
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('IAM roles follow least privilege principle', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'SecurityStack', {
        environmentSuffix: 'security-test',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      // Check that IAM policies don't have overly broad permissions
      const policies = template.findResources('AWS::IAM::Policy');
      
      Object.values(policies).forEach(policy => {
        const statements = policy?.Properties?.PolicyDocument?.Statement || [];
        statements.forEach((statement: any) => {
          if (statement.Effect === 'Allow' && statement.Action) {
            // Check that we're not using * for all actions
            const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
            const hasWildcardAction = actions.some((action: string) => action === '*');
            
            // CodeDeploy role might need broader permissions, but others shouldn't
            if (!JSON.stringify(policy).includes('codedeploy')) {
              expect(hasWildcardAction).toBe(false);
            }
          }
        });
      });
    });

    test('S3 bucket has proper security settings', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'S3SecurityStack', {
        environmentSuffix: 's3-security',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      // Check S3 buckets have all security features enabled
      const buckets = template.findResources('AWS::S3::Bucket');
      
      Object.values(buckets).forEach(bucket => {
        const props = bucket?.Properties || {};
        
        // Should have versioning enabled
        expect(props.VersioningConfiguration?.Status).toBe('Enabled');
        
        // Should have encryption
        expect(props.BucketEncryption?.ServerSideEncryptionConfiguration).toBeDefined();
        
        // Should block public access
        expect(props.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(props.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(props.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(props.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      });
    });

    test('security groups have appropriate ingress rules', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'SGStack', {
        environmentSuffix: 'sg-test',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      // Check security groups
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      
      Object.values(securityGroups).forEach(sg => {
        const ingressRules = sg?.Properties?.SecurityGroupIngress || [];
        
        ingressRules.forEach((rule: any) => {
          // If rule allows access from 0.0.0.0/0, it should only be for ALB on standard ports
          if (rule.CidrIp === '0.0.0.0/0') {
            const description = sg?.Properties?.GroupDescription || '';
            if (description.includes('Load Balancer')) {
              // ALB can have public access on 80/443
              expect([80, 443]).toContain(rule.FromPort);
            }
          }
        });
      });
    });
  });

  describe('Resource Cleanup', () => {
    test('all resources have deletion policies for cleanup', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'CleanupStack', {
        environmentSuffix: 'cleanup-test',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      // Check S3 buckets have delete policy
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.DeletionPolicy).toBe('Delete');
        expect(bucket.UpdateReplacePolicy).toBe('Delete');
      });
      
      // Check CloudWatch Log Groups have delete policy
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach(logGroup => {
        expect(logGroup.DeletionPolicy).toBe('Delete');
        expect(logGroup.UpdateReplacePolicy).toBe('Delete');
      });
      
      // Check for S3 auto-delete custom resource
      const autoDeleteResources = template.findResources('Custom::S3AutoDeleteObjects');
      expect(Object.keys(autoDeleteResources).length).toBeGreaterThan(0);
    });
  });

  describe('Monitoring and Logging', () => {
    test('CloudWatch Log Groups are created for all services', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'LoggingStack', {
        environmentSuffix: 'logging-test',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      // Check CodeBuild has log group
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/codebuild/ci-cd-project-logging-test'
      });
      
      // Check log retention is set
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach(logGroup => {
        expect(logGroup?.Properties?.RetentionInDays).toBeDefined();
        expect(logGroup?.Properties?.RetentionInDays).toBeGreaterThan(0);
      });
    });

    test('EventBridge rules are configured for monitoring', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'MonitoringStack', {
        environmentSuffix: 'monitoring-test',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      // Check EventBridge rules exist
      const rules = template.findResources('AWS::Events::Rule');
      expect(Object.keys(rules).length).toBeGreaterThanOrEqual(2);
      
      // Check rules have targets
      Object.values(rules).forEach(rule => {
        expect(rule?.Properties?.Targets).toBeDefined();
        expect(rule?.Properties?.Targets?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Pipeline Configuration', () => {
    test('pipeline stages are configured correctly', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'PipelineStack', {
        environmentSuffix: 'pipeline-test',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      const pipelines = template.findResources('AWS::CodePipeline::Pipeline');
      const pipeline = Object.values(pipelines)[0];
      const stages = pipeline?.Properties?.Stages || [];
      
      // Should have at least Source, Build, Deploy stages
      const stageNames = stages.map((s: any) => s.Name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
      
      // Source stage should have S3 source action
      const sourceStage = stages.find((s: any) => s.Name === 'Source');
      expect(sourceStage?.Actions?.[0]?.ActionTypeId?.Provider).toBe('S3');
      
      // Build stage should have CodeBuild action
      const buildStage = stages.find((s: any) => s.Name === 'Build');
      expect(buildStage?.Actions?.[0]?.ActionTypeId?.Provider).toBe('CodeBuild');
      
      // Deploy stage should have CodeDeploy action
      const deployStage = stages.find((s: any) => s.Name === 'Deploy');
      expect(deployStage?.Actions?.[0]?.ActionTypeId?.Provider).toBe('CodeDeploy');
    });

    test('pipeline artifacts are configured', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'ArtifactsStack', {
        environmentSuffix: 'artifacts-test',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });
      const template = Template.fromStack(stack);
      
      const pipelines = template.findResources('AWS::CodePipeline::Pipeline');
      const pipeline = Object.values(pipelines)[0];
      
      // Should reference artifact bucket
      expect(pipeline?.Properties?.ArtifactStore).toBeDefined();
      expect(pipeline?.Properties?.ArtifactStore?.Type).toBe('S3');
    });
  });
});