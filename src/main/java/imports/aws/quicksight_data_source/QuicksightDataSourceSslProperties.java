package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.116Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceSslProperties")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSourceSslProperties.Jsii$Proxy.class)
public interface QuicksightDataSourceSslProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#disable_ssl QuicksightDataSource#disable_ssl}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getDisableSsl();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSourceSslProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSourceSslProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSourceSslProperties> {
        java.lang.Object disableSsl;

        /**
         * Sets the value of {@link QuicksightDataSourceSslProperties#getDisableSsl}
         * @param disableSsl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#disable_ssl QuicksightDataSource#disable_ssl}. This parameter is required.
         * @return {@code this}
         */
        public Builder disableSsl(java.lang.Boolean disableSsl) {
            this.disableSsl = disableSsl;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceSslProperties#getDisableSsl}
         * @param disableSsl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#disable_ssl QuicksightDataSource#disable_ssl}. This parameter is required.
         * @return {@code this}
         */
        public Builder disableSsl(com.hashicorp.cdktf.IResolvable disableSsl) {
            this.disableSsl = disableSsl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSourceSslProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSourceSslProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSourceSslProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSourceSslProperties {
        private final java.lang.Object disableSsl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.disableSsl = software.amazon.jsii.Kernel.get(this, "disableSsl", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.disableSsl = java.util.Objects.requireNonNull(builder.disableSsl, "disableSsl is required");
        }

        @Override
        public final java.lang.Object getDisableSsl() {
            return this.disableSsl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("disableSsl", om.valueToTree(this.getDisableSsl()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSource.QuicksightDataSourceSslProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSourceSslProperties.Jsii$Proxy that = (QuicksightDataSourceSslProperties.Jsii$Proxy) o;

            return this.disableSsl.equals(that.disableSsl);
        }

        @Override
        public final int hashCode() {
            int result = this.disableSsl.hashCode();
            return result;
        }
    }
}
