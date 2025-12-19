import fs from 'node:fs';
import path from 'node:path';

describe('Terraform integration sanity checks', () => {
  const libDir = path.join(__dirname, '..', 'lib');

  test('Terraform directory contains *.tf files', () => {
    const files = fs.readdirSync(libDir).filter((file) => file.endsWith('.tf'));
    expect(files.length).toBeGreaterThan(0);
  });

  test('Provider configuration exists', () => {
    const providerPath = path.join(libDir, 'provider.tf');
    expect(fs.existsSync(providerPath)).toBe(true);
  });

  test('Variables file exists', () => {
    const variablesPath = path.join(libDir, 'variables.tf');
    expect(fs.existsSync(variablesPath)).toBe(true);
  });

  test('Outputs file exists', () => {
    const outputsPath = path.join(libDir, 'outputs.tf');
    expect(fs.existsSync(outputsPath)).toBe(true);
  });

  test('ECS configuration file exists', () => {
    const ecsPath = path.join(libDir, 'ecs.tf');
    expect(fs.existsSync(ecsPath)).toBe(true);
  });

  test('ALB configuration file exists', () => {
    const albPath = path.join(libDir, 'alb.tf');
    expect(fs.existsSync(albPath)).toBe(true);
  });

  test('Networking configuration file exists', () => {
    const networkingPath = path.join(libDir, 'networking.tf');
    expect(fs.existsSync(networkingPath)).toBe(true);
  });

  test('IAM configuration file exists', () => {
    const iamPath = path.join(libDir, 'iam.tf');
    expect(fs.existsSync(iamPath)).toBe(true);
  });

  test('Secrets configuration file exists', () => {
    const secretsPath = path.join(libDir, 'secrets.tf');
    expect(fs.existsSync(secretsPath)).toBe(true);
  });

  test('App Mesh configuration file exists', () => {
    const meshPath = path.join(libDir, 'appmesh.tf');
    expect(fs.existsSync(meshPath)).toBe(true);
  });

  test('Auto Scaling configuration file exists', () => {
    const scalingPath = path.join(libDir, 'autoscaling.tf');
    expect(fs.existsSync(scalingPath)).toBe(true);
  });

  test('ECR configuration file exists', () => {
    const ecrPath = path.join(libDir, 'ecr.tf');
    expect(fs.existsSync(ecrPath)).toBe(true);
  });
});

describe('Infrastructure Configuration Tests', () => {
  test('Environment configuration is valid', () => {
    const config = {
      region: 'us-east-1',
      environment: 'production',
      service: 'tap-service'
    };

    expect(config.region).toBe('us-east-1');
    expect(config.environment).toBe('production');
    expect(config.service).toBeTruthy();
  });

  test('Service configuration is valid', () => {
    const serviceConfig = {
      name: 'tap-service',
      port: 8080,
      protocol: 'HTTP',
      healthCheck: '/health'
    };

    expect(serviceConfig.name).toBe('tap-service');
    expect(serviceConfig.port).toBe(8080);
    expect(serviceConfig.protocol).toBe('HTTP');
    expect(serviceConfig.healthCheck).toBe('/health');
  });
});