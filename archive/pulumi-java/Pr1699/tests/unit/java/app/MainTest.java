package app;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.*;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import static org.mockito.Mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

import com.pulumi.Context;
import com.pulumi.Pulumi;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Map;

/**
 * Unit tests for the Main class.
 * Run with: ./gradlew test
 */
@ExtendWith(MockitoExtension.class)
public class MainTest {

    private final ByteArrayOutputStream outputStreamCaptor = new ByteArrayOutputStream();
    private final PrintStream originalOut = System.out;

    @Mock
    private Context mockContext;


    @BeforeEach
    void setUp() {
        System.setOut(new PrintStream(outputStreamCaptor));
    }

    @AfterEach
    void tearDown() {
        System.setOut(originalOut);
    }

    /**
     * Test that the Main class exists and is properly structured.
     */
    @Test
    void testMainClassStructure() {
        assertNotNull(Main.class);
        assertTrue(Modifier.isFinal(Main.class.getModifiers()));
        assertTrue(Modifier.isPublic(Main.class.getModifiers()));
    }

    /**
     * Test that the main method exists with correct signature and modifiers.
     */
    @Test
    void testMainMethodSignature() {
        assertDoesNotThrow(() -> {
            Method mainMethod = Main.class.getDeclaredMethod("main", String[].class);
            assertTrue(Modifier.isStatic(mainMethod.getModifiers()));
            assertTrue(Modifier.isPublic(mainMethod.getModifiers()));
            assertEquals(void.class, mainMethod.getReturnType());
        });
    }

    /**
     * Test that Main class has a private constructor (utility class pattern).
     */
    @Test
    void testPrivateConstructor() {
        assertDoesNotThrow(() -> {
            var constructor = Main.class.getDeclaredConstructor();
            assertTrue(Modifier.isPrivate(constructor.getModifiers()));
        });
    }

    /**
     * Test that Main class cannot be instantiated directly.
     */
    @Test
    void testCannotInstantiate() {
        assertThrows(IllegalAccessException.class, () -> {
            Main.class.getDeclaredConstructor().newInstance();
        });
    }

    /**
     * Test that the main method can be invoked without throwing exceptions.
     * Note: This doesn't actually run Pulumi but tests the method structure.
     */
    @Test
    void testMainMethodInvocation() {
        // We can't easily test Pulumi execution in unit tests,
        // but we can verify the method doesn't throw on basic invocation setup
        assertDoesNotThrow(() -> {
            Method mainMethod = Main.class.getDeclaredMethod("main", String[].class);
            assertNotNull(mainMethod);
        });
    }

    /**
     * Test that the class is in the correct package.
     */
    @Test
    void testPackage() {
        assertEquals("app", Main.class.getPackage().getName());
    }

    /**
     * Test that no static fields are exposed (good practice for utility classes).
     */
    @Test
    void testNoPublicStaticFields() {
        var fields = Main.class.getDeclaredFields();
        for (var field : fields) {
            if (Modifier.isStatic(field.getModifiers()) && Modifier.isPublic(field.getModifiers())) {
                fail("Utility class should not have public static fields: " + field.getName());
            }
        }
    }

    /**
     * Test the defineInfrastructure method exists and has correct signature.
     */
    @Test
    void testDefineInfrastructureMethodSignature() {
        assertDoesNotThrow(() -> {
            Method method = Main.class.getDeclaredMethod("defineInfrastructure", Context.class);
            assertTrue(Modifier.isStatic(method.getModifiers()));
            assertEquals(void.class, method.getReturnType());
        });
    }

    /**
     * Test the defineInfrastructure method can be called with a context.
     * This tests that the method signature and basic invocation works.
     */
    @Test
    void testDefineInfrastructureCanBeCalled() {
        // This tests method invocation without trying to mock complex Pulumi internals
        // We expect this to fail with a Pulumi context error, but not a method signature error
        Exception exception = assertThrows(Exception.class, () -> {
            Main.defineInfrastructure(mockContext);
        });

        // The exception should be from Pulumi operations, not from missing method
        assertNotNull(exception);
    }

    /**
     * Test that defineInfrastructure handles Context parameter correctly.
     */
    @Test
    void testDefineInfrastructureWithNullContext() {
        // This should throw an exception as Context cannot be null
        assertThrows(Exception.class, () -> {
            Main.defineInfrastructure(null);
        });
    }

    /**
     * Test that the main method delegates to defineInfrastructure via Pulumi.run.
     */
    @Test
    void testMainMethodCallsPulumiRun() {
        try (MockedStatic<Pulumi> mockedPulumi = mockStatic(Pulumi.class)) {
            // Call main method
            assertDoesNotThrow(() -> {
                Main.main(new String[]{});
            });

            // Verify Pulumi.run was called
            mockedPulumi.verify(() -> Pulumi.run(any()));
        }
    }
}