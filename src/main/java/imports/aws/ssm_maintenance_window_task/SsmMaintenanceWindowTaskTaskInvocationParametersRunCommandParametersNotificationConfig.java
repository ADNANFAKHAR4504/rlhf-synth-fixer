package imports.aws.ssm_maintenance_window_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.503Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig")
@software.amazon.jsii.Jsii.Proxy(SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig.Jsii$Proxy.class)
public interface SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#notification_arn SsmMaintenanceWindowTask#notification_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNotificationArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#notification_events SsmMaintenanceWindowTask#notification_events}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNotificationEvents() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#notification_type SsmMaintenanceWindowTask#notification_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNotificationType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig> {
        java.lang.String notificationArn;
        java.util.List<java.lang.String> notificationEvents;
        java.lang.String notificationType;

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig#getNotificationArn}
         * @param notificationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#notification_arn SsmMaintenanceWindowTask#notification_arn}.
         * @return {@code this}
         */
        public Builder notificationArn(java.lang.String notificationArn) {
            this.notificationArn = notificationArn;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig#getNotificationEvents}
         * @param notificationEvents Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#notification_events SsmMaintenanceWindowTask#notification_events}.
         * @return {@code this}
         */
        public Builder notificationEvents(java.util.List<java.lang.String> notificationEvents) {
            this.notificationEvents = notificationEvents;
            return this;
        }

        /**
         * Sets the value of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig#getNotificationType}
         * @param notificationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_maintenance_window_task#notification_type SsmMaintenanceWindowTask#notification_type}.
         * @return {@code this}
         */
        public Builder notificationType(java.lang.String notificationType) {
            this.notificationType = notificationType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig {
        private final java.lang.String notificationArn;
        private final java.util.List<java.lang.String> notificationEvents;
        private final java.lang.String notificationType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.notificationArn = software.amazon.jsii.Kernel.get(this, "notificationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notificationEvents = software.amazon.jsii.Kernel.get(this, "notificationEvents", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.notificationType = software.amazon.jsii.Kernel.get(this, "notificationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.notificationArn = builder.notificationArn;
            this.notificationEvents = builder.notificationEvents;
            this.notificationType = builder.notificationType;
        }

        @Override
        public final java.lang.String getNotificationArn() {
            return this.notificationArn;
        }

        @Override
        public final java.util.List<java.lang.String> getNotificationEvents() {
            return this.notificationEvents;
        }

        @Override
        public final java.lang.String getNotificationType() {
            return this.notificationType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNotificationArn() != null) {
                data.set("notificationArn", om.valueToTree(this.getNotificationArn()));
            }
            if (this.getNotificationEvents() != null) {
                data.set("notificationEvents", om.valueToTree(this.getNotificationEvents()));
            }
            if (this.getNotificationType() != null) {
                data.set("notificationType", om.valueToTree(this.getNotificationType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmMaintenanceWindowTask.SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig.Jsii$Proxy that = (SsmMaintenanceWindowTaskTaskInvocationParametersRunCommandParametersNotificationConfig.Jsii$Proxy) o;

            if (this.notificationArn != null ? !this.notificationArn.equals(that.notificationArn) : that.notificationArn != null) return false;
            if (this.notificationEvents != null ? !this.notificationEvents.equals(that.notificationEvents) : that.notificationEvents != null) return false;
            return this.notificationType != null ? this.notificationType.equals(that.notificationType) : that.notificationType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.notificationArn != null ? this.notificationArn.hashCode() : 0;
            result = 31 * result + (this.notificationEvents != null ? this.notificationEvents.hashCode() : 0);
            result = 31 * result + (this.notificationType != null ? this.notificationType.hashCode() : 0);
            return result;
        }
    }
}
