package imports.aws.bedrock_custom_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.140Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockCustomModel.BedrockCustomModelValidationDataConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockCustomModelValidationDataConfig.Jsii$Proxy.class)
public interface BedrockCustomModelValidationDataConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * validator block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#validator BedrockCustomModel#validator}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getValidator() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockCustomModelValidationDataConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockCustomModelValidationDataConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockCustomModelValidationDataConfig> {
        java.lang.Object validator;

        /**
         * Sets the value of {@link BedrockCustomModelValidationDataConfig#getValidator}
         * @param validator validator block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#validator BedrockCustomModel#validator}
         * @return {@code this}
         */
        public Builder validator(com.hashicorp.cdktf.IResolvable validator) {
            this.validator = validator;
            return this;
        }

        /**
         * Sets the value of {@link BedrockCustomModelValidationDataConfig#getValidator}
         * @param validator validator block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrock_custom_model#validator BedrockCustomModel#validator}
         * @return {@code this}
         */
        public Builder validator(java.util.List<? extends imports.aws.bedrock_custom_model.BedrockCustomModelValidationDataConfigValidator> validator) {
            this.validator = validator;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockCustomModelValidationDataConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockCustomModelValidationDataConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockCustomModelValidationDataConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockCustomModelValidationDataConfig {
        private final java.lang.Object validator;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.validator = software.amazon.jsii.Kernel.get(this, "validator", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.validator = builder.validator;
        }

        @Override
        public final java.lang.Object getValidator() {
            return this.validator;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getValidator() != null) {
                data.set("validator", om.valueToTree(this.getValidator()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockCustomModel.BedrockCustomModelValidationDataConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockCustomModelValidationDataConfig.Jsii$Proxy that = (BedrockCustomModelValidationDataConfig.Jsii$Proxy) o;

            return this.validator != null ? this.validator.equals(that.validator) : that.validator == null;
        }

        @Override
        public final int hashCode() {
            int result = this.validator != null ? this.validator.hashCode() : 0;
            return result;
        }
    }
}
