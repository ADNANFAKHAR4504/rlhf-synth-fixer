package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.329Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineStageBeforeEntry")
@software.amazon.jsii.Jsii.Proxy(CodepipelineStageBeforeEntry.Jsii$Proxy.class)
public interface CodepipelineStageBeforeEntry extends software.amazon.jsii.JsiiSerializable {

    /**
     * condition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#condition Codepipeline#condition}
     */
    @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageBeforeEntryCondition getCondition();

    /**
     * @return a {@link Builder} of {@link CodepipelineStageBeforeEntry}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineStageBeforeEntry}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineStageBeforeEntry> {
        imports.aws.codepipeline.CodepipelineStageBeforeEntryCondition condition;

        /**
         * Sets the value of {@link CodepipelineStageBeforeEntry#getCondition}
         * @param condition condition block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#condition Codepipeline#condition}
         * @return {@code this}
         */
        public Builder condition(imports.aws.codepipeline.CodepipelineStageBeforeEntryCondition condition) {
            this.condition = condition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineStageBeforeEntry}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineStageBeforeEntry build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineStageBeforeEntry}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineStageBeforeEntry {
        private final imports.aws.codepipeline.CodepipelineStageBeforeEntryCondition condition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.condition = software.amazon.jsii.Kernel.get(this, "condition", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageBeforeEntryCondition.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.condition = java.util.Objects.requireNonNull(builder.condition, "condition is required");
        }

        @Override
        public final imports.aws.codepipeline.CodepipelineStageBeforeEntryCondition getCondition() {
            return this.condition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("condition", om.valueToTree(this.getCondition()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipeline.CodepipelineStageBeforeEntry"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineStageBeforeEntry.Jsii$Proxy that = (CodepipelineStageBeforeEntry.Jsii$Proxy) o;

            return this.condition.equals(that.condition);
        }

        @Override
        public final int hashCode() {
            int result = this.condition.hashCode();
            return result;
        }
    }
}
