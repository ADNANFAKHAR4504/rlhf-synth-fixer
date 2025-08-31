package imports.aws.finspace_kx_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.225Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxEnvironment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange.Jsii$Proxy.class)
public interface FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#from FinspaceKxEnvironment#from}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getFrom();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#to FinspaceKxEnvironment#to}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTo();

    /**
     * @return a {@link Builder} of {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange> {
        java.lang.Number from;
        java.lang.Number to;

        /**
         * Sets the value of {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange#getFrom}
         * @param from Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#from FinspaceKxEnvironment#from}. This parameter is required.
         * @return {@code this}
         */
        public Builder from(java.lang.Number from) {
            this.from = from;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange#getTo}
         * @param to Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#to FinspaceKxEnvironment#to}. This parameter is required.
         * @return {@code this}
         */
        public Builder to(java.lang.Number to) {
            this.to = to;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange {
        private final java.lang.Number from;
        private final java.lang.Number to;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.from = software.amazon.jsii.Kernel.get(this, "from", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.to = software.amazon.jsii.Kernel.get(this, "to", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.from = java.util.Objects.requireNonNull(builder.from, "from is required");
            this.to = java.util.Objects.requireNonNull(builder.to, "to is required");
        }

        @Override
        public final java.lang.Number getFrom() {
            return this.from;
        }

        @Override
        public final java.lang.Number getTo() {
            return this.to;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("from", om.valueToTree(this.getFrom()));
            data.set("to", om.valueToTree(this.getTo()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxEnvironment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange.Jsii$Proxy that = (FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfigurationPortRange.Jsii$Proxy) o;

            if (!from.equals(that.from)) return false;
            return this.to.equals(that.to);
        }

        @Override
        public final int hashCode() {
            int result = this.from.hashCode();
            result = 31 * result + (this.to.hashCode());
            return result;
        }
    }
}
