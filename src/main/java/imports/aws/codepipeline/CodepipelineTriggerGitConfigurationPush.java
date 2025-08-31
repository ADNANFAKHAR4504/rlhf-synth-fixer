package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.335Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineTriggerGitConfigurationPush")
@software.amazon.jsii.Jsii.Proxy(CodepipelineTriggerGitConfigurationPush.Jsii$Proxy.class)
public interface CodepipelineTriggerGitConfigurationPush extends software.amazon.jsii.JsiiSerializable {

    /**
     * branches block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#branches Codepipeline#branches}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranches getBranches() {
        return null;
    }

    /**
     * file_paths block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#file_paths Codepipeline#file_paths}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushFilePaths getFilePaths() {
        return null;
    }

    /**
     * tags block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#tags Codepipeline#tags}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushTags getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineTriggerGitConfigurationPush}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineTriggerGitConfigurationPush}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineTriggerGitConfigurationPush> {
        imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranches branches;
        imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushFilePaths filePaths;
        imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushTags tags;

        /**
         * Sets the value of {@link CodepipelineTriggerGitConfigurationPush#getBranches}
         * @param branches branches block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#branches Codepipeline#branches}
         * @return {@code this}
         */
        public Builder branches(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranches branches) {
            this.branches = branches;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineTriggerGitConfigurationPush#getFilePaths}
         * @param filePaths file_paths block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#file_paths Codepipeline#file_paths}
         * @return {@code this}
         */
        public Builder filePaths(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushFilePaths filePaths) {
            this.filePaths = filePaths;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineTriggerGitConfigurationPush#getTags}
         * @param tags tags block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#tags Codepipeline#tags}
         * @return {@code this}
         */
        public Builder tags(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushTags tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineTriggerGitConfigurationPush}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineTriggerGitConfigurationPush build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineTriggerGitConfigurationPush}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineTriggerGitConfigurationPush {
        private final imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranches branches;
        private final imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushFilePaths filePaths;
        private final imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushTags tags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.branches = software.amazon.jsii.Kernel.get(this, "branches", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranches.class));
            this.filePaths = software.amazon.jsii.Kernel.get(this, "filePaths", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushFilePaths.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushTags.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.branches = builder.branches;
            this.filePaths = builder.filePaths;
            this.tags = builder.tags;
        }

        @Override
        public final imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushBranches getBranches() {
            return this.branches;
        }

        @Override
        public final imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushFilePaths getFilePaths() {
            return this.filePaths;
        }

        @Override
        public final imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushTags getTags() {
            return this.tags;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBranches() != null) {
                data.set("branches", om.valueToTree(this.getBranches()));
            }
            if (this.getFilePaths() != null) {
                data.set("filePaths", om.valueToTree(this.getFilePaths()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipeline.CodepipelineTriggerGitConfigurationPush"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineTriggerGitConfigurationPush.Jsii$Proxy that = (CodepipelineTriggerGitConfigurationPush.Jsii$Proxy) o;

            if (this.branches != null ? !this.branches.equals(that.branches) : that.branches != null) return false;
            if (this.filePaths != null ? !this.filePaths.equals(that.filePaths) : that.filePaths != null) return false;
            return this.tags != null ? this.tags.equals(that.tags) : that.tags == null;
        }

        @Override
        public final int hashCode() {
            int result = this.branches != null ? this.branches.hashCode() : 0;
            result = 31 * result + (this.filePaths != null ? this.filePaths.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            return result;
        }
    }
}
