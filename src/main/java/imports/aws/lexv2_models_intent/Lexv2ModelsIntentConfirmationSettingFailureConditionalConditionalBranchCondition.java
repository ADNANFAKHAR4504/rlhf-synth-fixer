package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.644Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition.Jsii$Proxy.class)
public interface Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#expression_string Lexv2ModelsIntent#expression_string}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExpressionString();

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition> {
        java.lang.String expressionString;

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition#getExpressionString}
         * @param expressionString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#expression_string Lexv2ModelsIntent#expression_string}. This parameter is required.
         * @return {@code this}
         */
        public Builder expressionString(java.lang.String expressionString) {
            this.expressionString = expressionString;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition {
        private final java.lang.String expressionString;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.expressionString = software.amazon.jsii.Kernel.get(this, "expressionString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.expressionString = java.util.Objects.requireNonNull(builder.expressionString, "expressionString is required");
        }

        @Override
        public final java.lang.String getExpressionString() {
            return this.expressionString;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("expressionString", om.valueToTree(this.getExpressionString()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition.Jsii$Proxy that = (Lexv2ModelsIntentConfirmationSettingFailureConditionalConditionalBranchCondition.Jsii$Proxy) o;

            return this.expressionString.equals(that.expressionString);
        }

        @Override
        public final int hashCode() {
            int result = this.expressionString.hashCode();
            return result;
        }
    }
}
