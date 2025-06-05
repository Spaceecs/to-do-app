"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { collection, doc, getDoc, addDoc } from "firebase/firestore";
import { auth, db } from "@/utils/firebase";

const createListSchema = Yup.object().shape({
    title: Yup.string().required("Назва списку обов'язкова"),
});

export default function CreateList() {
    const router = useRouter();
    const [status, setStatus] = useState<string | null>(null);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Створити новий список</h2>
                <Formik
                    initialValues={{ title: "" }}
                    validationSchema={createListSchema}
                    onSubmit={async (values, { setSubmitting }) => {
                        setStatus(null);
                        try {
                            const user = auth.currentUser;
                            if (!user) {
                                setStatus("Спочатку увійдіть у систему");
                                setSubmitting(false);
                                return;
                            }

                            const userRef = doc(db, "users", user.uid);
                            const userSnap = await getDoc(userRef);

                            let name = "No Name";
                            if (userSnap.exists()) {
                                const userData = userSnap.data();
                                name = userData.name || user.displayName || user.email || "No Name";
                            }

                            await addDoc(collection(db, "taskLists"), {
                                title: values.title,
                                participants: {
                                    [user.uid]: {
                                        id: user.uid,
                                        name,
                                        status: "owner",
                                    },
                                },
                                participantsIds: [user.uid],
                                createdAt: new Date(),
                            });



                            setStatus("Список успішно створено!");
                            setSubmitting(false);
                            router.push("/todo-lists");
                        } catch (error) {
                            console.error("Помилка при створенні списку:", error);
                            setStatus("Помилка при створенні списку");
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                    Назва списку
                                </label>
                                <Field
                                    id="title"
                                    name="title"
                                    type="text"
                                    placeholder="Введіть назву списку"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                                <ErrorMessage name="title" component="div" className="text-red-500 text-sm mt-1" />
                            </div>

                            {status && <div className="text-center text-red-500">{status}</div>}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
                            >
                                {isSubmitting ? "Створення..." : "Створити"}
                            </button>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}
