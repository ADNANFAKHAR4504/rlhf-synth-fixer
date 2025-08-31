package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.300Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectBuildBatchConfigRestrictions")
@software.amazon.jsii.Jsii.Proxy(CodebuildProjectBuildBatchConfigRestrictions.Jsii$Proxy.class)
public interface CodebuildProjectBuildBatchConfigRestrictions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#compute_types_allowed CodebuildProject#compute_types_allowed}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getComputeTypesAllowed() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#maximum_builds_allowed CodebuildProject#maximum_builds_allowed}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumBuildsAllowed() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildProjectBuildBatchConfigRestrictions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildProjectBuildBatchConfigRestrictions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildProjectBuildBatchConfigRestrictions> {
        java.util.List<java.lang.String> computeTypesAllowed;
        java.lang.Number maximumBuildsAllowed;

        /**
         * Sets the value of {@link CodebuildProjectBuildBatchConfigRestrictions#getComputeTypesAllowed}
         * @param computeTypesAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#compute_types_allowed CodebuildProject#compute_types_allowed}.
         * @return {@code this}
         */
        public Builder computeTypesAllowed(java.util.List<java.lang.String> computeTypesAllowed) {
            this.computeTypesAllowed = computeTypesAllowed;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectBuildBatchConfigRestrictions#getMaximumBuildsAllowed}
         * @param maximumBuildsAllowed Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#maximum_builds_allowed CodebuildProject#maximum_builds_allowed}.
         * @return {@code this}
         */
        public Builder maximumBuildsAllowed(java.lang.Number maximumBuildsAllowed) {
            this.maximumBuildsAllowed = maximumBuildsAllowed;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildProjectBuildBatchConfigRestrictions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildProjectBuildBatchConfigRestrictions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildProjectBuildBatchConfigRestrictions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildProjectBuildBatchConfigRestrictions {
        private final java.util.List<java.lang.String> computeTypesAllowed;
        private final java.lang.Number maximumBuildsAllowed;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.computeTypesAllowed = software.amazon.jsii.Kernel.get(this, "computeTypesAllowed", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.maximumBuildsAllowed = software.amazon.jsii.Kernel.get(this, "maximumBuildsAllowed", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.computeTypesAllowed = builder.computeTypesAllowed;
            this.maximumBuildsAllowed = builder.maximumBuildsAllowed;
        }

        @Override
        public final java.util.List<java.lang.String> getComputeTypesAllowed() {
            return this.computeTypesAllowed;
        }

        @Override
        public final java.lang.Number getMaximumBuildsAllowed() {
            return this.maximumBuildsAllowed;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getComputeTypesAllowed() != null) {
                data.set("computeTypesAllowed", om.valueToTree(this.getComputeTypesAllowed()));
            }
            if (this.getMaximumBuildsAllowed() != null) {
                data.set("maximumBuildsAllowed", om.valueToTree(this.getMaximumBuildsAllowed()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildProject.CodebuildProjectBuildBatchConfigRestrictions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildProjectBuildBatchConfigRestrictions.Jsii$Proxy that = (CodebuildProjectBuildBatchConfigRestrictions.Jsii$Proxy) o;

            if (this.computeTypesAllowed != null ? !this.computeTypesAllowed.equals(that.computeTypesAllowed) : that.computeTypesAllowed != null) return false;
            return this.maximumBuildsAllowed != null ? this.maximumBuildsAllowed.equals(that.maximumBuildsAllowed) : that.maximumBuildsAllowed == null;
        }

        @Override
        public final int hashCode() {
            int result = this.computeTypesAllowed != null ? this.computeTypesAllowed.hashCode() : 0;
            result = 31 * result + (this.maximumBuildsAllowed != null ? this.maximumBuildsAllowed.hashCode() : 0);
            return result;
        }
    }
}
