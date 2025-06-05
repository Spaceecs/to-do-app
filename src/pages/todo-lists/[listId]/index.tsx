'use client';

import "@/app/globals.css";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    Timestamp,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/utils/firebase";

type Task = {
    id: string;
    title: string;
    body: string;
    taskListId: string;
    checked: boolean;
    createdAt: Timestamp | Date | string;
    updatedAt?: Timestamp | Date | string;
    dueDate?: Timestamp | Date | string;
    priority?: "low" | "medium" | "high";
    assignedTo?: string;
};

type UserInfo = {
    name: string;
};

function formatDate(date?: Timestamp | Date | string) {
    if (!date) return "-";
    if (date instanceof Timestamp) return date.toDate().toLocaleString();
    if (date instanceof Date) return date.toLocaleString();
    return new Date(date).toLocaleString();
}

export default function ToDoTasks() {
    const router = useRouter();
    const { listId } = router.query;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [usersInfo, setUsersInfo] = useState<Record<string, UserInfo>>({});
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<"owner" | "admin" | "member" | null>(null);
    const [setUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!listId || typeof listId !== "string") return;

        async function fetchData() {
            setLoading(true);

            const user = auth.currentUser;
            if (!user) {
                await router.push("/login");
                return;
            }

            const uid = user.uid;
            setUserId(uid);

            const taskQuery = query(
                collection(db, "tasks"),
                where("taskListId", "==", listId)
            );
            const tasksSnap = await getDocs(taskQuery);
            const fetchedTasks = tasksSnap.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<Task, "id">),
            }));
            setTasks(fetchedTasks);

            const listRef = doc(db, "taskLists", listId);
            const listSnap = await getDoc(listRef);
            if (!listSnap.exists()) {
                alert("Список не знайдено");
                await router.push("/todo-lists");
                return;
            }

            const listData = listSnap.data();
            const participants = listData.participants || {};
            const role = participants[uid]?.status || "member";
            setUserRole(role);

            const uniqueUserIds = new Set<string>(Object.keys(participants));
            for (const task of fetchedTasks) {
                if (task.assignedTo) {
                    uniqueUserIds.add(task.assignedTo);
                }
            }

            if (uniqueUserIds.size > 0) {
                const users: Record<string, UserInfo> = {};
                for (const uid of uniqueUserIds) {
                    const userDoc = await getDoc(doc(db, "users", uid));
                    if (userDoc.exists()) {
                        users[uid] = {
                            name: userDoc.data().name || "Невідомо",
                        };
                    }
                }
                setUsersInfo(users);
            } else {
                setUsersInfo({});
            }

            setLoading(false);
        }

        fetchData();
    }, [listId, router]);

    const toggleTaskChecked = async (taskId: string, currentValue: boolean) => {
        try {
            const taskRef = doc(db, "tasks", taskId);
            await updateDoc(taskRef, {
                checked: !currentValue,
                updatedAt: new Date(),
            });

            setTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId ? { ...t, checked: !currentValue } : t
                )
            );
        } catch (error) {
            console.error("Помилка при оновленні задачі:", error);
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!confirm("Ви дійсно хочете видалити цю таску?")) return;

        try {
            await deleteDoc(doc(db, "tasks", taskId));
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
        } catch (error) {
            console.error("Помилка при видаленні задачі:", error);
            alert("Не вдалося видалити таску.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Завантаження...</p>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="mb-4 text-gray-700 text-lg">Тут ще нема тасок</p>

                {(userRole === "admin" || userRole === "owner") && (
                    <>
                        <button
                            onClick={() => router.push(`/todo-lists/${listId}/add-task`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded"
                        >
                            Створити таску
                        </button>
                        <button
                            onClick={() => router.push(`/todo-lists/${listId}/add-user`)}
                            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded"
                        >
                            Додати учасника
                        </button>
                    </>
                )}

                <button
                    onClick={() => router.push("/todo-lists")}
                    className=" mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded"
                >
                    Назад
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Таски</h1>
            <button
                onClick={() => router.push("/todo-lists")}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded mb-6"
            >
                Назад
            </button>
            <ul className="space-y-6">
                {tasks.map((task) => (
                    <li
                        key={task.id}
                        className="border p-4 rounded shadow hover:shadow-lg transition"
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">{task.title}</h2>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => toggleTaskChecked(task.id, task.checked)}
                                    className={`w-6 h-6 border rounded-full ${
                                        task.checked
                                            ? "bg-green-600 border-green-700"
                                            : "border-gray-400"
                                    }`}
                                    title="Позначити як виконано"
                                >
                                    {task.checked && (
                                        <svg
                                            className="w-4 h-4 text-white mx-auto"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    )}
                                </button>

                                <button
                                    onClick={() => router.push(`/todo-lists/${listId}/edit-task/${task.id}`)}
                                    className="text-blue-600 hover:underline"
                                    title="Редагувати таску"
                                >
                                    Редагувати
                                </button>

                                {(userRole === "admin" || userRole === "owner") && (
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="text-red-600 hover:underline"
                                        title="Видалити таску"
                                    >
                                        Видалити
                                    </button>
                                )}
                            </div>
                        </div>

                        <p className="text-gray-700 mt-1">{task.body}</p>
                        <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-4">
                            <div>Статус: {task.checked ? "Виконано" : "В процесі"}</div>
                            <div>Пріоритет: {task.priority ?? "-"}</div>
                            <div>
                                Виконавець:{" "}
                                {task.assignedTo
                                    ? usersInfo[task.assignedTo]?.name ?? "-"
                                    : "-"}
                            </div>
                            <div>Створено: {formatDate(task.createdAt)}</div>
                            <div>Оновлено: {formatDate(task.updatedAt)}</div>
                            <div>Термін: {formatDate(task.dueDate)}</div>
                        </div>
                    </li>
                ))}
            </ul>

            {(userRole === "admin" || userRole === "owner") && (
                <>
                    <button
                        onClick={() => router.push(`/todo-lists/${listId}/add-task`)}
                        className="mt-8 bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded"
                    >
                        Додати нову таску
                    </button>
                    <button
                        onClick={() => router.push(`/todo-lists/${listId}/add-user`)}
                        className="ml-4 bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded"
                    >
                        Додати учасника
                    </button>
                </>
            )}
        </div>
    );
}
