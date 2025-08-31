package imports.aws.vpc_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.591Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcEndpoint.VpcEndpointSubnetConfiguration")
@software.amazon.jsii.Jsii.Proxy(VpcEndpointSubnetConfiguration.Jsii$Proxy.class)
public interface VpcEndpointSubnetConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#ipv4 VpcEndpoint#ipv4}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv4() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#ipv6 VpcEndpoint#ipv6}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#subnet_id VpcEndpoint#subnet_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpcEndpointSubnetConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcEndpointSubnetConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcEndpointSubnetConfiguration> {
        java.lang.String ipv4;
        java.lang.String ipv6;
        java.lang.String subnetId;

        /**
         * Sets the value of {@link VpcEndpointSubnetConfiguration#getIpv4}
         * @param ipv4 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#ipv4 VpcEndpoint#ipv4}.
         * @return {@code this}
         */
        public Builder ipv4(java.lang.String ipv4) {
            this.ipv4 = ipv4;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointSubnetConfiguration#getIpv6}
         * @param ipv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#ipv6 VpcEndpoint#ipv6}.
         * @return {@code this}
         */
        public Builder ipv6(java.lang.String ipv6) {
            this.ipv6 = ipv6;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointSubnetConfiguration#getSubnetId}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#subnet_id VpcEndpoint#subnet_id}.
         * @return {@code this}
         */
        public Builder subnetId(java.lang.String subnetId) {
            this.subnetId = subnetId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpcEndpointSubnetConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcEndpointSubnetConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcEndpointSubnetConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcEndpointSubnetConfiguration {
        private final java.lang.String ipv4;
        private final java.lang.String ipv6;
        private final java.lang.String subnetId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ipv4 = software.amazon.jsii.Kernel.get(this, "ipv4", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6 = software.amazon.jsii.Kernel.get(this, "ipv6", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetId = software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ipv4 = builder.ipv4;
            this.ipv6 = builder.ipv6;
            this.subnetId = builder.subnetId;
        }

        @Override
        public final java.lang.String getIpv4() {
            return this.ipv4;
        }

        @Override
        public final java.lang.String getIpv6() {
            return this.ipv6;
        }

        @Override
        public final java.lang.String getSubnetId() {
            return this.subnetId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIpv4() != null) {
                data.set("ipv4", om.valueToTree(this.getIpv4()));
            }
            if (this.getIpv6() != null) {
                data.set("ipv6", om.valueToTree(this.getIpv6()));
            }
            if (this.getSubnetId() != null) {
                data.set("subnetId", om.valueToTree(this.getSubnetId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpcEndpoint.VpcEndpointSubnetConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcEndpointSubnetConfiguration.Jsii$Proxy that = (VpcEndpointSubnetConfiguration.Jsii$Proxy) o;

            if (this.ipv4 != null ? !this.ipv4.equals(that.ipv4) : that.ipv4 != null) return false;
            if (this.ipv6 != null ? !this.ipv6.equals(that.ipv6) : that.ipv6 != null) return false;
            return this.subnetId != null ? this.subnetId.equals(that.subnetId) : that.subnetId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ipv4 != null ? this.ipv4.hashCode() : 0;
            result = 31 * result + (this.ipv6 != null ? this.ipv6.hashCode() : 0);
            result = 31 * result + (this.subnetId != null ? this.subnetId.hashCode() : 0);
            return result;
        }
    }
}
