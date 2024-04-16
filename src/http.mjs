import config from 'config';
import { path } from 'ramda';
import superagent from 'superagent';

const accessToken = config.get('salesforce.httpToken');

const getAccountId = async (opportunityId) => {
  return await superagent
    .get(`https://sterlingcapital--test1.sandbox.my.salesforce.com/services/data/v60.0/sobjects/Opportunity/${opportunityId}`)
    .auth(accessToken, { type: 'bearer' })
    .then((res) => path(['body', 'AccountId'], res));
}

const getAccount = async (accountId) => {
  return await superagent
    .get(`https://sterlingcapital--test1.sandbox.my.salesforce.com/services/data/v60.0/sobjects/Account/${accountId}`)
    .auth(accessToken, { type: 'bearer' })
    .then((res) => path(['body'], res));
}

const writeUUID = async (accountId, uuid) => {
  await superagent
    .patch(`https://sterlingcapital--test1.sandbox.my.salesforce.com/services/data/v60.0/sobjects/Account/${accountId}`)
    .send(
      {
        "UUID__c" : uuid
      }
    )
    .auth(accessToken, { type: 'bearer' })
}

export { getAccountId, getAccount, writeUUID };
