package imports.aws.data_aws_ce_cost_category;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.493Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCeCostCategory.DataAwsCeCostCategoryRuleRuleOutputReference")
public class DataAwsCeCostCategoryRuleRuleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsCeCostCategoryRuleRuleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsCeCostCategoryRuleRuleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsCeCostCategoryRuleRuleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleAndList getAnd() {
        return software.amazon.jsii.Kernel.get(this, "and", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleAndList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleCostCategoryList getCostCategory() {
        return software.amazon.jsii.Kernel.get(this, "costCategory", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleCostCategoryList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleDimensionList getDimension() {
        return software.amazon.jsii.Kernel.get(this, "dimension", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleDimensionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleNotList getNot() {
        return software.amazon.jsii.Kernel.get(this, "not", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleNotList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleOrList getOr() {
        return software.amazon.jsii.Kernel.get(this, "or", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleOrList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleTagsList getTags() {
        return software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRuleTagsList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRule getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRule.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_ce_cost_category.DataAwsCeCostCategoryRuleRule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
