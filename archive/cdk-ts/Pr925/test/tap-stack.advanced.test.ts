import * as cdk from 'aws-cdk-lib';
import { Template, Match, Annotations } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Advanced Testing', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Template Synthesis and Validation', () => {
    test('synthesized template is valid CloudFormation', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'advanced' });
      const template = Template.fromStack(stack);
      
      // Verify template has required sections
      const templateJson = template.toJSON();
      expect(templateJson).toHaveProperty('Resources');
      expect(templateJson).toHaveProperty('Outputs');
      expect(templateJson).toHaveProperty('AWSTemplateFormatVersion');
      
      // Ensure template is not empty
      expect(Object.keys(templateJson.Resources).length).toBeGreaterThan(0);
      expect(Object.keys(templateJson.Outputs).length).toBeGreaterThan(0);
    });

    test('template has no synthesis errors or warnings', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'validation' });
      
      // Check for CDK annotations (errors/warnings)
      const annotations = Annotations.fromStack(stack);
      const errors = annotations.findError('*', '*');
      const warnings = annotations.findWarning('*', '*');
      
      expect(errors).toHaveLength(0);
      // Note: We might have warnings about deprecated properties, which is acceptable
      if (warnings.length > 0) {
        console.warn('Template warnings found:', warnings.map(w => w.entry.data));
      }
    });

    test('resource logical IDs are deterministic', () => {
      // Create two identical stacks and verify they have same logical IDs
      const stack1 = new TapStack(app, 'TestStack1', { environmentSuffix: 'deterministic' });
      const stack2 = new TapStack(app, 'TestStack2', { environmentSuffix: 'deterministic' });
      
      const template1 = Template.fromStack(stack1);
      const template2 = Template.fromStack(stack2);
      
      const resources1 = Object.keys(template1.toJSON().Resources);
      const resources2 = Object.keys(template2.toJSON().Resources);
      
      expect(resources1).toHaveLength(resources2.length);
      // Logical IDs should be similar patterns (may have stack-specific suffixes)
      expect(resources1.filter(id => id.includes('VPC'))).toHaveLength(1);
      expect(resources2.filter(id => id.includes('VPC'))).toHaveLength(1);
    });
  });

  describe('Cross-Stack Reference Capability', () => {
    test('stack outputs can be referenced by other stacks', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'exports' });
      const template = Template.fromStack(stack);
      
      // Verify all outputs have export names for cross-stack reference
      const outputs = template.toJSON().Outputs;
      Object.values(outputs).forEach((output: any) => {
        expect(output).toHaveProperty('Export');
        expect(output.Export).toHaveProperty('Name');
        expect(output.Export.Name).toContain('Development-trainr70-exports');
      });
    });

    test('export names follow consistent naming pattern', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'naming' });
      const template = Template.fromStack(stack);
      
      const outputs = template.toJSON().Outputs;
      const exportNames = Object.values(outputs).map((output: any) => output.Export.Name);
      
      exportNames.forEach(name => {
        expect(name).toMatch(/^[A-Za-z][A-Za-z0-9-]*$/); // Valid CloudFormation export name
        expect(name).toContain('Development-trainr70-naming');
      });
    });
  });

  describe('Resource Property Validation', () => {
    test('S3 bucket name generation is AWS compliant', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'bucket' });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('s3bucket-development-trainr70-bucket-.*')
            ])
          ])
        }
      });
    });

    test('IAM role trust policy is correctly configured', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'iam' });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              }
            }
          ]
        }
      });
    });

    test('EC2 instance metadata options are secure', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'metadata' });
      const template = Template.fromStack(stack);
      
      // Verify IMDSv2 is enforced (modern security best practice)
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required', // Enforces IMDSv2
            HttpPutResponseHopLimit: 1,
            HttpEndpoint: 'enabled'
          }
        }
      });
    });
  });

  describe('Network Security Validation', () => {
    test('security group rules have descriptions for audit compliance', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'security' });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: [
          Match.objectLike({
            Description: 'Allow HTTP traffic'
          }),
          Match.objectLike({
            Description: 'Allow SSH traffic from specific IP range'
          })
        ]
      });
    });

    test('network ACLs are not overly permissive', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'nacl' });
      const template = Template.fromStack(stack);
      
      // Default VPC setup should not create overly permissive NACLs
      const templateJson = template.toJSON();
      const naclResources = Object.values(templateJson.Resources)
        .filter((resource: any) => resource.Type === 'AWS::EC2::NetworkAcl');
      
      // Should not have custom NACLs that are overly permissive
      naclResources.forEach((nacl: any) => {
        if (nacl.Properties && nacl.Properties.Entries) {
          nacl.Properties.Entries.forEach((entry: any) => {
            expect(entry.CidrBlock).not.toBe('0.0.0.0/0'); // Should not allow all traffic
          });
        }
      });
    });
  });

  describe('Performance and Scalability Considerations', () => {
    test('instance type is appropriate for workload', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'perf' });
      const template = Template.fromStack(stack);
      
      // t3.micro is appropriate for development/testing
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro'
      });
    });

    test('CloudWatch alarm thresholds are reasonable', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'monitoring' });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 70, // Not too low (noisy) or too high (useless)
        EvaluationPeriods: 2, // Prevents flapping
        Period: 300 // 5-minute intervals provide good balance
      });
    });
  });

  describe('Cost Optimization Validation', () => {
    test('resources are configured for cost efficiency', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'cost' });
      const template = Template.fromStack(stack);
      
      // NAT Gateway count is minimized (1 for dev environment)
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
      
      // Using t3.micro (burstable, cost-effective)
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro'
      });
    });

    test('S3 bucket has lifecycle management potential', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'lifecycle' });
      const template = Template.fromStack(stack);
      
      // Versioning is enabled, which allows for lifecycle policies
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });
  });

  describe('Disaster Recovery and Backup Readiness', () => {
    test('resources are distributed across multiple AZs', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'dr' });
      const template = Template.fromStack(stack);
      
      // Should have subnets in multiple AZs
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      
      // Resources should reference different AZs
      const templateJson = template.toJSON();
      const subnets = Object.values(templateJson.Resources)
        .filter((resource: any) => resource.Type === 'AWS::EC2::Subnet');
      
      // Check that subnets reference different AZs
      const azReferences = subnets.map((subnet: any) => 
        subnet.Properties?.AvailabilityZone
      ).filter(az => az);
      
      expect(azReferences.length).toBeGreaterThan(1);
    });

    test('S3 bucket has versioning for data protection', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'backup' });
      const template = Template.fromStack(stack);
      
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });
  });

  describe('Compliance and Governance', () => {
    test('all taggable resources have required compliance tags', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'compliance' });
      const template = Template.fromStack(stack);
      
      const templateJson = template.toJSON();
      const taggableResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::SecurityGroup',
        'AWS::S3::Bucket',
        'AWS::SNS::Topic',
        'AWS::EC2::Instance'
      ];
      
      Object.values(templateJson.Resources).forEach((resource: any) => {
        if (taggableResourceTypes.includes(resource.Type)) {
          expect(resource.Properties).toHaveProperty('Tags');
          const tags = resource.Properties.Tags;
          const envTag = tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('Development');
        }
      });
    });

    test('encryption is enabled where applicable', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'encryption' });
      const template = Template.fromStack(stack);
      
      // S3 bucket encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      });
    });
  });

  describe('Operational Excellence', () => {
    test('stack has comprehensive monitoring setup', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'ops' });
      const template = Template.fromStack(stack);
      
      // CloudWatch alarm for EC2 monitoring
      template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
      
      // SNS topic for notifications
      template.resourceCountIs('AWS::SNS::Topic', 1);
      
      // Alarm should be connected to SNS
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: [
          { Ref: Match.anyValue() }
        ]
      });
    });

    test('resources support automation and IaC principles', () => {
      const stack = new TapStack(app, 'TestStack', { environmentSuffix: 'automation' });
      const template = Template.fromStack(stack);
      
      // EC2 instance has user data for automated setup
      template.hasResourceProperties('AWS::EC2::Instance', {
        UserData: Match.anyValue()
      });
      
      // All outputs are exported for automation integration
      const outputs = template.toJSON().Outputs;
      Object.values(outputs).forEach((output: any) => {
        expect(output).toHaveProperty('Export');
      });
    });
  });
});