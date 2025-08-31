package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectEnvironmentOutputReference")
public class CodebuildProjectEnvironmentOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodebuildProjectEnvironmentOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodebuildProjectEnvironmentOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodebuildProjectEnvironmentOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEnvironmentVariable(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codebuild_project.CodebuildProjectEnvironmentEnvironmentVariable>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codebuild_project.CodebuildProjectEnvironmentEnvironmentVariable> __cast_cd4240 = (java.util.List<imports.aws.codebuild_project.CodebuildProjectEnvironmentEnvironmentVariable>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codebuild_project.CodebuildProjectEnvironmentEnvironmentVariable __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEnvironmentVariable", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFleet(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectEnvironmentFleet value) {
        software.amazon.jsii.Kernel.call(this, "putFleet", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRegistryCredential(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredential value) {
        software.amazon.jsii.Kernel.call(this, "putRegistryCredential", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCertificate() {
        software.amazon.jsii.Kernel.call(this, "resetCertificate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnvironmentVariable() {
        software.amazon.jsii.Kernel.call(this, "resetEnvironmentVariable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFleet() {
        software.amazon.jsii.Kernel.call(this, "resetFleet", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImagePullCredentialsType() {
        software.amazon.jsii.Kernel.call(this, "resetImagePullCredentialsType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivilegedMode() {
        software.amazon.jsii.Kernel.call(this, "resetPrivilegedMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegistryCredential() {
        software.amazon.jsii.Kernel.call(this, "resetRegistryCredential", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectEnvironmentEnvironmentVariableList getEnvironmentVariable() {
        return software.amazon.jsii.Kernel.get(this, "environmentVariable", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectEnvironmentEnvironmentVariableList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectEnvironmentFleetOutputReference getFleet() {
        return software.amazon.jsii.Kernel.get(this, "fleet", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectEnvironmentFleetOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredentialOutputReference getRegistryCredential() {
        return software.amazon.jsii.Kernel.get(this, "registryCredential", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredentialOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getComputeTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "computeTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnvironmentVariableInput() {
        return software.amazon.jsii.Kernel.get(this, "environmentVariableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectEnvironmentFleet getFleetInput() {
        return software.amazon.jsii.Kernel.get(this, "fleetInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectEnvironmentFleet.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageInput() {
        return software.amazon.jsii.Kernel.get(this, "imageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImagePullCredentialsTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "imagePullCredentialsTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPrivilegedModeInput() {
        return software.amazon.jsii.Kernel.get(this, "privilegedModeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredential getRegistryCredentialInput() {
        return software.amazon.jsii.Kernel.get(this, "registryCredentialInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredential.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificate() {
        return software.amazon.jsii.Kernel.get(this, "certificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificate", java.util.Objects.requireNonNull(value, "certificate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComputeType() {
        return software.amazon.jsii.Kernel.get(this, "computeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComputeType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "computeType", java.util.Objects.requireNonNull(value, "computeType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImage() {
        return software.amazon.jsii.Kernel.get(this, "image", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "image", java.util.Objects.requireNonNull(value, "image is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImagePullCredentialsType() {
        return software.amazon.jsii.Kernel.get(this, "imagePullCredentialsType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImagePullCredentialsType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imagePullCredentialsType", java.util.Objects.requireNonNull(value, "imagePullCredentialsType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPrivilegedMode() {
        return software.amazon.jsii.Kernel.get(this, "privilegedMode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPrivilegedMode(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "privilegedMode", java.util.Objects.requireNonNull(value, "privilegedMode is required"));
    }

    public void setPrivilegedMode(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "privilegedMode", java.util.Objects.requireNonNull(value, "privilegedMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectEnvironment getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectEnvironment.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectEnvironment value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
