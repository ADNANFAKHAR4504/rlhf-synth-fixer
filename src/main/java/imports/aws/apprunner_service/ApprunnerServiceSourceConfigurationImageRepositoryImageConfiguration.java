package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.057Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration")
@software.amazon.jsii.Jsii.Proxy(ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration.Jsii$Proxy.class)
public interface ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#port ApprunnerService#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#runtime_environment_secrets ApprunnerService#runtime_environment_secrets}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRuntimeEnvironmentSecrets() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#runtime_environment_variables ApprunnerService#runtime_environment_variables}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRuntimeEnvironmentVariables() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#start_command ApprunnerService#start_command}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartCommand() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration> {
        java.lang.String port;
        java.util.Map<java.lang.String, java.lang.String> runtimeEnvironmentSecrets;
        java.util.Map<java.lang.String, java.lang.String> runtimeEnvironmentVariables;
        java.lang.String startCommand;

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#port ApprunnerService#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.String port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration#getRuntimeEnvironmentSecrets}
         * @param runtimeEnvironmentSecrets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#runtime_environment_secrets ApprunnerService#runtime_environment_secrets}.
         * @return {@code this}
         */
        public Builder runtimeEnvironmentSecrets(java.util.Map<java.lang.String, java.lang.String> runtimeEnvironmentSecrets) {
            this.runtimeEnvironmentSecrets = runtimeEnvironmentSecrets;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration#getRuntimeEnvironmentVariables}
         * @param runtimeEnvironmentVariables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#runtime_environment_variables ApprunnerService#runtime_environment_variables}.
         * @return {@code this}
         */
        public Builder runtimeEnvironmentVariables(java.util.Map<java.lang.String, java.lang.String> runtimeEnvironmentVariables) {
            this.runtimeEnvironmentVariables = runtimeEnvironmentVariables;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration#getStartCommand}
         * @param startCommand Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#start_command ApprunnerService#start_command}.
         * @return {@code this}
         */
        public Builder startCommand(java.lang.String startCommand) {
            this.startCommand = startCommand;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration {
        private final java.lang.String port;
        private final java.util.Map<java.lang.String, java.lang.String> runtimeEnvironmentSecrets;
        private final java.util.Map<java.lang.String, java.lang.String> runtimeEnvironmentVariables;
        private final java.lang.String startCommand;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.runtimeEnvironmentSecrets = software.amazon.jsii.Kernel.get(this, "runtimeEnvironmentSecrets", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.runtimeEnvironmentVariables = software.amazon.jsii.Kernel.get(this, "runtimeEnvironmentVariables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.startCommand = software.amazon.jsii.Kernel.get(this, "startCommand", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.port = builder.port;
            this.runtimeEnvironmentSecrets = builder.runtimeEnvironmentSecrets;
            this.runtimeEnvironmentVariables = builder.runtimeEnvironmentVariables;
            this.startCommand = builder.startCommand;
        }

        @Override
        public final java.lang.String getPort() {
            return this.port;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getRuntimeEnvironmentSecrets() {
            return this.runtimeEnvironmentSecrets;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getRuntimeEnvironmentVariables() {
            return this.runtimeEnvironmentVariables;
        }

        @Override
        public final java.lang.String getStartCommand() {
            return this.startCommand;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getRuntimeEnvironmentSecrets() != null) {
                data.set("runtimeEnvironmentSecrets", om.valueToTree(this.getRuntimeEnvironmentSecrets()));
            }
            if (this.getRuntimeEnvironmentVariables() != null) {
                data.set("runtimeEnvironmentVariables", om.valueToTree(this.getRuntimeEnvironmentVariables()));
            }
            if (this.getStartCommand() != null) {
                data.set("startCommand", om.valueToTree(this.getStartCommand()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apprunnerService.ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration.Jsii$Proxy that = (ApprunnerServiceSourceConfigurationImageRepositoryImageConfiguration.Jsii$Proxy) o;

            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.runtimeEnvironmentSecrets != null ? !this.runtimeEnvironmentSecrets.equals(that.runtimeEnvironmentSecrets) : that.runtimeEnvironmentSecrets != null) return false;
            if (this.runtimeEnvironmentVariables != null ? !this.runtimeEnvironmentVariables.equals(that.runtimeEnvironmentVariables) : that.runtimeEnvironmentVariables != null) return false;
            return this.startCommand != null ? this.startCommand.equals(that.startCommand) : that.startCommand == null;
        }

        @Override
        public final int hashCode() {
            int result = this.port != null ? this.port.hashCode() : 0;
            result = 31 * result + (this.runtimeEnvironmentSecrets != null ? this.runtimeEnvironmentSecrets.hashCode() : 0);
            result = 31 * result + (this.runtimeEnvironmentVariables != null ? this.runtimeEnvironmentVariables.hashCode() : 0);
            result = 31 * result + (this.startCommand != null ? this.startCommand.hashCode() : 0);
            return result;
        }
    }
}
