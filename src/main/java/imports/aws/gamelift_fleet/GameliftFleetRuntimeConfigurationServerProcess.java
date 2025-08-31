package imports.aws.gamelift_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.265Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftFleet.GameliftFleetRuntimeConfigurationServerProcess")
@software.amazon.jsii.Jsii.Proxy(GameliftFleetRuntimeConfigurationServerProcess.Jsii$Proxy.class)
public interface GameliftFleetRuntimeConfigurationServerProcess extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#concurrent_executions GameliftFleet#concurrent_executions}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getConcurrentExecutions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#launch_path GameliftFleet#launch_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLaunchPath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#parameters GameliftFleet#parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GameliftFleetRuntimeConfigurationServerProcess}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GameliftFleetRuntimeConfigurationServerProcess}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GameliftFleetRuntimeConfigurationServerProcess> {
        java.lang.Number concurrentExecutions;
        java.lang.String launchPath;
        java.lang.String parameters;

        /**
         * Sets the value of {@link GameliftFleetRuntimeConfigurationServerProcess#getConcurrentExecutions}
         * @param concurrentExecutions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#concurrent_executions GameliftFleet#concurrent_executions}. This parameter is required.
         * @return {@code this}
         */
        public Builder concurrentExecutions(java.lang.Number concurrentExecutions) {
            this.concurrentExecutions = concurrentExecutions;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetRuntimeConfigurationServerProcess#getLaunchPath}
         * @param launchPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#launch_path GameliftFleet#launch_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder launchPath(java.lang.String launchPath) {
            this.launchPath = launchPath;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetRuntimeConfigurationServerProcess#getParameters}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#parameters GameliftFleet#parameters}.
         * @return {@code this}
         */
        public Builder parameters(java.lang.String parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GameliftFleetRuntimeConfigurationServerProcess}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GameliftFleetRuntimeConfigurationServerProcess build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GameliftFleetRuntimeConfigurationServerProcess}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GameliftFleetRuntimeConfigurationServerProcess {
        private final java.lang.Number concurrentExecutions;
        private final java.lang.String launchPath;
        private final java.lang.String parameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.concurrentExecutions = software.amazon.jsii.Kernel.get(this, "concurrentExecutions", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.launchPath = software.amazon.jsii.Kernel.get(this, "launchPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.concurrentExecutions = java.util.Objects.requireNonNull(builder.concurrentExecutions, "concurrentExecutions is required");
            this.launchPath = java.util.Objects.requireNonNull(builder.launchPath, "launchPath is required");
            this.parameters = builder.parameters;
        }

        @Override
        public final java.lang.Number getConcurrentExecutions() {
            return this.concurrentExecutions;
        }

        @Override
        public final java.lang.String getLaunchPath() {
            return this.launchPath;
        }

        @Override
        public final java.lang.String getParameters() {
            return this.parameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("concurrentExecutions", om.valueToTree(this.getConcurrentExecutions()));
            data.set("launchPath", om.valueToTree(this.getLaunchPath()));
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.gameliftFleet.GameliftFleetRuntimeConfigurationServerProcess"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GameliftFleetRuntimeConfigurationServerProcess.Jsii$Proxy that = (GameliftFleetRuntimeConfigurationServerProcess.Jsii$Proxy) o;

            if (!concurrentExecutions.equals(that.concurrentExecutions)) return false;
            if (!launchPath.equals(that.launchPath)) return false;
            return this.parameters != null ? this.parameters.equals(that.parameters) : that.parameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.concurrentExecutions.hashCode();
            result = 31 * result + (this.launchPath.hashCode());
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            return result;
        }
    }
}
