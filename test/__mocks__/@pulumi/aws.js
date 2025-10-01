const mockResource = (type) => {
  return class {
    constructor(name, args) {
      const resource = {
        type,
        name,
        args,
        id: `${name}-id-123`,
        arn: `arn:aws:${type}:us-east-2:123456789012:${name}`,
        bucket: args?.bucket || `${name}-bucket`,
        domainName: args?.domainName || `${name}.cloudfront.net`,
        bucketDomainName: `${name}.s3.amazonaws.com`,
        bucketRegionalDomainName: `${name}.s3.us-east-2.amazonaws.com`,
        hostedZoneId: 'Z123456',
        zoneId: 'zone-123',
        nameServers: ['ns1.example.com', 'ns2.example.com'],
      };

      // Store in global mock resources
      if (!global.mockResources) {
        global.mockResources = [];
      }
      global.mockResources.push(resource);

      // Assign properties to this instance
      Object.assign(this, resource);
    }
  };
};

module.exports = {
  s3: {
    Bucket: mockResource('s3:bucket'),
    BucketPolicy: mockResource('s3:bucketpolicy'),
    BucketPublicAccessBlock: mockResource('s3:bucketpab'),
    BucketOwnershipControls: mockResource('s3:bucketownership'),
    BucketAcl: mockResource('s3:bucketacl'),
  },
  cloudfront: {
    Distribution: mockResource('cloudfront:distribution'),
    OriginAccessControl: mockResource('cloudfront:oac'),
    ResponseHeadersPolicy: mockResource('cloudfront:responseheaders'),
    RealtimeLogConfig: mockResource('cloudfront:realtimelogconfig'),
  },
  route53: {
    Zone: mockResource('route53:zone'),
    Record: mockResource('route53:record'),
  },
  cloudwatch: {
    MetricAlarm: mockResource('cloudwatch:metricalarm'),
  },
  kinesis: {
    Stream: mockResource('kinesis:stream'),
  },
  iam: {
    Role: mockResource('iam:role'),
    RolePolicy: mockResource('iam:rolepolicy'),
  },
  acm: {
    Certificate: mockResource('acm:certificate'),
  },
};