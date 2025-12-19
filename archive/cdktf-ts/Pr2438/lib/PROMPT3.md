The build passed but tests failed:

$ npm run test

> tap@0.1.0 test
> jest --coverage

FAIL test/tap-stack.int.test.ts (10.915 s)
Integration Tests for TapStack
✓ should configure the RDS security group to only allow traffic from Beanstalk (7 ms)
✓ should configure the Beanstalk environment in the correct VPC and subnets (1 ms)
✕ should create primary and secondary Route 53 failover records (1 ms)

● Integration Tests for TapStack › should create primary and secondary Route 53 failover records

    Expected aws_route53_record with properties {"failover_routing_policy":[{"type":"PRIMARY"}]} to be present in synthesized stack.
    Found 2 aws_route53_record resources instead:
    [
      {
        "alias": {
          "evaluate_target_health": true,
          "name": "${aws_elastic_beanstalk_environment.beanstalk-env.cname}",
          "zone_id": "Z35SXDOTRQ7X7K"
        },
        "failover_routing_policy": {
          "type": "PRIMARY"
        },
        "health_check_id": "${aws_route53_health_check.eb-health-check.id}",
        "name": "www.${aws_route53_zone.zone.name}",
        "set_identifier": "primary-eb-environment",
        "type": "A",
        "zone_id": "${aws_route53_zone.zone.zone_id}"
      },
      {
        "alias": {
          "evaluate_target_health": false,
          "name": "${aws_s3_bucket.failover-bucket.website_endpoint}",
          "zone_id": "${aws_s3_bucket.failover-bucket.hosted_zone_id}"
        },
        "failover_routing_policy": {
          "type": "SECONDARY"
        },
        "name": "www.${aws_route53_zone.zone.name}",
        "set_identifier": "secondary-failover-s3",
        "type": "A",
        "zone_id": "${aws_route53_zone.zone.zone_id}"
      }
    ]

      57 |
      58 |   it("should create primary and secondary Route 53 failover records", () => {
    > 59 |     expect(synthesized).toHaveResourceWithProperties(Route53Record, {
         |                         ^
      60 |       failover_routing_policy: [{ type: "PRIMARY" }],
      61 |     });
      62 |     expect(synthesized).toHaveResourceWithProperties(Route53Record, {

      at Object.<anonymous> (test/tap-stack.int.test.ts:59:25)

PASS test/tap-stack.unit.test.ts (10.951 s)
Unit Tests for TapStack
✓ should create a VPC (10 ms)
✓ should create a Multi-AZ RDS instance (2 ms)
✓ should create an Elastic Beanstalk application (1 ms)
✓ should create a Route 53 Zone (1 ms)
✓ should create a CloudWatch alarm for environment health (1 ms)

--------------|---------|----------|---------|---------|-------------------
File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------|---------|----------|---------|---------|-------------------
All files | 100 | 100 | 100 | 100 |  
 tap-stack.ts | 100 | 100 | 100 | 100 |  
--------------|---------|----------|---------|---------|-------------------
Test Suites: 1 failed, 1 passed, 2 total
Tests: 1 failed, 7 passed, 8 total
Snapshots: 0 total
Time: 16.391 s
Ran all test suites.
