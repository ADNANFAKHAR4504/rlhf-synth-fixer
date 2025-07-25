import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Test the JSON template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-ready web application infrastructure with ALB, Auto Scaling, and comprehensive networking in us-east-1'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have correct region metadata', () => {
      const metadata = template.Metadata['AWS::CloudFormation::Designer'];
      expect(metadata.ApplicationMetadata.Region).toBe('us-east-1');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.ApplicationS3Bucket).toBeDefined();
      expect(template.Parameters.KeyName).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('LatestAmiId parameter should use SSM parameter', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('KeyName parameter should have correct default', () => {
      const param = template.Parameters.KeyName;
      expect(param.Type).toBe('AWS::EC2::KeyPair::KeyName');
      expect(param.Default).toBe('iac-rlhf-aws-trainer-instance');
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('Networking Resources', () => {
    test('should have VPC with correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have three public subnets in different AZs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      const subnet3 = template.Resources.PublicSubnet3;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet3.Type).toBe('AWS::EC2::Subnet');

      expect(subnet1.Properties.AvailabilityZone).toBe('us-east-1a');
      expect(subnet2.Properties.AvailabilityZone).toBe('us-east-1b');
      expect(subnet3.Properties.AvailabilityZone).toBe('us-east-1c');

      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('should have Internet Gateway and proper routing', () => {
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.DefaultPublicRoute.Type).toBe('AWS::EC2::Route');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group with HTTP/HTTPS access', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[1].FromPort).toBe(443);
      expect(ingress[1].ToPort).toBe(443);
    });

    test('should have EC2 security group with restricted access', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      
      // HTTP from ALB only
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      
      // SSH for management
      expect(ingress[1].FromPort).toBe(22);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 role with proper permissions', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('should have S3 access policy', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('S3ApplicationAccess');
    });

    test('should have instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have target group with health checks', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
    });

    test('should have HTTP and HTTPS listeners', () => {
      const httpListener = template.Resources.ALBHTTPListener;
      const httpsListener = template.Resources.ALBHTTPSListener;
      
      expect(httpListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(httpsListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      
      expect(httpListener.Properties.Port).toBe(80);
      expect(httpsListener.Properties.Port).toBe(443);
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have launch template with proper configuration', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.micro');
    });

    test('should have auto scaling group with correct size', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(4);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('should have scaling policies', () => {
      expect(template.Resources.ScaleUpPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(template.Resources.ScaleDownPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CPU alarms for scaling', () => {
      const highAlarm = template.Resources.CPUAlarmHigh;
      const lowAlarm = template.Resources.CPUAlarmLow;
      
      expect(highAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(lowAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      
      expect(highAlarm.Properties.Threshold).toBe(70);
      expect(lowAlarm.Properties.Threshold).toBe(25);
    });
  });

  describe('Outputs', () => {
    test('should have load balancer DNS output', () => {
      const output = template.Outputs.LoadBalancerDNSName;
      expect(output.Description).toBe('DNS name of the Application Load Balancer');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('should have application URLs', () => {
      expect(template.Outputs.ApplicationHTTPURL).toBeDefined();
      expect(template.Outputs.ApplicationHTTPSURL).toBeDefined();
    });

    test('should have VPC and ASG outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.AutoScalingGroupName).toBeDefined();
    });

    test('should export stack values', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Tags', () => {
    test('should have proper tags on resources', () => {
      const resources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicSubnet3',
        'ALBSecurityGroup',
        'EC2SecurityGroup',
        'EC2Role',
        'ApplicationLoadBalancer',
        'ALBTargetGroup'
      ];

      resources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          expect(resource.Properties.Tags).toContainEqual({
            Key: 'Environment',
            Value: 'Production'
          });
        }
      });
    });
  });
});

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TurnAroundPromptTableName output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableName',
      });
    });

    test('TurnAroundPromptTableArn output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableArn;
      expect(output.Description).toBe('ARN of the DynamoDB table');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableArn',
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have exactly one resource', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(1);
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly four outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });

  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });
});
