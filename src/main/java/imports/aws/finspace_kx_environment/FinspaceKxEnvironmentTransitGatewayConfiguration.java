package imports.aws.finspace_kx_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.224Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxEnvironment.FinspaceKxEnvironmentTransitGatewayConfiguration")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxEnvironmentTransitGatewayConfiguration.Jsii$Proxy.class)
public interface FinspaceKxEnvironmentTransitGatewayConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#routable_cidr_space FinspaceKxEnvironment#routable_cidr_space}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoutableCidrSpace();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#transit_gateway_id FinspaceKxEnvironment#transit_gateway_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayId();

    /**
     * attachment_network_acl_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#attachment_network_acl_configuration FinspaceKxEnvironment#attachment_network_acl_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAttachmentNetworkAclConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FinspaceKxEnvironmentTransitGatewayConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxEnvironmentTransitGatewayConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxEnvironmentTransitGatewayConfiguration> {
        java.lang.String routableCidrSpace;
        java.lang.String transitGatewayId;
        java.lang.Object attachmentNetworkAclConfiguration;

        /**
         * Sets the value of {@link FinspaceKxEnvironmentTransitGatewayConfiguration#getRoutableCidrSpace}
         * @param routableCidrSpace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#routable_cidr_space FinspaceKxEnvironment#routable_cidr_space}. This parameter is required.
         * @return {@code this}
         */
        public Builder routableCidrSpace(java.lang.String routableCidrSpace) {
            this.routableCidrSpace = routableCidrSpace;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxEnvironmentTransitGatewayConfiguration#getTransitGatewayId}
         * @param transitGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#transit_gateway_id FinspaceKxEnvironment#transit_gateway_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder transitGatewayId(java.lang.String transitGatewayId) {
            this.transitGatewayId = transitGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxEnvironmentTransitGatewayConfiguration#getAttachmentNetworkAclConfiguration}
         * @param attachmentNetworkAclConfiguration attachment_network_acl_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#attachment_network_acl_configuration FinspaceKxEnvironment#attachment_network_acl_configuration}
         * @return {@code this}
         */
        public Builder attachmentNetworkAclConfiguration(com.hashicorp.cdktf.IResolvable attachmentNetworkAclConfiguration) {
            this.attachmentNetworkAclConfiguration = attachmentNetworkAclConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxEnvironmentTransitGatewayConfiguration#getAttachmentNetworkAclConfiguration}
         * @param attachmentNetworkAclConfiguration attachment_network_acl_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#attachment_network_acl_configuration FinspaceKxEnvironment#attachment_network_acl_configuration}
         * @return {@code this}
         */
        public Builder attachmentNetworkAclConfiguration(java.util.List<? extends imports.aws.finspace_kx_environment.FinspaceKxEnvironmentTransitGatewayConfigurationAttachmentNetworkAclConfiguration> attachmentNetworkAclConfiguration) {
            this.attachmentNetworkAclConfiguration = attachmentNetworkAclConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxEnvironmentTransitGatewayConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxEnvironmentTransitGatewayConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxEnvironmentTransitGatewayConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxEnvironmentTransitGatewayConfiguration {
        private final java.lang.String routableCidrSpace;
        private final java.lang.String transitGatewayId;
        private final java.lang.Object attachmentNetworkAclConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.routableCidrSpace = software.amazon.jsii.Kernel.get(this, "routableCidrSpace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transitGatewayId = software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.attachmentNetworkAclConfiguration = software.amazon.jsii.Kernel.get(this, "attachmentNetworkAclConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.routableCidrSpace = java.util.Objects.requireNonNull(builder.routableCidrSpace, "routableCidrSpace is required");
            this.transitGatewayId = java.util.Objects.requireNonNull(builder.transitGatewayId, "transitGatewayId is required");
            this.attachmentNetworkAclConfiguration = builder.attachmentNetworkAclConfiguration;
        }

        @Override
        public final java.lang.String getRoutableCidrSpace() {
            return this.routableCidrSpace;
        }

        @Override
        public final java.lang.String getTransitGatewayId() {
            return this.transitGatewayId;
        }

        @Override
        public final java.lang.Object getAttachmentNetworkAclConfiguration() {
            return this.attachmentNetworkAclConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("routableCidrSpace", om.valueToTree(this.getRoutableCidrSpace()));
            data.set("transitGatewayId", om.valueToTree(this.getTransitGatewayId()));
            if (this.getAttachmentNetworkAclConfiguration() != null) {
                data.set("attachmentNetworkAclConfiguration", om.valueToTree(this.getAttachmentNetworkAclConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxEnvironment.FinspaceKxEnvironmentTransitGatewayConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxEnvironmentTransitGatewayConfiguration.Jsii$Proxy that = (FinspaceKxEnvironmentTransitGatewayConfiguration.Jsii$Proxy) o;

            if (!routableCidrSpace.equals(that.routableCidrSpace)) return false;
            if (!transitGatewayId.equals(that.transitGatewayId)) return false;
            return this.attachmentNetworkAclConfiguration != null ? this.attachmentNetworkAclConfiguration.equals(that.attachmentNetworkAclConfiguration) : that.attachmentNetworkAclConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.routableCidrSpace.hashCode();
            result = 31 * result + (this.transitGatewayId.hashCode());
            result = 31 * result + (this.attachmentNetworkAclConfiguration != null ? this.attachmentNetworkAclConfiguration.hashCode() : 0);
            return result;
        }
    }
}
