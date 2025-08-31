package imports.aws.fms_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.237Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fmsPolicy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy")
@software.amazon.jsii.Jsii.Proxy(FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy.Jsii$Proxy.class)
public interface FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#firewall_deployment_model FmsPolicy#firewall_deployment_model}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFirewallDeploymentModel() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy> {
        java.lang.String firewallDeploymentModel;

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy#getFirewallDeploymentModel}
         * @param firewallDeploymentModel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#firewall_deployment_model FmsPolicy#firewall_deployment_model}.
         * @return {@code this}
         */
        public Builder firewallDeploymentModel(java.lang.String firewallDeploymentModel) {
            this.firewallDeploymentModel = firewallDeploymentModel;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy {
        private final java.lang.String firewallDeploymentModel;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.firewallDeploymentModel = software.amazon.jsii.Kernel.get(this, "firewallDeploymentModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.firewallDeploymentModel = builder.firewallDeploymentModel;
        }

        @Override
        public final java.lang.String getFirewallDeploymentModel() {
            return this.firewallDeploymentModel;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFirewallDeploymentModel() != null) {
                data.set("firewallDeploymentModel", om.valueToTree(this.getFirewallDeploymentModel()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fmsPolicy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy.Jsii$Proxy that = (FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy.Jsii$Proxy) o;

            return this.firewallDeploymentModel != null ? this.firewallDeploymentModel.equals(that.firewallDeploymentModel) : that.firewallDeploymentModel == null;
        }

        @Override
        public final int hashCode() {
            int result = this.firewallDeploymentModel != null ? this.firewallDeploymentModel.hashCode() : 0;
            return result;
        }
    }
}
