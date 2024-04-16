import pkg from 'pg'
import 'dotenv/config'

import { logger } from './logger.mjs';
const { Client } = pkg;
const client = new Client()
await client.connect()

const createSponsorInSCB = async (data) => {
  const queryText = 'INSERT INTO public.sponsors SELECT * FROM json_populate_record(NULL::public.sponsors, $1) RETURNING scbc_guid'
  const res = await client.query(queryText, [data])
  logger.info('sponsor inserted into table, id: %s', res.rows[0].scbc_guid)
}

const updateSponsorInSCB = async (data) => {
  const queryText = 'UPDATE public.sponsors SET (scbc_guid, salesforce_account_id, name, admin_name, renewal_date, address_1, city, country, state, postal_code, phone_number) = (j.scbc_guid, j.salesforce_account_id, j.name, j.admin_name, j.renewal_date, j.address_1, j.city, j.country, j.state, j.postal_code, j.phone_number) FROM json_populate_record(NULL::public.sponsors, $1) j WHERE public.sponsors.scbc_guid = j.scbc_guid RETURNING public.sponsors.scbc_guid'
  const res = await client.query(queryText, [data])
  logger.info('sponsor updated on table, id: %s', res.rows[0].scbc_guid)
}

const querySponsorInSCB = async (accountId) => {
  const queryText = 'SELECT scbc_guid FROM public.sponsors WHERE salesforce_account_id = $1'
  const res = await client.query(queryText, [accountId]);
  if (res.rows.length === 1) {
    return res.rows[0].scbc_guid;
  }
  return null;
}

export {
  createSponsorInSCB,
  updateSponsorInSCB,
  querySponsorInSCB
}
