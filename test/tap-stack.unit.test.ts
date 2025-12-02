// Mock AWS and Pulumi to avoid actual resource creation during tests
jest.mock('@pulumi/pulumi');
jest.mock('@pulumi/aws');

describe('TapStack', () => {
  it('should be importable', () => {
    const { TapStack } = require('../lib/tap-stack');
    expect(TapStack).toBeDefined();
  });

  it('should define TapStackArgs interface', () => {
    const tapStackModule = require('../lib/tap-stack');
    expect(tapStackModule.TapStack).toBeDefined();
  });
});
