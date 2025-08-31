package imports.aws.ec2_image_block_public_access;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.081Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2ImageBlockPublicAccess.Ec2ImageBlockPublicAccessTimeouts")
@software.amazon.jsii.Jsii.Proxy(Ec2ImageBlockPublicAccessTimeouts.Jsii$Proxy.class)
public interface Ec2ImageBlockPublicAccessTimeouts extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_image_block_public_access#update Ec2ImageBlockPublicAccess#update}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUpdate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2ImageBlockPublicAccessTimeouts}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2ImageBlockPublicAccessTimeouts}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2ImageBlockPublicAccessTimeouts> {
        java.lang.String update;

        /**
         * Sets the value of {@link Ec2ImageBlockPublicAccessTimeouts#getUpdate}
         * @param update Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_image_block_public_access#update Ec2ImageBlockPublicAccess#update}.
         * @return {@code this}
         */
        public Builder update(java.lang.String update) {
            this.update = update;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2ImageBlockPublicAccessTimeouts}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2ImageBlockPublicAccessTimeouts build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2ImageBlockPublicAccessTimeouts}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2ImageBlockPublicAccessTimeouts {
        private final java.lang.String update;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.update = software.amazon.jsii.Kernel.get(this, "update", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.update = builder.update;
        }

        @Override
        public final java.lang.String getUpdate() {
            return this.update;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getUpdate() != null) {
                data.set("update", om.valueToTree(this.getUpdate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2ImageBlockPublicAccess.Ec2ImageBlockPublicAccessTimeouts"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2ImageBlockPublicAccessTimeouts.Jsii$Proxy that = (Ec2ImageBlockPublicAccessTimeouts.Jsii$Proxy) o;

            return this.update != null ? this.update.equals(that.update) : that.update == null;
        }

        @Override
        public final int hashCode() {
            int result = this.update != null ? this.update.hashCode() : 0;
            return result;
        }
    }
}
