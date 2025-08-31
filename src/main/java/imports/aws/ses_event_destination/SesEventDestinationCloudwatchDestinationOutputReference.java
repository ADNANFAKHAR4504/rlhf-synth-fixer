package imports.aws.ses_event_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.448Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesEventDestination.SesEventDestinationCloudwatchDestinationOutputReference")
public class SesEventDestinationCloudwatchDestinationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SesEventDestinationCloudwatchDestinationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SesEventDestinationCloudwatchDestinationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SesEventDestinationCloudwatchDestinationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultValueInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDimensionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "dimensionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getValueSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "valueSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultValue() {
        return software.amazon.jsii.Kernel.get(this, "defaultValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultValue", java.util.Objects.requireNonNull(value, "defaultValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDimensionName() {
        return software.amazon.jsii.Kernel.get(this, "dimensionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDimensionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dimensionName", java.util.Objects.requireNonNull(value, "dimensionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getValueSource() {
        return software.amazon.jsii.Kernel.get(this, "valueSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setValueSource(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "valueSource", java.util.Objects.requireNonNull(value, "valueSource is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ses_event_destination.SesEventDestinationCloudwatchDestination value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
