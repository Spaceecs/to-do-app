"use client";

import "@/app/globals.css"
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    updateDoc,
} from "firebase/firestore";
import { db } from "@/utils/firebase";

export default function AddUserPage() {
    const router = useRouter();
    const { listId } = router.query;

    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [role, setRole] = useState<"admin" | "member">("member");

    useEffect(() => {
        if (!listId) {
            setStatus("ID списку не знайдено");
        }
    }, [listId]);

    const handleAddUser = async () => {
        try {
            if (!email) {
                setStatus("Введіть email");
                return;
            }

            const q = query(collection(db, "users"), where("email", "==", email));
            const snap = await getDocs(q);

            if (snap.empty) {
                setStatus("Користувача з таким email не знайдено");
                return;
            }

            const userDoc = snap.docs[0];
            const userData = userDoc.data();
            const userId = userDoc.id;

            const listRef = doc(db, "taskLists", listId as string);
            const listSnap = await getDoc(listRef);

            if (!listSnap.exists()) {
                setStatus("Список не знайдено");
                return;
            }

            const listData = listSnap.data();

            const existingIds: string[] = Array.isArray(listData.participantsIds)
                ? listData.participantsIds
                : [];

            if (existingIds.includes(userId)) {
                setStatus("Користувач вже є в учасниках");
                return;
            }

            const updatedParticipants = {
                ...listData.participants,
                [userId]: {
                    id: userId,
                    name: userData.name || userData.displayName || "No Name",
                    status: role,
                },
            };

            const updatedParticipantsIds = [...existingIds, userId];

            await updateDoc(listRef, {
                participants: updatedParticipants,
                participantsIds: updatedParticipantsIds,
            });

            setStatus("Учасника додано!");
            setEmail("");
            setRole("member");
        } catch (error) {
            console.error("Помилка при додаванні користувача:", error);
            setStatus("Щось пішло не так");
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
            <h1 className="text-2xl font-bold mb-4">Додати учасника</h1>

            <input
                type="email"
                placeholder="Email користувача"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border px-4 py-2 rounded mb-4"
            />

            <select
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "member")}
                className="w-full border px-4 py-2 rounded mb-4"
            >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
            </select>

            <button
                onClick={handleAddUser}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-3"
                disabled={!listId}
            >
                Додати
            </button>

            {status && <p className="mt-4 text-center text-sm text-red-600">{status}</p>}

            <button
                onClick={() => router.push(`/todo-lists/${listId}`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
                назад
            </button>
        </div>
    );
}
