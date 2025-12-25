import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
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
      expect(template.Description).toBe('Cloud Environment Setup - Comprehensive AWS Infrastructure');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('should have SSHCidrBlock parameter', () => {
      expect(template.Parameters.SSHCidrBlock).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, prod)');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });

    test('SSHCidrBlock parameter should have correct properties', () => {
      const sshParam = template.Parameters.SSHCidrBlock;
      expect(sshParam.Type).toBe('String');
      expect(sshParam.Default).toBe('10.0.0.0/16');
      expect(sshParam.Description).toBe('CIDR block allowed for SSH access to EC2 instances');
      expect(sshParam.AllowedPattern).toBe('^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$');
    });
  });

  describe('VPC Configuration', () => {
    test('should have VPC with correct CIDR block', () => {
      expect(template.Resources.CloudEnvironmentVPC).toBeDefined();
      expect(template.Resources.CloudEnvironmentVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.CloudEnvironmentVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS enabled', () => {
      const vpc = template.Resources.CloudEnvironmentVPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway attachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Subnets', () => {
    test('should have two public subnets with correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets with correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });

    test('subnets should be in different availability zones', () => {
      const publicSub1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const publicSub2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      expect(publicSub1AZ).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(publicSub2AZ).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });

      const privateSub1AZ = template.Resources.PrivateSubnet1.Properties.AvailabilityZone;
      const privateSub2AZ = template.Resources.PrivateSubnet2.Properties.AvailabilityZone;
      expect(privateSub1AZ).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(privateSub2AZ).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });
  });

  describe('NAT Gateway', () => {
    test('should have NAT Gateway EIP', () => {
      expect(template.Resources.NatGatewayEIP).toBeDefined();
      expect(template.Resources.NatGatewayEIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatGatewayEIP.Properties.Domain).toBe('vpc');
    });

    test('should have NAT Gateway in public subnet', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });
  });

  describe('Route Tables', () => {
    test('should have public route table with internet gateway route', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(template.Resources.DefaultPublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have private route table with NAT gateway route', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(template.Resources.DefaultPrivateRoute.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway' });
    });

    test('should have correct route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('EC2 Instances', () => {
    test('should have EC2 instances in private subnets', () => {
      expect(template.Resources.EC2Instance1).toBeDefined();
      expect(template.Resources.EC2Instance1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      
      expect(template.Resources.EC2Instance2).toBeDefined();
      expect(template.Resources.EC2Instance2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should use Amazon Linux 2 AMI', () => {
      expect(template.Mappings.RegionMap['us-east-1'].AMI).toBeDefined();
      expect(template.Resources.EC2Instance1.Properties.ImageId).toEqual({
        'Fn::FindInMap': ['RegionMap', { Ref: 'AWS::Region' }, 'AMI']
      });
    });

    test('should use t3.micro instance type', () => {
      expect(template.Resources.EC2Instance1.Properties.InstanceType).toBe('t3.micro');
      expect(template.Resources.EC2Instance2.Properties.InstanceType).toBe('t3.micro');
    });

    test('should have IAM instance profile attached', () => {
      expect(template.Resources.EC2Instance1.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
      expect(template.Resources.EC2Instance2.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
    });
  });

  describe('Security', () => {
    test('should have security group for EC2 instances', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('security group should allow SSH access from specified CIDR', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(22);
      expect(ingressRules[0].ToPort).toBe(22);
      expect(ingressRules[0].CidrIp).toEqual({ Ref: 'SSHCidrBlock' });
    });

    test('should have IAM role for EC2 instances', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('IAM role should have S3 read permissions', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('S3ReadOnlyAccess');
      
      const statement = policies[0].PolicyDocument.Statement[0];
      expect(statement.Action).toContain('s3:GetObject');
      expect(statement.Action).toContain('s3:GetObjectVersion');
      expect(statement.Action).toContain('s3:ListBucket');
    });

    test('IAM role should have CloudWatch permissions', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });
  });

  describe('Monitoring', () => {
    test('should have SNS topic for alerts', () => {
      expect(template.Resources.AlertsTopic).toBeDefined();
      expect(template.Resources.AlertsTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have CloudWatch alarms for CPU usage', () => {
      expect(template.Resources.EC2Instance1CPUAlarm).toBeDefined();
      expect(template.Resources.EC2Instance2CPUAlarm).toBeDefined();
    });

    test('CloudWatch alarms should trigger at 80% CPU', () => {
      const alarm1 = template.Resources.EC2Instance1CPUAlarm;
      expect(alarm1.Properties.Threshold).toBe(80);
      expect(alarm1.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm1.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      
      const alarm2 = template.Resources.EC2Instance2CPUAlarm;
      expect(alarm2.Properties.Threshold).toBe(80);
      expect(alarm2.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm2.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have appropriate tags', () => {
      const resourcesWithTags = [
        'CloudEnvironmentVPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'NatGatewayEIP', 'NatGateway',
        'PublicRouteTable', 'PrivateRouteTable', 'EC2SecurityGroup', 'EC2Role',
        'EC2Instance1', 'EC2Instance2', 'AlertsTopic', 'EC2Instance1CPUAlarm',
        'EC2Instance2CPUAlarm', 'TurnAroundPromptTable'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const nameTag = tags.find((t: any) => t.Key === 'Name');
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          const projectTag = tags.find((t: any) => t.Key === 'Project');
          const costCenterTag = tags.find((t: any) => t.Key === 'CostCenter');
          
          expect(nameTag).toBeDefined();
          expect(envTag).toBeDefined();
          expect(projectTag).toBeDefined();
          expect(costCenterTag).toBeDefined();
        }
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
    });

    test('TurnAroundPromptTable should be a DynamoDB table', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TurnAroundPromptTable should have correct deletion policies', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('TurnAroundPromptTable should have correct properties', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.DeletionProtectionEnabled).toBe(false);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'EC2Instance1Id', 'EC2Instance2Id', 'EC2SecurityGroupId', 'EC2RoleArn',
        'SNSTopicArn', 'TurnAroundPromptTableName', 'TurnAroundPromptTableArn',
        'StackName', 'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // We have more than 20 resources
    });
  });
});