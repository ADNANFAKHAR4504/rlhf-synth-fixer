package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.326Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupTriggerConfiguration")
@software.amazon.jsii.Jsii.Proxy(CodedeployDeploymentGroupTriggerConfiguration.Jsii$Proxy.class)
public interface CodedeployDeploymentGroupTriggerConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#trigger_events CodedeployDeploymentGroup#trigger_events}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTriggerEvents();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#trigger_name CodedeployDeploymentGroup#trigger_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTriggerName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#trigger_target_arn CodedeployDeploymentGroup#trigger_target_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTriggerTargetArn();

    /**
     * @return a {@link Builder} of {@link CodedeployDeploymentGroupTriggerConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodedeployDeploymentGroupTriggerConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodedeployDeploymentGroupTriggerConfiguration> {
        java.util.List<java.lang.String> triggerEvents;
        java.lang.String triggerName;
        java.lang.String triggerTargetArn;

        /**
         * Sets the value of {@link CodedeployDeploymentGroupTriggerConfiguration#getTriggerEvents}
         * @param triggerEvents Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#trigger_events CodedeployDeploymentGroup#trigger_events}. This parameter is required.
         * @return {@code this}
         */
        public Builder triggerEvents(java.util.List<java.lang.String> triggerEvents) {
            this.triggerEvents = triggerEvents;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupTriggerConfiguration#getTriggerName}
         * @param triggerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#trigger_name CodedeployDeploymentGroup#trigger_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder triggerName(java.lang.String triggerName) {
            this.triggerName = triggerName;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupTriggerConfiguration#getTriggerTargetArn}
         * @param triggerTargetArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#trigger_target_arn CodedeployDeploymentGroup#trigger_target_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder triggerTargetArn(java.lang.String triggerTargetArn) {
            this.triggerTargetArn = triggerTargetArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodedeployDeploymentGroupTriggerConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodedeployDeploymentGroupTriggerConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodedeployDeploymentGroupTriggerConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodedeployDeploymentGroupTriggerConfiguration {
        private final java.util.List<java.lang.String> triggerEvents;
        private final java.lang.String triggerName;
        private final java.lang.String triggerTargetArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.triggerEvents = software.amazon.jsii.Kernel.get(this, "triggerEvents", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.triggerName = software.amazon.jsii.Kernel.get(this, "triggerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.triggerTargetArn = software.amazon.jsii.Kernel.get(this, "triggerTargetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.triggerEvents = java.util.Objects.requireNonNull(builder.triggerEvents, "triggerEvents is required");
            this.triggerName = java.util.Objects.requireNonNull(builder.triggerName, "triggerName is required");
            this.triggerTargetArn = java.util.Objects.requireNonNull(builder.triggerTargetArn, "triggerTargetArn is required");
        }

        @Override
        public final java.util.List<java.lang.String> getTriggerEvents() {
            return this.triggerEvents;
        }

        @Override
        public final java.lang.String getTriggerName() {
            return this.triggerName;
        }

        @Override
        public final java.lang.String getTriggerTargetArn() {
            return this.triggerTargetArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("triggerEvents", om.valueToTree(this.getTriggerEvents()));
            data.set("triggerName", om.valueToTree(this.getTriggerName()));
            data.set("triggerTargetArn", om.valueToTree(this.getTriggerTargetArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codedeployDeploymentGroup.CodedeployDeploymentGroupTriggerConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodedeployDeploymentGroupTriggerConfiguration.Jsii$Proxy that = (CodedeployDeploymentGroupTriggerConfiguration.Jsii$Proxy) o;

            if (!triggerEvents.equals(that.triggerEvents)) return false;
            if (!triggerName.equals(that.triggerName)) return false;
            return this.triggerTargetArn.equals(that.triggerTargetArn);
        }

        @Override
        public final int hashCode() {
            int result = this.triggerEvents.hashCode();
            result = 31 * result + (this.triggerName.hashCode());
            result = 31 * result + (this.triggerTargetArn.hashCode());
            return result;
        }
    }
}
