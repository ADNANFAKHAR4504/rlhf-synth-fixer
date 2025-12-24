// test/tap-stack.unit.test.ts

import * as fs from 'fs';
import * as path from 'path';

type AnyTemplate = {
  Resources: Record<string, any>;
  Parameters?: Record<string, any>;
  Outputs?: Record<string, any>;
  [key: string]: any;
};

const templatePath = path.join(__dirname, '../lib/TapStack.json');
const templateRaw = fs.readFileSync(templatePath, 'utf8');
const template: AnyTemplate = JSON.parse(templateRaw);

const resources = template.Resources || {};
const parameters = template.Parameters || {};
const outputs = template.Outputs || {};

describe('TapStack CloudFormation Template — Unit Tests', () => {
  // 1
  it('Template should have Resources, Parameters, and Outputs sections', () => {
    expect(template).toBeDefined();
    expect(resources).toBeDefined();
    expect(parameters).toBeDefined();
    expect(outputs).toBeDefined();
  });

  // 2
  it('EnvironmentSuffix parameter should enforce safe naming via AllowedPattern', () => {
    const param = parameters.EnvironmentSuffix;
    expect(param).toBeDefined();
    expect(param.Type).toBe('String');
    expect(param.AllowedPattern).toBe('^[a-z0-9-]{3,20}$');
  });

  // 3
  it('VPC should exist with correct CIDR and DNS settings', () => {
    const vpc = resources.VPC;
    expect(vpc).toBeDefined();
    expect(vpc.Type).toBe('AWS::EC2::VPC');
    expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    expect(vpc.Properties.EnableDnsSupport).toBe(true);
    expect(vpc.Properties.EnableDnsHostnames).toBe(true);
  });

  // 4
  it('VPC and core resources must be tagged with Project and Environment', () => {
    const vpcTags = resources.VPC.Properties.Tags;
    const projectTag = vpcTags.find((t: any) => t.Key === 'Project');
    const envTag = vpcTags.find((t: any) => t.Key === 'Environment');
    expect(projectTag).toBeDefined();
    expect(projectTag.Value).toBe('CloudFormationChallenge');
    expect(envTag).toBeDefined();
    expect(envTag.Value).toBeDefined();
  });

  // 5
  it('Should create 3 public and 3 private subnets across AZs', () => {
    const publicSubnets = ['PublicSubnetA', 'PublicSubnetB', 'PublicSubnetC'];
    const privateSubnets = ['PrivateSubnetA', 'PrivateSubnetB', 'PrivateSubnetC'];

    publicSubnets.forEach((name) => {
      const subnet = resources[name];
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId).toBeDefined();
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    privateSubnets.forEach((name) => {
      const subnet = resources[name];
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.VpcId).toBeDefined();
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });
  });

  // 6
  it('Each subnet route table should be associated correctly', () => {
    const associations = [
      'PublicSubnetRouteTableAssociationA',
      'PublicSubnetRouteTableAssociationB',
      'PublicSubnetRouteTableAssociationC',
      'PrivateSubnetRouteTableAssociationA',
      'PrivateSubnetRouteTableAssociationB',
      'PrivateSubnetRouteTableAssociationC',
    ];

    associations.forEach((name) => {
      const assoc = resources[name];
      expect(assoc).toBeDefined();
      expect(assoc.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assoc.Properties.SubnetId).toBeDefined();
      expect(assoc.Properties.RouteTableId).toBeDefined();
    });
  });

  // 7
  it('InternetGateway and VPCGatewayAttachment must exist and reference VPC', () => {
    const igw = resources.InternetGateway;
    const attach = resources.AttachGateway;
    expect(igw).toBeDefined();
    expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    expect(attach).toBeDefined();
    expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    expect(attach.Properties.VpcId).toEqual({ Ref: 'VPC' });
    expect(attach.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
  });

  // 8
  it('Public route tables must route 0.0.0.0/0 traffic to InternetGateway', () => {
    ['PublicRouteA', 'PublicRouteB', 'PublicRouteC'].forEach((name) => {
      const route = resources[name];
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  // 9
  it('Private route tables must route 0.0.0.0/0 traffic to corresponding NAT Gateways', () => {
    const mapping: Record<string, string> = {
      PrivateRouteA: 'NATGatewayA',
      PrivateRouteB: 'NATGatewayB',
      PrivateRouteC: 'NATGatewayC',
    };

    Object.entries(mapping).forEach(([routeName, natName]) => {
      const route = resources[routeName];
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: natName });
    });
  });

  // 10
  it('NAT Gateways should each have an Elastic IP and be in public subnets', () => {
    const mapping: Record<string, string> = {
      NATGatewayA: 'PublicSubnetA',
      NATGatewayB: 'PublicSubnetB',
      NATGatewayC: 'PublicSubnetC',
    };

    Object.entries(mapping).forEach(([gwName, subnetName]) => {
      const gw = resources[gwName];
      expect(gw).toBeDefined();
      expect(gw.Type).toBe('AWS::EC2::NatGateway');
      expect(gw.Properties.SubnetId).toEqual({ Ref: subnetName });
      expect(gw.Properties.AllocationId).toBeDefined();
    });
  });

  // 11
  it('Security groups for ALB, EC2, and RDS must exist', () => {
    expect(resources.ALBSecurityGroup).toBeDefined();
    expect(resources.EC2SecurityGroup).toBeDefined();
    expect(resources.RDSSecurityGroup).toBeDefined();
  });

  // 12
  it('ALBSecurityGroup should allow HTTP and HTTPS from anywhere', () => {
    const sg = resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
    const http = sg.find((r: any) => r.FromPort === 80 && r.ToPort === 80);
    const https = sg.find((r: any) => r.FromPort === 443 && r.ToPort === 443);
    expect(http).toBeDefined();
    expect(http.CidrIp).toBe('0.0.0.0/0');
    expect(https).toBeDefined();
    expect(https.CidrIp).toBe('0.0.0.0/0');
  });

  // 13
  it('EC2SecurityGroup should allow HTTP from ALB and SSH from restricted CIDR', () => {
    const sg = resources.EC2SecurityGroup.Properties.SecurityGroupIngress;
    const httpFromAlb = sg.find((r: any) => r.FromPort === 80 && r.SourceSecurityGroupId && r.SourceSecurityGroupId.Ref === 'ALBSecurityGroup');
    const ssh = sg.find((r: any) => r.FromPort === 22 && r.CidrIp && r.CidrIp.Ref === 'SSHAllowedCIDR');
    expect(httpFromAlb).toBeDefined();
    expect(ssh).toBeDefined();
  });

  // 14
  it('RDSSecurityGroup should allow PostgreSQL from EC2SecurityGroup', () => {
    const sg = resources.RDSSecurityGroup.Properties.SecurityGroupIngress;
    const pg = sg.find((r: any) => r.FromPort === 5432 && r.ToPort === 5432 && r.SourceSecurityGroupId.Ref === 'EC2SecurityGroup');
    expect(pg).toBeDefined();
  });

  // 15
  it('ApplicationBucket and ApplicationBucketReplica must be encrypted and versioned', () => {
    const src = resources.ApplicationBucket;
    const dst = resources.ApplicationBucketReplica;
    expect(src).toBeDefined();
    expect(dst).toBeDefined();

    expect(src.Properties.VersioningConfiguration.Status).toBe('Enabled');
    expect(src.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

    expect(dst.Properties.VersioningConfiguration.Status).toBe('Enabled');
    const dstEnc = dst.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
    expect(dstEnc.SSEAlgorithm).toBe('aws:kms');
    expect(dstEnc.KMSMasterKeyID).toBeDefined();
  });

  // 16
  it('ApplicationBucket must have a replication configuration targeting the replica bucket', () => {
    const src = resources.ApplicationBucket;
    const repl = src.Properties.ReplicationConfiguration;
    expect(repl).toBeDefined();
    expect(repl.Role).toEqual({ 'Fn::GetAtt': ['S3ReplicationRole', 'Arn'] });
    expect(repl.Rules).toBeDefined();
    expect(Array.isArray(repl.Rules)).toBe(true);
    const rule = repl.Rules[0];
    expect(rule.Status).toBe('Enabled');
    expect(rule.Destination.Bucket['Fn::Sub']).toContain('myapp-storage-replica-');
    expect(rule.Destination.EncryptionConfiguration.ReplicaKmsKeyID).toBeDefined();
  });

  // 17
  it('S3ReplicationRole should allow replication actions and KMS usage', () => {
    const role = resources.S3ReplicationRole;
    expect(role).toBeDefined();
    const policies = role.Properties.Policies;
    const replPolicy = policies.find((p: any) => p.PolicyName === 'ReplicationPolicy');
    expect(replPolicy).toBeDefined();
    const statements = replPolicy.PolicyDocument.Statement;
    const s3ReplicateStmt = statements.find((s: any) =>
      Array.isArray(s.Action) && s.Action.includes('s3:ReplicateObject'),
    );
    const kmsStmt = statements.find((s: any) =>
      Array.isArray(s.Action) && s.Action.includes('kms:Encrypt'),
    );
    expect(s3ReplicateStmt).toBeDefined();
    expect(kmsStmt).toBeDefined();
  });

  // 18
  it('S3ReplicationKmsKey must have key rotation enabled', () => {
    const key = resources.S3ReplicationKmsKey;
    expect(key).toBeDefined();
    expect(key.Type).toBe('AWS::KMS::Key');
    expect(key.Properties.EnableKeyRotation).toBe(true);
  });

  // 19
  it('Application Load Balancer should be internet-facing and in public subnets', () => {
    const alb = resources.ApplicationLoadBalancer;
    expect(alb).toBeDefined();
    expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    expect(alb.Properties.Scheme).toBe('internet-facing');
    expect(alb.Properties.Subnets).toEqual([
      { Ref: 'PublicSubnetA' },
      { Ref: 'PublicSubnetB' },
      { Ref: 'PublicSubnetC' },
    ]);
  });

  // 20
  it('ALB access logging bucket must enforce secure settings and lifecycle rule', () => {
    const bucket = resources.ALBAccessLogsBucket;
    expect(bucket).toBeDefined();
    const props = bucket.Properties;
    const enc = props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
    expect(enc.SSEAlgorithm).toBe('AES256');
    expect(props.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(30);
    const pab = props.PublicAccessBlockConfiguration;
    expect(pab.BlockPublicAcls).toBe(true);
    expect(pab.BlockPublicPolicy).toBe(true);
  });

  // 21
  it('LaunchTemplate must use Amazon Linux 2 SSM parameter and attach EC2 instance profile', () => {
    const lt = resources.LaunchTemplate;
    expect(lt).toBeDefined();
    const data = lt.Properties.LaunchTemplateData;
    expect(data.ImageId).toContain('resolve:ssm:/aws/service/ami-amazon-linux-latest');
    expect(data.IamInstanceProfile.Arn).toEqual({ 'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'] });
    expect(data.InstanceType).toBe('t3.micro');
    expect(data.SecurityGroupIds[0].Ref).toBe('EC2SecurityGroup');
  });

  // 22
  it('AutoScalingGroup should target all public subnets and attach to ALB target group', () => {
    const asg = resources.AutoScalingGroup;
    expect(asg).toBeDefined();
    expect(asg.Properties.VPCZoneIdentifier).toEqual([
      { Ref: 'PublicSubnetA' },
      { Ref: 'PublicSubnetB' },
      { Ref: 'PublicSubnetC' },
    ]);
    expect(asg.Properties.TargetGroupARNs).toEqual([{ Ref: 'TargetGroup' }]);
  });

  // 23
  it('AutoScalingGroup capacity and scaling policies must satisfy CPU-based scaling requirements', () => {
    const asg = resources.AutoScalingGroup;
    expect(asg.Properties.MinSize).toBe(2);
    expect(asg.Properties.MaxSize).toBe(5);
    expect(asg.Properties.DesiredCapacity).toBe(2);

    const scaleUp = resources.ScaleUpPolicy;
    const scaleDown = resources.ScaleDownPolicy;
    expect(scaleUp).toBeDefined();
    expect(scaleDown).toBeDefined();
    expect(scaleUp.Properties.ScalingAdjustment).toBe(1);
    expect(scaleDown.Properties.ScalingAdjustment).toBe(-1);

    const highCpu = resources.HighCPUAlarm;
    const lowCpu = resources.LowCPUAlarm;
    expect(highCpu.Properties.Threshold).toBe(70);
    expect(lowCpu.Properties.Threshold).toBe(30);
  });

  // 24
  it('DBSubnetGroup must include all three private subnets', () => {
    const grp = resources.DBSubnetGroup;
    expect(grp).toBeDefined();
    const ids = grp.Properties.SubnetIds;
    expect(ids).toEqual([
      { Ref: 'PrivateSubnetA' },
      { Ref: 'PrivateSubnetB' },
      { Ref: 'PrivateSubnetC' },
    ]);
  });

  // 25
  it('DBInstance must be MultiAZ, encrypted, use postgres engine, and reference DBSubnetGroup', () => {
    const db = resources.DBInstance;
    expect(db).toBeDefined();
    expect(db.Type).toBe('AWS::RDS::DBInstance');
    expect(db.Properties.Engine).toBe('postgres');
    expect(db.Properties.MultiAZ).toBe(true);
    expect(db.Properties.StorageEncrypted).toBe(true);
    expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
  });

  // 26
  it('DBInstance should use a Secrets Manager dynamic reference for MasterUserPassword', () => {
    const db = resources.DBInstance;
    expect(db.Properties.MasterUserPassword).toBeDefined();
    const val = db.Properties.MasterUserPassword['Fn::Sub'] || db.Properties.MasterUserPassword;
    expect(typeof val).toBe('string');
    expect(val).toContain('resolve:secretsmanager');
  });

  // 27
  it('DBMasterSecret should be a generated secret with username template and password key', () => {
    const secret = resources.DBMasterSecret;
    expect(secret).toBeDefined();
    expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    const g = secret.Properties.GenerateSecretString;
    expect(g).toBeDefined();
    expect(g.SecretStringTemplate).toContain('"username"');
    expect(g.GenerateStringKey).toBe('password');
    expect(g.PasswordLength).toBeGreaterThanOrEqual(8);
  });

  // 28
  it('Outputs must expose VPCId, ALBEndpoint, ApplicationBucketName, and DBEndpoint', () => {
    expect(outputs.VPCId).toBeDefined();
    expect(outputs.ALBEndpoint).toBeDefined();
    expect(outputs.ApplicationBucketName).toBeDefined();
    expect(outputs.DBEndpoint).toBeDefined();
    expect(outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    expect(outputs.ApplicationBucketName.Value).toEqual({ Ref: 'ApplicationBucket' });
  });
});
