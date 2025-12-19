// import fs from 'fs';
// import path from 'path';
// import * as yaml from 'js-yaml';

// describe('TapStack CloudFormation Template Validation', () => {
//   let template: any;

//   beforeAll(() => {
//     try {
//       const templatePath = path.join(__dirname, '../lib/TapStack.yml');
//       const templateContent = fs.readFileSync(templatePath, 'utf8');

//       // Extend schema with CloudFormation intrinsics
//       const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
//         new yaml.Type('!Ref', { kind: 'scalar', construct: (data) => ({ Ref: data }) }),
//         new yaml.Type('!Sub', { kind: 'scalar', construct: (data) => ({ 'Fn::Sub': data }) }),
//         new yaml.Type('!GetAtt', { kind: 'scalar', construct: (data) => ({ 'Fn::GetAtt': data.split('.') }) }),
//         new yaml.Type('!Select', { kind: 'sequence', construct: (data) => ({ 'Fn::Select': data }) }),
//         new yaml.Type('!GetAZs', { kind: 'scalar', construct: (data) => ({ 'Fn::GetAZs': data }) })
//       ]);

//       template = yaml.load(templateContent, { schema: CFN_SCHEMA });
//       console.log('Successfully loaded CloudFormation template');
//     } catch (e) {
//       console.error('Error loading template:', e);
//       template = { Resources: {}, Outputs: {} }; // fallback
//     }
//   });

//   // --- Structure Tests ---
//   describe('Template Structure', () => {
//     test('should have Resources and Outputs sections', () => {
//       expect(template.Resources).toBeDefined();
//       expect(template.Outputs).toBeDefined();
//     });
//   });

//   // --- Networking Tests ---
//   describe('VPC and Subnets', () => {
//     test('MyVPC should exist with correct CIDR', () => {
//       const vpc = template.Resources.MyVPC;
//       expect(vpc.Type).toBe('AWS::EC2::VPC');
//       expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
//     });

//     test('Public and Private subnets should exist', () => {
//       expect(template.Resources.PublicSubnet1).toBeDefined();
//       expect(template.Resources.PublicSubnet2).toBeDefined();
//       expect(template.Resources.PrivateSubnet1).toBeDefined();
//       expect(template.Resources.PrivateSubnet2).toBeDefined();
//     });
//   });

//   // --- Security Group Tests ---
//   describe('Security Groups', () => {
//     test('ALBSecurityGroup should only allow HTTP (80)', () => {
//       const albSg = template.Resources.ALBSecurityGroup;
//       expect(albSg.Type).toBe('AWS::EC2::SecurityGroup');
//       const ingress = albSg.Properties.SecurityGroupIngress;
//       expect(ingress).toContainEqual({ IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' });
//       // Ensure no HTTPS 443 rule
//       ingress.forEach((rule: any) => {
//         expect(rule.FromPort).not.toBe(443);
//       });
//     });

//     test('RDSSecurityGroup should allow MySQL from EC2 SG', () => {
//       const rdsSg = template.Resources.RDSSecurityGroup;
//       expect(rdsSg.Type).toBe('AWS::EC2::SecurityGroup');
//       const rule = rdsSg.Properties.SecurityGroupIngress[0];
//       expect(rule.IpProtocol).toBe('tcp');
//       expect(rule.FromPort).toBe(3306);
//       expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
//     });
//   });

//   // --- ALB Tests ---
//   describe('Application Load Balancer', () => {
//     test('ALB should be internet-facing in public subnets', () => {
//       const alb = template.Resources.ApplicationLoadBalancer;
//       expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
//       expect(alb.Properties.Scheme).toBe('internet-facing');
//       expect(alb.Properties.Subnets).toEqual([{ Ref: 'PublicSubnet1' }, { Ref: 'PublicSubnet2' }]);
//     });

//     test('ALBListener should exist on port 80 (HTTP)', () => {
//       const listener = template.Resources.ALBListener;
//       expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
//       expect(listener.Properties.Port).toBe(80);
//       expect(listener.Properties.Protocol).toBe('HTTP');
//     });

