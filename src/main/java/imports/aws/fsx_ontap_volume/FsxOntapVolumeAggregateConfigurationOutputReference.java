package imports.aws.fsx_ontap_volume;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.249Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOntapVolume.FsxOntapVolumeAggregateConfigurationOutputReference")
public class FsxOntapVolumeAggregateConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FsxOntapVolumeAggregateConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxOntapVolumeAggregateConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FsxOntapVolumeAggregateConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAggregates() {
        software.amazon.jsii.Kernel.call(this, "resetAggregates", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConstituentsPerAggregate() {
        software.amazon.jsii.Kernel.call(this, "resetConstituentsPerAggregate", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTotalConstituents() {
        return software.amazon.jsii.Kernel.get(this, "totalConstituents", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAggregatesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "aggregatesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getConstituentsPerAggregateInput() {
        return software.amazon.jsii.Kernel.get(this, "constituentsPerAggregateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAggregates() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "aggregates", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAggregates(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "aggregates", java.util.Objects.requireNonNull(value, "aggregates is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getConstituentsPerAggregate() {
        return software.amazon.jsii.Kernel.get(this, "constituentsPerAggregate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setConstituentsPerAggregate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "constituentsPerAggregate", java.util.Objects.requireNonNull(value, "constituentsPerAggregate is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
