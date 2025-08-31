package imports.aws.glue_catalog_table_optimizer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.285Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTableOptimizer.GlueCatalogTableOptimizerConfigurationOutputReference")
public class GlueCatalogTableOptimizerConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueCatalogTableOptimizerConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueCatalogTableOptimizerConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public GlueCatalogTableOptimizerConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putOrphanFileDeletionConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration> __cast_cd4240 = (java.util.List<imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putOrphanFileDeletionConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRetentionConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationRetentionConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationRetentionConfiguration> __cast_cd4240 = (java.util.List<imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationRetentionConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationRetentionConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRetentionConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetOrphanFileDeletionConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetOrphanFileDeletionConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetentionConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetRetentionConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationList getOrphanFileDeletionConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "orphanFileDeletionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationOrphanFileDeletionConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationRetentionConfigurationList getRetentionConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "retentionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfigurationRetentionConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOrphanFileDeletionConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "orphanFileDeletionConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRetentionConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "retentionConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table_optimizer.GlueCatalogTableOptimizerConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
