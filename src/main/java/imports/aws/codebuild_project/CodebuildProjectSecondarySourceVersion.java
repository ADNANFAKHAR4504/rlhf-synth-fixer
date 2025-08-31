package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.304Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectSecondarySourceVersion")
@software.amazon.jsii.Jsii.Proxy(CodebuildProjectSecondarySourceVersion.Jsii$Proxy.class)
public interface CodebuildProjectSecondarySourceVersion extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#source_identifier CodebuildProject#source_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#source_version CodebuildProject#source_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceVersion();

    /**
     * @return a {@link Builder} of {@link CodebuildProjectSecondarySourceVersion}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildProjectSecondarySourceVersion}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildProjectSecondarySourceVersion> {
        java.lang.String sourceIdentifier;
        java.lang.String sourceVersion;

        /**
         * Sets the value of {@link CodebuildProjectSecondarySourceVersion#getSourceIdentifier}
         * @param sourceIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#source_identifier CodebuildProject#source_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceIdentifier(java.lang.String sourceIdentifier) {
            this.sourceIdentifier = sourceIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectSecondarySourceVersion#getSourceVersion}
         * @param sourceVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#source_version CodebuildProject#source_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceVersion(java.lang.String sourceVersion) {
            this.sourceVersion = sourceVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildProjectSecondarySourceVersion}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildProjectSecondarySourceVersion build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildProjectSecondarySourceVersion}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildProjectSecondarySourceVersion {
        private final java.lang.String sourceIdentifier;
        private final java.lang.String sourceVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sourceIdentifier = software.amazon.jsii.Kernel.get(this, "sourceIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceVersion = software.amazon.jsii.Kernel.get(this, "sourceVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sourceIdentifier = java.util.Objects.requireNonNull(builder.sourceIdentifier, "sourceIdentifier is required");
            this.sourceVersion = java.util.Objects.requireNonNull(builder.sourceVersion, "sourceVersion is required");
        }

        @Override
        public final java.lang.String getSourceIdentifier() {
            return this.sourceIdentifier;
        }

        @Override
        public final java.lang.String getSourceVersion() {
            return this.sourceVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("sourceIdentifier", om.valueToTree(this.getSourceIdentifier()));
            data.set("sourceVersion", om.valueToTree(this.getSourceVersion()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildProject.CodebuildProjectSecondarySourceVersion"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildProjectSecondarySourceVersion.Jsii$Proxy that = (CodebuildProjectSecondarySourceVersion.Jsii$Proxy) o;

            if (!sourceIdentifier.equals(that.sourceIdentifier)) return false;
            return this.sourceVersion.equals(that.sourceVersion);
        }

        @Override
        public final int hashCode() {
            int result = this.sourceIdentifier.hashCode();
            result = 31 * result + (this.sourceVersion.hashCode());
            return result;
        }
    }
}
