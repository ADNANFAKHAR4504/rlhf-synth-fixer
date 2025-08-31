package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.300Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectBuildBatchConfig")
@software.amazon.jsii.Jsii.Proxy(CodebuildProjectBuildBatchConfig.Jsii$Proxy.class)
public interface CodebuildProjectBuildBatchConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#service_role CodebuildProject#service_role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceRole();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#combine_artifacts CodebuildProject#combine_artifacts}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCombineArtifacts() {
        return null;
    }

    /**
     * restrictions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#restrictions CodebuildProject#restrictions}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectBuildBatchConfigRestrictions getRestrictions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#timeout_in_mins CodebuildProject#timeout_in_mins}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutInMins() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildProjectBuildBatchConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildProjectBuildBatchConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildProjectBuildBatchConfig> {
        java.lang.String serviceRole;
        java.lang.Object combineArtifacts;
        imports.aws.codebuild_project.CodebuildProjectBuildBatchConfigRestrictions restrictions;
        java.lang.Number timeoutInMins;

        /**
         * Sets the value of {@link CodebuildProjectBuildBatchConfig#getServiceRole}
         * @param serviceRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#service_role CodebuildProject#service_role}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceRole(java.lang.String serviceRole) {
            this.serviceRole = serviceRole;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectBuildBatchConfig#getCombineArtifacts}
         * @param combineArtifacts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#combine_artifacts CodebuildProject#combine_artifacts}.
         * @return {@code this}
         */
        public Builder combineArtifacts(java.lang.Boolean combineArtifacts) {
            this.combineArtifacts = combineArtifacts;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectBuildBatchConfig#getCombineArtifacts}
         * @param combineArtifacts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#combine_artifacts CodebuildProject#combine_artifacts}.
         * @return {@code this}
         */
        public Builder combineArtifacts(com.hashicorp.cdktf.IResolvable combineArtifacts) {
            this.combineArtifacts = combineArtifacts;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectBuildBatchConfig#getRestrictions}
         * @param restrictions restrictions block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#restrictions CodebuildProject#restrictions}
         * @return {@code this}
         */
        public Builder restrictions(imports.aws.codebuild_project.CodebuildProjectBuildBatchConfigRestrictions restrictions) {
            this.restrictions = restrictions;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectBuildBatchConfig#getTimeoutInMins}
         * @param timeoutInMins Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#timeout_in_mins CodebuildProject#timeout_in_mins}.
         * @return {@code this}
         */
        public Builder timeoutInMins(java.lang.Number timeoutInMins) {
            this.timeoutInMins = timeoutInMins;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildProjectBuildBatchConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildProjectBuildBatchConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildProjectBuildBatchConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildProjectBuildBatchConfig {
        private final java.lang.String serviceRole;
        private final java.lang.Object combineArtifacts;
        private final imports.aws.codebuild_project.CodebuildProjectBuildBatchConfigRestrictions restrictions;
        private final java.lang.Number timeoutInMins;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.serviceRole = software.amazon.jsii.Kernel.get(this, "serviceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.combineArtifacts = software.amazon.jsii.Kernel.get(this, "combineArtifacts", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.restrictions = software.amazon.jsii.Kernel.get(this, "restrictions", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectBuildBatchConfigRestrictions.class));
            this.timeoutInMins = software.amazon.jsii.Kernel.get(this, "timeoutInMins", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.serviceRole = java.util.Objects.requireNonNull(builder.serviceRole, "serviceRole is required");
            this.combineArtifacts = builder.combineArtifacts;
            this.restrictions = builder.restrictions;
            this.timeoutInMins = builder.timeoutInMins;
        }

        @Override
        public final java.lang.String getServiceRole() {
            return this.serviceRole;
        }

        @Override
        public final java.lang.Object getCombineArtifacts() {
            return this.combineArtifacts;
        }

        @Override
        public final imports.aws.codebuild_project.CodebuildProjectBuildBatchConfigRestrictions getRestrictions() {
            return this.restrictions;
        }

        @Override
        public final java.lang.Number getTimeoutInMins() {
            return this.timeoutInMins;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("serviceRole", om.valueToTree(this.getServiceRole()));
            if (this.getCombineArtifacts() != null) {
                data.set("combineArtifacts", om.valueToTree(this.getCombineArtifacts()));
            }
            if (this.getRestrictions() != null) {
                data.set("restrictions", om.valueToTree(this.getRestrictions()));
            }
            if (this.getTimeoutInMins() != null) {
                data.set("timeoutInMins", om.valueToTree(this.getTimeoutInMins()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildProject.CodebuildProjectBuildBatchConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildProjectBuildBatchConfig.Jsii$Proxy that = (CodebuildProjectBuildBatchConfig.Jsii$Proxy) o;

            if (!serviceRole.equals(that.serviceRole)) return false;
            if (this.combineArtifacts != null ? !this.combineArtifacts.equals(that.combineArtifacts) : that.combineArtifacts != null) return false;
            if (this.restrictions != null ? !this.restrictions.equals(that.restrictions) : that.restrictions != null) return false;
            return this.timeoutInMins != null ? this.timeoutInMins.equals(that.timeoutInMins) : that.timeoutInMins == null;
        }

        @Override
        public final int hashCode() {
            int result = this.serviceRole.hashCode();
            result = 31 * result + (this.combineArtifacts != null ? this.combineArtifacts.hashCode() : 0);
            result = 31 * result + (this.restrictions != null ? this.restrictions.hashCode() : 0);
            result = 31 * result + (this.timeoutInMins != null ? this.timeoutInMins.hashCode() : 0);
            return result;
        }
    }
}
