package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.956Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes extends software.amazon.jsii.JsiiSerializable {

    /**
     * destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#destination NetworkfirewallRuleGroup#destination}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDestination() {
        return null;
    }

    /**
     * destination_port block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#destination_port NetworkfirewallRuleGroup#destination_port}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDestinationPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#protocols NetworkfirewallRuleGroup#protocols}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.Number> getProtocols() {
        return null;
    }

    /**
     * source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#source NetworkfirewallRuleGroup#source}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSource() {
        return null;
    }

    /**
     * source_port block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#source_port NetworkfirewallRuleGroup#source_port}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSourcePort() {
        return null;
    }

    /**
     * tcp_flag block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#tcp_flag NetworkfirewallRuleGroup#tcp_flag}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTcpFlag() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes> {
        java.lang.Object destination;
        java.lang.Object destinationPort;
        java.util.List<java.lang.Number> protocols;
        java.lang.Object source;
        java.lang.Object sourcePort;
        java.lang.Object tcpFlag;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes#getDestination}
         * @param destination destination block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#destination NetworkfirewallRuleGroup#destination}
         * @return {@code this}
         */
        public Builder destination(com.hashicorp.cdktf.IResolvable destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes#getDestination}
         * @param destination destination block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#destination NetworkfirewallRuleGroup#destination}
         * @return {@code this}
         */
        public Builder destination(java.util.List<? extends imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributesDestination> destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes#getDestinationPort}
         * @param destinationPort destination_port block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#destination_port NetworkfirewallRuleGroup#destination_port}
         * @return {@code this}
         */
        public Builder destinationPort(com.hashicorp.cdktf.IResolvable destinationPort) {
            this.destinationPort = destinationPort;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes#getDestinationPort}
         * @param destinationPort destination_port block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#destination_port NetworkfirewallRuleGroup#destination_port}
         * @return {@code this}
         */
        public Builder destinationPort(java.util.List<? extends imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributesDestinationPort> destinationPort) {
            this.destinationPort = destinationPort;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes#getProtocols}
         * @param protocols Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#protocols NetworkfirewallRuleGroup#protocols}.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder protocols(java.util.List<? extends java.lang.Number> protocols) {
            this.protocols = (java.util.List<java.lang.Number>)protocols;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes#getSource}
         * @param source source block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#source NetworkfirewallRuleGroup#source}
         * @return {@code this}
         */
        public Builder source(com.hashicorp.cdktf.IResolvable source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes#getSource}
         * @param source source block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#source NetworkfirewallRuleGroup#source}
         * @return {@code this}
         */
        public Builder source(java.util.List<? extends imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributesSource> source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes#getSourcePort}
         * @param sourcePort source_port block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#source_port NetworkfirewallRuleGroup#source_port}
         * @return {@code this}
         */
        public Builder sourcePort(com.hashicorp.cdktf.IResolvable sourcePort) {
            this.sourcePort = sourcePort;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes#getSourcePort}
         * @param sourcePort source_port block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#source_port NetworkfirewallRuleGroup#source_port}
         * @return {@code this}
         */
        public Builder sourcePort(java.util.List<? extends imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributesSourcePort> sourcePort) {
            this.sourcePort = sourcePort;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes#getTcpFlag}
         * @param tcpFlag tcp_flag block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#tcp_flag NetworkfirewallRuleGroup#tcp_flag}
         * @return {@code this}
         */
        public Builder tcpFlag(com.hashicorp.cdktf.IResolvable tcpFlag) {
            this.tcpFlag = tcpFlag;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes#getTcpFlag}
         * @param tcpFlag tcp_flag block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#tcp_flag NetworkfirewallRuleGroup#tcp_flag}
         * @return {@code this}
         */
        public Builder tcpFlag(java.util.List<? extends imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributesTcpFlag> tcpFlag) {
            this.tcpFlag = tcpFlag;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes {
        private final java.lang.Object destination;
        private final java.lang.Object destinationPort;
        private final java.util.List<java.lang.Number> protocols;
        private final java.lang.Object source;
        private final java.lang.Object sourcePort;
        private final java.lang.Object tcpFlag;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.destinationPort = software.amazon.jsii.Kernel.get(this, "destinationPort", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.protocols = software.amazon.jsii.Kernel.get(this, "protocols", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class)));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourcePort = software.amazon.jsii.Kernel.get(this, "sourcePort", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tcpFlag = software.amazon.jsii.Kernel.get(this, "tcpFlag", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destination = builder.destination;
            this.destinationPort = builder.destinationPort;
            this.protocols = (java.util.List<java.lang.Number>)builder.protocols;
            this.source = builder.source;
            this.sourcePort = builder.sourcePort;
            this.tcpFlag = builder.tcpFlag;
        }

        @Override
        public final java.lang.Object getDestination() {
            return this.destination;
        }

        @Override
        public final java.lang.Object getDestinationPort() {
            return this.destinationPort;
        }

        @Override
        public final java.util.List<java.lang.Number> getProtocols() {
            return this.protocols;
        }

        @Override
        public final java.lang.Object getSource() {
            return this.source;
        }

        @Override
        public final java.lang.Object getSourcePort() {
            return this.sourcePort;
        }

        @Override
        public final java.lang.Object getTcpFlag() {
            return this.tcpFlag;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDestination() != null) {
                data.set("destination", om.valueToTree(this.getDestination()));
            }
            if (this.getDestinationPort() != null) {
                data.set("destinationPort", om.valueToTree(this.getDestinationPort()));
            }
            if (this.getProtocols() != null) {
                data.set("protocols", om.valueToTree(this.getProtocols()));
            }
            if (this.getSource() != null) {
                data.set("source", om.valueToTree(this.getSource()));
            }
            if (this.getSourcePort() != null) {
                data.set("sourcePort", om.valueToTree(this.getSourcePort()));
            }
            if (this.getTcpFlag() != null) {
                data.set("tcpFlag", om.valueToTree(this.getTcpFlag()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsStatelessRuleRuleDefinitionMatchAttributes.Jsii$Proxy) o;

            if (this.destination != null ? !this.destination.equals(that.destination) : that.destination != null) return false;
            if (this.destinationPort != null ? !this.destinationPort.equals(that.destinationPort) : that.destinationPort != null) return false;
            if (this.protocols != null ? !this.protocols.equals(that.protocols) : that.protocols != null) return false;
            if (this.source != null ? !this.source.equals(that.source) : that.source != null) return false;
            if (this.sourcePort != null ? !this.sourcePort.equals(that.sourcePort) : that.sourcePort != null) return false;
            return this.tcpFlag != null ? this.tcpFlag.equals(that.tcpFlag) : that.tcpFlag == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destination != null ? this.destination.hashCode() : 0;
            result = 31 * result + (this.destinationPort != null ? this.destinationPort.hashCode() : 0);
            result = 31 * result + (this.protocols != null ? this.protocols.hashCode() : 0);
            result = 31 * result + (this.source != null ? this.source.hashCode() : 0);
            result = 31 * result + (this.sourcePort != null ? this.sourcePort.hashCode() : 0);
            result = 31 * result + (this.tcpFlag != null ? this.tcpFlag.hashCode() : 0);
            return result;
        }
    }
}
