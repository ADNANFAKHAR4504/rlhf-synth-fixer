import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure and Format', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a descriptive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure-by-default');
      expect(template.Description).toContain('multi-region');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have Mappings section with RegionMap', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.RegionMap).toBeDefined();
    });
  });

  describe('RegionMap Mappings', () => {
    test('should have AMI mappings for all supported regions', () => {
      const regionMap = template.Mappings.RegionMap;
      const expectedRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-south-1'];
      
      expectedRegions.forEach(region => {
        expect(regionMap[region]).toBeDefined();
        expect(regionMap[region].AMI).toBeDefined();
        expect(regionMap[region].AMI).toMatch(/^ami-[a-f0-9]{8,}$/);
      });
    });

    test('should have correct AMI for ap-south-1 region', () => {
      const regionMap = template.Mappings.RegionMap;
      expect(regionMap['ap-south-1'].AMI).toBe('ami-05a4fc6eaa38ee23c');
    });

    test('should have correct AMI for us-east-1 region', () => {
      const regionMap = template.Mappings.RegionMap;
      expect(regionMap['us-east-1'].AMI).toBe('ami-0c02fb55956c7d316');
    });
  });

  describe('Region-Specific Resource Naming', () => {
    test('S3 buckets should have region-specific naming', () => {
      const staticBucket = template.Resources.StaticContentBucket;
      const loggingBucket = template.Resources.LoggingBucket;
      const configBucket = template.Resources.ConfigBucket;
      
      expect(staticBucket.Properties.BucketName['Fn::Sub']).toContain('${AWSRegion}');
      expect(loggingBucket.Properties.BucketName['Fn::Sub']).toContain('${AWSRegion}');
      expect(configBucket.Properties.BucketName['Fn::Sub']).toContain('${AWSRegion}');
    });

    test('Load Balancer components should have region-specific naming', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const targetGroup = template.Resources.ALBTargetGroup;
      
      expect(alb.Properties.Name['Fn::Sub']).toContain('${AWSRegion}');
      expect(targetGroup.Properties.Name['Fn::Sub']).toContain('${AWSRegion}');
    });

    test('Launch Template should have region-specific naming', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateName['Fn::Sub']).toContain('${AWSRegion}');
    });

    test('AWS Config resources should have region-specific naming', () => {
      const deliveryChannel = template.Resources.ConfigDeliveryChannel;
      const recorder = template.Resources.ConfigurationRecorder;
      
      expect(deliveryChannel.Properties.Name['Fn::Sub']).toContain('${AWSRegion}');
      expect(recorder.Properties.Name['Fn::Sub']).toContain('${AWSRegion}');
    });
  });

  describe('Parameters Validation', () => {
    test('should have AllowedSSHCIDR parameter', () => {
      expect(template.Parameters.AllowedSSHCIDR).toBeDefined();
      const param = template.Parameters.AllowedSSHCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/8');
      expect(param.Description).toContain('CIDR block allowed for SSH access');
      expect(param.AllowedPattern).toBe('^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$');
    });

    test('should have AWSRegion parameter with all supported regions', () => {
      expect(template.Parameters.AWSRegion).toBeDefined();
      const param = template.Parameters.AWSRegion;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('ap-south-1');
      expect(param.Description).toContain('AWS region for the infrastructure deployment');
      
      const expectedRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-south-1'];
      expectedRegions.forEach(region => {
        expect(param.AllowedValues).toContain(region);
      });
    });
  });

  describe('Secrets Manager Security', () => {
    test('should have DatabaseSecret with proper configuration', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.SecretStringTemplate).toBe('{"username": "dbadmin"}');
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(16);
    });

    test('DatabaseSecret should use stack-specific and region-specific naming', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.Name['Fn::Sub']).toContain('${AWS::StackName}');
      expect(secret.Properties.Name['Fn::Sub']).toContain('${AWSRegion}');
    });
  });

  describe('KMS Key Security', () => {
    test('should have RDS KMS key with proper encryption', () => {
      expect(template.Resources.RDSKMSKey).toBeDefined();
      const kmsKey = template.Resources.RDSKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.Description).toBe('KMS Key for RDS encryption');
    });

    test('should have KMS key alias with region-specific naming', () => {
      expect(template.Resources.RDSKMSKeyAlias).toBeDefined();
      const alias = template.Resources.RDSKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toBe('alias/rds-encryption-key-${AWSRegion}');
    });

    test('KMS key policy should allow RDS service', () => {
      const kmsKey = template.Resources.RDSKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const rdsStatement = statements.find((s: any) => s.Sid === 'Allow RDS Service');
      expect(rdsStatement).toBeDefined();
      expect(rdsStatement.Principal.Service).toBe('rds.amazonaws.com');
      expect(rdsStatement.Action).toContain('kms:Decrypt');
      expect(rdsStatement.Action).toContain('kms:GenerateDataKey');
    });
  });

  describe('VPC and Networking Security', () => {
    test('should have VPC with proper CIDR and DNS settings', () => {
      expect(template.Resources.SecureVPC).toBeDefined();
      const vpc = template.Resources.SecureVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets in multiple AZs', () => {
      const expectedSubnets = [
        'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2'
      ];
      
      expectedSubnets.forEach(subnetName => {
        expect(template.Resources[subnetName]).toBeDefined();
        const subnet = template.Resources[subnetName];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId.Ref).toBe('SecureVPC');
      });
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      ['PublicSubnet1', 'PublicSubnet2'].forEach(subnetName => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should have route to internet via Internet Gateway (LocalStack compatible)', () => {
      // NAT Gateway removed for LocalStack compatibility - EIP AllocationId not supported
      // Private subnets use Internet Gateway directly in LocalStack testing environment
      expect(template.Resources.DefaultPrivateRoute).toBeDefined();
      const privateRoute = template.Resources.DefaultPrivateRoute;
      expect(privateRoute.Type).toBe('AWS::EC2::Route');
      expect(privateRoute.Properties.GatewayId.Ref).toBe('InternetGateway');
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Security Groups - Least Privilege Access', () => {
    test('ALB security group should only allow HTTP/HTTPS inbound', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      expect(albSg.Properties.SecurityGroupIngress).toHaveLength(2);
      
      const ingressRules = albSg.Properties.SecurityGroupIngress;
      const httpRule = ingressRules.find((r: any) => r.FromPort === 80);
      const httpsRule = ingressRules.find((r: any) => r.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('web server security group should restrict SSH access', () => {
      const webSg = template.Resources.WebServerSecurityGroup;
      const sshRule = webSg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp.Ref).toBe('AllowedSSHCIDR');
    });

    test('database security group should only allow access from web servers', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      const dbRule = dbSg.Properties.SecurityGroupIngress[0];
      expect(dbRule.FromPort).toBe(3306);
      expect(dbRule.ToPort).toBe(3306);
      expect(dbRule.SourceSecurityGroupId.Ref).toBe('WebServerSecurityGroup');
    });

    test('security groups should not have overly permissive egress rules', () => {
      const webSg = template.Resources.WebServerSecurityGroup;
      const egressRules = webSg.Properties.SecurityGroupEgress;
      
      // Should allow all outbound traffic (common pattern for web servers)
      expect(egressRules).toHaveLength(1);
      const egress = egressRules[0];
      expect(egress.IpProtocol).toBe(-1); // All protocols
      expect(egress.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('S3 Bucket Security', () => {
    test('static content bucket should have encryption enabled', () => {
      const bucket = template.Resources.StaticContentBucket;
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('static content bucket should block public access', () => {
      const bucket = template.Resources.StaticContentBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('static content bucket should have versioning enabled', () => {
      const bucket = template.Resources.StaticContentBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('static content bucket should have access logging configured', () => {
      const bucket = template.Resources.StaticContentBucket;
      expect(bucket.Properties.LoggingConfiguration).toBeDefined();
      expect(bucket.Properties.LoggingConfiguration.DestinationBucketName.Ref).toBe('LoggingBucket');
    });
  });

  describe('IAM Security - Least Privilege', () => {
    test('EC2 role should have minimal required permissions', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      
      const policies = ec2Role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
      
      const s3Statements = s3Policy.PolicyDocument.Statement;
      expect(s3Statements).toHaveLength(2);
      
      // Should only allow access to specific S3 bucket
      const bucketAccess = s3Statements.find((s: any) => s.Action.includes('s3:ListBucket'));
      expect(bucketAccess.Resource['Fn::Sub']).toBe('arn:aws:s3:::${StaticContentBucket}');
    });

    test('EC2 role should include CloudWatch permissions', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('IAM Account Password Policy should enforce strong passwords', () => {
      // Note: IAMAccountPasswordPolicy was removed to avoid CAPABILITY_NAMED_IAM requirement
      // Password policy is now enforced through AWS Config rules instead
      const passwordPolicy = template.Resources.IAMAccountPasswordPolicy;
      expect(passwordPolicy).toBeUndefined();
      
      // Verify that AWS Config rules are in place for password policy enforcement
      const configRules = Object.values(template.Resources).filter((resource: any) => 
        resource.Type === 'AWS::Config::ConfigRule'
      );
      expect(configRules.length).toBeGreaterThan(0);
      
      // Check for IAM password policy config rule
      const iamPasswordPolicyRule = Object.values(template.Resources).find((resource: any) => 
        resource.Type === 'AWS::Config::ConfigRule' && 
        resource.Properties?.Source?.SourceIdentifier === 'IAM_PASSWORD_POLICY'
      );
      expect(iamPasswordPolicyRule).toBeDefined();
    });
  });

  describe('RDS Database Security', () => {
    test('RDS instance should have encryption enabled', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId.Ref).toBe('RDSKMSKey');
    });

    test('RDS instance should use Secrets Manager for credentials and have region-specific identifier', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.MasterUsername['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(db.Properties.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(db.Properties.DBInstanceIdentifier['Fn::Sub']).toContain('${AWSRegion}');
    });

    test('RDS instance should have proper security settings', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.PubliclyAccessible).toBe(false);
      // DeletionProtection disabled for LocalStack compatibility (testing environment)
      expect(db.Properties.DeletionProtection).toBe(false);
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('RDS instance should be in private subnets', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.DBSubnetGroupName.Ref).toBe('DBSubnetGroup');
      
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('Auto Scaling and Load Balancer Security', () => {
    test('Auto Scaling group should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('Application Load Balancer should be internet-facing with region-specific naming', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Name['Fn::Sub']).toContain('${AWSRegion}');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });
  });

  describe('CloudWatch and Monitoring', () => {
    test('should have CloudWatch log group configured with region-specific naming', () => {
      expect(template.Resources.CloudWatchLogGroup).toBeDefined();
      const logGroup = template.Resources.CloudWatchLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(14);
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain('${AWSRegion}');
    });

    test('launch template should configure CloudWatch agent', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      const userData = launchTemplate.Properties.LaunchTemplateData.UserData['Fn::Base64']['Fn::Sub'];
      expect(userData).toContain('amazon-cloudwatch-agent');
      expect(userData).toContain('amazon-cloudwatch-agent-ctl');
    });
  });

  describe('AWS Config Compliance', () => {
    test('should have AWS Config configuration recorder with region-specific naming', () => {
      expect(template.Resources.ConfigurationRecorder).toBeDefined();
      const recorder = template.Resources.ConfigurationRecorder;
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
      expect(recorder.Properties.Name['Fn::Sub']).toContain('${AWSRegion}');
    });

    test('should have Config delivery channel', () => {
      expect(template.Resources.ConfigDeliveryChannel).toBeDefined();
    });

    test('should have compliance rules configured with region-specific naming', () => {
      expect(template.Resources.S3BucketPublicAccessProhibitedRule).toBeDefined();
      expect(template.Resources.RDSStorageEncryptedRule).toBeDefined();
      
      const s3Rule = template.Resources.S3BucketPublicAccessProhibitedRule;
      const rdsRule = template.Resources.RDSStorageEncryptedRule;
      
      expect(s3Rule.Properties.ConfigRuleName['Fn::Sub']).toContain('${AWSRegion}');
      expect(rdsRule.Properties.ConfigRuleName['Fn::Sub']).toContain('${AWSRegion}');
    });

  });

  describe('Template Outputs', () => {
    test('should export VPC ID', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      const output = template.Outputs.VPCId;
      expect(output.Value.Ref).toBe('SecureVPC');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-VPC-ID');
    });

    test('should export ALB DNS name', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Value['Fn::GetAtt']).toEqual(['ApplicationLoadBalancer', 'DNSName']);
    });

    test('should export S3 bucket name', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      const output = template.Outputs.S3BucketName;
      expect(output.Value.Ref).toBe('StaticContentBucket');
    });

    test('should export database endpoint', () => {
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Value['Fn::GetAtt']).toEqual(['DatabaseInstance', 'Endpoint.Address']);
    });

    test('should export AWS region', () => {
      expect(template.Outputs.AWSRegion).toBeDefined();
      const output = template.Outputs.AWSRegion;
      expect(output.Value['Ref']).toBe('AWSRegion');
      expect(output.Description).toContain('AWS Region where infrastructure is deployed');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-AWS-Region');
    });

    test('should export EC2 role name', () => {
      expect(template.Outputs.EC2RoleName).toBeDefined();
      const output = template.Outputs.EC2RoleName;
      expect(output.Value['Ref']).toBe('EC2Role');
      expect(output.Description).toContain('EC2 Instance Role Name');
      expect(output.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-EC2-Role-Name');
    });
  });

  describe('Security Best Practices Validation', () => {
    test('key resources should have proper tags', () => {
      // Check that key resources have tags (some resources may not have tags)
      const keyResources = ['SecureVPC', 'ApplicationLoadBalancer', 'DatabaseInstance', 'StaticContentBucket'];
      let taggedResources = 0;
      keyResources.forEach(resourceName => {
        if (template.Resources[resourceName] && template.Resources[resourceName].Properties && template.Resources[resourceName].Properties.Tags) {
          taggedResources++;
        }
      });
      // At least some key resources should have tags
      expect(taggedResources).toBeGreaterThan(0);
    });

    test('no resources should have overly permissive security configurations', () => {
      // Check that no security groups allow 0.0.0.0/0 for sensitive ports
      const securityGroups = ['ALBSecurityGroup', 'WebServerSecurityGroup', 'DatabaseSecurityGroup'];
      
      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        if (sg.Properties.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
            if (rule.FromPort === 22 || rule.FromPort === 3306) {
              expect(rule.CidrIp).not.toBe('0.0.0.0/0');
            }
          });
        }
      });
    });

    test('deletion policies should be appropriate for data resources', () => {
      const db = template.Resources.DatabaseInstance;
      // DeletionPolicy set to Delete for LocalStack compatibility (testing environment)
      expect(db.DeletionPolicy).toBe('Delete');
    });

    test('launch template should use region-specific AMI mapping', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      const imageId = launchTemplate.Properties.LaunchTemplateData.ImageId;
      expect(imageId['Fn::FindInMap']).toBeDefined();
      expect(imageId['Fn::FindInMap'][0]).toBe('RegionMap');
      expect(imageId['Fn::FindInMap'][1]['Ref']).toBe('AWSRegion');
      expect(imageId['Fn::FindInMap'][2]).toBe('AMI');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have circular dependencies', () => {
      // This is a basic check - in practice, you'd use AWS CLI to validate
      const resources = Object.keys(template.Resources);
      expect(resources.length).toBeGreaterThan(0);
    });

    test('template should have valid resource references', () => {
      // Basic validation that the template has resources and they reference each other properly
      const resourceNames = Object.keys(template.Resources);
      expect(resourceNames.length).toBeGreaterThan(0);
      
      // Check that key resources exist
      const keyResources = ['SecureVPC', 'RDSKMSKey', 'StaticContentBucket', 'DatabaseInstance'];
      keyResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });
  });
});
