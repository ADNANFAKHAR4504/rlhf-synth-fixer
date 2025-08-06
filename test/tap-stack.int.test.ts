import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Integration Tests', () => {
  test('Should have all expected outputs from the stack', () => {
    const expectedKeys = [
      'VPCId',
      'EC2InstanceId',
      'EC2PublicIP',
      'WebsiteContentBucket',
      'ApplicationLogsBucket',
      'BackupDataBucket',
      'S3AccessLogsBucket',
      'KMSKeyId',
      'EC2InstanceRoleArn',
    ];

    expectedKeys.forEach(key => {
      const fullKey = `TapStack${environmentSuffix}-${key}`;
      expect(outputs[fullKey]).toBeDefined();
      expect(outputs[fullKey]).not.toBeNull();
    });
  });
});
