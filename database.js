const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './db.sqlite',
        flags: ['OPEN_URI', 'OPEN_SHAREDCACHE']
    },
    useNullAsDefault: true,
});

module.exports = async () => {
    try {
        // Create a table
        // await knex.schema.createTableIfNotExists('menu', (t) => {
        //     t.increments('id').primary();
        //     t.text('data').nullable();
        //     t.integer('parent_id').unsigned().nullable();
        //     t.boolean('is_active').defaultTo(1);

        //     t.foreign('parent_id').references('id').inTable('menu');
        // })
        await knex.schema.createTableIfNotExists('movies', (table) => {
            table.increments('id').primary();
            table.string('name');
            table.boolean('has_active').defaultTo(1);
        })
        .createTableIfNotExists('seasons', (table) => {
            table.increments('id').primary();
            table.string('name');
            table.boolean('has_active').defaultTo(1);
            table.integer('movie_id').unsigned();
            
            table.foreign('movie_id').references('id').inTable('movies');
        })
        .createTableIfNotExists('series', (table) => {
            table.increments('id').primary();
            table.string('name');
            table.text('telegram_file_id').nullable();
            table.boolean('has_active').defaultTo(1);
            table.integer('season_id').unsigned();
            
            table.foreign('season_id').references('id').inTable('seasons');
        })
        .createTableIfNotExists('users', (t) => {
            t.increments('id').primary();
            t.bigInteger('telegram_id').nullable();
            t.integer('select_movie_id').unsigned().nullable();
            t.integer('select_seasons_id').unsigned().nullable();
            t.integer('select_series_id').unsigned().nullable();

           t.foreign('select_movie_id').references('id').inTable('movies');
           t.foreign('select_seasons_id').references('id').inTable('seasons');
           t.foreign('select_series_id').references('id').inTable('series');
        });
    
    // Finally, add a catch statement
    } catch (e) {
        console.error(e);
    }

    return knex;
};