"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/utils/firebase";
import { signOut } from "firebase/auth";
import "@/app/globals.css";

type Participant = {
    id: string;
    name: string;
    status: "owner" | "admin" | "viewer";
};

type TaskList = {
    id: string;
    title: string;
    participants: Record<string, Participant>;
    participantsIds: string[];
};

export default function ToDoLists() {
    const [lists, setLists] = useState<TaskList[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingListId, setEditingListId] = useState<string | null>(null);
    const [editedTitle, setEditedTitle] = useState("");
    const router = useRouter();

    useEffect(() => {
        async function fetchTaskLists() {
            setLoading(true);

            const user = auth.currentUser;
            if (!user) {
                router.push("/login");
                return;
            }

            const userId = user.uid;

            const q = query(
                collection(db, "taskLists"),
                where("participantsIds", "array-contains", userId)
            );

            const snapshot = await getDocs(q);

            const fetchedLists = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<TaskList, "id">),
            }));

            setLists(fetchedLists);
            setLoading(false);
        }

        fetchTaskLists();
    }, [router]);

    const startEditing = (list: TaskList) => {
        setEditingListId(list.id);
        setEditedTitle(list.title);
    };

    const cancelEditing = () => {
        setEditingListId(null);
        setEditedTitle("");
    };

    const saveTitle = async (list: TaskList) => {
        if (!editedTitle.trim()) {
            alert("Назва списку не може бути пустою");
            return;
        }

        try {
            const listRef = doc(db, "taskLists", list.id);
            await updateDoc(listRef, { title: editedTitle.trim() });

            setLists((prev) =>
                prev.map((l) =>
                    l.id === list.id
                        ? {
                            ...l,
                            title: editedTitle.trim(),
                        }
                        : l
                )
            );

            setEditingListId(null);
            setEditedTitle("");
        } catch (error) {
            console.error("Помилка при збереженні назви:", error);
            alert("Не вдалося зберегти назву");
        }
    };

    const removeCurrentUserFromList = async (list: TaskList) => {
        const user = auth.currentUser;
        if (!user) return;

        const userId = user.uid;

        try {
            const listRef = doc(db, "taskLists", list.id);

            const updatedParticipants = { ...list.participants };
            delete updatedParticipants[userId];

            const updatedParticipantsIds = list.participantsIds.filter(
                (id) => id !== userId
            );

            await updateDoc(listRef, {
                participants: updatedParticipants,
                participantsIds: updatedParticipantsIds,
            });

            setLists((prev) => prev.filter((l) => l.id !== list.id));
        } catch (error) {
            console.error("Помилка при виході зі списку:", error);
            alert("Не вдалося вийти зі списку");
        }
    };

    const deleteList = async (list: TaskList) => {
        const user = auth.currentUser;
        if (!user) return;

        const userRole = list.participants[user.uid]?.status;

        if (userRole === "owner") {
            const confirmed = confirm(
                "Ви впевнені, що хочете видалити цей список повністю?"
            );
            if (!confirmed) return;

            try {
                const listRef = doc(db, "taskLists", list.id);
                await deleteDoc(listRef);

                setLists((prev) => prev.filter((l) => l.id !== list.id));
            } catch (error) {
                console.error("Помилка при видаленні списку:", error);
                alert("Не вдалося видалити список");
            }
        } else {
            const confirmed = confirm(
                "Ви впевнені, що хочете вийти з цього списку?"
            );
            if (!confirmed) return;

            await removeCurrentUserFromList(list);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Помилка при виході:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Завантаження списків...</p>
            </div>
        );
    }

    if (lists.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="mb-4 text-gray-700 text-lg">Тут ще нічого немає.</p>
                <button
                    onClick={handleLogout}
                    className=" mb-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded"
                >
                    Вийти
                </button>
                <button
                    onClick={() => router.push("/todo-lists/create-list")}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded"
                >
                    Створити список завдань
                </button>
            </div>
        );
    }

    const userId = auth.currentUser!.uid;

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Ваші списки завдань</h1>
            <button
                onClick={handleLogout}
                className=" mb-6 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded"
            >
                Вийти
            </button>
            <ul className="space-y-4">
                {lists.map((list) => {
                    const userRole = list.participants[userId]?.status || "невідомо";
                    const isEditing = editingListId === list.id;

                    return (
                        <li
                            key={list.id}
                            className="border p-4 rounded shadow hover:shadow-lg transition cursor-pointer flex justify-between items-center"
                            onClick={() => !isEditing && router.push(`/todo-lists/${list.id}`)}
                        >
                            <div className="flex flex-col flex-grow">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="border rounded px-2 py-1 w-full"
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <h2 className="text-xl font-semibold">{list.title}</h2>
                                )}
                                <p className="text-gray-600 text-sm">Роль: {userRole}</p>
                            </div>

                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                saveTitle(list);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded"
                                        >
                                            Зберегти
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                cancelEditing();
                                            }}
                                            className="bg-gray-400 hover:bg-gray-500 text-white py-1 px-3 rounded"
                                        >
                                            Відмінити
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEditing(list);
                                            }}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded"
                                        >
                                            Редагувати
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteList(list);
                                            }}
                                            className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded"
                                        >
                                            {userRole === "owner" ? "Видалити" : "Вийти зі списку"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            <button
                onClick={() => router.push("/todo-lists/create-list")}
                className="mt-8 bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded"
            >
                Додати новий список
            </button>
        </div>
    );
}
