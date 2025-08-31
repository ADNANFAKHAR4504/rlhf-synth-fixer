package imports.aws.imagebuilder_distribution_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.356Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration.Jsii$Proxy.class)
public interface ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#disk_image_format ImagebuilderDistributionConfiguration#disk_image_format}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDiskImageFormat();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#role_name ImagebuilderDistributionConfiguration#role_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#s3_bucket ImagebuilderDistributionConfiguration#s3_bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Bucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#s3_prefix ImagebuilderDistributionConfiguration#s3_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Prefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration> {
        java.lang.String diskImageFormat;
        java.lang.String roleName;
        java.lang.String s3Bucket;
        java.lang.String s3Prefix;

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration#getDiskImageFormat}
         * @param diskImageFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#disk_image_format ImagebuilderDistributionConfiguration#disk_image_format}. This parameter is required.
         * @return {@code this}
         */
        public Builder diskImageFormat(java.lang.String diskImageFormat) {
            this.diskImageFormat = diskImageFormat;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration#getRoleName}
         * @param roleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#role_name ImagebuilderDistributionConfiguration#role_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleName(java.lang.String roleName) {
            this.roleName = roleName;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration#getS3Bucket}
         * @param s3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#s3_bucket ImagebuilderDistributionConfiguration#s3_bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Bucket(java.lang.String s3Bucket) {
            this.s3Bucket = s3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration#getS3Prefix}
         * @param s3Prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_distribution_configuration#s3_prefix ImagebuilderDistributionConfiguration#s3_prefix}.
         * @return {@code this}
         */
        public Builder s3Prefix(java.lang.String s3Prefix) {
            this.s3Prefix = s3Prefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration {
        private final java.lang.String diskImageFormat;
        private final java.lang.String roleName;
        private final java.lang.String s3Bucket;
        private final java.lang.String s3Prefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.diskImageFormat = software.amazon.jsii.Kernel.get(this, "diskImageFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleName = software.amazon.jsii.Kernel.get(this, "roleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Bucket = software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Prefix = software.amazon.jsii.Kernel.get(this, "s3Prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.diskImageFormat = java.util.Objects.requireNonNull(builder.diskImageFormat, "diskImageFormat is required");
            this.roleName = java.util.Objects.requireNonNull(builder.roleName, "roleName is required");
            this.s3Bucket = java.util.Objects.requireNonNull(builder.s3Bucket, "s3Bucket is required");
            this.s3Prefix = builder.s3Prefix;
        }

        @Override
        public final java.lang.String getDiskImageFormat() {
            return this.diskImageFormat;
        }

        @Override
        public final java.lang.String getRoleName() {
            return this.roleName;
        }

        @Override
        public final java.lang.String getS3Bucket() {
            return this.s3Bucket;
        }

        @Override
        public final java.lang.String getS3Prefix() {
            return this.s3Prefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("diskImageFormat", om.valueToTree(this.getDiskImageFormat()));
            data.set("roleName", om.valueToTree(this.getRoleName()));
            data.set("s3Bucket", om.valueToTree(this.getS3Bucket()));
            if (this.getS3Prefix() != null) {
                data.set("s3Prefix", om.valueToTree(this.getS3Prefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderDistributionConfiguration.ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration.Jsii$Proxy that = (ImagebuilderDistributionConfigurationDistributionS3ExportConfiguration.Jsii$Proxy) o;

            if (!diskImageFormat.equals(that.diskImageFormat)) return false;
            if (!roleName.equals(that.roleName)) return false;
            if (!s3Bucket.equals(that.s3Bucket)) return false;
            return this.s3Prefix != null ? this.s3Prefix.equals(that.s3Prefix) : that.s3Prefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.diskImageFormat.hashCode();
            result = 31 * result + (this.roleName.hashCode());
            result = 31 * result + (this.s3Bucket.hashCode());
            result = 31 * result + (this.s3Prefix != null ? this.s3Prefix.hashCode() : 0);
            return result;
        }
    }
}
