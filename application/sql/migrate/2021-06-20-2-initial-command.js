module.exports.up = async(client) => {
  await client.query(`
      create table event_journal
      (
          global_index    bigserial    not null unique primary key,
          aggregate_id    varchar(255) not null,
          sequence_number bigint       not null,
          event_id        uuid         not null unique,
          event_payload   jsonb        not null,
          event_type      varchar(255) not null,
          created_at      timestamptz  not null
      );

      create unique index on event_journal using btree(aggregate_id, sequence_number);
  `)
}