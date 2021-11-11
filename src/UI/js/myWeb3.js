
export const loadWeb3 = async () => {
  if ( window.ethereum ) {
    web3 = new Web3( window.ethereum );
    await window.ethereum.request( { method: "eth_requestAccounts" } );
  } else if ( window.web3 ) {
    web3 = new Web3( web3.currentProvider );
  } else {
    return window.alert(
      "Non-Ethereum browser detected. You should consider trying MetaMask!"
    );
  }
};

export const setDefaultAccount = async () => {
  const accounts = await web3.eth.getAccounts();
  web3.eth.defaultAccount = accounts[0];
  return web3.eth.defaultAccount
};

export const getAllTheTokens = async ( contract ) => {
  let tokens = [];

  const totalSupply = await contract.methods.totalSupply().call();

  for ( let i = 0; i < totalSupply; i++ ) {
    let token = await contract.methods.myTokens( i ).call();

    tokens = [...tokens, token];
  }
  return tokens;
};

export const mintToken = async ( tokenId, contract ) => {
  const data = await contract.methods.mint( tokenId ).send( { from: web3.eth.defaultAccount } );
  return data
};

export const getMetaDataUrI = async ( tokenId, contract ) => {
  const metaDataUrI = await contract.methods.tokenURI( tokenId ).call();
  return metaDataUrI;
};

export const balance = async ( contract ) => {
  await setDefaultAccount();

  const bal = await contract.methods.balanceOf( web3.eth.defaultAccount ).call();

  return bal;
};

export const ownerOf = async ( contract, tokenId ) => {
  const owner = await contract.methods.ownerOf( tokenId ).call();
  return owner;
};

export const transferToken = async ( contract, tokenId, to ) => {
  await setDefaultAccount();
  await contract.methods
    ._transfer( web3.eth.defaultAccount, to, tokenId )
    .send( { from: web3.eth.defaultAccount } )
    .once( "receipt", ( receipt ) => console.log( receipt ) );
};