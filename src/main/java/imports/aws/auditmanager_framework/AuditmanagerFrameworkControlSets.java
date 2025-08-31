package imports.aws.auditmanager_framework;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.089Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.auditmanagerFramework.AuditmanagerFrameworkControlSets")
@software.amazon.jsii.Jsii.Proxy(AuditmanagerFrameworkControlSets.Jsii$Proxy.class)
public interface AuditmanagerFrameworkControlSets extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_framework#name AuditmanagerFramework#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * controls block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_framework#controls AuditmanagerFramework#controls}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getControls() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AuditmanagerFrameworkControlSets}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AuditmanagerFrameworkControlSets}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AuditmanagerFrameworkControlSets> {
        java.lang.String name;
        java.lang.Object controls;

        /**
         * Sets the value of {@link AuditmanagerFrameworkControlSets#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_framework#name AuditmanagerFramework#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerFrameworkControlSets#getControls}
         * @param controls controls block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_framework#controls AuditmanagerFramework#controls}
         * @return {@code this}
         */
        public Builder controls(com.hashicorp.cdktf.IResolvable controls) {
            this.controls = controls;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerFrameworkControlSets#getControls}
         * @param controls controls block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_framework#controls AuditmanagerFramework#controls}
         * @return {@code this}
         */
        public Builder controls(java.util.List<? extends imports.aws.auditmanager_framework.AuditmanagerFrameworkControlSetsControls> controls) {
            this.controls = controls;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AuditmanagerFrameworkControlSets}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AuditmanagerFrameworkControlSets build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AuditmanagerFrameworkControlSets}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AuditmanagerFrameworkControlSets {
        private final java.lang.String name;
        private final java.lang.Object controls;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.controls = software.amazon.jsii.Kernel.get(this, "controls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.controls = builder.controls;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getControls() {
            return this.controls;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getControls() != null) {
                data.set("controls", om.valueToTree(this.getControls()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.auditmanagerFramework.AuditmanagerFrameworkControlSets"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AuditmanagerFrameworkControlSets.Jsii$Proxy that = (AuditmanagerFrameworkControlSets.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            return this.controls != null ? this.controls.equals(that.controls) : that.controls == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.controls != null ? this.controls.hashCode() : 0);
            return result;
        }
    }
}
