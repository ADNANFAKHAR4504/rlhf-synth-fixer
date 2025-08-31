package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectEnvironmentRegistryCredentialOutputReference")
public class CodebuildProjectEnvironmentRegistryCredentialOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodebuildProjectEnvironmentRegistryCredentialOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodebuildProjectEnvironmentRegistryCredentialOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodebuildProjectEnvironmentRegistryCredentialOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCredentialInput() {
        return software.amazon.jsii.Kernel.get(this, "credentialInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCredentialProviderInput() {
        return software.amazon.jsii.Kernel.get(this, "credentialProviderInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCredential() {
        return software.amazon.jsii.Kernel.get(this, "credential", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCredential(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "credential", java.util.Objects.requireNonNull(value, "credential is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCredentialProvider() {
        return software.amazon.jsii.Kernel.get(this, "credentialProvider", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCredentialProvider(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "credentialProvider", java.util.Objects.requireNonNull(value, "credentialProvider is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredential getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredential.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectEnvironmentRegistryCredential value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
