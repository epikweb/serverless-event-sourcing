module.exports.up = async(client) => {
  await client.query(`
      create table wallets
      (
          event_journal_checkpoint bigserial not null,
          beneficiary_id uuid not null,
          balance decimal(10 ,2) not null,
          created_at timestamptz not null,
          updated_at timestamptz not null
      );

      create unique index on wallets using btree(beneficiary_id);
  `)
}