package imports.aws.transfer_server;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.564Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferServer.TransferServerEndpointDetails")
@software.amazon.jsii.Jsii.Proxy(TransferServerEndpointDetails.Jsii$Proxy.class)
public interface TransferServerEndpointDetails extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#address_allocation_ids TransferServer#address_allocation_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAddressAllocationIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#security_group_ids TransferServer#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#subnet_ids TransferServer#subnet_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#vpc_endpoint_id TransferServer#vpc_endpoint_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcEndpointId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#vpc_id TransferServer#vpc_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferServerEndpointDetails}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferServerEndpointDetails}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferServerEndpointDetails> {
        java.util.List<java.lang.String> addressAllocationIds;
        java.util.List<java.lang.String> securityGroupIds;
        java.util.List<java.lang.String> subnetIds;
        java.lang.String vpcEndpointId;
        java.lang.String vpcId;

        /**
         * Sets the value of {@link TransferServerEndpointDetails#getAddressAllocationIds}
         * @param addressAllocationIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#address_allocation_ids TransferServer#address_allocation_ids}.
         * @return {@code this}
         */
        public Builder addressAllocationIds(java.util.List<java.lang.String> addressAllocationIds) {
            this.addressAllocationIds = addressAllocationIds;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerEndpointDetails#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#security_group_ids TransferServer#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerEndpointDetails#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#subnet_ids TransferServer#subnet_ids}.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerEndpointDetails#getVpcEndpointId}
         * @param vpcEndpointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#vpc_endpoint_id TransferServer#vpc_endpoint_id}.
         * @return {@code this}
         */
        public Builder vpcEndpointId(java.lang.String vpcEndpointId) {
            this.vpcEndpointId = vpcEndpointId;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerEndpointDetails#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#vpc_id TransferServer#vpc_id}.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferServerEndpointDetails}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferServerEndpointDetails build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferServerEndpointDetails}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferServerEndpointDetails {
        private final java.util.List<java.lang.String> addressAllocationIds;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.lang.String vpcEndpointId;
        private final java.lang.String vpcId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.addressAllocationIds = software.amazon.jsii.Kernel.get(this, "addressAllocationIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcEndpointId = software.amazon.jsii.Kernel.get(this, "vpcEndpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.addressAllocationIds = builder.addressAllocationIds;
            this.securityGroupIds = builder.securityGroupIds;
            this.subnetIds = builder.subnetIds;
            this.vpcEndpointId = builder.vpcEndpointId;
            this.vpcId = builder.vpcId;
        }

        @Override
        public final java.util.List<java.lang.String> getAddressAllocationIds() {
            return this.addressAllocationIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.lang.String getVpcEndpointId() {
            return this.vpcEndpointId;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAddressAllocationIds() != null) {
                data.set("addressAllocationIds", om.valueToTree(this.getAddressAllocationIds()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }
            if (this.getSubnetIds() != null) {
                data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            }
            if (this.getVpcEndpointId() != null) {
                data.set("vpcEndpointId", om.valueToTree(this.getVpcEndpointId()));
            }
            if (this.getVpcId() != null) {
                data.set("vpcId", om.valueToTree(this.getVpcId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferServer.TransferServerEndpointDetails"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferServerEndpointDetails.Jsii$Proxy that = (TransferServerEndpointDetails.Jsii$Proxy) o;

            if (this.addressAllocationIds != null ? !this.addressAllocationIds.equals(that.addressAllocationIds) : that.addressAllocationIds != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.subnetIds != null ? !this.subnetIds.equals(that.subnetIds) : that.subnetIds != null) return false;
            if (this.vpcEndpointId != null ? !this.vpcEndpointId.equals(that.vpcEndpointId) : that.vpcEndpointId != null) return false;
            return this.vpcId != null ? this.vpcId.equals(that.vpcId) : that.vpcId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.addressAllocationIds != null ? this.addressAllocationIds.hashCode() : 0;
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.subnetIds != null ? this.subnetIds.hashCode() : 0);
            result = 31 * result + (this.vpcEndpointId != null ? this.vpcEndpointId.hashCode() : 0);
            result = 31 * result + (this.vpcId != null ? this.vpcId.hashCode() : 0);
            return result;
        }
    }
}
