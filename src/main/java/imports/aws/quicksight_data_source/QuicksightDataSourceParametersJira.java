package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.115Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceParametersJira")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSourceParametersJira.Jsii$Proxy.class)
public interface QuicksightDataSourceParametersJira extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#site_base_url QuicksightDataSource#site_base_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSiteBaseUrl();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSourceParametersJira}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSourceParametersJira}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSourceParametersJira> {
        java.lang.String siteBaseUrl;

        /**
         * Sets the value of {@link QuicksightDataSourceParametersJira#getSiteBaseUrl}
         * @param siteBaseUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#site_base_url QuicksightDataSource#site_base_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder siteBaseUrl(java.lang.String siteBaseUrl) {
            this.siteBaseUrl = siteBaseUrl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSourceParametersJira}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSourceParametersJira build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSourceParametersJira}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSourceParametersJira {
        private final java.lang.String siteBaseUrl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.siteBaseUrl = software.amazon.jsii.Kernel.get(this, "siteBaseUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.siteBaseUrl = java.util.Objects.requireNonNull(builder.siteBaseUrl, "siteBaseUrl is required");
        }

        @Override
        public final java.lang.String getSiteBaseUrl() {
            return this.siteBaseUrl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("siteBaseUrl", om.valueToTree(this.getSiteBaseUrl()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSource.QuicksightDataSourceParametersJira"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSourceParametersJira.Jsii$Proxy that = (QuicksightDataSourceParametersJira.Jsii$Proxy) o;

            return this.siteBaseUrl.equals(that.siteBaseUrl);
        }

        @Override
        public final int hashCode() {
            int result = this.siteBaseUrl.hashCode();
            return result;
        }
    }
}
