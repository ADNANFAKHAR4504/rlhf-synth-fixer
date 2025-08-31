package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.335Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranches")
@software.amazon.jsii.Jsii.Proxy(CodepipelineTriggerGitConfigurationPushBranches.Jsii$Proxy.class)
public interface CodepipelineTriggerGitConfigurationPushBranches extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIncludes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineTriggerGitConfigurationPushBranches}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineTriggerGitConfigurationPushBranches}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineTriggerGitConfigurationPushBranches> {
        java.util.List<java.lang.String> excludes;
        java.util.List<java.lang.String> includes;

        /**
         * Sets the value of {@link CodepipelineTriggerGitConfigurationPushBranches#getExcludes}
         * @param excludes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#excludes Codepipeline#excludes}.
         * @return {@code this}
         */
        public Builder excludes(java.util.List<java.lang.String> excludes) {
            this.excludes = excludes;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineTriggerGitConfigurationPushBranches#getIncludes}
         * @param includes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#includes Codepipeline#includes}.
         * @return {@code this}
         */
        public Builder includes(java.util.List<java.lang.String> includes) {
            this.includes = includes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineTriggerGitConfigurationPushBranches}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineTriggerGitConfigurationPushBranches build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineTriggerGitConfigurationPushBranches}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineTriggerGitConfigurationPushBranches {
        private final java.util.List<java.lang.String> excludes;
        private final java.util.List<java.lang.String> includes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.excludes = software.amazon.jsii.Kernel.get(this, "excludes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.includes = software.amazon.jsii.Kernel.get(this, "includes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.excludes = builder.excludes;
            this.includes = builder.includes;
        }

        @Override
        public final java.util.List<java.lang.String> getExcludes() {
            return this.excludes;
        }

        @Override
        public final java.util.List<java.lang.String> getIncludes() {
            return this.includes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExcludes() != null) {
                data.set("excludes", om.valueToTree(this.getExcludes()));
            }
            if (this.getIncludes() != null) {
                data.set("includes", om.valueToTree(this.getIncludes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranches"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineTriggerGitConfigurationPushBranches.Jsii$Proxy that = (CodepipelineTriggerGitConfigurationPushBranches.Jsii$Proxy) o;

            if (this.excludes != null ? !this.excludes.equals(that.excludes) : that.excludes != null) return false;
            return this.includes != null ? this.includes.equals(that.includes) : that.includes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.excludes != null ? this.excludes.hashCode() : 0;
            result = 31 * result + (this.includes != null ? this.includes.hashCode() : 0);
            return result;
        }
    }
}
