package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.329Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineStage")
@software.amazon.jsii.Jsii.Proxy(CodepipelineStage.Jsii$Proxy.class)
public interface CodepipelineStage extends software.amazon.jsii.JsiiSerializable {

    /**
     * action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#action Codepipeline#action}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * before_entry block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#before_entry Codepipeline#before_entry}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageBeforeEntry getBeforeEntry() {
        return null;
    }

    /**
     * on_failure block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#on_failure Codepipeline#on_failure}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageOnFailure getOnFailure() {
        return null;
    }

    /**
     * on_success block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#on_success Codepipeline#on_success}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageOnSuccess getOnSuccess() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineStage}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineStage}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineStage> {
        java.lang.Object action;
        java.lang.String name;
        imports.aws.codepipeline.CodepipelineStageBeforeEntry beforeEntry;
        imports.aws.codepipeline.CodepipelineStageOnFailure onFailure;
        imports.aws.codepipeline.CodepipelineStageOnSuccess onSuccess;

        /**
         * Sets the value of {@link CodepipelineStage#getAction}
         * @param action action block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#action Codepipeline#action}
         * @return {@code this}
         */
        public Builder action(com.hashicorp.cdktf.IResolvable action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStage#getAction}
         * @param action action block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#action Codepipeline#action}
         * @return {@code this}
         */
        public Builder action(java.util.List<? extends imports.aws.codepipeline.CodepipelineStageAction> action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStage#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#name Codepipeline#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStage#getBeforeEntry}
         * @param beforeEntry before_entry block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#before_entry Codepipeline#before_entry}
         * @return {@code this}
         */
        public Builder beforeEntry(imports.aws.codepipeline.CodepipelineStageBeforeEntry beforeEntry) {
            this.beforeEntry = beforeEntry;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStage#getOnFailure}
         * @param onFailure on_failure block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#on_failure Codepipeline#on_failure}
         * @return {@code this}
         */
        public Builder onFailure(imports.aws.codepipeline.CodepipelineStageOnFailure onFailure) {
            this.onFailure = onFailure;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStage#getOnSuccess}
         * @param onSuccess on_success block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#on_success Codepipeline#on_success}
         * @return {@code this}
         */
        public Builder onSuccess(imports.aws.codepipeline.CodepipelineStageOnSuccess onSuccess) {
            this.onSuccess = onSuccess;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineStage}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineStage build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineStage}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineStage {
        private final java.lang.Object action;
        private final java.lang.String name;
        private final imports.aws.codepipeline.CodepipelineStageBeforeEntry beforeEntry;
        private final imports.aws.codepipeline.CodepipelineStageOnFailure onFailure;
        private final imports.aws.codepipeline.CodepipelineStageOnSuccess onSuccess;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.beforeEntry = software.amazon.jsii.Kernel.get(this, "beforeEntry", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageBeforeEntry.class));
            this.onFailure = software.amazon.jsii.Kernel.get(this, "onFailure", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnFailure.class));
            this.onSuccess = software.amazon.jsii.Kernel.get(this, "onSuccess", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnSuccess.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = java.util.Objects.requireNonNull(builder.action, "action is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.beforeEntry = builder.beforeEntry;
            this.onFailure = builder.onFailure;
            this.onSuccess = builder.onSuccess;
        }

        @Override
        public final java.lang.Object getAction() {
            return this.action;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.codepipeline.CodepipelineStageBeforeEntry getBeforeEntry() {
            return this.beforeEntry;
        }

        @Override
        public final imports.aws.codepipeline.CodepipelineStageOnFailure getOnFailure() {
            return this.onFailure;
        }

        @Override
        public final imports.aws.codepipeline.CodepipelineStageOnSuccess getOnSuccess() {
            return this.onSuccess;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("action", om.valueToTree(this.getAction()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getBeforeEntry() != null) {
                data.set("beforeEntry", om.valueToTree(this.getBeforeEntry()));
            }
            if (this.getOnFailure() != null) {
                data.set("onFailure", om.valueToTree(this.getOnFailure()));
            }
            if (this.getOnSuccess() != null) {
                data.set("onSuccess", om.valueToTree(this.getOnSuccess()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipeline.CodepipelineStage"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineStage.Jsii$Proxy that = (CodepipelineStage.Jsii$Proxy) o;

            if (!action.equals(that.action)) return false;
            if (!name.equals(that.name)) return false;
            if (this.beforeEntry != null ? !this.beforeEntry.equals(that.beforeEntry) : that.beforeEntry != null) return false;
            if (this.onFailure != null ? !this.onFailure.equals(that.onFailure) : that.onFailure != null) return false;
            return this.onSuccess != null ? this.onSuccess.equals(that.onSuccess) : that.onSuccess == null;
        }

        @Override
        public final int hashCode() {
            int result = this.action.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.beforeEntry != null ? this.beforeEntry.hashCode() : 0);
            result = 31 * result + (this.onFailure != null ? this.onFailure.hashCode() : 0);
            result = 31 * result + (this.onSuccess != null ? this.onSuccess.hashCode() : 0);
            return result;
        }
    }
}
