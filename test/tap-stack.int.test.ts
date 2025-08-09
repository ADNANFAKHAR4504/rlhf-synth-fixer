import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Full Infrastructure Integration Test', () => {
  let synthOutput: any;

  beforeAll(() => {
    const app = new App();

    //  ensure TapStack can resolve the DB password during synth
    process.env.DB_PASSWORD = 'testpass123!';

    const stack = new TapStack(app, 'TapStackTest', {
      environmentSuffix: 'test',
      awsRegion: 'us-west-2',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-west-2',
    });

    const json = Testing.synth(stack);
    console.log(' Synth Output Preview:', json.slice(0, 500));

    synthOutput = JSON.parse(json);
  });

  test('All core resources are present', () => {
    const resources = synthOutput.resource ?? {};
    const resourceKeys = Object.keys(resources);

    expect(resourceKeys).toEqual(
      expect.arrayContaining([expect.stringMatching(/^aws_vpc(\.|$)/)])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_subnet(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_nat_gateway(\.|$)/),
        expect.stringMatching(/^aws_internet_gateway(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_route_table(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_route_table_association(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_security_group(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_instance(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_db_instance(\.|$)/),
        expect.stringMatching(/^aws_db_subnet_group(\.|$)/),
      ])
    );

    expect(resourceKeys).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^aws_s3_bucket(\.|$)/),
        expect.stringMatching(/^aws_s3_bucket_versioning(\.|$)/),
        expect.stringMatching(/^aws_s3_bucket_server_side_encryption_configuration(\.|$)/),
        expect.stringMatching(/^aws_s3_bucket_public_access_block(\.|$)/),
      ])
    );
  });
});