//     test('SSL resources should be removed', () => {
//       const resources = template.Resources;
//       expect(resources.SSLCertificate).toBeUndefined();
//       expect(resources.ALBListenerHTTPS).toBeUndefined();
//     });
//   });

//   // --- RDS & Secrets Tests ---
//   describe('Database and Secrets', () => {
//     test('DBSecret should exist and generate password', () => {
//       const secret = template.Resources.DBSecret;
//       expect(secret.Type).toBe('AWS::SecretsManager::Secret');
//       expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(16);
//     });

//     test('RDSDatabase should use mysql engine', () => {
//       const db = template.Resources.RDSDatabase;
//       expect(db.Type).toBe('AWS::RDS::DBInstance');
//       expect(db.Properties.Engine).toBe('mysql');
//       expect(db.Properties.DBInstanceClass).toBe('db.t3.micro');
//     });
//   });

//   // --- Outputs Tests ---
//   describe('Outputs', () => {
//     test('LoadBalancerDNS should output ALB DNSName', () => {
//       const output = template.Outputs.LoadBalancerDNS;
//       expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
//     });

//     test('RDSInstanceEndpoint should output DB endpoint address', () => {
//       const output = template.Outputs.RDSInstanceEndpoint;
//       expect(output.Value).toEqual({ 'Fn::GetAtt': ['RDSDatabase', 'Endpoint', 'Address'] });
//     });

//     test('Should not output SSL Certificate Arn', () => {
//       expect(template.Outputs.SSLCertificateArn).toBeUndefined();
//     });
//   });
// });
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

type AnyObj = Record<string, any>;

