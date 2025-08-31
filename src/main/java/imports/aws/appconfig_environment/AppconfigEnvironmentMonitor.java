package imports.aws.appconfig_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.984Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appconfigEnvironment.AppconfigEnvironmentMonitor")
@software.amazon.jsii.Jsii.Proxy(AppconfigEnvironmentMonitor.Jsii$Proxy.class)
public interface AppconfigEnvironmentMonitor extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_environment#alarm_arn AppconfigEnvironment#alarm_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAlarmArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_environment#alarm_role_arn AppconfigEnvironment#alarm_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAlarmRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppconfigEnvironmentMonitor}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppconfigEnvironmentMonitor}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppconfigEnvironmentMonitor> {
        java.lang.String alarmArn;
        java.lang.String alarmRoleArn;

        /**
         * Sets the value of {@link AppconfigEnvironmentMonitor#getAlarmArn}
         * @param alarmArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_environment#alarm_arn AppconfigEnvironment#alarm_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder alarmArn(java.lang.String alarmArn) {
            this.alarmArn = alarmArn;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigEnvironmentMonitor#getAlarmRoleArn}
         * @param alarmRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_environment#alarm_role_arn AppconfigEnvironment#alarm_role_arn}.
         * @return {@code this}
         */
        public Builder alarmRoleArn(java.lang.String alarmRoleArn) {
            this.alarmRoleArn = alarmRoleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppconfigEnvironmentMonitor}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppconfigEnvironmentMonitor build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppconfigEnvironmentMonitor}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppconfigEnvironmentMonitor {
        private final java.lang.String alarmArn;
        private final java.lang.String alarmRoleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.alarmArn = software.amazon.jsii.Kernel.get(this, "alarmArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.alarmRoleArn = software.amazon.jsii.Kernel.get(this, "alarmRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.alarmArn = java.util.Objects.requireNonNull(builder.alarmArn, "alarmArn is required");
            this.alarmRoleArn = builder.alarmRoleArn;
        }

        @Override
        public final java.lang.String getAlarmArn() {
            return this.alarmArn;
        }

        @Override
        public final java.lang.String getAlarmRoleArn() {
            return this.alarmRoleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("alarmArn", om.valueToTree(this.getAlarmArn()));
            if (this.getAlarmRoleArn() != null) {
                data.set("alarmRoleArn", om.valueToTree(this.getAlarmRoleArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appconfigEnvironment.AppconfigEnvironmentMonitor"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppconfigEnvironmentMonitor.Jsii$Proxy that = (AppconfigEnvironmentMonitor.Jsii$Proxy) o;

            if (!alarmArn.equals(that.alarmArn)) return false;
            return this.alarmRoleArn != null ? this.alarmRoleArn.equals(that.alarmRoleArn) : that.alarmRoleArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.alarmArn.hashCode();
            result = 31 * result + (this.alarmRoleArn != null ? this.alarmRoleArn.hashCode() : 0);
            return result;
        }
    }
}
