package imports.aws.bcmdataexports_export;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.138Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bcmdataexportsExport.BcmdataexportsExportExportOutputReference")
public class BcmdataexportsExportExportOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BcmdataexportsExportExportOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BcmdataexportsExportExportOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BcmdataexportsExportExportOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putDataQuery(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bcmdataexports_export.BcmdataexportsExportExportDataQuery>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bcmdataexports_export.BcmdataexportsExportExportDataQuery> __cast_cd4240 = (java.util.List<imports.aws.bcmdataexports_export.BcmdataexportsExportExportDataQuery>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bcmdataexports_export.BcmdataexportsExportExportDataQuery __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDataQuery", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDestinationConfigurations(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bcmdataexports_export.BcmdataexportsExportExportDestinationConfigurations>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bcmdataexports_export.BcmdataexportsExportExportDestinationConfigurations> __cast_cd4240 = (java.util.List<imports.aws.bcmdataexports_export.BcmdataexportsExportExportDestinationConfigurations>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bcmdataexports_export.BcmdataexportsExportExportDestinationConfigurations __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDestinationConfigurations", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRefreshCadence(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.bcmdataexports_export.BcmdataexportsExportExportRefreshCadence>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.bcmdataexports_export.BcmdataexportsExportExportRefreshCadence> __cast_cd4240 = (java.util.List<imports.aws.bcmdataexports_export.BcmdataexportsExportExportRefreshCadence>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.bcmdataexports_export.BcmdataexportsExportExportRefreshCadence __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRefreshCadence", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDataQuery() {
        software.amazon.jsii.Kernel.call(this, "resetDataQuery", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDestinationConfigurations() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationConfigurations", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRefreshCadence() {
        software.amazon.jsii.Kernel.call(this, "resetRefreshCadence", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bcmdataexports_export.BcmdataexportsExportExportDataQueryList getDataQuery() {
        return software.amazon.jsii.Kernel.get(this, "dataQuery", software.amazon.jsii.NativeType.forClass(imports.aws.bcmdataexports_export.BcmdataexportsExportExportDataQueryList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bcmdataexports_export.BcmdataexportsExportExportDestinationConfigurationsList getDestinationConfigurations() {
        return software.amazon.jsii.Kernel.get(this, "destinationConfigurations", software.amazon.jsii.NativeType.forClass(imports.aws.bcmdataexports_export.BcmdataexportsExportExportDestinationConfigurationsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExportArn() {
        return software.amazon.jsii.Kernel.get(this, "exportArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.bcmdataexports_export.BcmdataexportsExportExportRefreshCadenceList getRefreshCadence() {
        return software.amazon.jsii.Kernel.get(this, "refreshCadence", software.amazon.jsii.NativeType.forClass(imports.aws.bcmdataexports_export.BcmdataexportsExportExportRefreshCadenceList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDataQueryInput() {
        return software.amazon.jsii.Kernel.get(this, "dataQueryInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDestinationConfigurationsInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationConfigurationsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRefreshCadenceInput() {
        return software.amazon.jsii.Kernel.get(this, "refreshCadenceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bcmdataexports_export.BcmdataexportsExportExport value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
