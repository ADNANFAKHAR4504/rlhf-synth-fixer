package imports.aws.codeartifact_repository;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.297Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codeartifactRepository.CodeartifactRepositoryExternalConnectionsOutputReference")
public class CodeartifactRepositoryExternalConnectionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodeartifactRepositoryExternalConnectionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodeartifactRepositoryExternalConnectionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodeartifactRepositoryExternalConnectionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPackageFormat() {
        return software.amazon.jsii.Kernel.get(this, "packageFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getExternalConnectionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "externalConnectionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExternalConnectionName() {
        return software.amazon.jsii.Kernel.get(this, "externalConnectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setExternalConnectionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "externalConnectionName", java.util.Objects.requireNonNull(value, "externalConnectionName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codeartifact_repository.CodeartifactRepositoryExternalConnections getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codeartifact_repository.CodeartifactRepositoryExternalConnections.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codeartifact_repository.CodeartifactRepositoryExternalConnections value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
