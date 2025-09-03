import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-grade web application infrastructure with VPC, public/private subnets, RDS, and secure S3 access'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.DBUsername).toBeDefined();
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('DBUsername parameter should have correct properties', () => {
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });


    test('InstanceType parameter should have correct properties', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.medium');
      expect(param.AllowedValues).toContain('t3.micro');
      expect(param.AllowedValues).toContain('t3.medium');
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.Tags[0].Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
    });

    test('should have NAT Gateway with EIP', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should use dynamic AZ selection', () => {
      const subnet1 = template.Resources.PublicSubnet1.Properties;
      const subnet2 = template.Resources.PublicSubnet2.Properties;
      expect(subnet1.AvailabilityZone['Fn::Select']).toBeDefined();
      expect(subnet1.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have database subnets', () => {
      expect(template.Resources.DatabaseSubnet1).toBeDefined();
      expect(template.Resources.DatabaseSubnet2).toBeDefined();
      expect(template.Resources.DatabaseSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.DatabaseSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute1).toBeDefined();
    });

    test('should have route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });
  });

  describe('Security Groups', () => {
    test('should have LoadBalancer security group', () => {
      expect(template.Resources.LoadBalancerSecurityGroup).toBeDefined();
      expect(template.Resources.LoadBalancerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('LoadBalancer SG should allow HTTP and HTTPS from internet', () => {
      const sg = template.Resources.LoadBalancerSecurityGroup.Properties;
      expect(sg.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      const ingress = sg.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].CidrIp).toBe('0.0.0.0/0');
      expect(ingress[1].FromPort).toBe(443);
      expect(ingress[1].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have WebServer security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('WebServer SG should only allow traffic from LoadBalancer', () => {
      const sg = template.Resources.WebServerSecurityGroup.Properties;
      expect(sg.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      const ingress = sg.SecurityGroupIngress;
      expect(ingress[0].SourceSecurityGroupId.Ref).toBe('LoadBalancerSecurityGroup');
      expect(ingress[0].FromPort).toBe(80);
    });

    test('should have Database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('Database SG should only allow traffic from WebServers', () => {
      const sg = template.Resources.DatabaseSecurityGroup.Properties;
      expect(sg.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      const ingress = sg.SecurityGroupIngress;
      expect(ingress[0].SourceSecurityGroupId.Ref).toBe('WebServerSecurityGroup');
      expect(ingress[0].FromPort).toBe(3306);
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      expect(template.Resources.DatabaseInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should have encryption enabled', () => {
      const rds = template.Resources.DatabaseInstance.Properties;
      expect(rds.StorageEncrypted).toBe(true);
      expect(rds.KmsKeyId).toBe('alias/aws/rds');
    });

    test('RDS should not have deletion protection for QA', () => {
      const rds = template.Resources.DatabaseInstance.Properties;
      expect(rds.DeletionProtection).toBe(false);
    });

    test('RDS should have Multi-AZ enabled', () => {
      const rds = template.Resources.DatabaseInstance.Properties;
      expect(rds.MultiAZ).toBe(true);
    });

    test('RDS should use environment suffix in naming', () => {
      const rds = template.Resources.DatabaseInstance.Properties;
      expect(rds.DBInstanceIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DatabaseSubnetGroup).toBeDefined();
      expect(template.Resources.DatabaseSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      const props = template.Resources.DatabaseSubnetGroup.Properties;
      expect(props.DBSubnetGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('S3 and IAM', () => {
    test('should have S3 bucket', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const s3 = template.Resources.S3Bucket.Properties;
      expect(s3.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should block public access', () => {
      const s3 = template.Resources.S3Bucket.Properties;
      expect(s3.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(s3.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(s3.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(s3.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have proper configuration', () => {
      const s3 = template.Resources.S3Bucket.Properties;
      expect(s3.BucketEncryption).toBeDefined();
      expect(s3.PublicAccessBlockConfiguration).toBeDefined();
    });

    test('should have IAM role for EC2 S3 access', () => {
      expect(template.Resources.EC2S3AccessRole).toBeDefined();
      expect(template.Resources.EC2S3AccessRole.Type).toBe('AWS::IAM::Role');
    });

    test('IAM role should have least privilege S3 access', () => {
      const role = template.Resources.EC2S3AccessRole.Properties;
      expect(role.AssumeRolePolicyDocument).toBeDefined();
      const policy = role.Policies[0].PolicyDocument.Statement;
      expect(policy[0].Action).toContain('s3:ListBucket');
      expect(policy[1].Action).toContain('s3:GetObject');
      expect(policy[1].Action).toContain('s3:PutObject');
      expect(policy[1].Action).toContain('s3:DeleteObject');
    });

    test('should have instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Load Balancer and Auto Scaling', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have target group', () => {
      expect(template.Resources.WebServerTargetGroup).toBeDefined();
      expect(template.Resources.WebServerTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('target group should have health checks configured', () => {
      const tg = template.Resources.WebServerTargetGroup.Properties;
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have listener', () => {
      expect(template.Resources.LoadBalancerListener).toBeDefined();
      expect(template.Resources.LoadBalancerListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('should have launch template', () => {
      expect(template.Resources.WebServerLaunchTemplate).toBeDefined();
      expect(template.Resources.WebServerLaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('launch template should use environment suffix', () => {
      const lt = template.Resources.WebServerLaunchTemplate.Properties;
      expect(lt.LaunchTemplateName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.WebServerAutoScalingGroup).toBeDefined();
      expect(template.Resources.WebServerAutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should have correct configuration', () => {
      const asg = template.Resources.WebServerAutoScalingGroup.Properties;
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.AutoScalingGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.EC2RoleArn).toBeDefined();
      expect(template.Outputs.StackName).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value.Ref).toBe('VPC');
      expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
    });

    test('LoadBalancerDNS output should be correct', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Value['Fn::GetAtt'][0]).toBe('ApplicationLoadBalancer');
      expect(output.Value['Fn::GetAtt'][1]).toBe('DNSName');
    });

    test('DatabaseEndpoint output should be correct', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Value['Fn::GetAtt'][0]).toBe('DatabaseInstance');
      expect(output.Value['Fn::GetAtt'][1]).toBe('Endpoint.Address');
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Value.Ref).toBe('S3Bucket');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(() => JSON.stringify(template)).not.toThrow();
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('all resources should have Type property', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        expect(template.Resources[resourceName].Type).toBeDefined();
      });
    });

    test('all parameters should have Type property', () => {
      Object.keys(template.Parameters).forEach(paramName => {
        expect(template.Parameters[paramName].Type).toBeDefined();
      });
    });

    test('should have correct resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // We have many resources
    });
  });

  describe('Resource Dependencies', () => {
    test('NAT Gateway should depend on Internet Gateway attachment', () => {
      expect(template.Resources.NatGateway1EIP.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('Routes should depend on gateways', () => {
      expect(template.Resources.DefaultPublicRoute.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('Database should reference correct security group', () => {
      const rds = template.Resources.DatabaseInstance.Properties;
      expect(rds.VPCSecurityGroups[0].Ref).toBe('DatabaseSecurityGroup');
    });

    test('ALB should reference correct subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Subnets[0].Ref).toBe('PublicSubnet1');
      expect(alb.Subnets[1].Ref).toBe('PublicSubnet2');
    });

    test('ASG should reference private subnets', () => {
      const asg = template.Resources.WebServerAutoScalingGroup.Properties;
      expect(asg.VPCZoneIdentifier[0].Ref).toBe('PrivateSubnet1');
      expect(asg.VPCZoneIdentifier[1].Ref).toBe('PrivateSubnet2');
    });
  });

  describe('Best Practices', () => {
    test('should use references instead of hardcoded values', () => {
      const templateStr = JSON.stringify(template);
      // Should not have hardcoded availability zones
      expect(templateStr).not.toContain('us-west-2a');
      expect(templateStr).not.toContain('us-west-2b');
    });

    test('all taggable resources should have Name tags', () => {
      const taggableResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'DatabaseSubnet1', 'DatabaseSubnet2',
        'LoadBalancerSecurityGroup', 'WebServerSecurityGroup', 'DatabaseSecurityGroup'
      ];
      
      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          expect(nameTag).toBeDefined();
        }
      });
    });

    test('should use CloudFormation intrinsic functions appropriately', () => {
      // Check for proper use of !Sub for dynamic naming in other resources
      const vpc = template.Resources.VPC.Properties.Tags[0].Value;
      expect(vpc['Fn::Sub']).toBeDefined();
      
      // Check that IAM role exists and has proper structure
      const iamRole = template.Resources.EC2S3AccessRole.Properties;
      expect(iamRole.AssumeRolePolicyDocument).toBeDefined();
    });

  });
});