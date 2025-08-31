package imports.aws.bedrock_inference_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.149Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockInferenceProfile.BedrockInferenceProfileModelSource")
@software.amazon.jsii.Jsii.Proxy(BedrockInferenceProfileModelSource.Jsii$Proxy.class)
public interface BedrockInferenceProfileModelSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_inference_profile#copy_from BedrockInferenceProfile#copy_from}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCopyFrom();

    /**
     * @return a {@link Builder} of {@link BedrockInferenceProfileModelSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockInferenceProfileModelSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockInferenceProfileModelSource> {
        java.lang.String copyFrom;

        /**
         * Sets the value of {@link BedrockInferenceProfileModelSource#getCopyFrom}
         * @param copyFrom Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_inference_profile#copy_from BedrockInferenceProfile#copy_from}. This parameter is required.
         * @return {@code this}
         */
        public Builder copyFrom(java.lang.String copyFrom) {
            this.copyFrom = copyFrom;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockInferenceProfileModelSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockInferenceProfileModelSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockInferenceProfileModelSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockInferenceProfileModelSource {
        private final java.lang.String copyFrom;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.copyFrom = software.amazon.jsii.Kernel.get(this, "copyFrom", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.copyFrom = java.util.Objects.requireNonNull(builder.copyFrom, "copyFrom is required");
        }

        @Override
        public final java.lang.String getCopyFrom() {
            return this.copyFrom;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("copyFrom", om.valueToTree(this.getCopyFrom()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockInferenceProfile.BedrockInferenceProfileModelSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockInferenceProfileModelSource.Jsii$Proxy that = (BedrockInferenceProfileModelSource.Jsii$Proxy) o;

            return this.copyFrom.equals(that.copyFrom);
        }

        @Override
        public final int hashCode() {
            int result = this.copyFrom.hashCode();
            return result;
        }
    }
}
