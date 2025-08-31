package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration.Jsii$Proxy.class)
public interface KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#s3_prefix KendraDataSource#s3_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3Prefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration> {
        java.lang.String s3Prefix;

        /**
         * Sets the value of {@link KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration#getS3Prefix}
         * @param s3Prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#s3_prefix KendraDataSource#s3_prefix}.
         * @return {@code this}
         */
        public Builder s3Prefix(java.lang.String s3Prefix) {
            this.s3Prefix = s3Prefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration {
        private final java.lang.String s3Prefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Prefix = software.amazon.jsii.Kernel.get(this, "s3Prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Prefix = builder.s3Prefix;
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

            if (this.getS3Prefix() != null) {
                data.set("s3Prefix", om.valueToTree(this.getS3Prefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration.Jsii$Proxy that = (KendraDataSourceConfigurationS3ConfigurationDocumentsMetadataConfiguration.Jsii$Proxy) o;

            return this.s3Prefix != null ? this.s3Prefix.equals(that.s3Prefix) : that.s3Prefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Prefix != null ? this.s3Prefix.hashCode() : 0;
            return result;
        }
    }
}
