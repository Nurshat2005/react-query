import { useState } from 'react';
import scss from './Todo.module.scss';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

interface ITodo {
  _id?: number;
  title: string;
}

const API_URL = 'https://api.elchocrud.pro/api/v1/06277888ac88ba16076affee049969e3/todo';

const getTodos = async () => {
  try {
    const { data } = await axios.get(API_URL);
    return data;
  } catch (error) {
    console.error('Error fetching todos:', error);
  }
};

const updateTodo = async (id: number, updatedData: Partial<ITodo>) => {
  try {
    const { data } = await axios.patch(`${API_URL}/${id}`, updatedData);
    return data;
  } catch (error) {
    console.error('Error updating todo:', error);
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
    console.error('Error adding todo:', error);
  }
};

const deleteTodo = async (_id: number) => {
  await axios.delete(`${API_URL}/${_id}`);
};

const Todo = () => {
  const queryClient = useQueryClient();
  const [value, setValue] = useState('');
  const [editTitle, setEditTitle] = useState<string>('');
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);

  const { data: todos, isLoading } = useQuery<ITodo[]>(['todos'], getTodos);

  const mutationUpdate = useMutation(
    (updatedTodo: { id: number; title: string }) =>
      updateTodo(updatedTodo.id, { title: updatedTodo.title }),
    {
      onSuccess: () => queryClient.invalidateQueries('todos'),
    }
  );

  const mutation = useMutation(addTodo, {
    onMutate: async (value) => {
      const previousTodos = queryClient.getQueryData<ITodo[]>('todos');
      queryClient.setQueryData<ITodo[]>('todos', (oldTodos) => [
        ...(oldTodos || []),
        { title: value },
      ]);
      return { previousTodos };
    },
    onSettled: () => {
      queryClient.invalidateQueries('todos');
    },
  });

  const handleAddTodo = () => {
    if (value.trim()) {
      mutation.mutate(value);
      setValue('');
    }
  };

  const mutationDelete = useMutation(deleteTodo, {
    onMutate: async (id) => {
      await queryClient.cancelQueries('todos');
      const previousTodos = queryClient.getQueryData<ITodo[]>('todos');
      queryClient.setQueryData<ITodo[]>('todos', (oldTodos) =>
        oldTodos?.filter((todo) => todo._id !== id)
      );
      return { previousTodos };
    },
  });

  const handleDeleteTodo = (id: number) => {
    mutationDelete.mutate(id);
  };

  const handleEditTodo = (todo: ITodo) => {
    setEditingTodoId(todo._id);
    setEditTitle(todo.title);
  };

  const handleSaveEdit = () => {
    if (editingTodoId && editTitle.trim()) {
      mutationUpdate.mutate({ id: editingTodoId, title: editTitle });
      setEditingTodoId(null);
      setEditTitle('');
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
          .map((todo) => (
            <div key={todo._id}>
              <li>{todo.title}</li>
              <button onClick={() => handleDeleteTodo(todo._id)}>Delete</button>

              {/* Если редактируется задача, показываем поле ввода с текущим значением */}
              {editingTodoId === todo._id ? (
                <>
                  <input
                    type="text"
                    value={editTitle} // значение поля будет равно состоянию редактируемого текста
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <button onClick={handleSaveEdit}>Save</button>
                </>
              ) : (
                <button onClick={() => handleEditTodo(todo)}>Edit</button>
              )}
            </div>
          ))}
      </ul>
    </div>
  );
};

export default Todo;
