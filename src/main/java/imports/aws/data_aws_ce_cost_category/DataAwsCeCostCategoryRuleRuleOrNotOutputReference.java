package imports.aws.data_aws_ce_cost_category;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.493Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCeCostCategory.DataAwsCeCostCategoryRuleRuleOrNotOutputReference")
public class DataAwsCeCostCategoryRuleRuleOrNotOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsCeCostCategoryRuleRuleOrNotOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsCeCostCategoryRuleRuleOrNotOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsCeCostCategoryRuleRuleOrNotOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleOrNotCostCategoryList getCostCategory() {
        return software.amazon.jsii.Kernel.get(this, "costCategory", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleOrNotCostCategoryList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleOrNotDimensionList getDimension() {
        return software.amazon.jsii.Kernel.get(this, "dimension", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleOrNotDimensionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleOrNotTagsList getTags() {
        return software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleOrNotTagsList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleOrNot getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleOrNot.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleOrNot value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
