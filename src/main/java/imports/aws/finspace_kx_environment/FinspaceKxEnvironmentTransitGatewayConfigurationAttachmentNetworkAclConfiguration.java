package imports.aws.finspace_kx_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.224Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxEnvironment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration.Jsii$Proxy.class)
public interface FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#cidr_block FinspaceKxEnvironment#cidr_block}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCidrBlock();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#protocol FinspaceKxEnvironment#protocol}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProtocol();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#rule_action FinspaceKxEnvironment#rule_action}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuleAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#rule_number FinspaceKxEnvironment#rule_number}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getRuleNumber();

    /**
     * icmp_type_code block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#icmp_type_code FinspaceKxEnvironment#icmp_type_code}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationIcmpTypeCode getIcmpTypeCode() {
        return null;
    }

    /**
     * port_range block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#port_range FinspaceKxEnvironment#port_range}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange getPortRange() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration> {
        java.lang.String cidrBlock;
        java.lang.String protocol;
        java.lang.String ruleAction;
        java.lang.Number ruleNumber;
        imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationIcmpTypeCode icmpTypeCode;
        imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange portRange;

        /**
         * Sets the value of {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration#getCidrBlock}
         * @param cidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#cidr_block FinspaceKxEnvironment#cidr_block}. This parameter is required.
         * @return {@code this}
         */
        public Builder cidrBlock(java.lang.String cidrBlock) {
            this.cidrBlock = cidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#protocol FinspaceKxEnvironment#protocol}. This parameter is required.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration#getRuleAction}
         * @param ruleAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#rule_action FinspaceKxEnvironment#rule_action}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleAction(java.lang.String ruleAction) {
            this.ruleAction = ruleAction;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration#getRuleNumber}
         * @param ruleNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#rule_number FinspaceKxEnvironment#rule_number}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleNumber(java.lang.Number ruleNumber) {
            this.ruleNumber = ruleNumber;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration#getIcmpTypeCode}
         * @param icmpTypeCode icmp_type_code block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#icmp_type_code FinspaceKxEnvironment#icmp_type_code}
         * @return {@code this}
         */
        public Builder icmpTypeCode(imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationIcmpTypeCode icmpTypeCode) {
            this.icmpTypeCode = icmpTypeCode;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration#getPortRange}
         * @param portRange port_range block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#port_range FinspaceKxEnvironment#port_range}
         * @return {@code this}
         */
        public Builder portRange(imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange portRange) {
            this.portRange = portRange;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration {
        private final java.lang.String cidrBlock;
        private final java.lang.String protocol;
        private final java.lang.String ruleAction;
        private final java.lang.Number ruleNumber;
        private final imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationIcmpTypeCode icmpTypeCode;
        private final imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange portRange;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cidrBlock = software.amazon.jsii.Kernel.get(this, "cidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleAction = software.amazon.jsii.Kernel.get(this, "ruleAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleNumber = software.amazon.jsii.Kernel.get(this, "ruleNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.icmpTypeCode = software.amazon.jsii.Kernel.get(this, "icmpTypeCode", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationIcmpTypeCode.class));
            this.portRange = software.amazon.jsii.Kernel.get(this, "portRange", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cidrBlock = java.util.Objects.requireNonNull(builder.cidrBlock, "cidrBlock is required");
            this.protocol = java.util.Objects.requireNonNull(builder.protocol, "protocol is required");
            this.ruleAction = java.util.Objects.requireNonNull(builder.ruleAction, "ruleAction is required");
            this.ruleNumber = java.util.Objects.requireNonNull(builder.ruleNumber, "ruleNumber is required");
            this.icmpTypeCode = builder.icmpTypeCode;
            this.portRange = builder.portRange;
        }

        @Override
        public final java.lang.String getCidrBlock() {
            return this.cidrBlock;
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
        public final java.lang.Number getRuleNumber() {
            return this.ruleNumber;
        }

        @Override
        public final imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationIcmpTypeCode getIcmpTypeCode() {
            return this.icmpTypeCode;
        }

        @Override
        public final imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange getPortRange() {
            return this.portRange;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cidrBlock", om.valueToTree(this.getCidrBlock()));
            data.set("protocol", om.valueToTree(this.getProtocol()));
            data.set("ruleAction", om.valueToTree(this.getRuleAction()));
            data.set("ruleNumber", om.valueToTree(this.getRuleNumber()));
            if (this.getIcmpTypeCode() != null) {
                data.set("icmpTypeCode", om.valueToTree(this.getIcmpTypeCode()));
            }
            if (this.getPortRange() != null) {
                data.set("portRange", om.valueToTree(this.getPortRange()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxEnvironment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration.Jsii$Proxy that = (FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration.Jsii$Proxy) o;

            if (!cidrBlock.equals(that.cidrBlock)) return false;
            if (!protocol.equals(that.protocol)) return false;
            if (!ruleAction.equals(that.ruleAction)) return false;
            if (!ruleNumber.equals(that.ruleNumber)) return false;
            if (this.icmpTypeCode != null ? !this.icmpTypeCode.equals(that.icmpTypeCode) : that.icmpTypeCode != null) return false;
            return this.portRange != null ? this.portRange.equals(that.portRange) : that.portRange == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cidrBlock.hashCode();
            result = 31 * result + (this.protocol.hashCode());
            result = 31 * result + (this.ruleAction.hashCode());
            result = 31 * result + (this.ruleNumber.hashCode());
            result = 31 * result + (this.icmpTypeCode != null ? this.icmpTypeCode.hashCode() : 0);
            result = 31 * result + (this.portRange != null ? this.portRange.hashCode() : 0);
            return result;
        }
    }
}
