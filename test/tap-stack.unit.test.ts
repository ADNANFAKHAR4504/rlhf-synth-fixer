import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';

// Define a type for easier resource access
type ResourceMap = { [key: string]: { Type: string; Properties: any; Condition?: string } };

describe('TapStack CloudFormation Template (Unit Tests)', () => {
  let template: any;
  let R: ResourceMap; // Resources shorthand

  beforeAll(() => {
    // NOTE: Adjust the path if your TapStack.yml is not in '../lib' relative to your test file.
    const templatePath = path.join(__dirname, '..lib/TapStack.yml');
    // Assuming the test file is next to the YAML file. If not, adjust the path.
    const raw = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(raw) as any;
    R = template.Resources;
    expect(R).toBeDefined();
  });

  // --- General Structure Tests (from original file) ---

  test('Template core structure validation', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(R.ApplicationKMSKey).toBeDefined();
    expect(R.VPC).toBeDefined();
    expect(R.RDSDatabase).toBeDefined();
    expect(R.ApplicationLoadBalancer).toBeDefined();
    expect(R.CloudFrontDistribution).toBeDefined();
  });

  test('VPC and Subnet configuration is correct (6 subnets)', () => {
    // 1. Check total subnet count
    const subnets = Object.keys(R).filter(k => R[k]?.Type === 'AWS::EC2::Subnet');
    expect(subnets.length).toBe(6); // 2 Public, 2 Private, 2 DB

    // 2. Check Public Subnets
    const publicSubnet1 = R.PublicSubnet1.Properties;
    expect(publicSubnet1.MapPublicIpOnLaunch).toBe(true);
    expect(publicSubnet1.Tags.find((t: any) => t.Key === 'Type')?.Value).toBe('Public');

    // 3. Check Private Subnets
    const privateSubnet1 = R.PrivateSubnet1.Properties;
    expect(privateSubnet1.MapPublicIpOnLaunch).toBeUndefined(); // Should default to false
    expect(privateSubnet1.Tags.find((t: any) => t.Key === 'Type')?.Value).toBe('Private');

    // 4. Check VPC Flow Logs are enabled and encrypted
    expect(R.VPCFlowLog).toBeDefined();
    expect(R.VPCFlowLog.Properties.TrafficType).toBe('ALL');
    expect(R.VPCFlowLogGroup.Properties.KmsKeyId).toBeDefined(); // KMS encryption for logs
  });
  
  // --- Security Best Practices Tests ---

  test('KMS Key Policy allows AutoScaling/EC2 CreateGrant for encrypted volumes', () => {
    const policy = R.ApplicationKMSKey.Properties.KeyPolicy.Statement;
    
    // Check for EC2 CreateGrant statement (required for auto-scaling encrypted instances)
    const ec2Grant = policy.find((s: any) => s.Sid === 'AllowEC2ServiceToCreateGrants');
    expect(ec2Grant).toBeDefined();
    expect(ec2Grant.Action).toContain('kms:CreateGrant');

    // Check for AutoScaling CreateGrant statement (required for the service-linked role)
    const asgGrant = policy.find((s: any) => s.Sid === 'AllowAutoScalingServiceToCreateGrants');
    expect(asgGrant).toBeDefined();
    expect(asgGrant.Action).toContain('kms:CreateGrant');
  });

  test('Launch Template enforces IMDSv2 and EBS encryption', () => {
    const ltData = R.LaunchTemplate.Properties.LaunchTemplateData;

    // IMDSv2 Enforcement
    expect(ltData.MetadataOptions.HttpTokens).toBe('required');
    expect(ltData.MetadataOptions.HttpPutResponseHopLimit).toBe(1);

    // EBS Encryption
    const ebs = ltData.BlockDeviceMappings[0].Ebs;
    expect(ebs.Encrypted).toBe(true);
    expect(ebs.KmsKeyId).toBeDefined();
  });

  test('RDS Database is encrypted and uses Performance Insights', () => {
    const rds = R.RDSDatabase.Properties;
    expect(rds.StorageEncrypted).toBe(true);
    expect(rds.MultiAZ).toBe(true);
    expect(rds.EnablePerformanceInsights).toBe(true);
    expect(rds.PerformanceInsightsKMSKeyId).toBeDefined();
  });

  test('All S3 Buckets enforce Public Access Block', () => {
    const buckets = Object.keys(R).filter(k => R[k]?.Type === 'AWS::S3::Bucket');
    expect(buckets.length).toBeGreaterThanOrEqual(3); // AccessLogs, Logs, CloudTrail, (Config optional)

    buckets.forEach(key => {
        const bucketProps = R[key].Properties;
        expect(bucketProps.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(bucketProps.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    });
  });

  test('LogsBucket Policy denies insecure transport (HTTP)', () => {
    const policy = R.LogsBucketPolicy.Properties.PolicyDocument.Statement;
    const denyInsecure = policy.find((s: any) => s.Sid === 'DenyInsecureConnections');

    expect(denyInsecure).toBeDefined();
    expect(denyInsecure.Effect).toBe('Deny');
    expect(denyInsecure.Condition.Bool['aws:SecureTransport']).toBe('false');
  });

  // --- Security Group Logic Tests ---

  test('WebServer Security Group allows traffic only from ALB', () => {
    const webSgIngress = R.WebServerSecurityGroup.Properties.SecurityGroupIngress;
    
    // Should only allow port 80 from ALBSecurityGroup
    const albRule = webSgIngress.find((r: any) => r.FromPort === 80);
    expect(albRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    expect(albRule.CidrIp).toBeUndefined(); // Should not be 0.0.0.0/0
  });

  test('Database Security Group allows traffic only from WebServer/Lambda', () => {
    const dbSgIngress = R.DatabaseSecurityGroup.Properties.SecurityGroupIngress;
    
    // Check main DB port (3306)
    const dbRule = dbSgIngress.find((r: any) => r.FromPort === 3306);
    expect(dbRule.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    
    // Check that Lambda Egress allows DB connection
    const lambdaEgress = R.LambdaSecurityGroup.Properties.SecurityGroupEgress;
    const lambdaDbEgress = lambdaEgress.find((r: any) => r.FromPort === 3306);
    expect(lambdaDbEgress.CidrIp).toBe('10.0.0.0/8'); // Egress to VPC
  });

  test('WAFv2 WebACL includes critical managed rule sets', () => {
    expect(R.WebACL).toBeDefined();
    const rules = R.WebACL.Properties.Rules;
    
    // Check for Rate Limiting Rule
    expect(rules.some((r: any) => r.Name === 'RateLimitRule')).toBe(true);
    
    // Check for SQLi Rule Set
    expect(rules.some((r: any) => r.Name === 'SQLiRule')).toBe(true);
    
    // Check for Common Rule Set
    expect(rules.some((r: any) => r.Name === 'CommonRule')).toBe(true);
    
    // Check WAF is associated with ALB
    expect(R.WebACLAssociation.Properties.ResourceArn.Ref).toBe('ApplicationLoadBalancer');
  });

  // --- Conditional Logic Tests ---

  test('Conditional creation of HTTPS Listener (HasCertificate)', () => {
    // If CertificateArn is supplied, HasCertificate condition is met
    expect(R.ALBListener).toBeDefined();
    expect(R.ALBListener.Condition).toBe('HasCertificate');
    expect(R.ALBListener.Properties.Protocol).toBe('HTTPS');

    // If CertificateArn is NOT supplied, NoCertificate condition is met
    expect(R.ALBListenerHTTP).toBeDefined();
    expect(R.ALBListenerHTTP.Condition).toBe('NoCertificate');
    expect(R.ALBListenerHTTP.Properties.Protocol).toBe('HTTP');
  });

  test('AWS Config resources are guarded by CreateConfig condition', () => {
    // Check the main Config resources
    expect(R.ConfigRole.Condition).toBe('CreateConfig');
    expect(R.ConfigRecorder.Condition).toBe('CreateConfig');
    expect(R.ConfigDeliveryChannel.Condition).toBe('CreateConfig');

    // Check that at least one Config Rule exists and is conditional
    expect(R.EncryptedVolumesRule.Condition).toBe('CreateConfig');
    expect(R.EncryptedVolumesRule.Properties.Source.SourceIdentifier).toBe('ENCRYPTED_VOLUMES');
  });
});