describe('TapStack CloudFormation Template (HTTP-only) - Unit Tests', () => {
  let template: AnyObj;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');

    // Extend js-yaml to understand common CFN intrinsics used in your template
    const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!Ref', { kind: 'scalar', construct: (data: string) => ({ Ref: data }) }),
      new yaml.Type('!Sub', { kind: 'scalar', construct: (data: string) => ({ 'Fn::Sub': data }) }),
      new yaml.Type('!GetAtt', { kind: 'scalar', construct: (data: string) => ({ 'Fn::GetAtt': data.split('.') }) }),
      new yaml.Type('!Select', { kind: 'sequence', construct: (data: any[]) => ({ 'Fn::Select': data }) }),
      new yaml.Type('!GetAZs', { kind: 'scalar', construct: (data: string) => ({ 'Fn::GetAZs': data }) }),
      new yaml.Type('Fn::Base64', { kind: 'scalar', construct: (data: any) => ({ 'Fn::Base64': data }) }),
    ]);

    template = yaml.load(templateContent, { schema: CFN_SCHEMA }) as AnyObj;
    if (!template || typeof template !== 'object') throw new Error('Template parse failed');
  });

  const R = () => template.Resources as AnyObj;
  const O = () => template.Outputs as AnyObj;

  // ---------- Template Basics ----------
  describe('Template header & parameters', () => {
    test('format version & description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBe(
        'Example Infrastructure with EC2, ALB, RDS, and Secrets Manager (HTTP only, no SSL)'
      );
    });

    test('required parameters exist with expected defaults/types', () => {
      const p = template.Parameters;
      expect(p.EnvironmentName.Type).toBe('String');
      expect(p.EnvironmentName.Default).toBe('dev');

      expect(p.AmiId.Type).toBe('AWS::EC2::Image::Id');
      expect(p.AmiId.Default).toBeDefined();

      expect(p.EnvironmentSuffix.Type).toBe('String');
      expect(p.EnvironmentSuffix.Default).toBe('');
    });
  });

  // ---------- Networking ----------
  describe('VPC, Subnets, Routing, NAT', () => {
    test('VPC basics', () => {
      const vpc = R().MyVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Name', Value: { 'Fn::Sub': '${EnvironmentName}${EnvironmentSuffix}-vpc' } },
        ])
      );
    });

    test('InternetGateway + attachment', () => {
      expect(R().InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      const attach = R().VPCGatewayAttachment;
      expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attach.Properties.VpcId).toEqual({ Ref: 'MyVPC' });
      expect(attach.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('Public subnets with public IP mapping & AZs selection', () => {
      const s1 = R().PublicSubnet1;
      const s2 = R().PublicSubnet2;
      expect(s1.Type).toBe('AWS::EC2::Subnet');
      expect(s2.Type).toBe('AWS::EC2::Subnet');
      expect(s1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(s2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(s1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(s2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
      expect(s1.Properties.VpcId).toEqual({ Ref: 'MyVPC' });
      expect(s2.Properties.VpcId).toEqual({ Ref: 'MyVPC' });
    });

    test('Private subnets present with expected AZs', () => {
      const s1 = R().PrivateSubnet1;
      const s2 = R().PrivateSubnet2;
      expect(s1.Type).toBe('AWS::EC2::Subnet');
      expect(s2.Type).toBe('AWS::EC2::Subnet');
      expect(s1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(s2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('Public route table and default route to InternetGateway', () => {
      const rt = R().PublicRouteTable;
      expect(rt.Type).toBe('AWS::EC2::RouteTable');
      expect(rt.Properties.VpcId).toEqual({ Ref: 'MyVPC' });

      const route = R().PublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      // DependsOn present to ensure IGW attachment before route
      expect(route.DependsOn).toBe('VPCGatewayAttachment');
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });

      // Associations
      expect(R().PublicSubnet1RouteTableAssociation.Properties).toEqual({
        SubnetId: { Ref: 'PublicSubnet1' },
        RouteTableId: { Ref: 'PublicRouteTable' },
      });
      expect(R().PublicSubnet2RouteTableAssociation.Properties).toEqual({
        SubnetId: { Ref: 'PublicSubnet2' },
        RouteTableId: { Ref: 'PublicRouteTable' },
      });
    });

    test('NAT EIP and NAT Gateway in public subnet', () => {
      const eip = R().NATGatewayEIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.DependsOn).toBe('VPCGatewayAttachment');
      expect(eip.Properties.Domain).toBe('vpc');

      const nat = R().NATGateway;
      expect(nat.Type).toBe('AWS::EC2::NatGateway');
      expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(nat.Properties.AllocationId).toEqual({ 'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId'] });
    });

    test('Private route table -> NAT', () => {
      const prt = R().PrivateRouteTable;
      expect(prt.Type).toBe('AWS::EC2::RouteTable');
      expect(prt.Properties.VpcId).toEqual({ Ref: 'MyVPC' });

      const route = R().PrivateRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });

      // Associations
      expect(R().PrivateSubnet1RouteTableAssociation.Properties).toEqual({
        SubnetId: { Ref: 'PrivateSubnet1' },
        RouteTableId: { Ref: 'PrivateRouteTable' },
      });
      expect(R().PrivateSubnet2RouteTableAssociation.Properties).toEqual({
        SubnetId: { Ref: 'PrivateSubnet2' },
        RouteTableId: { Ref: 'PrivateRouteTable' },
      });
    });
  });

  // ---------- Security Groups ----------
  describe('Security Groups', () => {
    test('ALB SG allows HTTP/80 from anywhere', () => {
      const sg = R().ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'MyVPC' });
      expect(sg.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          { IpProtocol: 'tcp', FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' },
        ])
      );
    });

    test('EC2 SG allows HTTP/80 from ALB SG', () => {
      const sg = R().EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          { IpProtocol: 'tcp', FromPort: 80, ToPort: 80, SourceSecurityGroupId: { Ref: 'ALBSecurityGroup' } },
        ])
      );
    });

    test('RDS SG allows 3306 from EC2 SG', () => {
      const sg = R().RDSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      const rule = sg.Properties.SecurityGroupIngress?.[0];
      expect(rule).toMatchObject({
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        SourceSecurityGroupId: { Ref: 'EC2SecurityGroup' },
      });
    });
  });

  // ---------- S3, IAM ----------
  describe('Logs Bucket & IAM', () => {
    test('LogsBucket name uses Sub with AccountId', () => {
      const b = R().LogsBucket;
      expect(b.Type).toBe('AWS::S3::Bucket');
      expect(b.Properties.BucketName).toEqual({
        'Fn::Sub': '${EnvironmentName}${EnvironmentSuffix}-logs-${AWS::AccountId}-websapp',
      });
    });

    test('EC2InstanceRole has CW agent policy & S3 write access to LogsBucket', () => {
      const role = R().EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');

      const policy = role.Properties.Policies?.find((p: AnyObj) => p.PolicyName === 'LogsS3Access');
      expect(policy.PolicyDocument.Statement[0].Action).toEqual(['s3:PutObject', 's3:GetObject']);
      expect(policy.PolicyDocument.Statement[0].Resource).toEqual({ 'Fn::Sub': 'arn:aws:s3:::${LogsBucket}/*' });
    });

    test('EC2InstanceProfile references the role', () => {
      const prof = R().EC2InstanceProfile;
      expect(prof.Type).toBe('AWS::IAM::InstanceProfile');
      expect(prof.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
    });
  });

  // ---------- Compute & Scaling ----------
  describe('LaunchTemplate & AutoScalingGroup', () => {
    test('AutoScalingGroup targets private subnets and ALB target group', () => {
      const asg = R().AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.AutoScalingGroupName).toEqual({ 'Fn::Sub': '${EnvironmentName}${EnvironmentSuffix}-asg' });
      // LaunchTemplate linkage
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
      expect(asg.Properties.LaunchTemplate.Version).toEqual({ 'Fn::GetAtt': ['LaunchTemplate', 'LatestVersionNumber'] });
      // Subnets
      expect(asg.Properties.VPCZoneIdentifier).toEqual([{ Ref: 'PrivateSubnet1' }, { Ref: 'PrivateSubnet2' }]);
      // Target group + health checks
      expect(asg.Properties.TargetGroupARNs).toEqual([{ Ref: 'ALBTargetGroup' }]);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });
  });

  // ---------- ALB Layer ----------
  describe('ALB, TargetGroup, Listener', () => {
    test('ALB is internet-facing, in public subnets & secured by ALB SG', () => {
      const alb = R().ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toEqual([{ Ref: 'PublicSubnet1' }, { Ref: 'PublicSubnet2' }]);
      expect(alb.Properties.SecurityGroups).toEqual([{ Ref: 'ALBSecurityGroup' }]);
    });

    test('TargetGroup configuration', () => {
      const tg = R().ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.VpcId).toEqual({ Ref: 'MyVPC' });
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.TargetType).toBe('instance');
      expect(tg.Properties.HealthCheckPath).toBe('/');
    });

    test('HTTP Listener forwards to TargetGroup; no HTTPS or cert resources', () => {
      const l = R().ALBListener;
      expect(l.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(l.Properties.LoadBalancerArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
      expect(l.Properties.Port).toBe(80);
      expect(l.Properties.Protocol).toBe('HTTP');
      expect(l.Properties.DefaultActions?.[0]).toEqual({
        Type: 'forward',
        TargetGroupArn: { Ref: 'ALBTargetGroup' },
      });

      // Explicitly ensure SSL pieces are absent
      expect(R().SSLCertificate).toBeUndefined();
      expect(R().ALBListenerHTTPS).toBeUndefined();
    });
  });

  // ---------- Secrets & RDS ----------
  describe('Secrets Manager & RDS', () => {
    test('DBSecret random password generation defined', () => {
      const sec = R().DBSecret;
      expect(sec.Type).toBe('AWS::SecretsManager::Secret');
      expect(sec.Properties.Name).toEqual({ 'Fn::Sub': '${EnvironmentName}${EnvironmentSuffix}-rds-secret' });
      expect(sec.Properties.GenerateSecretString.PasswordLength).toBe(16);
      expect(sec.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(sec.Properties.GenerateSecretString.SecretStringTemplate).toBe('{"username":"admin"}');
      expect(sec.Properties.GenerateSecretString.ExcludeCharacters).toBeDefined();
    });

    test('DBSubnetGroup uses private subnets', () => {
      const sng = R().DBSubnetGroup;
      expect(sng.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(sng.Properties.SubnetIds).toEqual([{ Ref: 'PrivateSubnet1' }, { Ref: 'PrivateSubnet2' }]);
    });

    test('RDS DBInstance wiring', () => {
      const db = R().RDSDatabase;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.DBInstanceIdentifier).toEqual({ 'Fn::Sub': '${EnvironmentName}${EnvironmentSuffix}-mysql-db' });
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
      expect(db.Properties.VPCSecurityGroups).toEqual([{ Ref: 'RDSSecurityGroup' }]);
      // Credentials resolve via Secrets Manager
      expect(db.Properties.MasterUsername['Fn::Sub']).toContain('${DBSecret}');
      expect(db.Properties.MasterUserPassword['Fn::Sub']).toContain('${DBSecret}');
      // Backups
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
      expect(db.Properties.PreferredBackupWindow).toBe('02:00-03:00');
    });
  });

  // ---------- CloudWatch Dashboard ----------
  describe('CloudWatch Dashboard', () => {
    test('DashboardName uses Sub; DashboardBody is plain string', () => {
      const dash = R().MyDashboard;
      expect(dash.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dash.Properties.DashboardName).toEqual({ 'Fn::Sub': '${EnvironmentName}${EnvironmentSuffix}-dashboard' });

      // Ensure no Fn::Sub for body (we expect plain JSON string to avoid W1020)
      expect(typeof dash.Properties.DashboardBody).toBe('string');
      expect(dash.Properties.DashboardBody.trim()).toContain('"widgets"');
    });
  });

  // ---------- Outputs ----------
  describe('Outputs', () => {
    test('ALB DNS & ARN', () => {
      expect(O().ApplicationLoadBalancerDNS.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
      expect(O().ApplicationLoadBalancerArn.Value).toEqual({ Ref: 'ApplicationLoadBalancer' });
      // Also top-level LoadBalancerDNS (duplicated by design)
      expect(O().LoadBalancerDNS.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('TargetGroup, ASG, LaunchTemplate outputs', () => {
      expect(O().ALBTargetGroupArn.Value).toEqual({ Ref: 'ALBTargetGroup' });
      expect(O().AutoScalingGroupName.Value).toEqual({ Ref: 'AutoScalingGroup' });
      expect(O().LaunchTemplateId.Value).toEqual({ Ref: 'LaunchTemplate' });
    });

    test('VPC & Subnets outputs', () => {
      expect(O().VPCId.Value).toEqual({ Ref: 'MyVPC' });
      expect(O().PublicSubnet1Id.Value).toEqual({ Ref: 'PublicSubnet1' });
      expect(O().PublicSubnet2Id.Value).toEqual({ Ref: 'PublicSubnet2' });
      expect(O().PrivateSubnet1Id.Value).toEqual({ Ref: 'PrivateSubnet1' });
      expect(O().PrivateSubnet2Id.Value).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('Security groups outputs', () => {
      expect(O().ALBSecurityGroupId.Value).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(O().EC2SecurityGroupId.Value).toEqual({ Ref: 'EC2SecurityGroup' });
      expect(O().RDSSecurityGroupId.Value).toEqual({ Ref: 'RDSSecurityGroup' });
    });

    test('S3, Secrets, RDS endpoint, dashboard', () => {
      expect(O().LogsBucketName.Value).toEqual({ Ref: 'LogsBucket' });
      expect(O().DBSecretArn.Value).toEqual({ Ref: 'DBSecret' });
      expect(O().RDSInstanceEndpoint.Value).toEqual({ 'Fn::GetAtt': ['RDSDatabase', 'Endpoint', 'Address'] });
      expect(O().DBInstanceEndpoint.Value).toEqual({ 'Fn::GetAtt': ['RDSDatabase', 'Endpoint', 'Address'] });
      expect(O().DBInstancePort.Value).toEqual({ 'Fn::GetAtt': ['RDSDatabase', 'Endpoint', 'Port'] });
      expect(O().DashboardName.Value).toEqual({ Ref: 'MyDashboard' });
    });

    test('No SSL-related outputs present', () => {
      expect(O().SSLCertificateArn).toBeUndefined();
    });
  });
});
