import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Mock the nested stacks to verify they are called correctly
jest.mock('../lib/ddb-stack');
jest.mock('../lib/rest-api-stack');

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
const stateBucketRegion = process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1';
const awsRegion = process.env.AWS_REGION || 'us-east-1';


describe('TapStack', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    app = new App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix, stateBucket, stateBucketRegion, awsRegion });
    synthesized = Testing.synth(stack);
  });

  describe("Stack Creation", () => {
    test("should create a TapStack instance", () => {
      expect(stack).toBeInstanceOf(TapStack);
    }); 
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(false).toBe(true);
    });
  });
});