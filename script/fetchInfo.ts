import { existsSync, fstat, readdirSync, readFileSync, writeFileSync } from "fs";

import { ethers } from 'ethers'

const abi = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

const rpcMap = {
  10000: "https://global.uat.cash",
  10001: "https://testnet.sonar.cash:9545"
}

const blockchainMap = {
  10000: "smartbch",
  10001: "smartbch-amber"
}

export async function fetchInfo(chainId) {
  const blockchain = blockchainMap[chainId];
  const ethersProvider = new ethers.providers.StaticJsonRpcProvider(rpcMap[chainId]);

  const tokens = readdirSync(`./blockchains/${blockchain}/assets`);
  const newTokens = []
  for (const token of tokens) {
    if (existsSync(`./blockchains/${blockchain}/assets/${token}/info.json`)) {
      continue;
    }
    console.log(token)

    const tokenContract = new ethers.Contract(token, abi, ethersProvider);

    try {
      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
      ]);

      const entry = {
        name,
        address: token,
        symbol,
        decimals,
        chainId: chainId,
        logoURI: `https://raw.githubusercontent.com/mistswapdex/assets/master/blockchains/${blockchain}/assets/${token}/logo.png`,
        website: "",
        description: "",
        explorer: "",
        status: "active",
        id: token,
        links: [],
        type: blockchain.toUpperCase()
      }
      newTokens.push(entry);
      writeFileSync(`./blockchains/${blockchain}/assets/${token}/info.json`, JSON.stringify(entry, null, 4));
    }
    catch {}
  }

  const list = JSON.parse(readFileSync(`./blockchains/${blockchain}/tokenlist.json`, "utf-8"));
  list.tokens = [...list.tokens, ...newTokens];
  const uniques = []
  list.tokens.forEach(val => {
    if (!uniques.some(dup => dup.id === val.id)) {
      uniques.push(val);
    }
  })
  list.tokens = uniques.sort((a, b) => a.id.localeCompare(b.id));
  list.version.minor++;
  writeFileSync(`./blockchains/${blockchain}/tokenlist.json`, JSON.stringify(list, null, 4))
}

fetchInfo(10001)