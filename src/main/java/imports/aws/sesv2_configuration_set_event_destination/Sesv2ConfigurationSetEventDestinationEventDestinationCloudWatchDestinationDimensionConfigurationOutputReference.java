package imports.aws.sesv2_configuration_set_event_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.457Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfigurationOutputReference")
public class Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultDimensionValueInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultDimensionValueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDimensionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "dimensionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDimensionValueSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "dimensionValueSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultDimensionValue() {
        return software.amazon.jsii.Kernel.get(this, "defaultDimensionValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultDimensionValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultDimensionValue", java.util.Objects.requireNonNull(value, "defaultDimensionValue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDimensionName() {
        return software.amazon.jsii.Kernel.get(this, "dimensionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDimensionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dimensionName", java.util.Objects.requireNonNull(value, "dimensionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDimensionValueSource() {
        return software.amazon.jsii.Kernel.get(this, "dimensionValueSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDimensionValueSource(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dimensionValueSource", java.util.Objects.requireNonNull(value, "dimensionValueSource is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestinationDimensionConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
