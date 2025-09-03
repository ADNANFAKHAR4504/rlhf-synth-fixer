import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('has correct format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toContain(
        'Scalable and secure web application'
      );
    });

    test('has required parameters', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      expect(template.Parameters.DBUsername.Type).toBe('String');
      expect(template.Parameters.DBUsername.Default).toBe('admin');
      expect(template.Parameters.DBUsername.MinLength).toBe(1);
      expect(template.Parameters.DBUsername.MaxLength).toBe(16);
      expect(template.Parameters.DBUsername.AllowedPattern).toBe(
        '[a-zA-Z][a-zA-Z0-9]*'
      );
      expect(template.Parameters.DBUsername.ConstraintDescription).toBe(
        'Must begin with a letter and contain only alphanumeric characters'
      );

      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('Production');
      expect(template.Parameters.Environment.AllowedValues).toContain(
        'Production'
      );
      expect(template.Parameters.Environment.AllowedValues).toContain(
        'Staging'
      );
      expect(template.Parameters.Environment.AllowedValues).toContain(
        'Development'
      );
    });

    test('defines environment conditions', () => {
      const conditions = template.Conditions || {};
      expect(Object.keys(conditions)).toHaveLength(1);
      expect(conditions.IsProduction).toBeDefined();
      expect(conditions.IsProduction['Fn::Equals']).toBeDefined();
    });
  });

  describe('VPC and Networking', () => {
    test('defines core networking resources', () => {
      const r = template.Resources;
      expect(r.VPC).toBeDefined();
      expect(r.VPC.Type).toBe('AWS::EC2::VPC');
      expect(r.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(r.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(r.VPC.Properties.EnableDnsSupport).toBe(true);

      expect(r.PublicSubnet1).toBeDefined();
      expect(r.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(r.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(r.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');

      expect(r.PublicSubnet2).toBeDefined();
      expect(r.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');

      expect(r.PrivateSubnet1).toBeDefined();
      expect(r.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');

      expect(r.PrivateSubnet2).toBeDefined();
      expect(r.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });

    test('uses dynamic availability zones', () => {
      const pub1 = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const pub2 = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      expect(pub1['Fn::Select']).toBeDefined();
      expect(pub2['Fn::Select']).toBeDefined();
      expect(pub1['Fn::Select'][0]).toBe(0);
      expect(pub2['Fn::Select'][0]).toBe(1);
    });

    test('defines internet gateway and attachment', () => {
      const r = template.Resources;
      expect(r.InternetGateway).toBeDefined();
      expect(r.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(r.InternetGatewayAttachment).toBeDefined();
      expect(r.InternetGatewayAttachment.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );
    });

    test('defines NAT gateway with EIP', () => {
      const r = template.Resources;
      expect(r.NatGatewayEIP).toBeDefined();
      expect(r.NatGatewayEIP.Type).toBe('AWS::EC2::EIP');
      expect(r.NatGateway).toBeDefined();
      expect(r.NatGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('defines route tables and associations', () => {
      const r = template.Resources;
      expect(r.PublicRouteTable).toBeDefined();
      expect(r.PrivateRouteTable).toBeDefined();
      expect(r.DefaultPublicRoute).toBeDefined();
      expect(r.DefaultPrivateRoute).toBeDefined();
    });

    test('defines VPC flow logs', () => {
      const r = template.Resources;
      expect(r.VPCFlowLogRole).toBeDefined();
      expect(r.VPCFlowLogs).toBeDefined();
      expect(r.VPCFlowLogsPolicy).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('defines ALB security group with correct ingress rules', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      expect(albSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSg.Properties.GroupName['Fn::Sub']).toContain(
        'ALB-SecurityGroup'
      );
      expect(albSg.Properties.VpcId.Ref).toBe('VPC');

      const ingress = albSg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[1].FromPort).toBe(443);
      expect(ingress[1].ToPort).toBe(443);
    });

    test('defines web server security group', () => {
      const webSg = template.Resources.WebServerSecurityGroup;
      expect(webSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(webSg.Properties.GroupName['Fn::Sub']).toContain(
        'WebServer-SecurityGroup'
      );
      expect(webSg.Properties.VpcId.Ref).toBe('VPC');

      const ingress = webSg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(3);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[1].FromPort).toBe(443);
      expect(ingress[1].ToPort).toBe(443);
      expect(ingress[2].FromPort).toBe(22);
      expect(ingress[2].ToPort).toBe(22);
    });

    test('defines database security group', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      expect(dbSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(dbSg.Properties.GroupName['Fn::Sub']).toContain(
        'Database-SecurityGroup'
      );
      expect(dbSg.Properties.VpcId.Ref).toBe('VPC');

      const ingress = dbSg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[1].FromPort).toBe(3306);
      expect(ingress[1].ToPort).toBe(3306);
    });
  });

  describe('IAM and Security', () => {
    test('defines EC2 role with correct policies', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName['Fn::Sub']).toContain('EC2-Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Effect).toBe(
        'Allow'
      );
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('ec2.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe(
        'sts:AssumeRole'
      );

      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(2);
      expect(policies[0].PolicyName).toBe('SecretsManagerAccess');
      expect(policies[1].PolicyName).toBe('S3Access');
    });

    test('defines EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.InstanceProfileName['Fn::Sub']).toContain(
        'EC2-InstanceProfile'
      );
      expect(profile.Properties.Roles).toHaveLength(1);
    });

    test('defines database secret with correct properties', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Name['Fn::Sub']).toContain(
        'Database-Credentials'
      );
      expect(secret.Properties.Description).toBe(
        'Database credentials for web application'
      );
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('defines database KMS key with correct properties', () => {
      const kmsKey = template.Resources.DatabaseKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.Description['Fn::Sub']).toContain(
        'KMS Key for ${AWS::StackName} RDS Database encryption'
      );
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Version).toBe('2012-10-17');
      expect(kmsKey.Properties.KeyPolicy.Statement).toHaveLength(2);

      // Verify account root access statement
      const rootStatement = kmsKey.Properties.KeyPolicy.Statement[0];
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
      expect(rootStatement.Principal.AWS['Fn::Sub']).toContain(
        'iam::${AWS::AccountId}:root'
      );

      // Verify RDS service access statement
      const rdsStatement = kmsKey.Properties.KeyPolicy.Statement[1];
      expect(rdsStatement.Effect).toBe('Allow');
      expect(rdsStatement.Principal.Service).toBe('rds.amazonaws.com');
      expect(rdsStatement.Action).toContain('kms:Encrypt');
      expect(rdsStatement.Action).toContain('kms:Decrypt');
      expect(rdsStatement.Action).toContain('kms:DescribeKey');

      // Verify tags
      expect(kmsKey.Properties.Tags).toBeDefined();
      expect(kmsKey.Properties.Tags).toHaveLength(3);
      const nameTag = kmsKey.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      const envTag = kmsKey.Properties.Tags.find(
        (tag: any) => tag.Key === 'Environment'
      );
      const purposeTag = kmsKey.Properties.Tags.find(
        (tag: any) => tag.Key === 'Purpose'
      );
      expect(nameTag.Value['Fn::Sub']).toContain('Database-KMS-Key');
      expect(envTag.Value.Ref).toBe('Environment');
      expect(purposeTag.Value).toBe('RDS Encryption');
    });

    test('defines database KMS key alias', () => {
      const kmsAlias = template.Resources.DatabaseKMSKeyAlias;
      expect(kmsAlias.Type).toBe('AWS::KMS::Alias');
      expect(kmsAlias.Properties.AliasName['Fn::Sub']).toContain(
        'alias/${AWS::StackName}-database-key'
      );
      expect(kmsAlias.Properties.TargetKeyId.Ref).toBe('DatabaseKMSKey');
    });
  });

  describe('RDS Database', () => {
    test('defines database subnet group', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.DBSubnetGroupName['Fn::Sub']).toContain(
        'database-subnet-group'
      );
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('RDS is multi-AZ, encrypted, and uses Secrets Manager dynamic refs', () => {
      const db = template.Resources.Database;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.DeletionPolicy).toBe('Snapshot');
      expect(db.UpdateReplacePolicy).toBe('Snapshot');
      expect(db.Properties.DBInstanceIdentifier['Fn::Sub']).toContain(
        'database'
      );
      expect(db.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.43');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.PubliclyAccessible).toBe(false);

      // Verify KMS key is used for encryption
      expect(db.Properties.KmsKeyId).toBeDefined();
      expect(db.Properties.KmsKeyId.Ref).toBe('DatabaseKMSKey');

      // Verify Secrets Manager integration
      expect(db.Properties.MasterUsername['Fn::Sub']).toContain(
        '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}'
      );
      expect(db.Properties.MasterUserPassword['Fn::Sub']).toContain(
        '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
      );
    });
  });

  describe('Load Balancer', () => {
    test('ALB is configured with HTTP listener only', () => {
      const r = template.Resources;
      expect(r.ApplicationLoadBalancer).toBeDefined();
      expect(r.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      expect(r.ApplicationLoadBalancer.Properties.Name['Fn::Sub']).toContain(
        'ALB'
      );
      expect(r.ApplicationLoadBalancer.Properties.Scheme).toBe(
        'internet-facing'
      );
      expect(r.ApplicationLoadBalancer.Properties.Type).toBe('application');

      expect(r.ALBListenerHTTP).toBeDefined();
      expect(r.ALBListenerHTTP.Type).toBe(
        'AWS::ElasticLoadBalancingV2::Listener'
      );
      expect(r.ALBListenerHTTP.Properties.Port).toBe(80);
      expect(r.ALBListenerHTTP.Properties.Protocol).toBe('HTTP');

      // HTTPS listener should not exist
      expect(r.ALBListenerHTTPS).toBeUndefined();
    });

    test('defines target group', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.VpcId.Ref).toBe('VPC');
    });
  });

  describe('Launch Template and Auto Scaling', () => {
    test('defines launch template with correct properties', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateName['Fn::Sub']).toContain(
        'LaunchTemplate'
      );

      const data = lt.Properties.LaunchTemplateData;
      expect(data.ImageId).toContain(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      );
      expect(data.InstanceType).toBe('t3.micro');
      expect(data.IamInstanceProfile.Arn['Fn::GetAtt']).toBeDefined();
    });

    test('ASG has desired capacity range 2-5', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.AutoScalingGroupName['Fn::Sub']).toContain('ASG');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(5);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });
  });

  describe('CloudWatch and Scaling', () => {
    test('defines CPU alarms and scaling policies', () => {
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.CPUAlarmHigh.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
      expect(template.Resources.CPUAlarmLow).toBeDefined();
      expect(template.Resources.CPUAlarmLow.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
    });
  });

  describe('S3 and Storage', () => {
    test('S3 bucket has versioning enabled', () => {
      const s3 = template.Resources.S3Bucket;
      expect(s3.Type).toBe('AWS::S3::Bucket');
      expect(s3.Properties.BucketName['Fn::Sub']).toContain('tapstack-logs');
      expect(s3.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(s3.Properties.BucketEncryption).toBeDefined();
      expect(s3.Properties.PublicAccessBlockConfiguration).toBeDefined();
    });

    test('S3 bucket policy allows ALB logs', () => {
      const policy = template.Resources.S3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket.Ref).toBe('S3Bucket');
    });
  });

  describe('Outputs', () => {
    test('outputs include the ALB DNS name', () => {
      const outputs = template.Outputs;
      expect(outputs.ApplicationLoadBalancerDNS).toBeDefined();
      expect(outputs.ApplicationLoadBalancerDNS.Description).toBe(
        'DNS name of the Application Load Balancer'
      );
    });

    test('outputs include ALB URL (HTTP)', () => {
      const outputs = template.Outputs;
      expect(outputs.ApplicationLoadBalancerURL).toBeDefined();
      expect(outputs.ApplicationLoadBalancerURL.Description).toBe(
        'URL to access the Application Load Balancer'
      );
      expect(outputs.ApplicationLoadBalancerURL.Value['Fn::Sub']).toContain(
        'http://'
      );
    });

    test('outputs include VPC ID', () => {
      const outputs = template.Outputs;
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId.Description).toBe('VPC ID');
    });

    test('outputs include database endpoint', () => {
      const outputs = template.Outputs;
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabaseEndpoint.Description).toBe(
        'RDS Database Endpoint'
      );
    });

    test('outputs include S3 bucket name', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Description).toBe(
        'S3 Bucket Name for Static Content and ALB Logs'
      );
      expect(template.Outputs.S3BucketName.Value.Ref).toBe('S3Bucket');
    });

    test('outputs include Auto Scaling Group name', () => {
      expect(template.Outputs.AutoScalingGroupName).toBeDefined();
      expect(template.Outputs.AutoScalingGroupName.Description).toBe(
        'Name of the Auto Scaling Group'
      );
    });

    test('outputs include stack region', () => {
      expect(template.Outputs.StackRegion).toBeDefined();
      expect(template.Outputs.StackRegion.Description).toBe(
        'AWS Region where the stack is deployed'
      );
    });

    test('outputs include ALB log delivery role ARN', () => {
      expect(template.Outputs.ALBLogDeliveryRoleArn).toBeDefined();
      expect(template.Outputs.ALBLogDeliveryRoleArn.Description).toBe(
        'ARN of the ALB Log Delivery IAM Role'
      );
      expect(
        template.Outputs.ALBLogDeliveryRoleArn.Value['Fn::GetAtt']
      ).toBeDefined();
    });

    test('outputs include database KMS key ID', () => {
      expect(template.Outputs.DatabaseKMSKeyId).toBeDefined();
      expect(template.Outputs.DatabaseKMSKeyId.Description).toBe(
        'KMS Key ID used for RDS Database encryption'
      );
      expect(template.Outputs.DatabaseKMSKeyId.Value.Ref).toBe(
        'DatabaseKMSKey'
      );
      expect(
        template.Outputs.DatabaseKMSKeyId.Export.Name['Fn::Sub']
      ).toContain('Database-KMS-Key-ID');
    });

    test('outputs include database KMS key ARN', () => {
      expect(template.Outputs.DatabaseKMSKeyArn).toBeDefined();
      expect(template.Outputs.DatabaseKMSKeyArn.Description).toBe(
        'KMS Key ARN used for RDS Database encryption'
      );
      expect(template.Outputs.DatabaseKMSKeyArn.Value['Fn::GetAtt']).toEqual([
        'DatabaseKMSKey',
        'Arn',
      ]);
      expect(
        template.Outputs.DatabaseKMSKeyArn.Export.Name['Fn::Sub']
      ).toContain('Database-KMS-Key-ARN');
    });
  });

  describe('Resource Counts', () => {
    test('has correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
    });

    test('has correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // DBUsername and Environment
    });

    test('has correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10); // Updated count to include DatabaseKMSKeyId and DatabaseKMSKeyArn
    });
  });
});
