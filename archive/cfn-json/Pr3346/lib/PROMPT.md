# Image Processing Pipeline for Photo-Sharing App

## Overview

You need to design and implement a serverless image processing pipeline for a photo-sharing application. The system should handle automatic resizing of 4,000 daily image uploads and store them efficiently in the cloud.

## Requirements

### Core Functionality
- Automatically resize uploaded images
- Process approximately 4,000 images per day
- Store both original and processed images
- Monitor processing performance and errors

### Technical Specifications
- **Platform**: AWS CloudFormation
- **Runtime**: Python 3.11
- **Region**: us-west-2
- **Output Format**: JSON

### Architecture Components

#### Storage
- **S3 Bucket for Uploads**: Primary storage for incoming images
- **S3 Bucket for Processed Images**: Storage for resized images

#### Processing
- **Lambda Function**: Python 3.11 runtime for image resizing
- **S3 Event Triggers**: Automatic Lambda invocation on new uploads

#### Monitoring and Notifications
- **CloudWatch**: Processing metrics and performance logging
- **SNS**: Failure notifications and error alerts

#### Security
- **IAM Roles**: Proper permissions for Lambda execution

## Implementation Guidelines

### Event-Driven Architecture
- Configure S3 event triggers to automatically invoke Lambda when images are uploaded
- Ensure reliable processing without manual intervention

### Error Handling
- Implement SNS notifications for processing failures
- Set up proper error logging and alerting mechanisms

### Performance Monitoring
- Log processing times in CloudWatch for performance analysis
- Track success and failure rates
- Monitor resource utilization

### Security Best Practices
- Create least-privilege IAM roles for Lambda execution
- Ensure secure access to S3 buckets
- Implement proper error handling without exposing sensitive information

## Expected Deliverables

Create a complete CloudFormation template that provisions all necessary AWS resources for this image processing pipeline. The template should be production-ready and include all required components for automatic image resizing, storage, monitoring, and error handling.