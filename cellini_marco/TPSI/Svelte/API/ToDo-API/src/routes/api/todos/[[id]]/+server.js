import { json } from "@sveltejs/kit";
import Database from 'better-sqlite3';
import { error } from '@sveltejs/kit';

const db = new Database("./todo.db", { verbose: console.log });

export async function GET({ params, request, url }) {       // get by ID or passing a parameter using query language
    console.log("Ricevuto HTTP GET parametri:\t", params);

    const select_all = db.prepare("SELECT * FROM todo");
    const select_id = db.prepare("SELECT * FROM todo WHERE id = ?");
    const select_done = db.prepare("SELECT * FROM todo WHERE done = ?");
    const select_priority = db.prepare("SELECT * FROM todo WHERE priority = ?");

    const exec_query = (azione, param) => {
        const todo = param || param == 0 ? azione.all(param) : azione.all();
        if (todo.length > 0)
            return json(todo, { status: 200 });
        else
            return json({}, { status: 404 });
    };

    try {
        if (params.id)
            return exec_query(select_id, params.id);
        else if (url.searchParams.has('priority'))
            return exec_query(select_priority, +url.searchParams.get('priority'));
        else if (url.searchParams.has('done'))
            return exec_query(select_done, +url.searchParams.get('done'));
        return exec_query(select_all);
    } catch (e) {
        return json({}, { status: 500 });
    }
}

export async function POST({ request }) {
    try {
        console.log("Ricevuto HTTP POST");
        const body = await request.json();

        const insert_data = db.prepare('INSERT INTO todo (task, done, priority) VALUES(@task, @done, @priority)');

        const ans = insert_data.run({
            task: body.task,
            done: +body.done,
            priority: +body.priority
        });

        if (ans.changes == 1) {
            body['id'] = ans.lastInsertRowid;
            return json(body, {
                status: 201,
                headers: new Headers({ 'Location': `https://localhost:5173/api/todos/${body['id']}` })
            });
        }
    } catch (e) {
        console.log(e);
        return json({}, { status: 500 });
    }
}

export async function PUT({ params, request }) {
    try {
        console.log("Ricevuto HTTP PUT params: ", params);
        const body = await request.json();
        console.log("PUT Body: ", body);

        const update_database = db.prepare('UPDATE todo SET task = @task, done = @done, priority = @priority WHERE id = @id');

        const ans = update_database.run({
            id: +params.id,
            task: body.task,
            done: +body.done,
            priority: +body.priority
        });

        console.log(ans);
        if (ans.changes == 0)
            return json({}, { status: 200 });
        else if (ans.changes == 1)
            return json({}, { status: 404 });
    } catch (e) {
        console.log(e);
        return json({}, { status: 500 });
    }
}

export async function PATCH({ params, request }) {
    try {
        console.log("HTTP PATCH con parametro: ", params);
        let body = await request.json();
        console.log("PUT body: ", body);

        const upt_task = db.prepare('UPDATE todo SET task = @task WHERE id = @id');
        const upt_priority = db.prepare('UPDATE todo SET priority = @priority WHERE id = @id');
        const upt_done = db.prepare('UPDATE todo SET done = @done WHERE id = @id');
        const get_by_id = db.prepare('SELECT * FROM todo WHERE id = ?');

        let ans, key = Object.keys(body)[0];

        switch (key) {
            case 'task':
                ans = upt_task.run({ id: +params.id, task: body.task });
                break;

            case 'priority':
                ans = upt_priority.run({ id: +params.id, priority: body.priority });
                break;

            case 'done':
                ans = upt_done.run({ id: +params.id, done: +body.done });
                break;

            default:
                return json({}, { status: 500 });
                break;
        }

        if (ans.changes == 0)
            return json({}, { status: 404 });
        else if (ans.changes == 1) {
            const todo = get_by_id.all(+params.id);
            return json(todo, { status: 200 });
        }

    } catch (e) {
        console.log(e);
        return json({}, { status: 500 });
    }
}

export async function DELETE({ params, request }) {
    try {
        console.log("ricevuto HTTP DELETE parametro: ", params);

        const delete_todo = db.prepare('DELETE FROM todo WHERE id = @id');
        const ans = delete_todo.run({ id: +params.id });

        if (ans.changes == 0)
            return json({}, { status: 404 });
        else if (ans.changes == 1)
            return new Response(null, { status: 204 });
    } catch (e) {
        return json({}, { status: 500 });
    }
}