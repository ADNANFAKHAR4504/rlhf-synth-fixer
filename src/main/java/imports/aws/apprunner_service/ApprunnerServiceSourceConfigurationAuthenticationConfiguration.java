package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.056Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceSourceConfigurationAuthenticationConfiguration")
@software.amazon.jsii.Jsii.Proxy(ApprunnerServiceSourceConfigurationAuthenticationConfiguration.Jsii$Proxy.class)
public interface ApprunnerServiceSourceConfigurationAuthenticationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#access_role_arn ApprunnerService#access_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#connection_arn ApprunnerService#connection_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConnectionArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerServiceSourceConfigurationAuthenticationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerServiceSourceConfigurationAuthenticationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerServiceSourceConfigurationAuthenticationConfiguration> {
        java.lang.String accessRoleArn;
        java.lang.String connectionArn;

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationAuthenticationConfiguration#getAccessRoleArn}
         * @param accessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#access_role_arn ApprunnerService#access_role_arn}.
         * @return {@code this}
         */
        public Builder accessRoleArn(java.lang.String accessRoleArn) {
            this.accessRoleArn = accessRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationAuthenticationConfiguration#getConnectionArn}
         * @param connectionArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#connection_arn ApprunnerService#connection_arn}.
         * @return {@code this}
         */
        public Builder connectionArn(java.lang.String connectionArn) {
            this.connectionArn = connectionArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApprunnerServiceSourceConfigurationAuthenticationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerServiceSourceConfigurationAuthenticationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerServiceSourceConfigurationAuthenticationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerServiceSourceConfigurationAuthenticationConfiguration {
        private final java.lang.String accessRoleArn;
        private final java.lang.String connectionArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accessRoleArn = software.amazon.jsii.Kernel.get(this, "accessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectionArn = software.amazon.jsii.Kernel.get(this, "connectionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accessRoleArn = builder.accessRoleArn;
            this.connectionArn = builder.connectionArn;
        }

        @Override
        public final java.lang.String getAccessRoleArn() {
            return this.accessRoleArn;
        }

        @Override
        public final java.lang.String getConnectionArn() {
            return this.connectionArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAccessRoleArn() != null) {
                data.set("accessRoleArn", om.valueToTree(this.getAccessRoleArn()));
            }
            if (this.getConnectionArn() != null) {
                data.set("connectionArn", om.valueToTree(this.getConnectionArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apprunnerService.ApprunnerServiceSourceConfigurationAuthenticationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerServiceSourceConfigurationAuthenticationConfiguration.Jsii$Proxy that = (ApprunnerServiceSourceConfigurationAuthenticationConfiguration.Jsii$Proxy) o;

            if (this.accessRoleArn != null ? !this.accessRoleArn.equals(that.accessRoleArn) : that.accessRoleArn != null) return false;
            return this.connectionArn != null ? this.connectionArn.equals(that.connectionArn) : that.connectionArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accessRoleArn != null ? this.accessRoleArn.hashCode() : 0;
            result = 31 * result + (this.connectionArn != null ? this.connectionArn.hashCode() : 0);
            return result;
        }
    }
}
