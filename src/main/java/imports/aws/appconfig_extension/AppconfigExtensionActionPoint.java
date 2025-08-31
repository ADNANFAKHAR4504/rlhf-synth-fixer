package imports.aws.appconfig_extension;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.985Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appconfigExtension.AppconfigExtensionActionPoint")
@software.amazon.jsii.Jsii.Proxy(AppconfigExtensionActionPoint.Jsii$Proxy.class)
public interface AppconfigExtensionActionPoint extends software.amazon.jsii.JsiiSerializable {

    /**
     * action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_extension#action AppconfigExtension#action}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_extension#point AppconfigExtension#point}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPoint();

    /**
     * @return a {@link Builder} of {@link AppconfigExtensionActionPoint}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppconfigExtensionActionPoint}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppconfigExtensionActionPoint> {
        java.lang.Object action;
        java.lang.String point;

        /**
         * Sets the value of {@link AppconfigExtensionActionPoint#getAction}
         * @param action action block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_extension#action AppconfigExtension#action}
         * @return {@code this}
         */
        public Builder action(com.hashicorp.cdktf.IResolvable action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigExtensionActionPoint#getAction}
         * @param action action block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_extension#action AppconfigExtension#action}
         * @return {@code this}
         */
        public Builder action(java.util.List<? extends imports.aws.appconfig_extension.AppconfigExtensionActionPointAction> action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link AppconfigExtensionActionPoint#getPoint}
         * @param point Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appconfig_extension#point AppconfigExtension#point}. This parameter is required.
         * @return {@code this}
         */
        public Builder point(java.lang.String point) {
            this.point = point;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppconfigExtensionActionPoint}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppconfigExtensionActionPoint build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppconfigExtensionActionPoint}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppconfigExtensionActionPoint {
        private final java.lang.Object action;
        private final java.lang.String point;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.point = software.amazon.jsii.Kernel.get(this, "point", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = java.util.Objects.requireNonNull(builder.action, "action is required");
            this.point = java.util.Objects.requireNonNull(builder.point, "point is required");
        }

        @Override
        public final java.lang.Object getAction() {
            return this.action;
        }

        @Override
        public final java.lang.String getPoint() {
            return this.point;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("action", om.valueToTree(this.getAction()));
            data.set("point", om.valueToTree(this.getPoint()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appconfigExtension.AppconfigExtensionActionPoint"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppconfigExtensionActionPoint.Jsii$Proxy that = (AppconfigExtensionActionPoint.Jsii$Proxy) o;

            if (!action.equals(that.action)) return false;
            return this.point.equals(that.point);
        }

        @Override
        public final int hashCode() {
            int result = this.action.hashCode();
            result = 31 * result + (this.point.hashCode());
            return result;
        }
    }
}
