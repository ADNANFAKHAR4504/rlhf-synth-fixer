import fs from 'fs';
import path from 'path';

let template: any;
let resources: Record<string, any>;

beforeAll(() => {
  // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`.
  // Otherwise, ensure the template is in JSON format.
  const templatePath = path.join(__dirname, '../lib/TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  template = JSON.parse(templateContent);
  resources = template.Resources;
});


describe('Unit Tests for TapStack CloudFormation Template', () => {
  // Verify the template version and description are correct.
  describe('Template metadata & parameters', () => {
    test('declares the template version and descriptive summary', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toMatch(
        /Enterprise-grade web application infrastructure/i
      );
    });

    test('EnvironmentName parameter restricts deployments to known stages', () => {
      const parameter = template.Parameters.EnvironmentName;

      expect(parameter.Type).toBe('String');
      expect(parameter.Default).toBe('Production');
      expect(parameter.AllowedValues).toEqual([
        'Development',
        'Staging',
        'Production',
      ]);
    });

    test('AlertEmail parameter enforces enterprise-grade validation', () => {
      const parameter = template.Parameters.AlertEmail;

      expect(parameter.Type).toBe('String');
      expect(parameter.Default).toBe('alerts@example.com');
      expect(parameter.AllowedPattern).toBe(
        '([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})'
      );
    });
  });

  describe('Condition logic', () => {
    // Ensure HTTPS resources are created only when a certificate ARN is provided.
    test('HasSSLCertificate toggles listeners strictly on certificate input', () => {
      expect(template.Conditions.HasSSLCertificate).toEqual({
        'Fn::Not': [
          {
            'Fn::Equals': [{ Ref: 'SSLCertificateArn' }, ''],
          },
        ],
      });
    });

    // Guarantee production-specific settings hinge solely on EnvironmentName.
    test('IsProduction evaluates only against the EnvironmentName parameter', () => {
      expect(template.Conditions.IsProduction).toEqual({
        'Fn::Equals': [{ Ref: 'EnvironmentName' }, 'Production'],
      });
    });
  });

  describe('Networking resources', () => {
    // Validate the core VPC comes with DNS-friendly settings.
    test('VPC enables DNS features and obeys the configurable CIDR block', () => {
      const vpc = resources.VPC;

      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });

    // Confirm each private route table points to its matching NAT gateway.
    test('Private route tables send internet bound traffic through NAT gateways', () => {
      const routeOne = resources.DefaultPrivateRoute1;
      const routeTwo = resources.DefaultPrivateRoute2;

      expect(routeOne.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
      expect(routeTwo.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
      expect(routeOne.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(routeTwo.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Load balancer & listener configuration', () => {
    // Ensure the ALB sits in both public subnets and is internet facing.
    test('ApplicationLoadBalancer spans the public subnets and uses ALB SG', () => {
      const alb = resources.ApplicationLoadBalancer;

      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toEqual(
        expect.arrayContaining([{ Ref: 'PublicSubnet1' }, { Ref: 'PublicSubnet2' }])
      );
      expect(alb.Properties.SecurityGroups).toEqual([{ Ref: 'ALBSecurityGroup' }]);
    });

    // Confirm target group health checks and stickiness match the requirements.
    test('ALBTargetGroup configures health checks and stickiness policies', () => {
      const targetGroup = resources.ALBTargetGroup;
      const attributes = targetGroup.Properties.TargetGroupAttributes;

      expect(targetGroup.Properties.HealthCheckPath).toBe('/health');
      expect(targetGroup.Properties.Matcher.HttpCode).toBe('200-299');
      expect(attributes).toEqual(
        expect.arrayContaining([
          { Key: 'deregistration_delay.timeout_seconds', Value: '30' },
          { Key: 'stickiness.enabled', Value: 'true' },
          { Key: 'stickiness.type', Value: 'lb_cookie' },
        ])
      );
    });

    // Verify HTTP listener redirects to HTTPS when a certificate is provided.
    test('ALBListenerHTTP redirects when HasSSLCertificate is true', () => {
      const listener = resources.ALBListenerHTTP;
      const defaultAction = listener.Properties.DefaultActions[0]['Fn::If'];

      expect(defaultAction[0]).toBe('HasSSLCertificate');
      expect(defaultAction[1]).toEqual({
        Type: 'redirect',
        RedirectConfig: { Protocol: 'HTTPS', Port: '443', StatusCode: 'HTTP_301' },
      });
      expect(defaultAction[2]).toEqual({
        Type: 'forward',
        TargetGroupArn: { Ref: 'ALBTargetGroup' },
      });
    });
  });

  describe('IAM roles & policies', () => {
    // Ensure web servers can only interact with the logs bucket.
    test('WebServerRole policy scopes S3 actions to ApplicationLogsBucket', () => {
      const role = resources.WebServerRole;
      const s3Policy = role.Properties.Policies.find(
        (policy: any) => policy.PolicyName === 'webapp-s3-logs-policy'
      );
      const statement = s3Policy.PolicyDocument.Statement[0];

      expect(statement.Action).toEqual(
        expect.arrayContaining(['s3:PutObject', 's3:PutObjectAcl', 's3:GetObject', 's3:ListBucket'])
      );
      expect(statement.Resource).toEqual(
        expect.arrayContaining([
          { 'Fn::GetAtt': ['ApplicationLogsBucket', 'Arn'] },
          { 'Fn::Sub': '${ApplicationLogsBucket.Arn}/*' },
        ])
      );
    });

    // Confirm the backup role attaches AWS-managed policies for backups/restores.
    // NOTE: AWS Backup resources removed due to LocalStack compatibility issues
    // test('BackupRole attaches AWSBackup service managed policies', () => {
    //   const backupRole = resources.BackupRole;
    //   expect(backupRole.Properties.ManagedPolicyArns).toEqual(
    //     expect.arrayContaining([
    //       'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
    //       'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores',
    //     ])
    //   );
    // });
  });

  describe('Monitoring & alerting resources', () => {
    // Verify alert email ends up subscribed to the SNS topic.
    test('SNSTopic subscribes the AlertEmail endpoint', () => {
      const snsTopic = resources.SNSTopic;
      const subscription = snsTopic.Properties.Subscription[0];

      expect(subscription.Endpoint).toEqual({ Ref: 'AlertEmail' });
      expect(subscription.Protocol).toBe('email');
    });

    // Confirm CPU alarm notifies SNS and hooks into scaling policies.
    test('HighCPUAlarm notifies SNS and triggers scaling adjustments', () => {
      const alarm = resources.HighCPUAlarm;

      expect(alarm.Properties.AlarmActions).toEqual(
        expect.arrayContaining([{ Ref: 'SNSTopic' }, { Ref: 'ScaleUpPolicy' }])
      );
      expect(alarm.Properties.OKActions).toEqual([{ Ref: 'ScaleDownPolicy' }]);
      expect(alarm.Properties.Dimensions[0]).toEqual({
        Name: 'AutoScalingGroupName',
        Value: { Ref: 'AutoScalingGroup' },
      });
    });
  });

  describe('Outputs & exports', () => {
    // Ensure critical outputs (ALB URL, VPC ID, DB endpoint) exist.
    test('Outputs include ALB URL, VPC ID, and Database endpoint exports', () => {
      const outputs = template.Outputs;

      expect(outputs.LoadBalancerURL.Value).toBeDefined();
      expect(outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(outputs.DatabaseEndpoint.Value).toEqual({
        'Fn::GetAtt': ['DatabaseInstance', 'Endpoint.Address'],
      });
    });

    // Verify security group outputs are exported with stack-aware names.
    test('Security group outputs provide cross-stack export names', () => {
      const outputs = template.Outputs;

      expect(outputs.ALBSecurityGroupId.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ALB-SG-ID',
      });
      expect(outputs.WebServerSecurityGroupId.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-WebServer-SG-ID',
      });
      expect(outputs.DatabaseSecurityGroupId.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Database-SG-ID',
      });
    });
  });
  describe('Security controls', () => {
    // Make sure the ALB is the only component directly open to the internet.
    test('ALB security group exposes only HTTP and HTTPS to the internet', () => {
      const sg = resources.ALBSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;

      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443);

      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(ingressRules).toHaveLength(2);
    });

    // Prevent lateral movement by locking SG ingress to approved groups.
    test('Web and database tiers accept traffic only from trusted security groups', () => {
      const webSg = resources.WebServerSecurityGroup;
      const dbSg = resources.DatabaseSecurityGroup;

      expect(
        webSg.Properties.SecurityGroupIngress.map(
          rule => rule.SourceSecurityGroupId
        )
      ).toEqual(
        expect.arrayContaining([
          { Ref: 'ALBSecurityGroup' },
          { Ref: 'BastionSecurityGroup' },
        ])
      );
      dbSg.Properties.SecurityGroupIngress.forEach(rule => {
        expect(rule.SourceSecurityGroupId).toEqual(
          expect.objectContaining({ Ref: expect.any(String) })
        );
      });
    });
  });

  describe('Compute layer', () => {
    // Verify IMDSv2, encryption, and IAM profile hardening on the launch template.
    test('Launch template enforces IMDSv2 and encrypted EBS volumes', () => {
      const launchTemplate =
        resources.LaunchTemplate.Properties.LaunchTemplateData;

      expect(launchTemplate.MetadataOptions.HttpTokens).toBe('required');
      expect(launchTemplate.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
      expect(launchTemplate.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['WebServerInstanceProfile', 'Arn'],
      });
    });

    // Check the ASG wiring ensures healthy instance registration before service.
    test('AutoScalingGroup registers instances with the ALB target group and waits for signals', () => {
      const asg = resources.AutoScalingGroup;

      expect(asg.Properties.TargetGroupARNs).toEqual([
        { Ref: 'ALBTargetGroup' },
      ]);
      expect(asg.CreationPolicy.ResourceSignal.Count).toEqual({
        Ref: 'DesiredCapacity',
      });
      expect(asg.CreationPolicy.ResourceSignal.Timeout).toBe('PT15M');
    });
  });

  describe('Data layer', () => {
    // Review secret-generation entropy and forbidden characters.
    test('Secrets Manager configuration excludes disallowed characters', () => {
      const secret =
        resources.DatabaseSecret.Properties.GenerateSecretString;

      expect(secret.PasswordLength).toBe(32);
      expect(secret.ExcludePunctuation).toBe(true);
      expect(secret.ExcludeCharacters).toBe('/@" ');
      expect(secret.RequireEachIncludedType).toBe(true);
    });

    // Assess RDS protection, multi-AZ logic, and tagging hygiene.
    test('Database instance is encrypted, multi-AZ aware, and tagged', () => {
      const db = resources.DatabaseInstance;

      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.MultiAZ).toEqual({
        'Fn::If': ['IsProduction', true, false],
      });
      expect(db.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Environment', Value: { Ref: 'EnvironmentName' } },
          { Key: 'iac-rlhf-amazon', Value: 'true' },
        ])
      );
    });
  });

  describe('Observability & resilience', () => {
    // Confirm the application logs bucket satisfies encryption, versioning, and block-public ACLs.
    test('Application logs bucket is encrypted, versioned, and private', () => {
      const bucket = resources.ApplicationLogsBucket;
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault;

      expect(encryption.SSEAlgorithm).toBe('AES256');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
    });

    // Ensure backup rule lifecycle behavior aligns with runbook expectations.
    // NOTE: AWS Backup resources removed due to LocalStack compatibility issues
    // test('Backup plan meets retention requirements and targets the managed vault', () => {
    //   const backupPlan =
    //     resources.BackupPlan.Properties.BackupPlan.BackupPlanRule[0];
    //   expect(backupPlan.TargetBackupVault).toEqual({ Ref: 'BackupVault' });
    //   expect(backupPlan.Lifecycle.MoveToColdStorageAfterDays).toBe(7);
    //   expect(backupPlan.Lifecycle.DeleteAfterDays).toBeGreaterThan(
    //     backupPlan.Lifecycle.MoveToColdStorageAfterDays
    //   );
    // });

    // Verify dashboard deployment obeys the monitoring toggle.
    test('CloudWatch dashboard deployment is gated behind the monitoring condition', () => {
      const dashboard = resources.CloudWatchDashboard;

      expect(dashboard.Condition).toBe('EnableMonitoring');
      expect(dashboard.Properties.DashboardName).toBe('webapp-dashboard');
    });
  });

});
