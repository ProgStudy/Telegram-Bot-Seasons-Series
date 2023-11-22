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
        await knex.schema.createTableIfNotExists('types', (table) => {
            table.increments('id');
            table.string('name');
            table.boolean('has_active').defaultTo(1);
        })
    
        .createTableIfNotExists('season', (table) => {
            table.increments('id');
            table.string('name');
            table.boolean('has_active').defaultTo(1);
        })
        // ...and another
        .createTableIfNotExists('series', (table) => {
            table.increments('id');
            table.string('name');
            table.boolean('has_active').defaultTo(1);
        });
    
    // Finally, add a catch statement
    } catch (e) {
        console.error(e);
    }

    return knex;
};