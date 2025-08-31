package imports.aws.data_aws_ecr_lifecycle_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.620Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEcrLifecyclePolicyDocument.DataAwsEcrLifecyclePolicyDocumentRuleSelectionOutputReference")
public class DataAwsEcrLifecyclePolicyDocumentRuleSelectionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsEcrLifecyclePolicyDocumentRuleSelectionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsEcrLifecyclePolicyDocumentRuleSelectionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsEcrLifecyclePolicyDocumentRuleSelectionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetCountUnit() {
        software.amazon.jsii.Kernel.call(this, "resetCountUnit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagPatternList() {
        software.amazon.jsii.Kernel.call(this, "resetTagPatternList", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagPrefixList() {
        software.amazon.jsii.Kernel.call(this, "resetTagPrefixList", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCountNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "countNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCountTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "countTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCountUnitInput() {
        return software.amazon.jsii.Kernel.get(this, "countUnitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTagPatternListInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagPatternListInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTagPrefixListInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagPrefixListInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTagStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "tagStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCountNumber() {
        return software.amazon.jsii.Kernel.get(this, "countNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCountNumber(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "countNumber", java.util.Objects.requireNonNull(value, "countNumber is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCountType() {
        return software.amazon.jsii.Kernel.get(this, "countType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCountType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "countType", java.util.Objects.requireNonNull(value, "countType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCountUnit() {
        return software.amazon.jsii.Kernel.get(this, "countUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCountUnit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "countUnit", java.util.Objects.requireNonNull(value, "countUnit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTagPatternList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tagPatternList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagPatternList(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagPatternList", java.util.Objects.requireNonNull(value, "tagPatternList is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTagPrefixList() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tagPrefixList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagPrefixList(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagPrefixList", java.util.Objects.requireNonNull(value, "tagPrefixList is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTagStatus() {
        return software.amazon.jsii.Kernel.get(this, "tagStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTagStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tagStatus", java.util.Objects.requireNonNull(value, "tagStatus is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_ecr_lifecycle_policy_document.DataAwsEcrLifecyclePolicyDocumentRuleSelection value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
