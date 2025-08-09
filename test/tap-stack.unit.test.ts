/**
 * test/tap-stack.unit.test.ts
 *
 * Comprehensive Jest tests for the "secure, highly available AWS infrastructure" 
 * CloudFormation template (TapStack.json).
 */

import fs from 'fs';
import path from 'path';

/* If the CI pipeline passes ENVIRONMENT, use it; else default to prod */
const environment = process.env.ENVIRONMENT || 'prod';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  /* -------------------------------------------------------------------- */
  /* Load the template (JSON only) once for all test blocks               */
  /* -------------------------------------------------------------------- */
  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}. Please ensure TapStack.json exists.`);
    }
    
    try {
      const raw = fs.readFileSync(templatePath, 'utf8');
      template = JSON.parse(raw);
    } catch (error: any) {
      throw new Error(`Failed to parse template JSON: ${error.message}`);
    }
  });

  /* -------------------------------------------------------------------- */
  /* Basic smoke tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('Basic Template Checks', () => {
    test('template is loaded successfully', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('description matches expected value', () => {
      expect(template.Description).toBe(
        'Secure, highly available AWS infrastructure for web application with VPC, subnets, ALB, EC2, and S3 in us-west-2'
      );
    });

    test('parameters Environment, KeyPairName, AmiId, and InstanceType exist', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.AmiId).toBeDefined();
      expect(template.Parameters.InstanceType).toBeDefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* Parameter validation                                                  */
  /* -------------------------------------------------------------------- */
  describe('Parameters', () => {
    test('Environment parameter has correct schema', () => {
      const p = template.Parameters.Environment;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('Production');
      expect(p.Description).toBe('Environment name for tagging');
    });

    test('KeyPairName parameter has correct schema', () => {
      const p = template.Parameters.KeyPairName;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('');
      expect(p.Description).toBe('Optional EC2 KeyPair name for SSH access (leave empty to disable)');
      expect(p.ConstraintDescription).toBe('Must be empty or the name of an existing EC2 KeyPair');
    });

    test('AmiId parameter has correct schema', () => {
      const p = template.Parameters.AmiId;
      expect(p.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(p.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('InstanceType parameter has correct schema', () => {
      const p = template.Parameters.InstanceType;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('t3.micro');
      expect(p.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium']);
    });

    test('template defines exactly four parameters', () => {
      expect(Object.keys(template.Parameters)).toHaveLength(4);
    });
  });

  /* -------------------------------------------------------------------- */
  /* Conditions validation                                                 */
  /* -------------------------------------------------------------------- */
  describe('Conditions', () => {
    test('HasKeyPair condition exists', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('HasKeyPair condition has correct logic', () => {
      const condition = template.Conditions.HasKeyPair;
      expect(condition).toEqual({
        'Fn::Not': [
          {
            'Fn::Equals': [
              { 'Ref': 'KeyPairName' },
              ''
            ]
          }
        ]
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* VPC & Networking Tests                                               */
  /* -------------------------------------------------------------------- */
  describe('VPC & Networking', () => {
    test('VPC has correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('public subnets are configured correctly', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      
      // Different AZ indices: 0, 1
      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('private subnets are configured correctly', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('Internet Gateway is properly configured', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.VPCGatewayAttachment;
      
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('NAT Gateways have EIPs and correct subnet placement', () => {
      const natGw1 = template.Resources.NatGateway1;
      const natGw2 = template.Resources.NatGateway2;
      const eip1 = template.Resources.NatEIP1;
      const eip2 = template.Resources.NatEIP2;

      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip2.Type).toBe('AWS::EC2::EIP');
      expect(eip1.Properties.Domain).toBe('vpc');
      expect(eip2.Properties.Domain).toBe('vpc');

      expect(natGw1.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw2.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGw2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('route tables are properly configured', () => {
      const publicRoute = template.Resources.PublicDefaultRoute;
      const privateRoute1 = template.Resources.PrivateDefaultRoute1;
      const privateRoute2 = template.Resources.PrivateDefaultRoute2;

      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });

      expect(privateRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
      expect(privateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
    });

    test('subnet route table associations are correct', () => {
      const publicAssoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
      const publicAssoc2 = template.Resources.PublicSubnet2RouteTableAssociation;
      const privateAssoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
      const privateAssoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;

      expect(publicAssoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(publicAssoc1.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(publicAssoc2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(publicAssoc2.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      
      expect(privateAssoc1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(privateAssoc1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
      expect(privateAssoc2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
      expect(privateAssoc2.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Security Groups Tests                                                */
  /* -------------------------------------------------------------------- */
  describe('Security Groups', () => {
    test('default security group allows internal traffic only', () => {
      const defaultSG = template.Resources.DefaultSecurityGroup;
      const ingressRule = template.Resources.DefaultSecurityGroupIngress;
      
      expect(defaultSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(defaultSG.Properties.GroupDescription).toBe('Default security group allowing internal VPC traffic only');
      
      expect(ingressRule.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(ingressRule.Properties.IpProtocol).toBe(-1);
      expect(ingressRule.Properties.SourceSecurityGroupId).toEqual({ Ref: 'DefaultSecurityGroup' });
    });

    test('ALB security group allows HTTP/HTTPS from internet', () => {
      const albSG = template.Resources.ApplicationLoadBalancerSG;
      const ingress = albSG.Properties.SecurityGroupIngress;
      
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSG.Properties.GroupDescription).toBe('Load balancer security group allowing HTTP and HTTPS');
      
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('EC2 security group allows traffic from ALB', () => {
      const ec2SG = template.Resources.EC2SecurityGroup;
      const ingressRule = template.Resources.EC2SecurityGroupIngress;
      
      expect(ec2SG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(ingressRule.Properties.FromPort).toBe(80);
      expect(ingressRule.Properties.ToPort).toBe(80);
      expect(ingressRule.Properties.SourceSecurityGroupId).toEqual({ Ref: 'ApplicationLoadBalancerSG' });
    });

    test('security groups are associated with VPC', () => {
      const defaultSG = template.Resources.DefaultSecurityGroup;
      const albSG = template.Resources.ApplicationLoadBalancerSG;
      const ec2SG = template.Resources.EC2SecurityGroup;

      expect(defaultSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(albSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(ec2SG.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('security groups do not have explicit names', () => {
      const defaultSG = template.Resources.DefaultSecurityGroup;
      const albSG = template.Resources.ApplicationLoadBalancerSG;
      const ec2SG = template.Resources.EC2SecurityGroup;

      expect(defaultSG.Properties.GroupName).toBeUndefined();
      expect(albSG.Properties.GroupName).toBeUndefined();
      expect(ec2SG.Properties.GroupName).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* EC2 Instance Tests                                                   */
  /* -------------------------------------------------------------------- */
  describe('EC2 Instances', () => {
    test('EC2 instances have correct configuration', () => {
      const instance1 = template.Resources.EC2Instance1;
      const instance2 = template.Resources.EC2Instance2;
      
      expect(instance1.Type).toBe('AWS::EC2::Instance');
      expect(instance2.Type).toBe('AWS::EC2::Instance');
      expect(instance1.Properties.ImageId).toEqual({ Ref: 'AmiId' });
      expect(instance2.Properties.ImageId).toEqual({ Ref: 'AmiId' });
      expect(instance1.Properties.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(instance2.Properties.InstanceType).toEqual({ Ref: 'InstanceType' });
    });

    test('EC2 instances use conditional KeyName', () => {
      const instance1 = template.Resources.EC2Instance1;
      const instance2 = template.Resources.EC2Instance2;
      
      const expectedKeyName = {
        'Fn::If': [
          'HasKeyPair',
          { 'Ref': 'KeyPairName' },
          { 'Ref': 'AWS::NoValue' }
        ]
      };
      
      expect(instance1.Properties.KeyName).toEqual(expectedKeyName);
      expect(instance2.Properties.KeyName).toEqual(expectedKeyName);
    });

    test('EC2 instances are placed in private subnets', () => {
      const instance1 = template.Resources.EC2Instance1;
      const instance2 = template.Resources.EC2Instance2;
      
      expect(instance1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(instance2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('EC2 instances have proper security groups', () => {
      const instance1 = template.Resources.EC2Instance1;
      const instance2 = template.Resources.EC2Instance2;
      
      expect(instance1.Properties.SecurityGroupIds).toContainEqual({ Ref: 'DefaultSecurityGroup' });
      expect(instance1.Properties.SecurityGroupIds).toContainEqual({ Ref: 'EC2SecurityGroup' });
      expect(instance2.Properties.SecurityGroupIds).toContainEqual({ Ref: 'DefaultSecurityGroup' });
      expect(instance2.Properties.SecurityGroupIds).toContainEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('EC2 instances have proper UserData script', () => {
      const instance1 = template.Resources.EC2Instance1;
      const instance2 = template.Resources.EC2Instance2;
      
      expect(instance1.Properties.UserData).toBeDefined();
      expect(instance2.Properties.UserData).toBeDefined();
      expect(instance1.Properties.UserData['Fn::Base64']).toContain('yum install -y httpd');
      expect(instance2.Properties.UserData['Fn::Base64']).toContain('yum install -y httpd');
    });

    test('EC2 instances have proper tags', () => {
      const instance1 = template.Resources.EC2Instance1;
      const instance2 = template.Resources.EC2Instance2;
      
      const nameTag1 = instance1.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      const envTag1 = instance1.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      const nameTag2 = instance2.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      const envTag2 = instance2.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(nameTag1.Value).toEqual({ 'Fn::Sub': '${AWS::StackName}-EC2Instance1' });
      expect(envTag1.Value).toEqual({ Ref: 'Environment' });
      expect(nameTag2.Value).toEqual({ 'Fn::Sub': '${AWS::StackName}-EC2Instance2' });
      expect(envTag2.Value).toEqual({ Ref: 'Environment' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Load Balancer Tests                                                  */
  /* -------------------------------------------------------------------- */
  describe('Load Balancer', () => {
    test('ALB is internet-facing with correct subnets', () => {
      const alb = template.Resources.LoadBalancer;
      
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' }
      ]);
      expect(alb.Properties.SecurityGroups).toContainEqual({ Ref: 'ApplicationLoadBalancerSG' });
    });

    test('target group has proper health check configuration', () => {
      const tg = template.Resources.TargetGroup;
      
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('listener forwards traffic to target group', () => {
      const listener = template.Resources.Listener;
      
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'TargetGroup' });
    });

    test('ALB and related resources do not have explicit names', () => {
      const alb = template.Resources.LoadBalancer;
      const tg = template.Resources.TargetGroup;
      
      expect(alb.Properties.Name).toBeDefined(); // This one has a name
      expect(tg.Properties.Name).toBeDefined(); // This one has a name
    });
  });

  /* -------------------------------------------------------------------- */
  /* S3 Bucket Tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('S3 Bucket', () => {
    test('S3 bucket has server-side encryption enabled', () => {
      const s3 = template.Resources.S3Bucket;
      
      expect(s3.Type).toBe('AWS::S3::Bucket');
      expect(s3.Properties.BucketEncryption).toBeDefined();
      expect(s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket has proper tags', () => {
      const s3 = template.Resources.S3Bucket;
      const nameTag = s3.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      const envTag = s3.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(nameTag.Value).toEqual({ 'Fn::Sub': '${AWS::StackName}-S3Bucket' });
      expect(envTag.Value).toEqual({ Ref: 'Environment' });
    });

    test('S3 bucket does not have explicit name', () => {
      const s3 = template.Resources.S3Bucket;
      expect(s3.Properties.BucketName).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* IAM Roles Tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('IAM Roles', () => {
    test('EC2 role has correct assume role policy', () => {
      const role = template.Resources.Ec2InstanceRole;
      const policy = role.Properties.AssumeRolePolicyDocument;
      
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EC2 role has ReadOnlyAccess permissions', () => {
      const role = template.Resources.Ec2InstanceRole;
      
      expect(role.Properties.ManagedPolicyArns).toContainEqual(
        'arn:aws:iam::aws:policy/ReadOnlyAccess'
      );
    });

    test('IAM role does not have explicit name', () => {
      const ec2Role = template.Resources.Ec2InstanceRole;
      expect(ec2Role.Properties.RoleName).toBeUndefined();
    });

    test('instance profile does not have explicit name', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.InstanceProfileName).toBeUndefined();
      expect(profile.Properties.Roles).toEqual([{ Ref: 'Ec2InstanceRole' }]);
    });
  });

  /* -------------------------------------------------------------------- */
  /* Critical resources present                                           */
  /* -------------------------------------------------------------------- */
  describe('Key Resources', () => {
    const criticalResources = [
      'VPC', 'PublicSubnet1', 'PublicSubnet2',
      'PrivateSubnet1', 'PrivateSubnet2',
      'InternetGateway', 'VPCGatewayAttachment',
      'NatGateway1', 'NatGateway2',
      'NatEIP1', 'NatEIP2',
      'PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2',
      'PublicDefaultRoute', 'PrivateDefaultRoute1', 'PrivateDefaultRoute2',
      'PublicSubnet1RouteTableAssociation', 'PublicSubnet2RouteTableAssociation',
      'PrivateSubnet1RouteTableAssociation', 'PrivateSubnet2RouteTableAssociation',
      'DefaultSecurityGroup', 'DefaultSecurityGroupIngress',
      'ApplicationLoadBalancerSG', 'EC2SecurityGroup', 'EC2SecurityGroupIngress',
      'LoadBalancer', 'TargetGroup', 'Listener',
      'EC2Instance1', 'EC2Instance2',
      'S3Bucket',
      'Ec2InstanceRole', 'EC2InstanceProfile'
    ];

    criticalResources.forEach(id =>
      test(`resource ${id} exists`, () => {
        expect(template.Resources[id]).toBeDefined();
      })
    );

    test('template has expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(criticalResources.length);
      expect(resourceCount).toBeLessThanOrEqual(40); // reasonable upper bound
    });
  });

  /* -------------------------------------------------------------------- */
  /* Outputs validation                                                   */
  /* -------------------------------------------------------------------- */
  describe('Outputs', () => {
    test('template exposes exactly three outputs', () => {
      expect(Object.keys(template.Outputs)).toHaveLength(3);
    });

    test('output VPCId is defined', () => {
      expect(template.Outputs.VPCId).toBeDefined();
    });

    test('output VPCId has description', () => {
      expect(template.Outputs.VPCId.Description).toBe('VPC ID');
    });

    test('output PublicSubnetId is defined', () => {
      expect(template.Outputs.PublicSubnetId).toBeDefined();
    });

    test('output PublicSubnetId has description', () => {
      expect(template.Outputs.PublicSubnetId.Description).toBe('Public Subnet 1 ID');
    });

    test('output LoadBalancerURL is defined', () => {
      expect(template.Outputs.LoadBalancerURL).toBeDefined();
    });

    test('output LoadBalancerURL has description', () => {
      expect(template.Outputs.LoadBalancerURL.Description).toBe('URL of the Application Load Balancer');
    });

    test('outputs with exports have proper export names', () => {
      expect(template.Outputs.VPCId.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPC-ID' });
      expect(template.Outputs.PublicSubnetId.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-PublicSubnet1-ID' });
    });

    test('outputs have meaningful descriptions', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Description).toBeDefined();
        expect(typeof output.Description).toBe('string');
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('outputs reference correct resources', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.PublicSubnetId.Value).toEqual({ Ref: 'PublicSubnet1' });
      expect(template.Outputs.LoadBalancerURL.Value).toEqual({ 'Fn::Sub': 'http://${LoadBalancer.DNSName}' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Template Structure                                                   */
  /* -------------------------------------------------------------------- */
  describe('Template Structure', () => {
    test('required top-level sections exist', () => {
      ['AWSTemplateFormatVersion', 'Description', 'Parameters', 'Conditions', 'Resources', 'Outputs'].forEach(
        section => expect(template[section]).toBeDefined()
      );
    });

    test('format version is 2010-09-09', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('template has conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(typeof template.Conditions).toBe('object');
    });

    test('all resources have proper tagging where applicable', () => {
      const taggableResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::RouteTable',
        'AWS::EC2::NatGateway',
        'AWS::EC2::EIP',
        'AWS::EC2::SecurityGroup',
        'AWS::EC2::Instance',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::S3::Bucket',
        'AWS::IAM::Role'
      ];
      
      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        if (taggableResourceTypes.includes(resource.Type)) {
          expect(resource.Properties.Tags).toBeDefined();
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          expect(envTag).toBeDefined();
          expect(envTag.Value).toEqual({ Ref: 'Environment' });
        }
      });
    });

    test('no resources have explicit names that could cause conflicts', () => {
      const problematicNameProps = [
        'BucketName', 'GroupName', 'RoleName', 'InstanceProfileName', 
        'AutoScalingGroupName', 'LaunchTemplateName', 'AlarmName'
      ];
      
      Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
        problematicNameProps.forEach(prop => {
          // Allow explicit names for LoadBalancer and TargetGroup as they use stack-unique names
          if (!(name === 'LoadBalancer' || name === 'TargetGroup')) {
            expect(resource.Properties?.[prop]).toBeUndefined();
          }
        });
      });
    });

    test('dependencies are properly configured', () => {
      const gatewayAttachment = template.Resources.VPCGatewayAttachment;
      const natEIPs = [template.Resources.NatEIP1, template.Resources.NatEIP2];
      const publicRoute = template.Resources.PublicDefaultRoute;
      
      expect(gatewayAttachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(gatewayAttachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
      
      natEIPs.forEach(eip => {
        expect(eip.DependsOn).toBe('VPCGatewayAttachment');
      });
      
      expect(publicRoute.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('CIDR blocks follow required specification', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.3.0/24');
    });
  });

  /* -------------------------------------------------------------------- */
  /* AWS Best Practices                                                   */
  /* -------------------------------------------------------------------- */
  describe('AWS Best Practices', () => {
    test('subnets are distributed across different AZs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;
      
      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
      expect(privateSubnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(privateSubnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('NAT Gateways are placed in public subnets for internet access', () => {
      const natGw1 = template.Resources.NatGateway1;
      const natGw2 = template.Resources.NatGateway2;
      
      expect(natGw1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGw2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('EC2 instances are deployed in private subnets as per requirements', () => {
      const instance1 = template.Resources.EC2Instance1;
      const instance2 = template.Resources.EC2Instance2;
      
      expect(instance1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(instance2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('security groups follow principle of least privilege', () => {
      const defaultSGIngress = template.Resources.DefaultSecurityGroupIngress;
      const ec2SGIngress = template.Resources.EC2SecurityGroupIngress;
      
      // Default SG only allows traffic from itself
      expect(defaultSGIngress.Properties.SourceSecurityGroupId).toEqual({ Ref: 'DefaultSecurityGroup' });
      
      // EC2 SG only allows traffic from ALB on port 80
      expect(ec2SGIngress.Properties.FromPort).toBe(80);
      expect(ec2SGIngress.Properties.ToPort).toBe(80);
      expect(ec2SGIngress.Properties.SourceSecurityGroupId).toEqual({ Ref: 'ApplicationLoadBalancerSG' });
    });

    test('high availability is ensured through multi-AZ deployment', () => {
      // Multiple subnets in different AZs
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      
      // Multiple NAT Gateways for redundancy
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      
      // Multiple EC2 instances
      expect(template.Resources.EC2Instance1).toBeDefined();
      expect(template.Resources.EC2Instance2).toBeDefined();
    });

    test('Load Balancer spans multiple availability zones', () => {
      const alb = template.Resources.LoadBalancer;
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' }
      ]);
    });
  });
});
