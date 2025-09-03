package stack

import (
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/acm"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/cloudfront"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createCloudFront(ctx *pulumi.Context, usEast1Provider pulumi.ProviderResource, primaryBucket pulumi.StringOutput, projectName, environment string, tags pulumi.StringMap, isPREnv bool) (pulumi.StringOutput, error) {
	oac, err := cloudfront.NewOriginAccessControl(ctx, "s3-oac", &cloudfront.OriginAccessControlArgs{Name: pulumi.Sprintf("%s-%s-oac", projectName, environment), Description: pulumi.String("OAC for S3 bucket"), OriginAccessControlOriginType: pulumi.String("s3"), SigningBehavior: pulumi.String("always"), SigningProtocol: pulumi.String("sigv4")}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return pulumi.StringOutput{}, err
	}

	if isPREnv {
		// Use default CloudFront certificate; avoid ACM in PR envs.
		distribution, err := cloudfront.NewDistribution(ctx, "cloudfront", &cloudfront.DistributionArgs{
			Origins:              cloudfront.DistributionOriginArray{&cloudfront.DistributionOriginArgs{DomainName: pulumi.All(primaryBucket).ApplyT(func(args []interface{}) string { return args[0].(string) + ".s3.amazonaws.com" }).(pulumi.StringOutput), OriginId: pulumi.String("S3-primary"), OriginAccessControlId: oac.ID()}},
			Enabled:              pulumi.Bool(true),
			DefaultRootObject:    pulumi.String("index.html"),
			DefaultCacheBehavior: &cloudfront.DistributionDefaultCacheBehaviorArgs{TargetOriginId: pulumi.String("S3-primary"), ViewerProtocolPolicy: pulumi.String("redirect-to-https"), AllowedMethods: pulumi.StringArray{pulumi.String("DELETE"), pulumi.String("GET"), pulumi.String("HEAD"), pulumi.String("OPTIONS"), pulumi.String("PATCH"), pulumi.String("POST"), pulumi.String("PUT")}, CachedMethods: pulumi.StringArray{pulumi.String("GET"), pulumi.String("HEAD")}, Compress: pulumi.Bool(true), ForwardedValues: &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs{QueryString: pulumi.Bool(false), Cookies: &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs{Forward: pulumi.String("none")}}},
			PriceClass:           pulumi.String("PriceClass_100"),
			Restrictions:         &cloudfront.DistributionRestrictionsArgs{GeoRestriction: &cloudfront.DistributionRestrictionsGeoRestrictionArgs{RestrictionType: pulumi.String("none")}},
			ViewerCertificate:    &cloudfront.DistributionViewerCertificateArgs{CloudfrontDefaultCertificate: pulumi.Bool(true)},
			Tags:                 tags,
		}, pulumi.Provider(usEast1Provider))
		if err != nil {
			return pulumi.StringOutput{}, err
		}
		return distribution.DomainName, nil
	}

	cert, err := acm.NewCertificate(ctx, "cloudfront-cert", &acm.CertificateArgs{DomainName: pulumi.Sprintf("%s.example.com", projectName), ValidationMethod: pulumi.String("DNS"), Tags: tags}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return pulumi.StringOutput{}, err
	}
	distribution, err := cloudfront.NewDistribution(ctx, "cloudfront", &cloudfront.DistributionArgs{
		Origins:              cloudfront.DistributionOriginArray{&cloudfront.DistributionOriginArgs{DomainName: pulumi.All(primaryBucket).ApplyT(func(args []interface{}) string { return args[0].(string) + ".s3.amazonaws.com" }).(pulumi.StringOutput), OriginId: pulumi.String("S3-primary"), OriginAccessControlId: oac.ID()}},
		Enabled:              pulumi.Bool(true),
		DefaultRootObject:    pulumi.String("index.html"),
		DefaultCacheBehavior: &cloudfront.DistributionDefaultCacheBehaviorArgs{TargetOriginId: pulumi.String("S3-primary"), ViewerProtocolPolicy: pulumi.String("redirect-to-https"), AllowedMethods: pulumi.StringArray{pulumi.String("DELETE"), pulumi.String("GET"), pulumi.String("HEAD"), pulumi.String("OPTIONS"), pulumi.String("PATCH"), pulumi.String("POST"), pulumi.String("PUT")}, CachedMethods: pulumi.StringArray{pulumi.String("GET"), pulumi.String("HEAD")}, Compress: pulumi.Bool(true), ForwardedValues: &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs{QueryString: pulumi.Bool(false), Cookies: &cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs{Forward: pulumi.String("none")}}},
		PriceClass:           pulumi.String("PriceClass_100"),
		Restrictions:         &cloudfront.DistributionRestrictionsArgs{GeoRestriction: &cloudfront.DistributionRestrictionsGeoRestrictionArgs{RestrictionType: pulumi.String("none")}},
		ViewerCertificate:    &cloudfront.DistributionViewerCertificateArgs{AcmCertificateArn: cert.Arn, SslSupportMethod: pulumi.String("sni-only"), MinimumProtocolVersion: pulumi.String("TLSv1.2_2021")},
		Tags:                 tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return pulumi.StringOutput{}, err
	}
	return distribution.DomainName, nil
}
