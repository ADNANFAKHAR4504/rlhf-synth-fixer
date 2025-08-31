package imports.aws.iot_topic_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.415Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotTopicRule.IotTopicRuleErrorActionCloudwatchLogs")
@software.amazon.jsii.Jsii.Proxy(IotTopicRuleErrorActionCloudwatchLogs.Jsii$Proxy.class)
public interface IotTopicRuleErrorActionCloudwatchLogs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#log_group_name IotTopicRule#log_group_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLogGroupName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#role_arn IotTopicRule#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#batch_mode IotTopicRule#batch_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBatchMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotTopicRuleErrorActionCloudwatchLogs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotTopicRuleErrorActionCloudwatchLogs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotTopicRuleErrorActionCloudwatchLogs> {
        java.lang.String logGroupName;
        java.lang.String roleArn;
        java.lang.Object batchMode;

        /**
         * Sets the value of {@link IotTopicRuleErrorActionCloudwatchLogs#getLogGroupName}
         * @param logGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#log_group_name IotTopicRule#log_group_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder logGroupName(java.lang.String logGroupName) {
            this.logGroupName = logGroupName;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorActionCloudwatchLogs#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#role_arn IotTopicRule#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorActionCloudwatchLogs#getBatchMode}
         * @param batchMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#batch_mode IotTopicRule#batch_mode}.
         * @return {@code this}
         */
        public Builder batchMode(java.lang.Boolean batchMode) {
            this.batchMode = batchMode;
            return this;
        }

        /**
         * Sets the value of {@link IotTopicRuleErrorActionCloudwatchLogs#getBatchMode}
         * @param batchMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_topic_rule#batch_mode IotTopicRule#batch_mode}.
         * @return {@code this}
         */
        public Builder batchMode(com.hashicorp.cdktf.IResolvable batchMode) {
            this.batchMode = batchMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotTopicRuleErrorActionCloudwatchLogs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotTopicRuleErrorActionCloudwatchLogs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotTopicRuleErrorActionCloudwatchLogs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotTopicRuleErrorActionCloudwatchLogs {
        private final java.lang.String logGroupName;
        private final java.lang.String roleArn;
        private final java.lang.Object batchMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.logGroupName = software.amazon.jsii.Kernel.get(this, "logGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.batchMode = software.amazon.jsii.Kernel.get(this, "batchMode", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.logGroupName = java.util.Objects.requireNonNull(builder.logGroupName, "logGroupName is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.batchMode = builder.batchMode;
        }

        @Override
        public final java.lang.String getLogGroupName() {
            return this.logGroupName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Object getBatchMode() {
            return this.batchMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("logGroupName", om.valueToTree(this.getLogGroupName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getBatchMode() != null) {
                data.set("batchMode", om.valueToTree(this.getBatchMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotTopicRule.IotTopicRuleErrorActionCloudwatchLogs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotTopicRuleErrorActionCloudwatchLogs.Jsii$Proxy that = (IotTopicRuleErrorActionCloudwatchLogs.Jsii$Proxy) o;

            if (!logGroupName.equals(that.logGroupName)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            return this.batchMode != null ? this.batchMode.equals(that.batchMode) : that.batchMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.logGroupName.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.batchMode != null ? this.batchMode.hashCode() : 0);
            return result;
        }
    }
}
