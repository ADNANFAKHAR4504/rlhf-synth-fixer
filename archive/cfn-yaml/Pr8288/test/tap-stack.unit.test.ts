import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('Production Infrastructure CloudFormation Template Unit Tests', () => {
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
      expect(template.Description).toBe('production-ready infrastructure baseline with VPC, NLB, EC2, and S3');
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(typeof template.Conditions).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Conditions', () => {
    test('should have IsUsEast1 condition', () => {
      const condition = template.Conditions.IsUsEast1;
      expect(condition).toBeDefined();
      expect(condition).toEqual({
        'Fn::Equals': [{ Ref: 'AWS::Region' }, 'us-east-1']
      });
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Condition).toBe('IsUsEast1');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.Tags).toEqual([{ Key: 'Environment', Value: 'Production' }]);
    });

    test('should have two public subnets in different AZs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();

      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Condition).toBe('IsUsEast1');
      expect(publicSubnet2.Condition).toBe('IsUsEast1');

      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.0.0/24');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.1.0/24');

      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have two private subnets in different AZs', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet2).toBeDefined();

      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Condition).toBe('IsUsEast1');
      expect(privateSubnet2.Condition).toBe('IsUsEast1');

      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.3.0/24');

      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have Internet Gateway properly configured', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(igw.Condition).toBe('IsUsEast1');
      expect(igw.Properties.Tags).toEqual([{ Key: 'Environment', Value: 'Production' }]);
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Condition).toBe('IsUsEast1');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    // NAT Gateway resources removed for LocalStack compatibility
    // In production, NAT Gateway would be added back for private subnet internet access
    test('should not have NAT Gateway resources (removed for LocalStack compatibility)', () => {
      expect(template.Resources.NatEIP).toBeUndefined();
      expect(template.Resources.NatGateway).toBeUndefined();
      expect(template.Resources.PrivateRoute).toBeUndefined();
    });

    test('should have proper route tables and routes', () => {
      const publicRouteTable = template.Resources.PublicRouteTable;
      const privateRouteTable = template.Resources.PrivateRouteTable;
      const publicRoute = template.Resources.PublicRoute;

      expect(publicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(publicRouteTable.Condition).toBe('IsUsEast1');
      expect(privateRouteTable.Condition).toBe('IsUsEast1');

      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(publicRoute.DependsOn).toBe('VPCGatewayAttachment');

      // Private route to NAT Gateway removed for LocalStack compatibility
    });

    test('should have subnet route table associations', () => {
      const associations = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation'
      ];

      associations.forEach(assocName => {
        const association = template.Resources[assocName];
        expect(association).toBeDefined();
        expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(association.Condition).toBe('IsUsEast1');
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have CloudWatch Log Group for Flow Logs', () => {
      const logGroup = template.Resources.FlowLogsLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Condition).toBe('IsUsEast1');
      expect(logGroup.Properties.LogGroupName).toBe('FlowLogsGroup');
      expect(logGroup.Properties.Tags).toEqual([{ Key: 'Environment', Value: 'Production' }]);
    });

    test('should have IAM role for Flow Logs', () => {
      const role = template.Resources.FlowLogsRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Condition).toBe('IsUsEast1');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');

      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('FlowLogsPublishPolicy');
      expect(policy.PolicyDocument.Statement[0].Action).toEqual([
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams',
        'logs:PutLogEvents'
      ]);
    });

    test('should have VPC Flow Log configured', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog).toBeDefined();
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Condition).toBe('IsUsEast1');
      expect(flowLog.Properties.ResourceId).toEqual({ Ref: 'VPC' });
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.Properties.LogGroupName).toEqual({ Ref: 'FlowLogsLogGroup' });
    });
  });

  describe('Security Groups', () => {
    test('should have public instance security group', () => {
      const publicSG = template.Resources.PublicInstanceSG;
      expect(publicSG).toBeDefined();
      expect(publicSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(publicSG.Condition).toBe('IsUsEast1');
      expect(publicSG.Properties.GroupDescription).toBe('Allow SSH from 203.0.113.10/32');

      const ingressRule = publicSG.Properties.SecurityGroupIngress[0];
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(22);
      expect(ingressRule.ToPort).toBe(22);
      expect(ingressRule.CidrIp).toBe('203.0.113.10/32');

      const egressRule = publicSG.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe(-1);
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have private instance security group', () => {
      const privateSG = template.Resources.PrivateInstanceSG;
      expect(privateSG).toBeDefined();
      expect(privateSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(privateSG.Condition).toBe('IsUsEast1');
      expect(privateSG.Properties.GroupDescription).toBe('Allow SSH from 203.0.113.10/32; allow HTTP for NLB traffic');

      const ingressRules = privateSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);

      // SSH rule
      const sshRule = ingressRules[0];
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toBe('203.0.113.10/32');

      // HTTP rule for NLB
      const httpRule = ingressRules[1];
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role with proper configuration', () => {
      const instanceRole = template.Resources.InstanceRole;
      expect(instanceRole).toBeDefined();
      expect(instanceRole.Type).toBe('AWS::IAM::Role');
      expect(instanceRole.Condition).toBe('IsUsEast1');

      const assumePolicy = instanceRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have proper IAM policies for instance role', () => {
      const instanceRole = template.Resources.InstanceRole;
      const policy = instanceRole.Properties.Policies[0];

      expect(policy.PolicyName).toBe('InstancePolicy');
      expect(policy.PolicyDocument.Statement).toHaveLength(4);

      // EC2 describe permissions
      const ec2Statement = policy.PolicyDocument.Statement[0];
      expect(ec2Statement.Action).toEqual(['ec2:Describe*']);

      // S3 bucket permissions
      const s3BucketStatement = policy.PolicyDocument.Statement[1];
      expect(s3BucketStatement.Action).toEqual(['s3:ListBucket']);

      // S3 object permissions
      const s3ObjectStatement = policy.PolicyDocument.Statement[2];
      expect(s3ObjectStatement.Action).toEqual(['s3:GetObject', 's3:PutObject', 's3:DeleteObject']);

      // Logs and CloudWatch permissions
      const logsStatement = policy.PolicyDocument.Statement[3];
      expect(logsStatement.Action).toEqual([
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'cloudwatch:PutMetricData'
      ]);
    });

    test('should have instance profile', () => {
      const instanceProfile = template.Resources.InstanceProfile;
      expect(instanceProfile).toBeDefined();
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Condition).toBe('IsUsEast1');
      expect(instanceProfile.Properties.Roles).toEqual([{ Ref: 'InstanceRole' }]);
    });
  });

  describe('EC2 Instances', () => {
    test('should have public instance', () => {
      const publicInstance = template.Resources.PublicInstance;
      expect(publicInstance).toBeDefined();
      expect(publicInstance.Type).toBe('AWS::EC2::Instance');
      expect(publicInstance.Condition).toBe('IsUsEast1');
      expect(publicInstance.Properties.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
      expect(publicInstance.Properties.InstanceType).toBe('t2.micro');
      expect(publicInstance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(publicInstance.Properties.SecurityGroupIds).toEqual([{ Ref: 'PublicInstanceSG' }]);
      expect(publicInstance.Properties.IamInstanceProfile).toEqual({ Ref: 'InstanceProfile' });
    });

    test('should have two private instances', () => {
      const privateInstance1 = template.Resources.PrivateInstance1;
      const privateInstance2 = template.Resources.PrivateInstance2;

      expect(privateInstance1).toBeDefined();
      expect(privateInstance2).toBeDefined();

      expect(privateInstance1.Type).toBe('AWS::EC2::Instance');
      expect(privateInstance2.Type).toBe('AWS::EC2::Instance');
      expect(privateInstance1.Condition).toBe('IsUsEast1');
      expect(privateInstance2.Condition).toBe('IsUsEast1');

      expect(privateInstance1.Properties.InstanceType).toBe('t2.micro');
      expect(privateInstance2.Properties.InstanceType).toBe('t2.micro');

      expect(privateInstance1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(privateInstance2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });

      expect(privateInstance1.Properties.SecurityGroupIds).toEqual([{ Ref: 'PrivateInstanceSG' }]);
      expect(privateInstance2.Properties.SecurityGroupIds).toEqual([{ Ref: 'PrivateInstanceSG' }]);
    });
  });

  describe('Network Load Balancer Resources', () => {
    test('should have Network Load Balancer', () => {
      const nlb = template.Resources.NLB;
      expect(nlb).toBeDefined();
      expect(nlb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(nlb.Condition).toBe('IsUsEast1');
      expect(nlb.Properties.Type).toBe('network');
      expect(nlb.Properties.Scheme).toBe('internet-facing');
      expect(nlb.Properties.Subnets).toEqual([{ Ref: 'PublicSubnet1' }, { Ref: 'PublicSubnet2' }]);
    });

    test('should have target group with proper configuration', () => {
      const targetGroup = template.Resources.NLBTargetGroup;
      expect(targetGroup).toBeDefined();
      expect(targetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(targetGroup.Condition).toBe('IsUsEast1');
      expect(targetGroup.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(targetGroup.Properties.Protocol).toBe('TCP');
      expect(targetGroup.Properties.Port).toBe(80);
      expect(targetGroup.Properties.TargetType).toBe('instance');

      const targets = targetGroup.Properties.Targets;
      expect(targets).toHaveLength(2);
      expect(targets[0]).toEqual({ Id: { Ref: 'PrivateInstance1' }, Port: 80 });
      expect(targets[1]).toEqual({ Id: { Ref: 'PrivateInstance2' }, Port: 80 });
    });

    test('should have NLB listener', () => {
      const listener = template.Resources.NLBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Condition).toBe('IsUsEast1');
      expect(listener.Properties.LoadBalancerArn).toEqual({ Ref: 'NLB' });
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('TCP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'NLBTargetGroup' });
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket with proper configuration', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket).toBeDefined();
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(s3Bucket.Condition).toBe('IsUsEast1');

      const encryption = s3Bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Template Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCID',
        'SubnetIDs',
        'NLBDNSName',
        'TargetGroupARN',
        'PublicInstanceIdPublicIp',
        'S3BucketName',
        'FlowLogsLogGroupName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Condition).toBe('IsUsEast1');
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('outputs should have proper values', () => {
      expect(template.Outputs.VPCID.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.NLBDNSName.Value).toEqual({ 'Fn::GetAtt': ['NLB', 'DNSName'] });
      expect(template.Outputs.TargetGroupARN.Value).toEqual({ Ref: 'NLBTargetGroup' });
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'S3Bucket' });
      expect(template.Outputs.FlowLogsLogGroupName.Value).toEqual({ Ref: 'FlowLogsLogGroup' });
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Environment tag', () => {
      // NatEIP, NatGateway removed for LocalStack compatibility
      const taggedResources = [
        'VPC', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2',
        'InternetGateway', 'PublicRouteTable', 'PrivateRouteTable',
        'FlowLogsLogGroup', 'FlowLogsRole', 'VPCFlowLog', 'PublicInstanceSG', 'PrivateInstanceSG',
        'InstanceRole', 'PublicInstance', 'PrivateInstance1', 'PrivateInstance2',
        'NLB', 'NLBTargetGroup', 'S3Bucket'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const environmentTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          expect(environmentTag).toBeDefined();
          expect(environmentTag.Value).toBe('Production');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have proper resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      // 28 resources (NatEIP, NatGateway, PrivateRoute removed for LocalStack compatibility)
      expect(resourceCount).toBe(28);
    });

    test('all resources should have proper CloudFormation types', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });

    test('all conditional resources should have IsUsEast1 condition', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Condition).toBe('IsUsEast1');
      });
    });

    test('should not have any undefined references', () => {
      const jsonString = JSON.stringify(template);
      expect(jsonString).not.toContain('undefined');
      expect(jsonString).not.toContain('null');
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should block all public access', () => {
      const s3Bucket = template.Resources.S3Bucket;
      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('private subnets should not auto-assign public IPs', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('security groups should have specific CIDR restrictions', () => {
      const publicSG = template.Resources.PublicInstanceSG;
      const privateSG = template.Resources.PrivateInstanceSG;

      // Public SG should restrict SSH to specific IP
      const sshRule = publicSG.Properties.SecurityGroupIngress[0];
      expect(sshRule.CidrIp).toBe('203.0.113.10/32');

      // Private SG should restrict SSH to specific IP
      const privateSshRule = privateSG.Properties.SecurityGroupIngress[0];
      expect(privateSshRule.CidrIp).toBe('203.0.113.10/32');
    });

    test('IAM policies should follow least privilege', () => {
      const instanceRole = template.Resources.InstanceRole;
      const policy = instanceRole.Properties.Policies[0];

      // Check that we have specific actions, not wildcards
      policy.PolicyDocument.Statement.forEach((statement: any) => {
        if (Array.isArray(statement.Action)) {
          statement.Action.forEach((action: string) => {
            expect(action).not.toBe('*');
          });
        } else {
          expect(statement.Action).not.toBe('*');
        }
      });
    });

    test('VPC Flow Logs should be enabled', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog).toBeDefined();
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });
  });
});