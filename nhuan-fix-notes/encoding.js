"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryNominationsMap = exports.decodeVaultId = exports.encodeVaultId = exports.unwrapRawExchangeRate = exports.convertMoment = exports.parseRedeemRequest = exports.parseIssueRequest = exports.parseReplaceRequest = exports.parseRefundRequest = exports.newCurrencyId = exports.newVaultCurrencyPair = exports.newVaultId = exports.newAccountId = exports.parseSystemVault = exports.parseWallet = exports.storageKeyToNthInner = exports.encodeUnsignedFixedPoint = exports.decodeFixedPointType = exports.uint8ArrayToString = exports.reverseEndiannessHex = exports.ensureHashEncoded = exports.addHexPrefix = exports.stripHexPrefix = exports.reverseEndianness = void 0;
const big_js_1 = __importDefault(require("big.js"));
const _1 = require(".");
const requestTypes_1 = require("../types/requestTypes");
const __1 = require("..");
/**
 * Converts endianness of a Uint8Array
 * @param bytes Uint8Array, to be converted LE<>BE
 */
function reverseEndianness(bytes) {
    let offset = bytes.length;
    for (let index = 0; index < bytes.length; index += bytes.length) {
        offset--;
        for (let x = 0; x < offset; x++) {
            const b = bytes[index + x];
            bytes[index + x] = bytes[index + offset];
            bytes[index + offset] = b;
            offset--;
        }
    }
    return bytes;
}
exports.reverseEndianness = reverseEndianness;
function isHexPrefixed(str) {
    return str.slice(0, 2) === "0x";
}
/**
 * Remove the `0x` hex prefix if present
 * @param str
 */
function stripHexPrefix(str) {
    return isHexPrefixed(str) ? str.slice(2) : str;
}
exports.stripHexPrefix = stripHexPrefix;
/**
 * Ensure the `0x` hex prefix is present
 * @param str
 **/
function addHexPrefix(str) {
    return isHexPrefixed(str) ? str : "0x" + str;
}
exports.addHexPrefix = addHexPrefix;
/**
 * Ensure a hash value is an encoded H256
 * @param api The polkadot API promise used to encode if necessary
 * @param hash The either H256 or string encoded hash
 **/
function ensureHashEncoded(api, hash) {
    if (typeof hash === "string") {
        return api.createType("H256", addHexPrefix(hash));
    }
    else {
        return hash;
    }
}
exports.ensureHashEncoded = ensureHashEncoded;
/**
 * Reverse the endianness of the given hex string
 * @dev Will remove `0x` prefix if present
 * @param hex
 */
function reverseEndiannessHex(hex) {
    const arr = stripHexPrefix(hex).match(/.{1,2}/g) || [];
    const bytes = new Uint8Array(arr.map((byte) => parseInt(byte, 16)));
    return reverseEndianness(bytes).reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}
exports.reverseEndiannessHex = reverseEndiannessHex;
/**
 * Converts a Uint8Array to string
 * @dev Will remove `0x` prefix if present
 * @param bytes
 */
