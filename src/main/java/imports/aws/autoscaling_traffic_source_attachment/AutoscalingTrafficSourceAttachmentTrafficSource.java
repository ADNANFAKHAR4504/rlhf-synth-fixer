package imports.aws.autoscaling_traffic_source_attachment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.110Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingTrafficSourceAttachment.AutoscalingTrafficSourceAttachmentTrafficSource")
@software.amazon.jsii.Jsii.Proxy(AutoscalingTrafficSourceAttachmentTrafficSource.Jsii$Proxy.class)
public interface AutoscalingTrafficSourceAttachmentTrafficSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_traffic_source_attachment#identifier AutoscalingTrafficSourceAttachment#identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_traffic_source_attachment#type AutoscalingTrafficSourceAttachment#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * @return a {@link Builder} of {@link AutoscalingTrafficSourceAttachmentTrafficSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingTrafficSourceAttachmentTrafficSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingTrafficSourceAttachmentTrafficSource> {
        java.lang.String identifier;
        java.lang.String type;

        /**
         * Sets the value of {@link AutoscalingTrafficSourceAttachmentTrafficSource#getIdentifier}
         * @param identifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_traffic_source_attachment#identifier AutoscalingTrafficSourceAttachment#identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder identifier(java.lang.String identifier) {
            this.identifier = identifier;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingTrafficSourceAttachmentTrafficSource#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_traffic_source_attachment#type AutoscalingTrafficSourceAttachment#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingTrafficSourceAttachmentTrafficSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingTrafficSourceAttachmentTrafficSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingTrafficSourceAttachmentTrafficSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingTrafficSourceAttachmentTrafficSource {
        private final java.lang.String identifier;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.identifier = software.amazon.jsii.Kernel.get(this, "identifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.identifier = java.util.Objects.requireNonNull(builder.identifier, "identifier is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
        }

        @Override
        public final java.lang.String getIdentifier() {
            return this.identifier;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("identifier", om.valueToTree(this.getIdentifier()));
            data.set("type", om.valueToTree(this.getType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingTrafficSourceAttachment.AutoscalingTrafficSourceAttachmentTrafficSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingTrafficSourceAttachmentTrafficSource.Jsii$Proxy that = (AutoscalingTrafficSourceAttachmentTrafficSource.Jsii$Proxy) o;

            if (!identifier.equals(that.identifier)) return false;
            return this.type.equals(that.type);
        }

        @Override
        public final int hashCode() {
            int result = this.identifier.hashCode();
            result = 31 * result + (this.type.hashCode());
            return result;
        }
    }
}
