package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.056Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceNetworkConfigurationEgressConfiguration")
@software.amazon.jsii.Jsii.Proxy(ApprunnerServiceNetworkConfigurationEgressConfiguration.Jsii$Proxy.class)
public interface ApprunnerServiceNetworkConfigurationEgressConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#egress_type ApprunnerService#egress_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEgressType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#vpc_connector_arn ApprunnerService#vpc_connector_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcConnectorArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerServiceNetworkConfigurationEgressConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerServiceNetworkConfigurationEgressConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerServiceNetworkConfigurationEgressConfiguration> {
        java.lang.String egressType;
        java.lang.String vpcConnectorArn;

        /**
         * Sets the value of {@link ApprunnerServiceNetworkConfigurationEgressConfiguration#getEgressType}
         * @param egressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#egress_type ApprunnerService#egress_type}.
         * @return {@code this}
         */
        public Builder egressType(java.lang.String egressType) {
            this.egressType = egressType;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceNetworkConfigurationEgressConfiguration#getVpcConnectorArn}
         * @param vpcConnectorArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#vpc_connector_arn ApprunnerService#vpc_connector_arn}.
         * @return {@code this}
         */
        public Builder vpcConnectorArn(java.lang.String vpcConnectorArn) {
            this.vpcConnectorArn = vpcConnectorArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApprunnerServiceNetworkConfigurationEgressConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerServiceNetworkConfigurationEgressConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerServiceNetworkConfigurationEgressConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerServiceNetworkConfigurationEgressConfiguration {
        private final java.lang.String egressType;
        private final java.lang.String vpcConnectorArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.egressType = software.amazon.jsii.Kernel.get(this, "egressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcConnectorArn = software.amazon.jsii.Kernel.get(this, "vpcConnectorArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.egressType = builder.egressType;
            this.vpcConnectorArn = builder.vpcConnectorArn;
        }

        @Override
        public final java.lang.String getEgressType() {
            return this.egressType;
        }

        @Override
        public final java.lang.String getVpcConnectorArn() {
            return this.vpcConnectorArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEgressType() != null) {
                data.set("egressType", om.valueToTree(this.getEgressType()));
            }
            if (this.getVpcConnectorArn() != null) {
                data.set("vpcConnectorArn", om.valueToTree(this.getVpcConnectorArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apprunnerService.ApprunnerServiceNetworkConfigurationEgressConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerServiceNetworkConfigurationEgressConfiguration.Jsii$Proxy that = (ApprunnerServiceNetworkConfigurationEgressConfiguration.Jsii$Proxy) o;

            if (this.egressType != null ? !this.egressType.equals(that.egressType) : that.egressType != null) return false;
            return this.vpcConnectorArn != null ? this.vpcConnectorArn.equals(that.vpcConnectorArn) : that.vpcConnectorArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.egressType != null ? this.egressType.hashCode() : 0;
            result = 31 * result + (this.vpcConnectorArn != null ? this.vpcConnectorArn.hashCode() : 0);
            return result;
        }
    }
}
