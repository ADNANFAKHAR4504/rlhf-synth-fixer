package imports.aws.glue_trigger;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.306Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueTrigger.GlueTriggerActions")
@software.amazon.jsii.Jsii.Proxy(GlueTriggerActions.Jsii$Proxy.class)
public interface GlueTriggerActions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#arguments GlueTrigger#arguments}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getArguments() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#crawler_name GlueTrigger#crawler_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCrawlerName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#job_name GlueTrigger#job_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getJobName() {
        return null;
    }

    /**
     * notification_property block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#notification_property GlueTrigger#notification_property}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_trigger.GlueTriggerActionsNotificationProperty getNotificationProperty() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#security_configuration GlueTrigger#security_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecurityConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#timeout GlueTrigger#timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeout() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueTriggerActions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueTriggerActions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueTriggerActions> {
        java.util.Map<java.lang.String, java.lang.String> arguments;
        java.lang.String crawlerName;
        java.lang.String jobName;
        imports.aws.glue_trigger.GlueTriggerActionsNotificationProperty notificationProperty;
        java.lang.String securityConfiguration;
        java.lang.Number timeout;

        /**
         * Sets the value of {@link GlueTriggerActions#getArguments}
         * @param arguments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#arguments GlueTrigger#arguments}.
         * @return {@code this}
         */
        public Builder arguments(java.util.Map<java.lang.String, java.lang.String> arguments) {
            this.arguments = arguments;
            return this;
        }

        /**
         * Sets the value of {@link GlueTriggerActions#getCrawlerName}
         * @param crawlerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#crawler_name GlueTrigger#crawler_name}.
         * @return {@code this}
         */
        public Builder crawlerName(java.lang.String crawlerName) {
            this.crawlerName = crawlerName;
            return this;
        }

        /**
         * Sets the value of {@link GlueTriggerActions#getJobName}
         * @param jobName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#job_name GlueTrigger#job_name}.
         * @return {@code this}
         */
        public Builder jobName(java.lang.String jobName) {
            this.jobName = jobName;
            return this;
        }

        /**
         * Sets the value of {@link GlueTriggerActions#getNotificationProperty}
         * @param notificationProperty notification_property block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#notification_property GlueTrigger#notification_property}
         * @return {@code this}
         */
        public Builder notificationProperty(imports.aws.glue_trigger.GlueTriggerActionsNotificationProperty notificationProperty) {
            this.notificationProperty = notificationProperty;
            return this;
        }

        /**
         * Sets the value of {@link GlueTriggerActions#getSecurityConfiguration}
         * @param securityConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#security_configuration GlueTrigger#security_configuration}.
         * @return {@code this}
         */
        public Builder securityConfiguration(java.lang.String securityConfiguration) {
            this.securityConfiguration = securityConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlueTriggerActions#getTimeout}
         * @param timeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#timeout GlueTrigger#timeout}.
         * @return {@code this}
         */
        public Builder timeout(java.lang.Number timeout) {
            this.timeout = timeout;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueTriggerActions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueTriggerActions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueTriggerActions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueTriggerActions {
        private final java.util.Map<java.lang.String, java.lang.String> arguments;
        private final java.lang.String crawlerName;
        private final java.lang.String jobName;
        private final imports.aws.glue_trigger.GlueTriggerActionsNotificationProperty notificationProperty;
        private final java.lang.String securityConfiguration;
        private final java.lang.Number timeout;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.arguments = software.amazon.jsii.Kernel.get(this, "arguments", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.crawlerName = software.amazon.jsii.Kernel.get(this, "crawlerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.jobName = software.amazon.jsii.Kernel.get(this, "jobName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notificationProperty = software.amazon.jsii.Kernel.get(this, "notificationProperty", software.amazon.jsii.NativeType.forClass(imports.aws.glue_trigger.GlueTriggerActionsNotificationProperty.class));
            this.securityConfiguration = software.amazon.jsii.Kernel.get(this, "securityConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeout = software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.arguments = builder.arguments;
            this.crawlerName = builder.crawlerName;
            this.jobName = builder.jobName;
            this.notificationProperty = builder.notificationProperty;
            this.securityConfiguration = builder.securityConfiguration;
            this.timeout = builder.timeout;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getArguments() {
            return this.arguments;
        }

        @Override
        public final java.lang.String getCrawlerName() {
            return this.crawlerName;
        }

        @Override
        public final java.lang.String getJobName() {
            return this.jobName;
        }

        @Override
        public final imports.aws.glue_trigger.GlueTriggerActionsNotificationProperty getNotificationProperty() {
            return this.notificationProperty;
        }

        @Override
        public final java.lang.String getSecurityConfiguration() {
            return this.securityConfiguration;
        }

        @Override
        public final java.lang.Number getTimeout() {
            return this.timeout;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getArguments() != null) {
                data.set("arguments", om.valueToTree(this.getArguments()));
            }
            if (this.getCrawlerName() != null) {
                data.set("crawlerName", om.valueToTree(this.getCrawlerName()));
            }
            if (this.getJobName() != null) {
                data.set("jobName", om.valueToTree(this.getJobName()));
            }
            if (this.getNotificationProperty() != null) {
                data.set("notificationProperty", om.valueToTree(this.getNotificationProperty()));
            }
            if (this.getSecurityConfiguration() != null) {
                data.set("securityConfiguration", om.valueToTree(this.getSecurityConfiguration()));
            }
            if (this.getTimeout() != null) {
                data.set("timeout", om.valueToTree(this.getTimeout()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueTrigger.GlueTriggerActions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueTriggerActions.Jsii$Proxy that = (GlueTriggerActions.Jsii$Proxy) o;

            if (this.arguments != null ? !this.arguments.equals(that.arguments) : that.arguments != null) return false;
            if (this.crawlerName != null ? !this.crawlerName.equals(that.crawlerName) : that.crawlerName != null) return false;
            if (this.jobName != null ? !this.jobName.equals(that.jobName) : that.jobName != null) return false;
            if (this.notificationProperty != null ? !this.notificationProperty.equals(that.notificationProperty) : that.notificationProperty != null) return false;
            if (this.securityConfiguration != null ? !this.securityConfiguration.equals(that.securityConfiguration) : that.securityConfiguration != null) return false;
            return this.timeout != null ? this.timeout.equals(that.timeout) : that.timeout == null;
        }

        @Override
        public final int hashCode() {
            int result = this.arguments != null ? this.arguments.hashCode() : 0;
            result = 31 * result + (this.crawlerName != null ? this.crawlerName.hashCode() : 0);
            result = 31 * result + (this.jobName != null ? this.jobName.hashCode() : 0);
            result = 31 * result + (this.notificationProperty != null ? this.notificationProperty.hashCode() : 0);
            result = 31 * result + (this.securityConfiguration != null ? this.securityConfiguration.hashCode() : 0);
            result = 31 * result + (this.timeout != null ? this.timeout.hashCode() : 0);
            return result;
        }
    }
}
