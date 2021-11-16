import { balance, loadWeb3, setDefaultAccount, mintToken, transferToken, ownerOf, getAllTheTokens } from "./myWeb3.js";
import MyNftToken from "./ImplERC721_metadata.json" assert { type: "json" };
import { genRandomString } from "./utils.js";

const CONTRACTS = [
  {
    name: 'Rinkeby',
    networkVersion: '4',
    address: '0xc4B7c55F0b60C89d6bbcAC972271aE8AD105EBf1'
  }, {
    name: 'Kovan',
    networkVersion: '42',
    address: '0xD6c21c9FaC193e722234d94302855885FC341Dd3'
  }, {
    name: 'Moonbase Alpha',
    networkVersion: '1287',
    address: '0x3c7267e087CE05890fE2B6fD95E6E313384815bA'
  },
]

class App {
  __isLoading = true
  __contract = null
  __error = ''
  __defaultAccount = null
  __allTokens = []
  __allMetadata = []

  constructor() {
    if ( window.ethereum ) {
      window.ethereum.on( 'chainChanged', ( event ) => {
        // console.log( 'Changed', event )
        window.location.reload()
      } )
    }
  }

  async loadContract() {
    this.__handleLoading( true )
    try {
      await loadWeb3();
      const networkVersion = await web3.eth.net.getId()
      const contractObject = CONTRACTS.find( i => i.networkVersion === `${networkVersion}` )
      const abi = MyNftToken.output.abi;
      const address = contractObject ? contractObject.address : ''

      this.__contract = new web3.eth.Contract( abi, address )
      this.__initializeApp()
    } catch ( error ) {
      console.error( error )
      this.__handleError( 'There was an issue loading contract information. Please try again' )
    } finally {
      this.__handleLoading( false )
    }
  }

  async __initializeApp() {
    try {
      this.__defaultAccount = await setDefaultAccount()

      // Set the NavBar content
      this.__handleNavBarContent()
      this.__handleMintFormContent()
      this.__handleBalanceEnquiry()
      this.__handleNftSectionContent()
    } catch ( error ) {
      console.error( error )
      this.__handleError( 'There was an issue initializing the application. Please try again' )
    } finally {
      this.__handleLoading( false )
    }
  }

  __handleNavBarContent() {
    try {
      document.querySelector( "#account" ).textContent =
        this.__defaultAccount !== null ? `Address: ${this.__defaultAccount}` : 'Address: N/A'
    } catch ( error ) {
      console.error( error )
      this.__handleError( 'Something went wrong. Please try again' )
    }
  }

  __handleMintFormContent() {
    try {
      const tokenURIinput = document.getElementById( "tokenURIinput" )
      const mintBtn = document.getElementById( "mintBtn" )
      const mintForm = document.getElementById( "mintForm" )

      mintForm.addEventListener( 'submit', ( event ) => {
        event.preventDefault()
        const value = tokenURIinput.value || ''
        if ( !value ) return false
        this.__handleSubmitMintForm( tokenURIinput.value || '' )
      } )

      tokenURIinput.addEventListener( "keyup", async function () {
        const value = tokenURIinput.value || ''
        if ( !value ) {
          mintBtn.setAttribute( 'disabled', 'true' )
        } else {
          mintBtn.removeAttribute( 'disabled' )
        }
      } )
      mintBtn.addEventListener( "click", async () => {
        this.__handleSubmitMintForm( tokenURIinput.value || '' )
      } )
    } catch ( error ) {
      console.error( error )
      this.__handleError( 'Something went wrong. Please try again' )
    }
  }

  async __handleSubmitMintForm( tokenURI ) {
    try {
      this.__handleLoading( true )
      await mintToken( tokenURI, this.__contract )

      const tokenURIinput = document.getElementById( "tokenURIinput" )
      const mintBtn = document.getElementById( "mintBtn" )

      tokenURIinput.value = ''
      mintBtn.setAttribute( 'disabled', 'true' )
    } catch ( error ) {
      console.error( error )
      alert( 'Failed to mint. Please retry.' + ` ${error.message || ''}` )
    } finally {
      this.__handleLoading( false )
      this.__handleBalanceEnquiry()
      this.__handleNftSectionContent()
    }
  }

