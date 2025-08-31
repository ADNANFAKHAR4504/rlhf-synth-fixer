package imports.aws.vpclattice_target_group_attachment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.630Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeTargetGroupAttachment.VpclatticeTargetGroupAttachmentTarget")
@software.amazon.jsii.Jsii.Proxy(VpclatticeTargetGroupAttachmentTarget.Jsii$Proxy.class)
public interface VpclatticeTargetGroupAttachmentTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group_attachment#id VpclatticeTargetGroupAttachment#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group_attachment#port VpclatticeTargetGroupAttachment#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpclatticeTargetGroupAttachmentTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeTargetGroupAttachmentTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeTargetGroupAttachmentTarget> {
        java.lang.String id;
        java.lang.Number port;

        /**
         * Sets the value of {@link VpclatticeTargetGroupAttachmentTarget#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group_attachment#id VpclatticeTargetGroupAttachment#id}. This parameter is required.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeTargetGroupAttachmentTarget#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group_attachment#port VpclatticeTargetGroupAttachment#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeTargetGroupAttachmentTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeTargetGroupAttachmentTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeTargetGroupAttachmentTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeTargetGroupAttachmentTarget {
        private final java.lang.String id;
        private final java.lang.Number port;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
            this.port = builder.port;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("id", om.valueToTree(this.getId()));
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeTargetGroupAttachment.VpclatticeTargetGroupAttachmentTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeTargetGroupAttachmentTarget.Jsii$Proxy that = (VpclatticeTargetGroupAttachmentTarget.Jsii$Proxy) o;

            if (!id.equals(that.id)) return false;
            return this.port != null ? this.port.equals(that.port) : that.port == null;
        }

        @Override
        public final int hashCode() {
            int result = this.id.hashCode();
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            return result;
        }
    }
}
