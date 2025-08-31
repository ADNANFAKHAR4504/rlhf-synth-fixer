package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.330Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineStageOnFailure")
@software.amazon.jsii.Jsii.Proxy(CodepipelineStageOnFailure.Jsii$Proxy.class)
public interface CodepipelineStageOnFailure extends software.amazon.jsii.JsiiSerializable {

    /**
     * condition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#condition Codepipeline#condition}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageOnFailureCondition getCondition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResult() {
        return null;
    }

    /**
     * retry_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#retry_configuration Codepipeline#retry_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration getRetryConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineStageOnFailure}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineStageOnFailure}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineStageOnFailure> {
        imports.aws.codepipeline.CodepipelineStageOnFailureCondition condition;
        java.lang.String result;
        imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration retryConfiguration;

        /**
         * Sets the value of {@link CodepipelineStageOnFailure#getCondition}
         * @param condition condition block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#condition Codepipeline#condition}
         * @return {@code this}
         */
        public Builder condition(imports.aws.codepipeline.CodepipelineStageOnFailureCondition condition) {
            this.condition = condition;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnFailure#getResult}
         * @param result Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#result Codepipeline#result}.
         * @return {@code this}
         */
        public Builder result(java.lang.String result) {
            this.result = result;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnFailure#getRetryConfiguration}
         * @param retryConfiguration retry_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#retry_configuration Codepipeline#retry_configuration}
         * @return {@code this}
         */
        public Builder retryConfiguration(imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration retryConfiguration) {
            this.retryConfiguration = retryConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineStageOnFailure}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineStageOnFailure build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineStageOnFailure}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineStageOnFailure {
        private final imports.aws.codepipeline.CodepipelineStageOnFailureCondition condition;
        private final java.lang.String result;
        private final imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration retryConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.condition = software.amazon.jsii.Kernel.get(this, "condition", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnFailureCondition.class));
            this.result = software.amazon.jsii.Kernel.get(this, "result", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.retryConfiguration = software.amazon.jsii.Kernel.get(this, "retryConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.condition = builder.condition;
            this.result = builder.result;
            this.retryConfiguration = builder.retryConfiguration;
        }

        @Override
        public final imports.aws.codepipeline.CodepipelineStageOnFailureCondition getCondition() {
            return this.condition;
        }

        @Override
        public final java.lang.String getResult() {
            return this.result;
        }

        @Override
        public final imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration getRetryConfiguration() {
            return this.retryConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCondition() != null) {
                data.set("condition", om.valueToTree(this.getCondition()));
            }
            if (this.getResult() != null) {
                data.set("result", om.valueToTree(this.getResult()));
            }
            if (this.getRetryConfiguration() != null) {
                data.set("retryConfiguration", om.valueToTree(this.getRetryConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipeline.CodepipelineStageOnFailure"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineStageOnFailure.Jsii$Proxy that = (CodepipelineStageOnFailure.Jsii$Proxy) o;

            if (this.condition != null ? !this.condition.equals(that.condition) : that.condition != null) return false;
            if (this.result != null ? !this.result.equals(that.result) : that.result != null) return false;
            return this.retryConfiguration != null ? this.retryConfiguration.equals(that.retryConfiguration) : that.retryConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.condition != null ? this.condition.hashCode() : 0;
            result = 31 * result + (this.result != null ? this.result.hashCode() : 0);
            result = 31 * result + (this.retryConfiguration != null ? this.retryConfiguration.hashCode() : 0);
            return result;
        }
    }
}
