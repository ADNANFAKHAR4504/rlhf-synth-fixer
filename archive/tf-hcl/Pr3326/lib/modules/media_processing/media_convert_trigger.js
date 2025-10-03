// Lambda function to trigger MediaConvert jobs when videos are uploaded

const AWS = require('aws-sdk');
const mediaconvert = new AWS.MediaConvert({ 
    endpoint: process.env.MEDIACONVERT_ENDPOINT 
});

exports.handler = async (event) => {
    console.log('Received S3 event:', JSON.stringify(event, null, 2));

    for (const record of event.Records) {
        const sourceBucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        
        console.log('Processing file: s3://' + sourceBucket + '/' + key);

        const params = {
            Role: process.env.ROLE_ARN,
            Settings: {
                Inputs: [{
                    FileInput: 's3://' + sourceBucket + '/' + key,
                    AudioSelectors: {
                        'Audio Selector 1': {
                            DefaultSelection: 'DEFAULT'
                        }
                    }
                }],
                OutputGroups: [{
                    Name: 'File Group',
                    OutputGroupSettings: {
                        Type: 'FILE_GROUP_SETTINGS',
                        FileGroupSettings: {
                            Destination: 's3://' + process.env.DESTINATION_BUCKET + '/transcoded/'
                        }
                    },
                    Outputs: [{
                        ContainerSettings: {
                            Container: 'MP4'
                        },
                        VideoDescription: {
                            CodecSettings: {
                                Codec: 'H_264',
                                H264Settings: {
                                    RateControlMode: 'QVBR',
                                    MaxBitrate: 5000000
                                }
                            }
                        },
                        AudioDescriptions: [{
                            CodecSettings: {
                                Codec: 'AAC',
                                AacSettings: {
                                    Bitrate: 128000,
                                    CodingMode: 'CODING_MODE_2_0',
                                    SampleRate: 48000
                                }
                            }
                        }]
                    }]
                }]
            }
        };

        try {
            const result = await mediaconvert.createJob(params).promise();
            console.log('MediaConvert job created: ' + result.Job.Id);
        } catch (error) {
            console.error('Error creating MediaConvert job:', error);
            throw error;
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'MediaConvert jobs triggered successfully' })
    };
};
