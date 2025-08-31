package imports.aws.cloudformation_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.227Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudformationType.CloudformationTypeLoggingConfig")
@software.amazon.jsii.Jsii.Proxy(CloudformationTypeLoggingConfig.Jsii$Proxy.class)
public interface CloudformationTypeLoggingConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_type#log_group_name CloudformationType#log_group_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLogGroupName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_type#log_role_arn CloudformationType#log_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLogRoleArn();

    /**
     * @return a {@link Builder} of {@link CloudformationTypeLoggingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudformationTypeLoggingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudformationTypeLoggingConfig> {
        java.lang.String logGroupName;
        java.lang.String logRoleArn;

        /**
         * Sets the value of {@link CloudformationTypeLoggingConfig#getLogGroupName}
         * @param logGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_type#log_group_name CloudformationType#log_group_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder logGroupName(java.lang.String logGroupName) {
            this.logGroupName = logGroupName;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationTypeLoggingConfig#getLogRoleArn}
         * @param logRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_type#log_role_arn CloudformationType#log_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder logRoleArn(java.lang.String logRoleArn) {
            this.logRoleArn = logRoleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudformationTypeLoggingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudformationTypeLoggingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudformationTypeLoggingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudformationTypeLoggingConfig {
        private final java.lang.String logGroupName;
        private final java.lang.String logRoleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.logGroupName = software.amazon.jsii.Kernel.get(this, "logGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logRoleArn = software.amazon.jsii.Kernel.get(this, "logRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.logGroupName = java.util.Objects.requireNonNull(builder.logGroupName, "logGroupName is required");
            this.logRoleArn = java.util.Objects.requireNonNull(builder.logRoleArn, "logRoleArn is required");
        }

        @Override
        public final java.lang.String getLogGroupName() {
            return this.logGroupName;
        }

        @Override
        public final java.lang.String getLogRoleArn() {
            return this.logRoleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("logGroupName", om.valueToTree(this.getLogGroupName()));
            data.set("logRoleArn", om.valueToTree(this.getLogRoleArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudformationType.CloudformationTypeLoggingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudformationTypeLoggingConfig.Jsii$Proxy that = (CloudformationTypeLoggingConfig.Jsii$Proxy) o;

            if (!logGroupName.equals(that.logGroupName)) return false;
            return this.logRoleArn.equals(that.logRoleArn);
        }

        @Override
        public final int hashCode() {
            int result = this.logGroupName.hashCode();
            result = 31 * result + (this.logRoleArn.hashCode());
            return result;
        }
    }
}
