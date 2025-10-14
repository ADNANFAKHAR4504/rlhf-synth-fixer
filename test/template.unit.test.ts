import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have correct CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.MinLength).toBe(1);
    });

    test('should have InstanceType parameter with allowed values', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.InstanceType.Type).toBe('String');
      expect(template.Parameters.InstanceType.Default).toBe('t3.micro');
      expect(template.Parameters.InstanceType.AllowedValues).toContain('t3.micro');
      expect(template.Parameters.InstanceType.AllowedValues).toContain('t3.small');
      expect(template.Parameters.InstanceType.AllowedValues).toContain('t3.medium');
    });

    test('should have DesiredCapacity parameter with constraints', () => {
      expect(template.Parameters.DesiredCapacity).toBeDefined();
      expect(template.Parameters.DesiredCapacity.Type).toBe('Number');
      expect(template.Parameters.DesiredCapacity.Default).toBe(2);
      expect(template.Parameters.DesiredCapacity.MinValue).toBe(1);
      expect(template.Parameters.DesiredCapacity.MaxValue).toBe(10);
    });
  });

  describe('VPC Configuration', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have environment suffix in tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      expect(tags).toBeDefined();
      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Subnet Configuration', () => {
    test('should have PublicSubnet1', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PublicSubnet2', () => {
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PrivateSubnet1', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should have PrivateSubnet2', () => {
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('subnets should be in different availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select'][0];
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone['Fn::Select'][0];
      expect(subnet1AZ).toBe(0);
      expect(subnet2AZ).toBe(1);
    });
  });

  describe('Internet Gateway', () => {
    test('should have Internet Gateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway attachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have private route table', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have default public route to internet gateway', () => {
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(template.Resources.DefaultPublicRoute.DependsOn).toBe('InternetGatewayAttachment');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const ingress = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[1].FromPort).toBe(443);
      expect(ingress[1].ToPort).toBe(443);
    });

    test('should have instance security group', () => {
      expect(template.Resources.InstanceSecurityGroup).toBeDefined();
      expect(template.Resources.InstanceSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('instance security group should allow traffic from ALB only', () => {
      const ingress = template.Resources.InstanceSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      ingress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      });
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have rotation enabled', () => {
      expect(template.Resources.EncryptionKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have CloudWatch Logs policy', () => {
      const policy = template.Resources.EncryptionKey.Properties.KeyPolicy;
      const logsStatement = policy.Statement.find((s: any) => s.Sid === 'Allow CloudWatch Logs');
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Principal.Service['Fn::Sub']).toContain('logs');
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('S3 Buckets', () => {
    test('should have artifact bucket', () => {
      expect(template.Resources.ArtifactBucket).toBeDefined();
      expect(template.Resources.ArtifactBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('artifact bucket should have encryption enabled', () => {
      const encryption = template.Resources.ArtifactBucket.Properties.BucketEncryption;
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('artifact bucket should block public access', () => {
      const publicAccessBlock = template.Resources.ArtifactBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have logs bucket', () => {
      expect(template.Resources.LogsBucket).toBeDefined();
      expect(template.Resources.LogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('logs bucket should have lifecycle policy', () => {
      const lifecycle = template.Resources.LogsBucket.Properties.LifecycleConfiguration;
      expect(lifecycle).toBeDefined();
      expect(lifecycle.Rules).toHaveLength(1);
      expect(lifecycle.Rules[0].ExpirationInDays).toBe(90);
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      expect(template.Resources.ApplicationLoadBalancer.Properties.Scheme).toBe('internet-facing');
    });

    test('should have target group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('target group should have health check configured', () => {
      const tg = template.Resources.ALBTargetGroup.Properties;
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
    });

    test('should have ALB listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(template.Resources.ALBListener.Properties.Port).toBe(80);
    });
  });

  describe('Auto Scaling', () => {
    test('should have launch template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('launch template should use AL2023 AMI', () => {
      const imageId = template.Resources.LaunchTemplate.Properties.LaunchTemplateData.ImageId;
      expect(imageId).toContain('al2023-ami-kernel-default-x86_64');
    });

    test('launch template should have IMDSv2 enforced', () => {
      const metadata = template.Resources.LaunchTemplate.Properties.LaunchTemplateData.MetadataOptions;
      expect(metadata.HttpTokens).toBe('required');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should have correct capacity configuration', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.MinSize).toBe(1);
      expect(asg.MaxSize).toBe(6);
    });

    test('should have scaling policy', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleUpPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(template.Resources.ScaleUpPolicy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });
  });

  describe('IAM Roles', () => {
    test('should have instance role', () => {
      expect(template.Resources.InstanceRole).toBeDefined();
      expect(template.Resources.InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('instance role should have managed policies', () => {
      const policies = template.Resources.InstanceRole.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(policies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should have CodeDeploy service role with inline policies', () => {
      expect(template.Resources.CodeDeployServiceRole).toBeDefined();
      expect(template.Resources.CodeDeployServiceRole.Type).toBe('AWS::IAM::Role');
      // Should use inline policies, not managed policy
      expect(template.Resources.CodeDeployServiceRole.Properties.Policies).toBeDefined();
      expect(template.Resources.CodeDeployServiceRole.Properties.ManagedPolicyArns).toBeUndefined();
    });

    test('should have CodeBuild service role', () => {
      expect(template.Resources.CodeBuildServiceRole).toBeDefined();
      expect(template.Resources.CodeBuildServiceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have CodePipeline service role', () => {
      expect(template.Resources.CodePipelineServiceRole).toBeDefined();
      expect(template.Resources.CodePipelineServiceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have instance profile', () => {
      expect(template.Resources.InstanceProfile).toBeDefined();
      expect(template.Resources.InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('CI/CD Resources', () => {
    test('should have CodeDeploy application', () => {
      expect(template.Resources.CodeDeployApplication).toBeDefined();
      expect(template.Resources.CodeDeployApplication.Type).toBe('AWS::CodeDeploy::Application');
      expect(template.Resources.CodeDeployApplication.Properties.ComputePlatform).toBe('Server');
    });

    test('should have CodeDeploy deployment group', () => {
      expect(template.Resources.CodeDeployDeploymentGroup).toBeDefined();
      expect(template.Resources.CodeDeployDeploymentGroup.Type).toBe('AWS::CodeDeploy::DeploymentGroup');
    });

    test('should have CodeBuild project', () => {
      expect(template.Resources.CodeBuildProject).toBeDefined();
      expect(template.Resources.CodeBuildProject.Type).toBe('AWS::CodeBuild::Project');
    });

    test('CodeBuild project should have environment variables', () => {
      const envVars = template.Resources.CodeBuildProject.Properties.Environment.EnvironmentVariables;
      expect(envVars).toBeDefined();
      const envSuffix = envVars.find((v: any) => v.Name === 'ENVIRONMENT_SUFFIX');
      expect(envSuffix).toBeDefined();
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have application log group', () => {
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have error log group', () => {
      expect(template.Resources.ErrorLogGroup).toBeDefined();
      expect(template.Resources.ErrorLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log groups should have retention policy', () => {
      expect(template.Resources.ApplicationLogGroup.Properties.RetentionInDays).toBe(7);
      expect(template.Resources.ErrorLogGroup.Properties.RetentionInDays).toBe(7);
    });

    test('should have CPU alarm', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.HighCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.HighCPUAlarm.Properties.Threshold).toBe(80);
    });

    test('should have unhealthy host alarm', () => {
      expect(template.Resources.UnhealthyHostAlarm).toBeDefined();
      expect(template.Resources.UnhealthyHostAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  describe('VPC Endpoint', () => {
    test('should have S3 VPC endpoint', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });
  });

  describe('Resource Naming', () => {
    test('all resource names should include environment suffix', () => {
      const resourcesToCheck = [
        'VPC',
        'ALBSecurityGroup',
        'InstanceSecurityGroup',
        'ApplicationLoadBalancer',
        'EncryptionKey',
        'ArtifactBucket',
        'LogsBucket',
        'CodeDeployServiceRole',
        'CodeBuildServiceRole',
        'InstanceRole',
      ];

      resourcesToCheck.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          if (nameTag && nameTag.Value['Fn::Sub']) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        } else if (resource.Properties.BucketName || resource.Properties.RoleName || resource.Properties.GroupName) {
          const name = resource.Properties.BucketName || resource.Properties.RoleName || resource.Properties.GroupName;
          if (name['Fn::Sub']) {
            expect(name['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have LoadBalancerDNS output', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
    });

    test('should have bucket outputs', () => {
      expect(template.Outputs.ArtifactBucketName).toBeDefined();
      expect(template.Outputs.LogsBucketName).toBeDefined();
    });

    test('should have KMS key outputs', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyArn).toBeDefined();
    });

    test('should have CI/CD outputs', () => {
      expect(template.Outputs.CodeDeployApplicationName).toBeDefined();
      expect(template.Outputs.CodeBuildProjectName).toBeDefined();
      expect(template.Outputs.AutoScalingGroupName).toBeDefined();
    });

    test('should have subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });
  });
});
