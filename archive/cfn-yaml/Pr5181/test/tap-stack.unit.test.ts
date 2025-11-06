import * as fs from 'fs';
import * as path from 'path';

const yamlPath = path.resolve(__dirname, '../lib/TapStack.yml');
const yamlText = fs.readFileSync(yamlPath, 'utf8');

// ---------- Simple YAML block helpers (string-based, no external parser) ----------
const getResourceBlock = (id: string): string => {
  // Looks for resource header at indentation level 2 under "Resources:"
  // Example: "  Instance1:\n    Type: AWS::EC2::Instance\n    ..."
  const resHeader = new RegExp(`^\\s{2}${id}:\\s*$`, 'm');
  const match = yamlText.match(resHeader);
  if (!match) throw new Error(`Resource not found: ${id}`);
  const startIdx = match.index ?? 0;

  // Next resource header (two-space indentation) OR section boundary (e.g., "Outputs:")
  const tail = yamlText.slice(startIdx + 1);
  const nextHeader = tail.search(/^\s{2}[A-Za-z0-9]+:\s*$/m);
  const nextSection = tail.search(/^(Outputs|Parameters|Conditions|Resources|Mappings|Metadata):\s*$/m);

  let endRel = tail.length;
  if (nextHeader >= 0) endRel = Math.min(endRel, nextHeader);
  if (nextSection >= 0) endRel = Math.min(endRel, nextSection);

  return yamlText.slice(startIdx, startIdx + 1 + endRel);
};

const getSectionBlock = (name: string): string => {
  const header = new RegExp(`^${name}:\\s*$`, 'm');
  const m = yamlText.match(header);
  if (!m) throw new Error(`Section not found: ${name}`);
  const startIdx = m.index ?? 0;
  const tail = yamlText.slice(startIdx + 1);
  const nextTop = tail.search(/^(AWSTemplateFormatVersion|Description|Metadata|Parameters|Conditions|Mappings|Resources|Outputs):\s*$/m);
  const endRel = nextTop >= 0 ? nextTop : tail.length;
  return yamlText.slice(startIdx, startIdx + 1 + endRel);
};

const expectInBlock = (block: string, re: RegExp) => {
  expect(re.test(block)).toBe(true);
};

