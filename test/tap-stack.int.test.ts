/**
 * Integration-test suite for the deployed Tap-Stack.
 *
 * • Assumes `cdk deploy` (or a CloudFormation deploy) has finished and its
 *   outputs were flattened into `cfn-outputs/flat-outputs.json`.
 * • Uses the ENVIRONMENT_SUFFIX CI variable (falls back to “dev” locally).
 */

import fs from 'fs';

/* ------------------------------------------------------------------ */
/* Load CFN outputs produced by the deployment                        */
/* ------------------------------------------------------------------ */
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

/* Environment suffix, e.g. dev / staging / prod */
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

/* Keys that should always appear in the output file */
const EXPECTED_OUTPUT_KEYS = ['LoadBalancerDNS', 'S3BucketName', 'RDSEndpoint'];

describe('Tap-Stack – post-deploy integration checks', () => {
  /* -------------------------------------------------------------- */
  /* Sanity: every expected output is present and a non-empty string */
  /* -------------------------------------------------------------- */
  test('CFN outputs file is complete', () => {
    expect(outputs).toBeDefined();
    EXPECTED_OUTPUT_KEYS.forEach(key => {
      expect(typeof outputs[key]).toBe('string');
      expect(outputs[key].length).toBeGreaterThan(0);
    });
  });

  /* -------------------------------------------------------------- */
  /* S3 bucket name includes the environment suffix                 */
  /* -------------------------------------------------------------- */
  test('S3 bucket name contains environment suffix', () => {
    const bucketName = outputs.S3BucketName;
    expect(bucketName).toContain(environmentSuffix);
  });

  /* -------------------------------------------------------------- */
  /* Load-balancer DNS name looks like a DNS name                   */
  /* -------------------------------------------------------------- */
  test('ALB DNS name is syntactically valid', () => {
    const dns = outputs.LoadBalancerDNS;
    const dnsRegex = /^([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)$/;
    expect(dns).toMatch(dnsRegex);
  });

  /* -------------------------------------------------------------- */
  /* RDS endpoint is present and non-empty                          */
  /* -------------------------------------------------------------- */
  test('RDS endpoint is non-empty string', () => {
    const rdsEndpoint = outputs.RDSEndpoint;
    expect(rdsEndpoint).toEqual(expect.any(String));
    expect(rdsEndpoint.length).toBeGreaterThan(0);
  });
});
