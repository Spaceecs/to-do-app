import "@/app/globals.css"
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup"
import {signInWithEmailAndPassword } from "firebase/auth"
import {auth} from "@/utils/firebase"
import {useRouter} from "next/navigation";

const loginSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email required"),
    password: Yup.string().min(8,"Minimum 8 characters").required("Password required")
})

export default function Login() {
    const router = useRouter()
    return(
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="max-w-md mx-auto border-2 border-black p-12 bg-white rounded-xl shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6 text-black">Login</h2>
                <Formik initialValues={{email: "", password: ""}}
                        validationSchema={loginSchema}
                        onSubmit={async (values, {setSubmitting, setStatus}) => {
                    setStatus(null);
                    try {
                        await signInWithEmailAndPassword (auth, values.email, values.password);
                        console.log("user enter successfully")
                        await router.push("/todo-lists")
                    }
                    catch (err: any){
                        setStatus("Invalid email or password")
                    }
                    setSubmitting(false);
                }}
                >
                    {({isSubmitting, status}) => (
                        <Form className="space-y-4">
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
                                    Пароль
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
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
                            >
                                {isSubmitting ? "Wait..." : "Enter"}
                            </button>
                            <p className="text-sm text-center text-gray-600 mt-4">
                                Not registered?{" "}
                                <a href="/register" className="text-blue-600 hover:underline font-medium">
                                    Register
                                </a>
                            </p>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    )
}