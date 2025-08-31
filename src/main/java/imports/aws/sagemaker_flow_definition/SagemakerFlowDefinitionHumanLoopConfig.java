package imports.aws.sagemaker_flow_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.325Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFlowDefinition.SagemakerFlowDefinitionHumanLoopConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerFlowDefinitionHumanLoopConfig.Jsii$Proxy.class)
public interface SagemakerFlowDefinitionHumanLoopConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#human_task_ui_arn SagemakerFlowDefinition#human_task_ui_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHumanTaskUiArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#task_count SagemakerFlowDefinition#task_count}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTaskCount();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#task_description SagemakerFlowDefinition#task_description}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTaskDescription();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#task_title SagemakerFlowDefinition#task_title}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTaskTitle();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#workteam_arn SagemakerFlowDefinition#workteam_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getWorkteamArn();

    /**
     * public_workforce_task_price block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#public_workforce_task_price SagemakerFlowDefinition#public_workforce_task_price}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice getPublicWorkforceTaskPrice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#task_availability_lifetime_in_seconds SagemakerFlowDefinition#task_availability_lifetime_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTaskAvailabilityLifetimeInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#task_keywords SagemakerFlowDefinition#task_keywords}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTaskKeywords() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#task_time_limit_in_seconds SagemakerFlowDefinition#task_time_limit_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTaskTimeLimitInSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFlowDefinitionHumanLoopConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFlowDefinitionHumanLoopConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFlowDefinitionHumanLoopConfig> {
        java.lang.String humanTaskUiArn;
        java.lang.Number taskCount;
        java.lang.String taskDescription;
        java.lang.String taskTitle;
        java.lang.String workteamArn;
        imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice publicWorkforceTaskPrice;
        java.lang.Number taskAvailabilityLifetimeInSeconds;
        java.util.List<java.lang.String> taskKeywords;
        java.lang.Number taskTimeLimitInSeconds;

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopConfig#getHumanTaskUiArn}
         * @param humanTaskUiArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#human_task_ui_arn SagemakerFlowDefinition#human_task_ui_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder humanTaskUiArn(java.lang.String humanTaskUiArn) {
            this.humanTaskUiArn = humanTaskUiArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopConfig#getTaskCount}
         * @param taskCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#task_count SagemakerFlowDefinition#task_count}. This parameter is required.
         * @return {@code this}
         */
        public Builder taskCount(java.lang.Number taskCount) {
            this.taskCount = taskCount;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopConfig#getTaskDescription}
         * @param taskDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#task_description SagemakerFlowDefinition#task_description}. This parameter is required.
         * @return {@code this}
         */
        public Builder taskDescription(java.lang.String taskDescription) {
            this.taskDescription = taskDescription;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopConfig#getTaskTitle}
         * @param taskTitle Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#task_title SagemakerFlowDefinition#task_title}. This parameter is required.
         * @return {@code this}
         */
        public Builder taskTitle(java.lang.String taskTitle) {
            this.taskTitle = taskTitle;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopConfig#getWorkteamArn}
         * @param workteamArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#workteam_arn SagemakerFlowDefinition#workteam_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder workteamArn(java.lang.String workteamArn) {
            this.workteamArn = workteamArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopConfig#getPublicWorkforceTaskPrice}
         * @param publicWorkforceTaskPrice public_workforce_task_price block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#public_workforce_task_price SagemakerFlowDefinition#public_workforce_task_price}
         * @return {@code this}
         */
        public Builder publicWorkforceTaskPrice(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice publicWorkforceTaskPrice) {
            this.publicWorkforceTaskPrice = publicWorkforceTaskPrice;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopConfig#getTaskAvailabilityLifetimeInSeconds}
         * @param taskAvailabilityLifetimeInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#task_availability_lifetime_in_seconds SagemakerFlowDefinition#task_availability_lifetime_in_seconds}.
         * @return {@code this}
         */
        public Builder taskAvailabilityLifetimeInSeconds(java.lang.Number taskAvailabilityLifetimeInSeconds) {
            this.taskAvailabilityLifetimeInSeconds = taskAvailabilityLifetimeInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopConfig#getTaskKeywords}
         * @param taskKeywords Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#task_keywords SagemakerFlowDefinition#task_keywords}.
         * @return {@code this}
         */
        public Builder taskKeywords(java.util.List<java.lang.String> taskKeywords) {
            this.taskKeywords = taskKeywords;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopConfig#getTaskTimeLimitInSeconds}
         * @param taskTimeLimitInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#task_time_limit_in_seconds SagemakerFlowDefinition#task_time_limit_in_seconds}.
         * @return {@code this}
         */
        public Builder taskTimeLimitInSeconds(java.lang.Number taskTimeLimitInSeconds) {
            this.taskTimeLimitInSeconds = taskTimeLimitInSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerFlowDefinitionHumanLoopConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFlowDefinitionHumanLoopConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFlowDefinitionHumanLoopConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFlowDefinitionHumanLoopConfig {
        private final java.lang.String humanTaskUiArn;
        private final java.lang.Number taskCount;
        private final java.lang.String taskDescription;
        private final java.lang.String taskTitle;
        private final java.lang.String workteamArn;
        private final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice publicWorkforceTaskPrice;
        private final java.lang.Number taskAvailabilityLifetimeInSeconds;
        private final java.util.List<java.lang.String> taskKeywords;
        private final java.lang.Number taskTimeLimitInSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.humanTaskUiArn = software.amazon.jsii.Kernel.get(this, "humanTaskUiArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.taskCount = software.amazon.jsii.Kernel.get(this, "taskCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.taskDescription = software.amazon.jsii.Kernel.get(this, "taskDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.taskTitle = software.amazon.jsii.Kernel.get(this, "taskTitle", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.workteamArn = software.amazon.jsii.Kernel.get(this, "workteamArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.publicWorkforceTaskPrice = software.amazon.jsii.Kernel.get(this, "publicWorkforceTaskPrice", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice.class));
            this.taskAvailabilityLifetimeInSeconds = software.amazon.jsii.Kernel.get(this, "taskAvailabilityLifetimeInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.taskKeywords = software.amazon.jsii.Kernel.get(this, "taskKeywords", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.taskTimeLimitInSeconds = software.amazon.jsii.Kernel.get(this, "taskTimeLimitInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.humanTaskUiArn = java.util.Objects.requireNonNull(builder.humanTaskUiArn, "humanTaskUiArn is required");
            this.taskCount = java.util.Objects.requireNonNull(builder.taskCount, "taskCount is required");
            this.taskDescription = java.util.Objects.requireNonNull(builder.taskDescription, "taskDescription is required");
            this.taskTitle = java.util.Objects.requireNonNull(builder.taskTitle, "taskTitle is required");
            this.workteamArn = java.util.Objects.requireNonNull(builder.workteamArn, "workteamArn is required");
            this.publicWorkforceTaskPrice = builder.publicWorkforceTaskPrice;
            this.taskAvailabilityLifetimeInSeconds = builder.taskAvailabilityLifetimeInSeconds;
            this.taskKeywords = builder.taskKeywords;
            this.taskTimeLimitInSeconds = builder.taskTimeLimitInSeconds;
        }

        @Override
        public final java.lang.String getHumanTaskUiArn() {
            return this.humanTaskUiArn;
        }

        @Override
        public final java.lang.Number getTaskCount() {
            return this.taskCount;
        }

        @Override
        public final java.lang.String getTaskDescription() {
            return this.taskDescription;
        }

        @Override
        public final java.lang.String getTaskTitle() {
            return this.taskTitle;
        }

        @Override
        public final java.lang.String getWorkteamArn() {
            return this.workteamArn;
        }

        @Override
        public final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice getPublicWorkforceTaskPrice() {
            return this.publicWorkforceTaskPrice;
        }

        @Override
        public final java.lang.Number getTaskAvailabilityLifetimeInSeconds() {
            return this.taskAvailabilityLifetimeInSeconds;
        }

        @Override
        public final java.util.List<java.lang.String> getTaskKeywords() {
            return this.taskKeywords;
        }

        @Override
        public final java.lang.Number getTaskTimeLimitInSeconds() {
            return this.taskTimeLimitInSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("humanTaskUiArn", om.valueToTree(this.getHumanTaskUiArn()));
            data.set("taskCount", om.valueToTree(this.getTaskCount()));
            data.set("taskDescription", om.valueToTree(this.getTaskDescription()));
            data.set("taskTitle", om.valueToTree(this.getTaskTitle()));
            data.set("workteamArn", om.valueToTree(this.getWorkteamArn()));
            if (this.getPublicWorkforceTaskPrice() != null) {
                data.set("publicWorkforceTaskPrice", om.valueToTree(this.getPublicWorkforceTaskPrice()));
            }
            if (this.getTaskAvailabilityLifetimeInSeconds() != null) {
                data.set("taskAvailabilityLifetimeInSeconds", om.valueToTree(this.getTaskAvailabilityLifetimeInSeconds()));
            }
            if (this.getTaskKeywords() != null) {
                data.set("taskKeywords", om.valueToTree(this.getTaskKeywords()));
            }
            if (this.getTaskTimeLimitInSeconds() != null) {
                data.set("taskTimeLimitInSeconds", om.valueToTree(this.getTaskTimeLimitInSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerFlowDefinition.SagemakerFlowDefinitionHumanLoopConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFlowDefinitionHumanLoopConfig.Jsii$Proxy that = (SagemakerFlowDefinitionHumanLoopConfig.Jsii$Proxy) o;

            if (!humanTaskUiArn.equals(that.humanTaskUiArn)) return false;
            if (!taskCount.equals(that.taskCount)) return false;
            if (!taskDescription.equals(that.taskDescription)) return false;
            if (!taskTitle.equals(that.taskTitle)) return false;
            if (!workteamArn.equals(that.workteamArn)) return false;
            if (this.publicWorkforceTaskPrice != null ? !this.publicWorkforceTaskPrice.equals(that.publicWorkforceTaskPrice) : that.publicWorkforceTaskPrice != null) return false;
            if (this.taskAvailabilityLifetimeInSeconds != null ? !this.taskAvailabilityLifetimeInSeconds.equals(that.taskAvailabilityLifetimeInSeconds) : that.taskAvailabilityLifetimeInSeconds != null) return false;
            if (this.taskKeywords != null ? !this.taskKeywords.equals(that.taskKeywords) : that.taskKeywords != null) return false;
            return this.taskTimeLimitInSeconds != null ? this.taskTimeLimitInSeconds.equals(that.taskTimeLimitInSeconds) : that.taskTimeLimitInSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.humanTaskUiArn.hashCode();
            result = 31 * result + (this.taskCount.hashCode());
            result = 31 * result + (this.taskDescription.hashCode());
            result = 31 * result + (this.taskTitle.hashCode());
            result = 31 * result + (this.workteamArn.hashCode());
            result = 31 * result + (this.publicWorkforceTaskPrice != null ? this.publicWorkforceTaskPrice.hashCode() : 0);
            result = 31 * result + (this.taskAvailabilityLifetimeInSeconds != null ? this.taskAvailabilityLifetimeInSeconds.hashCode() : 0);
            result = 31 * result + (this.taskKeywords != null ? this.taskKeywords.hashCode() : 0);
            result = 31 * result + (this.taskTimeLimitInSeconds != null ? this.taskTimeLimitInSeconds.hashCode() : 0);
            return result;
        }
    }
}
