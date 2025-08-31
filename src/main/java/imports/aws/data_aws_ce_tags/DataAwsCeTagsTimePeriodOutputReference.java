package imports.aws.data_aws_ce_tags;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.496Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCeTags.DataAwsCeTagsTimePeriodOutputReference")
public class DataAwsCeTagsTimePeriodOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsCeTagsTimePeriodOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsCeTagsTimePeriodOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DataAwsCeTagsTimePeriodOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEndInput() {
        return software.amazon.jsii.Kernel.get(this, "endInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartInput() {
        return software.amazon.jsii.Kernel.get(this, "startInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEnd() {
        return software.amazon.jsii.Kernel.get(this, "end", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEnd(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "end", java.util.Objects.requireNonNull(value, "end is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStart() {
        return software.amazon.jsii.Kernel.get(this, "start", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStart(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "start", java.util.Objects.requireNonNull(value, "start is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_ce_tags.DataAwsCeTagsTimePeriod getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ce_tags.DataAwsCeTagsTimePeriod.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_ce_tags.DataAwsCeTagsTimePeriod value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
