package imports.aws.codedeploy_deployment_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.319Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codedeployDeploymentGroup.CodedeployDeploymentGroupAlarmConfiguration")
@software.amazon.jsii.Jsii.Proxy(CodedeployDeploymentGroupAlarmConfiguration.Jsii$Proxy.class)
public interface CodedeployDeploymentGroupAlarmConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#alarms CodedeployDeploymentGroup#alarms}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAlarms() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#enabled CodedeployDeploymentGroup#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ignore_poll_alarm_failure CodedeployDeploymentGroup#ignore_poll_alarm_failure}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIgnorePollAlarmFailure() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodedeployDeploymentGroupAlarmConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodedeployDeploymentGroupAlarmConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodedeployDeploymentGroupAlarmConfiguration> {
        java.util.List<java.lang.String> alarms;
        java.lang.Object enabled;
        java.lang.Object ignorePollAlarmFailure;

        /**
         * Sets the value of {@link CodedeployDeploymentGroupAlarmConfiguration#getAlarms}
         * @param alarms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#alarms CodedeployDeploymentGroup#alarms}.
         * @return {@code this}
         */
        public Builder alarms(java.util.List<java.lang.String> alarms) {
            this.alarms = alarms;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupAlarmConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#enabled CodedeployDeploymentGroup#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupAlarmConfiguration#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#enabled CodedeployDeploymentGroup#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupAlarmConfiguration#getIgnorePollAlarmFailure}
         * @param ignorePollAlarmFailure Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ignore_poll_alarm_failure CodedeployDeploymentGroup#ignore_poll_alarm_failure}.
         * @return {@code this}
         */
        public Builder ignorePollAlarmFailure(java.lang.Boolean ignorePollAlarmFailure) {
            this.ignorePollAlarmFailure = ignorePollAlarmFailure;
            return this;
        }

        /**
         * Sets the value of {@link CodedeployDeploymentGroupAlarmConfiguration#getIgnorePollAlarmFailure}
         * @param ignorePollAlarmFailure Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codedeploy_deployment_group#ignore_poll_alarm_failure CodedeployDeploymentGroup#ignore_poll_alarm_failure}.
         * @return {@code this}
         */
        public Builder ignorePollAlarmFailure(com.hashicorp.cdktf.IResolvable ignorePollAlarmFailure) {
            this.ignorePollAlarmFailure = ignorePollAlarmFailure;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodedeployDeploymentGroupAlarmConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodedeployDeploymentGroupAlarmConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodedeployDeploymentGroupAlarmConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodedeployDeploymentGroupAlarmConfiguration {
        private final java.util.List<java.lang.String> alarms;
        private final java.lang.Object enabled;
        private final java.lang.Object ignorePollAlarmFailure;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.alarms = software.amazon.jsii.Kernel.get(this, "alarms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ignorePollAlarmFailure = software.amazon.jsii.Kernel.get(this, "ignorePollAlarmFailure", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.alarms = builder.alarms;
            this.enabled = builder.enabled;
            this.ignorePollAlarmFailure = builder.ignorePollAlarmFailure;
        }

        @Override
        public final java.util.List<java.lang.String> getAlarms() {
            return this.alarms;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Object getIgnorePollAlarmFailure() {
            return this.ignorePollAlarmFailure;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAlarms() != null) {
                data.set("alarms", om.valueToTree(this.getAlarms()));
            }
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getIgnorePollAlarmFailure() != null) {
                data.set("ignorePollAlarmFailure", om.valueToTree(this.getIgnorePollAlarmFailure()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codedeployDeploymentGroup.CodedeployDeploymentGroupAlarmConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodedeployDeploymentGroupAlarmConfiguration.Jsii$Proxy that = (CodedeployDeploymentGroupAlarmConfiguration.Jsii$Proxy) o;

            if (this.alarms != null ? !this.alarms.equals(that.alarms) : that.alarms != null) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            return this.ignorePollAlarmFailure != null ? this.ignorePollAlarmFailure.equals(that.ignorePollAlarmFailure) : that.ignorePollAlarmFailure == null;
        }

        @Override
        public final int hashCode() {
            int result = this.alarms != null ? this.alarms.hashCode() : 0;
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.ignorePollAlarmFailure != null ? this.ignorePollAlarmFailure.hashCode() : 0);
            return result;
        }
    }
}
