import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Plan Integration Tests', () => {
  let plan: any;

  // Helper function to find a planned resource change
  const findResourceChange = (type: string, name: string) => {
    return plan.resource_changes?.find(
      (rc: any) => rc.type === type && rc.name === name
    );
  };

  // Helper function to get a property from a resource's planned "after" state
  const getPlannedValue = (resourceChange: any, attribute: string) => {
    return resourceChange?.change?.after?.[attribute];
  };

  beforeAll(() => {
    const planPath = path.resolve(
      process.cwd(),
      'cfn-outputs/all-outputs.json'
    );
    if (!fs.existsSync(planPath)) {
      throw new Error(
        `Plan file not found at path: ${planPath}. Please run 'terraform plan' and 'terraform show -json'.`
      );
    }
    const planContent = fs.readFileSync(planPath, 'utf8');
    plan = JSON.parse(planContent);
  });

  // ##################################################################
  // ## Test Suite 1: Network Integration                          ##
  // ##################################################################
  describe('Network Integration', () => {
    test('VPC peering connection must link the correct VPCs', () => {
      const peering = findResourceChange(
        'aws_vpc_peering_connection',
        'nova_peering'
      );
      expect(peering).toBeDefined();

      // Check that the peering connection references are expressions pointing to the correct resources
      const vpcIdRef = getPlannedValue(peering, 'vpc_id');
      const peerVpcIdRef = getPlannedValue(peering, 'peer_vpc_id');

      expect(vpcIdRef).toEqual(expect.stringMatching(/aws_vpc.useast1/));
      expect(peerVpcIdRef).toEqual(expect.stringMatching(/aws_vpc.uswest2/));
    });

    test('Private route tables must have a route for the VPC peering connection', () => {
      const peeringRouteEast = findResourceChange(
        'aws_route',
        'useast1_to_uswest2_private'
      );
      expect(peeringRouteEast).toBeDefined();

      const peeringRouteWest = findResourceChange(
        'aws_route',
        'uswest2_to_useast1_private'
      );
      expect(peeringRouteWest).toBeDefined();

      // Verify the route points to the peering connection resource
      expect(
        getPlannedValue(peeringRouteEast, 'vpc_peering_connection_id')
      ).toEqual(
        expect.stringMatching(/aws_vpc_peering_connection.nova_peering/)
      );
      expect(
        getPlannedValue(peeringRouteWest, 'vpc_peering_connection_id')
      ).toEqual(
        expect.stringMatching(/aws_vpc_peering_connection.nova_peering/)
      );
    });
  });

  // ##################################################################
  // ## Test Suite 2: Security and Encryption Standards            ##
  // ##################################################################
  describe('Security and Encryption Standards', () => {
    test('RDS security group must only allow ingress from the EC2 security group', () => {
      const rdsSg = findResourceChange('aws_security_group', 'rds_useast1');
      expect(rdsSg).toBeDefined();

      const ingressRules = getPlannedValue(rdsSg, 'ingress');
      expect(ingressRules).toHaveLength(1); // Positive case: exactly one rule

      const rule = ingressRules[0];
      expect(rule.from_port).toBe(5432);
      expect(rule.protocol).toBe('tcp');
      expect(rule.security_groups).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/aws_security_group.ec2_useast1/),
        ])
      );

      // Edge case: ensure no CIDR blocks are present
      expect(rule.cidr_blocks).toBeNull();
    });

    test('RDS instances must be planned with Multi-AZ and encryption enabled', () => {
      const rdsEast = findResourceChange('aws_db_instance', 'rds_useast1');
      expect(getPlannedValue(rdsEast, 'multi_az')).toBe(true);
      expect(getPlannedValue(rdsEast, 'storage_encrypted')).toBe(true);

      const rdsWest = findResourceChange('aws_db_instance', 'rds_uswest2');
      expect(getPlannedValue(rdsWest, 'multi_az')).toBe(true);
      expect(getPlannedValue(rdsWest, 'storage_encrypted')).toBe(true);
    });

    test('Launch template must enforce IMDSv2', () => {
      const lt = findResourceChange('aws_launch_template', 'app_useast1');
      expect(lt).toBeDefined();

      const metadataOptions = getPlannedValue(lt, 'metadata_options');
      expect(metadataOptions[0].http_tokens).toBe('required');
    });
  });

  // ##################################################################
  // ## Test Suite 3: Outputs Validation                           ##
  // ##################################################################
  describe('Outputs Validation', () => {
    test('should plan to create all required outputs', () => {
      expect(plan.planned_values.outputs.primary_region_details).toBeDefined();
      expect(
        plan.planned_values.outputs.secondary_region_details
      ).toBeDefined();
      expect(plan.planned_values.outputs.central_logging_bucket).toBeDefined();
      expect(
        plan.planned_values.outputs.vpc_peering_connection_id
      ).toBeDefined();
    });

    test('should mark sensitive outputs correctly', () => {
      // This test would check for sensitive outputs if any were defined.
      // Example: expect(plan.planned_values.outputs.db_password.sensitive).toBe(true);
      // In our current case, no outputs are sensitive, so we can assert that.
      const outputs = plan.planned_values.outputs;
      for (const key in outputs) {
        expect(outputs[key].sensitive).toBe(false);
      }
    });
  });
});
