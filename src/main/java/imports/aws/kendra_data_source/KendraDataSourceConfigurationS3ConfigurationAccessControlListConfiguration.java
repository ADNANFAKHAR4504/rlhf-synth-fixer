package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration.Jsii$Proxy.class)
public interface KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#key_path KendraDataSource#key_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyPath() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration> {
        java.lang.String keyPath;

        /**
         * Sets the value of {@link KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration#getKeyPath}
         * @param keyPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#key_path KendraDataSource#key_path}.
         * @return {@code this}
         */
        public Builder keyPath(java.lang.String keyPath) {
            this.keyPath = keyPath;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration {
        private final java.lang.String keyPath;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.keyPath = software.amazon.jsii.Kernel.get(this, "keyPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.keyPath = builder.keyPath;
        }

        @Override
        public final java.lang.String getKeyPath() {
            return this.keyPath;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getKeyPath() != null) {
                data.set("keyPath", om.valueToTree(this.getKeyPath()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration.Jsii$Proxy that = (KendraDataSourceConfigurationS3ConfigurationAccessControlListConfiguration.Jsii$Proxy) o;

            return this.keyPath != null ? this.keyPath.equals(that.keyPath) : that.keyPath == null;
        }

        @Override
        public final int hashCode() {
            int result = this.keyPath != null ? this.keyPath.hashCode() : 0;
            return result;
        }
    }
}
