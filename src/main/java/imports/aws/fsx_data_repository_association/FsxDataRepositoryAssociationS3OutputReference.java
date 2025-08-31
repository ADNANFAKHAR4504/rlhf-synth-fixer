package imports.aws.fsx_data_repository_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.243Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxDataRepositoryAssociation.FsxDataRepositoryAssociationS3OutputReference")
public class FsxDataRepositoryAssociationS3OutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FsxDataRepositoryAssociationS3OutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxDataRepositoryAssociationS3OutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FsxDataRepositoryAssociationS3OutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAutoExportPolicy(final @org.jetbrains.annotations.NotNull imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoExportPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putAutoExportPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAutoImportPolicy(final @org.jetbrains.annotations.NotNull imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoImportPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putAutoImportPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutoExportPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetAutoExportPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoImportPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetAutoImportPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoExportPolicyOutputReference getAutoExportPolicy() {
        return software.amazon.jsii.Kernel.get(this, "autoExportPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoExportPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoImportPolicyOutputReference getAutoImportPolicy() {
        return software.amazon.jsii.Kernel.get(this, "autoImportPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoImportPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoExportPolicy getAutoExportPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "autoExportPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoExportPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoImportPolicy getAutoImportPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "autoImportPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3AutoImportPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3 getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fsx_data_repository_association.FsxDataRepositoryAssociationS3 value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
