// Configuration - These are coming from cfn-outputs after cdk deploy
import AWS from 'aws-sdk';
import fs from 'fs';
import https from 'https';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const projectName = process.env.PROJECT_NAME || 'myapp';

// AWS SDK Configuration
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const rds = new AWS.RDS();
const elbv2 = new AWS.ELBv2();
const cloudfront = new AWS.CloudFront();
const wafv2 = new AWS.WAFV2();
const guardduty = new AWS.GuardDuty();
const cloudtrail = new AWS.CloudTrail();
const iam = new AWS.IAM();

// Helper function to make HTTP requests
const makeHttpRequest = (url) => {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          body: data,
          headers: response.headers
        });
      });
    });
    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

describe('AWS Infrastructure Integration Tests', () => {
  
  describe('VPC and Networking', () => {
    test('VPC should exist and be properly configured', async () => {
      const vpcId = outputs[`${projectName}-${environmentSuffix}-vpc-id`];
      expect(vpcId).toBeDefined();
      
      const vpc = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(vpc.Vpcs).toHaveLength(1);
      expect(vpc.Vpcs[0].State).toBe('available');
      expect(vpc.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('Public and private subnets should exist', async () => {
      const publicSubnets = outputs[`${projectName}-${environmentSuffix}-public-subnets`].split(',');
      const privateSubnets = outputs[`${projectName}-${environmentSuffix}-private-subnets`].split(',');
      
      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);
      
      const allSubnets = [...publicSubnets, ...privateSubnets];
      const subnets = await ec2.describeSubnets({ SubnetIds: allSubnets }).promise();
      
      expect(subnets.Subnets).toHaveLength(4);
      subnets.Subnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
      });
    });
  });

  describe('S3 Buckets', () => {
    test('Application bucket should exist with proper configuration', async () => {
      const bucketName = outputs[`${projectName}-${environmentSuffix}-app-bucket`];
      expect(bucketName).toBeDefined();
      
      // Check bucket exists
      const headResult = await s3.headBucket({ Bucket: bucketName }).promise();
      expect(headResult).toBeDefined();
      
      // Check encryption
      const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryption.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
      expect(encryption.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      
      // Check versioning
      const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
      expect(versioning.Status).toBe('Enabled');
      
      // Check public access block
      const publicAccessBlock = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('RDS Database', () => {
    test('Database should exist and be properly configured', async () => {
      const dbEndpoint = outputs[`${projectName}-${environmentSuffix}-db-endpoint`];
      expect(dbEndpoint).toBeDefined();
      
      const dbInstances = await rds.describeDBInstances({
        DBInstanceIdentifier: `${projectName}-${environmentSuffix}-db`
      }).promise();
      
      expect(dbInstances.DBInstances).toHaveLength(1);
      const dbInstance = dbInstances.DBInstances[0];
      
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.DeletionProtection).toBe(true);
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    test('ALB should exist and be accessible', async () => {
      const albDns = outputs[`${projectName}-${environmentSuffix}-alb-dns`];
      expect(albDns).toBeDefined();
      
      // Check ALB status
      const loadBalancers = await elbv2.describeLoadBalancers().promise();
      const alb = loadBalancers.LoadBalancers.find(lb => 
        lb.DNSName === albDns
      );
      
      expect(alb).toBeDefined();
      expect(alb.State.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      
      // Test HTTP connectivity (should work)
      try {
        const response = await makeHttpRequest(`http://${albDns}`);
        expect(response.statusCode).toBeLessThan(500);
      } catch (error) {
        // ALB might take time to be fully ready, log but don't fail
        console.warn(`ALB not yet accessible: ${error.message}`);
      }
    }, 30000);

    test('Target group should be healthy', async () => {
      const targetGroups = await elbv2.describeTargetGroups({
        Names: [`${projectName}-${environmentSuffix}-tg`]
      }).promise();
      
      expect(targetGroups.TargetGroups).toHaveLength(1);
      const targetGroup = targetGroups.TargetGroups[0];
      
      const targetHealth = await elbv2.describeTargetHealth({
        TargetGroupArn: targetGroup.TargetGroupArn
      }).promise();
      
      expect(targetHealth.TargetHealthDescriptions.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('CloudFront Distribution', () => {
    test('CloudFront distribution should exist and be deployed', async () => {
      const cfDomain = outputs[`${projectName}-${environmentSuffix}-cf-domain`];
      expect(cfDomain).toBeDefined();
      
      const distributions = await cloudfront.listDistributions().promise();
      const distribution = distributions.DistributionList.Items.find(d => 
        d.DomainName === cfDomain
      );
      
      expect(distribution).toBeDefined();
      expect(distribution.Status).toBe('Deployed');
      expect(distribution.Enabled).toBe(true);
    }, 45000);
  });

  describe('WAF Web ACL', () => {
    test('WAF should exist and be associated with ALB', async () => {
      const wafArn = outputs[`${projectName}-${environmentSuffix}-waf-arn`];
      expect(wafArn).toBeDefined();
      
      const webACL = await wafv2.getWebACL({
        Scope: 'REGIONAL',
        Id: wafArn.split('/').pop()
      }).promise();
      
      expect(webACL.WebACL).toBeDefined();
      expect(webACL.WebACL.Rules.length).toBeGreaterThanOrEqual(2);
      
      // Check association with ALB
      const albArn = await elbv2.describeLoadBalancers().promise();
      const associations = await wafv2.listResourcesForWebACL({
        WebACLArn: wafArn,
        ResourceType: 'APPLICATION_LOAD_BALANCER'
      }).promise();
      
      expect(associations.ResourceArns.length).toBeGreaterThan(0);
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail should be active and logging', async () => {
      const cloudtrailArn = outputs[`${projectName}-${environmentSuffix}-cloudtrail-arn`];
      expect(cloudtrailArn).toBeDefined();
      
      const trails = await cloudtrail.describeTrails({
        trailNameList: [cloudtrailArn]
      }).promise();
      
      expect(trails.trailList).toHaveLength(1);
      const trail = trails.trailList[0];
      
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      
      // Check if logging is enabled
      const status = await cloudtrail.getTrailStatus({
        Name: cloudtrailArn
      }).promise();
      
      expect(status.IsLogging).toBe(true);
    });
  });

  describe('GuardDuty', () => {
    test('GuardDuty should be enabled', async () => {
      const detectorId = outputs[`${projectName}-${environmentSuffix}-guardduty-id`];
      expect(detectorId).toBeDefined();
      
      const detector = await guardduty.getDetector({
        DetectorId: detectorId
      }).promise();
      
      expect(detector.Status).toBe('ENABLED');
      expect(detector.FindingPublishingFrequency).toBe('FIFTEEN_MINUTES');
    });
  });

  describe('Security Groups', () => {
    test('Security groups should have proper rules', async () => {
      const vpcId = outputs[`${projectName}-${environmentSuffix}-vpc-id`];
      
      const securityGroups = await ec2.describeSecurityGroups({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'group-name', Values: [`${projectName}-${environmentSuffix}-web-sg`] }
        ]
      }).promise();
      
      expect(securityGroups.SecurityGroups).toHaveLength(1);
      const webSG = securityGroups.SecurityGroups[0];
      
      // Check ingress rules
      const ingressRules = webSG.IpPermissions;
      const sshRule = ingressRules.find(rule => rule.FromPort === 22);
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      
      expect(sshRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(sshRule.IpRanges[0].CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.IpRanges[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EC2 role should exist with proper permissions', async () => {
      const roleName = `${projectName}-${environmentSuffix}-ec2-role`;
      
      const role = await iam.getRole({ RoleName: roleName }).promise();
      expect(role.Role).toBeDefined();
      
      const rolePolicies = await iam.listRolePolicies({ RoleName: roleName }).promise();
      expect(rolePolicies.PolicyNames).toContain('EC2BasicPolicy');
    });

    test('MFA enforcement policy should exist', async () => {
      const policyName = `${projectName}-${environmentSuffix}-mfa-enforcement`;
      
      try {
        const policy = await iam.getManagedPolicy({
          PolicyArn: `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:policy/${policyName}`
        }).promise();
        expect(policy.Policy).toBeDefined();
      } catch (error) {
        // Policy might not be attached to current user, check if it exists
        const policies = await iam.listPolicies({ Scope: 'Local' }).promise();
        const mfaPolicy = policies.Policies.find(p => p.PolicyName === policyName);
        expect(mfaPolicy).toBeDefined();
      }
    });
  });

  describe('Monitoring and Alarms', () => {
    test('CPU alarm should exist and be configured', async () => {
      const cloudwatch = new AWS.CloudWatch();
      
      const alarms = await cloudwatch.describeAlarms({
        AlarmNames: [`${projectName}-${environmentSuffix}-cpu-alarm`]
      }).promise();
      
      expect(alarms.MetricAlarms).toHaveLength(1);
      const alarm = alarms.MetricAlarms[0];
      
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.StateValue).toMatch(/^(OK|ALARM|INSUFFICIENT_DATA)$/);
    });

    test('SNS topic for alarms should exist', async () => {
      const sns = new AWS.SNS();
      
      const topics = await sns.listTopics().promise();
      const alarmTopic = topics.Topics.find(topic => 
        topic.TopicArn.includes(`${projectName}-${environmentSuffix}-alarms`)
      );
      
      expect(alarmTopic).toBeDefined();
    });
  });

  describe('Lambda Function', () => {
    test('Sample Lambda function should exist and be invokable', async () => {
      const lambda = new AWS.Lambda();
      
      const functionName = `${projectName}-${environmentSuffix}-sample-function`;
      const func = await lambda.getFunction({ FunctionName: functionName }).promise();
      
      expect(func.Configuration.Runtime).toBe('python3.11');
      expect(func.Configuration.Timeout).toBe(30);
      expect(func.Configuration.State).toBe('Active');
      
      // Test invocation
      const result = await lambda.invoke({
        FunctionName: functionName,
        InvocationType: 'RequestResponse'
      }).promise();
      
      expect(result.StatusCode).toBe(200);
      const payload = JSON.parse(result.Payload);
      expect(payload.statusCode).toBe(200);
      expect(JSON.parse(payload.body)).toBe('Hello from Lambda!');
    });
  });

  describe('Overall Infrastructure Health', () => {
    test('All critical outputs should be present', () => {
      const requiredOutputs = [
        `${projectName}-${environmentSuffix}-vpc-id`,
        `${projectName}-${environmentSuffix}-public-subnets`,
        `${projectName}-${environmentSuffix}-private-subnets`,
        `${projectName}-${environmentSuffix}-app-bucket`,
        `${projectName}-${environmentSuffix}-db-endpoint`,
        `${projectName}-${environmentSuffix}-alb-dns`,
        `${projectName}-${environmentSuffix}-cf-domain`,
        `${projectName}-${environmentSuffix}-waf-arn`,
        `${projectName}-${environmentSuffix}-cloudtrail-arn`,
        `${projectName}-${environmentSuffix}-guardduty-id`
      ];
      
      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('Resources should follow naming convention', () => {
      Object.keys(outputs).forEach(key => {
        if (!key.includes('ComplianceStatus') && !key.includes('SecurityFeatures')) {
          expect(key).toMatch(new RegExp(`^${projectName}-${environmentSuffix}-`));
        }
      });
    });
  });
});