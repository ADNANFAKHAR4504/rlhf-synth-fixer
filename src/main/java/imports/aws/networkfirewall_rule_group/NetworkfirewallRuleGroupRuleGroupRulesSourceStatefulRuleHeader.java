package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.955Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#destination NetworkfirewallRuleGroup#destination}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDestination();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#destination_port NetworkfirewallRuleGroup#destination_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDestinationPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#direction NetworkfirewallRuleGroup#direction}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDirection();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#protocol NetworkfirewallRuleGroup#protocol}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProtocol();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#source NetworkfirewallRuleGroup#source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSource();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#source_port NetworkfirewallRuleGroup#source_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourcePort();

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader> {
        java.lang.String destination;
        java.lang.String destinationPort;
        java.lang.String direction;
        java.lang.String protocol;
        java.lang.String source;
        java.lang.String sourcePort;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader#getDestination}
         * @param destination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#destination NetworkfirewallRuleGroup#destination}. This parameter is required.
         * @return {@code this}
         */
        public Builder destination(java.lang.String destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader#getDestinationPort}
         * @param destinationPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#destination_port NetworkfirewallRuleGroup#destination_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder destinationPort(java.lang.String destinationPort) {
            this.destinationPort = destinationPort;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader#getDirection}
         * @param direction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#direction NetworkfirewallRuleGroup#direction}. This parameter is required.
         * @return {@code this}
         */
        public Builder direction(java.lang.String direction) {
            this.direction = direction;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#protocol NetworkfirewallRuleGroup#protocol}. This parameter is required.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader#getSource}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#source NetworkfirewallRuleGroup#source}. This parameter is required.
         * @return {@code this}
         */
        public Builder source(java.lang.String source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader#getSourcePort}
         * @param sourcePort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#source_port NetworkfirewallRuleGroup#source_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourcePort(java.lang.String sourcePort) {
            this.sourcePort = sourcePort;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader {
        private final java.lang.String destination;
        private final java.lang.String destinationPort;
        private final java.lang.String direction;
        private final java.lang.String protocol;
        private final java.lang.String source;
        private final java.lang.String sourcePort;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationPort = software.amazon.jsii.Kernel.get(this, "destinationPort", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.direction = software.amazon.jsii.Kernel.get(this, "direction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourcePort = software.amazon.jsii.Kernel.get(this, "sourcePort", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destination = java.util.Objects.requireNonNull(builder.destination, "destination is required");
            this.destinationPort = java.util.Objects.requireNonNull(builder.destinationPort, "destinationPort is required");
            this.direction = java.util.Objects.requireNonNull(builder.direction, "direction is required");
            this.protocol = java.util.Objects.requireNonNull(builder.protocol, "protocol is required");
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
            this.sourcePort = java.util.Objects.requireNonNull(builder.sourcePort, "sourcePort is required");
        }

        @Override
        public final java.lang.String getDestination() {
            return this.destination;
        }

        @Override
        public final java.lang.String getDestinationPort() {
            return this.destinationPort;
        }

        @Override
        public final java.lang.String getDirection() {
            return this.direction;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.String getSource() {
            return this.source;
        }

        @Override
        public final java.lang.String getSourcePort() {
            return this.sourcePort;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destination", om.valueToTree(this.getDestination()));
            data.set("destinationPort", om.valueToTree(this.getDestinationPort()));
            data.set("direction", om.valueToTree(this.getDirection()));
            data.set("protocol", om.valueToTree(this.getProtocol()));
            data.set("source", om.valueToTree(this.getSource()));
            data.set("sourcePort", om.valueToTree(this.getSourcePort()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleHeader.Jsii$Proxy) o;

            if (!destination.equals(that.destination)) return false;
            if (!destinationPort.equals(that.destinationPort)) return false;
            if (!direction.equals(that.direction)) return false;
            if (!protocol.equals(that.protocol)) return false;
            if (!source.equals(that.source)) return false;
            return this.sourcePort.equals(that.sourcePort);
        }

        @Override
        public final int hashCode() {
            int result = this.destination.hashCode();
            result = 31 * result + (this.destinationPort.hashCode());
            result = 31 * result + (this.direction.hashCode());
            result = 31 * result + (this.protocol.hashCode());
            result = 31 * result + (this.source.hashCode());
            result = 31 * result + (this.sourcePort.hashCode());
            return result;
        }
    }
}
