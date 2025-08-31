package imports.aws.gamelift_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.265Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftFleet.GameliftFleetRuntimeConfiguration")
@software.amazon.jsii.Jsii.Proxy(GameliftFleetRuntimeConfiguration.Jsii$Proxy.class)
public interface GameliftFleetRuntimeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#game_session_activation_timeout_seconds GameliftFleet#game_session_activation_timeout_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getGameSessionActivationTimeoutSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#max_concurrent_game_session_activations GameliftFleet#max_concurrent_game_session_activations}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxConcurrentGameSessionActivations() {
        return null;
    }

    /**
     * server_process block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#server_process GameliftFleet#server_process}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getServerProcess() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GameliftFleetRuntimeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GameliftFleetRuntimeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GameliftFleetRuntimeConfiguration> {
        java.lang.Number gameSessionActivationTimeoutSeconds;
        java.lang.Number maxConcurrentGameSessionActivations;
        java.lang.Object serverProcess;

        /**
         * Sets the value of {@link GameliftFleetRuntimeConfiguration#getGameSessionActivationTimeoutSeconds}
         * @param gameSessionActivationTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#game_session_activation_timeout_seconds GameliftFleet#game_session_activation_timeout_seconds}.
         * @return {@code this}
         */
        public Builder gameSessionActivationTimeoutSeconds(java.lang.Number gameSessionActivationTimeoutSeconds) {
            this.gameSessionActivationTimeoutSeconds = gameSessionActivationTimeoutSeconds;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetRuntimeConfiguration#getMaxConcurrentGameSessionActivations}
         * @param maxConcurrentGameSessionActivations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#max_concurrent_game_session_activations GameliftFleet#max_concurrent_game_session_activations}.
         * @return {@code this}
         */
        public Builder maxConcurrentGameSessionActivations(java.lang.Number maxConcurrentGameSessionActivations) {
            this.maxConcurrentGameSessionActivations = maxConcurrentGameSessionActivations;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetRuntimeConfiguration#getServerProcess}
         * @param serverProcess server_process block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#server_process GameliftFleet#server_process}
         * @return {@code this}
         */
        public Builder serverProcess(com.hashicorp.cdktf.IResolvable serverProcess) {
            this.serverProcess = serverProcess;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetRuntimeConfiguration#getServerProcess}
         * @param serverProcess server_process block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#server_process GameliftFleet#server_process}
         * @return {@code this}
         */
        public Builder serverProcess(java.util.List<? extends imports.aws.gamelift_fleet.GameliftFleetRuntimeConfigurationServerProcess> serverProcess) {
            this.serverProcess = serverProcess;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GameliftFleetRuntimeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GameliftFleetRuntimeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GameliftFleetRuntimeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GameliftFleetRuntimeConfiguration {
        private final java.lang.Number gameSessionActivationTimeoutSeconds;
        private final java.lang.Number maxConcurrentGameSessionActivations;
        private final java.lang.Object serverProcess;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.gameSessionActivationTimeoutSeconds = software.amazon.jsii.Kernel.get(this, "gameSessionActivationTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxConcurrentGameSessionActivations = software.amazon.jsii.Kernel.get(this, "maxConcurrentGameSessionActivations", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.serverProcess = software.amazon.jsii.Kernel.get(this, "serverProcess", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.gameSessionActivationTimeoutSeconds = builder.gameSessionActivationTimeoutSeconds;
            this.maxConcurrentGameSessionActivations = builder.maxConcurrentGameSessionActivations;
            this.serverProcess = builder.serverProcess;
        }

        @Override
        public final java.lang.Number getGameSessionActivationTimeoutSeconds() {
            return this.gameSessionActivationTimeoutSeconds;
        }

        @Override
        public final java.lang.Number getMaxConcurrentGameSessionActivations() {
            return this.maxConcurrentGameSessionActivations;
        }

        @Override
        public final java.lang.Object getServerProcess() {
            return this.serverProcess;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getGameSessionActivationTimeoutSeconds() != null) {
                data.set("gameSessionActivationTimeoutSeconds", om.valueToTree(this.getGameSessionActivationTimeoutSeconds()));
            }
            if (this.getMaxConcurrentGameSessionActivations() != null) {
                data.set("maxConcurrentGameSessionActivations", om.valueToTree(this.getMaxConcurrentGameSessionActivations()));
            }
            if (this.getServerProcess() != null) {
                data.set("serverProcess", om.valueToTree(this.getServerProcess()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.gameliftFleet.GameliftFleetRuntimeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GameliftFleetRuntimeConfiguration.Jsii$Proxy that = (GameliftFleetRuntimeConfiguration.Jsii$Proxy) o;

            if (this.gameSessionActivationTimeoutSeconds != null ? !this.gameSessionActivationTimeoutSeconds.equals(that.gameSessionActivationTimeoutSeconds) : that.gameSessionActivationTimeoutSeconds != null) return false;
            if (this.maxConcurrentGameSessionActivations != null ? !this.maxConcurrentGameSessionActivations.equals(that.maxConcurrentGameSessionActivations) : that.maxConcurrentGameSessionActivations != null) return false;
            return this.serverProcess != null ? this.serverProcess.equals(that.serverProcess) : that.serverProcess == null;
        }

        @Override
        public final int hashCode() {
            int result = this.gameSessionActivationTimeoutSeconds != null ? this.gameSessionActivationTimeoutSeconds.hashCode() : 0;
            result = 31 * result + (this.maxConcurrentGameSessionActivations != null ? this.maxConcurrentGameSessionActivations.hashCode() : 0);
            result = 31 * result + (this.serverProcess != null ? this.serverProcess.hashCode() : 0);
            return result;
        }
    }
}
