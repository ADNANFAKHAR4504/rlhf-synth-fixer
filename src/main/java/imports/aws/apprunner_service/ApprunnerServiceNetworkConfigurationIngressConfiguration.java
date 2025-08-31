package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.056Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceNetworkConfigurationIngressConfiguration")
@software.amazon.jsii.Jsii.Proxy(ApprunnerServiceNetworkConfigurationIngressConfiguration.Jsii$Proxy.class)
public interface ApprunnerServiceNetworkConfigurationIngressConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#is_publicly_accessible ApprunnerService#is_publicly_accessible}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIsPubliclyAccessible() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerServiceNetworkConfigurationIngressConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerServiceNetworkConfigurationIngressConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerServiceNetworkConfigurationIngressConfiguration> {
        java.lang.Object isPubliclyAccessible;

        /**
         * Sets the value of {@link ApprunnerServiceNetworkConfigurationIngressConfiguration#getIsPubliclyAccessible}
         * @param isPubliclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#is_publicly_accessible ApprunnerService#is_publicly_accessible}.
         * @return {@code this}
         */
        public Builder isPubliclyAccessible(java.lang.Boolean isPubliclyAccessible) {
            this.isPubliclyAccessible = isPubliclyAccessible;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceNetworkConfigurationIngressConfiguration#getIsPubliclyAccessible}
         * @param isPubliclyAccessible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#is_publicly_accessible ApprunnerService#is_publicly_accessible}.
         * @return {@code this}
         */
        public Builder isPubliclyAccessible(com.hashicorp.cdktf.IResolvable isPubliclyAccessible) {
            this.isPubliclyAccessible = isPubliclyAccessible;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApprunnerServiceNetworkConfigurationIngressConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerServiceNetworkConfigurationIngressConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerServiceNetworkConfigurationIngressConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerServiceNetworkConfigurationIngressConfiguration {
        private final java.lang.Object isPubliclyAccessible;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.isPubliclyAccessible = software.amazon.jsii.Kernel.get(this, "isPubliclyAccessible", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.isPubliclyAccessible = builder.isPubliclyAccessible;
        }

        @Override
        public final java.lang.Object getIsPubliclyAccessible() {
            return this.isPubliclyAccessible;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIsPubliclyAccessible() != null) {
                data.set("isPubliclyAccessible", om.valueToTree(this.getIsPubliclyAccessible()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apprunnerService.ApprunnerServiceNetworkConfigurationIngressConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerServiceNetworkConfigurationIngressConfiguration.Jsii$Proxy that = (ApprunnerServiceNetworkConfigurationIngressConfiguration.Jsii$Proxy) o;

            return this.isPubliclyAccessible != null ? this.isPubliclyAccessible.equals(that.isPubliclyAccessible) : that.isPubliclyAccessible == null;
        }

        @Override
        public final int hashCode() {
            int result = this.isPubliclyAccessible != null ? this.isPubliclyAccessible.hashCode() : 0;
            return result;
        }
    }
}
