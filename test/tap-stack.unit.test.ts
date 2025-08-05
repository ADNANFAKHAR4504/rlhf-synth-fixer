/**
 * test/tap-stack.unit.test.ts
 *
 * Jest tests for the "highly available, scalable web-application stack"
 * CloudFormation template (TapStack.yaml → TapStack.json).
 */

import fs from 'fs';
import path from 'path';

/* If the CI pipeline passes ENVIRONMENT, use it; else default to prod */
const environment = process.env.ENVIRONMENT || 'prod';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  /* -------------------------------------------------------------------- */
  /* Load the template (already flipped to JSON) once for all test blocks */
  /* -------------------------------------------------------------------- */
  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const raw = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(raw);
  });

  /* -------------------------------------------------------------------- */
  /* Basic smoke tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('Basic Template Checks', () => {
    test('description matches template', () => {
      expect(template.Description).toBe(
        'Highly available, scalable web-application stack'
      );
    });

    test('parameters Environment and KeyPairName exist', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.KeyPairName).toBeDefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* Parameter validation                                                  */
  /* -------------------------------------------------------------------- */
  describe('Parameters', () => {
    test('Environment parameter schema', () => {
      const p = template.Parameters.Environment;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('prod');
      expect(p.Description).toBe('Environment name for resource tagging');
    });

    test('KeyPairName parameter schema', () => {
      const p = template.Parameters.KeyPairName;
      expect(p.Type).toBe('String'); // Changed from 'AWS::EC2::KeyPair::KeyName'
      expect(p.Default).toBe(''); // Added check for default empty value
      expect(p.Description).toBe(
        'Name of an existing EC2 KeyPair to enable SSH access to instances (leave empty to disable SSH access)'
      ); // Updated description
    });

    test('template defines exactly two parameters', () => {
      expect(Object.keys(template.Parameters)).toHaveLength(2);
    });
  });

  /* -------------------------------------------------------------------- */
  /* Conditions validation                                                 */
  /* -------------------------------------------------------------------- */
  describe('Conditions', () => {
    test('HasKeyPair condition exists', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('HasKeyPair condition has correct logic', () => {
      const condition = template.Conditions.HasKeyPair;
      expect(condition).toEqual({
        'Fn::Not': [
          {
            'Fn::Equals': [
              { 'Ref': 'KeyPairName' },
              ''
            ]
          }
        ]
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Critical resources present (updated to PascalCase logical IDs)       */
  /* -------------------------------------------------------------------- */
  describe('Key Resources', () => {
    const criticalResources = [
      'ProdVpc',
      'ProdPublicSubnet1',
      'ProdPrivateSubnet1',
      'ProdAlb',
      'ProdAutoScalingGroup',
      'ProdRdsInstance',
      'ProdS3Bucket',
    ];

    criticalResources.forEach(id =>
      test(`resource ${id} exists`, () => {
        expect(template.Resources[id]).toBeDefined();
      })
    );

    test('Launch Template uses conditional KeyName', () => {
      const launchTemplate = template.Resources.ProdLaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.KeyName).toEqual({
        'Fn::If': [
          'HasKeyPair',
          { 'Ref': 'KeyPairName' },
          { 'Ref': 'AWS::NoValue' }
        ]
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Outputs (updated to match actual export names)                       */
  /* -------------------------------------------------------------------- */
  describe('Outputs', () => {
    const outputKeys = ['VPCId', 'LoadBalancerDNS', 'RDSEndpoint', 'S3BucketName'];

    test('template exposes exactly four outputs', () => {
      expect(Object.keys(template.Outputs)).toHaveLength(4);
    });

    outputKeys.forEach(key => {
      test(`output ${key} is defined`, () => {
        expect(template.Outputs[key]).toBeDefined();
      });

      test(`export name for ${key} follows AWS::StackName pattern`, () => {
        const exportName = template.Outputs[key].Export.Name;
        expect(exportName).toEqual({ 'Fn::Sub': expect.stringContaining('${AWS::StackName}') });
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Overall structure sanity                                             */
  /* -------------------------------------------------------------------- */
  describe('Template Structure', () => {
    test('required top-level sections exist', () => {
      ['AWSTemplateFormatVersion', 'Description', 'Parameters', 'Resources', 'Outputs', 'Conditions'].forEach(
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
