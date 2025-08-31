package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.300Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectEnvironment")
@software.amazon.jsii.Jsii.Proxy(CodebuildProjectEnvironment.Jsii$Proxy.class)
public interface CodebuildProjectEnvironment extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#compute_type CodebuildProject#compute_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getComputeType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#image CodebuildProject#image}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getImage();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#type CodebuildProject#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#certificate CodebuildProject#certificate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificate() {
        return null;
    }

    /**
     * environment_variable block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#environment_variable CodebuildProject#environment_variable}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnvironmentVariable() {
        return null;
    }

    /**
     * fleet block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#fleet CodebuildProject#fleet}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectEnvironmentFleet getFleet() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#image_pull_credentials_type CodebuildProject#image_pull_credentials_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImagePullCredentialsType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#privileged_mode CodebuildProject#privileged_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPrivilegedMode() {
        return null;
    }

    /**
     * registry_credential block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#registry_credential CodebuildProject#registry_credential}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredential getRegistryCredential() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildProjectEnvironment}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildProjectEnvironment}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildProjectEnvironment> {
        java.lang.String computeType;
        java.lang.String image;
        java.lang.String type;
        java.lang.String certificate;
        java.lang.Object environmentVariable;
        imports.aws.codebuild_project.CodebuildProjectEnvironmentFleet fleet;
        java.lang.String imagePullCredentialsType;
        java.lang.Object privilegedMode;
        imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredential registryCredential;

        /**
         * Sets the value of {@link CodebuildProjectEnvironment#getComputeType}
         * @param computeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#compute_type CodebuildProject#compute_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder computeType(java.lang.String computeType) {
            this.computeType = computeType;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectEnvironment#getImage}
         * @param image Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#image CodebuildProject#image}. This parameter is required.
         * @return {@code this}
         */
        public Builder image(java.lang.String image) {
            this.image = image;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectEnvironment#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#type CodebuildProject#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectEnvironment#getCertificate}
         * @param certificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#certificate CodebuildProject#certificate}.
         * @return {@code this}
         */
        public Builder certificate(java.lang.String certificate) {
            this.certificate = certificate;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectEnvironment#getEnvironmentVariable}
         * @param environmentVariable environment_variable block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#environment_variable CodebuildProject#environment_variable}
         * @return {@code this}
         */
        public Builder environmentVariable(com.hashicorp.cdktf.IResolvable environmentVariable) {
            this.environmentVariable = environmentVariable;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectEnvironment#getEnvironmentVariable}
         * @param environmentVariable environment_variable block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#environment_variable CodebuildProject#environment_variable}
         * @return {@code this}
         */
        public Builder environmentVariable(java.util.List<? extends imports.aws.codebuild_project.CodebuildProjectEnvironmentEnvironmentVariable> environmentVariable) {
            this.environmentVariable = environmentVariable;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectEnvironment#getFleet}
         * @param fleet fleet block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#fleet CodebuildProject#fleet}
         * @return {@code this}
         */
        public Builder fleet(imports.aws.codebuild_project.CodebuildProjectEnvironmentFleet fleet) {
            this.fleet = fleet;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectEnvironment#getImagePullCredentialsType}
         * @param imagePullCredentialsType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#image_pull_credentials_type CodebuildProject#image_pull_credentials_type}.
         * @return {@code this}
         */
        public Builder imagePullCredentialsType(java.lang.String imagePullCredentialsType) {
            this.imagePullCredentialsType = imagePullCredentialsType;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectEnvironment#getPrivilegedMode}
         * @param privilegedMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#privileged_mode CodebuildProject#privileged_mode}.
         * @return {@code this}
         */
        public Builder privilegedMode(java.lang.Boolean privilegedMode) {
            this.privilegedMode = privilegedMode;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectEnvironment#getPrivilegedMode}
         * @param privilegedMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#privileged_mode CodebuildProject#privileged_mode}.
         * @return {@code this}
         */
        public Builder privilegedMode(com.hashicorp.cdktf.IResolvable privilegedMode) {
            this.privilegedMode = privilegedMode;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectEnvironment#getRegistryCredential}
         * @param registryCredential registry_credential block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#registry_credential CodebuildProject#registry_credential}
         * @return {@code this}
         */
        public Builder registryCredential(imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredential registryCredential) {
            this.registryCredential = registryCredential;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildProjectEnvironment}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildProjectEnvironment build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildProjectEnvironment}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildProjectEnvironment {
        private final java.lang.String computeType;
        private final java.lang.String image;
        private final java.lang.String type;
        private final java.lang.String certificate;
        private final java.lang.Object environmentVariable;
        private final imports.aws.codebuild_project.CodebuildProjectEnvironmentFleet fleet;
        private final java.lang.String imagePullCredentialsType;
        private final java.lang.Object privilegedMode;
        private final imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredential registryCredential;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.computeType = software.amazon.jsii.Kernel.get(this, "computeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.image = software.amazon.jsii.Kernel.get(this, "image", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.certificate = software.amazon.jsii.Kernel.get(this, "certificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.environmentVariable = software.amazon.jsii.Kernel.get(this, "environmentVariable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fleet = software.amazon.jsii.Kernel.get(this, "fleet", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectEnvironmentFleet.class));
            this.imagePullCredentialsType = software.amazon.jsii.Kernel.get(this, "imagePullCredentialsType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.privilegedMode = software.amazon.jsii.Kernel.get(this, "privilegedMode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.registryCredential = software.amazon.jsii.Kernel.get(this, "registryCredential", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredential.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.computeType = java.util.Objects.requireNonNull(builder.computeType, "computeType is required");
            this.image = java.util.Objects.requireNonNull(builder.image, "image is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.certificate = builder.certificate;
            this.environmentVariable = builder.environmentVariable;
            this.fleet = builder.fleet;
            this.imagePullCredentialsType = builder.imagePullCredentialsType;
            this.privilegedMode = builder.privilegedMode;
            this.registryCredential = builder.registryCredential;
        }

        @Override
        public final java.lang.String getComputeType() {
            return this.computeType;
        }

        @Override
        public final java.lang.String getImage() {
            return this.image;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getCertificate() {
            return this.certificate;
        }

        @Override
        public final java.lang.Object getEnvironmentVariable() {
            return this.environmentVariable;
        }

        @Override
        public final imports.aws.codebuild_project.CodebuildProjectEnvironmentFleet getFleet() {
            return this.fleet;
        }

        @Override
        public final java.lang.String getImagePullCredentialsType() {
            return this.imagePullCredentialsType;
        }

        @Override
        public final java.lang.Object getPrivilegedMode() {
            return this.privilegedMode;
        }

        @Override
        public final imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredential getRegistryCredential() {
            return this.registryCredential;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("computeType", om.valueToTree(this.getComputeType()));
            data.set("image", om.valueToTree(this.getImage()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getCertificate() != null) {
                data.set("certificate", om.valueToTree(this.getCertificate()));
            }
            if (this.getEnvironmentVariable() != null) {
                data.set("environmentVariable", om.valueToTree(this.getEnvironmentVariable()));
            }
            if (this.getFleet() != null) {
                data.set("fleet", om.valueToTree(this.getFleet()));
            }
            if (this.getImagePullCredentialsType() != null) {
                data.set("imagePullCredentialsType", om.valueToTree(this.getImagePullCredentialsType()));
            }
            if (this.getPrivilegedMode() != null) {
                data.set("privilegedMode", om.valueToTree(this.getPrivilegedMode()));
            }
            if (this.getRegistryCredential() != null) {
                data.set("registryCredential", om.valueToTree(this.getRegistryCredential()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildProject.CodebuildProjectEnvironment"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildProjectEnvironment.Jsii$Proxy that = (CodebuildProjectEnvironment.Jsii$Proxy) o;

            if (!computeType.equals(that.computeType)) return false;
            if (!image.equals(that.image)) return false;
            if (!type.equals(that.type)) return false;
            if (this.certificate != null ? !this.certificate.equals(that.certificate) : that.certificate != null) return false;
            if (this.environmentVariable != null ? !this.environmentVariable.equals(that.environmentVariable) : that.environmentVariable != null) return false;
            if (this.fleet != null ? !this.fleet.equals(that.fleet) : that.fleet != null) return false;
            if (this.imagePullCredentialsType != null ? !this.imagePullCredentialsType.equals(that.imagePullCredentialsType) : that.imagePullCredentialsType != null) return false;
            if (this.privilegedMode != null ? !this.privilegedMode.equals(that.privilegedMode) : that.privilegedMode != null) return false;
            return this.registryCredential != null ? this.registryCredential.equals(that.registryCredential) : that.registryCredential == null;
        }

        @Override
        public final int hashCode() {
            int result = this.computeType.hashCode();
            result = 31 * result + (this.image.hashCode());
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.certificate != null ? this.certificate.hashCode() : 0);
            result = 31 * result + (this.environmentVariable != null ? this.environmentVariable.hashCode() : 0);
            result = 31 * result + (this.fleet != null ? this.fleet.hashCode() : 0);
            result = 31 * result + (this.imagePullCredentialsType != null ? this.imagePullCredentialsType.hashCode() : 0);
            result = 31 * result + (this.privilegedMode != null ? this.privilegedMode.hashCode() : 0);
            result = 31 * result + (this.registryCredential != null ? this.registryCredential.hashCode() : 0);
            return result;
        }
    }
}
