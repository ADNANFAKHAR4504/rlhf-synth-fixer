import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Ensure this path is correct for your CloudFormation JSON template
    // This test expects a .json file, not .yml.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  //---## Template Structure
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a Description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
  });

  //---## Parameters
  describe('Parameters', () => {
    test('should have all defined parameters', () => {
      const params = [
        'ProjectName', 'Region1', 'VpcCidr1',
        'PublicSubnet1Cidr1', 'PrivateSubnet1Cidr1', 'PublicSubnet2Cidr1', 'PrivateSubnet2Cidr1',
        'InstanceType', 'AMI', 'DBInstanceType', 'DBAllocatedStorage',
        'DBUsername' // 👈 Added new DB parameters
      ];
      params.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('should have correct default values for ProjectName and Region1', () => {
      expect(template.Parameters.ProjectName.Default).toBe('TapStack');
      expect(template.Parameters.Region1.Default).toBe('us-east-1'); // 👈 Updated Region1 default to match YAML
    });

    test('should have correct default values for VPC and subnet CIDRs', () => {
      expect(template.Parameters.VpcCidr1.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.PublicSubnet1Cidr1.Default).toBe('10.0.1.0/24');
      expect(template.Parameters.PrivateSubnet1Cidr1.Default).toBe('10.0.2.0/24');
      expect(template.Parameters.PublicSubnet2Cidr1.Default).toBe('10.0.3.0/24');
      expect(template.Parameters.PrivateSubnet2Cidr1.Default).toBe('10.0.4.0/24');
    });

    test('should have correct default values for InstanceType, AMI, DBInstanceType, DBAllocatedStorage, DBUsername, and DBPassword', () => {
      expect(template.Parameters.InstanceType.Default).toBe('t2.micro');
      expect(template.Parameters.AMI.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(template.Parameters.AMI.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
      expect(template.Parameters.DBInstanceType.Default).toBe('db.t2.micro');
      expect(template.Parameters.DBAllocatedStorage.Default).toBe(20);
      expect(template.Parameters.DBUsername.Default).toBe('oracless'); // 👈 Added default for DBUsername
      expect(template.Parameters.DBUsername.NoEcho).toBe(true); // 👈 Check NoEcho property
    });
  });

  //---## Resources
  describe('Resources', () => {
    test('should have VpcR1 resource', () => { // 👈 Removed VpcR2 from test description
      expect(template.Resources.VpcR1).toBeDefined();
      expect(template.Resources.VpcR1.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VpcR1.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr1' });
    });

    test('should have all subnet resources for Region 1', () => { // 👈 Updated description for single region
      const subnets = [
        'PublicSubnet1R1', 'PublicSubnet2R1', 'PrivateSubnet1R1', 'PrivateSubnet2R1',
      ];
      subnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources[subnet].Properties.VpcId).toEqual({ Ref: 'VpcR1' });
        expect(template.Resources[subnet].Properties.CidrBlock).toEqual({ Ref: expect.stringContaining(subnet.replace('R1', 'Cidr1')) }); // 👈 Simplified CIDR Ref check
      });
      // Specific check for AvailabilityZone in Region 1 using Fn::Select
      expect(template.Resources.PublicSubnet1R1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
    });

    test('should have InternetGateway and attachment for Region 1', () => { // 👈 Updated description for single region
      expect(template.Resources.IgwR1).toBeDefined();
      expect(template.Resources.IgwR1.Type).toBe('AWS::EC2::InternetGateway');

      expect(template.Resources.IgwAttachmentR1).toBeDefined();
      expect(template.Resources.IgwAttachmentR1.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(template.Resources.IgwAttachmentR1.Properties.VpcId).toEqual({ Ref: 'VpcR1' });
    });

    test('should have NAT Gateway and EIP for Region 1', () => { // 👈 Updated description for single region
      expect(template.Resources.NatGwR1).toBeDefined();
      expect(template.Resources.NatGwR1.Type).toBe('AWS::EC2::NatGateway');

      expect(template.Resources.NatEipR1).toBeDefined();
      expect(template.Resources.NatEipR1.Type).toBe('AWS::EC2::EIP');

      expect(template.Resources.NatGwR1.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NatEipR1', 'AllocationId'] });
      expect(template.Resources.NatGwR1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1R1' });
    });

    test('should have route tables and associations for Region 1', () => { // 👈 Updated description for single region
      const routeTableTypes = ['PublicRouteTableR1', 'PrivateRouteTableR1'];
      routeTableTypes.forEach(rt => {
        expect(template.Resources[rt]).toBeDefined();
        expect(template.Resources[rt].Type).toBe('AWS::EC2::RouteTable');
        expect(template.Resources[rt].Properties.VpcId).toBeDefined();
      });

      const routeTypes = ['PublicRouteR1', 'PrivateRouteR1'];
      routeTypes.forEach(route => {
        expect(template.Resources[route]).toBeDefined();
        expect(template.Resources[route].Type).toBe('AWS::EC2::Route');
        expect(template.Resources[route].Properties.RouteTableId).toBeDefined();
        expect(template.Resources[route].Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      });

      expect(template.Resources.PublicRouteR1.Properties.GatewayId).toEqual({ Ref: 'IgwR1' });
      expect(template.Resources.PrivateRouteR1.Properties.NatGatewayId).toEqual({ Ref: 'NatGwR1' });

      const subnetAssocTypes = [
        'PublicSubnet1AssocR1', 'PublicSubnet2AssocR1', 'PrivateSubnet1AssocR1', 'PrivateSubnet2AssocR1',
      ];
      subnetAssocTypes.forEach(assoc => {
        expect(template.Resources[assoc]).toBeDefined();
        expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(template.Resources[assoc].Properties.SubnetId).toBeDefined();
        expect(template.Resources[assoc].Properties.RouteTableId).toBeDefined();
      });
    });

    test('should have security groups for Region 1', () => { // 👈 Updated description for single region
      const securityGroups = [
        'AlbSgR1', 'AppSgR1', 'DbSgR1',
      ];
      securityGroups.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
        expect(template.Resources[sg].Properties.VpcId).toBeDefined();
        expect(template.Resources[sg].Properties.SecurityGroupIngress).toBeDefined();
      });

      // --- Ingress rules updated to match YAML ---
      // AlbSgR1
      expect(template.Resources.AlbSgR1.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' }),
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 443, ToPort: 443, CidrIp: '0.0.0.0/0' })
        ])
      );
      // AppSgR1
      expect(template.Resources.AppSgR1.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 80, ToPort: 80, SourceSecurityGroupId: { 'Fn::GetAtt': ['AlbSgR1', 'GroupId'] } }),
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 22, ToPort: 22, CidrIp: '0.0.0.0/0' })
        ])
      );
      // DbSgR1
      expect(template.Resources.DbSgR1.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ IpProtocol: 'tcp', FromPort: 3306, ToPort: 3306, SourceSecurityGroupId: { 'Fn::GetAtt': ['AppSgR1', 'GroupId'] } })
        ])
      );
    });

    test('should have Application Load Balancer and related resources for Region 1', () => { // 👈 Updated description for single region
      const albs = [
        'AlbR1', 'AlbListenerR1', 'AlbTargetGroupR1',
      ];
      albs.forEach(alb => {
        expect(template.Resources[alb]).toBeDefined();
      });
      expect(template.Resources.AlbR1.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(template.Resources.AlbListenerR1.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(template.Resources.AlbTargetGroupR1.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');

      expect(template.Resources.AlbR1.Properties.Subnets.length).toBe(2);
      expect(template.Resources.AlbListenerR1.Properties.LoadBalancerArn).toEqual({ Ref: 'AlbR1' });
      expect(template.Resources.AlbListenerR1.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'AlbTargetGroupR1' });
      expect(template.Resources.AlbTargetGroupR1.Properties.VpcId).toEqual({ Ref: 'VpcR1' });
    });

    test('should have IAM Role and Instance Profile', () => {
      expect(template.Resources.Ec2InstanceRole).toBeDefined();
      expect(template.Resources.Ec2InstanceRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.Ec2InstanceProfile).toBeDefined();
      expect(template.Resources.Ec2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');

      expect(template.Resources.Ec2InstanceRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(template.Resources.Ec2InstanceRole.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(template.Resources.Ec2InstanceRole.Properties.Policies[0].PolicyName).toBe('S3AccessPolicy');
      expect(template.Resources.Ec2InstanceProfile.Properties.Roles).toEqual([{ Ref: 'Ec2InstanceRole' }]);
    });

    test('should have EC2 instances for Region 1', () => { // 👈 Updated description for single region
      const ec2Instances = [
        'AppInstance1R1', 'AppInstance2R1',
      ];
      ec2Instances.forEach(instance => {
        expect(template.Resources[instance]).toBeDefined();
        expect(template.Resources[instance].Type).toBe('AWS::EC2::Instance');
        expect(template.Resources[instance].Properties.ImageId).toEqual({ Ref: 'AMI' });
        expect(template.Resources[instance].Properties.InstanceType).toEqual({ Ref: 'InstanceType' });
        expect(template.Resources[instance].Properties.IamInstanceProfile).toEqual({ Ref: 'Ec2InstanceProfile' });
        expect(template.Resources[instance].Properties.SecurityGroupIds[0]).toEqual({ 'Fn::GetAtt': [expect.stringMatching(/AppSgR1/), 'GroupId'] }); // 👈 Simplified regex
        expect(template.Resources[instance].Properties.UserData).toBeDefined();
        expect(template.Resources[instance].Properties.UserData['Fn::Base64']['Fn::Sub']).toContain('yum install -y httpd');
      });
    });

    test('should have RDS instance and DBSubnetGroup for Region 1', () => { // 👈 Updated description for single region
      expect(template.Resources.RdsInstanceR1).toBeDefined();
      expect(template.Resources.RdsInstanceR1.Type).toBe('AWS::RDS::DBInstance');

      expect(template.Resources.RdsInstanceR1.Properties.Engine).toBe('mysql');
      expect(template.Resources.RdsInstanceR1.Properties.DBInstanceClass).toEqual({ Ref: 'DBInstanceType' });
      expect(template.Resources.RdsInstanceR1.Properties.AllocatedStorage).toEqual({ Ref: 'DBAllocatedStorage' });
      expect(template.Resources.RdsInstanceR1.Properties.MultiAZ).toBe(true);
      expect(template.Resources.RdsInstanceR1.Properties.VPCSecurityGroups[0]).toEqual({ 'Fn::GetAtt': ['DbSgR1', 'GroupId'] });
      expect(template.Resources.RdsInstanceR1.Properties.DBSubnetGroupName).toEqual({ Ref: 'DbSubnetGroupR1' });

      // 👈 Updated assertions to reflect direct parameter references
      expect(template.Resources.RdsInstanceR1.Properties.MasterUsername).toEqual({ Ref: 'DBUsername' });
      expect(template.Resources.DbSubnetGroupR1).toBeDefined();
      expect(template.Resources.DbSubnetGroupR1.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(template.Resources.DbSubnetGroupR1.Properties.SubnetIds.length).toBe(2);
    });
  });

  //--- Outputs
  describe('Outputs', () => {
    test('should have ALB DNS name output for Region 1', () => { // 👈 Updated description for single region
      expect(template.Outputs.AlbDnsNameR1).toBeDefined();
    });

    test('ALB DNS name output should reference correct resource', () => { // 👈 Updated description for single region
      expect(template.Outputs.AlbDnsNameR1.Value).toEqual({ 'Fn::GetAtt': ['AlbR1', 'DNSName'] });
    });
  });

  //---Template Validation
  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });
});