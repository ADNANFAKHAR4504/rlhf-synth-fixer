package imports.aws.evidently_launch;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.214Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyLaunch.EvidentlyLaunchGroups")
@software.amazon.jsii.Jsii.Proxy(EvidentlyLaunchGroups.Jsii$Proxy.class)
public interface EvidentlyLaunchGroups extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#feature EvidentlyLaunch#feature}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFeature();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#name EvidentlyLaunch#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#variation EvidentlyLaunch#variation}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVariation();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#description EvidentlyLaunch#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EvidentlyLaunchGroups}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EvidentlyLaunchGroups}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EvidentlyLaunchGroups> {
        java.lang.String feature;
        java.lang.String name;
        java.lang.String variation;
        java.lang.String description;

        /**
         * Sets the value of {@link EvidentlyLaunchGroups#getFeature}
         * @param feature Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#feature EvidentlyLaunch#feature}. This parameter is required.
         * @return {@code this}
         */
        public Builder feature(java.lang.String feature) {
            this.feature = feature;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyLaunchGroups#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#name EvidentlyLaunch#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyLaunchGroups#getVariation}
         * @param variation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#variation EvidentlyLaunch#variation}. This parameter is required.
         * @return {@code this}
         */
        public Builder variation(java.lang.String variation) {
            this.variation = variation;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyLaunchGroups#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#description EvidentlyLaunch#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EvidentlyLaunchGroups}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EvidentlyLaunchGroups build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EvidentlyLaunchGroups}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EvidentlyLaunchGroups {
        private final java.lang.String feature;
        private final java.lang.String name;
        private final java.lang.String variation;
        private final java.lang.String description;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.feature = software.amazon.jsii.Kernel.get(this, "feature", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.variation = software.amazon.jsii.Kernel.get(this, "variation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.feature = java.util.Objects.requireNonNull(builder.feature, "feature is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.variation = java.util.Objects.requireNonNull(builder.variation, "variation is required");
            this.description = builder.description;
        }

        @Override
        public final java.lang.String getFeature() {
            return this.feature;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getVariation() {
            return this.variation;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("feature", om.valueToTree(this.getFeature()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("variation", om.valueToTree(this.getVariation()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.evidentlyLaunch.EvidentlyLaunchGroups"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EvidentlyLaunchGroups.Jsii$Proxy that = (EvidentlyLaunchGroups.Jsii$Proxy) o;

            if (!feature.equals(that.feature)) return false;
            if (!name.equals(that.name)) return false;
            if (!variation.equals(that.variation)) return false;
            return this.description != null ? this.description.equals(that.description) : that.description == null;
        }

        @Override
        public final int hashCode() {
            int result = this.feature.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.variation.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            return result;
        }
    }
}
