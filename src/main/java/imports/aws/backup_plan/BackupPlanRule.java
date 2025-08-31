package imports.aws.backup_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.117Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.backupPlan.BackupPlanRule")
@software.amazon.jsii.Jsii.Proxy(BackupPlanRule.Jsii$Proxy.class)
public interface BackupPlanRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#rule_name BackupPlan#rule_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuleName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#target_vault_name BackupPlan#target_vault_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetVaultName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#completion_window BackupPlan#completion_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCompletionWindow() {
        return null;
    }

    /**
     * copy_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#copy_action BackupPlan#copy_action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#enable_continuous_backup BackupPlan#enable_continuous_backup}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableContinuousBackup() {
        return null;
    }

    /**
     * lifecycle block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#lifecycle BackupPlan#lifecycle}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.backup_plan.BackupPlanRuleLifecycle getLifecycle() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#recovery_point_tags BackupPlan#recovery_point_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRecoveryPointTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#schedule BackupPlan#schedule}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSchedule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#schedule_expression_timezone BackupPlan#schedule_expression_timezone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScheduleExpressionTimezone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#start_window BackupPlan#start_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getStartWindow() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BackupPlanRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BackupPlanRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BackupPlanRule> {
        java.lang.String ruleName;
        java.lang.String targetVaultName;
        java.lang.Number completionWindow;
        java.lang.Object copyAction;
        java.lang.Object enableContinuousBackup;
        imports.aws.backup_plan.BackupPlanRuleLifecycle lifecycle;
        java.util.Map<java.lang.String, java.lang.String> recoveryPointTags;
        java.lang.String schedule;
        java.lang.String scheduleExpressionTimezone;
        java.lang.Number startWindow;

        /**
         * Sets the value of {@link BackupPlanRule#getRuleName}
         * @param ruleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#rule_name BackupPlan#rule_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleName(java.lang.String ruleName) {
            this.ruleName = ruleName;
            return this;
        }

        /**
         * Sets the value of {@link BackupPlanRule#getTargetVaultName}
         * @param targetVaultName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#target_vault_name BackupPlan#target_vault_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetVaultName(java.lang.String targetVaultName) {
            this.targetVaultName = targetVaultName;
            return this;
        }

        /**
         * Sets the value of {@link BackupPlanRule#getCompletionWindow}
         * @param completionWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#completion_window BackupPlan#completion_window}.
         * @return {@code this}
         */
        public Builder completionWindow(java.lang.Number completionWindow) {
            this.completionWindow = completionWindow;
            return this;
        }

        /**
         * Sets the value of {@link BackupPlanRule#getCopyAction}
         * @param copyAction copy_action block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#copy_action BackupPlan#copy_action}
         * @return {@code this}
         */
        public Builder copyAction(com.hashicorp.cdktf.IResolvable copyAction) {
            this.copyAction = copyAction;
            return this;
        }

        /**
         * Sets the value of {@link BackupPlanRule#getCopyAction}
         * @param copyAction copy_action block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#copy_action BackupPlan#copy_action}
         * @return {@code this}
         */
        public Builder copyAction(java.util.List<? extends imports.aws.backup_plan.BackupPlanRuleCopyAction> copyAction) {
            this.copyAction = copyAction;
            return this;
        }

        /**
         * Sets the value of {@link BackupPlanRule#getEnableContinuousBackup}
         * @param enableContinuousBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#enable_continuous_backup BackupPlan#enable_continuous_backup}.
         * @return {@code this}
         */
        public Builder enableContinuousBackup(java.lang.Boolean enableContinuousBackup) {
            this.enableContinuousBackup = enableContinuousBackup;
            return this;
        }

        /**
         * Sets the value of {@link BackupPlanRule#getEnableContinuousBackup}
         * @param enableContinuousBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#enable_continuous_backup BackupPlan#enable_continuous_backup}.
         * @return {@code this}
         */
        public Builder enableContinuousBackup(com.hashicorp.cdktf.IResolvable enableContinuousBackup) {
            this.enableContinuousBackup = enableContinuousBackup;
            return this;
        }

        /**
         * Sets the value of {@link BackupPlanRule#getLifecycle}
         * @param lifecycle lifecycle block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#lifecycle BackupPlan#lifecycle}
         * @return {@code this}
         */
        public Builder lifecycle(imports.aws.backup_plan.BackupPlanRuleLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link BackupPlanRule#getRecoveryPointTags}
         * @param recoveryPointTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#recovery_point_tags BackupPlan#recovery_point_tags}.
         * @return {@code this}
         */
        public Builder recoveryPointTags(java.util.Map<java.lang.String, java.lang.String> recoveryPointTags) {
            this.recoveryPointTags = recoveryPointTags;
            return this;
        }

        /**
         * Sets the value of {@link BackupPlanRule#getSchedule}
         * @param schedule Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#schedule BackupPlan#schedule}.
         * @return {@code this}
         */
        public Builder schedule(java.lang.String schedule) {
            this.schedule = schedule;
            return this;
        }

        /**
         * Sets the value of {@link BackupPlanRule#getScheduleExpressionTimezone}
         * @param scheduleExpressionTimezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#schedule_expression_timezone BackupPlan#schedule_expression_timezone}.
         * @return {@code this}
         */
        public Builder scheduleExpressionTimezone(java.lang.String scheduleExpressionTimezone) {
            this.scheduleExpressionTimezone = scheduleExpressionTimezone;
            return this;
        }

        /**
         * Sets the value of {@link BackupPlanRule#getStartWindow}
         * @param startWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/backup_plan#start_window BackupPlan#start_window}.
         * @return {@code this}
         */
        public Builder startWindow(java.lang.Number startWindow) {
            this.startWindow = startWindow;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BackupPlanRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BackupPlanRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BackupPlanRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BackupPlanRule {
        private final java.lang.String ruleName;
        private final java.lang.String targetVaultName;
        private final java.lang.Number completionWindow;
        private final java.lang.Object copyAction;
        private final java.lang.Object enableContinuousBackup;
        private final imports.aws.backup_plan.BackupPlanRuleLifecycle lifecycle;
        private final java.util.Map<java.lang.String, java.lang.String> recoveryPointTags;
        private final java.lang.String schedule;
        private final java.lang.String scheduleExpressionTimezone;
        private final java.lang.Number startWindow;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ruleName = software.amazon.jsii.Kernel.get(this, "ruleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetVaultName = software.amazon.jsii.Kernel.get(this, "targetVaultName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.completionWindow = software.amazon.jsii.Kernel.get(this, "completionWindow", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.copyAction = software.amazon.jsii.Kernel.get(this, "copyAction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableContinuousBackup = software.amazon.jsii.Kernel.get(this, "enableContinuousBackup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(imports.aws.backup_plan.BackupPlanRuleLifecycle.class));
            this.recoveryPointTags = software.amazon.jsii.Kernel.get(this, "recoveryPointTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.schedule = software.amazon.jsii.Kernel.get(this, "schedule", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scheduleExpressionTimezone = software.amazon.jsii.Kernel.get(this, "scheduleExpressionTimezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startWindow = software.amazon.jsii.Kernel.get(this, "startWindow", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ruleName = java.util.Objects.requireNonNull(builder.ruleName, "ruleName is required");
            this.targetVaultName = java.util.Objects.requireNonNull(builder.targetVaultName, "targetVaultName is required");
            this.completionWindow = builder.completionWindow;
            this.copyAction = builder.copyAction;
            this.enableContinuousBackup = builder.enableContinuousBackup;
            this.lifecycle = builder.lifecycle;
            this.recoveryPointTags = builder.recoveryPointTags;
            this.schedule = builder.schedule;
            this.scheduleExpressionTimezone = builder.scheduleExpressionTimezone;
            this.startWindow = builder.startWindow;
        }

        @Override
        public final java.lang.String getRuleName() {
            return this.ruleName;
        }

        @Override
        public final java.lang.String getTargetVaultName() {
            return this.targetVaultName;
        }

        @Override
        public final java.lang.Number getCompletionWindow() {
            return this.completionWindow;
        }

        @Override
        public final java.lang.Object getCopyAction() {
            return this.copyAction;
        }

        @Override
        public final java.lang.Object getEnableContinuousBackup() {
            return this.enableContinuousBackup;
        }

        @Override
        public final imports.aws.backup_plan.BackupPlanRuleLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getRecoveryPointTags() {
            return this.recoveryPointTags;
        }

        @Override
        public final java.lang.String getSchedule() {
            return this.schedule;
        }

        @Override
        public final java.lang.String getScheduleExpressionTimezone() {
            return this.scheduleExpressionTimezone;
        }

        @Override
        public final java.lang.Number getStartWindow() {
            return this.startWindow;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ruleName", om.valueToTree(this.getRuleName()));
            data.set("targetVaultName", om.valueToTree(this.getTargetVaultName()));
            if (this.getCompletionWindow() != null) {
                data.set("completionWindow", om.valueToTree(this.getCompletionWindow()));
            }
            if (this.getCopyAction() != null) {
                data.set("copyAction", om.valueToTree(this.getCopyAction()));
            }
            if (this.getEnableContinuousBackup() != null) {
                data.set("enableContinuousBackup", om.valueToTree(this.getEnableContinuousBackup()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getRecoveryPointTags() != null) {
                data.set("recoveryPointTags", om.valueToTree(this.getRecoveryPointTags()));
            }
            if (this.getSchedule() != null) {
                data.set("schedule", om.valueToTree(this.getSchedule()));
            }
            if (this.getScheduleExpressionTimezone() != null) {
                data.set("scheduleExpressionTimezone", om.valueToTree(this.getScheduleExpressionTimezone()));
            }
            if (this.getStartWindow() != null) {
                data.set("startWindow", om.valueToTree(this.getStartWindow()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.backupPlan.BackupPlanRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BackupPlanRule.Jsii$Proxy that = (BackupPlanRule.Jsii$Proxy) o;

            if (!ruleName.equals(that.ruleName)) return false;
            if (!targetVaultName.equals(that.targetVaultName)) return false;
            if (this.completionWindow != null ? !this.completionWindow.equals(that.completionWindow) : that.completionWindow != null) return false;
            if (this.copyAction != null ? !this.copyAction.equals(that.copyAction) : that.copyAction != null) return false;
            if (this.enableContinuousBackup != null ? !this.enableContinuousBackup.equals(that.enableContinuousBackup) : that.enableContinuousBackup != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.recoveryPointTags != null ? !this.recoveryPointTags.equals(that.recoveryPointTags) : that.recoveryPointTags != null) return false;
            if (this.schedule != null ? !this.schedule.equals(that.schedule) : that.schedule != null) return false;
            if (this.scheduleExpressionTimezone != null ? !this.scheduleExpressionTimezone.equals(that.scheduleExpressionTimezone) : that.scheduleExpressionTimezone != null) return false;
            return this.startWindow != null ? this.startWindow.equals(that.startWindow) : that.startWindow == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ruleName.hashCode();
            result = 31 * result + (this.targetVaultName.hashCode());
            result = 31 * result + (this.completionWindow != null ? this.completionWindow.hashCode() : 0);
            result = 31 * result + (this.copyAction != null ? this.copyAction.hashCode() : 0);
            result = 31 * result + (this.enableContinuousBackup != null ? this.enableContinuousBackup.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.recoveryPointTags != null ? this.recoveryPointTags.hashCode() : 0);
            result = 31 * result + (this.schedule != null ? this.schedule.hashCode() : 0);
            result = 31 * result + (this.scheduleExpressionTimezone != null ? this.scheduleExpressionTimezone.hashCode() : 0);
            result = 31 * result + (this.startWindow != null ? this.startWindow.hashCode() : 0);
            return result;
        }
    }
}
