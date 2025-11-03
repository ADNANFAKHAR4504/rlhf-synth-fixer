import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
    let template: any;

    beforeAll(() => {
        const templatePath = path.join(__dirname, '../lib/TapStack.json');
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = JSON.parse(templateContent);
    });

    describe('Template Structure', () => {
        test('should have valid CloudFormation format version', () => {
            expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
        });

        test('should have correct description', () => {
            expect(template.Description).toBe(
                'Secure and highly available web application infrastructure with ALB, Auto Scaling, RDS, S3, WAF, CloudFront, and monitoring'
            );
        });

        test('should have valid JSON structure', () => {
            expect(template).toBeDefined();
            expect(typeof template).toBe('object');
        });

        test('should not have any undefined or null required sections', () => {
            expect(template.AWSTemplateFormatVersion).not.toBeNull();
            expect(template.Description).not.toBeNull();
            expect(template.Parameters).not.toBeNull();
            expect(template.Resources).not.toBeNull();
            expect(template.Outputs).not.toBeNull();
        });
    });

    describe('Parameters', () => {
        test('should have EnvironmentSuffix parameter', () => {
            expect(template.Parameters.EnvironmentSuffix).toBeDefined();
        });

        test('EnvironmentSuffix parameter should have correct properties', () => {
            const param = template.Parameters.EnvironmentSuffix;
            expect(param.Type).toBe('String');
            expect(param.Default).toBe('dev');
            expect(param.Description).toBe(
                'Environment suffix for resource naming (e.g., dev, staging, prod)'
            );
            expect(param.AllowedPattern).toBe('[a-z0-9-]+');
            expect(param.ConstraintDescription).toBe(
                'Must contain only lowercase letters, numbers, and hyphens'
            );
        });

        test('should have LatestAmiId parameter', () => {
            expect(template.Parameters.LatestAmiId).toBeDefined();
        });

        test('LatestAmiId parameter should have correct properties', () => {
            const param = template.Parameters.LatestAmiId;
            expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
            expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
            expect(param.Description).toBe('Latest Amazon Linux 2 AMI ID from SSM Parameter Store');
        });

        test('should have exactly 2 parameters', () => {
            expect(Object.keys(template.Parameters)).toHaveLength(2);
        });
    });

    describe('Networking Resources', () => {
        test('VPC should be configured correctly', () => {
            const vpc = template.Resources.VPC;
            expect(vpc).toBeDefined();
            expect(vpc.Type).toBe('AWS::EC2::VPC');
            expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
            expect(vpc.Properties.EnableDnsHostnames).toBe(true);
            expect(vpc.Properties.EnableDnsSupport).toBe(true);
            expect(vpc.Properties.Tags).toBeDefined();
        });

        test('InternetGateway should be defined', () => {
            const igw = template.Resources.InternetGateway;
            expect(igw).toBeDefined();
            expect(igw.Type).toBe('AWS::EC2::InternetGateway');
        });

        test('AttachGateway should attach IGW to VPC', () => {
            const attach = template.Resources.AttachGateway;
            expect(attach).toBeDefined();
            expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
            expect(attach.Properties.VpcId).toEqual({ Ref: 'VPC' });
            expect(attach.Properties.InternetGatewayId).toEqual({
                Ref: 'InternetGateway',
            });
        });

        test('PublicSubnet1 should be configured correctly', () => {
            const subnet = template.Resources.PublicSubnet1;
            expect(subnet).toBeDefined();
            expect(subnet.Type).toBe('AWS::EC2::Subnet');
            expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
            expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
            expect(subnet.Properties.AvailabilityZone).toEqual({
                'Fn::Select': [0, { 'Fn::GetAZs': '' }],
            });
        });

        test('PublicSubnet2 should be configured correctly', () => {
            const subnet = template.Resources.PublicSubnet2;
            expect(subnet).toBeDefined();
            expect(subnet.Type).toBe('AWS::EC2::Subnet');
            expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
            expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
            expect(subnet.Properties.AvailabilityZone).toEqual({
                'Fn::Select': [1, { 'Fn::GetAZs': '' }],
            });
        });

        test('PrivateSubnet1 should be configured correctly', () => {
            const subnet = template.Resources.PrivateSubnet1;
            expect(subnet).toBeDefined();
            expect(subnet.Type).toBe('AWS::EC2::Subnet');
            expect(subnet.Properties.CidrBlock).toBe('10.0.3.0/24');
            expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
        });

        test('PrivateSubnet2 should be configured correctly', () => {
            const subnet = template.Resources.PrivateSubnet2;
            expect(subnet).toBeDefined();
            expect(subnet.Type).toBe('AWS::EC2::Subnet');
            expect(subnet.Properties.CidrBlock).toBe('10.0.4.0/24');
            expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
        });

        test('NAT Gateways should be configured in public subnets', () => {
            const nat1 = template.Resources.NATGateway1;
            const nat2 = template.Resources.NATGateway2;

            expect(nat1).toBeDefined();
            expect(nat1.Type).toBe('AWS::EC2::NatGateway');
            expect(nat1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });

            expect(nat2).toBeDefined();
            expect(nat2.Type).toBe('AWS::EC2::NatGateway');
            expect(nat2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
        });

        test('NAT Gateway EIPs should depend on IGW attachment', () => {
            const eip1 = template.Resources.NATGateway1EIP;
            const eip2 = template.Resources.NATGateway2EIP;

            expect(eip1.DependsOn).toBe('AttachGateway');
            expect(eip1.Properties.Domain).toBe('vpc');

            expect(eip2.DependsOn).toBe('AttachGateway');
            expect(eip2.Properties.Domain).toBe('vpc');
        });

        test('Public route table should route to IGW', () => {
            const rt = template.Resources.PublicRouteTable;
            const route = template.Resources.PublicRoute;

            expect(rt).toBeDefined();
            expect(rt.Type).toBe('AWS::EC2::RouteTable');

            expect(route).toBeDefined();
            expect(route.Type).toBe('AWS::EC2::Route');
            expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
            expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
            expect(route.DependsOn).toBe('AttachGateway');
        });

        test('Private route tables should route to NAT Gateways', () => {
            const rt1 = template.Resources.PrivateRouteTable1;
            const route1 = template.Resources.PrivateRoute1;

            expect(rt1).toBeDefined();
            expect(route1.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });

            const rt2 = template.Resources.PrivateRouteTable2;
            const route2 = template.Resources.PrivateRoute2;

            expect(rt2).toBeDefined();
            expect(route2.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
        });

        test('Subnet route table associations should be configured', () => {
            expect(template.Resources.PublicSubnetRouteTableAssociation1).toBeDefined();
            expect(template.Resources.PublicSubnetRouteTableAssociation2).toBeDefined();
            expect(template.Resources.PrivateSubnetRouteTableAssociation1).toBeDefined();
            expect(template.Resources.PrivateSubnetRouteTableAssociation2).toBeDefined();
        });
    });

    describe('Security Groups', () => {
        test('ALBSecurityGroup should allow HTTP and HTTPS from internet', () => {
            const sg = template.Resources.ALBSecurityGroup;
            expect(sg).toBeDefined();
            expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
            expect(sg.Properties.GroupDescription).toBe(
                'Security group for Application Load Balancer'
            );

            const ingress = sg.Properties.SecurityGroupIngress;
            expect(ingress).toHaveLength(2);
            expect(ingress[0].FromPort).toBe(80);
            expect(ingress[0].ToPort).toBe(80);
            expect(ingress[0].CidrIp).toBe('0.0.0.0/0');
            expect(ingress[1].FromPort).toBe(443);
            expect(ingress[1].ToPort).toBe(443);
            expect(ingress[1].CidrIp).toBe('0.0.0.0/0');
        });

        test('WebServerSecurityGroup should only allow traffic from ALB', () => {
            const sg = template.Resources.WebServerSecurityGroup;
            expect(sg).toBeDefined();
            expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
            expect(sg.Properties.GroupDescription).toBe(
                'Security group for web server instances'
            );

            const ingress = sg.Properties.SecurityGroupIngress;
            expect(ingress).toHaveLength(1);
            expect(ingress[0].FromPort).toBe(80);
            expect(ingress[0].SourceSecurityGroupId).toEqual({
                Ref: 'ALBSecurityGroup',
            });
        });

        test('DatabaseSecurityGroup should only allow traffic from WebServers', () => {
            const sg = template.Resources.DatabaseSecurityGroup;
            expect(sg).toBeDefined();
            expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
            expect(sg.Properties.GroupDescription).toBe('Security group for RDS database');

            const ingress = sg.Properties.SecurityGroupIngress;
            expect(ingress).toHaveLength(1);
            expect(ingress[0].FromPort).toBe(3306);
            expect(ingress[0].ToPort).toBe(3306);
            expect(ingress[0].SourceSecurityGroupId).toEqual({
                Ref: 'WebServerSecurityGroup',
            });
        });
    });

    describe('IAM Resources', () => {
        test('EC2Role should have correct assume role policy', () => {
            const role = template.Resources.EC2Role;
            expect(role).toBeDefined();
            expect(role.Type).toBe('AWS::IAM::Role');

            const assumePolicy = role.Properties.AssumeRolePolicyDocument;
            expect(assumePolicy.Version).toBe('2012-10-17');
            expect(assumePolicy.Statement[0].Effect).toBe('Allow');
            expect(assumePolicy.Statement[0].Principal.Service).toContain(
                'ec2.amazonaws.com'
            );
        });

        test('EC2Role should have CloudWatch and SSM managed policies', () => {
            const role = template.Resources.EC2Role;
            const managedPolicies = role.Properties.ManagedPolicyArns;

            expect(managedPolicies).toContain(
                'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
            );
            expect(managedPolicies).toContain(
                'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
            );
        });

        test('EC2Role should have S3 access policy', () => {
            const role = template.Resources.EC2Role;
            const policies = role.Properties.Policies;

            const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
            expect(s3Policy).toBeDefined();
            expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
            expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
        });

        test('EC2Role should have Secrets Manager access policy', () => {
            const role = template.Resources.EC2Role;
            const policies = role.Properties.Policies;

            const secretsPolicy = policies.find(
                (p: any) => p.PolicyName === 'SecretsManagerAccess'
            );
            expect(secretsPolicy).toBeDefined();
            expect(secretsPolicy.PolicyDocument.Statement[0].Action).toContain(
                'secretsmanager:GetSecretValue'
            );
        });

        test('EC2InstanceProfile should reference EC2Role', () => {
            const profile = template.Resources.EC2InstanceProfile;
            expect(profile).toBeDefined();
            expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
            expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2Role' }]);
        });
    });

    describe('Compute Resources', () => {
        test('LaunchTemplate should be configured correctly', () => {
            const lt = template.Resources.LaunchTemplate;
            expect(lt).toBeDefined();
            expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');

            const data = lt.Properties.LaunchTemplateData;
            expect(data.InstanceType).toBe('t3.micro');
            expect(data.ImageId).toEqual({ Ref: 'LatestAmiId' });
            expect(data.SecurityGroupIds).toEqual([{ Ref: 'WebServerSecurityGroup' }]);
            expect(data.UserData).toBeDefined();
        });

        test('AutoScalingGroup should be configured with correct capacity', () => {
            const asg = template.Resources.AutoScalingGroup;
            expect(asg).toBeDefined();
            expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
            expect(asg.Properties.MinSize).toBe('2');
            expect(asg.Properties.MaxSize).toBe('6');
            expect(asg.Properties.DesiredCapacity).toBe('2');
        });

        test('AutoScalingGroup should be in private subnets', () => {
            const asg = template.Resources.AutoScalingGroup;
            expect(asg.Properties.VPCZoneIdentifier).toEqual([
                { Ref: 'PrivateSubnet1' },
                { Ref: 'PrivateSubnet2' },
            ]);
        });

        test('AutoScalingGroup should use ELB health checks', () => {
            const asg = template.Resources.AutoScalingGroup;
            expect(asg.Properties.HealthCheckType).toBe('ELB');
            expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
        });

        test('ScalingPolicy should use target tracking for CPU', () => {
            const policy = template.Resources.ScalingPolicy;
            expect(policy).toBeDefined();
            expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
            expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');

            const config = policy.Properties.TargetTrackingConfiguration;
            expect(config.PredefinedMetricSpecification.PredefinedMetricType).toBe(
                'ASGAverageCPUUtilization'
            );
            expect(config.TargetValue).toBe(70.0);
        });
    });

    describe('Load Balancer Resources', () => {
        test('ApplicationLoadBalancer should be internet-facing', () => {
            const alb = template.Resources.ApplicationLoadBalancer;
            expect(alb).toBeDefined();
            expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
            expect(alb.Properties.Type).toBe('application');
            expect(alb.Properties.Scheme).toBe('internet-facing');
        });

        test('ApplicationLoadBalancer should be in public subnets', () => {
            const alb = template.Resources.ApplicationLoadBalancer;
            expect(alb.Properties.Subnets).toEqual([
                { Ref: 'PublicSubnet1' },
                { Ref: 'PublicSubnet2' },
            ]);
        });

        test('TargetGroup should have correct health check configuration', () => {
            const tg = template.Resources.TargetGroup;
            expect(tg).toBeDefined();
            expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
            expect(tg.Properties.Port).toBe(80);
            expect(tg.Properties.Protocol).toBe('HTTP');
            expect(tg.Properties.HealthCheckEnabled).toBe(true);
            expect(tg.Properties.HealthCheckPath).toBe('/');
            expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
            expect(tg.Properties.HealthyThresholdCount).toBe(2);
            expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
        });

        test('ALBListener should forward to TargetGroup', () => {
            const listener = template.Resources.ALBListener;
            expect(listener).toBeDefined();
            expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
            expect(listener.Properties.Port).toBe(80);
            expect(listener.Properties.Protocol).toBe('HTTP');
            expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
            expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({
                Ref: 'TargetGroup',
            });
        });
    });

    describe('Database Resources', () => {
        test('DBSecret should generate password for database credentials', () => {
            const secret = template.Resources.DBSecret;
            expect(secret).toBeDefined();
            expect(secret.Type).toBe('AWS::SecretsManager::Secret');
            expect(secret.Properties.Name).toEqual({
                'Fn::Sub': 'db-credentials-${EnvironmentSuffix}',
            });

            const genString = secret.Properties.GenerateSecretString;
            expect(genString.SecretStringTemplate).toBe('{"username": "dbadmin"}');
            expect(genString.GenerateStringKey).toBe('password');
            expect(genString.PasswordLength).toBe(32);
        });

        test('DBSubnetGroup should be in private subnets', () => {
            const subnetGroup = template.Resources.DBSubnetGroup;
            expect(subnetGroup).toBeDefined();
            expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
            expect(subnetGroup.Properties.SubnetIds).toEqual([
                { Ref: 'PrivateSubnet1' },
                { Ref: 'PrivateSubnet2' },
            ]);
        });

        test('RDSDatabase should be configured with encryption and Multi-AZ', () => {
            const rds = template.Resources.RDSDatabase;
            expect(rds).toBeDefined();
            expect(rds.Type).toBe('AWS::RDS::DBInstance');
            expect(rds.Properties.DBInstanceIdentifier).toEqual({
                'Fn::Sub': 'db-${EnvironmentSuffix}',
            });
            expect(rds.Properties.Engine).toBe('mysql');
            expect(rds.Properties.EngineVersion).toBe('8.0.39');
            expect(rds.Properties.DBInstanceClass).toBe('db.t3.micro');
            expect(rds.Properties.StorageEncrypted).toBe(true);
            expect(rds.Properties.MultiAZ).toBe(true);
        });

        test('RDSDatabase should have both DeletionPolicy and UpdateReplacePolicy', () => {
            const rds = template.Resources.RDSDatabase;
            expect(rds.DeletionPolicy).toBe('Snapshot');
            expect(rds.UpdateReplacePolicy).toBe('Snapshot');
        });

        test('RDSDatabase should use Secrets Manager for credentials', () => {
            const rds = template.Resources.RDSDatabase;
            expect(rds.Properties.MasterUsername).toEqual({
                'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}',
            });
            expect(rds.Properties.MasterUserPassword).toEqual({
                'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}',
            });
        });

        test('RDSDatabase should have backup configuration', () => {
            const rds = template.Resources.RDSDatabase;
            expect(rds.Properties.BackupRetentionPeriod).toBe(7);
            expect(rds.Properties.PreferredBackupWindow).toBe('03:00-04:00');
            expect(rds.Properties.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
        });

        test('RDSDatabase should use gp3 storage', () => {
            const rds = template.Resources.RDSDatabase;
            expect(rds.Properties.StorageType).toBe('gp3');
            expect(rds.Properties.AllocatedStorage).toBe('20');
        });
    });

    describe('Storage Resources', () => {
        test('S3Bucket should have encryption enabled', () => {
            const bucket = template.Resources.S3Bucket;
            expect(bucket).toBeDefined();
            expect(bucket.Type).toBe('AWS::S3::Bucket');
            expect(bucket.Properties.BucketName).toEqual({
                'Fn::Sub': 'secure-bucket-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}',
            });

            const encryption = bucket.Properties.BucketEncryption;
            expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
        });

        test('S3Bucket should have versioning enabled', () => {
            const bucket = template.Resources.S3Bucket;
            expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
        });

        test('S3Bucket should block all public access', () => {
            const bucket = template.Resources.S3Bucket;
            const publicBlock = bucket.Properties.PublicAccessBlockConfiguration;

            expect(publicBlock.BlockPublicAcls).toBe(true);
            expect(publicBlock.BlockPublicPolicy).toBe(true);
            expect(publicBlock.IgnorePublicAcls).toBe(true);
            expect(publicBlock.RestrictPublicBuckets).toBe(true);
        });

        test('S3BucketPolicy should enforce SSL', () => {
            const policy = template.Resources.S3BucketPolicy;
            expect(policy).toBeDefined();
            expect(policy.Type).toBe('AWS::S3::BucketPolicy');

            const statements = policy.Properties.PolicyDocument.Statement;
            expect(statements).toHaveLength(1);

            const sslEnforcement = statements.find((s: any) => s.Sid === 'EnforceSSLRequestsOnly');
            expect(sslEnforcement).toBeDefined();
            expect(sslEnforcement.Effect).toBe('Deny');
            expect(sslEnforcement.Condition.Bool['aws:SecureTransport']).toBe('false');
        });

        test('CloudTrailBucket should have encryption and public access block', () => {
            const bucket = template.Resources.CloudTrailBucket;
            expect(bucket).toBeDefined();
            expect(bucket.Type).toBe('AWS::S3::Bucket');
            expect(bucket.Properties.BucketName).toEqual({
                'Fn::Sub': 'cloudtrail-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}',
            });

            const encryption = bucket.Properties.BucketEncryption;
            expect(encryption).toBeDefined();

            const publicBlock = bucket.Properties.PublicAccessBlockConfiguration;
            expect(publicBlock.BlockPublicAcls).toBe(true);
            expect(publicBlock.BlockPublicPolicy).toBe(true);
        });

        test('CloudTrailBucket should have 30-day lifecycle policy', () => {
            const bucket = template.Resources.CloudTrailBucket;
            expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
            expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
            expect(bucket.Properties.LifecycleConfiguration.Rules[0].Status).toBe('Enabled');
            expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(30);
        });

        test('CloudTrailBucketPolicy should allow CloudTrail access', () => {
            const policy = template.Resources.CloudTrailBucketPolicy;
            expect(policy).toBeDefined();
            expect(policy.Type).toBe('AWS::S3::BucketPolicy');

            const statements = policy.Properties.PolicyDocument.Statement;
            const aclCheck = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
            const write = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');

            expect(aclCheck).toBeDefined();
            expect(aclCheck.Principal.Service).toBe('cloudtrail.amazonaws.com');
            expect(write).toBeDefined();
            expect(write.Action).toBe('s3:PutObject');
        });
    });

    describe('WAF and Security', () => {
        test('WebACL should be configured for regional scope', () => {
            const webacl = template.Resources.WebACL;
            expect(webacl).toBeDefined();
            expect(webacl.Type).toBe('AWS::WAFv2::WebACL');
            expect(webacl.Properties.Scope).toBe('REGIONAL');
            expect(webacl.Properties.DefaultAction).toEqual({ Allow: {} });
        });

        test('WebACL should have SQL injection protection', () => {
            const webacl = template.Resources.WebACL;
            const rules = webacl.Properties.Rules;

            const sqlRule = rules.find((r: any) => r.Name === 'SQLInjectionRule');
            expect(sqlRule).toBeDefined();
            expect(sqlRule.Priority).toBe(1);
            expect(sqlRule.Statement.ManagedRuleGroupStatement.Name).toBe(
                'AWSManagedRulesSQLiRuleSet'
            );
        });

        test('WebACL should have XSS protection', () => {
            const webacl = template.Resources.WebACL;
            const rules = webacl.Properties.Rules;

            const xssRule = rules.find((r: any) => r.Name === 'XSSProtectionRule');
            expect(xssRule).toBeDefined();
            expect(xssRule.Priority).toBe(2);
            expect(xssRule.Statement.ManagedRuleGroupStatement.Name).toBe(
                'AWSManagedRulesKnownBadInputsRuleSet'
            );
        });

        test('WebACLAssociation should associate WAF with ALB', () => {
            const assoc = template.Resources.WebACLAssociation;
            expect(assoc).toBeDefined();
            expect(assoc.Type).toBe('AWS::WAFv2::WebACLAssociation');
            expect(assoc.Properties.ResourceArn).toEqual({
                Ref: 'ApplicationLoadBalancer',
            });
            expect(assoc.Properties.WebACLArn).toEqual({
                'Fn::GetAtt': ['WebACL', 'Arn'],
            });
        });
    });

    describe('CloudFront Distribution', () => {
        test('CloudFrontDistribution should be enabled', () => {
            const cf = template.Resources.CloudFrontDistribution;
            expect(cf).toBeDefined();
            expect(cf.Type).toBe('AWS::CloudFront::Distribution');
            expect(cf.Properties.DistributionConfig.Enabled).toBe(true);
        });

        test('CloudFrontDistribution should use ALB as origin', () => {
            const cf = template.Resources.CloudFrontDistribution;
            const origins = cf.Properties.DistributionConfig.Origins;

            expect(origins).toHaveLength(1);
            expect(origins[0].Id).toBe('ALBOrigin');
            expect(origins[0].DomainName).toEqual({
                'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
            });
        });

        test('CloudFrontDistribution should redirect HTTP to HTTPS', () => {
            const cf = template.Resources.CloudFrontDistribution;
            const behavior = cf.Properties.DistributionConfig.DefaultCacheBehavior;

            expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
        });

        test('CloudFrontDistribution should enable compression', () => {
            const cf = template.Resources.CloudFrontDistribution;
            const behavior = cf.Properties.DistributionConfig.DefaultCacheBehavior;

            expect(behavior.Compress).toBe(true);
        });
    });

    describe('CloudTrail', () => {
        test('CloudTrail should be configured with log validation', () => {
            const trail = template.Resources.CloudTrail;
            expect(trail).toBeDefined();
            expect(trail.Type).toBe('AWS::CloudTrail::Trail');
            expect(trail.Properties.TrailName).toEqual({
                'Fn::Sub': 'trail-${EnvironmentSuffix}',
            });
            expect(trail.Properties.IsLogging).toBe(true);
            expect(trail.Properties.EnableLogFileValidation).toBe(true);
        });

        test('CloudTrail should depend on bucket policy', () => {
            const trail = template.Resources.CloudTrail;
            expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
        });

        test('CloudTrail should log all management events', () => {
            const trail = template.Resources.CloudTrail;
            const eventSelectors = trail.Properties.EventSelectors;

            expect(eventSelectors).toHaveLength(1);
            expect(eventSelectors[0].ReadWriteType).toBe('All');
            expect(eventSelectors[0].IncludeManagementEvents).toBe(true);
        });
    });

    describe('CloudWatch Alarms', () => {
        test('HighCPUAlarm should monitor Auto Scaling Group CPU', () => {
            const alarm = template.Resources.HighCPUAlarm;
            expect(alarm).toBeDefined();
            expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
            expect(alarm.Properties.MetricName).toBe('CPUUtilization');
            expect(alarm.Properties.Namespace).toBe('AWS/EC2');
            expect(alarm.Properties.Threshold).toBe(80);
            expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
        });

        test('UnhealthyHostAlarm should monitor target group health', () => {
            const alarm = template.Resources.UnhealthyHostAlarm;
            expect(alarm).toBeDefined();
            expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
            expect(alarm.Properties.MetricName).toBe('UnHealthyHostCount');
            expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
            expect(alarm.Properties.Threshold).toBe(0);
            expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
        });

        test('DatabaseCPUAlarm should monitor RDS CPU', () => {
            const alarm = template.Resources.DatabaseCPUAlarm;
            expect(alarm).toBeDefined();
            expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
            expect(alarm.Properties.MetricName).toBe('CPUUtilization');
            expect(alarm.Properties.Namespace).toBe('AWS/RDS');
            expect(alarm.Properties.Threshold).toBe(75);
        });
    });

    describe('Outputs', () => {
        test('should have all required outputs', () => {
            const expectedOutputs = [
                'LoadBalancerDNS',
                'CloudFrontURL',
                'S3BucketName',
                'RDSEndpoint',
                'DBSecretArn',
                'CloudTrailBucketName',
                'CloudFrontDistributionId',
            ];

            expectedOutputs.forEach(outputName => {
                expect(template.Outputs[outputName]).toBeDefined();
            });
        });

        test('LoadBalancerDNS output should be correct', () => {
            const output = template.Outputs.LoadBalancerDNS;
            expect(output.Description).toBe('DNS name of the Application Load Balancer');
            expect(output.Value).toEqual({
                'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
            });
            expect(output.Export.Name).toEqual({
                'Fn::Sub': '${AWS::StackName}-ALB-DNS',
            });
        });

        test('CloudFrontURL output should be correct', () => {
            const output = template.Outputs.CloudFrontURL;
            expect(output.Description).toBe('CloudFront Distribution URL');
            expect(output.Value).toEqual({
                'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'],
            });
        });

        test('S3BucketName output should be correct', () => {
            const output = template.Outputs.S3BucketName;
            expect(output.Description).toBe('Name of the S3 bucket');
            expect(output.Value).toEqual({ Ref: 'S3Bucket' });
        });

        test('RDSEndpoint output should be correct', () => {
            const output = template.Outputs.RDSEndpoint;
            expect(output.Description).toBe('RDS Database Endpoint');
            expect(output.Value).toEqual({
                'Fn::GetAtt': ['RDSDatabase', 'Endpoint.Address'],
            });
        });

        test('DBSecretArn output should be correct', () => {
            const output = template.Outputs.DBSecretArn;
            expect(output.Description).toBe(
                'ARN of the Secrets Manager secret containing database credentials'
            );
            expect(output.Value).toEqual({ Ref: 'DBSecret' });
        });

        test('CloudTrailBucketName output should be correct', () => {
            const output = template.Outputs.CloudTrailBucketName;
            expect(output.Description).toBe('Name of the CloudTrail S3 bucket');
            expect(output.Value).toEqual({ Ref: 'CloudTrailBucket' });
            expect(output.Export.Name).toEqual({
                'Fn::Sub': '${AWS::StackName}-CloudTrail-Bucket',
            });
        });

        test('CloudFrontDistributionId output should be correct', () => {
            const output = template.Outputs.CloudFrontDistributionId;
            expect(output.Description).toBe('CloudFront Distribution ID');
            expect(output.Value).toEqual({ Ref: 'CloudFrontDistribution' });
            expect(output.Export.Name).toEqual({
                'Fn::Sub': '${AWS::StackName}-CloudFront-ID',
            });
        });

        test('should have exactly 7 outputs', () => {
            expect(Object.keys(template.Outputs)).toHaveLength(7);
        });
    });

    describe('Resource Count and Structure', () => {
        test('should have correct number of resources', () => {
            const resourceCount = Object.keys(template.Resources).length;
            expect(resourceCount).toBeGreaterThanOrEqual(40);
        });

        test('all resources should have Type property', () => {
            Object.values(template.Resources).forEach((resource: any) => {
                expect(resource.Type).toBeDefined();
                expect(typeof resource.Type).toBe('string');
            });
        });

        test('all resources should have Properties', () => {
            Object.entries(template.Resources).forEach(([name, resource]: [string, any]) => {
                // Some resources like VPCGatewayAttachment have minimal properties
                expect(resource.Properties).toBeDefined();
            });
        });
    });

    describe('Tagging', () => {
        test('VPC should have proper tags', () => {
            const vpc = template.Resources.VPC;
            expect(vpc.Properties.Tags).toBeDefined();
            expect(vpc.Properties.Tags[0].Key).toBe('Name');
        });

        test('Subnets should have proper tags', () => {
            ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'].forEach(
                subnetName => {
                    const subnet = template.Resources[subnetName];
                    expect(subnet.Properties.Tags).toBeDefined();
                }
            );
        });

        test('AutoScalingGroup should propagate tags to instances', () => {
            const asg = template.Resources.AutoScalingGroup;
            const tags = asg.Properties.Tags;

            expect(tags).toBeDefined();
            expect(tags[0].PropagateAtLaunch).toBe(true);
        });
    });

    describe('Security Best Practices', () => {
        test('all S3 buckets should have encryption', () => {
            const s3Bucket = template.Resources.S3Bucket;
            const cloudTrailBucket = template.Resources.CloudTrailBucket;

            expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
            expect(cloudTrailBucket.Properties.BucketEncryption).toBeDefined();
        });

        test('all S3 buckets should block public access', () => {
            const s3Bucket = template.Resources.S3Bucket;
            const cloudTrailBucket = template.Resources.CloudTrailBucket;

            expect(s3Bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
            expect(cloudTrailBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
        });

        test('RDS should have encryption enabled', () => {
            const rds = template.Resources.RDSDatabase;
            expect(rds.Properties.StorageEncrypted).toBe(true);
        });

        test('RDS credentials should use Secrets Manager', () => {
            const rds = template.Resources.RDSDatabase;
            expect(rds.Properties.MasterUsername).toBeDefined();
            expect(rds.Properties.MasterUserPassword).toBeDefined();
            // Verify it's using Secrets Manager resolution
            expect(JSON.stringify(rds.Properties.MasterUsername)).toContain('secretsmanager');
            expect(JSON.stringify(rds.Properties.MasterUserPassword)).toContain('secretsmanager');
        });

        test('EC2 instances should use instance profile with limited permissions', () => {
            const lt = template.Resources.LaunchTemplate;
            expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
        });

        test('CloudTrail should be enabled', () => {
            const trail = template.Resources.CloudTrail;
            expect(trail.Properties.IsLogging).toBe(true);
        });

        test('WAF should be associated with ALB', () => {
            const assoc = template.Resources.WebACLAssociation;
            expect(assoc).toBeDefined();
            expect(assoc.Properties.ResourceArn).toEqual({
                Ref: 'ApplicationLoadBalancer',
            });
        });
    });

    describe('High Availability', () => {
        test('should deploy across multiple availability zones', () => {
            const subnet1 = template.Resources.PublicSubnet1;
            const subnet2 = template.Resources.PublicSubnet2;

            expect(subnet1.Properties.AvailabilityZone).toEqual({
                'Fn::Select': [0, { 'Fn::GetAZs': '' }],
            });
            expect(subnet2.Properties.AvailabilityZone).toEqual({
                'Fn::Select': [1, { 'Fn::GetAZs': '' }],
            });
        });

        test('RDS should have Multi-AZ enabled', () => {
            const rds = template.Resources.RDSDatabase;
            expect(rds.Properties.MultiAZ).toBe(true);
        });

        test('should have NAT Gateway in each availability zone', () => {
            const nat1 = template.Resources.NATGateway1;
            const nat2 = template.Resources.NATGateway2;

            expect(nat1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
            expect(nat2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
        });

        test('Auto Scaling Group should have minimum 2 instances', () => {
            const asg = template.Resources.AutoScalingGroup;
            expect(parseInt(asg.Properties.MinSize)).toBeGreaterThanOrEqual(2);
        });
    });

    describe('CloudFormation Intrinsic Functions', () => {
        test('should use Fn::Sub for dynamic naming', () => {
            const vpc = template.Resources.VPC;
            expect(vpc.Properties.Tags[0].Value).toHaveProperty('Fn::Sub');
        });

        test('should use Fn::GetAtt for resource attributes', () => {
            const listener = template.Resources.ALBListener;
            // ALB reference uses Ref, but outputs use GetAtt
            const output = template.Outputs.LoadBalancerDNS;
            expect(output.Value).toHaveProperty('Fn::GetAtt');
        });

        test('should use Fn::Select and Fn::GetAZs for AZ selection', () => {
            const subnet = template.Resources.PublicSubnet1;
            expect(subnet.Properties.AvailabilityZone).toHaveProperty('Fn::Select');
        });

        test('should use Ref for resource references', () => {
            const attach = template.Resources.AttachGateway;
            expect(attach.Properties.VpcId).toEqual({ Ref: 'VPC' });
        });
    });
});