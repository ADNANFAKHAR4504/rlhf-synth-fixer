package imports.aws.fms_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.235Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fmsPolicy.FmsPolicySecurityServicePolicyDataPolicyOption")
@software.amazon.jsii.Jsii.Proxy(FmsPolicySecurityServicePolicyDataPolicyOption.Jsii$Proxy.class)
public interface FmsPolicySecurityServicePolicyDataPolicyOption extends software.amazon.jsii.JsiiSerializable {

    /**
     * network_acl_common_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#network_acl_common_policy FmsPolicy#network_acl_common_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy getNetworkAclCommonPolicy() {
        return null;
    }

    /**
     * network_firewall_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#network_firewall_policy FmsPolicy#network_firewall_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkFirewallPolicy getNetworkFirewallPolicy() {
        return null;
    }

    /**
     * third_party_firewall_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#third_party_firewall_policy FmsPolicy#third_party_firewall_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy getThirdPartyFirewallPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FmsPolicySecurityServicePolicyDataPolicyOption}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FmsPolicySecurityServicePolicyDataPolicyOption}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FmsPolicySecurityServicePolicyDataPolicyOption> {
        imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy networkAclCommonPolicy;
        imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkFirewallPolicy networkFirewallPolicy;
        imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy thirdPartyFirewallPolicy;

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOption#getNetworkAclCommonPolicy}
         * @param networkAclCommonPolicy network_acl_common_policy block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#network_acl_common_policy FmsPolicy#network_acl_common_policy}
         * @return {@code this}
         */
        public Builder networkAclCommonPolicy(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy networkAclCommonPolicy) {
            this.networkAclCommonPolicy = networkAclCommonPolicy;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOption#getNetworkFirewallPolicy}
         * @param networkFirewallPolicy network_firewall_policy block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#network_firewall_policy FmsPolicy#network_firewall_policy}
         * @return {@code this}
         */
        public Builder networkFirewallPolicy(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkFirewallPolicy networkFirewallPolicy) {
            this.networkFirewallPolicy = networkFirewallPolicy;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOption#getThirdPartyFirewallPolicy}
         * @param thirdPartyFirewallPolicy third_party_firewall_policy block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#third_party_firewall_policy FmsPolicy#third_party_firewall_policy}
         * @return {@code this}
         */
        public Builder thirdPartyFirewallPolicy(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy thirdPartyFirewallPolicy) {
            this.thirdPartyFirewallPolicy = thirdPartyFirewallPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FmsPolicySecurityServicePolicyDataPolicyOption}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FmsPolicySecurityServicePolicyDataPolicyOption build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FmsPolicySecurityServicePolicyDataPolicyOption}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FmsPolicySecurityServicePolicyDataPolicyOption {
        private final imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy networkAclCommonPolicy;
        private final imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkFirewallPolicy networkFirewallPolicy;
        private final imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy thirdPartyFirewallPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.networkAclCommonPolicy = software.amazon.jsii.Kernel.get(this, "networkAclCommonPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy.class));
            this.networkFirewallPolicy = software.amazon.jsii.Kernel.get(this, "networkFirewallPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkFirewallPolicy.class));
            this.thirdPartyFirewallPolicy = software.amazon.jsii.Kernel.get(this, "thirdPartyFirewallPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.networkAclCommonPolicy = builder.networkAclCommonPolicy;
            this.networkFirewallPolicy = builder.networkFirewallPolicy;
            this.thirdPartyFirewallPolicy = builder.thirdPartyFirewallPolicy;
        }

        @Override
        public final imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy getNetworkAclCommonPolicy() {
            return this.networkAclCommonPolicy;
        }

        @Override
        public final imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkFirewallPolicy getNetworkFirewallPolicy() {
            return this.networkFirewallPolicy;
        }

        @Override
        public final imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy getThirdPartyFirewallPolicy() {
            return this.thirdPartyFirewallPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNetworkAclCommonPolicy() != null) {
                data.set("networkAclCommonPolicy", om.valueToTree(this.getNetworkAclCommonPolicy()));
            }
            if (this.getNetworkFirewallPolicy() != null) {
                data.set("networkFirewallPolicy", om.valueToTree(this.getNetworkFirewallPolicy()));
            }
            if (this.getThirdPartyFirewallPolicy() != null) {
                data.set("thirdPartyFirewallPolicy", om.valueToTree(this.getThirdPartyFirewallPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fmsPolicy.FmsPolicySecurityServicePolicyDataPolicyOption"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FmsPolicySecurityServicePolicyDataPolicyOption.Jsii$Proxy that = (FmsPolicySecurityServicePolicyDataPolicyOption.Jsii$Proxy) o;

            if (this.networkAclCommonPolicy != null ? !this.networkAclCommonPolicy.equals(that.networkAclCommonPolicy) : that.networkAclCommonPolicy != null) return false;
            if (this.networkFirewallPolicy != null ? !this.networkFirewallPolicy.equals(that.networkFirewallPolicy) : that.networkFirewallPolicy != null) return false;
            return this.thirdPartyFirewallPolicy != null ? this.thirdPartyFirewallPolicy.equals(that.thirdPartyFirewallPolicy) : that.thirdPartyFirewallPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.networkAclCommonPolicy != null ? this.networkAclCommonPolicy.hashCode() : 0;
            result = 31 * result + (this.networkFirewallPolicy != null ? this.networkFirewallPolicy.hashCode() : 0);
            result = 31 * result + (this.thirdPartyFirewallPolicy != null ? this.thirdPartyFirewallPolicy.hashCode() : 0);
            return result;
        }
    }
}
