package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.056Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceNetworkConfiguration")
@software.amazon.jsii.Jsii.Proxy(ApprunnerServiceNetworkConfiguration.Jsii$Proxy.class)
public interface ApprunnerServiceNetworkConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * egress_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#egress_configuration ApprunnerService#egress_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfiguration getEgressConfiguration() {
        return null;
    }

    /**
     * ingress_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#ingress_configuration ApprunnerService#ingress_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationIngressConfiguration getIngressConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#ip_address_type ApprunnerService#ip_address_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpAddressType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerServiceNetworkConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerServiceNetworkConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerServiceNetworkConfiguration> {
        imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfiguration egressConfiguration;
        imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationIngressConfiguration ingressConfiguration;
        java.lang.String ipAddressType;

        /**
         * Sets the value of {@link ApprunnerServiceNetworkConfiguration#getEgressConfiguration}
         * @param egressConfiguration egress_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#egress_configuration ApprunnerService#egress_configuration}
         * @return {@code this}
         */
        public Builder egressConfiguration(imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfiguration egressConfiguration) {
            this.egressConfiguration = egressConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceNetworkConfiguration#getIngressConfiguration}
         * @param ingressConfiguration ingress_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#ingress_configuration ApprunnerService#ingress_configuration}
         * @return {@code this}
         */
        public Builder ingressConfiguration(imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationIngressConfiguration ingressConfiguration) {
            this.ingressConfiguration = ingressConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceNetworkConfiguration#getIpAddressType}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#ip_address_type ApprunnerService#ip_address_type}.
         * @return {@code this}
         */
        public Builder ipAddressType(java.lang.String ipAddressType) {
            this.ipAddressType = ipAddressType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApprunnerServiceNetworkConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerServiceNetworkConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerServiceNetworkConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerServiceNetworkConfiguration {
        private final imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfiguration egressConfiguration;
        private final imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationIngressConfiguration ingressConfiguration;
        private final java.lang.String ipAddressType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.egressConfiguration = software.amazon.jsii.Kernel.get(this, "egressConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfiguration.class));
            this.ingressConfiguration = software.amazon.jsii.Kernel.get(this, "ingressConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationIngressConfiguration.class));
            this.ipAddressType = software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.egressConfiguration = builder.egressConfiguration;
            this.ingressConfiguration = builder.ingressConfiguration;
            this.ipAddressType = builder.ipAddressType;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfiguration getEgressConfiguration() {
            return this.egressConfiguration;
        }

        @Override
        public final imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationIngressConfiguration getIngressConfiguration() {
            return this.ingressConfiguration;
        }

        @Override
        public final java.lang.String getIpAddressType() {
            return this.ipAddressType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEgressConfiguration() != null) {
                data.set("egressConfiguration", om.valueToTree(this.getEgressConfiguration()));
            }
            if (this.getIngressConfiguration() != null) {
                data.set("ingressConfiguration", om.valueToTree(this.getIngressConfiguration()));
            }
            if (this.getIpAddressType() != null) {
                data.set("ipAddressType", om.valueToTree(this.getIpAddressType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apprunnerService.ApprunnerServiceNetworkConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerServiceNetworkConfiguration.Jsii$Proxy that = (ApprunnerServiceNetworkConfiguration.Jsii$Proxy) o;

            if (this.egressConfiguration != null ? !this.egressConfiguration.equals(that.egressConfiguration) : that.egressConfiguration != null) return false;
            if (this.ingressConfiguration != null ? !this.ingressConfiguration.equals(that.ingressConfiguration) : that.ingressConfiguration != null) return false;
            return this.ipAddressType != null ? this.ipAddressType.equals(that.ipAddressType) : that.ipAddressType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.egressConfiguration != null ? this.egressConfiguration.hashCode() : 0;
            result = 31 * result + (this.ingressConfiguration != null ? this.ingressConfiguration.hashCode() : 0);
            result = 31 * result + (this.ipAddressType != null ? this.ipAddressType.hashCode() : 0);
            return result;
        }
    }
}
