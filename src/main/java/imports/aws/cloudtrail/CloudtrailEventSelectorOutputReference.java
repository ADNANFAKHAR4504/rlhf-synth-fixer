package imports.aws.cloudtrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.263Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudtrail.CloudtrailEventSelectorOutputReference")
public class CloudtrailEventSelectorOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudtrailEventSelectorOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudtrailEventSelectorOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CloudtrailEventSelectorOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putDataResource(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudtrail.CloudtrailEventSelectorDataResource>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudtrail.CloudtrailEventSelectorDataResource> __cast_cd4240 = (java.util.List<imports.aws.cloudtrail.CloudtrailEventSelectorDataResource>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudtrail.CloudtrailEventSelectorDataResource __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDataResource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDataResource() {
        software.amazon.jsii.Kernel.call(this, "resetDataResource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExcludeManagementEventSources() {
        software.amazon.jsii.Kernel.call(this, "resetExcludeManagementEventSources", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeManagementEvents() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeManagementEvents", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReadWriteType() {
        software.amazon.jsii.Kernel.call(this, "resetReadWriteType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudtrail.CloudtrailEventSelectorDataResourceList getDataResource() {
        return software.amazon.jsii.Kernel.get(this, "dataResource", software.amazon.jsii.NativeType.forClass(imports.aws.cloudtrail.CloudtrailEventSelectorDataResourceList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDataResourceInput() {
        return software.amazon.jsii.Kernel.get(this, "dataResourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludeManagementEventSourcesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "excludeManagementEventSourcesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeManagementEventsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeManagementEventsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReadWriteTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "readWriteTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExcludeManagementEventSources() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "excludeManagementEventSources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setExcludeManagementEventSources(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "excludeManagementEventSources", java.util.Objects.requireNonNull(value, "excludeManagementEventSources is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeManagementEvents() {
        return software.amazon.jsii.Kernel.get(this, "includeManagementEvents", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeManagementEvents(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeManagementEvents", java.util.Objects.requireNonNull(value, "includeManagementEvents is required"));
    }

    public void setIncludeManagementEvents(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeManagementEvents", java.util.Objects.requireNonNull(value, "includeManagementEvents is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReadWriteType() {
        return software.amazon.jsii.Kernel.get(this, "readWriteType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReadWriteType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "readWriteType", java.util.Objects.requireNonNull(value, "readWriteType is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudtrail.CloudtrailEventSelector value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
