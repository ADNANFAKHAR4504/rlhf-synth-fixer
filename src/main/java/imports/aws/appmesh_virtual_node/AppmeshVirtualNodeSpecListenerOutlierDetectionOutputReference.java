package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.044Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerOutlierDetectionOutputReference")
public class AppmeshVirtualNodeSpecListenerOutlierDetectionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppmeshVirtualNodeSpecListenerOutlierDetectionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppmeshVirtualNodeSpecListenerOutlierDetectionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppmeshVirtualNodeSpecListenerOutlierDetectionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putBaseEjectionDuration(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionBaseEjectionDuration value) {
        software.amazon.jsii.Kernel.call(this, "putBaseEjectionDuration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInterval(final @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionInterval value) {
        software.amazon.jsii.Kernel.call(this, "putInterval", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionBaseEjectionDurationOutputReference getBaseEjectionDuration() {
        return software.amazon.jsii.Kernel.get(this, "baseEjectionDuration", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionBaseEjectionDurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionIntervalOutputReference getInterval() {
        return software.amazon.jsii.Kernel.get(this, "interval", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionIntervalOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionBaseEjectionDuration getBaseEjectionDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "baseEjectionDurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionBaseEjectionDuration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionInterval getIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "intervalInput", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionInterval.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxEjectionPercentInput() {
        return software.amazon.jsii.Kernel.get(this, "maxEjectionPercentInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxServerErrorsInput() {
        return software.amazon.jsii.Kernel.get(this, "maxServerErrorsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxEjectionPercent() {
        return software.amazon.jsii.Kernel.get(this, "maxEjectionPercent", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxEjectionPercent(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxEjectionPercent", java.util.Objects.requireNonNull(value, "maxEjectionPercent is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxServerErrors() {
        return software.amazon.jsii.Kernel.get(this, "maxServerErrors", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxServerErrors(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxServerErrors", java.util.Objects.requireNonNull(value, "maxServerErrors is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetection getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetection.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetection value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
