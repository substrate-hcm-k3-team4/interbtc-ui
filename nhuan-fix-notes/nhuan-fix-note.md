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
