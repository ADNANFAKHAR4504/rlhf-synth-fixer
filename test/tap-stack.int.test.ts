// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import AWS from 'aws-sdk';
import mysql from 'mysql2/promise';
import axios from 'axios';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Environment suffix
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Extract outputs
const albDNS = outputs[`${environmentSuffix}-LoadBalancerDNS`];
const rdsEndpoint = outputs[`${environmentSuffix}-RDSInstanceEndpoint`];
const secretName = `${environmentSuffix}-db-secretscredential`;
const logsBucket = `${environmentSuffix}-logs-${process.env.AWS_ACCOUNT_ID}-web-app`;

AWS.config.update({ region: process.env.AWS_REGION || 'ap-south-1' });
const secretsManager = new AWS.SecretsManager();
const s3 = new AWS.S3();

describe('TapStack Integration Tests', () => {
  jest.setTimeout(60000);

  test('ALB should respond with HTTP 200', async () => {
    const res = await axios.get(`http://${albDNS}`);
    expect(res.status).toBe(200);
  });

  test('SecretsManager secret should exist and contain username/password', async () => {
    const secret = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    const parsed = JSON.parse(secret.SecretString || '{}');
    expect(parsed).toHaveProperty('username');
    expect(parsed).toHaveProperty('password');
  });

  test('Can connect to RDS using credentials from SecretsManager', async () => {
    const secret = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    const creds = JSON.parse(secret.SecretString || '{}');

    const conn = await mysql.createConnection({
      host: rdsEndpoint,
      user: creds.username,
      password: creds.password,
      port: 3306,
    });

    const [rows] = await conn.query('SELECT 1 as test');
    expect(rows[0].test).toBe(1);

    await conn.end();
  });

  test('EC2 should be able to write to Logs S3 bucket (cross-service interaction)', async () => {
    const key = `integration-test/${Date.now()}.txt`;
    await s3.putObject({
      Bucket: logsBucket,
      Key: key,
      Body: 'Integration test log content',
    }).promise();

    const obj = await s3.getObject({ Bucket: logsBucket, Key: key }).promise();
    expect(obj.Body?.toString()).toContain('Integration test log content');
  });
});
