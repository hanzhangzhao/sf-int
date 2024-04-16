import PubSubApiClient from 'salesforce-pubsub-api-client';
import { v4 as uuidv4 } from 'uuid';

import { getAccountId, getAccount, writeUUID } from './http.mjs';
import { transformAccount } from './transform.mjs';
import { createSponsorInSCB, querySponsorInSCB, updateSponsorInSCB } from './pg.mjs';
import { logger } from './logger.mjs';

const main = async () => {
  const client = new PubSubApiClient();
  await client.connect();

  const opportunityEventEmitter = await client.subscribe('/data/OpportunityChangeEvent');
  const accountEventEmitter = await client.subscribe('/data/AccountChangeEvent');

  opportunityEventEmitter.on('data', async (event) => {
    logger.info('receiving opportunity data');
    logger.info(
      'Handling %s change event %s',
      event.payload.ChangeEventHeader.entityName,
      event.replayId
    );

    if (event.payload?.StageName === 'Closed Won') {
      const opportunityId = event.payload.ChangeEventHeader.recordIds[0];
      logger.info('Closed Won status received for Opportunity %s', opportunityId)
      logger.info('fetching Account for opportunity %s', opportunityId);
      const accountId = await getAccountId(opportunityId);
      const account = await getAccount(accountId);
      const accountUUID = uuidv4();
      logger.info('generated UUID: %s', accountUUID);
      account.accountUUID = accountUUID;
      const accountData = transformAccount(account);
      await createSponsorInSCB(accountData);
      logger.info('inserted account in SCB');
      await writeUUID(accountId, accountUUID);
      logger.info('wrote UUID back to SFDC');
    }
  });

  accountEventEmitter.on('data', async (event) => {
    logger.info('receiving account data');
    logger.info(
      `Handling ${event.payload.ChangeEventHeader.entityName} change event ${event.replayId}`
    );
    const accountId = event.payload.ChangeEventHeader.recordIds[0]
    logger.info('Account update received for %s', accountId);
    const scbAccountId = await querySponsorInSCB(accountId);
    logger.info()
    if (scbAccountId) {
      logger.info('updating account in SCB');
      const account = await getAccount(accountId);
      account.accountUUID = scbAccountId;
      const accountData = transformAccount(account);
      await updateSponsorInSCB(accountData);
      logger.info('updated account in SCB');
    } else {
      logger.info('account not on SCB Database');
    }
  });

  opportunityEventEmitter.on('error', (message) => {
    logger.error('receiving opportunity error');
    logger.error(JSON.stringify(message));
  });

  accountEventEmitter.on('error', (message) => {
    logger.error('receiving account error');
    logger.error(JSON.stringify(message));
  });
};

main();
