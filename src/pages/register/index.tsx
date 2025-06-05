import "@/app/globals.css"
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/utils/firebase";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const registerSchema = Yup.object().shape({
    name: Yup.string().required("Name required"),
    email: Yup.string().email("Invalid email").required("Email required"),
    password: Yup.string().min(8, "Minimum 8 characters").required("Password required"),
});

export default function Register() {
    const router = useRouter();
    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="max-w-md mx-auto border-2 border-black p-12 bg-white rounded-xl shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-black">Register</h2>
                <Formik
                    initialValues={{ name: "", email: "", password: "" }}
                    validationSchema={registerSchema}
                    onSubmit={async (values, { setSubmitting, setStatus }) => {
                        setStatus(null);
                        try {
                            const userCredential = await createUserWithEmailAndPassword(
                                auth,
                                values.email,
                                values.password
                            );
                            await updateProfile(userCredential.user, {
                                displayName: values.name,
                            });

                            // Зберігаємо користувача в Firestore
                            await setDoc(doc(db, "users", userCredential.user.uid), {
                                name: values.name,
                                email: values.email,
                                createdAt: serverTimestamp(),
                            });

                            console.log("User registered successfully");
                            await router.push("/todo-lists");
                        } catch (err: any) {
                            setStatus(err.message || "Registration failed");
                        }
                        setSubmitting(false);
                    }}
                >
                    {({ isSubmitting, status }) => (
                        <Form className="space-y-4">
                            {/* Поля і валідація */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Name
                                </label>
                                <Field
                                    type="text"
                                    name="name"
                                    className="mt-1 block w-full rounded-md border-black border-2 shadow-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <Field
                                    type="email"
                                    name="email"
                                    className="mt-1 block w-full rounded-md border-black border-2 shadow-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <Field
                                    type="password"
                                    name="password"
                                    className="mt-1 block w-full rounded-md border-black border-2 shadow-md focus:ring-blue-500 focus:border-blue-500"
                                />
                                <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                            </div>

                            {status && <div className="text-red-500 text-sm">{status}</div>}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition duration-200"
                            >
                                {isSubmitting ? "Registering..." : "Register"}
                            </button>
                            <p className="text-sm text-center text-gray-600 mt-4">
                                Already have an account?{" "}
                                <a href="/login" className="text-blue-600 hover:underline font-medium">
                                    Login
                                </a>
                            </p>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}
