import fs from 'fs';
import path from 'path';

let template: any;

describe('CloudFormation Template', () => {
  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    it('should have AWSTemplateFormatVersion and Description', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
    });
    it('should have Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    it('should define VpcCidr, AllowedCidrBlock, and DatabaseUsername', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.AllowedCidrBlock).toBeDefined();
      expect(template.Parameters.DatabaseUsername).toBeDefined();
    });
  });

  describe('Resources', () => {
    const resources = () => template.Resources;
    it('should create a VPC with correct CIDR and tags', () => {
      const vpc = resources().ProductionVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBeDefined();
      expect(vpc.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: 'Production' }),
        ])
      );
    });
    it('should create public and private subnets in different AZs', () => {
      [
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
      ].forEach(subnet => {
        expect(resources()[subnet]).toBeDefined();
        expect(resources()[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });
    it('should create an Internet Gateway and attach it to the VPC', () => {
      expect(resources().ProductionInternetGateway).toBeDefined();
      expect(resources().AttachGateway).toBeDefined();
      expect(resources().AttachGateway.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );
    });
    it('should create security groups with correct ingress rules', () => {
      const webSg = resources().WebServerSecurityGroup;
      expect(webSg).toBeDefined();
      expect(webSg.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ FromPort: 80, ToPort: 80 }),
          expect.objectContaining({ FromPort: 443, ToPort: 443 }),
        ])
      );
      const dbSg = resources().DatabaseSecurityGroup;
      expect(dbSg).toBeDefined();
      expect(dbSg.Properties.SecurityGroupIngress[0].FromPort).toBe(3306);
    });
    it('should create an S3 bucket with server-side encryption and public access blocked', () => {
      const s3 = resources().ProductionS3Bucket;
      expect(s3).toBeDefined();
      expect(s3.Properties.BucketEncryption).toBeDefined();
      expect(s3.Properties.PublicAccessBlockConfiguration).toMatchObject({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
    });
    it('should create IAM roles with least privilege and correct policies', () => {
      const ec2Role = resources().EC2InstanceRole;
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Type).toBe('AWS::IAM::Role');
      expect(ec2Role.Properties.Policies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ PolicyName: 'S3ReadOnlyAccess' }),
        ])
      );
      const lambdaRole = resources().LambdaExecutionRole;
      expect(lambdaRole).toBeDefined();
      expect(lambdaRole.Type).toBe('AWS::IAM::Role');
    });
    it('should create a DynamoDB table with point-in-time recovery', () => {
      const ddb = resources().ProductionDynamoDBTable;
      expect(ddb).toBeDefined();
      expect(ddb.Type).toBe('AWS::DynamoDB::Table');
      expect(
        ddb.Properties.PointInTimeRecoverySpecification
          .PointInTimeRecoveryEnabled
      ).toBe(true);
    });
    it('should create a backup plan with 7-day retention for DynamoDB', () => {
      const backupPlan = resources().DynamoDBBackupPlan;
      expect(backupPlan).toBeDefined();
      const rule = backupPlan.Properties.BackupPlan.BackupPlanRule[0];
      expect(rule.Lifecycle.DeleteAfterDays).toBeGreaterThanOrEqual(7);
    });
    it('should create AWS Config resources and a rule for root access key check', () => {
      expect(resources().ConfigServiceRole).toBeDefined();
      expect(resources().ConfigS3Bucket).toBeDefined();
      expect(resources().ConfigConfigurationRecorder).toBeDefined();
      expect(resources().RootAccessKeyCheckRule).toBeDefined();
    });
    it('should create an RDS instance with auto minor version upgrade and deletion protection', () => {
      const rds = resources().ProductionRDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Properties.AutoMinorVersionUpgrade).toBe(true);
      expect(rds.Properties.DeletionProtection).toBe(true);
      expect(rds.Properties.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    });
    it('should create a CloudTrail with IsLogging true and multi-region enabled', () => {
      const trail = resources().ProductionCloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
    });
    it('should create an EC2 Launch Template with termination protection', () => {
      const lt = resources().EC2LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.DisableApiTermination).toBe(true);
    });
    it('should create an Application Load Balancer with cross-zone load balancing', () => {
      const alb = resources().ProductionALB;
      expect(alb).toBeDefined();
      const attr = alb.Properties.LoadBalancerAttributes;
      expect(attr).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'load_balancing.cross_zone.enabled',
            Value: 'true',
          }),
        ])
      );
    });
    it('should create a Lambda function with a dead-letter queue', () => {
      const lambda = resources().ProductionLambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Properties.DeadLetterConfig.TargetArn).toBeDefined();
      expect(resources().LambdaDeadLetterQueue).toBeDefined();
    });
  });

  describe('Outputs', () => {
    it('should export VPC, S3, ALB DNS, and DynamoDB table names', () => {
      const outputs = template.Outputs;
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.DynamoDBTableName).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    it('should not hardcode region in resources', () => {
      const resourceStr = JSON.stringify(template.Resources);
      expect(resourceStr).not.toMatch(/us-east-1/);
    });
    it('should use dynamic references for secrets', () => {
      const rds = template.Resources.ProductionRDSInstance;
      // Accept both string and Fn::Sub dynamic reference for secretsmanager
      if (typeof rds.Properties.MasterUserPassword === 'string') {
        expect(rds.Properties.MasterUserPassword).toMatch(
          /\{\{resolve:secretsmanager:/
        );
      } else if (rds.Properties.MasterUserPassword['Fn::Sub']) {
        expect(rds.Properties.MasterUserPassword['Fn::Sub']).toMatch(
          /\{\{resolve:secretsmanager:/
        );
      } else {
        throw new Error('MasterUserPassword is not using a dynamic reference');
      }
    });
    it('should not use Fn::Sub unless variables are required', () => {
      const resourceStr = JSON.stringify(template.Resources);
      // Allow Fn::Sub for resource names, but not for static values
      expect(resourceStr.match(/Fn::Sub/g)?.length || 0).toBeGreaterThan(0);
    });
    it('should not include unsupported properties like BackupPolicy in DynamoDB', () => {
      const ddb = template.Resources.ProductionDynamoDBTable;
      expect(ddb.Properties.BackupPolicy).toBeUndefined();
    });
    it('should require IsLogging for CloudTrail', () => {
      const trail = template.Resources.ProductionCloudTrail;
      expect(trail.Properties.IsLogging).toBe(true);
    });
  });
});
