import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';

// Define a type for easier resource access
type ResourceMap = { [key: string]: { Type: string; Properties: any; Condition?: string } };

describe('TapStack CloudFormation Template (Unit Tests)', () => {
  let template: any;
  let R: ResourceMap; // Resources shorthand

  beforeAll(() => {
    // Corrected Path: This is essential for the test to run.
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const raw = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(raw) as any;
    R = template.Resources;
    expect(R).toBeDefined();
  });

  // --- Core Structure Tests ---

  test('Template core structure and essential resources validation', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    // Check for resources that actually exist in TapStack.yml
    expect(R.ApplicationKMSKey).toBeDefined();
    expect(R.VPC).toBeDefined();
    expect(R.RDSDatabase).toBeDefined();
    expect(R.PublicSubnet1).toBeDefined();
    expect(R.DatabaseSecurityGroup).toBeDefined();
  });

  // --- Network Configuration Tests ---

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
    // MapPublicIpOnLaunch should be undefined in YAML for private subnets, which defaults to false
    expect(privateSubnet1.MapPublicIpOnLaunch).toBeUndefined();
    expect(privateSubnet1.Tags.find((t: any) => t.Key === 'Type')?.Value).toBe('Private');
  });

  test('VPC Flow Logs are enabled and encrypted', () => {
    expect(R.VPCFlowLog).toBeDefined();
    expect(R.VPCFlowLog.Properties.TrafficType).toBe('ALL');
    // Check that the Log Group uses the Application KMS Key for encryption
    expect(R.VPCFlowLogGroup.Properties.KmsKeyId).toBeDefined();
  });

  // --- Security & Encryption Tests ---

  test('KMS Key Policy allows AutoScaling/EC2 CreateGrant for encrypted volumes', () => {
    const policy = R.ApplicationKMSKey.Properties.KeyPolicy.Statement;
    
    // Check for EC2 CreateGrant statement
    const ec2Grant = policy.find((s: any) => s.Sid === 'AllowEC2ServiceToCreateGrants');
    expect(ec2Grant).toBeDefined();
    expect(ec2Grant.Action).toContain('kms:CreateGrant');

    // Check for AutoScaling CreateGrant statement
    const asgGrant = policy.find((s: any) => s.Sid === 'AllowAutoScalingServiceToCreateGrants');
    expect(asgGrant).toBeDefined();
    expect(asgGrant.Action).toContain('kms:CreateGrant');
  });

  test('RDS Database is encrypted, Multi-AZ, and uses Performance Insights', () => {
    const rds = R.RDSDatabase.Properties;
    expect(rds.StorageEncrypted).toBe(true);
    expect(rds.MultiAZ).toBe(true);
    expect(rds.EnablePerformanceInsights).toBe(true);
    expect(rds.PerformanceInsightsKMSKeyId).toBeDefined();
  });

  test('S3 Buckets enforce Public Access Block and use encryption', () => {
    // Check AccessLogsBucket
    const bucketProps = R.AccessLogsBucket.Properties;
    expect(bucketProps.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    expect(bucketProps.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);

    // Check LogsBucket (KMS encrypted)
    const logsBucketProps = R.LogsBucket.Properties;
    expect(logsBucketProps.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    expect(logsBucketProps.VersioningConfiguration.Status).toBe('Enabled');
  });

  // --- Security Group Logic Tests ---

  test('WebServer Security Group allows traffic only from ALB (Port 80)', () => {
    const webSgIngress = R.WebServerSecurityGroup.Properties.SecurityGroupIngress;
    
    // Should only allow port 80 from ALBSecurityGroup
    const albRule = webSgIngress.find((r: any) => r.FromPort === 80);
    expect(albRule).toBeDefined();
    expect(albRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    expect(albRule.CidrIp).toBeUndefined(); // Ensures it's not open to 0.0.0.0/0
  });

  test('Database Security Group restricts traffic to WebServer/Lambda', () => {
    const dbSgIngress = R.DatabaseSecurityGroup.Properties.SecurityGroupIngress;
    
    // Check main DB port (3306) ingress from WebServerSG
    const dbRule = dbSgIngress.find((r: any) => r.FromPort === 3306);
    expect(dbRule).toBeDefined();
    expect(dbRule.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    
    // Check that Lambda Egress allows DB connection (10.0.0.0/8)
    const lambdaEgress = R.LambdaSecurityGroup.Properties.SecurityGroupEgress;
    const lambdaDbEgress = lambdaEgress.find((r: any) => r.FromPort === 3306);
    expect(lambdaDbEgress).toBeDefined();
    expect(lambdaDbEgress.CidrIp).toBe('10.0.0.0/8');
  });

});
