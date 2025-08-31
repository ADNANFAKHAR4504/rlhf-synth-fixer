package imports.aws.vpc_ipam_pool_cidr;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.601Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcIpamPoolCidr.VpcIpamPoolCidrCidrAuthorizationContext")
@software.amazon.jsii.Jsii.Proxy(VpcIpamPoolCidrCidrAuthorizationContext.Jsii$Proxy.class)
public interface VpcIpamPoolCidrCidrAuthorizationContext extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#message VpcIpamPoolCidr#message}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMessage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#signature VpcIpamPoolCidr#signature}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSignature() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpcIpamPoolCidrCidrAuthorizationContext}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcIpamPoolCidrCidrAuthorizationContext}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcIpamPoolCidrCidrAuthorizationContext> {
        java.lang.String message;
        java.lang.String signature;

        /**
         * Sets the value of {@link VpcIpamPoolCidrCidrAuthorizationContext#getMessage}
         * @param message Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#message VpcIpamPoolCidr#message}.
         * @return {@code this}
         */
        public Builder message(java.lang.String message) {
            this.message = message;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrCidrAuthorizationContext#getSignature}
         * @param signature Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#signature VpcIpamPoolCidr#signature}.
         * @return {@code this}
         */
        public Builder signature(java.lang.String signature) {
            this.signature = signature;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpcIpamPoolCidrCidrAuthorizationContext}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcIpamPoolCidrCidrAuthorizationContext build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcIpamPoolCidrCidrAuthorizationContext}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcIpamPoolCidrCidrAuthorizationContext {
        private final java.lang.String message;
        private final java.lang.String signature;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.message = software.amazon.jsii.Kernel.get(this, "message", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.signature = software.amazon.jsii.Kernel.get(this, "signature", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.message = builder.message;
            this.signature = builder.signature;
        }

        @Override
        public final java.lang.String getMessage() {
            return this.message;
        }

        @Override
        public final java.lang.String getSignature() {
            return this.signature;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMessage() != null) {
                data.set("message", om.valueToTree(this.getMessage()));
            }
            if (this.getSignature() != null) {
                data.set("signature", om.valueToTree(this.getSignature()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpcIpamPoolCidr.VpcIpamPoolCidrCidrAuthorizationContext"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcIpamPoolCidrCidrAuthorizationContext.Jsii$Proxy that = (VpcIpamPoolCidrCidrAuthorizationContext.Jsii$Proxy) o;

            if (this.message != null ? !this.message.equals(that.message) : that.message != null) return false;
            return this.signature != null ? this.signature.equals(that.signature) : that.signature == null;
        }

        @Override
        public final int hashCode() {
            int result = this.message != null ? this.message.hashCode() : 0;
            result = 31 * result + (this.signature != null ? this.signature.hashCode() : 0);
            return result;
        }
    }
}
