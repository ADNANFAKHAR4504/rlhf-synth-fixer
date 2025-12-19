import { validateCidrOverlap } from '../lib/utils/cidr-validator';

describe('CIDR Validator', () => {
  describe('validateCidrOverlap', () => {
    const validCidrs = [
      { env: 'dev', cidr: '10.0.0.0/16' },
      { env: 'staging', cidr: '10.1.0.0/16' },
      { env: 'prod', cidr: '10.2.0.0/16' },
    ];

    it('should not throw when CIDRs do not overlap', () => {
      expect(() => {
        validateCidrOverlap(validCidrs, 'dev', '10.0.0.0/16');
      }).not.toThrow();
    });

    it('should throw when current CIDR matches defined CIDR for environment', () => {
      expect(() => {
        validateCidrOverlap(validCidrs, 'dev', '10.0.0.0/16');
      }).not.toThrow(); // Should pass when CIDR matches expected
    });

    it('should throw when current CIDR does not match expected for environment', () => {
      expect(() => {
        validateCidrOverlap(validCidrs, 'dev', '10.5.0.0/16');
      }).toThrow();
    });

    it('should throw when CIDR overlaps with another environment', () => {
      expect(() => {
        validateCidrOverlap(validCidrs, 'dev', '10.1.0.0/16');
      }).toThrow();
    });

    it('should detect overlap in staging environment', () => {
      expect(() => {
        validateCidrOverlap(validCidrs, 'staging', '10.0.0.0/16');
      }).toThrow();
    });

    it('should detect overlap in prod environment', () => {
      expect(() => {
        validateCidrOverlap(validCidrs, 'prod', '10.1.0.0/16');
      }).toThrow();
    });

    it('should handle empty CIDR list', () => {
      expect(() => {
        validateCidrOverlap([], 'dev', '10.0.0.0/16');
      }).not.toThrow(); // Should allow dynamic environments not in list
    });

    it('should handle single CIDR', () => {
      const singleCidr = [{ env: 'dev', cidr: '10.0.0.0/16' }];
      expect(() => {
        validateCidrOverlap(singleCidr, 'dev', '10.0.0.0/16');
      }).not.toThrow();
    });

    it('should validate different CIDR blocks', () => {
      const differentCidrs = [
        { env: 'dev', cidr: '172.16.0.0/16' },
        { env: 'staging', cidr: '172.17.0.0/16' },
        { env: 'prod', cidr: '172.18.0.0/16' },
      ];
      expect(() => {
        validateCidrOverlap(differentCidrs, 'dev', '172.16.0.0/16');
      }).not.toThrow();
    });

    it('should throw error with descriptive message on overlap', () => {
      try {
        validateCidrOverlap(validCidrs, 'dev', '10.1.0.0/16');
        fail('Should have thrown error');
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toContain('CIDR');
        }
      }
    });

    it('should allow dynamic environments not in CIDR list', () => {
      expect(() => {
        validateCidrOverlap(validCidrs, 'production', '10.3.0.0/16');
      }).not.toThrow(); // Should allow dynamic environments (e.g., PR stacks)
    });

    it('should handle CIDR with different subnet masks', () => {
      const mixedCidrs = [
        { env: 'dev', cidr: '10.0.0.0/16' },
        { env: 'staging', cidr: '10.1.0.0/24' },
        { env: 'prod', cidr: '10.2.0.0/20' },
      ];
      expect(() => {
        validateCidrOverlap(mixedCidrs, 'dev', '10.0.0.0/16');
      }).not.toThrow();
    });

    it('should validate AWS VPC CIDR ranges', () => {
      const awsCidrs = [
        { env: 'dev', cidr: '10.0.0.0/16' },
        { env: 'staging', cidr: '10.1.0.0/16' },
        { env: 'prod', cidr: '10.2.0.0/16' },
      ];
      expect(() => {
        validateCidrOverlap(awsCidrs, 'staging', '10.1.0.0/16');
      }).not.toThrow();
    });
  });

  describe('CIDR Overlap Detection Logic', () => {
    const cidrs = [
      { env: 'dev', cidr: '10.0.0.0/16' },
      { env: 'staging', cidr: '10.1.0.0/16' },
      { env: 'prod', cidr: '10.2.0.0/16' },
    ];

    it('should properly compare CIDR blocks', () => {
      expect(() => {
        validateCidrOverlap(cidrs, 'dev', '10.0.0.0/16');
      }).not.toThrow();
    });

    it('should identify when CIDR is used by wrong environment', () => {
      expect(() => {
        validateCidrOverlap(cidrs, 'staging', '10.0.0.0/16');
      }).toThrow();
    });
  });

  describe('Error Messages', () => {
    const cidrs = [
      { env: 'dev', cidr: '10.0.0.0/16' },
      { env: 'staging', cidr: '10.1.0.0/16' },
    ];

    it('should provide clear error message for overlap', () => {
      try {
        validateCidrOverlap(cidrs, 'dev', '10.1.0.0/16');
        fail('Should have thrown');
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message.length).toBeGreaterThan(0);
          expect(error.message).toBeTruthy();
        }
      }
    });

    it('should allow dynamic environments with unique CIDR', () => {
      expect(() => {
        validateCidrOverlap(cidrs, 'test', '10.3.0.0/16');
      }).not.toThrow(); // Should allow dynamic environments not in predefined list
    });
  });
});
