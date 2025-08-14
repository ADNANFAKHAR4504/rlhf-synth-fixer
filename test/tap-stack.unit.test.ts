import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('Secure Baseline CloudFormation Template', () => {
  let template: any;

   beforeAll(() => {
    // Path to the JSON version of your CloudFormation template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure baseline');
    });

    test('should have required sections', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Mappings', () => {
    test('should define OrgCIDR mapping with allowed CIDR blocks', () => {
      const orgCIDR = template.Mappings.OrgCIDR;
      expect(orgCIDR).toBeDefined();
      expect(orgCIDR.Allowed).toBeDefined();
      expect(orgCIDR.Allowed.CIDR1).toBe('203.0.113.0/24');
      expect(orgCIDR.Allowed.CIDR2).toBe('198.51.100.10/32');
    });

    test('should define R53 mapping with zone configuration', () => {
      const r53 = template.Mappings.R53;
      expect(r53).toBeDefined();
      expect(r53.Zone).toBeDefined();
      expect(r53.Zone.Id).toBe('Z0457876OLTG958Q3IXN');
      expect(r53.Zone.Name).toBe('tap-us-east-1.turing229221.com.');
      expect(r53.Zone.ApexFQDN).toBe('tap-us-east-1.turing229221.com');
    });

    test('should define ACM mapping with certificate ARN', () => {
      const acm = template.Mappings.ACM;
      expect(acm).toBeDefined();
      expect(acm.Cert).toBeDefined();
      expect(acm.Cert.Arn).toContain('arn:aws:acm:us-east-1:');
    });
  });

  describe('KMS Resources', () => {
    test('should define EncryptionKey with proper configuration', () => {
      const encryptionKey = template.Resources.EncryptionKey;
      expect(encryptionKey).toBeDefined();
      expect(encryptionKey.Type).toBe('AWS::KMS::Key');
      expect(encryptionKey.Properties.EnableKeyRotation).toBe(true);
      expect(encryptionKey.Properties.Description).toContain('S3');
    });

    test('should define EncryptionKeyAlias', () => {
      const keyAlias = template.Resources.EncryptionKeyAlias;
      expect(keyAlias).toBeDefined();
      expect(keyAlias.Type).toBe('AWS::KMS::Alias');
      expect(keyAlias.Properties.TargetKeyId).toEqual({ Ref: 'EncryptionKey' });
    });

    test('should define DNSSECKey with ECC configuration', () => {
      const dnssecKey = template.Resources.DNSSECKey;
      expect(dnssecKey).toBeDefined();
      expect(dnssecKey.Type).toBe('AWS::KMS::Key');
      expect(dnssecKey.Properties.KeySpec).toBe('ECC_NIST_P256');
      expect(dnssecKey.Properties.KeyUsage).toBe('SIGN_VERIFY');
      expect(dnssecKey.Properties.EnableKeyRotation).toBe(false);
    });
  });

  describe('Networking Resources', () => {
    test('should define VPC with correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should define public subnets in different AZs', () => {
      const subnetA = template.Resources.PublicSubnetA;
      const subnetB = template.Resources.PublicSubnetB;

      expect(subnetA).toBeDefined();
      expect(subnetA.Type).toBe('AWS::EC2::Subnet');
      expect(subnetA.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnetA.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnetA.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnetA.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });

      expect(subnetB).toBeDefined();
      expect(subnetB.Type).toBe('AWS::EC2::Subnet');
      expect(subnetB.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnetB.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnetB.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnetB.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should define Internet Gateway and attachments', () => {
      const igw = template.Resources.IGW;
      const attachment = template.Resources.VPCGWAttach;

      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');

      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'IGW' });
    });

    test('should define route table with default route', () => {
      const routeTable = template.Resources.PublicRT;
      const defaultRoute = template.Resources.DefaultRoute;

      expect(routeTable).toBeDefined();
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });

      expect(defaultRoute).toBeDefined();
      expect(defaultRoute.Type).toBe('AWS::EC2::Route');
      expect(defaultRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(defaultRoute.Properties.GatewayId).toEqual({ Ref: 'IGW' });
      expect(defaultRoute.DependsOn).toBe('VPCGWAttach');
    });
  });

  describe('Security Groups', () => {
    test('should define ALB Security Group with HTTPS-only access', () => {
      const albSG = template.Resources.ALBSG;
      expect(albSG).toBeDefined();
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(albSG.Properties.GroupDescription).toContain('ALB');

      const ingressRules = albSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);

      ingressRules.forEach((rule: any) => {
        expect(rule.IpProtocol).toBe('tcp');
        expect(rule.FromPort).toBe(443);
        expect(rule.ToPort).toBe(443);
        expect(rule.Description).toContain('HTTPS');
      });
    });

    test('should define Instance Security Group with proper access controls', () => {
      const instanceSG = template.Resources.InstanceSG;
      expect(instanceSG).toBeDefined();
      expect(instanceSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(instanceSG.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const ingressRules = instanceSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(3); // HTTP from ALB + 2 SSH rules

      // Find HTTP rule from ALB
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSG' });

      // Find SSH rules
      const sshRules = ingressRules.filter((rule: any) => rule.FromPort === 22);
      expect(sshRules).toHaveLength(2);
    });
  });

  describe('S3 Resources', () => {
    test('should define S3 buckets with encryption and public access blocked', () => {
      const buckets = ['AccessLogsBucket', 'ApplicationBucket', 'ConfigBucket'];

      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket).toBeDefined();
        expect(bucket.Type).toBe('AWS::S3::Bucket');

        // Check public access block
        const pab = bucket.Properties.PublicAccessBlockConfiguration;
        expect(pab.BlockPublicAcls).toBe(true);
        expect(pab.BlockPublicPolicy).toBe(true);
        expect(pab.IgnorePublicAcls).toBe(true);
        expect(pab.RestrictPublicBuckets).toBe(true);

        // Check encryption
        const encryption = bucket.Properties.BucketEncryption;
        expect(encryption).toBeDefined();
        const rule = encryption.ServerSideEncryptionConfiguration[0];
        expect(rule.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(rule.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'EncryptionKey' });
        expect(rule.BucketKeyEnabled).toBe(true);
      });
    });

    test('should define bucket policies for service access', () => {
      const accessLogsBucketPolicy = template.Resources.AccessLogsBucketPolicy;
      expect(accessLogsBucketPolicy).toBeDefined();
      expect(accessLogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');

      const configBucketPolicy = template.Resources.ConfigBucketPolicy;
      expect(configBucketPolicy).toBeDefined();
      expect(configBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('IAM Resources', () => {
    test('should define EC2 role with SSM permissions', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Type).toBe('AWS::IAM::Role');

      const managedPolicies = ec2Role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');

      const policies = ec2Role.Properties.Policies;
      expect(policies).toBeDefined();
      const appLogsPolicy = policies.find((p: any) => p.PolicyName === 'AppLogsWrite');
      expect(appLogsPolicy).toBeDefined();
    });

    test('should define MFA enforcement policy with proper statements', () => {
      const mfaPolicy = template.Resources.MFAEnforcementPolicy;
      expect(mfaPolicy).toBeDefined();
      expect(mfaPolicy.Type).toBe('AWS::IAM::ManagedPolicy');

      const policyDoc = mfaPolicy.Properties.PolicyDocument;
      expect(policyDoc.Version).toBe('2012-10-17');

      const statements = policyDoc.Statement;
      const sids = statements.map((s: any) => s.Sid);
      expect(sids).toContain('AllowViewAccountInfo');
      expect(sids).toContain('AllowManageOwnPasswords');
      expect(sids).toContain('AllowManageOwnMFA');
      expect(sids).toContain('DenyAllUnlessMFA');

      // Check deny statement has proper condition
      const denyStatement = statements.find((s: any) => s.Sid === 'DenyAllUnlessMFA');
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Condition.BoolIfExists['aws:MultiFactorAuthPresent']).toBe('false');
    });

    test('should define IAM instance profile', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile).toBeDefined();
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
    });

    test('should define users group with MFA policy attached', () => {
      const usersGroup = template.Resources.AllUsersGroup;
      expect(usersGroup).toBeDefined();
      expect(usersGroup.Type).toBe('AWS::IAM::Group');
      expect(usersGroup.Properties.ManagedPolicyArns).toEqual([{ Ref: 'MFAEnforcementPolicy' }]);
    });
  });

  describe('Compute Resources', () => {
    test('should define EC2 instance with proper configuration', () => {
      const instance = template.Resources.AppInstance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toBe('t3.micro');
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnetA' });

      // Check EBS encryption
      const blockDevices = instance.Properties.BlockDeviceMappings;
      expect(blockDevices).toHaveLength(1);
      const ebs = blockDevices[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
      expect(ebs.KmsKeyId).toEqual({ Ref: 'EncryptionKey' });
      expect(ebs.VolumeType).toBe('gp3');
    });

    test('should define ALB with proper configuration', () => {
      const alb = template.Resources.ALB;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toEqual([{ Ref: 'PublicSubnetA' }, { Ref: 'PublicSubnetB' }]);
      expect(alb.Properties.SecurityGroups).toEqual([{ Ref: 'ALBSG' }]);
    });

    test('should define target group with health checks', () => {
      const targetGroup = template.Resources.TargetGroup;
      expect(targetGroup).toBeDefined();
      expect(targetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(targetGroup.Properties.Protocol).toBe('HTTP');
      expect(targetGroup.Properties.Port).toBe(80);
      expect(targetGroup.Properties.HealthCheckPath).toBe('/health');
      expect(targetGroup.Properties.Targets).toEqual([{ Id: { Ref: 'AppInstance' }, Port: 80 }]);
    });

    test('should define ALB listeners with HTTPS and redirect', () => {
      const httpListener = template.Resources.HTTPRedirectListener;
      expect(httpListener).toBeDefined();
      expect(httpListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(httpListener.Properties.Protocol).toBe('HTTP');
      expect(httpListener.Properties.Port).toBe(80);

      const redirectAction = httpListener.Properties.DefaultActions[0];
      expect(redirectAction.Type).toBe('redirect');
      expect(redirectAction.RedirectConfig.Protocol).toBe('HTTPS');
      expect(redirectAction.RedirectConfig.StatusCode).toBe('HTTP_301');

      const httpsListener = template.Resources.HTTPSListener;
      expect(httpsListener).toBeDefined();
      expect(httpsListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(httpsListener.Properties.Protocol).toBe('HTTPS');
      expect(httpsListener.Properties.Port).toBe(443);
      expect(httpsListener.Properties.SslPolicy).toContain('TLS13');
    });
  });

  describe('Monitoring Resources', () => {
    test('should define CloudWatch Log Groups with encryption', () => {
      const appLogGroup = template.Resources.AppLogGroup;
      expect(appLogGroup).toBeDefined();
      expect(appLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(appLogGroup.Properties.RetentionInDays).toBe(30);
      expect(appLogGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['EncryptionKey', 'Arn'] });

      const vpcLogGroup = template.Resources.VPCFlowLogGroup;
      expect(vpcLogGroup).toBeDefined();
      expect(vpcLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(vpcLogGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should define VPC Flow Logs', () => {
      const flowLogs = template.Resources.VPCFlowLogs;
      expect(flowLogs).toBeDefined();
      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLogs.Properties.ResourceType).toBe('VPC');
      expect(flowLogs.Properties.TrafficType).toBe('ALL');
      expect(flowLogs.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('should define VPC Flow Log IAM role', () => {
      const flowLogRole = template.Resources.VPCFlowLogRole;
      expect(flowLogRole).toBeDefined();
      expect(flowLogRole.Type).toBe('AWS::IAM::Role');

      const policies = flowLogRole.Properties.Policies;
      const flowLogsPolicy = policies.find((p: any) => p.PolicyName === 'FlowLogsToCW');
      expect(flowLogsPolicy).toBeDefined();
    });
  });

  describe('Route53 DNSSEC Resources', () => {
    test('should define Key Signing Key', () => {
      const ksk = template.Resources.KeySigningKey;
      expect(ksk).toBeDefined();
      expect(ksk.Type).toBe('AWS::Route53::KeySigningKey');
      expect(ksk.Properties.Name).toBe('ksk_main');
      expect(ksk.Properties.Status).toBe('ACTIVE');
    });

    test('should define KSK waiter Lambda function', () => {
      const lambdaFunc = template.Resources.KSKWaiterFunction;
      expect(lambdaFunc).toBeDefined();
      expect(lambdaFunc.Type).toBe('AWS::Lambda::Function');
      expect(lambdaFunc.Properties.Runtime).toBe('python3.12');
      expect(lambdaFunc.Properties.Handler).toBe('index.handler');
      expect(lambdaFunc.Properties.Timeout).toBe(300);
    });

    test('should define custom resource waiter with proper dependencies', () => {
      const waiter = template.Resources.WaitForKSKActive;
      expect(waiter).toBeDefined();
      expect(waiter.Type).toBe('Custom::WaitForKSKActive');
      expect(waiter.DependsOn).toBe('KeySigningKey');
    });

    test('should define DNSSEC enable with dependency', () => {
      const dnssecEnable = template.Resources.DNSSECEnable;
      expect(dnssecEnable).toBeDefined();
      expect(dnssecEnable.Type).toBe('AWS::Route53::DNSSEC');
      expect(dnssecEnable.DependsOn).toBe('WaitForKSKActive');
    });

    test('should define Route53 records pointing to ALB', () => {
      const apexA = template.Resources.ApexA;
      expect(apexA).toBeDefined();
      expect(apexA.Type).toBe('AWS::Route53::RecordSet');
      expect(apexA.Properties.Type).toBe('A');
      expect(apexA.Properties.AliasTarget.DNSName).toEqual({ 'Fn::GetAtt': ['ALB', 'DNSName'] });

      const apexAAAA = template.Resources.ApexAAAA;
      expect(apexAAAA).toBeDefined();
      expect(apexAAAA.Type).toBe('AWS::Route53::RecordSet');
      expect(apexAAAA.Properties.Type).toBe('AAAA');
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'ALBDNSName',
      'PublicFQDN',
      'Route53HostedZoneId',
      'KMSKeyId',
      'MFAGroupToUse'
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('VPCId output should reference VPC', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('ALBDNSName output should reference ALB DNS', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ALB', 'DNSName'] });
    });

    test('KMSKeyId output should reference encryption key', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Value).toEqual({ Ref: 'EncryptionKey' });
    });

    test('MFAGroupToUse output should reference users group', () => {
      const output = template.Outputs.MFAGroupToUse;
      expect(output.Value).toEqual({ Ref: 'AllUsersGroup' });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have hardcoded secrets or credentials', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toMatch(/password|secret|key/i);
    });

    test('should use secure SSL policy for HTTPS listener', () => {
      const httpsListener = template.Resources.HTTPSListener;
      expect(httpsListener.Properties.SslPolicy).toContain('TLS13');
    });

    test('should have encrypted EBS volumes', () => {
      const instance = template.Resources.AppInstance;
      const blockDevices = instance.Properties.BlockDeviceMappings;
      blockDevices.forEach((device: any) => {
        expect(device.Ebs.Encrypted).toBe(true);
      });
    });

    test('should block public access on all S3 buckets', () => {
      const buckets = ['AccessLogsBucket', 'ApplicationBucket', 'ConfigBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const pab = bucket.Properties.PublicAccessBlockConfiguration;
        expect(pab.BlockPublicAcls).toBe(true);
        expect(pab.BlockPublicPolicy).toBe(true);
        expect(pab.IgnorePublicAcls).toBe(true);
        expect(pab.RestrictPublicBuckets).toBe(true);
      });
    });

    test('should not allow SSH from 0.0.0.0/0', () => {
      const instanceSG = template.Resources.InstanceSG;
      const sshRules = instanceSG.Properties.SecurityGroupIngress.filter(
        (rule: any) => rule.FromPort === 22
      );
      
      sshRules.forEach((rule: any) => {
        expect(rule.CidrIp).not.toBe('0.0.0.0/0');
      });
    });
  });
});