import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Integration Tests for TapStack', () => {
  test('Required outputs are present', () => {
    const requiredKeys = [
      'ApiUrl',
      'BugsTableName',
      'AttachmentsBucketName',
      'NotificationTopicArn',
      'StateMachineArn',
      'DashboardName'
    ];

    requiredKeys.forEach(key => {
      expect(outputs[key]).toBeDefined();
      expect(outputs[key]).not.toBe('');
      expect(typeof outputs[key]).toBe('string');
    });
  });

  test('Output names match environment suffix', () => {
    expect(outputs['BugsTableName']).toContain(`bug-reports-${environmentSuffix}`);
    expect(outputs['AttachmentsBucketName']).toContain(`bug-attachments-342597974367-${environmentSuffix}`);
    expect(outputs['NotificationTopicArn']).toContain(`bug-notifications-${environmentSuffix}`);
    expect(outputs['StateMachineArn']).toContain(`bug-triage-${environmentSuffix}`);
    expect(outputs['DashboardName']).toContain(`bug-tracking-${environmentSuffix}`);
    expect(outputs['ApiUrl']).toMatch(/^https:\/\/[\w-]+\.execute-api\.[.\w-]+\/dev\/$/);
  });

  test('AWS Resource ARNs follow expected format', () => {
    // Test ARN formats
    expect(outputs['NotificationTopicArn']).toMatch(/^arn:aws:sns:[\w-]+:\d+:bug-notifications-\w+$/);
    expect(outputs['StateMachineArn']).toMatch(/^arn:aws:states:[\w-]+:\d+:stateMachine:bug-triage-\w+$/);
  });
});
