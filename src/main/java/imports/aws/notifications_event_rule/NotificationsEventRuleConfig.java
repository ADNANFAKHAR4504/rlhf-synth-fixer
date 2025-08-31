package imports.aws.notifications_event_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.979Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.notificationsEventRule.NotificationsEventRuleConfig")
@software.amazon.jsii.Jsii.Proxy(NotificationsEventRuleConfig.Jsii$Proxy.class)
public interface NotificationsEventRuleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/notifications_event_rule#event_type NotificationsEventRule#event_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEventType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/notifications_event_rule#notification_configuration_arn NotificationsEventRule#notification_configuration_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNotificationConfigurationArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/notifications_event_rule#regions NotificationsEventRule#regions}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRegions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/notifications_event_rule#source NotificationsEventRule#source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSource();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/notifications_event_rule#event_pattern NotificationsEventRule#event_pattern}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEventPattern() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NotificationsEventRuleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NotificationsEventRuleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NotificationsEventRuleConfig> {
        java.lang.String eventType;
        java.lang.String notificationConfigurationArn;
        java.util.List<java.lang.String> regions;
        java.lang.String source;
        java.lang.String eventPattern;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getEventType}
         * @param eventType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/notifications_event_rule#event_type NotificationsEventRule#event_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder eventType(java.lang.String eventType) {
            this.eventType = eventType;
            return this;
        }

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getNotificationConfigurationArn}
         * @param notificationConfigurationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/notifications_event_rule#notification_configuration_arn NotificationsEventRule#notification_configuration_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder notificationConfigurationArn(java.lang.String notificationConfigurationArn) {
            this.notificationConfigurationArn = notificationConfigurationArn;
            return this;
        }

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getRegions}
         * @param regions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/notifications_event_rule#regions NotificationsEventRule#regions}. This parameter is required.
         * @return {@code this}
         */
        public Builder regions(java.util.List<java.lang.String> regions) {
            this.regions = regions;
            return this;
        }

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getSource}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/notifications_event_rule#source NotificationsEventRule#source}. This parameter is required.
         * @return {@code this}
         */
        public Builder source(java.lang.String source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getEventPattern}
         * @param eventPattern Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/notifications_event_rule#event_pattern NotificationsEventRule#event_pattern}.
         * @return {@code this}
         */
        public Builder eventPattern(java.lang.String eventPattern) {
            this.eventPattern = eventPattern;
            return this;
        }

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link NotificationsEventRuleConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NotificationsEventRuleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NotificationsEventRuleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NotificationsEventRuleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NotificationsEventRuleConfig {
        private final java.lang.String eventType;
        private final java.lang.String notificationConfigurationArn;
        private final java.util.List<java.lang.String> regions;
        private final java.lang.String source;
        private final java.lang.String eventPattern;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.eventType = software.amazon.jsii.Kernel.get(this, "eventType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notificationConfigurationArn = software.amazon.jsii.Kernel.get(this, "notificationConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.regions = software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eventPattern = software.amazon.jsii.Kernel.get(this, "eventPattern", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.eventType = java.util.Objects.requireNonNull(builder.eventType, "eventType is required");
            this.notificationConfigurationArn = java.util.Objects.requireNonNull(builder.notificationConfigurationArn, "notificationConfigurationArn is required");
            this.regions = java.util.Objects.requireNonNull(builder.regions, "regions is required");
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
            this.eventPattern = builder.eventPattern;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getEventType() {
            return this.eventType;
        }

        @Override
        public final java.lang.String getNotificationConfigurationArn() {
            return this.notificationConfigurationArn;
        }

        @Override
        public final java.util.List<java.lang.String> getRegions() {
            return this.regions;
        }

        @Override
        public final java.lang.String getSource() {
            return this.source;
        }

        @Override
        public final java.lang.String getEventPattern() {
            return this.eventPattern;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("eventType", om.valueToTree(this.getEventType()));
            data.set("notificationConfigurationArn", om.valueToTree(this.getNotificationConfigurationArn()));
            data.set("regions", om.valueToTree(this.getRegions()));
            data.set("source", om.valueToTree(this.getSource()));
            if (this.getEventPattern() != null) {
                data.set("eventPattern", om.valueToTree(this.getEventPattern()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.notificationsEventRule.NotificationsEventRuleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NotificationsEventRuleConfig.Jsii$Proxy that = (NotificationsEventRuleConfig.Jsii$Proxy) o;

            if (!eventType.equals(that.eventType)) return false;
            if (!notificationConfigurationArn.equals(that.notificationConfigurationArn)) return false;
            if (!regions.equals(that.regions)) return false;
            if (!source.equals(that.source)) return false;
            if (this.eventPattern != null ? !this.eventPattern.equals(that.eventPattern) : that.eventPattern != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.eventType.hashCode();
            result = 31 * result + (this.notificationConfigurationArn.hashCode());
            result = 31 * result + (this.regions.hashCode());
            result = 31 * result + (this.source.hashCode());
            result = 31 * result + (this.eventPattern != null ? this.eventPattern.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
