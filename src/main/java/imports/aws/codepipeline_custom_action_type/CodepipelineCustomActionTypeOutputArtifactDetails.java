package imports.aws.codepipeline_custom_action_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.336Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipelineCustomActionType.CodepipelineCustomActionTypeOutputArtifactDetails")
@software.amazon.jsii.Jsii.Proxy(CodepipelineCustomActionTypeOutputArtifactDetails.Jsii$Proxy.class)
public interface CodepipelineCustomActionTypeOutputArtifactDetails extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#maximum_count CodepipelineCustomActionType#maximum_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaximumCount();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#minimum_count CodepipelineCustomActionType#minimum_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMinimumCount();

    /**
     * @return a {@link Builder} of {@link CodepipelineCustomActionTypeOutputArtifactDetails}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineCustomActionTypeOutputArtifactDetails}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineCustomActionTypeOutputArtifactDetails> {
        java.lang.Number maximumCount;
        java.lang.Number minimumCount;

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeOutputArtifactDetails#getMaximumCount}
         * @param maximumCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#maximum_count CodepipelineCustomActionType#maximum_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder maximumCount(java.lang.Number maximumCount) {
            this.maximumCount = maximumCount;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeOutputArtifactDetails#getMinimumCount}
         * @param minimumCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#minimum_count CodepipelineCustomActionType#minimum_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder minimumCount(java.lang.Number minimumCount) {
            this.minimumCount = minimumCount;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineCustomActionTypeOutputArtifactDetails}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineCustomActionTypeOutputArtifactDetails build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineCustomActionTypeOutputArtifactDetails}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineCustomActionTypeOutputArtifactDetails {
        private final java.lang.Number maximumCount;
        private final java.lang.Number minimumCount;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maximumCount = software.amazon.jsii.Kernel.get(this, "maximumCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minimumCount = software.amazon.jsii.Kernel.get(this, "minimumCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maximumCount = java.util.Objects.requireNonNull(builder.maximumCount, "maximumCount is required");
            this.minimumCount = java.util.Objects.requireNonNull(builder.minimumCount, "minimumCount is required");
        }

        @Override
        public final java.lang.Number getMaximumCount() {
            return this.maximumCount;
        }

        @Override
        public final java.lang.Number getMinimumCount() {
            return this.minimumCount;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maximumCount", om.valueToTree(this.getMaximumCount()));
            data.set("minimumCount", om.valueToTree(this.getMinimumCount()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipelineCustomActionType.CodepipelineCustomActionTypeOutputArtifactDetails"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineCustomActionTypeOutputArtifactDetails.Jsii$Proxy that = (CodepipelineCustomActionTypeOutputArtifactDetails.Jsii$Proxy) o;

            if (!maximumCount.equals(that.maximumCount)) return false;
            return this.minimumCount.equals(that.minimumCount);
        }

        @Override
        public final int hashCode() {
            int result = this.maximumCount.hashCode();
            result = 31 * result + (this.minimumCount.hashCode());
            return result;
        }
    }
}
