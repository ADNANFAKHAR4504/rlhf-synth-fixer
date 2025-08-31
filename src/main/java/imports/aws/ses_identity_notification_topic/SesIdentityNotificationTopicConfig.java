package imports.aws.ses_identity_notification_topic;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.449Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesIdentityNotificationTopic.SesIdentityNotificationTopicConfig")
@software.amazon.jsii.Jsii.Proxy(SesIdentityNotificationTopicConfig.Jsii$Proxy.class)
public interface SesIdentityNotificationTopicConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_identity_notification_topic#identity SesIdentityNotificationTopic#identity}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIdentity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_identity_notification_topic#notification_type SesIdentityNotificationTopic#notification_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNotificationType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_identity_notification_topic#id SesIdentityNotificationTopic#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_identity_notification_topic#include_original_headers SesIdentityNotificationTopic#include_original_headers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeOriginalHeaders() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_identity_notification_topic#topic_arn SesIdentityNotificationTopic#topic_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTopicArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SesIdentityNotificationTopicConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SesIdentityNotificationTopicConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SesIdentityNotificationTopicConfig> {
        java.lang.String identity;
        java.lang.String notificationType;
        java.lang.String id;
        java.lang.Object includeOriginalHeaders;
        java.lang.String topicArn;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getIdentity}
         * @param identity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_identity_notification_topic#identity SesIdentityNotificationTopic#identity}. This parameter is required.
         * @return {@code this}
         */
        public Builder identity(java.lang.String identity) {
            this.identity = identity;
            return this;
        }

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getNotificationType}
         * @param notificationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_identity_notification_topic#notification_type SesIdentityNotificationTopic#notification_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder notificationType(java.lang.String notificationType) {
            this.notificationType = notificationType;
            return this;
        }

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_identity_notification_topic#id SesIdentityNotificationTopic#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getIncludeOriginalHeaders}
         * @param includeOriginalHeaders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_identity_notification_topic#include_original_headers SesIdentityNotificationTopic#include_original_headers}.
         * @return {@code this}
         */
        public Builder includeOriginalHeaders(java.lang.Boolean includeOriginalHeaders) {
            this.includeOriginalHeaders = includeOriginalHeaders;
            return this;
        }

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getIncludeOriginalHeaders}
         * @param includeOriginalHeaders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_identity_notification_topic#include_original_headers SesIdentityNotificationTopic#include_original_headers}.
         * @return {@code this}
         */
        public Builder includeOriginalHeaders(com.hashicorp.cdktf.IResolvable includeOriginalHeaders) {
            this.includeOriginalHeaders = includeOriginalHeaders;
            return this;
        }

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getTopicArn}
         * @param topicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_identity_notification_topic#topic_arn SesIdentityNotificationTopic#topic_arn}.
         * @return {@code this}
         */
        public Builder topicArn(java.lang.String topicArn) {
            this.topicArn = topicArn;
            return this;
        }

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getDependsOn}
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
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SesIdentityNotificationTopicConfig#getProvisioners}
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
         * @return a new instance of {@link SesIdentityNotificationTopicConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SesIdentityNotificationTopicConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SesIdentityNotificationTopicConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SesIdentityNotificationTopicConfig {
        private final java.lang.String identity;
        private final java.lang.String notificationType;
        private final java.lang.String id;
        private final java.lang.Object includeOriginalHeaders;
        private final java.lang.String topicArn;
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
            this.identity = software.amazon.jsii.Kernel.get(this, "identity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notificationType = software.amazon.jsii.Kernel.get(this, "notificationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includeOriginalHeaders = software.amazon.jsii.Kernel.get(this, "includeOriginalHeaders", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.topicArn = software.amazon.jsii.Kernel.get(this, "topicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.identity = java.util.Objects.requireNonNull(builder.identity, "identity is required");
            this.notificationType = java.util.Objects.requireNonNull(builder.notificationType, "notificationType is required");
            this.id = builder.id;
            this.includeOriginalHeaders = builder.includeOriginalHeaders;
            this.topicArn = builder.topicArn;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getIdentity() {
            return this.identity;
        }

        @Override
        public final java.lang.String getNotificationType() {
            return this.notificationType;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIncludeOriginalHeaders() {
            return this.includeOriginalHeaders;
        }

        @Override
        public final java.lang.String getTopicArn() {
            return this.topicArn;
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

            data.set("identity", om.valueToTree(this.getIdentity()));
            data.set("notificationType", om.valueToTree(this.getNotificationType()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIncludeOriginalHeaders() != null) {
                data.set("includeOriginalHeaders", om.valueToTree(this.getIncludeOriginalHeaders()));
            }
            if (this.getTopicArn() != null) {
                data.set("topicArn", om.valueToTree(this.getTopicArn()));
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
            struct.set("fqn", om.valueToTree("aws.sesIdentityNotificationTopic.SesIdentityNotificationTopicConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SesIdentityNotificationTopicConfig.Jsii$Proxy that = (SesIdentityNotificationTopicConfig.Jsii$Proxy) o;

            if (!identity.equals(that.identity)) return false;
            if (!notificationType.equals(that.notificationType)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.includeOriginalHeaders != null ? !this.includeOriginalHeaders.equals(that.includeOriginalHeaders) : that.includeOriginalHeaders != null) return false;
            if (this.topicArn != null ? !this.topicArn.equals(that.topicArn) : that.topicArn != null) return false;
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
            int result = this.identity.hashCode();
            result = 31 * result + (this.notificationType.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.includeOriginalHeaders != null ? this.includeOriginalHeaders.hashCode() : 0);
            result = 31 * result + (this.topicArn != null ? this.topicArn.hashCode() : 0);
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
