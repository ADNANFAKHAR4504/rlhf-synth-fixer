import { validateAvailabilityZones } from '../lib/infrastructure-stack';

describe('validateAvailabilityZones()', () => {
  it('should pass validation with 2 or more availability zones', () => {
    expect(() => validateAvailabilityZones(['us-east-1a', 'us-east-1b'])).not.toThrow();
    expect(() => validateAvailabilityZones(['us-east-1a', 'us-east-1b', 'us-east-1c'])).not.toThrow();
  });

  it('should throw error with fewer than 2 availability zones', () => {
    expect(() => validateAvailabilityZones([])).toThrow(
      'Region us-east-1 must have at least 2 availability zones. Found: 0'
    );
    expect(() => validateAvailabilityZones(['us-east-1a'])).toThrow(
      'Region us-east-1 must have at least 2 availability zones. Found: 1'
    );
  });

  it('should use custom region in error message', () => {
    expect(() => validateAvailabilityZones(['us-west-1a'], 'us-west-1')).toThrow(
      'Region us-west-1 must have at least 2 availability zones. Found: 1'
    );
  });

  it('should use environment variable for region when not specified', () => {
    const originalRegion = process.env.AWS_REGION;
    process.env.AWS_REGION = 'eu-west-1';
    
    expect(() => validateAvailabilityZones(['eu-west-1a'])).toThrow(
      'Region eu-west-1 must have at least 2 availability zones. Found: 1'
    );
    
    // Restore original environment
    if (originalRegion) {
      process.env.AWS_REGION = originalRegion;
    } else {
      delete process.env.AWS_REGION;
    }
  });

  it('should handle all region parameter scenarios', () => {
    const originalRegion = process.env.AWS_REGION;
    
    // Test with region parameter provided (first branch)
    expect(() => validateAvailabilityZones(['az1'], 'custom-region')).toThrow(
      'Region custom-region must have at least 2 availability zones. Found: 1'
    );
    
    // Test with no region parameter but AWS_REGION set (second branch)
    process.env.AWS_REGION = 'env-region';
    expect(() => validateAvailabilityZones(['az1'])).toThrow(
      'Region env-region must have at least 2 availability zones. Found: 1'
    );
    
    // Test with no region parameter and no AWS_REGION (third branch)
    delete process.env.AWS_REGION;
    expect(() => validateAvailabilityZones(['az1'])).toThrow(
      'Region us-east-1 must have at least 2 availability zones. Found: 1'
    );
    
    // Restore original environment
    if (originalRegion) {
      process.env.AWS_REGION = originalRegion;
    } else {
      delete process.env.AWS_REGION;
    }
  });
});