import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {auth, db} from "@/utils/firebase"
import {collection, getDocs, query, where} from "@firebase/firestore";
import "@/app/globals.css"

type TaskList = {
    id: string,
    title: string
    participants: Record<string, "admin" | "viewer">;
}

export default function ToDoLists() {
    const [lists, setLists] = useState<TaskList[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchTaskLists() {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                await router.push("/login");
                return;
            }

            const userId = user.uid;

            const q = query(
                collection(db, "taskLists"),
                where(`participants.${userId}`, "in", ["admin", "viewer"])
            );

            const snapshot = await getDocs(q);
            const fetchedLists = snapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as Omit<TaskList, "id">),
            }))

            setLists(fetchedLists);
            setLoading(false);
        }

        fetchTaskLists();
    }, [router])
    if(loading) {
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
                    onClick={() => router.push("/todo-lists/create-list")}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded"
                >
                    Створити список завдань
                </button>
            </div>
        );
    }
    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Ваші списки завдань</h1>
            <ul className="space-y-4">
                {lists.map(list => (
                    <li key={list.id} className="border p-4 rounded shadow hover:shadow-lg transition cursor-pointer"
                        onClick={() => router.push(`/todo-lists/${list.id}`)}>
                        <h2 className="text-xl font-semibold">{list.title}</h2>
                        <p className="text-gray-600 text-sm">
                            Роль: {list.participants[auth.currentUser!.uid]}
                        </p>
                    </li>
                ))}
            </ul>
            <button
                onClick={() => router.push("todo-lists/create-list")}
                className="mt-8 bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded"
            >
                Додати новий список
            </button>
        </div>
    );
}