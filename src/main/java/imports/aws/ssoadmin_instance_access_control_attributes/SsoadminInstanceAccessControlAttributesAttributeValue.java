package imports.aws.ssoadmin_instance_access_control_attributes;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.524Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssoadminInstanceAccessControlAttributes.SsoadminInstanceAccessControlAttributesAttributeValue")
@software.amazon.jsii.Jsii.Proxy(SsoadminInstanceAccessControlAttributesAttributeValue.Jsii$Proxy.class)
public interface SsoadminInstanceAccessControlAttributesAttributeValue extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_instance_access_control_attributes#source SsoadminInstanceAccessControlAttributes#source}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSource();

    /**
     * @return a {@link Builder} of {@link SsoadminInstanceAccessControlAttributesAttributeValue}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsoadminInstanceAccessControlAttributesAttributeValue}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsoadminInstanceAccessControlAttributesAttributeValue> {
        java.util.List<java.lang.String> source;

        /**
         * Sets the value of {@link SsoadminInstanceAccessControlAttributesAttributeValue#getSource}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssoadmin_instance_access_control_attributes#source SsoadminInstanceAccessControlAttributes#source}. This parameter is required.
         * @return {@code this}
         */
        public Builder source(java.util.List<java.lang.String> source) {
            this.source = source;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsoadminInstanceAccessControlAttributesAttributeValue}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsoadminInstanceAccessControlAttributesAttributeValue build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsoadminInstanceAccessControlAttributesAttributeValue}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsoadminInstanceAccessControlAttributesAttributeValue {
        private final java.util.List<java.lang.String> source;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
        }

        @Override
        public final java.util.List<java.lang.String> getSource() {
            return this.source;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("source", om.valueToTree(this.getSource()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssoadminInstanceAccessControlAttributes.SsoadminInstanceAccessControlAttributesAttributeValue"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsoadminInstanceAccessControlAttributesAttributeValue.Jsii$Proxy that = (SsoadminInstanceAccessControlAttributesAttributeValue.Jsii$Proxy) o;

            return this.source.equals(that.source);
        }

        @Override
        public final int hashCode() {
            int result = this.source.hashCode();
            return result;
        }
    }
}
