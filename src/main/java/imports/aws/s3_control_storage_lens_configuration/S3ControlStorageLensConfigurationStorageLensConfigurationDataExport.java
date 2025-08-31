package imports.aws.s3_control_storage_lens_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.286Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExport")
@software.amazon.jsii.Jsii.Proxy(S3ControlStorageLensConfigurationStorageLensConfigurationDataExport.Jsii$Proxy.class)
public interface S3ControlStorageLensConfigurationStorageLensConfigurationDataExport extends software.amazon.jsii.JsiiSerializable {

    /**
     * cloud_watch_metrics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#cloud_watch_metrics S3ControlStorageLensConfiguration#cloud_watch_metrics}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportCloudWatchMetrics getCloudWatchMetrics() {
        return null;
    }

    /**
     * s3_bucket_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#s3_bucket_destination S3ControlStorageLensConfiguration#s3_bucket_destination}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestination getS3BucketDestination() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlStorageLensConfigurationStorageLensConfigurationDataExport}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlStorageLensConfigurationStorageLensConfigurationDataExport}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlStorageLensConfigurationStorageLensConfigurationDataExport> {
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportCloudWatchMetrics cloudWatchMetrics;
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestination s3BucketDestination;

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationDataExport#getCloudWatchMetrics}
         * @param cloudWatchMetrics cloud_watch_metrics block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#cloud_watch_metrics S3ControlStorageLensConfiguration#cloud_watch_metrics}
         * @return {@code this}
         */
        public Builder cloudWatchMetrics(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportCloudWatchMetrics cloudWatchMetrics) {
            this.cloudWatchMetrics = cloudWatchMetrics;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationDataExport#getS3BucketDestination}
         * @param s3BucketDestination s3_bucket_destination block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#s3_bucket_destination S3ControlStorageLensConfiguration#s3_bucket_destination}
         * @return {@code this}
         */
        public Builder s3BucketDestination(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestination s3BucketDestination) {
            this.s3BucketDestination = s3BucketDestination;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlStorageLensConfigurationStorageLensConfigurationDataExport}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlStorageLensConfigurationStorageLensConfigurationDataExport build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlStorageLensConfigurationStorageLensConfigurationDataExport}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlStorageLensConfigurationStorageLensConfigurationDataExport {
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportCloudWatchMetrics cloudWatchMetrics;
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestination s3BucketDestination;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudWatchMetrics = software.amazon.jsii.Kernel.get(this, "cloudWatchMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportCloudWatchMetrics.class));
            this.s3BucketDestination = software.amazon.jsii.Kernel.get(this, "s3BucketDestination", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestination.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudWatchMetrics = builder.cloudWatchMetrics;
            this.s3BucketDestination = builder.s3BucketDestination;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportCloudWatchMetrics getCloudWatchMetrics() {
            return this.cloudWatchMetrics;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExportS3BucketDestination getS3BucketDestination() {
            return this.s3BucketDestination;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudWatchMetrics() != null) {
                data.set("cloudWatchMetrics", om.valueToTree(this.getCloudWatchMetrics()));
            }
            if (this.getS3BucketDestination() != null) {
                data.set("s3BucketDestination", om.valueToTree(this.getS3BucketDestination()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfigurationDataExport"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlStorageLensConfigurationStorageLensConfigurationDataExport.Jsii$Proxy that = (S3ControlStorageLensConfigurationStorageLensConfigurationDataExport.Jsii$Proxy) o;

            if (this.cloudWatchMetrics != null ? !this.cloudWatchMetrics.equals(that.cloudWatchMetrics) : that.cloudWatchMetrics != null) return false;
            return this.s3BucketDestination != null ? this.s3BucketDestination.equals(that.s3BucketDestination) : that.s3BucketDestination == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudWatchMetrics != null ? this.cloudWatchMetrics.hashCode() : 0;
            result = 31 * result + (this.s3BucketDestination != null ? this.s3BucketDestination.hashCode() : 0);
            return result;
        }
    }
}
