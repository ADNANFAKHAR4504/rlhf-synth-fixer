package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.330Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineStageOnSuccessCondition")
@software.amazon.jsii.Jsii.Proxy(CodepipelineStageOnSuccessCondition.Jsii$Proxy.class)
public interface CodepipelineStageOnSuccessCondition extends software.amazon.jsii.JsiiSerializable {

    /**
     * rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule Codepipeline#rule}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getRule();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResult() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineStageOnSuccessCondition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineStageOnSuccessCondition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineStageOnSuccessCondition> {
        java.lang.Object rule;
        java.lang.String result;

        /**
         * Sets the value of {@link CodepipelineStageOnSuccessCondition#getRule}
         * @param rule rule block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule Codepipeline#rule}
         * @return {@code this}
         */
        public Builder rule(com.hashicorp.cdktf.IResolvable rule) {
            this.rule = rule;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnSuccessCondition#getRule}
         * @param rule rule block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#rule Codepipeline#rule}
         * @return {@code this}
         */
        public Builder rule(java.util.List<? extends imports.aws.codepipeline.CodepipelineStageOnSuccessConditionRule> rule) {
            this.rule = rule;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnSuccessCondition#getResult}
         * @param result Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.
         * @return {@code this}
         */
        public Builder result(java.lang.String result) {
            this.result = result;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineStageOnSuccessCondition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineStageOnSuccessCondition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineStageOnSuccessCondition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineStageOnSuccessCondition {
        private final java.lang.Object rule;
        private final java.lang.String result;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.rule = software.amazon.jsii.Kernel.get(this, "rule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.result = software.amazon.jsii.Kernel.get(this, "result", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.rule = java.util.Objects.requireNonNull(builder.rule, "rule is required");
            this.result = builder.result;
        }

        @Override
        public final java.lang.Object getRule() {
            return this.rule;
        }

        @Override
        public final java.lang.String getResult() {
            return this.result;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("rule", om.valueToTree(this.getRule()));
            if (this.getResult() != null) {
                data.set("result", om.valueToTree(this.getResult()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipeline.CodepipelineStageOnSuccessCondition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineStageOnSuccessCondition.Jsii$Proxy that = (CodepipelineStageOnSuccessCondition.Jsii$Proxy) o;

            if (!rule.equals(that.rule)) return false;
            return this.result != null ? this.result.equals(that.result) : that.result == null;
        }

        @Override
        public final int hashCode() {
            int result = this.rule.hashCode();
            result = 31 * result + (this.result != null ? this.result.hashCode() : 0);
            return result;
        }
    }
}
