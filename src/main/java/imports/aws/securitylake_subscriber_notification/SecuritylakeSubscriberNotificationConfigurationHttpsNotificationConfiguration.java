package imports.aws.securitylake_subscriber_notification;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.422Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeSubscriberNotification.SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration")
@software.amazon.jsii.Jsii.Proxy(SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration.Jsii$Proxy.class)
public interface SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#endpoint SecuritylakeSubscriberNotification#endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEndpoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#target_role_arn SecuritylakeSubscriberNotification#target_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#authorization_api_key_name SecuritylakeSubscriberNotification#authorization_api_key_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthorizationApiKeyName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#authorization_api_key_value SecuritylakeSubscriberNotification#authorization_api_key_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthorizationApiKeyValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#http_method SecuritylakeSubscriberNotification#http_method}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHttpMethod() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration> {
        java.lang.String endpoint;
        java.lang.String targetRoleArn;
        java.lang.String authorizationApiKeyName;
        java.lang.String authorizationApiKeyValue;
        java.lang.String httpMethod;

        /**
         * Sets the value of {@link SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration#getEndpoint}
         * @param endpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#endpoint SecuritylakeSubscriberNotification#endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder endpoint(java.lang.String endpoint) {
            this.endpoint = endpoint;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration#getTargetRoleArn}
         * @param targetRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#target_role_arn SecuritylakeSubscriberNotification#target_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetRoleArn(java.lang.String targetRoleArn) {
            this.targetRoleArn = targetRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration#getAuthorizationApiKeyName}
         * @param authorizationApiKeyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#authorization_api_key_name SecuritylakeSubscriberNotification#authorization_api_key_name}.
         * @return {@code this}
         */
        public Builder authorizationApiKeyName(java.lang.String authorizationApiKeyName) {
            this.authorizationApiKeyName = authorizationApiKeyName;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration#getAuthorizationApiKeyValue}
         * @param authorizationApiKeyValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#authorization_api_key_value SecuritylakeSubscriberNotification#authorization_api_key_value}.
         * @return {@code this}
         */
        public Builder authorizationApiKeyValue(java.lang.String authorizationApiKeyValue) {
            this.authorizationApiKeyValue = authorizationApiKeyValue;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration#getHttpMethod}
         * @param httpMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#http_method SecuritylakeSubscriberNotification#http_method}.
         * @return {@code this}
         */
        public Builder httpMethod(java.lang.String httpMethod) {
            this.httpMethod = httpMethod;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration {
        private final java.lang.String endpoint;
        private final java.lang.String targetRoleArn;
        private final java.lang.String authorizationApiKeyName;
        private final java.lang.String authorizationApiKeyValue;
        private final java.lang.String httpMethod;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.endpoint = software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetRoleArn = software.amazon.jsii.Kernel.get(this, "targetRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizationApiKeyName = software.amazon.jsii.Kernel.get(this, "authorizationApiKeyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizationApiKeyValue = software.amazon.jsii.Kernel.get(this, "authorizationApiKeyValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.httpMethod = software.amazon.jsii.Kernel.get(this, "httpMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.endpoint = java.util.Objects.requireNonNull(builder.endpoint, "endpoint is required");
            this.targetRoleArn = java.util.Objects.requireNonNull(builder.targetRoleArn, "targetRoleArn is required");
            this.authorizationApiKeyName = builder.authorizationApiKeyName;
            this.authorizationApiKeyValue = builder.authorizationApiKeyValue;
            this.httpMethod = builder.httpMethod;
        }

        @Override
        public final java.lang.String getEndpoint() {
            return this.endpoint;
        }

        @Override
        public final java.lang.String getTargetRoleArn() {
            return this.targetRoleArn;
        }

        @Override
        public final java.lang.String getAuthorizationApiKeyName() {
            return this.authorizationApiKeyName;
        }

        @Override
        public final java.lang.String getAuthorizationApiKeyValue() {
            return this.authorizationApiKeyValue;
        }

        @Override
        public final java.lang.String getHttpMethod() {
            return this.httpMethod;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("endpoint", om.valueToTree(this.getEndpoint()));
            data.set("targetRoleArn", om.valueToTree(this.getTargetRoleArn()));
            if (this.getAuthorizationApiKeyName() != null) {
                data.set("authorizationApiKeyName", om.valueToTree(this.getAuthorizationApiKeyName()));
            }
            if (this.getAuthorizationApiKeyValue() != null) {
                data.set("authorizationApiKeyValue", om.valueToTree(this.getAuthorizationApiKeyValue()));
            }
            if (this.getHttpMethod() != null) {
                data.set("httpMethod", om.valueToTree(this.getHttpMethod()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securitylakeSubscriberNotification.SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration.Jsii$Proxy that = (SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration.Jsii$Proxy) o;

            if (!endpoint.equals(that.endpoint)) return false;
            if (!targetRoleArn.equals(that.targetRoleArn)) return false;
            if (this.authorizationApiKeyName != null ? !this.authorizationApiKeyName.equals(that.authorizationApiKeyName) : that.authorizationApiKeyName != null) return false;
            if (this.authorizationApiKeyValue != null ? !this.authorizationApiKeyValue.equals(that.authorizationApiKeyValue) : that.authorizationApiKeyValue != null) return false;
            return this.httpMethod != null ? this.httpMethod.equals(that.httpMethod) : that.httpMethod == null;
        }

        @Override
        public final int hashCode() {
            int result = this.endpoint.hashCode();
            result = 31 * result + (this.targetRoleArn.hashCode());
            result = 31 * result + (this.authorizationApiKeyName != null ? this.authorizationApiKeyName.hashCode() : 0);
            result = 31 * result + (this.authorizationApiKeyValue != null ? this.authorizationApiKeyValue.hashCode() : 0);
            result = 31 * result + (this.httpMethod != null ? this.httpMethod.hashCode() : 0);
            return result;
        }
    }
}
