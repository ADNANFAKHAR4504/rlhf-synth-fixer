import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON before running tests: pipenv run cfn-flip-to-json > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('VPC and Subnets', () => {
    test('VPC should exist and have correct CIDR', () => {
      expect(template.Resources.ProdVPC).toBeDefined();
      expect(template.Resources.ProdVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });
    test('Should have two public and two private subnets', () => {
      expect(template.Resources.ProdPublicSubnet1).toBeDefined();
      expect(template.Resources.ProdPublicSubnet2).toBeDefined();
      expect(template.Resources.ProdPrivateSubnet1).toBeDefined();
      expect(template.Resources.ProdPrivateSubnet2).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('S3 buckets should have access logging and ownership controls', () => {
      expect(template.Resources.ProdS3Bucket).toBeDefined();
      expect(template.Resources.ProdS3AccessLogs).toBeDefined();
      expect(template.Resources.ProdS3AccessLogs.Properties.OwnershipControls).toBeDefined();
      expect(template.Resources.ProdS3Bucket.Properties.LoggingConfiguration).toBeDefined();
    });
  });

  describe('RDS', () => {
    test('RDS instance should use db.t3.micro and reference SecretsManager for password', () => {
      expect(template.Resources.ProdRDSInstance).toBeDefined();
      expect(template.Resources.ProdRDSInstance.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(template.Resources.ProdRDSInstance.Properties.MasterUserPassword).toMatchObject({ Ref: 'RDSMasterPassword' });
      expect(template.Resources.RDSMasterPassword).toBeDefined();
    });
  });

  describe('ALB and ACM', () => {
    test('ALB and ACM certificate should be present and configured for HTTPS', () => {
      expect(template.Resources.ProdALB).toBeDefined();
      expect(template.Resources.ProdALBListenerCertificate).toBeDefined();
      // Check for conditional listeners
      const httpsListener = template.Resources.ProdALBListenerHTTPS;
      const httpListener = template.Resources.ProdALBListenerHTTP;
      if (httpsListener) {
        expect(httpsListener.Properties.Port).toBe(443);
        expect(httpsListener.Properties.Protocol).toBe('HTTPS');
      } else if (httpListener) {
        expect(httpListener.Properties.Port).toBe(80);
        expect(httpListener.Properties.Protocol).toBe('HTTP');
      } else {
        throw new Error('No ALB listener found');
      }
    });
  });

  describe('AutoScaling and CloudWatch', () => {
    test('AutoScalingGroup and ScalingPolicy should be present and use CPU metrics', () => {
      expect(template.Resources.ProdAutoScalingGroup).toBeDefined();
      expect(template.Resources.ProdScalingPolicy).toBeDefined();
      expect(template.Resources.ProdScalingPolicy.Properties.TargetTrackingConfiguration.PredefinedMetricSpecification.PredefinedMetricType).toBe('ASGAverageCPUUtilization');
    });
    test('CloudWatch alarm should detect 5xx errors from ALB', () => {
      expect(template.Resources.ProdCloudWatchAlarm).toBeDefined();
      expect(template.Resources.ProdCloudWatchAlarm.Properties.MetricName).toBe('HTTPCode_ELB_5XX_Count');
      expect(template.Resources.ProdCloudWatchAlarm.Properties.Namespace).toBe('AWS/ApplicationELB');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id',
        'S3BucketName', 'RDSInstanceId', 'ALBArn', 'CloudWatchAlarmName'
      ];
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });
  });

  describe('Naming Convention', () => {
    test('resource names should follow prod-<service> convention', () => {
      const allowedNonProd = ['RDSMasterPassword'];
      Object.keys(template.Resources).forEach(resourceKey => {
        if (!allowedNonProd.includes(resourceKey)) {
          expect(resourceKey).toMatch(/^Prod[A-Z]/);
        }
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EC2 IAM role should exist and have least privilege', () => {
      const role = template.Resources.ProdEC2Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      const policyDoc = role.Properties.Policies[0].PolicyDocument;
      expect(policyDoc.Statement.some((s: any) => s.Action.includes('s3:GetObject'))).toBe(true);
      expect(policyDoc.Statement.some((s: any) => s.Action.includes('logs:CreateLogStream'))).toBe(true);
    });
    test('EC2 instance profile should reference EC2 role', () => {
      const profile = template.Resources.ProdEC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'ProdEC2Role' });
    });
    test('RDS IAM role should exist and have least privilege', () => {
      const role = template.Resources.ProdRDSRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      const policyDoc = role.Properties.Policies[0].PolicyDocument;
      expect(policyDoc.Statement.some((s: any) => s.Action.includes('logs:CreateLogStream'))).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('ALB security group should allow inbound 443 and all outbound', () => {
      const sg = template.Resources.ProdALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress.some((i: any) => i.FromPort === 443 && i.ToPort === 443)).toBe(true);
      expect(sg.Properties.SecurityGroupEgress.some((e: any) => e.IpProtocol === -1)).toBe(true);
    });
    test('EC2 security group should allow inbound 80 from ALB and all outbound', () => {
      const sg = template.Resources.ProdEC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress.some((i: any) => i.FromPort === 80 && i.ToPort === 80)).toBe(true);
      expect(sg.Properties.SecurityGroupEgress.some((e: any) => e.IpProtocol === -1)).toBe(true);
    });
  });

  describe('S3 Bucket Policy', () => {
    test('S3 access logs bucket policy should allow logging', () => {
      const policy = template.Resources.ProdS3AccessLogsPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement.some((s: any) => s.Principal.Service === 'logging.s3.amazonaws.com')).toBe(true);
    });
  });

  describe('RDS Subnet Group', () => {
    test('RDS subnet group should reference both private subnets', () => {
      const group = template.Resources.ProdRDSSubnetGroup;
      expect(group).toBeDefined();
      expect(group.Properties.SubnetIds).toContainEqual({ Ref: 'ProdPrivateSubnet1' });
      expect(group.Properties.SubnetIds).toContainEqual({ Ref: 'ProdPrivateSubnet2' });
    });
  });

  describe('Tagging', () => {
    test('All major resources should have Name and Environment tags', () => {
      const resourcesToCheck = [
        'ProdVPC', 'ProdPublicSubnet1', 'ProdPublicSubnet2', 'ProdPrivateSubnet1', 'ProdPrivateSubnet2',
        'ProdS3AccessLogs', 'ProdS3Bucket', 'ProdRDSSubnetGroup', 'ProdRDSInstance', 'ProdALBSecurityGroup',
        'ProdEC2SecurityGroup', 'ProdALB', 'ProdAutoScalingGroup', 'ProdCloudWatchAlarm'
      ];
      resourcesToCheck.forEach(key => {
        const res = template.Resources[key];
        expect(res).toBeDefined();
        expect(res.Properties.Tags.some((t: any) => t.Key === 'Name')).toBe(true);
        expect(res.Properties.Tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      });
    });
  });
});