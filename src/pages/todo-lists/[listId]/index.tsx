"use client";

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

    useEffect(() => {
        if (!listId || typeof listId !== "string") return;

        async function fetchData() {
            setLoading(true);

            const user = auth.currentUser;
            if (!user) {
                await router.push("/login");
                return;
            }

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

            const participants = listSnap.data().participants || {};
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
                <button
                    onClick={() => router.push("/todo-lists")}
                    className="mt-4 text-blue-600 underline"
                >
                    Повернутися до списків
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Таски</h1>
            <ul className="space-y-6">
                {tasks.map((task) => (
                    <li
                        key={task.id}
                        className="border p-4 rounded shadow hover:shadow-lg transition"
                    >
                        <h2 className="text-xl font-semibold">{task.title}</h2>
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

            <button
                onClick={() => router.push(`/todo-lists/${listId}/add-task`)}
                className="mt-8 bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded"
            >
                Додати нову таску
            </button>
            <button
                onClick={() => router.push(`/todo-lists/${listId}/add-user`)}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded"
            >
                Додати учасника
            </button>
        </div>
    );
}
