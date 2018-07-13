"use strict"

const max_beings = 500;

const position_states = create_dynamic_table({
    x: new Float32Array(max_beings),
    y: new Float32Array(max_beings),
    x_speed: new Float32Array(max_beings),
    y_speed: new Float32Array(max_beings),
});

const copulating_states = create_dynamic_table({
    id: new Uint32Array(max_beings),
    with_id: new Uint32Array(max_beings),
    time_started: new Uint32Array(max_beings),
});

const hungry_states = create_dynamic_table({
    food: new Uint8Array(max_beings),
});

const horny_states = create_dynamic_table({
    preferred_team: new Uint8Array(max_beings),
});

const health_states = create_dynamic_table({
    points: new Uint8Array(max_beings),
    time_last_damaged: new Uint32Array(max_beings),
});

const fleeing_states = create_dynamic_table({
    time_started: new Uint32Array(max_beings),
    fleeing_from_id: new Uint32Array(max_beings),
});

const attacking_states = create_dynamic_table({
    time_started: new Uint32Array(max_beings),
    victim_id: new Uint32Array(max_beings),
});

const team_states = create_dynamic_table({
    team: new Uint8Array(max_beings),
});

const attacking_signals = {
    id: new Uint32Array(max_beings),
    length: 0,
};

const copulating_signals = {
    id: new Uint32Array(max_beings),
    length: 0,
};

// always sorted by id
const nearest_being = {
    id: new Uint32Array(max_beings),
    distance: new Float32Array(max_beings),
    direction_x: new Float32Array(max_beings),
    direction_y: new Float32Array(max_beings),
    length: 0,
};

const FREE_IDS_UNUSED_INDEX = 999999;
function create_dynamic_table(columns) {
    const table = {
        ...columns,
        free_ids: {
            arr: new Uint32Array(max_beings),
            length: max_beings,
        }
    };
    for (let i = 0; i < table.free_ids.length; i += 1) {
        table.free_ids.arr[i] = i;
    }
    return table;
}
function add_row_to_dynamic_table(table, columns) {
    const index = table.free_ids.arr[0];
    table.free_ids.arr[0] = FREE_IDS_UNUSED_INDEX;
    table.free_ids.arr.sort();
    for (let prop of Object.getOwnPropertyNames(columns)) {
        table[prop][index] = columns[prop];
    }
}
function remove_row_from_dynamic_table(table, index) {
    table.free_ids.arr[table.free_ids.length] = index;
    table.free_ids.length += 1;
    table.free_ids.arr.sort();
}
function get_dynamic_table_length(table) {
    return table.free_ids.length;
}

function add_row_to_static_table(table, columns) {
    for (let prop of Object.getOwnPropertyNames(columns)) {
        if (prop !== 'length') {
            table[prop][table.length] = columns[prop];
        }
    }
    // we need to keep track of the id
    // when we move the last element
    // to replace a removed element
    table.id[table.length] = table.length;
    table.length += 1;
}
// you probably don't need to do this, just set table.length to 0
function clear_static_table(table) {
    for (let prop of Object.getOwnPropertyNames(columns)) {
        if (prop !== 'length') {
            table[prop].fill(0);
        }
    }
}

function create_being(location, team) {
    /* only when hurt
    add_row_to_dynamic_table(health_states, {
        points: 100,
        time_last_damaged: 0,
    });
    */
    add_row_to_dynamic_table(position_states, location);
    add_row_to_dynamic_table(team_states, team);
}

function calculate_hunger() {}
function move_beings(delta) {
    for (let i = 0; i < get_dynamic_table_length(position_states); i += 1) {
        position_states.x[i] += position_states.x_speed[i] * delta / 1000;
        position_states.y[i] += position_states.y_speed[i] * delta / 1000;
    }
}
function calculate_nearest_being() {
    // new frame, so write over
    nearest_being.length = 0;
    for (let i = 0; i < get_dynamic_table_length(position_states); i += 1) {
        const x = position_states.x[i];
        const y = position_states.y[i];
        let id = 9997;
        let nearest_distance = 99999;
        let direction_x = 99999;
        let direction_y = 99999;
        for (let j = 0; j < get_dynamic_table_length(position_states); j += 1) {
            if (j !== i) {
                const jx = position_states.x[j];
                const jy = position_states.y[j];
                const dx = x - jx;
                const dy = y - jy;
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance < nearest_distance) {
                    nearest_distance = distance;
                    direction_x = dx / distance;
                    direction_y = dy / distance;
                    id = j;
                }
            }
        }
        add_row_to_static_table(nearest_being, {
            id,
            distance: nearest_distance,
            direction_x,
            direction_y,
        });
    }
}

function calculate_attacking_result() {
    for (let i = 0; i < nearest_being.length; i += 1) {
        position_states.x_speed[i] = nearest_being.direction_y[i] * 40;
        position_states.y_speed[i] = nearest_being.direction_x[i] * 40;
    }
}
function combine_goals() {
}

function main() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let curr_time = Date.now();
    let last_time = curr_time;
    function render() {
        curr_time = Date.now();
        let delta = curr_time - last_time;
        last_time = curr_time;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        calculate_nearest_being();

        calculate_attacking_result();

        combine_goals();

        move_beings(delta);

        // draw beings
        for (let i = 0; i < get_dynamic_table_length(position_states); i += 1) {
            const team = team_states.team[i];
            if (team === 0) {
                ctx.fillStyle = 'red';
            }
            else if (team === 1) {
                ctx.fillStyle = 'blue';
            }
            else if (team === 2) {
                ctx.fillStyle = 'green';
            }
            else {
                ctx.fillStyle = 'yellow';
            }
            const x = position_states.x[i];
            const y = position_states.y[i];
            ctx.fillRect(x, y, 2, 2);
        }
        
        requestAnimationFrame(render);
    }
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    for (let i = 0; i < max_beings; i += 1) {
        create_being({
            x: Math.floor(Math.random() * canvas.width),
            y: Math.floor(Math.random() * canvas.height),
        },
        {
            team: Math.floor(Math.random() * 4),
        });
    }
    render();
}
main();


// to make states exclude other states, we need to filter based on existence in other table

// when we remove an entry from a table, we need to put the last element into the hole that was created