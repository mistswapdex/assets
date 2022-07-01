import { existsSync, fstat, readdirSync, readFileSync, writeFileSync } from "fs";

import { ethers } from 'ethers'

const ethersProvider = new ethers.providers.StaticJsonRpcProvider("https://global.uat.cash");
const abi = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

export async function fetchInfo() {
  const tokens = readdirSync('./blockchains/smartbch/assets');
  const newTokens = []
  for (const token of tokens) {
    if (existsSync(`./blockchains/smartbch/assets/${token}/info.json`)) {
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
        chainId: 10000,
        logoURI: `https://raw.githubusercontent.com/mistswapdex/assets/master/blockchains/smartbch/assets/${token}/logo.png`,
        website: "",
        description: "",
        explorer: "",
        status: "active",
        id: token,
        links: [],
        type: "SMARTBCH"
      }
      newTokens.push(entry);
      writeFileSync(`./blockchains/smartbch/assets/${token}/info.json`, JSON.stringify(entry, null, 4));
    }
    catch {}
  }

  const list = JSON.parse(readFileSync('./blockchains/smartbch/tokenlist.json', "utf-8"));
  list.tokens = [...list.tokens, ...newTokens];
  const uniques = []
  list.tokens.forEach(val => {
    if (!uniques.some(dup => dup.id === val.id)) {
      uniques.push(val);
    }
  })
  list.tokens = uniques.sort((a, b) => a.id.localeCompare(b.id));
  list.version.minor++;
  writeFileSync('./blockchains/smartbch/tokenlist.json', JSON.stringify(list, null, 4))
}

fetchInfo()