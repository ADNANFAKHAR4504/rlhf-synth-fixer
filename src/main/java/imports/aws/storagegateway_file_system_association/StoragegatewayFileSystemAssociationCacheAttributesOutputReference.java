package imports.aws.storagegateway_file_system_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.527Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.storagegatewayFileSystemAssociation.StoragegatewayFileSystemAssociationCacheAttributesOutputReference")
public class StoragegatewayFileSystemAssociationCacheAttributesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected StoragegatewayFileSystemAssociationCacheAttributesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected StoragegatewayFileSystemAssociationCacheAttributesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public StoragegatewayFileSystemAssociationCacheAttributesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCacheStaleTimeoutInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetCacheStaleTimeoutInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCacheStaleTimeoutInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheStaleTimeoutInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCacheStaleTimeoutInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "cacheStaleTimeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCacheStaleTimeoutInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "cacheStaleTimeoutInSeconds", java.util.Objects.requireNonNull(value, "cacheStaleTimeoutInSeconds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.storagegateway_file_system_association.StoragegatewayFileSystemAssociationCacheAttributes getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_file_system_association.StoragegatewayFileSystemAssociationCacheAttributes.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.storagegateway_file_system_association.StoragegatewayFileSystemAssociationCacheAttributes value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
