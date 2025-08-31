package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.311Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings.Jsii$Proxy.class)
public interface SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#amazon_bedrock_role_arn SagemakerDomain#amazon_bedrock_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAmazonBedrockRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings> {
        java.lang.String amazonBedrockRoleArn;

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings#getAmazonBedrockRoleArn}
         * @param amazonBedrockRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#amazon_bedrock_role_arn SagemakerDomain#amazon_bedrock_role_arn}.
         * @return {@code this}
         */
        public Builder amazonBedrockRoleArn(java.lang.String amazonBedrockRoleArn) {
            this.amazonBedrockRoleArn = amazonBedrockRoleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings {
        private final java.lang.String amazonBedrockRoleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.amazonBedrockRoleArn = software.amazon.jsii.Kernel.get(this, "amazonBedrockRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.amazonBedrockRoleArn = builder.amazonBedrockRoleArn;
        }

        @Override
        public final java.lang.String getAmazonBedrockRoleArn() {
            return this.amazonBedrockRoleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAmazonBedrockRoleArn() != null) {
                data.set("amazonBedrockRoleArn", om.valueToTree(this.getAmazonBedrockRoleArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings.Jsii$Proxy that = (SagemakerDomainDefaultUserSettingsCanvasAppSettingsGenerativeAiSettings.Jsii$Proxy) o;

            return this.amazonBedrockRoleArn != null ? this.amazonBedrockRoleArn.equals(that.amazonBedrockRoleArn) : that.amazonBedrockRoleArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.amazonBedrockRoleArn != null ? this.amazonBedrockRoleArn.hashCode() : 0;
            return result;
        }
    }
}
