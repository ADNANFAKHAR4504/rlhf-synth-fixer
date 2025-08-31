package imports.aws.gamelift_game_server_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.266Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftGameServerGroup.GameliftGameServerGroupInstanceDefinition")
@software.amazon.jsii.Jsii.Proxy(GameliftGameServerGroupInstanceDefinition.Jsii$Proxy.class)
public interface GameliftGameServerGroupInstanceDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#instance_type GameliftGameServerGroup#instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#weighted_capacity GameliftGameServerGroup#weighted_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWeightedCapacity() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GameliftGameServerGroupInstanceDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GameliftGameServerGroupInstanceDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GameliftGameServerGroupInstanceDefinition> {
        java.lang.String instanceType;
        java.lang.String weightedCapacity;

        /**
         * Sets the value of {@link GameliftGameServerGroupInstanceDefinition#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#instance_type GameliftGameServerGroup#instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link GameliftGameServerGroupInstanceDefinition#getWeightedCapacity}
         * @param weightedCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_game_server_group#weighted_capacity GameliftGameServerGroup#weighted_capacity}.
         * @return {@code this}
         */
        public Builder weightedCapacity(java.lang.String weightedCapacity) {
            this.weightedCapacity = weightedCapacity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GameliftGameServerGroupInstanceDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GameliftGameServerGroupInstanceDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GameliftGameServerGroupInstanceDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GameliftGameServerGroupInstanceDefinition {
        private final java.lang.String instanceType;
        private final java.lang.String weightedCapacity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.weightedCapacity = software.amazon.jsii.Kernel.get(this, "weightedCapacity", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.instanceType = java.util.Objects.requireNonNull(builder.instanceType, "instanceType is required");
            this.weightedCapacity = builder.weightedCapacity;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.String getWeightedCapacity() {
            return this.weightedCapacity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("instanceType", om.valueToTree(this.getInstanceType()));
            if (this.getWeightedCapacity() != null) {
                data.set("weightedCapacity", om.valueToTree(this.getWeightedCapacity()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.gameliftGameServerGroup.GameliftGameServerGroupInstanceDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GameliftGameServerGroupInstanceDefinition.Jsii$Proxy that = (GameliftGameServerGroupInstanceDefinition.Jsii$Proxy) o;

            if (!instanceType.equals(that.instanceType)) return false;
            return this.weightedCapacity != null ? this.weightedCapacity.equals(that.weightedCapacity) : that.weightedCapacity == null;
        }

        @Override
        public final int hashCode() {
            int result = this.instanceType.hashCode();
            result = 31 * result + (this.weightedCapacity != null ? this.weightedCapacity.hashCode() : 0);
            return result;
        }
    }
}
