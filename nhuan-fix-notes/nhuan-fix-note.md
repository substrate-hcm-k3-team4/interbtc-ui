# A fix in the container 'interbtc-ui_index_1'  
## Error
Log error from the running docker-compose like this:  
```
index_1        | Error: createType(InterbtcPrimitivesCurrencyId):: Enum(token):: Cannot map Enum JSON, unable to find 'INTERBTC' in dot, ibtc, intr, __unused3, __unused4, __unused5, __unused6, __unused7, __unused8, __unused9, ksm, kbtc, kint
index_1        |     at createTypeUnsafe (/usr/src/node_modules/@polkadot/types/create/createType.cjs:75:18)
index_1        |     at TypeRegistry.createTypeUnsafe (/usr/src/node_modules/@polkadot/types/create/registry.cjs:419:45)
index_1        |     at TypeRegistry.createType (/usr/src/node_modules/@polkadot/types/create/registry.cjs:411:17)
index_1        |     at ApiPromise.createType (/usr/src/node_modules/@polkadot/api/base/Decorate.cjs:174:82)
index_1        |     at newCurrencyId (/usr/src/node_modules/@interlay/interbtc-api/build/src/utils/encoding.js:156:16)
index_1        |     at newVaultCurrencyPair (/usr/src/node_modules/@interlay/interbtc-api/build/src/utils/encoding.js:148:31)
index_1        |     at newVaultId (/usr/src/node_modules/@interlay/interbtc-api/build/src/utils/encoding.js:140:31)
index_1        |     at DefaultRewardsAPI.<anonymous> (/usr/src/node_modules/@interlay/interbtc-api/build/src/parachain/rewards.js:38:48)
index_1        |     at Generator.next (<anonymous>)
index_1        |     at /usr/src/node_modules/@interlay/interbtc-api/build/src/parachain/rewards.js:8:71
```
## Fixing
At the file '/usr/src/node_modules/@interlay/interbtc-api/build/src/utils/encoding.js':  
Update the function like this:  
```
function newCurrencyId(api, currency) {
    currency = currency === 'INTERBTC' ? 'IBTC' : currency;
    return api.createType("InterbtcPrimitivesCurrencyId", { token: currency });
}
```
Because of restarting continuously, should use docker cp like this:   
```
docker cp ./encoding.js "interbtc-ui_index_1":"/usr/src/node_modules/@interlay/interbtc-api/build/src/utils/encoding.js"
```

# A fix in the image 'vault'
## Error
(about the change of INTERBTC to IBTC)
## Fixing
- Replace all INTERBTC to IBTC
- Build 'vault' client
- Update to running container 'interbtc-ui_vault_1' and commit it with the image tag 'noux/interbtc-clients:vault-standalone-metadata-1-5-6-fixing"'.
- Update docker-compose file use that image and the argument like this ```--wrapped-currency-id 'IBTC'```
- Rerun docker-compose

# A note
## Error
Log error from the running docker-compose like this:  
```
index_1        | [1661438902172] ERROR (error/31 on b320059c8c34): relation "parachain_events" does not exist
index_1        |     error: relation "parachain_events" does not exist
index_1        |         at Parser.parseErrorMessage (/usr/src/node_modules/pg-protocol/dist/parser.js:287:98)
index_1        |         at Parser.handlePacket (/usr/src/node_modules/pg-protocol/dist/parser.js:126:29)
index_1        |         at Parser.parse (/usr/src/node_modules/pg-protocol/dist/parser.js:39:38)
index_1        |         at Socket.<anonymous> (/usr/src/node_modules/pg-protocol/dist/index.js:11:42)
index_1        |         at Socket.emit (node:events:390:28)
index_1        |         at addChunk (node:internal/streams/readable:315:12)
index_1        |         at readableAddChunk (node:internal/streams/readable:289:9)
index_1        |         at Socket.Readable.push (node:internal/streams/readable:228:10)
index_1        |         at TCP.onStreamRead (node:internal/stream_base_commons:199:23)
index_1        | error Command failed with exit code 255.
index_1        | info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
```
## Fixing
That caused by node_modules which doesn't exist at the time of initializing docker containers. Thus, it should install node_modules first. Like this!
```
# first
yarn install
# second
docker-compose --env-file .env.development.local up
```

# A Note
## Error
UI feedback like this ```You can't issue IBTC at the moment because BTC parachain is more than 6 blocks behind.```
## Fixing
Must use ```yarn start-regtest``` in case of using with bitcoind in regtest mode. This leads the front-end connect to 'electrs' container instance as expected.

