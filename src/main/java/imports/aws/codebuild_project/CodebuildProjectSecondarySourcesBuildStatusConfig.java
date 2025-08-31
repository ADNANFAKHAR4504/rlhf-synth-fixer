package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.305Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectSecondarySourcesBuildStatusConfig")
@software.amazon.jsii.Jsii.Proxy(CodebuildProjectSecondarySourcesBuildStatusConfig.Jsii$Proxy.class)
public interface CodebuildProjectSecondarySourcesBuildStatusConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#context CodebuildProject#context}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContext() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#target_url CodebuildProject#target_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetUrl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildProjectSecondarySourcesBuildStatusConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildProjectSecondarySourcesBuildStatusConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildProjectSecondarySourcesBuildStatusConfig> {
        java.lang.String context;
        java.lang.String targetUrl;

        /**
         * Sets the value of {@link CodebuildProjectSecondarySourcesBuildStatusConfig#getContext}
         * @param context Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#context CodebuildProject#context}.
         * @return {@code this}
         */
        public Builder context(java.lang.String context) {
            this.context = context;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectSecondarySourcesBuildStatusConfig#getTargetUrl}
         * @param targetUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#target_url CodebuildProject#target_url}.
         * @return {@code this}
         */
        public Builder targetUrl(java.lang.String targetUrl) {
            this.targetUrl = targetUrl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildProjectSecondarySourcesBuildStatusConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildProjectSecondarySourcesBuildStatusConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildProjectSecondarySourcesBuildStatusConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildProjectSecondarySourcesBuildStatusConfig {
        private final java.lang.String context;
        private final java.lang.String targetUrl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.context = software.amazon.jsii.Kernel.get(this, "context", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetUrl = software.amazon.jsii.Kernel.get(this, "targetUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.context = builder.context;
            this.targetUrl = builder.targetUrl;
        }

        @Override
        public final java.lang.String getContext() {
            return this.context;
        }

        @Override
        public final java.lang.String getTargetUrl() {
            return this.targetUrl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContext() != null) {
                data.set("context", om.valueToTree(this.getContext()));
            }
            if (this.getTargetUrl() != null) {
                data.set("targetUrl", om.valueToTree(this.getTargetUrl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildProject.CodebuildProjectSecondarySourcesBuildStatusConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildProjectSecondarySourcesBuildStatusConfig.Jsii$Proxy that = (CodebuildProjectSecondarySourcesBuildStatusConfig.Jsii$Proxy) o;

            if (this.context != null ? !this.context.equals(that.context) : that.context != null) return false;
            return this.targetUrl != null ? this.targetUrl.equals(that.targetUrl) : that.targetUrl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.context != null ? this.context.hashCode() : 0;
            result = 31 * result + (this.targetUrl != null ? this.targetUrl.hashCode() : 0);
            return result;
        }
    }
}
