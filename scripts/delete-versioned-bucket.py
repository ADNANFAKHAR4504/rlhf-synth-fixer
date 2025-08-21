#!/usr/bin/env python3
import boto3
import sys

bucket_name = 'prod-app-data-synthtrainr907'
region = 'us-east-1'

s3 = boto3.client('s3', region_name=region)

# Delete all object versions
paginator = s3.get_paginator('list_object_versions')
response_iterator = paginator.paginate(Bucket=bucket_name)

for response in response_iterator:
    versions = response.get('Versions', [])
    delete_markers = response.get('DeleteMarkers', [])
    
    if versions:
        delete_list = [{'Key': v['Key'], 'VersionId': v['VersionId']} for v in versions]
        s3.delete_objects(Bucket=bucket_name, Delete={'Objects': delete_list})
        print(f"Deleted {len(delete_list)} versions")
    
    if delete_markers:
        delete_list = [{'Key': d['Key'], 'VersionId': d['VersionId']} for d in delete_markers]
        s3.delete_objects(Bucket=bucket_name, Delete={'Objects': delete_list})
        print(f"Deleted {len(delete_list)} delete markers")

print(f"All versions deleted from {bucket_name}")