package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.331Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineTrigger")
@software.amazon.jsii.Jsii.Proxy(CodepipelineTrigger.Jsii$Proxy.class)
public interface CodepipelineTrigger extends software.amazon.jsii.JsiiSerializable {

    /**
     * git_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#git_configuration Codepipeline#git_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineTriggerGitConfiguration getGitConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider_type Codepipeline#provider_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProviderType();

    /**
     * @return a {@link Builder} of {@link CodepipelineTrigger}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineTrigger}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineTrigger> {
        imports.aws.codepipeline.CodepipelineTriggerGitConfiguration gitConfiguration;
        java.lang.String providerType;

        /**
         * Sets the value of {@link CodepipelineTrigger#getGitConfiguration}
         * @param gitConfiguration git_configuration block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#git_configuration Codepipeline#git_configuration}
         * @return {@code this}
         */
        public Builder gitConfiguration(imports.aws.codepipeline.CodepipelineTriggerGitConfiguration gitConfiguration) {
            this.gitConfiguration = gitConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineTrigger#getProviderType}
         * @param providerType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider_type Codepipeline#provider_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder providerType(java.lang.String providerType) {
            this.providerType = providerType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineTrigger}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineTrigger build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineTrigger}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineTrigger {
        private final imports.aws.codepipeline.CodepipelineTriggerGitConfiguration gitConfiguration;
        private final java.lang.String providerType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.gitConfiguration = software.amazon.jsii.Kernel.get(this, "gitConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfiguration.class));
            this.providerType = software.amazon.jsii.Kernel.get(this, "providerType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.gitConfiguration = java.util.Objects.requireNonNull(builder.gitConfiguration, "gitConfiguration is required");
            this.providerType = java.util.Objects.requireNonNull(builder.providerType, "providerType is required");
        }

        @Override
        public final imports.aws.codepipeline.CodepipelineTriggerGitConfiguration getGitConfiguration() {
            return this.gitConfiguration;
        }

        @Override
        public final java.lang.String getProviderType() {
            return this.providerType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("gitConfiguration", om.valueToTree(this.getGitConfiguration()));
            data.set("providerType", om.valueToTree(this.getProviderType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipeline.CodepipelineTrigger"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineTrigger.Jsii$Proxy that = (CodepipelineTrigger.Jsii$Proxy) o;

            if (!gitConfiguration.equals(that.gitConfiguration)) return false;
            return this.providerType.equals(that.providerType);
        }

        @Override
        public final int hashCode() {
            int result = this.gitConfiguration.hashCode();
            result = 31 * result + (this.providerType.hashCode());
            return result;
        }
    }
}
