package imports.aws.gamelift_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.265Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftFleet.GameliftFleetResourceCreationLimitPolicy")
@software.amazon.jsii.Jsii.Proxy(GameliftFleetResourceCreationLimitPolicy.Jsii$Proxy.class)
public interface GameliftFleetResourceCreationLimitPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#new_game_sessions_per_creator GameliftFleet#new_game_sessions_per_creator}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNewGameSessionsPerCreator() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#policy_period_in_minutes GameliftFleet#policy_period_in_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPolicyPeriodInMinutes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GameliftFleetResourceCreationLimitPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GameliftFleetResourceCreationLimitPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GameliftFleetResourceCreationLimitPolicy> {
        java.lang.Number newGameSessionsPerCreator;
        java.lang.Number policyPeriodInMinutes;

        /**
         * Sets the value of {@link GameliftFleetResourceCreationLimitPolicy#getNewGameSessionsPerCreator}
         * @param newGameSessionsPerCreator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#new_game_sessions_per_creator GameliftFleet#new_game_sessions_per_creator}.
         * @return {@code this}
         */
        public Builder newGameSessionsPerCreator(java.lang.Number newGameSessionsPerCreator) {
            this.newGameSessionsPerCreator = newGameSessionsPerCreator;
            return this;
        }

        /**
         * Sets the value of {@link GameliftFleetResourceCreationLimitPolicy#getPolicyPeriodInMinutes}
         * @param policyPeriodInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/gamelift_fleet#policy_period_in_minutes GameliftFleet#policy_period_in_minutes}.
         * @return {@code this}
         */
        public Builder policyPeriodInMinutes(java.lang.Number policyPeriodInMinutes) {
            this.policyPeriodInMinutes = policyPeriodInMinutes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GameliftFleetResourceCreationLimitPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GameliftFleetResourceCreationLimitPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GameliftFleetResourceCreationLimitPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GameliftFleetResourceCreationLimitPolicy {
        private final java.lang.Number newGameSessionsPerCreator;
        private final java.lang.Number policyPeriodInMinutes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.newGameSessionsPerCreator = software.amazon.jsii.Kernel.get(this, "newGameSessionsPerCreator", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.policyPeriodInMinutes = software.amazon.jsii.Kernel.get(this, "policyPeriodInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.newGameSessionsPerCreator = builder.newGameSessionsPerCreator;
            this.policyPeriodInMinutes = builder.policyPeriodInMinutes;
        }

        @Override
        public final java.lang.Number getNewGameSessionsPerCreator() {
            return this.newGameSessionsPerCreator;
        }

        @Override
        public final java.lang.Number getPolicyPeriodInMinutes() {
            return this.policyPeriodInMinutes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNewGameSessionsPerCreator() != null) {
                data.set("newGameSessionsPerCreator", om.valueToTree(this.getNewGameSessionsPerCreator()));
            }
            if (this.getPolicyPeriodInMinutes() != null) {
                data.set("policyPeriodInMinutes", om.valueToTree(this.getPolicyPeriodInMinutes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.gameliftFleet.GameliftFleetResourceCreationLimitPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GameliftFleetResourceCreationLimitPolicy.Jsii$Proxy that = (GameliftFleetResourceCreationLimitPolicy.Jsii$Proxy) o;

            if (this.newGameSessionsPerCreator != null ? !this.newGameSessionsPerCreator.equals(that.newGameSessionsPerCreator) : that.newGameSessionsPerCreator != null) return false;
            return this.policyPeriodInMinutes != null ? this.policyPeriodInMinutes.equals(that.policyPeriodInMinutes) : that.policyPeriodInMinutes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.newGameSessionsPerCreator != null ? this.newGameSessionsPerCreator.hashCode() : 0;
            result = 31 * result + (this.policyPeriodInMinutes != null ? this.policyPeriodInMinutes.hashCode() : 0);
            return result;
        }
    }
}
