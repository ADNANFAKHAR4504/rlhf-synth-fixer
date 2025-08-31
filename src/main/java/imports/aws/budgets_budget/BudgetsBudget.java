package imports.aws.budgets_budget;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget aws_budgets_budget}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.183Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudget.BudgetsBudget")
public class BudgetsBudget extends com.hashicorp.cdktf.TerraformResource {

    protected BudgetsBudget(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BudgetsBudget(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.budgets_budget.BudgetsBudget.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget aws_budgets_budget} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public BudgetsBudget(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.budgets_budget.BudgetsBudgetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a BudgetsBudget resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BudgetsBudget to import. This parameter is required.
     * @param importFromId The id of the existing BudgetsBudget that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the BudgetsBudget to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.budgets_budget.BudgetsBudget.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a BudgetsBudget resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the BudgetsBudget to import. This parameter is required.
     * @param importFromId The id of the existing BudgetsBudget that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.budgets_budget.BudgetsBudget.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAutoAdjustData(final @org.jetbrains.annotations.NotNull imports.aws.budgets_budget.BudgetsBudgetAutoAdjustData value) {
        software.amazon.jsii.Kernel.call(this, "putAutoAdjustData", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCostFilter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.budgets_budget.BudgetsBudgetCostFilter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.budgets_budget.BudgetsBudgetCostFilter> __cast_cd4240 = (java.util.List<imports.aws.budgets_budget.BudgetsBudgetCostFilter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.budgets_budget.BudgetsBudgetCostFilter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCostFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCostTypes(final @org.jetbrains.annotations.NotNull imports.aws.budgets_budget.BudgetsBudgetCostTypes value) {
        software.amazon.jsii.Kernel.call(this, "putCostTypes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNotification(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.budgets_budget.BudgetsBudgetNotification>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.budgets_budget.BudgetsBudgetNotification> __cast_cd4240 = (java.util.List<imports.aws.budgets_budget.BudgetsBudgetNotification>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.budgets_budget.BudgetsBudgetNotification __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNotification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPlannedLimit(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.budgets_budget.BudgetsBudgetPlannedLimit>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.budgets_budget.BudgetsBudgetPlannedLimit> __cast_cd4240 = (java.util.List<imports.aws.budgets_budget.BudgetsBudgetPlannedLimit>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.budgets_budget.BudgetsBudgetPlannedLimit __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPlannedLimit", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoAdjustData() {
        software.amazon.jsii.Kernel.call(this, "resetAutoAdjustData", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCostFilter() {
        software.amazon.jsii.Kernel.call(this, "resetCostFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCostTypes() {
        software.amazon.jsii.Kernel.call(this, "resetCostTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLimitAmount() {
        software.amazon.jsii.Kernel.call(this, "resetLimitAmount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLimitUnit() {
        software.amazon.jsii.Kernel.call(this, "resetLimitUnit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotification() {
        software.amazon.jsii.Kernel.call(this, "resetNotification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlannedLimit() {
        software.amazon.jsii.Kernel.call(this, "resetPlannedLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimePeriodEnd() {
        software.amazon.jsii.Kernel.call(this, "resetTimePeriodEnd", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimePeriodStart() {
        software.amazon.jsii.Kernel.call(this, "resetTimePeriodStart", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataOutputReference getAutoAdjustData() {
        return software.amazon.jsii.Kernel.get(this, "autoAdjustData", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.budgets_budget.BudgetsBudgetCostFilterList getCostFilter() {
        return software.amazon.jsii.Kernel.get(this, "costFilter", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget.BudgetsBudgetCostFilterList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.budgets_budget.BudgetsBudgetCostTypesOutputReference getCostTypes() {
        return software.amazon.jsii.Kernel.get(this, "costTypes", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget.BudgetsBudgetCostTypesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.budgets_budget.BudgetsBudgetNotificationList getNotification() {
        return software.amazon.jsii.Kernel.get(this, "notification", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget.BudgetsBudgetNotificationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.budgets_budget.BudgetsBudgetPlannedLimitList getPlannedLimit() {
        return software.amazon.jsii.Kernel.get(this, "plannedLimit", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget.BudgetsBudgetPlannedLimitList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "accountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.budgets_budget.BudgetsBudgetAutoAdjustData getAutoAdjustDataInput() {
        return software.amazon.jsii.Kernel.get(this, "autoAdjustDataInput", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget.BudgetsBudgetAutoAdjustData.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBudgetTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "budgetTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCostFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "costFilterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.budgets_budget.BudgetsBudgetCostTypes getCostTypesInput() {
        return software.amazon.jsii.Kernel.get(this, "costTypesInput", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget.BudgetsBudgetCostTypes.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLimitAmountInput() {
        return software.amazon.jsii.Kernel.get(this, "limitAmountInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLimitUnitInput() {
        return software.amazon.jsii.Kernel.get(this, "limitUnitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "namePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNotificationInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPlannedLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "plannedLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimePeriodEndInput() {
        return software.amazon.jsii.Kernel.get(this, "timePeriodEndInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimePeriodStartInput() {
        return software.amazon.jsii.Kernel.get(this, "timePeriodStartInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimeUnitInput() {
        return software.amazon.jsii.Kernel.get(this, "timeUnitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountId() {
        return software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountId", java.util.Objects.requireNonNull(value, "accountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBudgetType() {
        return software.amazon.jsii.Kernel.get(this, "budgetType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBudgetType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "budgetType", java.util.Objects.requireNonNull(value, "budgetType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLimitAmount() {
        return software.amazon.jsii.Kernel.get(this, "limitAmount", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLimitAmount(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "limitAmount", java.util.Objects.requireNonNull(value, "limitAmount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLimitUnit() {
        return software.amazon.jsii.Kernel.get(this, "limitUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLimitUnit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "limitUnit", java.util.Objects.requireNonNull(value, "limitUnit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namePrefix", java.util.Objects.requireNonNull(value, "namePrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimePeriodEnd() {
        return software.amazon.jsii.Kernel.get(this, "timePeriodEnd", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimePeriodEnd(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timePeriodEnd", java.util.Objects.requireNonNull(value, "timePeriodEnd is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimePeriodStart() {
        return software.amazon.jsii.Kernel.get(this, "timePeriodStart", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimePeriodStart(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timePeriodStart", java.util.Objects.requireNonNull(value, "timePeriodStart is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimeUnit() {
        return software.amazon.jsii.Kernel.get(this, "timeUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimeUnit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timeUnit", java.util.Objects.requireNonNull(value, "timeUnit is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.budgets_budget.BudgetsBudget}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.budgets_budget.BudgetsBudget> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.budgets_budget.BudgetsBudgetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.budgets_budget.BudgetsBudgetConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#budget_type BudgetsBudget#budget_type}.
         * <p>
         * @return {@code this}
         * @param budgetType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#budget_type BudgetsBudget#budget_type}. This parameter is required.
         */
        public Builder budgetType(final java.lang.String budgetType) {
            this.config.budgetType(budgetType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#time_unit BudgetsBudget#time_unit}.
         * <p>
         * @return {@code this}
         * @param timeUnit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#time_unit BudgetsBudget#time_unit}. This parameter is required.
         */
        public Builder timeUnit(final java.lang.String timeUnit) {
            this.config.timeUnit(timeUnit);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#account_id BudgetsBudget#account_id}.
         * <p>
         * @return {@code this}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#account_id BudgetsBudget#account_id}. This parameter is required.
         */
        public Builder accountId(final java.lang.String accountId) {
            this.config.accountId(accountId);
            return this;
        }

        /**
         * auto_adjust_data block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#auto_adjust_data BudgetsBudget#auto_adjust_data}
         * <p>
         * @return {@code this}
         * @param autoAdjustData auto_adjust_data block. This parameter is required.
         */
        public Builder autoAdjustData(final imports.aws.budgets_budget.BudgetsBudgetAutoAdjustData autoAdjustData) {
            this.config.autoAdjustData(autoAdjustData);
            return this;
        }

        /**
         * cost_filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#cost_filter BudgetsBudget#cost_filter}
         * <p>
         * @return {@code this}
         * @param costFilter cost_filter block. This parameter is required.
         */
        public Builder costFilter(final com.hashicorp.cdktf.IResolvable costFilter) {
            this.config.costFilter(costFilter);
            return this;
        }
        /**
         * cost_filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#cost_filter BudgetsBudget#cost_filter}
         * <p>
         * @return {@code this}
         * @param costFilter cost_filter block. This parameter is required.
         */
        public Builder costFilter(final java.util.List<? extends imports.aws.budgets_budget.BudgetsBudgetCostFilter> costFilter) {
            this.config.costFilter(costFilter);
            return this;
        }

        /**
         * cost_types block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#cost_types BudgetsBudget#cost_types}
         * <p>
         * @return {@code this}
         * @param costTypes cost_types block. This parameter is required.
         */
        public Builder costTypes(final imports.aws.budgets_budget.BudgetsBudgetCostTypes costTypes) {
            this.config.costTypes(costTypes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#id BudgetsBudget#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#id BudgetsBudget#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#limit_amount BudgetsBudget#limit_amount}.
         * <p>
         * @return {@code this}
         * @param limitAmount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#limit_amount BudgetsBudget#limit_amount}. This parameter is required.
         */
        public Builder limitAmount(final java.lang.String limitAmount) {
            this.config.limitAmount(limitAmount);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#limit_unit BudgetsBudget#limit_unit}.
         * <p>
         * @return {@code this}
         * @param limitUnit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#limit_unit BudgetsBudget#limit_unit}. This parameter is required.
         */
        public Builder limitUnit(final java.lang.String limitUnit) {
            this.config.limitUnit(limitUnit);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#name BudgetsBudget#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#name BudgetsBudget#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#name_prefix BudgetsBudget#name_prefix}.
         * <p>
         * @return {@code this}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#name_prefix BudgetsBudget#name_prefix}. This parameter is required.
         */
        public Builder namePrefix(final java.lang.String namePrefix) {
            this.config.namePrefix(namePrefix);
            return this;
        }

        /**
         * notification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#notification BudgetsBudget#notification}
         * <p>
         * @return {@code this}
         * @param notification notification block. This parameter is required.
         */
        public Builder notification(final com.hashicorp.cdktf.IResolvable notification) {
            this.config.notification(notification);
            return this;
        }
        /**
         * notification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#notification BudgetsBudget#notification}
         * <p>
         * @return {@code this}
         * @param notification notification block. This parameter is required.
         */
        public Builder notification(final java.util.List<? extends imports.aws.budgets_budget.BudgetsBudgetNotification> notification) {
            this.config.notification(notification);
            return this;
        }

        /**
         * planned_limit block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#planned_limit BudgetsBudget#planned_limit}
         * <p>
         * @return {@code this}
         * @param plannedLimit planned_limit block. This parameter is required.
         */
        public Builder plannedLimit(final com.hashicorp.cdktf.IResolvable plannedLimit) {
            this.config.plannedLimit(plannedLimit);
            return this;
        }
        /**
         * planned_limit block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#planned_limit BudgetsBudget#planned_limit}
         * <p>
         * @return {@code this}
         * @param plannedLimit planned_limit block. This parameter is required.
         */
        public Builder plannedLimit(final java.util.List<? extends imports.aws.budgets_budget.BudgetsBudgetPlannedLimit> plannedLimit) {
            this.config.plannedLimit(plannedLimit);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#tags BudgetsBudget#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#tags BudgetsBudget#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#tags_all BudgetsBudget#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#tags_all BudgetsBudget#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#time_period_end BudgetsBudget#time_period_end}.
         * <p>
         * @return {@code this}
         * @param timePeriodEnd Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#time_period_end BudgetsBudget#time_period_end}. This parameter is required.
         */
        public Builder timePeriodEnd(final java.lang.String timePeriodEnd) {
            this.config.timePeriodEnd(timePeriodEnd);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#time_period_start BudgetsBudget#time_period_start}.
         * <p>
         * @return {@code this}
         * @param timePeriodStart Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#time_period_start BudgetsBudget#time_period_start}. This parameter is required.
         */
        public Builder timePeriodStart(final java.lang.String timePeriodStart) {
            this.config.timePeriodStart(timePeriodStart);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.budgets_budget.BudgetsBudget}.
         */
        @Override
        public imports.aws.budgets_budget.BudgetsBudget build() {
            return new imports.aws.budgets_budget.BudgetsBudget(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
