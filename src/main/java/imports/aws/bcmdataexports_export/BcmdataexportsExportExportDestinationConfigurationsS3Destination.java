package imports.aws.bcmdataexports_export;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.138Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bcmdataexportsExport.BcmdataexportsExportExportDestinationConfigurationsS3Destination")
@software.amazon.jsii.Jsii.Proxy(BcmdataexportsExportExportDestinationConfigurationsS3Destination.Jsii$Proxy.class)
public interface BcmdataexportsExportExportDestinationConfigurationsS3Destination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#s3_bucket BcmdataexportsExport#s3_bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Bucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#s3_prefix BcmdataexportsExport#s3_prefix}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Prefix();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#s3_region BcmdataexportsExport#s3_region}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Region();

    /**
     * s3_output_configurations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#s3_output_configurations BcmdataexportsExport#s3_output_configurations}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getS3OutputConfigurations() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BcmdataexportsExportExportDestinationConfigurationsS3Destination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BcmdataexportsExportExportDestinationConfigurationsS3Destination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BcmdataexportsExportExportDestinationConfigurationsS3Destination> {
        java.lang.String s3Bucket;
        java.lang.String s3Prefix;
        java.lang.String s3Region;
        java.lang.Object s3OutputConfigurations;

        /**
         * Sets the value of {@link BcmdataexportsExportExportDestinationConfigurationsS3Destination#getS3Bucket}
         * @param s3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#s3_bucket BcmdataexportsExport#s3_bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Bucket(java.lang.String s3Bucket) {
            this.s3Bucket = s3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExportDestinationConfigurationsS3Destination#getS3Prefix}
         * @param s3Prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#s3_prefix BcmdataexportsExport#s3_prefix}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Prefix(java.lang.String s3Prefix) {
            this.s3Prefix = s3Prefix;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExportDestinationConfigurationsS3Destination#getS3Region}
         * @param s3Region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#s3_region BcmdataexportsExport#s3_region}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Region(java.lang.String s3Region) {
            this.s3Region = s3Region;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExportDestinationConfigurationsS3Destination#getS3OutputConfigurations}
         * @param s3OutputConfigurations s3_output_configurations block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#s3_output_configurations BcmdataexportsExport#s3_output_configurations}
         * @return {@code this}
         */
        public Builder s3OutputConfigurations(com.hashicorp.cdktf.IResolvable s3OutputConfigurations) {
            this.s3OutputConfigurations = s3OutputConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExportDestinationConfigurationsS3Destination#getS3OutputConfigurations}
         * @param s3OutputConfigurations s3_output_configurations block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#s3_output_configurations BcmdataexportsExport#s3_output_configurations}
         * @return {@code this}
         */
        public Builder s3OutputConfigurations(java.util.List<? extends imports.aws.bcmdataexports_export.BcmdataexportsExportExportDestinationConfigurationsS3DestinationS3OutputConfigurations> s3OutputConfigurations) {
            this.s3OutputConfigurations = s3OutputConfigurations;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BcmdataexportsExportExportDestinationConfigurationsS3Destination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BcmdataexportsExportExportDestinationConfigurationsS3Destination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BcmdataexportsExportExportDestinationConfigurationsS3Destination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BcmdataexportsExportExportDestinationConfigurationsS3Destination {
        private final java.lang.String s3Bucket;
        private final java.lang.String s3Prefix;
        private final java.lang.String s3Region;
        private final java.lang.Object s3OutputConfigurations;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Bucket = software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Prefix = software.amazon.jsii.Kernel.get(this, "s3Prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Region = software.amazon.jsii.Kernel.get(this, "s3Region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3OutputConfigurations = software.amazon.jsii.Kernel.get(this, "s3OutputConfigurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Bucket = java.util.Objects.requireNonNull(builder.s3Bucket, "s3Bucket is required");
            this.s3Prefix = java.util.Objects.requireNonNull(builder.s3Prefix, "s3Prefix is required");
            this.s3Region = java.util.Objects.requireNonNull(builder.s3Region, "s3Region is required");
            this.s3OutputConfigurations = builder.s3OutputConfigurations;
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
        public final java.lang.String getS3Region() {
            return this.s3Region;
        }

        @Override
        public final java.lang.Object getS3OutputConfigurations() {
            return this.s3OutputConfigurations;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3Bucket", om.valueToTree(this.getS3Bucket()));
            data.set("s3Prefix", om.valueToTree(this.getS3Prefix()));
            data.set("s3Region", om.valueToTree(this.getS3Region()));
            if (this.getS3OutputConfigurations() != null) {
                data.set("s3OutputConfigurations", om.valueToTree(this.getS3OutputConfigurations()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bcmdataexportsExport.BcmdataexportsExportExportDestinationConfigurationsS3Destination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BcmdataexportsExportExportDestinationConfigurationsS3Destination.Jsii$Proxy that = (BcmdataexportsExportExportDestinationConfigurationsS3Destination.Jsii$Proxy) o;

            if (!s3Bucket.equals(that.s3Bucket)) return false;
            if (!s3Prefix.equals(that.s3Prefix)) return false;
            if (!s3Region.equals(that.s3Region)) return false;
            return this.s3OutputConfigurations != null ? this.s3OutputConfigurations.equals(that.s3OutputConfigurations) : that.s3OutputConfigurations == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Bucket.hashCode();
            result = 31 * result + (this.s3Prefix.hashCode());
            result = 31 * result + (this.s3Region.hashCode());
            result = 31 * result + (this.s3OutputConfigurations != null ? this.s3OutputConfigurations.hashCode() : 0);
            return result;
        }
    }
}
