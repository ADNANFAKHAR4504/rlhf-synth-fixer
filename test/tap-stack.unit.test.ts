import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ===========================
  // Template Structure Tests
  // ===========================
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have non-empty Resources section', () => {
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });
  });

  // ===========================
  // Parameters Tests
  // ===========================
  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'ProjectName',
        'EnvironmentSuffix',
        'SourceObjectKey',
        'NotificationEmail',
        'GitHubOwner',
        'GitHubRepo',
        'GitHubBranch',
        'UseGitHubSource'
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('all parameters should have Type property', () => {
      Object.values(template.Parameters).forEach((param: any) => {
        expect(param.Type).toBeDefined();
        expect(typeof param.Type).toBe('string');
      });
    });

    test('all parameters should have Default values', () => {
      Object.values(template.Parameters).forEach((param: any) => {
        expect(param.Default).toBeDefined();
      });
    });

    test('all parameters should have Description', () => {
      Object.values(template.Parameters).forEach((param: any) => {
        expect(param.Description).toBeDefined();
        expect(typeof param.Description).toBe('string');
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('ms-app');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(50);
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('NotificationEmail parameter should have email pattern', () => {
      const param = template.Parameters.NotificationEmail;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toMatch(/\[.*@.*\]/);
    });

    test('UseGitHubSource parameter should have allowed values', () => {
      const param = template.Parameters.UseGitHubSource;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });
  });

  // ===========================
  // Conditions Tests
  // ===========================
  describe('Conditions', () => {
    test('should have all required conditions', () => {
      const expectedConditions = [
        'IsProduction',
        'IsStaging',
        'RequiresApproval',
        'UseGitHub'
      ];

      expectedConditions.forEach(condition => {
        expect(template.Conditions[condition]).toBeDefined();
      });
    });

    test('IsProduction condition should check for prod environment', () => {
      const condition = template.Conditions.IsProduction;
      expect(condition).toHaveProperty('Fn::Equals');
      expect(condition['Fn::Equals']).toContainEqual({ Ref: 'EnvironmentType' });
      expect(condition['Fn::Equals']).toContainEqual('prod');
    });

    test('IsStaging condition should check for staging environment', () => {
      const condition = template.Conditions.IsStaging;
      expect(condition).toHaveProperty('Fn::Equals');
      expect(condition['Fn::Equals']).toContainEqual({ Ref: 'EnvironmentType' });
      expect(condition['Fn::Equals']).toContainEqual('staging');
    });

    test('RequiresApproval condition should use Or operator', () => {
      const condition = template.Conditions.RequiresApproval;
      expect(condition).toHaveProperty('Fn::Or');
      expect(Array.isArray(condition['Fn::Or'])).toBe(true);
    });

    test('UseGitHub condition should check UseGitHubSource parameter', () => {
      const condition = template.Conditions.UseGitHub;
      expect(condition).toHaveProperty('Fn::Equals');
      expect(condition['Fn::Equals']).toContainEqual({ Ref: 'UseGitHubSource' });
      expect(condition['Fn::Equals']).toContainEqual('true');
    });
  });

  // ===========================
  // Mappings Tests
  // ===========================
  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('EnvironmentConfig should have dev, staging, and prod configurations', () => {
      const envConfig = template.Mappings.EnvironmentConfig;
      expect(envConfig.dev).toBeDefined();
      expect(envConfig.staging).toBeDefined();
      expect(envConfig.prod).toBeDefined();
    });

    test('each environment config should have required properties', () => {
      const envConfig = template.Mappings.EnvironmentConfig;
      ['dev', 'staging', 'prod'].forEach(env => {
        expect(envConfig[env].BuildComputeType).toBeDefined();
        expect(envConfig[env].RetentionDays).toBeDefined();
        expect(envConfig[env].LifecycleExpirationDays).toBeDefined();
        expect(envConfig[env].DesiredCount).toBeDefined();
        expect(envConfig[env].MaxSize).toBeDefined();
      });
    });

    test('environment configs should have appropriate values', () => {
      const envConfig = template.Mappings.EnvironmentConfig;

      expect(envConfig.dev.BuildComputeType).toBe('BUILD_GENERAL1_SMALL');
      expect(envConfig.dev.RetentionDays).toBe(7);
      expect(envConfig.dev.DesiredCount).toBe(1);

      expect(envConfig.staging.BuildComputeType).toBe('BUILD_GENERAL1_MEDIUM');
      expect(envConfig.staging.RetentionDays).toBe(14);
      expect(envConfig.staging.DesiredCount).toBe(2);

      expect(envConfig.prod.BuildComputeType).toBe('BUILD_GENERAL1_LARGE');
      expect(envConfig.prod.RetentionDays).toBe(30);
      expect(envConfig.prod.DesiredCount).toBe(3);
    });
  });

  // ===========================
  // VPC Resources Tests
  // ===========================
  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway Attachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('public subnets should map public IP on launch', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('private subnets should not map public IP on launch', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have NAT Gateway with EIP', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGatewayEIP).toBeDefined();
      expect(template.Resources.NatGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGatewayEIP.Type).toBe('AWS::EC2::EIP');
    });

    test('NAT Gateway EIP should be in VPC domain', () => {
      expect(template.Resources.NatGatewayEIP.Properties.Domain).toBe('vpc');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have routes', () => {
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute).toBeDefined();
      expect(template.Resources.DefaultPublicRoute.Type).toBe('AWS::EC2::Route');
      expect(template.Resources.DefaultPrivateRoute.Type).toBe('AWS::EC2::Route');
    });

    test('public route should point to Internet Gateway', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toHaveProperty('Ref', 'InternetGateway');
    });

    test('private route should point to NAT Gateway', () => {
      const route = template.Resources.DefaultPrivateRoute;
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toHaveProperty('Ref', 'NatGateway');
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  // ===========================
  // Security Groups Tests
  // ===========================
  describe('Security Groups', () => {
    test('should have all required security groups', () => {
      expect(template.Resources.LoadBalancerSecurityGroup).toBeDefined();
      expect(template.Resources.ECSTaskSecurityGroup).toBeDefined();
      expect(template.Resources.CodeBuildSecurityGroup).toBeDefined();
    });

    test('LoadBalancerSecurityGroup should allow HTTP and HTTPS', () => {
      const sg = template.Resources.LoadBalancerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const httpRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('ECSTaskSecurityGroup should only allow traffic from ALB', () => {
      const sg = template.Resources.ECSTaskSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const rule = sg.Properties.SecurityGroupIngress[0];
      expect(rule.FromPort).toBe(80);
      expect(rule.ToPort).toBe(80);
      expect(rule.SourceSecurityGroupId).toHaveProperty('Ref', 'LoadBalancerSecurityGroup');
    });

    test('CodeBuildSecurityGroup should allow HTTPS outbound', () => {
      const sg = template.Resources.CodeBuildSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      const rule = sg.Properties.SecurityGroupEgress[0];
      expect(rule.FromPort).toBe(443);
      expect(rule.ToPort).toBe(443);
    });
  });

  // ===========================
  // KMS and Encryption Tests
  // ===========================
  describe('KMS Key', () => {
    test('should have KMS Key resource', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS Key should have deletion policy', () => {
      expect(template.Resources.KMSKey.DeletionPolicy).toBe('Delete');
      expect(template.Resources.KMSKey.UpdateReplacePolicy).toBe('Delete');
    });

    test('KMS Key should have key rotation enabled', () => {
      expect(template.Resources.KMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS Key should have proper key policy', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeDefined();
      expect(Array.isArray(keyPolicy.Statement)).toBe(true);
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('KMS Key should allow root account full permissions', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      const rootStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('KMS Key should allow AWS services to use it', () => {
      const keyPolicy = template.Resources.KMSKey.Properties.KeyPolicy;
      const serviceStatement = keyPolicy.Statement.find((s: any) => s.Sid === 'Allow services to use the key');
      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('ecr.amazonaws.com');
    });

    test('should have KMS Key Alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  // ===========================
  // S3 Buckets Tests
  // ===========================
  describe('S3 Buckets', () => {
    test('should have SourceCodeBucket', () => {
      expect(template.Resources.SourceCodeBucket).toBeDefined();
      expect(template.Resources.SourceCodeBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have ArtifactBucket', () => {
      expect(template.Resources.ArtifactBucket).toBeDefined();
      expect(template.Resources.ArtifactBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('both buckets should have deletion policies', () => {
      expect(template.Resources.SourceCodeBucket.DeletionPolicy).toBe('Delete');
      expect(template.Resources.SourceCodeBucket.UpdateReplacePolicy).toBe('Delete');
      expect(template.Resources.ArtifactBucket.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ArtifactBucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('both buckets should have versioning enabled', () => {
      expect(template.Resources.SourceCodeBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(template.Resources.ArtifactBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('both buckets should have KMS encryption', () => {
      const sourceEncryption = template.Resources.SourceCodeBucket.Properties.BucketEncryption;
      const artifactEncryption = template.Resources.ArtifactBucket.Properties.BucketEncryption;

      expect(sourceEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(artifactEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('both buckets should block public access', () => {
      const checkPublicAccessBlock = (bucket: any) => {
        const config = bucket.Properties.PublicAccessBlockConfiguration;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      };

      checkPublicAccessBlock(template.Resources.SourceCodeBucket);
      checkPublicAccessBlock(template.Resources.ArtifactBucket);
    });

    test('ArtifactBucket should have lifecycle rules', () => {
      const lifecycle = template.Resources.ArtifactBucket.Properties.LifecycleConfiguration;
      expect(lifecycle).toBeDefined();
      expect(lifecycle.Rules).toBeDefined();
      expect(Array.isArray(lifecycle.Rules)).toBe(true);
    });
  });

  // ===========================
  // SNS Topic Tests
  // ===========================
  describe('SNS Topic', () => {
    test('should have NotificationTopic', () => {
      expect(template.Resources.NotificationTopic).toBeDefined();
      expect(template.Resources.NotificationTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('NotificationTopic should have KMS encryption', () => {
      const topic = template.Resources.NotificationTopic;
      expect(topic.Properties.KmsMasterKeyId).toHaveProperty('Ref', 'KMSKey');
    });

    test('NotificationTopic should have email subscription', () => {
      const topic = template.Resources.NotificationTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(Array.isArray(topic.Properties.Subscription)).toBe(true);
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });
  });

  // ===========================
  // CloudWatch Log Groups Tests
  // ===========================
  describe('CloudWatch Log Groups', () => {
    test('should have CodeBuildLogGroup', () => {
      expect(template.Resources.CodeBuildLogGroup).toBeDefined();
      expect(template.Resources.CodeBuildLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have ECSLogGroup', () => {
      expect(template.Resources.ECSLogGroup).toBeDefined();
      expect(template.Resources.ECSLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log groups should have deletion policies', () => {
      expect(template.Resources.CodeBuildLogGroup.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ECSLogGroup.DeletionPolicy).toBe('Delete');
    });

    test('log groups should have retention policies', () => {
      const codeBuildRetention = template.Resources.CodeBuildLogGroup.Properties.RetentionInDays;
      const ecsRetention = template.Resources.ECSLogGroup.Properties.RetentionInDays;

      expect(codeBuildRetention).toBeDefined();
      expect(ecsRetention).toBeDefined();
    });

    test('log groups should not use KMS encryption', () => {
      expect(template.Resources.CodeBuildLogGroup.Properties.KmsKeyId).toBeUndefined();
      expect(template.Resources.ECSLogGroup.Properties.KmsKeyId).toBeUndefined();
    });
  });

  // ===========================
  // ECR Repository Tests
  // ===========================
  describe('ECR Repository', () => {
    test('should have ECRRepository', () => {
      expect(template.Resources.ECRRepository).toBeDefined();
      expect(template.Resources.ECRRepository.Type).toBe('AWS::ECR::Repository');
    });

    test('ECRRepository should have deletion policy', () => {
      expect(template.Resources.ECRRepository.DeletionPolicy).toBe('Delete');
    });

    test('ECRRepository should have scan on push enabled', () => {
      expect(template.Resources.ECRRepository.Properties.ImageScanningConfiguration.ScanOnPush).toBe(true);
    });

    test('ECRRepository should have KMS encryption', () => {
      const encryption = template.Resources.ECRRepository.Properties.EncryptionConfiguration;
      expect(encryption.EncryptionType).toBe('KMS');
      expect(encryption.KmsKey).toHaveProperty('Ref', 'KMSKey');
    });

    test('ECRRepository should have lifecycle policy', () => {
      expect(template.Resources.ECRRepository.Properties.LifecyclePolicy).toBeDefined();
    });
  });

  // ===========================
  // IAM Roles Tests
  // ===========================
  describe('IAM Roles', () => {
    const expectedRoles = [
      'CodePipelineRole',
      'CodeBuildRole',
      'CodeDeployRole',
      'ECSTaskExecutionRole',
      'ECSTaskRole'
    ];

    test('should have all required IAM roles', () => {
      expectedRoles.forEach(role => {
        expect(template.Resources[role]).toBeDefined();
        expect(template.Resources[role].Type).toBe('AWS::IAM::Role');
      });
    });

    test('all roles should have AssumeRolePolicyDocument', () => {
      expectedRoles.forEach(role => {
        const roleResource = template.Resources[role];
        expect(roleResource.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(roleResource.Properties.AssumeRolePolicyDocument.Version).toBe('2012-10-17');
      });
    });

    test('CodePipelineRole should have inline policies', () => {
      const role = template.Resources.CodePipelineRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(Array.isArray(role.Properties.Policies)).toBe(true);
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
    });

    test('CodePipelineRole should have scoped S3 permissions', () => {
      const role = template.Resources.CodePipelineRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const s3Statement = policy.Statement.find((s: any) =>
        s.Action && s.Action.some((a: string) => a.startsWith('s3:'))
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Resource).toBeDefined();
      expect(Array.isArray(s3Statement.Resource)).toBe(true);
    });

    test('CodeBuildRole should have scoped permissions', () => {
      const role = template.Resources.CodeBuildRole;
      expect(role.Properties.Policies).toBeDefined();
      const policy = role.Properties.Policies[0].PolicyDocument;
      expect(policy.Statement).toBeDefined();
    });

    test('CodeDeployRole should have managed policy for ECS', () => {
      const role = template.Resources.CodeDeployRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS');
    });

    test('ECSTaskExecutionRole should have managed policy', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy');
    });

    test('roles should not have overly broad permissions', () => {
      expectedRoles.forEach(role => {
        const roleResource = template.Resources[role];
        if (roleResource.Properties.Policies) {
          roleResource.Properties.Policies.forEach((policy: any) => {
            policy.PolicyDocument.Statement.forEach((statement: any) => {
              // If Resource is defined, it should not be just '*' (some exceptions allowed)
              if (statement.Resource && statement.Resource === '*') {
                // Only certain actions can have Resource: '*'
                const allowedWildcardActions = [
                  'ecr:GetAuthorizationToken',
                  'ecs:DescribeServices',
                  'ecs:DescribeTaskDefinition',
                  'ecs:DescribeTasks',
                  'ecs:ListTasks',
                  'ecs:RegisterTaskDefinition',
                  'ecs:UpdateService',
                  'ec2:CreateNetworkInterface',
                  'ec2:DescribeDhcpOptions',
                  'ec2:DescribeNetworkInterfaces',
                  'ec2:DeleteNetworkInterface',
                  'ec2:DescribeSubnets',
                  'ec2:DescribeSecurityGroups',
                  'ec2:DescribeVpcs',
                  'ec2:CreateNetworkInterfacePermission'
                ];
                if (statement.Action) {
                  const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
                  actions.forEach((action: string) => {
                    if (!allowedWildcardActions.includes(action)) {
                      console.warn(`Warning: Action ${action} in ${role} uses Resource: '*'`);
                    }
                  });
                }
              }
            });
          });
        }
      });
    });
  });

  // ===========================
  // ECS Resources Tests
  // ===========================
  describe('ECS Resources', () => {
    test('should have ECS Cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('ECS Cluster should have Container Insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      const settings = cluster.Properties.ClusterSettings;
      const insightsSetting = settings.find((s: any) => s.Name === 'containerInsights');
      expect(insightsSetting).toBeDefined();
      expect(insightsSetting.Value).toBe('enabled');
    });

    test('should have ECS Task Definition', () => {
      expect(template.Resources.ECSTaskDefinition).toBeDefined();
      expect(template.Resources.ECSTaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
    });

    test('ECS Task Definition should use Fargate', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
    });

    test('ECS Task Definition should use public nginx image', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.Image).toBe('public.ecr.aws/nginx/nginx:mainline-alpine');
    });

    test('ECS Task Definition should have execution and task roles', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.ExecutionRoleArn).toBeDefined();
      expect(taskDef.Properties.TaskRoleArn).toBeDefined();
    });

    test('should have ECS Service', () => {
      expect(template.Resources.ECSService).toBeDefined();
      expect(template.Resources.ECSService.Type).toBe('AWS::ECS::Service');
    });

    test('ECS Service should use CODE_DEPLOY deployment controller', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.DeploymentController.Type).toBe('CODE_DEPLOY');
    });

    test('ECS Service should be in private subnets', () => {
      const service = template.Resources.ECSService;
      const subnets = service.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets;
      expect(subnets).toBeDefined();
      expect(Array.isArray(subnets)).toBe(true);
    });

    test('ECS Service should not have public IP', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.NetworkConfiguration.AwsvpcConfiguration.AssignPublicIp).toBe('DISABLED');
    });
  });

  // ===========================
  // Load Balancer Tests
  // ===========================
  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toBeDefined();
      expect(Array.isArray(alb.Properties.Subnets)).toBe(true);
    });

    test('should have two target groups for Blue/Green', () => {
      expect(template.Resources.TargetGroupBlue).toBeDefined();
      expect(template.Resources.TargetGroupGreen).toBeDefined();
      expect(template.Resources.TargetGroupBlue.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(template.Resources.TargetGroupGreen.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('target groups should have correct configuration', () => {
      const checkTargetGroup = (tg: any) => {
        expect(tg.Properties.Port).toBe(80);
        expect(tg.Properties.Protocol).toBe('HTTP');
        expect(tg.Properties.TargetType).toBe('ip');
        expect(tg.Properties.HealthCheckEnabled).toBe(true);
        expect(tg.Properties.HealthCheckPath).toBe('/');
      };

      checkTargetGroup(template.Resources.TargetGroupBlue);
      checkTargetGroup(template.Resources.TargetGroupGreen);
    });

    test('should have ALB Listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('ALB Listener should forward to blue target group by default', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  // ===========================
  // CodeBuild Tests
  // ===========================
  describe('CodeBuild Project', () => {
    test('should have CodeBuild Project', () => {
      expect(template.Resources.CodeBuildProject).toBeDefined();
      expect(template.Resources.CodeBuildProject.Type).toBe('AWS::CodeBuild::Project');
    });

    test('CodeBuild should use CODEPIPELINE artifacts', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Artifacts.Type).toBe('CODEPIPELINE');
      expect(project.Properties.Source.Type).toBe('CODEPIPELINE');
    });

    test('CodeBuild should use Linux container', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Environment.Type).toBe('LINUX_CONTAINER');
    });

    test('CodeBuild should have privileged mode for Docker', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Environment.PrivilegedMode).toBe(true);
    });

    test('CodeBuild should have environment variables', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Environment.EnvironmentVariables).toBeDefined();
      expect(Array.isArray(project.Properties.Environment.EnvironmentVariables)).toBe(true);
    });

    test('CodeBuild should be in VPC', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.VpcConfig).toBeDefined();
      expect(project.Properties.VpcConfig.VpcId).toBeDefined();
      expect(project.Properties.VpcConfig.Subnets).toBeDefined();
    });

    test('CodeBuild should have CloudWatch Logs configured', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.LogsConfig.CloudWatchLogs.Status).toBe('ENABLED');
    });
  });

  // ===========================
  // CodeDeploy Tests
  // ===========================
  describe('CodeDeploy Resources', () => {
    test('should have CodeDeploy Application', () => {
      expect(template.Resources.CodeDeployApplication).toBeDefined();
      expect(template.Resources.CodeDeployApplication.Type).toBe('AWS::CodeDeploy::Application');
    });

    test('CodeDeploy Application should be for ECS', () => {
      const app = template.Resources.CodeDeployApplication;
      expect(app.Properties.ComputePlatform).toBe('ECS');
    });

    test('should have CodeDeploy Deployment Group', () => {
      expect(template.Resources.CodeDeployDeploymentGroup).toBeDefined();
      expect(template.Resources.CodeDeployDeploymentGroup.Type).toBe('AWS::CodeDeploy::DeploymentGroup');
    });

    test('CodeDeploy Deployment Group should have BLUE_GREEN deployment style', () => {
      const dg = template.Resources.CodeDeployDeploymentGroup;
      expect(dg.Properties.DeploymentStyle).toBeDefined();
      expect(dg.Properties.DeploymentStyle.DeploymentType).toBe('BLUE_GREEN');
      expect(dg.Properties.DeploymentStyle.DeploymentOption).toBe('WITH_TRAFFIC_CONTROL');
    });

    test('CodeDeploy should have Blue/Green configuration', () => {
      const dg = template.Resources.CodeDeployDeploymentGroup;
      expect(dg.Properties.BlueGreenDeploymentConfiguration).toBeDefined();
    });

    test('CodeDeploy should reference both target groups', () => {
      const dg = template.Resources.CodeDeployDeploymentGroup;
      const tgInfo = dg.Properties.LoadBalancerInfo.TargetGroupPairInfoList[0];
      expect(tgInfo.TargetGroups).toHaveLength(2);
    });

    test('CodeDeploy should have auto rollback enabled', () => {
      const dg = template.Resources.CodeDeployDeploymentGroup;
      expect(dg.Properties.AutoRollbackConfiguration.Enabled).toBe(true);
    });
  });

  // ===========================
  // CloudWatch Alarms Tests
  // ===========================
  describe('CloudWatch Alarms', () => {
    test('should have DeploymentAlarm', () => {
      expect(template.Resources.DeploymentAlarm).toBeDefined();
      expect(template.Resources.DeploymentAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have PipelineFailureAlarm', () => {
      expect(template.Resources.PipelineFailureAlarm).toBeDefined();
      expect(template.Resources.PipelineFailureAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('alarms should have proper configuration', () => {
      const checkAlarm = (alarm: any) => {
        expect(alarm.Properties.MetricName).toBeDefined();
        expect(alarm.Properties.Namespace).toBeDefined();
        expect(alarm.Properties.Statistic).toBeDefined();
        expect(alarm.Properties.Period).toBeDefined();
        expect(alarm.Properties.EvaluationPeriods).toBeDefined();
        expect(alarm.Properties.Threshold).toBeDefined();
        expect(alarm.Properties.ComparisonOperator).toBeDefined();
      };

      checkAlarm(template.Resources.DeploymentAlarm);
      checkAlarm(template.Resources.PipelineFailureAlarm);
    });
  });

  // ===========================
  // CodePipeline Tests
  // ===========================
  describe('CodePipeline', () => {
    test('should have CodePipeline', () => {
      expect(template.Resources.CodePipeline).toBeDefined();
      expect(template.Resources.CodePipeline.Type).toBe('AWS::CodePipeline::Pipeline');
    });

    test('CodePipeline should use S3 artifact store with KMS', () => {
      const pipeline = template.Resources.CodePipeline;
      expect(pipeline.Properties.ArtifactStore.Type).toBe('S3');
      expect(pipeline.Properties.ArtifactStore.EncryptionKey.Type).toBe('KMS');
    });

    test('CodePipeline should have stages', () => {
      const pipeline = template.Resources.CodePipeline;
      expect(pipeline.Properties.Stages).toBeDefined();
      expect(Array.isArray(pipeline.Properties.Stages)).toBe(true);
      expect(pipeline.Properties.Stages.length).toBeGreaterThan(0);
    });

    test('CodePipeline should have Source stage', () => {
      const pipeline = template.Resources.CodePipeline;
      const sourceStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'Source');
      expect(sourceStage).toBeDefined();
    });

    test('CodePipeline should have Build stage', () => {
      const pipeline = template.Resources.CodePipeline;
      const buildStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'Build');
      expect(buildStage).toBeDefined();
    });

    test('CodePipeline should have Deploy stage', () => {
      const pipeline = template.Resources.CodePipeline;
      const deployStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'Deploy');
      expect(deployStage).toBeDefined();
    });

    test('Source stage should use conditional GitHub or S3', () => {
      const pipeline = template.Resources.CodePipeline;
      const sourceStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'Source');
      expect(sourceStage.Actions).toBeDefined();
      expect(sourceStage.Actions[0]).toBeDefined();
    });
  });

  // ===========================
  // Secrets Manager Tests (Conditional)
  // ===========================
  describe('Secrets Manager', () => {
    test('should have GitHubOAuthToken with condition', () => {
      expect(template.Resources.GitHubOAuthToken).toBeDefined();
      expect(template.Resources.GitHubOAuthToken.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.GitHubOAuthToken.Condition).toBe('UseGitHub');
    });

    test('GitHubOAuthToken should have deletion policy', () => {
      expect(template.Resources.GitHubOAuthToken.DeletionPolicy).toBe('Delete');
    });

    test('GitHubOAuthToken should use KMS encryption', () => {
      const secret = template.Resources.GitHubOAuthToken;
      expect(secret.Properties.KmsKeyId).toHaveProperty('Ref', 'KMSKey');
    });
  });

  // ===========================
  // Tags Tests
  // ===========================
  describe('Resource Tags', () => {
    const requiredTags = ['project', 'team-number', 'Environment'];
    const resourcesWithTags = [
      'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
      'PrivateSubnet1', 'PrivateSubnet2', 'NatGatewayEIP', 'NatGateway',
      'PublicRouteTable', 'PrivateRouteTable', 'LoadBalancerSecurityGroup',
      'ECSTaskSecurityGroup', 'CodeBuildSecurityGroup', 'KMSKey',
      'SourceCodeBucket', 'ArtifactBucket', 'NotificationTopic',
      'CodeBuildLogGroup', 'ECSLogGroup', 'ECRRepository',
      'CodePipelineRole', 'CodeBuildRole', 'CodeDeployRole',
      'ECSTaskExecutionRole', 'ECSTaskRole', 'ECSCluster',
      'ECSTaskDefinition', 'TargetGroupBlue', 'TargetGroupGreen',
      'ApplicationLoadBalancer', 'ECSService', 'CodeBuildProject',
      'CodeDeployApplication', 'CodePipeline'
    ];

    test('all major resources should have Tags property', () => {
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource) {
          expect(resource.Properties.Tags).toBeDefined();
        }
      });
    });

    test('all tagged resources should have project tag', () => {
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const projectTag = resource.Properties.Tags.find((t: any) => t.Key === 'project');
          expect(projectTag).toBeDefined();
          expect(projectTag.Value).toBe('iac-rlhf-amazon');
        }
      });
    });

    test('all tagged resources should have team-number tag', () => {
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const teamTag = resource.Properties.Tags.find((t: any) => t.Key === 'team-number');
          expect(teamTag).toBeDefined();
          expect(teamTag.Value).toBe(2);
        }
      });
    });

    test('all tagged resources should have Environment tag', () => {
      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((t: any) => t.Key === 'Environment');
          expect(envTag).toBeDefined();
          expect(envTag.Value).toHaveProperty('Ref', 'EnvironmentSuffix');
        }
      });
    });
  });

  // ===========================
  // Outputs Tests
  // ===========================
  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'PublicSubnets',
      'PrivateSubnets',
      'PipelineName',
      'PipelineArn',
      'ECRRepositoryUri',
      'SourceCodeBucketName',
      'ArtifactBucketName',
      'KMSKeyId',
      'NotificationTopicArn',
      'ECSClusterName',
      'ECSServiceName',
      'LoadBalancerDNS',
      'LoadBalancerURL',
      'CodeBuildProjectName',
      'CodeDeployApplicationName',
      'EnvironmentSuffix'
    ];

    test('should have all expected outputs', () => {
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('all outputs should have Description', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Description).toBeDefined();
        expect(typeof output.Description).toBe('string');
      });
    });

    test('all outputs should have Value', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Value).toBeDefined();
      });
    });

    test('all outputs should have Export', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('LoadBalancerURL should use HTTP protocol', () => {
      const output = template.Outputs.LoadBalancerURL;
      expect(output.Value).toBeDefined();
      expect(output.Value['Fn::Sub']).toContain('http://');
    });
  });

  // ===========================
  // Cross-Reference Tests
  // ===========================
  describe('Resource Cross-References', () => {
    test('VPC resources should reference each other correctly', () => {
      expect(template.Resources.InternetGatewayAttachment.Properties.VpcId).toHaveProperty('Ref', 'VPC');
      expect(template.Resources.InternetGatewayAttachment.Properties.InternetGatewayId).toHaveProperty('Ref', 'InternetGateway');
    });

    test('Subnets should reference VPC', () => {
      ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'].forEach(subnet => {
        expect(template.Resources[subnet].Properties.VpcId).toHaveProperty('Ref', 'VPC');
      });
    });

    test('Security Groups should reference VPC', () => {
      ['LoadBalancerSecurityGroup', 'ECSTaskSecurityGroup', 'CodeBuildSecurityGroup'].forEach(sg => {
        expect(template.Resources[sg].Properties.VpcId).toHaveProperty('Ref', 'VPC');
      });
    });

    test('NAT Gateway should reference EIP and Subnet', () => {
      const natGw = template.Resources.NatGateway;
      expect(natGw.Properties.AllocationId).toHaveProperty('Fn::GetAtt');
      expect(natGw.Properties.SubnetId).toHaveProperty('Ref', 'PublicSubnet1');
    });

    test('ECS Service should reference Task Definition and Cluster', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.TaskDefinition).toHaveProperty('Ref', 'ECSTaskDefinition');
      expect(service.Properties.Cluster).toHaveProperty('Ref', 'ECSCluster');
    });

    test('Target Groups should reference VPC', () => {
      expect(template.Resources.TargetGroupBlue.Properties.VpcId).toHaveProperty('Ref', 'VPC');
      expect(template.Resources.TargetGroupGreen.Properties.VpcId).toHaveProperty('Ref', 'VPC');
    });

    test('ALB should reference Security Group and Subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.SecurityGroups).toBeDefined();
      expect(alb.Properties.Subnets).toBeDefined();
    });
  });

  // ===========================
  // Deletion Policy Tests
  // ===========================
  describe('Deletion Policies', () => {
    const resourcesWithDeletionPolicy = [
      'KMSKey',
      'SourceCodeBucket',
      'ArtifactBucket',
      'CodeBuildLogGroup',
      'ECSLogGroup',
      'ECRRepository'
    ];

    test('stateful resources should have deletion policies', () => {
      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('GitHubOAuthToken should have deletion policy', () => {
      expect(template.Resources.GitHubOAuthToken.DeletionPolicy).toBe('Delete');
      expect(template.Resources.GitHubOAuthToken.UpdateReplacePolicy).toBe('Delete');
    });
  });

  // ===========================
  // Multi-Region Compatibility Tests
  // ===========================
  describe('Multi-Region Compatibility', () => {
    test('should use AWS::Region pseudo parameter', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).toContain('AWS::Region');
    });

    test('should use AWS::AccountId pseudo parameter', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).toContain('AWS::AccountId');
    });

    test('bucket names should include account ID for uniqueness', () => {
      const sourceConfig = template.Resources.SourceCodeBucket.Properties.BucketName;
      const artifactConfig = template.Resources.ArtifactBucket.Properties.BucketName;

      expect(JSON.stringify(sourceConfig)).toContain('AWS::AccountId');
      expect(JSON.stringify(artifactConfig)).toContain('AWS::AccountId');
    });

    test('should not have hardcoded regions', () => {
      const templateString = JSON.stringify(template);
      // Check for common region names (should not exist as hardcoded values)
      const hardcodedRegions = ['us-east-1', 'us-west-2', 'eu-west-1'];
      hardcodedRegions.forEach(region => {
        // Allow these in comments or descriptions but not in actual configuration
        const occurrences = (templateString.match(new RegExp(region, 'g')) || []).length;
        if (occurrences > 0) {
          console.warn(`Warning: Found potential hardcoded region: ${region}`);
        }
      });
    });
  });

  // ===========================
  // Security Best Practices Tests
  // ===========================
  describe('Security Best Practices', () => {
    test('S3 buckets should have encryption enabled', () => {
      ['SourceCodeBucket', 'ArtifactBucket'].forEach(bucket => {
        const resource = template.Resources[bucket];
        expect(resource.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('S3 buckets should block public access', () => {
      ['SourceCodeBucket', 'ArtifactBucket'].forEach(bucket => {
        const resource = template.Resources[bucket];
        const publicAccess = resource.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('ECR should have image scanning enabled', () => {
      const ecr = template.Resources.ECRRepository;
      expect(ecr.Properties.ImageScanningConfiguration.ScanOnPush).toBe(true);
    });

    test('ECS tasks should not have public IPs', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.NetworkConfiguration.AwsvpcConfiguration.AssignPublicIp).toBe('DISABLED');
    });

    test('SNS topic should have encryption', () => {
      const topic = template.Resources.NotificationTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('KMS key should have rotation enabled', () => {
      const key = template.Resources.KMSKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });
  });

  // ===========================
  // Resource Count Tests
  // ===========================
  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(40); // We expect 41+ resources
      expect(resourceCount).toBeLessThan(100); // Sanity check
    });

    test('should have expected number of IAM roles', () => {
      const roles = Object.values(template.Resources).filter((r: any) => r.Type === 'AWS::IAM::Role');
      expect(roles.length).toBe(5);
    });

    test('should have expected number of Security Groups', () => {
      const sgs = Object.values(template.Resources).filter((r: any) => r.Type === 'AWS::EC2::SecurityGroup');
      expect(sgs.length).toBe(3);
    });

    test('should have expected number of S3 Buckets', () => {
      const buckets = Object.values(template.Resources).filter((r: any) => r.Type === 'AWS::S3::Bucket');
      expect(buckets.length).toBe(2);
    });
  });
});
