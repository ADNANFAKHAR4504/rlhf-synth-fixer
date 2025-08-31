package imports.aws.gamelift_alias;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.258Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftAlias.GameliftAliasRoutingStrategy")
@software.amazon.jsii.Jsii.Proxy(GameliftAliasRoutingStrategy.Jsii$Proxy.class)
public interface GameliftAliasRoutingStrategy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_alias#type GameliftAlias#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_alias#fleet_id GameliftAlias#fleet_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFleetId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_alias#message GameliftAlias#message}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMessage() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GameliftAliasRoutingStrategy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GameliftAliasRoutingStrategy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GameliftAliasRoutingStrategy> {
        java.lang.String type;
        java.lang.String fleetId;
        java.lang.String message;

        /**
         * Sets the value of {@link GameliftAliasRoutingStrategy#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_alias#type GameliftAlias#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link GameliftAliasRoutingStrategy#getFleetId}
         * @param fleetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_alias#fleet_id GameliftAlias#fleet_id}.
         * @return {@code this}
         */
        public Builder fleetId(java.lang.String fleetId) {
            this.fleetId = fleetId;
            return this;
        }

        /**
         * Sets the value of {@link GameliftAliasRoutingStrategy#getMessage}
         * @param message Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_alias#message GameliftAlias#message}.
         * @return {@code this}
         */
        public Builder message(java.lang.String message) {
            this.message = message;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GameliftAliasRoutingStrategy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GameliftAliasRoutingStrategy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GameliftAliasRoutingStrategy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GameliftAliasRoutingStrategy {
        private final java.lang.String type;
        private final java.lang.String fleetId;
        private final java.lang.String message;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fleetId = software.amazon.jsii.Kernel.get(this, "fleetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.message = software.amazon.jsii.Kernel.get(this, "message", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.fleetId = builder.fleetId;
            this.message = builder.message;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getFleetId() {
            return this.fleetId;
        }

        @Override
        public final java.lang.String getMessage() {
            return this.message;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getFleetId() != null) {
                data.set("fleetId", om.valueToTree(this.getFleetId()));
            }
            if (this.getMessage() != null) {
                data.set("message", om.valueToTree(this.getMessage()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.gameliftAlias.GameliftAliasRoutingStrategy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GameliftAliasRoutingStrategy.Jsii$Proxy that = (GameliftAliasRoutingStrategy.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.fleetId != null ? !this.fleetId.equals(that.fleetId) : that.fleetId != null) return false;
            return this.message != null ? this.message.equals(that.message) : that.message == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.fleetId != null ? this.fleetId.hashCode() : 0);
            result = 31 * result + (this.message != null ? this.message.hashCode() : 0);
            return result;
        }
    }
}
