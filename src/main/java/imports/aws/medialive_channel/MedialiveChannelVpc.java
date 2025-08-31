package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelVpc")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelVpc.Jsii$Proxy.class)
public interface MedialiveChannelVpc extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#public_address_allocation_ids MedialiveChannel#public_address_allocation_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPublicAddressAllocationIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#subnet_ids MedialiveChannel#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#security_group_ids MedialiveChannel#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelVpc}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelVpc}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelVpc> {
        java.util.List<java.lang.String> publicAddressAllocationIds;
        java.util.List<java.lang.String> subnetIds;
        java.util.List<java.lang.String> securityGroupIds;

        /**
         * Sets the value of {@link MedialiveChannelVpc#getPublicAddressAllocationIds}
         * @param publicAddressAllocationIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#public_address_allocation_ids MedialiveChannel#public_address_allocation_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder publicAddressAllocationIds(java.util.List<java.lang.String> publicAddressAllocationIds) {
            this.publicAddressAllocationIds = publicAddressAllocationIds;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelVpc#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#subnet_ids MedialiveChannel#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelVpc#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#security_group_ids MedialiveChannel#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelVpc}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelVpc build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelVpc}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelVpc {
        private final java.util.List<java.lang.String> publicAddressAllocationIds;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.util.List<java.lang.String> securityGroupIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.publicAddressAllocationIds = software.amazon.jsii.Kernel.get(this, "publicAddressAllocationIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.publicAddressAllocationIds = java.util.Objects.requireNonNull(builder.publicAddressAllocationIds, "publicAddressAllocationIds is required");
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.securityGroupIds = builder.securityGroupIds;
        }

        @Override
        public final java.util.List<java.lang.String> getPublicAddressAllocationIds() {
            return this.publicAddressAllocationIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("publicAddressAllocationIds", om.valueToTree(this.getPublicAddressAllocationIds()));
            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelVpc"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelVpc.Jsii$Proxy that = (MedialiveChannelVpc.Jsii$Proxy) o;

            if (!publicAddressAllocationIds.equals(that.publicAddressAllocationIds)) return false;
            if (!subnetIds.equals(that.subnetIds)) return false;
            return this.securityGroupIds != null ? this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.publicAddressAllocationIds.hashCode();
            result = 31 * result + (this.subnetIds.hashCode());
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            return result;
        }
    }
}
