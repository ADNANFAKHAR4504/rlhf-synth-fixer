package imports.aws.osis_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.050Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.osisPipeline.OsisPipelineBufferOptions")
@software.amazon.jsii.Jsii.Proxy(OsisPipelineBufferOptions.Jsii$Proxy.class)
public interface OsisPipelineBufferOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#persistent_buffer_enabled OsisPipeline#persistent_buffer_enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getPersistentBufferEnabled();

    /**
     * @return a {@link Builder} of {@link OsisPipelineBufferOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OsisPipelineBufferOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OsisPipelineBufferOptions> {
        java.lang.Object persistentBufferEnabled;

        /**
         * Sets the value of {@link OsisPipelineBufferOptions#getPersistentBufferEnabled}
         * @param persistentBufferEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#persistent_buffer_enabled OsisPipeline#persistent_buffer_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder persistentBufferEnabled(java.lang.Boolean persistentBufferEnabled) {
            this.persistentBufferEnabled = persistentBufferEnabled;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineBufferOptions#getPersistentBufferEnabled}
         * @param persistentBufferEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#persistent_buffer_enabled OsisPipeline#persistent_buffer_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder persistentBufferEnabled(com.hashicorp.cdktf.IResolvable persistentBufferEnabled) {
            this.persistentBufferEnabled = persistentBufferEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OsisPipelineBufferOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OsisPipelineBufferOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OsisPipelineBufferOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OsisPipelineBufferOptions {
        private final java.lang.Object persistentBufferEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.persistentBufferEnabled = software.amazon.jsii.Kernel.get(this, "persistentBufferEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.persistentBufferEnabled = java.util.Objects.requireNonNull(builder.persistentBufferEnabled, "persistentBufferEnabled is required");
        }

        @Override
        public final java.lang.Object getPersistentBufferEnabled() {
            return this.persistentBufferEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("persistentBufferEnabled", om.valueToTree(this.getPersistentBufferEnabled()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.osisPipeline.OsisPipelineBufferOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OsisPipelineBufferOptions.Jsii$Proxy that = (OsisPipelineBufferOptions.Jsii$Proxy) o;

            return this.persistentBufferEnabled.equals(that.persistentBufferEnabled);
        }

        @Override
        public final int hashCode() {
            int result = this.persistentBufferEnabled.hashCode();
            return result;
        }
    }
}
