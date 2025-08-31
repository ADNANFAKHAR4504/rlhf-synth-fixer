package imports.aws.osis_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.050Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.osisPipeline.OsisPipelineLogPublishingOptionsOutputReference")
public class OsisPipelineLogPublishingOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OsisPipelineLogPublishingOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OsisPipelineLogPublishingOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public OsisPipelineLogPublishingOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCloudwatchLogDestination(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.osis_pipeline.OsisPipelineLogPublishingOptionsCloudwatchLogDestination>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.osis_pipeline.OsisPipelineLogPublishingOptionsCloudwatchLogDestination> __cast_cd4240 = (java.util.List<imports.aws.osis_pipeline.OsisPipelineLogPublishingOptionsCloudwatchLogDestination>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.osis_pipeline.OsisPipelineLogPublishingOptionsCloudwatchLogDestination __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLogDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchLogDestination() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogDestination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIsLoggingEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetIsLoggingEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.osis_pipeline.OsisPipelineLogPublishingOptionsCloudwatchLogDestinationList getCloudwatchLogDestination() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogDestination", software.amazon.jsii.NativeType.forClass(imports.aws.osis_pipeline.OsisPipelineLogPublishingOptionsCloudwatchLogDestinationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchLogDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogDestinationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIsLoggingEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "isLoggingEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIsLoggingEnabled() {
        return software.amazon.jsii.Kernel.get(this, "isLoggingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIsLoggingEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "isLoggingEnabled", java.util.Objects.requireNonNull(value, "isLoggingEnabled is required"));
    }

    public void setIsLoggingEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "isLoggingEnabled", java.util.Objects.requireNonNull(value, "isLoggingEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.osis_pipeline.OsisPipelineLogPublishingOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
