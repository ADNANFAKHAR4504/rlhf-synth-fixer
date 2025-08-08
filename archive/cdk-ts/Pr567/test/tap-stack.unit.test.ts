import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { MultiRegionStack } from '../lib/multi-region-stack';

describe('TapStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('TapStack creates multi-region stacks', () => {
    // Create the TapStack
    const stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: 'test' 
    });
    
    // Synthesize to get all stacks
    const assembly = app.synth();
    const stackNames = assembly.stacks.map(s => s.stackName);
    
    // Verify the main stack exists
    expect(stackNames).toContain('TestTapStack');
    
    // Verify multi-region stacks are created
    expect(stackNames).toContain('GlobalApp-USEast1-test');
    expect(stackNames).toContain('GlobalApp-EUWest1-test');
  });

  test('US East 1 stack has correct configuration', () => {
    const stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: 'test' 
    });
    
    // Get the US East 1 stack
    const usEast1Stack = app.node.findChild('GlobalApp-USEast1-test') as MultiRegionStack;
    const template = Template.fromStack(usEast1Stack);
    
    // Verify VPC is created
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true
    });
    
    // Verify IAM role for EC2
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: Match.objectLike({
              Service: 'ec2.amazonaws.com'
            })
          })
        ])
      })
    });
    
    // Verify S3 bucket
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled'
      },
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: Match.objectLike({
              SSEAlgorithm: 'AES256'
            })
          })
        ])
      })
    });
    
    // Verify Auto Scaling Group
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      MinSize: '1',
      MaxSize: '3'
    });
    
    // Verify Step Functions state machine (only in main region)
    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      StateMachineName: 'GlobalApp-MultiRegion-Orchestrator'
    });
  });

  test('EU West 1 stack has correct configuration', () => {
    const stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: 'test' 
    });
    
    // Get the EU West 1 stack
    const euWest1Stack = app.node.findChild('GlobalApp-EUWest1-test') as MultiRegionStack;
    const template = Template.fromStack(euWest1Stack);
    
    // Verify VPC is created with different CIDR
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.1.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true
    });
    
    // Verify S3 bucket
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    });
    
    // Verify Auto Scaling Group
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      MinSize: '1',
      MaxSize: '3'
    });
    
    // Verify NO Step Functions state machine in secondary region
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 0);
  });

  test('IAM policies have correct tag-based conditions', () => {
    const stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: 'test' 
    });
    
    const usEast1Stack = app.node.findChild('GlobalApp-USEast1-test') as MultiRegionStack;
    const template = Template.fromStack(usEast1Stack);
    
    // Verify IAM policy with tag conditions
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: Match.arrayWith([
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject'
            ]),
            Resource: 'arn:aws:s3:::*/*',
            Condition: {
              StringEquals: {
                's3:ExistingObjectTag/Accessible': 'true'
              }
            }
          }),
          Match.objectLike({
            Effect: 'Allow',
            Action: 's3:ListBucket',
            Resource: 'arn:aws:s3:::*',
            Condition: {
              StringEquals: {
                'aws:ResourceTag/Accessible': 'true'
              }
            }
          })
        ])
      })
    });
  });

  test('Resources have required tags', () => {
    const stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: 'test' 
    });
    
    const usEast1Stack = app.node.findChild('GlobalApp-USEast1-test') as MultiRegionStack;
    const template = Template.fromStack(usEast1Stack);
    
    // Check if stack has tags
    const stackTags = template.findResources('AWS::S3::Bucket');
    Object.values(stackTags).forEach(resource => {
      expect(resource.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: 'Production' }),
          expect.objectContaining({ Key: 'Project', Value: 'GlobalApp' }),
          expect.objectContaining({ Key: 'Accessible', Value: 'true' })
        ])
      );
    });
  });

  test('Launch template uses correct AMI and instance type', () => {
    const stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: 'test' 
    });
    
    const usEast1Stack = app.node.findChild('GlobalApp-USEast1-test') as MultiRegionStack;
    const template = Template.fromStack(usEast1Stack);
    
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: Match.objectLike({
        InstanceType: 't3.micro',
        UserData: Match.anyValue()
      })
    });
  });

  test('Security group allows outbound traffic', () => {
    const stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: 'test' 
    });
    
    const usEast1Stack = app.node.findChild('GlobalApp-USEast1-test') as MultiRegionStack;
    const template = Template.fromStack(usEast1Stack);
    
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for application instances',
      SecurityGroupEgress: [
        {
          CidrIp: '0.0.0.0/0',
          Description: 'Allow all outbound traffic by default',
          IpProtocol: '-1'
        }
      ]
    });
  });

  test('S3 buckets have RemovalPolicy.DESTROY', () => {
    const stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: 'test' 
    });
    
    const usEast1Stack = app.node.findChild('GlobalApp-USEast1-test') as MultiRegionStack;
    const template = Template.fromStack(usEast1Stack);
    
    // Check for auto-delete custom resource (indicates DESTROY policy)
    template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
      ServiceToken: Match.anyValue(),
      BucketName: Match.anyValue()
    });
  });

  test('TapStack uses default environment suffix when not provided', () => {
    // Create TapStack without environmentSuffix
    const stack = new TapStack(app, 'TestTapStackDefault');
    
    // Synthesize to get all stacks
    const assembly = app.synth();
    const stackNames = assembly.stacks.map(s => s.stackName);
    
    // Verify stacks are created with 'dev' suffix
    expect(stackNames).toContain('GlobalApp-USEast1-dev');
    expect(stackNames).toContain('GlobalApp-EUWest1-dev');
  });

  test('TapStack uses context environment suffix', () => {
    // Set context
    app.node.setContext('environmentSuffix', 'context-test');
    
    // Create TapStack without explicit environmentSuffix prop
    const stack = new TapStack(app, 'TestTapStackContext');
    
    // Synthesize to get all stacks
    const assembly = app.synth();
    const stackNames = assembly.stacks.map(s => s.stackName);
    
    // Verify stacks are created with context suffix
    expect(stackNames).toContain('GlobalApp-USEast1-context-test');
    expect(stackNames).toContain('GlobalApp-EUWest1-context-test');
  });
});
