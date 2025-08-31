package imports.aws.ssm_maintenance_window_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.503Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig")
@software.amazon.jsii.Jsii.Proxy(SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig.Jsii$Proxy.class)
public interface SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#cloudwatch_log_group_name SsmMaintenanceWindowTask#cloudwatch_log_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCloudwatchLogGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#cloudwatch_output_enabled SsmMaintenanceWindowTask#cloudwatch_output_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchOutputEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig> {
        java.lang.String cloudwatchLogGroupName;
        java.lang.Object cloudwatchOutputEnabled;

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig#getCloudwatchLogGroupName}
         * @param cloudwatchLogGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#cloudwatch_log_group_name SsmMaintenanceWindowTask#cloudwatch_log_group_name}.
         * @return {@code this}
         */
        public Builder cloudwatchLogGroupName(java.lang.String cloudwatchLogGroupName) {
            this.cloudwatchLogGroupName = cloudwatchLogGroupName;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig#getCloudwatchOutputEnabled}
         * @param cloudwatchOutputEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#cloudwatch_output_enabled SsmMaintenanceWindowTask#cloudwatch_output_enabled}.
         * @return {@code this}
         */
        public Builder cloudwatchOutputEnabled(java.lang.Boolean cloudwatchOutputEnabled) {
            this.cloudwatchOutputEnabled = cloudwatchOutputEnabled;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig#getCloudwatchOutputEnabled}
         * @param cloudwatchOutputEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#cloudwatch_output_enabled SsmMaintenanceWindowTask#cloudwatch_output_enabled}.
         * @return {@code this}
         */
        public Builder cloudwatchOutputEnabled(com.hashicorp.cdktf.IResolvable cloudwatchOutputEnabled) {
            this.cloudwatchOutputEnabled = cloudwatchOutputEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig {
        private final java.lang.String cloudwatchLogGroupName;
        private final java.lang.Object cloudwatchOutputEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchLogGroupName = software.amazon.jsii.Kernel.get(this, "cloudwatchLogGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cloudwatchOutputEnabled = software.amazon.jsii.Kernel.get(this, "cloudwatchOutputEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchLogGroupName = builder.cloudwatchLogGroupName;
            this.cloudwatchOutputEnabled = builder.cloudwatchOutputEnabled;
        }

        @Override
        public final java.lang.String getCloudwatchLogGroupName() {
            return this.cloudwatchLogGroupName;
        }

        @Override
        public final java.lang.Object getCloudwatchOutputEnabled() {
            return this.cloudwatchOutputEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudwatchLogGroupName() != null) {
                data.set("cloudwatchLogGroupName", om.valueToTree(this.getCloudwatchLogGroupName()));
            }
            if (this.getCloudwatchOutputEnabled() != null) {
                data.set("cloudwatchOutputEnabled", om.valueToTree(this.getCloudwatchOutputEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig.Jsii$Proxy that = (SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersCloudwatchConfig.Jsii$Proxy) o;

            if (this.cloudwatchLogGroupName != null ? !this.cloudwatchLogGroupName.equals(that.cloudwatchLogGroupName) : that.cloudwatchLogGroupName != null) return false;
            return this.cloudwatchOutputEnabled != null ? this.cloudwatchOutputEnabled.equals(that.cloudwatchOutputEnabled) : that.cloudwatchOutputEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchLogGroupName != null ? this.cloudwatchLogGroupName.hashCode() : 0;
            result = 31 * result + (this.cloudwatchOutputEnabled != null ? this.cloudwatchOutputEnabled.hashCode() : 0);
            return result;
        }
    }
}