function uint8ArrayToString(bytes) {
    return stripHexPrefix(bytes.toString()).split("").join("");
}
exports.uint8ArrayToString = uint8ArrayToString;
function decodeFixedPointType(x) {
    const xBig = new big_js_1.default(x.toString());
    const scalingFactor = new big_js_1.default(Math.pow(10, _1.FIXEDI128_SCALING_FACTOR));
    return xBig.div(scalingFactor);
}
exports.decodeFixedPointType = decodeFixedPointType;
function encodeUnsignedFixedPoint(api, x) {
    const scalingFactor = new big_js_1.default(Math.pow(10, _1.FIXEDI128_SCALING_FACTOR));
    // If there are any decimals left after scaling up by the scaling factor,
    // the resulting FixedU128 will be wrong. As such, trim any decimals.
    const xScaled = x.mul(scalingFactor).round(0, 0);
    return api.createType("FixedU128", xScaled.toFixed());
}
exports.encodeUnsignedFixedPoint = encodeUnsignedFixedPoint;
function storageKeyToNthInner(s, n = 0) {
    return s.args[n];
}
exports.storageKeyToNthInner = storageKeyToNthInner;
function parseWallet(wallet, network) {
    const { addresses, publicKey } = wallet;
    const btcAddresses = [];
    for (const value of addresses.values()) {
        btcAddresses.push((0, _1.encodeBtcAddress)(value, network));
    }
    return {
        publicKey: publicKey.toString(),
        addresses: btcAddresses,
    };
}
exports.parseWallet = parseWallet;
function parseSystemVault(vault, wrappedCurrency, collateralCurrency) {
    return {
        toBeIssuedTokens: (0, __1.newMonetaryAmount)(vault.toBeIssuedTokens.toString(), wrappedCurrency),
        issuedTokens: (0, __1.newMonetaryAmount)(vault.issuedTokens.toString(), wrappedCurrency),
        toBeRedeemedTokens: (0, __1.newMonetaryAmount)(vault.toBeRedeemedTokens.toString(), wrappedCurrency),
        collateral: (0, __1.newMonetaryAmount)(vault.collateral.toString(), collateralCurrency),
        currencyPair: {
            collateralCurrency: (0, __1.currencyIdToMonetaryCurrency)(vault.currencyPair.collateral),
            wrappedCurrency: (0, __1.currencyIdToMonetaryCurrency)(vault.currencyPair.wrapped),
        }
    };
}
exports.parseSystemVault = parseSystemVault;
function newAccountId(api, accountId) {
    return api.createType("AccountId", accountId);
}
exports.newAccountId = newAccountId;
function newVaultId(api, accountId, collateralCurrency, wrappedCurrency) {
    const parsedAccountId = newAccountId(api, accountId);
    const vaultCurrencyPair = newVaultCurrencyPair(api, collateralCurrency, wrappedCurrency);
    return api.createType("InterbtcPrimitivesVaultId", { account_id: parsedAccountId, currencies: vaultCurrencyPair });
}
exports.newVaultId = newVaultId;
function newVaultCurrencyPair(api, collateralCurrency, wrappedCurrency) {
    const collateralCurrencyIdLiteral = (0, __1.tickerToCurrencyIdLiteral)(collateralCurrency.ticker);
    const wrappedCurrencyIdLiteral = (0, __1.tickerToCurrencyIdLiteral)(wrappedCurrency.ticker);
    const collateralCurrencyId = newCurrencyId(api, collateralCurrencyIdLiteral);
    const wrappedCurrencyId = newCurrencyId(api, wrappedCurrencyIdLiteral);
    return api.createType("InterbtcPrimitivesVaultCurrencyPair", {
        collateral: collateralCurrencyId,
        wrapped: wrappedCurrencyId,
    });
}
exports.newVaultCurrencyPair = newVaultCurrencyPair;
function newCurrencyId(api, currency) {
    currency = currency === 'INTERBTC' ? 'IBTC' : currency;
    return api.createType("InterbtcPrimitivesCurrencyId", { token: currency });
}
exports.newCurrencyId = newCurrencyId;
function parseRefundRequest(req, network, wrappedCurrency) {
    return {
        vaultId: req.vault,
        amountIssuing: (0, __1.newMonetaryAmount)(req.amountBtc.toString(), wrappedCurrency),
        fee: (0, __1.newMonetaryAmount)(req.fee.toString(), wrappedCurrency),
        amountBtc: (0, __1.newMonetaryAmount)(req.amountBtc.toString(), wrappedCurrency),
        issuer: req.issuer,
        btcAddress: (0, _1.encodeBtcAddress)(req.btcAddress, network),
        issueId: stripHexPrefix(req.issueId.toString()),
        completed: req.completed.isTrue,
    };
}
exports.parseRefundRequest = parseRefundRequest;
function parseReplaceRequest(vaultsAPI, req, network, wrappedCurrency) {
    return __awaiter(this, void 0, void 0, function* () {
        const currencyIdLiteral = (0, __1.currencyIdToLiteral)(req.oldVault.currencies.collateral);
        const oldVault = yield vaultsAPI.get(req.oldVault.accountId, currencyIdLiteral);
        const collateralCurrency = (0, __1.currencyIdToMonetaryCurrency)(oldVault.id.currencies.collateral);
        return {
            btcAddress: (0, _1.encodeBtcAddress)(req.btcAddress, network),
            newVault: req.newVault,
            oldVault: req.oldVault,
            amount: (0, __1.newMonetaryAmount)(req.amount.toString(), wrappedCurrency),
            griefingCollateral: (0, __1.newMonetaryAmount)(req.griefingCollateral.toString(), collateralCurrency),
            collateral: (0, __1.newMonetaryAmount)(req.collateral.toString(), collateralCurrency),
            acceptTime: req.acceptTime.toNumber(),
            period: req.period.toNumber(),
            btcHeight: req.btcHeight.toNumber(),
            status: req.status,
        };
    });
}
exports.parseReplaceRequest = parseReplaceRequest;
function parseIssueRequest(vaultsAPI, req, network, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const status = req.status.isCompleted
            ? requestTypes_1.IssueStatus.Completed
            : req.status.isCancelled
                ? requestTypes_1.IssueStatus.Cancelled
                : requestTypes_1.IssueStatus.PendingWithBtcTxNotFound;
        const collateralCurrency = (0, __1.currencyIdToMonetaryCurrency)(req.vault.currencies.collateral);
        return {
            id: stripHexPrefix(id.toString()),
            creationBlock: req.opentime.toNumber(),
            vaultWrappedAddress: (0, _1.encodeBtcAddress)(req.btcAddress, network),
            vaultId: req.vault,
            userParachainAddress: req.requester.toString(),
            vaultWalletPubkey: req.btcPublicKey.toString(),
            bridgeFee: (0, __1.newMonetaryAmount)(req.fee.toString(), vaultsAPI.getWrappedCurrency()),
            wrappedAmount: (0, __1.newMonetaryAmount)(req.amount.toString(), vaultsAPI.getWrappedCurrency()),
            griefingCollateral: (0, __1.newMonetaryAmount)(req.griefingCollateral.toString(), collateralCurrency),
            status,
        };
    });
}
exports.parseIssueRequest = parseIssueRequest;
function parseRedeemRequest(vaultsAPI, req, network, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const status = req.status.isCompleted
            ? requestTypes_1.RedeemStatus.Completed
            : req.status.isRetried
                ? requestTypes_1.RedeemStatus.Retried
                : req.status.isReimbursed
                    ? requestTypes_1.RedeemStatus.Reimbursed
                    : requestTypes_1.RedeemStatus.PendingWithBtcTxNotFound;
        const currencyIdLiteral = (0, __1.currencyIdToLiteral)(req.vault.currencies.collateral);
        const vault = yield vaultsAPI.get(req.vault.accountId, currencyIdLiteral);
        const collateralCurrency = (0, __1.currencyIdToMonetaryCurrency)(vault.id.currencies.collateral);
        return {
            id: stripHexPrefix(id.toString()),
            userParachainAddress: req.redeemer.toString(),
            amountBTC: (0, __1.newMonetaryAmount)(req.amountBtc.toString(), vaultsAPI.getWrappedCurrency()),
            collateralPremium: (0, __1.newMonetaryAmount)(req.premium.toString(), collateralCurrency),
            bridgeFee: (0, __1.newMonetaryAmount)(req.fee.toString(), vaultsAPI.getWrappedCurrency()),
            btcTransferFee: (0, __1.newMonetaryAmount)(req.transferFeeBtc.toString(), vaultsAPI.getWrappedCurrency()),
            creationBlock: req.opentime.toNumber(),
            vaultId: req.vault,
            userBTCAddress: (0, _1.encodeBtcAddress)(req.btcAddress, network),
            status,
        };
    });
}
exports.parseRedeemRequest = parseRedeemRequest;
function convertMoment(moment) {
    return new Date(moment.toNumber());
}
exports.convertMoment = convertMoment;
function unwrapRawExchangeRate(option) {
    return option.isSome ? option.value : undefined;
}
exports.unwrapRawExchangeRate = unwrapRawExchangeRate;
function encodeVaultId(id) {
    const wrappedIdLiteral = (0, __1.currencyIdToLiteral)(id.currencies.wrapped);
    const collateralIdLiteral = (0, __1.currencyIdToLiteral)(id.currencies.collateral);
    return `${id.accountId.toString()}-${wrappedIdLiteral}-${collateralIdLiteral}`;
}
exports.encodeVaultId = encodeVaultId;
function decodeVaultId(api, id) {
    const vaultIdComponents = id.split("-");
    if (vaultIdComponents.length !== 3) {
        throw new Error("The vault id must be of type {accountId}-{wrappedCurrencyTicker}-{collateralCurrencyTicker}");
    }
    const [accountId, wrappedCurrencyIdLiteral, collateralCurrencyIdLiteral] = vaultIdComponents;
    const currenciesIdObject = Object.values(__1.CurrencyIdLiteral);
    if (!currenciesIdObject.includes(wrappedCurrencyIdLiteral) ||
        !currenciesIdObject.includes(collateralCurrencyIdLiteral)) {
        throw new Error("Invalid ticker currency in vault id");
    }
    return newVaultId(api, accountId, (0, __1.currencyIdToMonetaryCurrency)(newCurrencyId(api, collateralCurrencyIdLiteral)), (0, __1.currencyIdToMonetaryCurrency)(newCurrencyId(api, wrappedCurrencyIdLiteral)));
}
exports.decodeVaultId = decodeVaultId;
function queryNominationsMap(map, vaultId) {
    for (const [entryVaultId, entryNonce] of map.entries()) {
        if (encodeVaultId(entryVaultId) === encodeVaultId(vaultId)) {
            return entryNonce;
        }
    }
    return undefined;
}
exports.queryNominationsMap = queryNominationsMap;
//# sourceMappingURL=encoding.js.map
