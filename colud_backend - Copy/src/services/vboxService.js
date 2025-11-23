// This service builds the VM-creation script/commands to run on the agent.
// It DOES NOT execute commands locally. It returns a safe, validated command bundle
// the agent will run. This avoids shell-injection by constructing arrays of args.


const Ajv = require('ajv');
const ajv = new Ajv({ useDefaults: true });


const createSchema = {
type: 'object',
properties: {
name: { type: 'string', pattern: '^[a-zA-Z0-9\-_.]{3,64}$' },
ram: { type: 'integer', minimum: 256, maximum: 65536, default: 1024 },
cpus: { type: 'integer', minimum: 1, maximum: 32, default: 1 },
diskMB: { type: 'integer', minimum: 1024, maximum: 1024 * 1024, default: 10000 },
ostype: { type: 'string', minLength: 1, default: 'Ubuntu_64' }
},
required: ['name']
};


const validateCreate = ajv.compile(createSchema);


function buildCreatePayload(fields) {
const ok = validateCreate(fields);
if (!ok) throw new Error('validation_failed: ' + JSON.stringify(validateCreate.errors));


// payload to send to agent -- agent has script to execute this safely
return {
action: 'create_vm',
params: {
name: fields.name,
ram: fields.ram,
cpus: fields.cpus,
diskMB: fields.diskMB,
ostype: fields.ostype
}
};
}


module.exports = {
buildCreatePayload
};