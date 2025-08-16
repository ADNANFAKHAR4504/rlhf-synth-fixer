import fs from 'fs';
import path from 'path';

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

    test('should have a comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Production-ready single-region environment');
      expect(template.Description).toContain('VPC, ALB+ASG, RDS Multi-AZ, S3, AWS Config');
      expect(template.Description).toContain('No global resources');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
    });

    test('should not have unsupported sections', () => {
      expect(template.Mappings).toBeUndefined();
      expect(template.Transform).toBeUndefined();
    });
  });

  describe('Parameters - Comprehensive Validation', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentName', 'Region', 'VpcCidr', 'AZCount', 'PublicSubnetCidrs', 'PrivateSubnetCidrs',
        'S3BucketName', 'EnableS3Replication', 'ReplicationDestinationBucketArn',
        'DBSecretArn', 'DBInstanceClass', 'DBName', 'DBEngine', 'PostgresEngineVersion', 'MySqlEngineVersion',
        'DBDeletionProtection', 'EC2InstanceType', 'AsgMinSize', 'AsgMaxSize', 'AsgDesiredCapacity',
        'AllowedCidrIngress', 'HostedZoneId', 'ACMCertificateArn', 'Project', 'Owner'
      ];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Type).toBeDefined();
        expect(template.Parameters[param].Description).toBeDefined();
      });
    });

    describe('EnvironmentName Parameter', () => {
      test('should have correct configuration', () => {
        const param = template.Parameters.EnvironmentName;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('prod-regional');
        expect(param.Description).toBe('Environment name for tagging and resource names');
      });
    });

    describe('Region Parameter', () => {
      test('should default to current region', () => {
        const param = template.Parameters.Region;
        expect(param.Type).toBe('String');
        expect(param.Default).toEqual({ Ref: 'AWS::Region' });
        expect(param.Description).toBe('Stack region (defaults to current)');
      });
    });

    describe('VPC CIDR Parameter', () => {
      test('should have valid configuration and pattern', () => {
        const param = template.Parameters.VpcCidr;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('10.0.0.0/16');
        expect(param.AllowedPattern).toBe('^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$');
        expect(param.Description).toBe('CIDR block for the VPC');
      });
    });

    describe('AZ Count Parameter', () => {
      test('should have valid range constraints', () => {
        const param = template.Parameters.AZCount;
        expect(param.Type).toBe('Number');
        expect(param.MinValue).toBe(2);
        expect(param.MaxValue).toBe(3);
        expect(param.Default).toBe(2);
        expect(param.Description).toBe('Number of Availability Zones to use (2 or 3)');
      });
    });

    describe('Subnet CIDR Parameters', () => {
      test('should have correct configuration for public subnets', () => {
        const param = template.Parameters.PublicSubnetCidrs;
        expect(param.Type).toBe('CommaDelimitedList');
        expect(param.Default).toBe('10.0.1.0/24,10.0.2.0/24');
        expect(param.Description).toBe('CIDRs for public subnets in order of AZs');
      });

      test('should have correct configuration for private subnets', () => {
        const param = template.Parameters.PrivateSubnetCidrs;
        expect(param.Type).toBe('CommaDelimitedList');
        expect(param.Default).toBe('10.0.10.0/24,10.0.20.0/24');
        expect(param.Description).toBe('CIDRs for private subnets in order of AZs');
      });
    });

    describe('S3 Parameters', () => {
      test('should validate S3 bucket name parameter', () => {
        const param = template.Parameters.S3BucketName;
        expect(param.Type).toBe('String');
        expect(param.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
        expect(param.MinLength).toBe(3);
        expect(param.MaxLength).toBe(63);
        expect(param.Description).toBe('Globally-unique S3 bucket name');
      });

      test('should validate S3 replication parameters', () => {
        const enableParam = template.Parameters.EnableS3Replication;
        expect(enableParam.Type).toBe('String');
        expect(enableParam.Default).toBe('false');
        expect(enableParam.AllowedValues).toEqual(['true', 'false']);

        const destParam = template.Parameters.ReplicationDestinationBucketArn;
        expect(destParam.Type).toBe('String');
        expect(destParam.Default).toBe('');
        expect(destParam.Description).toBe('ARN of destination bucket for S3 replication (optional)');
      });
    });

    describe('Database Parameters', () => {
      test('should validate DB secret ARN parameter', () => {
        const param = template.Parameters.DBSecretArn;
        expect(param.Type).toBe('String');
        expect(param.Description).toBe('ARN of Secrets Manager secret JSON with keys username and password');
      });

      test('should have fixed DB instance class as per requirements', () => {
        const param = template.Parameters.DBInstanceClass;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('db.m5.large');
        expect(param.AllowedValues).toEqual(['db.m5.large']);
        expect(param.Description).toBe('RDS instance class (fixed by requirement)');
      });

      test('should validate database engine parameters', () => {
        const engineParam = template.Parameters.DBEngine;
        expect(engineParam.Type).toBe('String');
        expect(engineParam.Default).toBe('postgres');
        expect(engineParam.AllowedValues).toEqual(['postgres', 'mysql']);

        const pgParam = template.Parameters.PostgresEngineVersion;
        expect(pgParam.Type).toBe('String');
        expect(pgParam.Default).toBe('14.11');
        expect(pgParam.AllowedPattern).toBe('^(1[0-9]|[0-9])([.][0-9]+){0,2}$');

        const mysqlParam = template.Parameters.MySqlEngineVersion;
        expect(mysqlParam.Type).toBe('String');
        expect(mysqlParam.Default).toBe('8.0.35');
        expect(mysqlParam.AllowedPattern).toBe('^[0-9]+([.][0-9]+){1,2}$');
      });

      test('should validate DB deletion protection parameter', () => {
        const param = template.Parameters.DBDeletionProtection;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('true');
        expect(param.AllowedValues).toEqual(['true', 'false']);
      });
    });

    describe('EC2 and Auto Scaling Parameters', () => {
      test('should have fixed EC2 instance type as per requirements', () => {
        const param = template.Parameters.EC2InstanceType;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('t3.medium');
        expect(param.AllowedValues).toEqual(['t3.medium']);
        expect(param.Description).toBe('EC2 instance type (fixed by requirement)');
      });

      test('should validate Auto Scaling Group parameters', () => {
        const minParam = template.Parameters.AsgMinSize;
        expect(minParam.Type).toBe('Number');
        expect(minParam.Default).toBe(2);
        expect(minParam.MinValue).toBe(2);

        const maxParam = template.Parameters.AsgMaxSize;
        expect(maxParam.Type).toBe('Number');
        expect(maxParam.Default).toBe(6);
        expect(maxParam.MinValue).toBe(2);

        const desiredParam = template.Parameters.AsgDesiredCapacity;
        expect(desiredParam.Type).toBe('Number');
        expect(desiredParam.Default).toBe(2);
        expect(desiredParam.MinValue).toBe(2);
      });
    });

    describe('Network Security and DNS Parameters', () => {
      test('should validate allowed CIDR parameter', () => {
        const param = template.Parameters.AllowedCidrIngress;
        expect(param.Type).toBe('CommaDelimitedList');
        expect(param.Default).toBe('0.0.0.0/0');
        expect(param.Description).toBe('CIDR(s) allowed for SSH/HTTP/HTTPS (first entry used)');
      });

      test('should validate optional Route53 and ACM parameters', () => {
        const zoneParam = template.Parameters.HostedZoneId;
        expect(zoneParam.Type).toBe('String');
        expect(zoneParam.Default).toBe('');
        expect(zoneParam.Description).toBe('Existing Route53 Hosted Zone ID to create ALIAS records (optional)');

        const certParam = template.Parameters.ACMCertificateArn;
        expect(certParam.Type).toBe('String');
        expect(certParam.Default).toBe('');
        expect(certParam.Description).toBe('Regional ACM certificate ARN for HTTPS on ALB (optional)');
      });
    });

    describe('Tagging Parameters', () => {
      test('should validate project and owner parameters', () => {
        const projectParam = template.Parameters.Project;
        expect(projectParam.Type).toBe('String');
        expect(projectParam.Default).toBe('MyProject');

        const ownerParam = template.Parameters.Owner;
        expect(ownerParam.Type).toBe('String');
        expect(ownerParam.Default).toBe('DevOps');
      });
    });
  });

  describe('Conditions - Comprehensive Logic', () => {
    test('should have all expected conditions', () => {
      const expectedConditions = [
        'EnableReplication', 'CreateRoute53Records', 'EnableHTTPS', 'UseThreeAZs', 'IsPostgres'
      ];
      expectedConditions.forEach(condition => {
        expect(template.Conditions[condition]).toBeDefined();
      });
    });

    test('EnableReplication condition should validate both replication parameters', () => {
      const condition = template.Conditions.EnableReplication;
      expect(condition['Fn::And']).toBeDefined();
      expect(condition['Fn::And']).toHaveLength(2);
      
      // Check first condition: EnableS3Replication === 'true'
      expect(condition['Fn::And'][0]).toEqual({
        'Fn::Equals': [{ Ref: 'EnableS3Replication' }, 'true']
      });

      // Check second condition: ReplicationDestinationBucketArn != ''
      expect(condition['Fn::And'][1]).toEqual({
        'Fn::Not': [{
          'Fn::Equals': [{ Ref: 'ReplicationDestinationBucketArn' }, '']
        }]
      });
    });

    test('CreateRoute53Records condition should check HostedZoneId', () => {
      const condition = template.Conditions.CreateRoute53Records;
      expect(condition).toEqual({
        'Fn::Not': [{
          'Fn::Equals': [{ Ref: 'HostedZoneId' }, '']
        }]
      });
    });

    test('EnableHTTPS condition should check ACMCertificateArn', () => {
      const condition = template.Conditions.EnableHTTPS;
      expect(condition).toEqual({
        'Fn::Not': [{
          'Fn::Equals': [{ Ref: 'ACMCertificateArn' }, '']
        }]
      });
    });

    test('UseThreeAZs condition should check AZCount parameter', () => {
      const condition = template.Conditions.UseThreeAZs;
      expect(condition).toEqual({
        'Fn::Equals': [{ Ref: 'AZCount' }, 3]
      });
    });

    test('IsPostgres condition should check DBEngine parameter', () => {
      const condition = template.Conditions.IsPostgres;
      expect(condition).toEqual({
        'Fn::Equals': [{ Ref: 'DBEngine' }, 'postgres']
      });
    });
  });

  describe('Resources - Comprehensive Infrastructure', () => {
    test('should have all core networking resources', () => {
      const networkingResources = [
        'VPC', 'InternetGateway', 'InternetGatewayAttachment',
        'PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3',
        'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3',
        'NatEip1', 'NatEip2', 'NatEip3',
        'NatGw1', 'NatGw2', 'NatGw3',
        'PublicRouteTable', 'PublicDefaultRoute',
        'PrivateRt1', 'PrivateRt2', 'PrivateRt3',
        'PrivateDefaultRoute1', 'PrivateDefaultRoute2', 'PrivateDefaultRoute3',
        'AssocPub1', 'AssocPub2', 'AssocPub3',
        'AssocPriv1', 'AssocPriv2', 'AssocPriv3',
        'PublicNacl', 'PublicNaclInbound', 'PublicNaclOutbound',
        'PrivateNacl', 'PrivateNaclInbound', 'PrivateNaclOutbound',
        'AssocPubNacl1', 'AssocPubNacl2', 'AssocPubNacl3',
        'AssocPrivNacl1', 'AssocPrivNacl2', 'AssocPrivNacl3'
      ];
      
      networkingResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have all security group resources', () => {
      const securityResources = [
        'ALBSecurityGroup', 'WebTierSecurityGroup', 'DatabaseSecurityGroup'
      ];
      
      securityResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
        expect(template.Resources[resource].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('should have all IAM resources', () => {
      const iamResources = [
        'EC2InstanceRole', 'EC2InstanceProfile', 'RDSMonitoringRole', 'S3ReplicationRole'
      ];
      
      iamResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have all compute and load balancing resources', () => {
      const computeResources = [
        'LaunchTemplate', 'ApplicationLoadBalancer', 'ALBTargetGroup',
        'ALBListenerHttp', 'ALBListenerHttps', 'AutoScalingGroup'
      ];
      
      computeResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have all database resources', () => {
      const dbResources = ['DBSubnetGroup', 'RDSInstance'];
      
      dbResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have all storage resources', () => {
      const storageResources = ['S3Bucket', 'S3BucketPolicyForConfig'];
      
      storageResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have all AWS Config resources', () => {
      const configResources = [
        'ConfigRecorder', 'ConfigDeliveryChannel', 'ConfigRecorderStatus',
        'ConfigRuleIamPasswordPolicy', 'ConfigRuleRdsMultiAz', 'ConfigRuleEc2NoPublicIp',
        'ConfigRuleS3NoPublicRead', 'ConfigRuleS3NoPublicWrite', 'ConfigRuleEc2ImdsV2'
      ];
      
      configResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have all Route53 resources (conditional)', () => {
      const route53Resources = ['AlbRecordA', 'AlbRecordAAAA'];
      
      route53Resources.forEach(resource => {
        const resourceDef = template.Resources[resource];
        expect(resourceDef).toBeDefined();
        expect(resourceDef.Condition).toBe('CreateRoute53Records');
        expect(resourceDef.Type).toBe('AWS::Route53::RecordSet');
      });
    });

    test('should have substantial number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(60);
    });

    describe('Conditional Resources', () => {
      test('third AZ resources should be conditional on UseThreeAZs', () => {
        const thirdAzResources = [
          'PublicSubnet3', 'PrivateSubnet3', 'NatEip3', 'NatGw3', 'PrivateRt3',
          'PrivateDefaultRoute3', 'AssocPub3', 'AssocPriv3', 'AssocPubNacl3', 'AssocPrivNacl3'
        ];
        
        thirdAzResources.forEach(resource => {
          expect(template.Resources[resource].Condition).toBe('UseThreeAZs');
        });
      });

      test('S3 replication role should be conditional on EnableReplication', () => {
        expect(template.Resources.S3ReplicationRole.Condition).toBe('EnableReplication');
      });

      test('HTTPS listener should be conditional on EnableHTTPS', () => {
        expect(template.Resources.ALBListenerHttps.Condition).toBe('EnableHTTPS');
      });

      test('Route53 records should be conditional on CreateRoute53Records', () => {
        expect(template.Resources.AlbRecordA.Condition).toBe('CreateRoute53Records');
        expect(template.Resources.AlbRecordAAAA.Condition).toBe('CreateRoute53Records');
      });
    });
  });

  describe('VPC and Networking Configuration', () => {
    test('VPC should have correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('Internet Gateway should be properly configured', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.InternetGatewayAttachment;
      
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('public subnets should be correctly configured', () => {
      ['PublicSubnet1', 'PublicSubnet2'].forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [index, { 'Fn::GetAZs': '' }]
        });
        expect(subnet.Properties.CidrBlock).toEqual({
          'Fn::Select': [index, { Ref: 'PublicSubnetCidrs' }]
        });
      });
    });

    test('private subnets should be correctly configured', () => {
      ['PrivateSubnet1', 'PrivateSubnet2'].forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
        expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
        expect(subnet.Properties.AvailabilityZone).toEqual({
          'Fn::Select': [index, { 'Fn::GetAZs': '' }]
        });
        expect(subnet.Properties.CidrBlock).toEqual({
          'Fn::Select': [index, { Ref: 'PrivateSubnetCidrs' }]
        });
      });
    });

    test('NAT Gateways should be properly configured', () => {
      ['NatGw1', 'NatGw2'].forEach((natName, index) => {
        const nat = template.Resources[natName];
        const eip = template.Resources[`NatEip${index + 1}`];
        
        expect(nat.Type).toBe('AWS::EC2::NatGateway');
        expect(nat.Properties.AllocationId).toEqual({
          'Fn::GetAtt': [`NatEip${index + 1}`, 'AllocationId']
        });
        expect(nat.Properties.SubnetId).toEqual({
          Ref: `PublicSubnet${index + 1}`
        });

        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.Properties.Domain).toBe('vpc');
        expect(eip.DependsOn).toBe('InternetGatewayAttachment');
      });
    });

    test('Route tables should be properly configured', () => {
      const publicRt = template.Resources.PublicRouteTable;
      expect(publicRt.Type).toBe('AWS::EC2::RouteTable');
      expect(publicRt.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const publicRoute = template.Resources.PublicDefaultRoute;
      expect(publicRoute.Type).toBe('AWS::EC2::Route');
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });

      ['PrivateRt1', 'PrivateRt2'].forEach((rtName, index) => {
        const privateRt = template.Resources[rtName];
        expect(privateRt.Type).toBe('AWS::EC2::RouteTable');
        expect(privateRt.Properties.VpcId).toEqual({ Ref: 'VPC' });

        const privateRoute = template.Resources[`PrivateDefaultRoute${index + 1}`];
        expect(privateRoute.Type).toBe('AWS::EC2::Route');
        expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(privateRoute.Properties.NatGatewayId).toEqual({
          Ref: `NatGw${index + 1}`
        });
      });
    });

    test('Network ACLs should be properly configured', () => {
      const publicNacl = template.Resources.PublicNacl;
      expect(publicNacl.Type).toBe('AWS::EC2::NetworkAcl');
      expect(publicNacl.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const publicInbound = template.Resources.PublicNaclInbound;
      expect(publicInbound.Type).toBe('AWS::EC2::NetworkAclEntry');
      expect(publicInbound.Properties.Protocol).toBe(-1);
      expect(publicInbound.Properties.RuleAction).toBe('allow');
      expect(publicInbound.Properties.CidrBlock).toBe('0.0.0.0/0');

      const privateNacl = template.Resources.PrivateNacl;
      expect(privateNacl.Type).toBe('AWS::EC2::NetworkAcl');

      const privateInbound = template.Resources.PrivateNaclInbound;
      expect(privateInbound.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
    });
  });

  describe('Security Groups Configuration', () => {
    test('ALB Security Group should allow HTTP/HTTPS from specified CIDR', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);
      
      // HTTP rule
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(80);
      expect(ingressRules[0].ToPort).toBe(80);
      expect(ingressRules[0].CidrIp).toEqual({
        'Fn::Select': [0, { Ref: 'AllowedCidrIngress' }]
      });

      // HTTPS rule
      expect(ingressRules[1].IpProtocol).toBe('tcp');
      expect(ingressRules[1].FromPort).toBe(443);
      expect(ingressRules[1].ToPort).toBe(443);
    });

    test('Web Tier Security Group should allow traffic from ALB and SSH', () => {
      const sg = template.Resources.WebTierSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(3);

      // HTTP from ALB
      expect(ingressRules[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(ingressRules[0].FromPort).toBe(80);

      // HTTPS from ALB
      expect(ingressRules[1].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(ingressRules[1].FromPort).toBe(443);

      // SSH from allowed CIDR
      expect(ingressRules[2].FromPort).toBe(22);
      expect(ingressRules[2].CidrIp).toEqual({
        'Fn::Select': [0, { Ref: 'AllowedCidrIngress' }]
      });
    });

    test('Database Security Group should only allow access from Web Tier', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);

      const rule = ingressRules[0];
      expect(rule.IpProtocol).toBe('tcp');
      expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'WebTierSecurityGroup' });
      
      // Should use conditional port based on database engine
      expect(rule.FromPort).toEqual({
        'Fn::If': ['IsPostgres', 5432, 3306]
      });
      expect(rule.ToPort).toEqual({
        'Fn::If': ['IsPostgres', 5432, 3306]
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EC2 Instance Role should have correct permissions', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(2);
      
      // S3 access policy
      const s3Policy = policies.find(p => p.PolicyName === 's3-access');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement).toHaveLength(2);

      // Secrets Manager policy
      const secretsPolicy = policies.find(p => p.PolicyName === 'secretsmanager-read-db');
      expect(secretsPolicy).toBeDefined();
      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toEqual(['secretsmanager:GetSecretValue']);
    });

    test('RDS Monitoring Role should have correct configuration', () => {
      const role = template.Resources.RDSMonitoringRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('monitoring.rds.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole');
    });

    test('S3 Replication Role should have correct permissions (conditional)', () => {
      const role = template.Resources.S3ReplicationRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Condition).toBe('EnableReplication');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('s3.amazonaws.com');
      
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      
      const policy = policies[0];
      expect(policy.PolicyName).toBe('s3-replication');
      expect(policy.PolicyDocument.Statement).toHaveLength(3);
    });

    test('EC2 Instance Profile should reference correct role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
    });
  });

  describe('Launch Template and Auto Scaling', () => {
    test('Launch Template should have secure configuration', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      
      const data = lt.Properties.LaunchTemplateData;
      expect(data.InstanceType).toEqual({ Ref: 'EC2InstanceType' });
      expect(data.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
      
      // Security configurations
      expect(data.MetadataOptions.HttpTokens).toBe('required');
      expect(data.MetadataOptions.HttpEndpoint).toBe('enabled');
      expect(data.MetadataOptions.HttpPutResponseHopLimit).toBe(2);
      
      // Encrypted storage
      expect(data.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
      expect(data.BlockDeviceMappings[0].Ebs.VolumeType).toBe('gp3');
      
      // Monitoring
      expect(data.Monitoring.Enabled).toBe(true);
    });

    test('Auto Scaling Group should be properly configured', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      
      expect(asg.Properties.MinSize).toEqual({ Ref: 'AsgMinSize' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'AsgMaxSize' });
      expect(asg.Properties.DesiredCapacity).toEqual({ Ref: 'AsgDesiredCapacity' });
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
      
      // Should be in private subnets
      const subnets = asg.Properties.VPCZoneIdentifier;
      expect(subnets[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(subnets[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('Application Load Balancer Configuration', () => {
    test('ALB should be correctly configured', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      
      // Should be in public subnets
      const subnets = alb.Properties.Subnets;
      expect(subnets[0]).toEqual({ Ref: 'PublicSubnet1' });
      expect(subnets[1]).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('Target Group should have proper health check configuration', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('HTTP Listener should be configured', () => {
      const listener = template.Resources.ALBListenerHttp;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });

    test('HTTPS Listener should be conditional', () => {
      const listener = template.Resources.ALBListenerHttps;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Condition).toBe('EnableHTTPS');
      expect(listener.Properties.Port).toBe(443);
      expect(listener.Properties.Protocol).toBe('HTTPS');
    });
  });

  describe('RDS Database Configuration', () => {
    test('DB Subnet Group should use private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      
      const subnets = subnetGroup.Properties.SubnetIds;
      expect(subnets[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(subnets[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('RDS Instance should have production-ready configuration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
      
      const props = rds.Properties;
      expect(props.MultiAZ).toBe(true);
      expect(props.StorageEncrypted).toBe(true);
      expect(props.StorageType).toBe('gp3');
      expect(props.AllocatedStorage).toBe(100);
      expect(props.BackupRetentionPeriod).toBe(7);
      expect(props.EnablePerformanceInsights).toBe(true);
      expect(props.MonitoringInterval).toBe(60);
      expect(props.PubliclyAccessible).toBe(false);
      expect(props.AutoMinorVersionUpgrade).toBe(true);
      expect(props.CopyTagsToSnapshot).toBe(true);
      
      // Should use Secrets Manager
      expect(props.MasterUsername['Fn::Sub']).toContain('secretsmanager');
      expect(props.MasterUserPassword['Fn::Sub']).toContain('secretsmanager');
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('S3 Bucket should have security configurations', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const props = bucket.Properties;
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
      expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      
      // Public access block
      const pab = props.PublicAccessBlockConfiguration;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
      
      // Ownership controls
      expect(props.OwnershipControls.Rules[0].ObjectOwnership).toBe('BucketOwnerPreferred');
    });

    test('S3 Replication should be conditional', () => {
      const bucket = template.Resources.S3Bucket;
      const replicationConfig = bucket.Properties.ReplicationConfiguration;
      
      expect(replicationConfig['Fn::If'][0]).toBe('EnableReplication');
      expect(replicationConfig['Fn::If'][2]).toEqual({ Ref: 'AWS::NoValue' });
      
      const replicationRule = replicationConfig['Fn::If'][1];
      expect(replicationRule.Rules[0].Status).toBe('Enabled');
    });

    test('S3 Bucket Policy should allow AWS Config', () => {
      const policy = template.Resources.S3BucketPolicyForConfig;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      
      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements).toHaveLength(2);
      
      expect(statements[0].Sid).toBe('AWSConfigBucketPermissionsCheck');
      expect(statements[1].Sid).toBe('AWSConfigBucketDelivery');
    });
  });

  describe('AWS Config Resources', () => {
    test('Config Recorder should be properly configured', () => {
      const recorder = template.Resources.ConfigRecorder;
      expect(recorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(false);
    });

    test('Config Delivery Channel should reference S3 bucket', () => {
      const channel = template.Resources.ConfigDeliveryChannel;
      expect(channel.Type).toBe('AWS::Config::DeliveryChannel');
      expect(channel.Properties.S3BucketName).toEqual({ Ref: 'S3Bucket' });
      expect(channel.DependsOn).toBe('ConfigRecorder');
    });

    test('All Config Rules should be defined', () => {
      const configRules = [
        'ConfigRuleIamPasswordPolicy',
        'ConfigRuleRdsMultiAz',
        'ConfigRuleEc2NoPublicIp',
        'ConfigRuleS3NoPublicRead',
        'ConfigRuleS3NoPublicWrite',
        'ConfigRuleEc2ImdsV2'
      ];
      
      configRules.forEach(ruleName => {
        const rule = template.Resources[ruleName];
        expect(rule.Type).toBe('AWS::Config::ConfigRule');
        expect(rule.Properties.Source.Owner).toBe('AWS');
      });
    });
  });

  describe('Route53 Configuration', () => {
    test('Route53 records should be conditional and properly configured', () => {
      const recordA = template.Resources.AlbRecordA;
      const recordAAAA = template.Resources.AlbRecordAAAA;
      
      [recordA, recordAAAA].forEach(record => {
        expect(record.Type).toBe('AWS::Route53::RecordSet');
        expect(record.Condition).toBe('CreateRoute53Records');
        expect(record.Properties.HostedZoneId).toEqual({ Ref: 'HostedZoneId' });
        expect(record.Properties.AliasTarget.DNSName).toEqual({
          'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
        });
        expect(record.Properties.AliasTarget.HostedZoneId).toEqual({
          'Fn::GetAtt': ['ApplicationLoadBalancer', 'CanonicalHostedZoneID']
        });
      });

      expect(recordA.Properties.Type).toBe('A');
      expect(recordAAAA.Properties.Type).toBe('AAAA');
    });
  });

  describe('Outputs - Fixed and Comprehensive', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VpcId', 'PublicSubnets', 'PrivateSubnets', 'SecurityGroups',
        'LaunchTemplateId', 'AsgName', 'AlbDnsName', 'S3BucketNameOut', 
        'S3BucketArnOut', 'RdsEndpoint', 'AwsConfigStatus'
      ];
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
      });
    });

    test('VPC outputs should reference correct resources', () => {
      const vpcOutput = template.Outputs.VpcId;
      expect(vpcOutput.Value).toEqual({ Ref: 'VPC' });
      expect(vpcOutput.Description).toBe('VPC ID');
    });

    test('Subnet outputs should handle conditional subnets', () => {
      const publicSubnets = template.Outputs.PublicSubnets;
      expect(publicSubnets.Value['Fn::Join'][1]).toHaveLength(3);
      expect(publicSubnets.Value['Fn::Join'][1][2]).toEqual({
        'Fn::If': ['UseThreeAZs', { Ref: 'PublicSubnet3' }, '']
      });

      const privateSubnets = template.Outputs.PrivateSubnets;
      expect(privateSubnets.Value['Fn::Join'][1]).toHaveLength(3);
      expect(privateSubnets.Value['Fn::Join'][1][2]).toEqual({
        'Fn::If': ['UseThreeAZs', { Ref: 'PrivateSubnet3' }, '']
      });
    });

    test('Security Groups output should list all security groups', () => {
      const sgOutput = template.Outputs.SecurityGroups;
      const expectedSGs = ['ALBSecurityGroup', 'WebTierSecurityGroup', 'DatabaseSecurityGroup'];
      
      expectedSGs.forEach((sg, index) => {
        expect(sgOutput.Value['Fn::Join'][1][index]).toEqual({ Ref: sg });
      });
    });

    test('ALB DNS name output should use GetAtt', () => {
      const output = template.Outputs.AlbDnsName;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
      expect(output.Description).toBe('ALB DNS name');
    });

    test('S3 bucket outputs should reference S3 resource correctly', () => {
      const nameOutput = template.Outputs.S3BucketNameOut;
      const arnOutput = template.Outputs.S3BucketArnOut;

      expect(nameOutput.Value).toEqual({ Ref: 'S3Bucket' });
      expect(nameOutput.Description).toBe('Regional S3 bucket name');

      // FIXED: The template uses Fn::GetAtt for S3 bucket ARN, not Fn::Sub
      expect(arnOutput.Value).toEqual({
        'Fn::GetAtt': ['S3Bucket', 'Arn']
      });
      expect(arnOutput.Description).toBe('Regional S3 bucket ARN');
    });

    test('RDS endpoint output should use GetAtt', () => {
      const output = template.Outputs.RdsEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address']
      });
      expect(output.Description).toBe('RDS endpoint address');
    });

    test('Launch Template and ASG outputs should reference correct resources', () => {
      const ltOutput = template.Outputs.LaunchTemplateId;
      expect(ltOutput.Value).toEqual({ Ref: 'LaunchTemplate' });

      const asgOutput = template.Outputs.AsgName;
      expect(asgOutput.Value).toEqual({ Ref: 'AutoScalingGroup' });
    });

    test('AWS Config status output should reference recorder status', () => {
      const output = template.Outputs.AwsConfigStatus;
      expect(output.Value).toEqual({ Ref: 'ConfigRecorderStatus' });
      expect(output.Description).toBe('AWS Config recorder status');
    });
  });

  describe('Tagging Strategy', () => {
    test('VPC should have comprehensive tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      
      const expectedTags = ['Name', 'Environment', 'Project', 'Owner', 'Region'];
      expectedTags.forEach(tagKey => {
        const tag = tags.find((t: any) => t.Key === tagKey);
        expect(tag).toBeDefined();
      });

      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': '${EnvironmentName}-vpc' });
    });

    test('Auto Scaling Group should propagate tags to instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      const tags = asg.Properties.Tags;
      
      tags.forEach((tag: any) => {
        expect(tag.PropagateAtLaunch).toBe(true);
      });
    });

    test('Resources should use EnvironmentName for consistent naming', () => {
      const resourcesWithNaming = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PrivateSubnet1',
        'ApplicationLoadBalancer', 'LaunchTemplate', 'RDSInstance'
      ];
      
      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          expect(nameTag?.Value['Fn::Sub']).toContain('${EnvironmentName}');
        }
      });
    });
  });

  describe('Security and Compliance', () => {
    test('All storage should be encrypted', () => {
      // RDS encryption
      expect(template.Resources.RDSInstance.Properties.StorageEncrypted).toBe(true);
      
      // EBS encryption
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
      
      // S3 encryption
      const s3 = template.Resources.S3Bucket;
      expect(s3.Properties.BucketEncryption).toBeDefined();
    });

    test('RDS should have deletion protection and backups', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DeletionProtection).toEqual({
        'Fn::Equals': [{ Ref: 'DBDeletionProtection' }, 'true']
      });
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.DeletionPolicy).toBe('Snapshot');
    });

    test('EC2 instances should not have public IPs', () => {
      const asg = template.Resources.AutoScalingGroup;
      // ASG is in private subnets
      expect(asg.Properties.VPCZoneIdentifier[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('IMDSv2 should be enforced', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpTokens).toBe('required');
    });

    test('S3 bucket should block all public access', () => {
      const s3 = template.Resources.S3Bucket;
      const pab = s3.Properties.PublicAccessBlockConfiguration;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Template Validation and Structure', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      expect(template.Conditions).not.toBeNull();
    });

    test('should have comprehensive parameter coverage', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(25); // Exact count of parameters
    });

    test('should have comprehensive resource coverage', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(69); // Exact count of resources
    });

    test('should have comprehensive output coverage', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11); // Exact count of outputs
    });

    test('should have all expected conditions', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(5); // Exact count of conditions
    });
  });

  describe('Edge Cases and Validation', () => {
    test('template should handle AWS::NoValue for conditional resources', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const subnets = alb.Properties.Subnets;
      expect(subnets[2]['Fn::If'][2]).toEqual({ Ref: 'AWS::NoValue' });
    });

    test('parameters with patterns should have valid regex', () => {
      const vpcCidr = template.Parameters.VpcCidr.AllowedPattern;
      const s3BucketName = template.Parameters.S3BucketName.AllowedPattern;
      const postgresVersion = template.Parameters.PostgresEngineVersion.AllowedPattern;
      const mysqlVersion = template.Parameters.MySqlEngineVersion.AllowedPattern;
      
      // These should be valid regex patterns
      expect(() => new RegExp(vpcCidr)).not.toThrow();
      expect(() => new RegExp(s3BucketName)).not.toThrow();
      expect(() => new RegExp(postgresVersion)).not.toThrow();
      expect(() => new RegExp(mysqlVersion)).not.toThrow();
    });

    test('conditional resources should have proper condition references', () => {
      const conditionalResources = [
        { resource: 'PublicSubnet3', condition: 'UseThreeAZs' },
        { resource: 'S3ReplicationRole', condition: 'EnableReplication' },
        { resource: 'ALBListenerHttps', condition: 'EnableHTTPS' },
        { resource: 'AlbRecordA', condition: 'CreateRoute53Records' }
      ];

      conditionalResources.forEach(({ resource, condition }) => {
        expect(template.Resources[resource].Condition).toBe(condition);
        expect(template.Conditions[condition]).toBeDefined();
      });
    });

    test('resource dependencies should be properly defined', () => {
      // NAT EIPs should depend on IGW attachment
      expect(template.Resources.NatEip1.DependsOn).toBe('InternetGatewayAttachment');
      expect(template.Resources.NatEip2.DependsOn).toBe('InternetGatewayAttachment');
      
      // Config delivery channel should depend on recorder
      expect(template.Resources.ConfigDeliveryChannel.DependsOn).toBe('ConfigRecorder');
      
      // Public route should depend on IGW attachment
      expect(template.Resources.PublicDefaultRoute.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('all referenced resources should exist', () => {
      // This is a comprehensive test to ensure no broken references
      const resourceNames = Object.keys(template.Resources);
      
      // Check all Ref usage in resources
      JSON.stringify(template.Resources, (key, value) => {
        if (typeof value === 'object' && value !== null && value.Ref) {
          if (!template.Parameters[value.Ref] && !resourceNames.includes(value.Ref) && 
              !value.Ref.startsWith('AWS::')) {
            throw new Error(`Invalid reference: ${value.Ref}`);
          }
        }
        return value;
      });
    });
  });
});