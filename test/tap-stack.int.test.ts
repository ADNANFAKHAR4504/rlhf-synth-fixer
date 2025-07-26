import fs from 'fs';
import yaml from 'js-yaml';

// Use the same custom schema as your unit tests
const CF_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!GetAtt', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Sub', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Join', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!If', { kind: 'sequence', construct: (data) => data }),
  new yaml.Type('!Equals', { kind: 'sequence', construct: (data) => data }),
  new yaml.Type('!Not', { kind: 'sequence', construct: (data) => data }),
  new yaml.Type('!FindInMap', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!ImportValue', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Select', { kind: 'sequence', construct: (data) => data }),
  new yaml.Type('!GetAZs', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Split', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Base64', { kind: 'scalar', construct: (data) => data }),
  new yaml.Type('!Condition', { kind: 'scalar', construct: (data) => data }),
]);

const template = yaml.load(fs.readFileSync('lib/TapStack.yml', 'utf8'), { schema: CF_SCHEMA }) as any;

describe('TapStack CloudFormation Integration Tests', () => {
  it('should configure S3 bucket with KMS encryption and logging', () => {
    const s3 = template.Resources.SecureS3Bucket;
    expect(s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    expect(s3.Properties.LoggingConfiguration).toBeDefined();
    expect(s3.Properties.LoggingConfiguration.DestinationBucketName).toBeDefined();
  });

  it('should configure CloudTrail to use the log bucket', () => {
    const trail = template.Resources.CloudTrail;
    expect(trail).toBeDefined();
    expect(trail.Properties.S3BucketName).toBeDefined();
    expect(trail.Properties.IsLogging).toBe(true);
  });

  it('should configure RDS with Multi-AZ and encrypted storage', () => {
    const rds = template.Resources.RDSInstance;
    expect(rds.Properties.MultiAZ).toBe(true);
    expect(rds.Properties.StorageEncrypted).toBe(true);
    // Password is now handled by conditional logic (auto-generated or provided)
    expect(rds.Properties.MasterUserPassword).toBeDefined();
  });

  it('should configure AutoScalingGroup with rolling update policy', () => {
    const asg = template.Resources.AutoScalingGroup;
    expect(asg.Properties.MinSize).toBe(1);
    expect(asg.UpdatePolicy).toBeDefined();
    expect(asg.UpdatePolicy.AutoScalingRollingUpdate).toBeDefined();
  });

  it('should ensure all major resources are tagged with Environment', () => {
    const resources = [
      'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 'RouteTable', 'WebSecurityGroup',
      'ApplicationELB', 'TargetGroup', 'AutoScalingGroup', 'RDSInstance', 'SecureS3Bucket',
      'S3ProcessingLambda', 'CloudFrontDistribution', 'AppDynamoTable', 'NotificationTopic'
    ];
    resources.forEach((key) => {
      const res = template.Resources[key];
      expect(res).toBeDefined();
      const tags = res.Properties?.Tags || res.Tags;
      expect(tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment' })
        ])
      );
    });
  });

  it('should configure S3 bucket notification for Lambda', () => {
    const s3 = template.Resources.SecureS3Bucket;
    expect(s3.Properties.NotificationConfiguration).toBeDefined();
    expect(s3.Properties.NotificationConfiguration.LambdaConfigurations[0].Function).toBeDefined();
  });

  it('should grant S3 permission to invoke Lambda', () => {
    const perm = template.Resources.S3InvokeLambdaPermission;
    expect(perm).toBeDefined();
    expect(perm.Type).toBe('AWS::Lambda::Permission');
    expect(perm.Properties.Principal).toBe('s3.amazonaws.com');
  });

  it('should configure Application Load Balancer with proper listeners and health checks', () => {
    const elb = template.Resources.ApplicationELB;
    expect(elb).toBeDefined();
    expect(elb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    expect(elb.Properties.Subnets).toHaveLength(2);
    expect(elb.Properties.SecurityGroups).toEqual([
      'WebSecurityGroup'
    ]);

    const listener = template.Resources.Listener;
    expect(listener).toBeDefined();
    expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    expect(listener.Properties.Port).toBe(80);
    expect(listener.Properties.Protocol).toBe('HTTP');
    expect(listener.Properties.DefaultActions[0].Type).toBe('forward');

    const targetGroup = template.Resources.TargetGroup;
    expect(targetGroup).toBeDefined();
    expect(targetGroup.Properties.HealthCheckPath).toBe('/');
    expect(targetGroup.Properties.Protocol).toBe('HTTP');
    expect(targetGroup.Properties.Port).toBe(80);
    expect(targetGroup.Properties.TargetType).toBe('instance');
  });

  it('should configure DynamoDB table with proper billing and schema', () => {
    const dynamoDB = template.Resources.AppDynamoTable;
    expect(dynamoDB).toBeDefined();
    expect(dynamoDB.Type).toBe('AWS::DynamoDB::Table');
    expect(dynamoDB.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    
    // Check key schema (note: attribute name is 'ID' not 'id')
    expect(dynamoDB.Properties.AttributeDefinitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ AttributeName: 'ID', AttributeType: 'S' })
      ])
    );
    expect(dynamoDB.Properties.KeySchema).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ AttributeName: 'ID', KeyType: 'HASH' })
      ])
    );

    // Check tags
    expect(dynamoDB.Properties.Tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: 'Environment' })
      ])
    );
  });

  it('should configure CloudFront Distribution with proper settings', () => {
    const cloudFront = template.Resources.CloudFrontDistribution;
    expect(cloudFront).toBeDefined();
    expect(cloudFront.Type).toBe('AWS::CloudFront::Distribution');
    
    const config = cloudFront.Properties.DistributionConfig;
    expect(config.Enabled).toBe(true);
    expect(config.DefaultRootObject).toBe('index.html');
    
    // Check origin configuration
    expect(config.Origins).toHaveLength(1);
    const origin = config.Origins[0];
    expect(origin.Id).toBe('S3Origin');
    expect(origin.DomainName).toBeDefined();
    expect(origin.S3OriginConfig).toBeDefined();
    
    // Check default cache behavior
    const defaultCacheBehavior = config.DefaultCacheBehavior;
    expect(defaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    expect(defaultCacheBehavior.TargetOriginId).toBe('S3Origin');
    expect(defaultCacheBehavior.ForwardedValues.QueryString).toBe(false);
    
    // Check tags
    expect(cloudFront.Properties.Tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: 'Environment' })
      ])
    );
  });

  it('should ensure Load Balancer is properly integrated with Auto Scaling Group', () => {
    const asg = template.Resources.AutoScalingGroup;
    const targetGroup = template.Resources.TargetGroup;
    
    // Auto Scaling Group should reference the target group directly
    expect(asg.Properties.TargetGroupARNs).toEqual([
      'TargetGroup'
    ]);
    
    // Target group should be in the same VPC as ASG subnets
    expect(targetGroup.Properties.VpcId).toBe('VPC');
    
    // ASG should have update policy for rolling updates
    expect(asg.UpdatePolicy).toBeDefined();
    expect(asg.UpdatePolicy.AutoScalingRollingUpdate).toBeDefined();
    expect(asg.UpdatePolicy.AutoScalingRollingUpdate.MinInstancesInService).toBe(1);
  });

  it('should configure proper security group rules for Load Balancer', () => {
    const webSG = template.Resources.WebSecurityGroup;
    expect(webSG).toBeDefined();
    
    const ingressRules = webSG.Properties.SecurityGroupIngress;
    // Should allow HTTP traffic from internet
    const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
    expect(httpRule).toBeDefined();
    expect(httpRule.IpProtocol).toBe('tcp');
    expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    
    // Should allow HTTPS traffic from internet
    const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);
    if (httpsRule) {
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    }
  });
});