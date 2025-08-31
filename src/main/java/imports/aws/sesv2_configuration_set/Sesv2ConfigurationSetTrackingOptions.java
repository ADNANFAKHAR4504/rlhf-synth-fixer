package imports.aws.sesv2_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSetTrackingOptions")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetTrackingOptions.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetTrackingOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#custom_redirect_domain Sesv2ConfigurationSet#custom_redirect_domain}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCustomRedirectDomain();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#https_policy Sesv2ConfigurationSet#https_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHttpsPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetTrackingOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetTrackingOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetTrackingOptions> {
        java.lang.String customRedirectDomain;
        java.lang.String httpsPolicy;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetTrackingOptions#getCustomRedirectDomain}
         * @param customRedirectDomain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#custom_redirect_domain Sesv2ConfigurationSet#custom_redirect_domain}. This parameter is required.
         * @return {@code this}
         */
        public Builder customRedirectDomain(java.lang.String customRedirectDomain) {
            this.customRedirectDomain = customRedirectDomain;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetTrackingOptions#getHttpsPolicy}
         * @param httpsPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#https_policy Sesv2ConfigurationSet#https_policy}.
         * @return {@code this}
         */
        public Builder httpsPolicy(java.lang.String httpsPolicy) {
            this.httpsPolicy = httpsPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ConfigurationSetTrackingOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetTrackingOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetTrackingOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetTrackingOptions {
        private final java.lang.String customRedirectDomain;
        private final java.lang.String httpsPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customRedirectDomain = software.amazon.jsii.Kernel.get(this, "customRedirectDomain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.httpsPolicy = software.amazon.jsii.Kernel.get(this, "httpsPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customRedirectDomain = java.util.Objects.requireNonNull(builder.customRedirectDomain, "customRedirectDomain is required");
            this.httpsPolicy = builder.httpsPolicy;
        }

        @Override
        public final java.lang.String getCustomRedirectDomain() {
            return this.customRedirectDomain;
        }

        @Override
        public final java.lang.String getHttpsPolicy() {
            return this.httpsPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("customRedirectDomain", om.valueToTree(this.getCustomRedirectDomain()));
            if (this.getHttpsPolicy() != null) {
                data.set("httpsPolicy", om.valueToTree(this.getHttpsPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSet.Sesv2ConfigurationSetTrackingOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetTrackingOptions.Jsii$Proxy that = (Sesv2ConfigurationSetTrackingOptions.Jsii$Proxy) o;

            if (!customRedirectDomain.equals(that.customRedirectDomain)) return false;
            return this.httpsPolicy != null ? this.httpsPolicy.equals(that.httpsPolicy) : that.httpsPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customRedirectDomain.hashCode();
            result = 31 * result + (this.httpsPolicy != null ? this.httpsPolicy.hashCode() : 0);
            return result;
        }
    }
}