// ---------- Tests ----------
describe('TapStack CloudFormation Template (YAML only)', () => {
  test('01) File begins with AWSTemplateFormatVersion and non-empty Description', () => {
    expect(yamlText).toMatch(/^AWSTemplateFormatVersion:\s*'2010-09-09'/);
    const desc = yamlText.match(/^Description:\s*(.+)$/m);
    expect(desc && desc[1].trim().length).toBeGreaterThan(5);
  });

  test('02) Metadata includes AWS::CloudFormation::Interface with parameter groups & labels', () => {
    const meta = getSectionBlock('Metadata');
    expectInBlock(meta, /AWS::CloudFormation::Interface:\s*$/m);
    expectInBlock(meta, /ParameterGroups:\s*$/m);
    expectInBlock(meta, /ParameterLabels:\s*$/m);
  });

  test('03) Parameters include KeyName (optional), SSHLocation, CreateEIP, LatestAmiId', () => {
    const params = getSectionBlock('Parameters');
    expectInBlock(params, /^  KeyName:\s*$/m);
    expectInBlock(params, /^    Type:\s*String\s*$/m);
    expectInBlock(params, /^    Default:\s*""\s*$/m); // optional key
    expectInBlock(params, /^  SSHLocation:\s*$/m);
    expectInBlock(params, /^    Default:\s*0\.0\.0\.0\/0\s*$/m);
    expectInBlock(params, /^  CreateEIP:\s*$/m);
    expectInBlock(params, /AllowedValues:\s*\n\s*-\s*'true'\s*\n\s*-\s*'false'/m);
    expectInBlock(params, /^  LatestAmiId:\s*$/m);
    expectInBlock(params, /Type:\s*'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'/m);
    expectInBlock(params, /Default:\s*\/aws\/service\/ami-amazon-linux-latest\/amzn2-ami-hvm-x86_64-gp2/m);
  });

  test('04) Conditions declare CreateEIPCondition and UseKeyName', () => {
    const cond = getSectionBlock('Conditions');
    expectInBlock(cond, /^  CreateEIPCondition:\s*!Equals\s*\[/m);
    expectInBlock(cond, /^  UseKeyName:\s*!Not\s*\[/m);
  });

  test('05) VPC exists with correct CIDR and DNS features enabled', () => {
    const vpc = getResourceBlock('ProdVPC');
    expectInBlock(vpc, /Type:\s*AWS::EC2::VPC/);
    expectInBlock(vpc, /CidrBlock:\s*10\.0\.0\.0\/16/);
    expectInBlock(vpc, /EnableDnsSupport:\s*true/);
    expectInBlock(vpc, /EnableDnsHostnames:\s*true/);
  });

  test('06) Two public subnets across AZs with MapPublicIpOnLaunch true', () => {
    const s1 = getResourceBlock('PublicSubnet1');
    const s2 = getResourceBlock('PublicSubnet2');
    expectInBlock(s1, /Type:\s*AWS::EC2::Subnet/);
    expectInBlock(s2, /Type:\s*AWS::EC2::Subnet/);
    expectInBlock(s1, /MapPublicIpOnLaunch:\s*true/);
    expectInBlock(s2, /MapPublicIpOnLaunch:\s*true/);
    expectInBlock(s1, /AvailabilityZone:\s*!Select\s*\[\s*0,\s*!GetAZs\s*''\s*\]/);
    expectInBlock(s2, /AvailabilityZone:\s*!Select\s*\[\s*1,\s*!GetAZs\s*''\s*\]/);
  });

  test('07) IGW and VPCGatewayAttachment exist', () => {
    const igw = getResourceBlock('InternetGateway');
    const att = getResourceBlock('AttachGateway');
    expectInBlock(igw, /Type:\s*AWS::EC2::InternetGateway/);
    expectInBlock(att, /Type:\s*AWS::EC2::VPCGatewayAttachment/);
    expectInBlock(att, /VpcId:\s*!Ref\s*ProdVPC/);
    expectInBlock(att, /InternetGatewayId:\s*!Ref\s*InternetGateway/);
  });

  test('08) Public route table and default route to IGW set', () => {
    const rt = getResourceBlock('PublicRouteTable');
    const route = getResourceBlock('PublicRoute');
    expectInBlock(rt, /Type:\s*AWS::EC2::RouteTable/);
    expectInBlock(route, /Type:\s*AWS::EC2::Route/);
    expectInBlock(route, /RouteTableId:\s*!Ref\s*PublicRouteTable/);
    expectInBlock(route, /DestinationCidrBlock:\s*0\.0\.0\.0\/0/);
    expectInBlock(route, /GatewayId:\s*!Ref\s*InternetGateway/);
  });

  test('09) Subnet associations link both public subnets to the public route table', () => {
    const a1 = getResourceBlock('SubnetRouteTableAssociation1');
    const a2 = getResourceBlock('SubnetRouteTableAssociation2');
    expectInBlock(a1, /SubnetId:\s*!Ref\s*PublicSubnet1/);
    expectInBlock(a1, /RouteTableId:\s*!Ref\s*PublicRouteTable/);
    expectInBlock(a2, /SubnetId:\s*!Ref\s*PublicSubnet2/);
    expectInBlock(a2, /RouteTableId:\s*!Ref\s*PublicRouteTable/);
  });

  test('10) WebSecurityGroup allows HTTP(80) from anywhere and SSH(22) from parameter', () => {
    const sg = getResourceBlock('WebSecurityGroup');
    expectInBlock(sg, /Type:\s*AWS::EC2::SecurityGroup/);
    expectInBlock(sg, /FromPort:\s*80[\s\S]*CidrIp:\s*0\.0\.0\.0\/0/);
    expectInBlock(sg, /FromPort:\s*22[\s\S]*CidrIp:\s*!Ref\s*SSHLocation/);
  });

  test('11) Two EC2 instances exist, in different subnets', () => {
    const i1 = getResourceBlock('Instance1');
    const i2 = getResourceBlock('Instance2');
    expectInBlock(i1, /Type:\s*AWS::EC2::Instance/);
    expectInBlock(i2, /Type:\s*AWS::EC2::Instance/);
    expectInBlock(i1, /SubnetId:\s*!Ref\s*PublicSubnet1/);
    expectInBlock(i2, /SubnetId:\s*!Ref\s*PublicSubnet2/);
  });

  test('12) Instances use LatestAmiId and optional KeyName condition (UseKeyName)', () => {
    const i1 = getResourceBlock('Instance1');
    const i2 = getResourceBlock('Instance2');
    expectInBlock(i1, /ImageId:\s*!Ref\s*LatestAmiId/);
    expectInBlock(i2, /ImageId:\s*!Ref\s*LatestAmiId/);
    expectInBlock(i1, /KeyName:\s*!If\s*\[\s*UseKeyName,\s*!Ref\s*KeyName,\s*!Ref\s*'AWS::NoValue'\s*\]/);
    expectInBlock(i2, /KeyName:\s*!If\s*\[\s*UseKeyName,\s*!Ref\s*KeyName,\s*!Ref\s*'AWS::NoValue'\s*\]/);
  });

  test('13) EIP is conditional and associated to Instance1 using AllocationId', () => {
    const eip = getResourceBlock('ElasticIP');
    const assoc = getResourceBlock('EIPAssociation');
    expectInBlock(eip, /Type:\s*AWS::EC2::EIP/);
    expectInBlock(eip, /Condition:\s*CreateEIPCondition/);
    expectInBlock(assoc, /Type:\s*AWS::EC2::EIPAssociation/);
    expectInBlock(assoc, /Condition:\s*CreateEIPCondition/);
    expectInBlock(assoc, /InstanceId:\s*!Ref\s*Instance1/);
    expectInBlock(assoc, /AllocationId:\s*!GetAtt\s*ElasticIP\.AllocationId/);
  });

  test('14) IAM Role & InstanceProfile defined with SSM core and S3 read-only', () => {
    const role = getResourceBlock('EC2Role');
    const profile = getResourceBlock('EC2InstanceProfile');
    expectInBlock(role, /Type:\s*AWS::IAM::Role/);
    expectInBlock(role, /ManagedPolicyArns:[\s\S]*AmazonSSMManagedInstanceCore/);
    expectInBlock(role, /PolicyName:\s*S3ReadOnlyAccessToProdBucket/);
    expectInBlock(role, /Action:[\s\S]*s3:GetObject[\s\S]*s3:ListBucket/);
    expectInBlock(role, /Resource:[\s\S]*!GetAtt\s*S3Bucket\.Arn[\s\S]*\${S3Bucket\.Arn}\/\*/);
    expectInBlock(profile, /Type:\s*AWS::IAM::InstanceProfile/);
    expectInBlock(profile, /Roles:\s*\n\s*-\s*!Ref\s*EC2Role/);
  });

  test('15) S3 bucket has versioning, SSE-KMS with CMK, and full public access block', () => {
    const b = getResourceBlock('S3Bucket');
    expectInBlock(b, /Type:\s*AWS::S3::Bucket/);
    expectInBlock(b, /VersioningConfiguration:\s*\n\s*Status:\s*Enabled/);
    expectInBlock(b, /BucketEncryption:[\s\S]*SSEAlgorithm:\s*aws:kms/);
    expectInBlock(b, /KMSMasterKeyID:\s*!Ref\s*S3KMSKey/);
    expectInBlock(b, /PublicAccessBlockConfiguration:[\s\S]*BlockPublicAcls:\s*true[\s\S]*BlockPublicPolicy:\s*true[\s\S]*IgnorePublicAcls:\s*true[\s\S]*RestrictPublicBuckets:\s*true/);
  });

  test('16) KMS Key and Alias exist for S3/CloudTrail', () => {
    const key = getResourceBlock('S3KMSKey');
    const alias = getResourceBlock('S3KMSKeyAlias');
    expectInBlock(key, /Type:\s*AWS::KMS::Key/);
    expectInBlock(key, /Principal:[\s\S]*cloudtrail\.amazonaws\.com/);
    expectInBlock(alias, /Type:\s*AWS::KMS::Alias/);
    expectInBlock(alias, /TargetKeyId:\s*!Ref\s*S3KMSKey/);
  });

  test('17) BucketPolicy permits CloudTrail ACL check and PutObject with bucket-owner-full-control', () => {
    const bp = getResourceBlock('S3BucketPolicy');
    expectInBlock(bp, /Action:\s*s3:GetBucketAcl/);
    expectInBlock(bp, /Action:\s*s3:PutObject/);
    expectInBlock(bp, /Condition:[\s\S]*StringEquals:[\s\S]*s3:x-amz-acl:\s*bucket-owner-full-control/);
  });

  test('18) CloudTrail configured with SSE-KMS and logging to the created bucket', () => {
    const ct = getResourceBlock('CloudTrail');
    expectInBlock(ct, /Type:\s*AWS::CloudTrail::Trail/);
    expectInBlock(ct, /IsLogging:\s*true/);
    expectInBlock(ct, /S3BucketName:\s*!Ref\s*S3Bucket/);
    expectInBlock(ct, /KMSKeyId:\s*!GetAtt\s*S3KMSKey\.Arn/);
  });

  test('19) LaunchTemplate includes IAM profile, SG, and UserData', () => {
    const lt = getResourceBlock('LaunchTemplate');
    expectInBlock(lt, /Type:\s*AWS::EC2::LaunchTemplate/);
    expectInBlock(lt, /IamInstanceProfile:\s*\n\s*Arn:\s*!GetAtt\s*EC2InstanceProfile\.Arn/);
    expectInBlock(lt, /SecurityGroupIds:\s*\n\s*-\s*!Ref\s*WebSecurityGroup/);
    expectInBlock(lt, /UserData:\s*\n\s*Fn::Base64:/);
  });

  test('20) AutoScalingGroup spans both subnets and uses LaunchTemplate with desired=2,min=2,max=4', () => {
    const asg = getResourceBlock('AutoScalingGroup');
    expectInBlock(asg, /Type:\s*AWS::AutoScaling::AutoScalingGroup/);
    expectInBlock(asg, /VPCZoneIdentifier:\s*\n\s*-\s*!Ref\s*PublicSubnet1\s*\n\s*-\s*!Ref\s*PublicSubnet2/);
    expectInBlock(asg, /DesiredCapacity:\s*2/);
    expectInBlock(asg, /MinSize:\s*2/);
    expectInBlock(asg, /MaxSize:\s*4/);
    expectInBlock(asg, /LaunchTemplate:\s*\n\s*LaunchTemplateId:\s*!Ref\s*LaunchTemplate/);
  });

  test('21) Scaling policies exist and alarms reference their ARNs', () => {
    const so = getResourceBlock('ScaleOutPolicy');
    const si = getResourceBlock('ScaleInPolicy');
    expectInBlock(so, /Type:\s*AWS::AutoScaling::ScalingPolicy/);
    expectInBlock(si, /Type:\s*AWS::AutoScaling::ScalingPolicy/);

    const aHigh = getResourceBlock('ScaleOutAlarm');
    const aLow = getResourceBlock('ScaleInAlarm');
    expectInBlock(aHigh, /Type:\s*AWS::CloudWatch::Alarm/);
    expectInBlock(aLow, /Type:\s*AWS::CloudWatch::Alarm/);
    expectInBlock(aHigh, /AlarmActions:\s*\n\s*-\s*!GetAtt\s*ScaleOutPolicy\.Arn/);
    expectInBlock(aLow, /AlarmActions:\s*\n\s*-\s*!GetAtt\s*ScaleInPolicy\.Arn/);
  });

  test('22) SSM Association runs AWS-RunPatchBaseline nightly and targets Project=TapStack', () => {
    const assoc = getResourceBlock('PatchingAssociation');
    expectInBlock(assoc, /Type:\s*AWS::SSM::Association/);
    expectInBlock(assoc, /Name:\s*AWS-RunPatchBaseline/);
    expectInBlock(assoc, /ScheduleExpression:\s*cron\(0 3 \* \* \? \*\)/);
    expectInBlock(assoc, /Targets:[\s\S]*Key:\s*tag:Project[\s\S]*Values:[\s\S]*-\s*TapStack/);
  });

  test('23) Outputs expose VPC, subnets, IPs, ASG, bucket, trail, KMS key', () => {
    const outs = getSectionBlock('Outputs');
    for (const key of [
      'VpcId','PublicSubnetIds','Instance1PublicIp','Instance2PublicIp',
      'AsgName','S3BucketName','CloudTrailName','KmsKeyId'
    ]) {
      expectInBlock(outs, new RegExp(`^\\s{2}${key}:\\s*$`, 'm'));
    }
  });

  test('24) Root volumes are gp3 encrypted and delete-on-termination in instances & launch template', () => {
    const i1 = getResourceBlock('Instance1');
    const i2 = getResourceBlock('Instance2');
    const lt = getResourceBlock('LaunchTemplate');
    for (const blk of [i1, i2, lt]) {
      expect(/VolumeType:\s*gp3/.test(blk)).toBe(true);
      expect(/Encrypted:\s*true/.test(blk)).toBe(true);
      expect(/DeleteOnTermination:\s*true/.test(blk)).toBe(true);
    }
  });
});
