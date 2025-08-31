package imports.aws.lb;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.524Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lb.LbSubnetMapping")
@software.amazon.jsii.Jsii.Proxy(LbSubnetMapping.Jsii$Proxy.class)
public interface LbSubnetMapping extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnet_id Lb#subnet_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSubnetId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#allocation_id Lb#allocation_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAllocationId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ipv6_address Lb#ipv6_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6Address() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#private_ipv4_address Lb#private_ipv4_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivateIpv4Address() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LbSubnetMapping}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbSubnetMapping}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbSubnetMapping> {
        java.lang.String subnetId;
        java.lang.String allocationId;
        java.lang.String ipv6Address;
        java.lang.String privateIpv4Address;

        /**
         * Sets the value of {@link LbSubnetMapping#getSubnetId}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnet_id Lb#subnet_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetId(java.lang.String subnetId) {
            this.subnetId = subnetId;
            return this;
        }

        /**
         * Sets the value of {@link LbSubnetMapping#getAllocationId}
         * @param allocationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#allocation_id Lb#allocation_id}.
         * @return {@code this}
         */
        public Builder allocationId(java.lang.String allocationId) {
            this.allocationId = allocationId;
            return this;
        }

        /**
         * Sets the value of {@link LbSubnetMapping#getIpv6Address}
         * @param ipv6Address Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ipv6_address Lb#ipv6_address}.
         * @return {@code this}
         */
        public Builder ipv6Address(java.lang.String ipv6Address) {
            this.ipv6Address = ipv6Address;
            return this;
        }

        /**
         * Sets the value of {@link LbSubnetMapping#getPrivateIpv4Address}
         * @param privateIpv4Address Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#private_ipv4_address Lb#private_ipv4_address}.
         * @return {@code this}
         */
        public Builder privateIpv4Address(java.lang.String privateIpv4Address) {
            this.privateIpv4Address = privateIpv4Address;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LbSubnetMapping}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbSubnetMapping build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbSubnetMapping}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbSubnetMapping {
        private final java.lang.String subnetId;
        private final java.lang.String allocationId;
        private final java.lang.String ipv6Address;
        private final java.lang.String privateIpv4Address;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.subnetId = software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allocationId = software.amazon.jsii.Kernel.get(this, "allocationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6Address = software.amazon.jsii.Kernel.get(this, "ipv6Address", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.privateIpv4Address = software.amazon.jsii.Kernel.get(this, "privateIpv4Address", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.subnetId = java.util.Objects.requireNonNull(builder.subnetId, "subnetId is required");
            this.allocationId = builder.allocationId;
            this.ipv6Address = builder.ipv6Address;
            this.privateIpv4Address = builder.privateIpv4Address;
        }

        @Override
        public final java.lang.String getSubnetId() {
            return this.subnetId;
        }

        @Override
        public final java.lang.String getAllocationId() {
            return this.allocationId;
        }

        @Override
        public final java.lang.String getIpv6Address() {
            return this.ipv6Address;
        }

        @Override
        public final java.lang.String getPrivateIpv4Address() {
            return this.privateIpv4Address;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("subnetId", om.valueToTree(this.getSubnetId()));
            if (this.getAllocationId() != null) {
                data.set("allocationId", om.valueToTree(this.getAllocationId()));
            }
            if (this.getIpv6Address() != null) {
                data.set("ipv6Address", om.valueToTree(this.getIpv6Address()));
            }
            if (this.getPrivateIpv4Address() != null) {
                data.set("privateIpv4Address", om.valueToTree(this.getPrivateIpv4Address()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lb.LbSubnetMapping"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbSubnetMapping.Jsii$Proxy that = (LbSubnetMapping.Jsii$Proxy) o;

            if (!subnetId.equals(that.subnetId)) return false;
            if (this.allocationId != null ? !this.allocationId.equals(that.allocationId) : that.allocationId != null) return false;
            if (this.ipv6Address != null ? !this.ipv6Address.equals(that.ipv6Address) : that.ipv6Address != null) return false;
            return this.privateIpv4Address != null ? this.privateIpv4Address.equals(that.privateIpv4Address) : that.privateIpv4Address == null;
        }

        @Override
        public final int hashCode() {
            int result = this.subnetId.hashCode();
            result = 31 * result + (this.allocationId != null ? this.allocationId.hashCode() : 0);
            result = 31 * result + (this.ipv6Address != null ? this.ipv6Address.hashCode() : 0);
            result = 31 * result + (this.privateIpv4Address != null ? this.privateIpv4Address.hashCode() : 0);
            return result;
        }
    }
}
