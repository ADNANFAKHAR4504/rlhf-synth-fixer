// unittest.ts
/**
 * Zero-dependency unit tests for lib/TapStack.yml.
 * We read the YAML as plain text and assert on structure/guards via regex,
 * so no custom YAML/CFN schema packages are needed.
 */
import fs from 'fs';
import path from 'path';

const tplPath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
const raw = fs.readFileSync(tplPath, 'utf8');

const has = (re: RegExp) => re.test(raw);
const matchAll = (re: RegExp) => Array.from(raw.matchAll(re));
const count = (re: RegExp) => matchAll(re).length;

describe('TapStack.yml (unit, no extra deps)', () => {
  it('has base header and sections', () => {
    expect(has(/AWSTemplateFormatVersion:\s*["']?2010-09-09["']?/)).toBe(true);
    expect(has(/^\s*Description:\s*>\s*$/m)).toBe(true);
    expect(has(/^\s*Parameters:\s*$/m)).toBe(true);
    expect(has(/^\s*Conditions:\s*$/m)).toBe(true);
    expect(has(/^\s*Resources:\s*$/m)).toBe(true);
    expect(has(/^\s*Outputs:\s*$/m)).toBe(true);
  });

  it('defines key Parameters and Conditions', () => {
    // Parameters
    ['ProjectName','EnvironmentSuffix','VpcCidr','PublicSubnetCidrs','PrivateSubnetCidrs','DbPassword','SsmParamName']
      .forEach(p => expect(has(new RegExp(`^\\s{2}${p}:\\s*$`, 'm'))).toBe(true));

    // Conditions
    ['CreateSecurityHub','CreateAWSConfig','HasCustomSsmName']
      .forEach(c => expect(has(new RegExp(`^\\s{2}${c}:\\s*!`, 'm'))).toBe(true));
  });

  it('never uses RoleName or UserName (no named IAM / no IAM Users)', () => {
    expect(has(/\bRoleName:/)).toBe(false);
    expect(has(/\bUserName:/)).toBe(false);
    // also no IAM::User resources
    expect(has(/Type:\s*AWS::IAM::User/)).toBe(false);
  });

  it('required resource logical IDs exist', () => {
    const required = [
      'AppKmsKey','AppKmsAlias',
      'VPC','PublicSubnetA','PublicSubnetB','PrivateSubnetA','PrivateSubnetB',
      'PublicRouteTable','NatGateway','PrivateRouteTableA','PrivateRouteTableB',
      'WebSecurityGroup',
      'AppBucket','CloudTrailBucket','ConfigBucket',
      'CloudTrailBucketPolicy','ConfigBucketPolicy',
      'CloudTrailLogGroup','Trail',
      'VpcFlowLogGroup','VpcFlowLogs',
      'LambdaExecutionRole','AppLambda','AppLambdaLogGroup',
      'AppDbPasswordParam',
      'UnauthorizedMetricFilter','UnauthorizedAccessAlarm'
    ];
    required.forEach(r =>
      expect(has(new RegExp(`^\\s{2}${r}:\\s*$`, 'm'))).toBe(true)
    );
  });

  it('SSM parameter: Type=String and Name uses !If (conditional)', () => {
    // Look at the AppDbPasswordParam block roughly
    expect(has(/^\s{2}AppDbPasswordParam:\s*[\s\S]*?Type:\s*AWS::SSM::Parameter/m)).toBe(true);
    expect(has(/^\s{6}Type:\s*String\s*$/m)).toBe(true);
    expect(has(/^\s{6}Name:\s*!If\s/m)).toBe(true);
  });

  it('Security Group allows only tcp/443 ingress and egress', () => {
    // Ingress 443
    expect(has(/WebSecurityGroup:[\s\S]*?SecurityGroupIngress:[\s\S]*?IpProtocol:\s*tcp[\s\S]*?FromPort:\s*443[\s\S]*?ToPort:\s*443/m)).toBe(true);
    // Egress restricted to tcp/443 to 0.0.0.0/0
    expect(has(/WebSecurityGroup:[\s\S]*?SecurityGroupEgress:[\s\S]*?IpProtocol:\s*tcp[\s\S]*?FromPort:\s*443[\s\S]*?ToPort:\s*443[\s\S]*?CidrIp:\s*["']?0\.0\.0\.0\/0["']?/m)).toBe(true);
    // Ensure no wide-open 0-65535 rules
    expect(has(/FromPort:\s*0/)).toBe(false);
    expect(has(/ToPort:\s*65535/)).toBe(false);
  });

  it('KMS key has rotation enabled', () => {
    expect(has(/AppKmsKey:[\s\S]*?EnableKeyRotation:\s*true/m)).toBe(true);
  });

  it('S3 buckets have versioning and encryption enabled', () => {
    ['AppBucket','CloudTrailBucket','ConfigBucket'].forEach(b => {
      expect(has(new RegExp(`${b}:[\\s\\S]*?VersioningConfiguration:\\s*\\{\\s*Status:\\s*Enabled\\s*\\}`, 'm'))).toBe(true);
      expect(has(new RegExp(`${b}:[\\s\\S]*?BucketEncryption:\\s*[\\s\\S]*?ServerSideEncryptionConfiguration`, 'm'))).toBe(true);
    });
  });

  it('CloudTrail bucket policy denies deletes and enforces TLS', () => {
    const block = /CloudTrailBucketPolicy:[\s\S]*?PolicyDocument:[\s\S]*?Statement:[\s\S]*?DenyDeleteCloudTrailLogs[\s\S]*?s3:DeleteObjectVersion[\s\S]*?EnforceTLS[\s\S]*?Effect:\s*Deny/m;
    expect(has(block)).toBe(true);
  });

  it('CloudTrail streams to CloudWatch Logs and is logging with validation', () => {
    // Extract the entire Trail resource block (up to next top-level resource or EOF)
    const blockMatch = raw.match(
      /^\s{2}Trail:\s*[\s\S]*?(?=^\s{2}[A-Za-z][A-Za-z0-9]*:\s*$|\Z)/m
    );
    expect(blockMatch).toBeTruthy();
    const block = blockMatch![0];

    // Must be a CloudTrail resource
    expect(/Type:\s*AWS::CloudTrail::Trail/.test(block)).toBe(true);

    // Order-independent assertions inside the same resource block
    expect(/IsLogging:\s*true/.test(block)).toBe(true);
    expect(/EnableLogFileValidation:\s*true/.test(block)).toBe(true);
    expect(/CloudWatchLogsLogGroupArn:/.test(block)).toBe(true);
    expect(/CloudWatchLogsRoleArn:/.test(block)).toBe(true);
    expect(/IncludeGlobalServiceEvents:\s*true/.test(block)).toBe(true);
    expect(/IsMultiRegionTrail:\s*true/.test(block)).toBe(true);
  });

  it('Lambda role has least-priv SSM read to specific param via !If', () => {
    const ssmStmt = /LambdaExecutionRole:[\s\S]*?PolicyName:.*lambda-ssm-[\s\S]*?Sid:\s*ReadSpecificParam[\s\S]*?Action:[\s\S]*?ssm:GetParameter[\s\S]*?Resource:\s*!If/m;
    expect(has(ssmStmt)).toBe(true);
    // No wildcard Resource for SSM
    expect(has(/LambdaExecutionRole:[\s\S]*?ssm:[\s\S]*?Resource:\s*["']\*["']/m)).toBe(false);
  });

  it('Security Hub & AWS Config resources are under conditions', () => {
    // Security Hub
    expect(has(/SecurityHubHub:\s*\n\s*Condition:\s*CreateSecurityHub/m)).toBe(true);
    expect(has(/SecurityHubFSBP:\s*\n\s*Condition:\s*CreateSecurityHub/m)).toBe(true);
    // AWS Config (a few examples; template has more)
    ['ConfigRole','ConfigRecorder','ConfigDeliveryChannel','ConfigRuleCloudTrailEnabled'].forEach(n => {
      expect(has(new RegExp(`${n}:\\s*\\n\\s*Condition:\\s*CreateAWSConfig`, 'm'))).toBe(true);
    });
  });

  it('Outputs include resolved SSM param name via !If', () => {
    const out = /Outputs:[\s\S]*?SsmParamDbPassword:[\s\S]*?Value:\s*!If/m;
    expect(has(out)).toBe(true);
  });

  it('basic counts sanity (helps catch accidental deletions)', () => {
    // Count number of top-level resource logical IDs (heuristic)
    const logicals = matchAll(/^\s{2}[A-Za-z0-9]+[A-Za-z0-9]+:\s*$/gm);
    expect(logicals.length).toBeGreaterThanOrEqual(25);
  });
});