/**
 * test/tap-stack.unit.test.ts
 *
 * Jest unit tests for TapStack CloudFormation template
 * (lib/TapStack.yaml → converted to lib/TapStack.json before running).
 */

import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  /* ------------------------------------------------------------------ */
  /* Load JSON version of the template once for all tests               */
  /* ------------------------------------------------------------------ */
  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  });

  /* ------------------------------------------------------------------ */
  /* Basic smoke checks                                                 */
  /* ------------------------------------------------------------------ */
  describe('Basic Template Checks', () => {
    test('description matches template', () => {
      expect(template.Description).toBe(
        'Highly available, scalable web application stack'
      );
    });

    test('parameters Environment and KeyPairName exist', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.KeyPairName).toBeDefined();
    });
  });

  /* ------------------------------------------------------------------ */
  /* Parameter validation                                               */
  /* ------------------------------------------------------------------ */
  describe('Parameters', () => {
    test('Environment parameter schema', () => {
      const p = template.Parameters.Environment;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('prod');
      expect(p.Description).toBe('Environment name');
    });

    test('KeyPairName parameter schema', () => {
      const p = template.Parameters.KeyPairName;
      expect(p.Type).toBe('AWS::EC2::KeyPair::KeyName');
      expect(p.Description).toBe(
        'Name of an existing EC2 KeyPair to enable SSH access'
      );
    });

    test('template defines exactly two parameters', () => {
      expect(Object.keys(template.Parameters)).toHaveLength(2);
    });
  });

  /* ------------------------------------------------------------------ */
  /* Presence of critical resources                                     */
  /* ------------------------------------------------------------------ */
  describe('Key Resources', () => {
    [
      'prod-vpc',
      'prod-public-subnet-1',
      'prod-private-subnet-1',
      'prod-application-load-balancer',
      'prod-auto-scaling-group',
      'prod-rds-mysql',
      'prod-s3-bucket'
    ].forEach(id =>
      test(`resource ${id} exists`, () => {
        expect(template.Resources[id]).toBeDefined();
      })
    );
  });

  /* ------------------------------------------------------------------ */
  /* Outputs                                                            */
  /* ------------------------------------------------------------------ */
  describe('Outputs', () => {
    const outputKeys = ['LoadBalancerDNS', 'S3BucketName', 'RDSEndpoint'];

    test('template exposes exactly three outputs', () => {
      expect(Object.keys(template.Outputs)).toHaveLength(3);
    });

    outputKeys.forEach(key => {
      test(`output ${key} is defined`, () => {
        expect(template.Outputs[key]).toBeDefined();
      });

      test(`export name for ${key} uses literal \${Environment} macro`, () => {
        const exportName = template.Outputs[key].Export.Name;
        expect(exportName).toEqual({ 'Fn::Sub': `\${Environment}-${key}` });
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /* Overall structure                                                  */
  /* ------------------------------------------------------------------ */
  describe('Template Structure', () => {
    test('required top-level sections exist', () => {
      ['AWSTemplateFormatVersion', 'Description', 'Parameters', 'Resources', 'Outputs'].forEach(
        section => expect(template[section]).toBeDefined()
      );
    });

    test('format version is 2010-09-09', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('resource count is reasonable (>30)', () => {
      expect(Object.keys(template.Resources).length).toBeGreaterThan(30);
    });
  });
});