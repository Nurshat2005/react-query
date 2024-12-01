import { useState } from "react";
import scss from "./Todo.module.scss";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";

interface ITodo {
	_id?: number;
	title: string;
}

const API_URL =
	"https://api.elchocrud.pro/api/v1/06277888ac88ba16076affee049969e3/todo";

const getTodos = async () => {
	try {
		const { data } = await axios.get(API_URL);
		return data;
	} catch (error) {
		console.error("Error fetching todos:", error);
	}
};

const addTodo = async (value: string) => {
	if (!value.trim()) return;
	const newData = { title: value };
	try {
		await axios.post(API_URL, newData);
		const { data } = await axios.get(API_URL);
		return data;
	} catch (error) {
		console.error("Error adding todo:", error);
	}
};

const Todo = () => {
	const queryClient = useQueryClient();
	const [value, setValue] = useState("");

	const { data: todos, isLoading } = useQuery<ITodo[]>(["todos"], getTodos);

	const mutation = useMutation(addTodo, {
		onMutate: async (value) => {
			// Получаем текущие todos
			const previousTodos = queryClient.getQueryData<ITodo[]>("todos");

			// Оптимистично обновляем UI (предположим, что данные добавятся успешно)
			queryClient.setQueryData<ITodo[]>("todos", (oldTodos) => [
				...(oldTodos || []),
				{ title: value },
			]);

			return { previousTodos }; // Возвращаем старые данные для отката в случае ошибки
		},
		onSettled: () => {
			// После завершения запроса перезагружаем данные todos
			queryClient.invalidateQueries("todos");
		},
	});

	const handleAddTodo = () => {
		if (value.trim()) {
			mutation.mutate(value);
			setValue("");
		}
	};

	if (isLoading) return <div>Loading...</div>;

	return (
		<div className="container">
			<h1>Todo List</h1>
			<div className={scss.todo_add}>
				<input
					type="text"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					placeholder="Add a new todo"
				/>
				<button onClick={handleAddTodo} disabled={mutation.isLoading}>
					Add Todo
				</button>
				{mutation.isLoading && <p>Adding todo...</p>}
			</div>
			<ul>
				{todos
					?.slice()
					.reverse()
					.map((todo, index) => (
						<li key={index}>{todo.title}</li>
					))}
			</ul>
		</div>
	);
};

export default Todo;
