'use client';

import "@/app/globals.css"
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Timestamp, addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/utils/firebase";

export default function AddTaskPage() {
    const router = useRouter();
    const params = useParams();
    const listId = params?.listId as string;

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [assignedTo, setAssignedTo] = useState("");
    const [participants, setParticipants] = useState<Record<string, "admin" | "viewer">>({});

    useEffect(() => {
        async function fetchParticipants() {
            const user = auth.currentUser;
            if (!user) {
                router.push("/login");
                return;
            }

            if (!listId) return;

            const listRef = doc(db, "taskLists", listId);
            const listSnap = await getDoc(listRef);

            if (!listSnap.exists()) {
                alert("Список не знайдено.");
                router.push("/todo-lists");
                return;
            }

            const data = listSnap.data();
            const participantUids = Object.keys(data.participants || {});
            const usersMap: Record<string, { displayName: string }> = {};

            for (const uid of participantUids) {
                const userDoc = await getDoc(doc(db, "users", uid));
                if (userDoc.exists()) {
                    usersMap[uid] = {
                        displayName: userDoc.data().displayName || userDoc.data().name || userDoc.data().email || "Без імені"
                    };
                }
            }

            setParticipants(usersMap);
        }

        fetchParticipants();
    }, [listId, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) {
            router.push("/login");
            return;
        }

        await addDoc(collection(db, "tasks"), {
            title,
            body,
            taskListId: listId,
            checked: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
            priority,
            assignedTo: assignedTo || null,
        });

        router.push(`/todo-lists/${listId}`);
    };

    return (
        <div className="max-w-xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Створити нову таску</h1>
            <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                    <label className="block font-medium">Назва</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        className="w-full border px-4 py-2 rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">Опис</label>
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        className="w-full border px-4 py-2 rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">Термін виконання</label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="w-full border px-4 py-2 rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">Пріоритет</label>
                    <select
                        value={priority}
                        onChange={e => setPriority(e.target.value as any)}
                        className="w-full border px-4 py-2 rounded"
                    >
                        <option value="low">Низький</option>
                        <option value="medium">Середній</option>
                        <option value="high">Високий</option>
                    </select>
                </div>

                <div>
                    <label className="block font-medium">Призначити користувача</label>
                    <select
                        value={assignedTo}
                        onChange={e => setAssignedTo(e.target.value)}
                        className="w-full border px-4 py-2 rounded"
                    >
                        <option value="">Не призначено</option>
                        {Object.entries(participants).map(([uid, info]) => (
                            <option key={uid} value={uid}>
                                {info.displayName}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded"
                >
                    Додати таску
                </button>
            </form>
        </div>
    );
}
