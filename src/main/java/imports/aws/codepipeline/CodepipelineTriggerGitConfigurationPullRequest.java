package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.332Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequest")
@software.amazon.jsii.Jsii.Proxy(CodepipelineTriggerGitConfigurationPullRequest.Jsii$Proxy.class)
public interface CodepipelineTriggerGitConfigurationPullRequest extends software.amazon.jsii.JsiiSerializable {

    /**
     * branches block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#branches Codepipeline#branches}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranches getBranches() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#events Codepipeline#events}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEvents() {
        return null;
    }

    /**
     * file_paths block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#file_paths Codepipeline#file_paths}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestFilePaths getFilePaths() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineTriggerGitConfigurationPullRequest}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineTriggerGitConfigurationPullRequest}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineTriggerGitConfigurationPullRequest> {
        imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranches branches;
        java.util.List<java.lang.String> events;
        imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestFilePaths filePaths;

        /**
         * Sets the value of {@link CodepipelineTriggerGitConfigurationPullRequest#getBranches}
         * @param branches branches block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#branches Codepipeline#branches}
         * @return {@code this}
         */
        public Builder branches(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranches branches) {
            this.branches = branches;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineTriggerGitConfigurationPullRequest#getEvents}
         * @param events Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#events Codepipeline#events}.
         * @return {@code this}
         */
        public Builder events(java.util.List<java.lang.String> events) {
            this.events = events;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineTriggerGitConfigurationPullRequest#getFilePaths}
         * @param filePaths file_paths block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#file_paths Codepipeline#file_paths}
         * @return {@code this}
         */
        public Builder filePaths(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestFilePaths filePaths) {
            this.filePaths = filePaths;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineTriggerGitConfigurationPullRequest}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineTriggerGitConfigurationPullRequest build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineTriggerGitConfigurationPullRequest}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineTriggerGitConfigurationPullRequest {
        private final imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranches branches;
        private final java.util.List<java.lang.String> events;
        private final imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestFilePaths filePaths;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.branches = software.amazon.jsii.Kernel.get(this, "branches", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranches.class));
            this.events = software.amazon.jsii.Kernel.get(this, "events", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.filePaths = software.amazon.jsii.Kernel.get(this, "filePaths", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestFilePaths.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.branches = builder.branches;
            this.events = builder.events;
            this.filePaths = builder.filePaths;
        }

        @Override
        public final imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestBranches getBranches() {
            return this.branches;
        }

        @Override
        public final java.util.List<java.lang.String> getEvents() {
            return this.events;
        }

        @Override
        public final imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestFilePaths getFilePaths() {
            return this.filePaths;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBranches() != null) {
                data.set("branches", om.valueToTree(this.getBranches()));
            }
            if (this.getEvents() != null) {
                data.set("events", om.valueToTree(this.getEvents()));
            }
            if (this.getFilePaths() != null) {
                data.set("filePaths", om.valueToTree(this.getFilePaths()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequest"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineTriggerGitConfigurationPullRequest.Jsii$Proxy that = (CodepipelineTriggerGitConfigurationPullRequest.Jsii$Proxy) o;

            if (this.branches != null ? !this.branches.equals(that.branches) : that.branches != null) return false;
            if (this.events != null ? !this.events.equals(that.events) : that.events != null) return false;
            return this.filePaths != null ? this.filePaths.equals(that.filePaths) : that.filePaths == null;
        }

        @Override
        public final int hashCode() {
            int result = this.branches != null ? this.branches.hashCode() : 0;
            result = 31 * result + (this.events != null ? this.events.hashCode() : 0);
            result = 31 * result + (this.filePaths != null ? this.filePaths.hashCode() : 0);
            return result;
        }
    }
}
