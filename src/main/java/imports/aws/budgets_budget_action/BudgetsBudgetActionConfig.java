package imports.aws.budgets_budget_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudgetAction.BudgetsBudgetActionConfig")
@software.amazon.jsii.Jsii.Proxy(BudgetsBudgetActionConfig.Jsii$Proxy.class)
public interface BudgetsBudgetActionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * action_threshold block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#action_threshold BudgetsBudgetAction#action_threshold}
     */
    @org.jetbrains.annotations.NotNull imports.aws.budgets_budget_action.BudgetsBudgetActionActionThreshold getActionThreshold();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#action_type BudgetsBudgetAction#action_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getActionType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#approval_model BudgetsBudgetAction#approval_model}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApprovalModel();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#budget_name BudgetsBudgetAction#budget_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBudgetName();

    /**
     * definition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#definition BudgetsBudgetAction#definition}
     */
    @org.jetbrains.annotations.NotNull imports.aws.budgets_budget_action.BudgetsBudgetActionDefinition getDefinition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#execution_role_arn BudgetsBudgetAction#execution_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#notification_type BudgetsBudgetAction#notification_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNotificationType();

    /**
     * subscriber block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#subscriber BudgetsBudgetAction#subscriber}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getSubscriber();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#account_id BudgetsBudgetAction#account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#id BudgetsBudgetAction#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#tags BudgetsBudgetAction#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#tags_all BudgetsBudgetAction#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#timeouts BudgetsBudgetAction#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.budgets_budget_action.BudgetsBudgetActionTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BudgetsBudgetActionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BudgetsBudgetActionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BudgetsBudgetActionConfig> {
        imports.aws.budgets_budget_action.BudgetsBudgetActionActionThreshold actionThreshold;
        java.lang.String actionType;
        java.lang.String approvalModel;
        java.lang.String budgetName;
        imports.aws.budgets_budget_action.BudgetsBudgetActionDefinition definition;
        java.lang.String executionRoleArn;
        java.lang.String notificationType;
        java.lang.Object subscriber;
        java.lang.String accountId;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.budgets_budget_action.BudgetsBudgetActionTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getActionThreshold}
         * @param actionThreshold action_threshold block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#action_threshold BudgetsBudgetAction#action_threshold}
         * @return {@code this}
         */
        public Builder actionThreshold(imports.aws.budgets_budget_action.BudgetsBudgetActionActionThreshold actionThreshold) {
            this.actionThreshold = actionThreshold;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getActionType}
         * @param actionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#action_type BudgetsBudgetAction#action_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder actionType(java.lang.String actionType) {
            this.actionType = actionType;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getApprovalModel}
         * @param approvalModel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#approval_model BudgetsBudgetAction#approval_model}. This parameter is required.
         * @return {@code this}
         */
        public Builder approvalModel(java.lang.String approvalModel) {
            this.approvalModel = approvalModel;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getBudgetName}
         * @param budgetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#budget_name BudgetsBudgetAction#budget_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder budgetName(java.lang.String budgetName) {
            this.budgetName = budgetName;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getDefinition}
         * @param definition definition block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#definition BudgetsBudgetAction#definition}
         * @return {@code this}
         */
        public Builder definition(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinition definition) {
            this.definition = definition;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getExecutionRoleArn}
         * @param executionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#execution_role_arn BudgetsBudgetAction#execution_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder executionRoleArn(java.lang.String executionRoleArn) {
            this.executionRoleArn = executionRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getNotificationType}
         * @param notificationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#notification_type BudgetsBudgetAction#notification_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder notificationType(java.lang.String notificationType) {
            this.notificationType = notificationType;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getSubscriber}
         * @param subscriber subscriber block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#subscriber BudgetsBudgetAction#subscriber}
         * @return {@code this}
         */
        public Builder subscriber(com.hashicorp.cdktf.IResolvable subscriber) {
            this.subscriber = subscriber;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getSubscriber}
         * @param subscriber subscriber block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#subscriber BudgetsBudgetAction#subscriber}
         * @return {@code this}
         */
        public Builder subscriber(java.util.List<? extends imports.aws.budgets_budget_action.BudgetsBudgetActionSubscriber> subscriber) {
            this.subscriber = subscriber;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#account_id BudgetsBudgetAction#account_id}.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#id BudgetsBudgetAction#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#tags BudgetsBudgetAction#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#tags_all BudgetsBudgetAction#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget_action#timeouts BudgetsBudgetAction#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.budgets_budget_action.BudgetsBudgetActionTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetActionConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BudgetsBudgetActionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BudgetsBudgetActionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BudgetsBudgetActionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BudgetsBudgetActionConfig {
        private final imports.aws.budgets_budget_action.BudgetsBudgetActionActionThreshold actionThreshold;
        private final java.lang.String actionType;
        private final java.lang.String approvalModel;
        private final java.lang.String budgetName;
        private final imports.aws.budgets_budget_action.BudgetsBudgetActionDefinition definition;
        private final java.lang.String executionRoleArn;
        private final java.lang.String notificationType;
        private final java.lang.Object subscriber;
        private final java.lang.String accountId;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.budgets_budget_action.BudgetsBudgetActionTimeouts timeouts;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.actionThreshold = software.amazon.jsii.Kernel.get(this, "actionThreshold", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionActionThreshold.class));
            this.actionType = software.amazon.jsii.Kernel.get(this, "actionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.approvalModel = software.amazon.jsii.Kernel.get(this, "approvalModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.budgetName = software.amazon.jsii.Kernel.get(this, "budgetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.definition = software.amazon.jsii.Kernel.get(this, "definition", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinition.class));
            this.executionRoleArn = software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notificationType = software.amazon.jsii.Kernel.get(this, "notificationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subscriber = software.amazon.jsii.Kernel.get(this, "subscriber", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionTimeouts.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.actionThreshold = java.util.Objects.requireNonNull(builder.actionThreshold, "actionThreshold is required");
            this.actionType = java.util.Objects.requireNonNull(builder.actionType, "actionType is required");
            this.approvalModel = java.util.Objects.requireNonNull(builder.approvalModel, "approvalModel is required");
            this.budgetName = java.util.Objects.requireNonNull(builder.budgetName, "budgetName is required");
            this.definition = java.util.Objects.requireNonNull(builder.definition, "definition is required");
            this.executionRoleArn = java.util.Objects.requireNonNull(builder.executionRoleArn, "executionRoleArn is required");
            this.notificationType = java.util.Objects.requireNonNull(builder.notificationType, "notificationType is required");
            this.subscriber = java.util.Objects.requireNonNull(builder.subscriber, "subscriber is required");
            this.accountId = builder.accountId;
            this.id = builder.id;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.budgets_budget_action.BudgetsBudgetActionActionThreshold getActionThreshold() {
            return this.actionThreshold;
        }

        @Override
        public final java.lang.String getActionType() {
            return this.actionType;
        }

        @Override
        public final java.lang.String getApprovalModel() {
            return this.approvalModel;
        }

        @Override
        public final java.lang.String getBudgetName() {
            return this.budgetName;
        }

        @Override
        public final imports.aws.budgets_budget_action.BudgetsBudgetActionDefinition getDefinition() {
            return this.definition;
        }

        @Override
        public final java.lang.String getExecutionRoleArn() {
            return this.executionRoleArn;
        }

        @Override
        public final java.lang.String getNotificationType() {
            return this.notificationType;
        }

        @Override
        public final java.lang.Object getSubscriber() {
            return this.subscriber;
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final imports.aws.budgets_budget_action.BudgetsBudgetActionTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("actionThreshold", om.valueToTree(this.getActionThreshold()));
            data.set("actionType", om.valueToTree(this.getActionType()));
            data.set("approvalModel", om.valueToTree(this.getApprovalModel()));
            data.set("budgetName", om.valueToTree(this.getBudgetName()));
            data.set("definition", om.valueToTree(this.getDefinition()));
            data.set("executionRoleArn", om.valueToTree(this.getExecutionRoleArn()));
            data.set("notificationType", om.valueToTree(this.getNotificationType()));
            data.set("subscriber", om.valueToTree(this.getSubscriber()));
            if (this.getAccountId() != null) {
                data.set("accountId", om.valueToTree(this.getAccountId()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.budgetsBudgetAction.BudgetsBudgetActionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BudgetsBudgetActionConfig.Jsii$Proxy that = (BudgetsBudgetActionConfig.Jsii$Proxy) o;

            if (!actionThreshold.equals(that.actionThreshold)) return false;
            if (!actionType.equals(that.actionType)) return false;
            if (!approvalModel.equals(that.approvalModel)) return false;
            if (!budgetName.equals(that.budgetName)) return false;
            if (!definition.equals(that.definition)) return false;
            if (!executionRoleArn.equals(that.executionRoleArn)) return false;
            if (!notificationType.equals(that.notificationType)) return false;
            if (!subscriber.equals(that.subscriber)) return false;
            if (this.accountId != null ? !this.accountId.equals(that.accountId) : that.accountId != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.actionThreshold.hashCode();
            result = 31 * result + (this.actionType.hashCode());
            result = 31 * result + (this.approvalModel.hashCode());
            result = 31 * result + (this.budgetName.hashCode());
            result = 31 * result + (this.definition.hashCode());
            result = 31 * result + (this.executionRoleArn.hashCode());
            result = 31 * result + (this.notificationType.hashCode());
            result = 31 * result + (this.subscriber.hashCode());
            result = 31 * result + (this.accountId != null ? this.accountId.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
