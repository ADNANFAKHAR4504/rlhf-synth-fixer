package imports.aws.apigatewayv2_domain_name;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.969Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2DomainName.Apigatewayv2DomainNameMutualTlsAuthentication")
@software.amazon.jsii.Jsii.Proxy(Apigatewayv2DomainNameMutualTlsAuthentication.Jsii$Proxy.class)
public interface Apigatewayv2DomainNameMutualTlsAuthentication extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#truststore_uri Apigatewayv2DomainName#truststore_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTruststoreUri();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#truststore_version Apigatewayv2DomainName#truststore_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTruststoreVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Apigatewayv2DomainNameMutualTlsAuthentication}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Apigatewayv2DomainNameMutualTlsAuthentication}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Apigatewayv2DomainNameMutualTlsAuthentication> {
        java.lang.String truststoreUri;
        java.lang.String truststoreVersion;

        /**
         * Sets the value of {@link Apigatewayv2DomainNameMutualTlsAuthentication#getTruststoreUri}
         * @param truststoreUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#truststore_uri Apigatewayv2DomainName#truststore_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder truststoreUri(java.lang.String truststoreUri) {
            this.truststoreUri = truststoreUri;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2DomainNameMutualTlsAuthentication#getTruststoreVersion}
         * @param truststoreVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_domain_name#truststore_version Apigatewayv2DomainName#truststore_version}.
         * @return {@code this}
         */
        public Builder truststoreVersion(java.lang.String truststoreVersion) {
            this.truststoreVersion = truststoreVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Apigatewayv2DomainNameMutualTlsAuthentication}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Apigatewayv2DomainNameMutualTlsAuthentication build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Apigatewayv2DomainNameMutualTlsAuthentication}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Apigatewayv2DomainNameMutualTlsAuthentication {
        private final java.lang.String truststoreUri;
        private final java.lang.String truststoreVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.truststoreUri = software.amazon.jsii.Kernel.get(this, "truststoreUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.truststoreVersion = software.amazon.jsii.Kernel.get(this, "truststoreVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.truststoreUri = java.util.Objects.requireNonNull(builder.truststoreUri, "truststoreUri is required");
            this.truststoreVersion = builder.truststoreVersion;
        }

        @Override
        public final java.lang.String getTruststoreUri() {
            return this.truststoreUri;
        }

        @Override
        public final java.lang.String getTruststoreVersion() {
            return this.truststoreVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("truststoreUri", om.valueToTree(this.getTruststoreUri()));
            if (this.getTruststoreVersion() != null) {
                data.set("truststoreVersion", om.valueToTree(this.getTruststoreVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apigatewayv2DomainName.Apigatewayv2DomainNameMutualTlsAuthentication"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Apigatewayv2DomainNameMutualTlsAuthentication.Jsii$Proxy that = (Apigatewayv2DomainNameMutualTlsAuthentication.Jsii$Proxy) o;

            if (!truststoreUri.equals(that.truststoreUri)) return false;
            return this.truststoreVersion != null ? this.truststoreVersion.equals(that.truststoreVersion) : that.truststoreVersion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.truststoreUri.hashCode();
            result = 31 * result + (this.truststoreVersion != null ? this.truststoreVersion.hashCode() : 0);
            return result;
        }
    }
}