  async __handleNftSectionContent() {
    try {
      const nftSection = document.getElementsByClassName( 'nft-section' )[0]
      await this.__handleTokenMetaData()
      nftSection.innerHTML = ''
      this.__allMetadata.forEach( ( metadata ) => {
        // console.log( metadata )
        const cardElement = document.createElement( 'div' )
        cardElement.classList.add( 'nft-card' )
        cardElement.innerHTML = `
        <h3 class="nft-name">${metadata.name || 'No name'}</h3>
        <p class="nft-description">${metadata.description || 'No description'}</p>
        <p class="nft-token">Token: <strong>${metadata.tokenUri || 'N/A'}</strong></p>
        <button class="nft-transfer-btn btn" data-token-id="${metadata.token}" style="display: block;">Transfer</button>
        `;
        nftSection.appendChild( cardElement )
      } )

      const transferButtons = document.querySelectorAll( '.nft-transfer-btn' )
      for ( let transferElement of transferButtons ) {
        const token = transferElement.getAttribute( 'data-token-id' )
        transferElement.onclick = ( e ) => {
          this.__handleTransfer( e, token )
        }
      }
    } catch ( error ) {
      console.error( error )
      this.__handleError( 'Something went wrong. Please try again' )
    }
  }

  async __handleBalanceEnquiry() {
    // return true
    try {
      const currentBalance = await balance( this.__contract )
      document.querySelector( '#balance' )
        .innerHTML = `Number of tokens this account has: <strong>${currentBalance}</strong>`;
    } catch ( error ) {
      console.error( error )
      alert( 'Failed to get balance enquiry' )
    }
  }

  async __handleTransfer( event, tokenId ) {
    try {
      this.__handleLoading( true )
      event.preventDefault()
      const addToAddress = prompt( 'Enter recipient address', '' );
      if ( addToAddress !== null ) {
        await transferToken( this.__contract, tokenId, addToAddress );
        this.__handleNftSectionContent()
      }
      this.__handleBalanceEnquiry()
    } catch ( error ) {
      console.error( error )
      alert( 'Failed to transfer token.' + ` ${error.message || ''}` )
    } finally {
      this.__handleLoading( false )
    }
  }

  async __getAllContractTokens() {
    let tokens = [];

    try {
      const myTokens = await getAllTheTokens( this.__contract, this.__defaultAccount )
      tokens = myTokens || []

      return tokens
    } catch ( error ) {
      console.error( error )
    } finally {
      this.__allTokens = tokens
      return tokens
    }
  }

  async __handleTokenMetaData() {
    let allTokens = []

    try {
      allTokens = await this.__getAllContractTokens()
      this.__allMetadata = []
      for ( let tokenData of allTokens ) {
        // let tokenMeta = await getAllMetaData(this.allTokens[token]);
        // TODO: Get the actual token metadata from IPFS
        let tokenMeta = {
          _id: genRandomString(),
          name: null,
          description: null,
          token: tokenData.tokenId,
          tokenUri: tokenData.tokenUri,
        }

        if ( tokenMeta._id ) this.__allMetadata = [...this.__allMetadata, tokenMeta]
      }
    } catch ( error ) {
      console.error( error )
    } finally {
      return allTokens
    }
  }

  __handleLoading( shouldLoad = true ) {
    if ( this.__error ) return true
    this.__isLoading = shouldLoad

    const loadingContainer = document.getElementsByClassName( 'loading-container' )[0]
    const contentContainer = document.getElementsByClassName( 'content-container' )[0]

    loadingContainer.style.display = shouldLoad ? 'block' : 'none'
    contentContainer.style.display = shouldLoad ? 'none' : 'block'
  }

  __handleError( errorMessage = '' ) {

    this.__error = !!errorMessage

    const loadingContainer = document.getElementsByClassName( 'loading-container' )[0]
    const contentContainer = document.getElementsByClassName( 'content-container' )[0]
    const errorContainer = document.getElementsByClassName( 'error-container' )[0]
    const errorText = document.getElementsByClassName( 'error-text' )[0]

    if ( !errorMessage ) {
      loadingContainer.style.display = 'block'
      contentContainer.style.display = 'block'
      errorContainer.style.display = 'none'
      errorText.textContent = ''
    } else {
      loadingContainer.style.display = 'none'
      contentContainer.style.display = 'none'
      errorContainer.style.display = 'true'
      errorText.textContent = errorMessage
    }
  }


  get getContract() {
    return this.__contract
  }

  get isLoading() {
    return this.__isLoading
  }

  get isErrored() {
    return this.__error
  }
}

// window.customElements.define( "my-nav-bar", myNavBar );
// window.customElements.define( "mint-from", mintForm );
// window.customElements.define( "nft-section", nftSection );

const nftApp = new App()
// Load the contract
nftApp.loadContract()

