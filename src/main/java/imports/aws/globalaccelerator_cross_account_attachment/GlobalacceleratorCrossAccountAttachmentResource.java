package imports.aws.globalaccelerator_cross_account_attachment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.269Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.globalacceleratorCrossAccountAttachment.GlobalacceleratorCrossAccountAttachmentResource")
@software.amazon.jsii.Jsii.Proxy(GlobalacceleratorCrossAccountAttachmentResource.Jsii$Proxy.class)
public interface GlobalacceleratorCrossAccountAttachmentResource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_cross_account_attachment#cidr_block GlobalacceleratorCrossAccountAttachment#cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_cross_account_attachment#endpoint_id GlobalacceleratorCrossAccountAttachment#endpoint_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndpointId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_cross_account_attachment#region GlobalacceleratorCrossAccountAttachment#region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlobalacceleratorCrossAccountAttachmentResource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlobalacceleratorCrossAccountAttachmentResource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlobalacceleratorCrossAccountAttachmentResource> {
        java.lang.String cidrBlock;
        java.lang.String endpointId;
        java.lang.String region;

        /**
         * Sets the value of {@link GlobalacceleratorCrossAccountAttachmentResource#getCidrBlock}
         * @param cidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_cross_account_attachment#cidr_block GlobalacceleratorCrossAccountAttachment#cidr_block}.
         * @return {@code this}
         */
        public Builder cidrBlock(java.lang.String cidrBlock) {
            this.cidrBlock = cidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCrossAccountAttachmentResource#getEndpointId}
         * @param endpointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_cross_account_attachment#endpoint_id GlobalacceleratorCrossAccountAttachment#endpoint_id}.
         * @return {@code this}
         */
        public Builder endpointId(java.lang.String endpointId) {
            this.endpointId = endpointId;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCrossAccountAttachmentResource#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_cross_account_attachment#region GlobalacceleratorCrossAccountAttachment#region}.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlobalacceleratorCrossAccountAttachmentResource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlobalacceleratorCrossAccountAttachmentResource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlobalacceleratorCrossAccountAttachmentResource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlobalacceleratorCrossAccountAttachmentResource {
        private final java.lang.String cidrBlock;
        private final java.lang.String endpointId;
        private final java.lang.String region;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cidrBlock = software.amazon.jsii.Kernel.get(this, "cidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointId = software.amazon.jsii.Kernel.get(this, "endpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cidrBlock = builder.cidrBlock;
            this.endpointId = builder.endpointId;
            this.region = builder.region;
        }

        @Override
        public final java.lang.String getCidrBlock() {
            return this.cidrBlock;
        }

        @Override
        public final java.lang.String getEndpointId() {
            return this.endpointId;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCidrBlock() != null) {
                data.set("cidrBlock", om.valueToTree(this.getCidrBlock()));
            }
            if (this.getEndpointId() != null) {
                data.set("endpointId", om.valueToTree(this.getEndpointId()));
            }
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.globalacceleratorCrossAccountAttachment.GlobalacceleratorCrossAccountAttachmentResource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlobalacceleratorCrossAccountAttachmentResource.Jsii$Proxy that = (GlobalacceleratorCrossAccountAttachmentResource.Jsii$Proxy) o;

            if (this.cidrBlock != null ? !this.cidrBlock.equals(that.cidrBlock) : that.cidrBlock != null) return false;
            if (this.endpointId != null ? !this.endpointId.equals(that.endpointId) : that.endpointId != null) return false;
            return this.region != null ? this.region.equals(that.region) : that.region == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cidrBlock != null ? this.cidrBlock.hashCode() : 0;
            result = 31 * result + (this.endpointId != null ? this.endpointId.hashCode() : 0);
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            return result;
        }
    }
}
