package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectEnvironmentFleet")
@software.amazon.jsii.Jsii.Proxy(CodebuildProjectEnvironmentFleet.Jsii$Proxy.class)
public interface CodebuildProjectEnvironmentFleet extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#fleet_arn CodebuildProject#fleet_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFleetArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildProjectEnvironmentFleet}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildProjectEnvironmentFleet}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildProjectEnvironmentFleet> {
        java.lang.String fleetArn;

        /**
         * Sets the value of {@link CodebuildProjectEnvironmentFleet#getFleetArn}
         * @param fleetArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#fleet_arn CodebuildProject#fleet_arn}.
         * @return {@code this}
         */
        public Builder fleetArn(java.lang.String fleetArn) {
            this.fleetArn = fleetArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildProjectEnvironmentFleet}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildProjectEnvironmentFleet build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildProjectEnvironmentFleet}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildProjectEnvironmentFleet {
        private final java.lang.String fleetArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fleetArn = software.amazon.jsii.Kernel.get(this, "fleetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fleetArn = builder.fleetArn;
        }

        @Override
        public final java.lang.String getFleetArn() {
            return this.fleetArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFleetArn() != null) {
                data.set("fleetArn", om.valueToTree(this.getFleetArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildProject.CodebuildProjectEnvironmentFleet"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildProjectEnvironmentFleet.Jsii$Proxy that = (CodebuildProjectEnvironmentFleet.Jsii$Proxy) o;

            return this.fleetArn != null ? this.fleetArn.equals(that.fleetArn) : that.fleetArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fleetArn != null ? this.fleetArn.hashCode() : 0;
            return result;
        }
    }
}
