package imports.aws.data_aws_iam_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.673Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocumentStatementOutputReference")
public class DataAwsIamPolicyDocumentStatementOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsIamPolicyDocumentStatementOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsIamPolicyDocumentStatementOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsIamPolicyDocumentStatementOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putCondition(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementCondition>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementCondition> __cast_cd4240 = (java.util.List<imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementCondition>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementCondition __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCondition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNotPrincipals(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementNotPrincipals>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementNotPrincipals> __cast_cd4240 = (java.util.List<imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementNotPrincipals>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementNotPrincipals __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNotPrincipals", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPrincipals(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementPrincipals>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementPrincipals> __cast_cd4240 = (java.util.List<imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementPrincipals>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementPrincipals __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPrincipals", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetActions() {
        software.amazon.jsii.Kernel.call(this, "resetActions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCondition() {
        software.amazon.jsii.Kernel.call(this, "resetCondition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEffect() {
        software.amazon.jsii.Kernel.call(this, "resetEffect", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotActions() {
        software.amazon.jsii.Kernel.call(this, "resetNotActions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotPrincipals() {
        software.amazon.jsii.Kernel.call(this, "resetNotPrincipals", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotResources() {
        software.amazon.jsii.Kernel.call(this, "resetNotResources", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrincipals() {
        software.amazon.jsii.Kernel.call(this, "resetPrincipals", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResources() {
        software.amazon.jsii.Kernel.call(this, "resetResources", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSid() {
        software.amazon.jsii.Kernel.call(this, "resetSid", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementConditionList getCondition() {
        return software.amazon.jsii.Kernel.get(this, "condition", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementConditionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementNotPrincipalsList getNotPrincipals() {
        return software.amazon.jsii.Kernel.get(this, "notPrincipals", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementNotPrincipalsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementPrincipalsList getPrincipals() {
        return software.amazon.jsii.Kernel.get(this, "principals", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatementPrincipalsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getActionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "actionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConditionInput() {
        return software.amazon.jsii.Kernel.get(this, "conditionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEffectInput() {
        return software.amazon.jsii.Kernel.get(this, "effectInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotActionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "notActionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNotPrincipalsInput() {
        return software.amazon.jsii.Kernel.get(this, "notPrincipalsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotResourcesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "notResourcesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPrincipalsInput() {
        return software.amazon.jsii.Kernel.get(this, "principalsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourcesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "resourcesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSidInput() {
        return software.amazon.jsii.Kernel.get(this, "sidInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "actions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setActions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "actions", java.util.Objects.requireNonNull(value, "actions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEffect() {
        return software.amazon.jsii.Kernel.get(this, "effect", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEffect(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "effect", java.util.Objects.requireNonNull(value, "effect is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNotActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "notActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNotActions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "notActions", java.util.Objects.requireNonNull(value, "notActions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNotResources() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "notResources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNotResources(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "notResources", java.util.Objects.requireNonNull(value, "notResources is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getResources() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "resources", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setResources(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "resources", java.util.Objects.requireNonNull(value, "resources is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSid() {
        return software.amazon.jsii.Kernel.get(this, "sid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSid(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sid", java.util.Objects.requireNonNull(value, "sid is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_iam_policy_document.DataAwsIamPolicyDocumentStatement value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
