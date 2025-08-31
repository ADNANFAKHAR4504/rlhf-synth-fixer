package imports.aws.s3_bucket_analytics_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.250Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketAnalyticsConfiguration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination")
@software.amazon.jsii.Jsii.Proxy(S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination.Jsii$Proxy.class)
public interface S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_analytics_configuration#bucket_arn S3BucketAnalyticsConfiguration#bucket_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_analytics_configuration#bucket_account_id S3BucketAnalyticsConfiguration#bucket_account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketAccountId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_analytics_configuration#format S3BucketAnalyticsConfiguration#format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFormat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_analytics_configuration#prefix S3BucketAnalyticsConfiguration#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination> {
        java.lang.String bucketArn;
        java.lang.String bucketAccountId;
        java.lang.String format;
        java.lang.String prefix;

        /**
         * Sets the value of {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination#getBucketArn}
         * @param bucketArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_analytics_configuration#bucket_arn S3BucketAnalyticsConfiguration#bucket_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketArn(java.lang.String bucketArn) {
            this.bucketArn = bucketArn;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination#getBucketAccountId}
         * @param bucketAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_analytics_configuration#bucket_account_id S3BucketAnalyticsConfiguration#bucket_account_id}.
         * @return {@code this}
         */
        public Builder bucketAccountId(java.lang.String bucketAccountId) {
            this.bucketAccountId = bucketAccountId;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination#getFormat}
         * @param format Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_analytics_configuration#format S3BucketAnalyticsConfiguration#format}.
         * @return {@code this}
         */
        public Builder format(java.lang.String format) {
            this.format = format;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_analytics_configuration#prefix S3BucketAnalyticsConfiguration#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination {
        private final java.lang.String bucketArn;
        private final java.lang.String bucketAccountId;
        private final java.lang.String format;
        private final java.lang.String prefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketArn = software.amazon.jsii.Kernel.get(this, "bucketArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketAccountId = software.amazon.jsii.Kernel.get(this, "bucketAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.format = software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketArn = java.util.Objects.requireNonNull(builder.bucketArn, "bucketArn is required");
            this.bucketAccountId = builder.bucketAccountId;
            this.format = builder.format;
            this.prefix = builder.prefix;
        }

        @Override
        public final java.lang.String getBucketArn() {
            return this.bucketArn;
        }

        @Override
        public final java.lang.String getBucketAccountId() {
            return this.bucketAccountId;
        }

        @Override
        public final java.lang.String getFormat() {
            return this.format;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketArn", om.valueToTree(this.getBucketArn()));
            if (this.getBucketAccountId() != null) {
                data.set("bucketAccountId", om.valueToTree(this.getBucketAccountId()));
            }
            if (this.getFormat() != null) {
                data.set("format", om.valueToTree(this.getFormat()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketAnalyticsConfiguration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination.Jsii$Proxy that = (S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestinationS3BucketDestination.Jsii$Proxy) o;

            if (!bucketArn.equals(that.bucketArn)) return false;
            if (this.bucketAccountId != null ? !this.bucketAccountId.equals(that.bucketAccountId) : that.bucketAccountId != null) return false;
            if (this.format != null ? !this.format.equals(that.format) : that.format != null) return false;
            return this.prefix != null ? this.prefix.equals(that.prefix) : that.prefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketArn.hashCode();
            result = 31 * result + (this.bucketAccountId != null ? this.bucketAccountId.hashCode() : 0);
            result = 31 * result + (this.format != null ? this.format.hashCode() : 0);
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            return result;
        }
    }
}
