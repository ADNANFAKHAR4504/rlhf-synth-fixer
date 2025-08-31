package imports.aws.fms_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.236Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fmsPolicy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry")
@software.amazon.jsii.Jsii.Proxy(FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry.Jsii$Proxy.class)
public interface FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#egress FmsPolicy#egress}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEgress();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#protocol FmsPolicy#protocol}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProtocol();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#rule_action FmsPolicy#rule_action}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuleAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#cidr_block FmsPolicy#cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCidrBlock() {
        return null;
    }

    /**
     * icmp_type_code block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#icmp_type_code FmsPolicy#icmp_type_code}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIcmpTypeCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#ipv6_cidr_block FmsPolicy#ipv6_cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6CidrBlock() {
        return null;
    }

    /**
     * port_range block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#port_range FmsPolicy#port_range}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPortRange() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry> {
        java.lang.Object egress;
        java.lang.String protocol;
        java.lang.String ruleAction;
        java.lang.String cidrBlock;
        java.lang.Object icmpTypeCode;
        java.lang.String ipv6CidrBlock;
        java.lang.Object portRange;

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry#getEgress}
         * @param egress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#egress FmsPolicy#egress}. This parameter is required.
         * @return {@code this}
         */
        public Builder egress(java.lang.Boolean egress) {
            this.egress = egress;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry#getEgress}
         * @param egress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#egress FmsPolicy#egress}. This parameter is required.
         * @return {@code this}
         */
        public Builder egress(com.hashicorp.cdktf.IResolvable egress) {
            this.egress = egress;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#protocol FmsPolicy#protocol}. This parameter is required.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry#getRuleAction}
         * @param ruleAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#rule_action FmsPolicy#rule_action}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleAction(java.lang.String ruleAction) {
            this.ruleAction = ruleAction;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry#getCidrBlock}
         * @param cidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#cidr_block FmsPolicy#cidr_block}.
         * @return {@code this}
         */
        public Builder cidrBlock(java.lang.String cidrBlock) {
            this.cidrBlock = cidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry#getIcmpTypeCode}
         * @param icmpTypeCode icmp_type_code block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#icmp_type_code FmsPolicy#icmp_type_code}
         * @return {@code this}
         */
        public Builder icmpTypeCode(com.hashicorp.cdktf.IResolvable icmpTypeCode) {
            this.icmpTypeCode = icmpTypeCode;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry#getIcmpTypeCode}
         * @param icmpTypeCode icmp_type_code block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#icmp_type_code FmsPolicy#icmp_type_code}
         * @return {@code this}
         */
        public Builder icmpTypeCode(java.util.List<? extends imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntryIcmpTypeCode> icmpTypeCode) {
            this.icmpTypeCode = icmpTypeCode;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry#getIpv6CidrBlock}
         * @param ipv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#ipv6_cidr_block FmsPolicy#ipv6_cidr_block}.
         * @return {@code this}
         */
        public Builder ipv6CidrBlock(java.lang.String ipv6CidrBlock) {
            this.ipv6CidrBlock = ipv6CidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry#getPortRange}
         * @param portRange port_range block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#port_range FmsPolicy#port_range}
         * @return {@code this}
         */
        public Builder portRange(com.hashicorp.cdktf.IResolvable portRange) {
            this.portRange = portRange;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry#getPortRange}
         * @param portRange port_range block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#port_range FmsPolicy#port_range}
         * @return {@code this}
         */
        public Builder portRange(java.util.List<? extends imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntryPortRange> portRange) {
            this.portRange = portRange;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry {
        private final java.lang.Object egress;
        private final java.lang.String protocol;
        private final java.lang.String ruleAction;
        private final java.lang.String cidrBlock;
        private final java.lang.Object icmpTypeCode;
        private final java.lang.String ipv6CidrBlock;
        private final java.lang.Object portRange;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.egress = software.amazon.jsii.Kernel.get(this, "egress", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleAction = software.amazon.jsii.Kernel.get(this, "ruleAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cidrBlock = software.amazon.jsii.Kernel.get(this, "cidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.icmpTypeCode = software.amazon.jsii.Kernel.get(this, "icmpTypeCode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ipv6CidrBlock = software.amazon.jsii.Kernel.get(this, "ipv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.portRange = software.amazon.jsii.Kernel.get(this, "portRange", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.egress = java.util.Objects.requireNonNull(builder.egress, "egress is required");
            this.protocol = java.util.Objects.requireNonNull(builder.protocol, "protocol is required");
            this.ruleAction = java.util.Objects.requireNonNull(builder.ruleAction, "ruleAction is required");
            this.cidrBlock = builder.cidrBlock;
            this.icmpTypeCode = builder.icmpTypeCode;
            this.ipv6CidrBlock = builder.ipv6CidrBlock;
            this.portRange = builder.portRange;
        }

        @Override
        public final java.lang.Object getEgress() {
            return this.egress;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.String getRuleAction() {
            return this.ruleAction;
        }

        @Override
        public final java.lang.String getCidrBlock() {
            return this.cidrBlock;
        }

        @Override
        public final java.lang.Object getIcmpTypeCode() {
            return this.icmpTypeCode;
        }

        @Override
        public final java.lang.String getIpv6CidrBlock() {
            return this.ipv6CidrBlock;
        }

        @Override
        public final java.lang.Object getPortRange() {
            return this.portRange;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("egress", om.valueToTree(this.getEgress()));
            data.set("protocol", om.valueToTree(this.getProtocol()));
            data.set("ruleAction", om.valueToTree(this.getRuleAction()));
            if (this.getCidrBlock() != null) {
                data.set("cidrBlock", om.valueToTree(this.getCidrBlock()));
            }
            if (this.getIcmpTypeCode() != null) {
                data.set("icmpTypeCode", om.valueToTree(this.getIcmpTypeCode()));
            }
            if (this.getIpv6CidrBlock() != null) {
                data.set("ipv6CidrBlock", om.valueToTree(this.getIpv6CidrBlock()));
            }
            if (this.getPortRange() != null) {
                data.set("portRange", om.valueToTree(this.getPortRange()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fmsPolicy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry.Jsii$Proxy that = (FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry.Jsii$Proxy) o;

            if (!egress.equals(that.egress)) return false;
            if (!protocol.equals(that.protocol)) return false;
            if (!ruleAction.equals(that.ruleAction)) return false;
            if (this.cidrBlock != null ? !this.cidrBlock.equals(that.cidrBlock) : that.cidrBlock != null) return false;
            if (this.icmpTypeCode != null ? !this.icmpTypeCode.equals(that.icmpTypeCode) : that.icmpTypeCode != null) return false;
            if (this.ipv6CidrBlock != null ? !this.ipv6CidrBlock.equals(that.ipv6CidrBlock) : that.ipv6CidrBlock != null) return false;
            return this.portRange != null ? this.portRange.equals(that.portRange) : that.portRange == null;
        }

        @Override
        public final int hashCode() {
            int result = this.egress.hashCode();
            result = 31 * result + (this.protocol.hashCode());
            result = 31 * result + (this.ruleAction.hashCode());
            result = 31 * result + (this.cidrBlock != null ? this.cidrBlock.hashCode() : 0);
            result = 31 * result + (this.icmpTypeCode != null ? this.icmpTypeCode.hashCode() : 0);
            result = 31 * result + (this.ipv6CidrBlock != null ? this.ipv6CidrBlock.hashCode() : 0);
            result = 31 * result + (this.portRange != null ? this.portRange.hashCode() : 0);
            return result;
        }
    }
}
