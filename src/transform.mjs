import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { default: json2json } = require('awesome-json2json');

const ACCOUNT_TEMPLATE = {
  salesforce_account_id: 'Id',
  scbc_guid: 'accountUUID',
  name: "Name",
  admin_name: "Account_Owner_Name__c",
  renewal_date: "Client_Renewal_Date__c",
  address_1: "BillingStreet",
  city: "BillingCity",
  country: "BillingCountry",
  state: "BillingState",
  postal_code: "BillingPostalCode",
  phone_number: "BillingPhone__c",
}

const transformAccount = (data) => {
  try {
    return json2json(data, ACCOUNT_TEMPLATE);
  } catch (e) {
    throw Error(e.message, e.stack);
  }
};

export { transformAccount }
