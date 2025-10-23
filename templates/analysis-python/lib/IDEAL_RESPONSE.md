```json
{
  "AuditTimestamp": "2025-10-23 07:30:09",
  "Region": "us-east-1",
  "UnusedEBSVolumes": {
    "Count": 3,
    "TotalSize": 6,
    "Volumes": [
      {
        "VolumeId": "vol-0123456789abcdef0",
        "Size": 1,
        "VolumeType": "gp2",
        "CreateTime": "2025-10-23 04:30:07",
        "AvailabilityZone": "us-east-1a",
        "Encrypted": false,
        "Tags": {}
      },
      {
        "VolumeId": "vol-0123456789abcdef1",
        "Size": 2,
        "VolumeType": "gp2",
        "CreateTime": "2025-10-23 04:30:07",
        "AvailabilityZone": "us-east-1a",
        "Encrypted": false,
        "Tags": {}
      },
      {
        "VolumeId": "vol-0123456789abcdef2",
        "Size": 3,
        "VolumeType": "gp2",
        "CreateTime": "2025-10-23 04:30:07",
        "AvailabilityZone": "us-east-1a",
        "Encrypted": false,
        "Tags": {}
      }
    ]
  },
  "PublicSecurityGroups": {
    "Count": 1,
    "SecurityGroups": [
      {
        "GroupId": "sg-0123456789abcdef0",
        "GroupName": "public",
        "Description": "has public",
        "VpcId": "vpc-0123456789abcdef0",
        "PublicIngressRules": [
          {
            "Protocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "Source": "0.0.0.0/0"
          }
        ],
        "Tags": {}
      }
    ]
  },
  "CloudWatchLogMetrics": {
    "TotalLogStreams": 2,
    "TotalSize": 402,
    "AverageStreamSize": 201.0,
    "LogGroupMetrics": [
      {
        "LogGroupName": "/test-group",
        "StreamCount": 2,
        "TotalSize": 402,
        "AverageStreamSize": 201.0
      }
    ]
  }
}
```
